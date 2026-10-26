import React, { useState } from 'react';
import {
  X,
  Scan,
  Upload,
  CheckCircle2,
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { InvoiceScanResult, Transaction, TransactionType } from '../types/cashflow';
import { AppLanguage } from '../types/munimji';
import { ANCHOR_DATE } from '../data/initialData';
import {
  TRANSLATIONS,
  formatLocalDate,
  formatRupee,
  getLocalizedExtraUI,
} from '../utils/translations';
import {
  fromNativeDigits,
  localizeInvoiceCode,
  localizePartyName,
  localizeTxTitle,
  toNativeDigits,
} from '../utils/localization';

interface InvoiceScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmTransaction: (tx: Omit<Transaction, 'id'>) => void;
  isDemoWorkspace?: boolean;
  language?: AppLanguage;
}

const SCAN_MODAL_COPY: Record<
  AppLanguage,
  {
    headerSubtitle: string;
    uploadHint: string;
    demoSamplesBadge: string;
    enterManuallyBtn: string;
    demoSampleTag: string;
    manualEntryTitle: string;
    confidencePrefix: string;
    confidenceHigh: string;
    confidenceMedium: string;
    confidenceLow: string;
    reviewFieldsHint: string;
    enterCarefullyHint: string;
    unreadableWarning: string;
    networkErrorWarning: string;
    missingFieldsNotice: string;
    checkMissingFieldsNotice: string;
    errPartyRequired: string;
    errAmountRequired: string;
    errDueDateRequired: string;
    customerNameLabel: string;
    supplierNameLabel: string;
    checkTag: string;
    missingOnBillTag: string;
    requiredTag: string;
    partyPlaceholder: string;
    invoiceDateLabel: string;
    promisedDateLabel: string;
    paymentDetailsLabel: string;
    paymentDetailsPlaceholder: string;
    itemsPlaceholder: string;
    fieldNames: Record<string, string>;
  }
> = {
  en: {
    headerSubtitle:
      'Upload a bill photo or PDF — review and edit every detail before saving',
    uploadHint:
      'Supports JPG, PNG, WEBP photos & PDF bills · Reads name, bill number, amount, dates & payment notes',
    demoSamplesBadge: '(Sample Bills)',
    enterManuallyBtn: 'Or Enter Bill Manually →',
    demoSampleTag: 'Sample Bill',
    manualEntryTitle: 'Manual Bill Entry',
    confidencePrefix: 'Read clarity:',
    confidenceHigh: 'Clear',
    confidenceMedium: 'Medium',
    confidenceLow: 'Low — please check',
    reviewFieldsHint: 'Review and complete the details below',
    enterCarefullyHint: 'Enter bill details below',
    unreadableWarning:
      'Could not clearly read every detail from this image. Please check and fill any missing boxes below, or upload a clearer photo.',
    networkErrorWarning:
      'Could not read this bill right now. No guessed values were filled — please enter the bill details below or try again.',
    missingFieldsNotice: 'Details not visible on the bill (please fill below):',
    checkMissingFieldsNotice: 'Please check unprinted details:',
    errPartyRequired: 'Please enter the customer or supplier name.',
    errAmountRequired: 'Please enter a valid Rupee amount.',
    errDueDateRequired: 'Please select a due date before saving.',
    customerNameLabel: 'Customer Name *',
    supplierNameLabel: 'Supplier / Payee Name *',
    checkTag: '(Please check)',
    missingOnBillTag: '(Not on bill)',
    requiredTag: '(Required)',
    partyPlaceholder: 'Enter customer or supplier name',
    invoiceDateLabel: 'Bill Date',
    promisedDateLabel: 'Customer Promised Date (Optional)',
    paymentDetailsLabel: 'Payment Details (UPI / Bank / Credit Days)',
    paymentDetailsPlaceholder: 'UPI ID, bank details, or credit days',
    itemsPlaceholder: 'Items or bill summary',
    fieldNames: {
      partyName: 'Party Name',
      invoiceNumber: 'Bill Number',
      totalAmount: 'Amount',
      invoiceDate: 'Bill Date',
      dueDate: 'Due Date',
      paymentDetails: 'Payment Details',
    },
  },
  kn: {
    headerSubtitle:
      'ಬಿಲ್ ಫೋಟೋ ಅಥವಾ ಪಿಡಿಎಫ್ ಹಾಕಿ — ಉಳಿಸುವ ಮೊದಲು ಎಲ್ಲಾ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತು ತಿದ್ದಿರಿ',
    uploadHint:
      'ಜೆಪಿಜಿ, ಪಿಎನ್‌ಜಿ, ಫೋಟೋ ಮತ್ತು ಪಿಡಿಎಫ್ ಬಿಲ್ ಬೆಂಬಲಿಸುತ್ತದೆ · ಹೆಸರು, ಬಿಲ್ ಸಂಖ್ಯೆ, ಮೊತ್ತ ಮತ್ತು ದಿನಾಂಕ ಓದುತ್ತದೆ',
    demoSamplesBadge: '(ಮಾದರಿ ಬಿಲ್‌ಗಳು)',
    enterManuallyBtn: 'ಅಥವಾ ನೀವೇ ಬಿಲ್ ವಿವರ ಬರೆಯಿರಿ →',
    demoSampleTag: 'ಮಾದರಿ ಬಿಲ್',
    manualEntryTitle: 'ಕೈಯಾರೆ ಬಿಲ್ ನಮೂದು',
    confidencePrefix: 'ಓದಿದ ಸ್ಪಷ್ಟತೆ:',
    confidenceHigh: 'ಸ್ಪಷ್ಟವಾಗಿದೆ',
    confidenceMedium: 'ಮಧ್ಯಮ',
    confidenceLow: 'ಕಡಿಮೆ — ದಯವಿಟ್ಟು ಪರಿಶೀಲಿಸಿ',
    reviewFieldsHint: 'ಕೆಳಗಿನ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಪೂರ್ಣಗೊಳಿಸಿ',
    enterCarefullyHint: 'ಕೆಳಗೆ ಬಿಲ್ ವಿವರಗಳನ್ನು ನಮೂದಿಸಿ',
    unreadableWarning:
      'ಈ ಫೋಟೋದಿಂದ ಎಲ್ಲಾ ಬಿಲ್ ಅಕ್ಷರಗಳನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ಓದಲಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಖಾಲಿ ಇರುವ ವಿವರಗಳನ್ನು ಕೆಳಗೆ ತುಂಬಿರಿ ಅಥವಾ ಸ್ಪಷ್ಟ ಫೋಟೋ ಹಾಕಿ.',
    networkErrorWarning:
      'ಈಗ ಬಿಲ್ ಓದಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ಯಾವುದೇ ಅಂದಾಜು ಮಾಹಿತಿ ತುಂಬಿಲ್ಲ — ದಯವಿಟ್ಟು ಕೆಳಗೆ ಬಿಲ್ ವಿವರಗಳನ್ನು ನಮೂದಿಸಿ.',
    missingFieldsNotice: 'ಬಿಲ್‌ನಲ್ಲಿ ಕಾಣದ ವಿವರಗಳು (ದಯವಿಟ್ಟು ಕೆಳಗೆ ತುಂಬಿರಿ):',
    checkMissingFieldsNotice: 'ದಯವಿಟ್ಟು ಬಿಲ್‌ನಲ್ಲಿ ಇಲ್ಲದ ವಿವರಗಳನ್ನು ಗಮನಿಸಿ:',
    errPartyRequired: 'ದಯವಿಟ್ಟು ಗ್ರಾಹಕ ಅಥವಾ ಸಪ್ಲೈಯರ್ ಹೆಸರನ್ನು ನಮೂದಿಸಿ.',
    errAmountRequired: 'ದಯವಿಟ್ಟು ಸರಿಯಾದ ರೂಪಾಯಿ ಮೊತ್ತವನ್ನು ನಮೂದಿಸಿ.',
    errDueDateRequired: 'ಉಳಿಸುವ ಮೊದಲು ದಯವಿಟ್ಟು ಗಡುವು ದಿನಾಂಕವನ್ನು ಆಯ್ಕೆಮಾಡಿ.',
    customerNameLabel: 'ಗ್ರಾಹಕರ ಹೆಸರು *',
    supplierNameLabel: 'ಸಪ್ಲೈಯರ್ / ಹಣ ಪಡೆಯುವವರ ಹೆಸರು *',
    checkTag: '(ಪರಿಶೀಲಿಸಿ)',
    missingOnBillTag: '(ಬಿಲ್‌ನಲ್ಲಿ ಇಲ್ಲ)',
    requiredTag: '(ಅಗತ್ಯವಿದೆ)',
    partyPlaceholder: 'ಗ್ರಾಹಕ ಅಥವಾ ಸಪ್ಲೈಯರ್ ಹೆಸರು ಬರೆಯಿರಿ',
    invoiceDateLabel: 'ಬಿಲ್ ದಿನಾಂಕ',
    promisedDateLabel: 'ಗ್ರಾಹಕರು ಮಾತು ಕೊಟ್ಟ ದಿನಾಂಕ (ಐಚ್ಛಿಕ)',
    paymentDetailsLabel: 'ಪಾವತಿ ವಿವರಗಳು (ಯುಪಿಐ / ಬ್ಯಾಂಕ್ / ಸಾಲದ ದಿನಗಳು)',
    paymentDetailsPlaceholder: 'ಯುಪಿಐ ಐಡಿ, ಬ್ಯಾಂಕ್ ವಿವರ ಅಥವಾ ಸಾಲದ ದಿನಗಳು',
    itemsPlaceholder: 'ಸರಕು ಅಥವಾ ಬಿಲ್ ವಿವರ',
    fieldNames: {
      partyName: 'ಹೆಸರು',
      invoiceNumber: 'ಬಿಲ್ ಸಂಖ್ಯೆ',
      totalAmount: 'ಮೊತ್ತ',
      invoiceDate: 'ಬಿಲ್ ದಿನಾಂಕ',
      dueDate: 'ಗಡುವು ದಿನಾಂಕ',
      paymentDetails: 'ಪಾವತಿ ವಿವರ',
    },
  },
  hi: {
    headerSubtitle:
      'बिल की फ़ोटो या पीडीएफ़ अपलोड करें — सेव करने से पहले सभी जानकारी जाँचें और सुधारें',
    uploadHint:
      'जेपीजी, पीएनजी फ़ोटो और पीडीएफ़ बिल समर्थित · नाम, बिल नंबर, राशि, तारीख़ और भुगतान विवरण पढ़ता है',
    demoSamplesBadge: '(नमूना बिल)',
    enterManuallyBtn: 'या बिल हाथ से लिखें →',
    demoSampleTag: 'नमूना बिल',
    manualEntryTitle: 'हाथ से बिल प्रविष्टि',
    confidencePrefix: 'पढ़ने की स्पष्टता:',
    confidenceHigh: 'स्पष्ट',
    confidenceMedium: 'मध्यम',
    confidenceLow: 'कम — कृपया जाँचें',
    reviewFieldsHint: 'नीचे दी गई जानकारी जाँचें और पूरी करें',
    enterCarefullyHint: 'नीचे बिल का विवरण भरें',
    unreadableWarning:
      'इस फ़ोटो से बिल के सभी अक्षर साफ़ नहीं पढ़े जा सके। कृपया छूटी हुई जानकारी नीचे भरें या साफ़ फ़ोटो डालें।',
    networkErrorWarning:
      'अभी बिल पढ़ने में समस्या आई। कोई अंदाज़े वाला मान नहीं भरा गया — कृपया नीचे विवरण लिखें।',
    missingFieldsNotice: 'बिल पर न दिखने वाली जानकारी (कृपया नीचे भरें):',
    checkMissingFieldsNotice: 'कृपया छूटी हुई जानकारी जाँच लें:',
    errPartyRequired: 'कृपया ग्राहक या सप्लायर का नाम लिखें।',
    errAmountRequired: 'कृपया सही रुपये की राशि दर्ज करें।',
    errDueDateRequired: 'सेव करने से पहले देय तारीख़ चुनें।',
    customerNameLabel: 'ग्राहक का नाम *',
    supplierNameLabel: 'सप्लायर / पाने वाले का नाम *',
    checkTag: '(जाँचें)',
    missingOnBillTag: '(बिल पर नहीं है)',
    requiredTag: '(आवश्यक)',
    partyPlaceholder: 'ग्राहक या सप्लायर का नाम लिखें',
    invoiceDateLabel: 'बिल तारीख़',
    promisedDateLabel: 'ग्राहक की वादा तारीख़ (वैकल्पिक)',
    paymentDetailsLabel: 'भुगतान विवरण (यूपीआई / बैंक / उधार दिन)',
    paymentDetailsPlaceholder: 'यूपीआई आईडी, बैंक विवरण या उधार शर्तें',
    itemsPlaceholder: 'सामान या बिल का संक्षिप्त विवरण',
    fieldNames: {
      partyName: 'नाम',
      invoiceNumber: 'बिल नंबर',
      totalAmount: 'राशि',
      invoiceDate: 'बिल तारीख़',
      dueDate: 'देय तारीख़',
      paymentDetails: 'भुगतान विवरण',
    },
  },
  ta: {
    headerSubtitle:
      'பில் புகைப்படம் அல்லது பிடிஎஃப் பதிவேற்றவும் — சேமிக்கும் முன் அனைத்து விவரங்களையும் சரிபார்க்கவும்',
    uploadHint:
      'ஜேபிஜி, பிஎன்ஜி புகைப்படம் மற்றும் பிடிஎஃப் பில்கள் · பெயர், பில் எண், தொகை, தேதிகளைப் படிக்கும்',
    demoSamplesBadge: '(மாதிரி பில்கள்)',
    enterManuallyBtn: 'அல்லது நீங்களே பில் எழுதவும் →',
    demoSampleTag: 'மாதிரி பில்',
    manualEntryTitle: 'கைமுறை பில் பதிவு',
    confidencePrefix: 'வாசிப்பு தெளிவு:',
    confidenceHigh: 'தெளிவு',
    confidenceMedium: 'நடுத்தரம்',
    confidenceLow: 'குறைவு — சரிபார்க்கவும்',
    reviewFieldsHint: 'கீழே உள்ள விவரங்களைச் சரிபார்த்து நிரப்பவும்',
    enterCarefullyHint: 'பில் விவரங்களை கீழே உள்ளிடவும்',
    unreadableWarning:
      'இந்தப் படத்திலிருந்து அனைத்து எழுத்துகளையும் தெளிவாகப் படிக்க முடியவில்லை. விடுபட்ட விவரங்களை கீழே நிரப்பவும்.',
    networkErrorWarning:
      'இப்போது பில்லைப் படிக்க முடியவில்லை. எந்த ஊக மதிப்பும் நிரப்பப்படவில்லை — கீழே விவரங்களை உள்ளிடவும்.',
    missingFieldsNotice: 'பில்லில் தெரியாத விவரங்கள் (கீழே நிரப்பவும்):',
    checkMissingFieldsNotice: 'பில்லில் இல்லாத விவரங்களைச் சரிபார்க்கவும்:',
    errPartyRequired: 'வாடிக்கையாளர் அல்லது சப்ளையர் பெயரை உள்ளிடவும்.',
    errAmountRequired: 'சரியான ரூபாய் தொகையை உள்ளிடவும்.',
    errDueDateRequired: 'சேமிக்கும் முன் கெடு தேதியைத் தேர்ந்தெடுக்கவும்.',
    customerNameLabel: 'வாடிக்கையாளர் பெயர் *',
    supplierNameLabel: 'சப்ளையர் / பெறுபவர் பெயர் *',
    checkTag: '(சரிபார்க்கவும்)',
    missingOnBillTag: '(பில்லில் இல்லை)',
    requiredTag: '(தேவை)',
    partyPlaceholder: 'வாடிக்கையாளர் அல்லது சப்ளையர் பெயர்',
    invoiceDateLabel: 'பில் தேதி',
    promisedDateLabel: 'வாடிக்கையாளர் உறுதியளித்த தேதி (விருப்பம்)',
    paymentDetailsLabel: 'கட்டண விவரங்கள் (யுபிஐ / வங்கி / கடன் நாட்கள்)',
    paymentDetailsPlaceholder: 'யுபிஐ ஐடி, வங்கி விவரம் அல்லது கடன் நாட்கள்',
    itemsPlaceholder: 'பொருட்கள் அல்லது பில் சுருக்கம்',
    fieldNames: {
      partyName: 'பெயர்',
      invoiceNumber: 'பில் எண்',
      totalAmount: 'தொகை',
      invoiceDate: 'பில் தேதி',
      dueDate: 'கெடு தேதி',
      paymentDetails: 'கட்டண விவரம்',
    },
  },
  te: {
    headerSubtitle:
      'బిల్లు ఫోటో లేదా పిడిఎఫ్ అప్‌లోడ్ చేయండి — సేవ్ చేసే ముందు అన్ని వివరాలు సరిచూసుకోండి',
    uploadHint:
      'జెపిజి, పిఎన్‌జి ఫోటోలు & పిడిఎఫ్ బిల్లులు · పేరు, బిల్లు నంబర్, మొత్తం, తేదీలను చదువుతుంది',
    demoSamplesBadge: '(నమూనా బిల్లులు)',
    enterManuallyBtn: 'లేదా బిల్లు స్వయంగా నమోదు చేయండి →',
    demoSampleTag: 'నమూనా బిల్లు',
    manualEntryTitle: 'స్వయంగా బిల్లు నమోదు',
    confidencePrefix: 'చదివిన స్పష్టత:',
    confidenceHigh: 'స్పష్టంగా ఉంది',
    confidenceMedium: 'మధ్యస్థం',
    confidenceLow: 'తక్కువ — దయచేసి సరిచూడండి',
    reviewFieldsHint: 'క్రింది వివరాలను సరిచూసి పూర్తి చేయండి',
    enterCarefullyHint: 'బిల్లు వివరాలను క్రింద నమోదు చేయండి',
    unreadableWarning:
      'ఈ ఫోటో నుండి బిల్లు అక్షరాలన్నీ స్పష్టంగా చదవలేకపోయాము. దయచేసి ఖాళీగా ఉన్న వివరాలను క్రింద నింపండి.',
    networkErrorWarning:
      'ఇప్పుడు బిల్లు చదవడం సాధ్యం కాలేదు. ఎలాంటి ఊహా విలువలు నింపలేదు — దయచేసి క్రింద వివరాలు నమోదు చేయండి.',
    missingFieldsNotice: 'బిల్లుపై కనిపించని వివరాలు (క్రింద నింపండి):',
    checkMissingFieldsNotice: 'బిల్లుపై లేని వివరాలను సరిచూడండి:',
    errPartyRequired: 'దయచేసి కస్టమర్ లేదా సప్లయర్ పేరు నమోదు చేయండి.',
    errAmountRequired: 'దయచేసి సరైన రూపాయల మొత్తం నమోదు చేయండి.',
    errDueDateRequired: 'సేవ్ చేసే ముందు గడువు తేదీని ఎంచుకోండి.',
    customerNameLabel: 'కస్టమర్ పేరు *',
    supplierNameLabel: 'సప్లయర్ / చెల్లించాల్సినవారి పేరు *',
    checkTag: '(సరిచూడండి)',
    missingOnBillTag: '(బిల్లుపై లేదు)',
    requiredTag: '(అవసరం)',
    partyPlaceholder: 'కస్టమర్ లేదా సప్లయర్ పేరు రాయండి',
    invoiceDateLabel: 'బిల్లు తేదీ',
    promisedDateLabel: 'కస్టమర్ మాటిచ్చిన తేదీ (ఐచ్ఛికం)',
    paymentDetailsLabel: 'చెల్లింపు వివరాలు (యుపిఐ / బ్యాంక్ / ఉద్దెర రోజులు)',
    paymentDetailsPlaceholder: 'యుపిఐ ఐడి, బ్యాంక్ వివరాలు లేదా ఉద్దెర రోజులు',
    itemsPlaceholder: 'సరుకులు లేదా బిల్లు వివరాలు',
    fieldNames: {
      partyName: 'పేరు',
      invoiceNumber: 'బిల్లు నంబర్',
      totalAmount: 'మొత్తం',
      invoiceDate: 'బిల్లు తేదీ',
      dueDate: 'గడువు తేదీ',
      paymentDetails: 'చెల్లింపు వివరాలు',
    },
  },
  ml: {
    headerSubtitle:
      'ബിൽ ഫോട്ടോ അല്ലെങ്കിൽ പിഡിഎഫ് അപ്‌ലോഡ് ചെയ്യുക — സേവ് ചെയ്യുന്നതിന് മുൻപ് എല്ലാ വിവരങ്ങളും പരിശോധിക്കുക',
    uploadHint:
      'ജെപിജി, പിഎൻജി ഫോട്ടോകളും പിഡിഎഫ് ബില്ലുകളും · പേര്, ബിൽ നമ്പർ, തുക, തീയതികൾ എന്നിവ വായിക്കുന്നു',
    demoSamplesBadge: '(മാതൃകാ ബില്ലുകൾ)',
    enterManuallyBtn: 'അല്ലെങ്കിൽ ബിൽ സ്വയം എഴുതുക →',
    demoSampleTag: 'മാതൃകാ ബിൽ',
    manualEntryTitle: 'സ്വയം ബിൽ ചേർക്കൽ',
    confidencePrefix: 'വായനാ വ്യക്തത:',
    confidenceHigh: 'വ്യക്തം',
    confidenceMedium: 'ഇടത്തരം',
    confidenceLow: 'കുറവ് — പരിശോധിക്കുക',
    reviewFieldsHint: 'താഴെയുള്ള വിവരങ്ങൾ പരിശോധിച്ച് പൂർത്തിയാക്കുക',
    enterCarefullyHint: 'ബിൽ വിവരങ്ങൾ താഴെ നൽകുക',
    unreadableWarning:
      'ഈ ചിത്രത്തിൽ നിന്ന് എല്ലാ വിവരങ്ങളും വ്യക്തമായി വായിക്കാൻ കഴിഞ്ഞില്ല. വിട്ടുപോയ വിവരങ്ങൾ താഴെ പൂരിപ്പിക്കുക.',
    networkErrorWarning:
      'ഇപ്പോൾ ബിൽ വായിക്കാൻ കഴിഞ്ഞില്ല. ഊഹിച്ച വിവരങ്ങളൊന്നും ചേർത്തിട്ടില്ല — ദയവായി താഴെ വിവരങ്ങൾ നൽകുക.',
    missingFieldsNotice: 'ബില്ലിൽ കാണാത്ത വിവരങ്ങൾ (താഴെ പൂരിപ്പിക്കുക):',
    checkMissingFieldsNotice: 'ബില്ലിൽ ഇല്ലാത്ത വിവരങ്ങൾ പരിശോധിക്കുക:',
    errPartyRequired: 'ദയവായി ഉപഭോക്താവിന്റെയോ സപ്ലയറുടെയോ പേര് നൽകുക.',
    errAmountRequired: 'ദയവായി ശരിയായ രൂപ തുക നൽകുക.',
    errDueDateRequired: 'സേവ് ചെയ്യുന്നതിന് മുൻപ് അവസാന തീയതി തിരഞ്ഞെടുക്കുക.',
    customerNameLabel: 'ഉപഭോക്താവിന്റെ പേര് *',
    supplierNameLabel: 'സപ്ലയർ / പണം ലഭിക്കേണ്ടവരുടെ പേര് *',
    checkTag: '(പരിശോധിക്കുക)',
    missingOnBillTag: '(ബില്ലിൽ ഇല്ല)',
    requiredTag: '(ആവശ്യമാണ്)',
    partyPlaceholder: 'ഉപഭോക്താവ് അല്ലെങ്കിൽ സപ്ലയർ പേര്',
    invoiceDateLabel: 'ബിൽ തീയതി',
    promisedDateLabel: 'ഉപഭോക്താവ് വാഗ്ദാനം ചെയ്ത തീയതി (ഐച്ഛികം)',
    paymentDetailsLabel: 'പേയ്‌മെന്റ് വിവരങ്ങൾ (യുപിഐ / ബാങ്ക് / കടം ദിവസങ്ങൾ)',
    paymentDetailsPlaceholder: 'യുപിഐ ഐഡി, ബാങ്ക് വിവരങ്ങൾ അല്ലെങ്കിൽ കടം ദിവസങ്ങൾ',
    itemsPlaceholder: 'സാധനങ്ങൾ അല്ലെങ്കിൽ ബിൽ ചുരുക്കം',
    fieldNames: {
      partyName: 'പേര്',
      invoiceNumber: 'ബിൽ നമ്പർ',
      totalAmount: 'തുക',
      invoiceDate: 'ബിൽ തീയതി',
      dueDate: 'അവസാന തീയതി',
      paymentDetails: 'പേയ്‌മെന്റ് വിവരങ്ങൾ',
    },
  },
};

export const InvoiceScannerModal: React.FC<InvoiceScannerModalProps> = ({
  isOpen,
  onClose,
  onConfirmTransaction,
  isDemoWorkspace = false,
  language = 'en',
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [scanResult, setScanResult] = useState<InvoiceScanResult | null>(null);
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedMimeType, setUploadedMimeType] = useState<string>('');
  const [qualityWarning, setQualityWarning] = useState<string | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDemoSampleLoaded, setIsDemoSampleLoaded] = useState(false);

  const [partyName, setPartyName] = useState('');
  const [type, setType] = useState<TransactionType>('outflow');
  const [amount, setAmount] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(ANCHOR_DATE);
  const [dueDate, setDueDate] = useState('');
  const [promisedDate, setPromisedDate] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [paymentDetails, setPaymentDetails] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<any>('supplier');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const t = TRANSLATIONS[language];
  const extra = getLocalizedExtraUI(language);
  const copy = SCAN_MODAL_COPY[language];
  const sampleInvoices = extra.scanSamples;

  const formatMissingFieldsList = (fields: string[]) =>
    fields.map((f) => copy.fieldNames[f] || f).join(', ');

  const getConfidenceLabel = (conf?: string) => {
    if (conf === 'high') return copy.confidenceHigh;
    if (conf === 'low') return copy.confidenceLow;
    return copy.confidenceMedium;
  };

  const resetScannerState = () => {
    setIsScanning(false);
    setShowReviewForm(false);
    setScanResult(null);
    setUploadedPreviewUrl(null);
    setUploadedFileName(null);
    setUploadedMimeType('');
    setQualityWarning(null);
    setMissingFields([]);
    setValidationError(null);
    setIsDemoSampleLoaded(false);
    setPartyName('');
    setAmount('');
    setInvoiceDate(ANCHOR_DATE);
    setDueDate('');
    setPromisedDate('');
    setInvoiceNumber('');
    setPaymentDetails('');
    setTitle('');
    setNotes('');
  };

  const handleSelectSample = (sample: (typeof sampleInvoices)[0]) => {
    setIsScanning(true);
    setQualityWarning(null);
    setMissingFields([]);
    setValidationError(null);
    setUploadedPreviewUrl(null);
    const localizedSampleInv = localizeInvoiceCode(sample.invoiceNumber, language);
    setUploadedFileName(`${localizedSampleInv} · ${copy.demoSampleTag}`);
    setIsDemoSampleLoaded(true);

    setTimeout(() => {
      const locParty = localizePartyName(sample.partyName, language);
      const locTitle = localizeTxTitle(sample.title, language);
      const locNotes = localizeTxTitle(sample.notes, language);
      setPartyName(locParty);
      setType(sample.type);
      setAmount(toNativeDigits(sample.amount.toString(), language));
      setInvoiceDate('2026-10-24');
      setDueDate(sample.dueDate);
      setPromisedDate('');
      setInvoiceNumber(localizedSampleInv);
      setPaymentDetails(locNotes);
      setTitle(locTitle);
      setCategory(sample.category);
      setNotes(locNotes);

      setScanResult({
        success: true,
        isReadableDocument: true,
        partyName: locParty,
        type: sample.type,
        invoiceNumber: localizedSampleInv,
        invoiceDate: '2026-10-24',
        dueDate: sample.dueDate,
        totalAmount: sample.amount,
        paymentDetails: locNotes,
        category: sample.category as any,
        title: locTitle,
        confidence: 'high',
        notes: locNotes,
      });
      setShowReviewForm(true);
      setIsScanning(false);
    }, 300);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setValidationError(null);
    setQualityWarning(null);
    setMissingFields([]);
    setIsDemoSampleLoaded(false);
    setUploadedFileName(file.name);
    setUploadedMimeType(file.type || 'image/jpeg');

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      if (file.type.startsWith('image/')) {
        setUploadedPreviewUrl(base64);
      } else {
        setUploadedPreviewUrl(null);
      }

      setIsScanning(true);

      try {
        const res = await fetch('/api/invoice/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64,
            mimeType: file.type || 'image/jpeg',
          }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || data.isReadableDocument === false) {
          setScanResult(null);
          setQualityWarning(
            language === 'en' && data.qualityWarning
              ? data.qualityWarning
              : copy.unreadableWarning
          );
          setMissingFields(Array.isArray(data.missingFields) ? data.missingFields : []);
          setPartyName(
            data.partyName ? localizePartyName(data.partyName, language) : ''
          );
          setType((data.type === 'inflow' ? 'inflow' : 'outflow') as TransactionType);
          setAmount(
            data.totalAmount > 0
              ? toNativeDigits(String(data.totalAmount), language)
              : ''
          );
          setInvoiceDate(data.invoiceDate || ANCHOR_DATE);
          setDueDate(data.dueDate || '');
          setPromisedDate('');
          setInvoiceNumber(
            data.invoiceNumber ? localizeInvoiceCode(data.invoiceNumber, language) : ''
          );
          setPaymentDetails(
            data.paymentDetails ? localizeTxTitle(data.paymentDetails, language) : ''
          );
          setTitle(data.title ? localizeTxTitle(data.title, language) : '');
          setCategory(
            data.category || (data.type === 'inflow' ? 'b2b_invoice' : 'supplier')
          );
          setNotes(data.notes ? localizeTxTitle(data.notes, language) : '');
          setShowReviewForm(true);
          return;
        }

        setScanResult(data);
        setQualityWarning(
          data.qualityWarning
            ? language === 'en'
              ? data.qualityWarning
              : copy.unreadableWarning
            : null
        );
        setMissingFields(Array.isArray(data.missingFields) ? data.missingFields : []);
        setPartyName(
          data.partyName ? localizePartyName(data.partyName, language) : ''
        );
        setType((data.type === 'outflow' ? 'outflow' : 'inflow') as TransactionType);
        setAmount(
          data.totalAmount > 0
            ? toNativeDigits(String(data.totalAmount), language)
            : ''
        );
        setInvoiceDate(data.invoiceDate || ANCHOR_DATE);
        setDueDate(data.dueDate || '');
        setPromisedDate('');
        setInvoiceNumber(
          data.invoiceNumber ? localizeInvoiceCode(data.invoiceNumber, language) : ''
        );
        setPaymentDetails(
          data.paymentDetails ? localizeTxTitle(data.paymentDetails, language) : ''
        );
        setTitle(
          data.title
            ? localizeTxTitle(data.title, language)
            : data.partyName
            ? localizePartyName(data.partyName, language)
            : ''
        );
        setCategory(
          data.category || (data.type === 'outflow' ? 'supplier' : 'b2b_invoice')
        );
        setNotes(data.notes ? localizeTxTitle(data.notes, language) : '');
        setShowReviewForm(true);
      } catch {
        setScanResult(null);
        setQualityWarning(copy.networkErrorWarning);
        setShowReviewForm(true);
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = () => {
    setValidationError(null);
    const normalizedAmount = fromNativeDigits(amount).replace(/[^0-9.]/g, '');
    const parsedAmount = parseFloat(normalizedAmount);
    if (!partyName.trim()) {
      setValidationError(copy.errPartyRequired);
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setValidationError(copy.errAmountRequired);
      return;
    }
    if (!dueDate) {
      setValidationError(copy.errDueDateRequired);
      return;
    }

    const combinedNotes = [paymentDetails.trim(), notes.trim()]
      .filter(Boolean)
      .join(' · ');

    onConfirmTransaction({
      partyName: partyName.trim(),
      type,
      amount: Math.round(parsedAmount),
      invoiceDate: invoiceDate || ANCHOR_DATE,
      dueDate,
      promisedDate: type === 'inflow' && promisedDate ? promisedDate : null,
      invoiceNumber: fromNativeDigits(invoiceNumber.trim()) || undefined,
      paymentDetails: paymentDetails.trim() || undefined,
      title: title.trim() || partyName.trim(),
      category,
      status: dueDate < ANCHOR_DATE ? 'overdue' : 'expected',
      notes: combinedNotes || undefined,
      isDemoData: isDemoSampleLoaded || isDemoWorkspace,
    });

    resetScannerState();
    onClose();
  };

  const isFieldMissing = (fieldKey: string) => missingFields.includes(fieldKey);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
      <div className="bg-[#FFFDF9] rounded-3xl shadow-2xl border-2 border-[#D6C5A9] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#EADDC5] flex items-center justify-between bg-[#FAF1DF] sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#14532D] text-[#FDE68A] flex items-center justify-center shrink-0">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-[#1C1917]">
                {t.scanModalTitle}
              </h3>
              <p className="text-xs sm:text-sm text-[#57534E]">
                {copy.headerSubtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              resetScannerState();
              onClose();
            }}
            className="min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center text-[#57534E] hover:bg-white cursor-pointer"
            aria-label={t.closeBtn}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Upload Zone & Sample Bills */}
          {!showReviewForm && !isScanning && (
            <div className="space-y-5">
              <label className="block border-2 border-dashed border-[#D6C5A9] hover:border-[#14532D] rounded-3xl p-6 text-center cursor-pointer transition-colors bg-white hover:bg-[#FAF1DF]/50">
                <Upload className="w-10 h-10 text-[#14532D] mx-auto mb-2" />
                <span className="text-lg font-extrabold text-[#1C1917] block">
                  {t.scanTapUpload}
                </span>
                <span className="text-sm text-[#57534E] mt-1 block">
                  {copy.uploadHint}
                </span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Clearly Separated Demo Sample Bills */}
              <div className="pt-2 border-t border-[#EFE6D5] space-y-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-sm font-extrabold text-[#44403C]">
                    {t.scanTrySampleBills} · {copy.demoSamplesBadge}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(true)}
                    className="text-xs font-extrabold text-[#14532D] hover:underline cursor-pointer"
                  >
                    {copy.enterManuallyBtn}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {sampleInvoices.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSelectSample(s)}
                      className="p-3.5 rounded-2xl border border-[#D6C5A9] bg-white hover:border-[#14532D] hover:bg-[#FAF1DF] text-left transition-colors cursor-pointer"
                    >
                      <span className="text-[11px] font-bold text-amber-800 block">
                        ({copy.demoSampleTag})
                      </span>
                      <span className="font-bold text-[#1C1917] text-sm block mt-0.5 truncate">
                        {localizeTxTitle(s.name, language)}
                      </span>
                      <span className="font-mono tabular-nums font-extrabold text-[#14532D] text-base mt-1 block">
                        {formatRupee(s.amount, language)}
                      </span>
                      <span className="text-xs text-[#57534E] block mt-0.5">
                        {t.duePrefix}: {formatLocalDate(s.dueDate, language)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Scanning Spinner */}
          {isScanning && (
            <div className="p-8 text-center space-y-3">
              <Loader2 className="w-10 h-10 text-[#14532D] animate-spin mx-auto" />
              <p className="text-lg font-extrabold text-[#1C1917]">
                {t.scanReadingMsg}
              </p>
              {uploadedFileName && (
                <p className="text-xs font-mono text-[#57534E]">
                  {toNativeDigits(uploadedFileName, language)}
                </p>
              )}
            </div>
          )}

          {/* Review & Correction Form */}
          {showReviewForm && !isScanning && (
            <div className="space-y-4">
              {/* Document Preview + Re-upload Header */}
              <div className="p-3.5 rounded-2xl bg-[#FAF1DF]/70 border border-[#D6C5A9] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {uploadedPreviewUrl ? (
                    <img
                      src={uploadedPreviewUrl}
                      alt={t.scanModalTitle}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-xl object-cover border border-[#D6C5A9] shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-white border border-[#D6C5A9] flex items-center justify-center shrink-0">
                      <FileText className="w-6 h-6 text-[#14532D]" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <span className="block text-sm font-extrabold text-[#1C1917] truncate">
                      {uploadedFileName
                        ? toNativeDigits(uploadedFileName, language)
                        : copy.manualEntryTitle}
                    </span>
                    <span className="block text-xs text-[#57534E]">
                      {scanResult
                        ? `${copy.confidencePrefix} ${getConfidenceLabel(
                            scanResult.confidence
                          )}${isDemoSampleLoaded ? ` · (${copy.demoSampleTag})` : ''}`
                        : uploadedMimeType
                        ? copy.reviewFieldsHint
                        : copy.enterCarefullyHint}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={resetScannerState}
                  className="text-xs sm:text-sm font-extrabold text-[#14532D] hover:underline cursor-pointer whitespace-nowrap"
                >
                  {extra.scanAnotherBtn}
                </button>
              </div>

              {/* Honest Quality / Missing Field Warnings */}
              {qualityWarning && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs sm:text-sm flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">{qualityWarning}</p>
                    {missingFields.length > 0 && (
                      <p className="text-xs text-amber-900">
                        {copy.missingFieldsNotice}{' '}
                        <span className="font-bold">
                          {formatMissingFieldsList(missingFields)}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {scanResult && !qualityWarning && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs sm:text-sm flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#14532D] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">{extra.scanFieldsReady}</span>
                    {missingFields.length > 0 && (
                      <span className="text-xs text-emerald-900 block mt-0.5">
                        {copy.checkMissingFieldsNotice}{' '}
                        <span className="font-bold">
                          {formatMissingFieldsList(missingFields)}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              )}

              {validationError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs sm:text-sm font-bold">
                  {validationError}
                </div>
              )}

              {/* Inflow vs Outflow Toggle */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#FAF1DF] border border-[#D6C5A9] rounded-2xl">
                <button
                  type="button"
                  onClick={() => setType('inflow')}
                  className={`min-h-[44px] py-2 px-3 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer ${
                    type === 'inflow' ? 'bg-[#14532D] text-white' : 'text-[#44403C]'
                  }`}
                >
                  <ArrowDownLeft className="w-4 h-4 shrink-0" />
                  <span>{t.addMoneyInTab}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setType('outflow')}
                  className={`min-h-[44px] py-2 px-3 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer ${
                    type === 'outflow' ? 'bg-rose-700 text-white' : 'text-[#44403C]'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4 shrink-0" />
                  <span>{t.addMoneyOutTab}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs sm:text-sm text-[#1C1917] font-bold mb-1">
                    {type === 'inflow' ? copy.customerNameLabel : copy.supplierNameLabel}
                    {isFieldMissing('partyName') && (
                      <span className="text-amber-700 ml-1">{copy.checkTag}</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={partyName}
                    onChange={(e) => setPartyName(e.target.value)}
                    placeholder={copy.partyPlaceholder}
                    className={`w-full min-h-[44px] px-3.5 py-2 bg-white border-2 rounded-xl text-sm sm:text-base font-bold text-[#1C1917] ${
                      isFieldMissing('partyName') && !partyName
                        ? 'border-amber-400'
                        : 'border-[#D6C5A9]'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm text-[#1C1917] font-bold mb-1">
                    {extra.addInvoiceRefLabel}
                    {isFieldMissing('invoiceNumber') && (
                      <span className="text-amber-700 ml-1">{copy.missingOnBillTag}</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder={localizeInvoiceCode('INV-425', language)}
                    className="w-full min-h-[44px] px-3.5 py-2 bg-white border-2 border-[#D6C5A9] rounded-xl font-mono text-sm sm:text-base text-[#1C1917]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs sm:text-sm text-[#1C1917] font-bold mb-1">
                    {extra.addAmountLabel} *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={toNativeDigits('0', language)}
                    className={`w-full min-h-[44px] px-3.5 py-2 bg-white border-2 rounded-xl font-mono tabular-nums font-extrabold text-base text-[#1C1917] ${
                      isFieldMissing('totalAmount') && !amount
                        ? 'border-amber-400'
                        : 'border-[#D6C5A9]'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm text-[#1C1917] font-bold mb-1">
                    {copy.invoiceDateLabel}
                  </label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 bg-white border-2 border-[#D6C5A9] rounded-xl font-mono text-sm text-[#1C1917]"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm text-[#1C1917] font-bold mb-1">
                    {extra.addDueDateLabel} *
                    {isFieldMissing('dueDate') && !dueDate && (
                      <span className="text-amber-700 ml-1">{copy.requiredTag}</span>
                    )}
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={`w-full min-h-[44px] px-3 py-2 bg-white border-2 rounded-xl font-mono text-sm text-[#1C1917] ${
                      !dueDate ? 'border-amber-400' : 'border-[#D6C5A9]'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs sm:text-sm text-[#1C1917] font-bold mb-1">
                    {t.billDescriptionLabel}
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={copy.itemsPlaceholder}
                    className="w-full min-h-[44px] px-3.5 py-2 bg-white border-2 border-[#D6C5A9] rounded-xl text-sm sm:text-base text-[#1C1917]"
                  />
                </div>

                {type === 'inflow' ? (
                  <div>
                    <label className="block text-xs sm:text-sm text-[#1C1917] font-bold mb-1">
                      {copy.promisedDateLabel}
                    </label>
                    <input
                      type="date"
                      value={promisedDate}
                      onChange={(e) => setPromisedDate(e.target.value)}
                      className="w-full min-h-[44px] px-3 py-2 bg-white border-2 border-[#D6C5A9] rounded-xl font-mono text-sm text-[#1C1917]"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs sm:text-sm text-[#1C1917] font-bold mb-1">
                      {copy.paymentDetailsLabel}
                    </label>
                    <input
                      type="text"
                      value={paymentDetails}
                      onChange={(e) => setPaymentDetails(e.target.value)}
                      placeholder={copy.paymentDetailsPlaceholder}
                      className="w-full min-h-[44px] px-3.5 py-2 bg-white border-2 border-[#D6C5A9] rounded-xl text-sm text-[#1C1917]"
                    />
                  </div>
                )}
              </div>

              {type === 'inflow' && (
                <div>
                  <label className="block text-xs sm:text-sm text-[#1C1917] font-bold mb-1">
                    {copy.paymentDetailsLabel}
                  </label>
                  <input
                    type="text"
                    value={paymentDetails}
                    onChange={(e) => setPaymentDetails(e.target.value)}
                    placeholder={copy.paymentDetailsPlaceholder}
                    className="w-full min-h-[44px] px-3.5 py-2 bg-white border-2 border-[#D6C5A9] rounded-xl text-sm text-[#1C1917]"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-[#EADDC5] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    resetScannerState();
                    onClose();
                  }}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-[#D6C5A9] text-sm font-bold text-[#44403C] cursor-pointer"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="min-h-[44px] px-5 py-2 bg-[#14532D] hover:bg-[#166534] text-white rounded-xl text-sm font-extrabold cursor-pointer"
                >
                  {t.saveEntryBtn}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
