export type NoticeSeverity = 'Routine' | 'Needs attention' | 'Urgent';

export type NoticeStatus = 'New' | 'In progress' | 'Replied' | 'Closed';

export type FieldConfidence = 'Read from notice' | 'Estimated, please confirm';

export type AuthenticityVerdict = 'genuine' | 'suspicious' | 'verify_carefully';

export type AdvisorVerdict = 'Yes' | 'Maybe' | 'No';

export interface AuthenticityAssessment {
  verdict: AuthenticityVerdict;
  summary: string;
  dinValue: string | null;
  dinCheckNote: string;
  officialDomainValue: string | null;
  domainCheckNote: string;
  requestsPersonalAccount: boolean;
  paymentCheckNote: string;
}

export interface IgnoreTimelineStep {
  timeframe: string;
  title: string;
  detail: string;
}

export interface DocumentChecklistItem {
  id: string;
  label: string;
  detail?: string;
  checked: boolean;
}

export interface AdvisorGuidance {
  verdict: AdvisorVerdict;
  roleLabel: string;
  reasons: string[];
}

export interface NoticeFieldConfidenceMap {
  sender: FieldConfidence;
  lawSection: FieldConfidence;
  whatIsAsked: FieldConfidence;
  amountDemanded: FieldConfidence;
  deadline: FieldConfidence;
}

export interface LegalNotice {
  id: string;
  sampleKey?: 'gst_drc01' | 'it_143_1' | 'ni_138_cheque';
  title: string;
  referenceNumber: string;
  status: NoticeStatus;
  createdAt: string;

  // 1. Who sent it & Authenticity
  authorityName: string;
  authenticity: AuthenticityAssessment;

  // 2. Law / Section invoked + 1 plain sentence
  lawSection: string;
  lawPlainExplanation: string;

  // 3. What owner is accused of / asked to do (max 3 short lines)
  whatIsAskedLines: string[];

  // 4. Amount demanded (if any)
  amountDemanded: number;
  amountBreakdown?: string;

  // 5. Severity badge + 1-line reason
  severity: NoticeSeverity;
  severityReason: string;

  // 6. Deadline & Receipt calculation
  issueDate: string; // YYYY-MM-DD
  receivedDate: string; // YYYY-MM-DD
  receivedDateConfirmed: boolean;
  statutoryDaysFromReceipt: number;
  deadlineDate: string; // YYYY-MM-DD
  deadlineCalculationBasis: string;

  // 7. What happens if you ignore this
  ignoreTimeline: IgnoreTimelineStep[];

  // 8. Documents to gather (checkbox checklist)
  documentsChecklist: DocumentChecklistItem[];

  // 9. Do I need a CA or lawyer?
  advisorGuidance: AdvisorGuidance;

  // 10. Editable Draft Reply & Request More Time letter
  draftReplyText: string;
  extensionLetterText: string;

  // 11. Confidence label on each extracted item
  confidence: NoticeFieldConfidenceMap;

  // Raw notice snippet (optional, for reference)
  sourceSnippet?: string;

  // Cash-flow link flag
  linkedToCashflow: boolean;
}
