import React, { useEffect, useState } from 'react';
import {
  Users,
  Clock,
  Send,
  Search,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Edit3,
  Check,
  X,
} from 'lucide-react';
import {
  CustomerProfile,
  MLPaymentPrediction,
  Transaction,
} from '../types/cashflow';
import { AppLanguage } from '../types/munimji';
import { ANCHOR_DATE } from '../data/initialData';
import {
  TRANSLATIONS,
  formatIndianNumber,
  formatLocalDate,
  formatRupee,
  getLocalizedCustomerNote,
  getLocalizedExtraUI,
  getPredictiveFinanceText,
} from '../utils/translations';
import {
  fromNativeDigits,
  getDashboardExtraStrings,
  getSimplePredictionCopy,
  localizeCustomerCategory,
  localizeCustomerId,
  localizeInvoiceCode,
  localizePartyName,
  localizePhoneDisplay,
  toNativeDigits,
} from '../utils/localization';

interface CustomerIntelligenceProps {
  customers: CustomerProfile[];
  transactions?: Transaction[];
  mlPredictionsByTxId?: Record<string, MLPaymentPrediction>;
  isDemoWorkspace?: boolean;
  onRemindTransaction?: (tx: Transaction) => void;
  onOpenFollowUpFor?: (customerName: string, amount: number, invoiceNo?: string) => void;
  onUpdateCustomerPhone?: (customerId: string, newPhone: string) => Promise<void> | void;
  language?: AppLanguage;
}

const CUST_EXTRA_LABELS: Record<
  AppLanguage,
  {
    emptyHeading: string;
    emptyBody: string;
    demoCustBadge: string;
    realCustBadge: string;
    notAddedPhone: string;
    openBillsHeading: (cnt: string) => string;
  }
> = {
  en: {
    emptyHeading: 'No customer records in this ledger yet.',
    emptyBody:
      'When you add or scan a customer bill in Pending Payments, RupiVanta creates a Customer ID and tracks their payment habit automatically.',
    demoCustBadge: 'Sample Demo Customer',
    realCustBadge: 'Real Ledger Customer',
    notAddedPhone: 'Not added yet',
    openBillsHeading: (cnt) => `Open Bills & Arrival Analysis (${cnt})`,
  },
  kn: {
    emptyHeading: 'ಈ ಖಾತೆಯಲ್ಲಿ ಇನ್ನೂ ಯಾವುದೇ ಗ್ರಾಹಕರ ದಾಖಲೆಗಳಿಲ್ಲ.',
    emptyBody:
      'ನೀವು ಬಾಕಿ ಪಾವತಿಗಳಲ್ಲಿ ಗ್ರಾಹಕರ ಬಿಲ್ ಸೇರಿಸಿದಾಗ ಅಥವಾ ಸ್ಕ್ಯಾನ್ ಮಾಡಿದಾಗ, ರೂಪಿವಂತ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಅವರ ಪಾವತಿ ಅಭ್ಯಾಸವನ್ನು ದಾಖಲಿಸುತ್ತದೆ.',
    demoCustBadge: 'ಮಾದರಿ ಡೆಮೊ ಗ್ರಾಹಕ',
    realCustBadge: 'ನಿಜವಾದ ವ್ಯಾಪಾರ ಗ್ರಾಹಕ',
    notAddedPhone: 'ಇನ್ನೂ ಸೇರಿಸಿಲ್ಲ',
    openBillsHeading: (cnt) => `ಬಾಕಿ ಬಿಲ್‌ಗಳು ಮತ್ತು ಪಾವತಿ ಅಭ್ಯಾಸದ ವಿಶ್ಲೇಷಣೆ (${cnt})`,
  },
  hi: {
    emptyHeading: 'इस खाते में अभी कोई ग्राहक रिकॉर्ड नहीं है।',
    emptyBody:
      'जब आप लंबित भुगतान में ग्राहक का बिल जोड़ते या स्कैन करते हैं, तो रूपिवंता अपने-आप उनकी भुगतान आदत याद रखता है।',
    demoCustBadge: 'डेमो ग्राहक',
    realCustBadge: 'असली खाता ग्राहक',
    notAddedPhone: 'अभी नहीं जोड़ा गया',
    openBillsHeading: (cnt) => `बाक़ी बिल और भुगतान आदत विश्लेषण (${cnt})`,
  },
  ta: {
    emptyHeading: 'இந்தக் கணக்கில் இன்னும் வாடிக்கையாளர் பதிவுகள் இல்லை.',
    emptyBody:
      'நிலுவை வரவுகளில் வாடிக்கையாளர் பில்லைச் சேர்க்கும்போது, ரூபிவந்தா அவர்களின் கடந்தகால பழக்கத்தைத் தானாகவே சேமிக்கும்.',
    demoCustBadge: 'மாதிரி டெமோ வாடிக்கையாளர்',
    realCustBadge: 'உண்மையான கணக்கு வாடிக்கையாளர்',
    notAddedPhone: 'இன்னும் சேர்க்கப்படவில்லை',
    openBillsHeading: (cnt) => `நிலுவை பில்கள் மற்றும் வரவு பகுப்பாய்வு (${cnt})`,
  },
  te: {
    emptyHeading: 'ఈ ఖాతాలో ఇంకా కస్టమర్ రికార్డులు లేవు.',
    emptyBody:
      'పెండింగ్ చెల్లింపులలో కస్టమర్ బిల్లు జోడించినప్పుడు, రూపివంత వారి చెల్లింపు అలవాటును ఆటోమేటిక్‌గా గుర్తుంచుకుంటుంది.',
    demoCustBadge: 'డెమో కస్టమర్',
    realCustBadge: 'నిజమైన ఖాతా కస్టమర్',
    notAddedPhone: 'ఇంకా జోడించలేదు',
    openBillsHeading: (cnt) => `పెండింగ్ బిల్లులు మరియు రాక విశ్లేషణ (${cnt})`,
  },
  ml: {
    emptyHeading: 'ഈ കണക്കിൽ ഇതുവരെ ഇടപാടുകാരുടെ വിവരങ്ങളില്ല.',
    emptyBody:
      'ലഭിക്കാനുള്ള തുകയിൽ ഇടപാടുകാരന്റെ ബിൽ ചേർക്കുമ്പോൾ രൂപിവന്ത അവരുടെ പേയ്‌മെന്റ് ശീലം തനിയെ സൂക്ഷിക്കും.',
    demoCustBadge: 'മാതൃകാ ഡെമോ ഇടപാടുകാരൻ',
    realCustBadge: 'യഥാർത്ഥ ബിസിനസ് ഇടപാടുകാരൻ',
    notAddedPhone: 'ഇതുവരെ ചേർത്തിട്ടില്ല',
    openBillsHeading: (cnt) => `ബാക്കിയുള്ള ബില്ലുകളും വരവ് വിശകലനവും (${cnt})`,
  },
};

export const CustomerIntelligenceSection: React.FC<CustomerIntelligenceProps> = ({
  customers,
  transactions = [],
  mlPredictionsByTxId = {},
  isDemoWorkspace = false,
  onRemindTransaction,
  onOpenFollowUpFor,
  onUpdateCustomerPhone,
  language = 'en',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    customers[0]?.id || ''
  );
  const [showCaDetails, setShowCaDetails] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneDraft, setPhoneDraft] = useState('');

  const t = TRANSLATIONS[language];
  const extra = getLocalizedExtraUI(language);
  const pf = getPredictiveFinanceText(language);
  const uiExtra = getDashboardExtraStrings(language);
  const cLabels = CUST_EXTRA_LABELS[language] || CUST_EXTRA_LABELS.en;

  useEffect(() => {
    if (customers.length > 0 && !customers.some((c) => c.id === selectedCustomerId)) {
      setSelectedCustomerId(customers[0].id);
    }
  }, [customers, selectedCustomerId]);

  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const locName = localizePartyName(c.name, language).toLowerCase();
    const locCat = localizeCustomerCategory(c.category, language).toLowerCase();
    const locId = localizeCustomerId(c.id, language).toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      locName.includes(q) ||
      c.category.toLowerCase().includes(q) ||
      locCat.includes(q) ||
      c.id.toLowerCase().includes(q) ||
      locId.includes(q)
    );
  });

  const selectedCustomer =
    customers.find((c) => c.id === selectedCustomerId) || filteredCustomers[0] || null;

  const openCustomerInvoices = selectedCustomer
    ? transactions.filter(
        (tx) =>
          tx.type === 'inflow' &&
          tx.status !== 'paid' &&
          (tx.customerId === selectedCustomer.id ||
            tx.partyName.trim().toLowerCase() === selectedCustomer.name.trim().toLowerCase())
      )
    : [];

  const getReliabilityLabel = (tier: CustomerProfile['reliabilityTier']) => {
    switch (tier) {
      case 'high':
        return { label: t.custReliableHigh, textClass: 'text-[#14532D]' };
      case 'moderate':
        return { label: t.custReliableModerate, textClass: 'text-amber-800' };
      case 'cautious':
      case 'high_risk':
        return { label: t.custReliableCaution, textClass: 'text-rose-700' };
    }
  };

  const handleTriggerWhatsApp = (cust: CustomerProfile, targetTx?: Transaction) => {
    if (targetTx && onRemindTransaction) {
      onRemindTransaction(targetTx);
      return;
    }

    const firstOpen = openCustomerInvoices[0];
    if (firstOpen && onRemindTransaction) {
      onRemindTransaction(firstOpen);
      return;
    }

    if (onRemindTransaction) {
      const pendingHist = cust.history.find((h) => !h.paidDate);
      const fallbackAmt = cust.overdueBalance || cust.pendingBalance || pendingHist?.amount || 0;
      const syntheticTx: Transaction = {
        id: `tx-cust-${cust.id}`,
        customerId: cust.id,
        type: 'inflow',
        title: `Receivable (${cust.name})`,
        partyName: cust.name,
        contactPhone: cust.contactPhone !== 'N/A' ? cust.contactPhone : '',
        amount: fallbackAmt,
        dueDate: pendingHist?.dueDate || ANCHOR_DATE,
        promisedDate: pendingHist?.promisedDate || null,
        status: cust.overdueBalance > 0 ? 'overdue' : 'expected',
        category: 'b2b_invoice',
        invoiceNumber: pendingHist?.invoiceNumber || 'OPEN-BAL',
        isDemoData: isDemoWorkspace,
      };
      onRemindTransaction(syntheticTx);
      return;
    }

    if (onOpenFollowUpFor) {
      const pendingHist = cust.history.find((h) => !h.paidDate);
      onOpenFollowUpFor(
        cust.name,
        cust.overdueBalance || cust.pendingBalance,
        pendingHist?.invoiceNumber
      );
    }
  };

  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !onUpdateCustomerPhone) return;
    await onUpdateCustomerPhone(selectedCustomer.id, fromNativeDigits(phoneDraft.trim()));
    setIsEditingPhone(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="khata-card rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#14532D] text-white flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#1C1917]">
              {t.custTitle}
            </h2>
            <p className="text-sm sm:text-base text-[#57534E] mt-0.5">
              {t.custSubtitle}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#78716C] absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.custSearchPlaceholder}
            className="w-full min-h-[44px] pl-10 pr-4 py-2 bg-white border border-[#D6C5A9] rounded-xl text-sm text-[#1C1917] focus:outline-none focus:border-[#14532D]"
          />
        </div>
      </div>

      {customers.length === 0 ? (
        <div className="khata-card rounded-3xl p-10 text-center text-[#57534E] space-y-2">
          <p className="text-base font-bold text-[#1C1917]">{cLabels.emptyHeading}</p>
          <p className="text-sm">{cLabels.emptyBody}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Col: Customer List */}
          <div className="lg:col-span-1 space-y-3">
            <span className="text-sm font-extrabold text-[#44403C] block">
              {t.custListHeading} ({formatIndianNumber(filteredCustomers.length, language)})
            </span>

            <div className="space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
              {filteredCustomers.map((cust) => {
                const isSelected = selectedCustomer?.id === cust.id;
                const rel = getReliabilityLabel(cust.reliabilityTier);
                const settledCount = cust.history.filter((h) => h.paidDate !== null).length;

                return (
                  <button
                    key={cust.id}
                    type="button"
                    onClick={() => {
                      setSelectedCustomerId(cust.id);
                      setIsEditingPhone(false);
                    }}
                    className={`w-full p-4 rounded-2xl border transition-colors cursor-pointer text-left space-y-2 ${
                      isSelected
                        ? 'bg-[#ECFDF5] border-[#14532D]'
                        : 'bg-[#FFFDF9] border-[#D6C5A9] hover:bg-[#FAF1DF]/60'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <h4 className="text-base font-extrabold text-[#1C1917]">
                        {localizePartyName(cust.name, language)}
                      </h4>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#57534E]">
                        <span className="font-mono">
                          {localizeCustomerId(cust.id, language)}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className={`font-bold ${rel.textClass}`}>
                          {settledCount === 0 ? uiExtra.newCustomerZeroBills : rel.label}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#EADDC5] text-xs">
                      <div>
                        <span className="text-[#57534E] block">{t.custUsualDelay}</span>
                        <span className="font-mono tabular-nums font-bold text-[#1C1917]">
                          {settledCount === 0
                            ? pf.basisBaseline
                            : uiExtra.daysLateSuffix(Math.round(cust.avgPaymentDelayDays))}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#57534E] block">{t.custPaysOnTime}</span>
                        <span className="font-mono tabular-nums font-bold text-[#14532D]">
                          {settledCount === 0
                            ? '—'
                            : `${formatIndianNumber(cust.onTimeRatePercent, language)}%`}
                        </span>
                      </div>
                    </div>

                    {cust.pendingBalance > 0 && (
                      <div className="pt-1.5 border-t border-[#EADDC5] flex items-center justify-between text-xs font-bold">
                        <span
                          className={
                            cust.overdueBalance > 0 ? 'text-rose-700' : 'text-[#1E3A8A]'
                          }
                        >
                          {cust.overdueBalance > 0 ? t.filterOverdue : t.pendingLabel}:
                        </span>
                        <span className="font-mono tabular-nums text-[#1C1917]">
                          {formatRupee(
                            cust.overdueBalance > 0
                              ? cust.overdueBalance
                              : cust.pendingBalance,
                            language
                          )}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Col: Selected Customer Profile, Open Invoices & Payment History */}
          {selectedCustomer && (
            <div className="lg:col-span-2 space-y-5">
              <div className="khata-card rounded-3xl p-5 sm:p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-4 border-b border-[#EADDC5] gap-3">
                  <div className="space-y-1">
                    <h3 className="text-xl sm:text-2xl font-extrabold text-[#1C1917]">
                      {localizePartyName(selectedCustomer.name, language)}
                    </h3>

                    {/* Unboxed Metadata: Customer ID · Record Type · Category */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#57534E]">
                      <span className="font-mono font-bold text-[#1C1917]">
                        {localizeCustomerId(selectedCustomer.id, language)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {selectedCustomer.isDemo || isDemoWorkspace
                          ? cLabels.demoCustBadge
                          : cLabels.realCustBadge}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {localizeCustomerCategory(selectedCustomer.category, language)}
                      </span>
                    </div>

                    {/* Editable Customer WhatsApp Phone */}
                    {isEditingPhone ? (
                      <form
                        onSubmit={handleSavePhone}
                        className="flex flex-wrap items-center gap-2 pt-2"
                      >
                        <input
                          type="tel"
                          value={phoneDraft}
                          onChange={(e) => setPhoneDraft(e.target.value)}
                          placeholder={toNativeDigits('9845123401', language)}
                          className="min-h-[36px] px-3 py-1 rounded-lg bg-white border border-[#14532D] font-mono tabular-nums text-xs text-[#1C1917]"
                        />
                        <button
                          type="submit"
                          className="min-h-[36px] px-3 py-1 rounded-lg bg-[#14532D] text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{uiExtra.saveBtn}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingPhone(false)}
                          className="min-h-[36px] px-2.5 py-1 rounded-lg bg-white border border-[#D6C5A9] text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    ) : (
                      <div className="flex items-center gap-2 pt-1 text-sm text-[#44403C]">
                        <span>
                          {extra.custPhoneLabel}:{' '}
                          <strong className="font-mono tabular-nums">
                            {selectedCustomer.contactPhone &&
                            selectedCustomer.contactPhone !== 'N/A'
                              ? localizePhoneDisplay(selectedCustomer.contactPhone, language)
                              : cLabels.notAddedPhone}
                          </strong>
                        </span>
                        {onUpdateCustomerPhone && (
                          <button
                            type="button"
                            onClick={() => {
                              setPhoneDraft(
                                selectedCustomer.contactPhone !== 'N/A'
                                  ? selectedCustomer.contactPhone
                                  : ''
                              );
                              setIsEditingPhone(true);
                            }}
                            className="text-xs font-bold text-[#14532D] hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>{uiExtra.addPhoneBtn}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {selectedCustomer.pendingBalance > 0 && (
                    <button
                      type="button"
                      onClick={() => handleTriggerWhatsApp(selectedCustomer)}
                      className="min-h-[42px] px-4 py-2 bg-[#15803D] hover:bg-[#166534] text-white rounded-xl text-xs sm:text-sm font-extrabold inline-flex items-center gap-2 cursor-pointer self-start whitespace-nowrap"
                    >
                      <Send className="w-4 h-4" />
                      <span>
                        {t.sendWhatsApp} (
                        {formatRupee(
                          selectedCustomer.overdueBalance > 0
                            ? selectedCustomer.overdueBalance
                            : selectedCustomer.pendingBalance,
                          language
                        )}
                        )
                      </span>
                    </button>
                  )}
                </div>

                {/* 4 Metric Summaries */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#E5D9C3]">
                    <span className="text-xs font-bold text-[#57534E] block">
                      {uiExtra.totalBilledCol}
                    </span>
                    <div className="text-lg font-extrabold font-mono tabular-nums text-[#1C1917] mt-1">
                      {formatRupee(selectedCustomer.totalBilled, language)}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                    <span className="text-xs font-bold text-emerald-900 block">
                      {t.custTotalReceived}
                    </span>
                    <div className="text-lg font-extrabold font-mono tabular-nums text-emerald-900 mt-1">
                      {formatRupee(selectedCustomer.totalPaid, language)}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#E5D9C3]">
                    <span className="text-xs font-bold text-[#57534E] block">
                      {uiExtra.avgDelayCol}
                    </span>
                    <div className="text-lg font-extrabold font-mono tabular-nums text-[#1C1917] mt-1">
                      {selectedCustomer.cautiousEstimate.hasSufficientHistory
                        ? uiExtra.daysLateSuffix(Math.round(selectedCustomer.avgPaymentDelayDays))
                        : pf.basisBaseline}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#E5D9C3]">
                    <span className="text-xs font-bold text-[#57534E] block">
                      {uiExtra.openPendingCol}
                    </span>
                    <div className="text-lg font-extrabold font-mono tabular-nums text-[#1E3A8A] mt-1">
                      {formatRupee(selectedCustomer.pendingBalance, language)}
                    </div>
                  </div>
                </div>

                {/* Expected Arrival & Habit Summary Card */}
                <div className="p-4 rounded-2xl bg-amber-50/75 border border-amber-300 space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-sm font-extrabold text-amber-950">
                    <Clock className="w-4 h-4 text-amber-800 shrink-0" />
                    <span>{uiExtra.nextExpectedCol}:</span>
                    <span className="font-mono tabular-nums">
                      {formatLocalDate(
                        selectedCustomer.cautiousEstimate.expectedSettlementDate,
                        language
                      )}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="text-xs font-bold text-amber-900">
                      {selectedCustomer.cautiousEstimate.hasSufficientHistory
                        ? pf.basisHistory
                        : pf.basisBaseline}
                    </span>
                  </div>
                  <p className="text-sm text-amber-950 leading-relaxed">
                    {getLocalizedCustomerNote(selectedCustomer, language)}
                  </p>
                  <div className="pt-2 border-t border-amber-200/80 text-xs text-amber-900 flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <span>{extra.custCautionBanner}</span>
                  </div>
                </div>

                {/* Open Invoices & Simple Delay Analysis */}
                {openCustomerInvoices.length > 0 && (
                  <div className="pt-2 border-t border-[#EADDC5] space-y-2.5">
                    <h4 className="text-sm font-extrabold text-[#1C1917]">
                      {cLabels.openBillsHeading(
                        formatIndianNumber(openCustomerInvoices.length, language)
                      )}
                    </h4>
                    {openCustomerInvoices.map((tx) => {
                      const pred = mlPredictionsByTxId[tx.id];
                      const predCopy = pred ? getSimplePredictionCopy(pred, language) : null;
                      const rem = Math.max(0, tx.amount - (tx.paidAmount || 0));
                      return (
                        <div
                          key={tx.id}
                          className="p-3.5 rounded-2xl bg-[#FAF1DF]/60 border border-[#E5D9C3] space-y-1.5 text-xs"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-mono font-extrabold text-[#1C1917]">
                              {localizeInvoiceCode(tx.invoiceNumber || tx.id, language)} ·{' '}
                              {formatRupee(rem, language)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleTriggerWhatsApp(selectedCustomer, tx)}
                              className="px-2.5 py-1 rounded-lg bg-white border border-[#D6C5A9] text-[#15803D] font-bold cursor-pointer"
                            >
                              {uiExtra.whatsappRemindBtn}
                            </button>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 font-mono tabular-nums text-[#44403C]">
                            <span>
                              {uiExtra.dueWord}: {formatLocalDate(tx.dueDate, language)}
                            </span>
                            <span>·</span>
                            <span>
                              {uiExtra.promisedWord}:{' '}
                              {tx.promisedDate
                                ? formatLocalDate(tx.promisedDate, language)
                                : uiExtra.noneRecordedYet}
                            </span>
                            {pred && predCopy && (
                              <>
                                <span>·</span>
                                <span className="font-bold text-[#14532D]">
                                  {uiExtra.expectedWord}:{' '}
                                  {formatLocalDate(pred.predictedDate, language)} (
                                  {predCopy.confidenceBadge})
                                </span>
                              </>
                            )}
                          </div>
                          {predCopy && predCopy.reasons.length > 0 && (
                            <ul className="list-disc pl-4 text-[#44403C] space-y-0.5 pt-1">
                              {predCopy.reasons.map((r, i) => (
                                <li key={i}>{r}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Collapsed "Details for your CA" */}
                <div className="pt-2 border-t border-[#EADDC5]">
                  <button
                    type="button"
                    onClick={() => setShowCaDetails(!showCaDetails)}
                    className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#FAF1DF] hover:bg-[#F3E5C8] border border-[#D6C5A9] text-[#1C1917] text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Briefcase className="w-4 h-4 text-[#14532D]" />
                    <span>{showCaDetails ? t.detailsForCaHide : t.detailsForCaShow}</span>
                    {showCaDetails ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {showCaDetails && (
                    <div className="mt-3 p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#D6C5A9] text-xs sm:text-sm text-[#44403C]">
                      {extra.custCaSummary(
                        formatRupee(selectedCustomer.totalBilled, language),
                        formatRupee(selectedCustomer.totalPaid, language),
                        toNativeDigits(
                          selectedCustomer.avgPaymentDelayDays.toFixed(1),
                          language
                        ),
                        formatIndianNumber(selectedCustomer.onTimeRatePercent, language)
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Past & Current Bills History Table */}
              <div className="khata-card rounded-3xl p-5 sm:p-6 space-y-3">
                <h4 className="text-lg font-extrabold text-[#1C1917]">
                  {uiExtra.invoiceHistoryHeading(
                    localizeCustomerId(selectedCustomer.id, language)
                  )}
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b-2 border-[#DFD2B7] text-[#57534E] font-bold">
                        <th className="py-2.5 px-3">{uiExtra.colInvoice}</th>
                        <th className="py-2.5 px-3 text-right">{uiExtra.colAmount}</th>
                        <th className="py-2.5 px-3">{uiExtra.colDueDate}</th>
                        <th className="py-2.5 px-3">{uiExtra.colPromised}</th>
                        <th className="py-2.5 px-3">{uiExtra.colActualPaid}</th>
                        <th className="py-2.5 px-3 text-right">{t.colDelay}</th>
                        <th className="py-2.5 px-3">{uiExtra.colDelayStatus}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EADDC5]">
                      {selectedCustomer.history.map((h, idx) => (
                        <tr key={idx} className="hover:bg-[#FAF1DF]/40">
                          <td className="py-3 px-3 font-mono tabular-nums font-bold text-[#1C1917]">
                            {localizeInvoiceCode(h.invoiceNumber, language)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono tabular-nums font-extrabold text-[#1C1917]">
                            {formatRupee(h.amount, language)}
                            {h.paidAmount && h.paidAmount > 0 && h.paidAmount < h.amount ? (
                              <span className="block text-xs text-amber-800 font-normal">
                                {uiExtra.partialPaidBadge(formatRupee(h.paidAmount, language))}
                              </span>
                            ) : null}
                          </td>
                          <td className="py-3 px-3 font-mono tabular-nums text-[#44403C] whitespace-nowrap">
                            {formatLocalDate(h.dueDate, language)}
                          </td>
                          <td className="py-3 px-3 font-mono tabular-nums text-[#1E3A8A] whitespace-nowrap">
                            {h.promisedDate ? formatLocalDate(h.promisedDate, language) : '—'}
                          </td>
                          <td className="py-3 px-3 font-mono tabular-nums text-[#44403C] whitespace-nowrap">
                            {h.paidDate ? (
                              formatLocalDate(h.paidDate, language)
                            ) : (
                              <span className="text-amber-800 font-sans font-bold">
                                {uiExtra.pendingStatusWord}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-mono tabular-nums font-bold">
                            {h.delayDays > 0 ? (
                              <span className="text-rose-700">
                                +{toNativeDigits(h.delayDays, language)}
                              </span>
                            ) : (
                              <span className="text-[#14532D]">
                                {toNativeDigits(0, language)}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-xs font-bold">
                            <span
                              className={
                                h.status === 'paid_on_time'
                                  ? 'text-[#14532D]'
                                  : h.status === 'paid_late'
                                  ? 'text-amber-800'
                                  : h.status === 'partially_paid'
                                  ? 'text-[#1E3A8A]'
                                  : h.status === 'overdue'
                                  ? 'text-rose-700'
                                  : 'text-[#57534E]'
                              }
                            >
                              {h.status === 'paid_on_time'
                                ? uiExtra.paidOnTimeStatus
                                : h.status === 'paid_late'
                                ? uiExtra.daysLateSuffix(h.delayDays)
                                : h.status === 'partially_paid'
                                ? uiExtra.partialPaidBadge(
                                    formatRupee(h.paidAmount || 0, language)
                                  )
                                : h.status === 'overdue'
                                ? t.filterOverdue
                                : uiExtra.pendingStatusWord}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
