import { CashRisk, DayForecast, MonthlyProjection, Transaction, WhatIfScenario } from '../types/cashflow';

export interface ForecastResult {
  dailyForecast: DayForecast[];
  monthlyForecast: MonthlyProjection[];
  nextRisk: CashRisk | null;
  lowestBalance: number;
  lowestBalanceDate: string;
  maxReserveGap: number;
  maxReserveGapDate: string | null;
  daysBelowReserve: number;
  totalIncoming: number;
  totalOutgoing: number;
  overdueAmount: number;
  overdueCount: number;
  projectedEndingBalance: number;
  confirmedCash: number;
  availableCash: number;
  actualPaidInflows: number;
  actualPaidOutflows: number;
  expectedReceiptsTotal: number;
  upcomingPayablesTotal: number;
  minimumReserve: number;
}

const MONTHS_EN_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const MONTHS_EN_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS_EN_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Pure UTC ISO calendar helpers — completely immune to local browser/server timezone shifts.
 */
export function isValidISODate(dateStr: string): boolean {
  if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }
  const [y, m, d] = dateStr.split('-').map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

export function addDaysISO(isoDate: string, deltaDays: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + deltaDays));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export function diffDaysISO(fromISO: string, toISO: string): number {
  const [y1, m1, d1] = fromISO.split('-').map(Number);
  const [y2, m2, d2] = toISO.split('-').map(Number);
  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);
  return Math.round((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

function getWeekdayAbbrUTC(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return WEEKDAYS_EN_SHORT[dt.getUTCDay()];
}

/**
 * Format currency in Indian Rupees format with Western numerals (e.g. ₹30,000)
 */
export function formatINR(amount: number, showSign: boolean = false): string {
  const rounded = Math.round(amount);
  const isNegative = rounded < 0;
  const absVal = Math.abs(rounded);
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
    numberingSystem: 'latn',
  }).format(absVal);

  if (showSign) {
    if (rounded > 0) return `+₹${formatted}`;
    if (rounded < 0) return `-₹${formatted}`;
    return '₹0';
  }

  return isNegative ? `-₹${formatted}` : `₹${formatted}`;
}

export function formatDateLabel(dateStr: string): string {
  if (!isValidISODate(dateStr)) return dateStr;
  const [, m, d] = dateStr.split('-').map(Number);
  return `${d} ${MONTHS_EN_SHORT[m - 1]}`;
}

export function formatFullDate(dateStr: string): string {
  if (!isValidISODate(dateStr)) return dateStr;
  const [y, m, d] = dateStr.split('-').map(Number);
  const dow = getWeekdayAbbrUTC(dateStr);
  return `${dow}, ${d} ${MONTHS_EN_SHORT[m - 1]} ${y}`;
}

/**
 * Duplicate transaction check shared across client UI and backend MCP tools.
 * Prevents inserting the same unpaid receivable/payable twice for the same party, amount, type, and due date.
 */
export function findDuplicateTransaction(
  existing: Transaction[],
  candidate: {
    type: 'inflow' | 'outflow';
    partyName: string;
    amount: number;
    dueDate: string;
    invoiceNumber?: string;
  }
): Transaction | undefined {
  const normParty = (candidate.partyName || '').trim().toLowerCase();
  const normInv = (candidate.invoiceNumber || '').trim().toLowerCase();
  const roundedAmt = Math.round(Number(candidate.amount) || 0);

  return existing.find((tx) => {
    if (tx.status === 'paid') return false;
    if (normInv && tx.invoiceNumber && tx.invoiceNumber.trim().toLowerCase() === normInv) {
      return true;
    }
    return (
      tx.type === candidate.type &&
      tx.partyName.trim().toLowerCase() === normParty &&
      Math.round(tx.amount) === roundedAmt &&
      tx.dueDate === candidate.dueDate
    );
  });
}

/**
 * Deduplicate & sanitize transaction list so stale/duplicate entries or malformed dates cannot corrupt balances.
 */
export function sanitizeTransactions(
  transactions: Transaction[],
  anchorDateStr: string = '2026-10-24'
): Transaction[] {
  const seenIds = new Set<string>();
  const cleaned: Transaction[] = [];

  for (const raw of transactions) {
    if (!raw || typeof raw.amount !== 'number' || !Number.isFinite(raw.amount) || raw.amount <= 0) {
      continue;
    }
    const id = raw.id || `tx-${cleaned.length + 1}`;
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    const safeDueDate = isValidISODate(raw.dueDate) ? raw.dueDate : anchorDateStr;
    let safeStatus = raw.status;
    if (safeStatus !== 'paid' && raw.type === 'inflow' && safeDueDate < anchorDateStr) {
      safeStatus = 'overdue';
    }

    cleaned.push({
      ...raw,
      id,
      amount: Math.round(raw.amount),
      paidAmount: raw.paidAmount ? Math.max(0, Math.round(raw.paidAmount)) : 0,
      dueDate: safeDueDate,
      status: safeStatus,
    });
  }

  return cleaned;
}

/**
 * Single deterministic cash-flow calculation and forecasting engine used across every page, chart, report, simulator, and VANTA tool.
 *
 * Explicitly separates:
 * - availableCash (confirmed cash on hand + bank today)
 * - actualPaidInflows / actualPaidOutflows (already settled historical transactions)
 * - expectedReceiptsTotal (unpaid non-overdue future/current inflows)
 * - overdueAmount / overdueCount (unpaid inflows past dueDate — excluded from daily cash projections until collected)
 * - upcomingPayablesTotal (unpaid outflows)
 * - dailyForecast (day-by-day projected balances)
 * - minimumReserve & maxReserveGap (Math.max(0, minimumReserve - lowestBalance))
 */
export function calculateCashForecast(
  initialCash: number,
  minimumReserve: number,
  transactions: Transaction[],
  anchorDateStr: string = '2026-10-24',
  daysCount: number = 30,
  scenario: WhatIfScenario | null = null
): ForecastResult {
  const safeAnchor = isValidISODate(anchorDateStr) ? anchorDateStr : '2026-10-24';
  const safeInitialCash = Math.round(Number(initialCash) || 0);
  const safeMinReserve = Math.max(0, Math.round(Number(minimumReserve) || 0));
  const safeDaysCount = Math.max(1, Math.min(365, Math.round(Number(daysCount) || 30)));

  const baseSanitized = sanitizeTransactions(transactions, safeAnchor);

  // Actual settled transactions (already reflected in availableCash, tracked separately)
  const actualPaidInflows = baseSanitized
    .filter((t) => t.type === 'inflow' && t.status === 'paid')
    .reduce((sum, t) => sum + t.amount, 0);

  const actualPaidOutflows = baseSanitized
    .filter((t) => t.type === 'outflow' && t.status === 'paid')
    .reduce((sum, t) => sum + t.amount, 0);

  // Clone and adapt transactions based on non-mutating What-If scenario
  let activeTransactions: Transaction[] = baseSanitized.map((t) => ({ ...t }));

  if (scenario) {
    activeTransactions = activeTransactions.map((tx) => {
      const cloned = { ...tx };

      // Customer delay scenario (only shifts unpaid expected inflows)
      if (
        scenario.customerDelayDays > 0 &&
        cloned.type === 'inflow' &&
        cloned.status !== 'paid' &&
        cloned.status !== 'overdue' &&
        (!scenario.targetCustomerName ||
          cloned.partyName.toLowerCase().includes(scenario.targetCustomerName.toLowerCase()))
      ) {
        cloned.dueDate = addDaysISO(cloned.dueDate, scenario.customerDelayDays);
      }

      // Reschedule supplier scenario
      if (
        scenario.rescheduledSupplierDays > 0 &&
        cloned.type === 'outflow' &&
        cloned.status !== 'paid' &&
        (!scenario.targetSupplierName ||
          cloned.partyName.toLowerCase().includes(scenario.targetSupplierName.toLowerCase()))
      ) {
        cloned.dueDate = addDaysISO(cloned.dueDate, scenario.rescheduledSupplierDays);
      }

      // Sales drop scenario
      if (scenario.salesDropPercent > 0 && cloned.type === 'inflow' && cloned.status !== 'paid') {
        cloned.amount = Math.round(cloned.amount * (1 - scenario.salesDropPercent / 100));
      }

      return cloned;
    });

    // Unexpected expense scenario injection
    if (scenario.unexpectedExpense > 0) {
      activeTransactions.push({
        id: 'scenario-unexpected-exp',
        type: 'outflow',
        title: 'Emergency Machinery & Equipment Repair',
        partyName: 'Apex Industrial Service Engineers',
        amount: Math.round(scenario.unexpectedExpense),
        dueDate: addDaysISO(safeAnchor, 2),
        status: 'expected',
        category: 'other',
        notes: 'Simulated unexpected emergency expenditure.',
      });
    }

    // Additional purchase scenario injection
    if (scenario.additionalPurchaseAmount && scenario.additionalPurchaseAmount > 0) {
      activeTransactions.push({
        id: 'scenario-additional-purchase',
        type: 'outflow',
        title: scenario.additionalPurchaseName || 'Extra Inventory & Seasonal Stock Purchase',
        partyName: 'Bulk Agro Commodities Depot',
        amount: Math.round(scenario.additionalPurchaseAmount),
        dueDate: addDaysISO(safeAnchor, 3),
        status: 'expected',
        category: 'supplier',
        notes: 'Simulated planned inventory purchase.',
      });
    }

    // Remedy action: Split Malnad payment 50/50
    if (scenario.appliedActionRemedy === 'split_payment') {
      const malnadTxIndex = activeTransactions.findIndex(
        (t) => t.type === 'outflow' && t.status !== 'paid' && t.partyName.includes('Malnad')
      );
      if (malnadTxIndex >= 0) {
        const malnadTx = activeTransactions[malnadTxIndex];
        const half = Math.round(malnadTx.amount / 2);
        activeTransactions.splice(
          malnadTxIndex,
          1,
          {
            ...malnadTx,
            id: `${malnadTx.id}-part1`,
            title: `${malnadTx.title} (Tranche 1)`,
            amount: half,
            dueDate: '2026-10-29',
          },
          {
            ...malnadTx,
            id: `${malnadTx.id}-part2`,
            title: `${malnadTx.title} (Tranche 2 - Deferred)`,
            amount: malnadTx.amount - half,
            dueDate: '2026-11-04',
          }
        );
      }
    }

    // Remedy action: Early discount payment (2% off to receive on Oct 28)
    if (scenario.appliedActionRemedy === 'early_discount') {
      const balajiTxIndex = activeTransactions.findIndex(
        (t) => t.type === 'inflow' && t.status !== 'paid' && t.partyName.includes('Balaji')
      );
      if (balajiTxIndex >= 0) {
        const balajiTx = activeTransactions[balajiTxIndex];
        activeTransactions[balajiTxIndex] = {
          ...balajiTx,
          amount: Math.round(balajiTx.amount * 0.98),
          dueDate: '2026-10-28',
        };
      }
    }

    // Remedy action: Collect overdue Royal Kirana receivable promptly
    if (scenario.appliedActionRemedy === 'collect_overdue') {
      const royalIndex = activeTransactions.findIndex(
        (t) => t.type === 'inflow' && t.status !== 'paid' && t.partyName.includes('Royal')
      );
      if (royalIndex >= 0) {
        activeTransactions[royalIndex] = {
          ...activeTransactions[royalIndex],
          dueDate: '2026-10-26',
          status: 'expected',
        };
      }
    }
  }

  // Overdue receivables (past anchor date or explicitly marked overdue & unpaid)
  const overdueTransactions = activeTransactions.filter(
    (t) =>
      t.type === 'inflow' &&
      t.status !== 'paid' &&
      (t.status === 'overdue' || t.dueDate < safeAnchor)
  );
  const overdueAmount = overdueTransactions.reduce(
    (acc, t) => acc + Math.max(0, t.amount - (t.paidAmount || 0)),
    0
  );
  const overdueCount = overdueTransactions.length;

  // Expected non-overdue receipts & upcoming payables across active ledger
  const expectedReceiptsTotal = activeTransactions
    .filter(
      (t) =>
        t.type === 'inflow' &&
        t.status !== 'paid' &&
        t.status !== 'overdue' &&
        t.dueDate >= safeAnchor
    )
    .reduce((sum, t) => sum + Math.max(0, t.amount - (t.paidAmount || 0)), 0);

  const upcomingPayablesTotal = activeTransactions
    .filter((t) => t.type === 'outflow' && t.status !== 'paid' && t.dueDate >= safeAnchor)
    .reduce((sum, t) => sum + Math.max(0, t.amount - (t.paidAmount || 0)), 0);

  // Build day-by-day forecast series
  const dailyForecast: DayForecast[] = [];
  let runningCash = safeInitialCash;
  let lowestBalance = safeInitialCash;
  let lowestBalanceDate = safeAnchor;
  let daysBelowReserve = 0;
  let totalIncoming = 0;
  let totalOutgoing = 0;

  for (let i = 0; i < safeDaysCount; i++) {
    const dateStr = addDaysISO(safeAnchor, i);
    const dayLabel = formatDateLabel(dateStr);
    const dayOfWeek = getWeekdayAbbrUTC(dateStr);

    // Non-overdue unpaid inflows scheduled on dateStr
    const dayInflows = activeTransactions.filter(
      (t) =>
        t.type === 'inflow' &&
        t.dueDate === dateStr &&
        t.status !== 'paid' &&
        t.status !== 'overdue'
    );
    // Unpaid outflows scheduled on dateStr
    const dayOutflows = activeTransactions.filter(
      (t) => t.type === 'outflow' && t.dueDate === dateStr && t.status !== 'paid'
    );

    const inflowTotal = dayInflows.reduce(
      (sum, t) => sum + Math.max(0, t.amount - (t.paidAmount || 0)),
      0
    );
    const outflowTotal = dayOutflows.reduce(
      (sum, t) => sum + Math.max(0, t.amount - (t.paidAmount || 0)),
      0
    );

    const startBal = runningCash;
    const netChange = inflowTotal - outflowTotal;
    const endBal = startBal + netChange;

    totalIncoming += inflowTotal;
    totalOutgoing += outflowTotal;

    if (endBal < lowestBalance) {
      lowestBalance = endBal;
      lowestBalanceDate = dateStr;
    }

    if (endBal < safeMinReserve) {
      daysBelowReserve++;
    }

    dailyForecast.push({
      date: dateStr,
      dayLabel,
      dayOfWeek,
      startingBalance: startBal,
      inflow: inflowTotal,
      outflow: outflowTotal,
      netChange,
      endingBalance: endBal,
      isShortfall: endBal < 0,
      isBelowReserve: endBal < safeMinReserve,
      inflowItems: dayInflows,
      outflowItems: dayOutflows,
    });

    runningCash = endBal;
  }

  const maxReserveGap = Math.max(0, safeMinReserve - lowestBalance);
  const maxReserveGapDate = maxReserveGap > 0 ? lowestBalanceDate : null;

  // Identify Next Critical Cash Risk (first day endingBalance drops below minimumReserve)
  let nextRisk: CashRisk | null = null;

  for (let i = 0; i < dailyForecast.length; i++) {
    const day = dailyForecast[i];
    if (day.endingBalance < safeMinReserve) {
      const shortfallBelowZero = Math.max(0, -day.endingBalance);
      const gapBelowReserve = Math.max(0, safeMinReserve - day.endingBalance);

      const candidateOutflows =
        day.outflowItems.length > 0
          ? day.outflowItems
          : activeTransactions.filter(
              (t) => t.type === 'outflow' && t.status !== 'paid' && t.dueDate <= day.date
            );

      const majorOutflow =
        candidateOutflows.length > 0
          ? candidateOutflows.reduce(
              (max, t) => (t.amount > max.amount ? t : max),
              candidateOutflows[0]
            )
          : {
              id: 'outflow-none',
              type: 'outflow' as const,
              title: 'Scheduled Shop Expenses',
              partyName: 'Shop Payable',
              amount: day.outflow,
              dueDate: day.date,
              status: 'expected' as const,
              category: 'other' as const,
            };

      const delayedInflow = activeTransactions.find(
        (t) =>
          t.type === 'inflow' &&
          t.status !== 'paid' &&
          t.status !== 'overdue' &&
          t.dueDate > day.date
      );

      nextRisk = {
        id: `risk-${day.date}`,
        title: day.endingBalance < 0 ? 'Projected Cash Deficit' : 'Reserve Threshold Breach',
        riskDate: day.date,
        daysAway: i,
        currentCash: safeInitialCash,
        minimumReserve: safeMinReserve,
        shortfallAmount: shortfallBelowZero,
        reserveGap: gapBelowReserve,
        causingTransactions: {
          outflow: majorOutflow,
          delayedInflow,
        },
        reason: delayedInflow
          ? `Timing mismatch: Upcoming payment of ${formatINR(majorOutflow.amount)} to ${majorOutflow.partyName} on ${formatDateLabel(majorOutflow.dueDate)} is due before customer receipt of ${formatINR(delayedInflow.amount)} from ${delayedInflow.partyName} arrives on ${formatDateLabel(delayedInflow.dueDate)}.`
          : `Upcoming payment of ${formatINR(majorOutflow.amount)} to ${majorOutflow.partyName} on ${formatDateLabel(majorOutflow.dueDate)} pushes cash below your ${formatINR(safeMinReserve)} minimum reserve.`,
        recommendedAction: {
          title: 'Split supplier payment or expedite overdue receivable',
          description: `Negotiate a 50% split with ${majorOutflow.partyName} (pay ${formatINR(Math.round(majorOutflow.amount / 2))} on ${formatDateLabel(majorOutflow.dueDate)}, balance next week), OR send a WhatsApp follow-up to collect overdue customer dues.`,
          tradeoff:
            'Splitting keeps cash reserve protected and avoids bank bounce fees, subject to supplier consent. Collecting overdue bills brings cash in with zero interest.',
          actionType: 'split_payment',
          suggestedChange: {
            transactionId: majorOutflow.id,
          },
        },
      };
      break;
    }
  }

  // Build Monthly Forecast Projections from the daily series
  const monthMap = new Map<string, DayForecast[]>();
  dailyForecast.forEach((day) => {
    const monthKey = day.date.substring(0, 7);
    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, []);
    }
    monthMap.get(monthKey)!.push(day);
  });

  const monthlyForecast: MonthlyProjection[] = [];
  monthMap.forEach((monthDays, monthKey) => {
    const firstDay = monthDays[0];
    const lastDay = monthDays[monthDays.length - 1];
    const [yr, mo] = monthKey.split('-').map(Number);
    const monthLabel = `${MONTHS_EN_LONG[(mo || 1) - 1]} ${yr}`;

    const totalInflow = monthDays.reduce((acc, d) => acc + d.inflow, 0);
    const totalOutflow = monthDays.reduce((acc, d) => acc + d.outflow, 0);
    const netCashFlow = totalInflow - totalOutflow;

    let lowestBal = firstDay.endingBalance;
    let lowestDate = firstDay.date;
    monthDays.forEach((d) => {
      if (d.endingBalance < lowestBal) {
        lowestBal = d.endingBalance;
        lowestDate = d.date;
      }
    });

    monthlyForecast.push({
      monthKey,
      monthLabel,
      startingBalance: firstDay.startingBalance,
      totalInflow,
      totalOutflow,
      netCashFlow,
      closingBalance: lastDay.endingBalance,
      isBelowReserve: lowestBal < safeMinReserve,
      lowestBalance: lowestBal,
      lowestDate,
    });
  });

  return {
    dailyForecast,
    monthlyForecast,
    nextRisk,
    lowestBalance,
    lowestBalanceDate,
    maxReserveGap,
    maxReserveGapDate,
    daysBelowReserve,
    totalIncoming,
    totalOutgoing,
    overdueAmount,
    overdueCount,
    projectedEndingBalance: runningCash,
    confirmedCash: safeInitialCash,
    availableCash: safeInitialCash,
    actualPaidInflows,
    actualPaidOutflows,
    expectedReceiptsTotal,
    upcomingPayablesTotal,
    minimumReserve: safeMinReserve,
  };
}

/**
 * Validates the canonical specification example:
 * - ₹30,000 available cash
 * - ₹40,000 supplier bill due 2026-10-29
 * - ₹20,000 expected receipt on 2026-10-31
 * - ₹10,000 minimum reserve
 * Expected:
 * - Oct 29 & Oct 30 projected balance = -₹10,000
 * - Oct 31 projected balance = ₹10,000
 * - Maximum reserve gap = ₹20,000
 */
export function validateCanonicalForecastExample(): {
  valid: boolean;
  oct29Balance: number;
  oct30Balance: number;
  oct31Balance: number;
  lowestBalance: number;
  maxReserveGap: number;
} {
  const sampleTxs: Transaction[] = [
    {
      id: 'val-out-1',
      type: 'outflow',
      title: 'Supplier Bill',
      partyName: 'Supplier',
      amount: 40000,
      dueDate: '2026-10-29',
      status: 'expected',
      category: 'supplier',
    },
    {
      id: 'val-in-1',
      type: 'inflow',
      title: 'Customer Receipt',
      partyName: 'Customer',
      amount: 20000,
      dueDate: '2026-10-31',
      status: 'expected',
      category: 'b2b_invoice',
    },
  ];

  const res = calculateCashForecast(30000, 10000, sampleTxs, '2026-10-24', 10, null);
  const oct29 = res.dailyForecast.find((d) => d.date === '2026-10-29')?.endingBalance ?? NaN;
  const oct30 = res.dailyForecast.find((d) => d.date === '2026-10-30')?.endingBalance ?? NaN;
  const oct31 = res.dailyForecast.find((d) => d.date === '2026-10-31')?.endingBalance ?? NaN;

  const valid =
    oct29 === -10000 &&
    oct30 === -10000 &&
    oct31 === 10000 &&
    res.lowestBalance === -10000 &&
    res.maxReserveGap === 20000;

  return {
    valid,
    oct29Balance: oct29,
    oct30Balance: oct30,
    oct31Balance: oct31,
    lowestBalance: res.lowestBalance,
    maxReserveGap: res.maxReserveGap,
  };
}
