import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, KeyRound, Eye, EyeOff, CheckCircle2, LogOut } from 'lucide-react';
import { AppLanguage } from '../types/munimji';
import {
  TRANSLATIONS,
  formatRupee,
  getLocalizedExtraUI
} from '../utils/translations';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  minimumReserve: number;
  onUpdateMinimumReserve: (reserve: number) => void;
  language?: AppLanguage;
  activePassword?: string;
  onUpdatePassword?: (newPassword: string) => void;
  onLogout?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  minimumReserve,
  onUpdateMinimumReserve,
  language = 'en',
  activePassword = 'Vanta@2026',
  onUpdatePassword,
  onLogout,
}) => {
  const [reserveInput, setReserveInput] = useState(minimumReserve.toString());
  const [enableTimingAlerts, setEnableTimingAlerts] = useState(true);
  const [leadDays, setLeadDays] = useState('7');

  // Password update fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);

  useEffect(() => {
    setReserveInput(minimumReserve.toString());
    setNewPassword('');
    setConfirmPassword('');
    setPwError(null);
    setPwSuccess(null);
  }, [minimumReserve, isOpen]);

  if (!isOpen) return null;

  const t = TRANSLATIONS[language];
  const extra = getLocalizedExtraUI(language);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);

    if (newPassword.trim()) {
      if (newPassword.trim().length < 4) {
        setPwError('New password must be at least 4 characters.');
        return;
      }
      if (newPassword.trim() !== confirmPassword.trim()) {
        setPwError('New password and confirmation do not match.');
        return;
      }

      const trimmed = newPassword.trim();
      try {
        await fetch('/api/auth/update-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            newPassword: trimmed,
            forceShowcaseReset: true,
          }),
        });
      } catch {
        // local fallback handled via onUpdatePassword
      }
      onUpdatePassword?.(trimmed);
      setPwSuccess('Khata password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
    }

    const val = parseFloat(reserveInput);
    if (!isNaN(val) && val >= 0) {
      onUpdateMinimumReserve(val);
    }

    if (!newPassword.trim()) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#FFFDF9] rounded-3xl shadow-2xl border-2 border-[#D6C5A9] w-full max-w-md overflow-hidden my-auto">
        <div className="px-5 py-4 border-b border-[#EADDC5] flex items-center justify-between bg-[#FAF1DF]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#14532D] text-white flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-[#1C1917]">
                {t.settingsTitle}
              </h3>
              <p className="text-sm text-[#57534E]">
                {t.settingsSubtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-[#57534E] hover:bg-white cursor-pointer"
            aria-label={t.closeBtn}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-5 text-base max-h-[80vh] overflow-y-auto">
          {/* Keep-Aside Amount */}
          <div>
            <label className="block font-extrabold text-[#1C1917] mb-1.5">
              {t.settingsKeepAsideLabel}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-[#57534E] font-extrabold text-xl">
                ₹
              </span>
              <input
                type="number"
                min="0"
                step="1000"
                value={reserveInput}
                onChange={(e) => setReserveInput(e.target.value)}
                className="w-full min-h-[50px] pl-10 pr-4 py-2 bg-white border-2 border-[#D6C5A9] rounded-2xl font-mono font-extrabold text-xl text-[#1C1917] focus:outline-none focus:border-[#14532D]"
              />
            </div>
            <p className="text-sm text-[#57534E] mt-1.5 leading-snug">
              {t.settingsKeepAsideHelp}
            </p>
          </div>

          {/* Preset Amounts */}
          <div className="flex flex-wrap gap-2">
            {[5000, 10000, 20000, 50000].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setReserveInput(preset.toString())}
                className="min-h-[40px] px-3 py-1 rounded-xl bg-[#FAF1DF] hover:bg-[#F3E5C8] border border-[#D6C5A9] text-[#1C1917] font-mono font-bold text-sm cursor-pointer"
              >
                {formatRupee(preset, language)}
              </button>
            ))}
          </div>

          {/* Alert Horizon */}
          <div className="pt-3 border-t border-[#EADDC5]">
            <label className="block font-extrabold text-[#1C1917] mb-1.5">
              {extra.settingsHorizonLabel}
            </label>
            <select
              value={leadDays}
              onChange={(e) => setLeadDays(e.target.value)}
              className="w-full min-h-[48px] px-4 py-2 bg-white border-2 border-[#D6C5A9] rounded-2xl text-base text-[#1C1917] focus:outline-none focus:border-[#14532D]"
            >
              <option value="5">{extra.settingsDaysOption(5)}</option>
              <option value="7">{extra.settingsDaysOption(7, true)}</option>
              <option value="14">{extra.settingsDaysOption(14)}</option>
              <option value="30">{extra.settingsDaysOption(30)}</option>
            </select>
          </div>

          {/* Morning Summary Toggle */}
          <label className="flex items-center justify-between gap-3 pt-2 cursor-pointer">
            <div>
              <span className="font-extrabold text-[#1C1917] block">
                {extra.settingsWhatsappTitle}
              </span>
              <span className="text-sm text-[#57534E]">
                {extra.settingsWhatsappSub}
              </span>
            </div>
            <input
              type="checkbox"
              checked={enableTimingAlerts}
              onChange={(e) => setEnableTimingAlerts(e.target.checked)}
              className="w-6 h-6 accent-[#14532D] rounded shrink-0"
            />
          </label>

          <div className="pt-4 border-t border-[#EADDC5] flex flex-wrap items-center justify-between gap-2">
            {onLogout ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="min-h-[46px] px-3.5 py-2 rounded-2xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-sm font-extrabold text-rose-800 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[46px] px-4 py-2 rounded-2xl border border-[#D6C5A9] text-base font-bold text-[#44403C] cursor-pointer"
              >
                {t.doneBtn}
              </button>
              <button
                type="submit"
                className="min-h-[46px] px-5 py-2 bg-[#14532D] hover:bg-[#166534] text-white rounded-2xl text-base font-extrabold cursor-pointer"
              >
                {t.saveChangesBtn}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
