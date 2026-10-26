import React, { useState } from 'react';
import {
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  Check,
  Zap,
  CheckCircle2,
  X
} from 'lucide-react';
import { WhatIfScenario } from '../types/cashflow';
import { AppLanguage } from '../types/munimji';
import {
  TRANSLATIONS,
  formatIndianNumber,
  formatLocalDate,
  formatRupee,
  getLocalizedExtraUI,
  getLocalizedRemedyActions,
  getLocalizedWhatIfPresets
} from '../utils/translations';
import { getDashboardExtraStrings } from '../utils/localization';

interface WhatIfSimulatorProps {
  currentCash: number;
  minimumReserve: number;
  activeScenario: WhatIfScenario | null;
  onSelectScenario: (scenario: WhatIfScenario | null) => void;
  baselineShortfallDate: string;
  baselineLowestBalance: number;
  simulatedLowestBalance?: number;
  simulatedShortfallDate?: string;
  onApplyRemedy: (remedyType: string) => void;
  appliedRemedy?: string | null;
  onExecuteApprovedAction?: (actionId: string) => void;
  language?: AppLanguage;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({
  minimumReserve,
  activeScenario,
  onSelectScenario,
  baselineShortfallDate,
  baselineLowestBalance,
  simulatedLowestBalance,
  simulatedShortfallDate,
  onApplyRemedy,
  appliedRemedy,
  onExecuteApprovedAction,
  language = 'en',
}) => {
  const [customMode, setCustomMode] = useState(false);
  const [confirmModalAction, setConfirmModalAction] = useState<any | null>(null);

  const [customerDelay, setCustomerDelay] = useState<number>(
    activeScenario?.customerDelayDays || 0
  );
  const [targetCustomer] = useState<string>(
    activeScenario?.targetCustomerName || 'Balaji'
  );
  const [salesDrop, setSalesDrop] = useState<number>(
    activeScenario?.salesDropPercent || 0
  );
  const [unexpectedExp, setUnexpectedExp] = useState<number>(
    activeScenario?.unexpectedExpense || 0
  );
  const [additionalPurchase, setAdditionalPurchase] = useState<number>(
    activeScenario?.additionalPurchaseAmount || 0
  );
  const [supplierDelay] = useState<number>(
    activeScenario?.rescheduledSupplierDays || 0
  );

  const t = TRANSLATIONS[language];
  const extra = getLocalizedExtraUI(language);
  const uiExtra = getDashboardExtraStrings(language);
  const presetScenarios = getLocalizedWhatIfPresets(language);
  const remedyActions = getLocalizedRemedyActions(language);

  const handleApplyCustomScenario = () => {
    onSelectScenario({
      id: 'custom-scenario',
      name: extra.simCustomScenarioName,
      shortDescription: `+${formatIndianNumber(customerDelay, language)} ${uiExtra.daysUnit} | -${formatIndianNumber(salesDrop, language)}% | ${formatRupee(
        unexpectedExp,
        language
      )} | ${formatRupee(additionalPurchase, language)}`,
      customerDelayDays: customerDelay,
      targetCustomerName: targetCustomer,
      salesDropPercent: salesDrop,
      unexpectedExpense: unexpectedExp,
      additionalPurchaseAmount: additionalPurchase,
      rescheduledSupplierDays: supplierDelay,
    });
  };

  const effectiveLowest =
    simulatedLowestBalance !== undefined
      ? simulatedLowestBalance
      : baselineLowestBalance;

  const activeDisplayName =
    presetScenarios.find((p) => p.id === activeScenario?.id)?.name ||
    activeScenario?.name ||
    '';

  return (
    <div className="khata-card rounded-3xl overflow-hidden">
      {/* Header */}
      <div className="px-5 sm:px-6 py-5 border-b border-[#EADDC5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#14532D] text-white flex items-center justify-center shrink-0">
            <SlidersHorizontal className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#1C1917]">
              {t.simTitle}
            </h2>
            <p className="text-lg text-[#57534E] mt-0.5">
              {t.simSubtitle}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setCustomMode(!customMode)}
            className={`min-h-[48px] px-4 py-2.5 rounded-2xl text-lg font-bold border transition-colors cursor-pointer ${
              customMode
                ? 'bg-[#14532D] text-white border-[#14532D]'
                : 'bg-white text-[#1C1917] border-[#D6C5A9] hover:bg-[#FAF1DF]'
            }`}
          >
            {customMode ? t.simCustomSlidersHide : t.simCustomSlidersShow}
          </button>

          {activeScenario && (
            <button
              type="button"
              onClick={() => onSelectScenario(null)}
              className="min-h-[48px] px-4 py-2.5 rounded-2xl text-lg font-bold text-[#1C1917] bg-[#FAF1DF] hover:bg-[#F3E5C8] border border-[#D6C5A9] inline-flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" />
              <span>{t.simResetBtn}</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        {/* Preset Scenarios */}
        <div className="space-y-3">
          <label className="block text-lg font-extrabold text-[#1C1917]">
            {t.simChooseQuestion}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {presetScenarios.map((sc) => {
              const isSelected = activeScenario?.id === sc.id;
              return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => onSelectScenario(isSelected ? null : sc)}
                  className={`text-left p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#ECFDF5] border-[#14532D] shadow-xs'
                      : 'bg-white border-[#D6C5A9] hover:bg-[#FAF1DF]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-lg font-extrabold text-[#1C1917]">
                      {sc.name}
                    </span>
                    {isSelected && (
                      <span className="w-6 h-6 rounded-full bg-[#14532D] text-white flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                  <p className="text-lg text-[#57534E] mt-1.5 leading-snug">
                    {sc.shortDescription}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Sliders (Zero "Capex" Jargon) */}
        {customMode && (
          <div className="p-5 rounded-3xl bg-[#FAF1DF] border-2 border-[#D6C5A9] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#D6C5A9]">
              <span className="text-lg font-extrabold text-[#1C1917]">
                {t.simCustomSlidersShow}
              </span>
              <button
                type="button"
                onClick={handleApplyCustomScenario}
                className="min-h-[48px] px-4 py-2.5 bg-[#14532D] hover:bg-[#166534] text-white rounded-2xl text-lg font-extrabold cursor-pointer"
              >
                {t.simApplyCustomBtn}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-lg">
              <div>
                <div className="flex justify-between font-bold text-[#1C1917] mb-1.5">
                  <span>{t.simSliderDelay}</span>
                  <span className="font-mono text-[#14532D]">
                    +{formatIndianNumber(customerDelay, language)} {uiExtra.daysUnit}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="1"
                  value={customerDelay}
                  onChange={(e) => setCustomerDelay(parseInt(e.target.value, 10))}
                  className="w-full h-3 accent-[#14532D]"
                />
              </div>

              <div>
                <div className="flex justify-between font-bold text-[#1C1917] mb-1.5">
                  <span>{t.simSliderSalesDrop}</span>
                  <span className="font-mono text-rose-700">
                    -{formatIndianNumber(salesDrop, language)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={salesDrop}
                  onChange={(e) => setSalesDrop(parseInt(e.target.value, 10))}
                  className="w-full h-3 accent-rose-600"
                />
              </div>

              <div>
                <div className="flex justify-between font-bold text-[#1C1917] mb-1.5">
                  <span>{t.simSliderExtraRepair}</span>
                  <span className="font-mono text-[#1C1917]">
                    {formatRupee(unexpectedExp, language)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50000"
                  step="2500"
                  value={unexpectedExp}
                  onChange={(e) => setUnexpectedExp(parseInt(e.target.value, 10))}
                  className="w-full h-3 accent-[#1C1917]"
                />
              </div>

              <div>
                <div className="flex justify-between font-bold text-[#1C1917] mb-1.5">
                  <span>{t.simSliderExtraStock}</span>
                  <span className="font-mono text-[#14532D]">
                    {formatRupee(additionalPurchase, language)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60000"
                  step="5000"
                  value={additionalPurchase}
                  onChange={(e) =>
                    setAdditionalPurchase(parseInt(e.target.value, 10))
                  }
                  className="w-full h-3 accent-[#14532D]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Live Impact Card */}
        {activeScenario && (
          <div className="p-5 rounded-3xl bg-[#FFFDF9] border-2 border-[#14532D] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#EADDC5]">
              <span className="text-xl font-extrabold text-[#14532D] inline-flex items-center gap-2">
                <Zap className="w-5 h-5" />
                {t.simImpactTitle}
              </span>
              <span className="text-lg font-bold text-[#1C1917]">
                {extra.simActiveLabel} {activeDisplayName}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#FAF1DF] p-4 rounded-2xl border border-[#D6C5A9]">
                <span className="text-base font-bold text-[#57534E] block">
                  {t.simLowestMoney}
                </span>
                <div className="flex items-baseline gap-2.5 mt-1">
                  <span
                    className={`font-mono text-2xl font-extrabold ${
                      effectiveLowest < 0 ? 'text-rose-700' : 'text-[#1C1917]'
                    }`}
                  >
                    {formatRupee(effectiveLowest, language)}
                  </span>
                  <span className="text-base text-[#78716C] font-mono line-through">
                    {formatRupee(baselineLowestBalance, language)}
                  </span>
                </div>
                <div className="text-base text-[#57534E] mt-1">
                  {extra.simDiffLabel}{' '}
                  <span className="font-mono font-bold">
                    {formatRupee(
                      effectiveLowest - baselineLowestBalance,
                      language,
                      true
                    )}
                  </span>
                </div>
              </div>

              <div className="bg-[#FAF1DF] p-4 rounded-2xl border border-[#D6C5A9]">
                <span className="text-base font-bold text-[#57534E] block">
                  {t.simShortageDate}
                </span>
                <span className="font-mono text-2xl font-extrabold text-rose-700 mt-1 block">
                  {formatLocalDate(
                    simulatedShortfallDate || baselineShortfallDate,
                    language
                  )}
                </span>
              </div>

              <div className="bg-[#FAF1DF] p-4 rounded-2xl border border-[#D6C5A9]">
                <span className="text-base font-bold text-[#57534E] block">
                  {t.simKeepAsideStatus}
                </span>
                <div className="font-extrabold text-lg mt-1 text-amber-900">
                  {effectiveLowest < minimumReserve
                    ? t.simBelowKeepAside
                    : t.simSafeProtected}
                </div>
                <div className="text-base text-[#57534E] mt-1">
                  {t.moneyKeepAside}:{' '}
                  <span className="font-mono font-bold">
                    {formatRupee(minimumReserve, language)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Simple Ways to Fix Cash Shortage */}
        <div className="space-y-3">
          <div>
            <h3 className="text-xl font-extrabold text-[#1C1917] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#14532D]" />
              {t.simWaysToFixTitle}
            </h3>
            <p className="text-lg text-[#57534E] mt-0.5">
              {t.simWaysToFixSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {remedyActions.map((action) => {
              const isApplied = appliedRemedy === action.id;
              return (
                <div
                  key={action.id}
                  className={`p-5 rounded-3xl border-2 flex flex-col justify-between transition-all ${
                    isApplied
                      ? 'bg-[#ECFDF5] border-[#14532D] shadow-xs'
                      : 'bg-white border-[#D6C5A9]'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-lg font-extrabold text-[#1C1917]">
                        {action.title}
                      </span>
                      {action.isRecommended && (
                        <span className="text-base font-bold px-2.5 py-0.5 rounded-xl bg-emerald-100 text-emerald-900 shrink-0">
                          {t.simRecommendedBadge}
                        </span>
                      )}
                    </div>

                    <p className="text-lg text-[#44403C] leading-snug">
                      {action.mechanism}
                    </p>

                    <div className="p-3 rounded-2xl bg-[#FAF1DF] border border-[#D6C5A9] text-lg">
                      <span className="font-bold text-[#1C1917]">
                        {extra.simImpactPrefix}{' '}
                      </span>
                      <span className="font-bold text-[#14532D]">
                        {action.balanceImpact}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-base text-emerald-950">
                      <span className="font-bold">{extra.simBenefitPrefix} </span>
                      {action.financialEffect}
                    </div>

                    <div className="text-base text-amber-950 bg-amber-50 p-3 rounded-2xl border border-amber-200">
                      {action.tradeoff}
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-[#EADDC5] space-y-2">
                    <button
                      type="button"
                      onClick={() => onApplyRemedy(action.id)}
                      className={`w-full min-h-[48px] py-2.5 px-4 rounded-2xl text-lg font-extrabold transition-colors cursor-pointer ${
                        isApplied
                          ? 'bg-[#14532D] text-white'
                          : 'bg-[#FAF1DF] hover:bg-[#F3E5C8] text-[#1C1917] border border-[#D6C5A9]'
                      }`}
                    >
                      {isApplied ? t.simActiveFixBtn : t.simTryThisBtn}
                    </button>

                    <button
                      type="button"
                      onClick={() => setConfirmModalAction(action)}
                      className="w-full min-h-[44px] py-1.5 px-3 text-base font-bold text-[#14532D] hover:underline text-center cursor-pointer"
                    >
                      {extra.simExecuteFormalBtn}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModalAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-[#FFFDF9] rounded-3xl shadow-2xl border-2 border-[#D6C5A9] w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EADDC5]">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-6 h-6 text-[#14532D]" />
                <h4 className="font-extrabold text-[#1C1917] text-xl">
                  {extra.simConfirmTitle}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setConfirmModalAction(null)}
                className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-[#57534E] hover:bg-[#FAF1DF] cursor-pointer"
                aria-label={t.closeBtn}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-lg">
              <p className="font-extrabold text-[#1C1917]">
                {confirmModalAction.title}
              </p>
              <p className="text-[#44403C] leading-snug">
                {confirmModalAction.mechanism}
              </p>
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-300 text-amber-950 text-base leading-snug">
                {extra.simConfirmNote}
              </div>
            </div>

            <div className="pt-3 border-t border-[#EADDC5] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmModalAction(null)}
                className="min-h-[48px] px-4 py-2.5 rounded-2xl border border-[#D6C5A9] text-lg font-bold text-[#44403C] cursor-pointer"
              >
                {t.cancelBtn}
              </button>
              <button
                type="button"
                onClick={() => {
                  onApplyRemedy(confirmModalAction.id);
                  if (onExecuteApprovedAction) {
                    onExecuteApprovedAction(confirmModalAction.id);
                  }
                  setConfirmModalAction(null);
                }}
                className="min-h-[48px] px-5 py-2.5 bg-[#14532D] hover:bg-[#166534] text-white rounded-2xl text-lg font-extrabold cursor-pointer"
              >
                {extra.simConfirmApplyBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
