import React, { useState } from 'react';
import {
  FileCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Target,
} from 'lucide-react';
import {
  CustomerProfile,
  ForecastAccuracyRecord,
  PredictionOutcomeRecord,
  Transaction,
} from '../types/cashflow';
import { AppLanguage } from '../types/munimji';
import { evaluatePredictionAccuracy } from '../utils/mlPaymentPredictor';
import {
  TRANSLATIONS,
  formatIndianNumber,
  formatLocalDate,
  formatRupee,
  getLocalizedAccuracyRecord,
} from '../utils/translations';
import {
  getDashboardExtraStrings,
  localizeInvoiceCode,
  localizePartyName,
  toNativeDigits,
} from '../utils/localization';

interface AccuracyTrackerProps {
  records: ForecastAccuracyRecord[];
  predictionOutcomes?: PredictionOutcomeRecord[];
  customers?: CustomerProfile[];
  transactions?: Transaction[];
  trainedInvoicesCount?: number;
  currentCash: number;
  language?: AppLanguage;
}

const ACC_CARD_LABELS: Record<
  AppLanguage,
  {
    pastBillsLabel: string;
    checkedOutcomesLabel: string;
    emptyOutcomesText: string;
  }
> = {
  en: {
    pastBillsLabel: 'Past Settled Bills Studied',
    checkedOutcomesLabel: 'Settled Payments Checked',
    emptyOutcomesText:
      'No settled payments checked in this ledger yet. Whenever you record a customer payment, RupiVanta checks how close our expected arrival date was.',
  },
  kn: {
    pastBillsLabel: 'ಪರಿಶೀಲಿಸಿದ ಹಿಂದಿನ ಪಾವತಿಸಿದ ಬಿಲ್‌ಗಳು',
    checkedOutcomesLabel: 'ಹೋಲಿಸಿದ ಪಾವತಿ ಫಲಿತಾಂಶಗಳು',
    emptyOutcomesText:
      'ಈ ಖಾತೆಯಲ್ಲಿ ಇನ್ನೂ ಯಾವುದೇ ಪಾವತಿ ಫಲಿತಾಂಶ ದಾಖಲಾಗಿಲ್ಲ. ಗ್ರಾಹಕರ ಪಾವತಿಯನ್ನು ದಾಖಲಿಸಿದ ತಕ್ಷಣ ನಮ್ಮ ಅಂದಾಜು ಎಷ್ಟು ಹತ್ತಿರವಾಗಿತ್ತು ಎಂದು ಇಲ್ಲಿ ತೋರಿಸುತ್ತದೆ.',
  },
  hi: {
    pastBillsLabel: 'देखे गए पुराने भुगतान बिल',
    checkedOutcomesLabel: 'जाँचे गए भुगतान परिणाम',
    emptyOutcomesText:
      'इस खाते में अभी कोई भुगतान परिणाम दर्ज नहीं हुआ है। जब भी आप ग्राहक का भुगतान दर्ज करेंगे, यहाँ दिखेगा कि हमारा अनुमान कितना सटीक रहा।',
  },
  ta: {
    pastBillsLabel: 'ஆய்வு செய்த கடந்த பில்கள்',
    checkedOutcomesLabel: 'சரிபார்க்கப்பட்ட வரவுகள்',
    emptyOutcomesText:
      'இந்தக் கணக்கில் இன்னும் முடிவுகள் பதிவாகவில்லை. வாடிக்கையாளர் வரவைப் பதிவு செய்தவுடன் நமது கணிப்பு எவ்வளவு துல்லியமாக இருந்தது என்பதை இங்கே காணலாம்.',
  },
  te: {
    pastBillsLabel: 'పరిశీలించిన గత బిల్లులు',
    checkedOutcomesLabel: 'పోల్చిన చెల్లింపు ఫలితాలు',
    emptyOutcomesText:
      'ఈ ఖాతాలో ఇంకా చెల్లింపు ఫలితాలు నమోదు కాలేదు. కస్టమర్ చెల్లింపు నమోదు చేసిన వెంటనే మన అంచనా ఎంత దగ్గరగా ఉందో ఇక్కడ కనిపిస్తుంది.',
  },
  ml: {
    pastBillsLabel: 'പരിശോധിച്ച മുൻ ബില്ലുകൾ',
    checkedOutcomesLabel: 'ഒത്തുനോക്കിയ പേയ്‌മെന്റുകൾ',
    emptyOutcomesText:
      'ഈ കണക്കിൽ ഇതുവരെ പേയ്‌മെന്റ് ഫലങ്ങൾ രേഖപ്പെടുത്തിയിട്ടില്ല. ഇടപാടുകാരന്റെ പണം രേഖപ്പെടുത്തുമ്പോൾ നമ്മുടെ കണക്കുകൂട്ടൽ എത്രത്തോളം ശരിയായിരുന്നുവെന്ന് ഇവിടെ കാണാം.',
  },
};

export const AccuracyTrackerSection: React.FC<AccuracyTrackerProps> = ({
  records,
  predictionOutcomes = [],
  customers = [],
  transactions = [],
  trainedInvoicesCount = 0,
  currentCash,
  language = 'en',
}) => {
  const [showCaDetails, setShowCaDetails] = useState(false);
  const t = TRANSLATIONS[language];
  const uiExtra = getDashboardExtraStrings(language);
  const accLabels = ACC_CARD_LABELS[language] || ACC_CARD_LABELS.en;

  const mlAccuracy = evaluatePredictionAccuracy(
    predictionOutcomes,
    customers,
    transactions
  );

  const totalDiffAmount = records.reduce((sum, r) => sum + Math.abs(r.variance), 0);
  const avgError =
    records.reduce((sum, r) => sum + r.errorPercent, 0) / (records.length || 1);
  const closenessPct = toNativeDigits(
    records.length > 0 ? Math.max(0, 100 - avgError).toFixed(1) : '100.0',
    language
  );

  return (
    <div className="space-y-6">
      {/* Section 1: Past Estimate vs Actual Payment Check */}
      <div className="khata-card rounded-3xl p-5 sm:p-6 space-y-5">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#14532D] text-[#FDE68A] flex items-center justify-center shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#1C1917]">
              {uiExtra.accuracySectionTitle}
            </h2>
            <p className="text-sm text-[#57534E] mt-0.5">{uiExtra.accuracySectionSub}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#E5D9C3]">
            <span className="text-xs font-bold text-[#57534E] block">
              {accLabels.pastBillsLabel}
            </span>
            <span className="text-2xl font-black font-mono tabular-nums text-[#1C1917] mt-1 block">
              {formatIndianNumber(trainedInvoicesCount, language)}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#E5D9C3]">
            <span className="text-xs font-bold text-[#57534E] block">
              {accLabels.checkedOutcomesLabel}
            </span>
            <span className="text-2xl font-black font-mono tabular-nums text-[#1E3A8A] mt-1 block">
              {formatIndianNumber(mlAccuracy.evaluatedCount, language)}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#E5D9C3]">
            <span className="text-xs font-bold text-[#57534E] block">
              {uiExtra.avgErrorDaysLabel}
            </span>
            <span className="text-2xl font-black font-mono tabular-nums text-[#14532D] mt-1 block">
              {mlAccuracy.evaluatedCount > 0
                ? `${toNativeDigits(mlAccuracy.meanAbsoluteErrorDays, language)} ${uiExtra.daysUnit}`
                : '—'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
            <span className="text-xs font-bold text-emerald-900 block">
              {uiExtra.withinRangeRateLabel}
            </span>
            <span className="text-2xl font-black font-mono tabular-nums text-emerald-900 mt-1 block">
              {mlAccuracy.evaluatedCount > 0
                ? `${toNativeDigits(mlAccuracy.withinBandRatePercent, language)}%`
                : '—'}
            </span>
          </div>
        </div>

        {/* Recorded Actual Settlement Outcomes Table */}
        {predictionOutcomes.length === 0 ? (
          <div className="p-5 rounded-2xl bg-[#FAF1DF]/60 border border-[#E5D9C3] text-sm text-[#44403C]">
            {accLabels.emptyOutcomesText}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b-2 border-[#DFD2B7] text-[#57534E] font-bold">
                  <th className="py-2.5 px-3">{uiExtra.colInvoice}</th>
                  <th className="py-2.5 px-3 text-right">{uiExtra.colAmount}</th>
                  <th className="py-2.5 px-3">{uiExtra.colDueDate}</th>
                  <th className="py-2.5 px-3">{uiExtra.colPromised}</th>
                  <th className="py-2.5 px-3">{uiExtra.colPredictedRange}</th>
                  <th className="py-2.5 px-3">{uiExtra.colActualPaid}</th>
                  <th className="py-2.5 px-3 text-right">{uiExtra.colErrorResult}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EADDC5]">
                {predictionOutcomes.map((outc) => (
                  <tr key={outc.id} className="hover:bg-[#FAF1DF]/45">
                    <td className="py-3 px-3">
                      <span className="font-bold text-[#1C1917] block">
                        {localizePartyName(outc.partyName, language)}
                      </span>
                      <span className="font-mono text-xs text-[#57534E]">
                        {localizeInvoiceCode(outc.invoiceNumber, language)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-[#1C1917] whitespace-nowrap">
                      {formatRupee(outc.amount, language)}
                    </td>
                    <td className="py-3 px-3 font-mono tabular-nums text-[#44403C] whitespace-nowrap">
                      {formatLocalDate(outc.dueDate, language)}
                    </td>
                    <td className="py-3 px-3 font-mono tabular-nums text-[#1E3A8A] whitespace-nowrap">
                      {outc.promisedDate
                        ? formatLocalDate(outc.promisedDate, language)
                        : '—'}
                    </td>
                    <td className="py-3 px-3 font-mono tabular-nums text-[#14532D] whitespace-nowrap">
                      <span className="font-bold block">
                        {formatLocalDate(outc.predictedDate, language)}
                      </span>
                      <span className="text-xs text-[#57534E]">
                        {formatLocalDate(outc.predictedRangeStart, language)} –{' '}
                        {formatLocalDate(outc.predictedRangeEnd, language)}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono tabular-nums font-bold text-[#1C1917] whitespace-nowrap">
                      {formatLocalDate(outc.actualPaidDate, language)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                      <span
                        className={`font-bold ${
                          outc.withinPredictedRange
                            ? 'text-[#14532D]'
                            : 'text-amber-800'
                        }`}
                      >
                        {outc.withinPredictedRange
                          ? uiExtra.accurateWithinBand
                          : uiExtra.offByDays(outc.absoluteErrorDays)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 2: Weekly Cash Balance Check */}
      {records.length > 0 && (
        <div className="khata-card rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FAF1DF] border border-[#D6C5A9] text-[#14532D] flex items-center justify-center shrink-0">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-[#1C1917]">
                {uiExtra.weeklyBalanceCheckTitle}
              </h3>
              <p className="text-sm text-[#57534E]">{t.accSubtitle}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#E5D9C3] flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-[#14532D] shrink-0 mt-0.5" />
              <p className="text-sm font-bold text-[#1C1917] leading-snug">
                {t.accPlainHeadline1(formatRupee(totalDiffAmount, language))}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#E5D9C3] flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-[#14532D] shrink-0 mt-0.5" />
              <p className="text-sm font-bold text-[#1C1917] leading-snug">
                {t.accPlainHeadline2(formatRupee(currentCash, language))}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#E5D9C3] flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-[#14532D] shrink-0 mt-0.5" />
              <p className="text-sm font-bold text-[#1C1917] leading-snug">
                {t.accPlainHeadline3(closenessPct)}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b-2 border-[#DFD2B7] text-[#57534E] font-bold">
                  <th className="py-2.5 px-3">{t.colWeek}</th>
                  <th className="py-2.5 px-3 text-right">{t.colWeGuessed}</th>
                  <th className="py-2.5 px-3 text-right">{t.colActualBank}</th>
                  <th className="py-2.5 px-3 text-right">{t.colDifference}</th>
                  <th className="py-2.5 px-3">{t.colSimpleReason}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EADDC5]">
                {records.map((rec, i) => {
                  const localized = getLocalizedAccuracyRecord(rec, i, language);
                  return (
                    <tr key={i} className="hover:bg-[#FAF1DF]/50">
                      <td className="py-3 px-3 font-bold text-[#1C1917]">
                        {localized.period}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-[#44403C]">
                        {formatRupee(rec.projectedBalance, language)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-extrabold text-[#1C1917]">
                        {formatRupee(rec.actualBalance, language)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-bold">
                        <span
                          className={
                            rec.variance < 0
                              ? 'text-rose-700'
                              : rec.variance > 0
                              ? 'text-[#14532D]'
                              : 'text-[#57534E]'
                          }
                        >
                          {rec.variance !== 0
                            ? formatRupee(rec.variance, language, true)
                            : formatRupee(0, language)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#44403C] max-w-md">
                        {localized.reason}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

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
                {t.accCaTechSummary(
                  toNativeDigits(avgError.toFixed(1), language),
                  formatRupee(totalDiffAmount, language)
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
