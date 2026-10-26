import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Check,
  Copy,
  Send,
  Mic,
  Volume2,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { AppLanguage, TrustedPerson } from '../types/munimji';
import { LegalNotice } from '../types/notices';
import {
  TRANSLATIONS,
  buildWhatsAppNoticeMessage,
  getRoleLabel,
  getVantaUIText
} from '../utils/translations';
import { localizePartyName, toNativeDigits } from '../utils/localization';
import { VantaAvatar } from './MunimjiAvatar';

interface WhatsAppNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  notice: LegalNotice | null;
  people: TrustedPerson[];
  initialPersonId?: string;
  businessName: string;
  language: AppLanguage;
  onSpeak: (text: string) => void;
  isSpeaking: boolean;
}

const SPEECH_LANG_MAP: Record<AppLanguage, string> = {
  en: 'en-IN',
  kn: 'kn-IN',
  hi: 'hi-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  ml: 'ml-IN',
};

function extractValid10DigitPhone(raw: string): string | null {
  const digits = String(raw || '').replace(/\D/g, '');
  const clean10 =
    digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
  return /^[6-9]\d{9}$/.test(clean10) ? clean10 : null;
}

export const WhatsAppNoticeModal: React.FC<WhatsAppNoticeModalProps> = ({
  isOpen,
  onClose,
  notice,
  people,
  initialPersonId,
  businessName,
  language,
  onSpeak,
  isSpeaking,
}) => {
  const [selectedPersonId, setSelectedPersonId] = useState<string>('');
  const [messageText, setMessageText] = useState<string>('');
  const [confirmed, setConfirmed] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isListeningYes, setIsListeningYes] = useState<boolean>(false);
  const recRef = useRef<any>(null);

  const t = TRANSLATIONS[language];
  const vt = getVantaUIText(language);

  const activePerson =
    people.find((p) => p.id === selectedPersonId) || people[0] || null;

  useEffect(() => {
    if (!isOpen || !notice) return;
    const defaultTarget =
      people.find((p) => p.id === initialPersonId) ||
      people.find((p) => p.role === 'CA') ||
      people[0];

    const pid = defaultTarget?.id || '';
    setSelectedPersonId(pid);
    setConfirmed(false);
    setCopied(false);

    if (defaultTarget) {
      setMessageText(
        buildWhatsAppNoticeMessage(defaultTarget.name, notice, businessName, language)
      );
    }
  }, [isOpen, notice, initialPersonId, people, businessName, language]);

  useEffect(() => {
    return () => {
      if (recRef.current) {
        try {
          recRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  if (!isOpen || !notice || !activePerson) return null;

  const valid10Phone = extractValid10DigitPhone(activePerson.phone);
  const activeNameLoc = localizePartyName(activePerson.name, language);
  const activePhoneLoc = toNativeDigits(`+91 ${valid10Phone || activePerson.phone}`, language);

  const confirmationSpeechMap: Record<AppLanguage, string> = {
    en: `I have prepared the notice summary and deadline for ${activePerson.name} (+91 ${valid10Phone || activePerson.phone}). It has not been sent yet. Confirm recipient and message first.`,
    kn: `ನಾನು ${activeNameLoc} (${activePhoneLoc}) ಅವರಿಗೆ ನೋಟಿಸ್ ವಿವರ ಮತ್ತು ಕೊನೆಯ ದಿನಾಂಕದ ಸಂದೇಶವನ್ನು ಸಿದ್ಧಪಡಿಸಿದ್ದೇನೆ. ಇನ್ನೂ ಕಳುಹಿಸಿಲ್ಲ. ದಯವಿಟ್ಟು ಮೊದಲು ದೃಢೀಕರಿಸಿ.`,
    hi: `मैंने ${activeNameLoc} (${activePhoneLoc}) के लिए नोटिस का सार और आख़िरी तारीख़ तैयार की है। यह अभी भेजा नहीं गया है। कृपया पहले पुष्टि करें।`,
    ta: `${activeNameLoc} (${activePhoneLoc}) அவர்களுக்கான நோட்டீஸ் சுருக்கம் தயாரிக்கப்பட்டுள்ளது. இன்னும் அனுப்பப்படவில்லை. முதலில் உறுதிப்படுத்தவும்.`,
    te: `${activeNameLoc} (${activePhoneLoc}) కోసం నోటీసు సారాంశం సిద్ధం చేయబడింది. ఇంకా పంపలేదు. దయచేసి ముందుగా ధృవీకరించండి.`,
    ml: `${activeNameLoc} (${activePhoneLoc}) നായുള്ള നോട്ടീസ് സംഗ്രഹം തയ്യാറാക്കിയിട്ടുണ്ട്. ഇതുവരെ അയച്ചിട്ടില്ല. ആദ്യം സ്ഥിരീകരിക്കുക.`,
  };
  const confirmationSpeech = confirmationSpeechMap[language] || confirmationSpeechMap.en;

  const handlePersonChange = (person: TrustedPerson) => {
    setSelectedPersonId(person.id);
    setConfirmed(false);
    setMessageText(
      buildWhatsAppNoticeMessage(person.name, notice, businessName, language)
    );
  };

  const handleConfirmSend = () => {
    if (!valid10Phone || !messageText.trim()) return;
    setConfirmed(true);
    onSpeak(vt.waRecipientConfirmedNote);
  };

  const startYesVoiceListener = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = SPEECH_LANG_MAP[language] || 'en-IN';
      rec.onresult = (e: any) => {
        const spoken = String(e.results?.[0]?.[0]?.transcript || '').toLowerCase();
        setIsListeningYes(false);
        if (
          spoken.includes('yes') ||
          spoken.includes('confirm') ||
          spoken.includes('haan') ||
          spoken.includes('हाँ') ||
          spoken.includes('ಹೌದು') ||
          spoken.includes('ஆம்') ||
          spoken.includes('అవును') ||
          spoken.includes('അതെ')
        ) {
          handleConfirmSend();
        } else if (
          spoken.includes('cancel') ||
          spoken.includes('no') ||
          spoken.includes('रद्द') ||
          spoken.includes('ರದ್ದು') ||
          spoken.includes('வேண்டாம்') ||
          spoken.includes('వద్దు') ||
          spoken.includes('വേണ്ട')
        ) {
          onClose();
        }
      };
      rec.onerror = () => setIsListeningYes(false);
      rec.onend = () => setIsListeningYes(false);
      recRef.current = rec;
      rec.start();
      setIsListeningYes(true);
    } catch {
      setIsListeningYes(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const waUrl = valid10Phone
    ? `https://wa.me/91${valid10Phone}?text=${encodeURIComponent(messageText)}`
    : '#';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#FFFDF9] border-2 border-[#D6C5A9] rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden my-auto">
        {/* Khata Header */}
        <div className="khata-ledger-header px-5 py-4 border-b border-[#E5D9C3] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <VantaAvatar
              size="sm"
              isSpeaking={isSpeaking}
              isListening={isListeningYes}
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-extrabold text-[#1C1917] truncate">
                  {t.sendWhatsApp}
                </h3>
                <span className="px-2.5 py-0.5 rounded-lg bg-amber-100 border border-amber-300 text-amber-950 text-xs font-extrabold">
                  {vt.waStatusPreparedNotSent}
                </span>
              </div>
              <p className="text-base text-[#57534E] truncate">
                {activeNameLoc} · {getRoleLabel(activePerson.role, language)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] px-3.5 py-2 rounded-xl bg-white border border-[#D6C5A9] text-[#1C1917] font-bold text-lg inline-flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
            <span>{t.closeBtn}</span>
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {/* Honest Integration Status Banner */}
          <div className="p-3.5 rounded-2xl bg-[#FAF1DF] border border-[#E5D9C3] flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-[#C2410C] shrink-0 mt-0.5" />
            <p className="text-sm sm:text-base text-[#44403C] leading-snug">
              {vt.waNotConfiguredBanner}
            </p>
          </div>

          {/* Choose Recipient from Contacts (Includes all 4 Showcase Contacts) */}
          <div className="space-y-2">
            <label className="block text-lg font-bold text-[#1C1917]">
              {t.sendToMyPeopleLabel}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {people.map((person) => {
                const isSelected = person.id === activePerson.id;
                const pDigits = extractValid10DigitPhone(person.phone) || person.phone;
                return (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => handlePersonChange(person)}
                    className={`min-h-[52px] px-4 py-2.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-[#14532D] text-white border-[#14532D] shadow-xs'
                        : 'bg-white text-[#1C1917] border-[#D6C5A9] hover:bg-[#FAF1DF]'
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="block text-lg font-bold truncate">
                        {localizePartyName(person.name, language)}
                      </span>
                      <span
                        className={`block text-sm font-mono truncate ${
                          isSelected ? 'text-[#DCFCE7]' : 'text-[#57534E]'
                        }`}
                      >
                        {toNativeDigits(`+91 ${pDigits}`, language)}
                      </span>
                    </div>
                    {isSelected && <Check className="w-5 h-5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {!valid10Phone && (
            <div
              role="alert"
              className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 font-bold text-base"
            >
              {vt.waInvalidPhoneError}
            </div>
          )}

          {/* STEP 1: REVIEW & CONFIRM RECIPIENT + MESSAGE */}
          {!confirmed ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#ECFDF5] border border-[#86EFAC] space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-base font-extrabold text-[#14532D]">
                    {activeNameLoc} · {activePhoneLoc}
                  </span>
                  <button
                    type="button"
                    onClick={() => onSpeak(confirmationSpeech)}
                    className="min-h-[42px] px-3 py-1.5 rounded-xl bg-white border border-[#86EFAC] text-[#14532D] text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>{t.listenMunimji}</span>
                  </button>
                </div>
                <p className="text-base font-semibold text-[#1C1917] leading-snug">
                  “{confirmationSpeech}”
                </p>
              </div>

              <textarea
                rows={5}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="w-full rounded-2xl border border-[#D6C5A9] bg-white p-4 text-lg text-[#1C1917] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#14532D]"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  disabled={!valid10Phone || !messageText.trim()}
                  onClick={handleConfirmSend}
                  className="min-h-[54px] px-5 py-3 rounded-2xl bg-[#15803D] hover:bg-[#166534] disabled:opacity-50 text-white text-base sm:text-lg font-extrabold shadow-xs inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-5 h-5 shrink-0" />
                  <span>{vt.waConfirmRecipientStepBtn}</span>
                </button>

                <button
                  type="button"
                  onClick={startYesVoiceListener}
                  className={`min-h-[54px] px-5 py-3 rounded-2xl border-2 text-lg font-bold inline-flex items-center justify-center gap-2 cursor-pointer ${
                    isListeningYes
                      ? 'bg-[#FEF3C7] border-[#D97706] text-[#92400E]'
                      : 'bg-white border-[#D6C5A9] text-[#1C1917] hover:bg-[#FAF1DF]'
                  }`}
                >
                  <Mic className="w-5 h-5 text-[#C2410C]" />
                  <span>{isListeningYes ? t.listeningNow : t.tapMicBtn}</span>
                </button>
              </div>
            </div>
          ) : (
            /* STEP 2: CONFIRMED — OPEN WHATSAPP OR COPY (NEVER AUTO-SENT) */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#ECFDF5] border-2 border-[#16A34A] space-y-1.5">
                <p className="text-lg font-extrabold text-[#14532D]">
                  {vt.waRecipientConfirmedNote}
                </p>
                <p className="text-sm font-mono text-[#44403C]">
                  {activeNameLoc} · {toNativeDigits(`+91 ${valid10Phone}`, language)}
                </p>
              </div>

              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-h-[58px] px-6 py-3.5 rounded-2xl bg-[#15803D] hover:bg-[#166534] text-white text-lg sm:text-xl font-extrabold shadow-xs inline-flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Send className="w-5 h-5" />
                <span>{t.openWhatsAppPressSend}</span>
                <ExternalLink className="w-5 h-5" />
              </a>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="min-h-[50px] px-4 py-2.5 rounded-2xl bg-white border border-[#D6C5A9] text-[#1C1917] text-lg font-bold inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-[#15803D]" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                  <span>{copied ? t.copiedBtn : t.copyMessageBtn}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setConfirmed(false)}
                  className="min-h-[50px] px-4 py-2.5 rounded-2xl bg-white border border-[#D6C5A9] text-[#1C1917] text-lg font-bold inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{t.cancelBtn}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
