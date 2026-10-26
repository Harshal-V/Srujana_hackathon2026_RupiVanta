import React from 'react';
import {
  Frown,
  Meh,
  Smile,
  Mic,
  Volume2,
  Wallet,
  ArrowRight,
  MessageSquare,
  BellRing,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Plus,
  SlidersHorizontal,
  RotateCcw
} from 'lucide-react';
import { LegalNotice, NoticeSeverity } from '../types/notices';
import { DayForecast } from '../types/cashflow';
import { AppLanguage } from '../types/munimji';
import {
  TRANSLATIONS,
  formatDaysLeftLabel,
  formatIndianNumber,
  formatLocalDate,
  formatRupee,
  getLocalizedNotice,
  getLocalizedVoicePrompts,
  getSeverityPlainLabel,
  getVantaUIText
} from '../utils/translations';
import { computeNoticeCountdown } from '../utils/privacyMasker';
import { ANCHOR_DATE } from '../data/initialData';
import { AnimatedCounter } from './AnimatedCounter';
import { VantaAvatar } from './MunimjiAvatar';
import { ForecastChart } from './ForecastChart';

interface HomeScreenProps {
  mostUrgentNotice: LegalNotice | null;
  dueWithin7DaysNotice: LegalNotice | null;
  safetyScore: number;
  openNoticesCount: number;
  urgentNoticesCount: number;
  upcomingFilingsCount: number;
  currentCash: number;
  actualPaidInflows: number;
  expectedReceiptsTotal: number;
  overdueAmount: number;
  upcomingPayablesTotal: number;
  upcoming7DayPayments: number;
  minimumReserve: number;
  lowestBalance: number;
  lowestBalanceDate: string;
  maxReserveGap: number;
  dailyForecast: DayForecast[];
  comparisonDays: DayForecast[] | null;
  timeframe: 7 | 30 | 90;
  onTimeframeChange: (tf: 7 | 30 | 90) => void;
  activeScenarioName: string | null;
  onSimulateDelay7Days: () => void;
  onClearSimulation: () => void;
  onSelectForecastDay: (day: DayForecast) => void;
  onOpenAddModal: () => void;
  onOpenCashBreakdown: () => void;
  onOpenReceivables: () => void;
  onOpenPayables: () => void;
  hasShortfall: boolean;
  shortfallDateStr: string;
  shortfallAmount: number;
  language: AppLanguage;
  isSpeaking: boolean;
  isListening: boolean;
  onExplainUrgentNotice: (notice: LegalNotice) => void;
  onGoToNotices: () => void;
  onGoToMoney: () => void;
  onPressAskVantaMic: () => void;
  onRunVantaTask: (command: string) => void;
  onRemindCaWhatsApp: (notice: LegalNotice) => void;
  onHearAutoReminder: (notice: LegalNotice) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  mostUrgentNotice,
  dueWithin7DaysNotice,
  safetyScore,
  openNoticesCount,
  urgentNoticesCount,
  upcomingFilingsCount,
  currentCash,
  actualPaidInflows,
  expectedReceiptsTotal,
  overdueAmount,
  upcomingPayablesTotal,
  upcoming7DayPayments,
  minimumReserve,
  lowestBalance,
  lowestBalanceDate,
  maxReserveGap,
  dailyForecast,
  comparisonDays,
  timeframe,
  onTimeframeChange,
  activeScenarioName,
  onSimulateDelay7Days,
  onClearSimulation,
  onSelectForecastDay,
  onOpenAddModal,
  onOpenCashBreakdown,
  onOpenReceivables,
  onOpenPayables,
  hasShortfall,
  shortfallDateStr,
  shortfallAmount,
  language,
  isSpeaking,
  isListening,
  onExplainUrgentNotice,
  onGoToNotices,
  onGoToMoney,
  onPressAskVantaMic,
  onRunVantaTask,
  onRemindCaWhatsApp,
  onHearAutoReminder,
}) => {
  const t = TRANSLATIONS[language];
  const v = getVantaUIText(language);
  const quickTasks = getLocalizedVoicePrompts(language);

  const localizedUrgent = mostUrgentNotice
    ? getLocalizedNotice(mostUrgentNotice, language)
    : null;

  const localizedDue7 = dueWithin7DaysNotice
    ? getLocalizedNotice(dueWithin7DaysNotice, language)
    : null;

  const urgentCountdown = mostUrgentNotice
    ? computeNoticeCountdown(mostUrgentNotice.deadlineDate, ANCHOR_DATE)
    : null;

  const reminderCountdown = dueWithin7DaysNotice
    ? computeNoticeCountdown(dueWithin7DaysNotice.deadlineDate, ANCHOR_DATE)
    : null;

  const shortfallDateLocalized = formatLocalDate(shortfallDateStr, language);
  const lowestDateLocalized = formatLocalDate(lowestBalanceDate, language);

  const clampedScore = Math.max(0, Math.min(100, Math.round(safetyScore)));
  const arcLength = 232.48;
  const dashOffset = arcLength * (1 - clampedScore / 100);
  const gaugeColor =
    clampedScore >= 75 ? '#15803D' : clampedScore >= 50 ? '#D97706' : '#DC2626';

  const renderSeverityLabel = (severity: NoticeSeverity) => {
    if (severity === 'Urgent') {
      return (
        <span className="inline-flex items-center gap-1.5 text-rose-800 text-base font-extrabold">
          <Frown className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{getSeverityPlainLabel(severity, language)}</span>
        </span>
      );
    }
    if (severity === 'Needs attention') {
      return (
        <span className="inline-flex items-center gap-1.5 text-amber-900 text-base font-extrabold">
          <Meh className="w-5 h-5 text-amber-600 shrink-0" />
          <span>{getSeverityPlainLabel(severity, language)}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-emerald-800 text-base font-extrabold">
        <Smile className="w-5 h-5 text-emerald-600 shrink-0" />
        <span>{getSeverityPlainLabel(severity, language)}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* =================================================================
          1. TOP FOCAL ANCHOR: CASH-SHORTAGE WARNING & PROJECTED BALANCE
         ================================================================= */}
      <section
        aria-label={hasShortfall ? v.shortageWarningTitle : v.cashHealthyTitle}
        className={`rounded-3xl p-5 sm:p-6 border-2 space-y-4 ${
          hasShortfall || maxReserveGap > 0
            ? 'bg-rose-50/90 border-rose-300'
            : 'bg-emerald-50/90 border-emerald-300'
        }`}
      >
        {activeScenarioName && (
          <div className="p-3 rounded-xl bg-amber-100/90 border border-amber-300 flex flex-wrap items-center justify-between gap-2 text-sm font-bold text-amber-950">
            <span>{v.simulationActiveNote(activeScenarioName)}</span>
            <button
              type="button"
              onClick={onClearSimulation}
              className="min-h-[38px] px-3 py-1 rounded-lg bg-white border border-amber-400 text-amber-950 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{v.clearSimulationBtn}</span>
            </button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-3.5">
            {hasShortfall || maxReserveGap > 0 ? (
              <AlertTriangle className="w-8 h-8 text-rose-700 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-8 h-8 text-emerald-700 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1.5">
              <p className="text-xs sm:text-sm font-bold text-[#78350F]">
                {hasShortfall || maxReserveGap > 0
                  ? v.shortageWarningTitle
                  : v.cashHealthyTitle}
                <span aria-hidden="true"> · </span>
                <span>{lowestDateLocalized}</span>
              </p>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#1C1917] leading-snug">
                {hasShortfall
                  ? t.shortfallHeading(
                      shortfallDateLocalized,
                      formatRupee(shortfallAmount, language)
                    )
                  : t.safeHeading}
              </h1>
              <p className="text-sm sm:text-base text-[#44403C] leading-relaxed max-w-3xl">
                {hasShortfall ? t.shortfallReasonDetail : t.safeReasonDetail}
              </p>
            </div>
          </div>

          {/* Highlighted Projected Lowest & Max Reserve Gap Figures */}
          <div className="flex flex-wrap sm:flex-nowrap items-stretch gap-3 shrink-0">
            <div className="px-4 py-3 rounded-2xl bg-white border border-[#D6C5A9] min-w-[165px]">
              <span className="block text-xs font-bold text-[#57534E]">
                {v.projectedLowest}
              </span>
              <span
                className={`block text-2xl font-extrabold font-mono tabular-nums mt-0.5 ${
                  lowestBalance < 0 ? 'text-rose-700' : 'text-[#14532D]'
                }`}
              >
                {formatRupee(lowestBalance, language)}
              </span>
              <span className="block text-xs text-[#57534E] mt-0.5 font-mono">
                {lowestDateLocalized}
              </span>
            </div>

            <div className="px-4 py-3 rounded-2xl bg-white border border-[#D6C5A9] min-w-[165px]">
              <span className="block text-xs font-bold text-[#57534E]">
                {v.maxReserveGap}
              </span>
              <span
                className={`block text-2xl font-extrabold font-mono tabular-nums mt-0.5 ${
                  maxReserveGap > 0 ? 'text-amber-800' : 'text-[#14532D]'
                }`}
              >
                {formatRupee(maxReserveGap, language)}
              </span>
              <span className="block text-xs text-[#57534E] mt-0.5">
                {v.minimumReserve}: {formatRupee(minimumReserve, language)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Strip */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => onRunVantaTask('Explain predicted cash shortage')}
            className="min-h-[46px] px-4 py-2.5 rounded-xl bg-[#14532D] hover:bg-[#166534] text-white text-sm sm:text-base font-bold inline-flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Volume2 className="w-4 h-4 text-[#FDE68A]" />
            <span>{v.askVantaWhyBtn}</span>
          </button>

          <button
            type="button"
            onClick={activeScenarioName ? onClearSimulation : onSimulateDelay7Days}
            className="min-h-[46px] px-4 py-2.5 rounded-xl bg-white hover:bg-[#FAF1DF] border border-[#D6C5A9] text-[#1C1917] text-sm sm:text-base font-bold inline-flex items-center gap-2 cursor-pointer transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#9A3412]" />
            <span>
              {activeScenarioName ? v.clearSimulationBtn : v.simulateDelayBtn}
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenAddModal}
            className="min-h-[46px] px-4 py-2.5 rounded-xl bg-white hover:bg-[#FAF1DF] border border-[#D6C5A9] text-[#14532D] text-sm sm:text-base font-bold inline-flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addSaleOrBillBtn}</span>
          </button>

          <button
            type="button"
            onClick={onGoToMoney}
            className="min-h-[46px] px-4 py-2.5 rounded-xl bg-white hover:bg-[#FAF1DF] border border-[#D6C5A9] text-[#1C1917] text-sm sm:text-base font-bold inline-flex items-center gap-2 cursor-pointer transition-colors ml-auto"
          >
            <Wallet className="w-4 h-4 text-[#14532D]" />
            <span>{t.seeMoneyBtn}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* =================================================================
          2. SEPARATED FINANCIAL METRICS STRIP (SINGLE DETERMINISTIC ENGINE)
         ================================================================= */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Cash + Actual Paid */}
        <button
          type="button"
          onClick={onOpenCashBreakdown}
          className="khata-card rounded-2xl p-4 sm:p-5 text-left hover:bg-[#FAF1DF]/60 transition-colors cursor-pointer"
        >
          <span className="block text-sm font-bold text-[#14532D]">
            {v.availableCash}
          </span>
          <span className="block text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-[#1C1917] mt-1.5">
            ₹<AnimatedCounter value={currentCash} />
          </span>
          <span className="block text-xs text-[#57534E] mt-1.5">
            {v.settledPaidNote} · {formatRupee(actualPaidInflows, language)}
          </span>
        </button>

        {/* Expected Receipts + Overdue Collectibles */}
        <button
          type="button"
          onClick={onOpenReceivables}
          className="khata-card rounded-2xl p-4 sm:p-5 text-left hover:bg-[#FAF1DF]/60 transition-colors cursor-pointer"
        >
          <span className="block text-sm font-bold text-[#1E3A8A]">
            {v.expectedReceipts}
          </span>
          <span className="block text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-[#1C1917] mt-1.5">
            ₹<AnimatedCounter value={expectedReceiptsTotal} />
          </span>
          <span className="block text-xs text-rose-700 font-semibold mt-1.5">
            {v.overdueCollectibles}: {formatRupee(overdueAmount, language)}
          </span>
        </button>

        {/* Upcoming Payments */}
        <button
          type="button"
          onClick={onOpenPayables}
          className="khata-card rounded-2xl p-4 sm:p-5 text-left hover:bg-[#FAF1DF]/60 transition-colors cursor-pointer"
        >
          <span className="block text-sm font-bold text-[#9A3412]">
            {v.upcomingPayments}
          </span>
          <span className="block text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-[#1C1917] mt-1.5">
            ₹<AnimatedCounter value={upcomingPayablesTotal} />
          </span>
          <span className="block text-xs text-[#57534E] mt-1.5">
            {t.billsNext7Days}: {formatRupee(upcoming7DayPayments, language)}
          </span>
        </button>

        {/* Minimum Reserve & Reserve Gap */}
        <button
          type="button"
          onClick={onGoToMoney}
          className="khata-card rounded-2xl p-4 sm:p-5 text-left hover:bg-[#FAF1DF]/60 transition-colors cursor-pointer"
        >
          <span className="block text-sm font-bold text-[#57534E]">
            {v.minimumReserve}
          </span>
          <span className="block text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-[#1C1917] mt-1.5">
            ₹<AnimatedCounter value={minimumReserve} />
          </span>
          <span className="block text-xs text-[#78350F] font-semibold mt-1.5">
            {v.maxReserveGap}: {formatRupee(maxReserveGap, language)}
          </span>
        </button>
      </section>

      {/* =================================================================
          3. FORECAST CHART NEAR THE TOP OF DASHBOARD
         ================================================================= */}
      <ForecastChart
        days={dailyForecast}
        comparisonDays={comparisonDays}
        minimumReserve={minimumReserve}
        timeframe={timeframe}
        onTimeframeChange={onTimeframeChange}
        scenarioName={activeScenarioName}
        onSelectDate={onSelectForecastDay}
        language={language}
      />

      {/* =================================================================
          4. VANTA AI FINANCIAL AGENT & LEGAL NOTICE COMPLIANCE ROW
         ================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: VANTA Task-Performing Financial Assistant */}
        <section className="lg:col-span-6 khata-card rounded-3xl overflow-hidden flex flex-col justify-between">
          <div className="khata-ledger-header px-5 py-4 border-b border-[#E5D9C3] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <VantaAvatar
                size="sm"
                isSpeaking={isSpeaking}
                isListening={isListening}
              />
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-extrabold text-[#1C1917] truncate">
                  {v.vantaName}
                </h2>
                <p className="text-xs sm:text-sm text-[#57534E] truncate">
                  {v.vantaRole}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onPressAskVantaMic}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-white text-sm font-bold inline-flex items-center gap-2 cursor-pointer shrink-0 transition-colors ${
                isListening
                  ? 'bg-amber-600'
                  : 'bg-[#14532D] hover:bg-[#166534]'
              }`}
            >
              <Mic className="w-4 h-4 text-[#FDE68A]" />
              <span>{isListening ? t.listeningNow : t.tapMicBtn}</span>
            </button>
          </div>

          <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
            <p className="text-base text-[#44403C] leading-relaxed">
              {t.card3Subtitle}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {quickTasks.slice(0, 6).map((task) => (
                <button
                  key={task.cmd}
                  type="button"
                  onClick={() => onRunVantaTask(task.cmd)}
                  className="min-h-[46px] px-3.5 py-2.5 rounded-xl bg-[#FAF1DF] hover:bg-[#F3E5C8] border border-[#D6C5A9] text-[#1C1917] text-sm font-bold text-left cursor-pointer transition-colors"
                >
                  {task.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Right: Most Urgent Legal Notice & Safety Score */}
        <section className="lg:col-span-6 khata-card rounded-3xl overflow-hidden flex flex-col justify-between">
          <div className="khata-ledger-header px-5 py-4 border-b border-[#E5D9C3] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#14532D] shrink-0" />
              <h2 className="text-lg sm:text-xl font-extrabold text-[#1C1917]">
                {t.card1Title}
              </h2>
            </div>

            {mostUrgentNotice && urgentCountdown && (
              <span className="font-mono text-sm font-extrabold text-rose-700">
                {formatDaysLeftLabel(urgentCountdown.daysLeft, language)}
              </span>
            )}
          </div>

          <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
            {mostUrgentNotice && localizedUrgent && urgentCountdown ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  {renderSeverityLabel(mostUrgentNotice.severity)}
                  <span className="text-sm font-mono font-bold text-[#44403C]">
                    {t.lastDate}: {formatLocalDate(mostUrgentNotice.deadlineDate, language)}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg sm:text-xl font-extrabold text-[#1C1917] leading-snug">
                    {localizedUrgent.title}
                  </h3>
                  <p className="text-sm sm:text-base text-[#44403C]">
                    {localizedUrgent.whatIsAskedLines[0]}
                  </p>
                  {mostUrgentNotice.amountDemanded > 0 && (
                    <p className="text-base font-bold text-[#1C1917] pt-1">
                      {t.amountAskedLabel}:{' '}
                      <span className="font-mono font-extrabold text-rose-700 tabular-nums">
                        {formatRupee(mostUrgentNotice.amountDemanded, language)}
                      </span>
                    </p>
                  )}
                </div>

                {/* Compact Safety Score Summary */}
                <div className="pt-3 border-t border-[#EFE6D5] flex items-center gap-4">
                  <svg viewBox="0 0 180 104" className="w-24 h-14 shrink-0" aria-hidden="true">
                    <path
                      d="M 16 90 A 74 74 0 0 1 164 90"
                      fill="none"
                      stroke="#E5D9C3"
                      strokeWidth="16"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 16 90 A 74 74 0 0 1 164 90"
                      fill="none"
                      stroke={gaugeColor}
                      strokeWidth="16"
                      strokeLinecap="round"
                      strokeDasharray={arcLength}
                      strokeDashoffset={dashOffset}
                    />
                    <text
                      x="90"
                      y="76"
                      textAnchor="middle"
                      fill="#1C1917"
                      fontSize="34"
                      fontWeight="800"
                      className="font-mono"
                    >
                      {formatIndianNumber(clampedScore, language)}
                    </text>
                  </svg>
                  <p className="text-xs sm:text-sm text-[#57534E]">
                    <span className="font-bold text-[#1C1917] block">{t.safetyTitle}</span>
                    {t.safetyFactorsLine(
                      openNoticesCount,
                      urgentNoticesCount,
                      upcomingFilingsCount
                    )}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => onExplainUrgentNotice(mostUrgentNotice)}
                    className="flex-1 min-h-[46px] px-4 py-2.5 rounded-xl bg-[#14532D] hover:bg-[#166534] text-white text-sm sm:text-base font-bold inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4 text-[#FDE68A]" />
                    <span>{t.explainToMeBtn}</span>
                  </button>

                  {dueWithin7DaysNotice && localizedDue7 && reminderCountdown && (
                    <button
                      type="button"
                      onClick={() => onRemindCaWhatsApp(dueWithin7DaysNotice)}
                      className="min-h-[46px] px-4 py-2.5 rounded-xl bg-white hover:bg-[#FAF1DF] border border-[#D6C5A9] text-[#15803D] text-sm sm:text-base font-bold inline-flex items-center gap-2 cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>{t.remindCaWhatsAppBtn}</span>
                    </button>
                  )}

                  {dueWithin7DaysNotice && (
                    <button
                      type="button"
                      onClick={() => onHearAutoReminder(dueWithin7DaysNotice)}
                      className="min-h-[46px] px-3 py-2.5 rounded-xl bg-white hover:bg-[#FAF1DF] border border-[#D6C5A9] text-[#9A3412] text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer"
                      aria-label={t.hearReminderBtn}
                    >
                      <BellRing className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-emerald-800">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <p className="text-base font-bold">{t.noUrgentNoticesRightNow}</p>
                </div>
                <button
                  type="button"
                  onClick={onGoToNotices}
                  className="min-h-[46px] px-5 py-2.5 rounded-xl bg-[#14532D] text-white text-base font-bold inline-flex items-center gap-2 cursor-pointer"
                >
                  <span>{t.navNotices}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
