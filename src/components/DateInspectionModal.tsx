import React from 'react';
import {
  Calendar,
  X,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  Plus
} from 'lucide-react';
import { DayForecast } from '../types/cashflow';
import { AppLanguage } from '../types/munimji';
import {
  TRANSLATIONS,
  formatIndianNumber,
  formatLocalDate,
  formatRupee,
  getLocalizedExtraUI,
  getLocalizedTxTitle,
  translateWeekdayAbbr
} from '../utils/translations';
import { localizeInvoiceCode, localizePartyName } from '../utils/localization';

interface DateInspectionModalProps {
  day: DayForecast | null;
  minimumReserve: number;
  onClose: () => void;
  onOpenAddModalWithDate?: (date: string) => void;
  onMarkPaid?: (id: string) => void;
  language?: AppLanguage;
}

export const DateInspectionModal: React.FC<DateInspectionModalProps> = ({
  day,
  minimumReserve,
  onClose,
  onOpenAddModalWithDate,
  language = 'en',
}) => {
  if (!day) return null;

  const t = TRANSLATIONS[language];
  const extra = getLocalizedExtraUI(language);

  const isShortfall = day.endingBalance < 0;
  const isBelowReserve = day.endingBalance < minimumReserve && !isShortfall;
  const dateReadable = formatLocalDate(day.date, language);
  const weekdayLabel = translateWeekdayAbbr(day.dayOfWeek, language);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-[#FFFDF9] rounded-3xl shadow-2xl border-2 border-[#D6C5A9] w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-[#14532D] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#166534] flex items-center justify-center text-[#FDE68A]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold">
                {weekdayLabel}, {dateReadable}
              </h3>
              <p className="text-base text-[#DCFCE7]">
                {t.modalDaySubtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-[#DCFCE7] hover:bg-[#166534] cursor-pointer"
            aria-label={t.closeBtn}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {isShortfall && (
            <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-rose-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-lg font-extrabold text-rose-950">
                  {t.modalDayShortfallTitle}
                </h4>
                <p className="text-lg text-rose-900 mt-0.5 leading-snug">
                  {t.modalDayShortfallDesc(formatRupee(day.endingBalance, language))}
                </p>
              </div>
            </div>
          )}

          {isBelowReserve && (
            <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-800 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-lg font-extrabold text-amber-950">
                  {t.modalDayLowTitle}
                </h4>
                <p className="text-lg text-amber-900 mt-0.5 leading-snug">
                  {t.modalDayLowDesc(
                    formatRupee(day.endingBalance, language),
                    formatRupee(minimumReserve, language)
                  )}
                </p>
              </div>
            </div>
          )}

          {!isShortfall && !isBelowReserve && (
            <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-[#14532D] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-lg font-extrabold text-emerald-950">
                  {t.modalDaySafeTitle}
                </h4>
                <p className="text-lg text-emerald-900 mt-0.5 leading-snug">
                  {t.modalDaySafeDesc(formatRupee(day.endingBalance, language))}
                </p>
              </div>
            </div>
          )}

          {/* 4 Plain Balance Boxes */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#FAF1DF] border border-[#D6C5A9]">
              <span className="text-base font-bold text-[#57534E] block">
                {t.modalStartMoney}
              </span>
              <span className="text-xl font-extrabold font-mono text-[#1C1917] mt-1 block">
                {formatRupee(day.startingBalance, language)}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF1DF] border border-[#D6C5A9]">
              <span className="text-base font-bold text-[#57534E] block">
                {t.modalDayChange}
              </span>
              <span
                className={`text-xl font-extrabold font-mono mt-1 block ${
                  day.netChange > 0
                    ? 'text-[#14532D]'
                    : day.netChange < 0
                    ? 'text-rose-700'
                    : 'text-[#1C1917]'
                }`}
              >
                {day.netChange !== 0
                  ? formatRupee(day.netChange, language, true)
                  : formatRupee(0, language)}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
              <span className="text-base font-bold text-emerald-900 block">
                {t.modalMoneyComingIn}
              </span>
              <span className="text-xl font-extrabold font-mono text-[#14532D] mt-1 block">
                {formatRupee(day.inflow, language, true)}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200">
              <span className="text-base font-bold text-rose-900 block">
                {t.modalBillsGoingOut}
              </span>
              <span className="text-xl font-extrabold font-mono text-rose-700 mt-1 block">
                {formatRupee(-day.outflow, language)}
              </span>
            </div>
          </div>

          {/* Money Coming In */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-lg font-extrabold text-[#1C1917] flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-[#14532D]" />
                {t.modalMoneyComingIn} ({formatIndianNumber(day.inflowItems.length, language)})
              </span>
              <span className="text-lg font-mono font-extrabold text-[#14532D]">
                {formatRupee(day.inflow, language, true)}
              </span>
            </div>

            {day.inflowItems.length === 0 ? (
              <p className="text-lg text-[#57534E] p-3.5 bg-[#FAF1DF] rounded-2xl border border-[#EADDC5]">
                {t.modalNoMoneyIn}
              </p>
            ) : (
              <div className="space-y-2">
                {day.inflowItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="text-lg font-extrabold text-[#1C1917]">
                        {localizePartyName(item.partyName, language)}
                      </div>
                      <div className="text-base text-[#57534E]">
                        {getLocalizedTxTitle(item, language)}{' '}
                        {item.invoiceNumber
                          ? `· #${localizeInvoiceCode(item.invoiceNumber, language)}`
                          : ''}
                      </div>
                    </div>
                    <div className="text-lg font-extrabold font-mono text-[#14532D]">
                      {formatRupee(item.amount, language, true)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bills Going Out */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-lg font-extrabold text-[#1C1917] flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-rose-700" />
                {t.modalBillsGoingOut} ({formatIndianNumber(day.outflowItems.length, language)})
              </span>
              <span className="text-lg font-mono font-extrabold text-rose-700">
                {formatRupee(-day.outflow, language)}
              </span>
            </div>

            {day.outflowItems.length === 0 ? (
              <p className="text-lg text-[#57534E] p-3.5 bg-[#FAF1DF] rounded-2xl border border-[#EADDC5]">
                {t.modalNoBillsOut}
              </p>
            ) : (
              <div className="space-y-2">
                {day.outflowItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl border border-rose-200 bg-rose-50/50 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="text-lg font-extrabold text-[#1C1917]">
                        {localizePartyName(item.partyName, language)}
                      </div>
                      <div className="text-base text-[#57534E]">
                        {getLocalizedTxTitle(item, language)}{' '}
                        {item.invoiceNumber
                          ? `· #${localizeInvoiceCode(item.invoiceNumber, language)}`
                          : ''}
                      </div>
                    </div>
                    <div className="text-lg font-extrabold font-mono text-rose-700">
                      {formatRupee(-item.amount, language)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* End-of-Day Balance */}
          <div
            className={`p-4 rounded-2xl border-2 flex items-center justify-between ${
              isShortfall
                ? 'bg-rose-50 border-rose-300'
                : isBelowReserve
                ? 'bg-amber-50 border-amber-300'
                : 'bg-emerald-50 border-emerald-300'
            }`}
          >
            <div>
              <span className="text-lg font-extrabold text-[#1C1917] block">
                {extra.modalClosingBalanceTitle}
              </span>
              <span className="text-base text-[#57534E]">{dateReadable}</span>
            </div>
            <span
              className={`text-2xl font-extrabold font-mono ${
                isShortfall
                  ? 'text-rose-700'
                  : isBelowReserve
                  ? 'text-amber-800'
                  : 'text-[#14532D]'
              }`}
            >
              {formatRupee(day.endingBalance, language)}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#FAF1DF] border-t border-[#D6C5A9] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onOpenAddModalWithDate) {
                onOpenAddModalWithDate(day.date);
              }
            }}
            className="min-h-[48px] px-4 py-2.5 bg-[#14532D] hover:bg-[#166534] text-white rounded-2xl text-lg font-extrabold inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-5 h-5 text-[#FDE68A]" />
            <span>{t.modalAddEntryOnDay(dateReadable)}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] px-5 py-2.5 bg-white hover:bg-[#FFFDF9] border border-[#D6C5A9] text-[#1C1917] rounded-2xl text-lg font-bold cursor-pointer"
          >
            {t.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
