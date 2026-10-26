import React from 'react';
import {
  Wallet,
  Users,
  Calendar,
  Shield,
  Plus,
  Scan,
  Split,
  MessageSquare,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Volume2
} from 'lucide-react';
import { DayForecast, Transaction } from '../types/cashflow';
import { AppLanguage } from '../types/munimji';
import {
  TRANSLATIONS,
  formatLocalDate,
  formatRupee,
  getLocalizedTxTitle,
  getVantaUIText
} from '../utils/translations';
import { AnimatedCounter } from './AnimatedCounter';
import { ForecastChart } from './ForecastChart';

interface MoneyScreenProps {
  businessName?: string;
  currentCash: number;
  actualPaidInflows: number;
  overdueAmount: number;
  minimumReserve: number;
  maxReserveGap: number;
  totalReceivablesAmount: number;
  upcoming7DayPayments: number;
  dailyForecast: DayForecast[];
  comparisonDays: DayForecast[] | null;
  timeframe: 7 | 30 | 90;
  onTimeframeChange: (tf: 7 | 30 | 90) => void;
  hasShortfall: boolean;
  shortfallDate: string;
  shortfallAmount: number;
  appliedRemedy: string | null;
  onApplyRemedy: (remedy: string) => void;
  payables: Transaction[];
  onMarkPaid: (id: string) => void;
  onSeeDay: (day: DayForecast) => void;
  onSeeDayByDateStr: (dateStr: string) => void;
  onOpenAddModal: () => void;
  onOpenScanModal: () => void;
  onOpenCashBreakdown: () => void;
  onOpenReserveSettings: () => void;
  onRemindRoyalKiranaWhatsApp: () => void;
  language: AppLanguage;
  onSpeakMoneySummary: () => void;
}

export const MoneyScreen: React.FC<MoneyScreenProps> = ({
  businessName = 'Sharma Stores',
  currentCash,
  actualPaidInflows,
  overdueAmount,
  minimumReserve,
  maxReserveGap,
  totalReceivablesAmount,
  upcoming7DayPayments,
  dailyForecast,
  comparisonDays,
  timeframe,
  onTimeframeChange,
  hasShortfall,
  shortfallDate,
  shortfallAmount,
  appliedRemedy,
  onApplyRemedy,
  payables,
  onMarkPaid,
  onSeeDay,
  onSeeDayByDateStr,
  onOpenAddModal,
  onOpenScanModal,
  onOpenCashBreakdown,
  onOpenReserveSettings,
  onRemindRoyalKiranaWhatsApp,
  language,
  onSpeakMoneySummary,
}) => {
  const t = TRANSLATIONS[language];
  const v = getVantaUIText(language);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Action Bar */}
      <div className="khata-card rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C1917]">
            {t.navMoney} — {businessName}
          </h1>
          <p className="text-base sm:text-lg text-[#57534E]">{t.moneySubtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onSpeakMoneySummary}
            className="min-h-[48px] px-4 py-2.5 rounded-2xl bg-[#FAF1DF] hover:bg-[#F3E5C8] border border-[#D6C5A9] text-[#1C1917] text-base font-bold inline-flex items-center gap-2 cursor-pointer"
          >
            <Volume2 className="w-5 h-5 text-[#C2410C]" />
            <span>{t.listenMunimji}</span>
          </button>

          <button
            type="button"
            onClick={onOpenScanModal}
            className="min-h-[48px] px-4 py-2.5 rounded-2xl bg-white hover:bg-[#FAF1DF] border border-[#D6C5A9] text-[#1C1917] text-base font-bold inline-flex items-center gap-2 cursor-pointer"
          >
            <Scan className="w-5 h-5 text-[#14532D]" />
            <span>{t.scanBillPhotoBtn}</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddModal}
            className="min-h-[48px] px-5 py-2.5 rounded-2xl bg-[#14532D] hover:bg-[#166534] text-white text-base font-bold inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-5 h-5 text-[#FDE68A]" />
            <span>{t.addSaleOrBillBtn}</span>
          </button>
        </div>
      </div>

      {/* 4 Separated Financial Position Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={onOpenCashBreakdown}
          className="khata-card rounded-2xl p-5 text-left hover:bg-[#FAF1DF]/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 text-[#14532D] font-bold text-base">
            <Wallet className="w-5 h-5 shrink-0" />
            <span>{v.availableCash}</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-[#1C1917] mt-2">
            ₹<AnimatedCounter value={currentCash} />
          </div>
          <p className="text-xs text-[#57534E] mt-1">
            {v.settledPaidNote}: {formatRupee(actualPaidInflows, language)}
          </p>
        </button>

        <div className="khata-card rounded-2xl p-5 text-left">
          <div className="flex items-center gap-2 text-[#1E3A8A] font-bold text-base">
            <Users className="w-5 h-5 shrink-0" />
            <span>{v.expectedReceipts}</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-[#1C1917] mt-2">
            ₹<AnimatedCounter value={totalReceivablesAmount} />
          </div>
          <p className="text-xs text-rose-700 font-semibold mt-1">
            {v.overdueCollectibles}: {formatRupee(overdueAmount, language)}
          </p>
        </div>

        <div className="khata-card rounded-2xl p-5 text-left">
          <div className="flex items-center gap-2 text-[#9A3412] font-bold text-base">
            <Calendar className="w-5 h-5 shrink-0" />
            <span>{t.billsNext7Days}</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-[#1C1917] mt-2">
            ₹<AnimatedCounter value={upcoming7DayPayments} />
          </div>
          <p className="text-xs text-[#57534E] mt-1">
            {v.upcomingPayments}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenReserveSettings}
          className="khata-card rounded-2xl p-5 text-left hover:bg-[#FAF1DF]/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 text-[#57534E] font-bold text-base">
            <Shield className="w-5 h-5 shrink-0" />
            <span>{v.minimumReserve}</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-[#1C1917] mt-2">
            ₹<AnimatedCounter value={minimumReserve} />
          </div>
          <p className="text-xs text-[#78350F] font-semibold mt-1">
            {v.maxReserveGap}: {formatRupee(maxReserveGap, language)}
          </p>
        </button>
      </div>

      {/* Shortage Warning & One-Tap Defense */}
      <div
        className={`rounded-3xl p-5 sm:p-6 border-2 space-y-4 ${
          hasShortfall
            ? 'bg-rose-50 border-rose-300'
            : 'bg-emerald-50 border-emerald-300'
        }`}
      >
        <div className="flex items-start gap-3.5">
          {hasShortfall ? (
            <AlertTriangle className="w-7 h-7 text-rose-600 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#1C1917]">
              {hasShortfall
                ? t.shortfallHeading(
                    formatLocalDate(shortfallDate, language),
                    formatRupee(shortfallAmount, language)
                  )
                : t.safeHeading}
            </h2>
            <p className="text-base sm:text-lg text-[#44403C]">
              {hasShortfall ? t.shortfallReasonDetail : t.safeReasonDetail}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onApplyRemedy('split_payment')}
            className="min-h-[48px] px-5 py-2.5 rounded-2xl bg-[#14532D] hover:bg-[#166534] text-white text-base font-extrabold inline-flex items-center gap-2 cursor-pointer"
          >
            <Split className="w-5 h-5 text-[#FDE68A]" />
            <span>
              {appliedRemedy === 'split_payment'
                ? t.undoBillSplitBtn
                : t.tryBillSplitBtn}
            </span>
          </button>

          <button
            type="button"
            onClick={onRemindRoyalKiranaWhatsApp}
            className="min-h-[48px] px-5 py-2.5 rounded-2xl bg-[#15803D] hover:bg-[#166534] text-white text-base font-bold inline-flex items-center gap-2 cursor-pointer"
          >
            <MessageSquare className="w-5 h-5" />
            <span>{t.askRoyalWhatsAppBtn}</span>
          </button>

          <button
            type="button"
            onClick={() => onSeeDayByDateStr(shortfallDate)}
            className="min-h-[48px] px-5 py-2.5 rounded-2xl bg-white border border-[#D6C5A9] text-[#1C1917] text-base font-bold inline-flex items-center gap-2 cursor-pointer"
          >
            <Eye className="w-5 h-5" />
            <span>{t.seeThisDay}</span>
          </button>
        </div>
      </div>

      {/* Day-by-Day Money Chart */}
      <ForecastChart
        days={dailyForecast}
        comparisonDays={comparisonDays}
        minimumReserve={minimumReserve}
        timeframe={timeframe}
        onTimeframeChange={onTimeframeChange}
        scenarioName={appliedRemedy ? t.tryBillSplitBtn : null}
        onSelectDate={onSeeDay}
        language={language}
      />

      {/* Upcoming Bills */}
      <section className="khata-card rounded-3xl overflow-hidden">
        <div className="khata-ledger-header px-5 sm:px-6 py-4 border-b border-[#E5D9C3]">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#1C1917]">
            {t.upcomingBillsLinkedTitle}
          </h2>
        </div>

        <div className="divide-y divide-[#EFE6D5]">
          {payables
            .slice()
            .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
            .map((tx) => {
              const isNotice = tx.id.startsWith('tx-notice-');
              return (
                <div
                  key={tx.id}
                  className="p-5 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isNotice
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-[#FAF1DF] text-[#14532D]'
                      }`}
                    >
                      {isNotice ? (
                        <Scale className="w-5 h-5" />
                      ) : (
                        <Calendar className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-[#1C1917]">
                        {getLocalizedTxTitle(tx, language)}
                      </h3>
                      <p className="text-base text-[#57534E]">{tx.partyName}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 shrink-0">
                    <div className="text-left sm:text-right">
                      <span className="block text-xl font-extrabold font-mono tabular-nums text-[#1C1917]">
                        {formatRupee(tx.amount, language)}
                      </span>
                      <span className="block text-sm font-mono text-[#57534E]">
                        {t.duePrefix}: {formatLocalDate(tx.dueDate, language)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSeeDayByDateStr(tx.dueDate)}
                      className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#FAF1DF] hover:bg-[#F3E5C8] border border-[#D6C5A9] text-[#1C1917] text-base font-bold inline-flex items-center gap-2 cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                      <span>{t.seeThisDay}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onMarkPaid(tx.id)}
                      className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-50 border border-[#D6C5A9] text-[#14532D] text-base font-bold inline-flex items-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{t.markPaidBtn}</span>
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </section>
    </div>
  );
};
