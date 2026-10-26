import React from 'react';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Info,
  ChevronRight
} from 'lucide-react';
import { formatINR } from '../utils/forecastEngine';

interface KeyInsightsCardProps {
  onOpenShortfall: () => void;
  onOpenRunway: () => void;
  onOpenReason: () => void;
  shortfallAmount?: number;
  shortfallDate?: string;
  language?: 'en' | 'kn';
}

export const KeyInsightsCard: React.FC<KeyInsightsCardProps> = ({
  onOpenShortfall,
  onOpenRunway,
  onOpenReason,
  shortfallAmount = 10000,
  shortfallDate = 'Oct 29, 2026',
  language = 'en',
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center gap-2 pb-3.5 border-b border-slate-100">
        <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-teal-600" />
        </div>
        <h3 className="text-sm font-bold text-slate-900">
          {language === 'kn' ? 'ಪ್ರಮುಖ ಒಳನೋಟಗಳು (Key Insights)' : 'Key Insights'}
        </h3>
      </div>

      {/* Insights List */}
      <div className="space-y-3 pt-3 flex-1">
        {/* Insight 1: Shortfall Risk */}
        <div
          onClick={onOpenShortfall}
          className="p-3 rounded-xl border border-rose-100 bg-rose-50/40 hover:bg-rose-50 hover:border-rose-200 transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-rose-900 transition-colors">
                {language === 'kn' ? 'ಸಂಭಾವ್ಯ ನಗದು ಕೊರತೆ' : 'Possible cash shortfall'}
              </h4>
              <p className="text-[11px] font-mono text-rose-700 font-semibold truncate mt-0.5">
                {shortfallDate} ({formatINR(shortfallAmount)})
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all shrink-0" />
        </div>

        {/* Insight 2: Cash Balance Healthy */}
        <div
          onClick={onOpenRunway}
          className="p-3 rounded-xl border border-emerald-100 bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-200 transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-900 transition-colors">
                {language === 'kn' ? 'ನಗದು ಸಮತೋಲನ ಸುರಕ್ಷಿತವಾಗಿದೆ' : 'Cash balance is healthy'}
              </h4>
              <p className="text-[11px] text-emerald-700 font-medium truncate mt-0.5">
                {language === 'kn' ? 'ಮುಂದಿನ 3 ದಿನಗಳು' : 'Next 3 days'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all shrink-0" />
        </div>

        {/* Insight 3: Main Reason */}
        <div
          onClick={onOpenReason}
          className="p-3 rounded-xl border border-blue-100 bg-blue-50/40 hover:bg-blue-50 hover:border-blue-200 transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Info className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-900 transition-colors">
                {language === 'kn' ? 'ಮುಖ್ಯ ಕಾರಣ' : 'Main reason'}
              </h4>
              <p className="text-[11px] text-slate-600 leading-snug mt-0.5 line-clamp-2">
                {language === 'kn'
                  ? 'ಗ್ರಾಹಕರ ಪಾವತಿಗಿಂತ ಮುಂಚೆಯೇ ಸರಬರಾಜುದಾರರ ಪಾವತಿ (₹18,000) ಬರಬೇಕಿದೆ.'
                  : 'Supplier payment (₹18,000) due before expected customer receipt.'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all shrink-0" />
        </div>
      </div>
    </div>
  );
};
