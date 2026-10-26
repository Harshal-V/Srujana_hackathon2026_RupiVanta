import React from 'react';
import {
  Users,
  FileCheck,
  FileBarChart,
  SlidersHorizontal,
  ArrowDownLeft,
  ArrowUpRight,
  Settings
} from 'lucide-react';
import { MoreSubTab, AppLanguage } from '../types/munimji';
import {
  CustomerProfile,
  ForecastAccuracyRecord,
  Transaction,
  WhatIfScenario,
  DayForecast
} from '../types/cashflow';
import { TRANSLATIONS } from '../utils/translations';
import { CustomerIntelligenceSection } from './CustomerIntelligenceSection';
import { AccuracyTrackerSection } from './AccuracyTrackerSection';
import { ReportsView } from './ReportsView';
import { WhatIfSimulator } from './WhatIfSimulator';
import { ReceivablesSection } from './ReceivablesSection';
import { PayablesSection } from './PayablesSection';

interface MoreToolsViewProps {
  activeSubTab: MoreSubTab;
  onSelectSubTab: (sub: MoreSubTab) => void;
  customers: CustomerProfile[];
  accuracyRecords: ForecastAccuracyRecord[];
  receivables: Transaction[];
  payables: Transaction[];
  allTransactions: Transaction[];
  dailyForecast: DayForecast[];
  businessName: string;
  currentCash: number;
  minimumReserve: number;
  activeScenario: WhatIfScenario | null;
  onSelectScenario: (sc: WhatIfScenario | null) => void;
  baselineShortfallDate: string;
  baselineLowestBalance: number;
  simulatedLowestBalance: number;
  simulatedShortfallDate?: string;
  appliedRemedy: string | null;
  onApplyRemedy: (rem: string) => void;
  onMarkPaid: (id: string) => void;
  followUpCustomer: Transaction | null;
  onCloseFollowUpModal: () => void;
  onOpenFollowUpTx: (tx: Transaction) => void;
  onOpenFollowUpByName: (name: string, amt: number, inv?: string) => void;
  onOpenReserveSettings: () => void;
  language: AppLanguage;
}

export const MoreToolsView: React.FC<MoreToolsViewProps> = ({
  activeSubTab,
  onSelectSubTab,
  customers,
  accuracyRecords,
  receivables,
  payables,
  allTransactions,
  dailyForecast,
  businessName,
  currentCash,
  minimumReserve,
  activeScenario,
  onSelectScenario,
  baselineShortfallDate,
  baselineLowestBalance,
  simulatedLowestBalance,
  simulatedShortfallDate,
  appliedRemedy,
  onApplyRemedy,
  onMarkPaid,
  onOpenFollowUpTx,
  onOpenFollowUpByName,
  onOpenReserveSettings,
  language,
}) => {
  const t = TRANSLATIONS[language];

  const tools: Array<{ id: MoreSubTab; label: string; icon: any }> = [
    { id: 'receivables', label: t.toolReceivables, icon: ArrowDownLeft },
    { id: 'payables', label: t.toolPayables, icon: ArrowUpRight },
    { id: 'simulator', label: t.toolSimulator, icon: SlidersHorizontal },
    { id: 'intelligence', label: t.toolIntelligence, icon: Users },
    { id: 'accuracy', label: t.toolAccuracy, icon: FileCheck },
    { id: 'reports', label: t.toolReports, icon: FileBarChart },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header & Tool Buttons */}
      <div className="khata-card rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-[#1C1917]">
              {t.morePageTitle}
            </h1>
            <p className="text-lg text-[#57534E] mt-0.5">
              {t.morePageSubtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenReserveSettings}
            className="min-h-[48px] px-4 py-2.5 rounded-2xl bg-[#FAF1DF] hover:bg-[#F3E5C8] border border-[#D6C5A9] text-[#1C1917] text-lg font-bold inline-flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Settings className="w-5 h-5 text-[#14532D] shrink-0" />
            <span>{t.changeKeepAsideBtn}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isSelected = activeSubTab === tool.id;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => onSelectSubTab(tool.id)}
                className={`min-h-[52px] px-4 py-3 rounded-2xl border-2 text-lg font-bold inline-flex items-center gap-3 text-left cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-[#14532D] border-[#14532D] text-white'
                    : 'bg-white border-[#D6C5A9] text-[#1C1917] hover:bg-[#FAF1DF]'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{tool.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Sub-Tool */}
      {activeSubTab === 'receivables' && (
        <ReceivablesSection
          receivables={receivables}
          onMarkPaid={onMarkPaid}
          onOpenFollowUpFor={onOpenFollowUpTx}
          language={language}
        />
      )}

      {activeSubTab === 'payables' && (
        <PayablesSection
          payables={payables}
          onMarkPaid={onMarkPaid}
          onApplyRemedy={onApplyRemedy}
          appliedRemedy={appliedRemedy}
          language={language}
        />
      )}

      {activeSubTab === 'simulator' && (
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
      )}

      {activeSubTab === 'intelligence' && (
        <CustomerIntelligenceSection
          customers={customers}
          onOpenFollowUpFor={onOpenFollowUpByName}
          language={language}
        />
      )}

      {activeSubTab === 'accuracy' && (
        <AccuracyTrackerSection
          records={accuracyRecords}
          currentCash={currentCash}
          language={language}
        />
      )}

      {activeSubTab === 'reports' && (
        <ReportsView
          currentCash={currentCash}
          minimumReserve={minimumReserve}
          dailyForecast={dailyForecast}
          transactions={allTransactions}
          businessName={businessName}
          language={language}
        />
      )}
    </div>
  );
};
