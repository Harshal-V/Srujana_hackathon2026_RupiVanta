import {
  CustomerHistoryItem,
  CustomerProfile,
  ExpenseAffordabilityItem,
  FinancialAdviceReport,
  FollowUpRecommendation,
  HorizonSummary,
  MLPaymentPrediction,
  PredictionOutcomeRecord,
  Transaction,
  WhatIfScenario,
} from '../types/cashflow';
import {
  addDaysISO,
  calculateCashForecast,
  diffDaysISO,
  formatDateLabel,
  formatINR,
  isValidISODate,
} from './forecastEngine';

interface SettledTrainingSample {
  customerId: string;
  category: string;
  amount: number;
  creditTermDays: number;
  partialRatio: number;
  priorEwmaDelay: number;
  priorDelayStd: number;
  actualDelayDays: number;
}

interface FittedRidgeModel {
  weights: number[]; // [intercept, ewmaDelay, delayStd, logAmtRatio, normCreditTerm, partialRatio]
  cohortMeanAmount: number;
  cohortMeanDelay: number;
  cohortStdDelay: number;
  residualRmse: number;
  trainingCount: number;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function computeMean(vals: number[]): number {
  if (vals.length === 0) return 0;
  return vals.reduce((acc, v) => acc + v, 0) / vals.length;
}

function computeStdDev(vals: number[], meanVal?: number): number {
  if (vals.length <= 1) return 0;
  const m = meanVal !== undefined ? meanVal : computeMean(vals);
  const variance =
    vals.reduce((acc, v) => acc + (v - m) * (v - m), 0) / (vals.length - 1);
  return Math.sqrt(Math.max(0, variance));
}

function computeEWMA(delaysChronological: number[], alpha: number = 0.45): number {
  if (delaysChronological.length === 0) return 0;
  let ewma = delaysChronological[0];
  for (let i = 1; i < delaysChronological.length; i++) {
    ewma = alpha * delaysChronological[i] + (1 - alpha) * ewma;
  }
  return ewma;
}

/**
 * Solves A * x = b using Gaussian elimination with partial pivoting.
 */
function solveLinearSystem(matrixA: number[][], vectorB: number[]): number[] {
  const n = vectorB.length;
  const aug = matrixA.map((row, i) => [...row, vectorB[i]]);

  for (let col = 0; col < n; col++) {
    let pivotRow = col;
    let maxAbs = Math.abs(aug[col][col]);
    for (let r = col + 1; r < n; r++) {
      const candidate = Math.abs(aug[r][col]);
      if (candidate > maxAbs) {
        maxAbs = candidate;
        pivotRow = r;
      }
    }

    if (maxAbs < 1e-9) continue;

    if (pivotRow !== col) {
      const tmp = aug[col];
      aug[col] = aug[pivotRow];
      aug[pivotRow] = tmp;
    }

    const pivotVal = aug[col][col];
    for (let c = col; c <= n; c++) {
      aug[col][c] /= pivotVal;
    }

    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = aug[r][col];
      if (Math.abs(factor) < 1e-12) continue;
      for (let c = col; c <= n; c++) {
        aug[r][c] -= factor * aug[col][c];
      }
    }
  }

  return aug.map((row) => (Number.isFinite(row[n]) ? row[n] : 0));
}

/**
 * Extracts chronological settled invoice samples from customer histories and settled ledger transactions.
 */
function collectSettledSamples(
  customers: CustomerProfile[],
  transactions: Transaction[]
): SettledTrainingSample[] {
  const samples: SettledTrainingSample[] = [];
  const seenKeys = new Set<string>();

  for (const cust of customers) {
    const settledItems = (cust.history || [])
      .filter((h) => h.paidDate && isValidISODate(h.dueDate) && isValidISODate(h.paidDate))
      .slice()
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    const runningDelays: number[] = [];

    for (const item of settledItems) {
      const actualDelay = item.paidDate
        ? diffDaysISO(item.dueDate, item.paidDate)
        : item.delayDays || 0;
      const key = `${cust.id}:${item.invoiceNumber}:${item.dueDate}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        const priorEwma =
          runningDelays.length > 0 ? computeEWMA(runningDelays) : actualDelay;
        const priorStd =
          runningDelays.length > 1 ? computeStdDev(runningDelays) : 2.5;
        const creditTerm =
          item.invoiceDate && isValidISODate(item.invoiceDate)
            ? Math.max(1, diffDaysISO(item.invoiceDate, item.dueDate))
            : 15;
        const partialRatio =
          item.paidAmount && item.amount > 0 && item.paidAmount < item.amount
            ? clamp(item.paidAmount / item.amount, 0, 1)
            : 0;

        samples.push({
          customerId: cust.id,
          category: cust.category || 'B2B',
          amount: Math.max(500, item.amount),
          creditTermDays: creditTerm,
          partialRatio,
          priorEwmaDelay: priorEwma,
          priorDelayStd: priorStd,
          actualDelayDays: actualDelay,
        });
      }
      runningDelays.push(actualDelay);
    }
  }

  // Also include settled inflow transactions that may not yet be in customer.history
  for (const tx of transactions) {
    if (
      tx.type === 'inflow' &&
      tx.status === 'paid' &&
      tx.actualPaidDate &&
      isValidISODate(tx.dueDate) &&
      isValidISODate(tx.actualPaidDate)
    ) {
      const cid = tx.customerId || `party:${tx.partyName.trim().toLowerCase()}`;
      const inv = tx.invoiceNumber || tx.id;
      const key = `${cid}:${inv}:${tx.dueDate}`;
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);

      const actualDelay = diffDaysISO(tx.dueDate, tx.actualPaidDate);
      const creditTerm =
        tx.invoiceDate && isValidISODate(tx.invoiceDate)
          ? Math.max(1, diffDaysISO(tx.invoiceDate, tx.dueDate))
          : 15;

      samples.push({
        customerId: cid,
        category: String(tx.category || 'b2b_invoice'),
        amount: Math.max(500, tx.amount),
        creditTermDays: creditTerm,
        partialRatio: 0,
        priorEwmaDelay: actualDelay,
        priorDelayStd: 2.5,
        actualDelayDays: actualDelay,
      });
    }
  }

  return samples;
}

/**
 * Fits a regularized Ridge Regression model on completed historical invoices.
 * Falls back cleanly to a domain-calibrated MSME trade-credit prior when historical count < 4.
 */
export function fitPaymentDelayModel(
  customers: CustomerProfile[],
  transactions: Transaction[]
): FittedRidgeModel {
  const samples = collectSettledSamples(customers, transactions);

  if (samples.length < 4) {
    const fallbackDelays = samples.map((s) => s.actualDelayDays);
    const meanD = fallbackDelays.length > 0 ? computeMean(fallbackDelays) : 3.2;
    return {
      // Calibrated baseline weights when workspace has very few settled invoices
      weights: [0.65, 0.78, 0.14, 0.85, 0.45, -0.9],
      cohortMeanAmount:
        samples.length > 0 ? computeMean(samples.map((s) => s.amount)) : 18000,
      cohortMeanDelay: meanD,
      cohortStdDelay: 3.6,
      residualRmse: 2.8,
      trainingCount: samples.length,
    };
  }

  const cohortMeanAmount = Math.max(
    1000,
    computeMean(samples.map((s) => s.amount))
  );
  const delays = samples.map((s) => s.actualDelayDays);
  const cohortMeanDelay = computeMean(delays);
  const cohortStdDelay = Math.max(1.5, computeStdDev(delays, cohortMeanDelay));

  const p = 6;
  const xtx: number[][] = Array.from({ length: p }, () => Array(p).fill(0));
  const xty: number[] = Array(p).fill(0);
  const lambda = 1.5;

  const featureRows: number[][] = [];

  for (const s of samples) {
    const logAmtRatio = Math.log(Math.max(500, s.amount) / cohortMeanAmount);
    const normCredit = (s.creditTermDays - 15) / 15;
    const row = [
      1,
      s.priorEwmaDelay,
      s.priorDelayStd,
      logAmtRatio,
      normCredit,
      s.partialRatio,
    ];
    featureRows.push(row);

    for (let i = 0; i < p; i++) {
      xty[i] += row[i] * s.actualDelayDays;
      for (let j = 0; j < p; j++) {
        xtx[i][j] += row[i] * row[j];
      }
    }
  }

  // L2 regularization on non-intercept coefficients
  for (let i = 1; i < p; i++) {
    xtx[i][i] += lambda;
  }

  const weights = solveLinearSystem(xtx, xty);

  // Compute empirical residual RMSE
  let sqErrSum = 0;
  for (let idx = 0; idx < samples.length; idx++) {
    const row = featureRows[idx];
    const pred = row.reduce((acc, v, k) => acc + v * weights[k], 0);
    const err = samples[idx].actualDelayDays - pred;
    sqErrSum += err * err;
  }
  const dof = Math.max(1, samples.length - p);
  const residualRmse = clamp(Math.sqrt(sqErrSum / dof), 0.8, 7.0);

  return {
    weights,
    cohortMeanAmount,
    cohortMeanDelay,
    cohortStdDelay,
    residualRmse,
    trainingCount: samples.length,
  };
}

function findMatchingCustomer(
  tx: Transaction,
  customers: CustomerProfile[]
): CustomerProfile | undefined {
  if (tx.customerId) {
    const byId = customers.find((c) => c.id === tx.customerId);
    if (byId) return byId;
  }
  const normParty = (tx.partyName || '').trim().toLowerCase();
  if (!normParty) return undefined;
  return customers.find((c) => c.name.trim().toLowerCase() === normParty);
}

/**
 * Predicts payment settlement date, range, confidence, and plain-language explanation
 * for a single unpaid customer receivable.
 * Never overwrites promisedDate with predictedDate.
 */
export function predictInvoicePayment(
  tx: Transaction,
  customers: CustomerProfile[],
  model: FittedRidgeModel,
  anchorDateStr: string = '2026-10-25'
): MLPaymentPrediction {
  const safeAnchor = isValidISODate(anchorDateStr) ? anchorDateStr : '2026-10-25';
  const safeDue = isValidISODate(tx.dueDate) ? tx.dueDate : safeAnchor;
  const safeInvoiceDate =
    tx.invoiceDate && isValidISODate(tx.invoiceDate)
      ? tx.invoiceDate
      : addDaysISO(safeDue, -15);
  const promisedDate =
    tx.promisedDate && isValidISODate(tx.promisedDate) ? tx.promisedDate : null;

  const matchedCustomer = findMatchingCustomer(tx, customers);
  const customerId =
    matchedCustomer?.id ||
    tx.customerId ||
    `cust-auto-${tx.partyName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  const settledHistory = (matchedCustomer?.history || [])
    .filter((h) => h.paidDate && isValidISODate(h.dueDate) && isValidISODate(h.paidDate))
    .slice()
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const n = settledHistory.length;
  const historicalDelays = settledHistory.map((h) =>
    h.paidDate ? diffDaysISO(h.dueDate, h.paidDate) : h.delayDays || 0
  );

  const isRetailWalkIn =
    tx.category === 'retail_sales' ||
    (matchedCustomer?.category || '').toLowerCase().includes('over-the-counter') ||
    tx.partyName.toLowerCase().includes('walk-in');

  // Comparable cohort prior for new customers (0 history)
  const cohortPriorDelay = isRetailWalkIn
    ? 0.2
    : clamp(model.cohortMeanDelay, 1.5, 6.0);
  const cohortPriorStd = isRetailWalkIn ? 0.8 : Math.max(3.2, model.cohortStdDelay);

  const custMeanDelay = n > 0 ? computeMean(historicalDelays) : cohortPriorDelay;
  const custEwmaDelay = n > 0 ? computeEWMA(historicalDelays) : cohortPriorDelay;
  const custStdDelay =
    n > 1 ? computeStdDev(historicalDelays, custMeanDelay) : cohortPriorStd;

  const amountRemaining = Math.max(0, tx.amount - (tx.paidAmount || 0));
  const partialRatio =
    tx.amount > 0 && tx.paidAmount
      ? clamp(tx.paidAmount / tx.amount, 0, 1)
      : 0;
  const creditTermDays = Math.max(1, diffDaysISO(safeInvoiceDate, safeDue));

  // Ridge regression feature vector
  const logAmtRatio = Math.log(
    Math.max(500, tx.amount) / Math.max(1000, model.cohortMeanAmount)
  );
  const normCredit = (creditTermDays - 15) / 15;
  const xVec = [
    1,
    custEwmaDelay,
    custStdDelay,
    logAmtRatio,
    normCredit,
    partialRatio,
  ];
  const rawRegressionDelay = xVec.reduce(
    (sum, feat, i) => sum + feat * (model.weights[i] || 0),
    0
  );

  // Empirical Bayes shrinkage between customer-specific behavior and cohort prior
  const kShrink = 2.5;
  const shrinkAlpha = n / (n + kShrink);
  const blendedUnconditionalDelay =
    n === 0
      ? cohortPriorDelay + 0.5 * logAmtRatio + 0.3 * normCredit - 0.8 * partialRatio
      : shrinkAlpha * (0.6 * custEwmaDelay + 0.4 * rawRegressionDelay) +
        (1 - shrinkAlpha) * cohortPriorDelay;

  const currentOverdueDays = Math.max(0, diffDaysISO(safeDue, safeAnchor));

  // Conditional expectation given invoice is still unpaid on anchorDate
  let estimatedDelayDays = Math.round(clamp(blendedUnconditionalDelay, -2, 45));
  if (isRetailWalkIn && currentOverdueDays === 0 && n >= 3 && custMeanDelay <= 0.5) {
    estimatedDelayDays = 0;
  }

  if (currentOverdueDays > 0) {
    // Cannot settle before anchorDate; conditional expected wait past today
    const residualWait = Math.max(
      2,
      Math.round(clamp(custStdDelay * 0.85, 2, 8))
    );
    estimatedDelayDays = Math.max(
      estimatedDelayDays,
      currentOverdueDays + residualWait
    );
  } else {
    // Even if dueDate is today, ensure predictedDate >= safeAnchor
    const candidatePred = addDaysISO(safeDue, estimatedDelayDays);
    if (candidatePred < safeAnchor) {
      estimatedDelayDays = diffDaysISO(safeDue, safeAnchor);
    }
  }

  const predictedDate = addDaysISO(safeDue, estimatedDelayDays);

  // Uncertainty band (80% prediction interval)
  const effectiveStd =
    n >= 3
      ? Math.sqrt(0.65 * custStdDelay * custStdDelay + 0.35 * model.residualRmse * model.residualRmse)
      : n >= 1
      ? Math.sqrt(0.5 * custStdDelay * custStdDelay + 0.5 * cohortPriorStd * cohortPriorStd) + 1.0
      : cohortPriorStd + 1.2;

  const rawBandDays = isRetailWalkIn && n >= 3
    ? 1
    : clamp(Math.round(1.28 * effectiveStd), 1, 9);

  // Ensure range start is not in the past relative to anchorDate for unpaid bills
  const rawRangeStart = addDaysISO(predictedDate, -rawBandDays);
  const predictedRangeStart =
    rawRangeStart < safeAnchor ? safeAnchor : rawRangeStart;
  const predictedRangeEnd = addDaysISO(predictedDate, rawBandDays);

  const predictionBasis: MLPaymentPrediction['predictionBasis'] =
    n >= 3 ? 'customer_history' : n >= 1 ? 'hybrid_shrunk' : 'cohort_baseline';

  // Calibrated confidence percentage (never 100%, never guaranteed)
  const rawConfidence =
    89 -
    rawBandDays * 4.8 -
    (n === 0 ? 20 : n < 3 ? 9 : 0) -
    (currentOverdueDays > 0 ? Math.min(10, Math.round(currentOverdueDays * 0.8)) : 0);
  const confidencePercent = clamp(Math.round(rawConfidence), 38, 93);

  const confidenceTier: MLPaymentPrediction['confidenceTier'] =
    confidencePercent >= 76 && n >= 3
      ? 'high'
      : confidencePercent >= 56
      ? 'moderate'
      : 'low_baseline';

  // Promise comparison (if customer promised an earlier date than ML predicts)
  const promisedVsPredictedDays = promisedDate
    ? diffDaysISO(promisedDate, predictedDate)
    : null;
  const hasOptimisticPromiseWarning = Boolean(
    promisedDate && promisedVsPredictedDays !== null && promisedVsPredictedDays > 0
  );

  const invoiceLabel = tx.invoiceNumber || tx.id;
  let promiseComparisonNote: string | null = null;
  if (promisedDate && promisedVsPredictedDays !== null) {
    if (promisedDate < safeAnchor) {
      promiseComparisonNote = `${tx.partyName} promised to pay on ${formatDateLabel(promisedDate)}, which has already passed. Based on ${n > 0 ? `their last ${n} bills (usually about ${Math.round(custMeanDelay)} days after due date)` : 'usual shop credit patterns'}, payment is likely around ${formatDateLabel(predictedDate)} — send a polite reminder today.`;
    } else if (promisedVsPredictedDays > 0) {
      promiseComparisonNote =
        n > 0
          ? `${tx.partyName} promised ${formatDateLabel(promisedDate)}, which we keep saved. However, across their last ${n} bills they usually took about ${Math.round(custMeanDelay)} extra days after the due date — so plan your cash safely for ${formatDateLabel(predictedDate)} (${promisedVsPredictedDays} day${promisedVsPredictedDays === 1 ? '' : 's'} later).`
          : `${tx.partyName} promised ${formatDateLabel(promisedDate)}. Because this is their first bill with you, expect payment around ${formatDateLabel(predictedDate)} (${formatDateLabel(predictedRangeStart)}–${formatDateLabel(predictedRangeEnd)}).`;
    } else if (promisedVsPredictedDays === 0) {
      promiseComparisonNote = `${tx.partyName}'s promised date (${formatDateLabel(promisedDate)}) matches their usual payment pattern (${formatDateLabel(predictedDate)}).`;
    } else {
      promiseComparisonNote = `${tx.partyName} asked until ${formatDateLabel(promisedDate)}, which is ${Math.abs(promisedVsPredictedDays)} day${Math.abs(promisedVsPredictedDays) === 1 ? '' : 's'} later than their usual payment habit (${formatDateLabel(predictedDate)}).`;
    }
  }

  // Simple everyday explanation & delay reasons (no technical jargon)
  const delayFlagReasons: string[] = [];
  if (currentOverdueDays > 0) {
    delayFlagReasons.push(
      `Bill due date (${formatDateLabel(safeDue)}) passed ${currentOverdueDays} day${currentOverdueDays === 1 ? '' : 's'} ago.`
    );
  }
  if (promisedDate && promisedDate < safeAnchor) {
    delayFlagReasons.push(
      `Missed their promised payment date (${formatDateLabel(promisedDate)}).`
    );
  } else if (hasOptimisticPromiseWarning && promisedDate) {
    delayFlagReasons.push(
      `Promised ${formatDateLabel(promisedDate)}, while past bills point closer to ${formatDateLabel(predictedDate)}.`
    );
  }
  if (n > 0 && custMeanDelay >= 2.0) {
    const lateCount = historicalDelays.filter((d) => d > 0).length;
    delayFlagReasons.push(
      `Paid after the due date on ${lateCount} of ${n} past bills (usually about ${Math.round(custMeanDelay)} days late).`
    );
  }
  if (partialRatio > 0 && partialRatio < 1) {
    delayFlagReasons.push(
      `Part payment received (${Math.round(partialRatio * 100)}%); remaining ${formatINR(amountRemaining)} is still pending.`
    );
  }
  if (n === 0) {
    delayFlagReasons.push(
      `First credit bill for this customer — check in politely around the due date.`
    );
  }

  let explanation = '';
  if (n === 0) {
    explanation = `${tx.partyName} is a new customer with no past bills on record yet. Based on usual shop credit patterns, ${invoiceLabel} should arrive around ${formatDateLabel(predictedDate)} (between ${formatDateLabel(predictedRangeStart)} and ${formatDateLabel(predictedRangeEnd)}).`;
  } else if (currentOverdueDays > 0) {
    explanation = `This bill is ${currentOverdueDays} day${currentOverdueDays === 1 ? '' : 's'} past its ${formatDateLabel(safeDue)} due date. Looking at their last ${n} bills, payment is likely around ${formatDateLabel(predictedDate)} (between ${formatDateLabel(predictedRangeStart)} and ${formatDateLabel(predictedRangeEnd)}).`;
  } else if (estimatedDelayDays <= 0) {
    explanation = `${tx.partyName} paid their last ${n} bills right on time. Based on this steady habit, ${invoiceLabel} is expected around ${formatDateLabel(predictedDate)} (between ${formatDateLabel(predictedRangeStart)} and ${formatDateLabel(predictedRangeEnd)}).`;
  } else {
    explanation = `Looking at ${tx.partyName}'s last ${n} bills, they usually pay about ${Math.round(custMeanDelay)} days after the due date. So ${invoiceLabel} (${formatINR(tx.amount)}) is expected around ${formatDateLabel(predictedDate)} (between ${formatDateLabel(predictedRangeStart)} and ${formatDateLabel(predictedRangeEnd)}).`;
  }

  return {
    transactionId: tx.id,
    customerId,
    partyName: tx.partyName,
    invoiceNumber: invoiceLabel,
    amountRemaining,
    invoiceDate: safeInvoiceDate,
    dueDate: safeDue,
    promisedDate,
    predictedDate,
    predictedRangeStart,
    predictedRangeEnd,
    bandDays: rawBandDays,
    estimatedDelayDays,
    currentOverdueDays,
    promisedVsPredictedDays,
    hasOptimisticPromiseWarning,
    confidencePercent,
    confidenceTier,
    predictionBasis,
    historicalSampleCount: n,
    customerAvgDelayDays: Number(custMeanDelay.toFixed(1)),
    customerDelayStdDays: Number(custStdDelay.toFixed(1)),
    explanation,
    promiseComparisonNote,
    delayFlagReasons,
  };
}

/**
 * Predicts payment dates for all unpaid inflow transactions.
 */
export function predictAllReceivables(
  transactions: Transaction[],
  customers: CustomerProfile[],
  anchorDateStr: string = '2026-10-25'
): {
  predictionsByTxId: Record<string, MLPaymentPrediction>;
  predictionsList: MLPaymentPrediction[];
  model: FittedRidgeModel;
} {
  const model = fitPaymentDelayModel(customers, transactions);
  const predictionsByTxId: Record<string, MLPaymentPrediction> = {};
  const predictionsList: MLPaymentPrediction[] = [];

  for (const tx of transactions) {
    if (tx.type === 'inflow' && tx.status !== 'paid') {
      const pred = predictInvoicePayment(tx, customers, model, anchorDateStr);
      predictionsByTxId[tx.id] = pred;
      predictionsList.push(pred);
    }
  }

  predictionsList.sort((a, b) => a.predictedDate.localeCompare(b.predictedDate));
  return { predictionsByTxId, predictionsList, model };
}

/**
 * Builds a transaction array projected onto ML-predicted dates (or contractual/promised dates for comparison)
 * without mutating original records or overwriting promisedDate/dueDate in storage.
 */
export function buildProjectedTransactionsForForecast(
  transactions: Transaction[],
  predictionsByTxId: Record<string, MLPaymentPrediction>,
  mode: 'ml_predicted' | 'contractual_due' | 'promised' = 'ml_predicted',
  anchorDateStr: string = '2026-10-25'
): Transaction[] {
  return transactions.map((tx) => {
    if (tx.type !== 'inflow' || tx.status === 'paid') {
      return { ...tx };
    }

    const pred = predictionsByTxId[tx.id];
    if (mode === 'ml_predicted' && pred) {
      return {
        ...tx,
        dueDate: pred.predictedDate >= anchorDateStr ? pred.predictedDate : anchorDateStr,
        status: 'expected',
      };
    }

    if (mode === 'promised' && tx.promisedDate && isValidISODate(tx.promisedDate)) {
      const targetDate = tx.promisedDate >= anchorDateStr ? tx.promisedDate : anchorDateStr;
      return {
        ...tx,
        dueDate: targetDate,
        status: 'expected',
      };
    }

    // Contractual mode: if not overdue yet, use dueDate; if overdue, keep as overdue (excluded until collected)
    return { ...tx };
  });
}

/**
 * Computes prediction accuracy metrics from recorded actual outcomes (and historical leave-one-out backtest if outcomes are empty).
 */
export function evaluatePredictionAccuracy(
  outcomes: PredictionOutcomeRecord[],
  customers: CustomerProfile[],
  transactions: Transaction[]
): {
  evaluatedCount: number;
  meanAbsoluteErrorDays: number;
  withinBandRatePercent: number;
  hasLiveRecordedOutcomes: boolean;
} {
  if (outcomes && outcomes.length > 0) {
    const mae =
      outcomes.reduce((s, o) => s + Math.abs(o.absoluteErrorDays), 0) /
      outcomes.length;
    const withinCount = outcomes.filter((o) => o.withinPredictedRange).length;
    return {
      evaluatedCount: outcomes.length,
      meanAbsoluteErrorDays: Number(mae.toFixed(1)),
      withinBandRatePercent: Math.round((withinCount / outcomes.length) * 100),
      hasLiveRecordedOutcomes: true,
    };
  }

  // Backtest on historical settled invoices (chronological walk-forward) when no live outcomes settled yet
  const samples = collectSettledSamples(customers, transactions);
  if (samples.length === 0) {
    return {
      evaluatedCount: 0,
      meanAbsoluteErrorDays: 0,
      withinBandRatePercent: 0,
      hasLiveRecordedOutcomes: false,
    };
  }

  let absErrSum = 0;
  let withinSum = 0;
  for (const s of samples) {
    const predDelay = Math.round(s.priorEwmaDelay);
    const err = Math.abs(s.actualDelayDays - predDelay);
    const band = clamp(Math.round(1.28 * Math.max(1.5, s.priorDelayStd)), 1, 8);
    absErrSum += err;
    if (err <= band) withinSum++;
  }

  return {
    evaluatedCount: samples.length,
    meanAbsoluteErrorDays: Number((absErrSum / samples.length).toFixed(1)),
    withinBandRatePercent: Math.round((withinSum / samples.length) * 100),
    hasLiveRecordedOutcomes: false,
  };
}

/**
 * Generates comprehensive 7, 30 & 90-day cash-flow forecasts, shortage flags,
 * prioritized follow-up recommendations, and upcoming expense affordability checks.
 */
export function generateFinancialAdviceReport(
  currentCash: number,
  minimumReserve: number,
  transactions: Transaction[],
  customers: CustomerProfile[],
  outcomes: PredictionOutcomeRecord[] = [],
  anchorDateStr: string = '2026-10-25',
  scenario: WhatIfScenario | null = null
): FinancialAdviceReport {
  const safeAnchor = isValidISODate(anchorDateStr) ? anchorDateStr : '2026-10-25';
  const { predictionsByTxId, predictionsList, model } = predictAllReceivables(
    transactions,
    customers,
    safeAnchor
  );

  const mlProjectedTxs = buildProjectedTransactionsForForecast(
    transactions,
    predictionsByTxId,
    'ml_predicted',
    safeAnchor
  );

  // Ideal on-time comparison (even overdue bills assumed collected today/on-due-date) for measuring delay drag
  const onTimeComparisonTxs: Transaction[] = transactions.map((tx) => {
    if (tx.type !== 'inflow' || tx.status === 'paid') return { ...tx };
    return {
      ...tx,
      dueDate: tx.dueDate < safeAnchor ? safeAnchor : tx.dueDate,
      status: 'expected',
    };
  });

  const forecast90ML = calculateCashForecast(
    currentCash,
    minimumReserve,
    mlProjectedTxs,
    safeAnchor,
    90,
    scenario
  );
  const forecast30ML = calculateCashForecast(
    currentCash,
    minimumReserve,
    mlProjectedTxs,
    safeAnchor,
    30,
    scenario
  );
  const forecast7ML = calculateCashForecast(
    currentCash,
    minimumReserve,
    mlProjectedTxs,
    safeAnchor,
    7,
    scenario
  );

  const forecast30OnTime = calculateCashForecast(
    currentCash,
    minimumReserve,
    onTimeComparisonTxs,
    safeAnchor,
    30,
    scenario
  );

  const buildHorizonSummary = (
    horizonDays: 7 | 30 | 90,
    fRes: ReturnType<typeof calculateCashForecast>
  ): HorizonSummary => {
    const endDate = addDaysISO(safeAnchor, horizonDays - 1);
    const causingOutflows = transactions
      .filter(
        (t) =>
          t.type === 'outflow' &&
          t.status !== 'paid' &&
          t.dueDate >= safeAnchor &&
          t.dueDate <= endDate
      )
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4)
      .map((t) => ({
        id: t.id,
        partyName: t.partyName,
        amount: Math.max(0, t.amount - (t.paidAmount || 0)),
        dueDate: t.dueDate,
      }));

    const affectedDelayedInvoices = predictionsList
      .filter(
        (p) =>
          (p.estimatedDelayDays > 0 || p.currentOverdueDays > 0) &&
          p.dueDate <= endDate
      )
      .map((p) => ({
        id: p.transactionId,
        partyName: p.partyName,
        invoiceNumber: p.invoiceNumber,
        amount: p.amountRemaining,
        dueDate: p.dueDate,
        predictedDate: p.predictedDate,
        delayDays: p.estimatedDelayDays,
      }));

    return {
      horizonDays,
      startingCash: currentCash,
      predictedInflows: fRes.totalIncoming,
      scheduledOutflows: fRes.totalOutgoing,
      endingBalance: fRes.projectedEndingBalance,
      lowestBalance: fRes.lowestBalance,
      lowestBalanceDate: fRes.lowestBalanceDate,
      hasShortageBelowZero: fRes.lowestBalance < 0,
      hasReserveBreach: fRes.lowestBalance < minimumReserve,
      shortageAmount: Math.max(0, -fRes.lowestBalance),
      reserveGapAmount: Math.max(0, minimumReserve - fRes.lowestBalance),
      causingOutflows,
      affectedDelayedInvoices,
    };
  };

  const days7 = buildHorizonSummary(7, forecast7ML);
  const days30 = buildHorizonSummary(30, forecast30ML);
  const days90 = buildHorizonSummary(90, forecast90ML);

  const criticalShortfallDate =
    forecast30ML.lowestBalance < minimumReserve
      ? forecast30ML.lowestBalanceDate
      : null;

  // 1. Follow-Up Queue (Who to follow up with first)
  const followUpQueue: FollowUpRecommendation[] = predictionsList
    .map((pred) => {
      const origTx = transactions.find((t) => t.id === pred.transactionId);
      const cust = customers.find((c) => c.id === pred.customerId);
      const phone =
        (origTx?.contactPhone && origTx.contactPhone !== 'N/A'
          ? origTx.contactPhone
          : cust?.contactPhone && cust.contactPhone !== 'N/A'
          ? cust.contactPhone
          : '') || '';

      const helpsPreventShortfall = Boolean(
        criticalShortfallDate &&
          (pred.currentOverdueDays > 0 ||
            pred.dueDate <= addDaysISO(criticalShortfallDate, 3)) &&
          pred.predictedDate >= criticalShortfallDate
      );

      let priority: FollowUpRecommendation['priority'] = 'normal';
      if (pred.currentOverdueDays > 0 || (helpsPreventShortfall && pred.amountRemaining >= 10000)) {
        priority = 'urgent';
      } else if (pred.hasOptimisticPromiseWarning || pred.estimatedDelayDays >= 3) {
        priority = 'high';
      }

      let reason = '';
      let suggestedAction = '';

      if (pred.currentOverdueDays > 0) {
        reason = `${pred.invoiceNumber} (${formatINR(pred.amountRemaining)}) is ${pred.currentOverdueDays}d past due since ${formatDateLabel(pred.dueDate)}.${helpsPreventShortfall ? ` Collecting before ${formatDateLabel(criticalShortfallDate!)} prevents your upcoming cash shortage.` : ''}`;
        suggestedAction = `Send a polite WhatsApp reminder today and ask for quick UPI or bank payment.`;
      } else if (pred.hasOptimisticPromiseWarning && pred.promisedDate) {
        reason = `Promised ${formatDateLabel(pred.promisedDate)}, though past bills usually take until ${formatDateLabel(pred.predictedDate)}.`;
        suggestedAction = `Check in 1 day before ${formatDateLabel(pred.promisedDate)} so payment comes on time.`;
      } else if (helpsPreventShortfall) {
        reason = `Expected around ${formatDateLabel(pred.predictedDate)} — right after your tight cash day on ${formatDateLabel(criticalShortfallDate!)}.`;
        suggestedAction = `Ask for early payment before ${formatDateLabel(criticalShortfallDate!)}.`;
      } else {
        reason = `Expected around ${formatDateLabel(pred.predictedDate)} (${pred.confidencePercent}% surety from past bills).`;
        suggestedAction = `Send a gentle reminder 2 days before ${formatDateLabel(pred.dueDate)}.`;
      }

      return {
        transactionId: pred.transactionId,
        customerId: pred.customerId,
        partyName: pred.partyName,
        contactPhone: phone,
        invoiceNumber: pred.invoiceNumber,
        amountRemaining: pred.amountRemaining,
        dueDate: pred.dueDate,
        promisedDate: pred.promisedDate,
        predictedDate: pred.predictedDate,
        estimatedDelayDays: pred.estimatedDelayDays,
        priority,
        helpsPreventShortfall,
        reason,
        suggestedAction,
      };
    })
    .sort((a, b) => {
      const rank = { urgent: 0, high: 1, normal: 2 };
      if (rank[a.priority] !== rank[b.priority]) {
        return rank[a.priority] - rank[b.priority];
      }
      return b.amountRemaining - a.amountRemaining;
    });

  // 2. Upcoming Expense Affordability Check
  const mlBalanceByDate = new Map<string, number>();
  forecast90ML.dailyForecast.forEach((d) => mlBalanceByDate.set(d.date, d.endingBalance));

  const onTimeBalanceByDate = new Map<string, number>();
  forecast30OnTime.dailyForecast.forEach((d) =>
    onTimeBalanceByDate.set(d.date, d.endingBalance)
  );

  const upcomingOutflows = transactions
    .filter((t) => t.type === 'outflow' && t.status !== 'paid')
    .slice()
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const expenseAffordability: ExpenseAffordabilityItem[] = upcomingOutflows.map((tx) => {
    const amt = Math.max(0, tx.amount - (tx.paidAmount || 0));
    const projBal =
      mlBalanceByDate.get(tx.dueDate) ?? forecast90ML.projectedEndingBalance;
    const onTimeBal = onTimeBalanceByDate.get(tx.dueDate) ?? projBal;

    let verdict: ExpenseAffordabilityItem['verdict'] = 'affordable';
    let shortfallOrReserveGap = 0;
    let explanation = '';
    let recommendedStep = '';

    if (projBal < 0) {
      verdict = 'unaffordable_shortage';
      shortfallOrReserveGap = Math.abs(projBal);
      explanation = `Paying ${formatINR(amt)} on ${formatDateLabel(tx.dueDate)} leaves you short by ${formatINR(Math.abs(projBal))} because customer payments arrive a few days later.`;
      recommendedStep = `Pay half (${formatINR(Math.round(amt / 2))}) on ${formatDateLabel(tx.dueDate)} and the rest next week, OR collect overdue customer bills first.`;
    } else if (projBal < minimumReserve) {
      verdict = 'tight_dips_reserve';
      shortfallOrReserveGap = minimumReserve - projBal;
      explanation = `Payable, but leaves ${formatINR(projBal)} — dipping ${formatINR(minimumReserve - projBal)} below your ${formatINR(minimumReserve)} safety cushion.`;
      recommendedStep = `Follow up on pending customer bills before ${formatDateLabel(tx.dueDate)} to keep your ${formatINR(minimumReserve)} cushion safe.`;
    } else {
      verdict = 'affordable';
      shortfallOrReserveGap = 0;
      explanation = `Safe to pay: balance after paying ${formatINR(amt)} stays at ${formatINR(projBal)}, well above your ${formatINR(minimumReserve)} safety cushion.`;
      recommendedStep = `Pay as scheduled on ${formatDateLabel(tx.dueDate)}.`;
    }

    return {
      transactionId: tx.id,
      partyName: tx.partyName,
      title: tx.title,
      invoiceNumber: tx.invoiceNumber,
      amount: amt,
      dueDate: tx.dueDate,
      projectedBalanceOnDueDate: projBal,
      contractualBalanceOnDueDate: onTimeBal,
      verdict,
      shortfallOrReserveGap,
      explanation,
      recommendedStep,
    };
  });

  // 3. Delay Impact Summary
  const cashDrag = Math.max(
    0,
    forecast30OnTime.lowestBalance - forecast30ML.lowestBalance
  );
  const delayHeadline =
    cashDrag > 0
      ? `If customers pay late as they usually do, your lowest 30-day cash drops by ${formatINR(cashDrag)} (from ${formatINR(forecast30OnTime.lowestBalance)} down to ${formatINR(forecast30ML.lowestBalance)}).`
      : `Usual customer payment patterns keep your 30-day lowest cash steady at ${formatINR(forecast30ML.lowestBalance)}.`;

  const evalStats = evaluatePredictionAccuracy(outcomes, customers, transactions);

  return {
    anchorDate: safeAnchor,
    horizons: {
      days7,
      days30,
      days90,
    },
    followUpQueue,
    expenseAffordability,
    delayCashImpactSummary: {
      lowestWithOnTimeReceipts: forecast30OnTime.lowestBalance,
      lowestWithMLPredictedReceipts: forecast30ML.lowestBalance,
      cashDragFromDelays: cashDrag,
      headline: delayHeadline,
    },
    modelMetrics: {
      trainedInvoicesCount: model.trainingCount,
      evaluatedOutcomesCount: evalStats.evaluatedCount,
      meanAbsoluteErrorDays: evalStats.meanAbsoluteErrorDays,
      withinBandRatePercent: evalStats.withinBandRatePercent,
    },
  };
}

/**
 * Synchronizes customer profiles with live transactions so stable customerIds,
 * balances, delay averages, and cautious settlement estimates stay accurate whenever
 * invoices are added, edited, partially paid, or settled.
 */
export function syncCustomersWithTransactions(
  existingCustomers: CustomerProfile[],
  transactions: Transaction[],
  anchorDateStr: string = '2026-10-25',
  isDemoWorkspace: boolean = false
): { customers: CustomerProfile[]; transactions: Transaction[] } {
  const safeAnchor = isValidISODate(anchorDateStr) ? anchorDateStr : '2026-10-25';
  const customersMap = new Map<string, CustomerProfile>();

  for (const c of existingCustomers) {
    customersMap.set(c.id, {
      ...c,
      history: Array.isArray(c.history) ? c.history.map((h) => ({ ...h })) : [],
    });
  }

  const findCustomerByParty = (partyName: string, customerId?: string) => {
    if (customerId && customersMap.has(customerId)) {
      return customersMap.get(customerId)!;
    }
    const norm = partyName.trim().toLowerCase();
    for (const c of customersMap.values()) {
      if (c.name.trim().toLowerCase() === norm) {
        return c;
      }
    }
    return undefined;
  };

  // Link every inflow transaction to a stable CustomerProfile
  const linkedTransactions = transactions.map((tx) => {
    if (tx.type !== 'inflow') return { ...tx };
    let cust = findCustomerByParty(tx.partyName, tx.customerId);
    if (!cust) {
      const slug = tx.partyName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const newId = tx.customerId || `cust-${slug || Date.now()}`;
      cust = {
        id: newId,
        name: tx.partyName.trim(),
        category: tx.category === 'retail_sales' ? 'Retail Over-the-counter' : 'B2B Customer',
        contactPhone: tx.contactPhone || '',
        totalBilled: 0,
        totalPaid: 0,
        overdueBalance: 0,
        pendingBalance: 0,
        avgPaymentDelayDays: 0,
        onTimeRatePercent: 100,
        paymentFrequency: 'Standard Credit Terms',
        reliabilityTier: 'moderate',
        isDemo: isDemoWorkspace,
        cautiousEstimate: {
          expectedSettlementDate: tx.dueDate,
          confidenceBand: '± 5 days',
          uncertaintyReason: 'New customer — using usual shop credit pattern until their first bill is paid.',
          hasSufficientHistory: false,
        },
        history: [],
      };
      customersMap.set(newId, cust);
    } else if (tx.contactPhone && (!cust.contactPhone || cust.contactPhone === 'N/A')) {
      cust.contactPhone = tx.contactPhone;
    }

    // Upsert this invoice into customer.history
    const invKey = tx.invoiceNumber || tx.id;
    const histIdx = cust.history.findIndex((h) => h.invoiceNumber === invKey);
    const paidDate =
      tx.status === 'paid' ? tx.actualPaidDate || safeAnchor : null;
    const delayDays = paidDate
      ? diffDaysISO(tx.dueDate, paidDate)
      : tx.dueDate < safeAnchor
      ? diffDaysISO(tx.dueDate, safeAnchor)
      : 0;

    const histStatus: CustomerHistoryItem['status'] =
      tx.status === 'paid'
        ? delayDays > 0
          ? 'paid_late'
          : 'paid_on_time'
        : tx.status === 'partially_paid' || (tx.paidAmount && tx.paidAmount > 0)
        ? 'partially_paid'
        : tx.dueDate < safeAnchor || tx.status === 'overdue'
        ? 'overdue'
        : 'pending';

    const syncedHistItem: CustomerHistoryItem = {
      invoiceNumber: invKey,
      invoiceDate: tx.invoiceDate,
      amount: tx.amount,
      paidAmount: tx.paidAmount || (tx.status === 'paid' ? tx.amount : 0),
      dueDate: tx.dueDate,
      promisedDate: tx.promisedDate ?? null,
      paidDate,
      delayDays: Math.max(0, delayDays),
      status: histStatus,
    };

    if (histIdx >= 0) {
      cust.history[histIdx] = syncedHistItem;
    } else {
      cust.history.push(syncedHistItem);
    }

    return {
      ...tx,
      customerId: cust.id,
      contactPhone: tx.contactPhone || (cust.contactPhone !== 'N/A' ? cust.contactPhone : undefined),
    };
  });

  // Fit model & recompute aggregate metrics for every customer
  const tempCustomers = Array.from(customersMap.values());
  const model = fitPaymentDelayModel(tempCustomers, linkedTransactions);

  const updatedCustomers = tempCustomers.map((cust) => {
    const settled = cust.history.filter((h) => h.paidDate !== null);
    const unsettled = cust.history.filter((h) => h.paidDate === null);

    const totalBilled = cust.history.reduce((s, h) => s + (h.amount || 0), 0);
    const totalPaid =
      settled.reduce((s, h) => s + (h.amount || 0), 0) +
      unsettled.reduce((s, h) => s + (h.paidAmount || 0), 0);

    const pendingTxForCust = linkedTransactions.filter(
      (t) => t.type === 'inflow' && t.status !== 'paid' && t.customerId === cust.id
    );
    const pendingBalance = pendingTxForCust.reduce(
      (s, t) => s + Math.max(0, t.amount - (t.paidAmount || 0)),
      0
    );
    const overdueBalance = pendingTxForCust
      .filter((t) => t.status === 'overdue' || t.dueDate < safeAnchor)
      .reduce((s, t) => s + Math.max(0, t.amount - (t.paidAmount || 0)), 0);

    const settledDelays = settled.map((h) =>
      h.paidDate ? Math.max(0, diffDaysISO(h.dueDate, h.paidDate)) : h.delayDays || 0
    );
    const avgDelay =
      settledDelays.length > 0
        ? Number(computeMean(settledDelays).toFixed(1))
        : 0;
    const onTimeCount = settledDelays.filter((d) => d <= 1).length;
    const onTimeRatePercent =
      settledDelays.length > 0
        ? Math.round((onTimeCount / settledDelays.length) * 100)
        : 0;

    let reliabilityTier: CustomerProfile['reliabilityTier'] = 'moderate';
    if (settledDelays.length === 0) {
      reliabilityTier = 'cautious';
    } else if (avgDelay <= 2.5 && onTimeRatePercent >= 70 && overdueBalance === 0) {
      reliabilityTier = 'high';
    } else if (avgDelay > 7 || overdueBalance > 20000) {
      reliabilityTier = 'high_risk';
    } else if (avgDelay > 4 || overdueBalance > 0) {
      reliabilityTier = 'moderate';
    }

    // Compute cautiousEstimate from next unpaid transaction for this customer if available
    const nextUnpaid = pendingTxForCust
      .slice()
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];

    let cautiousEstimate = cust.cautiousEstimate;
    if (nextUnpaid) {
      const pred = predictInvoicePayment(nextUnpaid, tempCustomers, model, safeAnchor);
      cautiousEstimate = {
        expectedSettlementDate: pred.predictedDate,
        confidenceBand: `± ${pred.bandDays} day${pred.bandDays === 1 ? '' : 's'}`,
        uncertaintyReason: pred.explanation,
        hasSufficientHistory: settledDelays.length >= 3,
      };
    } else if (settledDelays.length === 0) {
      cautiousEstimate = {
        expectedSettlementDate: safeAnchor,
        confidenceBand: '± 5 days',
        uncertaintyReason:
          'New customer with no past settled bills yet — general shop credit pattern applies until first payment.',
        hasSufficientHistory: false,
      };
    }

    return {
      ...cust,
      totalBilled,
      totalPaid,
      pendingBalance,
      overdueBalance,
      avgPaymentDelayDays: avgDelay,
      onTimeRatePercent,
      reliabilityTier,
      cautiousEstimate,
      history: cust.history
        .slice()
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    };
  });

  return {
    customers: updatedCustomers,
    transactions: linkedTransactions,
  };
}
