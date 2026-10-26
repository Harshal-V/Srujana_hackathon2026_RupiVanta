import React from 'react';
import {
  Users,
  ChevronRight,
  UserCheck,
  UserX,
  AlertCircle
} from 'lucide-react';

interface CustomerPaymentBehaviourCardProps {
  onViewAll: () => void;
  onSelectCustomer?: (customerName: string) => void;
  language?: 'en' | 'kn';
}

export const CustomerPaymentBehaviourCard: React.FC<CustomerPaymentBehaviourCardProps> = ({
  onViewAll,
  onSelectCustomer,
  language = 'en',
}) => {
  // 5 customer payment profiles matching the reference screenshot exactly
  const customerRows = [
    {
      id: 'cust-bh-1',
      name: 'Ravi Traders',
      avgDelay: '6 days',
      reliability: '70%',
      status: 'At Risk',
      statusType: 'risk',
    },
    {
      id: 'cust-bh-2',
      name: 'Green Mart',
      avgDelay: '2 days',
      reliability: '90%',
      status: 'On Time',
      statusType: 'on_time',
    },
    {
      id: 'cust-bh-3',
      name: 'Lakshmi Stores',
      avgDelay: '4 days',
      reliability: '80%',
      status: 'At Risk',
      statusType: 'risk',
    },
    {
      id: 'cust-bh-4',
      name: 'City Suppliers',
      avgDelay: '0 days',
      reliability: '100%',
      status: 'On Time',
      statusType: 'on_time',
    },
    {
      id: 'cust-bh-5',
      name: 'Sunrise Retail',
      avgDelay: '8 days',
      reliability: '60%',
      status: 'High Risk',
      statusType: 'high_risk',
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">
            {language === 'kn' ? 'ಗ್ರಾಹಕರ ಪಾವತಿ ನಡವಳಿಕೆ' : 'Customer Payment Behaviour'}
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
              <th className="py-2.5 px-2">Customer</th>
              <th className="py-2.5 px-2">Avg. Delay</th>
              <th className="py-2.5 px-2">Reliability</th>
              <th className="py-2.5 px-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {customerRows.map((row) => (
              <tr
                key={row.id}
                onClick={() => onSelectCustomer && onSelectCustomer(row.name)}
                className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
              >
                <td className="py-3 px-2 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="7" r="4" />
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      </svg>
                    </div>
                    <span className="font-semibold text-slate-900 group-hover:text-teal-700 transition-colors">
                      {row.name}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-2 text-slate-600 font-mono whitespace-nowrap">
                  {row.avgDelay}
                </td>
                <td className="py-3 px-2 text-slate-800 font-mono font-bold whitespace-nowrap">
                  {row.reliability}
                </td>
                <td className="py-3 px-2 text-center whitespace-nowrap">
                  <span
                    className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                      row.statusType === 'on_time'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                        : row.statusType === 'risk'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                        : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                    }`}
                  >
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
