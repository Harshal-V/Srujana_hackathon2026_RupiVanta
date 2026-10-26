import React from 'react';
import {
  X,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ExternalLink
} from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold text-sm">
              ₹
            </div>
            <div>
              <h3 className="text-sm font-bold">RupiVanta — Solution Architecture</h3>
              <p className="text-[11px] text-teal-300">Srujana Hackathon · Problem Statement F-03</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 leading-relaxed">
          {/* Problem Statement Box */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
              Official Problem Statement: F-03
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              Predictive Cash-Flow Management for Small Businesses
            </h4>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              "Small businesses can be profitable yet still run out of cash because customer payments arrive late, supplier bills become due, and expenses occur at the wrong time. The application should help business owners understand what is likely to happen to their cash and what they can do before a shortage occurs."
            </p>
          </div>

          {/* Core Innovation: Beyond Generic Accounting */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 text-sm">
              The Cash-Flow Command Center Architecture
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-slate-200 bg-white">
                <span className="font-bold text-rose-800 block mb-1">Traditional Accounting Dashboards</span>
                <p className="text-slate-500 text-[11px]">
                  Show backward-looking historical ledgers, profit & loss statements, and tax receipts. They tell you that you are "profitable" even when you have ₹0 to pay wages on Friday.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-teal-300 bg-teal-50/50">
                <span className="font-bold text-teal-900 block mb-1">RupiVanta Predictive Approach</span>
                <p className="text-teal-950 text-[11px]">
                  Focuses on the exact timeline of future cash events: flags the timing mismatch (e.g. ₹40k bill due Oct 29 before ₹20k receipt on Oct 31) and simulates concrete countermeasures.
                </p>
              </div>
            </div>
          </div>

          {/* Key Capabilities */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 text-sm">
              Core Capabilities in this Prototype
            </h4>
            <ul className="space-y-1.5 list-disc pl-4 text-slate-600 text-[11px]">
              <li>
                <strong className="text-slate-900">Next Cash-Flow Risk Timeline:</strong> Highlights the 48-hour gap between Malnad Agro outflow and Sri Balaji inflow.
              </li>
              <li>
                <strong className="text-slate-900">What-If Scenario Sandbox:</strong> Test what happens if customer pays 7 days late, sales drop 15%, or sudden ₹10,000 repairs occur.
              </li>
              <li>
                <strong className="text-slate-900">Action Comparison Matrix:</strong> Compares supplier 50% split vs. early payment discount vs. recovering overdue receivables.
              </li>
              <li>
                <strong className="text-slate-900">Bilingual Support (English & Kannada):</strong> Follow-up reminders and AI Advisor questions crafted for Karnataka retail traders.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
