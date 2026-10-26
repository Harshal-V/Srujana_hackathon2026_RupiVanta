import React from 'react';
import {
  Mic,
  Volume2,
  Languages,
  RotateCcw,
  MessageSquare,
  Check
} from 'lucide-react';
import { AppLanguage, TrustedPerson } from '../types/munimji';
import { TRANSLATIONS, getLocalizedVoicePrompts } from '../utils/translations';
import { MunimjiAvatar } from './MunimjiAvatar';
import { MyPeopleSection } from './MyPeopleSection';

interface HelpScreenProps {
  language: AppLanguage;
  onChangeLanguage: (lang: AppLanguage) => void;
  isSpeaking: boolean;
  isListening: boolean;
  onPressMic: () => void;
  onRunVoiceCommand: (cmd: string) => void;
  onReplayWelcome: () => void;
  people: TrustedPerson[];
  onAddPerson: (person: Omit<TrustedPerson, 'id'>) => void;
  onRemovePerson: (id: string) => void;
  onSendNoticeToPerson: (personId: string) => void;
  onSpeak: (text: string) => void;
}

export const HelpScreen: React.FC<HelpScreenProps> = ({
  language,
  onChangeLanguage,
  isSpeaking,
  isListening,
  onPressMic,
  onRunVoiceCommand,
  onReplayWelcome,
  people,
  onAddPerson,
  onRemovePerson,
  onSendNoticeToPerson,
  onSpeak,
}) => {
  const t = TRANSLATIONS[language];
  const examplePrompts = getLocalizedVoicePrompts(language);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Munimji Help & Language Card */}
      <section className="khata-card rounded-3xl overflow-hidden">
        <div className="khata-ledger-header px-5 sm:px-6 py-5 border-b border-[#E5D9C3] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <MunimjiAvatar
              size="lg"
              isSpeaking={isSpeaking}
              isListening={isListening}
            />
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C1917]">
                {t.helpTitle}
              </h1>
              <p className="text-lg text-[#57534E]">{t.helpSubtitle}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onReplayWelcome}
            className="min-h-[50px] px-4 py-2.5 rounded-2xl bg-white border border-[#D6C5A9] text-[#1C1917] text-lg font-bold inline-flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-5 h-5 text-[#C2410C]" />
            <span>{t.replayWelcomeBtn}</span>
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          {/* Language Switcher */}
          <div className="space-y-2.5">
            <h2 className="text-xl font-extrabold text-[#1C1917] flex items-center gap-2">
              <Languages className="w-6 h-6 text-[#14532D]" />
              <span>{t.chooseYourLanguageTitle}</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(
                [
                  { id: 'en', label: 'English' },
                  { id: 'kn', label: 'ಕನ್ನಡ' },
                  { id: 'hi', label: 'हिन्दी' },
                  { id: 'ta', label: 'தமிழ்' },
                  { id: 'te', label: 'తెలుగు' },
                  { id: 'ml', label: 'മലയാളം' },
                ] as const
              ).map((item) => {
                const active = language === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onChangeLanguage(item.id)}
                    className={`min-h-[54px] px-5 py-3 rounded-2xl border-2 text-xl font-bold inline-flex items-center justify-center gap-2.5 cursor-pointer ${
                      active
                        ? 'bg-[#14532D] border-[#14532D] text-white'
                        : 'bg-white border-[#D6C5A9] text-[#1C1917] hover:bg-[#FAF1DF]'
                    }`}
                  >
                    {active ? (
                      <Check className="w-6 h-6 text-[#FDE68A]" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Voice Commands You Can Say or Tap */}
          <div className="space-y-3 pt-2 border-t border-[#EFE6D5]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-xl font-extrabold text-[#1C1917]">
                {t.thingsYouCanSayTitle}
              </h2>
              <button
                type="button"
                onClick={onPressMic}
                className="min-h-[50px] px-5 py-2.5 rounded-2xl bg-[#C2410C] hover:bg-[#9A3412] text-white text-lg font-extrabold inline-flex items-center gap-2 cursor-pointer"
              >
                <Mic className="w-5 h-5 text-[#FDE68A]" />
                <span>{t.tapMicBtn}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {examplePrompts.map((item) => (
                <button
                  key={item.cmd}
                  type="button"
                  onClick={() => onRunVoiceCommand(item.cmd)}
                  className="min-h-[52px] px-4 py-3 rounded-2xl bg-[#FAF1DF] hover:bg-[#F3E5C8] border border-[#D6C5A9] text-left text-lg font-bold text-[#1C1917] inline-flex items-center gap-3 cursor-pointer"
                >
                  {item.cmd.includes('Ramesh') ? (
                    <MessageSquare className="w-5 h-5 text-[#15803D] shrink-0" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-[#C2410C] shrink-0" />
                  )}
                  <span>“{item.label}”</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* My People WhatsApp Contacts Manager */}
      <MyPeopleSection
        people={people}
        onAddPerson={onAddPerson}
        onRemovePerson={onRemovePerson}
        onSendNoticeToPerson={onSendNoticeToPerson}
        language={language}
        onSpeak={onSpeak}
      />
    </div>
  );
};
