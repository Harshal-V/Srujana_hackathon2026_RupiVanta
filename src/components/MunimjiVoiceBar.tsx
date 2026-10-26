import React, { useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  Pause,
  Play,
  RotateCcw,
  X,
  Send,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Globe,
  Info,
} from 'lucide-react';
import { AppLanguage } from '../types/munimji';
import { TRANSLATIONS, getPredictiveFinanceText } from '../utils/translations';
import { getDashboardExtraStrings } from '../utils/localization';
import { MunimjiAvatar } from './MunimjiAvatar';

export type SupportedVoiceLanguage = 'en' | 'kn';

export interface VoiceConversationMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  ledgerSummary?: string;
}

interface MunimjiVoiceBarProps {
  isOpen: boolean;
  voiceStep: 'choose_language' | 'converse';
  voiceLanguage: SupportedVoiceLanguage;
  onSelectVoiceLanguage: (lang: SupportedVoiceLanguage) => void;
  onOpen: () => void;
  onClose: () => void;
  language: AppLanguage; // Dashboard language (6 languages)
  conversationMessages: VoiceConversationMessage[];
  lastSpokenText: string;
  interimTranscript?: string;
  isProcessing?: boolean;
  isSpeaking: boolean;
  isPaused: boolean;
  isListening: boolean;
  speechSupported: boolean;
  voiceFallbackNotice: string | null;
  onToggleMic: () => void;
  onPauseResume: () => void;
  onRepeat: () => void;
  onSubmitCommandText: (text: string) => void;
}

const VOICE_COPY: Record<
  SupportedVoiceLanguage,
  {
    activeLangLabel: string;
    statusListening: string;
    statusUpdating: string;
    statusReady: string;
    micStart: string;
    micStop: string;
    inputPlaceholder: string;
    hintExamples: string;
    quickQuestions: string[];
    exitDashboardBtn: string;
    ledgerUpdatedTitle: string;
    exitShortBtn: string;
    switcherPrefix: string;
  }
> = {
  en: {
    activeLangLabel: 'English',
    statusListening: 'Listening in English...',
    statusUpdating: 'Understanding your request & checking your ledger...',
    statusReady: 'Ask any question or tell me any task in English',
    micStart: 'Tap Mic & Speak in English',
    micStop: 'Tap to Stop & Send Recording',
    inputPlaceholder: 'Ask anything — add a pending payment, check cash, or mark a bill paid...',
    hintExamples:
      'Try asking: “Add a pending payment from Ramesh Traders ₹12,000 due 5 Nov”, “Who should I call first?”, “Are my upcoming bills affordable?”, or “Set my cash balance to ₹45,000”.',
    quickQuestions: [
      'Who should I follow up with first?',
      'Are my upcoming bills safe to pay?',
      'Can you add an extra pending payment for me?',
    ],
    exitDashboardBtn: 'Done — Exit to Dashboard',
    ledgerUpdatedTitle: 'Ledger Updated',
    exitShortBtn: 'Exit',
    switcherPrefix: 'Voice Language (English & ಕನ್ನಡ only):',
  },
  kn: {
    activeLangLabel: 'ಕನ್ನಡ',
    statusListening: 'ಕನ್ನಡದಲ್ಲಿ ನಿಮ್ಮ ಧ್ವನಿಯನ್ನು ಆಲಿಸುತ್ತಿದೆ...',
    statusUpdating: 'ನಿಮ್ಮ ಮನವಿಯನ್ನು ಪರಿಶೀಲಿಸಿ ಖಾತೆಯನ್ನು ನವೀಕರಿಸಲಾಗುತ್ತಿದೆ...',
    statusReady: 'ಕನ್ನಡದಲ್ಲಿ ಯಾವುದೇ ಪ್ರಶ್ನೆ ಕೇಳಿ ಅಥವಾ ಕೆಲಸ ಹೇಳಿ',
    micStart: 'ಮೈಕ್ ಒತ್ತಿ ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡಿ',
    micStop: 'ನಿಲ್ಲಿಸಲು ಮತ್ತು ಕಳುಹಿಸಲು ಒತ್ತಿ',
    inputPlaceholder: 'ಬಾಕಿ ಪಾವತಿ ಸೇರಿಸಲು, ಬ್ಯಾಲೆನ್ಸ್ ಬದಲಿಸಲು ಅಥವಾ ಸಲಹೆ ಕೇಳಲು ಟೈಪ್ ಮಾಡಿ...',
    hintExamples:
      'ಉದಾಹರಣೆ: “ರಮೇಶ್ ಟ್ರೇಡರ್ಸ್ ₹೧೨,೦೦೦ ಬಾಕಿ ಪಾವತಿ ಸೇರಿಸಿ”, “ಮೊದಲು ಯಾರನ್ನು ಕೇಳಬೇಕು?”, “ಮುಂಬರುವ ಬಿಲ್ ಪಾವತಿಸಲು ಹಣ ಸಾಕೇ?”, ಅಥವಾ “ನನ್ನ ಬ್ಯಾಲೆನ್ಸ್ ₹೪೫,೦೦೦ ಮಾಡಿ”.',
    quickQuestions: [
      'ಮೊದಲು ಯಾರ ಬಾಕಿ ಹಣ ಕೇಳಬೇಕು?',
      'ಮುಂಬರುವ ಬಿಲ್ ಪಾವತಿಸಲು ಹಣ ಸಾಕಾಗುತ್ತದೆಯೇ?',
      'ಹೊಸ ಬಾಕಿ ಪಾವತಿಯನ್ನು ಸೇರಿಸಬಹುದೇ?',
    ],
    exitDashboardBtn: 'ಸಂಭಾಷಣೆ ಮುಗಿಸಿ — ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹೋಗಿ',
    ledgerUpdatedTitle: 'ಖಾತೆ ನವೀಕರಿಸಲಾಗಿದೆ',
    exitShortBtn: 'ನಿರ್ಗಮಿಸಿ',
    switcherPrefix: 'ಧ್ವನಿ ಭಾಷೆ (ಇಂಗ್ಲಿಷ್ ಮತ್ತು ಕನ್ನಡ ಮಾತ್ರ):',
  },
};

export const MunimjiVoiceBar: React.FC<MunimjiVoiceBarProps> = ({
  isOpen,
  voiceStep,
  voiceLanguage,
  onSelectVoiceLanguage,
  onOpen,
  onClose,
  language,
  conversationMessages,
  lastSpokenText,
  interimTranscript = '',
  isProcessing = false,
  isSpeaking,
  isPaused,
  isListening,
  voiceFallbackNotice,
  onToggleMic,
  onPauseResume,
  onRepeat,
  onSubmitCommandText,
}) => {
  const [typedQuery, setTypedQuery] = useState('');
  const threadEndRef = useRef<HTMLDivElement | null>(null);
  const t = TRANSLATIONS[language];
  const pf = getPredictiveFinanceText(language);
  const uiExtra = getDashboardExtraStrings(language);
  const ui = VOICE_COPY[voiceLanguage] || VOICE_COPY.en;

  useEffect(() => {
    if (isOpen && voiceStep === 'converse') {
      threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationMessages, interimTranscript, isProcessing, isOpen, voiceStep]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedQuery.trim() || isProcessing) return;
    onSubmitCommandText(typedQuery.trim());
    setTypedQuery('');
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40">
        <button
          type="button"
          onClick={onOpen}
          className="min-h-[50px] px-4 sm:px-5 py-2.5 rounded-2xl bg-[#14532D] hover:bg-[#166534] text-white shadow-lg border-2 border-[#FDE68A]/70 inline-flex items-center gap-2.5 cursor-pointer transition-colors whitespace-nowrap"
        >
          <Mic className="w-5 h-5 text-[#FDE68A] shrink-0" />
          <span className="text-sm sm:text-base font-extrabold">
            {uiExtra.voiceHeaderBtn}
          </span>
        </button>
      </div>
    );
  }

  // Strictly English and Kannada ONLY for the Voice Assistant
  const languageChoices: Array<{
    code: SupportedVoiceLanguage;
    nativeName: string;
    subtitle: string;
  }> = [
    {
      code: 'en',
      nativeName: 'English',
      subtitle:
        'Speak or type in English to add pending payments, log bills, update cash balance, or get simple cash-flow advice',
    },
    {
      code: 'kn',
      nativeName: 'ಕನ್ನಡ',
      subtitle:
        'ಬಾಕಿ ಪಾವತಿ ಸೇರಿಸಲು, ಮುಂಬರುವ ಬಿಲ್ ದಾಖಲಿಸಲು, ಬ್ಯಾಲೆನ್ಸ್ ನವೀಕರಿಸಲು ಮತ್ತು ಸರಳ ಹಣಕಾಸು ಸಲಹೆಗಾಗಿ ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡಿ',
    },
  ];

  const isKnDashboard = language === 'kn';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={t.munimjiName}
    >
      <div className="w-full max-w-xl bg-[#FFFDF9] border-2 border-[#14532D] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="khata-ledger-header px-5 py-4 border-b border-[#E5D9C3] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <MunimjiAvatar
              size="sm"
              isSpeaking={isSpeaking && !isPaused}
              isListening={isListening}
            />
            <div className="min-w-0">
              <span className="block text-base sm:text-lg font-extrabold text-[#1C1917] leading-tight truncate">
                {t.munimjiName}
              </span>
              <span className="block text-xs sm:text-sm font-semibold text-[#14532D] truncate">
                {voiceStep === 'choose_language'
                  ? pf.voiceSupportedOnlyNote
                  : isListening
                  ? ui.statusListening
                  : isProcessing
                  ? ui.statusUpdating
                  : isSpeaking && !isPaused
                  ? t.munimjiSpeaking
                  : ui.statusReady}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t.closeBtn}
            className="min-h-[40px] px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF1DF] border border-[#D6C5A9] text-[#1C1917] text-sm font-extrabold inline-flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
          >
            <X className="w-4 h-4" />
            <span>{voiceStep === 'choose_language' ? t.closeBtn : ui.exitShortBtn}</span>
          </button>
        </div>

        {/* Explicit Supported Voice Languages Banner */}
        <div className="px-5 py-2 bg-[#ECFDF5] border-b border-[#BBF7D0] flex items-center gap-2 text-xs font-bold text-[#14532D] shrink-0">
          <Info className="w-4 h-4 shrink-0" />
          <span>{pf.voiceSupportedOnlyNote}</span>
        </div>

        {/* STEP 1: CHOOSE VOICE LANGUAGE (STRICTLY ENGLISH OR KANNADA) */}
        {voiceStep === 'choose_language' ? (
          <div className="p-5 sm:p-7 space-y-5 overflow-y-auto">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 text-xs font-extrabold text-[#14532D]">
                <Globe className="w-4 h-4" />
                <span>
                  {isKnDashboard
                    ? 'ಧ್ವನಿ ಸಹಾಯಕ ಭಾಷೆ ಆಯ್ಕೆ'
                    : 'Voice Assistant Language Selection'}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-[#1C1917] leading-snug">
                {isKnDashboard
                  ? 'ಇಂಗ್ಲಿಷ್ ಅಥವಾ ಕನ್ನಡ ಆಯ್ಕೆಮಾಡಿ'
                  : 'Choose English or ಕನ್ನಡ'}
              </h2>
              <p className="text-sm text-[#57534E]">
                {pf.voiceSupportedOnlyNote}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {languageChoices.map((choice) => (
                <button
                  key={choice.code}
                  type="button"
                  onClick={() => onSelectVoiceLanguage(choice.code)}
                  className="w-full p-4 sm:p-5 rounded-2xl bg-[#FAF1DF]/70 hover:bg-[#ECFDF5] border-2 border-[#D6C5A9] hover:border-[#14532D] text-left flex items-center justify-between gap-4 cursor-pointer transition-colors group"
                >
                  <div>
                    <span className="text-xl sm:text-2xl font-black text-[#1C1917] group-hover:text-[#14532D] block">
                      {choice.nativeName}
                    </span>
                    <p className="text-sm font-medium text-[#44403C] mt-0.5">
                      {choice.subtitle}
                    </p>
                  </div>

                  <div className="w-10 h-10 rounded-xl bg-[#14532D] text-[#FDE68A] flex items-center justify-center shrink-0">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-[#EFE6D5] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[40px] px-4 py-1.5 rounded-xl bg-white hover:bg-[#FAF1DF] border border-[#D6C5A9] text-[#44403C] text-xs sm:text-sm font-bold cursor-pointer whitespace-nowrap"
              >
                {t.closeBtn}
              </button>
            </div>
          </div>
        ) : (
          /* STEP 2: MULTI-TURN CONVERSATION IN ENGLISH OR KANNADA */
          <div className="flex flex-col flex-1 min-h-0">
            {/* Strictly 2-Language Voice Switcher Bar */}
            <div className="px-5 py-2.5 bg-[#FAF1DF]/60 border-b border-[#EADDC5] flex flex-wrap items-center justify-between gap-2 shrink-0">
              <span className="text-xs font-extrabold text-[#57534E]">
                {ui.switcherPrefix}
              </span>
              <div className="inline-flex items-center gap-1.5">
                {(['en', 'kn'] as const).map((code) => {
                  const active = voiceLanguage === code;
                  const label = code === 'en' ? 'English' : 'ಕನ್ನಡ';
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => onSelectVoiceLanguage(code)}
                      className={`px-3 py-1 rounded-lg text-xs font-extrabold cursor-pointer transition-colors whitespace-nowrap ${
                        active
                          ? 'bg-[#14532D] text-white'
                          : 'bg-white hover:bg-[#F3E5C8] text-[#44403C] border border-[#D6C5A9]'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Conversation Messages Thread */}
            <div className="p-4 sm:p-5 space-y-3 overflow-y-auto flex-1 min-h-[180px] max-h-[38vh]">
              {conversationMessages.map((msg, idx) => {
                const isLatestAssistant =
                  msg.role === 'assistant' && idx === conversationMessages.length - 1;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.role === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[90%] rounded-2xl p-3.5 sm:p-4 space-y-2 ${
                        msg.role === 'user'
                          ? 'bg-[#FAF1DF] border border-[#D6C5A9] text-[#1C1917]'
                          : 'bg-[#ECFDF5] border border-[#86EFAC] text-[#1C1917]'
                      }`}
                    >
                      {msg.ledgerSummary && (
                        <div className="px-3 py-2 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] flex items-start gap-2 text-xs font-bold text-[#92400E]">
                          <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                          <div>
                            <span className="block font-extrabold text-[#14532D]">
                              {ui.ledgerUpdatedTitle}
                            </span>
                            <span className="text-[#78350F]">{msg.ledgerSummary}</span>
                          </div>
                        </div>
                      )}

                      <p className="text-sm sm:text-base font-bold leading-relaxed">
                        {msg.text}
                      </p>

                      {isLatestAssistant && lastSpokenText && (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={onPauseResume}
                            disabled={!isSpeaking}
                            className="min-h-[34px] px-2.5 py-1 rounded-lg bg-white border border-[#86EFAC] disabled:opacity-45 text-[#14532D] text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            {isPaused ? (
                              <Play className="w-3.5 h-3.5" />
                            ) : (
                              <Pause className="w-3.5 h-3.5" />
                            )}
                            <span>{isPaused ? t.resumeBtn : t.pauseBtn}</span>
                          </button>

                          <button
                            type="button"
                            onClick={onRepeat}
                            className="min-h-[34px] px-2.5 py-1 rounded-lg bg-white border border-[#86EFAC] text-[#14532D] text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>{t.repeatBtn}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {isListening && interimTranscript && (
                <div className="px-4 py-2.5 rounded-2xl bg-amber-50 border border-amber-300 text-sm font-bold text-[#78350F]">
                  “{interimTranscript}...”
                </div>
              )}

              {isProcessing && (
                <div className="px-4 py-2.5 rounded-2xl bg-[#FAF1DF] border border-[#D6C5A9] flex items-center gap-2.5 text-sm font-bold text-[#14532D]">
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>{ui.statusUpdating}</span>
                </div>
              )}

              {voiceFallbackNotice && (
                <div className="p-3 rounded-2xl bg-[#FEF3C7] border border-[#F59E0B]/50 text-xs sm:text-sm font-medium text-[#78350F]">
                  {voiceFallbackNotice}
                </div>
              )}

              <div ref={threadEndRef} />
            </div>

            {/* Quick Prompts + Mic + Input */}
            <div className="p-4 sm:p-5 border-t border-[#EADDC5] bg-[#FFFDF9] space-y-2.5 shrink-0">
              <div className="flex flex-wrap gap-1.5">
                {ui.quickQuestions.map((q) => (
                  <button
                    key={q}
                    type="button"
                    disabled={isProcessing}
                    onClick={() => onSubmitCommandText(q)}
                    className="px-2.5 py-1 rounded-lg bg-[#FAF1DF] hover:bg-[#F3E5C8] border border-[#D6C5A9] text-xs font-bold text-[#292524] cursor-pointer transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={onToggleMic}
                disabled={isProcessing}
                className={`w-full min-h-[48px] px-5 py-2.5 rounded-2xl text-base font-extrabold shadow-xs inline-flex items-center justify-center gap-2.5 transition-colors cursor-pointer disabled:opacity-50 ${
                  isListening
                    ? 'bg-[#B91C1C] text-white'
                    : 'bg-[#C2410C] hover:bg-[#9A3412] text-white'
                }`}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                <span>{isListening ? ui.micStop : ui.micStart}</span>
              </button>

              <p className="text-xs text-[#57534E] leading-relaxed">{ui.hintExamples}</p>

              <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
                <input
                  type="text"
                  value={typedQuery}
                  onChange={(e) => setTypedQuery(e.target.value)}
                  placeholder={ui.inputPlaceholder}
                  className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-[#CBBBA0] text-sm sm:text-base text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#14532D]"
                />
                <button
                  type="submit"
                  disabled={!typedQuery.trim() || isProcessing}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#14532D] hover:bg-[#166534] disabled:opacity-45 text-white text-sm font-bold inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{t.sendBtn}</span>
                </button>
              </form>

              <div className="pt-1 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto min-h-[40px] px-5 py-2 rounded-xl bg-[#FAF1DF] hover:bg-[#F3E5C8] border border-[#CBBBA0] text-[#1C1917] text-sm font-extrabold inline-flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <span>{ui.exitDashboardBtn}</span>
                  <ArrowRight className="w-4 h-4 text-[#14532D]" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
