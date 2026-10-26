import React, { useState } from 'react';
import {
  Download,
  Printer,
  ChevronDown,
  ChevronUp,
  Briefcase,
  AlertTriangle
} from 'lucide-react';
import { DayForecast, Transaction } from '../types/cashflow';
import { AppLanguage } from '../types/munimji';
import {
  TRANSLATIONS,
  formatLocalDate,
  formatRupee,
  getLocalizedBusinessName,
  translateWeekdayAbbr
} from '../utils/translations';

interface ReportsViewProps {
  currentCash: number;
  minimumReserve: number;
  dailyForecast: DayForecast[];
  transactions: Transaction[];
  businessName: string;
  language?: AppLanguage;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  currentCash,
  minimumReserve,
  dailyForecast,
  transactions,
  businessName,
  language = 'en',
}) => {
  const [showCaDetails, setShowCaDetails] = useState(false);
  const t = TRANSLATIONS[language];
  const localShopName = getLocalizedBusinessName(businessName, language);

  const totalInflows = transactions
    .filter((tx) => tx.type === 'inflow' && tx.status !== 'paid')
    .reduce((sum, tx) => sum + Math.max(0, tx.amount - (tx.paidAmount || 0)), 0);

  const totalOutflows = transactions
    .filter((tx) => tx.type === 'outflow' && tx.status !== 'paid')
    .reduce((sum, tx) => sum + Math.max(0, tx.amount - (tx.paidAmount || 0)), 0);

  const netChangeTotal = totalInflows - totalOutflows;
  const daysBelowReserve = dailyForecast.filter((d) => d.isBelowReserve).length;

  const handleExportCSV = () => {
    const headers = [
      `${t.colDueDate},${t.chartStartLabel},${t.chartMoneyInLabel},${t.chartBillsOutLabel},${t.modalDayChange},${t.chartEndDayLabel},${t.colStatus}\n`,
    ];
    const rows = dailyForecast.map(
      (d) =>
        `${d.date},${d.startingBalance},${d.inflow},${d.outflow},${d.netChange},${d.endingBalance},${
          d.isShortfall
            ? t.statusShortOfMoney
            : d.isBelowReserve
            ? t.statusLowCash
            : t.statusSafe
        }`
    );
    const blob = new Blob(['\uFEFF', ...headers, ...rows.map((r) => r + '\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RupiVanta_Report_${businessName.replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="khata-card rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#1C1917]">
            {t.repTitle}
          </h2>
          <p className="text-lg text-[#57534E] mt-0.5">
            {t.repSubtitle(localShopName)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="min-h-[48px] px-4 py-2.5 bg-white hover:bg-[#FAF1DF] text-[#1C1917] border border-[#D6C5A9] rounded-2xl text-lg font-bold inline-flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-5 h-5 text-[#14532D]" />
            <span>{t.repExportCsvBtn}</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="min-h-[48px] px-4 py-2.5 bg-[#14532D] hover:bg-[#166534] text-white rounded-2xl text-lg font-bold inline-flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-5 h-5 text-[#FDE68A]" />
            <span>{t.repPrintBtn}</span>
          </button>
        </div>
      </div>

      {/* Plain-Language Warning Strip */}
      {daysBelowReserve > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-amber-50 border-2 border-amber-300 flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-800 shrink-0 mt-0.5" />
          <p className="text-lg font-bold text-amber-950 leading-snug">
            {t.repPlainBanner(daysBelowReserve, formatRupee(minimumReserve, language))}
          </p>
        </div>
      )}

      {/* 4 Plain Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="khata-card p-5 rounded-3xl">
          <span className="text-lg font-bold text-[#57534E] block">
            {t.repBox1}
          </span>
          <p className="text-2xl font-extrabold font-mono text-[#1C1917] mt-1">
            {formatRupee(currentCash, language)}
          </p>
        </div>

        <div className="khata-card p-5 rounded-3xl">
          <span className="text-lg font-bold text-[#57534E] block">
            {t.repBox2}
          </span>
          <p className="text-2xl font-extrabold font-mono text-[#14532D] mt-1">
            {formatRupee(totalInflows, language, true)}
          </p>
        </div>

        <div className="khata-card p-5 rounded-3xl">
          <span className="text-lg font-bold text-[#57534E] block">
            {t.repBox3}
          </span>
          <p className="text-2xl font-extrabold font-mono text-rose-700 mt-1">
            {formatRupee(-totalOutflows, language)}
          </p>
        </div>

        <div className="khata-card p-5 rounded-3xl">
          <span className="text-lg font-bold text-[#57534E] block">
            {t.repBox4}
          </span>
          <p className="text-2xl font-extrabold font-mono text-amber-800 mt-1">
            {t.repDaysUnit(daysBelowReserve)}
          </p>
        </div>
      </div>

      {/* Day-by-Day Shop Money Book */}
      <div className="khata-card rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-xl font-extrabold text-[#1C1917]">
            {t.repTableTitle}
          </h3>

          <button
            type="button"
            onClick={() => setShowCaDetails(!showCaDetails)}
            className="min-h-[48px] px-4 py-2 rounded-2xl bg-[#FAF1DF] hover:bg-[#F3E5C8] border border-[#D6C5A9] text-[#1C1917] text-lg font-bold inline-flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <Briefcase className="w-5 h-5 text-[#14532D]" />
            <span>{showCaDetails ? t.detailsForCaHide : t.detailsForCaShow}</span>
            {showCaDetails ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>

        {showCaDetails && (
          <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#D6C5A9] text-lg text-[#44403C]">
            {t.repCaLedgerNote(
              formatRupee(totalInflows, language, true),
              formatRupee(-totalOutflows, language),
              formatRupee(netChangeTotal, language, true)
            )}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-lg">
            <thead>
              <tr className="border-b-2 border-[#DFD2B7] text-[#57534E] font-bold">
                <th className="py-3 px-3">{t.colDueDate}</th>
                <th className="py-3 px-3 text-right">{t.chartStartLabel}</th>
                <th className="py-3 px-3 text-right text-[#14532D]">{t.chartMoneyInLabel}</th>
                <th className="py-3 px-3 text-right text-rose-700">{t.chartBillsOutLabel}</th>
                <th className="py-3 px-3 text-right">{t.chartEndDayLabel}</th>
                <th className="py-3 px-3 text-center">{t.colStatus}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EADDC5]">
              {dailyForecast.slice(0, 30).map((row) => (
                <tr
                  key={row.date}
                  className={
                    row.isShortfall
                      ? 'bg-rose-50/70'
                      : row.isBelowReserve
                      ? 'bg-amber-50/50'
                      : 'hover:bg-[#FAF1DF]/50'
                  }
                >
                  <td className="py-3 px-3 font-bold text-[#1C1917]">
                    {formatLocalDate(row.date, language)} ({translateWeekdayAbbr(row.dayOfWeek, language)})
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-[#44403C]">
                    {formatRupee(row.startingBalance, language)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-[#14532D]">
                    {row.inflow > 0 ? formatRupee(row.inflow, language, true) : '—'}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-rose-700">
                    {row.outflow > 0 ? formatRupee(-row.outflow, language) : '—'}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-extrabold text-[#1C1917]">
                    {formatRupee(row.endingBalance, language)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`px-3 py-1 rounded-xl text-base font-bold inline-block ${
                        row.isShortfall
                          ? 'bg-rose-100 text-rose-900'
                          : row.isBelowReserve
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-emerald-100 text-emerald-900'
                      }`}
                    >
                      {row.isShortfall
                        ? t.statusShortOfMoney
                        : row.isBelowReserve
                        ? t.statusLowCash
                        : t.statusSafe}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
