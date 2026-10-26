import { LegalNotice } from '../types/notices';

/**
 * Three built-in Indian small-business sample notices:
 * (a) GST show-cause notice (DRC-01) — 12 days left (5 Nov 2026), Needs attention (amber)
 * (b) Income Tax intimation u/s 143(1) — 25 days left (18 Nov 2026), Routine (green)
 * (c) Cheque bounce demand notice u/s 138 NI Act — 6 days left (30 Oct 2026), Urgent (red) -> 1 due this week!
 *
 * Together in the Tracker on anchor date 2026-10-24: "3 open, 1 due this week".
 * Uses ₹ consistently everywhere.
 */
export const SAMPLE_NOTICES: LegalNotice[] = [
  {
    id: 'notice-ni138-001',
    sampleKey: 'ni_138_cheque',
    title: 'Cheque Bounce Demand Notice u/s 138 NI Act',
    referenceNumber: 'LEGAL/BLR/138/2026/089',
    status: 'New',
    createdAt: '2026-10-24',

    authorityName: 'Adv. M. Vishwanath & Associates (for Deccan Freight & Packaging Pvt. Ltd.)',
    authenticity: {
      verdict: 'genuine',
      summary:
        'Looks genuine — legal notice sent by a registered lawyer by post, asking payment only to your supplier’s company bank account.',
      dinValue: null,
      dinCheckNote:
        'No government DIN needed (private lawyer notice under Cheque Bounce law; Lawyer registration KAR/1942/2014 is given).',
      officialDomainValue: 'vishwanathlawchambers.in (Registered Post + Email copy)',
      domainCheckNote:
        'Matches a real law office rather than someone pretending to be a tax officer.',
      requestsPersonalAccount: false,
      paymentCheckNote:
        'Safe: Asks you to pay only to "Deccan Freight & Packaging Pvt. Ltd." business bank account, not any personal UPI.',
    },

    lawSection: 'Section 138 of the Negotiable Instruments Act, 1881',
    lawPlainExplanation:
      'If a business cheque bounces due to low bank balance, you must pay that cheque amount within 15 days of getting this letter to stop a court case.',

    whatIsAskedLines: [
      'Cheque No. 482910 for ₹25,000 given to Deccan Freight & Packaging bounced due to low bank balance.',
      'Pay ₹25,000 within 15 days of receiving this letter to stop a criminal court complaint.',
      'Take a written payment receipt and collect your old cheque back after paying.',
    ],

    amountDemanded: 25000,
    amountBreakdown:
      'Cheque Amount: ₹25,000 (Lawyer also mentions ₹3,500 notice fee; paying the ₹25,000 cheque amount within 15 days stops a Section 138 court case).',

    severity: 'Urgent',
    severityReason:
      'Strict 15-day time limit from receipt — missing it allows the supplier to file a court case.',

    issueDate: '2026-10-13',
    receivedDate: '2026-10-15',
    receivedDateConfirmed: true,
    statutoryDaysFromReceipt: 15,
    deadlineDate: '2026-10-30',
    deadlineCalculationBasis:
      '15 calendar days from the day you received the notice (received 15 Oct 2026 + 15 days = 30 Oct 2026).',

    ignoreTimeline: [
      {
        timeframe: 'Day 16 (After 30 Oct 2026)',
        title: 'Supplier Can File a Court Case',
        detail:
          'After 30 Oct, the supplier gets 30 days to file a cheque bounce case in the Magistrate Court.',
      },
      {
        timeframe: 'Month 2–3',
        title: 'Court Summons & 20% Deposit',
        detail:
          'You will have to appear in court in person, and the court can order an immediate 20% deposit.',
      },
      {
        timeframe: 'Final Court Order',
        title: 'Heavy Fine up to Double the Cheque',
        detail:
          'Fine can go up to double the cheque amount (₹50,000) along with legal trouble.',
      },
    ],

    documentsChecklist: [
      {
        id: 'ni-doc-1',
        label: 'Postal envelope with India Post delivery date stamp',
        detail: 'Shows the exact date you received this letter (starts the 15-day count).',
        checked: true,
      },
      {
        id: 'ni-doc-2',
        label: 'Bank cheque bounce slip & October bank statement',
        detail: 'Check the exact date and reason the cheque returned.',
        checked: false,
      },
      {
        id: 'ni-doc-3',
        label: 'Deccan Freight bills and delivery slips',
        detail: 'Confirm that ₹25,000 is truly owed for goods received.',
        checked: false,
      },
      {
        id: 'ni-doc-4',
        label: 'Bank transfer (NEFT/RTGS) receipt after paying',
        detail: 'Write Cheque No. 482910 in the bank transfer remark.',
        checked: false,
      },
    ],

    advisorGuidance: {
      verdict: 'Yes',
      roleLabel: 'Local Lawyer (Advocate)',
      reasons: [
        'Cheque bounce notices can lead to a court case, so a lawyer makes sure your reply and payment receipt protect you completely.',
        'If goods were damaged or the cheque was only given for security, a lawyer must send a written reply within 15 days.',
        'A CA handles tax returns, whereas a lawyer handles Section 138 cheque bounce replies.',
      ],
    },

    draftReplyText: `Date: 24 October 2026

To,
Adv. M. Vishwanath & Associates,
Legal Counsel for Deccan Freight & Packaging Pvt. Ltd.,
Bengaluru, Karnataka.

Ref: Your Legal Demand Notice Ref. LEGAL/BLR/138/2026/089 dated 13 Oct 2026 (Received on 15 Oct 2026)
Subject: Reply and Payment of Cheque Amount against Cheque No. 482910 under Section 138 of the NI Act, 1881

Dear Sir,

1. On behalf of Sharma Stores, Bengaluru, we confirm receiving your notice on 15 Oct 2026 regarding Cheque No. 482910 dated 05 Oct 2026 for ₹25,000.

2. Please note that the cheque returned unpaid only due to a short-term cash timing gap and with no bad intention.

3. Within the 15-day legal period from receipt of notice, we are paying the full cheque amount of ₹25,000 via RTGS/NEFT to the business current account of Deccan Freight & Packaging Pvt. Ltd. (UTR No.: [WRITE BANK UTR NUMBER HERE]).

4. Since full payment is made within 15 days under Section 138 of the NI Act, kindly confirm full settlement in writing and return original Cheque No. 482910 within 7 days.

Yours faithfully,
For Sharma Stores
Proprietor / Authorised Signatory
Bengaluru, Karnataka`,

    extensionLetterText: `Date: 24 October 2026

To,
The Authorised Signatory,
Deccan Freight & Packaging Pvt. Ltd.,
Copy to: Adv. M. Vishwanath & Associates, Bengaluru.

Ref: Notice Ref. LEGAL/BLR/138/2026/089 dated 13 Oct 2026 regarding Cheque No. 482910 (₹25,000)
Subject: Request for Friendly Two-Part Payment Schedule

Dear Sir,

1. We value our long business relationship with Deccan Freight & Packaging Pvt. Ltd. We received your notice on 15 Oct 2026 regarding Cheque No. 482910 for ₹25,000.

2. Because festival payments from our retail buyers are delayed by a few days, we kindly request your agreement to accept payment in two parts:
   - First payment of ₹12,500 by RTGS on or before 28 Oct 2026; and
   - Balance payment of ₹12,500 by RTGS on or before 06 Nov 2026.

3. Kindly confirm in writing by 27 Oct 2026 if Deccan Freight & Packaging Pvt. Ltd. accepts this schedule so we can transfer the first part immediately.

Yours sincerely,
For Sharma Stores
Proprietor / Authorised Signatory
Bengaluru, Karnataka`,

    confidence: {
      sender: 'Read from notice',
      lawSection: 'Read from notice',
      whatIsAsked: 'Read from notice',
      amountDemanded: 'Read from notice',
      deadline: 'Read from notice',
    },

    sourceSnippet:
      'STATUTORY DEMAND NOTICE UNDER SECTION 138 OF THE NEGOTIABLE INSTRUMENTS ACT, 1881. Ref: LEGAL/BLR/138/2026/089. Cheque No. 482910 dated 05.10.2026 for ₹25,000 drawn by Sharma Stores returned unpaid...',
    linkedToCashflow: true,
  },

  {
    id: 'notice-gst-drc01-002',
    sampleKey: 'gst_drc01',
    title: 'GST Show-Cause Notice (Form GST DRC-01)',
    referenceNumber: 'ZD291026048192F',
    status: 'In progress',
    createdAt: '2026-10-24',

    authorityName: 'Assistant Commissioner of Commercial Taxes (GST Office LGSTO-020), Bengaluru',
    authenticity: {
      verdict: 'genuine',
      summary:
        'Looks genuine — has an official government DIN number, comes from @gst.gov.in, and asks payment only on the official GST website.',
      dinValue: 'CBIC-2026-10-4918273645',
      dinCheckNote:
        'Official DIN CBIC-2026-10-4918273645 is printed clearly (can be checked on esanchar.cbic.gov.in).',
      officialDomainValue: 'noreply@gst.gov.in',
      domainCheckNote: 'Official Government GST website email (@gst.gov.in).',
      requestsPersonalAccount: false,
      paymentCheckNote:
        'Safe: Asks payment only on services.gst.gov.in — does NOT ask for any personal bank account or UPI.',
    },

    lawSection: 'Section 73(1) of the CGST / KGST Act, 2017 (Form GST DRC-01)',
    lawPlainExplanation:
      'The GST officer is asking you to explain a mismatch between the GST credit you claimed and what your suppliers uploaded.',

    whatIsAskedLines: [
      'Your GST return claimed ₹15,200 more input tax credit than what showed up from your suppliers.',
      'Upload your purchase bills, transport slips, and bank payment proof on the GST portal to explain.',
      'Or, if the claim was a mistake, pay ₹18,500 (₹15,200 tax + ₹1,800 interest + ₹1,500 fine) within 30 days.',
    ],

    amountDemanded: 18500,
    amountBreakdown: 'Tax: ₹15,200 · Interest: ₹1,800 · Fine: ₹1,500 (Total: ₹18,500)',

    severity: 'Needs attention',
    severityReason:
      'You have 30 days to reply — if you upload supplier bills on time, you may not have to pay this money.',

    issueDate: '2026-10-04',
    receivedDate: '2026-10-06',
    receivedDateConfirmed: false,
    statutoryDaysFromReceipt: 30,
    deadlineDate: '2026-11-05',
    deadlineCalculationBasis:
      '30 calendar days from the day you received the GST notice (received 6 Oct 2026 + 30 days = 5 Nov 2026).',

    ignoreTimeline: [
      {
        timeframe: 'After 5 Nov 2026',
        title: 'One-Sided Final Tax Bill (DRC-07)',
        detail:
          'If you do not reply, the GST officer can make the ₹18,500 bill final without hearing your side.',
      },
      {
        timeframe: '1 to 3 Months Later',
        title: '18% Yearly Interest Keeps Growing',
        detail:
          'Daily interest keeps adding onto ₹15,200 until resolved.',
      },
      {
        timeframe: 'After 3 Months',
        title: 'E-Way Bill Block & Bank Hold',
        detail:
          'GST portal can stop your e-Way bills for shop goods and recover money from your bank account.',
      },
    ],

    documentsChecklist: [
      {
        id: 'gst-doc-1',
        label: 'List matching your GSTR-3B return with supplier GSTR-2B',
        detail: 'Shows which spice supplier uploaded their bill late.',
        checked: true,
      },
      {
        id: 'gst-doc-2',
        label: 'Original GST purchase bills from those suppliers',
        detail: 'Must clearly show GST number and tax breakup.',
        checked: true,
      },
      {
        id: 'gst-doc-3',
        label: 'E-Way bills and transport lorry receipts',
        detail: 'Proves the spice sacks actually came to your shop.',
        checked: false,
      },
      {
        id: 'gst-doc-4',
        label: 'Bank statement showing NEFT payment to those suppliers',
        detail: 'Proves you paid the supplier along with GST.',
        checked: false,
      },
    ],

    advisorGuidance: {
      verdict: 'Maybe',
      roleLabel: 'Chartered Accountant (CA)',
      reasons: [
        'If your CA Ramesh already files your monthly GST, share this notice with him so he can upload Form DRC-06 cleanly.',
        'If a supplier filed late in the next month, attaching the bills and bank proof usually closes the matter.',
        'You do not need a court lawyer for this GST portal notice.',
      ],
    },

    draftReplyText: `Date: 24 October 2026

To,
The Assistant Commissioner of Commercial Taxes (LGSTO-020),
Bengaluru, Karnataka.

Ref: Show Cause Notice in Form GST DRC-01 Ref. No. ZD291026048192F dated 04 Oct 2026 | DIN: CBIC-2026-10-4918273645
Subject: Reply in Form GST DRC-06 with Purchase Bills and Bank Proof

Respected Sir / Madam,

1. With reference to your GST notice proposing ₹18,500 (including tax of ₹15,200), we respectfully submit our explanation and purchase records on behalf of Sharma Stores.

2. All GST credit of ₹15,200 is for genuine spice stock received at our shop and paid through our bank account.

3. The difference in GSTR-2B happened only because two registered suppliers uploaded their bills in the next month’s return. We have not claimed any extra credit.

4. We are attaching:
   (a) Bill-by-bill matching statement;
   (b) Copies of signed GST purchase invoices and e-Way bills; and
   (c) Bank statement entries showing full payment to the suppliers.

5. Kindly check these records, drop the proposed demand of ₹18,500, and give us a personal hearing opportunity if any clarification is needed.

Yours faithfully,
For Sharma Stores
Proprietor / Authorised Signatory
Bengaluru, Karnataka`,

    extensionLetterText: `Date: 24 October 2026

To,
The Assistant Commissioner of Commercial Taxes (LGSTO-020),
Bengaluru, Karnataka.

Ref: Show Cause Notice in Form GST DRC-01 Ref. No. ZD291026048192F | DIN: CBIC-2026-10-4918273645
Subject: Request for 15 More Days to Collect Supplier Bills and Bank Records

Respected Sir / Madam,

1. We received the above GST DRC-01 notice regarding ₹18,500 input tax credit difference.

2. We are collecting lorry receipts, signed bills, and GST filing proofs from our outstation spice suppliers so we can submit a complete reply.

3. Under Section 75(5) of the CGST Act, we kindly request 15 extra days after 05 November 2026 to upload our full reply in Form GST DRC-06. We have not asked for extra time earlier.

Thanking you,
Yours faithfully,
For Sharma Stores
Proprietor / Authorised Signatory`,

    confidence: {
      sender: 'Read from notice',
      lawSection: 'Read from notice',
      whatIsAsked: 'Read from notice',
      amountDemanded: 'Read from notice',
      deadline: 'Estimated, please confirm',
    },

    sourceSnippet:
      'FORM GST DRC-01 Reference No: ZD291026048192F | DIN: CBIC-2026-10-4918273645. Excess ITC in GSTR-3B vs GSTR-2B of ₹15,200 plus interest ₹1,800 and penalty ₹1,500 (Total ₹18,500)...',
    linkedToCashflow: true,
  },

  {
    id: 'notice-it-143-003',
    sampleKey: 'it_143_1',
    title: 'Income Tax Intimation u/s 143(1)',
    referenceNumber: 'CPC/2627/A6/2491827345',
    status: 'New',
    createdAt: '2026-10-24',

    authorityName: 'Income Tax Department (CPC Bengaluru)',
    authenticity: {
      verdict: 'genuine',
      summary:
        'Looks genuine — routine computer check from CPC Bengaluru with an official reference number and @cpc.incometax.gov.in email.',
      dinValue: 'CPC/2627/A6/2491827345',
      dinCheckNote:
        'Official CPC Reference CPC/2627/A6/2491827345 can be seen after logging in to eportal.incometax.gov.in.',
      officialDomainValue: 'intimations@cpc.incometax.gov.in',
      domainCheckNote: 'Official Income Tax Department (.gov.in) email address.',
      requestsPersonalAccount: false,
      paymentCheckNote:
        'Safe: Any payment is only on the official Income Tax portal (e-Pay Tax), never to any private account.',
    },

    lawSection: 'Section 143(1) of the Income-tax Act, 1961',
    lawPlainExplanation:
      'This is an automatic computer check comparing your filed Income Tax Return with tax credit records on the portal.',

    whatIsAskedLines: [
      'The Income Tax computer found ₹6,400 less TDS tax credit in your Form 26AS than what was written in your return.',
      'Check if your wholesale buyer has now updated their TDS filing in Form 26AS.',
      'Log in to the Income Tax portal to ask for a free computer re-check, or pay ₹6,400 if it was claimed by mistake.',
    ],

    amountDemanded: 6400,
    amountBreakdown: 'TDS difference: ₹6,150 · Interest: ₹250 (Total: ₹6,400)',

    severity: 'Routine',
    severityReason:
      'Routine computer summary — not a raid or audit, and you still have 25 days to respond online.',

    issueDate: '2026-10-18',
    receivedDate: '2026-10-19',
    receivedDateConfirmed: true,
    statutoryDaysFromReceipt: 30,
    deadlineDate: '2026-11-18',
    deadlineCalculationBasis:
      '30 calendar days from receiving the intimation email (received 19 Oct 2026 + 30 days = 18 Nov 2026).',

    ignoreTimeline: [
      {
        timeframe: 'After 18 Nov 2026',
        title: '1% Monthly Interest Starts',
        detail:
          'Simple interest of 1% per month (~₹64/month) starts adding onto ₹6,400.',
      },
      {
        timeframe: 'Next Tax Return',
        title: 'Future Tax Refund Adjusted',
        detail:
          'If you get any tax refund next year, ₹6,400 will be cut from it.',
      },
      {
        timeframe: 'After 6 Months',
        title: 'Tax Officer Reminder',
        detail:
          'You will get a reminder email to clear or reply to the pending ₹6,400 demand.',
      },
    ],

    documentsChecklist: [
      {
        id: 'it-doc-1',
        label: 'Latest Form 26AS and AIS tax credit statement',
        detail: 'Check if the ₹6,150 TDS from your customer now shows up.',
        checked: false,
      },
      {
        id: 'it-doc-2',
        label: 'Form 16A TDS certificate given by your customer',
        detail: 'Check customer TAN number and amount deducted.',
        checked: false,
      },
      {
        id: 'it-doc-3',
        label: 'Copy of filed Income Tax Return for this year',
        detail: 'Check that there was no typing mistake in the TDS entry.',
        checked: false,
      },
    ],

    advisorGuidance: {
      verdict: 'No',
      roleLabel: 'Online Portal (or ask your CA during regular visit)',
      reasons: [
        'For a small ₹6,400 TDS computer mismatch, clicking "Tax Credit Mismatch" online takes 5 minutes with zero fee.',
        'If TDS was typed twice by mistake, you can pay ₹6,400 directly on the portal.',
        'You can also forward it on WhatsApp to CA Ramesh if he keeps your portal password.',
      ],
    },

    draftReplyText: `Date: 24 October 2026

Online Reply on Income Tax Portal (Pending Actions -> Response to Outstanding Demand)

Authority: Centralized Processing Centre (CPC), Income Tax Department, Bengaluru
Reference No.: CPC/2627/A6/2491827345 dated 18 Oct 2026
Assessment Year: 2026-27

Subject: Reply to ₹6,400 Demand u/s 143(1) and Request for TDS Credit Re-check u/s 154

Reason for Portal Submission:
1. The demand of ₹6,400 arose only because TDS credit of ₹6,150 (plus ₹250 interest) deducted by our buyer had not yet updated when the return was processed.

2. Our buyer has now updated their quarterly TDS statement, and the ₹6,150 credit appears in our latest Form 26AS.

3. We have submitted an online Section 154 Rectification request on the portal. Kindly reprocess the return, allow the TDS credit, and reduce the payable amount to ₹0.

Submitted by:
Proprietor — Sharma Stores
Bengaluru, Karnataka`,

    extensionLetterText: `Date: 24 October 2026

To,
The Assessing Officer,
Income Tax Department, Bengaluru, Karnataka.

Ref: Intimation u/s 143(1) Ref. No. CPC/2627/A6/2491827345 dated 18 Oct 2026 (Amount: ₹6,400)
Subject: Request for 30 Days Time While Buyer Updates TDS Statement

Respected Sir / Madam,

1. Regarding the intimation u/s 143(1) showing ₹6,400 payable due to unmatched TDS credit, tax was already deducted from our wholesale bills.

2. Our buyer is filing their TDS correction so the credit appears in our Form 26AS within 21 days.

3. Kindly grant 30 days time and keep recovery of ₹6,400 on hold while the TDS correction and online re-check are completed.

Yours faithfully,
For Sharma Stores
Proprietor`,

    confidence: {
      sender: 'Read from notice',
      lawSection: 'Read from notice',
      whatIsAsked: 'Read from notice',
      amountDemanded: 'Read from notice',
      deadline: 'Read from notice',
    },

    sourceSnippet:
      'INCOME TAX DEPARTMENT — CPC BENGALURU. Intimation u/s 143(1). Reference No: CPC/2627/A6/2491827345. Net Amount Payable: ₹6,400 due to TDS mismatch with Form 26AS...',
    linkedToCashflow: true,
  },
];

export function getSampleNoticeByKey(key: 'gst_drc01' | 'it_143_1' | 'ni_138_cheque'): LegalNotice {
  const found = SAMPLE_NOTICES.find((n) => n.sampleKey === key) || SAMPLE_NOTICES[0];
  return JSON.parse(JSON.stringify(found));
}
