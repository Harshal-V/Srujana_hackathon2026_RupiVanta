import React from 'react';
import {
  Wallet,
  X,
  Building,
  Coins,
  ShieldCheck,
  Clock,
  ArrowRight
} from 'lucide-react';
import { BusinessProfile } from '../types/cashflow';
import { AppLanguage } from '../types/munimji';
import {
  TRANSLATIONS,
  formatRupee,
  getLocalizedBusinessName,
  getLocalizedExtraUI
} from '../utils/translations';

interface CashBreakdownModalProps {
  business: BusinessProfile;
  minimumReserve: number;
  onClose: () => void;
  onOpenSettings: () => void;
  language?: AppLanguage;
}

export const CashBreakdownModal: React.FC<CashBreakdownModalProps> = ({
  business,
  minimumReserve,
  onClose,
  onOpenSettings,
  language = 'en',
}) => {
  const t = TRANSLATIONS[language];
  const extra = getLocalizedExtraUI(language);
  const localShopName = getLocalizedBusinessName(business.name, language);

  const bankBalance = Math.round(business.currentCash * 0.816);
  const cashInHand = business.currentCash - bankBalance;
  const freeCash = business.currentCash - minimumReserve;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-[#FFFDF9] rounded-3xl shadow-2xl border-2 border-[#D6C5A9] w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-[#14532D] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#166534] flex items-center justify-center text-[#FDE68A]">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold">
                {t.cashModalTitle}
              </h3>
              <p className="text-base text-[#DCFCE7]">
                {extra.cashModalSubtitle(localShopName)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-[#DCFCE7] hover:bg-[#166534] cursor-pointer"
            aria-label={t.closeBtn}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Total Cash Today */}
          <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 flex items-center justify-between">
            <div>
              <span className="text-base font-bold text-emerald-900 block">
                {t.cashModalTotalToday}
              </span>
              <span className="text-3xl font-extrabold font-mono text-[#14532D] mt-1 block">
                {formatRupee(business.currentCash, language)}
              </span>
            </div>
            <div className="w-12 h-12 rounded-full bg-[#14532D] text-[#FDE68A] flex items-center justify-center font-extrabold text-2xl">
              ₹
            </div>
          </div>

          {/* Bank & Drawer */}
          <div className="space-y-3">
            <div className="p-4 rounded-2xl border border-[#D6C5A9] bg-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-800 flex items-center justify-center shrink-0">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-lg font-extrabold text-[#1C1917]">
                    {t.cashModalBankTitle}
                  </div>
                  <div className="text-base text-[#57534E]">
                    {t.cashModalBankSub}
                  </div>
                </div>
              </div>
              <span className="font-mono font-extrabold text-xl text-[#1C1917] shrink-0">
                {formatRupee(bankBalance, language)}
              </span>
            </div>

            <div className="p-4 rounded-2xl border border-[#D6C5A9] bg-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-lg font-extrabold text-[#1C1917]">
                    {t.cashModalDrawerTitle}
                  </div>
                  <div className="text-base text-[#57534E]">
                    {t.cashModalDrawerSub}
                  </div>
                </div>
              </div>
              <span className="font-mono font-extrabold text-xl text-[#1C1917] shrink-0">
                {formatRupee(cashInHand, language)}
              </span>
            </div>
          </div>

          {/* Keep-Aside & Free Money (Zero "Unencumbered" jargon) */}
          <div className="p-4 rounded-2xl bg-[#FAF1DF] border border-[#D6C5A9] space-y-2.5 text-lg">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-[#44403C] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#14532D] shrink-0" />
                <span>{t.moneyKeepAside}:</span>
              </span>
              <span className="font-mono font-extrabold text-[#1C1917]">
                {formatRupee(minimumReserve, language)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#D6C5A9]">
              <span className="font-extrabold text-[#1C1917]">
                {t.cashModalFreeToSpend}:
              </span>
              <span
                className={`font-mono font-extrabold text-xl ${
                  freeCash >= 0 ? 'text-[#14532D]' : 'text-rose-700'
                }`}
              >
                {formatRupee(freeCash, language)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-base text-[#57534E]">
            <Clock className="w-4 h-4 text-[#78716C] shrink-0" />
            <span>{extra.cashModalPassbookNote}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#FAF1DF] border-t border-[#D6C5A9] flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
            className="min-h-[48px] px-3 py-2 text-lg font-extrabold text-[#14532D] hover:underline inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>{t.changeKeepAsideBtn}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] px-5 py-2.5 bg-[#14532D] hover:bg-[#166534] text-white rounded-2xl text-lg font-extrabold cursor-pointer"
          >
            {t.doneBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
