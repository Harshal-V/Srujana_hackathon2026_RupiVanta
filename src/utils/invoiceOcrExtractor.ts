import zlib from 'zlib';
import Tesseract from 'tesseract.js';
import { isValidISODate } from './forecastEngine.ts';

export interface LocalOcrScanOutput {
  success: boolean;
  isReadableDocument: boolean;
  extractionMethod: 'local_tesseract_ocr' | 'local_pdf_text';
  rawOcrConfidence: number;
  qualityWarning: string;
  missingFields: string[];
  partyName: string;
  type: 'inflow' | 'outflow';
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  subtotal?: number;
  taxAmount?: number;
  paymentDetails: string;
  category: string;
  title: string;
  confidence: 'high' | 'medium' | 'low';
  notes: string;
}

const MONTH_MAP: Record<string, string> = {
  jan: '01',
  january: '01',
  feb: '02',
  february: '02',
  mar: '03',
  march: '03',
  apr: '04',
  april: '04',
  may: '05',
  jun: '06',
  june: '06',
  jul: '07',
  july: '07',
  aug: '08',
  august: '08',
  sep: '09',
  sept: '09',
  september: '09',
  oct: '10',
  october: '10',
  nov: '11',
  november: '11',
  dec: '12',
  december: '12',
};

function normalizeDateToken(raw: string): string {
  const cleaned = raw.trim().replace(/[,]/g, ' ').replace(/\s+/g, ' ');

  // 1. YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = cleaned.match(/\b(20\d{2})[-\/.](\d{1,2})[-\/.](\d{1,2})\b/);
  if (isoMatch) {
    const candidate = `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
    if (isValidISODate(candidate)) return candidate;
  }

  // 2. DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
  const dmyMatch = cleaned.match(/\b(\d{1,2})[-\/.](\d{1,2})[-\/.](20\d{2})\b/);
  if (dmyMatch) {
    const dd = dmyMatch[1].padStart(2, '0');
    const mm = dmyMatch[2].padStart(2, '0');
    const yyyy = dmyMatch[3];
    const candidate = `${yyyy}-${mm}-${dd}`;
    if (isValidISODate(candidate)) return candidate;
  }

  // 3. DD Mon YYYY (e.g. 25 Oct 2026, 25th October 2026)
  const dMonY = cleaned.match(
    /\b(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})\s+(20\d{2})\b/i
  );
  if (dMonY) {
    const dd = dMonY[1].padStart(2, '0');
    const mm = MONTH_MAP[dMonY[2].toLowerCase()];
    const yyyy = dMonY[3];
    if (mm) {
      const candidate = `${yyyy}-${mm}-${dd}`;
      if (isValidISODate(candidate)) return candidate;
    }
  }

  // 4. Mon DD YYYY (e.g. Oct 25 2026)
  const monDY = cleaned.match(
    /\b([A-Za-z]{3,9})\s+(\d{1,2})(?:st|nd|rd|th)?\s+(20\d{2})\b/i
  );
  if (monDY) {
    const mm = MONTH_MAP[monDY[1].toLowerCase()];
    const dd = monDY[2].padStart(2, '0');
    const yyyy = monDY[3];
    if (mm) {
      const candidate = `${yyyy}-${mm}-${dd}`;
      if (isValidISODate(candidate)) return candidate;
    }
  }

  return '';
}

function unescapePdfLiteral(str: string): string {
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, ' ')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\');
}

function extractTextOpsFromPdfChunk(content: string): string[] {
  const pieces: string[] = [];

  // Extract (...) Tj literals
  const tjRegex = /\(([^()\\]*(?:\\.[^()\\]*)*)\)\s*Tj/g;
  let match: RegExpExecArray | null;
  while ((match = tjRegex.exec(content)) !== null) {
    const txt = unescapePdfLiteral(match[1]).trim();
    if (txt) pieces.push(txt);
  }

  // Extract [...] TJ arrays
  const tjArrRegex = /\[([^\]]+)\]\s*TJ/g;
  while ((match = tjArrRegex.exec(content)) !== null) {
    const inner = match[1];
    const litRegex = /\(([^()\\]*(?:\\.[^()\\]*)*)\)/g;
    let sub: RegExpExecArray | null;
    let line = '';
    while ((sub = litRegex.exec(inner)) !== null) {
      line += unescapePdfLiteral(sub[1]);
    }
    if (line.trim()) pieces.push(line.trim());
  }

  return pieces;
}

export function extractPdfTextFromBuffer(buffer: Buffer): string {
  const rawLatin = buffer.toString('latin1');
  const lines: string[] = [];

  // 1. Direct uncompressed PDF text operators
  lines.push(...extractTextOpsFromPdfChunk(rawLatin));

  // 2. Compressed FlateDecode streams
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let streamMatch: RegExpExecArray | null;
  while ((streamMatch = streamRegex.exec(rawLatin)) !== null) {
    try {
      const rawBytes = Buffer.from(streamMatch[1], 'latin1');
      const inflated = zlib.inflateSync(rawBytes).toString('latin1');
      lines.push(...extractTextOpsFromPdfChunk(inflated));
    } catch {
      // Not a zlib-inflatable text stream (e.g., embedded image stream)
    }
  }

  return lines.join('\n').trim();
}

function parseIndianNumber(numStr: string): number {
  const cleaned = numStr.replace(/[,₹\s]/g, '').replace(/^(?:Rs\.?|INR)/i, '');
  const val = parseFloat(cleaned);
  return Number.isFinite(val) && val > 0 ? val : 0;
}

export function parseInvoiceFieldsFromText(
  rawText: string,
  ocrConfidence: number,
  extractionMethod: 'local_tesseract_ocr' | 'local_pdf_text',
  currentBusinessName: string = ''
): LocalOcrScanOutput {
  const normalizedText = (rawText || '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();

  const alphaNumCount = (normalizedText.match(/[A-Za-z0-9]/g) || []).length;

  if (alphaNumCount < 12 || (extractionMethod === 'local_tesseract_ocr' && ocrConfidence < 24)) {
    return {
      success: false,
      isReadableDocument: false,
      extractionMethod,
      rawOcrConfidence: Math.round(ocrConfidence),
      qualityWarning:
        extractionMethod === 'local_pdf_text'
          ? 'This PDF appears to be a scanned image without selectable text or is unreadable. Please upload a clear PNG/JPG photo of the bill or fill in the fields manually below.'
          : 'The uploaded image is too blurry, dark, or contains no readable invoice text. No values were fabricated — please upload a clearer bill photo or enter the details manually below.',
      missingFields: ['partyName', 'totalAmount', 'invoiceNumber', 'invoiceDate', 'dueDate'],
      partyName: '',
      type: 'outflow',
      invoiceNumber: '',
      invoiceDate: '',
      dueDate: '',
      totalAmount: 0,
      paymentDetails: '',
      category: 'supplier',
      title: '',
      confidence: 'low',
      notes: '',
    };
  }

  const lines = normalizedText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  // 1. Extract Invoice Number
  let invoiceNumber = '';
  const invPatterns = [
    /(?:invoice\s*(?:no|number|#)|inv\s*(?:no|#)|bill\s*(?:no|number|#)|challan\s*(?:no|#))\s*[:.\-]?\s*([A-Z0-9][A-Z0-9\-\/]{2,24})/i,
    /\b((?:INV|GST|BILL|TAX|MAS|VKT|NDI|SHM)[-\/][A-Z0-9\-\/]{2,20})\b/i,
  ];
  for (const pat of invPatterns) {
    const m = normalizedText.match(pat);
    if (m && m[1]) {
      const candidate = m[1].trim();
      if (!/^(?:DATE|NO|NUMBER|TOTAL|AMOUNT)$/i.test(candidate)) {
        invoiceNumber = candidate;
        break;
      }
    }
  }

  // 2. Extract Invoice Date & Due Date
  let invoiceDate = '';
  let dueDate = '';

  for (const line of lines) {
    if (
      !dueDate &&
      /(?:due\s*date|payment\s*due|pay\s*by|due\s*on)/i.test(line)
    ) {
      const d = normalizeDateToken(line);
      if (d) dueDate = d;
    }
    if (
      !invoiceDate &&
      /(?:invoice\s*date|bill\s*date|dated|date\s*:|date\s+of\s+issue)/i.test(line) &&
      !/due\s*date/i.test(line)
    ) {
      const d = normalizeDateToken(line);
      if (d) invoiceDate = d;
    }
  }

  // Fallback for invoiceDate if a single top-level date appears on the document
  if (!invoiceDate) {
    for (const line of lines.slice(0, 12)) {
      if (!/due/i.test(line)) {
        const d = normalizeDateToken(line);
        if (d) {
          invoiceDate = d;
          break;
        }
      }
    }
  }

  // 3. Extract Total Amount, Subtotal, and Tax Amount
  let totalAmount = 0;
  let subtotal: number | undefined;
  let taxAmount: number | undefined;

  const totalLinePatterns = [
    /(?:grand\s*total|invoice\s*total|net\s*payable|amount\s*payable|total\s*amount|balance\s*due|amount\s*due|total)\s*[:.\-]?\s*(?:₹|Rs\.?|INR)?\s*([\d,]+(?:\.\d{1,2})?)/gi,
  ];

  const matchedTotals: number[] = [];
  for (const pat of totalLinePatterns) {
    let m: RegExpExecArray | null;
    while ((m = pat.exec(normalizedText)) !== null) {
      const val = parseIndianNumber(m[1]);
      if (val > 0 && val < 100000000) {
        matchedTotals.push(val);
      }
    }
  }
  if (matchedTotals.length > 0) {
    // Usually Grand Total is the final or largest total line on the invoice
    totalAmount = Math.round(Math.max(...matchedTotals));
  } else {
    // Look for explicit ₹ / Rs. currency amounts
    const currencyMatches = normalizedText.matchAll(
      /(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)/gi
    );
    const currencyVals: number[] = [];
    for (const cm of currencyMatches) {
      const v = parseIndianNumber(cm[1]);
      if (v > 0 && v < 100000000) currencyVals.push(v);
    }
    if (currencyVals.length > 0) {
      totalAmount = Math.round(Math.max(...currencyVals));
    }
  }

  const subMatch = normalizedText.match(
    /(?:sub\s*total|taxable\s*(?:value|amount))\s*[:.\-]?\s*(?:₹|Rs\.?|INR)?\s*([\d,]+(?:\.\d{1,2})?)/i
  );
  if (subMatch) {
    const sv = parseIndianNumber(subMatch[1]);
    if (sv > 0) subtotal = Math.round(sv);
  }

  const taxMatch = normalizedText.match(
    /(?:total\s*gst|igst|gst\s*amount|tax\s*amount)\s*[:.\-]?\s*(?:₹|Rs\.?|INR)?\s*([\d,]+(?:\.\d{1,2})?)/i
  );
  if (taxMatch) {
    const tv = parseIndianNumber(taxMatch[1]);
    if (tv > 0) taxAmount = Math.round(tv);
  }

  // 4. Extract Party Name & Determine Inflow vs Outflow
  let partyName = '';
  let type: 'inflow' | 'outflow' = 'outflow';
  const cleanBiz = currentBusinessName.replace(/\[Demo\]/gi, '').trim().toLowerCase();

  const supplierMatch = normalizedText.match(
    /(?:supplier|vendor|seller|from|sold\s*by)\s*[:.\-]\s*([A-Za-z0-9 &.,'()\-]{3,60})/i
  );
  const buyerMatch = normalizedText.match(
    /(?:customer|buyer|bill\s*to|billed\s*to|consignee|m\/s\.?)\s*[:.\-]?\s*([A-Za-z0-9 &.,'()\-]{3,60})/i
  );

  const supplierCandidate = supplierMatch?.[1]?.split('\n')[0]?.trim() || '';
  const buyerCandidate = buyerMatch?.[1]?.split('\n')[0]?.trim() || '';

  if (supplierCandidate && cleanBiz && supplierCandidate.toLowerCase().includes(cleanBiz)) {
    // Our own shop issued the invoice -> Customer Receivable (inflow)
    type = 'inflow';
    partyName = buyerCandidate;
  } else if (buyerCandidate && cleanBiz && buyerCandidate.toLowerCase().includes(cleanBiz)) {
    // Addressed to our shop -> Supplier Payable (outflow)
    type = 'outflow';
    partyName = supplierCandidate;
  } else if (supplierCandidate) {
    type = 'outflow';
    partyName = supplierCandidate;
  } else if (buyerCandidate) {
    type = 'inflow';
    partyName = buyerCandidate;
  }

  // Fallback: look for prominent business/company line near top of invoice
  if (!partyName) {
    const genericHeadings =
      /^(?:tax\s*invoice|invoice|cash\s*memo|bill\s*of\s*supply|receipt|estimate|delivery\s*challan|original|gstin|date|phone|mobile|email)$/i;
    const bizKeyword =
      /\b(?:stores?|traders?|trading|supermarket|mart|enterprises?|suppliers?|agencies|agency|foods?|agro|mills?|distributors?|kirana|pharma|textiles?|hardware|wholesalers?|pvt|ltd|llp|co\.|company|sons|brothers)\b/i;

    for (const line of lines.slice(0, 10)) {
      const cleanedLine = line.replace(/^(?:M\/s\.?|Sri\s+)/i, (m) => m).trim();
      if (
        cleanedLine.length >= 4 &&
        cleanedLine.length <= 65 &&
        !genericHeadings.test(cleanedLine) &&
        bizKeyword.test(cleanedLine) &&
        (!cleanBiz || !cleanedLine.toLowerCase().includes(cleanBiz))
      ) {
        partyName = cleanedLine;
        break;
      }
    }
  }

  if (/sales\s*invoice|receivable/i.test(normalizedText) && !supplierCandidate) {
    type = 'inflow';
  }

  // 5. Extract Payment Details (UPI, IFSC, GSTIN, Credit Terms)
  const paymentBits: string[] = [];
  const upiMatch = normalizedText.match(/\b[a-zA-Z0-9.\-_]{2,40}@[a-zA-Z]{2,20}\b/);
  if (upiMatch && !/\.(?:com|in|org|net)$/i.test(upiMatch[0])) {
    paymentBits.push(`UPI: ${upiMatch[0]}`);
  }
  const ifscMatch = normalizedText.match(/\b[A-Z]{4}0[A-Z0-9]{6}\b/);
  if (ifscMatch) {
    paymentBits.push(`IFSC: ${ifscMatch[0]}`);
  }
  const termsMatch = normalizedText.match(/\b(?:Net\s*\d+\s*Days?|Credit\s*\d+\s*Days?|Immediate\s*Payment|Cash\s*on\s*Delivery|NEFT|RTGS|IMPS)\b/i);
  if (termsMatch) {
    paymentBits.push(termsMatch[0]);
  }
  const gstinMatch = normalizedText.match(/\b\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]\b/);
  if (gstinMatch) {
    paymentBits.push(`GSTIN: ${gstinMatch[0]}`);
  }

  const paymentDetails = paymentBits.join(' · ');

  // 6. Identify Missing Fields Honestly
  const missingFields: string[] = [];
  if (!partyName) missingFields.push('partyName');
  if (!(totalAmount > 0)) missingFields.push('totalAmount');
  if (!invoiceNumber) missingFields.push('invoiceNumber');
  if (!invoiceDate) missingFields.push('invoiceDate');
  if (!dueDate) missingFields.push('dueDate');

  const extractedCoreCount = 5 - missingFields.length;

  if (extractedCoreCount === 0) {
    return {
      success: false,
      isReadableDocument: false,
      extractionMethod,
      rawOcrConfidence: Math.round(ocrConfidence),
      qualityWarning:
        'Text was detected on the uploaded file, but structured invoice fields (customer/supplier, amount, dates) could not be reliably identified. Please review and enter the fields manually below.',
      missingFields,
      partyName: '',
      type,
      invoiceNumber: '',
      invoiceDate: '',
      dueDate: '',
      totalAmount: 0,
      paymentDetails,
      category: type === 'outflow' ? 'supplier' : 'b2b_invoice',
      title: '',
      confidence: 'low',
      notes: '',
    };
  }

  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (extractedCoreCount >= 4 && ocrConfidence >= 65) {
    confidence = 'high';
  } else if (extractedCoreCount >= 2 && ocrConfidence >= 40) {
    confidence = 'medium';
  }

  const warnings: string[] = [];
  if (extractionMethod === 'local_tesseract_ocr' && ocrConfidence < 65) {
    warnings.push(
      `Image clarity is moderate (${Math.round(ocrConfidence)}% OCR confidence) — please double-check numbers and dates.`
    );
  }
  if (missingFields.length > 0) {
    warnings.push(
      `Some fields were not found on the document (${missingFields.join(', ')}) — please fill or confirm them before saving.`
    );
  }

  return {
    success: true,
    isReadableDocument: true,
    extractionMethod,
    rawOcrConfidence: Math.round(ocrConfidence),
    qualityWarning: warnings.join(' '),
    missingFields,
    partyName,
    type,
    invoiceNumber,
    invoiceDate,
    dueDate,
    totalAmount,
    subtotal,
    taxAmount,
    paymentDetails,
    category: type === 'outflow' ? 'supplier' : 'b2b_invoice',
    title: partyName
      ? `${type === 'outflow' ? 'Bill — ' : 'Invoice — '}${partyName}`
      : '',
    confidence,
    notes: paymentDetails
      ? `Extracted via OCR (${paymentDetails})`
      : 'Extracted via OCR document scan',
  };
}

export function inspectImageQualityViability(
  fileBuffer: Buffer,
  mimeType: string
): { viable: boolean; reason?: string } {
  const lower = (mimeType || '').toLowerCase();
  if (lower.includes('pdf')) {
    return { viable: true };
  }

  // Check PNG IHDR dimensions & compressed IDAT entropy
  if (
    fileBuffer.length >= 24 &&
    fileBuffer[0] === 0x89 &&
    fileBuffer[1] === 0x50 &&
    fileBuffer[2] === 0x4e &&
    fileBuffer[3] === 0x47
  ) {
    const width = fileBuffer.readUInt32BE(16);
    const height = fileBuffer.readUInt32BE(20);
    if (width < 80 || height < 80) {
      return {
        viable: false,
        reason: `Image resolution (${width}×${height}px) is too low to read invoice text. Please upload a clearer, higher-resolution bill photo or enter details manually below.`,
      };
    }
    if (fileBuffer.length < 450) {
      return {
        viable: false,
        reason:
          'The uploaded image appears blank or solid-colored with no readable bill text. Please upload a clear photo of the invoice or enter details manually below.',
      };
    }
  } else if (lower.startsWith('image/') && fileBuffer.length < 400) {
    return {
      viable: false,
      reason:
        'The uploaded image is too small or unclear to extract invoice fields. Please upload a clearer bill photo or enter details manually below.',
    };
  }

  return { viable: true };
}

export async function extractInvoiceFromBufferLocal(
  fileBuffer: Buffer,
  mimeType: string,
  currentBusinessName: string = ''
): Promise<LocalOcrScanOutput> {
  const lowerMime = (mimeType || '').toLowerCase();

  if (lowerMime.includes('pdf')) {
    const pdfText = extractPdfTextFromBuffer(fileBuffer);
    return parseInvoiceFieldsFromText(
      pdfText,
      pdfText.length >= 20 ? 88 : 0,
      'local_pdf_text',
      currentBusinessName
    );
  }

  const viability = inspectImageQualityViability(fileBuffer, mimeType);
  if (!viability.viable) {
    return {
      success: false,
      isReadableDocument: false,
      extractionMethod: 'local_tesseract_ocr',
      rawOcrConfidence: 0,
      qualityWarning:
        viability.reason ||
        'The uploaded image could not be read clearly. Please upload a clearer photo or enter the bill fields manually below.',
      missingFields: ['partyName', 'totalAmount', 'invoiceNumber', 'invoiceDate', 'dueDate'],
      partyName: '',
      type: 'outflow',
      invoiceNumber: '',
      invoiceDate: '',
      dueDate: '',
      totalAmount: 0,
      paymentDetails: '',
      category: 'supplier',
      title: '',
      confidence: 'low',
      notes: '',
    };
  }

  // Genuine Optical Character Recognition via Tesseract.js on image buffer
  const result = await Tesseract.recognize(fileBuffer, 'eng');
  const text = result?.data?.text || '';
  const conf = typeof result?.data?.confidence === 'number' ? result.data.confidence : 0;

  return parseInvoiceFieldsFromText(
    text,
    conf,
    'local_tesseract_ocr',
    currentBusinessName
  );
}

