import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { maskSensitiveIndianIDs } from './src/utils/privacyMasker.ts';
import {
  INITIAL_BUSINESS,
  ANCHOR_DATE,
  DEMO_WORKSPACES,
  createCleanRealWorkspace,
  WorkspaceDataset,
} from './src/data/initialData.ts';
import { SAMPLE_NOTICES } from './src/data/sampleNotices.ts';
import { INITIAL_PEOPLE } from './src/types/munimji.ts';
import { MCP_TOOL_DEFINITIONS, MCPToolCallResult } from './src/types/mcp.ts';
import {
  PredictionOutcomeRecord,
  ReminderLogEntry,
  Transaction,
  CustomerProfile,
} from './src/types/cashflow.ts';
import { calculateCashForecast, diffDaysISO, isValidISODate } from './src/utils/forecastEngine.ts';
import {
  syncCustomersWithTransactions,
  predictAllReceivables,
  generateFinancialAdviceReport,
} from './src/utils/mlPaymentPredictor.ts';
import {
  extractInvoiceFromBufferLocal,
  inspectImageQualityViability,
} from './src/utils/invoiceOcrExtractor.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '30mb' }));

function hasConfiguredGeminiKey(): boolean {
  const key = (process.env.GEMINI_API_KEY || '').trim();
  return Boolean(key && key !== 'MY_GEMINI_API_KEY' && key !== 'unconfigured' && key.length > 8);
}

// Initialize Gemini SDK with User-Agent telemetry header as required
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || 'unconfigured',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// ============================================================================
// PERSISTENT PARTITIONED DATABASE (DEMO WORKSPACES vs REAL USER WORKSPACES)
// ============================================================================

const DB_FILE = path.resolve(__dirname, 'data', 'db.json');

if (!fs.existsSync(path.resolve(__dirname, 'data'))) {
  fs.mkdirSync(path.resolve(__dirname, 'data'), { recursive: true });
}

interface StoredWorkspace extends WorkspaceDataset {
  notices: any[];
  people: any[];
  reminderLogs: ReminderLogEntry[];
  lastUpdated: string;
}

interface RootDatabaseSchema {
  schemaVersion: number;
  authPassword: string;
  passwordUpdatedAt: string | null;
  demoWorkspaces: Record<string, StoredWorkspace>;
  realWorkspaces: Record<string, StoredWorkspace>;
  lastUpdated: string;
}

function cloneDeep<T>(val: T): T {
  return JSON.parse(JSON.stringify(val));
}

function buildSeededDemoWorkspace(demoKey: string): StoredWorkspace {
  const template = DEMO_WORKSPACES[demoKey] || DEMO_WORKSPACES['demo-sharma'];
  const synced = syncCustomersWithTransactions(
    cloneDeep(template.customers),
    cloneDeep(template.transactions),
    ANCHOR_DATE,
    true
  );
  return {
    ...cloneDeep(template),
    customers: synced.customers,
    transactions: synced.transactions,
    notices: demoKey === 'demo-sharma' ? cloneDeep(SAMPLE_NOTICES) : [],
    people: cloneDeep(INITIAL_PEOPLE),
    reminderLogs: [],
    lastUpdated: new Date().toISOString(),
  };
}

function buildFreshRealWorkspace(
  workspaceId: string,
  shopName: string,
  phone?: string
): StoredWorkspace {
  const base = createCleanRealWorkspace(workspaceId, shopName, phone);
  return {
    ...base,
    notices: [],
    people: [],
    reminderLogs: [],
    lastUpdated: new Date().toISOString(),
  };
}

function createInitialRootDb(): RootDatabaseSchema {
  return {
    schemaVersion: 2,
    authPassword: process.env.RUPIVANTA_DEFAULT_PASSWORD || 'Vanta@2026',
    passwordUpdatedAt: null,
    demoWorkspaces: {
      'demo-sharma': buildSeededDemoWorkspace('demo-sharma'),
      'demo-venkateshwara': buildSeededDemoWorkspace('demo-venkateshwara'),
      'demo-nandi': buildSeededDemoWorkspace('demo-nandi'),
    },
    realWorkspaces: {},
    lastUpdated: new Date().toISOString(),
  };
}

function readRootDb(): RootDatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);

      if (parsed && parsed.schemaVersion === 2 && parsed.demoWorkspaces) {
        // Ensure all 3 demo workspaces exist
        for (const key of Object.keys(DEMO_WORKSPACES)) {
          if (!parsed.demoWorkspaces[key]) {
            parsed.demoWorkspaces[key] = buildSeededDemoWorkspace(key);
          }
        }
        if (!parsed.realWorkspaces) {
          parsed.realWorkspaces = {};
        }
        return parsed as RootDatabaseSchema;
      }

      // Migrate v1 db.json cleanly into demo-sharma while upgrading new demo fields
      if (parsed && Array.isArray(parsed.transactions)) {
        const fresh = createInitialRootDb();
        fresh.authPassword = parsed.authPassword || fresh.authPassword;
        fresh.passwordUpdatedAt = parsed.passwordUpdatedAt || null;
        fs.writeFileSync(DB_FILE, JSON.stringify(fresh, null, 2), 'utf-8');
        return fresh;
      }
    }
  } catch (err) {
    console.warn('Error reading db.json, initializing partitioned v2 schema:', err);
  }

  const initial = createInitialRootDb();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing initial db.json:', err);
  }
  return initial;
}

function writeRootDb(root: RootDatabaseSchema): RootDatabaseSchema {
  root.lastUpdated = new Date().toISOString();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(root, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving db.json:', err);
  }
  return root;
}

export function normalizeRealWorkspaceId(shopName?: string, phone?: string): string {
  const cleanPhone = String(phone || '').replace(/\D/g, '');
  if (/^[6-9]\d{9}$/.test(cleanPhone)) {
    return `real-${cleanPhone}`;
  }
  const slug = String(shopName || 'my-shop')
    .replace(/\s*\[demo\]\s*/gi, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `real-${slug || 'business'}`;
}

function getOrCreateWorkspace(
  root: RootDatabaseSchema,
  requestedWorkspaceId?: string,
  shopNameHint?: string,
  phoneHint?: string
): StoredWorkspace {
  const wsId = (requestedWorkspaceId || 'demo-sharma').trim();

  if (wsId.startsWith('demo-')) {
    if (!root.demoWorkspaces[wsId]) {
      root.demoWorkspaces[wsId] = buildSeededDemoWorkspace(wsId);
      writeRootDb(root);
    }
    return root.demoWorkspaces[wsId];
  }

  // Real user workspace — strictly isolated from synthetic demo data
  if (!root.realWorkspaces[wsId]) {
    root.realWorkspaces[wsId] = buildFreshRealWorkspace(
      wsId,
      shopNameHint || 'My Business',
      phoneHint
    );
    writeRootDb(root);
  } else if (shopNameHint && shopNameHint.trim()) {
    const cleanTitle = shopNameHint.replace(/\s*\[Demo\]\s*/gi, '').trim();
    if (cleanTitle && root.realWorkspaces[wsId].business.name === 'My Business') {
      root.realWorkspaces[wsId].business.name = cleanTitle;
    }
  }
  return root.realWorkspaces[wsId];
}

function saveWorkspace(root: RootDatabaseSchema, ws: StoredWorkspace): StoredWorkspace {
  const synced = syncCustomersWithTransactions(
    ws.customers || [],
    ws.transactions || [],
    ANCHOR_DATE,
    ws.isDemo
  );
  const updated: StoredWorkspace = {
    ...ws,
    customers: synced.customers,
    transactions: synced.transactions,
    lastUpdated: new Date().toISOString(),
  };

  if (updated.isDemo || updated.workspaceId.startsWith('demo-')) {
    root.demoWorkspaces[updated.workspaceId] = updated;
  } else {
    root.realWorkspaces[updated.workspaceId] = updated;
  }
  writeRootDb(root);
  return updated;
}

function buildWorkspaceResponsePayload(ws: StoredWorkspace, root: RootDatabaseSchema) {
  const synced = syncCustomersWithTransactions(
    ws.customers || [],
    ws.transactions || [],
    ANCHOR_DATE,
    ws.isDemo
  );
  const { predictionsByTxId, predictionsList } = predictAllReceivables(
    synced.transactions,
    synced.customers,
    ANCHOR_DATE
  );
  const adviceReport = generateFinancialAdviceReport(
    ws.business.currentCash,
    ws.business.minimumReserve,
    synced.transactions,
    synced.customers,
    ws.predictionOutcomes || [],
    ANCHOR_DATE,
    null
  );

  const demoList = Object.values(root.demoWorkspaces).map((d) => ({
    workspaceId: d.workspaceId,
    isDemo: true,
    name: d.business.name,
    businessType: d.business.businessType,
    currentCash: d.business.currentCash,
    labelBadge: d.labelBadge,
  }));

  const realList = Object.values(root.realWorkspaces).map((r) => ({
    workspaceId: r.workspaceId,
    isDemo: false,
    name: r.business.name,
    businessType: r.business.businessType,
    currentCash: r.business.currentCash,
    labelBadge: r.labelBadge,
  }));

  return {
    workspaceId: ws.workspaceId,
    isDemo: ws.isDemo,
    labelBadge: ws.labelBadge,
    business: ws.business,
    transactions: synced.transactions,
    customers: synced.customers,
    predictionOutcomes: ws.predictionOutcomes || [],
    accuracyRecords: ws.accuracyRecords || [],
    reminderLogs: ws.reminderLogs || [],
    notices: ws.notices || [],
    people: ws.people || [],
    mlPredictionsByTxId: predictionsByTxId,
    mlPredictionsList: predictionsList,
    adviceReport,
    availableWorkspaces: {
      demo: demoList,
      real: realList,
    },
    lastUpdated: ws.lastUpdated,
  };
}

function sanitizeDeepStrings(obj: any): any {
  if (typeof obj === 'string') {
    const masked = maskSensitiveIndianIDs(obj).maskedText;
    return masked.replace(/\bRs\.?\s*(?=\d)/g, '₹');
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeDeepStrings);
  }
  if (obj && typeof obj === 'object') {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = sanitizeDeepStrings(v);
    }
    return out;
  }
  return obj;
}

function guessBestSampleKey(hintText: string): 'gst_drc01' | 'it_143_1' | 'ni_138_cheque' {
  const lower = (hintText || '').toLowerCase();
  if (
    lower.includes('138') ||
    lower.includes('cheque') ||
    lower.includes('dishonour') ||
    lower.includes('bounce') ||
    lower.includes('negotiable')
  ) {
    return 'ni_138_cheque';
  }
  if (
    lower.includes('143(1)') ||
    lower.includes('143') ||
    lower.includes('income tax') ||
    lower.includes('cpc') ||
    lower.includes('26as') ||
    lower.includes('itr')
  ) {
    return 'it_143_1';
  }
  return 'gst_drc01';
}

// ============================================================================
// MODEL CONTEXT PROTOCOL (MCP) TOOL EXECUTION ENGINE (WORKSPACE-SCOPED)
// ============================================================================

export function executeMCPTool(
  toolName: string,
  args: Record<string, any> = {},
  shopName: string = 'Sharma Stores',
  workspaceId: string = 'demo-sharma'
): MCPToolCallResult {
  const root = readRootDb();
  const ws = getOrCreateWorkspace(root, workspaceId, shopName);
  const transactions = [...(ws.transactions || [])];
  const customers = [...(ws.customers || [])];
  const business = ws.business || INITIAL_BUSINESS;

  switch (toolName) {
    case 'add_customer_receivable': {
      const customerName = String(args.customerName || args.customer || 'Customer').trim();
      const amount = Math.abs(parseFloat(args.amount) || 0);
      const dueDate = String(args.dueDate || '2026-10-30').trim();
      const promisedDate = args.promisedDate ? String(args.promisedDate).trim() : null;
      const invoiceDate = String(args.invoiceDate || ANCHOR_DATE).trim();
      const invoiceNumber = String(
        args.invoiceNumber || `INV-${Math.floor(430 + Math.random() * 400)}`
      ).trim();
      const notes = String(args.notes || 'Recorded via VANTA Voice Assistant').trim();

      if (amount <= 0) {
        return {
          toolName,
          success: false,
          message: 'Receivable amount must be greater than zero.',
          error: 'INVALID_AMOUNT',
        };
      }

      const existingCust = customers.find(
        (c) => c.name.trim().toLowerCase() === customerName.toLowerCase()
      );

      const newTx: Transaction = {
        id: `tx-in-${Date.now()}`,
        customerId: existingCust?.id,
        type: 'inflow',
        title: `Consignment / Order (${customerName})`,
        partyName: customerName,
        contactPhone: args.contactPhone || existingCust?.contactPhone || undefined,
        amount: Math.round(amount),
        invoiceDate,
        dueDate,
        promisedDate,
        status: dueDate < ANCHOR_DATE ? 'overdue' : 'expected',
        category: 'b2b_invoice',
        invoiceNumber,
        notes,
        isDemoData: ws.isDemo,
      };

      transactions.unshift(newTx);
      const saved = saveWorkspace(root, { ...ws, transactions, customers });
      const { predictionsByTxId } = predictAllReceivables(
        saved.transactions,
        saved.customers,
        ANCHOR_DATE
      );
      const pred = predictionsByTxId[newTx.id];

      return {
        toolName,
        success: true,
        message: `${customerName}'s pending payment of ₹${newTx.amount.toLocaleString('en-IN')} has been recorded (due ${dueDate}${pred ? `, ML predicted arrival ${pred.predictedDate}` : ''}).`,
        data: {
          transaction: newTx,
          prediction: pred || null,
        },
        affectedRecords: {
          receivablesUpdated: true,
          customerCreatedOrUpdated: true,
          forecastRecalculated: true,
        },
      };
    }

    case 'record_expense': {
      const amount = Math.abs(parseFloat(args.amount) || 0);
      const category = String(args.category || 'supplier').toLowerCase();
      const date = String(args.date || ANCHOR_DATE).trim();
      const description = String(args.description || 'Store Expense').trim();
      const partyName = String(args.partyName || 'Trade Supplier').trim();

      if (amount <= 0) {
        return {
          toolName,
          success: false,
          message: 'Expense amount must be greater than zero.',
          error: 'INVALID_AMOUNT',
        };
      }

      const newTx: Transaction = {
        id: `tx-out-${Date.now()}`,
        type: 'outflow',
        title: description,
        partyName,
        amount: Math.round(amount),
        invoiceDate: date,
        dueDate: date,
        actualPaidDate: date <= ANCHOR_DATE ? date : null,
        status: date <= ANCHOR_DATE ? 'paid' : 'due_soon',
        category: category as any,
        notes: `Recorded via VANTA Voice Assistant (${description})`,
        isDemoData: ws.isDemo,
      };

      transactions.unshift(newTx);

      let currentCash = business.currentCash;
      if (date <= ANCHOR_DATE) {
        currentCash = Math.max(0, currentCash - Math.round(amount));
      }

      saveWorkspace(root, {
        ...ws,
        transactions,
        business: { ...business, currentCash },
      });

      return {
        toolName,
        success: true,
        message: `Expense of ₹${Math.round(amount).toLocaleString('en-IN')} for ${description} recorded. Present balance is ₹${currentCash.toLocaleString('en-IN')}.`,
        data: {
          transaction: newTx,
          newCurrentCash: currentCash,
        },
        affectedRecords: {
          expensesUpdated: true,
          forecastRecalculated: true,
        },
      };
    }

    case 'record_income': {
      const amount = Math.abs(parseFloat(args.amount) || 0);
      const category = String(args.category || 'retail_sales').toLowerCase();
      const date = String(args.date || ANCHOR_DATE).trim();
      const description = String(args.description || 'Counter Sales Receipt').trim();
      const partyName = String(args.partyName || 'Retail Customers').trim();

      if (amount <= 0) {
        return {
          toolName,
          success: false,
          message: 'Income amount must be greater than zero.',
          error: 'INVALID_AMOUNT',
        };
      }

      const newTx: Transaction = {
        id: `tx-in-${Date.now()}`,
        type: 'inflow',
        title: description,
        partyName,
        amount: Math.round(amount),
        paidAmount: date <= ANCHOR_DATE ? Math.round(amount) : 0,
        invoiceDate: date,
        dueDate: date,
        actualPaidDate: date <= ANCHOR_DATE ? date : null,
        status: date <= ANCHOR_DATE ? 'paid' : 'expected',
        category: category as any,
        notes: 'Recorded via VANTA Voice Assistant',
        isDemoData: ws.isDemo,
      };

      transactions.unshift(newTx);

      let currentCash = business.currentCash;
      if (date <= ANCHOR_DATE) {
        currentCash += Math.round(amount);
      }

      saveWorkspace(root, {
        ...ws,
        transactions,
        business: { ...business, currentCash },
      });

      return {
        toolName,
        success: true,
        message: `Income of ₹${Math.round(amount).toLocaleString('en-IN')} recorded for ${description}. Present balance is now ₹${currentCash.toLocaleString('en-IN')}.`,
        data: {
          transaction: newTx,
          newCurrentCash: currentCash,
        },
        affectedRecords: {
          receivablesUpdated: true,
          forecastRecalculated: true,
        },
      };
    }

    case 'list_receivables': {
      const { predictionsList } = predictAllReceivables(transactions, customers, ANCHOR_DATE);
      const totalOutstanding = predictionsList.reduce((sum, p) => sum + p.amountRemaining, 0);
      const overdueCount = predictionsList.filter((p) => p.currentOverdueDays > 0).length;

      return {
        toolName,
        success: true,
        message: `You have ${predictionsList.length} pending receivables totaling ₹${totalOutstanding.toLocaleString('en-IN')}. ${overdueCount} invoice(s) are currently overdue.`,
        data: {
          totalOutstanding,
          overdueCount,
          predictions: predictionsList,
        },
      };
    }

    case 'get_cash_position': {
      const advice = generateFinancialAdviceReport(
        business.currentCash,
        business.minimumReserve,
        transactions,
        customers,
        ws.predictionOutcomes || [],
        ANCHOR_DATE
      );

      return {
        toolName,
        success: true,
        message: `Present balance today is ₹${business.currentCash.toLocaleString('en-IN')} (Safe Reserve ₹${business.minimumReserve.toLocaleString('en-IN')}). Under ML-predicted receipts, 30-day lowest projected cash is ₹${advice.horizons.days30.lowestBalance.toLocaleString('en-IN')} on ${advice.horizons.days30.lowestBalanceDate}.`,
        data: {
          currentCash: business.currentCash,
          minimumReserve: business.minimumReserve,
          horizons: advice.horizons,
        },
      };
    }

    case 'forecast_cash_flow': {
      const daysCount = parseInt(args.daysCount, 10) || 30;
      const advice = generateFinancialAdviceReport(
        business.currentCash,
        business.minimumReserve,
        transactions,
        customers,
        ws.predictionOutcomes || [],
        ANCHOR_DATE
      );
      const horizon =
        daysCount <= 7
          ? advice.horizons.days7
          : daysCount <= 30
          ? advice.horizons.days30
          : advice.horizons.days90;

      return {
        toolName,
        success: true,
        message: `${horizon.horizonDays}-day ML cash forecast: inflows ₹${horizon.predictedInflows.toLocaleString('en-IN')}, outflows ₹${horizon.scheduledOutflows.toLocaleString('en-IN')}, lowest balance ₹${horizon.lowestBalance.toLocaleString('en-IN')} on ${horizon.lowestBalanceDate}.`,
        data: horizon,
      };
    }

    case 'simulate_cash_flow_scenario': {
      const customerDelayDays = parseInt(args.customerDelayDays, 10) || 7;
      const targetCustomerName = args.targetCustomerName || 'Balaji';
      const scenario = {
        id: 'mcp-sim-scenario',
        name: `${customerDelayDays}-Day Customer Payment Delay`,
        shortDescription: `Simulated ${customerDelayDays}-day delay from ${targetCustomerName}`,
        customerDelayDays,
        targetCustomerName,
        salesDropPercent: parseInt(args.salesDropPercent, 10) || 0,
        unexpectedExpense: parseInt(args.unexpectedExpense, 10) || 0,
        rescheduledSupplierDays: 0,
      };

      const baseline = generateFinancialAdviceReport(
        business.currentCash,
        business.minimumReserve,
        transactions,
        customers,
        ws.predictionOutcomes || [],
        ANCHOR_DATE,
        null
      );
      const simulated = generateFinancialAdviceReport(
        business.currentCash,
        business.minimumReserve,
        transactions,
        customers,
        ws.predictionOutcomes || [],
        ANCHOR_DATE,
        scenario
      );

      return {
        toolName,
        success: true,
        message: `What-If Simulation: If ${targetCustomerName} pays ${customerDelayDays} days later, 30-day lowest cash changes from ₹${baseline.horizons.days30.lowestBalance.toLocaleString('en-IN')} to ₹${simulated.horizons.days30.lowestBalance.toLocaleString('en-IN')}.`,
        data: {
          originalLowest: baseline.horizons.days30.lowestBalance,
          simulatedLowest: simulated.horizons.days30.lowestBalance,
          difference:
            simulated.horizons.days30.lowestBalance - baseline.horizons.days30.lowestBalance,
          simulatedRiskDate: simulated.horizons.days30.lowestBalanceDate,
        },
      };
    }

    case 'create_payment_reminder': {
      const customerName = String(args.customerName || 'Customer').trim();
      const lang = String(args.language || 'en').toLowerCase();
      const matchedTx = transactions.find(
        (t) =>
          t.type === 'inflow' &&
          t.status !== 'paid' &&
          t.partyName.toLowerCase().includes(customerName.toLowerCase())
      );
      const matchedCust = customers.find((c) =>
        c.name.toLowerCase().includes(customerName.toLowerCase())
      );

      const targetParty = matchedTx?.partyName || matchedCust?.name || customerName;
      const invoiceNo = matchedTx?.invoiceNumber || 'INV-PENDING';
      const amt = matchedTx
        ? Math.max(0, matchedTx.amount - (matchedTx.paidAmount || 0))
        : matchedCust?.pendingBalance || 0;
      const dueStr = matchedTx?.dueDate || ANCHOR_DATE;
      const cleanShop = shopName.replace(/\s*\[Demo\]\s*/gi, '').trim() || shopName;

      let reminderText = `Namaste ${targetParty}, friendly reminder from ${cleanShop}. Bill #${invoiceNo} for ₹${amt.toLocaleString('en-IN')} (due ${dueStr}) is pending. Kindly clear via UPI or NEFT. Thank you!`;
      if (lang === 'kn') {
        reminderText = `ನಮಸ್ಕಾರ ${targetParty}, ${cleanShop} ಕಡೆಯಿಂದ ವಿನಮ್ರ ನೆನಪು. ಬಿಲ್ #${invoiceNo} ಮೊತ್ತ ₹${amt.toLocaleString('en-IN')} (ಗಡುವು ${dueStr}) ಬಾಕಿ ಇದೆ. ದಯವಿಟ್ಟು UPI ಅಥವಾ NEFT ಮೂಲಕ ಪಾವತಿಸಿ. ಧನ್ಯವಾದಗಳು!`;
      }

      return {
        toolName,
        success: true,
        message: `Payment reminder prepared for ${targetParty}.`,
        data: {
          customerName: targetParty,
          contactPhone: matchedTx?.contactPhone || matchedCust?.contactPhone || '',
          amount: amt,
          invoiceNo,
          reminderText,
        },
      };
    }

    case 'generate_financial_report': {
      const advice = generateFinancialAdviceReport(
        business.currentCash,
        business.minimumReserve,
        transactions,
        customers,
        ws.predictionOutcomes || [],
        ANCHOR_DATE
      );

      return {
        toolName,
        success: true,
        message: `7-day ML outlook: Present Cash ₹${business.currentCash.toLocaleString('en-IN')}, Predicted Inflows ₹${advice.horizons.days7.predictedInflows.toLocaleString('en-IN')}, Scheduled Outflows ₹${advice.horizons.days7.scheduledOutflows.toLocaleString('en-IN')}, Lowest Cash ₹${advice.horizons.days7.lowestBalance.toLocaleString('en-IN')} on ${advice.horizons.days7.lowestBalanceDate}.`,
        data: advice.horizons.days7,
      };
    }

    case 'update_present_balance': {
      const newBalance = parseFloat(args.newBalance ?? args.amount);
      const newReserve =
        args.minimumReserve !== undefined ? parseFloat(args.minimumReserve) : undefined;
      if (isNaN(newBalance) || newBalance < 0) {
        return {
          toolName,
          success: false,
          message: 'Please provide a valid non-negative balance amount.',
          error: 'INVALID_BALANCE',
        };
      }
      const updatedBusiness = {
        ...business,
        currentCash: Math.round(newBalance),
        ...(newReserve !== undefined && !isNaN(newReserve) && newReserve >= 0
          ? { minimumReserve: Math.round(newReserve) }
          : {}),
      };
      saveWorkspace(root, { ...ws, business: updatedBusiness });
      return {
        toolName,
        success: true,
        message: `Present balance updated to ₹${updatedBusiness.currentCash.toLocaleString('en-IN')}.`,
        data: { business: updatedBusiness },
      };
    }

    case 'add_upcoming_payment': {
      const partyName = String(args.partyName || args.supplierName || 'Vendor / Bill').trim();
      const amount = Math.abs(parseFloat(args.amount) || 0);
      const dueDate = String(args.dueDate || '2026-10-30').trim();
      const title = String(
        args.title || args.description || `Upcoming Payment (${partyName})`
      ).trim();
      const category = String(args.category || 'supplier').toLowerCase();

      if (amount <= 0) {
        return {
          toolName,
          success: false,
          message: 'Upcoming payment amount must be greater than zero.',
          error: 'INVALID_AMOUNT',
        };
      }

      const newTx: Transaction = {
        id: `tx-out-${Date.now()}`,
        type: 'outflow',
        title,
        partyName,
        amount: Math.round(amount),
        invoiceDate: ANCHOR_DATE,
        dueDate,
        status:
          dueDate < ANCHOR_DATE
            ? 'overdue'
            : dueDate <= '2026-10-31'
            ? 'due_soon'
            : 'expected',
        category: category as any,
        invoiceNumber: String(args.invoiceNumber || `BILL-${Math.floor(500 + Math.random() * 400)}`),
        notes: String(args.notes || 'Added via VANTA Voice Assistant'),
        isDemoData: ws.isDemo,
      };

      transactions.unshift(newTx);
      saveWorkspace(root, { ...ws, transactions });

      return {
        toolName,
        success: true,
        message: `Upcoming payment of ₹${newTx.amount.toLocaleString('en-IN')} to ${partyName} (due ${dueDate}) has been added.`,
        data: { transaction: newTx },
      };
    }

    case 'edit_payment': {
      const targetName = String(args.targetName || '').trim().toLowerCase();
      const txIdx = transactions.findIndex(
        (t) =>
          (targetName && t.partyName.toLowerCase().includes(targetName)) ||
          (targetName && t.title.toLowerCase().includes(targetName)) ||
          (args.id && t.id === args.id)
      );

      if (txIdx === -1) {
        return {
          toolName,
          success: false,
          message: `Could not find a payment matching "${args.targetName || args.id}".`,
          error: 'NOT_FOUND',
        };
      }

      const targetTx = transactions[txIdx];

      if (args.deleteEntry) {
        transactions.splice(txIdx, 1);
        saveWorkspace(root, { ...ws, transactions });
        return {
          toolName,
          success: true,
          message: `Removed ${targetTx.partyName} (₹${targetTx.amount.toLocaleString('en-IN')}) from your ledger.`,
          data: { deletedId: targetTx.id },
        };
      }

      let updatedCash = business.currentCash;
      let nextStatus = targetTx.status;
      let actualPaidDate = targetTx.actualPaidDate || null;
      const nextOutcomes = [...(ws.predictionOutcomes || [])];

      if (args.markSettled && targetTx.status !== 'paid') {
        const remaining = Math.max(0, targetTx.amount - (targetTx.paidAmount || 0));
        if (targetTx.type === 'inflow') {
          const { predictionsByTxId } = predictAllReceivables(
            transactions,
            customers,
            ANCHOR_DATE
          );
          const pred = predictionsByTxId[targetTx.id];
          const paidDateStr = ANCHOR_DATE;
          if (pred) {
            const actualDelay = diffDaysISO(targetTx.dueDate, paidDateStr);
            const absErr = Math.abs(diffDaysISO(pred.predictedDate, paidDateStr));
            nextOutcomes.unshift({
              id: `outc-${Date.now()}`,
              transactionId: targetTx.id,
              customerId: pred.customerId,
              partyName: targetTx.partyName,
              invoiceNumber: targetTx.invoiceNumber || targetTx.id,
              amount: targetTx.amount,
              dueDate: targetTx.dueDate,
              promisedDate: targetTx.promisedDate ?? null,
              predictedDate: pred.predictedDate,
              predictedRangeStart: pred.predictedRangeStart,
              predictedRangeEnd: pred.predictedRangeEnd,
              actualPaidDate: paidDateStr,
              predictedDelayDays: pred.estimatedDelayDays,
              actualDelayDays: actualDelay,
              absoluteErrorDays: absErr,
              withinPredictedRange:
                paidDateStr >= pred.predictedRangeStart &&
                paidDateStr <= pred.predictedRangeEnd,
              recordedAt: new Date().toISOString(),
            });
          }
          updatedCash += remaining;
        } else {
          updatedCash = Math.max(0, updatedCash - remaining);
        }
        nextStatus = 'paid';
        actualPaidDate = ANCHOR_DATE;
      }

      const updatedTx: Transaction = {
        ...targetTx,
        ...(args.newPartyName ? { partyName: String(args.newPartyName).trim() } : {}),
        ...(args.newTitle ? { title: String(args.newTitle).trim() } : {}),
        ...(args.newAmount !== undefined && !isNaN(parseFloat(args.newAmount))
          ? { amount: Math.round(Math.abs(parseFloat(args.newAmount))) }
          : {}),
        ...(args.newDueDate ? { dueDate: String(args.newDueDate).trim() } : {}),
        ...(args.newPromisedDate !== undefined
          ? { promisedDate: args.newPromisedDate ? String(args.newPromisedDate).trim() : null }
          : {}),
        ...(nextStatus === 'paid' ? { paidAmount: targetTx.amount, actualPaidDate } : {}),
        status: nextStatus,
      };

      transactions[txIdx] = updatedTx;
      saveWorkspace(root, {
        ...ws,
        transactions,
        predictionOutcomes: nextOutcomes,
        business: { ...business, currentCash: updatedCash },
      });

      return {
        toolName,
        success: true,
        message: args.markSettled
          ? `Marked ${updatedTx.partyName} (₹${updatedTx.amount.toLocaleString('en-IN')}) as settled. Present balance is now ₹${updatedCash.toLocaleString('en-IN')}.`
          : `Updated ${updatedTx.partyName}: ₹${updatedTx.amount.toLocaleString('en-IN')} due on ${updatedTx.dueDate}.`,
        data: { transaction: updatedTx, currentCash: updatedCash },
      };
    }

    default:
      return {
        toolName,
        success: false,
        message: `Unknown MCP tool '${toolName}'.`,
        error: 'TOOL_NOT_FOUND',
      };
  }
}

// ============================================================================
// API ROUTES
// ============================================================================

// 1. Partitioned Workspace Data API
app.get('/api/data', (req, res) => {
  const workspaceId = String(req.query.workspaceId || 'demo-sharma').trim();
  const shopNameHint = req.query.shopName ? String(req.query.shopName) : undefined;
  const phoneHint = req.query.phone ? String(req.query.phone) : undefined;

  const root = readRootDb();
  const ws = getOrCreateWorkspace(root, workspaceId, shopNameHint, phoneHint);
  const payload = buildWorkspaceResponsePayload(ws, root);
  res.json({ success: true, data: payload });
});

app.post('/api/data', (req, res) => {
  const payload = req.body || {};
  const workspaceId = String(payload.workspaceId || 'demo-sharma').trim();
  const root = readRootDb();
  const ws = getOrCreateWorkspace(root, workspaceId, payload.business?.name);

  const updatedWs = saveWorkspace(root, {
    ...ws,
    ...(payload.business ? { business: { ...ws.business, ...payload.business, isDemo: ws.isDemo } } : {}),
    ...(Array.isArray(payload.transactions) ? { transactions: payload.transactions } : {}),
    ...(Array.isArray(payload.customers) ? { customers: payload.customers } : {}),
    ...(Array.isArray(payload.notices) ? { notices: payload.notices } : {}),
    ...(Array.isArray(payload.people) ? { people: payload.people } : {}),
  });

  res.json({
    success: true,
    message: 'Saved successfully',
    data: buildWorkspaceResponsePayload(updatedWs, root),
  });
});

// Reset a synthetic demo workspace back to clean factory demo state without touching real user data
app.post('/api/workspaces/reset-demo', (req, res) => {
  const workspaceId = String(req.body?.workspaceId || 'demo-sharma').trim();
  if (!workspaceId.startsWith('demo-')) {
    return res.status(400).json({
      success: false,
      message: 'Only synthetic demo workspaces can be reset to demo defaults.',
    });
  }
  const root = readRootDb();
  root.demoWorkspaces[workspaceId] = buildSeededDemoWorkspace(workspaceId);
  writeRootDb(root);
  return res.json({
    success: true,
    data: buildWorkspaceResponsePayload(root.demoWorkspaces[workspaceId], root),
  });
});

// 1B. Authentication & Session Provisioning API
app.get('/api/auth/config', (_req, res) => {
  const root = readRootDb();
  res.json({
    success: true,
    defaultPhone: '9845012345',
    defaultShopName: 'Sharma Stores',
    demoWorkspaces: Object.values(root.demoWorkspaces).map((d) => ({
      workspaceId: d.workspaceId,
      name: d.business.name,
      businessType: d.business.businessType,
      labelBadge: d.labelBadge,
    })),
  });
});

app.post('/api/auth/login', (req, res) => {
  const { phone, shopName, mode = 'demo', demoWorkspaceId = 'demo-sharma' } = req.body || {};
  const root = readRootDb();

  let workspaceId = demoWorkspaceId;
  let isDemo = true;
  if (mode === 'real') {
    workspaceId = normalizeRealWorkspaceId(shopName, phone);
    isDemo = false;
  }

  const ws = getOrCreateWorkspace(root, workspaceId, shopName, phone);
  return res.json({
    success: true,
    session: {
      workspaceId: ws.workspaceId,
      isDemo,
      phone: phone ? String(phone).trim() : undefined,
      shopName: ws.business.name,
      loggedInAt: new Date().toISOString(),
    },
    data: buildWorkspaceResponsePayload(ws, root),
  });
});

// 2. MCP Server Protocol Endpoints
app.get('/api/mcp/tools', (_req, res) => {
  res.json({
    success: true,
    server: 'RupiVanta-MCP-Server-v1',
    protocolVersion: '2024-11-05',
    tools: MCP_TOOL_DEFINITIONS,
  });
});

app.post('/api/mcp/execute', (req, res) => {
  const {
    toolName,
    arguments: args = {},
    shopName = 'Sharma Stores',
    workspaceId = 'demo-sharma',
  } = req.body || {};
  if (!toolName) {
    return res.status(400).json({ success: false, error: 'toolName is required' });
  }

  const result = executeMCPTool(toolName, args, shopName, workspaceId);
  res.json(result);
});

// 2B. Direct Ledger & Customer CRUD API (Workspace-Aware)
app.post('/api/balance', (req, res) => {
  const { currentCash, minimumReserve, workspaceId = 'demo-sharma' } = req.body || {};
  const root = readRootDb();
  const ws = getOrCreateWorkspace(root, workspaceId);
  const business = ws.business || INITIAL_BUSINESS;

  const updatedBusiness = {
    ...business,
    ...(currentCash !== undefined && !isNaN(parseFloat(currentCash))
      ? { currentCash: Math.max(0, Math.round(parseFloat(currentCash))) }
      : {}),
    ...(minimumReserve !== undefined && !isNaN(parseFloat(minimumReserve))
      ? { minimumReserve: Math.max(0, Math.round(parseFloat(minimumReserve))) }
      : {}),
  };

  const saved = saveWorkspace(root, { ...ws, business: updatedBusiness });
  res.json({
    success: true,
    business: saved.business,
    data: buildWorkspaceResponsePayload(saved, root),
  });
});

app.post('/api/transactions', (req, res) => {
  const { workspaceId = 'demo-sharma', transaction } = req.body || {};
  if (!transaction || !transaction.partyName || !(Number(transaction.amount) > 0)) {
    return res.status(400).json({
      success: false,
      message: 'Valid partyName and positive amount are required.',
    });
  }

  const root = readRootDb();
  const ws = getOrCreateWorkspace(root, workspaceId);
  const amt = Math.round(Math.abs(Number(transaction.amount)));
  const paidAmt = transaction.paidAmount
    ? Math.min(amt, Math.max(0, Math.round(Number(transaction.paidAmount))))
    : 0;
  const dueDate = isValidISODate(transaction.dueDate) ? transaction.dueDate : '2026-10-30';
  const promisedDate =
    transaction.promisedDate && isValidISODate(transaction.promisedDate)
      ? transaction.promisedDate
      : null;
  const invoiceDate =
    transaction.invoiceDate && isValidISODate(transaction.invoiceDate)
      ? transaction.invoiceDate
      : ANCHOR_DATE;

  const newTx: Transaction = {
    id: transaction.id || `tx-${Date.now()}`,
    customerId: transaction.customerId || undefined,
    type: transaction.type === 'outflow' ? 'outflow' : 'inflow',
    title: String(transaction.title || transaction.partyName).trim(),
    partyName: String(transaction.partyName).trim(),
    contactPhone: transaction.contactPhone ? String(transaction.contactPhone).trim() : undefined,
    amount: amt,
    paidAmount: paidAmt > 0 ? paidAmt : undefined,
    invoiceDate,
    dueDate,
    promisedDate,
    status:
      paidAmt >= amt
        ? 'paid'
        : paidAmt > 0
        ? 'partially_paid'
        : dueDate < ANCHOR_DATE
        ? 'overdue'
        : 'expected',
    category:
      transaction.category || (transaction.type === 'outflow' ? 'supplier' : 'b2b_invoice'),
    invoiceNumber: transaction.invoiceNumber
      ? String(transaction.invoiceNumber).trim()
      : undefined,
    paymentDetails: transaction.paymentDetails
      ? String(transaction.paymentDetails).trim()
      : undefined,
    notes: transaction.notes ? String(transaction.notes).trim() : undefined,
    isDemoData: ws.isDemo,
  };

  const saved = saveWorkspace(root, {
    ...ws,
    transactions: [newTx, ...(ws.transactions || [])],
  });

  return res.json({
    success: true,
    transaction: newTx,
    data: buildWorkspaceResponsePayload(saved, root),
  });
});

app.put('/api/transactions/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body || {};
  const workspaceId = String(updates.workspaceId || req.query.workspaceId || 'demo-sharma').trim();

  const root = readRootDb();
  const ws = getOrCreateWorkspace(root, workspaceId);
  const transactions = [...(ws.transactions || [])];
  const idx = transactions.findIndex((t) => t.id === id);

  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Transaction not found' });
  }

  const existing = transactions[idx];
  const nextAmount =
    updates.amount !== undefined && !isNaN(parseFloat(updates.amount))
      ? Math.max(1, Math.round(parseFloat(updates.amount)))
      : existing.amount;

  const prevPaid = existing.paidAmount || 0;
  const nextPaid =
    updates.paidAmount !== undefined && !isNaN(parseFloat(updates.paidAmount))
      ? Math.min(nextAmount, Math.max(0, Math.round(parseFloat(updates.paidAmount))))
      : prevPaid;

  const nextDueDate =
    updates.dueDate !== undefined && isValidISODate(String(updates.dueDate).trim())
      ? String(updates.dueDate).trim()
      : existing.dueDate;

  const nextPromisedDate =
    updates.promisedDate !== undefined
      ? updates.promisedDate && isValidISODate(String(updates.promisedDate).trim())
        ? String(updates.promisedDate).trim()
        : null
      : existing.promisedDate ?? null;

  const nextInvoiceDate =
    updates.invoiceDate !== undefined
      ? updates.invoiceDate && isValidISODate(String(updates.invoiceDate).trim())
        ? String(updates.invoiceDate).trim()
        : existing.invoiceDate
      : existing.invoiceDate;

  let nextStatus = updates.status !== undefined ? updates.status : existing.status;
  if (nextPaid >= nextAmount) {
    nextStatus = 'paid';
  } else if (nextPaid > 0 && nextStatus !== 'paid') {
    nextStatus = 'partially_paid';
  } else if (nextDueDate < ANCHOR_DATE && nextStatus !== 'paid') {
    nextStatus = 'overdue';
  } else if (nextDueDate >= ANCHOR_DATE && nextStatus === 'overdue') {
    nextStatus = 'expected';
  }

  // Adjust currentCash deterministically if partial payment changed
  let nextCash = ws.business.currentCash;
  const paidDelta = nextPaid - prevPaid;
  if (paidDelta !== 0) {
    if (existing.type === 'inflow') {
      nextCash = Math.max(0, nextCash + paidDelta);
    } else {
      nextCash = Math.max(0, nextCash - paidDelta);
    }
  }

  transactions[idx] = {
    ...existing,
    ...(updates.partyName !== undefined ? { partyName: String(updates.partyName).trim() } : {}),
    ...(updates.title !== undefined ? { title: String(updates.title).trim() } : {}),
    ...(updates.contactPhone !== undefined
      ? { contactPhone: String(updates.contactPhone).trim() || undefined }
      : {}),
    amount: nextAmount,
    paidAmount: nextPaid > 0 ? nextPaid : undefined,
    invoiceDate: nextInvoiceDate,
    dueDate: nextDueDate,
    promisedDate: nextPromisedDate,
    status: nextStatus,
    ...(updates.notes !== undefined ? { notes: String(updates.notes) } : {}),
    ...(updates.paymentDetails !== undefined
      ? { paymentDetails: String(updates.paymentDetails) }
      : {}),
    ...(updates.invoiceNumber !== undefined
      ? { invoiceNumber: String(updates.invoiceNumber).trim() }
      : {}),
    ...(updates.type === 'inflow' || updates.type === 'outflow' ? { type: updates.type } : {}),
  };

  const saved = saveWorkspace(root, {
    ...ws,
    transactions,
    business: { ...ws.business, currentCash: nextCash },
  });

  return res.json({
    success: true,
    transaction: saved.transactions.find((t) => t.id === id) || transactions[idx],
    data: buildWorkspaceResponsePayload(saved, root),
  });
});

app.delete('/api/transactions/:id', (req, res) => {
  const { id } = req.params;
  const workspaceId = String(req.query.workspaceId || req.body?.workspaceId || 'demo-sharma').trim();

  const root = readRootDb();
  const ws = getOrCreateWorkspace(root, workspaceId);
  const transactions = (ws.transactions || []).filter((t) => t.id !== id);
  const saved = saveWorkspace(root, { ...ws, transactions });

  return res.json({
    success: true,
    transactions: saved.transactions,
    data: buildWorkspaceResponsePayload(saved, root),
  });
});

app.post('/api/transactions/:id/settle', (req, res) => {
  const { id } = req.params;
  const {
    workspaceId = 'demo-sharma',
    actualPaidDate: rawPaidDate,
    partialAmount,
  } = req.body || {};

  const paidDateStr =
    rawPaidDate && isValidISODate(String(rawPaidDate).trim())
      ? String(rawPaidDate).trim()
      : ANCHOR_DATE;

  const root = readRootDb();
  const ws = getOrCreateWorkspace(root, workspaceId);
  const transactions = [...(ws.transactions || [])];
  const customers = [...(ws.customers || [])];
  const business = ws.business || INITIAL_BUSINESS;

  const idx = transactions.findIndex((t) => t.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Transaction not found' });
  }

  const tx = transactions[idx];
  let currentCash = business.currentCash;
  const nextOutcomes: PredictionOutcomeRecord[] = [...(ws.predictionOutcomes || [])];
  let recordedOutcome: PredictionOutcomeRecord | null = null;

  if (tx.status !== 'paid') {
    const alreadyPaid = tx.paidAmount || 0;
    const remaining = Math.max(0, tx.amount - alreadyPaid);
    const parsedPartial =
      partialAmount !== undefined && !isNaN(parseFloat(partialAmount))
        ? Math.round(Math.abs(parseFloat(partialAmount)))
        : null;

    if (parsedPartial !== null && parsedPartial > 0 && parsedPartial < remaining) {
      // Partial payment settlement
      if (tx.type === 'inflow') {
        currentCash += parsedPartial;
      } else {
        currentCash = Math.max(0, currentCash - parsedPartial);
      }
      transactions[idx] = {
        ...tx,
        paidAmount: alreadyPaid + parsedPartial,
        status: 'partially_paid',
      };
    } else {
      // Full settlement -> evaluate ML payment-date prediction accuracy for inflows!
      if (tx.type === 'inflow') {
        const { predictionsByTxId } = predictAllReceivables(
          transactions,
          customers,
          ANCHOR_DATE
        );
        const pred = predictionsByTxId[tx.id];
        if (pred) {
          const actualDelay = diffDaysISO(tx.dueDate, paidDateStr);
          const absErr = Math.abs(diffDaysISO(pred.predictedDate, paidDateStr));
          recordedOutcome = {
            id: `outc-${Date.now()}`,
            transactionId: tx.id,
            customerId: pred.customerId,
            partyName: tx.partyName,
            invoiceNumber: tx.invoiceNumber || tx.id,
            amount: tx.amount,
            dueDate: tx.dueDate,
            promisedDate: tx.promisedDate ?? null,
            predictedDate: pred.predictedDate,
            predictedRangeStart: pred.predictedRangeStart,
            predictedRangeEnd: pred.predictedRangeEnd,
            actualPaidDate: paidDateStr,
            predictedDelayDays: pred.estimatedDelayDays,
            actualDelayDays: actualDelay,
            absoluteErrorDays: absErr,
            withinPredictedRange:
              paidDateStr >= pred.predictedRangeStart && paidDateStr <= pred.predictedRangeEnd,
            recordedAt: new Date().toISOString(),
          };
          nextOutcomes.unshift(recordedOutcome);
        }
        currentCash += remaining;
      } else {
        currentCash = Math.max(0, currentCash - remaining);
      }

      transactions[idx] = {
        ...tx,
        status: 'paid',
        paidAmount: tx.amount,
        actualPaidDate: paidDateStr,
      };
    }
  }

  const updatedBusiness = { ...business, currentCash };
  const saved = saveWorkspace(root, {
    ...ws,
    transactions,
    predictionOutcomes: nextOutcomes,
    business: updatedBusiness,
  });

  return res.json({
    success: true,
    transaction: saved.transactions.find((t) => t.id === id) || transactions[idx],
    business: saved.business,
    recordedOutcome,
    data: buildWorkspaceResponsePayload(saved, root),
  });
});

// Update Customer Profile (e.g., saving customer phone number or category across sessions)
app.put('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  const { workspaceId = 'demo-sharma', contactPhone, name, category, paymentFrequency } =
    req.body || {};

  const root = readRootDb();
  const ws = getOrCreateWorkspace(root, workspaceId);
  const customers: CustomerProfile[] = [...(ws.customers || [])];
  const transactions: Transaction[] = [...(ws.transactions || [])];

  const cIdx = customers.findIndex((c) => c.id === id);
  if (cIdx === -1) {
    return res.status(404).json({ success: false, message: 'Customer not found' });
  }

  const cleanPhone = contactPhone !== undefined ? String(contactPhone).trim() : undefined;
  customers[cIdx] = {
    ...customers[cIdx],
    ...(cleanPhone !== undefined ? { contactPhone: cleanPhone } : {}),
    ...(name ? { name: String(name).trim() } : {}),
    ...(category ? { category: String(category).trim() } : {}),
    ...(paymentFrequency ? { paymentFrequency: String(paymentFrequency).trim() } : {}),
  };

  // Propagate updated contactPhone to matching open customer invoices
  const updatedTransactions = transactions.map((tx) => {
    if (
      cleanPhone !== undefined &&
      tx.type === 'inflow' &&
      (tx.customerId === id ||
        tx.partyName.trim().toLowerCase() === customers[cIdx].name.trim().toLowerCase())
    ) {
      return { ...tx, contactPhone: cleanPhone };
    }
    return tx;
  });

  const saved = saveWorkspace(root, {
    ...ws,
    customers,
    transactions: updatedTransactions,
  });

  return res.json({
    success: true,
    customer: saved.customers.find((c) => c.id === id),
    data: buildWorkspaceResponsePayload(saved, root),
  });
});

// Log prepared / opened WhatsApp reminder honestly
app.post('/api/reminders/log', (req, res) => {
  const {
    workspaceId = 'demo-sharma',
    transactionId,
    customerId,
    partyName,
    phone,
    invoiceNumber,
    amount,
    language = 'en',
    deliveryMethod = 'whatsapp_deeplink',
    savePhoneToCustomer = false,
  } = req.body || {};

  const root = readRootDb();
  const ws = getOrCreateWorkspace(root, workspaceId);
  const nowIso = new Date().toISOString();

  const logEntry: ReminderLogEntry = {
    id: `rem-${Date.now()}`,
    transactionId: String(transactionId || ''),
    customerId: customerId ? String(customerId) : undefined,
    partyName: String(partyName || 'Customer'),
    phone: String(phone || ''),
    invoiceNumber: String(invoiceNumber || ''),
    amount: Number(amount) || 0,
    language: String(language),
    deliveryMethod:
      deliveryMethod === 'copied_clipboard' ? 'copied_clipboard' : 'whatsapp_deeplink',
    createdAt: nowIso,
  };

  const formattedPhone = phone
    ? String(phone).startsWith('+91')
      ? String(phone)
      : `+91 ${String(phone).replace(/\D/g, '').slice(-10)}`
    : undefined;

  const updatedTransactions = (ws.transactions || []).map((tx) => {
    if (tx.id === transactionId) {
      return {
        ...tx,
        lastReminderAt: nowIso,
        ...(savePhoneToCustomer && formattedPhone ? { contactPhone: formattedPhone } : {}),
      };
    }
    return tx;
  });

  const updatedCustomers = (ws.customers || []).map((c) => {
    if (
      savePhoneToCustomer &&
      formattedPhone &&
      (c.id === customerId ||
        c.name.trim().toLowerCase() === String(partyName || '').trim().toLowerCase())
    ) {
      return { ...c, contactPhone: formattedPhone };
    }
    return c;
  });

  const saved = saveWorkspace(root, {
    ...ws,
    transactions: updatedTransactions,
    customers: updatedCustomers,
    reminderLogs: [logEntry, ...(ws.reminderLogs || [])].slice(0, 100),
  });

  return res.json({
    success: true,
    reminderLog: logEntry,
    data: buildWorkspaceResponsePayload(saved, root),
  });
});

// 2C. Audio Transcription API (gemini-3.5-transcribe) — Strictly English & Kannada for Voice Assistant
app.post('/api/speech/transcribe', async (req, res) => {
  try {
    const { audioBase64, mimeType = 'audio/webm', language = 'en' } = req.body || {};
    const voiceLang = language === 'kn' ? 'kn' : 'en';
    if (!audioBase64 || !hasConfiguredGeminiKey()) {
      return res.json({ success: false, transcript: '' });
    }
    const cleanBase64 = String(audioBase64).replace(/^data:[^;]+;base64,/, '');
    const langHint =
      voiceLang === 'kn' ? 'Kannada (ಕನ್ನಡ) or English' : 'English (Indian English)';
    const transcribeRes = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: [
        {
          inlineData: {
            mimeType,
            data: cleanBase64,
          },
        },
        {
          text: `Transcribe this spoken audio accurately. Speaker language: ${langHint}. Return ONLY the exact spoken words without quotes or commentary.`,
        },
      ],
    });
    const transcript = (transcribeRes.text || '').trim();
    return res.json({ success: Boolean(transcript), transcript });
  } catch (err: any) {
    console.warn('Audio transcription failed:', err?.message);
    return res.json({ success: false, transcript: '' });
  }
});

// Helper: Parse natural spoken dates relative to Sunday, 25 October 2026
function parseNaturalDate(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes('today') || lower.includes('indu') || input.includes('ಇಂದು')) {
    return ANCHOR_DATE; // 2026-10-25
  }
  if (lower.includes('tomorrow') || lower.includes('naale') || input.includes('ನಾಳೆ')) {
    return '2026-10-26';
  }
  if (lower.includes('next week') || input.includes('ಮುಂದಿನ ವಾರ')) {
    return '2026-11-01';
  }
  const isoMatch = input.match(/\b(202\d-\d{2}-\d{2})\b/);
  if (isoMatch) return isoMatch[1];

  const inDaysMatch = lower.match(/\bin\s+(\d{1,2})\s+days?\b/);
  if (inDaysMatch) {
    const d = new Date('2026-10-25T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + parseInt(inDaysMatch[1], 10));
    return d.toISOString().slice(0, 10);
  }

  const monthMap: Record<string, string> = {
    jan: '01', january: '01',
    feb: '02', february: '02',
    mar: '03', march: '03',
    apr: '04', april: '04',
    may: '05',
    jun: '06', june: '06',
    jul: '07', july: '07',
    aug: '08', august: '08',
    sep: '09', sept: '09', september: '09',
    oct: '10', october: '10',
    nov: '11', november: '11',
    dec: '12', december: '12',
  };

  const dmMatch = lower.match(
    /\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:\s+(202\d))?\b/
  );
  if (dmMatch) {
    const day = dmMatch[1].padStart(2, '0');
    const mon = monthMap[dmMatch[2]] || '10';
    const yr = dmMatch[3] || (parseInt(mon, 10) < 10 ? '2027' : '2026');
    return `${yr}-${mon}-${day}`;
  }

  const mdMatch = lower.match(
    /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s+(202\d))?\b/
  );
  if (mdMatch) {
    const mon = monthMap[mdMatch[1]] || '10';
    const day = mdMatch[2].padStart(2, '0');
    const yr = mdMatch[3] || (parseInt(mon, 10) < 10 ? '2027' : '2026');
    return `${yr}-${mon}-${day}`;
  }

  return '2026-10-30';
}

function parseSpokenAmount(input: string): number | null {
  const lower = input.toLowerCase();
  const lakhMatch = lower.match(/(\d+(?:\.\d+)?)\s*lakh/);
  if (lakhMatch) return Math.round(parseFloat(lakhMatch[1]) * 100000);
  const kMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:thousand|\bk\b)/);
  if (kMatch) return Math.round(parseFloat(kMatch[1]) * 1000);

  const cleaned = input
    .replace(/\b202\d-\d{2}-\d{2}\b/g, ' ')
    .replace(/\b202\d\b/g, ' ')
    .replace(
      /\b\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/gi,
      ' '
    )
    .replace(
      /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?\b/gi,
      ' '
    )
    .replace(/\bin\s+\d{1,2}\s+days?\b/gi, ' ');

  const matches = [...cleaned.matchAll(/(?:₹|rs\.?|inr)?\s*(\d+(?:,\d+)*(?:\.\d+)?)/gi)];
  if (matches.length === 0) return null;
  const nums = matches
    .map((m) => parseFloat(m[1].replace(/,/g, '')))
    .filter((n) => !isNaN(n) && n > 0);
  if (nums.length === 0) return null;
  return Math.max(...nums);
}

function extractPartyNameFromText(input: string, fallback: string): string {
  const fromMatch = input.match(
    /\b(?:from|by)\s+([A-Za-z][A-Za-z0-9\s.&'-]{1,28}?)(?=\s+(?:of|for|on|by|due|is|worth|rs|inr|₹|\d|$))/i
  );
  if (fromMatch?.[1]) return fromMatch[1].trim();

  const toMatch = input.match(
    /\bto\s+([A-Za-z][A-Za-z0-9\s.&'-]{1,28}?)(?=\s+(?:of|for|on|by|due|is|worth|rs|inr|₹|\d|$))/i
  );
  if (
    toMatch?.[1] &&
    !['pay', 'me', 'update', 'set', 'add'].includes(toMatch[1].trim().toLowerCase())
  ) {
    return toMatch[1].trim();
  }

  const owesMatch = input.match(
    /^([A-Za-z][A-Za-z0-9\s.&'-]{1,28}?)\s+(?:owes|needs\s+to\s+pay|has\s+to\s+pay|will\s+pay|pending)/i
  );
  if (owesMatch?.[1]) return owesMatch[1].trim();

  return fallback;
}

const VANTA_FUNCTION_DECLARATIONS: any[] = [
  {
    name: 'update_present_balance',
    description:
      'Update the shopkeeper present cash/bank balance and/or minimum safe reserve when the user asks to set, change, or update their present balance.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        newBalance: { type: Type.NUMBER, description: 'New present cash balance in INR (₹).' },
        minimumReserve: {
          type: Type.NUMBER,
          description: 'Optional new minimum reserve buffer in INR (₹).',
        },
      },
      required: ['newBalance'],
    },
  },
  {
    name: 'add_customer_receivable',
    description: 'Add a new pending payment (receivable) owed BY a customer TO the business.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerName: { type: Type.STRING, description: 'Customer or business name.' },
        amount: { type: Type.NUMBER, description: 'Amount in INR (₹).' },
        dueDate: { type: Type.STRING, description: 'Contractual due date in YYYY-MM-DD.' },
        promisedDate: {
          type: Type.STRING,
          description: 'Optional date customer promised to pay in YYYY-MM-DD.',
        },
        notes: { type: Type.STRING, description: 'Short description or note.' },
      },
      required: ['customerName', 'amount', 'dueDate'],
    },
  },
  {
    name: 'add_upcoming_payment',
    description: 'Add a new upcoming payment or bill (payable) that the user needs to pay.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        partyName: { type: Type.STRING, description: 'Supplier, landlord, or utility name.' },
        amount: { type: Type.NUMBER, description: 'Amount to pay in INR (₹).' },
        dueDate: { type: Type.STRING, description: 'Due date in YYYY-MM-DD.' },
        title: { type: Type.STRING, description: 'Bill title or reason.' },
        category: {
          type: Type.STRING,
          description: 'Category: supplier, rent, wages, utilities, taxes, or other.',
        },
      },
      required: ['partyName', 'amount', 'dueDate'],
    },
  },
  {
    name: 'record_expense',
    description: 'Record an expense already paid today (deducts immediately from present cash).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        amount: { type: Type.NUMBER, description: 'Expense amount paid in INR (₹).' },
        description: { type: Type.STRING, description: 'What the expense was for.' },
        partyName: { type: Type.STRING, description: 'Who was paid.' },
        date: { type: Type.STRING, description: 'Date in YYYY-MM-DD (default 2026-10-25).' },
      },
      required: ['amount', 'description'],
    },
  },
  {
    name: 'record_income',
    description: 'Record money/sales received today (adds immediately to present cash).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        amount: { type: Type.NUMBER, description: 'Income amount received in INR (₹).' },
        description: { type: Type.STRING, description: 'Description of sale or receipt.' },
        partyName: { type: Type.STRING, description: 'Customer or source name.' },
        date: { type: Type.STRING, description: 'Date in YYYY-MM-DD (default 2026-10-25).' },
      },
      required: ['amount', 'description'],
    },
  },
  {
    name: 'edit_payment',
    description:
      'Edit, update amount/date/promisedDate, mark as paid/received, or delete an existing pending or upcoming payment.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        targetName: { type: Type.STRING, description: 'Existing customer, supplier, or bill title.' },
        newAmount: { type: Type.NUMBER, description: 'Optional updated amount in INR (₹).' },
        newDueDate: { type: Type.STRING, description: 'Optional updated due date in YYYY-MM-DD.' },
        newPromisedDate: {
          type: Type.STRING,
          description: 'Optional customer promised payment date in YYYY-MM-DD.',
        },
        newPartyName: { type: Type.STRING, description: 'Optional updated party name.' },
        newTitle: { type: Type.STRING, description: 'Optional updated bill/order title.' },
        markSettled: {
          type: Type.BOOLEAN,
          description: 'Set true if this pending/upcoming payment was paid or received.',
        },
        deleteEntry: {
          type: Type.BOOLEAN,
          description: 'Set true if the user wants to remove/delete this entry.',
        },
      },
      required: ['targetName'],
    },
  },
];

function localizeVoiceSummary(
  voiceLang: 'en' | 'kn',
  currentCash: number,
  pendingTotal: number,
  pendingCount: number,
  upcomingTotal: number,
  upcomingCount: number,
  topFollowUpName?: string,
  lowest30?: number,
  lowest30Date?: string
): string {
  const cashFmt = `₹${currentCash.toLocaleString('en-IN')}`;
  const pendFmt = `₹${pendingTotal.toLocaleString('en-IN')}`;
  const upcFmt = `₹${upcomingTotal.toLocaleString('en-IN')}`;
  const lowFmt = lowest30 !== undefined ? `₹${lowest30.toLocaleString('en-IN')}` : '';

  if (voiceLang === 'kn') {
    const adviceBit = topFollowUpName
      ? ` ML ವಿಶ್ಲೇಷಣೆಯ ಪ್ರಕಾರ ಮೊದಲು ${topFollowUpName} ಅವರ ಬಾಕಿ ವಸೂಲಿ ಮಾಡುವುದು ಒಳ್ಳೆಯದು.${lowFmt ? ` ಮುಂದಿನ 30 ದಿನಗಳಲ್ಲಿ ಕನಿಷ್ಠ ಅಂದಾಜು ಬ್ಯಾಲೆನ್ಸ್ ${lowest30Date} ರಂದು ${lowFmt} ಆಗಿರಲಿದೆ.` : ''}`
      : '';
    return `ಇಂದು ಭಾನುವಾರ, 25 ಅಕ್ಟೋಬರ್ 2026. ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಬ್ಯಾಲೆನ್ಸ್ ${cashFmt}, ಬಾಕಿ ಬರಬೇಕಾದ ಪಾವತಿಗಳು ${pendFmt} (${pendingCount} ಖಾತೆಗಳು), ಮತ್ತು ಮುಂಬರುವ ಬಿಲ್‌ಗಳು ${upcFmt} (${upcomingCount} ಬಿಲ್‌ಗಳು) ಇವೆ.${adviceBit}`;
  }

  const adviceBit = topFollowUpName
    ? ` Based on ML payment predictions, follow up with ${topFollowUpName} first.${lowFmt ? ` Your 30-day lowest projected balance is ${lowFmt} on ${lowest30Date}.` : ''}`
    : '';
  return `Today is Sunday, 25 October 2026. Your Present Balance is ${cashFmt}, Pending Payments total ${pendFmt} (${pendingCount} invoices), and Upcoming Payments total ${upcFmt} (${upcomingCount} bills).${adviceBit}`;
}

function localizeVoiceToolMessage(
  voiceLang: 'en' | 'kn',
  englishMessage: string,
  toolName: string,
  amount?: number | null
): string {
  if (voiceLang === 'en') return englishMessage;
  const amtFmt = amount != null ? `₹${Math.round(amount).toLocaleString('en-IN')}` : '';
  if (toolName === 'update_present_balance' && amtFmt) {
    return `ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಬ್ಯಾಲೆನ್ಸ್ ಅನ್ನು ${amtFmt} ಗೆ ನವೀಕರಿಸಲಾಗಿದೆ.`;
  }
  if (toolName === 'add_customer_receivable' && amtFmt) {
    return `${amtFmt} ಮೊತ್ತದ ಹೊಸ ಬಾಕಿ ಪಾವತಿಯನ್ನು (Pending Payment) ಸೇರಿಸಲಾಗಿದೆ ಮತ್ತು ML ದಿನಾಂಕವನ್ನು ಲೆಕ್ಕಹಾಕಲಾಗಿದೆ.`;
  }
  if (toolName === 'add_upcoming_payment' && amtFmt) {
    return `${amtFmt} ಮೊತ್ತದ ಹೊಸ ಮುಂಬರುವ ಪಾವತಿಯನ್ನು (Upcoming Payment) ಸೇರಿಸಲಾಗಿದೆ.`;
  }
  if (toolName === 'record_expense' && amtFmt) {
    return `ಇಂದಿನ ${amtFmt} ಖರ್ಚನ್ನು ದಾಖಲಿಸಲಾಗಿದೆ ಮತ್ತು ಬ್ಯಾಲೆನ್ಸ್ ನವೀಕರಿಸಲಾಗಿದೆ.`;
  }
  if (toolName === 'record_income' && amtFmt) {
    return `ಇಂದಿನ ${amtFmt} ಆದಾಯವನ್ನು ದಾಖಲಿಸಲಾಗಿದೆ ಮತ್ತು ಬ್ಯಾಲೆನ್ಸ್ ನವೀಕರಿಸಲಾಗಿದೆ.`;
  }
  return `ಖಾತೆ ನವೀಕರಿಸಲಾಗಿದೆ: ${englishMessage}`;
}

// 3. VANTA Voice & Financial Explanation Assistant API (Strictly English & Kannada Voice Languages)
async function handleVantaChat(req: express.Request, res: express.Response) {
  const rawLang = req.body?.language || 'en';
  // Voice assistant strictly supports English ('en') and Kannada ('kn') ONLY
  const voiceLang: 'en' | 'kn' = rawLang === 'kn' ? 'kn' : 'en';
  const { message, shopName = 'Sharma Stores', workspaceId = 'demo-sharma' } = req.body || {};

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.json({ reply: '', proposedAction: null, intent: 'empty' });
  }

  const trimmedMsg = message.trim();
  const root = readRootDb();
  const ws = getOrCreateWorkspace(root, workspaceId, shopName);
  const business = ws.business || INITIAL_BUSINESS;
  const allTx = ws.transactions || [];
  const allCust = ws.customers || [];

  const { predictionsList } = predictAllReceivables(allTx, allCust, ANCHOR_DATE);
  const advice = generateFinancialAdviceReport(
    business.currentCash,
    business.minimumReserve,
    allTx,
    allCust,
    ws.predictionOutcomes || [],
    ANCHOR_DATE
  );

  const openPending = allTx.filter((t) => t.type === 'inflow' && t.status !== 'paid');
  const openUpcoming = allTx.filter((t) => t.type === 'outflow' && t.status !== 'paid');

  const targetLanguageLabel =
    voiceLang === 'kn' ? 'Kannada (ಕನ್ನಡ in Kannada script)' : 'English';

  if (hasConfiguredGeminiKey()) {
    try {
      const mlPendingSummary = predictionsList
        .map(
          (p) =>
            `${p.partyName} (#${p.invoiceNumber}): ₹${p.amountRemaining}, due ${p.dueDate}${
              p.promisedDate ? `, promised ${p.promisedDate}` : ''
            }, ML predicted ${p.predictedDate} (range ${p.predictedRangeStart}..${
              p.predictedRangeEnd
            }, est delay +${p.estimatedDelayDays}d, confidence ${p.confidencePercent}%, basis: ${
              p.predictionBasis
            })`
        )
        .join('; ');

      const affordabilitySummary = advice.expenseAffordability
        .map(
          (e) =>
            `${e.partyName} (${e.title}): ₹${e.amount} due ${e.dueDate} -> verdict: ${e.verdict} (projected cash ₹${e.projectedBalanceOnDueDate})`
        )
        .join('; ');

      const followUpTop = advice.followUpQueue
        .slice(0, 3)
        .map((f) => `${f.partyName} (₹${f.amountRemaining}, ${f.priority}): ${f.reason}`)
        .join(' | ');

      const systemInstruction = `You are VANTA, the Predictive Finance & Voice Assistant for "${business.name}" (${ws.isDemo ? 'Demo Workspace' : 'Real Business Workspace'}).
Today's present date is Sunday, 25 October 2026 (2026-10-25).
VOICE ASSISTANT LANGUAGE RULE: The voice assistant supports ONLY English ("en") and Kannada ("kn"). Reply strictly in ${targetLanguageLabel}.
Always use ₹ with Western digits (e.g. ₹15,000). Keep replies clear, grounded in the exact numbers below, and concise (2-4 sentences). Never guarantee payment dates.

Live Deterministic Balances & ML Forecasts:
- Present Balance: ₹${business.currentCash} (Safe Reserve: ₹${business.minimumReserve})
- 7-Day Forecast: Lowest ₹${advice.horizons.days7.lowestBalance} on ${advice.horizons.days7.lowestBalanceDate}
- 30-Day Forecast: Lowest ₹${advice.horizons.days30.lowestBalance} on ${advice.horizons.days30.lowestBalanceDate} (${advice.delayCashImpactSummary.headline})
- 90-Day Forecast: Lowest ₹${advice.horizons.days90.lowestBalance} on ${advice.horizons.days90.lowestBalanceDate}
- ML Receivable Predictions: ${mlPendingSummary || 'None'}
- Top Follow-Up Priorities: ${followUpTop || 'None'}
- Upcoming Expense Affordability: ${affordabilitySummary || 'None'}

INSTRUCTIONS:
1. If the user asks to add, edit, settle, or delete a balance, receivable, upcoming bill, income, or expense, CALL THE MATCHING FUNCTION TOOL.
2. If the user asks why a customer payment is delayed, about promised vs ML-predicted dates, cash shortages, whom to follow up with, or whether upcoming bills are affordable, explain clearly using the ML predictions and deterministic balances above.`;

      const firstRes = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: trimmedMsg,
        config: {
          systemInstruction,
          tools: [{ functionDeclarations: VANTA_FUNCTION_DECLARATIONS }],
        },
      });

      const fnCalls = firstRes.functionCalls;
      if (fnCalls && fnCalls.length > 0) {
        let lastToolName = '';
        let lastToolResult: MCPToolCallResult | null = null;
        const executionSummaries: string[] = [];

        for (const call of fnCalls) {
          const tName = call.name || '';
          const tArgs = (call.args as Record<string, any>) || {};
          const resTool = executeMCPTool(tName, tArgs, business.name, workspaceId);
          lastToolName = tName;
          lastToolResult = resTool;
          executionSummaries.push(resTool.message);
        }

        let replyText = executionSummaries.join(' ');
        if (voiceLang === 'kn') {
          try {
            const confirmRes = await ai.models.generateContent({
              model: 'gemini-3.8-flash',
              contents: `Translate this financial confirmation naturally into 1-2 polite Kannada (ಕನ್ನಡ) sentences keeping ₹ and Western digits: ${replyText}`,
            });
            replyText = confirmRes.text?.trim() || localizeVoiceToolMessage('kn', replyText, lastToolName, null);
          } catch {
            replyText = localizeVoiceToolMessage('kn', replyText, lastToolName, null);
          }
        }

        return res.json({
          reply: replyText,
          intent: lastToolName,
          toolExecuted: lastToolName,
          toolResult: lastToolResult,
          voiceLanguage: voiceLang,
          proposedAction: {
            type: 'refresh_ledger',
            title: executionSummaries[0] || 'Ledger Updated',
            description: replyText,
          },
        });
      }

      if (firstRes.text) {
        return res.json({
          reply: firstRes.text.trim(),
          intent: 'general_query',
          voiceLanguage: voiceLang,
          proposedAction: null,
        });
      }
    } catch (err: any) {
      console.warn('Gemini tool-calling chat error, using deterministic local handler:', err?.message);
    }
  }

  // Deterministic Fallback Parser & ML Advice Explainer (English & Kannada)
  const lower = trimmedMsg.toLowerCase();
  const amount = parseSpokenAmount(trimmedMsg);
  const parsedDate = parseNaturalDate(trimmedMsg);

  // Explain ML predictions / follow-up / affordability questions offline
  if (
    lower.includes('predict') ||
    lower.includes('follow up') ||
    lower.includes('who should i') ||
    lower.includes('afford') ||
    lower.includes('shortage') ||
    lower.includes('shortfall') ||
    lower.includes('advice') ||
    trimmedMsg.includes('ಸಲಹೆ') ||
    trimmedMsg.includes('ಕೊರತೆ') ||
    trimmedMsg.includes('ಯಾರನ್ನು')
  ) {
    const topFollow = advice.followUpQueue[0];
    const riskyBill = advice.expenseAffordability.find((e) => e.verdict !== 'affordable');
    const h30 = advice.horizons.days30;
    const reply =
      voiceLang === 'kn'
        ? `ML ವಿಶ್ಲೇಷಣೆ ಪ್ರಕಾರ: 30 ದಿನಗಳ ಕನಿಷ್ಠ ಅಂದಾಜು ಬ್ಯಾಲೆನ್ಸ್ ${h30.lowestBalanceDate} ರಂದು ₹${h30.lowestBalance.toLocaleString('en-IN')} ಆಗಿರಲಿದೆ.${
            topFollow
              ? ` ಮೊದಲು ${topFollow.partyName} (₹${topFollow.amountRemaining.toLocaleString('en-IN')}, ಅಂದಾಜು ಪಾವತಿ ${topFollow.predictedDate}) ಅವರನ್ನು ಸಂಪರ್ಕಿಸಿ.`
              : ''
          }${
            riskyBill
              ? ` ${riskyBill.partyName} ಬಿಲ್ (₹${riskyBill.amount.toLocaleString('en-IN')}) ಪಾವತಿಸುವಾಗ ಎಚ್ಚರ ವಹಿಸಿ.`
              : ' ಮುಂಬರುವ ಎಲ್ಲಾ ಬಿಲ್‌ಗಳು ಸುರಕ್ಷಿತವಾಗಿವೆ.'
          }`
        : `ML Financial Advice: Your 30-day lowest projected cash is ₹${h30.lowestBalance.toLocaleString('en-IN')} on ${h30.lowestBalanceDate}.${
            topFollow
              ? ` Follow up first with ${topFollow.partyName} for ₹${topFollow.amountRemaining.toLocaleString('en-IN')} (ML predicted ${topFollow.predictedDate}).`
              : ''
          }${
            riskyBill
              ? ` Upcoming bill to ${riskyBill.partyName} (₹${riskyBill.amount.toLocaleString('en-IN')} on ${riskyBill.dueDate}) is ${riskyBill.verdict === 'unaffordable_shortage' ? 'at shortage risk — split or collect dues first' : 'tight against your safe reserve'}.`
              : ' All scheduled upcoming bills are affordable.'
          }`;

    return res.json({
      reply,
      intent: 'ml_advice_explanation',
      voiceLanguage: voiceLang,
      proposedAction: null,
    });
  }

  // A. Update Present Balance
  const mentionsBalance =
    lower.includes('balance') ||
    lower.includes('cash in hand') ||
    lower.includes('present cash') ||
    trimmedMsg.includes('ಬ್ಯಾಲೆನ್ಸ್') ||
    trimmedMsg.includes('ನಗದು');

  const mentionsSetOrUpdate =
    lower.includes('set') ||
    lower.includes('update') ||
    lower.includes('change') ||
    lower.includes('is') ||
    lower.includes('to') ||
    trimmedMsg.includes('ಮಾಡಿ') ||
    trimmedMsg.includes('ಬದಲಿಸಿ');

  if (amount !== null && mentionsBalance && mentionsSetOrUpdate) {
    const toolResult = executeMCPTool(
      'update_present_balance',
      { newBalance: amount },
      business.name,
      workspaceId
    );
    const localizedReply = localizeVoiceToolMessage(
      voiceLang,
      toolResult.message,
      'update_present_balance',
      amount
    );
    return res.json({
      reply: localizedReply,
      intent: 'update_present_balance',
      toolExecuted: 'update_present_balance',
      toolResult,
      voiceLanguage: voiceLang,
      proposedAction: {
        type: 'refresh_ledger',
        title: toolResult.message,
        description: localizedReply,
      },
    });
  }

  // B. Edit / Delete / Settle existing entry
  const matchedExisting = allTx.find(
    (t) =>
      lower.includes(t.partyName.toLowerCase()) ||
      t.partyName
        .toLowerCase()
        .split(/\s+/)
        .some((w: string) => w.length > 3 && lower.includes(w))
  );

  if (
    matchedExisting &&
    (lower.includes('edit') ||
      lower.includes('update') ||
      lower.includes('change') ||
      lower.includes('delete') ||
      lower.includes('remove') ||
      lower.includes('mark paid') ||
      lower.includes('mark received') ||
      lower.includes('paid me') ||
      lower.includes('settled') ||
      trimmedMsg.includes('ಪಾವತಿಸಲಾಗಿದೆ') ||
      trimmedMsg.includes('ಬಂದಿದೆ'))
  ) {
    const deleteEntry = lower.includes('delete') || lower.includes('remove');
    const markSettled =
      lower.includes('mark paid') ||
      lower.includes('mark received') ||
      lower.includes('paid me') ||
      lower.includes('settled') ||
      trimmedMsg.includes('ಪಾವತಿಸಲಾಗಿದೆ') ||
      trimmedMsg.includes('ಬಂದಿದೆ');

    const toolResult = executeMCPTool(
      'edit_payment',
      {
        targetName: matchedExisting.partyName,
        ...(amount !== null && !markSettled && !deleteEntry ? { newAmount: amount } : {}),
        ...(deleteEntry ? { deleteEntry: true } : {}),
        ...(markSettled ? { markSettled: true } : {}),
      },
      business.name,
      workspaceId
    );
    const localizedReply = localizeVoiceToolMessage(
      voiceLang,
      toolResult.message,
      'edit_payment',
      amount
    );
    return res.json({
      reply: localizedReply,
      intent: 'edit_payment',
      toolExecuted: 'edit_payment',
      toolResult,
      voiceLanguage: voiceLang,
      proposedAction: {
        type: 'refresh_ledger',
        title: toolResult.message,
        description: localizedReply,
      },
    });
  }

  // C. Add Pending Payment
  if (
    amount !== null &&
    (lower.includes('pending') ||
      lower.includes('owes') ||
      lower.includes('receivable') ||
      lower.includes('needs to pay me') ||
      lower.includes('will pay me') ||
      lower.includes('to receive') ||
      trimmedMsg.includes('ಬಾಕಿ') ||
      trimmedMsg.includes('ಬರಬೇಕು'))
  ) {
    const customerName = extractPartyNameFromText(trimmedMsg, 'Customer');
    const toolResult = executeMCPTool(
      'add_customer_receivable',
      {
        customerName,
        amount,
        dueDate: parsedDate,
        notes: trimmedMsg,
      },
      business.name,
      workspaceId
    );
    const localizedReply = localizeVoiceToolMessage(
      voiceLang,
      toolResult.message,
      'add_customer_receivable',
      amount
    );
    return res.json({
      reply: localizedReply,
      intent: 'add_customer_receivable',
      toolExecuted: 'add_customer_receivable',
      toolResult,
      voiceLanguage: voiceLang,
      proposedAction: {
        type: 'refresh_ledger',
        title: toolResult.message,
        description: localizedReply,
      },
    });
  }

  // D. Add Upcoming Payment
  if (
    amount !== null &&
    (lower.includes('upcoming') ||
      lower.includes('coming payment') ||
      lower.includes('need to pay') ||
      lower.includes('have to pay') ||
      lower.includes('bill') ||
      lower.includes('payable') ||
      lower.includes('due on') ||
      trimmedMsg.includes('ಮುಂಬರುವ') ||
      trimmedMsg.includes('ಬಿಲ್') ||
      trimmedMsg.includes('ಕೊಡಬೇಕು'))
  ) {
    const partyName = extractPartyNameFromText(trimmedMsg, 'Supplier / Bill');
    const toolResult = executeMCPTool(
      'add_upcoming_payment',
      {
        partyName,
        amount,
        dueDate: parsedDate,
        title: trimmedMsg,
      },
      business.name,
      workspaceId
    );
    const localizedReply = localizeVoiceToolMessage(
      voiceLang,
      toolResult.message,
      'add_upcoming_payment',
      amount
    );
    return res.json({
      reply: localizedReply,
      intent: 'add_upcoming_payment',
      toolExecuted: 'add_upcoming_payment',
      toolResult,
      voiceLanguage: voiceLang,
      proposedAction: {
        type: 'refresh_ledger',
        title: toolResult.message,
        description: localizedReply,
      },
    });
  }

  // E. Immediate Expense Paid Today
  if (
    amount !== null &&
    (lower.includes('paid') ||
      lower.includes('spent') ||
      lower.includes('expense') ||
      lower.includes('bought') ||
      trimmedMsg.includes('ಖರ್ಚು'))
  ) {
    const partyName = extractPartyNameFromText(trimmedMsg, 'Store Expense');
    const toolResult = executeMCPTool(
      'record_expense',
      {
        amount,
        description: trimmedMsg,
        partyName,
        date: ANCHOR_DATE,
      },
      business.name,
      workspaceId
    );
    const localizedReply = localizeVoiceToolMessage(
      voiceLang,
      toolResult.message,
      'record_expense',
      amount
    );
    return res.json({
      reply: localizedReply,
      intent: 'record_expense',
      toolExecuted: 'record_expense',
      toolResult,
      voiceLanguage: voiceLang,
      proposedAction: {
        type: 'refresh_ledger',
        title: toolResult.message,
        description: localizedReply,
      },
    });
  }

  // F. Immediate Income Received Today
  if (
    amount !== null &&
    (lower.includes('received') ||
      lower.includes('got') ||
      lower.includes('earned') ||
      lower.includes('sale') ||
      trimmedMsg.includes('ಮಾರಾಟ'))
  ) {
    const partyName = extractPartyNameFromText(trimmedMsg, 'Customer Sale');
    const toolResult = executeMCPTool(
      'record_income',
      {
        amount,
        description: trimmedMsg,
        partyName,
        date: ANCHOR_DATE,
      },
      business.name,
      workspaceId
    );
    const localizedReply = localizeVoiceToolMessage(
      voiceLang,
      toolResult.message,
      'record_income',
      amount
    );
    return res.json({
      reply: localizedReply,
      intent: 'record_income',
      toolExecuted: 'record_income',
      toolResult,
      voiceLanguage: voiceLang,
      proposedAction: {
        type: 'refresh_ledger',
        title: toolResult.message,
        description: localizedReply,
      },
    });
  }

  // G. General Summary with ML Follow-Up Insight
  const pendingTotal = openPending.reduce(
    (s, t) => s + Math.max(0, t.amount - (t.paidAmount || 0)),
    0
  );
  const upcomingTotal = openUpcoming.reduce(
    (s, t) => s + Math.max(0, t.amount - (t.paidAmount || 0)),
    0
  );
  const summaryReply = localizeVoiceSummary(
    voiceLang,
    business.currentCash,
    pendingTotal,
    openPending.length,
    upcomingTotal,
    openUpcoming.length,
    advice.followUpQueue[0]?.partyName,
    advice.horizons.days30.lowestBalance,
    advice.horizons.days30.lowestBalanceDate
  );

  return res.json({
    reply: summaryReply,
    intent: 'general_query',
    voiceLanguage: voiceLang,
    proposedAction: null,
  });
}

app.post('/api/vanta/chat', handleVantaChat);
app.post('/api/gemini/chat', handleVantaChat);

// 4. Genuine Multimodal + Local Tesseract OCR Invoice / Bill Scanner API (ZERO Fake Fallback Data!)
app.post('/api/invoice/scan', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', businessName = '' } = req.body || {};

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({
        success: false,
        code: 'EMPTY_UPLOAD',
        isReadableDocument: false,
        qualityWarning: 'No bill photo or PDF document was received. Please select a valid image or PDF file.',
      });
    }

    // Properly strip any data URI header (image/jpeg, image/png, image/webp, application/pdf, etc.)
    const cleanBase64 = String(imageBase64).replace(/^data:[^;]+;base64,/, '').trim();
    if (cleanBase64.length < 32) {
      return res.status(400).json({
        success: false,
        code: 'CORRUPT_FILE',
        isReadableDocument: false,
        qualityWarning: 'The uploaded file appears empty or corrupted. Please try a clearer photo or PDF.',
      });
    }

    const fileBuffer = Buffer.from(cleanBase64, 'base64');
    if (fileBuffer.length < 24) {
      return res.status(400).json({
        success: false,
        code: 'CORRUPT_FILE',
        isReadableDocument: false,
        qualityWarning: 'The uploaded file appears empty or corrupted. Please try a clearer photo or PDF.',
      });
    }

    // Pre-screen tiny, blank, or solid-color raster images before calling any vision model
    const viability = inspectImageQualityViability(fileBuffer, mimeType || 'image/jpeg');
    if (!viability.viable) {
      return res.status(422).json({
        success: false,
        code: 'UNREADABLE_IMAGE',
        isReadableDocument: false,
        qualityWarning: viability.reason,
        missingFields: ['partyName', 'totalAmount', 'invoiceNumber', 'invoiceDate', 'dueDate'],
        partyName: '',
        type: 'outflow',
        invoiceNumber: '',
        invoiceDate: '',
        dueDate: '',
        totalAmount: 0,
        paymentDetails: '',
        confidence: 'low',
      });
    }

    // Stage 1: Try Multimodal Gemini Vision Extraction when configured
    if (hasConfiguredGeminiKey()) {
      const promptText = `You are a strict, zero-hallucination Indian business invoice, receipt, and bill OCR extractor.
Today's reference date is 2026-10-25.${businessName ? ` Current shop name: ${businessName}.` : ''}
Inspect the uploaded image or PDF carefully:
1. First transcribe the first 80 characters of actual visible text into "visibleTextSnippet". If the image is blank, solid color, blurry, a non-document photo, or has no readable invoice text, set "visibleTextSnippet" to "" and "isReadableDocument" to false, and explain why in "qualityWarning".
2. Extract ONLY fields that actually appear verbatim on the document. NEVER invent or fabricate company names, invoice numbers, dates, or amounts!
3. If any field (such as dueDate, invoiceNumber, invoiceDate, partyName, or totalAmount) is missing or illegible on the bill, leave string fields as "" (or 0 for missing numeric amounts) and list the missing field names in "missingFields".
4. Convert visible dates to YYYY-MM-DD format. Extract UPI IDs, bank account/IFSC, credit terms (e.g. "Net 15 days"), or advance paid into "paymentDetails".`;

      const geminiModelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
      for (const modelName of geminiModelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: {
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType || 'image/jpeg',
                    data: cleanBase64,
                  },
                },
                { text: promptText },
              ],
            },
            config: {
              temperature: 0,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  isReadableDocument: { type: Type.BOOLEAN },
                  visibleTextSnippet: { type: Type.STRING },
                  qualityWarning: { type: Type.STRING },
                  missingFields: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  partyName: { type: Type.STRING },
                  type: { type: Type.STRING },
                  invoiceNumber: { type: Type.STRING },
                  invoiceDate: { type: Type.STRING },
                  dueDate: { type: Type.STRING },
                  totalAmount: { type: Type.NUMBER },
                  subtotal: { type: Type.NUMBER },
                  taxAmount: { type: Type.NUMBER },
                  paymentDetails: { type: Type.STRING },
                  category: { type: Type.STRING },
                  title: { type: Type.STRING },
                  confidence: { type: Type.STRING },
                  notes: { type: Type.STRING },
                },
                required: ['isReadableDocument', 'visibleTextSnippet'],
              },
            },
          });

          const parsed = JSON.parse(response.text || '{}');
          const snippet = String(parsed.visibleTextSnippet || '').trim();
          const readable =
            parsed.isReadableDocument === true &&
            snippet.length >= 6 &&
            (Boolean(parsed.partyName?.trim()) || Number(parsed.totalAmount) > 0);

          if (!readable) {
            return res.status(422).json({
              success: false,
              isReadableDocument: false,
              extractionMethod: 'gemini_vision',
              qualityWarning:
                parsed.qualityWarning ||
                'Could not read clear invoice text from this image. No values were fabricated — please upload a clearer bill photo or enter the fields manually below.',
              missingFields: [
                'partyName',
                'totalAmount',
                'invoiceNumber',
                'invoiceDate',
                'dueDate',
              ],
              partyName: '',
              type: 'outflow',
              invoiceNumber: '',
              invoiceDate: '',
              dueDate: '',
              totalAmount: 0,
              paymentDetails: '',
              confidence: 'low',
            });
          }

          const missing: string[] = Array.isArray(parsed.missingFields)
            ? [...parsed.missingFields]
            : [];
          if (!parsed.partyName?.trim() && !missing.includes('partyName'))
            missing.push('partyName');
          if (!(Number(parsed.totalAmount) > 0) && !missing.includes('totalAmount'))
            missing.push('totalAmount');
          if (!parsed.invoiceNumber?.trim() && !missing.includes('invoiceNumber'))
            missing.push('invoiceNumber');
          if (!parsed.invoiceDate?.trim() && !missing.includes('invoiceDate'))
            missing.push('invoiceDate');
          if (!parsed.dueDate?.trim() && !missing.includes('dueDate'))
            missing.push('dueDate');

          return res.json({
            success: true,
            isReadableDocument: true,
            extractionMethod: 'gemini_vision',
            qualityWarning:
              parsed.qualityWarning ||
              (missing.length > 0
                ? `Some fields were not visible on the bill (${missing.join(', ')}) — please review or enter them manually below.`
                : ''),
            missingFields: missing,
            partyName: String(parsed.partyName || '').trim(),
            type: parsed.type === 'outflow' ? 'outflow' : 'inflow',
            invoiceNumber: String(parsed.invoiceNumber || '').trim(),
            invoiceDate: isValidISODate(String(parsed.invoiceDate || '').trim())
              ? String(parsed.invoiceDate).trim()
              : '',
            dueDate: isValidISODate(String(parsed.dueDate || '').trim())
              ? String(parsed.dueDate).trim()
              : '',
            totalAmount:
              Number(parsed.totalAmount) > 0 ? Math.round(Number(parsed.totalAmount)) : 0,
            subtotal:
              Number(parsed.subtotal) > 0 ? Math.round(Number(parsed.subtotal)) : undefined,
            taxAmount:
              Number(parsed.taxAmount) > 0 ? Math.round(Number(parsed.taxAmount)) : undefined,
            paymentDetails: String(parsed.paymentDetails || '').trim(),
            category:
              parsed.category || (parsed.type === 'outflow' ? 'supplier' : 'b2b_invoice'),
            title: String(parsed.title || '').trim(),
            confidence:
              parsed.confidence === 'high' || parsed.confidence === 'medium'
                ? parsed.confidence
                : 'low',
            notes: String(parsed.notes || '').trim(),
          });
        } catch (geminiErr: any) {
          console.warn(
            `Gemini OCR (${modelName}) unavailable, trying next engine:`,
            geminiErr?.message?.slice(0, 140)
          );
        }
      }
    }

    // Stage 2: Genuine Local OCR (Tesseract.js for images / PDF stream parser for PDFs)
    const localOcrResult = await extractInvoiceFromBufferLocal(
      fileBuffer,
      mimeType || 'image/jpeg',
      String(businessName || '')
    );

    if (!localOcrResult.isReadableDocument) {
      return res.status(422).json(localOcrResult);
    }

    return res.json(localOcrResult);
  } catch (error: any) {
    console.warn('Invoice OCR extraction error:', error?.message);
    return res.status(502).json({
      success: false,
      code: 'OCR_EXTRACTION_ERROR',
      isReadableDocument: false,
      qualityWarning:
        'Could not extract fields from this image automatically. Please check image clarity or enter the bill details manually below.',
    });
  }
});

// 5. Legal Notice Decoder API
app.post('/api/notices/analyze', async (req, res) => {
  const { textContent, fileBase64, mimeType, fileName, businessName = 'Sharma Stores' } =
    req.body || {};
  const fallbackSampleKey = guessBestSampleKey(`${fileName || ''} ${textContent || ''}`);

  try {
    if (!textContent && !fileBase64) {
      return res.json({
        success: false,
        error: 'Please provide notice text, a PDF, or an image to analyze.',
        fallbackSampleKey,
      });
    }

    if (!hasConfiguredGeminiKey()) {
      return res.json({
        success: false,
        fallback: true,
        error: 'Live Gemini API key is not configured — showing verified sample notice.',
        fallbackSampleKey,
      });
    }

    const maskedInput = textContent ? maskSensitiveIndianIDs(String(textContent)) : null;

    const systemInstruction = `You are VANTA, an intelligent, trusted Indian shop legal notice decoder helping small shopkeepers understand government or legal notices in simple, clear words.
Reference date: Sunday, 25 October 2026 (2026-10-25). Business: ${businessName}. Always use ₹ symbol (never "Rs"). Replace raw IDs with [PAN-MASKED], [AADHAAR-MASKED], [GSTIN-MASKED].`;

    const parts: any[] = [];
    if (fileBase64) {
      const cleanBase64 = String(fileBase64).replace(/^data:[^;]+;base64,/, '');
      parts.push({
        inlineData: {
          mimeType: mimeType || 'application/pdf',
          data: cleanBase64,
        },
      });
    }
    if (maskedInput?.maskedText) {
      parts.push({
        text: `Analyze this Indian shop notice (personal IDs pre-masked):\n\n${maskedInput.maskedText}`,
      });
    } else {
      parts.push({
        text: 'Analyze this uploaded Indian shop legal or tax notice and extract all required fields in simple language.',
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const rawJson = JSON.parse(response.text || '{}');
    const sanitized = sanitizeDeepStrings(rawJson);
    res.json({
      success: true,
      notice: sanitized,
      maskedCount: maskedInput?.maskedCount || 0,
      maskedTypes: maskedInput?.typesFound || [],
    });
  } catch (error: any) {
    console.warn('Notice analysis fallback triggered:', error?.message);
    res.json({
      success: false,
      fallback: true,
      error: error?.message || 'Unable to reach Gemini right now.',
      fallbackSampleKey,
    });
  }
});

// 6. Text to Speech API (gemini-3.8-flash-lite-tts) — English & Kannada Voice Assistant
app.post('/api/speech/synthesize', async (req, res) => {
  try {
    const { text, language = 'en' } = req.body || {};
    const voiceLang = language === 'kn' ? 'kn' : 'en';
    if (!text || !hasConfiguredGeminiKey()) {
      return res.json({ available: false });
    }

    const ttsResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: String(text).slice(0, 420),
              speechMetadata: {
                style:
                  voiceLang === 'kn'
                    ? 'Warm, calm, clear Kannada financial assistant VANTA'
                    : 'Warm, calm, clear Indian English financial assistant VANTA',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Charon' },
          },
        },
      },
    });

    const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.json({ available: false });
    }

    res.json({ available: true, audioData: base64Audio, format: 'audio/wav' });
  } catch (err: any) {
    console.warn('Server TTS fallback to browser speechSynthesis:', err?.message);
    res.json({ available: false });
  }
});

// Setup Vite or Static File Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const disableHmr = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: disableHmr ? false : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`RupiVanta Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
