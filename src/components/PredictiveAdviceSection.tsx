import React from 'react';
import {
  TrendingUp,
  AlertTriangle,
  MessageSquare,
  Mic,
  ArrowRight,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import {
  FinancialAdviceReport,
  Transaction,
  WhatIfScenario,
} from '../types/cashflow';
import { AppLanguage } from '../types/munimji';
import {
  TRANSLATIONS,
  formatLocalDate,
  formatRupee,
  getPredictiveFinanceText,
} from '../utils/translations';
import {
  getDashboardExtraStrings,
  getSimpleAffordabilityCopy,
  getSimpleDelayImpactHeadline,
  getSimpleFollowUpCopy,
  localizeInvoiceCode,
  localizePartyName,
  localizeTxTitle,
  toNativeDigits,
} from '../utils/localization';
import { WhatIfSimulator } from './WhatIfSimulator';

interface PredictiveAdviceSectionProps {
  adviceReport: FinancialAdviceReport;
  transactions: Transaction[];
  currentCash: number;
  minimumReserve: number;
  activeScenario: WhatIfScenario | null;
  onSelectScenario: (scenario: WhatIfScenario | null) => void;
  baselineShortfallDate: string;
  baselineLowestBalance: number;
  simulatedLowestBalance: number;
  simulatedShortfallDate: string;
  onApplyRemedy: (remedyType: string) => void;
  appliedRemedy: string | null;
  onRemindCustomer: (tx: Transaction) => void;
  onAskVanta: (prompt: string) => void;
  onGoToPendingPayments: () => void;
  language: AppLanguage;
}

const ADVICE_UI_COPY: Record<
  AppLanguage,
  {
    lowestOnTimeLabel: string;
    lowestHabitLabel: string;
    cashDragLabel: string;
    startingCashLabel: string;
    endingCashLabel: string;
    followUpSubtitle: string;
    allPendingBtn: string;
    affordSubtitle: string;
    colPayee: string;
    colDueDate: string;
    colBillAmount: string;
    colCashAfter: string;
    colAffordAdvice: string;
  }
> = {
  en: {
    lowestOnTimeLabel: '30-Day Lowest Cash (If Everyone Pays on Due Date)',
    lowestHabitLabel: '30-Day Lowest Cash (Based on Past Payment Habits)',
    cashDragLabel: 'Cash Held Back by Late Customer Payments',
    startingCashLabel: 'Cash in Hand Today:',
    endingCashLabel: 'Ending Cash:',
    followUpSubtitle:
      'Ordered by who is most overdue, who promised early but usually pays late, and which payment protects your cash.',
    allPendingBtn: 'All Pending Bills',
    affordSubtitle:
      'Checks each upcoming bill against the cash you are likely to have on that due date.',
    colPayee: 'Bill / Payee',
    colDueDate: 'Due Date',
    colBillAmount: 'Bill Amount',
    colCashAfter: 'Cash Left After Bill',
    colAffordAdvice: 'Status & Simple Advice',
  },
  kn: {
    lowestOnTimeLabel: '೩೦ ದಿನಗಳ ಕನಿಷ್ಠ ನಗದು (ಎಲ್ಲರೂ ಸಮಯಕ್ಕೆ ಕೊಟ್ಟರೆ)',
    lowestHabitLabel: '೩೦ ದಿನಗಳ ಕನಿಷ್ಠ ನಗದು (ಹಿಂದಿನ ಪಾವತಿ ಅಭ್ಯಾಸದ ಪ್ರಕಾರ)',
    cashDragLabel: 'ತಡವಾದ ಗ್ರಾಹಕ ಪಾವತಿಯಿಂದ ಹಿಡಿದಿಟ್ಟ ಹಣ',
    startingCashLabel: 'ಇಂದಿನ ನಗದು:',
    endingCashLabel: 'ಕೊನೆಯ ಬ್ಯಾಲೆನ್ಸ್:',
    followUpSubtitle:
      'ಯಾರ ಬಾಕಿ ಹೆಚ್ಚು ದಿನ ಮೀರಿದೆ ಮತ್ತು ಯಾವ ಹಣ ಬಂದರೆ ನಿಮ್ಮ ನಗದು ಸುರಕ್ಷಿತವಾಗಿರುತ್ತದೆ ಎಂಬುದರ ಆಧಾರದ ಮೇಲೆ ಪಟ್ಟಿ ಮಾಡಲಾಗಿದೆ.',
    allPendingBtn: 'ಎಲ್ಲಾ ಬಾಕಿ ಬಿಲ್‌ಗಳು',
    affordSubtitle:
      'ಪ್ರತಿ ಮುಂಬರುವ ಬಿಲ್ ಅನ್ನು ಆ ದಿನಾಂಕದಂದು ನಿಮ್ಮ ಕೈಯಲ್ಲಿ ಇರಬಹುದಾದ ಹಣದೊಂದಿಗೆ ಹೋಲಿಸಿ ತೋರಿಸುತ್ತದೆ.',
    colPayee: 'ಬಿಲ್ / ಪಾವತಿಸಬೇಕಾದವರು',
    colDueDate: 'ಗಡುವು ದಿನಾಂಕ',
    colBillAmount: 'ಬಿಲ್ ಮೊತ್ತ',
    colCashAfter: 'ಬಿಲ್ ನಂತರ ಉಳಿಯುವ ಹಣ',
    colAffordAdvice: 'ಸ್ಥಿತಿ ಮತ್ತು ಸರಳ ಸಲಹೆ',
  },
  hi: {
    lowestOnTimeLabel: '३०-दिन का न्यूनतम कैश (यदि सब समय पर दें)',
    lowestHabitLabel: '३०-दिन का न्यूनतम कैश (पिछली भुगतान आदत से)',
    cashDragLabel: 'देरी से आने वाले भुगतान के कारण रुकी नकदी',
    startingCashLabel: 'आज उपलब्ध नकद:',
    endingCashLabel: 'अंतिम बैलेंस:',
    followUpSubtitle:
      'कौन-सा बिल सबसे ज़्यादा दिन से बकाया है और किस पैसे से आपकी नकदी सुरक्षित रहेगी, उसी क्रम में।',
    allPendingBtn: 'सभी लंबित बिल',
    affordSubtitle:
      'हर आगामी बिल की तुलना उस तारीख़ को आपके पास रहने वाली संभावित नकदी से की गई है।',
    colPayee: 'बिल / पाने वाला',
    colDueDate: 'देय तारीख़',
    colBillAmount: 'बिल राशि',
    colCashAfter: 'बिल के बाद बची नकदी',
    colAffordAdvice: 'स्थिति और सरल सलाह',
  },
  ta: {
    lowestOnTimeLabel: '௩௦-நாள் குறைந்த இருப்பு (அனைவரும் சரியான நேரத்தில் தந்தால்)',
    lowestHabitLabel: '௩௦-நாள் குறைந்த இருப்பு (கடந்தகால பழக்கத்தின்படி)',
    cashDragLabel: 'தாமதமான வரவுகளால் குறையும் பணம்',
    startingCashLabel: 'இன்றைய இருப்பு:',
    endingCashLabel: 'இறுதி இருப்பு:',
    followUpSubtitle:
      'யார் அதிக நாட்கள் நிலுவையில் உள்ளனர் மற்றும் எந்தப் பணம் உங்கள் இருப்பைப் பாதுகாக்கும் என்ற வரிசையில்.',
    allPendingBtn: 'அனைத்து நிலுவை பில்கள்',
    affordSubtitle:
      'ஒவ்வொரு வரவிருக்கும் பில்லையும் அந்தத் தேதியில் கையில் இருக்கக்கூடிய பணத்துடன் ஒப்பிடுகிறது.',
    colPayee: 'பில் / பெறுபவர்',
    colDueDate: 'கெடு தேதி',
    colBillAmount: 'பில் தொகை',
    colCashAfter: 'பில்லிற்குப் பின் மீதம்',
    colAffordAdvice: 'நிலை மற்றும் எளிய ஆலோசனை',
  },
  te: {
    lowestOnTimeLabel: '౩౦-రోజుల కనిష్ట నగదు (అందరూ సమయానికి ఇస్తే)',
    lowestHabitLabel: '౩౦-రోజుల కనిష్ట నగదు (గత చెల్లింపు అలవాటు ప్రకారం)',
    cashDragLabel: 'ఆలస్య చెల్లింపుల వల్ల తగ్గే నగదు',
    startingCashLabel: 'ఈరోజు నగదు:',
    endingCashLabel: 'ముగింపు బ్యాలెన్స్:',
    followUpSubtitle:
      'ఎవరి బిల్లు ఎక్కువ రోజులు దాటిందో మరియు ఏ డబ్బు వస్తే మీ నగదు సురక్షితంగా ఉంటుందో ఆ క్రమంలో.',
    allPendingBtn: 'అన్ని పెండింగ్ బిల్లులు',
    affordSubtitle:
      'ప్రతి రాబోయే బిల్లును ఆ గడువు తేదీన మీ దగ్గర ఉండే అంచనా నగదుతో పోలుస్తుంది.',
    colPayee: 'బిల్లు / చెల్లించాల్సినవారు',
    colDueDate: 'గడువు తేదీ',
    colBillAmount: 'బిల్లు మొత్తం',
    colCashAfter: 'బిల్లు తర్వాత మిగిలే నగదు',
    colAffordAdvice: 'స్థితి మరియు సులభ సలహా',
  },
  ml: {
    lowestOnTimeLabel: '൩൦-ദിവസത്തെ കുറഞ്ഞ പണം (എല്ലാവരും സമയത്ത് നൽകിയാൽ)',
    lowestHabitLabel: '൩൦-ദിവസത്തെ കുറഞ്ഞ പണം (മുൻകാല ശീലമനുസരിച്ച്)',
    cashDragLabel: 'വൈകിയ പേയ്‌മെന്റുകൾ കാരണം കുറയുന്ന പണം',
    startingCashLabel: 'ഇന്നത്തെ പണം:',
    endingCashLabel: 'അവസാന ബാലൻസ്:',
    followUpSubtitle:
      'ആരുടെ ബിൽ കൂടുതൽ ദിവസം വൈകി, ഏത് പണം വന്നാൽ നിങ്ങളുടെ ബാലൻസ് സുരക്ഷിതമാകും എന്ന ക്രമത്തിൽ.',
    allPendingBtn: 'എല്ലാ ബാക്കി ബില്ലുകളും',
    affordSubtitle:
      'ഓരോ വരാനിരിക്കുന്ന ബില്ലും ആ തീയതിയിൽ നിങ്ങളുടെ കൈവശമുണ്ടാകാൻ സാധ്യതയുള്ള പണവുമായി താരതമ്യം ചെയ്യുന്നു.',
    colPayee: 'ബിൽ / പണം നൽകേണ്ടവർ',
    colDueDate: 'അവസാന തീയതി',
    colBillAmount: 'ബിൽ തുക',
    colCashAfter: 'ബിൽ കഴിഞ്ഞുള്ള പണം',
    colAffordAdvice: 'നിലയും ലളിതമായ നിർദ്ദേശവും',
  },
};

export const PredictiveAdviceSection: React.FC<PredictiveAdviceSectionProps> = ({
  adviceReport,
  transactions,
  currentCash,
  minimumReserve,
  activeScenario,
  onSelectScenario,
  baselineShortfallDate,
  baselineLowestBalance,
  simulatedLowestBalance,
  simulatedShortfallDate,
  onApplyRemedy,
  appliedRemedy,
  onRemindCustomer,
  onAskVanta,
  onGoToPendingPayments,
  language,
}) => {
  const t = TRANSLATIONS[language];
  const pf = getPredictiveFinanceText(language);
  const uiExtra = getDashboardExtraStrings(language);
  const copy = ADVICE_UI_COPY[language] || ADVICE_UI_COPY.en;

  const horizons = [
    { label: t.days7Btn, data: adviceReport.horizons.days7 },
    { label: t.days30Btn, data: adviceReport.horizons.days30 },
    { label: t.days90Btn, data: adviceReport.horizons.days90 },
  ];

  const handleFollowUpRemind = (txId: string) => {
    const found = transactions.find((tx) => tx.id === txId);
    if (found) {
      onRemindCustomer(found);
    }
  };

  const askAdvisorPrompt =
    language === 'kn'
      ? 'ಗ್ರಾಹಕರ ತಡವಾದ ಪಾವತಿ ನನ್ನ ನಗದಿನ ಮೇಲೆ ಹೇಗೆ ಪರಿಣಾಮ ಬೀರುತ್ತದೆ, ಮೊದಲು ಯಾರನ್ನು ಕೇಳಬೇಕು ಮತ್ತು ಮುಂಬರುವ ಬಿಲ್ ಪಾವತಿಸಲು ಹಣ ಸಾಕೇ ಎಂದು ಸರಳವಾಗಿ ಹೇಳಿ.'
      : 'Explain in simple words how late customer payments affect my cash, who I should call first, and whether my upcoming bills are safe to pay.';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header & Delay Cash Impact Card */}
      <section className="khata-card rounded-3xl p-6 sm:p-7 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[#14532D] font-extrabold text-lg sm:text-xl">
              <TrendingUp className="w-5 h-5 shrink-0" />
              <span>{pf.adviceTitle}</span>
            </div>
            <p className="text-sm text-[#57534E]">{pf.adviceSubtitle}</p>
          </div>

          <button
            type="button"
            onClick={() => onAskVanta(askAdvisorPrompt)}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-[#14532D] hover:bg-[#166534] text-white text-xs sm:text-sm font-extrabold inline-flex items-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <Mic className="w-4 h-4 text-[#FDE68A]" />
            <span>{uiExtra.askAssistantExplainBtn}</span>
          </button>
        </div>

        {/* How Delayed Payments Affect Available Cash */}
        <div className="pt-4 border-t border-[#EFE6D5] grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <span className="text-xs font-bold text-[#57534E] block">
              {copy.lowestOnTimeLabel}
            </span>
            <span className="text-2xl font-black font-mono tabular-nums text-[#14532D]">
              {formatRupee(
                adviceReport.delayCashImpactSummary.lowestWithOnTimeReceipts,
                language
              )}
            </span>
          </div>

          <div>
            <span className="text-xs font-bold text-[#57534E] block">
              {copy.lowestHabitLabel}
            </span>
            <span
              className={`text-2xl font-black font-mono tabular-nums ${
                adviceReport.delayCashImpactSummary.lowestWithMLPredictedReceipts < 0
                  ? 'text-rose-700'
                  : adviceReport.delayCashImpactSummary.lowestWithMLPredictedReceipts <
                    minimumReserve
                  ? 'text-amber-800'
                  : 'text-[#1C1917]'
              }`}
            >
              {formatRupee(
                adviceReport.delayCashImpactSummary.lowestWithMLPredictedReceipts,
                language
              )}
            </span>
          </div>

          <div>
            <span className="text-xs font-bold text-[#9A3412] block">
              {copy.cashDragLabel}
            </span>
            <span className="text-2xl font-black font-mono tabular-nums text-[#9A3412]">
              {formatRupee(
                adviceReport.delayCashImpactSummary.cashDragFromDelays,
                language
              )}
            </span>
          </div>
        </div>

        <p className="text-sm text-[#44403C] leading-relaxed">
          {getSimpleDelayImpactHeadline(adviceReport.delayCashImpactSummary, language)}
        </p>
      </section>

      {/* 7, 30 & 90-Day Forecast Breakdown with Shortage Causes & Affected Invoices */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {horizons.map(({ label, data }) => (
          <div
            key={data.horizonDays}
            className="khata-card rounded-3xl p-5 space-y-4 border border-[#D6C5A9]"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-extrabold text-[#1C1917]">{label}</h3>
              <span
                className={`text-xs font-extrabold ${
                  data.hasShortageBelowZero
                    ? 'text-rose-700'
                    : data.hasReserveBreach
                    ? 'text-amber-800'
                    : 'text-[#14532D]'
                }`}
              >
                {data.hasShortageBelowZero
                  ? `${uiExtra.shortfallWord}: -${formatRupee(data.shortageAmount, language)}`
                  : data.hasReserveBreach
                  ? `${uiExtra.reserveDipWord}: -${formatRupee(data.reserveGapAmount, language)}`
                  : uiExtra.healthyWord}
              </span>
            </div>

            <div className="space-y-1.5 text-xs font-mono tabular-nums border-b border-[#EFE6D5] pb-3">
              <div className="flex justify-between">
                <span className="font-sans text-[#57534E]">{copy.startingCashLabel}</span>
                <span className="font-bold text-[#1C1917]">
                  {formatRupee(data.startingCash, language)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-[#57534E]">{uiExtra.receiptsInLabel}</span>
                <span className="font-bold text-[#14532D]">
                  +{formatRupee(data.predictedInflows, language)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-[#57534E]">{uiExtra.billsOutLabel}</span>
                <span className="font-bold text-[#9A3412]">
                  -{formatRupee(data.scheduledOutflows, language)}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-[#EFE6D5]/70">
                <span className="font-sans font-bold text-[#1C1917]">
                  {copy.endingCashLabel}
                </span>
                <span
                  className={`font-extrabold ${
                    data.endingBalance < 0 ? 'text-rose-700' : 'text-[#1C1917]'
                  }`}
                >
                  {formatRupee(data.endingBalance, language)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-[#57534E]">
                  {uiExtra.lowestOnDate(formatLocalDate(data.lowestBalanceDate, language))}
                </span>
                <span
                  className={`font-extrabold ${
                    data.lowestBalance < 0
                      ? 'text-rose-700'
                      : data.lowestBalance < minimumReserve
                      ? 'text-amber-800'
                      : 'text-[#14532D]'
                  }`}
                >
                  {formatRupee(data.lowestBalance, language)}
                </span>
              </div>
            </div>

            {/* Major Outflows & Affected Delayed Invoices */}
            <div className="space-y-2 text-xs text-[#44403C]">
              {data.causingOutflows.length > 0 && (
                <div>
                  <span className="font-extrabold text-[#1C1917] block mb-0.5">
                    {uiExtra.billsCausingDip}
                  </span>
                  {data.causingOutflows.slice(0, 2).map((o) => (
                    <div key={o.id} className="flex justify-between gap-2">
                      <span className="truncate">
                        {localizePartyName(o.partyName, language)}
                      </span>
                      <span className="font-mono tabular-nums shrink-0">
                        {formatRupee(o.amount, language)} ({formatLocalDate(o.dueDate, language)})
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {data.affectedDelayedInvoices.length > 0 && (
                <div className="pt-1 border-t border-[#EFE6D5]">
                  <span className="font-extrabold text-amber-900 block mb-0.5">
                    {uiExtra.delayedInvoicesAffecting}
                  </span>
                  {data.affectedDelayedInvoices.slice(0, 2).map((inv) => (
                    <div key={inv.id} className="flex justify-between gap-2">
                      <span className="truncate">
                        {localizePartyName(inv.partyName, language)} (
                        {localizeInvoiceCode(inv.invoiceNumber, language)})
                      </span>
                      <span className="font-mono tabular-nums text-rose-700 shrink-0">
                        +{toNativeDigits(inv.delayDays, language)} →{' '}
                        {formatLocalDate(inv.predictedDate, language)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* Actionable Advice 1: Whom to Follow Up With First */}
      <section className="khata-card rounded-3xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#1C1917]">
              {pf.followUpHeading}
            </h2>
            <p className="text-sm text-[#57534E]">{copy.followUpSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={onGoToPendingPayments}
            className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#FAF1DF] hover:bg-[#F3E5C8] border border-[#D6C5A9] text-[#14532D] text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <span>{copy.allPendingBtn}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {adviceReport.followUpQueue.length === 0 ? (
          <p className="text-sm text-[#57534E] py-4">{uiExtra.allClearFollowUp}</p>
        ) : (
          <div className="divide-y divide-[#EFE6D5]">
            {adviceReport.followUpQueue.map((item, idx) => {
              const fCopy = getSimpleFollowUpCopy(item, language);
              const rankStr = `${toNativeDigits(String(idx + 1).padStart(2, '0'), language)}.`;
              return (
                <div
                  key={item.transactionId}
                  className="py-4 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-mono font-extrabold text-[#14532D]">
                        {rankStr}
                      </span>
                      <span className="font-extrabold text-base text-[#1C1917]">
                        {localizePartyName(item.partyName, language)}
                      </span>
                      <span aria-hidden="true" className="text-[#78716C]">
                        ·
                      </span>
                      <span className="font-mono tabular-nums text-xs text-[#57534E]">
                        {localizeInvoiceCode(item.invoiceNumber, language)}
                      </span>
                      <span aria-hidden="true" className="text-[#78716C]">
                        ·
                      </span>
                      <span
                        className={`text-xs font-extrabold ${
                          item.priority === 'urgent'
                            ? 'text-rose-700'
                            : item.priority === 'high'
                            ? 'text-amber-800'
                            : 'text-[#14532D]'
                        }`}
                      >
                        {fCopy.priorityLabel}
                      </span>
                    </div>

                    <p className="text-sm text-[#44403C]">{fCopy.reason}</p>
                    <p className="text-xs font-bold text-[#14532D]">
                      {uiExtra.actionPrefix} {fCopy.suggestedAction}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#57534E] font-mono tabular-nums pt-0.5">
                      <span>
                        {uiExtra.dueWord}: {formatLocalDate(item.dueDate, language)}
                      </span>
                      {item.promisedDate && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-[#1E3A8A]">
                            {uiExtra.promisedWord}:{' '}
                            {formatLocalDate(item.promisedDate, language)}
                          </span>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <span>
                        {uiExtra.expectedWord}:{' '}
                        {formatLocalDate(item.predictedDate, language)}
                      </span>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                    <span className="text-lg font-extrabold font-mono tabular-nums text-[#1E3A8A]">
                      {formatRupee(item.amountRemaining, language)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleFollowUpRemind(item.transactionId)}
                      className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#15803D] hover:bg-[#166534] text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{uiExtra.whatsappRemindBtn}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Actionable Advice 2: Are Upcoming Expenses Affordable? */}
      <section className="khata-card rounded-3xl p-6 space-y-4">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-[#1C1917]">
            {pf.affordabilityHeading}
          </h2>
          <p className="text-sm text-[#57534E]">{copy.affordSubtitle}</p>
        </div>

        {adviceReport.expenseAffordability.length === 0 ? (
          <p className="text-sm text-[#57534E] py-4">{uiExtra.noUpcomingScheduled}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b-2 border-[#DFD2B7] text-[#57534E] font-bold">
                  <th className="py-2.5 px-3">{copy.colPayee}</th>
                  <th className="py-2.5 px-3">{copy.colDueDate}</th>
                  <th className="py-2.5 px-3 text-right">{copy.colBillAmount}</th>
                  <th className="py-2.5 px-3 text-right">{copy.colCashAfter}</th>
                  <th className="py-2.5 px-3">{copy.colAffordAdvice}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE6D5]">
                {adviceReport.expenseAffordability.map((exp) => {
                  const matchedTx = transactions.find((tx) => tx.id === exp.transactionId);
                  const affordCopy = getSimpleAffordabilityCopy(
                    exp,
                    minimumReserve,
                    language
                  );
                  return (
                    <tr key={exp.transactionId} className="hover:bg-[#FAF1DF]/35">
                      <td className="py-3 px-3">
                        <span className="font-bold text-[#1C1917] block">
                          {localizePartyName(exp.partyName, language)}
                        </span>
                        <span className="text-xs text-[#57534E]">
                          {matchedTx
                            ? localizeTxTitle(matchedTx, language)
                            : localizePartyName(exp.title, language)}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono tabular-nums text-[#44403C] whitespace-nowrap">
                        {formatLocalDate(exp.dueDate, language)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-extrabold text-[#9A3412] whitespace-nowrap">
                        {formatRupee(exp.amount, language)}
                      </td>
                      <td
                        className={`py-3 px-3 text-right font-mono tabular-nums font-extrabold whitespace-nowrap ${
                          exp.projectedBalanceOnDueDate < 0
                            ? 'text-rose-700'
                            : exp.projectedBalanceOnDueDate < minimumReserve
                            ? 'text-amber-800'
                            : 'text-[#14532D]'
                        }`}
                      >
                        {formatRupee(exp.projectedBalanceOnDueDate, language)}
                      </td>
                      <td className="py-3 px-3 max-w-sm">
                        <div className="flex items-center gap-1.5 font-extrabold text-xs">
                          {exp.verdict === 'unaffordable_shortage' ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-700 shrink-0" />
                          ) : exp.verdict === 'tight_dips_reserve' ? (
                            <Clock className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                          ) : (
                            <ShieldCheck className="w-3.5 h-3.5 text-[#14532D] shrink-0" />
                          )}
                          <span
                            className={
                              exp.verdict === 'unaffordable_shortage'
                                ? 'text-rose-700'
                                : exp.verdict === 'tight_dips_reserve'
                                ? 'text-amber-800'
                                : 'text-[#14532D]'
                            }
                          >
                            {exp.verdict === 'unaffordable_shortage'
                              ? pf.unaffordableLabel
                              : exp.verdict === 'tight_dips_reserve'
                              ? pf.tightReserveLabel
                              : pf.affordableLabel}
                          </span>
                        </div>
                        <p className="text-xs text-[#57534E] mt-0.5">
                          {affordCopy.recommendedStep}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Interactive What-If Simulations (Delayed Receipts & Unexpected Expenses) */}
      <WhatIfSimulator
        currentCash={currentCash}
        minimumReserve={minimumReserve}
        activeScenario={activeScenario}
        onSelectScenario={onSelectScenario}
        baselineShortfallDate={baselineShortfallDate}
        baselineLowestBalance={baselineLowestBalance}
        simulatedLowestBalance={simulatedLowestBalance}
        simulatedShortfallDate={simulatedShortfallDate}
        onApplyRemedy={onApplyRemedy}
        appliedRemedy={appliedRemedy}
        language={language}
      />
    </div>
  );
};
