import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Volume2,
  Mic,
  CheckCircle2,
  Clock,
  Pause,
  Play,
  RotateCcw,
  Hand
} from 'lucide-react';
import { AppLanguage } from '../types/munimji';
import {
  TRANSLATIONS,
  buildPersonalSummarySpeech,
  formatLocalDate
} from '../utils/translations';
import { MunimjiAvatar } from './MunimjiAvatar';
import { RupiVantaLogo } from './RupiVantaLogo';

interface WelcomeOnboardingOverlayProps {
  isOpen: boolean;
  language: AppLanguage;
  onSelectLanguage: (lang: AppLanguage) => void;
  urgentNoticesCount: number;
  nearestDaysLeft: number;
  hasCashShortfall: boolean;
  shortfallDateStr: string;
  isSpeaking: boolean;
  isPaused: boolean;
  voiceFallbackNotice: string | null;
  onSpeak: (text: string, langOverride?: AppLanguage) => void;
  onPauseResumeSpeech: () => void;
  onStopSpeech: () => void;
  onFinishExplainUrgent: () => void;
  onFinishLater: () => void;
}

export const WelcomeOnboardingOverlay: React.FC<WelcomeOnboardingOverlayProps> = ({
  isOpen,
  language,
  onSelectLanguage,
  urgentNoticesCount,
  nearestDaysLeft,
  hasCashShortfall,
  shortfallDateStr,
  isSpeaking,
  isPaused,
  voiceFallbackNotice,
  onSpeak,
  onPauseResumeSpeech,
  onStopSpeech,
  onFinishExplainUrgent,
  onFinishLater,
}) => {
  const [step, setStep] = useState<'tap' | 'language' | 'summary'>('tap');
  const [isListeningStep, setIsListeningStep] = useState(false);
  const recognitionRef = useRef<any>(null);

  const t = TRANSLATIONS[language];

  const summaryScript = buildPersonalSummarySpeech(
    language,
    urgentNoticesCount,
    nearestDaysLeft,
    hasCashShortfall,
    formatLocalDate(shortfallDateStr, language)
  );

  useEffect(() => {
    if (isOpen) {
      setStep('tap');
    } else if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsListeningStep(false);
    }
  }, [isOpen]);

  const stopStepMic = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListeningStep(false);
  };

  const startStepVoiceListener = (mode: 'language' | 'summary', currentLang: AppLanguage) => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    stopStepMic();
    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      const bcpMap: Record<AppLanguage, string> = {
        en: 'en-IN',
        kn: 'kn-IN',
        hi: 'hi-IN',
        ta: 'ta-IN',
        te: 'te-IN',
        ml: 'ml-IN',
      };
      rec.lang = bcpMap[currentLang] || 'en-IN';

      rec.onresult = (event: any) => {
        const transcript = String(event.results?.[0]?.[0]?.transcript || '').toLowerCase();
        setIsListeningStep(false);

        if (mode === 'language') {
          if (transcript.includes('kannada') || transcript.includes('ಕನ್ನಡ')) {
            handleChooseLanguage('kn');
          } else if (
            transcript.includes('hindi') ||
            transcript.includes('हिन्दी') ||
            transcript.includes('हिंदी')
          ) {
            handleChooseLanguage('hi');
          } else if (transcript.includes('tamil') || transcript.includes('தமிழ்')) {
            handleChooseLanguage('ta');
          } else if (transcript.includes('telugu') || transcript.includes('తెలుగు')) {
            handleChooseLanguage('te');
          } else if (transcript.includes('malayalam') || transcript.includes('മലയാളം')) {
            handleChooseLanguage('ml');
          } else if (transcript.includes('english') || transcript.includes('अंग्रेजी')) {
            handleChooseLanguage('en');
          }
        } else if (mode === 'summary') {
          if (
            transcript.includes('yes') ||
            transcript.includes('explain') ||
            transcript.includes('haan') ||
            transcript.includes('हाँ') ||
            transcript.includes('ಹೌದು')
          ) {
            onFinishExplainUrgent();
          } else if (
            transcript.includes('later') ||
            transcript.includes('no') ||
            transcript.includes('बाद') ||
            transcript.includes('ನಂತರ')
          ) {
            onFinishLater();
          }
        }
      };

      rec.onerror = () => setIsListeningStep(false);
      rec.onend = () => setIsListeningStep(false);
      recognitionRef.current = rec;
      rec.start();
      setIsListeningStep(true);
    } catch {
      setIsListeningStep(false);
    }
  };

  if (!isOpen) return null;

  // Step 1 -> Step 2 (First user tap unlocks audio cleanly — never autoplay before tap)
  const handleFirstTap = () => {
    setStep('language');
    onSpeak(t.chooseLanguagePrompt, language);
  };

  // Step 2 -> Step 3
  const handleChooseLanguage = (chosen: AppLanguage) => {
    stopStepMic();
    onSelectLanguage(chosen);
    setStep('summary');
    const nextSummary = buildPersonalSummarySpeech(
      chosen,
      urgentNoticesCount,
      nearestDaysLeft,
      hasCashShortfall,
      formatLocalDate(shortfallDateStr, chosen)
    );
    onSpeak(nextSummary, chosen);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#FDF8EE] overflow-y-auto flex flex-col justify-between p-4 sm:p-8">
      {/* Top Khata Ledger Header Bar */}
      <div className="max-w-2xl w-full mx-auto khata-ledger-header rounded-2xl border border-[#E5D9C3] px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <RupiVantaLogo className="w-11 h-11" />
          <div className="min-w-0">
            <span className="font-extrabold text-xl text-[#1C1917] block leading-tight truncate">
              {t.appName}
            </span>
            <span className="text-base text-[#57534E] block truncate">
              {t.appTagline}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            stopStepMic();
            onStopSpeech();
            onFinishLater();
          }}
          className="min-h-[48px] px-4 py-2 rounded-xl border border-[#D6C5A9] bg-[#FFFDF9] hover:bg-[#F5EBD6] text-[#44403C] text-lg font-semibold inline-flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Clock className="w-5 h-5" />
          <span>{t.laterButton}</span>
        </button>
      </div>

      {/* Center Step Card */}
      <div className="max-w-2xl w-full mx-auto my-auto py-6">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="khata-card rounded-3xl p-6 sm:p-10 text-center space-y-6"
        >
          <div className="flex justify-center">
            <MunimjiAvatar
              size="xl"
              isSpeaking={isSpeaking && !isPaused}
              isListening={isListeningStep}
            />
          </div>

          {/* STEP 1: TAP TO START */}
          {step === 'tap' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C1917] leading-snug">
                  {t.welcomeTitle}
                </h1>
                <p className="text-lg sm:text-xl text-[#44403C] max-w-lg mx-auto leading-relaxed">
                  {t.welcomeSubtitle}
                </p>
              </div>

              <button
                type="button"
                onClick={handleFirstTap}
                className="w-full min-h-[68px] px-6 py-4 rounded-2xl bg-[#14532D] hover:bg-[#166534] text-white text-2xl font-extrabold shadow-md transition-all inline-flex items-center justify-center gap-3 cursor-pointer"
              >
                <Hand className="w-7 h-7 text-[#FDE68A] shrink-0" />
                <span>{t.tapToStart}</span>
              </button>
            </div>
          )}

          {/* STEP 2: CHOOSE LANGUAGE */}
          {step === 'language' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1C1917] leading-snug">
                  {t.chooseLanguagePrompt}
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                {(
                  [
                    { id: 'en', label: 'English', bg: 'bg-[#14532D] hover:bg-[#166534]' },
                    { id: 'kn', label: 'ಕನ್ನಡ', bg: 'bg-[#1E3A8A] hover:bg-[#1E40AF]' },
                    { id: 'hi', label: 'हिन्दी', bg: 'bg-[#C2410C] hover:bg-[#9A3412]' },
                    { id: 'ta', label: 'தமிழ்', bg: 'bg-[#0F766E] hover:bg-[#115E59]' },
                    { id: 'te', label: 'తెలుగు', bg: 'bg-[#7C2D12] hover:bg-[#9A3412]' },
                    { id: 'ml', label: 'മലയാളം', bg: 'bg-[#15803D] hover:bg-[#166534]' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleChooseLanguage(item.id)}
                    className={`min-h-[60px] px-4 py-3.5 rounded-2xl ${item.bg} text-white text-lg sm:text-xl font-bold shadow-xs inline-flex items-center justify-center gap-2 cursor-pointer`}
                  >
                    <Volume2 className="w-5 h-5 text-[#FDE68A] shrink-0" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => startStepVoiceListener('language', language)}
                  className={`min-h-[52px] px-5 py-3 rounded-xl border text-lg font-semibold inline-flex items-center justify-center gap-2.5 cursor-pointer ${
                    isListeningStep
                      ? 'bg-[#FEF3C7] border-[#D97706] text-[#92400E]'
                      : 'bg-[#FAF1DF] border-[#D6C5A9] text-[#1C1917] hover:bg-[#F3E5C8]'
                  }`}
                >
                  <Mic className="w-5 h-5 text-[#C2410C]" />
                  <span>
                    {isListeningStep ? t.listeningSayLang : t.tapMicSayLang}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PERSONAL SPOKEN + LARGE TEXT SUMMARY */}
          {step === 'summary' && (
            <div className="space-y-6 text-left">
              <div className="p-5 sm:p-6 rounded-2xl bg-[#FAF1DF] border border-[#E5D9C3] space-y-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-lg font-bold text-[#9A3412]">
                    {t.munimjiSpeaking}:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onPauseResumeSpeech}
                      className="min-h-[48px] px-4 py-2 rounded-xl bg-[#FFFDF9] border border-[#D6C5A9] text-[#1C1917] text-lg font-semibold inline-flex items-center gap-2 cursor-pointer"
                    >
                      {isPaused ? (
                        <Play className="w-5 h-5" />
                      ) : (
                        <Pause className="w-5 h-5" />
                      )}
                      <span>{isPaused ? t.resumeBtn : t.pauseBtn}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onSpeak(summaryScript, language)}
                      className="min-h-[48px] px-4 py-2 rounded-xl bg-[#FFFDF9] border border-[#D6C5A9] text-[#1C1917] text-lg font-semibold inline-flex items-center gap-2 cursor-pointer"
                    >
                      <RotateCcw className="w-5 h-5" />
                      <span>{t.repeatBtn}</span>
                    </button>
                  </div>
                </div>

                <p className="text-xl sm:text-2xl font-bold text-[#1C1917] leading-relaxed">
                  “{summaryScript}”
                </p>

                {voiceFallbackNotice && (
                  <p className="text-lg text-[#92400E] bg-[#FEF3C7] border border-[#F59E0B]/40 rounded-xl px-4 py-2.5">
                    {voiceFallbackNotice}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    stopStepMic();
                    onFinishExplainUrgent();
                  }}
                  className="min-h-[60px] px-6 py-4 rounded-2xl bg-[#14532D] hover:bg-[#166534] text-white text-xl font-extrabold shadow-md inline-flex items-center justify-center gap-3 cursor-pointer"
                >
                  <CheckCircle2 className="w-6 h-6 text-[#FDE68A] shrink-0" />
                  <span>{t.yesExplainButton}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    stopStepMic();
                    onStopSpeech();
                    onFinishLater();
                  }}
                  className="min-h-[60px] px-6 py-4 rounded-2xl bg-[#FFFDF9] hover:bg-[#F5EBD6] border-2 border-[#D6C5A9] text-[#1C1917] text-xl font-bold inline-flex items-center justify-center gap-3 cursor-pointer"
                >
                  <Clock className="w-6 h-6 text-[#57534E] shrink-0" />
                  <span>{t.laterButton}</span>
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => startStepVoiceListener('summary', language)}
                  className={`min-h-[48px] px-5 py-2.5 rounded-xl border text-lg font-semibold inline-flex items-center justify-center gap-2 cursor-pointer ${
                    isListeningStep
                      ? 'bg-[#FEF3C7] border-[#D97706] text-[#92400E]'
                      : 'bg-[#FFFDF9] border-[#D6C5A9] text-[#44403C]'
                  }`}
                >
                  <Mic className="w-5 h-5 text-[#C2410C]" />
                  <span>
                    {isListeningStep ? t.listeningNow : t.answerByVoiceYesLater}
                  </span>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Bottom Privacy & Reassurance Note */}
      <div className="max-w-2xl w-full mx-auto text-center pb-2">
        <p className="text-base text-[#57534E]">
          {t.privacyMaskedFooter} · {t.guidanceDisclaimer}
        </p>
      </div>
    </div>
  );
};
