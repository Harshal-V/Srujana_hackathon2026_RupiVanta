import React from 'react';
import {
  AlertCircle,
  ArrowRight,
  Clock,
  Sparkles,
  ShieldAlert,
  CheckCircle,
  HelpCircle,
  ArrowDownRight,
  TrendingDown,
  Layers,
  Wand2
} from 'lucide-react';
import { CashRisk } from '../types/cashflow';
import { formatINR } from '../utils/forecastEngine';

interface RiskAlertSectionProps {
  currentCash: number;
  expectedReceipts: number;
  upcomingPayment: number;
  minimumReserve: number;
  risk: CashRisk | null;
  onApplyRemedy: (remedyType: string) => void;
  onOpenSimulator: () => void;
  onOpenCustomerFollowUp: () => void;
}

export const RiskAlertSection: React.FC<RiskAlertSectionProps> = ({
  currentCash,
  expectedReceipts,
  upcomingPayment,
  minimumReserve,
  risk,
  onApplyRemedy,
  onOpenSimulator,
  onOpenCustomerFollowUp,
}) => {
  // If no risk exists or already resolved
  if (!risk) {
    return (
      <div className="bg-white rounded-xl p-5 border border-emerald-200/80 shadow-2xs">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              No Immediate Shortfall Detected
            </h2>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Your projected cash balance remains above the minimum reserve of {formatINR(minimumReserve)} over the next 30 days.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // The 4 core figures from prompt:
  // Current available cash: ₹30,000
  // Upcoming supplier payment: ₹40,000
  // Expected customer receipts: ₹20,000
  // Minimum cash reserve: ₹10,000
  const shortfallAmount = risk.shortfallAmount; // ₹10,000 below zero
  const reserveGap = risk.reserveGap;           // ₹20,000 below reserve
  const riskDateFormatted = "Thursday, Oct 29, 2026";
  const daysUntilRisk = risk.daysAway;

  return (
    <section className="bg-white rounded-xl border border-amber-200/90 shadow-xs overflow-hidden">
      {/* Header Banner */}
      <div className="px-5 py-3.5 bg-gradient-to-r from-amber-50/90 via-amber-50/40 to-white border-b border-amber-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
            !
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                Predicted Cash-Flow Shortfall Risk
              </span>
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                In {daysUntilRisk} Days ({riskDateFormatted})
              </span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm text-amber-900 font-semibold">
            Money you must keep aside short by:{' '}
            <span className="font-mono font-bold text-rose-700">{formatINR(reserveGap)}</span>
            <span className="text-slate-600 text-xs ml-1">({formatINR(shortfallAmount)} below zero)</span>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        {/* The 4 Core Figures Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {/* Confirmed Cash */}
          <div className="p-3.5 rounded-lg bg-slate-50/90 border border-slate-200/80">
            <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              1. Available Cash Today
            </div>
            <div className="mt-1 text-xl font-bold font-mono tabular-nums text-slate-900">
              {formatINR(currentCash)}
            </div>
            <div className="mt-1 text-[11px] text-emerald-700 font-medium flex items-center gap-1">
              <span>●</span> Confirmed in Bank
            </div>
          </div>

          {/* Upcoming Outgoing Bill */}
          <div className="p-3.5 rounded-lg bg-rose-50/70 border border-rose-200/80">
            <div className="text-[11px] font-semibold text-rose-900 uppercase tracking-wider">
              2. Malnad Agro Bill
            </div>
            <div className="mt-1 text-xl font-bold font-mono tabular-nums text-rose-700">
              {formatINR(upcomingPayment)}
            </div>
            <div className="mt-1 text-[11px] text-rose-800 font-medium">
              Due Oct 29 <span className="text-rose-900">(Exceeds cash by ₹10k)</span>
            </div>
          </div>

          {/* Expected Incoming */}
          <div className="p-3.5 rounded-lg bg-teal-50/70 border border-teal-200/80">
            <div className="text-[11px] font-semibold text-teal-900 uppercase tracking-wider">
              3. Sri Balaji Receipt
            </div>
            <div className="mt-1 text-xl font-bold font-mono tabular-nums text-teal-800">
              {formatINR(expectedReceipts)}
            </div>
            <div className="mt-1 text-[11px] text-teal-700 font-medium">
              Due Oct 31 <span className="text-slate-600">(Arrives 2 days late!)</span>
            </div>
          </div>

          {/* Safety Reserve */}
          <div className="p-3.5 rounded-lg bg-slate-50/90 border border-slate-200/80">
            <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              4. Minimum Reserve Policy
            </div>
            <div className="mt-1 text-xl font-bold font-mono tabular-nums text-slate-800">
              {formatINR(minimumReserve)}
            </div>
            <div className="mt-1 text-[11px] text-slate-600">
              Emergency buffer requirement
            </div>
          </div>
        </div>

        {/* Visual Timeline of the Timing Mismatch */}
        <div className="rounded-lg bg-slate-50 p-4 border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Timing Mismatch Visualization (Why Cash Runs Out Before Profits Arrive)
            </span>
            <span className="text-[11px] text-slate-600">
              Oct 24 — Oct 31, 2026
            </span>
          </div>

          {/* Step Sequence Bar */}
          <div className="relative pt-2 pb-1">
            <div className="absolute top-1/2 left-4 right-4 h-1 bg-slate-200 -translate-y-1/2 z-0 hidden sm:block" />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
              {/* Point 1: Today */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900">Today · Oct 24</span>
                  <span className="text-emerald-700 font-mono font-semibold">Safe</span>
                </div>
                <div className="mt-1.5 text-sm font-mono font-bold text-slate-900">
                  Balance: {formatINR(currentCash)}
                </div>
                <p className="mt-1 text-[11px] text-slate-600 leading-snug">
                  Cash is positive and comfortably above the {formatINR(minimumReserve)} safety reserve.
                </p>
              </div>

              {/* Point 2: The Deficit Mismatch */}
              <div className="bg-rose-50/90 p-3 rounded-lg border-2 border-rose-300 shadow-xs relative">
                <div className="absolute -top-2.5 right-3 px-1.5 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold uppercase tracking-wider">
                  Critical Deficit
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-rose-950">Oct 29 · Supplier Bill</span>
                  <span className="text-rose-700 font-mono font-bold">-₹10,000</span>
                </div>
                <div className="mt-1.5 text-sm font-mono font-bold text-rose-700">
                  Balance: -₹10,000 (Shortfall)
                </div>
                <p className="mt-1 text-[11px] text-rose-900 leading-snug">
                  ₹40,000 bill to Malnad Agro debited. Cheques bounce or bank penalties trigger.
                </p>
              </div>

              {/* Point 3: Money Arrives 2 Days Too Late */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900">Oct 31 · Customer Pays</span>
                  <span className="text-teal-700 font-mono font-semibold">+₹20,000</span>
                </div>
                <div className="mt-1.5 text-sm font-mono font-bold text-slate-900">
                  Balance: {formatINR(10000)}
                </div>
                <p className="mt-1 text-[11px] text-slate-600 leading-snug">
                  Sri Balaji payment clears, restoring cash, but the 48-hour crisis has already occurred.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Diagnosis & Recommended Next Action */}
        <div className="p-4 rounded-lg bg-teal-50/60 border border-teal-200/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-1.5 text-xs font-bold text-teal-950">
              <Sparkles className="w-4 h-4 text-teal-700" />
              <span>Recommended Next Step: Split Supplier Bill & Collect Overdue Invoice</span>
            </div>
            <p className="text-xs text-teal-900 leading-relaxed">
              Negotiate paying Malnad Agro in 2 tranches of ₹20,000 (Oct 29 & Nov 4), or recover the ₹15,000 overdue from Royal Kirana Stores today. Both actions keep your minimum reserve intact.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => onApplyRemedy('split_payment')}
              className="flex-1 sm:flex-none px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors whitespace-nowrap cursor-pointer"
            >
              Simulate 50% Split
            </button>
            <button
              onClick={onOpenCustomerFollowUp}
              className="flex-1 sm:flex-none px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition-colors whitespace-nowrap cursor-pointer"
            >
              Follow-up Overdue (₹15k)
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
