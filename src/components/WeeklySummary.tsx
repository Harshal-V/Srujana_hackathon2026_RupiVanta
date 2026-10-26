import React from 'react';
import {
  FileText,
  AlertCircle,
  TrendingUp,
  Clock,
  CheckCircle2,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { formatINR } from '../utils/forecastEngine';

interface WeeklySummaryProps {
  currentCash: number;
  overdueAmount: number;
  upcomingPaymentAmount: number;
  upcomingPaymentParty: string;
  onJumpToRisk: () => void;
  onJumpToOverdue: () => void;
}

export const WeeklySummary: React.FC<WeeklySummaryProps> = ({
  currentCash,
  overdueAmount,
  upcomingPaymentAmount,
  upcomingPaymentParty,
  onJumpToRisk,
  onJumpToOverdue,
}) => {
  const summaryPoints = [
    {
      question: 'What changed this week?',
      answer: `Confirmed bank cash sits at ${formatINR(currentCash)}. Weekend retail counter collections brought in ₹14,200, but ₹15,000 from Royal Kirana Stores officially slipped into overdue status.`,
      icon: TrendingUp,
      accentColor: 'text-teal-700 bg-teal-50',
    },
    {
      question: 'What money is overdue?',
      answer: `${formatINR(overdueAmount)} is currently overdue from Royal Kirana Stores (Invoice #INV-402, 4 days past the Oct 20 promise date).`,
      icon: AlertCircle,
      accentColor: 'text-amber-700 bg-amber-50',
      action: {
        label: 'Send WhatsApp Follow-up',
        onClick: onJumpToOverdue,
      },
    },
    {
      question: 'What major payments are coming next?',
      answer: `${formatINR(upcomingPaymentAmount)} due to ${upcomingPaymentParty} on Oct 29, followed by Commercial Godown Rent of ₹12,000 on Nov 01.`,
      icon: Clock,
      accentColor: 'text-slate-700 bg-slate-100',
    },
    {
      question: 'What should the owner pay attention to first?',
      answer: `Resolve the ₹10,000 cash deficit projected for Oct 29 before Friday clearing. Either split the ${upcomingPaymentParty} bill into two halves or collect the overdue ₹15,000.`,
      icon: CheckCircle2,
      accentColor: 'text-indigo-700 bg-indigo-50',
      action: {
        label: 'View Cash-Flow Risk Plan',
        onClick: onJumpToRisk,
      },
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center">
            <FileText className="w-3.5 h-3.5 text-teal-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Smart Weekly Brief
            </h3>
            <span className="text-[11px] text-slate-500">
              Plain-language executive summary for the week of Oct 24 — Oct 31, 2026
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {summaryPoints.map((pt, idx) => {
          const Icon = pt.icon;
          return (
            <div
              key={idx}
              className="p-3.5 rounded-lg border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between space-y-2.5"
            >
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${pt.accentColor}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-900">
                    {pt.question}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-8">
                  {pt.answer}
                </p>
              </div>

              {pt.action && (
                <div className="pl-8 pt-1">
                  <button
                    onClick={pt.action.onClick}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-900 transition-colors cursor-pointer"
                  >
                    <span>{pt.action.label}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
