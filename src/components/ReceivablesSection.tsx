import React, { useState } from 'react';
import {
  ArrowDownLeft,
  Send,
  Check
} from 'lucide-react';
import { Transaction } from '../types/cashflow';
import { AppLanguage } from '../types/munimji';
import { ANCHOR_DATE } from '../data/initialData';
import { diffDaysISO } from '../utils/forecastEngine';
import {
  TRANSLATIONS,
  formatIndianNumber,
  formatLocalDate,
  formatRupee,
  getLocalizedTxStatus,
  getLocalizedTxTitle
} from '../utils/translations';

interface ReceivablesSectionProps {
  receivables: Transaction[];
  onMarkPaid: (id: string) => void;
  selectedFollowUpCustomer?: Transaction | null;
  onCloseFollowUpModal?: () => void;
  onOpenFollowUpFor: (tx: Transaction) => void;
  language?: AppLanguage;
}

export const ReceivablesSection: React.FC<ReceivablesSectionProps> = ({
  receivables,
  onMarkPaid,
  onOpenFollowUpFor,
  language = 'en',
}) => {
  const [filter, setFilter] = useState<'all' | 'overdue' | 'due_soon' | 'expected'>('all');
  const t = TRANSLATIONS[language];

  const unpaidReceivables = receivables.filter((r) => r.status !== 'paid');

  const filteredList = receivables.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'overdue') return item.status === 'overdue';
    if (filter === 'due_soon') return item.status === 'due_soon';
    if (filter === 'expected')
      return item.status === 'expected' || item.status === 'partially_paid';
    return true;
  });

  const totalExpected = unpaidReceivables.reduce(
    (sum, item) => sum + Math.max(0, item.amount - (item.paidAmount || 0)),
    0
  );
  const overdueCount = unpaidReceivables.filter((r) => r.status === 'overdue').length;

  const filterTabs: Array<{
    id: 'all' | 'overdue' | 'due_soon' | 'expected';
    label: string;
  }> = [
    { id: 'all', label: t.filterAll },
    { id: 'overdue', label: t.filterOverdue },
    { id: 'due_soon', label: t.filterDueSoon },
    { id: 'expected', label: t.filterExpected },
  ];

  return (
    <div className="khata-card rounded-3xl p-5 sm:p-6 space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#EADDC5] gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#1C1917] flex items-center gap-2">
              <ArrowDownLeft className="w-6 h-6 text-[#14532D]" />
              {t.toolReceivables}
            </h3>
            <span className="text-lg font-mono font-extrabold px-3 py-1 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-300">
              {formatRupee(totalExpected, language)}
            </span>
          </div>
          <p className="text-lg text-[#57534E] mt-1">
            {t.receivablesSubtitle}
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-[#FAF1DF] border border-[#D6C5A9] rounded-2xl self-start sm:self-auto">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`min-h-[44px] px-3.5 py-1.5 text-base font-bold rounded-xl transition-colors cursor-pointer ${
                filter === tab.id
                  ? 'bg-[#14532D] text-white shadow-xs'
                  : 'text-[#44403C] hover:text-[#1C1917]'
              }`}
            >
              {tab.label}
              {tab.id === 'overdue' && overdueCount > 0 && (
                <span className="ml-1.5 font-mono font-extrabold">
                  ({formatIndianNumber(overdueCount, language)})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Receivables Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-lg">
          <thead>
            <tr className="border-b-2 border-[#DFD2B7] text-[#57534E] font-bold">
              <th className="py-3 px-3">{t.colCustomerInvoice}</th>
              <th className="py-3 px-3 text-right">{t.colAmount}</th>
              <th className="py-3 px-3">{t.colDueDate}</th>
              <th className="py-3 px-3">{t.colStatus}</th>
              <th className="py-3 px-3 text-right">{t.colAction}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EADDC5]">
            {filteredList.map((tx) => {
              const isOverdue = tx.status === 'overdue';
              const isPaid = tx.status === 'paid';
              const netAmount = isPaid
                ? tx.amount
                : Math.max(0, tx.amount - (tx.paidAmount || 0));
              const daysLate = isOverdue
                ? Math.max(1, diffDaysISO(tx.dueDate, ANCHOR_DATE))
                : 0;

              return (
                <tr
                  key={tx.id}
                  className={
                    isOverdue ? 'bg-rose-50/50' : 'hover:bg-[#FAF1DF]/50'
                  }
                >
                  <td className="py-4 px-3">
                    <div className="font-extrabold text-[#1C1917]">
                      {tx.partyName}
                    </div>
                    <div className="text-base text-[#57534E]">
                      {tx.invoiceNumber ? `${tx.invoiceNumber} · ` : ''}
                      {getLocalizedTxTitle(tx, language)}
                    </div>
                  </td>

                  <td className="py-4 px-3 text-right font-mono font-extrabold text-[#1C1917] tabular-nums">
                    {formatRupee(netAmount, language)}
                  </td>

                  <td className="py-4 px-3 font-mono text-[#44403C]">
                    {formatLocalDate(tx.dueDate, language)}
                    {isOverdue && (
                      <span className="block text-base text-rose-700 font-sans font-bold">
                        {t.daysLateSuffix(daysLate)}
                      </span>
                    )}
                  </td>

                  <td className="py-4 px-3">
                    <span
                      className={`text-base font-bold px-3 py-1 rounded-xl inline-block ${
                        isOverdue
                          ? 'bg-rose-100 text-rose-900'
                          : tx.status === 'due_soon'
                          ? 'bg-amber-100 text-amber-900'
                          : tx.status === 'partially_paid'
                          ? 'bg-blue-100 text-blue-900'
                          : 'bg-emerald-100 text-emerald-900'
                      }`}
                    >
                      {getLocalizedTxStatus(tx.status, language)}
                    </span>
                  </td>

                  <td className="py-4 px-3 text-right">
                    {!isPaid ? (
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenFollowUpFor(tx)}
                          className={`min-h-[44px] px-3.5 py-2 rounded-2xl text-base font-extrabold inline-flex items-center gap-1.5 cursor-pointer ${
                            isOverdue
                              ? 'bg-[#15803D] hover:bg-[#166534] text-white'
                              : 'bg-white hover:bg-[#FAF1DF] border border-[#D6C5A9] text-[#14532D]'
                          }`}
                        >
                          <Send className="w-4 h-4 shrink-0" />
                          <span>{t.sendWhatsApp}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onMarkPaid(tx.id)}
                          className="min-h-[44px] px-3.5 py-2 bg-[#FAF1DF] hover:bg-[#F3E5C8] border border-[#D6C5A9] text-[#1C1917] rounded-2xl text-base font-bold inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-4 h-4 text-[#14532D] shrink-0" />
                          <span>{t.markReceivedBtn}</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-base font-bold text-[#14532D] inline-flex items-center gap-1">
                        <Check className="w-4 h-4" />
                        <span>{getLocalizedTxStatus('paid', language)}</span>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
