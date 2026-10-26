import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Square,
  Sparkles,
  Globe
} from 'lucide-react';
import { AppLanguage } from '../types/munimji';
import { TRANSLATIONS, formatIndianNumber } from '../utils/translations';
import { MunimjiAvatar } from './MunimjiAvatar';

export interface DemoWalkthroughBarProps {
  isActive: boolean;
  stepIndex: number; // 0 to 4
  secondsInStep: number; // 0 to 18
  isPaused: boolean;
  isSpeaking: boolean;
  language: AppLanguage;
  onChangeLanguage: (lang: AppLanguage) => void;
  onSelectStep: (idx: number) => void;
  onTogglePause: () => void;
  onStop: () => void;
}

const STEP_DURATION_SEC = 18;
const TOTAL_STEPS = 5;
const TOTAL_DURATION_SEC = STEP_DURATION_SEC * TOTAL_STEPS; // 90 seconds

export const DemoWalkthroughBar: React.FC<DemoWalkthroughBarProps> = ({
  isActive,
  stepIndex,
  secondsInStep,
  isPaused,
  isSpeaking,
  language,
  onChangeLanguage,
  onSelectStep,
  onTogglePause,
  onStop,
}) => {
  if (!isActive) return null;

  const t = TRANSLATIONS[language];

  const steps = [
    { title: t.demoStep1Title, caption: t.demoStep1Caption },
    { title: t.demoStep2Title, caption: t.demoStep2Caption },
    { title: t.demoStep3Title, caption: t.demoStep3Caption },
    { title: t.demoStep4Title, caption: t.demoStep4Caption },
    { title: t.demoStep5Title, caption: t.demoStep5Caption },
  ];

  const currentStep = steps[stepIndex] || steps[0];
  const totalElapsed = Math.min(
    TOTAL_DURATION_SEC,
    stepIndex * STEP_DURATION_SEC + secondsInStep
  );

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    const remPadded = rem < 10 ? `0${formatIndianNumber(rem, language)}` : formatIndianNumber(rem, language);
    return `${formatIndianNumber(mins, language)}:${remPadded}`;
  };

  return (
    <section
      aria-label={t.demoTitle}
      className="bg-[#14532D] text-[#FFFDF9] border-b-2 border-[#F59E0B] shadow-md"
    >
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3.5 space-y-3">
        {/* Top Row: Title + Step Counter + 90s Timer + Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <Sparkles className="w-5 h-5 text-[#FDE68A] shrink-0" />
            <span className="text-lg font-extrabold text-[#FDE68A] truncate">
              {t.demoTitle}
            </span>
            <span className="px-2.5 py-0.5 rounded-lg bg-[#052E16] text-[#FEF3C7] text-base font-bold shrink-0">
              {t.demoStepCounter(stepIndex + 1, TOTAL_STEPS)}
            </span>
            <span className="font-mono text-base font-bold text-[#DCFCE7] shrink-0">
              {formatTimer(totalElapsed)} / {formatTimer(TOTAL_DURATION_SEC)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onSelectStep(Math.max(0, stepIndex - 1))}
              disabled={stepIndex === 0}
              className="min-h-[48px] px-3 py-2 rounded-xl bg-[#166534] hover:bg-[#15803D] disabled:opacity-40 text-white text-base font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <SkipBack className="w-4 h-4" />
              <span>{t.demoPrevBtn}</span>
            </button>

            <button
              type="button"
              onClick={onTogglePause}
              className="min-h-[48px] px-3.5 py-2 rounded-xl bg-[#FDE68A] hover:bg-[#FCD34D] text-[#1C1917] text-base font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
            >
              {isPaused ? (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>{t.resumeBtn}</span>
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>{t.pauseBtn}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                if (stepIndex < TOTAL_STEPS - 1) {
                  onSelectStep(stepIndex + 1);
                } else {
                  onStop();
                }
              }}
              className="min-h-[48px] px-3 py-2 rounded-xl bg-[#166534] hover:bg-[#15803D] text-white text-base font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>{stepIndex < TOTAL_STEPS - 1 ? t.demoNextBtn : t.doneBtn}</span>
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onStop}
              className="min-h-[48px] px-3.5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-base font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>{t.stopDemoBtn}</span>
            </button>
          </div>
        </div>

        {/* 5-Segment Interactive Progress Bar */}
        <div className="grid grid-cols-5 gap-1.5" role="tablist">
          {steps.map((st, idx) => {
            const isDone = idx < stepIndex;
            const isCurrent = idx === stepIndex;
            return (
              <button
                key={idx}
                type="button"
                role="tab"
                aria-selected={isCurrent}
                onClick={() => onSelectStep(idx)}
                className={`h-3 rounded-full transition-colors cursor-pointer ${
                  isDone
                    ? 'bg-[#FDE68A]'
                    : isCurrent
                    ? 'bg-[#EA580C]'
                    : 'bg-[#052E16]'
                }`}
                title={st.title}
              />
            );
          })}
        </div>

        {/* Munimji Short Caption Card */}
        <div className="rounded-2xl bg-[#FFFDF9] text-[#1C1917] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[#D6C5A9]">
          <div className="flex items-start gap-3">
            <MunimjiAvatar
              size="sm"
              isSpeaking={isSpeaking && !isPaused}
              className="shrink-0 mt-0.5"
            />
            <div className="space-y-0.5">
              <h3 className="text-lg sm:text-xl font-extrabold text-[#14532D]">
                {currentStep.title}
              </h3>
              <p className="text-lg text-[#1C1917] font-medium leading-snug">
                {currentStep.caption}
              </p>
            </div>
          </div>

          {stepIndex === 0 && (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Globe className="w-5 h-5 text-[#14532D] hidden sm:block" />
              {([
                { id: 'en', label: 'EN' },
                { id: 'kn', label: 'ಕನ್ನಡ' },
                { id: 'hi', label: 'हिन्दी' },
                { id: 'ta', label: 'தமிழ்' },
                { id: 'te', label: 'తెలుగు' },
                { id: 'ml', label: 'മലയാളം' },
              ] as const).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChangeLanguage(opt.id)}
                  className={`min-h-[42px] px-3 py-1.5 rounded-xl text-sm font-extrabold cursor-pointer ${
                    language === opt.id
                      ? 'bg-[#14532D] text-white'
                      : 'bg-[#FAF1DF] text-[#1C1917] border border-[#D6C5A9]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
