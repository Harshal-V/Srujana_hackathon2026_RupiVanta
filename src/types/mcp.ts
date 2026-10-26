/**
 * Model Context Protocol (MCP) Compatible Tool Schemas & Dispatcher Types
 * Provides a secure internal tool dispatcher with an explicit external MCP transport hook.
 */

export interface MCPToolParameterProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  enum?: string[];
}

export interface MCPToolDeclaration {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, MCPToolParameterProperty>;
    required?: string[];
  };
}

export interface MCPStatusInfo {
  mode: 'internal_dispatcher_mcp_ready' | 'external_mcp_connected';
  externalServerConnected: boolean;
  authEnforced: boolean;
  duplicateProtection: boolean;
  registeredToolCount: number;
}

export interface MCPToolCallRequest {
  toolName: string;
  arguments: Record<string, any>;
  callerId?: string;
  shopName?: string;
  idempotencyKey?: string;
}

export interface MCPToolCallResult {
  toolName: string;
  success: boolean;
  message: string;
  data?: any;
  stateSnapshot?: {
    business: any;
    transactions: any[];
    customers: any[];
    people?: any[];
  };
  affectedRecords?: {
    receivablesUpdated?: boolean;
    expensesUpdated?: boolean;
    forecastRecalculated?: boolean;
    customerCreatedOrUpdated?: boolean;
    scenarioSimulated?: boolean;
  };
  error?: string;
}

export const MCP_TOOL_DEFINITIONS: MCPToolDeclaration[] = [
  {
    name: 'add_customer_receivable',
    description:
      'Add a new pending customer receivable (money owed to the shop) with customer name, rupee amount, and due date.',
    inputSchema: {
      type: 'object',
      properties: {
        customerName: {
          type: 'string',
          description: 'Customer or buyer business name (e.g. Rakesh Traders, Royal Kirana Stores).',
        },
        amount: {
          type: 'number',
          description: 'Positive amount in Indian Rupees (₹) owed by the customer.',
        },
        dueDate: {
          type: 'string',
          description: 'Expected payment due date in YYYY-MM-DD format (e.g. 2026-10-31).',
        },
        invoiceNumber: {
          type: 'string',
          description: 'Optional invoice or bill identifier (e.g. INV-420).',
        },
        notes: {
          type: 'string',
          description: 'Optional description of goods sold or credit terms.',
        },
      },
      required: ['customerName', 'amount', 'dueDate'],
    },
  },
  {
    name: 'record_expense',
    description:
      'Record a business expense or supplier payable bill. If paidToday is true (or date <= anchor date and already paid), deducts from available cash; if scheduled for a future due date, adds to upcoming payables.',
    inputSchema: {
      type: 'object',
      properties: {
        amount: {
          type: 'number',
          description: 'Positive expense amount in Indian Rupees (₹).',
        },
        category: {
          type: 'string',
          description: 'Expense category: supplier, rent, wages, utilities, taxes, or other.',
          enum: ['supplier', 'rent', 'wages', 'utilities', 'taxes', 'other'],
        },
        date: {
          type: 'string',
          description: 'Expense or bill due date in YYYY-MM-DD format.',
        },
        description: {
          type: 'string',
          description: 'Short description of the expense or bill.',
        },
        partyName: {
          type: 'string',
          description: 'Supplier, vendor, or payee name.',
        },
        paidToday: {
          type: 'boolean',
          description: 'True if cash was already paid out today; false if it is an upcoming payable bill.',
        },
      },
      required: ['amount'],
    },
  },
  {
    name: 'record_income',
    description: 'Record confirmed cash or UPI sales income received into the shop today.',
    inputSchema: {
      type: 'object',
      properties: {
        amount: {
          type: 'number',
          description: 'Positive amount in Indian Rupees (₹) received.',
        },
        category: {
          type: 'string',
          description: 'Income category: retail_sales, b2b_invoice, contract, or other.',
        },
        date: {
          type: 'string',
          description: 'Receipt date in YYYY-MM-DD format.',
        },
        description: {
          type: 'string',
          description: 'Short description of income.',
        },
        partyName: {
          type: 'string',
          description: 'Payer or counter source name.',
        },
      },
      required: ['amount'],
    },
  },
  {
    name: 'list_receivables',
    description: 'Find pending and overdue customer payments (receivables) from the live database.',
    inputSchema: {
      type: 'object',
      properties: {
        filterStatus: {
          type: 'string',
          description: 'Filter status: all, overdue, due_soon, expected, or paid.',
          enum: ['all', 'overdue', 'due_soon', 'expected', 'paid'],
        },
      },
    },
  },
  {
    name: 'list_payables',
    description: 'Find upcoming supplier bills, rent, wages, and payable expenses from the live database.',
    inputSchema: {
      type: 'object',
      properties: {
        daysAhead: {
          type: 'number',
          description: 'Optional horizon in days to filter upcoming bills (e.g. 7 or 30).',
        },
      },
    },
  },
  {
    name: 'get_cash_position',
    description:
      'Calculate current available cash, minimum reserve, free spendable cash, expected receipts, overdue receivables, upcoming payables, and maximum reserve gap.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'forecast_cash_flow',
    description:
      'Calculate deterministic cash-flow forecast over 7, 30, or 90 days using the shared financial engine.',
    inputSchema: {
      type: 'object',
      properties: {
        daysCount: {
          type: 'number',
          description: 'Number of days to forecast (7, 30, or 90).',
        },
      },
    },
  },
  {
    name: 'explain_cash_shortage',
    description:
      'Explain any predicted cash shortage or minimum-reserve breach, identifying exact dates, causing bills, delayed customer receipts, and remedies.',
    inputSchema: {
      type: 'object',
      properties: {
        daysCount: {
          type: 'number',
          description: 'Forecast horizon in days (default 30).',
        },
      },
    },
  },
  {
    name: 'analyze_payment_history',
    description: 'Inspect a customer’s historical payment reliability, average delay days, and pending invoices.',
    inputSchema: {
      type: 'object',
      properties: {
        customerName: {
          type: 'string',
          description: 'Name of the customer to inspect.',
        },
      },
      required: ['customerName'],
    },
  },
  {
    name: 'simulate_cash_flow_scenario',
    description:
      'Simulate delayed customer payments, sales drops, supplier rescheduling, or unexpected expenses WITHOUT modifying actual database records.',
    inputSchema: {
      type: 'object',
      properties: {
        customerDelayDays: {
          type: 'number',
          description: 'Simulated delay in days for customer receipts (e.g. 7).',
        },
        targetCustomerName: {
          type: 'string',
          description: 'Optional customer name whose payment is delayed (e.g. Balaji).',
        },
        salesDropPercent: {
          type: 'number',
          description: 'Simulated percentage drop in inflows (0 to 50).',
        },
        unexpectedExpense: {
          type: 'number',
          description: 'Simulated one-time unexpected expense in ₹.',
        },
        rescheduledSupplierDays: {
          type: 'number',
          description: 'Simulated days a supplier bill is deferred.',
        },
      },
    },
  },
  {
    name: 'create_payment_reminder',
    description:
      'Prepare a polite WhatsApp payment reminder message for a customer or trusted contact (requires user confirmation before sending).',
    inputSchema: {
      type: 'object',
      properties: {
        customerName: {
          type: 'string',
          description: 'Customer or contact name.',
        },
        language: {
          type: 'string',
          description: 'Language code: en, kn, hi, ta, te, or ml.',
          enum: ['en', 'kn', 'hi', 'ta', 'te', 'ml'],
        },
      },
      required: ['customerName'],
    },
  },
  {
    name: 'generate_financial_report',
    description: 'Generate a weekly or 30-day financial summary report from live ledger records.',
    inputSchema: {
      type: 'object',
      properties: {
        period: {
          type: 'string',
          description: 'Report horizon: weekly or monthly.',
          enum: ['weekly', 'monthly'],
        },
      },
    },
  },
];
