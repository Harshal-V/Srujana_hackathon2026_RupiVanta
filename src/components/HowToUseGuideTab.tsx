import React from 'react';
import {
  Mic,
  Menu,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Scale,
  ArrowRight,
  CheckCircle2,
  Database,
} from 'lucide-react';
import { AppLanguage } from '../types/munimji';
import { ANCHOR_DATE } from '../data/initialData';
import {
  TRANSLATIONS,
  formatHeaderDate,
  getPredictiveFinanceText,
} from '../utils/translations';
import {
  getDashboardExtraStrings,
  toNativeDigits,
} from '../utils/localization';

interface HowToUseGuideTabProps {
  onOpenVoiceAssistant: () => void;
  onOpenMenu: () => void;
  onGoToPresentBalance: () => void;
  onGoToPendingPayments: () => void;
  onGoToUpcomingPayments: () => void;
  onGoToAdviceSection?: () => void;
  onGoToNoticesTab: () => void;
  language?: AppLanguage;
}

interface GuideStepContent {
  title: string;
  description: string;
  examples: string[];
}

interface GuideCopy {
  intro: string;
  steps: [
    GuideStepContent,
    GuideStepContent,
    GuideStepContent,
    GuideStepContent,
    GuideStepContent,
  ];
}

function getGuideCopy(lang: AppLanguage, anchorDateLabel: string, voiceNote: string): GuideCopy {
  const dict: Record<AppLanguage, GuideCopy> = {
    en: {
      intro:
        'Open one clean section at a time using the top-left Menu (☰), see simple expected payment dates based on each customer’s past payment habit alongside their promised date, check upcoming bill affordability, and ask your assistant to perform tasks in English or Kannada.',
      steps: [
        {
          title: 'Separate Sample Accounts & Private Business Ledger',
          description:
            'RupiVanta keeps sample demo shops (like Sharma Stores [Demo]) completely separate from your real business ledger. Demo shops let you explore overdue, part-paid, early-promise, and new-customer bills without mixing into your private khata.',
          examples: [
            'Use the top bar to switch between Demo Businesses and My Real Ledger anytime',
            'Each customer gets a permanent ID so returning buyers keep their own past payment history',
          ],
        },
        {
          title: '6 Dashboard Languages & Task-Ready Voice Assistant',
          description:
            'Every screen, name, date, number, and WhatsApp reminder updates in English, Kannada, Hindi, Tamil, Telugu, and Malayalam. The spoken Voice Assistant supports English and ಕನ್ನಡ (Kannada) and can carry out ledger tasks for you.',
          examples: [
            voiceNote,
            'Ask anything: “Can you add an extra pending payment?”, “Add pending ₹12,000 from Ramesh due 5 Nov”, or “Who should I call first?”',
          ],
        },
        {
          title: 'Expected Payment Dates Based on Past Habits & Promised Dates',
          description:
            'Open Pending Payments from the Menu (☰). RupiVanta studies bill dates, due dates, amounts, part payments, and past delays to show a realistic arrival window — never replacing what the customer promised.',
          examples: [
            'Shows Due Date, Customer Promised Date, Expected Arrival Window, Usual Delay, and Pattern Surety %',
            'If a buyer promises to pay early but usually pays late, both dates stay side-by-side with a simple reason',
            'Tap “Record Payment” when money arrives to update your cash and check how close our estimate was',
          ],
        },
        {
          title: '7, 30 & 90-Day Cash Outlook, Bill Affordability & Photo Scan',
          description:
            'Check 7, 30, and 90-day cash forecasts, see possible cash shortages ahead of time, check whether each supplier or lender bill is safe to pay, and test “What-If” delays.',
          examples: [
            'Scan paper bills from a photo or PDF and review or edit every box before saving',
            'Send polite, editable WhatsApp payment reminders to the customer’s saved number in your chosen language',
          ],
        },
        {
          title: 'Three-Line Menu (☰) & Simple Legal Notice Helper',
          description:
            'Use the top-left Three-Line Menu (☰) so your screen stays uncluttered, including plain-language help for GST, tax, and cheque bounce notices.',
          examples: [
            'Automatically hides sensitive ID numbers for privacy',
            `Tracks response deadlines from ${anchorDateLabel}`,
          ],
        },
      ],
    },
    kn: {
      intro:
        'ಮೇಲಿನ ಎಡಭಾಗದ ಮೂರು-ಗೆರೆ ಮೆನು (☰) ಬಳಸಿ ಒಮ್ಮೆಗೆ ಒಂದೇ ಸ್ವಚ್ಛ ವಿಭಾಗವನ್ನು ನೋಡಿ. ಗ್ರಾಹಕರ ಹಿಂದಿನ ಪಾವತಿ ಅಭ್ಯಾಸದ ಆಧಾರದ ಮೇಲೆ ಹಣ ಬರುವ ಅಂದಾಜು ದಿನಾಂಕ, ಬಿಲ್ ಪಾವತಿ ಸಾಮರ್ಥ್ಯ ತಿಳಿಯಿರಿ ಮತ್ತು ಸಹಾಯಕನಿಗೆ ಯಾವುದೇ ಕೆಲಸ ಹೇಳಿ ಮಾಡಿಸಿ.',
      steps: [
        {
          title: 'ಪ್ರತ್ಯೇಕ ಮಾದರಿ (ಡೆಮೊ) ಖಾತೆಗಳು ಮತ್ತು ನಿಮ್ಮ ಖಾಸಗಿ ನೈಜ ಖಾತೆ',
          description:
            'ರೂಪಿವಂತ ಮಾದರಿ ಡೆಮೊ ಅಂಗಡಿಗಳನ್ನು ನಿಮ್ಮ ನೈಜ ವ್ಯಾಪಾರ ಖಾತೆಯಿಂದ ಸಂಪೂರ್ಣ ಪ್ರತ್ಯೇಕವಾಗಿ ಇಡುತ್ತದೆ. ಯಾವುದೇ ಮಾದರಿ ದಾಖಲೆಗಳು ನಿಮ್ಮ ನಿಜವಾದ ಲೆಕ್ಕದಲ್ಲಿ ಬೆರೆಯುವುದಿಲ್ಲ.',
          examples: [
            'ಮೇಲಿನ ಪಟ್ಟಿಯಿಂದ ಯಾವಾಗ ಬೇಕಾದರೂ ಡೆಮೊ ಖಾತೆ ಮತ್ತು ನನ್ನ ನೈಜ ಖಾತೆ ನಡುವೆ ಬದಲಿಸಿ',
            'ಪ್ರತಿ ಗ್ರಾಹಕರಿಗೆ ಶಾಶ್ವತ ಗುರುತು ಇರುವುದರಿಂದ ಅವರ ಹಳೆಯ ಬಿಲ್ ಅಭ್ಯಾಸ ನೆನಪಿರುತ್ತದೆ',
          ],
        },
        {
          title: '೬ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಭಾಷೆಗಳು ಮತ್ತು ಕೆಲಸ ಮಾಡುವ ಧ್ವನಿ ಸಹಾಯಕ',
          description:
            'ನೀವು ಆಯ್ಕೆ ಮಾಡಿದ ಭಾಷೆಯಲ್ಲಿ ಎಲ್ಲಾ ಹೆಸರುಗಳು, ಸಂಖ್ಯೆಗಳು, ದಿನಾಂಕಗಳು ಮತ್ತು ವಾಟ್ಸಾಪ್ ಸಂದೇಶಗಳು ಕಾಣಿಸುತ್ತವೆ. ಧ್ವನಿ ಸಹಾಯಕ ಇಂಗ್ಲಿಷ್ ಮತ್ತು ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡುತ್ತದೆ ಹಾಗೂ ನೀವು ಹೇಳಿದ ಖಾತೆ ಕೆಲಸಗಳನ್ನು ಮಾಡುತ್ತದೆ.',
          examples: [
            voiceNote,
            'ಹೀಗೆ ಕೇಳಿ: “ಹೊಸ ಬಾಕಿ ಪಾವತಿ ಸೇರಿಸಬಹುದೇ?”, “ರಮೇಶ್ ಅವರಿಂದ ₹೧೨,೦೦೦ ಬಾಕಿ ಸೇರಿಸಿ”, ಅಥವಾ “ಮೊದಲು ಯಾರನ್ನು ಕೇಳಬೇಕು?”',
          ],
        },
        {
          title: 'ಹಿಂದಿನ ಪಾವತಿ ಅಭ್ಯಾಸದ ವಿಶ್ಲೇಷಣೆ ಮತ್ತು ಭರವಸೆ ದಿನಾಂಕ ಹೋಲಿಕೆ',
          description:
            'ಮೆನುವಿನಿಂದ ಬಾಕಿ ಪಾವತಿಗಳನ್ನು ತೆರೆಯಿರಿ. ಗ್ರಾಹಕರು ಹಿಂದಿನ ಬಿಲ್‌ಗಳನ್ನು ಎಷ್ಟು ದಿನಗಳಲ್ಲಿ ಕೊಟ್ಟಿದ್ದಾರೆ ಎಂಬ ಅಭ್ಯಾಸ ನೋಡಿ ಹಣ ಬರುವ ಸರಳ ಅಂದಾಜು ದಿನಾಂಕ ತೋರಿಸುತ್ತದೆ.',
          examples: [
            'ಗಡುವು ದಿನಾಂಕ, ಗ್ರಾಹಕರ ಭರವಸೆ ದಿನಾಂಕ, ಹಣ ಬರುವ ಅಂದಾಜು ದಿನಾಂಕ ಮತ್ತು ತಡವಾಗುವ ಸರಳ ಕಾರಣ ತೋರಿಸುತ್ತದೆ',
            'ಗ್ರಾಹಕರು ಬೇಗ ಕೊಡುತ್ತೇವೆ ಎಂದರೂ ಹಿಂದಿನ ಅಭ್ಯಾಸ ತಡವಾಗಿದ್ದರೆ ಎರಡೂ ದಿನಾಂಕಗಳನ್ನು ಪಕ್ಕಪಕ್ಕದಲ್ಲಿ ತೋರಿಸುತ್ತದೆ',
            'ಹಣ ಬಂದಾಗ “ಪಾವತಿ ದಾಖಲಿಸಿ” ಒತ್ತಿ ಬ್ಯಾಲೆನ್ಸ್ ನವೀಕರಿಸಿ',
          ],
        },
        {
          title: '೭, ೩೦ ಮತ್ತು ೯೦ ದಿನಗಳ ನಗದು ನೋಟ, ಬಿಲ್ ಸಾಮರ್ಥ್ಯ ಮತ್ತು ಬಿಲ್ ಸ್ಕ್ಯಾನ್',
          description:
            'ಮುಂದಿನ ೭, ೩೦ ಮತ್ತು ೯೦ ದಿನಗಳಲ್ಲಿ ಹಣದ ಕೊರತೆ ಬರುತ್ತದೆಯೇ, ಸಾಲಗಾರರು ಅಥವಾ ಸರಬರಾಜುದಾರರ ಬಿಲ್ ಕೊಡಲು ಹಣ ಸಾಕಾಗುತ್ತದೆಯೇ ಎಂದು ಸುಲಭವಾಗಿ ನೋಡಿ.',
          examples: [
            'ಅಂಗಡಿ ಬಿಲ್ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ, ಎಲ್ಲಾ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ತಿದ್ದಿ ಉಳಿಸಿ',
            'ಗ್ರಾಹಕರ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಗೆ ನೇರವಾಗಿ ಕನ್ನಡ ಅಥವಾ ಯಾವುದೇ ಭಾಷೆಯಲ್ಲಿ ವಾಟ್ಸಾಪ್ ನೆನಪು ಕಳುಹಿಸಿ',
          ],
        },
        {
          title: 'ಮೂರು-ಗೆರೆ ಮೆನು (☰) ಮತ್ತು ಸರಳ ಕಾನೂನು ನೋಟಿಸ್ ಸಹಾಯ',
          description:
            'ಮುಖಪುಟ ಗೊಂದಲವಾಗದಂತೆ ಮೂರು-ಗೆರೆ ಮೆನು (☰) ಮೂಲಕ ಬ್ಯಾಲೆನ್ಸ್, ಬಾಕಿ, ಮುಂಬರುವ ಬಿಲ್ ಮತ್ತು ತೆರಿಗೆ/ಚೆಕ್ ನೋಟಿಸ್ ವಿಭಾಗಗಳನ್ನು ಒಂದೊಂದಾಗಿ ನೋಡಿ.',
          examples: [
            'ಗುರುತಿನ ಸಂಖ್ಯೆಗಳನ್ನು ಗೌಪ್ಯತೆಗಾಗಿ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಮರೆಮಾಡುತ್ತದೆ',
            `${anchorDateLabel} ಆಧಾರದ ಮೇಲೆ ಕೊನೆಯ ದಿನಾಂಕಗಳನ್ನು ಲೆಕ್ಕ ಹಾಕುತ್ತದೆ`,
          ],
        },
      ],
    },
    hi: {
      intro:
        'ऊपर बाईं ओर तीन-लाइन मेनू (☰) से एक बार में एक साफ़ सेक्शन खोलें, ग्राहकों के पिछले भुगतान पैटर्न के आधार पर पैसा आने की आसान अनुमानित तारीख़ देखें, और सहायक से अपना काम करवाएं।',
      steps: [
        {
          title: 'अलग डेमो खाते और आपका निजी असली खाता',
          description:
            'रूपिवंता नमूना डेमो खातों को आपके असली व्यापार खाते से पूरी तरह अलग रखता है। कोई भी नमूना रिकॉर्ड आपके असली हिसाब में नहीं मिलता।',
          examples: [
            'ऊपरी पट्टी से कभी भी डेमो खाते और असली खाते के बीच बदलें',
            'हर ग्राहक की स्थायी पहचान रहती है जिससे उनका पुराना भुगतान रिकॉर्ड जुड़ा रहता है',
          ],
        },
        {
          title: '६ भाषाएं और काम करने वाला वॉइस सहायक',
          description:
            'आपकी चुनी हुई भाषा में सभी नाम, अंक, तारीख़ें और व्हाट्सएप संदेश बदल जाते हैं। वॉइस सहायक अंग्रेज़ी और कन्नड़ में बातचीत और खाते के काम करता है।',
          examples: [
            voiceNote,
            'सहायक से नया बकाया जोड़ने, बिल लिखने, बैलेंस बदलने या सलाह पूछने के लिए कहें',
          ],
        },
        {
          title: 'पिछले भुगतान पैटर्न से आसान अनुमान और वादा तारीख़',
          description:
            'मेनू से बकाया भुगतान खोलें। पुराने बिल और देरी के पैटर्न के आधार पर पैसा आने की संभावित तारीख़ सरल शब्दों में दिखती है।',
          examples: [
            'देय तारीख़, ग्राहक की वादा तारीख़, अनुमानित तारीख़ और देरी का सीधा कारण दिखाता है',
            'यदि ग्राहक जल्दी देने का वादा करे पर आदत देरी की हो, तो दोनों तारीख़ें साथ दिखती हैं',
            'पैसा मिलने पर “भुगतान दर्ज करें” दबाकर बैलेंस अपडेट करें',
          ],
        },
        {
          title: '७, ३० और ९० दिन का नकद अनुमान, बिल क्षमता और फोटो स्कैन',
          description:
            'देखें कि आने वाले दिनों में पैसे कम तो नहीं पड़ेंगे और साहूकार या सप्लायर का बिल आसानी से चुकाया जा सकता है या नहीं।',
          examples: [
            'बिल की फोटो स्कैन करें और सेव करने से पहले हर जानकारी जांचें व सुधारें',
            'ग्राहक के नंबर पर अपनी भाषा में व्हाट्सएप भुगतान स्मरण भेजें',
          ],
        },
        {
          title: 'तीन-लाइन मेनू (☰) और सरल कानूनी नोटिस मदद',
          description:
            'तीन-लाइन मेनू (☰) से स्क्रीन साफ़ रहती है और जीएसटी, टैक्स व चेक बाउंस नोटिस का सरल अर्थ समझ आता है।',
          examples: [
            'गोपनीय पहचान नंबर अपने-आप सुरक्षित रूप से छिपाए जाते हैं',
            `${anchorDateLabel} से जवाब देने की अंतिम तारीख़ की गणना`,
          ],
        },
      ],
    },
    ta: {
      intro:
        'மேலே இடதுபுறம் உள்ள மூன்று-கோடு பட்டியல் (☰) மூலம் ஒரு நேரத்தில் ஒரு தெளிவான பிரிவைத் திறந்து, கடந்த பணம் செலுத்தும் பழக்கத்தின் அடிப்படையில் எளிய கணிப்புகளைப் பாருங்கள்.',
      steps: [
        {
          title: 'தனி மாதிரி (டெமோ) கணக்குகள் மற்றும் உண்மை வணிகக் கணக்கு',
          description:
            'ரூபிவந்தா மாதிரி கணக்குகளை உங்கள் உண்மையான வணிகக் கணக்கிலிருந்து முற்றிலும் தனியாக வைக்கிறது.',
          examples: [
            'மேல் பட்டியிலிருந்து எப்போது வேண்டுமானாலும் டெமோ மற்றும் உண்மைக் கணக்கை மாற்றலாம்',
            'ஒவ்வொரு வாடிக்கையாளருக்கும் நிலையான அடையாள எண் பராமரிக்கப்படுகிறது',
          ],
        },
        {
          title: '௬ மொழிகள் மற்றும் பணி செய்யும் குரல் உதவியாளர்',
          description:
            'நீங்கள் தேர்ந்தெடுக்கும் மொழியில் அனைத்து பெயர்கள், எண்கள் மற்றும் செய்திகள் மாறும். குரல் உதவியாளர் ஆங்கிலம் மற்றும் கன்னடத்தில் செயல்படுகிறது.',
          examples: [
            voiceNote,
            'புதிய நிலுவை சேர்க்க, பில் சேர்க்க அல்லது யாரை முதலில் கேட்க வேண்டும் என உதவியாளரிடம் கேளுங்கள்',
          ],
        },
        {
          title: 'கடந்த பழக்கத்தின் அடிப்படைத் தேதி மற்றும் வாக்குறுதி தேதி',
          description:
            'பட்டியலிலிருந்து நிலுவை வரவுகளைத் திறக்கவும். பழைய பில் பழக்கத்தைப் பார்த்து பணம் வரும் உத்தேச தேதியை எளிய தமிழில் காட்டுகிறது.',
          examples: [
            'கெடு தேதி, வாடிக்கையாளர் வாக்குறுதி தேதி மற்றும் எதிர்பார்க்கும் தேதி தெளிவாகக் காட்டப்படும்',
            'முன்கூட்டியே தருவதாகச் சொன்னாலும் பழைய வழக்கம் தாமதமானால் இரண்டும் தனித்தனியாகக் காட்டப்படும்',
            'பணம் வந்ததும் “வரவு பதிவு” அழுத்தி இருப்பைப் புதுப்பிக்கவும்',
          ],
        },
        {
          title: '௭, ௩௦ & ௯௦ நாள் பணப்புழக்கம், பில் தகுதி மற்றும் பில் ஸ்கேன்',
          description:
            'வரும் நாட்களில் பணப் பற்றாக்குறை வருமா, சப்ளையர் அல்லது வட்டி கடைக்காரர் பில்லைச் செலுத்த முடியுமா என்பதைச் சரிபார்க்கவும்.',
          examples: [
            'பில் புகைப்படத்தை ஸ்கேன் செய்து சேமிக்கும் முன் திருத்தவும்',
            'வாடிக்கையாளருக்கு வாட்ஸ்அப் நினைவூட்டல் செய்தியை அனுப்பவும்',
          ],
        },
        {
          title: 'மூன்று-கோடு பட்டியல் (☰) மற்றும் சட்ட நோட்டீஸ் உதவி',
          description:
            'மூன்று-கோடு பட்டியல் மூலம் முகப்புத் திரையைச் சுத்தமாக வைத்து வரி மற்றும் காசோலை நோட்டீஸ் விளக்கங்களைப் பெறலாம்.',
          examples: [
            'தனிப்பட்ட அடையாள எண்களைப் பாதுகாப்பாக மறைக்கிறது',
            `${anchorDateLabel} முதல் கடைசி தேதியைக் கணக்கிடுகிறது`,
          ],
        },
      ],
    },
    te: {
      intro:
        'పైన ఎడమవైపు ఉన్న మూడు-గీతల మెనూ (☰) ద్వారా ఒకేసారి ఒక సులభమైన విభాగాన్ని తెరవండి, కస్టమర్ల గత అలవాటు ఆధారంగా డబ్బు వచ్చే తేదీని మరియు బిల్లుల స్థోమతను సులభంగా తెలుసుకోండి.',
      steps: [
        {
          title: 'వేరుగా ఉండే డెమో ఖాతాలు మరియు మీ నిజమైన వ్యాపార ఖాతా',
          description:
            'రూపివంత నమూనా డెమో ఖాతాలను మీ నిజమైన వ్యాపార ఖాతా నుండి పూర్తిగా వేరుగా ఉంచుతుంది.',
          examples: [
            'పై బార్ నుండి డెమో వ్యాపారాలు మరియు నా నిజమైన ఖాతా మధ్య ఎప్పుడైనా మారండి',
            'ప్రతి కస్టమర్‌కు స్థిరమైన గుర్తింపు ఉండటం వల్ల వారి పాత చెల్లింపు చరిత్ర నిలిచి ఉంటుంది',
          ],
        },
        {
          title: '౬ భాషలు మరియు పనులు చేసే వాయిస్ అసిస్టెంట్',
          description:
            'మీరు ఎంచుకున్న భాషలో అన్ని పేర్లు, అంకెలు, తేదీలు మరియు వాట్సాప్ సందేశాలు మారుతాయి. వాయిస్ అసిస్టెంట్ ఇంగ్లీష్ మరియు కన్నడలో పనిచేస్తుంది.',
          examples: [
            voiceNote,
            'కొత్త పెండింగ్ బిల్లు జోడించమని, బ్యాలెన్స్ మార్చమని లేదా ఎవరిని ముందు అడగాలో అసిస్టెంట్‌ను అడగండి',
          ],
        },
        {
          title: 'గత చెల్లింపు అలవాటు ఆధారిత అంచనా మరియు వాగ్దానం తేదీ',
          description:
            'మెనూ నుండి పెండింగ్ చెల్లింపులు తెరవండి. కస్టమర్ పాత బిల్లుల అలవాటు ఆధారంగా డబ్బు వచ్చే తేదీని సులభమైన మాటల్లో చూపుతుంది.',
          examples: [
            'గడువు తేదీ, కస్టమర్ ఇచ్చిన మాట తేదీ మరియు అంచనా తేదీని వేర్వేరుగా చూపుతుంది',
            'కస్టమర్ ముందుగా ఇస్తానని చెప్పినా అలవాటు ఆలస్యమైతే రెండు తేదీలు పక్కపక్కనే ఉంటాయి',
            'డబ్బు వచ్చిన వెంటనే “చెల్లింపు నమోదు” నొక్కి బ్యాలెన్స్ అప్‌డేట్ చేయండి',
          ],
        },
        {
          title: '౭, ౩౦ & ౯౦ రోజుల నగదు అంచనా, బిల్లు స్థోమత మరియు ఫోటో స్కాన్',
          description:
            'రాబోయే రోజుల్లో నగదు కొరత వస్తుందేమో, వడ్డీ వ్యాపారి లేదా సప్లయర్ బిల్లు కట్టగలమో లేదో ముందుగానే చూడండి.',
          examples: [
            'బిల్లు ఫోటోను స్కాన్ చేసి సేవ్ చేసే ముందు అన్ని వివరాలు సరిచూసుకోండి',
            'కస్టమర్ ఫోన్ నంబర్‌కు మీ భాషలో వాట్సాప్ రిమైండర్ పంపండి',
          ],
        },
        {
          title: 'మూడు-గీతల మెనూ (☰) మరియు సులభ లీగల్ నోటీసు సహాయం',
          description:
            'మూడు-గీతల మెనూతో స్క్రీన్ గందరగోళం లేకుండా ఉంచుతూ పన్ను మరియు చెక్ బౌన్స్ నోటీసులను సులభంగా అర్థం చేసుకోండి.',
          examples: [
            'గోప్యత కోసం గుర్తింపు నంబర్లను స్వయంచాలకంగా దాచిపెడుతుంది',
            `${anchorDateLabel} నుండి గడువు తేదీలను లెక్కిస్తుంది`,
          ],
        },
      ],
    },
    ml: {
      intro:
        'മുകളിൽ ഇടതുവശത്തുള്ള മൂന്ന്-വര മെനു (☰) ഉപയോഗിച്ച് ഒരു സമയം ഒരു വിഭാഗം മാത്രം തുറക്കുക. ഇടപാടുകാരുടെ മുൻകാല പേയ്‌മെന്റ് ശീലമനുസരിച്ചുള്ള തീയതിയും ബിൽ അടയ്ക്കാനുള്ള ശേഷിയും ലളിതമായി മനസ്സിലാക്കുക.',
      steps: [
        {
          title: 'വേറിട്ട ഡെമോ അക്കൗണ്ടുകളും നിങ്ങളുടെ സ്വകാര്യ കണക്കും',
          description:
            'രൂപിവന്ത മാതൃകാ ഡെമോ അക്കൗണ്ടുകളെ നിങ്ങളുടെ യഥാർത്ഥ ബിസിനസ് കണക്കിൽ നിന്ന് പൂർണ്ണമായും വേറിട്ട് സൂക്ഷിക്കുന്നു.',
          examples: [
            'മുകളിലെ ബാറിൽ നിന്ന് എപ്പോൾ വേണമെങ്കിലും ഡെമോ, യഥാർത്ഥ കണക്കുകൾ മാറ്റാം',
            'ഓരോ ഇടപാടുകാരനും സ്ഥിരമായ തിരിച്ചറിയൽ നമ്പർ ഉള്ളതിനാൽ മുൻ ചരിത്രം നിലനിൽക്കും',
          ],
        },
        {
          title: '൬ ഭാഷകളും ജോലികൾ ചെയ്യുന്ന വോയ്‌സ് സഹായിയും',
          description:
            'നിങ്ങൾ തിരഞ്ഞെടുക്കുന്ന ഭാഷയിൽ എല്ലാ പേരുകളും അക്കങ്ങളും വാട്ട്‌സ്ആപ്പ് സന്ദേശങ്ങളും മാറും. വോയ്‌സ് അസിസ്റ്റന്റ് ഇംഗ്ലീഷിലും കന്നഡയിലും പ്രവർത്തിക്കുന്നു.',
          examples: [
            voiceNote,
            'പുതിയ കുടിശ്ശിക ചേർക്കാനോ ബിൽ ചേർക്കാനോ ബാലൻസ് മാറ്റാനോ സഹായിയോട് ആവശ്യപ്പെടാം',
          ],
        },
        {
          title: 'മുൻകാല ശീലമനുസരിച്ചുള്ള തീയതിയും വാഗ്ദാന തീയതിയും',
          description:
            'മെനുവിൽ നിന്ന് ലഭിക്കാനുള്ള തുക തുറക്കുക. ഇടപാടുകാരന്റെ മുൻ ബില്ലുകളുടെ ശീലം നോക്കി പണം ലഭിക്കാൻ സാധ്യതയുള്ള തീയതി ലളിതമായി കാണിക്കുന്നു.',
          examples: [
            'അവസാന തീയതി, വാഗ്ദാന തീയതി, പ്രതീക്ഷിക്കുന്ന തീയതി എന്നിവ വ്യക്തമായി കാണിക്കുന്നു',
            'നേരത്തെ തരാമെന്ന് പറഞ്ഞാലും മുൻ ശീലം വൈകിയാണെങ്കിൽ രണ്ട് തീയതികളും ഒരുമിച്ച് കാണിക്കും',
            'പണം ലഭിക്കുമ്പോൾ “പേയ്‌മെന്റ് രേഖപ്പെടുത്തുക” അമർത്തുക',
          ],
        },
        {
          title: '൭, ൩൦, ൯൦ ദിവസത്തെ പണനില, ബിൽ ശേഷി, ഫോട്ടോ സ്കാൻ',
          description:
            'വരും ദിവസങ്ങളിൽ പണക്ഷാമം ഉണ്ടാകുമോ എന്നും സപ്ലയർ അല്ലെങ്കിൽ പലിശക്കാരന്റെ ബിൽ അടയ്ക്കാനാകുമോ എന്നും പരിശോധിക്കുക.',
          examples: [
            'ബിൽ ഫോട്ടോ സ്കാൻ ചെയ്ത് സേവ് ചെയ്യുന്നതിന് മുമ്പ് തിരുത്താം',
            'ഇടപാടുകാരന്റെ നമ്പറിലേക്ക് വാട്ട്‌സ്ആപ്പ് ഓർമ്മപ്പെടുത്തൽ അയയ്ക്കാം',
          ],
        },
        {
          title: 'മൂന്ന്-വര മെനു (☰) & ലളിതമായ നിയമ നോട്ടീസ് സഹായം',
          description:
            'മൂന്ന്-വര മെനുവിലൂടെ ഹോം സ്ക്രീൻ വൃത്തിയായി സൂക്ഷിക്കുകയും നികുതി, ചെക്ക് നോട്ടീസുകൾ ലളിതമായി മനസ്സിലാക്കുകയും ചെയ്യാം.',
          examples: [
            'സ്വകാര്യതയ്ക്കായി തിരിച്ചറിയൽ നമ്പറുകൾ മറയ്ക്കുന്നു',
            `${anchorDateLabel} മുതൽ അവസാന തീയതികൾ കണക്കാക്കുന്നു`,
          ],
        },
      ],
    },
  };
  return dict[lang] || dict.en;
}

export const HowToUseGuideTab: React.FC<HowToUseGuideTabProps> = ({
  onOpenVoiceAssistant,
  onOpenMenu,
  onGoToPresentBalance,
  onGoToPendingPayments,
  onGoToUpcomingPayments,
  onGoToAdviceSection,
  onGoToNoticesTab,
  language = 'en',
}) => {
  const t = TRANSLATIONS[language];
  const pf = getPredictiveFinanceText(language);
  const uiExtra = getDashboardExtraStrings(language);
  const anchorFormatted = formatHeaderDate(ANCHOR_DATE, language);
  const copy = getGuideCopy(language, anchorFormatted, pf.voiceSupportedOnlyNote);

  const steps = [
    {
      stepNumber: toNativeDigits('01', language),
      ...copy.steps[0],
      actionLabel: pf.navPresentBalance,
      onAction: onGoToPresentBalance,
      icon: Database,
    },
    {
      stepNumber: toNativeDigits('02', language),
      ...copy.steps[1],
      actionLabel: uiExtra.voiceFloatingBtn,
      onAction: onOpenVoiceAssistant,
      icon: Mic,
    },
    {
      stepNumber: toNativeDigits('03', language),
      ...copy.steps[2],
      actionLabel: pf.navPendingPayments,
      onAction: onGoToPendingPayments,
      icon: ArrowDownLeft,
    },
    {
      stepNumber: toNativeDigits('04', language),
      ...copy.steps[3],
      actionLabel: pf.navAdviceSimulator,
      onAction: onGoToAdviceSection || onGoToUpcomingPayments,
      icon: TrendingUp,
    },
    {
      stepNumber: toNativeDigits('05', language),
      ...copy.steps[4],
      actionLabel: pf.navNotices,
      onAction: onGoToNoticesTab,
      icon: Scale,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="khata-card rounded-3xl p-6 sm:p-8 space-y-3">
        <p className="text-xs font-extrabold text-[#14532D]">
          {pf.presentDatePrefix}: {anchorFormatted}
        </p>
        <h1 className="text-2xl sm:text-3xl font-black text-[#1C1917]">
          {pf.navGuide} — {t.appName}
        </h1>
        <p className="text-base text-[#57534E] leading-relaxed">{copy.intro}</p>

        {/* Quick Jump Links */}
        <div className="pt-2 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenMenu}
            className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#14532D] text-white text-xs sm:text-sm font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Menu className="w-4 h-4 text-[#FDE68A]" />
            <span>{pf.menuBtn}</span>
          </button>

          <button
            type="button"
            onClick={onGoToPresentBalance}
            className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#FAF1DF] hover:bg-[#F3E5C8] border border-[#D6C5A9] text-[#1C1917] text-xs sm:text-sm font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Wallet className="w-4 h-4 text-[#14532D]" />
            <span>{pf.navPresentBalance}</span>
          </button>

          <button
            type="button"
            onClick={onGoToPendingPayments}
            className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#FAF1DF] hover:bg-[#F3E5C8] border border-[#D6C5A9] text-[#1C1917] text-xs sm:text-sm font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowDownLeft className="w-4 h-4 text-[#1E3A8A]" />
            <span>{pf.navPendingPayments}</span>
          </button>

          <button
            type="button"
            onClick={onGoToUpcomingPayments}
            className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#FAF1DF] hover:bg-[#F3E5C8] border border-[#D6C5A9] text-[#1C1917] text-xs sm:text-sm font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4 text-[#9A3412]" />
            <span>{pf.navUpcomingPayments}</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <section
              key={step.stepNumber}
              className="khata-card rounded-3xl p-5 sm:p-6 space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#14532D] text-[#FDE68A] font-mono font-extrabold text-sm flex items-center justify-center shrink-0">
                    {step.stepNumber}
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-lg sm:text-xl font-extrabold text-[#1C1917]">
                      {step.title}
                    </h2>
                    <p className="text-sm sm:text-base text-[#44403C] leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
                <Icon className="w-5 h-5 text-[#14532D] shrink-0 hidden sm:block" />
              </div>

              <div className="pl-0 sm:pl-14 space-y-3">
                <div className="p-4 rounded-2xl bg-[#FAF1DF]/70 border border-[#E5D9C3] space-y-1.5">
                  {step.examples.map((ex, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 text-sm text-[#292524] font-medium"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#14532D] shrink-0 mt-0.5" />
                      <span>{ex}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={step.onAction}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-[#14532D] hover:bg-[#166534] text-white text-xs sm:text-sm font-extrabold inline-flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <span>{step.actionLabel}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
