import React, { useState } from 'react';
import {
  Plus,
  Bell,
  Menu,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  Calendar as CalendarIcon,
  Building2,
  X,
  Scan,
  Globe,
  Languages,
  Check
} from 'lucide-react';
import { BusinessProfile } from '../types/cashflow';
import { formatINR } from '../utils/forecastEngine';

interface HeaderProps {
  business: BusinessProfile;
  businessList: BusinessProfile[];
  onSelectBusiness: (business: BusinessProfile) => void;
  onOpenAddModal: () => void;
  onOpenScanModal?: () => void;
  onToggleMobileMenu: () => void;
  cashStatus: 'normal' | 'warning' | 'deficit';
  riskDate?: string;
  shortfallAmount?: number;
  availableCash: number;
  language?: 'en' | 'kn';
  onLanguageChange?: (lang: 'en' | 'kn') => void;
  onOpenRiskAlert?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  business,
  businessList,
  onSelectBusiness,
  onOpenAddModal,
  onOpenScanModal,
  onToggleMobileMenu,
  cashStatus,
  riskDate = 'Oct 29',
  shortfallAmount = 10000,
  availableCash,
  language = 'en',
  onLanguageChange,
  onOpenRiskAlert,
}) => {
  const [showBusinessDropdown, setShowBusinessDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  const greeting = language === 'kn' ? 'ಶುಭೋದಯ,' : 'Good morning,';
  const subtitle =
    language === 'kn'
      ? 'ನಿಮ್ಮ ವ್ಯಾಪಾರವನ್ನು ಆರ್ಥಿಕವಾಗಿ ಬಲಿಷ್ಠವಾಗಿಡೋಣ.'
      : "Let's keep your business financially strong.";

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Left Section: Mobile Menu Button + Business Title & Subtitle */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleMobileMenu}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="relative">
            <span className="text-xs text-slate-500 font-medium block leading-none">
              {greeting}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <button
                onClick={() => setShowBusinessDropdown(!showBusinessDropdown)}
                className="inline-flex items-center gap-1.5 text-lg sm:text-xl font-bold text-slate-900 hover:text-teal-700 transition-colors cursor-pointer group"
              >
                <span className="truncate max-w-[160px] sm:max-w-xs">{business.name}</span>
                <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-transform" />
              </button>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block mt-0.5">
              {subtitle}
            </p>

            {/* Business Switcher Dropdown */}
            {showBusinessDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowBusinessDropdown(false)}
                />
                <div className="absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Select Operating Business
                  </div>
                  {businessList.map((b) => (
                    <button
                      key={b.gstin}
                      onClick={() => {
                        onSelectBusiness(b);
                        setShowBusinessDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-start gap-2.5 hover:bg-slate-50 transition-colors ${
                        b.gstin === business.gstin
                          ? 'bg-teal-50 text-teal-900 font-semibold'
                          : 'text-slate-700'
                      }`}
                    >
                      <Building2 className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate">{b.name}</div>
                        <div className="text-[10px] text-slate-500 font-normal truncate">
                          {b.businessType} · {b.city}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Section: Date, Risk Pill, Notifications, Language, Profile Avatar */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Current Date Button/Pill matching screenshot: [ 📅 Sat, 24 Oct 2026 ] */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs">
            <CalendarIcon className="w-4 h-4 text-teal-600" />
            <span>Sat, 24 Oct 2026</span>
          </div>

          {/* Risk Pill matching screenshot: [ ⚠ Risk: Deficit on Oct 29 (₹10,000) ] */}
          <button
            onClick={onOpenRiskAlert}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50/70 hover:bg-rose-100/80 text-rose-700 text-xs font-semibold transition-all cursor-pointer shadow-2xs group"
            title="Click to view detailed shortfall cause and remedy simulator"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 animate-pulse" />
            <span className="whitespace-nowrap">
              Risk: Deficit on {riskDate} ({formatINR(shortfallAmount)})
            </span>
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
            </button>

            {/* Notification Popover */}
            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3.5 z-50 animate-in fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-900">
                      Financial Alerts & Actions
                    </span>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="py-2 space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-rose-50/80 border border-rose-200/70 text-rose-950">
                      <div className="font-bold flex items-center justify-between">
                        <span>Timing Deficit on Oct 29</span>
                        <span className="text-[10px] text-rose-700 font-mono font-bold">-₹10,000</span>
                      </div>
                      <p className="mt-1 text-[11px] text-rose-800 leading-snug">
                        ₹40,000 to Malnad Agro debits before Sri Balaji's ₹20,000 settles.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/70 text-amber-950">
                      <div className="font-bold flex items-center justify-between">
                        <span>Overdue Invoice #INV-402</span>
                        <span className="text-[10px] text-amber-700 font-mono font-bold">4d Late</span>
                      </div>
                      <p className="mt-1 text-[11px] text-amber-800 leading-snug">
                        Royal Kirana Stores owes ₹15,000 since Oct 20. Direct reminder ready.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Language Switcher Dropdown [ 🌐 | EN ▾ ] matching screenshot */}
          {onLanguageChange && (
            <div className="relative">
              <button
                onClick={() => setShowLangDropdown(!showLangDropdown)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 text-teal-600" />
                <span>{language === 'kn' ? 'KN' : 'EN'}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showLangDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowLangDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 text-xs animate-in fade-in">
                    <button
                      onClick={() => {
                        onLanguageChange('en');
                        setShowLangDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-50 ${
                        language === 'en' ? 'text-teal-700 font-bold' : 'text-slate-700'
                      }`}
                    >
                      <span>English</span>
                      {language === 'en' && <Check className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => {
                        onLanguageChange('kn');
                        setShowLangDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-50 ${
                        language === 'kn' ? 'text-teal-700 font-bold' : 'text-slate-700'
                      }`}
                    >
                      <span>ಕನ್ನಡ</span>
                      {language === 'kn' && <Check className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Profile Circle Avatar 'S' matching screenshot */}
          <div
            className="w-8 h-8 rounded-full bg-[#0D9488] text-white flex items-center justify-center font-bold text-sm shadow-xs cursor-pointer"
            title={`${business.name} (Active Business)`}
          >
            S
          </div>

          {/* Quick Action: Add Transaction */}
          <button
            onClick={onOpenAddModal}
            className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-teal-400" />
            <span>{language === 'kn' ? 'ನಮೂದು ಸೇರಿಸಿ' : 'Add Transaction'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
