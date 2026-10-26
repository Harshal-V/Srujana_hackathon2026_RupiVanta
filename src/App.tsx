/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Users,
  Scale,
  BookOpen,
  Globe,
  Building2,
  ChevronDown,
  Mic,
  LogOut,
  Menu,
  X,
  Check,
  RotateCcw,
  ShieldCheck,
  Database,
} from 'lucide-react';
import {
  INITIAL_BUSINESS,
  INITIAL_BUSINESS_OPTIONS,
  INITIAL_TRANSACTIONS,
  INITIAL_CUSTOMERS,
  INITIAL_ACCURACY_RECORDS,
  INITIAL_PREDICTION_OUTCOMES,
  DEMO_WORKSPACES,
  createCleanRealWorkspace,
  ANCHOR_DATE,
} from './data/initialData';
import {
  BusinessProfile,
  CustomerProfile,
  ForecastAccuracyRecord,
  PredictionOutcomeRecord,
  Transaction,
  DayForecast,
  WhatIfScenario,
} from './types/cashflow';
import { calculateCashForecast } from './utils/forecastEngine';
import {
  buildProjectedTransactionsForForecast,
  generateFinancialAdviceReport,
  predictAllReceivables,
  syncCustomersWithTransactions,
} from './utils/mlPaymentPredictor';
import { SAMPLE_NOTICES } from './data/sampleNotices';
import { LegalNotice, NoticeStatus } from './types/notices';
import {
  AppLanguage,
  TrustedPerson,
  INITIAL_PEOPLE,
} from './types/munimji';
import {
  TRANSLATIONS,
  buildNoticeExplanationSpeech,
  formatHeaderDate,
  formatIndianNumber,
  formatLocalDate,
  formatRupee,
  getLocalizedBusinessName,
  getLocalizedExtraUI,
  getPredictiveFinanceText,
} from './utils/translations';
import {
  addCalendarDays,
  computeNoticeCountdown,
} from './utils/privacyMasker';
import {
  getDashboardExtraStrings,
  localizeBusinessLabel,
} from './utils/localization';

import { RupiVantaLogo } from './components/RupiVantaLogo';
import {
  MunimjiVoiceBar,
  SupportedVoiceLanguage,
  VoiceConversationMessage,
} from './components/MunimjiVoiceBar';
import { WhatsAppNoticeModal } from './components/WhatsAppNoticeModal';
import {
  BalanceAndPaymentsTab,
  ForecastTimingMode,
} from './components/BalanceAndPaymentsTab';
import { PredictiveAdviceSection } from './components/PredictiveAdviceSection';
import { CustomerIntelligenceSection } from './components/CustomerIntelligenceSection';
import { AccuracyTrackerSection } from './components/AccuracyTrackerSection';
import { NoticesView } from './components/NoticesView';
import { HowToUseGuideTab } from './components/HowToUseGuideTab';

import { AddTransactionModal } from './components/AddTransactionModal';
import { InvoiceScannerModal } from './components/InvoiceScannerModal';
import { DateInspectionModal } from './components/DateInspectionModal';
import { WhatsAppReminderModal } from './components/WhatsAppReminderModal';
import { AuthSessionInfo, LoginPage } from './components/LoginPage';

type DashboardSection =
  | 'present_balance'
  | 'pending_payments'
  | 'upcoming_payments'
  | 'advice_simulator'
  | 'customers_accuracy'
  | 'notices'
  | 'guide';

const SUPPORTED_LANGUAGES: AppLanguage[] = ['en', 'kn', 'hi', 'ta', 'te', 'ml'];

const VOICE_BCP47_MAP: Record<SupportedVoiceLanguage, string> = {
  en: 'en-IN',
  kn: 'kn-IN',
};

function buildLocalizedVoiceWelcome(
  lang: SupportedVoiceLanguage,
  shopName: string,
  presentBalance: number
): string {
  const cashStr = formatRupee(presentBalance, lang);
  const locShop = localizeBusinessLabel(shopName, lang);
  const dateStr = formatHeaderDate(ANCHOR_DATE, lang);
  if (lang === 'kn') {
    return `ನಮಸ್ಕಾರ ${locShop}! ಇಂದು ${dateStr}. ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಬ್ಯಾಲೆನ್ಸ್ ${cashStr} ಆಗಿದೆ. ಗ್ರಾಹಕರ ಹಿಂದಿನ ಪಾವತಿ ಅಭ್ಯಾಸದ ಆಧಾರದ ಮೇಲೆ ಹಣ ಯಾವಾಗ ಬರುತ್ತದೆ ಎಂದು ತಿಳಿಯಲು, ಹೊಸ ಬಾಕಿ ಅಥವಾ ಮುಂಬರುವ ಬಿಲ್ ಸೇರಿಸಲು, ಅಥವಾ ಬ್ಯಾಲೆನ್ಸ್ ನವೀಕರಿಸಲು ನನ್ನನ್ನು ಕನ್ನಡದಲ್ಲಿ ಕೇಳಿ.`;
  }
  return `Welcome ${locShop}! Today is ${dateStr}. Your Present Balance is ${cashStr}. Ask me anything in English — I can add extra pending payments or bills, record customer payments, update your cash balance, or explain your 7, 30 & 90-day cash outlook in simple words.`;
}

function normalizeStoredSession(raw: any): AuthSessionInfo | null {
  if (!raw || typeof raw !== 'object') return null;
  if (typeof raw.workspaceId === 'string' && raw.workspaceId.trim()) {
    return {
      workspaceId: raw.workspaceId.trim(),
      isDemo: Boolean(raw.isDemo ?? raw.workspaceId.startsWith('demo-')),
      phone: raw.phone ? String(raw.phone) : undefined,
      shopName: String(raw.shopName || 'Sharma Stores [Demo]'),
    };
  }
  if (raw.shopName) {
    return {
      workspaceId: 'demo-sharma',
      isDemo: true,
      phone: raw.phone ? String(raw.phone) : undefined,
      shopName: String(raw.shopName),
    };
  }
  return null;
}

export default function App() {
  // 0. Authentication & Workspace Partition State (Demo vs Real Strictly Separated)
  const [authSession, setAuthSession] = useState<AuthSessionInfo | null>(() => {
    try {
      const savedV2 = localStorage.getItem('rupivanta_auth_session_v2');
      if (savedV2) return normalizeStoredSession(JSON.parse(savedV2));
      const savedV1 = localStorage.getItem('rupivanta_auth_session_v1');
      if (savedV1) return normalizeStoredSession(JSON.parse(savedV1));
      return null;
    } catch {
      return null;
    }
  });

  const activeWorkspaceId = authSession?.workspaceId || 'demo-sharma';
  const isDemoWorkspace = authSession
    ? authSession.isDemo
    : activeWorkspaceId.startsWith('demo-');

  // 1. Workspace Ledger State
  const [business, setBusiness] = useState<BusinessProfile>(INITIAL_BUSINESS);
  const [businessList] = useState<BusinessProfile[]>(INITIAL_BUSINESS_OPTIONS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [customers, setCustomers] = useState<CustomerProfile[]>(INITIAL_CUSTOMERS);
  const [predictionOutcomes, setPredictionOutcomes] = useState<PredictionOutcomeRecord[]>(
    INITIAL_PREDICTION_OUTCOMES
  );
  const [accuracyRecords, setAccuracyRecords] = useState<ForecastAccuracyRecord[]>(
    INITIAL_ACCURACY_RECORDS
  );
  const [minimumReserve, setMinimumReserve] = useState<number>(
    INITIAL_BUSINESS.minimumReserve
  );

  // 2. Legal Notices State
  const [notices, setNotices] = useState<LegalNotice[]>(SAMPLE_NOTICES);
  const [selectedNoticeId, setSelectedNoticeId] = useState<string>(
    SAMPLE_NOTICES[0]?.id || ''
  );

  // 3. Dashboard Language (All 6 Supported: en, kn, hi, ta, te, ml)
  const [language, setLanguage] = useState<AppLanguage>(() => {
    const saved = localStorage.getItem('rupivanta_lang') as AppLanguage | null;
    if (saved && SUPPORTED_LANGUAGES.includes(saved)) return saved;
    return 'en';
  });

  // 3B. Voice Assistant Language (Strictly Limited to English & Kannada ONLY)
  const [voiceLanguage, setVoiceLanguage] = useState<SupportedVoiceLanguage>(() => {
    const saved = localStorage.getItem('rupivanta_voice_lang');
    return saved === 'kn' ? 'kn' : 'en';
  });

  // 4. Trusted Contacts (for Legal Notice WhatsApp sharing ONLY — never used for customer payment reminders)
  const [people, setPeople] = useState<TrustedPerson[]>(INITIAL_PEOPLE);

  // 5. Three-Line (☰) Menu, Forecast Mode & What-If Scenario State
  const [activeSection, setActiveSection] = useState<DashboardSection>('present_balance');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [showBusinessMenu, setShowBusinessMenu] = useState(false);
  const [timeframe, setTimeframe] = useState<7 | 30 | 90>(30);
  const [forecastTimingMode, setForecastTimingMode] =
    useState<ForecastTimingMode>('ml_predicted');
  const [activeScenario, setActiveScenario] = useState<WhatIfScenario | null>(null);
  const [appliedRemedy, setAppliedRemedy] = useState<string | null>(null);

  // 6. Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalPreloadDate, setAddModalPreloadDate] = useState<string | undefined>();
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [selectedDateDay, setSelectedDateDay] = useState<DayForecast | null>(null);
  const [followUpCustomer, setFollowUpCustomer] = useState<Transaction | null>(null);
  const [waNoticeModalOpen, setWaNoticeModalOpen] = useState(false);
  const [waTargetNotice, setWaTargetNotice] = useState<LegalNotice | null>(null);
  const [waTargetPersonId, setWaTargetPersonId] = useState<string | undefined>(undefined);

  // 7. VANTA Voice Assistant Popup State — Pops up immediately after login with English / Kannada choice
  const [isVoiceBarOpen, setIsVoiceBarOpen] = useState<boolean>(true);
  const [voiceStep, setVoiceStep] = useState<'choose_language' | 'converse'>('choose_language');
  const [conversationMessages, setConversationMessages] = useState<VoiceConversationMessage[]>([]);
  const [lastSpokenText, setLastSpokenText] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isProcessingCommand, setIsProcessingCommand] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceFallbackNotice, setVoiceFallbackNotice] = useState<string | null>(null);

  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const speechRecognitionSupported =
    typeof window !== 'undefined' &&
    Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = TRANSLATIONS[language].appFullTitle;
      document.documentElement.lang = language;
    }
  }, [language]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      const handleVoices = () => window.speechSynthesis.getVoices();
      window.speechSynthesis.addEventListener?.('voiceschanged', handleVoices);
      return () => window.speechSynthesis.removeEventListener?.('voiceschanged', handleVoices);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen]);

  const applyServerWorkspacePayload = useCallback((payload: any) => {
    if (!payload) return;
    if (payload.business && typeof payload.business.currentCash === 'number') {
      setBusiness(payload.business);
      if (typeof payload.business.minimumReserve === 'number') {
        setMinimumReserve(payload.business.minimumReserve);
      }
    }
    if (Array.isArray(payload.transactions)) {
      setTransactions(payload.transactions);
    }
    if (Array.isArray(payload.customers)) {
      setCustomers(payload.customers);
    }
    if (Array.isArray(payload.predictionOutcomes)) {
      setPredictionOutcomes(payload.predictionOutcomes);
    }
    if (Array.isArray(payload.accuracyRecords)) {
      setAccuracyRecords(payload.accuracyRecords);
    }
    if (Array.isArray(payload.notices)) {
      setNotices(payload.notices);
      if (payload.notices.length > 0) {
        setSelectedNoticeId((prev) =>
          payload.notices.some((n: LegalNotice) => n.id === prev)
            ? prev
            : payload.notices[0].id
        );
      }
    }
    if (Array.isArray(payload.people) && payload.people.length > 0) {
      setPeople(payload.people);
    }
  }, []);

  const refreshServerData = useCallback(
    async (wsIdOverride?: string, shopHint?: string, phoneHint?: string) => {
      const targetWs = wsIdOverride || activeWorkspaceId;
      const query = new URLSearchParams({ workspaceId: targetWs });
      if (shopHint || authSession?.shopName) {
        query.set('shopName', shopHint || authSession?.shopName || '');
      }
      if (phoneHint || authSession?.phone) {
        query.set('phone', phoneHint || authSession?.phone || '');
      }

      try {
        const res = await fetch(`/api/data?${query.toString()}`);
        const resData = await res.json();
        if (resData?.success && resData.data) {
          applyServerWorkspacePayload(resData.data);
          return;
        }
      } catch {
        // Fallback if offline: strictly respect demo vs real partition
        if (targetWs.startsWith('demo-')) {
          const demo = DEMO_WORKSPACES[targetWs] || DEMO_WORKSPACES['demo-sharma'];
          setBusiness(demo.business);
          setMinimumReserve(demo.business.minimumReserve);
          setTransactions(demo.transactions);
          setCustomers(demo.customers);
          setPredictionOutcomes(demo.predictionOutcomes);
          setAccuracyRecords(demo.accuracyRecords);
        } else {
          const cleanReal = createCleanRealWorkspace(
            targetWs,
            shopHint || authSession?.shopName || 'My Business',
            phoneHint || authSession?.phone
          );
          setBusiness(cleanReal.business);
          setMinimumReserve(cleanReal.business.minimumReserve);
          setTransactions([]);
          setCustomers([]);
          setPredictionOutcomes([]);
          setAccuracyRecords([]);
          setNotices([]);
        }
      }
    },
    [activeWorkspaceId, authSession?.phone, authSession?.shopName, applyServerWorkspacePayload]
  );

  useEffect(() => {
    if (authSession) {
      refreshServerData(authSession.workspaceId, authSession.shopName, authSession.phone);
    }
  }, [authSession, refreshServerData]);

  // =========================================================================
  // SPEECH SYNTHESIS ENGINE (Strictly English & Kannada for Voice Assistant)
  // =========================================================================
  const stopSpeech = useCallback(() => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
  }, []);

  const stopAllVoiceActivity = useCallback(() => {
    stopSpeech();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
    setInterimTranscript('');
  }, [stopSpeech]);

  const speakWithMunimji = useCallback(
    async (text: string, langOverride?: AppLanguage) => {
      if (!text) return;
      const requested = langOverride || voiceLanguage;
      const safeVoiceLang: SupportedVoiceLanguage = requested === 'kn' ? 'kn' : 'en';
      const tTarget = TRANSLATIONS[safeVoiceLang];

      stopSpeech();
      setLastSpokenText(text);
      setVoiceFallbackNotice(null);

      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        setVoiceFallbackNotice(tTarget.speechUnsupportedNote);
        return;
      }

      const voices = window.speechSynthesis.getVoices();
      const targetBcp47 = VOICE_BCP47_MAP[safeVoiceLang];
      const directVoice =
        voices.find((v) => v.lang.toLowerCase() === targetBcp47.toLowerCase()) ||
        voices.find((v) => v.lang.toLowerCase().startsWith(safeVoiceLang));

      if (!directVoice && safeVoiceLang === 'kn') {
        try {
          const ttsRes = await fetch('/api/speech/synthesize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, language: 'kn' }),
          });
          const ttsJson = await ttsRes.json().catch(() => ({}));
          if (ttsJson?.available && ttsJson?.audioData) {
            const audio = new Audio(`data:audio/wav;base64,${ttsJson.audioData}`);
            audioPlayerRef.current = audio;
            setIsSpeaking(true);
            setIsPaused(false);
            audio.onended = () => {
              setIsSpeaking(false);
              setIsPaused(false);
            };
            audio.onerror = () => {
              setIsSpeaking(false);
              setIsPaused(false);
            };
            await audio.play();
            return;
          }
        } catch {
          // fallback to browser speechSynthesis
        }
      }

      const utter = new SpeechSynthesisUtterance(text);
      if (directVoice) {
        utter.voice = directVoice;
      }
      utter.lang = targetBcp47;
      utter.rate = 0.96;
      utter.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };
      utter.onerror = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };
      setIsSpeaking(true);
      setIsPaused(false);
      window.speechSynthesis.speak(utter);
    },
    [voiceLanguage, stopSpeech]
  );

  const handlePauseResumeSpeech = () => {
    if (audioPlayerRef.current) {
      if (isPaused) {
        audioPlayerRef.current.play().catch(() => {});
        setIsPaused(false);
      } else {
        audioPlayerRef.current.pause();
        setIsPaused(true);
      }
      return;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (isPaused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      } else if (isSpeaking) {
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
    }
  };

  // =========================================================================
  // AUTHENTICATION, WORKSPACE SWITCHING & VOICE LANGUAGE HANDLERS
  // =========================================================================
  const handleLoginSuccess = useCallback(
    async (session: AuthSessionInfo) => {
      setAuthSession(session);
      localStorage.setItem('rupivanta_auth_session_v2', JSON.stringify(session));
      setActiveSection('present_balance');
      setActiveScenario(null);
      setAppliedRemedy(null);
      setConversationMessages([]);
      setVoiceStep('choose_language');
      setIsVoiceBarOpen(true);
      await refreshServerData(session.workspaceId, session.shopName, session.phone);
    },
    [refreshServerData]
  );

  const handleSwitchWorkspace = useCallback(
    async (nextSession: AuthSessionInfo) => {
      stopAllVoiceActivity();
      setAuthSession(nextSession);
      localStorage.setItem('rupivanta_auth_session_v2', JSON.stringify(nextSession));
      setActiveScenario(null);
      setAppliedRemedy(null);
      setShowBusinessMenu(false);
      await refreshServerData(
        nextSession.workspaceId,
        nextSession.shopName,
        nextSession.phone
      );
    },
    [refreshServerData, stopAllVoiceActivity]
  );

  const handleResetDemoWorkspace = useCallback(async () => {
    if (!isDemoWorkspace) return;
    try {
      const res = await fetch('/api/workspaces/reset-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: activeWorkspaceId }),
      });
      const json = await res.json();
      if (json?.success && json.data) {
        applyServerWorkspacePayload(json.data);
        setActiveScenario(null);
        setAppliedRemedy(null);
      }
    } catch {
      // ignore
    }
  }, [activeWorkspaceId, isDemoWorkspace, applyServerWorkspacePayload]);

  const handleSelectVoiceLanguage = useCallback(
    (chosenLang: SupportedVoiceLanguage) => {
      setVoiceLanguage(chosenLang);
      localStorage.setItem('rupivanta_voice_lang', chosenLang);
      // If dashboard was in English or Kannada, keep it in sync; if user picked Tamil/Telugu/Malayalam/Hindi on dashboard, preserve their dashboard language!
      if (language === 'en' || language === 'kn') {
        setLanguage(chosenLang);
        localStorage.setItem('rupivanta_lang', chosenLang);
      }
      setVoiceFallbackNotice(null);
      setVoiceStep('converse');

      const shopLabel = business.name || authSession?.shopName || 'Shop';
      const welcomeText = buildLocalizedVoiceWelcome(
        chosenLang,
        shopLabel,
        business.currentCash
      );

      setConversationMessages((prev) => [
        ...prev,
        {
          id: `msg-welcome-${Date.now()}`,
          role: 'assistant',
          text: welcomeText,
        },
      ]);
      speakWithMunimji(welcomeText, chosenLang);
    },
    [authSession?.shopName, business.currentCash, business.name, language, speakWithMunimji]
  );

  const handleLogout = useCallback(() => {
    stopAllVoiceActivity();
    setAuthSession(null);
    localStorage.removeItem('rupivanta_auth_session_v2');
    localStorage.removeItem('rupivanta_auth_session_v1');
  }, [stopAllVoiceActivity]);

  const handleLanguageChange = (newLang: AppLanguage) => {
    setLanguage(newLang);
    localStorage.setItem('rupivanta_lang', newLang);
    if (newLang === 'en' || newLang === 'kn') {
      setVoiceLanguage(newLang);
      localStorage.setItem('rupivanta_voice_lang', newLang);
    }
    setVoiceFallbackNotice(null);
  };

  // =========================================================================
  // LIVE ML PAYMENT PREDICTION, CUSTOMER SYNC & 7/30/90 CASH FORECASTS
  // =========================================================================
  const openNoticesSorted = useMemo(() => {
    return notices
      .filter((n) => n.status !== 'Closed')
      .sort((a, b) => a.deadlineDate.localeCompare(b.deadlineDate));
  }, [notices]);

  const noticeObligationTransactions = useMemo<Transaction[]>(() => {
    return notices
      .filter((n) => n.amountDemanded > 0 && n.status !== 'Closed' && n.linkedToCashflow)
      .map((n) => ({
        id: `tx-notice-${n.id}`,
        type: 'outflow',
        title: `Notice: ${n.title}`,
        partyName: n.authorityName,
        amount: n.amountDemanded,
        invoiceDate: n.issueDate,
        dueDate: n.deadlineDate,
        status: n.severity === 'Urgent' ? 'due_soon' : 'expected',
        category: 'taxes',
        invoiceNumber: n.referenceNumber,
        notes: `${n.severity} — ${n.lawSection}`,
        isDemoData: isDemoWorkspace,
      }));
  }, [notices, isDemoWorkspace]);

  const syncedState = useMemo(() => {
    const manualOnly = transactions.filter((tx) => !tx.id.startsWith('tx-notice-'));
    return syncCustomersWithTransactions(
      customers,
      manualOnly,
      ANCHOR_DATE,
      isDemoWorkspace
    );
  }, [customers, transactions, isDemoWorkspace]);

  const allTransactions = useMemo<Transaction[]>(() => {
    return [...syncedState.transactions, ...noticeObligationTransactions];
  }, [syncedState.transactions, noticeObligationTransactions]);

  const mlPredictionBundle = useMemo(() => {
    return predictAllReceivables(allTransactions, syncedState.customers, ANCHOR_DATE);
  }, [allTransactions, syncedState.customers]);

  const projectedTransactions = useMemo(() => {
    return buildProjectedTransactionsForForecast(
      allTransactions,
      mlPredictionBundle.predictionsByTxId,
      forecastTimingMode,
      ANCHOR_DATE
    );
  }, [allTransactions, mlPredictionBundle.predictionsByTxId, forecastTimingMode]);

  const contractualComparisonTransactions = useMemo(() => {
    return buildProjectedTransactionsForForecast(
      allTransactions,
      mlPredictionBundle.predictionsByTxId,
      'contractual_due',
      ANCHOR_DATE
    );
  }, [allTransactions, mlPredictionBundle.predictionsByTxId]);

  const baselineForecastML = useMemo(() => {
    const mlTxs = buildProjectedTransactionsForForecast(
      allTransactions,
      mlPredictionBundle.predictionsByTxId,
      'ml_predicted',
      ANCHOR_DATE
    );
    return calculateCashForecast(
      business.currentCash,
      minimumReserve,
      mlTxs,
      ANCHOR_DATE,
      90,
      null
    );
  }, [
    business.currentCash,
    minimumReserve,
    allTransactions,
    mlPredictionBundle.predictionsByTxId,
  ]);

  const activeForecast = useMemo(() => {
    return calculateCashForecast(
      business.currentCash,
      minimumReserve,
      projectedTransactions,
      ANCHOR_DATE,
      90,
      activeScenario
    );
  }, [business.currentCash, minimumReserve, projectedTransactions, activeScenario]);

  const comparisonForecast = useMemo(() => {
    if (forecastTimingMode === 'contractual_due' && !activeScenario) return null;
    return calculateCashForecast(
      business.currentCash,
      minimumReserve,
      contractualComparisonTransactions,
      ANCHOR_DATE,
      90,
      null
    );
  }, [
    business.currentCash,
    minimumReserve,
    contractualComparisonTransactions,
    forecastTimingMode,
    activeScenario,
  ]);

  const adviceReport = useMemo(() => {
    return generateFinancialAdviceReport(
      business.currentCash,
      minimumReserve,
      allTransactions,
      syncedState.customers,
      predictionOutcomes,
      ANCHOR_DATE,
      activeScenario
    );
  }, [
    business.currentCash,
    minimumReserve,
    allTransactions,
    syncedState.customers,
    predictionOutcomes,
    activeScenario,
  ]);

  const hasShortfall = Boolean(
    activeForecast.lowestBalance < minimumReserve ||
      (activeForecast.nextRisk && activeForecast.nextRisk.shortfallAmount > 0)
  );
  const shortfallDateStr =
    activeForecast.nextRisk?.riskDate || activeForecast.lowestBalanceDate || ANCHOR_DATE;
  const shortfallAmount =
    activeForecast.lowestBalance < 0
      ? Math.abs(activeForecast.lowestBalance)
      : Math.max(0, minimumReserve - activeForecast.lowestBalance);

  const pendingPayments = useMemo(
    () => allTransactions.filter((tx) => tx.type === 'inflow' && tx.status !== 'paid'),
    [allTransactions]
  );
  const upcomingPayments = useMemo(
    () => allTransactions.filter((tx) => tx.type === 'outflow' && tx.status !== 'paid'),
    [allTransactions]
  );

  const totalPendingSum = useMemo(
    () =>
      pendingPayments.reduce(
        (sum, tx) => sum + Math.max(0, tx.amount - (tx.paidAmount || 0)),
        0
      ),
    [pendingPayments]
  );
  const totalUpcomingSum = useMemo(
    () =>
      upcomingPayments.reduce(
        (sum, tx) => sum + Math.max(0, tx.amount - (tx.paidAmount || 0)),
        0
      ),
    [upcomingPayments]
  );

  // =========================================================================
  // VANTA LIVE VOICE & TEXT COMMAND EXECUTION (ENGLISH & KANNADA ONLY)
  // =========================================================================
  const handleRunCommand = useCallback(
    async (rawInput: string) => {
      const cleaned = rawInput.trim();
      if (!cleaned) return;

      setInterimTranscript('');
      setIsVoiceBarOpen(true);
      setVoiceStep('converse');
      setIsProcessingCommand(true);

      const priorHistory = conversationMessages.slice(-10).map((m) => ({
        role: m.role,
        text: m.text,
      }));

      setConversationMessages((prev) => [
        ...prev,
        {
          id: `msg-user-${Date.now()}`,
          role: 'user',
          text: cleaned,
        },
      ]);

      const extra = getLocalizedExtraUI(voiceLanguage);

      try {
        const res = await fetch('/api/vanta/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: cleaned,
            language: voiceLanguage,
            workspaceId: activeWorkspaceId,
            shopName: business.name,
            history: priorHistory,
            context: {
              currentCash: business.currentCash,
              minimumReserve,
              lowestBalance: activeForecast.lowestBalance,
              shortfallDate: shortfallDateStr,
            },
          }),
        });
        const data = await res.json();

        let ledgerSummary: string | undefined;
        if (data?.toolExecuted) {
          await refreshServerData(activeWorkspaceId);
          ledgerSummary =
            data.proposedAction?.title ||
            data.toolResult?.message ||
            undefined;

          if (data.toolExecuted === 'prepare_whatsapp_reminder') {
            const targetId = data?.toolResult?.data?.openReminderTxId;
            if (targetId) {
              const foundTx = allTransactions.find((tx) => tx.id === targetId);
              if (foundTx) {
                setFollowUpCustomer(foundTx);
              }
            }
            setActiveSection('pending_payments');
          } else if (data.toolExecuted === 'add_customer_receivable') {
            setActiveSection('pending_payments');
          } else if (data.toolExecuted === 'add_upcoming_payment') {
            setActiveSection('upcoming_payments');
          } else if (data.toolExecuted === 'update_customer_profile') {
            setActiveSection('customers_accuracy');
          } else if (data.toolExecuted === 'settle_or_partial_payment') {
            setActiveSection('pending_payments');
          } else {
            setActiveSection('present_balance');
          }
        }

        const replyText = data?.reply || extra.voiceOfflineFallback;
        setConversationMessages((prev) => [
          ...prev,
          {
            id: `msg-assistant-${Date.now()}`,
            role: 'assistant',
            text: replyText,
            ledgerSummary,
          },
        ]);

        speakWithMunimji(replyText, voiceLanguage);
      } catch {
        setConversationMessages((prev) => [
          ...prev,
          {
            id: `msg-err-${Date.now()}`,
            role: 'assistant',
            text: extra.voiceOfflineFallback,
          },
        ]);
        speakWithMunimji(extra.voiceOfflineFallback, voiceLanguage);
      } finally {
        setIsProcessingCommand(false);
      }
    },
    [
      conversationMessages,
      allTransactions,
      voiceLanguage,
      activeWorkspaceId,
      business.name,
      business.currentCash,
      minimumReserve,
      activeForecast.lowestBalance,
      shortfallDateStr,
      refreshServerData,
      speakWithMunimji,
    ]
  );

  const toggleMediaRecorderFallback = async () => {
    if (isListening && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) audioChunksRef.current.push(ev.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        if (audioBlob.size < 200) return;

        setIsProcessingCommand(true);
        try {
          const reader = new FileReader();
          const base64Audio = await new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(String(reader.result || ''));
            reader.readAsDataURL(audioBlob);
          });

          const res = await fetch('/api/speech/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioBase64: base64Audio,
              mimeType: recorder.mimeType || 'audio/webm',
              language: voiceLanguage,
            }),
          });
          const data = await res.json();
          if (data?.transcript) {
            await handleRunCommand(data.transcript);
          } else {
            setVoiceFallbackNotice(
              'Could not hear clearly. Please speak again in English or ಕನ್ನಡ, or type below.'
            );
          }
        } catch {
          setVoiceFallbackNotice('Voice capture interrupted. Please try again or type below.');
        } finally {
          setIsProcessingCommand(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsListening(true);
      setVoiceFallbackNotice(null);
    } catch {
      setVoiceFallbackNotice(TRANSLATIONS[voiceLanguage].micUnsupportedNote);
      setIsListening(false);
    }
  };

  const handleToggleMic = () => {
    setIsVoiceBarOpen(true);
    stopSpeech();

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toggleMediaRecorderFallback();
      return;
    }

    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = VOICE_BCP47_MAP[voiceLanguage];

      let latestTranscript = '';

      rec.onresult = (event: any) => {
        let combined = '';
        let hasFinal = false;
        for (let i = event.resultIndex; i < event.results.length; i++) {
          combined += event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            hasFinal = true;
          }
        }
        latestTranscript = combined.trim();
        setInterimTranscript(latestTranscript);

        if (hasFinal && latestTranscript) {
          setIsListening(false);
          setInterimTranscript('');
          handleRunCommand(latestTranscript);
        }
      };

      rec.onerror = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      rec.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      recognitionRef.current = rec;
      rec.start();
      setIsListening(true);
      setVoiceFallbackNotice(null);
    } catch {
      toggleMediaRecorderFallback();
    }
  };

  // =========================================================================
  // WORKSPACE-SCOPED LEDGER, CUSTOMER, REMEDY & NOTICE HANDLERS
  // =========================================================================
  const persistNotices = (newNoticeList: LegalNotice[]) => {
    setNotices(newNoticeList);
    fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId: activeWorkspaceId, notices: newNoticeList }),
    }).catch(() => {});
  };

  const handleUpdateBalance = async (newCash: number, newReserve: number) => {
    const updatedBiz = { ...business, currentCash: newCash, minimumReserve: newReserve };
    setBusiness(updatedBiz);
    setMinimumReserve(newReserve);

    try {
      const res = await fetch('/api/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: activeWorkspaceId,
          currentCash: newCash,
          minimumReserve: newReserve,
        }),
      });
      const json = await res.json();
      if (json?.success && json.data) {
        applyServerWorkspacePayload(json.data);
      }
    } catch {
      // optimistic state retained
    }
  };

  const handleAddTransaction = async (newTxData: Omit<Transaction, 'id'>) => {
    const tempTx: Transaction = {
      ...newTxData,
      id: `tx-${Date.now()}`,
      isDemoData: isDemoWorkspace,
    };
    setTransactions((prev) => [tempTx, ...prev]);

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: activeWorkspaceId,
          transaction: tempTx,
        }),
      });
      const json = await res.json();
      if (json?.success && json.data) {
        applyServerWorkspacePayload(json.data);
      }
    } catch {
      // optimistic state retained
    }
  };

  const handleEditTransaction = async (id: string, updates: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev.map((tx) => (tx.id === id ? { ...tx, ...updates } : tx))
    );

    try {
      const res = await fetch(`/api/transactions/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updates,
          workspaceId: activeWorkspaceId,
        }),
      });
      const json = await res.json();
      if (json?.success && json.data) {
        applyServerWorkspacePayload(json.data);
      }
    } catch {
      // optimistic state retained
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));

    try {
      const res = await fetch(
        `/api/transactions/${encodeURIComponent(id)}?workspaceId=${encodeURIComponent(
          activeWorkspaceId
        )}`,
        { method: 'DELETE' }
      );
      const json = await res.json();
      if (json?.success && json.data) {
        applyServerWorkspacePayload(json.data);
      }
    } catch {
      // optimistic state retained
    }
  };

  const handleSettleTransaction = async (
    id: string,
    options?: { actualPaidDate?: string; partialAmount?: number }
  ) => {
    if (id.startsWith('tx-notice-')) {
      const targetNoticeId = id.replace('tx-notice-', '');
      const notice = notices.find((n) => n.id === targetNoticeId);
      const updatedNotices = notices.map((n) =>
        n.id === targetNoticeId ? { ...n, status: 'Closed' as NoticeStatus } : n
      );
      persistNotices(updatedNotices);
      if (notice && notice.amountDemanded > 0) {
        await handleUpdateBalance(
          Math.max(0, business.currentCash - notice.amountDemanded),
          minimumReserve
        );
      }
      return;
    }

    try {
      const res = await fetch(`/api/transactions/${encodeURIComponent(id)}/settle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: activeWorkspaceId,
          actualPaidDate: options?.actualPaidDate || ANCHOR_DATE,
          partialAmount: options?.partialAmount,
        }),
      });
      const json = await res.json();
      if (json?.success && json.data) {
        applyServerWorkspacePayload(json.data);
        return;
      }
    } catch {
      // Fallback local settlement if offline
      const target = transactions.find((tx) => tx.id === id);
      if (!target) return;
      const remaining = Math.max(0, target.amount - (target.paidAmount || 0));
      const nextCash =
        target.type === 'inflow'
          ? business.currentCash + remaining
          : Math.max(0, business.currentCash - remaining);

      setTransactions((prev) =>
        prev.map((tx) =>
          tx.id === id
            ? {
                ...tx,
                status: 'paid',
                paidAmount: tx.amount,
                actualPaidDate: options?.actualPaidDate || ANCHOR_DATE,
              }
            : tx
        )
      );
      setBusiness((prev) => ({ ...prev, currentCash: nextCash }));
    }
  };

  const handleUpdateCustomerPhone = async (customerId: string, newPhone: string) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, contactPhone: newPhone } : c))
    );
    try {
      const res = await fetch(`/api/customers/${encodeURIComponent(customerId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: activeWorkspaceId,
          contactPhone: newPhone,
        }),
      });
      const json = await res.json();
      if (json?.success && json.data) {
        applyServerWorkspacePayload(json.data);
      }
    } catch {
      // ignore
    }
  };

  const handleApplyRemedy = (remedyType: string) => {
    if (appliedRemedy === remedyType) {
      setAppliedRemedy(null);
      setActiveScenario(null);
      return;
    }
    setAppliedRemedy(remedyType);

    if (remedyType === 'reschedule_supplier' || remedyType === 'split_payment') {
      setActiveScenario({
        id: `remedy-${remedyType}`,
        name: 'Supplier Bill Rescheduled (+6 Days)',
        shortDescription: 'Defers largest supplier bill past month-end customer receipts',
        customerDelayDays: 0,
        salesDropPercent: 0,
        unexpectedExpense: 0,
        rescheduledSupplierDays: 6,
        appliedActionRemedy: remedyType,
      });
    } else if (remedyType === 'collect_overdue' || remedyType === 'early_discount') {
      const overdueTx = pendingPayments.find(
        (t) => t.status === 'overdue' || t.dueDate < ANCHOR_DATE
      );
      if (overdueTx) {
        setFollowUpCustomer(overdueTx);
      }
    }
  };

  const handleUpsertNotice = (incoming: LegalNotice) => {
    const exists = notices.some((n) => n.id === incoming.id);
    const updated = exists
      ? notices.map((n) => (n.id === incoming.id ? incoming : n))
      : [incoming, ...notices];
    persistNotices(updated);
  };

  const handleUpdateNoticeStatus = (id: string, status: NoticeStatus) => {
    persistNotices(notices.map((n) => (n.id === id ? { ...n, status } : n)));
  };

  const handleUpdateNoticeReceivedDate = (id: string, newReceivedDate: string) => {
    const updated = notices.map((n) => {
      if (n.id !== id) return n;
      const newDeadline = addCalendarDays(newReceivedDate, n.statutoryDaysFromReceipt);
      return {
        ...n,
        receivedDate: newReceivedDate,
        receivedDateConfirmed: true,
        deadlineDate: newDeadline,
        deadlineCalculationBasis: TRANSLATIONS[language].recalculatedNote(
          n.statutoryDaysFromReceipt,
          formatLocalDate(newReceivedDate, language),
          formatLocalDate(newDeadline, language)
        ),
      };
    });
    persistNotices(updated);
  };

  const handleToggleNoticeChecklist = (noticeId: string, itemId: string) => {
    const updated = notices.map((n) => {
      if (n.id !== noticeId) return n;
      return {
        ...n,
        documentsChecklist: n.documentsChecklist.map((doc) =>
          doc.id === itemId ? { ...doc, checked: !doc.checked } : doc
        ),
      };
    });
    persistNotices(updated);
  };

  const handleUpdateNoticeDraft = (
    noticeId: string,
    mode: 'reply' | 'extension',
    newText: string
  ) => {
    const updated = notices.map((n) => {
      if (n.id !== noticeId) return n;
      return mode === 'reply'
        ? { ...n, draftReplyText: newText }
        : { ...n, extensionLetterText: newText };
    });
    persistNotices(updated);
  };

  const handleInspectCashDate = (dateStr: string) => {
    const foundDay = activeForecast.dailyForecast.find((d) => d.date === dateStr);
    if (foundDay) {
      setSelectedDateDay(foundDay);
    } else {
      setActiveSection('present_balance');
    }
  };

  const openWhatsAppForNoticeAndPerson = useCallback(
    (notice: LegalNotice, targetPerson?: TrustedPerson) => {
      const chosen =
        targetPerson || people.find((p) => p.role === 'CA') || people[0];
      setWaTargetNotice(notice);
      setWaTargetPersonId(chosen?.id);
      setWaNoticeModalOpen(true);
    },
    [people]
  );

  const t = TRANSLATIONS[language];
  const pf = getPredictiveFinanceText(language);
  const uiExtra = getDashboardExtraStrings(language);

  // =========================================================================
  // LOGIN GATE
  // =========================================================================
  if (!authSession) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        language={language}
        onLanguageChange={handleLanguageChange}
      />
    );
  }

  // Three-Line (☰) Menu Options — Each opens its own uncluttered screen
  const menuOptions: Array<{
    id: DashboardSection;
    title: string;
    subtitle: string;
    icon: any;
    figure?: string;
  }> = [
    {
      id: 'present_balance',
      title: pf.navPresentBalance,
      subtitle: uiExtra.menuSubBalance,
      icon: Wallet,
      figure: formatRupee(business.currentCash, language),
    },
    {
      id: 'pending_payments',
      title: pf.navPendingPayments,
      subtitle: `${uiExtra.menuSubPending} (${formatIndianNumber(pendingPayments.length, language)} ${uiExtra.openWord})`,
      icon: ArrowDownLeft,
      figure: formatRupee(totalPendingSum, language),
    },
    {
      id: 'upcoming_payments',
      title: pf.navUpcomingPayments,
      subtitle: `${uiExtra.menuSubUpcoming} (${formatIndianNumber(upcomingPayments.length, language)} ${uiExtra.openWord})`,
      icon: ArrowUpRight,
      figure: formatRupee(totalUpcomingSum, language),
    },
    {
      id: 'advice_simulator',
      title: pf.navAdviceSimulator,
      subtitle: uiExtra.menuSubAdvice,
      icon: TrendingUp,
      figure: `${formatIndianNumber(
        adviceReport.followUpQueue.filter((q) => q.priority !== 'normal').length,
        language
      )} ${uiExtra.priorityWord}`,
    },
    {
      id: 'customers_accuracy',
      title: pf.navCustomersAccuracy,
      subtitle: `${uiExtra.menuSubCustomers} (${formatIndianNumber(syncedState.customers.length, language)})`,
      icon: Users,
    },
    {
      id: 'notices',
      title: pf.navNotices,
      subtitle: uiExtra.menuSubNotices,
      icon: Scale,
      figure:
        openNoticesSorted.length > 0
          ? `${formatIndianNumber(openNoticesSorted.length, language)} ${uiExtra.openWord}`
          : undefined,
    },
    {
      id: 'guide',
      title: pf.navGuide,
      subtitle: uiExtra.menuSubGuide,
      icon: BookOpen,
    },
  ];

  const realWorkspaceTargetId = authSession.phone
    ? `real-${authSession.phone.replace(/\D/g, '')}`
    : 'real-my-business';

  return (
    <div className="min-h-screen bg-[#FDF8EE] text-[#1C1917] flex flex-col">
      {/* =====================================================================
          CLEAN HEADER WITH THREE-LINE (☰) MENU & 6 DASHBOARD LANGUAGES
          (Screenshot element `Viewing: Present Balance v` REMOVED)
         ===================================================================== */}
      <header className="sticky top-0 z-30 khata-ledger-header border-b border-[#DFD2B7]">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
          {/* Left Zone: Menu + Brand + Workspace Switcher */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 relative">
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open Navigation Menu"
              aria-expanded={isMenuOpen}
              className="min-h-[40px] px-3 py-2 rounded-xl bg-[#14532D] hover:bg-[#166534] text-white font-extrabold text-xs sm:text-sm inline-flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors whitespace-nowrap"
            >
              <Menu className="w-4 h-4 text-[#FDE68A]" />
              <span>{pf.menuBtn}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('present_balance')}
              className="shrink-0 rounded-xl focus:outline-none cursor-pointer flex items-center gap-2 whitespace-nowrap"
              aria-label={t.appFullTitle}
            >
              <RupiVantaLogo size={34} className="w-8 h-8" />
              <span className="font-extrabold text-base sm:text-lg text-[#1C1917] tracking-tight leading-none hidden sm:inline">
                {t.appName}
              </span>
            </button>

            {/* Workspace / Business Selector */}
            <button
              type="button"
              aria-label={t.chooseShopAria}
              onClick={() => setShowBusinessMenu(!showBusinessMenu)}
              className="min-h-[38px] px-2.5 py-1 rounded-xl bg-[#FFFDF9] border border-[#D6C5A9] text-xs sm:text-sm font-bold text-[#44403C] inline-flex items-center gap-1 min-w-0 max-w-[140px] sm:max-w-[220px] cursor-pointer"
            >
              <span className="truncate">
                {getLocalizedBusinessName(business.name, language)}
              </span>
              <ChevronDown className="w-4 h-4 shrink-0" />
            </button>

            {showBusinessMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowBusinessMenu(false)}
                />
                <div className="absolute left-0 top-full mt-2 w-80 max-w-[92vw] bg-[#FFFDF9] rounded-2xl shadow-xl border border-[#D6C5A9] py-2 z-50 divide-y divide-[#EFE6D5]">
                  <div className="px-3.5 py-1.5">
                    <span className="text-xs font-extrabold text-[#57534E] block mb-1">
                      {uiExtra.privateWorkspaceSub}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleSwitchWorkspace({
                          workspaceId: realWorkspaceTargetId,
                          isDemo: false,
                          phone: authSession.phone,
                          shopName:
                            !isDemoWorkspace && business.name
                              ? business.name
                              : 'My Real Business Ledger',
                        })
                      }
                      className={`w-full min-h-[42px] px-3 py-2 rounded-xl text-left flex items-center gap-2.5 cursor-pointer ${
                        !isDemoWorkspace
                          ? 'bg-[#ECFDF5] text-[#14532D] font-extrabold'
                          : 'text-[#1C1917] hover:bg-[#FAF1DF]'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4 text-[#14532D] shrink-0" />
                      <div className="min-w-0">
                        <span className="text-sm block truncate">
                          {uiExtra.myRealLedgerTitle}
                        </span>
                        <span className="text-xs text-[#57534E] block">
                          {pf.realModeBadge}
                        </span>
                      </div>
                    </button>
                  </div>

                  <div className="px-3.5 pt-2 pb-1">
                    <span className="text-xs font-extrabold text-[#57534E] block mb-1">
                      {pf.demoModeBadge}
                    </span>
                    {businessList.map((b) => {
                      const demoId = b.id || 'demo-sharma';
                      const active = activeWorkspaceId === demoId;
                      return (
                        <button
                          key={demoId}
                          type="button"
                          onClick={() =>
                            handleSwitchWorkspace({
                              workspaceId: demoId,
                              isDemo: true,
                              phone: authSession.phone,
                              shopName: b.name,
                            })
                          }
                          className={`w-full min-h-[42px] px-3 py-2 rounded-xl text-left flex items-center gap-2.5 cursor-pointer ${
                            active
                              ? 'bg-[#ECFDF5] text-[#14532D] font-extrabold'
                              : 'text-[#1C1917] hover:bg-[#FAF1DF]'
                          }`}
                        >
                          <Building2 className="w-4 h-4 shrink-0 text-amber-800" />
                          <span className="text-sm truncate">
                            {getLocalizedBusinessName(b.name, language)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right Zone: All 6 Dashboard Languages + Voice Assistant (EN/KN) + Sign Out */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="inline-flex items-center bg-[#FFFDF9] border border-[#D6C5A9] rounded-xl px-2 min-h-[38px]">
              <Globe className="w-4 h-4 text-[#14532D] shrink-0 hidden sm:block" />
              <select
                aria-label={t.chooseLangAria}
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value as AppLanguage)}
                className="bg-transparent px-1 py-1 text-xs sm:text-sm font-extrabold text-[#1C1917] focus:outline-none cursor-pointer"
              >
                <option value="en">English</option>
                <option value="kn">ಕನ್ನಡ</option>
                <option value="hi">हिन्दी</option>
                <option value="ta">தமிழ்</option>
                <option value="te">తెలుగు</option>
                <option value="ml">മലയാളം</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setIsVoiceBarOpen(true)}
              className="min-h-[38px] px-3 rounded-xl bg-[#14532D] hover:bg-[#166534] text-white text-xs sm:text-sm font-extrabold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Mic className="w-4 h-4 text-[#FDE68A] shrink-0" />
              <span className="hidden md:inline">{uiExtra.voiceHeaderBtn}</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              title="Sign Out"
              aria-label="Sign Out"
              className="min-h-[38px] px-2.5 rounded-xl bg-[#FFFDF9] hover:bg-rose-50 border border-[#D6C5A9] hover:border-rose-300 text-[#44403C] hover:text-rose-700 inline-flex items-center justify-center cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================================
          THREE-LINE (☰) SLIDE-OVER NAVIGATION DRAWER
         ===================================================================== */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
          aria-label="Dashboard Navigation Menu"
        >
          <div
            className="fixed inset-0 bg-black/45 backdrop-blur-[1px]"
            onClick={() => setIsMenuOpen(false)}
          />

          <aside className="relative z-10 w-80 sm:w-96 max-w-[88vw] bg-[#FFFDF9] border-r border-[#D6C5A9] shadow-2xl flex flex-col h-full">
            <div className="khata-ledger-header px-5 py-4 border-b border-[#E5D9C3] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <RupiVantaLogo size={32} className="w-8 h-8" />
                <div>
                  <span className="block font-extrabold text-base text-[#1C1917] leading-none">
                    {pf.selectViewTitle}
                  </span>
                  <span className="block text-xs text-[#57534E] mt-0.5">
                    {pf.selectViewSubtitle}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                aria-label={t.closeBtn}
                className="min-h-[36px] px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#FAF1DF] border border-[#D6C5A9] text-[#1C1917] text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>{t.closeBtn}</span>
              </button>
            </div>

            <nav className="p-4 space-y-2 overflow-y-auto flex-1">
              {menuOptions.map((item) => {
                const Icon = item.icon;
                const isSelected = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveSection(item.id);
                      setIsMenuOpen(false);
                    }}
                    className={`w-full p-3.5 rounded-2xl text-left border transition-colors cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#14532D] border-[#14532D] text-white'
                        : 'bg-[#FFFDF9] hover:bg-[#FAF1DF] border-[#E5D9C3] text-[#1C1917]'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <Icon
                        className={`w-5 h-5 shrink-0 mt-0.5 ${
                          isSelected ? 'text-[#FDE68A]' : 'text-[#14532D]'
                        }`}
                      />
                      <div className="min-w-0">
                        <span className="block text-sm sm:text-base font-extrabold leading-snug">
                          {item.title}
                        </span>
                        <span
                          className={`block text-xs mt-0.5 ${
                            isSelected ? 'text-white/85' : 'text-[#57534E]'
                          }`}
                        >
                          {item.subtitle}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex flex-col items-end gap-1">
                      {item.figure && (
                        <span
                          className={`font-mono tabular-nums text-xs font-extrabold ${
                            isSelected ? 'text-[#FDE68A]' : 'text-[#1C1917]'
                          }`}
                        >
                          {item.figure}
                        </span>
                      )}
                      {isSelected && <Check className="w-4 h-4 text-[#FDE68A]" />}
                    </div>
                  </button>
                );
              })}
            </nav>

            <div className="p-4 border-t border-[#E5D9C3] bg-[#FAF1DF]/55 space-y-2">
              <p className="text-[11px] font-bold text-[#57534E] text-center">
                {pf.voiceSupportedOnlyNote}
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsVoiceBarOpen(true);
                }}
                className="w-full min-h-[42px] px-4 py-2 rounded-xl bg-[#14532D] hover:bg-[#166534] text-white text-xs sm:text-sm font-extrabold inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <Mic className="w-4 h-4 text-[#FDE68A]" />
                <span>{uiExtra.voiceFloatingBtn}</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* =====================================================================
          MAIN CONTENT AREA — WORKSPACE ISOLATION STRIP + FOCUSED SECTION
         ===================================================================== */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-6 pt-5 pb-28 space-y-5">
        {/* Clean Workspace Isolation & Present Date Strip */}
        <div
          className={`rounded-2xl px-4 py-2.5 border flex flex-wrap items-center justify-between gap-2 text-xs ${
            isDemoWorkspace
              ? 'bg-amber-50/80 border-amber-300 text-amber-950'
              : 'bg-emerald-50/80 border-emerald-300 text-[#14532D]'
          }`}
        >
          <div className="flex flex-wrap items-center gap-2 font-bold">
            {isDemoWorkspace ? (
              <Database className="w-4 h-4 text-amber-800 shrink-0" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-[#14532D] shrink-0" />
            )}
            <span>{isDemoWorkspace ? pf.demoModeBadge : pf.realModeBadge}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              {pf.presentDatePrefix}: {formatHeaderDate(ANCHOR_DATE, language)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isDemoWorkspace ? (
              <>
                <button
                  type="button"
                  onClick={handleResetDemoWorkspace}
                  className="min-h-[30px] px-2.5 py-1 rounded-lg bg-white hover:bg-[#FAF1DF] border border-amber-300 text-amber-950 font-bold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{uiExtra.resetDemoBtn}</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleSwitchWorkspace({
                      workspaceId: realWorkspaceTargetId,
                      isDemo: false,
                      phone: authSession.phone,
                      shopName: 'My Real Business Ledger',
                    })
                  }
                  className="min-h-[30px] px-2.5 py-1 rounded-lg bg-[#14532D] text-white font-bold cursor-pointer whitespace-nowrap"
                >
                  {pf.switchRealBtn}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() =>
                  handleSwitchWorkspace({
                    workspaceId: 'demo-sharma',
                    isDemo: true,
                    phone: authSession.phone,
                    shopName: 'Sharma Stores [Demo]',
                  })
                }
                className="min-h-[30px] px-2.5 py-1 rounded-lg bg-white hover:bg-[#FAF1DF] border border-emerald-300 text-[#14532D] font-bold cursor-pointer whitespace-nowrap"
              >
                {pf.switchDemoBtn}
              </button>
            )}
          </div>
        </div>

        {(activeSection === 'present_balance' ||
          activeSection === 'pending_payments' ||
          activeSection === 'upcoming_payments') && (
          <BalanceAndPaymentsTab
            activeSection={activeSection}
            onOpenMenu={() => setIsMenuOpen(true)}
            businessName={business.name}
            isDemoWorkspace={isDemoWorkspace}
            currentCash={business.currentCash}
            minimumReserve={minimumReserve}
            pendingPayments={pendingPayments}
            upcomingPayments={upcomingPayments}
            customers={syncedState.customers}
            mlPredictionsByTxId={mlPredictionBundle.predictionsByTxId}
            adviceReport={adviceReport}
            dailyForecast={activeForecast.dailyForecast}
            comparisonForecastDays={comparisonForecast?.dailyForecast || null}
            forecastTimingMode={forecastTimingMode}
            onChangeForecastTimingMode={setForecastTimingMode}
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
            hasShortfall={hasShortfall}
            shortfallDate={shortfallDateStr}
            shortfallAmount={shortfallAmount}
            language={language}
            onUpdateBalance={handleUpdateBalance}
            onAddPayment={handleAddTransaction}
            onEditPayment={handleEditTransaction}
            onDeletePayment={handleDeleteTransaction}
            onSettlePayment={handleSettleTransaction}
            onRemindCustomer={(tx) => setFollowUpCustomer(tx)}
            onOpenScanModal={() => setIsScanModalOpen(true)}
            onSelectForecastDay={(day) => setSelectedDateDay(day)}
            onAskVanta={(prompt) => handleRunCommand(prompt)}
            onOpenAdviceSection={() => setActiveSection('advice_simulator')}
          />
        )}

        {activeSection === 'advice_simulator' && (
          <PredictiveAdviceSection
            adviceReport={adviceReport}
            transactions={allTransactions}
            currentCash={business.currentCash}
            minimumReserve={minimumReserve}
            activeScenario={activeScenario}
            onSelectScenario={(scen) => {
              setActiveScenario(scen);
              if (!scen) setAppliedRemedy(null);
            }}
            baselineShortfallDate={
              baselineForecastML.nextRisk?.riskDate ||
              baselineForecastML.lowestBalanceDate
            }
            baselineLowestBalance={baselineForecastML.lowestBalance}
            simulatedLowestBalance={activeForecast.lowestBalance}
            simulatedShortfallDate={
              activeForecast.nextRisk?.riskDate || activeForecast.lowestBalanceDate
            }
            onApplyRemedy={handleApplyRemedy}
            appliedRemedy={appliedRemedy}
            onRemindCustomer={(tx) => setFollowUpCustomer(tx)}
            onAskVanta={(prompt) => handleRunCommand(prompt)}
            onGoToPendingPayments={() => setActiveSection('pending_payments')}
            language={language}
          />
        )}

        {activeSection === 'customers_accuracy' && (
          <div className="space-y-8">
            <CustomerIntelligenceSection
              customers={syncedState.customers}
              transactions={allTransactions}
              mlPredictionsByTxId={mlPredictionBundle.predictionsByTxId}
              isDemoWorkspace={isDemoWorkspace}
              onRemindTransaction={(tx) => setFollowUpCustomer(tx)}
              onUpdateCustomerPhone={handleUpdateCustomerPhone}
              language={language}
            />
            <AccuracyTrackerSection
              records={accuracyRecords}
              predictionOutcomes={predictionOutcomes}
              customers={syncedState.customers}
              transactions={allTransactions}
              trainedInvoicesCount={adviceReport.modelMetrics.trainedInvoicesCount}
              currentCash={business.currentCash}
              language={language}
            />
          </div>
        )}

        {activeSection === 'notices' && (
          <NoticesView
            notices={notices}
            selectedNoticeId={selectedNoticeId}
            onSelectNotice={setSelectedNoticeId}
            onUpsertNotice={handleUpsertNotice}
            onUpdateNoticeStatus={handleUpdateNoticeStatus}
            onUpdateReceivedDate={handleUpdateNoticeReceivedDate}
            onToggleChecklistItem={handleToggleNoticeChecklist}
            onUpdateDraftText={handleUpdateNoticeDraft}
            businessName={business.name}
            currentCash={business.currentCash}
            minimumReserve={minimumReserve}
            dailyForecast={activeForecast.dailyForecast}
            baseTransactions={syncedState.transactions}
            onInspectCashDate={handleInspectCashDate}
            onOpenWhatsAppForNotice={(notice) => openWhatsAppForNoticeAndPerson(notice)}
            onSpeakNoticeExplanation={(notice) => {
              const cd = computeNoticeCountdown(notice.deadlineDate, ANCHOR_DATE);
              const expl = buildNoticeExplanationSpeech(
                notice,
                cd.daysLeft,
                voiceLanguage
              );
              setVoiceStep('converse');
              setIsVoiceBarOpen(true);
              setConversationMessages((prev) => [
                ...prev,
                {
                  id: `msg-notice-${Date.now()}`,
                  role: 'assistant',
                  text: expl,
                },
              ]);
              speakWithMunimji(expl, voiceLanguage);
            }}
            language={language}
          />
        )}

        {activeSection === 'guide' && (
          <HowToUseGuideTab
            onOpenVoiceAssistant={() => setIsVoiceBarOpen(true)}
            onOpenMenu={() => setIsMenuOpen(true)}
            onGoToPresentBalance={() => setActiveSection('present_balance')}
            onGoToPendingPayments={() => setActiveSection('pending_payments')}
            onGoToUpcomingPayments={() => setActiveSection('upcoming_payments')}
            onGoToAdviceSection={() => setActiveSection('advice_simulator')}
            onGoToNoticesTab={() => setActiveSection('notices')}
            language={language}
          />
        )}
      </main>

      {/* =====================================================================
          VANTA VOICE ASSISTANT POPUP (STRICTLY ENGLISH & KANNADA ONLY)
         ===================================================================== */}
      <MunimjiVoiceBar
        isOpen={isVoiceBarOpen}
        voiceStep={voiceStep}
        voiceLanguage={voiceLanguage}
        onSelectVoiceLanguage={handleSelectVoiceLanguage}
        onOpen={() => setIsVoiceBarOpen(true)}
        onClose={() => {
          stopAllVoiceActivity();
          setIsVoiceBarOpen(false);
        }}
        language={language}
        conversationMessages={conversationMessages}
        lastSpokenText={lastSpokenText}
        interimTranscript={interimTranscript}
        isProcessing={isProcessingCommand}
        isSpeaking={isSpeaking}
        isPaused={isPaused}
        isListening={isListening}
        speechSupported={speechRecognitionSupported}
        voiceFallbackNotice={voiceFallbackNotice}
        onToggleMic={handleToggleMic}
        onPauseResume={handlePauseResumeSpeech}
        onRepeat={() => {
          if (lastSpokenText) {
            speakWithMunimji(lastSpokenText, voiceLanguage);
          }
        }}
        onSubmitCommandText={handleRunCommand}
      />

      {/* =====================================================================
          SUPPORTING MODALS
         ===================================================================== */}
      <WhatsAppNoticeModal
        isOpen={waNoticeModalOpen}
        onClose={() => setWaNoticeModalOpen(false)}
        notice={waTargetNotice}
        people={people}
        initialPersonId={waTargetPersonId}
        businessName={business.name}
        language={language}
        onSpeak={(txt) => speakWithMunimji(txt, voiceLanguage)}
        isSpeaking={isSpeaking && !isPaused}
      />

      {selectedDateDay && (
        <DateInspectionModal
          day={selectedDateDay}
          minimumReserve={minimumReserve}
          onClose={() => setSelectedDateDay(null)}
          onOpenAddModalWithDate={(dateStr) => {
            setAddModalPreloadDate(dateStr);
            setIsAddModalOpen(true);
          }}
          onMarkPaid={(id) => handleSettleTransaction(id, { actualPaidDate: ANCHOR_DATE })}
          language={language}
        />
      )}

      {followUpCustomer && (
        <WhatsAppReminderModal
          customerTx={followUpCustomer}
          customers={syncedState.customers}
          workspaceId={activeWorkspaceId}
          businessName={business.name}
          onClose={() => setFollowUpCustomer(null)}
          onMarkPaid={(id) => handleSettleTransaction(id, { actualPaidDate: ANCHOR_DATE })}
          onReminderLogged={() => refreshServerData(activeWorkspaceId)}
          language={language}
        />
      )}

      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddTransaction={handleAddTransaction}
        preloadDate={addModalPreloadDate}
        language={language}
      />

      <InvoiceScannerModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onConfirmTransaction={handleAddTransaction}
        isDemoWorkspace={isDemoWorkspace}
        language={language}
      />
    </div>
  );
}
