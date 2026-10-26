export interface PrivacyMaskResult {
  maskedText: string;
  maskedCount: number;
  typesFound: string[];
}

/**
 * Masks Indian personal & tax identifiers (GSTIN, PAN, Aadhaar) in text
 * BEFORE sending to AI services.
 * Order matters: GSTIN (15 chars containing PAN) is masked first, then PAN, then Aadhaar.
 */
export function maskSensitiveIndianIDs(rawText: string): PrivacyMaskResult {
  if (!rawText) {
    return { maskedText: '', maskedCount: 0, typesFound: [] };
  }

  let maskedText = rawText;
  let maskedCount = 0;
  const typesSet = new Set<string>();

  // 1. Mask 15-character Indian GSTIN (e.g. 29ABCDE1234F1Z5)
  const gstinRegex = /\b\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]\b/gi;
  maskedText = maskedText.replace(gstinRegex, () => {
    maskedCount++;
    typesSet.add('GSTIN');
    return '[GSTIN-MASKED]';
  });

  // 2. Mask 10-character Indian PAN (e.g. ABCDE1234F)
  const panRegex = /\b[A-Z]{5}\d{4}[A-Z]\b/gi;
  maskedText = maskedText.replace(panRegex, () => {
    maskedCount++;
    typesSet.add('PAN');
    return '[PAN-MASKED]';
  });

  // 3. Mask 12-digit Indian Aadhaar (starts with 2-9, optional spaces or hyphens: 2345 6789 0123)
  // Avoid matching inside longer numeric reference IDs or DINs
  const aadhaarSpacedRegex = /(?<![0-9A-Za-z])[2-9]\d{3}[\s-]\d{4}[\s-]\d{4}(?![0-9A-Za-z])/g;
  maskedText = maskedText.replace(aadhaarSpacedRegex, () => {
    maskedCount++;
    typesSet.add('Aadhaar');
    return '[AADHAAR-MASKED]';
  });

  const aadhaarCompactRegex = /(?<![0-9A-Za-z/-])[2-9]\d{11}(?![0-9A-Za-z/-])/g;
  maskedText = maskedText.replace(aadhaarCompactRegex, () => {
    maskedCount++;
    typesSet.add('Aadhaar');
    return '[AADHAAR-MASKED]';
  });

  return {
    maskedText,
    maskedCount,
    typesFound: Array.from(typesSet),
  };
}

/**
 * Adds calendar days to a YYYY-MM-DD date string safely in local calendar format.
 */
export function addCalendarDays(dateStr: string, daysToAdd: number): string {
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    return dateStr;
  }
  const dt = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  dt.setUTCDate(dt.getUTCDate() + daysToAdd);
  return dt.toISOString().split('T')[0];
}

/**
 * Formats a YYYY-MM-DD date into readable Indian format (e.g., "5 Nov 2026").
 */
export function formatNoticeDate(dateStr: string): string {
  if (!dateStr) return 'Unknown date';
  const dt = new Date(dateStr + 'T00:00:00');
  if (isNaN(dt.getTime())) return dateStr;
  return dt.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Formats rupee figures consistently using the ₹ symbol (e.g., "₹18,500" or "-₹10,000").
 */
export function formatRs(amount: number): string {
  const isNegative = amount < 0;
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
  return isNegative ? `-₹${formatted}` : `₹${formatted}`;
}

export interface CountdownInfo {
  daysLeft: number;
  hoursRemainingInDay: number;
  countdownText: string;
  isOverdue: boolean;
  isDueToday: boolean;
  isDueThisWeek: boolean;
}

/**
 * Computes live countdown relative to the current date / anchor date.
 */
export function computeNoticeCountdown(
  deadlineDateStr: string,
  referenceTodayStr: string = '2026-10-24',
  nowTimestamp: number = Date.now()
): CountdownInfo {
  const deadlineParts = deadlineDateStr.split('-').map(Number);
  const todayParts = referenceTodayStr.split('-').map(Number);

  const deadlineUTC = Date.UTC(deadlineParts[0], deadlineParts[1] - 1, deadlineParts[2]);
  const todayUTC = Date.UTC(todayParts[0], todayParts[1] - 1, todayParts[2]);

  const diffDays = Math.round((deadlineUTC - todayUTC) / (1000 * 60 * 60 * 24));
  const nowDate = new Date(nowTimestamp);
  const hoursRemainingInDay = Math.max(0, 23 - nowDate.getHours());

  let countdownText = '';
  if (diffDays > 1) {
    countdownText = `${diffDays} days left`;
  } else if (diffDays === 1) {
    countdownText = '1 day left';
  } else if (diffDays === 0) {
    countdownText = `Due today (${hoursRemainingInDay}h left)`;
  } else if (diffDays === -1) {
    countdownText = '1 day overdue';
  } else {
    countdownText = `${Math.abs(diffDays)} days overdue`;
  }

  return {
    daysLeft: diffDays,
    hoursRemainingInDay,
    countdownText,
    isOverdue: diffDays < 0,
    isDueToday: diffDays === 0,
    isDueThisWeek: diffDays >= 0 && diffDays <= 7,
  };
}
