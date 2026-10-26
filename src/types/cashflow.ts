export type TransactionType = 'inflow' | 'outflow';

export type PaymentStatus = 'expected' | 'due_soon' | 'overdue' | 'partially_paid' | 'paid';

export type ExpenseCategory = 'supplier' | 'rent' | 'wages' | 'utilities' | 'taxes' | 'other';
export type InflowCategory = 'b2b_invoice' | 'retail_sales' | 'contract' | 'other';

export interface Transaction {
  id: string;
  customerId?: string;
  type: TransactionType;
  title: string;
  partyName: string;
  contactPhone?: string;
  amount: number;
  paidAmount?: number;
  invoiceDate?: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  promisedDate?: string | null; // Retained separately — never overwritten by ML prediction
  actualPaidDate?: string | null; // Recorded when settled
  status: PaymentStatus;
  category: ExpenseCategory | InflowCategory;
  invoiceNumber?: string;
  paymentDetails?: string;
  notes?: string;
  isRecurring?: boolean;
  isDemoData?: boolean;
  lastReminderAt?: string | null;
}

export interface MLPaymentPrediction {
  transactionId: string;
  customerId: string;
  partyName: string;
  invoiceNumber: string;
  amountRemaining: number;
  invoiceDate: string;
  dueDate: string;
  promisedDate: string | null;
  predictedDate: string;
  predictedRangeStart: string;
  predictedRangeEnd: string;
  bandDays: number;
  estimatedDelayDays: number; // predictedDate - dueDate
  currentOverdueDays: number; // max(0, anchorDate - dueDate)
  promisedVsPredictedDays: number | null; // predictedDate - promisedDate (>0 means promised earlier than predicted)
  hasOptimisticPromiseWarning: boolean;
  confidencePercent: number; // 35..94 (never 100%, never guaranteed)
  confidenceTier: 'high' | 'moderate' | 'low_baseline';
  predictionBasis: 'customer_history' | 'hybrid_shrunk' | 'cohort_baseline';
  historicalSampleCount: number;
  customerAvgDelayDays: number;
  customerDelayStdDays: number;
  explanation: string;
  promiseComparisonNote: string | null;
  delayFlagReasons: string[];
}

export interface PredictionOutcomeRecord {
  id: string;
  transactionId: string;
  customerId: string;
  partyName: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  promisedDate: string | null;
  predictedDate: string;
  predictedRangeStart: string;
  predictedRangeEnd: string;
  actualPaidDate: string;
  predictedDelayDays: number;
  actualDelayDays: number;
  absoluteErrorDays: number;
  withinPredictedRange: boolean;
  recordedAt: string;
}

export interface FollowUpRecommendation {
  transactionId: string;
  customerId: string;
  partyName: string;
  contactPhone: string;
  invoiceNumber: string;
  amountRemaining: number;
  dueDate: string;
  promisedDate: string | null;
  predictedDate: string;
  estimatedDelayDays: number;
  priority: 'urgent' | 'high' | 'normal';
  helpsPreventShortfall: boolean;
  reason: string;
  suggestedAction: string;
}

export interface ExpenseAffordabilityItem {
  transactionId: string;
  partyName: string;
  title: string;
  invoiceNumber?: string;
  amount: number;
  dueDate: string;
  projectedBalanceOnDueDate: number;
  contractualBalanceOnDueDate: number;
  verdict: 'affordable' | 'tight_dips_reserve' | 'unaffordable_shortage';
  shortfallOrReserveGap: number;
  explanation: string;
  recommendedStep: string;
}

export interface HorizonSummary {
  horizonDays: 7 | 30 | 90;
  startingCash: number;
  predictedInflows: number;
  scheduledOutflows: number;
  endingBalance: number;
  lowestBalance: number;
  lowestBalanceDate: string;
  hasShortageBelowZero: boolean;
  hasReserveBreach: boolean;
  shortageAmount: number;
  reserveGapAmount: number;
  causingOutflows: Array<{ id: string; partyName: string; amount: number; dueDate: string }>;
  affectedDelayedInvoices: Array<{
    id: string;
    partyName: string;
    invoiceNumber: string;
    amount: number;
    dueDate: string;
    predictedDate: string;
    delayDays: number;
  }>;
}

export interface FinancialAdviceReport {
  anchorDate: string;
  horizons: {
    days7: HorizonSummary;
    days30: HorizonSummary;
    days90: HorizonSummary;
  };
  followUpQueue: FollowUpRecommendation[];
  expenseAffordability: ExpenseAffordabilityItem[];
  delayCashImpactSummary: {
    lowestWithOnTimeReceipts: number;
    lowestWithMLPredictedReceipts: number;
    cashDragFromDelays: number;
    headline: string;
  };
  modelMetrics: {
    trainedInvoicesCount: number;
    evaluatedOutcomesCount: number;
    meanAbsoluteErrorDays: number;
    withinBandRatePercent: number;
  };
}

export interface DayForecast {
  date: string; // YYYY-MM-DD
  dayLabel: string; // e.g. "Sun 25"
  dayOfWeek: string;
  startingBalance: number;
  inflow: number;
  outflow: number;
  netChange: number;
  endingBalance: number;
  isShortfall: boolean; // Below 0
  isBelowReserve: boolean; // Below minimum reserve
  inflowItems: Transaction[];
  outflowItems: Transaction[];
}

export interface CashRisk {
  id: string;
  title: string;
  riskDate: string; // YYYY-MM-DD
  daysAway: number;
  currentCash: number;
  minimumReserve: number;
  shortfallAmount: number; // Below 0 gap
  reserveGap: number; // Below reserve gap
  causingTransactions: {
    outflow: Transaction;
    delayedInflow?: Transaction;
  };
  reason: string;
  recommendedAction: {
    title: string;
    description: string;
    tradeoff: string;
    actionType: 'split_payment' | 'reschedule_supplier' | 'early_discount' | 'collect_overdue';
    suggestedChange: {
      transactionId: string;
      newDate?: string;
      splitAmounts?: number[];
    };
  };
}

export interface WhatIfScenario {
  id: string;
  name: string;
  shortDescription: string;
  customerDelayDays: number; // e.g., 7 days
  targetCustomerName?: string;
  salesDropPercent: number; // e.g. 15%
  unexpectedExpense: number; // e.g. 10000
  rescheduledSupplierDays: number; // e.g. 5 days
  targetSupplierName?: string;
  additionalPurchaseAmount?: number; // e.g. 25000
  additionalPurchaseName?: string;
  appliedActionRemedy?: string;
}

export interface BusinessProfile {
  id?: string;
  name: string;
  businessType: string;
  city: string;
  state: string;
  gstin: string;
  minimumReserve: number;
  currentCash: number;
  isDemo?: boolean;
}

export interface CustomerHistoryItem {
  invoiceNumber: string;
  invoiceDate?: string;
  amount: number;
  paidAmount?: number;
  dueDate: string;
  promisedDate?: string | null;
  paidDate: string | null;
  delayDays: number;
  status: 'paid_on_time' | 'paid_late' | 'partially_paid' | 'overdue' | 'pending';
}

export interface CustomerProfile {
  id: string;
  name: string;
  category: string;
  contactPhone: string;
  totalBilled: number;
  totalPaid: number;
  overdueBalance: number;
  pendingBalance: number;
  avgPaymentDelayDays: number;
  onTimeRatePercent: number;
  paymentFrequency: string;
  reliabilityTier: 'high' | 'moderate' | 'cautious' | 'high_risk';
  isDemo?: boolean;
  cautiousEstimate: {
    expectedSettlementDate: string;
    confidenceBand: string; // e.g. "± 3 days"
    uncertaintyReason: string;
    hasSufficientHistory: boolean;
  };
  history: CustomerHistoryItem[];
}

export interface MonthlyProjection {
  monthKey: string; // e.g. "2026-10"
  monthLabel: string; // e.g. "October 2026"
  startingBalance: number;
  totalInflow: number;
  totalOutflow: number;
  netCashFlow: number;
  closingBalance: number;
  isBelowReserve: boolean;
  lowestBalance: number;
  lowestDate: string;
}

export interface ForecastAccuracyRecord {
  periodLabel: string;
  weekEnding: string;
  projectedBalance: number;
  actualBalance: number;
  variance: number;
  errorPercent: number;
  accuracyPercent: number;
  status: 'perfect' | 'minor_variance' | 'deviation';
  explanation: string;
}

export interface ProposedAction {
  id: string;
  type: 'add_transaction' | 'apply_remedy' | 'simulate_scenario' | 'send_reminder' | 'view_customer' | 'generate_report';
  title: string;
  description: string;
  data: any;
  status: 'pending' | 'confirmed' | 'cancelled' | 'executed';
}

export interface InvoiceScanResult {
  success?: boolean;
  isReadableDocument?: boolean;
  qualityWarning?: string;
  missingFields?: string[];
  partyName: string;
  type: TransactionType;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  promisedDate?: string;
  totalAmount: number;
  taxAmount?: number;
  subtotal?: number;
  paymentDetails?: string;
  category: ExpenseCategory | InflowCategory;
  title: string;
  notes?: string;
  lineItems?: Array<{ description: string; quantity: number; rate: number; amount: number }>;
  confidence: 'high' | 'medium' | 'low';
}

export interface ReminderLogEntry {
  id: string;
  transactionId: string;
  customerId?: string;
  partyName: string;
  phone: string;
  invoiceNumber: string;
  amount: number;
  language: string;
  deliveryMethod: 'whatsapp_deeplink' | 'copied_clipboard';
  createdAt: string;
}
