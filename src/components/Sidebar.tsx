import React, { useState } from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  SlidersHorizontal,
  FileBarChart,
  Settings,
  HelpCircle,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  Menu,
  X,
  Users,
  FileCheck,
  Globe,
  Languages,
  Scale
} from 'lucide-react';
import { BusinessProfile } from '../types/cashflow';

export type NavTab =
  | 'notices'
  | 'overview'
  | 'forecast'
  | 'intelligence'
  | 'receivables'
  | 'payables'
  | 'simulator'
  | 'accuracy'
  | 'reports';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  business: BusinessProfile;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  avatarSrc?: string;
  language?: 'en' | 'kn';
  onLanguageChange?: (lang: 'en' | 'kn') => void;
  openNoticesCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  business,
  onOpenSettings,
  onOpenHelp,
  isMobileOpen,
  onCloseMobile,
  avatarSrc,
  language = 'en',
  onLanguageChange,
  openNoticesCount = 3,
}) => {
  const [showLangMenu, setShowLangMenu] = useState(false);

  const navItems = [
    {
      id: 'notices' as NavTab,
      label: language === 'kn' ? 'ನೋಟಿಸ್‌ಗಳು (Notices)' : 'Notices',
      icon: Scale,
      badge: openNoticesCount > 0 ? `${openNoticesCount} Open` : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-200 border border-rose-400/30',
    },
    {
      id: 'overview' as NavTab,
      label: language === 'kn' ? 'ಮುಖ್ಯ ನೋಟ' : 'Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'forecast' as NavTab,
      label: language === 'kn' ? 'ನಗದು ಮುನ್ಸೂಚನೆ' : 'Cash Forecast',
      icon: TrendingUp,
    },
    {
      id: 'intelligence' as NavTab,
      label: language === 'kn' ? 'ಗ್ರಾಹಕರ ಬುದ್ಧಿಮತ್ತೆ' : 'Customer Intelligence',
      icon: Users,
    },
    {
      id: 'receivables' as NavTab,
      label: language === 'kn' ? 'ಬರಬೇಕಿರುವ ಹಣ' : 'Receivables',
      icon: ArrowDownLeft,
      badge: '1 Overdue',
      badgeColor: 'bg-[#FEF3C7] text-[#92400E]',
    },
    {
      id: 'payables' as NavTab,
      label: language === 'kn' ? 'ನೀಡಬೇಕಿರುವ ಹಣ' : 'Payables',
      icon: ArrowUpRight,
      badge: '1 Risk',
      badgeColor: 'bg-[#FED7AA] text-[#9A3412]',
    },
    {
      id: 'simulator' as NavTab,
      label: language === 'kn' ? 'ವಾಟ್-ಇಫ್ ಸಿಮ್ಯುಲೇಟರ್' : 'What-if Simulator',
      icon: SlidersHorizontal,
    },
    {
      id: 'accuracy' as NavTab,
      label: language === 'kn' ? 'ನಿಖರತೆ ಟ್ರ್ಯಾಕರ್' : 'Accuracy Tracker',
      icon: FileCheck,
    },
    {
      id: 'reports' as NavTab,
      label: language === 'kn' ? 'ವರದಿಗಳು ಮತ್ತು ಆಡಿಟ್' : 'Reports & Audit',
      icon: FileBarChart,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container: Dark Navy Theme matching reference */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-[#0B1528] text-slate-300 z-50 flex flex-col border-r border-[#15233D] transition-transform duration-200 ease-in-out select-none ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-[#172744] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0D9488] flex items-center justify-center text-white shadow-sm font-bold text-base tracking-tight shrink-0">
              ₹
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white block leading-tight">
                RupiVanta
              </span>
              <span className="block text-[9px] font-semibold text-slate-400 uppercase tracking-widest leading-none mt-0.5">
                CASH COMMAND CENTER
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onCloseMobile}
              className="p-1 text-slate-400 hover:text-white lg:hidden"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="hidden lg:flex items-center justify-center text-slate-500 hover:text-slate-300 p-1">
              <ChevronsLeft className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Primary Navigation */}
        <div className="flex-1 py-4 px-3 overflow-y-auto space-y-1 relative z-10">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            WORKSPACE
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#0F766E] text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-[#13223B]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-teal-200' : 'text-slate-400'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                      item.badgeColor || 'bg-slate-700 text-slate-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-6 px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            CONFIGURATION
          </div>
          <button
            onClick={() => {
              onOpenSettings();
              onCloseMobile();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-[#13223B] transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span className="truncate">
              {language === 'kn' ? 'ಸೆಟ್ಟಿಂಗ್ಸ್ & ರಿಸರ್ವ್ ಬಫರ್' : 'Settings & Reserve Buffer'}
            </span>
          </button>
        </div>

        {/* Subtle Wave SVG Background at Bottom of Sidebar */}
        <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none overflow-hidden opacity-30 z-0">
          <svg className="w-full h-full" viewBox="0 0 200 120" preserveAspectRatio="none">
            <path
              d="M0 60 C 50 100, 150 20, 200 70 L 200 120 L 0 120 Z"
              fill="#0D9488"
              opacity="0.3"
            />
            <path
              d="M0 80 C 60 40, 140 110, 200 80 L 200 120 L 0 120 Z"
              fill="#0284C7"
              opacity="0.2"
            />
          </svg>
        </div>

        {/* Bottom Profile Anchor matching screenshot */}
        <div className="p-3 border-t border-[#172744] shrink-0 bg-[#0A1324]/80 relative z-10 space-y-2">
          {/* User profile card */}
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#13223B]/80 border border-[#1E3254] shadow-xs">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={business.name}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-teal-500/50"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {business.name.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">
                {business.name}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {business.businessType}
              </p>
            </div>
          </div>

          {/* Language Selector Dropdown Button at bottom left */}
          {onLanguageChange && (
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#101B2E] border border-[#1E3254] text-[11px] font-medium text-slate-300 hover:text-white hover:bg-[#162744] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-teal-400" />
                  <span>{language === 'kn' ? 'ಕನ್ನಡ (KN)' : 'English (EN)'}</span>
                </div>
                <span className="text-[10px] text-slate-400">▾</span>
              </button>

              {showLangMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowLangMenu(false)}
                  />
                  <div className="absolute bottom-full left-0 right-0 mb-1 bg-[#101B2E] border border-[#1E3254] rounded-lg shadow-xl py-1 z-50 text-xs">
                    <button
                      onClick={() => {
                        onLanguageChange('en');
                        setShowLangMenu(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 hover:bg-[#1A2C4C] transition-colors flex items-center justify-between ${
                        language === 'en' ? 'text-teal-400 font-bold' : 'text-slate-300'
                      }`}
                    >
                      <span>English (EN)</span>
                      {language === 'en' && <span>✓</span>}
                    </button>
                    <button
                      onClick={() => {
                        onLanguageChange('kn');
                        setShowLangMenu(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 hover:bg-[#1A2C4C] transition-colors flex items-center justify-between ${
                        language === 'kn' ? 'text-teal-400 font-bold' : 'text-slate-300'
                      }`}
                    >
                      <span>ಕನ್ನಡ (Kannada)</span>
                      {language === 'kn' && <span>✓</span>}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
