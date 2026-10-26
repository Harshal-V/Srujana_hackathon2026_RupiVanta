import React, { useState, useRef } from 'react';
import {
  Users,
  Plus,
  Mic,
  MessageSquare,
  Phone,
  Trash2,
  Check,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import { AppLanguage, PersonRole, TrustedPerson } from '../types/munimji';
import { TRANSLATIONS, getRoleLabel, getVantaUIText } from '../utils/translations';

interface MyPeopleSectionProps {
  people: TrustedPerson[];
  onAddPerson: (person: Omit<TrustedPerson, 'id'>) => void;
  onRemovePerson: (id: string) => void;
  onSendNoticeToPerson: (personId: string) => void;
  language: AppLanguage;
  onSpeak: (text: string) => void;
}

const SHOWCASE_NUMBERS = new Set([
  '9109230036',
  '8147246735',
  '9019824803',
  '9535577897',
]);

function normalizeValidIndianMobile(raw: string): string | null {
  const digits = String(raw || '').replace(/\D/g, '');
  const clean10 =
    digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
  if (/^[6-9]\d{9}$/.test(clean10)) {
    return clean10;
  }
  return null;
}

const SPEECH_LANG_MAP: Record<AppLanguage, string> = {
  en: 'en-IN',
  kn: 'kn-IN',
  hi: 'hi-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  ml: 'ml-IN',
};

export const MyPeopleSection: React.FC<MyPeopleSectionProps> = ({
  people,
  onAddPerson,
  onRemovePerson,
  onSendNoticeToPerson,
  language,
  onSpeak,
}) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState<PersonRole>('CA');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isVoiceAdding, setIsVoiceAdding] = useState(false);
  const [voiceHint, setVoiceHint] = useState<string | null>(null);
  const recRef = useRef<any>(null);

  const t = TRANSLATIONS[language];
  const vt = getVantaUIText(language);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError(null);
    if (!name.trim()) return;

    const clean10 = normalizeValidIndianMobile(phone);
    if (!clean10) {
      setPhoneError(vt.waInvalidPhoneError);
      return;
    }

    onAddPerson({
      name: name.trim(),
      role,
      phone: clean10,
    });
    onSpeak(t.voiceAddedConfirmed(name.trim()));
    setName('');
    setPhone('');
    setShowAddForm(false);
    setVoiceHint(null);
  };

  const handleStartVoiceAdd = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    setShowAddForm(true);
    setPhoneError(null);
    if (!SpeechRecognition) {
      setVoiceHint(t.micUnsupportedNote);
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = SPEECH_LANG_MAP[language] || 'en-IN';
      setVoiceHint(t.voiceAddPrompt);

      rec.onresult = (event: any) => {
        const transcript = String(event.results?.[0]?.[0]?.transcript || '').trim();
        setIsVoiceAdding(false);
        if (!transcript) return;

        const digits = transcript.replace(/[^0-9]/g, '');
        if (digits.length >= 10) {
          setPhone(digits.slice(-10));
        }

        const lower = transcript.toLowerCase();
        if (
          lower.includes('lawyer') ||
          lower.includes('advocate') ||
          lower.includes('वकील') ||
          lower.includes('ವಕೀಲ') ||
          lower.includes('வழக்கறிஞர்') ||
          lower.includes('న్యాయవాది') ||
          lower.includes('അഭിഭാഷകൻ')
        ) {
          setRole('Lawyer');
        } else if (
          lower.includes('accountant') ||
          lower.includes('कंप्यूटर') ||
          lower.includes('ಅಕೌಂಟೆಂಟ್') ||
          lower.includes('கணக்காளர்') ||
          lower.includes('అకౌంటెంట్') ||
          lower.includes('അക്കൗണ്ടന്റ്')
        ) {
          setRole('Accountant');
        } else if (
          lower.includes('family') ||
          lower.includes('wife') ||
          lower.includes('son') ||
          lower.includes('परिवार') ||
          lower.includes('ಕುಟುಂಬ') ||
          lower.includes('குடும்பம்') ||
          lower.includes('కుటుంబం') ||
          lower.includes('കുടുംബം')
        ) {
          setRole('Family');
        } else if (lower.includes('ca')) {
          setRole('CA');
        }

        const cleanedName = transcript
          .replace(/[0-9+\-\s]{6,}/g, '')
          .replace(/\b(accountant|lawyer|advocate|family|phone|number|mobile|ca)\b/gi, '')
          .trim();

        if (cleanedName) {
          setName(cleanedName);
        }
        setVoiceHint(`${t.youAskedLabel}: "${transcript}"`);
      };

      rec.onerror = () => setIsVoiceAdding(false);
      rec.onend = () => setIsVoiceAdding(false);
      recRef.current = rec;
      rec.start();
      setIsVoiceAdding(true);
    } catch {
      setIsVoiceAdding(false);
    }
  };

  return (
    <section className="khata-card rounded-3xl overflow-hidden">
      <div className="khata-ledger-header px-5 sm:px-6 py-5 border-b border-[#E5D9C3] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#14532D] text-white flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#1C1917]">
              {t.myPeopleTitle}
            </h2>
            <p className="text-lg text-[#57534E]">{t.myPeopleSubtitle}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setPhoneError(null);
              setShowAddForm(!showAddForm);
            }}
            className="min-h-[50px] px-4 py-2.5 rounded-2xl bg-[#14532D] hover:bg-[#166534] text-white text-lg font-bold inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>{t.addPersonBtn}</span>
          </button>

          <button
            type="button"
            onClick={handleStartVoiceAdd}
            className={`min-h-[50px] px-4 py-2.5 rounded-2xl border-2 text-lg font-bold inline-flex items-center gap-2 cursor-pointer ${
              isVoiceAdding
                ? 'bg-[#FEF3C7] border-[#D97706] text-[#92400E]'
                : 'bg-white border-[#D6C5A9] text-[#1C1917] hover:bg-[#FAF1DF]'
            }`}
          >
            <Mic className="w-5 h-5 text-[#C2410C]" />
            <span>{isVoiceAdding ? t.listeningNow : t.addByVoiceBtn}</span>
          </button>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        {showAddForm && (
          <form
            onSubmit={handleSave}
            className="p-5 rounded-2xl bg-[#FAF1DF] border border-[#D6C5A9] space-y-4"
          >
            {voiceHint && (
              <p className="text-lg font-semibold text-[#92400E] bg-white px-4 py-2.5 rounded-xl border border-[#E5D9C3]">
                {voiceHint}
              </p>
            )}
            {phoneError && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 font-bold text-base flex items-center gap-2"
              >
                <AlertCircle className="w-5 h-5 text-rose-700 shrink-0" />
                <span>{phoneError}</span>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-lg font-bold text-[#1C1917] mb-1">
                  {t.personNameLabel}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.personNamePlaceholder}
                  className="w-full min-h-[50px] px-4 py-2.5 rounded-xl bg-white border border-[#CBBBA0] text-lg text-[#1C1917]"
                />
              </div>

              <div>
                <label className="block text-lg font-bold text-[#1C1917] mb-1">
                  {t.personRoleLabel}
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as PersonRole)}
                  className="w-full min-h-[50px] px-4 py-2.5 rounded-xl bg-white border border-[#CBBBA0] text-lg text-[#1C1917]"
                >
                  <option value="CA">{getRoleLabel('CA', language)}</option>
                  <option value="Accountant">{getRoleLabel('Accountant', language)}</option>
                  <option value="Lawyer">{getRoleLabel('Lawyer', language)}</option>
                  <option value="Family">{getRoleLabel('Family', language)}</option>
                  <option value="Other">{getRoleLabel('Other', language)}</option>
                </select>
              </div>

              <div>
                <label className="block text-lg font-bold text-[#1C1917] mb-1">
                  {t.personPhoneLabel}
                </label>
                <input
                  type="tel"
                  required
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (phoneError) setPhoneError(null);
                  }}
                  placeholder="9845012345"
                  className="w-full min-h-[50px] px-4 py-2.5 rounded-xl bg-white border border-[#CBBBA0] text-lg font-mono text-[#1C1917]"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="min-h-[50px] px-5 py-2.5 rounded-xl bg-[#14532D] hover:bg-[#166534] text-white text-lg font-bold inline-flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-5 h-5" />
                <span>{t.addPersonBtn}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setPhoneError(null);
                }}
                className="min-h-[50px] px-4 py-2.5 rounded-xl bg-white border border-[#CBBBA0] text-[#44403C] text-lg font-bold inline-flex items-center gap-2 cursor-pointer"
              >
                <span>{t.cancelBtn}</span>
              </button>
            </div>
          </form>
        )}

        {/* People Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {people.map((person) => {
            const cleanDigits = person.phone.replace(/\D/g, '').slice(-10);
            const isShowcase =
              person.id.startsWith('person-') || SHOWCASE_NUMBERS.has(cleanDigits);
            return (
              <div
                key={person.id}
                className="p-5 rounded-2xl bg-white border border-[#E5D9C3] flex flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-extrabold text-[#1C1917]">
                        {person.name}
                      </h3>
                      {isShowcase && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-bold text-[#14532D]">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{vt.showcaseContactsBadge}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-lg font-medium text-[#14532D]">
                      {getRoleLabel(person.role, language)}
                    </p>
                    <p className="text-lg font-mono text-[#57534E] flex items-center gap-2 mt-1">
                      <Phone className="w-4 h-4 shrink-0" />
                      <span>+91 {cleanDigits || person.phone}</span>
                    </p>
                  </div>

                  {!isShowcase && (
                    <button
                      type="button"
                      onClick={() => onRemovePerson(person.id)}
                      className="min-h-[48px] px-3 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 inline-flex items-center gap-1.5 text-base font-semibold cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>{t.removeBtn}</span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onSendNoticeToPerson(person.id)}
                  className="w-full min-h-[52px] px-4 py-3 rounded-2xl bg-[#15803D] hover:bg-[#166534] text-white text-lg font-bold inline-flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>{t.sendWhatsApp}</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Honest WhatsApp Integration Disclosure (Never Auto-Sends) */}
        <div className="p-4 rounded-2xl bg-[#FAF1DF] border border-[#E5D9C3] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-base font-extrabold text-[#14532D] block">
              {vt.waStatusPreparedNotSent}
            </span>
            <p className="text-base text-[#57534E] flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-[#C2410C] shrink-0 mt-0.5" />
              <span>{vt.waNotConfiguredBanner}</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
