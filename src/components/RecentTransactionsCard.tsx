import React from 'react';
import {
  Receipt,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  ShoppingBag,
  CircleDollarSign
} from 'lucide-react';
import { Transaction } from '../types/cashflow';
import { formatINR, formatDateLabel } from '../utils/forecastEngine';

interface RecentTransactionsCardProps {
  onViewAll: () => void;
  onSelectTransaction?: (tx: any) => void;
  language?: 'en' | 'kn';
}

export const RecentTransactionsCard: React.FC<RecentTransactionsCardProps> = ({
  onViewAll,
  onSelectTransaction,
  language = 'en',
}) => {
  // 5 verified recent transactions as shown in the reference design
  const recentRows = [
    {
      id: 'rtx-1',
      date: '24 Oct 2026',
      type: 'Expense',
      isExpense: true,
      category: 'Supplier Payment',
      amount: -18000,
      status: 'Paid',
    },
    {
      id: 'rtx-2',
      date: '23 Oct 2026',
      type: 'Income',
      isExpense: false,
      category: 'Customer Receipt',
      amount: 8000,
      status: 'Paid',
    },
    {
      id: 'rtx-3',
      date: '22 Oct 2026',
      type: 'Expense',
      isExpense: true,
      category: 'Rent',
      amount: -5000,
      status: 'Paid',
    },
    {
      id: 'rtx-4',
      date: '21 Oct 2026',
      type: 'Income',
      isExpense: false,
      category: 'Sales',
      amount: 12000,
      status: 'Paid',
    },
    {
      id: 'rtx-5',
      date: '20 Oct 2026',
      type: 'Expense',
      isExpense: true,
      category: 'Utilities',
      amount: -2000,
      status: 'Paid',
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
            <Receipt className="w-4 h-4 text-teal-600" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">
            {language === 'kn' ? 'ಇತ್ತೀಚಿನ ವಹಿವಾಟುಗಳು' : 'Recent Transactions'}
          </h3>
        </div>
        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-teal-700 hover:text-teal-900 transition-colors cursor-pointer"
        >
          {language === 'kn' ? 'ಎಲ್ಲವನ್ನೂ ವೀಕ್ಷಿಸಿ' : 'View all'}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto pt-2">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider border-b border-slate-100">
              <th className="py-2.5 px-2">Date</th>
              <th className="py-2.5 px-2">Type</th>
              <th className="py-2.5 px-2">Category</th>
              <th className="py-2.5 px-2 text-right">Amount</th>
              <th className="py-2.5 px-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {recentRows.map((row) => (
              <tr
                key={row.id}
                onClick={() => onSelectTransaction && onSelectTransaction(row)}
                className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
              >
                <td className="py-3 px-2 text-slate-600 font-medium whitespace-nowrap">
                  {row.date}
                </td>
                <td className="py-3 px-2 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 font-medium text-slate-700">
                    {row.isExpense ? (
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    )}
                    <span>{row.type}</span>
                  </div>
                </td>
                <td className="py-3 px-2 text-slate-600 whitespace-nowrap">
                  {row.category}
                </td>
                <td className="py-3 px-2 text-right font-mono font-bold whitespace-nowrap">
                  <span className={row.amount < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                    {row.amount < 0 ? `-₹${Math.abs(row.amount).toLocaleString('en-IN')}` : `+₹${row.amount.toLocaleString('en-IN')}`}
                  </span>
                </td>
                <td className="py-3 px-2 text-center whitespace-nowrap">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
