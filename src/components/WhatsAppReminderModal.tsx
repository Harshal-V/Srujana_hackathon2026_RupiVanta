import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Copy,
  Check,
  ExternalLink,
  Phone,
  AlertCircle,
  Users,
} from 'lucide-react';
import { CustomerProfile, Transaction } from '../types/cashflow';
import { AppLanguage } from '../types/munimji';
import {
  TRANSLATIONS,
  buildCustomerReminderWhatsApp,
  formatLocalDate,
  formatRupee,
  getLocalizedTxStatus,
  getVantaUIText,
} from '../utils/translations';
import {
  fromNativeDigits,
  getDashboardExtraStrings,
  localizeInvoiceCode,
  localizePartyName,
  toNativeDigits,
} from '../utils/localization';

interface WhatsAppReminderModalProps {
  customerTx: Transaction | null;
  customers?: CustomerProfile[];
  workspaceId?: string;
  businessName?: string;
  initialPreparedMessage?: string | null;
  onClose: () => void;
  onMarkPaid: (id: string) => void;
  onReminderLogged?: () => void;
  language?: AppLanguage;
}

const SIX_LANG_OPTIONS: Array<{ id: AppLanguage; label: string }> = [
  { id: 'en', label: 'English' },
  { id: 'kn', label: 'ಕನ್ನಡ' },
  { id: 'hi', label: 'हिन्दी' },
  { id: 'ta', label: 'தமிழ்' },
  { id: 'te', label: 'తెలుగు' },
  { id: 'ml', label: 'മലയാളം' },
];

function extractValid10DigitPhone(raw: string): string | null {
  const digits = fromNativeDigits(String(raw || '')).replace(/\D/g, '');
  const clean10 =
    digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
  return /^[6-9]\d{9}$/.test(clean10) ? clean10 : null;
}

const WA_MODAL_COPY: Record<
  AppLanguage,
  {
    waLinkNote: string;
    phonePlaceholder: string;
    noPhoneSaved: (party: string) => string;
    savePhoneLabel: (phoneDisp: string, party: string) => string;
    phonebookTitle: string;
    editableBadge: string;
    clipboardBlockedNote: string;
    deliveryPreparedNote: (party: string, phoneDisp: string) => string;
  }
> = {
  en: {
    waLinkNote:
      'Messages open directly in your WhatsApp app or WhatsApp Web with this text pre-filled (nothing is auto-sent without your tap).',
    phonePlaceholder: "Enter customer's 10-digit mobile number",
    noPhoneSaved: (party) =>
      `No mobile number is saved yet for ${party}. Enter their 10-digit WhatsApp number above.`,
    savePhoneLabel: (phoneDisp, party) =>
      `Save +91 ${phoneDisp} to ${party}'s customer record`,
    phonebookTitle: 'Customer Phonebook',
    editableBadge: '(Editable Reminder Text)',
    clipboardBlockedNote:
      'Clipboard permission is restricted in this frame. Select the message above to copy manually, or tap Open WhatsApp after confirming.',
    deliveryPreparedNote: (party, phoneDisp) =>
      `WhatsApp message link prepared for ${party} (+91 ${phoneDisp}). Tap "Open WhatsApp" below to review and press Send in WhatsApp.`,
  },
  kn: {
    waLinkNote:
      'ಈ ಸಂದೇಶವು ನಿಮ್ಮ ವಾಟ್ಸಾಪ್ ಆ್ಯಪ್ ಅಥವಾ ವೆಬ್‌ನಲ್ಲಿ ನೇರವಾಗಿ ತುಂಬಿಕೊಂಡು ತೆರೆಯುತ್ತದೆ (ನೀವು ಒತ್ತುವವರೆಗೆ ತಾನಾಗಿಯೇ ಕಳುಹಿಸುವುದಿಲ್ಲ).',
    phonePlaceholder: 'ಗ್ರಾಹಕರ ೧೦ ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ',
    noPhoneSaved: (party) =>
      `${party} ಅವರ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಇನ್ನೂ ಉಳಿಸಿಲ್ಲ. ದಯವಿಟ್ಟು ಮೇಲೆ ೧೦ ಅಂಕಿಯ ವಾಟ್ಸಾಪ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ.`,
    savePhoneLabel: (phoneDisp, party) =>
      `+೯೧ ${phoneDisp} ಸಂಖ್ಯೆಯನ್ನು ${party} ಅವರ ಖಾತೆಯಲ್ಲಿ ಉಳಿಸಿ`,
    phonebookTitle: 'ಗ್ರಾಹಕರ ಫೋನ್ ಪಟ್ಟಿ',
    editableBadge: '(ಸಂದೇಶವನ್ನು ಬೇಕಾದಂತೆ ತಿದ್ದಬಹುದು)',
    clipboardBlockedNote:
      'ನೇರ ಕಾಪಿ ಅನುಮತಿ ನಿರ್ಬಂಧಿತವಾಗಿದೆ. ಮೇಲಿನ ಸಂದೇಶವನ್ನು ಆಯ್ಕೆಮಾಡಿ ಕಾಪಿ ಮಾಡಿ ಅಥವಾ ಕೆಳಗೆ ವಾಟ್ಸಾಪ್ ತೆರೆಯಿರಿ ಒತ್ತಿ.',
    deliveryPreparedNote: (party, phoneDisp) =>
      `${party} (+೯೧ ${phoneDisp}) ಅವರಿಗಾಗಿ ವಾಟ್ಸಾಪ್ ಸಂದೇಶ ಸಿದ್ಧವಾಗಿದೆ. ಕೆಳಗಿನ ಹಸಿರು ಬಟನ್ ಒತ್ತಿ ವಾಟ್ಸಾಪ್‌ನಲ್ಲಿ ಕಳುಹಿಸಿ.`,
  },
  hi: {
    waLinkNote:
      'यह संदेश आपके व्हाट्सएप ऐप या वेब में पहले से भरा हुआ खुलेगा (आपके दबाए बिना अपने-आप नहीं भेजा जाता)।',
    phonePlaceholder: 'ग्राहक का १० अंकों का मोबाइल नंबर लिखें',
    noPhoneSaved: (party) =>
      `${party} का मोबाइल नंबर अभी सेव नहीं है। ऊपर १० अंकों का व्हाट्सएप नंबर लिखें।`,
    savePhoneLabel: (phoneDisp, party) =>
      `+९१ ${phoneDisp} को ${party} के ग्राहक रिकॉर्ड में सेव करें`,
    phonebookTitle: 'ग्राहक फ़ोन सूची',
    editableBadge: '(संदेश बदल सकते हैं)',
    clipboardBlockedNote:
      'यहाँ सीधा कॉपी करने की अनुमति सीमित है। ऊपर से संदेश चुनकर कॉपी करें या पुष्टि के बाद व्हाट्सएप खोलें दबाएं।',
    deliveryPreparedNote: (party, phoneDisp) =>
      `${party} (+९१ ${phoneDisp}) के लिए व्हाट्सएप लिंक तैयार है। नीचे बटन दबाकर व्हाट्सएप में भेजें।`,
  },
  ta: {
    waLinkNote:
      'இந்தச் செய்தி உங்கள் வாட்ஸ்அப் செயலியில் முன்பே நிரப்பப்பட்டு திறக்கும் (நீங்கள் அழுத்தாமல் தானாகச் செல்லாது).',
    phonePlaceholder: 'வாடிக்கையாளரின் ௧௦ இலக்க மொபைல் எண்ணை உள்ளிடவும்',
    noPhoneSaved: (party) =>
      `${party} அவர்களின் மொபைல் எண் இன்னும் சேமிக்கப்படவில்லை. மேலே ௧௦ இலக்க எண்ணை உள்ளிடவும்.`,
    savePhoneLabel: (phoneDisp, party) =>
      `+௯௧ ${phoneDisp} எண்ணை ${party} கணக்கில் சேமிக்கவும்`,
    phonebookTitle: 'வாடிக்கையாளர் தொலைபேசி பட்டியல்',
    editableBadge: '(திருத்தக்கூடிய செய்தி)',
    clipboardBlockedNote:
      'நேரடி நகல் அனுமதி இல்லை. மேலே உள்ள செய்தியைத் தேர்ந்தெடுத்து நகலெடுக்கவும் அல்லது வாட்ஸ்அப் திறக்கவும்.',
    deliveryPreparedNote: (party, phoneDisp) =>
      `${party} (+௯௧ ${phoneDisp}) அவர்களுக்கான வாட்ஸ்அப் செய்தி தயாராக உள்ளது. கீழே உள்ள பொத்தானை அழுத்தி அனுப்பவும்.`,
  },
  te: {
    waLinkNote:
      'ఈ సందేశం మీ వాట్సాప్ యాప్ లేదా వెబ్‌లో ముందే నింపబడి తెరుచుకుంటుంది (మీరు నొక్కకుండా దానంతట అదే వెళ్ళదు).',
    phonePlaceholder: 'కస్టమర్ ౧౦ అంకెల మొబైల్ నంబర్ నమోదు చేయండి',
    noPhoneSaved: (party) =>
      `${party} మొబైల్ నంబర్ ఇంకా సేవ్ కాలేదు. పైన ౧౦ అంకెల వాట్సాప్ నంబర్ నమోదు చేయండి.`,
    savePhoneLabel: (phoneDisp, party) =>
      `+౯౧ ${phoneDisp} నంబర్‌ను ${party} ఖాతాలో సేవ్ చేయండి`,
    phonebookTitle: 'కస్టమర్ ఫోన్ జాబితా',
    editableBadge: '(మార్చుకోగల సందేశం)',
    clipboardBlockedNote:
      'ఇక్కడ నేరుగా కాపీ అనుమతి లేదు. పైన ఉన్న సందేశాన్ని ఎంచుకుని కాపీ చేయండి లేదా వాట్సాప్ తెరవండి.',
    deliveryPreparedNote: (party, phoneDisp) =>
      `${party} (+౯౧ ${phoneDisp}) కోసం వాట్సాప్ లింక్ సిద్ధంగా ఉంది. దిగువ బటన్ నొక్కి వాట్సాప్‌లో పంపండి.`,
  },
  ml: {
    waLinkNote:
      'ഈ സന്ദേശം നിങ്ങളുടെ വാട്ട്‌സ്ആപ്പിൽ മുൻകൂട്ടി പൂരിപ്പിച്ച് തുറക്കും (നിങ്ങൾ അമർത്താതെ തനിയെ അയയ്ക്കില്ല).',
    phonePlaceholder: 'ഇടപാടുകാരന്റെ ൧൦ അക്ക മൊബൈൽ നമ്പർ നൽകുക',
    noPhoneSaved: (party) =>
      `${party} എന്നയാളുടെ മൊബൈൽ നമ്പർ സേവ് ചെയ്തിട്ടില്ല. മുകളിൽ ൧൦ അക്ക നമ്പർ നൽകുക.`,
    savePhoneLabel: (phoneDisp, party) =>
      `+൯൧ ${phoneDisp} എന്ന നമ്പർ ${party} ന്റെ കണക്കിൽ സേവ് ചെയ്യുക`,
    phonebookTitle: 'ഇടപാടുകാരുടെ ഫോൺ പട്ടിക',
    editableBadge: '(സന്ദേശം തിരുത്താം)',
    clipboardBlockedNote:
      'ക്ലിപ്പ്ബോർഡ് അനുമതി പരിമിതമാണ്. മുകളിലെ സന്ദേശം തിരഞ്ഞെടുത്ത് കോപ്പി ചെയ്യുക അല്ലെങ്കിൽ വാട്ട്‌സ്ആപ്പ് തുറക്കുക.',
    deliveryPreparedNote: (party, phoneDisp) =>
      `${party} (+൯൧ ${phoneDisp}) നായുള്ള വാട്ട്‌സ്ആപ്പ് ലിങ്ക് തയ്യാറാണ്. താഴെയുള്ള ബട്ടൺ അമർത്തി അയയ്ക്കുക.`,
  },
};

export const WhatsAppReminderModal: React.FC<WhatsAppReminderModalProps> = ({
  customerTx,
  customers = [],
  workspaceId = 'demo-sharma',
  businessName = 'Sharma Stores',
  initialPreparedMessage = null,
  onClose,
  onMarkPaid,
  onReminderLogged,
  language = 'en',
}) => {
  const [messageLang, setMessageLang] = useState<AppLanguage>(language);
  const [recipientName, setRecipientName] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [savePhoneToRecord, setSavePhoneToRecord] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [clipboardBlocked, setClipboardBlocked] = useState(false);
  const [customText, setCustomText] = useState('');
  const [deliveryNotice, setDeliveryNotice] = useState<string | null>(null);

  const t = TRANSLATIONS[language];
  const vt = getVantaUIText(language);
  const uiExtra = getDashboardExtraStrings(language);
  const copy = WA_MODAL_COPY[language] || WA_MODAL_COPY.en;

  useEffect(() => {
    if (!customerTx) return;
    const amount = Math.max(0, customerTx.amount - (customerTx.paidAmount || 0));
    const invoiceNo = customerTx.invoiceNumber || customerTx.id;

    const matchedCustomer = customers.find(
      (c) =>
        (customerTx.customerId && c.id === customerTx.customerId) ||
        c.name.trim().toLowerCase() === customerTx.partyName.trim().toLowerCase()
    );

    const resolvedDigits =
      extractValid10DigitPhone(customerTx.contactPhone || '') ||
      extractValid10DigitPhone(matchedCustomer?.contactPhone || '') ||
      '';

    setMessageLang(language);
    setRecipientName(customerTx.partyName);
    setPhoneInput(resolvedDigits);
    setSavePhoneToRecord(!resolvedDigits);
    setConfirmed(false);
    setCopied(false);
    setClipboardBlocked(false);
    setDeliveryNotice(null);

    const baseDraft =
      initialPreparedMessage ||
      buildCustomerReminderWhatsApp(
        customerTx.partyName,
        invoiceNo,
        amount,
        customerTx.dueDate,
        businessName,
        language
      );

    setCustomText(baseDraft);
  }, [customerTx, customers, language, businessName, initialPreparedMessage]);

  if (!customerTx) return null;

  const amount = Math.max(0, customerTx.amount - (customerTx.paidAmount || 0));
  const invoiceNo = customerTx.invoiceNumber || customerTx.id;
  const valid10Phone = extractValid10DigitPhone(phoneInput);

  const localizedTxParty = localizePartyName(customerTx.partyName, language);
  const localizedRecipient = localizePartyName(
    recipientName || customerTx.partyName,
    language
  );
  const localizedInvoice = localizeInvoiceCode(invoiceNo, language);

  const otherCustomerContacts = customers.filter(
    (c) => extractValid10DigitPhone(c.contactPhone || '') !== null
  );

  const handleLangToggle = (newLang: AppLanguage) => {
    setMessageLang(newLang);
    setConfirmed(false);
    setCustomText(
      buildCustomerReminderWhatsApp(
        recipientName || customerTx.partyName,
        invoiceNo,
        amount,
        customerTx.dueDate,
        businessName,
        newLang
      )
    );
  };

  const handleSelectCustomerContact = (cust: CustomerProfile) => {
    const clean = extractValid10DigitPhone(cust.contactPhone) || '';
    setRecipientName(cust.name);
    setPhoneInput(clean);
    setConfirmed(false);
    setCustomText(
      buildCustomerReminderWhatsApp(
        cust.name,
        invoiceNo,
        amount,
        customerTx.dueDate,
        businessName,
        messageLang
      )
    );
  };

  const logReminderToServer = async (
    method: 'whatsapp_deeplink' | 'copied_clipboard'
  ) => {
    try {
      await fetch('/api/reminders/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          transactionId: customerTx.id,
          customerId: customerTx.customerId,
          partyName: recipientName || customerTx.partyName,
          phone: valid10Phone ? `+91 ${valid10Phone}` : phoneInput,
          invoiceNumber: invoiceNo,
          amount,
          language: messageLang,
          deliveryMethod: method,
          savePhoneToCustomer: Boolean(savePhoneToRecord && valid10Phone),
        }),
      });
      onReminderLogged?.();
    } catch {
      // Non-blocking audit log
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(customText);
      setCopied(true);
      setClipboardBlocked(false);
      await logReminderToServer('copied_clipboard');
      setTimeout(() => setCopied(false), 2400);
    } catch {
      setClipboardBlocked(true);
    }
  };

  const handleConfirmRecipient = async () => {
    if (!valid10Phone || !customText.trim()) return;
    setConfirmed(true);
    setDeliveryNotice(
      copy.deliveryPreparedNote(
        localizedRecipient,
        toNativeDigits(valid10Phone, language)
      )
    );
    await logReminderToServer('whatsapp_deeplink');
  };

  const waUrl = valid10Phone
    ? `https://wa.me/91${valid10Phone}?text=${encodeURIComponent(customText)}`
    : '#';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#FFFDF9] rounded-3xl shadow-2xl border-2 border-[#D6C5A9] w-full max-w-xl overflow-hidden flex flex-col my-auto">
        {/* Header */}
        <div className="khata-ledger-header px-5 sm:px-6 py-4 border-b border-[#E5D9C3] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-[#15803D] flex items-center justify-center text-white shrink-0">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg sm:text-xl font-extrabold text-[#1C1917] truncate">
                  {t.waCustomerModalTitle}
                </h3>
                <span className="text-xs font-bold text-amber-900">
                  · {vt.waStatusPreparedNotSent}
                </span>
              </div>
              <p className="text-sm text-[#57534E] truncate">{t.waCustomerSubtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[42px] px-3 py-1.5 rounded-xl bg-white border border-[#D6C5A9] text-[#1C1917] font-bold text-sm inline-flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
            <span>{t.closeBtn}</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[78vh] overflow-y-auto">
          {/* Honest Delivery & API Limitation Disclosure */}
          <div className="p-3.5 rounded-2xl bg-[#FAF1DF] border border-[#E5D9C3] flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-[#C2410C] shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-[#44403C] leading-snug space-y-1">
              <p className="font-semibold">{vt.waNotConfiguredBanner}</p>
              <p className="text-xs text-[#57534E]">{copy.waLinkNote}</p>
            </div>
          </div>

          {/* Invoice & Recipient Summary */}
          <div className="p-4 rounded-2xl bg-white border border-[#D6C5A9] space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-lg font-extrabold text-[#1C1917]">
                  {localizedTxParty}
                </h4>
                <p className="text-xs sm:text-sm font-mono text-[#57534E]">
                  #{localizedInvoice} · {uiExtra.dueWord}{' '}
                  {formatLocalDate(customerTx.dueDate, language)}
                  {customerTx.promisedDate
                    ? ` · ${uiExtra.promisedWord} ${formatLocalDate(
                        customerTx.promisedDate,
                        language
                      )}`
                    : ''}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="font-mono tabular-nums font-extrabold text-xl text-rose-700 block">
                  {formatRupee(amount, language)}
                </span>
                <span className="text-xs font-bold text-rose-700">
                  {getLocalizedTxStatus(customerTx.status, language)}
                </span>
              </div>
            </div>

            {/* Validated Recipient Phone Input */}
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-bold text-[#44403C]">
                {t.personPhoneLabel} ({localizedRecipient})
              </label>
              <div className="flex items-center gap-2">
                <span className="px-3 py-2 rounded-xl bg-[#FAF1DF] border border-[#D6C5A9] font-mono font-bold text-sm text-[#1C1917] inline-flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-[#14532D]" />
                  <span>{toNativeDigits('+91', language)}</span>
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={12}
                  value={toNativeDigits(phoneInput, language)}
                  onChange={(e) => {
                    setPhoneInput(fromNativeDigits(e.target.value));
                    setConfirmed(false);
                  }}
                  placeholder={copy.phonePlaceholder}
                  className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-[#CBBBA0] font-mono font-bold text-base text-[#1C1917] focus:outline-none focus:border-[#14532D]"
                />
              </div>

              {!valid10Phone ? (
                <p role="alert" className="text-xs font-bold text-rose-700">
                  {phoneInput.trim() === ''
                    ? copy.noPhoneSaved(localizedTxParty)
                    : vt.waInvalidPhoneError}
                </p>
              ) : (
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#44403C] cursor-pointer pt-0.5">
                  <input
                    type="checkbox"
                    checked={savePhoneToRecord}
                    onChange={(e) => setSavePhoneToRecord(e.target.checked)}
                    className="rounded accent-[#14532D]"
                  />
                  <span>
                    {copy.savePhoneLabel(
                      toNativeDigits(valid10Phone, language),
                      localizedRecipient
                    )}
                  </span>
                </label>
              )}
            </div>

            {/* Quick Select ONLY from Customer Directory */}
            {otherCustomerContacts.length > 0 && (
              <div className="pt-2 border-t border-[#EFE6D5] space-y-1.5">
                <span className="text-xs font-bold text-[#57534E] flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#14532D]" />
                  <span>{copy.phonebookTitle}</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {otherCustomerContacts.map((cust) => {
                    const pClean = extractValid10DigitPhone(cust.contactPhone) || '';
                    const active =
                      valid10Phone === pClean &&
                      recipientName.toLowerCase() === cust.name.toLowerCase();
                    return (
                      <button
                        key={cust.id}
                        type="button"
                        onClick={() => handleSelectCustomerContact(cust)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#14532D] text-white border-[#14532D]'
                            : 'bg-[#FAF1DF] text-[#1C1917] border-[#D6C5A9] hover:bg-[#F3E5C8]'
                        }`}
                      >
                        {localizePartyName(cust.name, language)} (
                        {toNativeDigits(pClean, language)})
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 6-Language Editable Message Switcher */}
          <div className="space-y-1.5">
            <span className="font-bold text-[#1C1917] text-sm block">
              {t.messageLangLabel} {copy.editableBadge}
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {SIX_LANG_OPTIONS.map((lng) => (
                <button
                  key={lng.id}
                  type="button"
                  onClick={() => handleLangToggle(lng.id)}
                  className={`min-h-[36px] px-3 py-1 text-xs sm:text-sm font-bold rounded-xl cursor-pointer whitespace-nowrap ${
                    messageLang === lng.id
                      ? 'bg-[#14532D] text-white'
                      : 'bg-[#FAF1DF] text-[#1C1917] border border-[#D6C5A9]'
                  }`}
                >
                  {lng.label}
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={customText}
            onChange={(e) => {
              setCustomText(e.target.value);
              setConfirmed(false);
            }}
            rows={4}
            aria-label={t.messageLangLabel}
            className="w-full p-3.5 bg-white border border-[#CBBBA0] rounded-2xl text-sm sm:text-base text-[#1C1917] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#14532D]"
          />

          {clipboardBlocked && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs font-semibold text-amber-950">
              {copy.clipboardBlockedNote}
            </div>
          )}

          {confirmed && valid10Phone && deliveryNotice && (
            <div className="p-3.5 rounded-2xl bg-[#ECFDF5] border border-[#86EFAC] text-xs sm:text-sm font-semibold text-[#14532D] leading-snug">
              {deliveryNotice}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-[#FAF1DF] border-t border-[#E5D9C3] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="min-h-[44px] px-3.5 py-2 bg-white border border-[#CBBBA0] text-[#1C1917] rounded-xl text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-700" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              <span>{copied ? t.copiedBtn : t.copyBtn}</span>
            </button>

            {!customerTx.id.startsWith('tx-temp-') && customerTx.status !== 'paid' && (
              <button
                type="button"
                onClick={() => {
                  onMarkPaid(customerTx.id);
                  onClose();
                }}
                className="min-h-[44px] px-3.5 py-2 bg-white border border-[#CBBBA0] text-[#14532D] rounded-xl text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{t.markReceivedBtn}</span>
              </button>
            )}
          </div>

          {!confirmed ? (
            <button
              type="button"
              disabled={!valid10Phone || !customText.trim()}
              onClick={handleConfirmRecipient}
              className="min-h-[46px] px-5 py-2.5 bg-[#15803D] hover:bg-[#166534] disabled:opacity-50 text-white rounded-xl text-sm sm:text-base font-extrabold inline-flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{vt.waConfirmRecipientStepBtn}</span>
            </button>
          ) : (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[46px] px-5 py-2.5 bg-[#15803D] hover:bg-[#166534] text-white rounded-xl text-sm sm:text-base font-extrabold inline-flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{t.openWhatsAppPressSend}</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
