import React from 'react';
import {
  ArrowUpRight,
  Split,
  Calendar,
  Building,
  Users,
  Zap,
  ShoppingBag,
  Scale
} from 'lucide-react';
import { Transaction } from '../types/cashflow';
import { AppLanguage } from '../types/munimji';
import {
  TRANSLATIONS,
  formatLocalDate,
  formatRupee,
  getLocalizedTxTitle
} from '../utils/translations';

interface PayablesSectionProps {
  payables: Transaction[];
  onMarkPaid: (id: string) => void;
  onApplyRemedy: (remedyType: string) => void;
  appliedRemedy?: string | null;
  language?: AppLanguage;
}

export const PayablesSection: React.FC<PayablesSectionProps> = ({
  payables,
  onMarkPaid,
  onApplyRemedy,
  appliedRemedy,
  language = 'en',
}) => {
  const t = TRANSLATIONS[language];
  const totalUpcoming = payables.reduce(
    (sum, item) => sum + Math.max(0, item.amount - (item.paidAmount || 0)),
    0
  );

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'supplier':
        return ShoppingBag;
      case 'rent':
        return Building;
      case 'wages':
        return Users;
      case 'utilities':
        return Zap;
      case 'taxes':
        return Scale;
      default:
        return ArrowUpRight;
    }
  };

  return (
    <div className="khata-card rounded-3xl p-5 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#EADDC5] gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#1C1917] flex items-center gap-2">
              <ArrowUpRight className="w-6 h-6 text-rose-700" />
              {t.toolPayables}
            </h3>
            <span className="text-lg font-mono font-extrabold px-3 py-1 rounded-xl bg-rose-50 text-rose-900 border border-rose-300">
              {formatRupee(totalUpcoming, language)}
            </span>
          </div>
          <p className="text-lg text-[#57534E] mt-1">
            {t.payablesSubtitle}
          </p>
        </div>
      </div>

      {/* Payables List */}
      <div className="divide-y divide-[#EADDC5]">
        {payables.map((tx) => {
          const isCriticalRisk = tx.partyName.includes('Malnad') && !appliedRemedy;
          const Icon = getCategoryIcon(tx.category);

          return (
            <div
              key={tx.id}
              className={`py-4 px-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                isCriticalRisk
                  ? 'bg-rose-50/70 border-2 border-rose-300 my-2'
                  : 'hover:bg-[#FAF1DF]/50'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
                    isCriticalRisk
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-[#FAF1DF] text-[#14532D]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-[#1C1917] text-lg">
                      {tx.partyName}
                    </span>
                    {isCriticalRisk && (
                      <span className="text-base font-bold px-2.5 py-0.5 rounded-xl bg-rose-700 text-white">
                        {t.lowersKeepAsideBadge}
                      </span>
                    )}
                  </div>
                  <div className="text-lg text-[#57534E] mt-0.5">
                    {getLocalizedTxTitle(tx, language)}{' '}
                    {tx.invoiceNumber ? `· #${tx.invoiceNumber}` : ''}
                  </div>
                </div>
              </div>

              {/* Amount, Due Date & Actions */}
              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                <div className="text-left sm:text-right">
                  <div className="font-mono font-extrabold text-[#1C1917] text-xl">
                    {formatRupee(tx.amount, language)}
                  </div>
                  <div className="text-base text-[#57534E] flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#78716C]" />
                    <span>
                      {t.duePrefix}: {formatLocalDate(tx.dueDate, language)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isCriticalRisk ? (
                    <button
                      type="button"
                      onClick={() => onApplyRemedy('split_payment')}
                      className="min-h-[48px] px-4 py-2 bg-[#14532D] hover:bg-[#166534] text-white rounded-2xl text-base font-extrabold inline-flex items-center gap-2 cursor-pointer"
                    >
                      <Split className="w-4 h-4" />
                      <span>{t.splitHalfBtn}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onMarkPaid(tx.id)}
                      className="min-h-[48px] px-4 py-2 bg-[#FAF1DF] hover:bg-[#F3E5C8] border border-[#D6C5A9] text-[#1C1917] rounded-2xl text-base font-bold cursor-pointer"
                    >
                      {t.markPaidBtn}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
