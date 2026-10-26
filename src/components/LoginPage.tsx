import React, { useState } from 'react';
import {
  Phone,
  Store,
  ArrowRight,
  AlertCircle,
  Globe,
  Mic,
  Calendar,
  Database,
  ShieldCheck,
} from 'lucide-react';
import { RupiVantaLogo } from './RupiVantaLogo';
import { AppLanguage } from '../types/munimji';
import {
  TRANSLATIONS,
  formatHeaderDate,
  getPredictiveFinanceText,
} from '../utils/translations';
import {
  fromNativeDigits,
  localizeBusinessLabel,
  toNativeDigits,
} from '../utils/localization';
import { ANCHOR_DATE } from '../data/initialData';

export interface AuthSessionInfo {
  workspaceId: string;
  isDemo: boolean;
  phone?: string;
  shopName: string;
}

interface LoginPageProps {
  onLoginSuccess: (session: AuthSessionInfo) => void;
  language: AppLanguage;
  onLanguageChange: (lang: AppLanguage) => void;
}

export const DEFAULT_KHATA_PASSWORD = 'Vanta@2026';

const DEMO_ACCOUNTS: Array<{
  workspaceId: string;
  canonicalName: string;
  subtitleByLang: Record<AppLanguage, string>;
}> = [
  {
    workspaceId: 'demo-sharma',
    canonicalName: 'Sharma Stores [Demo]',
    subtitleByLang: {
      en: 'Spice Wholesale · 6 Sample Customers (Overdue, Part Paid, New & Early Promise)',
      kn: 'ಮಸಾಲೆ ಸಗಟು ಅಂಗಡಿ · ೬ ಮಾದರಿ ಗ್ರಾಹಕರು (ಬಾಕಿ, ಭಾಗಶಃ ಪಾವತಿ, ಹೊಸ ಮತ್ತು ಬೇಗ ಭರವಸೆ)',
      hi: 'मसाला थोक व्यापार · ६ नमूना ग्राहक (बकाया, आंशिक भुगतान, नए व जल्दी वादा)',
      ta: 'மசாலா மொத்த வியாபாரம் · ௬ மாதிரி வாடிக்கையாளர்கள் (தாமதம், பகுதி வரவு, புதியவர்)',
      te: 'మసాలా హోల్‌సేల్ · ౬ నమూనా కస్టమర్లు (బకాయి, పాక్షిక చెల్లింపు, కొత్త & ముందస్తు మాట)',
      ml: 'മസാല മൊത്തവ്യാപാരം · ൬ മാതൃകാ ഇടപാടുകാർ (കുടിശ്ശിക, ഭാഗികം, പുതിയവർ)',
    },
  },
  {
    workspaceId: 'demo-venkateshwara',
    canonicalName: 'Venkateshwara Traders [Demo]',
    subtitleByLang: {
      en: 'Grain Distributor · Bank Credit & Market Procurement Sample Records',
      kn: 'ಧಾನ್ಯ ವಿತರಕರು · ಬ್ಯಾಂಕ್ ಜಮಾ ಮತ್ತು ಮಾರುಕಟ್ಟೆ ಖರೀದಿ ಮಾದರಿ ದಾಖಲೆಗಳು',
      hi: 'अनाज वितरक · बैंक जमा और मंडी खरीद नमूना रिकॉर्ड',
      ta: 'தானிய விநியோகஸ்தர் · வங்கி வரவு மற்றும் கொள்முதல் மாதிரி பதிவுகள்',
      te: 'ధాన్యం పంపిణీదారులు · బ్యాంక్ జమ మరియు మార్కెట్ కొనుగోలు నమూనా రికార్డులు',
      ml: 'ധാന്യ വിതരണക്കാർ · ബാങ്ക് വരവും മാർക്കറ്റ് വാങ്ങലും മാതൃകാ രേഖകൾ',
    },
  },
  {
    workspaceId: 'demo-nandi',
    canonicalName: 'Nandi Logistics & Supplies [Demo]',
    subtitleByLang: {
      en: 'Packaging & Transport · Monthly Contract Sample Records',
      kn: 'ಪ್ಯಾಕೇಜಿಂಗ್ ಮತ್ತು ಸಾರಿಗೆ · ಮಾಸಿಕ ಒಪ್ಪಂದದ ಮಾದರಿ ದಾಖಲೆಗಳು',
      hi: 'पैकेजिंग और ट्रांसपोर्ट · मासिक अनुबंध नमूना रिकॉर्ड',
      ta: 'பேக்கேஜிங் மற்றும் போக்குவரத்து · மாதாந்திர ஒப்பந்த மாதிரி பதிவுகள்',
      te: 'ప్యాకేజింగ్ & రవాణా · నెలవారీ ఒప్పంద నమూనా రికార్డులు',
      ml: 'പാക്കേജിംഗ് & ട്രാൻസ്പോർട്ട് · പ്രതിമാസ കരാർ മാതൃകാ രേഖകൾ',
    },
  },
];

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  language,
  onLanguageChange,
}) => {
  const [accountType, setAccountType] = useState<'demo' | 'real'>('demo');
  const [selectedDemoId, setSelectedDemoId] = useState<string>('demo-sharma');
  const [identityMode, setIdentityMode] = useState<'phone' | 'shop'>('phone');
  const [phone, setPhone] = useState('9845012345');
  const [shopName, setShopName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const t = TRANSLATIONS[language];
  const pf = getPredictiveFinanceText(language);

  const labels: Record<
    AppLanguage,
    {
      brandSubtitle: string;
      tagline: string;
      cardHeading: string;
      tabPhone: string;
      tabShop: string;
      phoneLabel: string;
      shopLabel: string;
      shopPlaceholder: string;
      defaultRealShop: string;
      loginBtnReal: string;
      loginBtnDemo: string;
      voiceReadyNote: string;
      invalidPhoneErr: string;
      emptyShopErr: string;
      realLedgerTab: string;
      demoLedgerTab: string;
      realIsolationNote: string;
      demoIsolationNote: string;
    }
  > = {
    en: {
      brandSubtitle: 'Cash Command Center & Smart Shop Finance',
      tagline:
        'See 7, 30 & 90-day cash forecasts, estimate customer payment dates from past payment habits, compare promised vs expected dates, and manage bills & notices.',
      cardHeading: 'Open Your Business Khata',
      tabPhone: 'Mobile Number',
      tabShop: 'Shop Name',
      phoneLabel: 'Indian Mobile Number',
      shopLabel: 'Your Real Shop / Business Name',
      shopPlaceholder: 'e.g. Lakshmi General Stores',
      defaultRealShop: 'My Real Business Ledger',
      loginBtnReal: 'Open My Real Business Ledger',
      loginBtnDemo: 'Open Selected [Demo] Shop',
      voiceReadyNote:
        'Voice Assistant opens right after sign-in (supports English & ಕನ್ನಡ Kannada).',
      invalidPhoneErr: 'Please enter a valid 10-digit Indian mobile number.',
      emptyShopErr: 'Please enter your shop or business name.',
      realLedgerTab: 'My Real Ledger',
      demoLedgerTab: 'Demo Shops [Sample]',
      realIsolationNote:
        'Real Ledger starts clean and private — zero sample demo transactions are mixed into your records.',
      demoIsolationNote:
        'Clearly marked sample accounts with past customer payment histories to explore pattern-based forecasts.',
    },
    kn: {
      brandSubtitle: 'ನಗದು ನಿರ್ವಹಣೆ ಮತ್ತು ಸರಳ ವ್ಯಾಪಾರ ಹಣಕಾಸು ವಿಶ್ಲೇಷಣೆ',
      tagline:
        '೭, ೩೦ ಮತ್ತು ೯೦ ದಿನಗಳ ನಗದು ಹರಿವು, ಹಿಂದಿನ ಪಾವತಿ ಅಭ್ಯಾಸದಿಂದ ಹಣ ಬರುವ ಅಂದಾಜು ದಿನಾಂಕ, ಭರವಸೆ ದಿನಾಂಕ ಹೋಲಿಕೆ ಮತ್ತು ಬಿಲ್‌ಗಳನ್ನು ಸುಲಭವಾಗಿ ನಿರ್ವಹಿಸಿ.',
      cardHeading: 'ನಿಮ್ಮ ವ್ಯಾಪಾರ ಖಾತೆಯನ್ನು ತೆರೆಯಿರಿ',
      tabPhone: 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ',
      tabShop: 'ಅಂಗಡಿಯ ಹೆಸರು',
      phoneLabel: 'ಭಾರತೀಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ',
      shopLabel: 'ನಿಮ್ಮ ನೈಜ ಅಂಗಡಿ / ವ್ಯಾಪಾರದ ಹೆಸರು',
      shopPlaceholder: 'ಉದಾ: ಲಕ್ಷ್ಮಿ ಜನರಲ್ ಸ್ಟೋರ್ಸ್',
      defaultRealShop: 'ನನ್ನ ನೈಜ ವ್ಯಾಪಾರ ಖಾತೆ',
      loginBtnReal: 'ನನ್ನ ನೈಜ ಖಾತೆಯನ್ನು ತೆರೆಯಿರಿ',
      loginBtnDemo: 'ಆಯ್ಕೆ ಮಾಡಿದ [ಡೆಮೊ] ಖಾತೆ ತೆರೆಯಿರಿ',
      voiceReadyNote:
        'ಲಾಗಿನ್ ಆದ ತಕ್ಷಣ ಧ್ವನಿ ಸಹಾಯಕ ತೆರೆಯುತ್ತದೆ (ಇಂಗ್ಲಿಷ್ ಮತ್ತು ಕನ್ನಡ ಮಾತ್ರ ಬೆಂಬಲಿಸುತ್ತದೆ).',
      invalidPhoneErr: 'ದಯವಿಟ್ಟು ಸರಿಯಾದ ೧೦ ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ.',
      emptyShopErr: 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಅಂಗಡಿಯ ಹೆಸರನ್ನು ನಮೂದಿಸಿ.',
      realLedgerTab: 'ನನ್ನ ನೈಜ ಖಾತೆ',
      demoLedgerTab: 'ಡೆಮೊ ಖಾತೆಗಳು [ಮಾದರಿ]',
      realIsolationNote:
        'ನೈಜ ಖಾತೆಯು ಸಂಪೂರ್ಣ ಪ್ರತ್ಯೇಕವಾಗಿದೆ — ಯಾವುದೇ ಮಾದರಿ ಡೆಮೊ ದಾಖಲೆಗಳನ್ನು ಇದರಲ್ಲಿ ಬೆರೆಸಲಾಗುವುದಿಲ್ಲ.',
      demoIsolationNote:
        'ಗ್ರಾಹಕರ ಹಿಂದಿನ ಪಾವತಿ ಅಭ್ಯಾಸದ ವಿಶ್ಲೇಷಣೆಯನ್ನು ನೋಡಲು ಸ್ಪಷ್ಟವಾಗಿ ಗುರುತಿಸಲಾದ ಮಾದರಿ ಡೆಮೊ ಖಾತೆಗಳು.',
    },
    hi: {
      brandSubtitle: 'नगद प्रबंधन और सरल व्यापार वित्तीय समझ',
      tagline:
        '७, ३० और ९० दिन का नकद अनुमान, पिछले भुगतान पैटर्न से पैसा आने की तारीख़, वादा बनाम अनुमानित तारीख़ और बिल प्रबंधन।',
      cardHeading: 'अपना व्यापार खाता खोलें',
      tabPhone: 'मोबाइल नंबर',
      tabShop: 'दुकान का नाम',
      phoneLabel: 'भारतीय मोबाइल नंबर',
      shopLabel: 'आपकी असली दुकान / व्यापार का नाम',
      shopPlaceholder: 'जैसे: लक्ष्मी जनरल स्टोर्स',
      defaultRealShop: 'मेरा असली व्यापार खाता',
      loginBtnReal: 'मेरा असली व्यापार खाता खोलें',
      loginBtnDemo: 'चुना गया [डेमो] खाता खोलें',
      voiceReadyNote:
        'लॉगिन के तुरंत बाद वॉइस सहायक खुलता है (केवल अंग्रेज़ी और कन्नड़ में उपलब्ध)।',
      invalidPhoneErr: 'कृपया मान्य १० अंकों का मोबाइल नंबर दर्ज करें।',
      emptyShopErr: 'कृपया अपनी दुकान का नाम दर्ज करें।',
      realLedgerTab: 'असली खाता',
      demoLedgerTab: 'डेमो खाते [नमूना]',
      realIsolationNote:
        'असली खाता बिल्कुल साफ़ और अलग रहता है — इसमें कोई भी नमूना डेमो रिकॉर्ड नहीं मिलाया जाता।',
      demoIsolationNote:
        'पिछले भुगतान पैटर्न के अनुमान और नकदी सलाह परखने के लिए स्पष्ट रूप से चिह्नित नमूना डेमो खाते।',
    },
    ta: {
      brandSubtitle: 'பண நிர்வாகம் மற்றும் எளிய வணிக நிதி வழிகாட்டி',
      tagline:
        '௭, ௩௦ & ௯௦ நாள் பணப்புழக்க கணிப்பு, கடந்த பழக்கத்தின் அடிப்படையில் பணம் வரும் தேதி மற்றும் பில் மேலாண்மை.',
      cardHeading: 'உங்கள் வணிகக் கணக்கைத் திறக்கவும்',
      tabPhone: 'மொபைல் எண்',
      tabShop: 'கடையின் பெயர்',
      phoneLabel: 'இந்திய மொபைல் எண்',
      shopLabel: 'உங்கள் உண்மையான கடையின் பெயர்',
      shopPlaceholder: 'எ.கா: லட்சுமி ஸ்டோர்ஸ்',
      defaultRealShop: 'எனது உண்மை வணிகக் கணக்கு',
      loginBtnReal: 'என் உண்மைக் கணக்கைத் திறக்கவும்',
      loginBtnDemo: '[டெமோ] மாதிரி கணக்கைத் திறக்கவும்',
      voiceReadyNote:
        'உள்நுழைந்தவுடன் குரல் உதவியாளர் திறக்கும் (ஆங்கிலம் மற்றும் கன்னடம் மட்டுமே ஆதரிக்கப்படுகிறது).',
      invalidPhoneErr: 'சரியான ௧௦ இலக்க மொபைல் எண்ணை உள்ளிடவும்.',
      emptyShopErr: 'உங்கள் கடையின் பெயரை உள்ளிடவும்.',
      realLedgerTab: 'உண்மைக் கணக்கு',
      demoLedgerTab: 'டெமோ கணக்குகள் [மாதிரி]',
      realIsolationNote:
        'உண்மைக் கணக்கு தனியாகப் பாதுகாக்கப்படுகிறது — மாதிரி தரவுகள் கலக்கப்படாது.',
      demoIsolationNote:
        'கடந்த பில் பழக்கத்தின் கணிப்புகளைச் சோதிக்கத் தெளிவாகக் குறிக்கப்பட்ட மாதிரி வணிகக் கணக்குகள்.',
    },
    te: {
      brandSubtitle: 'నగదు నిర్వహణ & సులభ వ్యాపార ఆర్థిక విశ్లేషణ',
      tagline:
        '౭, ౩౦ & ౯౦ రోజుల నగదు అంచనా, గత చెల్లింపు అలవాటు ఆధారంగా డబ్బు వచ్చే తేదీ మరియు బిల్లుల నిర్వహణ.',
      cardHeading: 'మీ వ్యాపార ఖాతాను తెరవండి',
      tabPhone: 'మొబైల్ నంబర్',
      tabShop: 'దుకాణం పేరు',
      phoneLabel: 'భారతీయ మొబైల్ నంబర్',
      shopLabel: 'మీ నిజమైన దుకాణం / వ్యాపారం పేరు',
      shopPlaceholder: 'ఉదా: లక్ష్మి జనరల్ స్టోర్స్',
      defaultRealShop: 'నా నిజమైన వ్యాపార ఖాతా',
      loginBtnReal: 'నా నిజమైన ఖాతాను తెరవండి',
      loginBtnDemo: '[డెమో] నమూనా ఖాతాను తెరవండి',
      voiceReadyNote:
        'లాగిన్ అయిన వెంటనే వాయిస్ అసిస్టెంట్ తెరుచుకుంటుంది (ఇంగ్లీష్ & కన్నడ మాత్రమే).',
      invalidPhoneErr: 'దయచేసి సరైన ౧౦ అంకెల మొబైల్ నంబర్ నమోదు చేయండి.',
      emptyShopErr: 'దయచేసి మీ దుకాణం పేరు నమోదు చేయండి.',
      realLedgerTab: 'నిజమైన ఖాతా',
      demoLedgerTab: 'డెమో ఖాతాలు [నమూనా]',
      realIsolationNote:
        'నిజమైన ఖాతా పూర్తిగా వేరుగా ఉంటుంది — నమూనా రికార్డులు కలపబడవు.',
      demoIsolationNote:
        'గత చెల్లింపు అలవాటు అంచనాలను చూడటానికి స్పష్టంగా గుర్తించబడిన నమూనా వ్యాపార ఖాతాలు.',
    },
    ml: {
      brandSubtitle: 'പണ നിയന്ത്രണവും ലളിതമായ ബിസിനസ് സാമ്പത്തിക സഹായിയും',
      tagline:
        '൭, ൩൦, ൯൦ ദിവസത്തെ പണനില, മുൻകാല പേയ്‌മെന്റ് ശീലമനുസരിച്ചുള്ള തീയതി കണക്കുകൂട്ടൽ, ബിൽ മാനേജ്‌മെന്റ് എന്നിവ.',
      cardHeading: 'നിങ്ങളുടെ ബിസിനസ് കണക്ക് തുറക്കുക',
      tabPhone: 'മൊബൈൽ നമ്പർ',
      tabShop: 'കടയുടെ പേര്',
      phoneLabel: 'ഇന്ത്യൻ മൊബൈൽ നമ്പർ',
      shopLabel: 'നിങ്ങളുടെ യഥാർത്ഥ കടയുടെ പേര്',
      shopPlaceholder: 'ഉദാ: ലക്ഷ്മി ജനറൽ സ്റ്റോഴ്സ്',
      defaultRealShop: 'എന്റെ യഥാർത്ഥ ബിസിനസ് കണക്ക്',
      loginBtnReal: 'എന്റെ യഥാർത്ഥ കണക്ക് തുറക്കുക',
      loginBtnDemo: '[ഡെമോ] മാതൃകാ കണക്ക് തുറക്കുക',
      voiceReadyNote:
        'ലോഗിൻ ചെയ്ത ഉടൻ വോയ്‌സ് അസിസ്റ്റന്റ് തുറക്കുന്നു (ഇംഗ്ലീഷ്, കന്നഡ ഭാഷകൾ മാത്രം).',
      invalidPhoneErr: 'സാധുവായ ൧൦ അക്ക മൊബൈൽ നമ്പർ നൽകുക.',
      emptyShopErr: 'നിങ്ങളുടെ കടയുടെ പേര് നൽകുക.',
      realLedgerTab: 'യഥാർത്ഥ കണക്ക്',
      demoLedgerTab: 'ഡെമോ കണക്കുകൾ [മാതൃക]',
      realIsolationNote:
        'യഥാർത്ഥ കണക്ക് പൂർണ്ണമായും വേറിട്ടതാണ് — മാതൃകാ ഡെമോ രേഖകൾ ചേർക്കില്ല.',
      demoIsolationNote:
        'മുൻകാല പേയ്‌മെന്റ് ശീലമനുസരിച്ചുള്ള കണക്കുകൾ പരിശോധിക്കാൻ വ്യക്തമായി അടയാളപ്പെടുത്തിയ മാതൃകാ കണക്കുകൾ.',
    },
  };

  const currentStrings = labels[language] || labels.en;

  const handleDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (accountType === 'demo') {
      const chosenDemo =
        DEMO_ACCOUNTS.find((d) => d.workspaceId === selectedDemoId) || DEMO_ACCOUNTS[0];
      setIsSubmitting(true);
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'demo',
            demoWorkspaceId: chosenDemo.workspaceId,
            shopName: chosenDemo.canonicalName,
          }),
        });
        const json = await res.json();
        if (json?.success && json.session) {
          onLoginSuccess(json.session);
          return;
        }
      } catch {
        // Offline fallback
      } finally {
        setIsSubmitting(false);
      }
      onLoginSuccess({
        workspaceId: chosenDemo.workspaceId,
        isDemo: true,
        shopName: chosenDemo.canonicalName,
      });
      return;
    }

    // Real Business Workspace Login
    let cleanPhone: string | undefined;
    if (identityMode === 'phone') {
      const digits = fromNativeDigits(phone).replace(/\D/g, '');
      if (!/^[6-9]\d{9}$/.test(digits)) {
        setErrorMsg(currentStrings.invalidPhoneErr);
        return;
      }
      cleanPhone = digits;
    }

    const effectiveShopInput = (shopName.trim() || currentStrings.defaultRealShop)
      .replace(/\s*\[Demo\]\s*/gi, '')
      .trim();
    if (!effectiveShopInput) {
      setErrorMsg(currentStrings.emptyShopErr);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'real',
          phone: cleanPhone,
          shopName: effectiveShopInput,
        }),
      });
      const json = await res.json();
      if (json?.success && json.session) {
        onLoginSuccess(json.session);
        return;
      }
    } catch {
      // Offline fallback
    } finally {
      setIsSubmitting(false);
    }

    const fallbackId = cleanPhone
      ? `real-${cleanPhone}`
      : `real-${effectiveShopInput.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'shop'}`;
    onLoginSuccess({
      workspaceId: fallbackId,
      isDemo: false,
      phone: cleanPhone,
      shopName: effectiveShopInput,
    });
  };

  const anchorDateFormatted = formatHeaderDate(ANCHOR_DATE, language);

  return (
    <div className="min-h-screen bg-[#FDF8EE] text-[#1C1917] flex flex-col justify-between selection:bg-[#14532D] selection:text-white">
      {/* Header */}
      <header className="khata-ledger-header border-b-2 border-[#DFD2B7] px-4 py-3 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <RupiVantaLogo size={42} className="w-10 h-10 sm:w-11 sm:h-11" />
            <div>
              <span className="font-extrabold text-xl sm:text-2xl text-[#14532D] tracking-tight block leading-none">
                {t.appName}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-[#78350F] block mt-0.5">
                {currentStrings.brandSubtitle}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#14532D]">
              <Calendar className="w-4 h-4" />
              <span>{anchorDateFormatted}</span>
            </span>

            {/* All 6 Dashboard Languages Supported */}
            <div className="flex items-center gap-1.5 bg-[#FFFDF9] border border-[#D6C5A9] rounded-xl px-2.5 py-1.5">
              <Globe className="w-4 h-4 text-[#14532D] shrink-0" />
              <select
                value={language}
                onChange={(e) => onLanguageChange(e.target.value as AppLanguage)}
                aria-label={t.chooseLangAria}
                className="bg-transparent text-sm sm:text-base font-bold text-[#1C1917] focus:outline-none cursor-pointer"
              >
                <option value="en">English</option>
                <option value="kn">ಕನ್ನಡ</option>
                <option value="hi">हिन्दी</option>
                <option value="ta">தமிழ்</option>
                <option value="te">తెలుగు</option>
                <option value="ml">മലയാളം</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
        {/* Left Column */}
        <div className="w-full lg:w-1/2 space-y-5">
          <p className="text-sm font-extrabold text-[#14532D] flex items-center gap-2">
            <Calendar className="w-4 h-4 shrink-0" />
            <span>
              {pf.presentDatePrefix}: {anchorDateFormatted}
            </span>
          </p>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1C1917] tracking-tight leading-tight text-balance">
              {currentStrings.brandSubtitle}
            </h1>
            <p className="text-lg sm:text-xl text-[#57534E] leading-relaxed">
              {currentStrings.tagline}
            </p>
          </div>
        </div>

        {/* Right Column: Sign-In Card */}
        <div className="w-full lg:w-1/2 max-w-md">
          <div className="khata-card rounded-3xl p-6 sm:p-7 border-2 border-[#D6C5A9] shadow-lg space-y-4">
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 mx-auto mb-1.5 rounded-2xl bg-[#14532D] text-[#FDE68A] flex items-center justify-center">
                <Mic className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-[#1C1917]">
                {currentStrings.cardHeading}
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-[#57534E]">
                {currentStrings.voiceReadyNote}
              </p>
            </div>

            {/* Workspace Isolation Switcher */}
            <div className="grid grid-cols-2 p-1 bg-[#FAF1DF] rounded-2xl border border-[#E5D9C3] gap-1">
              <button
                type="button"
                onClick={() => {
                  setAccountType('demo');
                  setErrorMsg(null);
                }}
                className={`py-2 px-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
                  accountType === 'demo'
                    ? 'bg-amber-800 text-white'
                    : 'text-[#44403C] hover:text-[#1C1917]'
                }`}
              >
                <Database className="w-4 h-4 shrink-0" />
                <span className="truncate">{currentStrings.demoLedgerTab}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAccountType('real');
                  setErrorMsg(null);
                }}
                className={`py-2 px-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
                  accountType === 'real'
                    ? 'bg-[#14532D] text-white'
                    : 'text-[#44403C] hover:text-[#1C1917]'
                }`}
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span className="truncate">{currentStrings.realLedgerTab}</span>
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-sm font-bold flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleDirectLogin} className="space-y-4">
              {accountType === 'demo' ? (
                <div className="space-y-2.5">
                  <p className="text-xs font-semibold text-amber-900 bg-amber-50 border border-amber-200 rounded-xl p-2.5 leading-snug">
                    {currentStrings.demoIsolationNote}
                  </p>
                  <div className="space-y-2">
                    {DEMO_ACCOUNTS.map((demo) => {
                      const active = selectedDemoId === demo.workspaceId;
                      return (
                        <button
                          key={demo.workspaceId}
                          type="button"
                          onClick={() => setSelectedDemoId(demo.workspaceId)}
                          className={`w-full p-3 rounded-2xl border text-left transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#ECFDF5] border-[#14532D]'
                              : 'bg-white border-[#D6C5A9] hover:bg-[#FAF1DF]/60'
                          }`}
                        >
                          <div className="font-extrabold text-sm text-[#1C1917]">
                            {localizeBusinessLabel(demo.canonicalName, language)}
                          </div>
                          <div className="text-xs text-[#57534E] mt-0.5 leading-snug">
                            {demo.subtitleByLang[language] || demo.subtitleByLang.en}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-[#14532D] bg-[#ECFDF5] border border-[#BBF7D0] rounded-xl p-2.5 leading-snug">
                    {currentStrings.realIsolationNote}
                  </p>

                  <div className="grid grid-cols-2 p-1 bg-[#FAF1DF] rounded-xl border border-[#E5D9C3] gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIdentityMode('phone');
                        setErrorMsg(null);
                      }}
                      className={`py-2 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                        identityMode === 'phone'
                          ? 'bg-[#14532D] text-white'
                          : 'text-[#44403C]'
                      }`}
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{currentStrings.tabPhone}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIdentityMode('shop');
                        setErrorMsg(null);
                      }}
                      className={`py-2 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                        identityMode === 'shop'
                          ? 'bg-[#14532D] text-white'
                          : 'text-[#44403C]'
                      }`}
                    >
                      <Store className="w-3.5 h-3.5" />
                      <span>{currentStrings.tabShop}</span>
                    </button>
                  </div>

                  {identityMode === 'phone' && (
                    <div className="space-y-1">
                      <label className="block text-xs font-extrabold text-[#292524]">
                        {currentStrings.phoneLabel}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-sm font-bold text-[#78716C] font-mono">
                          {toNativeDigits('+91', language)}
                        </div>
                        <input
                          type="tel"
                          maxLength={10}
                          value={toNativeDigits(phone, language)}
                          onChange={(e) =>
                            setPhone(fromNativeDigits(e.target.value).replace(/\D/g, ''))
                          }
                          placeholder={toNativeDigits('9845012345', language)}
                          className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-white border-2 border-[#D6C5A9] focus:border-[#14532D] focus:outline-none text-base font-mono font-bold text-[#1C1917] tracking-wider transition-colors"
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-[#292524]">
                      {currentStrings.shopLabel}
                    </label>
                    <input
                      type="text"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      placeholder={currentStrings.shopPlaceholder}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-[#D6C5A9] focus:border-[#14532D] focus:outline-none text-base font-bold text-[#1C1917] transition-colors"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-5 rounded-2xl bg-[#14532D] hover:bg-[#166534] disabled:opacity-60 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-md cursor-pointer transition-colors"
              >
                <span>
                  {accountType === 'demo'
                    ? currentStrings.loginBtnDemo
                    : currentStrings.loginBtnReal}
                </span>
                <ArrowRight className="w-5 h-5 shrink-0" />
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="khata-ledger-header border-t border-[#DFD2B7] py-3 text-center text-xs font-semibold text-[#78716C] px-4">
        <span>
          {t.appName} · {pf.presentDatePrefix}: {anchorDateFormatted}
        </span>
      </footer>
    </div>
  );
};
