import React from 'react';
import {
  CalendarDays,
  TrendingUp,
  TrendingDown,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldAlert,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { MonthlyProjection } from '../types/cashflow';
import { formatINR } from '../utils/forecastEngine';

interface MonthlyProjectionsViewProps {
  monthlyForecast: MonthlyProjection[];
  minimumReserve: number;
  language?: 'en' | 'kn';
}

export const MonthlyProjectionsView: React.FC<MonthlyProjectionsViewProps> = ({
  monthlyForecast,
  minimumReserve,
  language = 'en',
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
            <CalendarDays className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {language === 'kn' ? 'ಮಾಸಿಕ ನಗದು ಹರಿವಿನ ಮುನ್ನೋಟ (Monthly Cash Projection)' : 'Monthly Projected Cash Projections'}
            </h3>
            <p className="text-xs text-slate-500">
              {language === 'kn'
                ? 'ಪ್ರಾರಂಭದ ನಗದು, ನಿರೀಕ್ಷಿತ ಆದಾಯ, ವೆಚ್ಚಗಳು ಮತ್ತು ಮುಕ್ತಾಯದ ಮೊತ್ತ'
                : 'Projected monthly opening balances, expected receipts, outflows, and closing cash'}
            </p>
          </div>
        </div>
      </div>

      {/* Monthly Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        {monthlyForecast.map((month) => {
          const isDeficit = month.lowestBalance < 0;
          const isWarning = month.isBelowReserve;

          return (
            <div
              key={month.monthKey}
              className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                isDeficit
                  ? 'bg-rose-50/50 border-rose-300'
                  : isWarning
                  ? 'bg-amber-50/40 border-amber-300'
                  : 'bg-slate-50/70 border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="font-bold text-xs text-slate-900">{month.monthLabel}</span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      isDeficit
                        ? 'bg-rose-600 text-white'
                        : isWarning
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {isDeficit ? 'Deficit Risk' : isWarning ? 'Buffer Caution' : 'Healthy'}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span className="font-sans text-[11px]">Opening Cash:</span>
                    <span>{formatINR(month.startingBalance)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span className="font-sans text-[11px] flex items-center gap-1">
                      <ArrowDownLeft className="w-3 h-3" /> Receipts:
                    </span>
                    <span className="font-bold">+{formatINR(month.totalInflow)}</span>
                  </div>
                  <div className="flex justify-between text-rose-700">
                    <span className="font-sans text-[11px] flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3" /> Outflows:
                    </span>
                    <span className="font-bold">-{formatINR(month.totalOutflow)}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 pt-1.5 border-t border-slate-200/80 font-bold">
                    <span className="font-sans text-[11px]">Closing Cash:</span>
                    <span className={month.closingBalance < 0 ? 'text-rose-700' : 'text-slate-900'}>
                      {formatINR(month.closingBalance)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-2.5 border-t border-slate-200/70 text-[11px] flex items-center justify-between">
                <span className="text-slate-500">Lowest Dip:</span>
                <span
                  className={`font-mono font-bold ${
                    month.lowestBalance < 0 ? 'text-rose-700' : month.lowestBalance < minimumReserve ? 'text-amber-700' : 'text-slate-700'
                  }`}
                >
                  {formatINR(month.lowestBalance)} ({month.lowestDate.slice(5)})
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
