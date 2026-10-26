import React from 'react';
import {
  Lightbulb,
  ArrowRight,
  MessageCircle,
  ExternalLink
} from 'lucide-react';

interface RecommendedNextStepBannerProps {
  onViewRecoveryOptions: () => void;
  onSendWhatsAppAlert: () => void;
  language?: 'en' | 'kn';
}

export const RecommendedNextStepBanner: React.FC<RecommendedNextStepBannerProps> = ({
  onViewRecoveryOptions,
  onSendWhatsAppAlert,
  language = 'en',
}) => {
  return (
    <div className="bg-[#E6F4F1] border border-[#BCE3DA] rounded-2xl p-5 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-5 transition-all">
      {/* Left Icon & Text Content */}
      <div className="flex items-start gap-4 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
          <Lightbulb className="w-5 h-5 text-amber-200" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            {language === 'kn' ? 'ಶಿಫಾರಸು ಮಾಡಿದ ಮುಂದಿನ ಹೆಜ್ಜೆ' : 'Recommended Next Step'}
          </h4>
          <p className="text-xs text-slate-700 mt-1 leading-relaxed max-w-2xl">
            {language === 'kn'
              ? 'ಮಲ್ನಾಡ್ ಆಗ್ರೋ ಸರಬರಾಜುದಾರರ ₹18,000 ಪಾವತಿಯು 5 ದಿನಗಳಲ್ಲಿ ಬಾಕಿಯಿದೆ. ಸರಬರಾಜುದಾರರೊಂದಿಗೆ ಮಾತುಕತೆ ನಡೆಸಿ ದಿನಾಂಕ ಮುಂದೂಡಲು ಅಥವಾ ₹15,000 ಗ್ರಾಹಕರ ಪಾವತಿಯನ್ನು ಶೀಘ್ರವಾಗಿ ವಸೂಲಿ ಮಾಡಲು ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ.'
              : 'Supplier payment of ₹18,000 is due in 5 days. Consider following up with the supplier or negotiating a later date. You can also check if the expected customer payment of ₹15,000 will arrive on time.'}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 mt-3.5">
            <button
              onClick={onViewRecoveryOptions}
              className="px-4 py-2 bg-[#0F766E] hover:bg-[#0D625B] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              {language === 'kn' ? 'ರಿಕವರಿ ಆಯ್ಕೆಗಳನ್ನು ವೀಕ್ಷಿಸಿ' : 'View Recovery Options'}
            </button>

            <button
              onClick={onSendWhatsAppAlert}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-[#0F766E] border border-[#0F766E]/40 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>{language === 'kn' ? 'ವಾಟ್ಸಾಪ್ ಸಂದೇಶ ಕಳುಹಿಸಿ' : 'Send WhatsApp Alert'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right Graphic: Sprouting Plant & Rupee Badge */}
      <div className="hidden lg:flex items-center gap-3 shrink-0 pl-4 border-l border-[#BCE3DA]">
        <div className="relative">
          {/* Plant Sprouting illustration */}
          <svg className="w-12 h-12 text-teal-700" viewBox="0 0 48 48" fill="none">
            <path
              d="M24 44V26"
              stroke="#0D9488"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M24 32C24 24 33 22 36 20C36 28 29 32 24 32Z"
              fill="#14B8A6"
              opacity="0.8"
            />
            <path
              d="M24 26C24 18 15 16 12 14C12 22 19 26 24 26Z"
              fill="#0D9488"
              opacity="0.9"
            />
            <circle cx="24" cy="40" r="9" fill="#0F766E" />
            <text
              x="24"
              y="44"
              textAnchor="middle"
              fill="white"
              fontSize="11"
              fontWeight="bold"
              fontFamily="sans-serif"
            >
              ₹
            </text>
          </svg>
        </div>
        <div className="text-left">
          <span className="block text-xs font-bold text-slate-900 leading-tight">
            Small steps.
          </span>
          <span className="block text-xs font-bold text-slate-900 leading-tight">
            Big financial stability.
          </span>
        </div>
      </div>
    </div>
  );
};
