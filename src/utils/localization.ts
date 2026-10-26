import { AppLanguage } from '../types/munimji';
import {
  ExpenseAffordabilityItem,
  FinancialAdviceReport,
  FollowUpRecommendation,
  MLPaymentPrediction,
} from '../types/cashflow';

// ============================================================================
// 1. NATIVE SCRIPT NUMERALS FOR ALL 6 DASHBOARD LANGUAGES
// ============================================================================

const DIGIT_TABLES: Record<AppLanguage, string> = {
  en: '0123456789',
  kn: '೦೧೨೩೪೫೬೭೮೯',
  hi: '०१२३४५६७८९',
  ta: '௦௧௨௩௪௫௬௭௮௯',
  te: '౦౧౨౩౪౫౬౭౮౯',
  ml: '൦൧൨൩൪൫൬൭൮൯',
};

export function toNativeDigits(val: string | number, lang: AppLanguage): string {
  const str = String(val ?? '');
  if (lang === 'en') return str;
  const table = DIGIT_TABLES[lang];
  if (!table) return str;
  return str.replace(/[0-9]/g, (d) => table[Number(d)] ?? d);
}

export function fromNativeDigits(val: string): string {
  let out = String(val ?? '');
  (Object.keys(DIGIT_TABLES) as AppLanguage[]).forEach((lang) => {
    if (lang === 'en') return;
    const table = DIGIT_TABLES[lang];
    for (let i = 0; i < 10; i++) {
      out = out.split(table[i]).join(String(i));
    }
  });
  return out;
}

const SHORT_MONTHS: Record<AppLanguage, string[]> = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  kn: ['ಜನ', 'ಫೆಬ್ರ', 'ಮಾರ್ಚ್', 'ಏಪ್ರಿ', 'ಮೇ', 'ಜೂನ್', 'ಜುಲೈ', 'ಆಗ', 'ಸೆಪ್ಟೆಂ', 'ಅಕ್ಟೋ', 'ನವೆಂ', 'ಡಿಸೆಂ'],
  hi: ['जन', 'फ़र', 'मार्च', 'अप्रै', 'मई', 'जून', 'जुला', 'अग', 'सितं', 'अक्टू', 'नवं', 'दिसं'],
  ta: ['ஜன', 'பிப்', 'மார்', 'ஏப்', 'மே', 'ஜூன்', 'ஜூலை', 'ஆக', 'செப்', 'அக்', 'நவ', 'டிச'],
  te: ['జన', 'ఫిబ్ర', 'మార్చి', 'ఏప్రి', 'మే', 'జూన్', 'జూలై', 'ఆగ', 'సెప్టెం', 'అక్టో', 'నవం', 'డిసెం'],
  ml: ['ജനു', 'ഫെബ്രു', 'മാർച്ച്', 'ഏപ്രിൽ', 'മേയ്', 'ജൂൺ', 'ജൂലൈ', 'ഓഗ', 'സെപ്റ്റം', 'ഒക്ടോ', 'നവം', 'ഡിസം'],
};

function fmtRupeeLocal(amount: number, lang: AppLanguage): string {
  const absFormatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
    numberingSystem: 'latn',
  }).format(Math.round(Math.abs(amount)));
  const native = toNativeDigits(absFormatted, lang);
  return amount < 0 ? `-₹${native}` : `₹${native}`;
}

function fmtShortDateLocal(iso: string | null | undefined, lang: AppLanguage): string {
  if (!iso) return '—';
  const parts = iso.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return toNativeDigits(iso, lang);
  const [, m, d] = parts;
  const mon = SHORT_MONTHS[lang]?.[m - 1] || SHORT_MONTHS.en[m - 1];
  return toNativeDigits(`${d} ${mon}`, lang);
}

function fmtFullDateLocal(iso: string | null | undefined, lang: AppLanguage): string {
  if (!iso) return '—';
  const parts = iso.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return toNativeDigits(iso, lang);
  const [y, m, d] = parts;
  const mon = SHORT_MONTHS[lang]?.[m - 1] || SHORT_MONTHS.en[m - 1];
  return toNativeDigits(`${d} ${mon} ${y}`, lang);
}

// ============================================================================
// 2. LATIN-TO-INDIC PHONETIC TRANSLITERATOR + TRADE/MONEY-LENDER GLOSSARY
//    Guarantees zero leftover English letters for custom names, lenders & bills
// ============================================================================

const WORD_GLOSSARY: Record<string, Record<Exclude<AppLanguage, 'en'>, string>> = {
  and: { kn: 'ಮತ್ತು', hi: 'और', ta: 'மற்றும்', te: 'మరియు', ml: 'ആൻഡ്' },
  '&': { kn: 'ಮತ್ತು', hi: 'और', ta: 'மற்றும்', te: 'మరియు', ml: 'ആൻഡ്' },
  sri: { kn: 'ಶ್ರೀ', hi: 'श्री', ta: 'ஸ்ரீ', te: 'శ్రీ', ml: 'ശ്രീ' },
  shri: { kn: 'ಶ್ರೀ', hi: 'श्री', ta: 'ஸ்ரீ', te: 'శ్రీ', ml: 'ശ്രീ' },
  sree: { kn: 'ಶ್ರೀ', hi: 'श्री', ta: 'ஸ்ரீ', te: 'శ్రీ', ml: 'ശ്രീ' },
  balaji: { kn: 'ಬಾಲಾಜಿ', hi: 'बालाजी', ta: 'பாலாஜி', te: 'బాలాజీ', ml: 'ബാലാജി' },
  supermarket: { kn: 'ಸೂಪರ್‌ಮಾರ್ಕೆಟ್', hi: 'सुपरमार्केट', ta: 'சூப்பர்மார்க்கெட்', te: 'సూపర్‌మార్కెట్', ml: 'സൂപ്പർമാർക്കറ്റ്' },
  superbazaar: { kn: 'ಸೂಪರ್‌ಬಜಾರ್', hi: 'सुपरबाज़ार', ta: 'சூப்பர்பஜார்', te: 'సూపర్‌బజార్', ml: 'സൂപ്പർബസാർ' },
  royal: { kn: 'ರಾಯಲ್', hi: 'रॉयल', ta: 'ராயல்', te: 'రాయల్', ml: 'റോയൽ' },
  kirana: { kn: 'ಕಿರಾಣಿ', hi: 'किराना', ta: 'கிரானா', te: 'కిరాణా', ml: 'കിരാന' },
  stores: { kn: 'ಸ್ಟೋರ್ಸ್', hi: 'स्टोर्स', ta: 'ஸ்டோர்ஸ்', te: 'స్టోర్స్', ml: 'സ്റ്റോഴ്സ്' },
  store: { kn: 'ಸ್ಟೋರ್', hi: 'स्टोर', ta: 'ஸ்டோர்', te: 'స్టోర్', ml: 'സ്റ്റോർ' },
  traders: { kn: 'ಟ್ರೇಡರ್ಸ್', hi: 'ट्रेडर्स', ta: 'டிரேடர்ஸ்', te: 'ట్రేడర్స్', ml: 'ട്രേഡേഴ്സ്' },
  trader: { kn: 'ಟ್ರೇಡರ್', hi: 'ट्रेडर', ta: 'டிரேடர்', te: 'ట్రేడర్', ml: 'ട്രേഡർ' },
  enterprises: { kn: 'ಎಂಟರ್‌ಪ್ರೈಸಸ್', hi: 'एंटरप्राइजेज', ta: 'என்டர்பிரைசஸ்', te: 'ఎంటర్‌ప్రైజెస్', ml: 'എന്റർപ്രൈസസ്' },
  mart: { kn: 'ಮಾರ್ಟ್', hi: 'मार्ट', ta: 'மார்ட்', te: 'మార్ట్', ml: 'മാർട്ട്' },
  cauvery: { kn: 'ಕಾವೇರಿ', hi: 'कावेरी', ta: 'காவேரி', te: 'కావేరి', ml: 'കാവേരി' },
  mysore: { kn: 'ಮೈಸೂರು', hi: 'मैसूर', ta: 'மைசூர்', te: 'మైసూర్', ml: 'മൈസൂർ' },
  mysuru: { kn: 'ಮೈಸೂರು', hi: 'मैसूरु', ta: 'மைசூரு', te: 'మైసూరు', ml: 'മൈസൂരു' },
  provision: { kn: 'ಪ್ರಾವಿಷನ್', hi: 'प्रोविज़न', ta: 'புரோவிஷன்', te: 'ప్రొవిజన్', ml: 'പ്രൊവിഷൻ' },
  co: { kn: 'ಕಂಪನಿ', hi: 'कंपनी', ta: 'கம்பெனி', te: 'కంపెనీ', ml: 'കമ്പനി' },
  'co.': { kn: 'ಕಂಪನಿ', hi: 'कंपनी', ta: 'கம்பெனி', te: 'కంపెనీ', ml: 'കമ്പനി' },
  'co-op': { kn: 'ಸಹಕಾರ ಸಂಘ', hi: 'सहकारी समिति', ta: 'கூட்டுறவு', te: 'సహకార సంస్థ', ml: 'സഹകരണ സംഘം' },
  pvt: { kn: 'ಪ್ರೈವೇಟ್', hi: 'प्राइवेट', ta: 'பிரைவேட்', te: 'ప్రైవేట్', ml: 'പ്രൈവറ്റ്' },
  ltd: { kn: 'ಲಿಮಿಟೆಡ್', hi: 'लिमिटेड', ta: 'லிமிடெட்', te: 'లిమిటెడ్', ml: 'ലിമിറ്റഡ്' },
  india: { kn: 'ಇಂಡಿಯಾ', hi: 'इंडिया', ta: 'இந்தியா', te: 'ఇండియా', ml: 'ഇന്ത്യ' },
  annapoorna: { kn: 'ಅನ್ನಪೂರ್ಣ', hi: 'अन्नपूर्णा', ta: 'அன்னபூர்ணா', te: 'అన్నపూర్ణ', ml: 'അന്നപൂർണ്ണ' },
  hotel: { kn: 'ಹೋಟೆಲ್', hi: 'होटल', ta: 'ஹோட்டல்', te: 'హోటల్', ml: 'ഹോട്ടൽ' },
  hoteliers: { kn: 'ಹೋಟೆಲಿಯರ್ಸ್', hi: 'होटलियर्स', ta: 'ஹோட்டலியர்ஸ்', te: 'హోటలియర్స్', ml: 'ഹോട്ടലിയേഴ്സ്' },
  catering: { kn: 'ಕ್ಯಾಟರಿಂಗ್', hi: 'कैटरिंग', ta: 'கேட்டரிங்', te: 'క్యాటరింగ్', ml: 'കാറ്ററിംഗ്' },
  malnad: { kn: 'ಮಲ್ನಾಡ್', hi: 'मलनाड', ta: 'மல்நாடு', te: 'మల్నాడ్', ml: 'മൽനാട്' },
  agro: { kn: 'ಆಗ್ರೋ', hi: 'एग्रो', ta: 'அக்ரோ', te: 'ఆగ్రో', ml: 'അഗ്രോ' },
  suppliers: { kn: 'ಸಪ್ಲೈಯರ್ಸ್', hi: 'सप्लायर्स', ta: 'சப்ளையர்ஸ்', te: 'సప్లయర్స్', ml: 'സപ്ലയേഴ്സ്' },
  supplier: { kn: 'ಸರಬರಾಜುದಾರರು', hi: 'सप्लायर', ta: 'சப்ளையர்', te: 'సప్లయర్', ml: 'സപ്ലയർ' },
  gandhi: { kn: 'ಗಾಂಧಿ', hi: 'गांधी', ta: 'காந்தி', te: 'గాంధీ', ml: 'ഗാന്ധി' },
  bazaar: { kn: 'ಬಜಾರ್', hi: 'बाज़ार', ta: 'பஜார்', te: 'బజార్', ml: 'ബസാർ' },
  properties: { kn: 'ಪ್ರಾಪರ್ಟೀಸ್', hi: 'प्रॉपर्टीज़', ta: 'பிராப்பர்டீஸ்', te: 'ప్రాపర్టీస్', ml: 'പ്രോപ്പർട്ടീസ്' },
  staff: { kn: 'ಸಿಬ್ಬಂದಿ', hi: 'स्टाफ', ta: 'ஊழியர்', te: 'సిబ్బంది', ml: 'ജീവനക്കാരുടെ' },
  payroll: { kn: 'ಸಂಬಳ ಪಟ್ಟಿ', hi: 'वेतन', ta: 'சம்பளம்', te: 'జీతాలు', ml: 'ശമ്പളം' },
  employees: { kn: 'ಕೆಲಸಗಾರರು', hi: 'कर्मचारी', ta: 'ஊழியர்கள்', te: 'ఉద్యోగులు', ml: 'ജീവനക്കാർ' },
  bescom: { kn: 'ಬೆಸ್ಕಾಂ', hi: 'बेसकॉम', ta: 'பெஸ்காம்', te: 'బెస్కామ్', ml: 'ബെസ്കോം' },
  karnataka: { kn: 'ಕರ್ನಾಟಕ', hi: 'कर्नाटक', ta: 'கர்நாடகா', te: 'కర్ణాటక', ml: 'കർണാടക' },
  ecopack: { kn: 'ಇಕೋಪ್ಯಾಕ್', hi: 'इकोपैक', ta: 'ஈக்கோபேக்', te: 'ఈకోప్యాక్', ml: 'ഇക്കോപാക്ക്' },
  coorg: { kn: 'ಕೊಡಗು', hi: 'कूर्ग', ta: 'கூர்க்', te: 'కూర్గ్', ml: 'കൂർഗ്' },
  planters: { kn: 'ಪ್ಲಾಂಟರ್ಸ್', hi: 'प्लांटर्स', ta: 'பிளான்டர்ஸ்', te: 'ప్లాంటర్స్', ml: 'പ്ലാന്റേഴ്സ്' },
  finance: { kn: 'ಫೈನಾನ್ಸ್', hi: 'फाइनेंस', ta: 'ஃபைனான்ஸ்', te: 'ఫైనాన్స్', ml: 'ഫിനാൻസ്' },
  financiers: { kn: 'ಲೇವಾದೇವಿಗಾರರು', hi: 'फाइनेंसर्स', ta: 'ஃபைனான்சியர்ஸ்', te: 'ఫైనాన్షియర్స్', ml: 'ഫിനാൻസിയേഴ്സ്' },
  financier: { kn: 'ಲೇವಾದೇವಿಗಾರರು', hi: 'साहूकार', ta: 'நிதியாளர்', te: 'వడ్డీ వ్యాపారి', ml: 'പണമിടപാടുകാരൻ' },
  moneylender: { kn: 'ಸಾಲಗಾರ / ಲೇವಾದೇವಿಗಾರರು', hi: 'साहूकार / महाजन', ta: 'வட்டி கடைக்காரர்', te: 'వడ్డీ వ్యాపారి', ml: 'പലിശക്കാരൻ' },
  lender: { kn: 'ಸಾಲ ನೀಡಿದವರು', hi: 'ऋणदाता', ta: 'கடன் கொடுத்தவர்', te: 'రుణదాత', ml: 'വായ്പ നൽകിയവർ' },
  sahukar: { kn: 'ಸಾಹುಕಾರ್', hi: 'साहूकार', ta: 'சாகுகார்', te: 'సాహుకార్', ml: 'സാഹുകാർ' },
  seth: { kn: 'ಸೇಠ್', hi: 'सेठ', ta: 'சேட்', te: 'సేఠ్', ml: 'സേഠ്' },
  chits: { kn: 'ಚಿಟ್ಸ್', hi: 'चिट्स', ta: 'சிட்ஸ்', te: 'చిట్స్', ml: 'ചിറ്റ്സ്' },
  loan: { kn: 'ಸಾಲ', hi: 'ऋण', ta: 'கடன்', te: 'లోన్', ml: 'വായ്പ' },
  bank: { kn: 'ಬ್ಯಾಂಕ್', hi: 'बैंक', ta: 'வங்கி', te: 'బ్యాంక్', ml: 'ബാങ്ക്' },
  interest: { kn: 'ಬಡ್ಡಿ', hi: 'ब्याज', ta: 'வட்டி', te: 'వడ్డీ', ml: 'പലിശ' },
  demo: { kn: 'ಡೆಮೊ', hi: 'डेमो', ta: 'டெமோ', te: 'డెమో', ml: 'ഡെമോ' },
  customer: { kn: 'ಗ್ರಾಹಕ', hi: 'ग्राहक', ta: 'வாடிக்கையாளர்', te: 'కస్టమర్', ml: 'ഇടപാടുകാരൻ' },
  vendor: { kn: 'ವ್ಯಾಪಾರಿ', hi: 'विक्रेता', ta: 'விற்பனையாளர்', te: 'వ్యాపారి', ml: 'വ്യാപാരി' },
  bill: { kn: 'ಬಿಲ್', hi: 'बिल', ta: 'பில்', te: 'బిల్లు', ml: 'ബിൽ' },
  invoice: { kn: 'ಬಿಲ್', hi: 'बिल', ta: 'பில்', te: 'బిల్లు', ml: 'ബിൽ' },
  order: { kn: 'ಆರ್ಡರ್', hi: 'ऑर्डर', ta: 'ஆர்டர்', te: 'ఆర్డర్', ml: 'ഓർഡർ' },
  consignment: { kn: 'ಸರಕು ಪೂರೈಕೆ', hi: 'माल खेप', ta: 'சரக்கு', te: 'సరుకు', ml: 'ചരക്ക്' },
  rent: { kn: 'ಬಾಡಿಗೆ', hi: 'किराया', ta: 'வாடகை', te: 'అద్దె', ml: 'വാടക' },
  upi: { kn: 'ಯುಪಿಐ', hi: 'यूपीआई', ta: 'யுபிஐ', te: 'యూపీఐ', ml: 'യുപിഐ' },
  neft: { kn: 'ಎನ್‌ಇಎಫ್‌ಟಿ', hi: 'एनईएफटी', ta: 'என்இஎஃப்டி', te: 'ఎన్‌ఈఎఫ్‌టీ', ml: 'എൻഇഎഫ്‌ടി' },
  rtgs: { kn: 'ಆರ್‌ಟಿಜಿಎಸ್', hi: 'आरटीजीएस', ta: 'ஆர்டிஜிஎஸ்', te: 'ఆర్‌టీజీఎస్', ml: 'ആർടിജിഎസ്' },
  imps: { kn: 'ಐಎಂಪಿಎಸ್', hi: 'आईएमपीएस', ta: 'ஐஎம்பிஎஸ்', te: 'ఐఎంపీఎస్', ml: 'ഐഎംപിഎസ്' },
  gst: { kn: 'ಜಿಎಸ್‌ಟಿ', hi: 'जीएसटी', ta: 'ஜிஎஸ்டி', te: 'జీఎస్టీ', ml: 'ജിഎസ്ടി' },
  tds: { kn: 'ಟಿಡಿಎಸ್', hi: 'टीडीएस', ta: 'டிடிஎஸ்', te: 'టీడీఎస్', ml: 'ടിഡിഎസ്' },
  whatsapp: { kn: 'ವಾಟ್ಸಾಪ್', hi: 'व्हाट्सएप', ta: 'வாட்ஸ்அப்', te: 'వాట్సాప్', ml: 'വാട്ട്‌സ്ആപ്പ്' },
  sharma: { kn: 'ಶರ್ಮಾ', hi: 'शर्मा', ta: 'ஷர்மா', te: 'శర్మ', ml: 'ശർമ്മ' },
  venkateshwara: { kn: 'ವೆಂಕಟೇಶ್ವರ', hi: 'वेंकटेश्वर', ta: 'வெங்கடேஸ்வரா', te: 'వెంకటేశ్వర', ml: 'വെങ്കിടേശ്വര' },
  nandi: { kn: 'ನಂದಿ', hi: 'नंदी', ta: 'நந்தி', te: 'నంది', ml: 'നന്ദി' },
  logistics: { kn: 'ಲಾಜಿಸ್ಟಿಕ್ಸ್', hi: 'लॉजिस्टिक्स', ta: 'லாஜிஸ்டிக்ஸ்', te: 'లాజిస్టిక్స్', ml: 'ലോജിസ്റ്റിക്സ്' },
  supplies: { kn: 'ಸಪ್ಲೈಸ್', hi: 'सप्लाइज', ta: 'சப்ளைஸ்', te: 'సప్లైస్', ml: 'സപ്ലൈസ്' },
  bapuji: { kn: 'ಬಾಪೂಜಿ', hi: 'बापूजी', ta: 'பாபுஜி', te: 'బాపూజీ', ml: 'ബാപൂജി' },
  tungabhadra: { kn: 'ತುಂಗಭದ್ರಾ', hi: 'तुंगभद्रा', ta: 'துங்கபத்ரா', te: 'తుంగభద్ర', ml: 'തുംഗഭദ്ര' },
  raichur: { kn: 'ರಾಯಚೂರು', hi: 'रायचूर', ta: 'ராய்ச்சூர்', te: 'రాయచూర్', ml: 'റായ്ച്ചൂർ' },
  paddy: { kn: 'ಭತ್ತದ', hi: 'धान', ta: 'நெல்', te: 'వరి', ml: 'നെല്ല്' },
  mills: { kn: 'ಮಿಲ್ಸ್', hi: 'मिल्स', ta: 'மில்ஸ்', te: 'మిల్స్', ml: 'മിൽസ്' },
  davanagere: { kn: 'ದಾವಣಗೆರೆ', hi: 'दावणगेरे', ta: 'தாவணಗೆರೆ', te: 'దావణగెరె', ml: 'ദാവണഗെരെ' },
  park: { kn: 'ಪಾರ್ಕ್', hi: 'पार्क', ta: 'பார்க்', te: 'పార్క్', ml: 'പാർക്ക്' },
  chamundi: { kn: 'ಚಾಮುಂಡಿ', hi: 'चामुंडी', ta: 'சாமுண்டி', te: 'చాముండి', ml: 'ചാമുണ്ഡി' },
  foods: { kn: 'ಫುಡ್ಸ್', hi: 'फूड्स', ta: 'ஃபுட்ஸ்', te: 'ఫుడ్స్', ml: 'ഫുഡ്സ്' },
  indianoil: { kn: 'ಇಂಡಿಯನ್ ಆಯಿಲ್', hi: 'इंडियन ऑयल', ta: 'இந்தியன் ஆயில்', te: 'ఇండియన్ ఆయిల్', ml: 'ഇന്ത്യൻ ഓയിൽ' },
  fleet: { kn: 'ಫ್ಲೀಟ್', hi: 'फ्लीट', ta: 'ஃப்ளீட்', te: 'ఫ్లీట్', ml: 'ഫ്ലീറ്റ്' },
  card: { kn: 'ಕಾರ್ಡ್', hi: 'कार्ड', ta: 'கார்டு', te: 'కార్డ్', ml: 'കാർഡ്' },
  crew: { kn: 'ಸಿಬ್ಬಂದಿ', hi: 'स्टाफ', ta: 'குழு', te: 'సిబ్బంది', ml: 'ജീവനക്കാർ' },
  ramesh: { kn: 'ರಮೇಶ್', hi: 'रमेश', ta: 'ரமேஷ்', te: 'రమేష్', ml: 'രമേശ്' },
  suresh: { kn: 'ಸುರೇಶ್', hi: 'सुरेश', ta: 'சுரேஷ்', te: 'సురేష్', ml: 'സുരേഷ്' },
  ganesh: { kn: 'ಗಣೇಶ್', hi: 'गणेश', ta: 'கணேஷ்', te: 'గణేష్', ml: 'ഗണേഷ്' },
  lakshmi: { kn: 'ಲಕ್ಷ್ಮಿ', hi: 'लक्ष्मी', ta: 'லட்சுமி', te: 'లక్ష్మి', ml: 'ലക്ഷ്മി' },
  mahadev: { kn: 'ಮಹಾದೇವ್', hi: 'महादेव', ta: 'மகாதேவ்', te: 'మహాదేవ్', ml: 'മഹാദേവ്' },
  manjunath: { kn: 'ಮಂಜುನಾಥ್', hi: 'मंजूनाथ', ta: 'மஞ்சுநாத்', te: 'మంజునాథ్', ml: 'മഞ്ജുനാഥ്' },
  maruthi: { kn: 'ಮಾರುತಿ', hi: 'मारुति', ta: 'மாருதி', te: 'మారుతి', ml: 'മാരുതി' },
  payment: { kn: 'ಪಾವತಿ', hi: 'भुगतान', ta: 'கட்டணம்', te: 'చెల్లింపు', ml: 'പേയ്‌മെന്റ്' },
  upcoming: { kn: 'ಮುಂಬರುವ', hi: 'आगामी', ta: 'வரவிருக்கும்', te: 'రాబోయే', ml: 'വരാനിരിക്കുന്ന' },
  pending: { kn: 'ಬಾಕಿ', hi: 'लंबित', ta: 'நிலுவை', te: 'పెండింగ్', ml: 'കുടിശ്ശിക' },
  expense: { kn: 'ಖರ್ಚು', hi: 'खर्च', ta: 'செலவு', te: 'ఖర్చు', ml: 'ചെലവ്' },
  sale: { kn: 'ಮಾರಾಟ', hi: 'बिक्री', ta: 'விற்பனை', te: 'అమ్మకం', ml: 'വിൽപ്പന' },
  sales: { kn: 'ಮಾರಾಟ', hi: 'बिक्री', ta: 'விற்பனை', te: 'అమ్మకాలు', ml: 'വിൽപ്പന' },
  cash: { kn: 'ನಗದು', hi: 'नकद', ta: 'ரொக்கம்', te: 'నగదు', ml: 'പണം' },
  retail: { kn: 'ಚಿಲ್ಲರೆ', hi: 'खुदरा', ta: 'சில்லறை', te: 'రిటైల్', ml: 'റീട്ടെയിൽ' },
  wholesale: { kn: 'ಸಗಟು', hi: 'थोक', ta: 'மொத்த', te: 'హోల్‌సేల్', ml: 'മൊത്തവ്യാപാരം' },
  my: { kn: 'ನನ್ನ', hi: 'मेरा', ta: 'எனது', te: 'నా', ml: 'എന്റെ' },
  business: { kn: 'ವ್ಯಾಪಾರ', hi: 'व्यवसाय', ta: 'வணிகம்', te: 'వ్యాపారం', ml: 'ബിസിനസ്' },
  ledger: { kn: 'ಖಾತೆ', hi: 'खाता', ta: 'கணக்கு', te: 'ఖాతా', ml: 'കണക്ക്' },
};

interface ScriptPhonetics {
  virama: string;
  indepVowels: Record<string, string>;
  matras: Record<string, string>;
  consonants: Record<string, string>;
}

const SCRIPT_PHONETICS: Record<Exclude<AppLanguage, 'en'>, ScriptPhonetics> = {
  kn: {
    virama: '್',
    indepVowels: { aa: 'ಆ', ee: 'ಈ', oo: 'ಊ', ai: 'ಐ', au: 'ಔ', ou: 'ಔ', a: 'ಅ', i: 'ಇ', u: 'ಉ', e: 'ಎ', o: 'ಒ' },
    matras: { aa: 'ಾ', ee: 'ೀ', oo: 'ೂ', ai: 'ೈ', au: 'ೌ', ou: 'ೌ', a: '', i: 'ಿ', u: 'ು', e: 'ೆ', o: 'ೊ' },
    consonants: {
      kh: 'ಖ', gh: 'ಘ', ch: 'ಚ', jh: 'ಝ', th: 'ಥ', dh: 'ಧ', ph: 'ಫ', bh: 'ಭ', sh: 'ಶ',
      k: 'ಕ', g: 'ಗ', c: 'ಕ', j: 'ಜ', t: 'ಟ', d: 'ಡ', n: 'ನ', p: 'ಪ', f: 'ಫ', b: 'ಬ',
      m: 'ಮ', y: 'ಯ', r: 'ರ', l: 'ಲ', v: 'ವ', w: 'ವ', s: 'ಸ', z: 'ಜ', h: 'ಹ', q: 'ಕ', x: 'ಕ್ಸ',
    },
  },
  hi: {
    virama: '्',
    indepVowels: { aa: 'आ', ee: 'ई', oo: 'ऊ', ai: 'ऐ', au: 'औ', ou: 'औ', a: 'अ', i: 'इ', u: 'उ', e: 'ए', o: 'ओ' },
    matras: { aa: 'ा', ee: 'ी', oo: 'ू', ai: 'ै', au: 'ौ', ou: 'ौ', a: '', i: 'ि', u: 'ु', e: 'े', o: 'ो' },
    consonants: {
      kh: 'ख', gh: 'घ', ch: 'च', jh: 'झ', th: 'थ', dh: 'ध', ph: 'फ', bh: 'भ', sh: 'श',
      k: 'क', g: 'ग', c: 'क', j: 'ज', t: 'ट', d: 'ड', n: 'न', p: 'प', f: 'फ', b: 'ब',
      m: 'म', y: 'य', r: 'र', l: 'ल', v: 'व', w: 'व', s: 'स', z: 'ज़', h: 'ह', q: 'क', x: 'क्स',
    },
  },
  ta: {
    virama: '்',
    indepVowels: { aa: 'ஆ', ee: 'ஈ', oo: 'ஊ', ai: 'ஐ', au: 'ஔ', ou: 'ஔ', a: 'அ', i: 'இ', u: 'உ', e: 'எ', o: 'ஒ' },
    matras: { aa: 'ா', ee: 'ீ', oo: 'ூ', ai: 'ை', au: 'ௌ', ou: 'ௌ', a: '', i: 'ி', u: 'ு', e: 'ெ', o: 'ொ' },
    consonants: {
      kh: 'க', gh: 'க', ch: 'ச', jh: 'ஜ', th: 'த', dh: 'த', ph: 'ப', bh: 'ப', sh: 'ஷ',
      k: 'க', g: 'க', c: 'க', j: 'ஜ', t: 'ட', d: 'ட', n: 'ந', p: 'ப', f: 'ஃப', b: 'ப',
      m: 'ம', y: 'ய', r: 'ர', l: 'ல', v: 'வ', w: 'வ', s: 'ஸ', z: 'ஜ', h: 'ஹ', q: 'க', x: 'க்ஸ',
    },
  },
  te: {
    virama: '్',
    indepVowels: { aa: 'ఆ', ee: 'ఈ', oo: 'ఊ', ai: 'ఐ', au: 'ఔ', ou: 'ఔ', a: 'అ', i: 'ఇ', u: 'ఉ', e: 'ఎ', o: 'ఒ' },
    matras: { aa: 'ా', ee: 'ీ', oo: 'ూ', ai: 'ై', au: 'ౌ', ou: 'ౌ', a: '', i: 'ి', u: 'ు', e: 'ె', o: 'ొ' },
    consonants: {
      kh: 'ఖ', gh: 'ఘ', ch: 'చ', jh: 'ఝ', th: 'థ', dh: 'ధ', ph: 'ఫ', bh: 'భ', sh: 'శ',
      k: 'క', g: 'గ', c: 'క', j: 'జ', t: 'ట', d: 'డ', n: 'న', p: 'ప', f: 'ఫ', b: 'బ',
      m: 'మ', y: 'య', r: 'ర', l: 'ల', v: 'వ', w: 'వ', s: 'స', z: 'జ', h: 'హ', q: 'క', x: 'క్స',
    },
  },
  ml: {
    virama: '്',
    indepVowels: { aa: 'ആ', ee: 'ഈ', oo: 'ഊ', ai: 'ഐ', au: 'ഔ', ou: 'ഔ', a: 'അ', i: 'ഇ', u: 'ഉ', e: 'എ', o: 'ഒ' },
    matras: { aa: 'ാ', ee: 'ീ', oo: 'ൂ', ai: 'ൈ', au: 'ൗ', ou: 'ൗ', a: '', i: 'ി', u: 'ു', e: 'െ', o: 'ൊ' },
    consonants: {
      kh: 'ഖ', gh: 'ഘ', ch: 'ച', jh: 'ഝ', th: 'ഥ', dh: 'ധ', ph: 'ഫ', bh: 'ഭ', sh: 'ശ',
      k: 'ക', g: 'ഗ', c: 'ക', j: 'ജ', t: 'ട', d: 'ഡ', n: 'ന', p: 'പ', f: 'ഫ', b: 'ബ',
      m: 'മ', y: 'യ', r: 'ര', l: 'ല', v: 'വ', w: 'വ', s: 'സ', z: 'സ', h: 'ഹ', q: 'ക', x: 'ക്സ',
    },
  },
};

function transliterateWordPhonetic(word: string, lang: Exclude<AppLanguage, 'en'>): string {
  const lower = word.toLowerCase();
  if (WORD_GLOSSARY[lower]?.[lang]) {
    return WORD_GLOSSARY[lower][lang];
  }
  const ph = SCRIPT_PHONETICS[lang];
  if (!ph) return word;

  const vowelTokens = ['aa', 'ee', 'oo', 'ai', 'au', 'ou', 'a', 'i', 'u', 'e', 'o'];
  const consTokens = [
    'kh', 'gh', 'ch', 'jh', 'th', 'dh', 'ph', 'bh', 'sh',
    'k', 'g', 'c', 'j', 't', 'd', 'n', 'p', 'f', 'b', 'm', 'y', 'r', 'l', 'v', 'w', 's', 'z', 'h', 'q', 'x',
  ];

  let i = 0;
  let result = '';
  while (i < lower.length) {
    const ch = lower[i];
    if (!/[a-z]/.test(ch)) {
      result += ch;
      i++;
      continue;
    }

    // Try matching consonant first
    let matchedCons: string | null = null;
    for (const ct of consTokens) {
      if (lower.startsWith(ct, i)) {
        matchedCons = ct;
        break;
      }
    }

    if (matchedCons) {
      const base = ph.consonants[matchedCons];
      i += matchedCons.length;

      // Check following vowel
      let matchedVowel: string | null = null;
      for (const vt of vowelTokens) {
        if (lower.startsWith(vt, i)) {
          matchedVowel = vt;
          break;
        }
      }

      if (matchedVowel) {
        // Silent trailing 'e' in English words like "store" -> virama
        if (matchedVowel === 'e' && i + 1 === lower.length && lower.length > 3) {
          result += base + ph.virama;
          i += 1;
        } else {
          result += base + ph.matras[matchedVowel];
          i += matchedVowel.length;
        }
      } else {
        // Consonant cluster or word-final consonant -> add virama
        result += base + ph.virama;
      }
      continue;
    }

    // Independent vowel
    let matchedIndep: string | null = null;
    for (const vt of vowelTokens) {
      if (lower.startsWith(vt, i)) {
        matchedIndep = vt;
        break;
      }
    }
    if (matchedIndep) {
      result += ph.indepVowels[matchedIndep];
      i += matchedIndep.length;
    } else {
      i++;
    }
  }

  return result;
}

export function transliterateToScript(text: string, lang: AppLanguage): string {
  if (!text) return '';
  if (lang === 'en') return text;

  const replacedAmp = text.replace(/\s*&\s*/g, ` ${WORD_GLOSSARY['&'][lang]} `);
  const tokens = replacedAmp.split(/([A-Za-z]+)/);
  const converted = tokens
    .map((tok) => {
      if (/^[A-Za-z]+$/.test(tok)) {
        return transliterateWordPhonetic(tok, lang);
      }
      return tok;
    })
    .join('');

  return toNativeDigits(converted, lang);
}

// ============================================================================
// 3. EXACT 6-LANGUAGE DICTIONARIES FOR CUSTOMERS, SUPPLIERS, LENDERS & BILLS
// ============================================================================

const PARTY_EXACT_MAP: Record<string, Record<AppLanguage, string>> = {
  'Sri Balaji Supermarket': {
    en: 'Sri Balaji Supermarket',
    kn: 'ಶ್ರೀ ಬಾಲಾಜಿ ಸೂಪರ್‌ಮಾರ್ಕೆಟ್',
    hi: 'श्री बालाजी सुपरमार्केट',
    ta: 'ஸ்ரீ பாலாஜி சூப்பர்மார்க்கெட்',
    te: 'శ్రీ బాలాజీ సూపర్‌మార్కెట్',
    ml: 'ശ്രീ ബാലാജി സൂപ്പർമാർക്കറ്റ്',
  },
  'Royal Kirana Stores': {
    en: 'Royal Kirana Stores',
    kn: 'ರಾಯಲ್ ಕಿರಾಣಿ ಸ್ಟೋರ್ಸ್',
    hi: 'रॉयल किराना स्टोर्स',
    ta: 'ராயல் கிரானா ஸ்டோர்ஸ்',
    te: 'రాయల్ కిరాణా స్టోర్స్',
    ml: 'റോയൽ കിരാന സ്റ്റോഴ്സ്',
  },
  'Cauvery Mart': {
    en: 'Cauvery Mart',
    kn: 'ಕಾವೇರಿ ಮಾರ್ಟ್',
    hi: 'कावेरी मार्ट',
    ta: 'காவேரி மார்ட்',
    te: 'కావేరి మార్ట్',
    ml: 'കാവേരി മാർട്ട്',
  },
  'Mysore Provision Co.': {
    en: 'Mysore Provision Co.',
    kn: 'ಮೈಸೂರು ಪ್ರಾವಿಷನ್ ಕಂಪನಿ',
    hi: 'मैसूर प्रोविज़न कंपनी',
    ta: 'மைசூர் புரோவிஷன் கம்பெனி',
    te: 'మైసూర్ ప్రొవిజన్ కంపెనీ',
    ml: 'മൈസൂർ പ്രൊവിഷൻ കമ്പനി',
  },
  'Counter Cash Walk-in (Aggregated)': {
    en: 'Counter Cash Walk-in (Aggregated)',
    kn: 'ಅಂಗಡಿ ಕೌಂಟರ್ ನಗದು ಮಾರಾಟ (ಒಟ್ಟು)',
    hi: 'दुकान काउंटर नकद बिक्री (कुल)',
    ta: 'கடை கவுண்டர் ரொக்க விற்பனை (மொத்தம்)',
    te: 'షాపు కౌంటర్ నగదు అమ్మకాలు (మొత్తం)',
    ml: 'കട കൗണ്ടർ ക്യാഷ് വിൽപ്പന (ആകെ)',
  },
  'Annapoorna Hotel & Catering': {
    en: 'Annapoorna Hotel & Catering',
    kn: 'ಅನ್ನಪೂರ್ಣ ಹೋಟೆಲ್ ಮತ್ತು ಕ್ಯಾಟರಿಂಗ್',
    hi: 'अन्नपूर्णा होटल और कैटरिंग',
    ta: 'அன்னபூர்ணா ஹோட்டல் மற்றும் கேட்டரிங்',
    te: 'అన్నపూర్ణ హోటల్ మరియు క్యాటరింగ్',
    ml: 'അന്നപൂർണ്ണ ഹോട്ടൽ ആൻഡ് കാറ്ററിംഗ്',
  },
  'Malnad Agro Suppliers': {
    en: 'Malnad Agro Suppliers',
    kn: 'ಮಲ್ನಾಡ್ ಆಗ್ರೋ ಸಪ್ಲೈಯರ್ಸ್',
    hi: 'मलनाड एग्रो सप्लायर्स',
    ta: 'மல்நாடு அக்ரோ சப்ளையர்ஸ்',
    te: 'మల్నాడ్ ఆగ్రో సప్లయర్స్',
    ml: 'മൽനാട് അഗ്രോ സപ്ലയേഴ്സ്',
  },
  'Gandhi Bazaar Properties': {
    en: 'Gandhi Bazaar Properties',
    kn: 'ಗಾಂಧಿ ಬಜಾರ್ ಪ್ರಾಪರ್ಟೀಸ್',
    hi: 'गांधी बाज़ार प्रॉपर्टीज़',
    ta: 'காந்தி பஜார் பிராப்பர்டீஸ்',
    te: 'గాంధీ బజార్ ప్రాపర్టీస్',
    ml: 'ഗാന്ധി ബസാർ പ്രോപ്പർട്ടീസ്',
  },
  'Staff Payroll (3 employees)': {
    en: 'Staff Payroll (3 employees)',
    kn: 'ಅಂಗಡಿ ಸಿಬ್ಬಂದಿ ಸಂಬಳ (೩ ಜನ)',
    hi: 'दुकान स्टाफ वेतन (३ कर्मचारी)',
    ta: 'கடை ஊழியர் சம்பளம் (௩ ஊழியர்கள்)',
    te: 'షాపు సిబ్బంది జీతం (౩ ఉద్యోగులు)',
    ml: 'കട ജീവനക്കാരുടെ ശമ്പളം (൩ പേർ)',
  },
  'BESCOM Karnataka': {
    en: 'BESCOM Karnataka',
    kn: 'ಬೆಸ್ಕಾಂ ಕರ್ನಾಟಕ (ವಿದ್ಯುತ್)',
    hi: 'बेसकॉम कर्नाटक (बिजली)',
    ta: 'பெஸ்காம் கர்நாடகா (மின்சாரம்)',
    te: 'బెస్కామ్ కర్ణాటక (విద్యుత్)',
    ml: 'ബെസ്കോം കർണാടക (വൈദ്യുതി)',
  },
  'EcoPack India Ltd': {
    en: 'EcoPack India Ltd',
    kn: 'ಇಕೋಪ್ಯಾಕ್ ಇಂಡಿಯಾ ಲಿಮಿಟೆಡ್',
    hi: 'इकोपैक इंडिया लिमिटेड',
    ta: 'ஈக்கோபேக் இந்தியா லிமிடெட்',
    te: 'ఈకోప్యాక్ ఇండియా లిమిటెడ్',
    ml: 'ഇക്കോപാക്ക് ഇന്ത്യ ലിമിറ്റഡ്',
  },
  'Coorg Planters Co-op': {
    en: 'Coorg Planters Co-op',
    kn: 'ಕೊಡಗು ಪ್ಲಾಂಟರ್ಸ್ ಸಹಕಾರ ಸಂಘ',
    hi: 'कूर्ग प्लांटर्स सहकारी समिति',
    ta: 'கூர்க் பிளான்டர்ஸ் கூட்டுறவு',
    te: 'కూర్గ్ ప్లాంటర్స్ సహకార సంస్థ',
    ml: 'കൂർഗ് പ്ലാന്റേഴ്സ് സഹകരണ സംഘം',
  },
  'Bapuji SuperBazaar': {
    en: 'Bapuji SuperBazaar',
    kn: 'ಬಾಪೂಜಿ ಸೂಪರ್‌ಬಜಾರ್',
    hi: 'बापूजी सुपरबाज़ार',
    ta: 'பாபுஜி சூப்பர்பஜார்',
    te: 'బాపూజీ సూపర్‌బజార్',
    ml: 'ബാപൂജി സൂപ്പർബസാർ',
  },
  'Tungabhadra Hoteliers': {
    en: 'Tungabhadra Hoteliers',
    kn: 'ತುಂಗಭದ್ರಾ ಹೋಟೆಲಿಯರ್ಸ್',
    hi: 'तुंगभद्रा होटलियर्स',
    ta: 'துங்கபத்ரா ஹோட்டலியர்ஸ்',
    te: 'తుంగభద్ర హోటలియర్స్',
    ml: 'തുംഗഭദ്ര ഹോട്ടലിയേഴ്സ്',
  },
  'Raichur Paddy Mills': {
    en: 'Raichur Paddy Mills',
    kn: 'ರಾಯಚೂರು ಭತ್ತದ ಮಿಲ್ಸ್',
    hi: 'रायचूर धान मिल्स',
    ta: 'ராய்ச்சூர் நெல் மில்ஸ்',
    te: 'రాయచూర్ వరి మిల్స్',
    ml: 'റായ്ച്ചൂർ നെല്ല് മിൽസ്',
  },
  'Davanagere Agro Park': {
    en: 'Davanagere Agro Park',
    kn: 'ದಾವಣಗೆರೆ ಆಗ್ರೋ ಪಾರ್ಕ್',
    hi: 'दावणगेरे एग्रो पार्क',
    ta: 'தாவணகெரே அக்ரோ பார்க்',
    te: 'దావణగెరె ఆగ్రో పార్క్',
    ml: 'ദാവണഗെരെ അഗ്രോ പാർക്ക്',
  },
  'Chamundi Foods Pvt Ltd': {
    en: 'Chamundi Foods Pvt Ltd',
    kn: 'ಚಾಮುಂಡಿ ಫುಡ್ಸ್ ಪ್ರೈವೇಟ್ ಲಿಮಿಟೆಡ್',
    hi: 'चामुंडी फूड्स प्राइवेट लिमिटेड',
    ta: 'சாமுண்டி ஃபுட்ஸ் பிரைவேட் லிமிடெட்',
    te: 'చాముండి ఫుడ్స్ ప్రైవేట్ లిమిటెడ్',
    ml: 'ചാമുണ്ഡി ഫുഡ്സ് പ്രൈവറ്റ് ലിമിറ്റഡ്',
  },
  'IndianOil Fleet Card': {
    en: 'IndianOil Fleet Card',
    kn: 'ಇಂಡಿಯನ್ ಆಯಿಲ್ ಫ್ಲೀಟ್ ಕಾರ್ಡ್',
    hi: 'इंडियन ऑयल फ्लीट कार्ड',
    ta: 'இந்தியன் ஆயில் ஃப்ளீட் கார்டு',
    te: 'ఇండియన్ ఆయిల్ ఫ్లీట్ కార్డ్',
    ml: 'ഇന്ത്യൻ ഓയിൽ ഫ്ലീറ്റ് കാർഡ്',
  },
  'Fleet Crew Payroll': {
    en: 'Fleet Crew Payroll',
    kn: 'ವಾಹನ ಚಾಲಕರ ಸಂಬಳ ಪಟ್ಟಿ',
    hi: 'वाहन स्टाफ वेतन',
    ta: 'வாகன ஊழியர் சம்பளம்',
    te: 'వాహన సిబ్బంది జీతం',
    ml: 'വാഹന ജീവനക്കാരുടെ ശമ്പളം',
  },
};

export function localizePartyName(name: string | undefined, lang: AppLanguage): string {
  if (!name) return '';
  const trimmed = name.trim();
  if (lang === 'en') return trimmed;
  if (PARTY_EXACT_MAP[trimmed]?.[lang]) {
    return PARTY_EXACT_MAP[trimmed][lang];
  }
  const ciHit = Object.keys(PARTY_EXACT_MAP).find(
    (k) => k.toLowerCase() === trimmed.toLowerCase()
  );
  if (ciHit && PARTY_EXACT_MAP[ciHit]?.[lang]) {
    return PARTY_EXACT_MAP[ciHit][lang];
  }
  return transliterateToScript(trimmed, lang);
}

const DEMO_TAG_MAP: Record<AppLanguage, string> = {
  en: ' [Demo]',
  kn: ' [ಡೆಮೊ]',
  hi: ' [डेमो]',
  ta: ' [டெமோ]',
  te: ' [డెమో]',
  ml: ' [ഡെമോ]',
};

export function localizeBusinessLabel(name: string | undefined, lang: AppLanguage): string {
  if (!name) return '';
  if (lang === 'en') return name;
  const isDemo = /\[demo\]/i.test(name);
  const clean = name.replace(/\s*\[demo\]\s*/gi, '').trim();
  const tag = isDemo ? DEMO_TAG_MAP[lang] : '';

  if (/sharma stores/i.test(clean)) {
    const m: Record<AppLanguage, string> = {
      en: 'Sharma Stores',
      kn: 'ಶರ್ಮಾ ಸ್ಟೋರ್ಸ್',
      hi: 'शर्मा स्टोर्स',
      ta: 'ஷர்மா ஸ்டோர்ஸ்',
      te: 'శర్మ స్టోర్స్',
      ml: 'ശർമ്മ സ്റ്റോഴ്സ്',
    };
    return `${m[lang]}${tag}`;
  }
  if (/venkateshwara traders/i.test(clean)) {
    const m: Record<AppLanguage, string> = {
      en: 'Venkateshwara Traders',
      kn: 'ವೆಂಕಟೇಶ್ವರ ಟ್ರೇಡರ್ಸ್',
      hi: 'वेंकटेश्वर ट्रेडर्स',
      ta: 'வெங்கடேஸ்வரா டிரேடர்ஸ்',
      te: 'వెంకటేశ్వర ట్రేడర్స్',
      ml: 'വെങ്കിടേശ്വര ട്രേഡേഴ്സ്',
    };
    return `${m[lang]}${tag}`;
  }
  if (/nandi logistics/i.test(clean)) {
    const m: Record<AppLanguage, string> = {
      en: 'Nandi Logistics & Supplies',
      kn: 'ನಂದಿ ಲಾಜಿಸ್ಟಿಕ್ಸ್ ಮತ್ತು ಸಪ್ಲೈಸ್',
      hi: 'नंदी लॉजिस्टिक्स और सप्लाइज',
      ta: 'நந்தி லாஜிஸ்டிக்ஸ் மற்றும் சப்ளைஸ்',
      te: 'నంది లాజిస్టిక్స్ మరియు సప్లైస్',
      ml: 'നന്ദി ലോജിസ്റ്റിക്സ് ആൻഡ് സപ്ലൈസ്',
    };
    return `${m[lang]}${tag}`;
  }
  if (/^my business$/i.test(clean) || /^my real business ledger$/i.test(clean)) {
    const m: Record<AppLanguage, string> = {
      en: clean,
      kn: 'ನನ್ನ ನೈಜ ವ್ಯಾಪಾರ ಖಾತೆ',
      hi: 'मेरा असली व्यापार खाता',
      ta: 'எனது உண்மை வணிகக் கணக்கு',
      te: 'నా నిజమైన వ్యాపార ఖాతా',
      ml: 'എന്റെ യഥാർത്ഥ ബിസിനസ് കണക്ക്',
    };
    return `${m[lang]}${tag}`;
  }
  return `${transliterateToScript(clean, lang)}${tag}`;
}

const INVOICE_PREFIX_MAP: Record<string, Record<Exclude<AppLanguage, 'en'>, string>> = {
  INV: { kn: 'ಬಿಲ್', hi: 'बिल', ta: 'பில்', te: 'బిల్లు', ml: 'ബിൽ' },
  BILL: { kn: 'ರಸೀದಿ', hi: 'बिल', ta: 'பில்', te: 'బిల్లు', ml: 'ബിൽ' },
  RENT: { kn: 'ಬಾಡಿಗೆ', hi: 'किराया', ta: 'வாடகை', te: 'అద్దె', ml: 'വാടക' },
  RET: { kn: 'ಚಿಲ್ಲರೆ', hi: 'खुदरा', ta: 'சில்லறை', te: 'రిటైల్', ml: 'റീട്ടെയിൽ' },
  BES: { kn: 'ಬೆಸ್ಕಾಂ', hi: 'बिजली', ta: 'மின்', te: 'విద్యుత్', ml: 'വൈദ്യുതി' },
  ECO: { kn: 'ಇಕೋ', hi: 'इको', ta: 'ஈக்கோ', te: 'ఈకో', ml: 'ഇക്കോ' },
  COORG: { kn: 'ಕೊಡಗು', hi: 'कूर्ग', ta: 'கூர்க்', te: 'కూర్గ్', ml: 'കൂർഗ്' },
  VT: { kn: 'ವಿಟಿ', hi: 'वीटी', ta: 'விடி', te: 'వీటీ', ml: 'വിടി' },
  RPM: { kn: 'ಆರ್‌ಪಿಎಂ', hi: 'आरपीएम', ta: 'ஆர்பிஎம்', te: 'ఆర్‌పీఎం', ml: 'ആർപിഎം' },
  DAP: { kn: 'ಡಿಎಪಿ', hi: 'डीएपी', ta: 'டிஏபி', te: 'డీఏపీ', ml: 'ഡിഎപി' },
  NL: { kn: 'ಎನ್‌ಎಲ್', hi: 'एनएल', ta: 'என்எல்', te: 'ఎన్‌ఎల్', ml: 'എൻഎൽ' },
  IOC: { kn: 'ಐಒಸಿ', hi: 'आईओसी', ta: 'ஐஓசி', te: 'ఐఓసీ', ml: 'ഐഒസി' },
  NOV: { kn: 'ನವೆಂ', hi: 'नवं', ta: 'நவ', te: 'నవం', ml: 'നവം' },
  DEC: { kn: 'ಡಿಸೆಂ', hi: 'दिसं', ta: 'டிச', te: 'డిసెం', ml: 'ഡിസം' },
  JUN: { kn: 'ಜೂನ್', hi: 'जून', ta: 'ஜூன்', te: 'జూన్', ml: 'ജൂൺ' },
  JUL: { kn: 'ಜುಲೈ', hi: 'जुला', ta: 'ஜூலை', te: 'జూలై', ml: 'ജൂലൈ' },
  AUG: { kn: 'ಆಗ', hi: 'अग', ta: 'ஆக', te: 'ఆగ', ml: 'ഓഗ' },
  SEP: { kn: 'ಸೆಪ್ಟೆಂ', hi: 'सितं', ta: 'செப்', te: 'సెప్టెం', ml: 'സെപ്റ്റം' },
};

export function localizeInvoiceCode(code: string | undefined, lang: AppLanguage): string {
  if (!code) return '';
  if (lang === 'en') return code;
  const replaced = code.replace(/[A-Za-z]+/g, (seg) => {
    const up = seg.toUpperCase();
    if (INVOICE_PREFIX_MAP[up]?.[lang]) {
      return INVOICE_PREFIX_MAP[up][lang];
    }
    return transliterateToScript(seg, lang);
  });
  return toNativeDigits(replaced, lang);
}

export function localizeCustomerId(id: string | undefined, lang: AppLanguage): string {
  if (!id) return '';
  if (lang === 'en') return id;
  const prefixMap: Record<Exclude<AppLanguage, 'en'>, string> = {
    kn: 'ಗ್ರಾಹಕ',
    hi: 'ग्राहक',
    ta: 'வாடிக்கையாளர்',
    te: 'కస్టమర్',
    ml: 'ഇടപാടുകാരൻ',
  };
  const replaced = id
    .replace(/^cust-vt-/i, `${prefixMap[lang]}-`)
    .replace(/^cust-nl-/i, `${prefixMap[lang]}-`)
    .replace(/^cust-auto-/i, `${prefixMap[lang]}-`)
    .replace(/^cust-/i, `${prefixMap[lang]}-`);
  return transliterateToScript(replaced, lang);
}

export function localizePhoneDisplay(phone: string | undefined, lang: AppLanguage): string {
  if (!phone) return '';
  if (/^n\/a$/i.test(phone.trim())) {
    const naMap: Record<AppLanguage, string> = {
      en: 'N/A',
      kn: 'ಲಭ್ಯವಿಲ್ಲ',
      hi: 'उपलब्ध नहीं',
      ta: 'இல்லை',
      te: 'లేదు',
      ml: 'ലഭ്യമല്ല',
    };
    return naMap[lang];
  }
  return toNativeDigits(phone, lang);
}

const TX_TITLE_BY_ID: Record<string, Record<AppLanguage, string>> = {
  'tx-in-1': {
    en: 'Whole Spices Consignment',
    kn: 'ಸಗಟು ಮಸಾಲೆ ಸರಕು ಪೂರೈಕೆ',
    hi: 'साबुत मसाला थोक खेप',
    ta: 'மொத்த மசாலா சரக்கு விநியோகம்',
    te: 'హోల్‌సేల్ మసాలా సరుకు సరఫరా',
    ml: 'മൊത്തവ്യാപാര മസാല ചരക്ക് വിതരണം',
  },
  'tx-in-2': {
    en: 'Diwali Festive Restock Order',
    kn: 'ದೀಪಾವಳಿ ಹಬ್ಬದ ಸರಕು ಆರ್ಡರ್',
    hi: 'दिवाली त्योहार माल ऑर्डर',
    ta: 'தீபாவளி பண்டிகை சரக்கு ஆர்டர்',
    te: 'దీపావళి పండుగ సరుకు ఆర్డర్',
    ml: 'ദീപാവലി ഉത്സവ സ്റ്റോക്ക് ഓർഡർ',
  },
  'tx-in-3': {
    en: 'Weekly Supply Batch #4',
    kn: 'ವಾರದ ಸರಬರಾಜು ಕಂತು #೪',
    hi: 'साप्ताहिक सप्लाई खेप #४',
    ta: 'வாராந்திர விநியோக தொகுப்பு #௪',
    te: 'వారపు సరఫరా బ్యాచ్ #౪',
    ml: 'പ്രതിവാര വിതരണ ബാച്ച് #൪',
  },
  'tx-in-4': {
    en: 'Coriander Seeds Wholesale',
    kn: 'ಕೊತ್ತಂಬರಿ ಬೀಜ ಸಗಟು ಮಾರಾಟ',
    hi: 'धनिया बीज थोक ऑर्डर',
    ta: 'மல்லி விதை மொத்த விற்பனை',
    te: 'ధనియాల హోల్‌సేల్ అమ్మకం',
    ml: 'മല്ലി വിത്ത് മൊത്തവ്യാപാരം',
  },
  'tx-in-5': {
    en: 'Monthly Retail Cash Deposits',
    kn: 'ಮಾಸಿಕ ಚಿಲ್ಲರೆ ನಗದು ಮತ್ತು ಯುಪಿಐ ಜಮಾ',
    hi: 'मासिक खुदरा नकद व यूपीआई जमा',
    ta: 'மாதாந்திர சில்லறை ரொக்க வரவு',
    te: 'నెలవారీ రిటైల్ నగదు & యూపీఐ జమ',
    ml: 'പ്രതിമാസ റീട്ടെയിൽ ക്യാഷ് വരവ്',
  },
  'tx-in-6': {
    en: 'First Trial Catering Spice Pack',
    kn: 'ಮೊದಲ ಪ್ರಾಯೋಗಿಕ ಕ್ಯಾಟರಿಂಗ್ ಮಸಾಲೆ ಪ್ಯಾಕ್',
    hi: 'पहला ट्रायल कैटरिंग मसाला पैक',
    ta: 'முதல் சோதனை கேட்டரிங் மசாலா தொகுப்பு',
    te: 'మొదటి ట్రయల్ క్యాటరింగ్ మసాలా ప్యాక్',
    ml: 'ആദ്യ ട്രയൽ കാറ്ററിംഗ് മസാല പായ്ക്ക്',
  },
  'tx-out-1': {
    en: 'Raw Green Cardamom Batch #78',
    kn: 'ಹಸಿರು ಏಲಕ್ಕಿ ಸರಕು #೭೮ ಖರೀದಿ',
    hi: 'कच्ची हरी इलायची खेप #७८',
    ta: 'பச்சை ஏலக்காய் கொள்முதல் #௭௮',
    te: 'పచ్చి యాలకుల కొనుగోలు #౭౮',
    ml: 'പച്ച ഏലയ്ക്ക സംഭരണം #൭൮',
  },
  'tx-out-2': {
    en: 'Commercial Godown & Shop Rent',
    kn: 'ಗೋದಾಮು ಮತ್ತು ಅಂಗಡಿ ತಿಂಗಳ ಬಾಡಿಗೆ',
    hi: 'गोदाम और दुकान का मासिक किराया',
    ta: 'கிடங்கு மற்றும் கடை மாத வாடகை',
    te: 'గోదాము మరియు షాపు నెలవారీ అద్దె',
    ml: 'ഗോഡൗൺ, കട പ്രതിമാസ വാടക',
  },
  'tx-out-3': {
    en: 'Store Staff Wages & Advance',
    kn: 'ಅಂಗಡಿ ಸಿಬ್ಬಂದಿ ಸಂಬಳ ಮತ್ತು ಮುಂಗಡ',
    hi: 'दुकान स्टाफ का वेतन और एडवांस',
    ta: 'கடை ஊழியர் சம்பளம் மற்றும் முன்பணம்',
    te: 'షాపు సిబ్బంది జీతం & అడ్వాన్స్',
    ml: 'കട ജീവനക്കാരുടെ ശമ്പളവും അഡ്വാൻസും',
  },
  'tx-out-4': {
    en: 'Commercial Electricity & BESCOM',
    kn: 'ವಾಣಿಜ್ಯ ವಿದ್ಯುತ್ ಬಿಲ್ (ಬೆಸ್ಕಾಂ)',
    hi: 'दुकान बिजली बिल (बेसकॉम)',
    ta: 'வணிக மின்சார பில் (பெஸ்காம்)',
    te: 'షాపు విద్యుత్ బిల్లు (బెస్కామ్)',
    ml: 'വാണിജ്യ വൈദ്യുതി ബിൽ (ബെസ്കോം)',
  },
  'tx-out-5': {
    en: 'Biodegradable Packaging Pouches',
    kn: 'ಪರಿಸರ ಸ್ನೇಹಿ ಪ್ಯಾಕಿಂಗ್ ಪೌಚ್ ಖರೀದಿ',
    hi: 'मसाला पैकिंग पाउच सप्लाई',
    ta: 'மசாலா பேக்கிங் பைகள் கொள்முதல்',
    te: 'మసాలా ప్యాకింగ్ పౌచ్‌ల కొనుగోలు',
    ml: 'മസാല പാക്കിംഗ് പൗച്ചുകൾ',
  },
  'tx-out-6': {
    en: 'December Godown Rent & Maintenance',
    kn: 'ಡಿಸೆಂಬರ್ ಗೋದಾಮು ಬಾಡಿಗೆ ಮತ್ತು ನಿರ್ವಹಣೆ',
    hi: 'दिसंबर गोदाम किराया और रखरखाव',
    ta: 'டிசம்பர் கிடங்கு வாடகை & பராமரிப்பு',
    te: 'డిసెంబర్ గోదాము అద్దె & నిర్వహణ',
    ml: 'ഡിസംബർ ഗോഡൗൺ വാടകയും പരിപാലനവും',
  },
  'tx-out-7': {
    en: 'Winter Black Pepper Bulk Procurement',
    kn: 'ಚಳಿಗಾಲದ ಕರಿಮೆಣಸು ಸಗಟು ಖರೀದಿ',
    hi: 'सर्दियों की काली मिर्च थोक खरीद',
    ta: 'குளிர்கால மிளகு மொத்த கொள்முதல்',
    te: 'శీతాకాల మిరియాల హోల్‌సేల్ కొనుగోలు',
    ml: 'ശീതകാല കുരുമുളക് മൊത്ത സംഭരണം',
  },
  'vt-in-1': {
    en: 'Toor Dal 20 Quintal Supply',
    kn: 'ತೊಗರಿ ಬೇಳೆ ೨೦ ಕ್ವಿಂಟಾಲ್ ಪೂರೈಕೆ',
    hi: 'तूर दाल २० क्विंटल सप्लाई',
    ta: 'துவரம் பருப்பு ௨௦ குவிண்டால் விநியோகம்',
    te: 'కందిపప్పు ౨౦ క్వింటాళ్ల సరఫరా',
    ml: 'തുവര പരിപ്പ് ൨൦ ക്വിന്റൽ വിതരണം',
  },
  'vt-in-2': {
    en: 'Sona Masoori Rice Consignment',
    kn: 'ಸೋನಾ ಮಸೂರಿ ಅಕ್ಕಿ ಸರಕು ಪೂರೈಕೆ',
    hi: 'सोना मसूरी चावल थोक खेप',
    ta: 'சோனா மசூரி அரிசி சரக்கு விநியோகம்',
    te: 'సోనా మసూరి బియ్యం సరుకు సరఫరా',
    ml: 'സോന മസൂരി അരി ചരക്ക് വിതരണം',
  },
  'vt-out-1': {
    en: 'APMC Mandi Grain Procurement',
    kn: 'ಎಪಿಎಂಸಿ ಮಂಡಿ ಧಾನ್ಯ ಖರೀದಿ ಬಿಲ್',
    hi: 'एपीएमसी मंडी अनाज खरीद बिल',
    ta: 'ஏபிஎம்சி மண்டி தானிய கொள்முதல்',
    te: 'ఏపీఎంసీ మండి ధాన్యం కొనుగోలు',
    ml: 'എപിഎംസി മണ്ഡി ധാന്യ സംഭരണം',
  },
  'vt-out-2': {
    en: 'Warehouse Lease & Cold Fumigation',
    kn: 'ಗೋದಾಮು ಬಾಡಿಗೆ ಮತ್ತು ಧೂಮೀಕರಣ',
    hi: 'गोदाम किराया और कीट सुरक्षा',
    ta: 'கிடங்கு வாடகை & பராமரிப்பு',
    te: 'గోదాము అద్దె & ఫ్యూమిగేషన్',
    ml: 'ഗോഡൗൺ വാടകയും ശുചീകരണവും',
  },
  'nl-in-1': {
    en: 'Monthly Corrugated Box Contract',
    kn: 'ಮಾಸಿಕ ಪ್ಯಾಕಿಂಗ್ ಬಾಕ್ಸ್ ಗುತ್ತಿಗೆ',
    hi: 'मासिक पैकिंग बॉक्स अनुबंध',
    ta: 'மாதாந்திர அட்டைப் பெட்டி ஒப்பந்தம்',
    te: 'నెలవారీ ప్యాకింగ్ బాక్స్ కాంట్రాక్ట్',
    ml: 'പ്രതിമാസ പാക്കിംഗ് ബോക്സ് കരാർ',
  },
  'nl-out-1': {
    en: 'Fleet Diesel & Highway Toll Settlement',
    kn: 'ವಾಹನ ಡೀಸೆಲ್ ಮತ್ತು ಹೆದ್ದಾರಿ ಟೋಲ್ ಪಾವತಿ',
    hi: 'वाहन डीज़ल और हाईवे टोल भुगतान',
    ta: 'வாகன டீசல் & சுங்கச்சாவடி கட்டணம்',
    te: 'వాహన డీజిల్ & హైవే టోల్ చెల్లింపు',
    ml: 'വാഹന ഡീസൽ, ഹൈവേ ടോൾ ബിൽ',
  },
  'nl-out-2': {
    en: 'Driver & Loader Payroll',
    kn: 'ಚಾಲಕರು ಮತ್ತು ಲೋಡರ್ ಸಂಬಳ ಪಾವತಿ',
    hi: 'ड्राइवर और लोडर वेतन भुगतान',
    ta: 'ஓட்டுநர் & சுமை தூக்குவோர் சம்பளம்',
    te: 'డ్రైవర్ & లోడర్ జీతాల చెల్లింపు',
    ml: 'ഡ്രൈവർ, ലോഡർ ശമ്പളം',
  },
};

export function localizeTxTitle(
  tx: { id?: string; title: string; partyName?: string },
  lang: AppLanguage
): string {
  if (!tx?.title) return '';
  if (lang === 'en') return tx.title;
  if (tx.id && TX_TITLE_BY_ID[tx.id]?.[lang]) {
    return TX_TITLE_BY_ID[tx.id][lang];
  }
  const consignmentMatch = tx.title.match(/^Consignment \/ Order \((.+)\)$/i);
  if (consignmentMatch) {
    const pLoc = localizePartyName(consignmentMatch[1], lang);
    const fmt: Record<Exclude<AppLanguage, 'en'>, string> = {
      kn: `ಸರಕು ಆರ್ಡರ್ (${pLoc})`,
      hi: `माल ऑर्डर (${pLoc})`,
      ta: `சரக்கு ஆர்டர் (${pLoc})`,
      te: `సరుకు ఆర్డర్ (${pLoc})`,
      ml: `ചരക്ക് ഓർഡർ (${pLoc})`,
    };
    return fmt[lang];
  }
  const upcMatch = tx.title.match(/^Upcoming Payment \((.+)\)$/i);
  if (upcMatch) {
    const pLoc = localizePartyName(upcMatch[1], lang);
    const fmt: Record<Exclude<AppLanguage, 'en'>, string> = {
      kn: `ಮುಂಬರುವ ಬಿಲ್ (${pLoc})`,
      hi: `आगामी बिल (${pLoc})`,
      ta: `வரவிருக்கும் பில் (${pLoc})`,
      te: `రాబోయే బిల్లు (${pLoc})`,
      ml: `വരാനിരിക്കുന്ന ബിൽ (${pLoc})`,
    };
    return fmt[lang];
  }
  if (/^notice:/i.test(tx.title)) {
    const clean = tx.title.replace(/^notice:\s*/i, '');
    const pfx: Record<Exclude<AppLanguage, 'en'>, string> = {
      kn: 'ನೋಟಿಸ್: ',
      hi: 'नोटिस: ',
      ta: 'நோட்டீஸ்: ',
      te: 'నోటీసు: ',
      ml: 'നോട്ടീസ്: ',
    };
    return pfx[lang] + transliterateToScript(clean, lang);
  }
  return transliterateToScript(tx.title, lang);
}

const CATEGORY_MAP: Record<string, Record<AppLanguage, string>> = {
  'Supermarket Chain': {
    en: 'Supermarket Chain',
    kn: 'ಸೂಪರ್‌ಮಾರ್ಕೆಟ್ ಸರಣಿ',
    hi: 'सुपरमार्केट चेन',
    ta: 'சூப்பர்மார்க்கெட் தொடர்',
    te: 'సూపర్‌మార్కెట్ చైన్',
    ml: 'സൂപ്പർമാർക്കറ്റ് ശൃംഖല',
  },
  'Retail Grocery Store': {
    en: 'Retail Grocery Store',
    kn: 'ಚಿಲ್ಲರೆ ಕಿರಾಣಿ ಅಂಗಡಿ',
    hi: 'खुदरा किराना दुकान',
    ta: 'சில்லறை மளிகைக் கடை',
    te: 'రిటైల్ కిరాణా షాపు',
    ml: 'റീട്ടെയിൽ പലചരക്ക് കട',
  },
  'Wholesale Provisioner': {
    en: 'Wholesale Provisioner',
    kn: 'ಸಗಟು ದಿನಸಿ ವ್ಯಾಪಾರಿ',
    hi: 'थोक किराना व्यापारी',
    ta: 'மொத்த மளிகை வியாபாரி',
    te: 'హోల్‌సేల్ కిరాణా వ్యాపారి',
    ml: 'മൊത്തവ്യാപാര പലചരക്ക് വ്യാപാരി',
  },
  'Semi-Wholesale Dealer': {
    en: 'Semi-Wholesale Dealer',
    kn: 'ಅರೆ-ಸಗಟು ವ್ಯಾಪಾರಿ',
    hi: 'अर्ध-थोक डीलर',
    ta: 'அரை-மொத்த விற்பனையாளர்',
    te: 'సెమీ-హోల్‌సేల్ డీలర్',
    ml: 'സെമി-ഹോൾസെയിൽ ഡീലർ',
  },
  'Retail Over-the-counter': {
    en: 'Retail Over-the-counter',
    kn: 'ನೇರ ಕೌಂಟರ್ ಚಿಲ್ಲರೆ ಮಾರಾಟ',
    hi: 'दुकान काउंटर खुदरा बिक्री',
    ta: 'நேரடி கவுண்டர் சில்லறை விற்பனை',
    te: 'కౌంటర్ రిటైల్ అమ్మకాలు',
    ml: 'കൗണ്ടർ റീട്ടെയിൽ വിൽപ്പന',
  },
  'Hospitality / Catering Buyer (New)': {
    en: 'Hospitality / Catering Buyer (New)',
    kn: 'ಹೋಟೆಲ್ / ಕ್ಯಾಟರಿಂಗ್ ಗ್ರಾಹಕ (ಹೊಸಬರು)',
    hi: 'होटल / कैटरिंग खरीदार (नया ग्राहक)',
    ta: 'ஹோட்டல் / கேட்டரிங் வாடிக்கையாளர் (புதியவர்)',
    te: 'హోటల్ / క్యాటరింగ్ కొనుగోలుదారు (కొత్త)',
    ml: 'ഹോട്ടൽ / കാറ്ററിംഗ് ഇടപാടുകാരൻ (പുതിയത്)',
  },
  'Regional Supermarket': {
    en: 'Regional Supermarket',
    kn: 'ಪ್ರಾದೇಶಿಕ ಸೂಪರ್‌ಮಾರ್ಕೆಟ್',
    hi: 'क्षेत्रीय सुपरमार्केट',
    ta: 'மண்டல சூப்பர்மார்க்கெட்',
    te: 'ప్రాంతీయ సూపర్‌మార్కెట్',
    ml: 'പ്രാദേശിക സൂപ്പർമാർക്കറ്റ്',
  },
  'Bulk Hospitality Buyer': {
    en: 'Bulk Hospitality Buyer',
    kn: 'ಸಗಟು ಹೋಟೆಲ್ ಖರೀದಿದಾರರು',
    hi: 'थोक होटल खरीदार',
    ta: 'மொத்த ஹோட்டல் வாங்குபவர்',
    te: 'బల్క్ హోటల్ కొనుగోలుదారు',
    ml: 'മൊത്ത ഹോട്ടൽ ഇടപാടുകാരൻ',
  },
  'FMCG Contract Client': {
    en: 'FMCG Contract Client',
    kn: 'ಮಾಸಿಕ ಗುತ್ತಿಗೆ ಗ್ರಾಹಕರು',
    hi: 'मासिक अनुबंध ग्राहक',
    ta: 'மாதாந்திர ஒப்பந்த வாடிக்கையாளர்',
    te: 'నెలవారీ కాంట్రాక్ట్ కస్టమర్',
    ml: 'പ്രതിമാസ കരാർ ഇടപാടുകാരൻ',
  },
  'B2B Trade Customer': {
    en: 'Trade Customer',
    kn: 'ವ್ಯಾಪಾರ ಗ್ರಾಹಕರು',
    hi: 'व्यापारिक ग्राहक',
    ta: 'வணிக வாடிக்கையாளர்',
    te: 'వ్యాపార కస్టమర్',
    ml: 'വ്യാപാര ഇടപാടുകാരൻ',
  },
};

export function localizeCustomerCategory(cat: string | undefined, lang: AppLanguage): string {
  if (!cat) return '';
  if (lang === 'en') return cat;
  return CATEGORY_MAP[cat]?.[lang] || transliterateToScript(cat, lang);
}

const FREQ_MAP: Record<string, Record<AppLanguage, string>> = {
  'Monthly Batch (Month-end)': {
    en: 'Monthly Batch (Month-end)',
    kn: 'ತಿಂಗಳ ಕೊನೆಯಲ್ಲಿ ಪಾವತಿ',
    hi: 'महीने के अंत में भुगतान',
    ta: 'மாத இறுதி மொத்தப் பணம்',
    te: 'నెల చివరిలో చెల్లింపు',
    ml: 'മാസാവസാന പേയ്‌മെന്റ്',
  },
  'Irregular / Needs Follow-up': {
    en: 'Needs Reminder Follow-up',
    kn: 'ನೆನಪಿಸಿದ ನಂತರ ಪಾವತಿ ಮಾಡುತ್ತಾರೆ',
    hi: 'याद दिलाने पर भुगतान करते हैं',
    ta: 'நினைவூட்டிய பின் செலுத்துவார்',
    te: 'గుర్తు చేస్తే చెల్లిస్తారు',
    ml: 'ഓർമ്മിപ്പിച്ചാൽ പണമടയ്ക്കും',
  },
  'Bi-Weekly Tuesday Cycle': {
    en: 'Every 2nd Tuesday',
    kn: 'ಪ್ರತಿ ಎರಡನೇ ಮಂಗಳವಾರ ಪಾವತಿ',
    hi: 'हर दूसरे मंगलवार भुगतान',
    ta: 'இரண்டு வாரத்திற்கு ஒரு செவ்வாய்',
    te: 'ప్రతి రెండవ మంగళవారం',
    ml: 'രണ്ടാഴ്ചയിലൊരിക്കൽ ചൊവ്വാഴ്ച',
  },
  'Two-Stage Split (Advance + Check)': {
    en: '50% Advance + Balance After Check',
    kn: 'ಅರ್ಧ ಮುಂಗಡ + ಸರಕು ಪರಿಶೀಲನೆ ನಂತರ ಉಳಿದ ಹಣ',
    hi: 'आधा एडवांस + माल जांच के बाद बाकी',
    ta: 'பாதி முன்பணம் + சரிபார்ப்புக்குப் பின் மீதி',
    te: 'సగం అడ్వాన్స్ + తనిఖీ తర్వాత మిగిలినది',
    ml: 'പകുതി അഡ്വാൻസ് + പരിശോധനയ്ക്ക് ശേഷം ബാക്കി',
  },
  'Daily UPI & Cash Aggregation': {
    en: 'Daily Cash & UPI Sales',
    kn: 'ದೈನಂದಿನ ನಗದು ಮತ್ತು ಯುಪಿಐ ಸಂಗ್ರಹ',
    hi: 'रोज़ाना नकद और यूपीआई बिक्री',
    ta: 'தினசரி ரொக்கம் & யுபிஐ வரவு',
    te: 'రోజువారీ నగదు & యూపీఐ వసూలు',
    ml: 'പ്രതിദിന ക്യാഷ്, യുപിഐ വരവ്',
  },
  'New Account — 10-Day Trial Credit': {
    en: 'New Customer — 10-Day Credit',
    kn: 'ಹೊಸ ಗ್ರಾಹಕ — ೧೦ ದಿನಗಳ ಉದ್ದರಿ',
    hi: 'नया ग्राहक — १० दिन उधार',
    ta: 'புதிய வாடிக்கையாளர் — ௧௦ நாள் கடன்',
    te: 'కొత్త కస్టమర్ — ౧౦ రోజుల అప్పు',
    ml: 'പുതിയ ഇടപാടുകാരൻ — ൧൦ ദിവസത്തെ കടം',
  },
  'Fortnightly RTGS': {
    en: 'Every 15 Days Bank Transfer',
    kn: '೧೫ ದಿನಗಳಿಗೊಮ್ಮೆ ಬ್ಯಾಂಕ್ ವರ್ಗಾವಣೆ',
    hi: 'हर १५ दिन में बैंक ट्रांसफर',
    ta: '௧௫ நாட்களுக்கு ஒருமுறை வங்கி பரிமாற்றம்',
    te: 'ప్రతి ౧౫ రోజులకు బ్యాంక్ బదిలీ',
    ml: '൧൫ ദിവസത്തിലൊരിക്കൽ ബാങ്ക് ട്രാൻസ്ഫർ',
  },
  'Monthly Delayed Clearing': {
    en: 'Monthly (Usually Late)',
    kn: 'ಮಾಸಿಕ ಪಾವತಿ (ಸಾಮಾನ್ಯವಾಗಿ ತಡ)',
    hi: 'मासिक भुगतान (अक्सर देरी से)',
    ta: 'மாதாந்திரம் (வழக்கமாக தாமதம்)',
    te: 'నెలవారీ (సాధారణంగా ఆలస్యం)',
    ml: 'പ്രതിമാസം (സാധാരണയായി വൈകും)',
  },
  'Monthly Contract Cycle': {
    en: 'Monthly Contract Payment',
    kn: 'ಮಾಸಿಕ ಗುತ್ತಿಗೆ ಪಾವತಿ',
    hi: 'मासिक अनुबंध भुगतान',
    ta: 'மாதாந்திர ஒப்பந்த கட்டணம்',
    te: 'నెలవారీ కాంట్రాక్ట్ చెల్లింపు',
    ml: 'പ്രതിമാസ കരാർ പേയ്‌മെന്റ്',
  },
  'Standard Invoice Terms': {
    en: 'Regular Bill Credit',
    kn: 'ಸಾಮಾನ್ಯ ಬಿಲ್ ಅವಧಿ',
    hi: 'सामान्य बिल उधार नियम',
    ta: 'வழக்கமான பில் தவணை',
    te: 'సాధారణ బిల్లు గడువు',
    ml: 'സാധാരണ ബിൽ കാലാവധി',
  },
};

export function localizePaymentFrequency(freq: string | undefined, lang: AppLanguage): string {
  if (!freq) return '';
  if (FREQ_MAP[freq]?.[lang]) return FREQ_MAP[freq][lang];
  if (lang === 'en') return freq;
  return transliterateToScript(freq, lang);
}

// ============================================================================
// 4. SIMPLE, EVERYDAY SHOPKEEPER EXPLANATIONS (ZERO "ML", ZERO JARGON)
// ============================================================================

export interface SimplePredictionCopy {
  basisBadge: string;
  delayBadge: string;
  confidenceBadge: string;
  predictionHeading: string;
  predictionBody: string;
  promiseHeading: string;
  promiseBody: string | null;
  reasonsHeading: string;
  reasons: string[];
}

export function getSimplePredictionCopy(
  pred: MLPaymentPrediction,
  lang: AppLanguage
): SimplePredictionCopy {
  const party = localizePartyName(pred.partyName, lang);
  const inv = localizeInvoiceCode(pred.invoiceNumber, lang);
  const predShort = fmtShortDateLocal(pred.predictedDate, lang);
  const rangeStart = fmtShortDateLocal(pred.predictedRangeStart, lang);
  const rangeEnd = fmtShortDateLocal(pred.predictedRangeEnd, lang);
  const promShort = pred.promisedDate ? fmtShortDateLocal(pred.promisedDate, lang) : null;
  const dueShort = fmtShortDateLocal(pred.dueDate, lang);
  const countStr = toNativeDigits(pred.historicalSampleCount, lang);
  const avgDelayRounded = toNativeDigits(Math.max(0, Math.round(pred.customerAvgDelayDays)), lang);
  const estDelayAbs = toNativeDigits(Math.abs(pred.estimatedDelayDays), lang);
  const overdueDaysStr = toNativeDigits(pred.currentOverdueDays, lang);
  const confStr = toNativeDigits(pred.confidencePercent, lang);
  const promGapStr =
    pred.promisedVsPredictedDays !== null
      ? toNativeDigits(Math.abs(pred.promisedVsPredictedDays), lang)
      : '0';

  const isLate = pred.estimatedDelayDays > 0;
  const isEarly = pred.estimatedDelayDays < 0;

  if (lang === 'kn') {
    const basisBadge =
      pred.predictionBasis === 'customer_history'
        ? 'ಹಿಂದಿನ ಬಿಲ್ ಅಭ್ಯಾಸ ಆಧಾರಿತ'
        : pred.predictionBasis === 'hybrid_shrunk'
        ? 'ಇತ್ತೀಚಿನ ಪಾವತಿ ಆಧಾರಿತ'
        : 'ಹೊಸ ಗ್ರಾಹಕರ ಸರಳ ಅಂದಾಜು';
    const delayBadge = isLate
      ? `ಸುಮಾರು ${estDelayAbs} ದಿನ ತಡವಾಗಬಹುದು`
      : isEarly
      ? `${estDelayAbs} ದಿನ ಮುಂಚಿತವಾಗಿ ಬರಬಹುದು`
      : 'ಸಮಯಕ್ಕೆ ಸರಿಯಾಗಿ ಬರುವ ನಿರೀಕ್ಷೆ';
    const confidenceBadge = `${confStr}% ವಿಶ್ವಾಸ`;

    let predictionBody = '';
    if (pred.predictionBasis === 'cohort_baseline' || pred.historicalSampleCount === 0) {
      predictionBody = `${party} ಹೊಸ ಗ್ರಾಹಕರಾಗಿರುವುದರಿಂದ ಅವರ ಹಿಂದಿನ ಬಿಲ್ ದಾಖಲೆ ಇನ್ನೂ ಇಲ್ಲ. ಸಾಮಾನ್ಯ ಅಂಗಡಿ ವ್ಯಾಪಾರದ ಅನುಭವದಂತೆ ${inv} ಬಿಲ್ ಹಣ ಸುಮಾರು ${predShort} ರ ವೇಳೆಗೆ (${rangeStart} – ${rangeEnd} ಒಳಗೆ) ಕೈಸೇರಬಹುದು.`;
    } else if (pred.customerAvgDelayDays <= 1) {
      predictionBody = `${party} ಹಿಂದಿನ ${countStr} ಬಿಲ್‌ಗಳನ್ನು ಬಹುತೇಕ ಸಮಯಕ್ಕೆ ಸರಿಯಾಗಿ ಚುಕ್ತಾ ಮಾಡಿದ್ದಾರೆ. ಹೀಗಾಗಿ ${inv} ಹಣ ${predShort} ರ ವೇಳೆಗೆ (${rangeStart} – ${rangeEnd} ಒಳಗೆ) ಬರುವ ಉತ್ತಮ ನಿರೀಕ್ಷೆ ಇದೆ.`;
    } else {
      predictionBody = `${party} ಅವರ ಹಿಂದಿನ ${countStr} ಬಿಲ್‌ಗಳನ್ನು ಗಮನಿಸಿದರೆ ಸಾಮಾನ್ಯವಾಗಿ ಗಡುವು ದಿನಾಂಕಕ್ಕಿಂತ ಸುಮಾರು ${avgDelayRounded} ದಿನ ತಡವಾಗಿ ಹಣ ಕಳುಹಿಸುತ್ತಾರೆ. ಆದ್ದರಿಂದ ${inv} ಬಿಲ್ ಹಣ ${predShort} ರ ವೇಳೆಗೆ (${rangeStart} – ${rangeEnd} ಒಳಗೆ) ಬರಬಹುದು.`;
    }

    let promiseBody: string | null = null;
    if (promShort && pred.promisedVsPredictedDays !== null) {
      if (pred.promisedDate && pred.promisedDate < '2026-10-25') {
        promiseBody = `${party} ಅವರು ${promShort} ರಂದು ಕೊಡುವುದಾಗಿ ಹೇಳಿದ್ದರು, ಆದರೆ ಆ ದಿನಾಂಕ ಕಳೆದುಹೋಗಿದೆ. ಅವರ ಹಿಂದಿನ ಅಭ್ಯಾಸದಂತೆ ಹಣ ${predShort} ವೇಳೆಗೆ ಬರಬಹುದು — ಇಂದೇ ನೆನಪಿಸಿ.`;
      } else if (pred.promisedVsPredictedDays > 0) {
        promiseBody = `${party} ಅವರು ${promShort} ರಂದು ಕೊಡುವುದಾಗಿ ಮಾತು ಕೊಟ್ಟಿದ್ದಾರೆ. ಆದರೆ ಹಿಂದಿನ ಬಿಲ್‌ಗಳಲ್ಲಿ ಸ್ವಲ್ಪ ತಡ ಮಾಡಿರುವುದರಿಂದ ಹಣ ${predShort} ವೇಳೆಗೆ (${promGapStr} ದಿನ ತಡವಾಗಿ) ಬರುವ ಸಾಧ್ಯತೆ ಇದೆ.`;
      } else {
        promiseBody = `${party} ಕೊಟ್ಟಿರುವ ${promShort} ಭರವಸೆ ದಿನಾಂಕ ಅವರ ಹಿಂದಿನ ಪಾವತಿ ಅಭ್ಯಾಸಕ್ಕೆ (${predShort}) ಚೆನ್ನಾಗಿ ಹೊಂದಿಕೆಯಾಗುತ್ತದೆ.`;
      }
    }

    const reasons: string[] = [];
    if (pred.currentOverdueDays > 0) {
      reasons.push(`ಗಡುವು ದಿನಾಂಕ (${dueShort}) ಮುಗಿದು ಈಗಾಗಲೇ ${overdueDaysStr} ದಿನ ಕಳೆದಿದೆ.`);
    }
    if (pred.promisedDate && pred.promisedDate < '2026-10-25') {
      reasons.push(`ಗ್ರಾಹಕರು ಹೇಳಿದ್ದ ${promShort} ದಿನಾಂಕವೂ ಕಳೆದಿದೆ, ಇನ್ನೂ ಹಣ ಬಂದಿಲ್ಲ.`);
    } else if (promShort && pred.promisedVsPredictedDays && pred.promisedVsPredictedDays > 0) {
      reasons.push(
        `ಗ್ರಾಹಕರು ${promShort} ಹೇಳಿದ್ದರೂ ಹಿಂದಿನ ಅಭ್ಯಾಸದಂತೆ ${predShort} ವರೆಗೆ ತಡವಾಗಬಹುದು.`
      );
    }
    if (pred.historicalSampleCount === 0) {
      reasons.push(`ಮೊದಲ ಬಾರಿಗೆ ಉದ್ದರಿ ನೀಡಿರುವ ಹೊಸ ಗ್ರಾಹಕರು — ಗಡುವು ದಿನದಂದು ಒಮ್ಮೆ ನೆನಪಿಸುವುದು ಒಳ್ಳೆಯದು.`);
    } else if (pred.customerAvgDelayDays >= 2) {
      reasons.push(
        `ಹಿಂದಿನ ${countStr} ಬಿಲ್‌ಗಳಲ್ಲಿ ಸರಾಸರಿ ${avgDelayRounded} ದಿನ ತಡವಾಗಿ ಹಣ ಬಂದಿದೆ.`
      );
    }
    if (reasons.length === 0) {
      reasons.push(`ಹಿಂದಿನ ಬಿಲ್‌ಗಳಂತೆ ಸಮಯಕ್ಕೆ ಸರಿಯಾಗಿ ಹಣ ಬರುವ ನಿರೀಕ್ಷೆ ಇದೆ.`);
    }

    return {
      basisBadge,
      delayBadge,
      confidenceBadge,
      predictionHeading: 'ಹಿಂದಿನ ಪಾವತಿ ಅಭ್ಯಾಸದ ಅಂದಾಜು:',
      predictionBody,
      promiseHeading: 'ಗ್ರಾಹಕರ ಮಾತು ಮತ್ತು ಹಿಂದಿನ ಅಭ್ಯಾಸ:',
      promiseBody,
      reasonsHeading: 'ಗಮನಿಸಬೇಕಾದ ಸರಳ ಅಂಶಗಳು:',
      reasons,
    };
  }

  if (lang === 'hi') {
    const basisBadge =
      pred.predictionBasis === 'customer_history'
        ? 'पुराने बिलों के आधार पर'
        : pred.predictionBasis === 'hybrid_shrunk'
        ? 'हाल के भुगतानों के आधार पर'
        : 'नए ग्राहक का सरल अनुमान';
    const delayBadge = isLate
      ? `लगभग ${estDelayAbs} दिन देरी संभव`
      : isEarly
      ? `${estDelayAbs} दिन पहले आ सकता है`
      : 'समय पर आने की उम्मीद';
    const confidenceBadge = `${confStr}% भरोसा`;

    let predictionBody = '';
    if (pred.predictionBasis === 'cohort_baseline' || pred.historicalSampleCount === 0) {
      predictionBody = `${party} नए ग्राहक हैं, इसलिए पुराने बिलों का रिकॉर्ड नहीं है। सामान्य व्यापार अनुभव के अनुसार ${inv} का पैसा लगभग ${predShort} तक (${rangeStart} – ${rangeEnd} के बीच) आ सकता है।`;
    } else if (pred.customerAvgDelayDays <= 1) {
      predictionBody = `${party} ने अपने पिछले ${countStr} बिल समय पर चुकाए हैं। इसलिए ${inv} का पैसा ${predShort} के आसपास (${rangeStart} – ${rangeEnd} के बीच) आने की अच्छी उम्मीद है।`;
    } else {
      predictionBody = `${party} के पिछले ${countStr} बिल देखने पर पता चलता है कि वे तय तारीख़ से लगभग ${avgDelayRounded} दिन बाद पैसे भेजते हैं। इसलिए ${inv} का भुगतान ${predShort} के आसपास (${rangeStart} – ${rangeEnd} के बीच) मिल सकता है।`;
    }

    let promiseBody: string | null = null;
    if (promShort && pred.promisedVsPredictedDays !== null) {
      if (pred.promisedDate && pred.promisedDate < '2026-10-25') {
        promiseBody = `${party} ने ${promShort} को पैसे देने का वादा किया था, पर वह तारीख़ निकल चुकी है। पुराने हिसाब से पैसा ${predShort} तक आ सकता है — आज ही याद दिलाएं।`;
      } else if (pred.promisedVsPredictedDays > 0) {
        promiseBody = `${party} ने ${promShort} का वादा किया है, लेकिन पुराने भुगतानों की आदत के अनुसार पैसा ${predShort} तक (${promGapStr} दिन बाद) आ सकता है।`;
      } else {
        promiseBody = `${party} की वादा तारीख़ (${promShort}) उनके पुराने समय पर भुगतान करने के रिकॉर्ड (${predShort}) से मेल खाती है।`;
      }
    }

    const reasons: string[] = [];
    if (pred.currentOverdueDays > 0) {
      reasons.push(`तय तारीख़ (${dueShort}) से ${overdueDaysStr} दिन ऊपर हो चुके हैं।`);
    }
    if (pred.promisedDate && pred.promisedDate < '2026-10-25') {
      reasons.push(`ग्राहक की वादा की गई तारीख़ (${promShort}) भी बीत चुकी है।`);
    } else if (promShort && pred.promisedVsPredictedDays && pred.promisedVsPredictedDays > 0) {
      reasons.push(`ग्राहक ने ${promShort} कहा है, पर पुरानी आदत से ${predShort} तक देरी हो सकती है।`);
    }
    if (pred.historicalSampleCount === 0) {
      reasons.push(`यह नया ग्राहक है — तय तारीख़ पर एक बार विनम्र संदेश भेजना अच्छा रहेगा।`);
    } else if (pred.customerAvgDelayDays >= 2) {
      reasons.push(`पिछले ${countStr} बिलों में औसतन ${avgDelayRounded} दिन की देरी रही है।`);
    }
    if (reasons.length === 0) {
      reasons.push(`पुराने रिकॉर्ड के अनुसार समय पर भुगतान मिलने की उम्मीद है।`);
    }

    return {
      basisBadge,
      delayBadge,
      confidenceBadge,
      predictionHeading: 'पुराने भुगतान पैटर्न के अनुसार अनुमान:',
      predictionBody,
      promiseHeading: 'ग्राहक का वादा बनाम पिछला अनुभव:',
      promiseBody,
      reasonsHeading: 'ध्यान देने योग्य सरल बातें:',
      reasons,
    };
  }

  if (lang === 'ta') {
    const basisBadge =
      pred.predictionBasis === 'customer_history'
        ? 'கடந்த பில் பழக்கத்தின் அடிப்படையில்'
        : pred.predictionBasis === 'hybrid_shrunk'
        ? 'சமீபத்திய வரவு அடிப்படையில்'
        : 'புதிய வாடிக்கையாளர் மதிப்பீடு';
    const delayBadge = isLate
      ? `சுமார் ${estDelayAbs} நாள் தாமதமாகலாம்`
      : isEarly
      ? `${estDelayAbs} நாள் முன்னதாக வரலாம்`
      : 'சரியான நேரத்தில் வரும்';
    const confidenceBadge = `${confStr}% நம்பிக்கை`;

    const predictionBody =
      pred.predictionBasis === 'cohort_baseline' || pred.historicalSampleCount === 0
        ? `${party} புதிய வாடிக்கையாளர் என்பதால் பழைய பில் விவரம் இல்லை. வழக்கமான வணிக அனுபவப்படி ${inv} தொகை சுமார் ${predShort} அன்று (${rangeStart} – ${rangeEnd}க்குள்) வரலாம்.`
        : pred.customerAvgDelayDays <= 1
        ? `${party} கடந்த ${countStr} பில்களை நேரத்திற்குச் செலுத்தியுள்ளார். எனவே ${inv} தொகை ${predShort} அன்று (${rangeStart} – ${rangeEnd}க்குள்) வரும் என எதிர்பார்க்கலாம்.`
        : `${party} கடந்த ${countStr} பில்களில் சராசரியாக ${avgDelayRounded} நாட்கள் தாமதமாக பணம் அனுப்பியுள்ளார். அதனால் ${inv} தொகை ${predShort} அளவில் (${rangeStart} – ${rangeEnd}க்குள்) வரக்கூடும்.`;

    let promiseBody: string | null = null;
    if (promShort && pred.promisedVsPredictedDays !== null) {
      if (pred.promisedDate && pred.promisedDate < '2026-10-25') {
        promiseBody = `${party} ${promShort} அன்று தருவதாகக் கூறினார், ஆனால் தேதி கடந்துவிட்டது. பழைய வழக்கப்படி ${predShort} அன்று வரலாம் — இன்றே நினைவூட்டவும்.`;
      } else if (pred.promisedVsPredictedDays > 0) {
        promiseBody = `${party} ${promShort} அன்று தருவதாகக் கூறியுள்ளார்; ஆனால் முந்தைய தாமதப் பழக்கத்தால் ${predShort} வரை (${promGapStr} நாள் தாமதம்) ஆகலாம்.`;
      } else {
        promiseBody = `${party} கூறிய ${promShort} தேதி அவரது பழைய நேர்மையான பழக்கத்துடன் (${predShort}) ஒத்துப்போகிறது.`;
      }
    }

    const reasons: string[] = [];
    if (pred.currentOverdueDays > 0) {
      reasons.push(`கெடு தேதி (${dueShort}) முடிந்து ${overdueDaysStr} நாட்கள் ஆகிவிட்டன.`);
    }
    if (promShort && pred.promisedVsPredictedDays && pred.promisedVsPredictedDays > 0) {
      reasons.push(`வாடிக்கையாளர் ${promShort} சொன்னாலும் பழைய வழக்கப்படி ${predShort} வரை ஆகலாம்.`);
    }
    if (pred.historicalSampleCount === 0) {
      reasons.push(`புதிய வாடிக்கையாளர் — கெடு தேதியில் ஒருமுறை நினைவூட்டுவது நல்லது.`);
    } else if (pred.customerAvgDelayDays >= 2) {
      reasons.push(`கடந்த ${countStr} பில்களில் சராசரியாக ${avgDelayRounded} நாள் தாமதம் ஏற்பட்டுள்ளது.`);
    }
    if (reasons.length === 0) {
      reasons.push(`கடந்த பில்களின்படி நேரத்திற்குப் பணம் வரும் என எதிர்பார்க்கப்படுகிறது.`);
    }

    return {
      basisBadge,
      delayBadge,
      confidenceBadge,
      predictionHeading: 'கடந்த பணம் செலுத்தும் முறையின் கணிப்பு:',
      predictionBody,
      promiseHeading: 'வாடிக்கையாளர் வாக்குறுதி மற்றும் பழைய வழக்கம்:',
      promiseBody,
      reasonsHeading: 'கவனிக்க வேண்டிய எளிய தகவல்கள்:',
      reasons,
    };
  }

  if (lang === 'te') {
    const basisBadge =
      pred.predictionBasis === 'customer_history'
        ? 'గత బిల్లుల అలవాటు ఆధారంగా'
        : pred.predictionBasis === 'hybrid_shrunk'
        ? 'ఇటీవలి చెల్లింపుల ఆధారంగా'
        : 'కొత్త కస్టమర్ సాధారణ అంచనా';
    const delayBadge = isLate
      ? `సుమారు ${estDelayAbs} రోజులు ఆలస్యం కావచ్చు`
      : isEarly
      ? `${estDelayAbs} రోజులు ముందే రావచ్చు`
      : 'సమయానికి వచ్చే అవకాశం';
    const confidenceBadge = `${confStr}% నమ్మకం`;

    const predictionBody =
      pred.predictionBasis === 'cohort_baseline' || pred.historicalSampleCount === 0
        ? `${party} కొత్త కస్టమర్ కాబట్టి పాత బిల్లుల చరిత్ర లేదు. సాధారణ వ్యాపార అనుభవం ప్రకారం ${inv} డబ్బు సుమారు ${predShort} నాటికి (${rangeStart} – ${rangeEnd} మధ్య) రావచ్చు.`
        : pred.customerAvgDelayDays <= 1
        ? `${party} గత ${countStr} బిల్లులను సమయానికి చెల్లించారు. కాబట్టి ${inv} డబ్బు ${predShort} నాటికి (${rangeStart} – ${rangeEnd} మధ్య) వస్తుందని ఆశించవచ్చు.`
        : `${party} గత ${countStr} బిల్లులలో గడువు తేదీ కంటే సగటున ${avgDelayRounded} రోజులు ఆలస్యంగా డబ్బు పంపారు. అందువల్ల ${inv} చెల్లింపు ${predShort} చుట్టూ (${rangeStart} – ${rangeEnd} మధ్య) రావచ్చు.`;

    let promiseBody: string | null = null;
    if (promShort && pred.promisedVsPredictedDays !== null) {
      if (pred.promisedDate && pred.promisedDate < '2026-10-25') {
        promiseBody = `${party} ${promShort} నాడు ఇస్తానని చెప్పారు కానీ ఆ తేదీ దాటిపోయింది. గత అలవాటు ప్రకారం ${predShort} నాటికి రావచ్చు — ఈరోజే గుర్తు చేయండి.`;
      } else if (pred.promisedVsPredictedDays > 0) {
        promiseBody = `${party} ${promShort} నాడు ఇస్తానని మాట ఇచ్చారు, అయితే పాత చెల్లింపుల అలవాటు వల్ల ${predShort} వరకు (${promGapStr} రోజులు ఆలస్యం) పట్టవచ్చు.`;
      } else {
        promiseBody = `${party} చెప్పిన ${promShort} తేదీ వారి గత సకాల చెల్లింపుల అలవాటుతో (${predShort}) సరిపోలుతోంది.`;
      }
    }

    const reasons: string[] = [];
    if (pred.currentOverdueDays > 0) {
      reasons.push(`గడువు తేదీ (${dueShort}) దాటి ఇప్పటికే ${overdueDaysStr} రోజులు అయింది.`);
    }
    if (promShort && pred.promisedVsPredictedDays && pred.promisedVsPredictedDays > 0) {
      reasons.push(`కస్టమర్ ${promShort} చెప్పినప్పటికీ గత అలవాటు ప్రకారం ${predShort} వరకు ఆలస్యం కావచ్చు.`);
    }
    if (pred.historicalSampleCount === 0) {
      reasons.push(`కొత్త కస్టమర్ — గడువు రోజున ఒకసారి సున్నితంగా గుర్తు చేయడం మంచిది.`);
    } else if (pred.customerAvgDelayDays >= 2) {
      reasons.push(`గత ${countStr} బిల్లులలో సగటున ${avgDelayRounded} రోజులు ఆలస్యంగా చెల్లించారు.`);
    }
    if (reasons.length === 0) {
      reasons.push(`గత బిల్లుల ప్రకారం సమయానికే డబ్బు వచ్చే అవకాశం ఉంది.`);
    }

    return {
      basisBadge,
      delayBadge,
      confidenceBadge,
      predictionHeading: 'గత చెల్లింపు అలవాటు ఆధారంగా అంచనా:',
      predictionBody,
      promiseHeading: 'కస్టమర్ మాట మరియు గత అనుభవం:',
      promiseBody,
      reasonsHeading: 'గమనించవలసిన సులభమైన అంశాలు:',
      reasons,
    };
  }

  if (lang === 'ml') {
    const basisBadge =
      pred.predictionBasis === 'customer_history'
        ? 'മുൻ ബില്ലുകളുടെ ശീലം അനുസരിച്ച്'
        : pred.predictionBasis === 'hybrid_shrunk'
        ? 'സമീപകാല പേയ്‌മെന്റ് അടിസ്ഥാനത്തിൽ'
        : 'പുതിയ ഇടപാടുകാരന്റെ ഏകദേശ കണക്ക്';
    const delayBadge = isLate
      ? `ഏകദേശം ${estDelayAbs} ദിവസം വൈകാം`
      : isEarly
      ? `${estDelayAbs} ദിവസം നേരത്തെ ലഭിക്കാം`
      : 'സമയത്ത് ലഭിക്കാൻ സാധ്യത';
    const confidenceBadge = `${confStr}% ഉറപ്പ്`;

    const predictionBody =
      pred.predictionBasis === 'cohort_baseline' || pred.historicalSampleCount === 0
        ? `${party} പുതിയ ഇടപാടുകാരനായതിനാൽ മുൻ ബിൽ രേഖകളില്ല. സാധാരണ കച്ചവട അനുഭവമനുസരിച്ച് ${inv} തുക ഏകദേശം ${predShort} ഓടെ (${rangeStart} – ${rangeEnd} ഉള്ളിൽ) ലഭിക്കാം.`
        : pred.customerAvgDelayDays <= 1
        ? `${party} കഴിഞ്ഞ ${countStr} ബില്ലുകളും കൃത്യസമയത്ത് അടച്ചിട്ടുണ്ട്. അതിനാൽ ${inv} തുക ${predShort} ഓടെ (${rangeStart} – ${rangeEnd} ഉള്ളിൽ) ലഭിക്കുമെന്ന് പ്രതീക്ഷിക്കാം.`
        : `${party} കഴിഞ്ഞ ${countStr} ബില്ലുകളിൽ ശരാശരി ${avgDelayRounded} ദിവസം വൈകിയാണ് പണം അയച്ചത്. അതിനാൽ ${inv} തുക ${predShort} ഓടെ (${rangeStart} – ${rangeEnd} ഉള്ളിൽ) ലഭിക്കാൻ സാധ്യതയുണ്ട്.`;

    let promiseBody: string | null = null;
    if (promShort && pred.promisedVsPredictedDays !== null) {
      if (pred.promisedDate && pred.promisedDate < '2026-10-25') {
        promiseBody = `${party} ${promShort} തീയതിയിൽ തരാമെന്ന് പറഞ്ഞിരുന്നു, എന്നാൽ ആ തീയതി കഴിഞ്ഞു. മുൻ ശീലമനുസരിച്ച് ${predShort} ഓടെ ലഭിക്കാം — ഇന്നുതന്നെ ഓർമ്മിപ്പിക്കുക.`;
      } else if (pred.promisedVsPredictedDays > 0) {
        promiseBody = `${party} ${promShort} തീയതി വാഗ്ദാനം ചെയ്തിട്ടുണ്ടെങ്കിലും മുൻകാല ശീലം അനുസരിച്ച് ${predShort} വരെ (${promGapStr} ദിവസം താമസം) എടുത്തേക്കാം.`;
      } else {
        promiseBody = `${party} പറഞ്ഞ ${promShort} തീയതി അവരുടെ മുൻകാല കൃത്യനിഷ്ഠയുമായി (${predShort}) ഒത്തുപോകുന്നു.`;
      }
    }

    const reasons: string[] = [];
    if (pred.currentOverdueDays > 0) {
      reasons.push(`അവസാന തീയതി (${dueShort}) കഴിഞ്ഞ് ${overdueDaysStr} ദിവസമായി.`);
    }
    if (promShort && pred.promisedVsPredictedDays && pred.promisedVsPredictedDays > 0) {
      reasons.push(`${promShort} പറഞ്ഞെങ്കിലും മുൻ ശീലമനുസരിച്ച് ${predShort} വരെ വൈകാം.`);
    }
    if (pred.historicalSampleCount === 0) {
      reasons.push(`പുതിയ ഇടപാടുകാരനാണ് — ബിൽ തീയതിയിൽ ഒന്ന് ഓർമ്മിപ്പിക്കുന്നത് നല്ലതാണ്.`);
    } else if (pred.customerAvgDelayDays >= 2) {
      reasons.push(`കഴിഞ്ഞ ${countStr} ബില്ലുകളിൽ ശരാശരി ${avgDelayRounded} ദിവസത്തെ താമസമുണ്ട്.`);
    }
    if (reasons.length === 0) {
      reasons.push(`മുൻ രേഖകൾ പ്രകാരം കൃത്യസമയത്ത് പണം ലഭിക്കാൻ സാധ്യതയുണ്ട്.`);
    }

    return {
      basisBadge,
      delayBadge,
      confidenceBadge,
      predictionHeading: 'മുൻകാല പേയ്‌മെന്റ് ശീലം അനുസരിച്ചുള്ള കണക്ക്:',
      predictionBody,
      promiseHeading: 'ഇടപാടുകാരന്റെ വാക്കും മുൻ അനുഭവവും:',
      promiseBody,
      reasonsHeading: 'ശ്രദ്ധിക്കേണ്ട ലളിതമായ കാര്യങ്ങൾ:',
      reasons,
    };
  }

  // English — simple, friendly shopkeeper prose, zero "ML"
  const basisBadge =
    pred.predictionBasis === 'customer_history'
      ? 'Based on past bills'
      : pred.predictionBasis === 'hybrid_shrunk'
      ? 'Based on recent bills'
      : 'New customer estimate';
  const delayBadge = isLate
    ? `May come ${estDelayAbs}d late`
    : isEarly
    ? `May come ${estDelayAbs}d early`
    : 'Expected on time';
  const confidenceBadge = `${confStr}% surety`;

  let predictionBody = '';
  if (pred.predictionBasis === 'cohort_baseline' || pred.historicalSampleCount === 0) {
    predictionBody = `${party} is a new customer with no past bills yet. Based on usual shop credit patterns, ${inv} will likely arrive around ${predShort} (between ${rangeStart} and ${rangeEnd}).`;
  } else if (pred.customerAvgDelayDays <= 1) {
    predictionBody = `${party} paid their last ${countStr} bills right on time. Based on this steady habit, ${inv} should arrive around ${predShort} (between ${rangeStart} and ${rangeEnd}).`;
  } else {
    predictionBody = `Looking at ${party}'s last ${countStr} bills, they usually pay about ${avgDelayRounded} days after the due date. So ${inv} is expected around ${predShort} (between ${rangeStart} and ${rangeEnd}).`;
  }

  let promiseBody: string | null = null;
  if (promShort && pred.promisedVsPredictedDays !== null) {
    if (pred.promisedDate && pred.promisedDate < '2026-10-25') {
      promiseBody = `${party} promised to pay on ${promShort}, which has already passed. Based on past bills, payment may come around ${predShort} — send a gentle reminder today.`;
    } else if (pred.promisedVsPredictedDays > 0) {
      promiseBody = `${party} promised ${promShort}, which we kept on record, but their past bills usually take a few extra days — so expect money closer to ${predShort} (${promGapStr} days later).`;
    } else {
      promiseBody = `${party}'s promised date (${promShort}) matches their usual payment habit (${predShort}).`;
    }
  }

  const reasons: string[] = [];
  if (pred.currentOverdueDays > 0) {
    reasons.push(`Bill due date (${dueShort}) passed ${overdueDaysStr} days ago.`);
  }
  if (pred.promisedDate && pred.promisedDate < '2026-10-25') {
    reasons.push(`Promised payment date (${promShort}) was also missed.`);
  } else if (promShort && pred.promisedVsPredictedDays && pred.promisedVsPredictedDays > 0) {
    reasons.push(`Promised ${promShort}, while past payment habit points to ${predShort}.`);
  }
  if (pred.historicalSampleCount === 0) {
    reasons.push(`First-time credit customer — a polite check-in around the due date helps.`);
  } else if (pred.customerAvgDelayDays >= 2) {
    reasons.push(`Usually pays about ${avgDelayRounded} days after due date across ${countStr} past bills.`);
  }
  if (reasons.length === 0) {
    reasons.push(`Consistent payer — expected to clear right around the due date.`);
  }

  return {
    basisBadge,
    delayBadge,
    confidenceBadge,
    predictionHeading: 'Analysis from Past Payment Patterns:',
    predictionBody,
    promiseHeading: 'Customer Promise vs Past Habit:',
    promiseBody,
    reasonsHeading: 'Simple Points to Know:',
    reasons,
  };
}

export function getSimpleFollowUpCopy(
  item: FollowUpRecommendation,
  lang: AppLanguage
): { priorityLabel: string; reason: string; suggestedAction: string } {
  const party = localizePartyName(item.partyName, lang);
  const inv = localizeInvoiceCode(item.invoiceNumber, lang);
  const amt = fmtRupeeLocal(item.amountRemaining, lang);
  const due = fmtShortDateLocal(item.dueDate, lang);
  const pred = fmtShortDateLocal(item.predictedDate, lang);
  const prom = item.promisedDate ? fmtShortDateLocal(item.promisedDate, lang) : null;
  const delayStr = toNativeDigits(Math.max(0, item.estimatedDelayDays), lang);

  const isOverdue = item.dueDate < '2026-10-25';
  const priorityMap: Record<FollowUpRecommendation['priority'], Record<AppLanguage, string>> = {
    urgent: {
      en: 'Call Today',
      kn: 'ಇಂದೇ ಸಂಪರ್ಕಿಸಿ',
      hi: 'आज ही संपर्क करें',
      ta: 'இன்றே அழைக்கவும்',
      te: 'ఈరోజే సంప్రదించండి',
      ml: 'ഇന്നുതന്നെ വിളിക്കുക',
    },
    high: {
      en: 'Important',
      kn: 'ಮುಖ್ಯ',
      hi: 'ज़रूरी',
      ta: 'முக்கியம்',
      te: 'ముఖ్యమైనది',
      ml: 'പ്രധാനം',
    },
    normal: {
      en: 'Routine',
      kn: 'ಸಾಮಾನ್ಯ',
      hi: 'सामान्य',
      ta: 'வழக்கமானது',
      te: 'సాధారణం',
      ml: 'സാധാരണ',
    },
  };

  if (lang === 'kn') {
    const reason = isOverdue
      ? `${inv} ಬಿಲ್ ಗಡುವು (${due}) ಮೀರಿದೆ.${item.helpsPreventShortfall ? ` ಈ ${amt} ಹಣ ತರಿಸಿದರೆ ಮುಂಬರುವ ಬಿಲ್‌ಗಳಿಗೆ ಹಣ ಕಡಿಮೆಯಾಗುವುದಿಲ್ಲ.` : ` ಹಿಂದಿನ ಅಭ್ಯಾಸದಂತೆ ನೆನಪಿಸಿದ ನಂತರವೇ ಪಾವತಿಸುತ್ತಾರೆ.`}`
      : prom && item.promisedDate && item.promisedDate < item.predictedDate
      ? `ಗ್ರಾಹಕರು ${prom} ಹೇಳಿದ್ದಾರೆ, ಆದರೆ ಹಿಂದಿನ ಅಭ್ಯಾಸದಂತೆ ${pred} ವರೆಗೆ ತಡವಾಗಬಹುದು.`
      : `ಬಿಲ್ ಗಡುವು ${due}; ಸುಮಾರು ${delayStr} ದಿನ ತಡವಾಗಿ (${pred}) ಬರುವ ಸಾಧ್ಯತೆ ಇದೆ.`;
    const suggestedAction = isOverdue
      ? `${party} ಅವರಿಗೆ ಇಂದೇ ವಾಟ್ಸಾಪ್ ಸಂದೇಶ ಕಳುಹಿಸಿ ಯುಪಿಐ ಮೂಲಕ ${amt} ಪಾವತಿಸಲು ಕೇಳಿ.`
      : prom
      ? `${prom} ಭರವಸೆ ದಿನಾಂಕದಂದು ${party} ಅವರಿಗೆ ಒಮ್ಮೆ ನೆನಪಿಸಿ.`
      : `${due} ಗಡುವು ದಿನಾಂಕಕ್ಕೆ ಮುನ್ನ ಸೌಮ್ಯ ನೆನಪು ಕಳುಹಿಸಿ.`;
    return { priorityLabel: priorityMap[item.priority][lang], reason, suggestedAction };
  }

  if (lang === 'hi') {
    const reason = isOverdue
      ? `बिल ${inv} की तारीख़ (${due}) निकल चुकी है।${item.helpsPreventShortfall ? ` यह ${amt} आने से आगे पैसे की कमी नहीं होगी।` : ` याद दिलाने पर जल्दी भुगतान मिल जाता है।`}`
      : prom && item.promisedDate && item.promisedDate < item.predictedDate
      ? `ग्राहक ने ${prom} कहा है, पर पुरानी आदत से ${pred} तक देरी हो सकती है।`
      : `तय तारीख़ ${due} है; लगभग ${delayStr} दिन बाद (${pred}) पैसा आ सकता है।`;
    const suggestedAction = isOverdue
      ? `${party} को आज ही व्हाट्सएप संदेश भेजकर ${amt} तुरंत मंगवाएं।`
      : prom
      ? `वादा तारीख़ ${prom} से पहले ${party} से एक बार बात कर लें।`
      : `${due} से पहले विनम्र स्मरण संदेश भेजें।`;
    return { priorityLabel: priorityMap[item.priority][lang], reason, suggestedAction };
  }

  if (lang === 'ta') {
    const reason = isOverdue
      ? `பில் ${inv} கெடு (${due}) முடிந்துவிட்டது.${item.helpsPreventShortfall ? ` இந்த ${amt} வந்தால் பணப் பற்றாக்குறை வராது.` : ''}`
      : prom && item.promisedDate && item.promisedDate < item.predictedDate
      ? `${prom} தருவதாகக் கூறினார், ஆனால் பழைய வழக்கப்படி ${pred} வரை ஆகலாம்.`
      : `கெடு தேதி ${due}; சுமார் ${delayStr} நாள் கழித்து (${pred}) வரலாம்.`;
    const suggestedAction = isOverdue
      ? `${party} அவர்களுக்கு இன்றே வாட்ஸ்அப் நினைவூட்டல் அனுப்பி ${amt} வசூலிக்கவும்.`
      : `${due} தேதிக்கு முன் அன்பான நினைவூட்டல் அனுப்பவும்.`;
    return { priorityLabel: priorityMap[item.priority][lang], reason, suggestedAction };
  }

  if (lang === 'te') {
    const reason = isOverdue
      ? `బిల్లు ${inv} గడువు (${due}) దాటిపోయింది.${item.helpsPreventShortfall ? ` ఈ ${amt} వసూలైతే నగదు కొరత తప్పుతుంది.` : ''}`
      : prom && item.promisedDate && item.promisedDate < item.predictedDate
      ? `${prom} ఇస్తానని చెప్పారు కానీ పాత అలవాటు ప్రకారం ${pred} వరకు పట్టవచ్చు.`
      : `గడువు తేదీ ${due}; సుమారు ${delayStr} రోజుల ఆలస్యంతో (${pred}) రావచ్చు.`;
    const suggestedAction = isOverdue
      ? `${party} వారికి ఈరోజే వాట్సాప్ రిమైండర్ పంపి ${amt} అడగండి.`
      : `${due} తేదీకి ముందే మర్యాదగా గుర్తు చేయండి.`;
    return { priorityLabel: priorityMap[item.priority][lang], reason, suggestedAction };
  }

  if (lang === 'ml') {
    const reason = isOverdue
      ? `ബിൽ ${inv} അവസാന തീയതി (${due}) കഴിഞ്ഞു.${item.helpsPreventShortfall ? ` ഈ ${amt} ലഭിച്ചാൽ പണക്ഷാമം ഒഴിവാക്കാം.` : ''}`
      : prom && item.promisedDate && item.promisedDate < item.predictedDate
      ? `${prom} പറഞ്ഞെങ്കിലും മുൻ ശീലമനുസരിച്ച് ${pred} വരെ വൈകാം.`
      : `അവസാന തീയതി ${due}; ഏകദേശം ${delayStr} ദിവസം കഴിഞ്ഞ് (${pred}) ലഭിക്കാം.`;
    const suggestedAction = isOverdue
      ? `${party} ന് ഇന്നുതന്നെ വാട്ട്‌സ്ആപ്പ് സന്ദേശം അയച്ച് ${amt} ചോദിക്കുക.`
      : `${due} ന് മുൻപ് സൗമ്യമായി ഓർമ്മിപ്പിക്കുക.`;
    return { priorityLabel: priorityMap[item.priority][lang], reason, suggestedAction };
  }

  const reason = isOverdue
    ? `Bill ${inv} passed its due date (${due}).${item.helpsPreventShortfall ? ` Collecting this ${amt} now prevents your upcoming cash shortage.` : ` Usually pays quickly once reminded.`}`
    : prom && item.promisedDate && item.promisedDate < item.predictedDate
    ? `Promised ${prom}, though past bills usually take until ${pred}.`
    : `Due ${due}; past pattern suggests money may arrive around ${pred}.`;
  const suggestedAction = isOverdue
    ? `Send a polite WhatsApp reminder to ${party} today for ${amt}.`
    : prom
    ? `Confirm ${prom} payment with ${party} a day ahead.`
    : `Send a gentle check-in before ${due}.`;
  return { priorityLabel: priorityMap[item.priority].en, reason, suggestedAction };
}

export function getSimpleAffordabilityCopy(
  exp: ExpenseAffordabilityItem,
  minimumReserve: number,
  lang: AppLanguage
): { explanation: string; recommendedStep: string } {
  const party = localizePartyName(exp.partyName, lang);
  const due = fmtShortDateLocal(exp.dueDate, lang);
  const amt = fmtRupeeLocal(exp.amount, lang);
  const projBal = fmtRupeeLocal(exp.projectedBalanceOnDueDate, lang);
  const gap = fmtRupeeLocal(exp.shortfallOrReserveGap, lang);
  const resFmt = fmtRupeeLocal(minimumReserve, lang);

  if (lang === 'kn') {
    if (exp.verdict === 'unaffordable_shortage') {
      return {
        explanation: `${due} ರಂದು ಈ ${amt} ಬಿಲ್ ಕೊಟ್ಟರೆ ನಿಮ್ಮ ಬಳಿ ${gap} ಹಣ ಕಡಿಮೆ ಬೀಳುತ್ತದೆ, ಏಕೆಂದರೆ ಕೆಲವು ಗ್ರಾಹಕರ ಹಣ ನಂತರ ಬರಲಿದೆ.`,
        recommendedStep: `${party} ಜೊತೆ ಮಾತನಾಡಿ ಅರ್ಧ ಹಣ ಈಗ ಮತ್ತು ಉಳಿದ ಅರ್ಧ ಮುಂದಿನ ವಾರ ಕೊಡಲು ಕೇಳಿ, ಅಥವಾ ಬಾಕಿ ಇರುವ ಗ್ರಾಹಕರ ಹಣ ಮೊದಲು ತರಿಸಿ.`,
      };
    }
    if (exp.verdict === 'tight_dips_reserve') {
      return {
        explanation: `${due} ರಂದು ಈ ಬಿಲ್ ಕೊಡಬಹುದು, ಆದರೆ ನಿಮ್ಮ ಉಳಿತಾಯ ${projBal} ಗೆ ಇಳಿದು ${resFmt} ಸುರಕ್ಷತಾ ಹಣಕ್ಕಿಂತ ${gap} ಕಡಿಮೆಯಾಗುತ್ತದೆ.`,
        recommendedStep: `ಗ್ರಾಹಕರಿಂದ ಬಾಕಿ ಹಣ ಬೇಗ ತರಿಸಿಕೊಳ್ಳಿ ಅಥವಾ ಬಿಲ್ ದಿನಾಂಕವನ್ನು ೩–೪ ದಿನ ಮುಂದೂಡಲು ಕೇಳಿ.`,
      };
    }
    return {
      explanation: `${due} ರಂದು ಈ ಬಿಲ್ ಪಾವತಿಸಿದ ನಂತರವೂ ನಿಮ್ಮ ಬಳಿ ${projBal} ಸುರಕ್ಷಿತ ಹಣ ಉಳಿಯುತ್ತದೆ.`,
      recommendedStep: `${due} ರಂದು ಎಂದಿನಂತೆ ನಿರಾಳವಾಗಿ ಪಾವತಿಸಬಹುದು.`,
    };
  }

  if (lang === 'hi') {
    if (exp.verdict === 'unaffordable_shortage') {
      return {
        explanation: `${due} को यह ${amt} बिल देने पर ${gap} कम पड़ेंगे, क्योंकि ग्राहकों का पैसा उसके बाद आने का अनुमान है।`,
        recommendedStep: `${party} से बात करके आधा भुगतान अभी और आधा अगले हफ़्ते दें, या रुका हुआ बकाया पहले मँगवाएं।`,
      };
    }
    if (exp.verdict === 'tight_dips_reserve') {
      return {
        explanation: `${due} को बिल चुकाया जा सकता है, पर बैलेंस ${projBal} रह जाएगा जो ${resFmt} सुरक्षित बचत से ${gap} कम है।`,
        recommendedStep: `ग्राहकों से बकाया जल्दी मँगवाएं या सप्लायर से ३–४ दिन का समय मांगें।`,
      };
    }
    return {
      explanation: `${due} को यह बिल देने के बाद भी आपके पास ${projBal} सुरक्षित नकद बचेगा।`,
      recommendedStep: `${due} को समय पर आराम से भुगतान करें।`,
    };
  }

  if (lang === 'ta') {
    if (exp.verdict === 'unaffordable_shortage') {
      return {
        explanation: `${due} அன்று இந்த ${amt} பில்லைச் செலுத்தினால் ${gap} பணப் பற்றாக்குறை ஏற்படும்.`,
        recommendedStep: `${party} உடன் பேசி பாதி தொகையை இப்போதும் மீதியை அடுத்த வாரமும் வழங்கவும், அல்லது நிலுவை வரவை வசூலிக்கவும்.`,
      };
    }
    if (exp.verdict === 'tight_dips_reserve') {
      return {
        explanation: `${due} அன்று செலுத்தலாம், ஆனால் இருப்பு ${projBal} ஆகக் குறைந்து ${resFmt} பாதுகாப்புத் தொகையை விட ${gap} குறையும்.`,
        recommendedStep: `வாடிக்கையாளர் நிலுவையை விரைவில் வசூலிக்கவும்.`,
      };
    }
    return {
      explanation: `${due} அன்று பில் செலுத்திய பிறகும் ${projBal} பாதுகாப்பாகக் கையில் இருக்கும்.`,
      recommendedStep: `${due} அன்று வழக்கம்போலச் செலுத்தலாம்.`,
    };
  }

  if (lang === 'te') {
    if (exp.verdict === 'unaffordable_shortage') {
      return {
        explanation: `${due} నాడు ఈ ${amt} బిల్లు చెల్లిస్తే ${gap} నగదు తక్కువ పడుతుంది.`,
        recommendedStep: `${party} తో మాట్లాడి సగం ఇప్పుడు, మిగతా సగం వచ్చే వారం ఇవ్వండి లేదా పాత బకాయిలు వసూలు చేయండి.`,
      };
    }
    if (exp.verdict === 'tight_dips_reserve') {
      return {
        explanation: `${due} నాడు చెల్లించవచ్చు, కానీ బ్యాలెన్స్ ${projBal} కు తగ్గి ${resFmt} భద్రతా నిధి కంటే ${gap} తగ్గుతుంది.`,
        recommendedStep: `కస్టమర్ బకాయిలను త్వరగా తెప్పించుకోండి.`,
      };
    }
    return {
      explanation: `${due} నాడు ఈ బిల్లు కట్టిన తర్వాత కూడా ${projBal} సురక్షితంగా మిగులుతుంది.`,
      recommendedStep: `${due} నాడు నిశ్చింతగా చెల్లించండి.`,
    };
  }

  if (lang === 'ml') {
    if (exp.verdict === 'unaffordable_shortage') {
      return {
        explanation: `${due} ന് ഈ ${amt} ബിൽ അടച്ചാൽ ${gap} പണം തികയാതെ വരും.`,
        recommendedStep: `${party} നോട് സംസാരിച്ച് പകുതി ഇപ്പോൾ നൽകുകയും ബാക്കി അടുത്ത ആഴ്ച നൽകുകയും ചെയ്യുക, അല്ലെങ്കിൽ കുടിശ്ശിക പിരിക്കുക.`,
      };
    }
    if (exp.verdict === 'tight_dips_reserve') {
      return {
        explanation: `${due} ന് അടയ്ക്കാം, പക്ഷേ ബാലൻസ് ${projBal} ആയി കുറഞ്ഞ് ${resFmt} കരുതൽ തുകയേക്കാൾ ${gap} കുറയും.`,
        recommendedStep: `ലഭിക്കാനുള്ള തുക വേഗത്തിൽ പിരിച്ചെടുക്കുക.`,
      };
    }
    return {
      explanation: `${due} ന് ബിൽ അടച്ച ശേഷവും ${projBal} സുരക്ഷിതമായി കൈവശമുണ്ടാകും.`,
      recommendedStep: `${due} ന് സാധാരണ പോലെ അടയ്ക്കാം.`,
    };
  }

  if (exp.verdict === 'unaffordable_shortage') {
    return {
      explanation: `Paying ${amt} on ${due} leaves you short by ${gap} because customer payments are expected a few days later.`,
      recommendedStep: `Ask ${party} to take half now and half next week, or collect overdue customer bills first.`,
    };
  }
  if (exp.verdict === 'tight_dips_reserve') {
    return {
      explanation: `Payable on ${due}, but your cash drops to ${projBal} (${gap} below your ${resFmt} safety cushion).`,
      recommendedStep: `Follow up on pending customer bills first or ask for 3–4 extra days.`,
    };
  }
  return {
    explanation: `Safe to pay — you will still have ${projBal} in hand on ${due}.`,
    recommendedStep: `Pay as scheduled on ${due}.`,
  };
}

export function getSimpleDelayImpactHeadline(
  summary: FinancialAdviceReport['delayCashImpactSummary'],
  lang: AppLanguage
): string {
  const drag = fmtRupeeLocal(summary.cashDragFromDelays, lang);
  const lowOnTime = fmtRupeeLocal(summary.lowestWithOnTimeReceipts, lang);
  const lowExpected = fmtRupeeLocal(summary.lowestWithMLPredictedReceipts, lang);

  if (summary.cashDragFromDelays > 0) {
    const map: Record<AppLanguage, string> = {
      en: `If customers pay late as usual, your lowest 30-day cash drops by ${drag} (from ${lowOnTime} down to ${lowExpected}).`,
      kn: `ಗ್ರಾಹಕರು ಎಂದಿನಂತೆ ಸ್ವಲ್ಪ ತಡವಾಗಿ ಹಣ ಕೊಟ್ಟರೆ ಮುಂದಿನ ೩೦ ದಿನಗಳಲ್ಲಿ ನಿಮ್ಮ ಕನಿಷ್ಠ ನಗದು ${drag} ರಷ್ಟು ಕಡಿಮೆಯಾಗುತ್ತದೆ (${lowOnTime} ಬದಲು ${lowExpected}).`,
      hi: `यदि ग्राहक अपनी पुरानी आदत की तरह देरी से पैसे दें, तो अगले ३० दिनों में न्यूनतम नकद ${drag} कम हो जाएगा (${lowOnTime} की जगह ${lowExpected})।`,
      ta: `வாடிக்கையாளர்கள் வழக்கம் போல் தாமதமாகப் பணம் தந்தால், அடுத்த ௩௦ நாட்களில் உங்கள் குறைந்தபட்ச இருப்பு ${drag} குறையும் (${lowOnTime} இலிருந்து ${lowExpected}).`,
      te: `కస్టమర్లు ఎప్పటిలాగే ఆలస్యంగా చెల్లిస్తే, వచ్చే ౩౦ రోజుల్లో మీ కనిష్ట నగదు ${drag} తగ్గుతుంది (${lowOnTime} నుండి ${lowExpected} కు).`,
      ml: `ഇടപാടുകാർ പതിവുപോലെ വൈകി പണം നൽകിയാൽ അടുത്ത ൩൦ ദിവസത്തെ കുറഞ്ഞ ബാലൻസ് ${drag} കുറയും (${lowOnTime} ൽ നിന്ന് ${lowExpected} ആകും).`,
    };
    return map[lang];
  }

  const okMap: Record<AppLanguage, string> = {
    en: `Usual customer payment delays do not reduce your lowest 30-day cash balance (${lowExpected}).`,
    kn: `ಮುಂದಿನ ೩೦ ದಿನಗಳಲ್ಲಿ ಗ್ರಾಹಕರ ಸಾಮಾನ್ಯ ವಿಳಂಬದಿಂದ ನಿಮ್ಮ ಕನಿಷ್ಠ ನಗದು ಶಿಲ್ಕು (${lowExpected}) ಕಡಿಮೆಯಾಗುವುದಿಲ್ಲ.`,
    hi: `अगले ३० दिनों में ग्राहकों की सामान्य देरी से आपके न्यूनतम बैलेंस (${lowExpected}) पर बुरा असर नहीं पड़ेगा।`,
    ta: `அடுத்த ௩௦ நாட்களில் வாடிக்கையாளர் தாமதத்தால் உங்கள் குறைந்தபட்ச இருப்பு (${lowExpected}) பாதிக்கப்படாது.`,
    te: `వచ్చే ౩౦ రోజుల్లో కస్టమర్ల సాధారణ ఆలస్యం వల్ల మీ కనిష్ట బ్యాలెన్స్ (${lowExpected}) తగ్గదు.`,
    ml: `അടുത്ത ൩൦ ദിവസങ്ങളിൽ ഇടപാടുകാരുടെ സാധാരണ താമസം നിങ്ങളുടെ കുറഞ്ഞ ബാലൻസിനെ (${lowExpected}) ബാധിക്കില്ല.`,
  };
  return okMap[lang];
}

// ============================================================================
// 5. FULL 6-LANGUAGE UI LABELS FOR ALL DASHBOARD CARDS, MODALS & TABLES
// ============================================================================

export function getDashboardExtraStrings(lang: AppLanguage) {
  const n7 = toNativeDigits(7, lang);
  const n30 = toNativeDigits(30, lang);
  const n90 = toNativeDigits(90, lang);

  if (lang === 'kn') {
    return {
      voiceHeaderBtn: 'ಧ್ವನಿ ಸಹಾಯಕ (ಇಂಗ್ಲಿಷ್ / ಕನ್ನಡ)',
      voiceFloatingBtn: 'ಧ್ವನಿ ಸಹಾಯಕ ತೆರೆಯಿರಿ (ಇಂಗ್ಲಿಷ್ / ಕನ್ನಡ)',
      resetDemoBtn: 'ಡೆಮೊ ಮರುಹೊಂದಿಸಿ',
      privateWorkspaceSub: 'ಖಾಸಗಿ ನೈಜ ವ್ಯಾಪಾರ ಖಾತೆ',
      myRealLedgerTitle: 'ನನ್ನ ನೈಜ ವ್ಯಾಪಾರ ಖಾತೆ',
      menuSubBalance: `${n7}, ${n30} ಮತ್ತು ${n90} ದಿನಗಳ ನಗದು ಮುನ್ಸೂಚನೆ`,
      menuSubPending: 'ಗ್ರಾಹಕರಿಂದ ಬರಬೇಕಾದ ಹಣ ಮತ್ತು ಪಾವತಿ ದಿನಾಂಕದ ಸರಳ ಅಂದಾಜು',
      menuSubUpcoming: 'ಸರಬರಾಜುದಾರರು, ಬಾಡಿಗೆ, ಸಾಲ ಮತ್ತು ಬಿಲ್ ಪಾವತಿ ಸಾಮರ್ಥ್ಯ',
      menuSubAdvice: 'ಮೊದಲು ಯಾರನ್ನು ಕೇಳಬೇಕು ಮತ್ತು ಒಂದೊಮ್ಮೆ ತಡವಾದರೆ ಏನಾಗುತ್ತದೆ',
      menuSubCustomers: 'ಪ್ರತಿ ಗ್ರಾಹಕರ ಹಿಂದಿನ ಪಾವತಿ ಅಭ್ಯಾಸ ಮತ್ತು ನಿಖರತೆ',
      menuSubNotices: 'ತೆರಿಗೆ ಮತ್ತು ಕಾನೂನು ನೋಟಿಸ್ ಸರಳ ವಿವರಣೆ',
      menuSubGuide: 'ರೂಪಿವಂತ ಬಳಸುವ ಸುಲಭ ಹಂತಗಳು',
      priorityWord: 'ಪ್ರಮುಖ',
      openWord: 'ತೆರೆದಿದೆ',
      customerNameField: 'ಗ್ರಾಹಕರ ಹೆಸರು *',
      supplierPayeeField: 'ಸರಬರಾಜುದಾರ / ಹಣ ಪಡೆಯುವವರ ಹೆಸರು *',
      totalAmountField: 'ಒಟ್ಟು ಬಿಲ್ ಮೊತ್ತ (₹) *',
      alreadyPaidField: 'ಈಗಾಗಲೇ ಪಾವತಿಸಿದ / ಬಂದ ಹಣ (₹)',
      invoiceNoField: 'ಬಿಲ್ ಸಂಖ್ಯೆ',
      phoneField: 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ (ವಾಟ್ಸಾಪ್‌ಗಾಗಿ)',
      promisedKeepNote: 'ಪ್ರತ್ಯೇಕವಾಗಿ ಉಳಿಸಲಾಗುತ್ತದೆ — ಅಂದಾಜು ದಿನಾಂಕ ಇದನ್ನು ಬದಲಿಸುವುದಿಲ್ಲ',
      descriptionField: 'ವಿವರ / ಸರಕು ಹೆಸರು',
      editPendingHeading: 'ಬಾಕಿ ಪಾವತಿ ವಿವರ ತಿದ್ದುಪಡಿ',
      addPendingHeading: 'ಹೊಸ ಬಾಕಿ ಪಾವತಿ ಸೇರಿಸಿ (ಗ್ರಾಹಕರಿಂದ ಬರಬೇಕಾದ ಹಣ)',
      editUpcomingHeading: 'ಮುಂಬರುವ ಬಿಲ್ ತಿದ್ದುಪಡಿ',
      addUpcomingHeading: 'ಹೊಸ ಮುಂಬರುವ ಪಾವತಿ ಸೇರಿಸಿ (ಕೊಡಬೇಕಾದ ಬಿಲ್ / ಸಾಲ)',
      endingBalanceHorizon: (d: number) => `${toNativeDigits(d, lang)} ದಿನಗಳ ಅಂದಾಜು ಅಂತಿಮ ಶಿಲ್ಕು`,
      receiptsInLabel: 'ಬರುವ ಅಂದಾಜು ಹಣ:',
      billsOutLabel: 'ಕೊಡಬೇಕಾದ ಬಿಲ್‌ಗಳು:',
      lowestOnDate: (dStr: string) => `ಕನಿಷ್ಠ (${dStr}):`,
      cashDeficitBadge: 'ಹಣದ ಕೊರತೆ',
      belowReserveBadge: 'ಸುರಕ್ಷತಾ ಮೀಸಲಿಗಿಂತ ಕಡಿಮೆ',
      shortageAlertHorizon: (d: number, gap: string, dt: string) =>
        `${toNativeDigits(d, lang)} ದಿನಗಳ ಎಚ್ಚರಿಕೆ: ${dt} ರಂದು ${gap} ಹಣ ಕಡಿಮೆ ಬೀಳಬಹುದು`,
      reserveDipHorizon: (d: number, gap: string, dt: string) =>
        `${toNativeDigits(d, lang)} ದಿನಗಳಲ್ಲಿ ${dt} ರಂದು ಸುರಕ್ಷತಾ ಹಣಕ್ಕಿಂತ ${gap} ಕಡಿಮೆಯಾಗಬಹುದು`,
      billsCausingDip: 'ಹಣ ಕಡಿಮೆಯಾಗಲು ಕಾರಣವಾಗುವ ಬಿಲ್‌ಗಳು:',
      delayedInvoicesAffecting: 'ತಡವಾಗುತ್ತಿರುವ ಗ್ರಾಹಕರ ಬಿಲ್‌ಗಳು:',
      askAssistantExplainBtn: 'ಸರಳವಾಗಿ ವಿವರಿಸಿ',
      explainShortBtn: 'ವಿವರಿಸಿ',
      whatsappRemindBtn: 'ವಾಟ್ಸಾಪ್ ನೆನಪು',
      chartTimingBasisLabel: 'ನಕ್ಷೆಯಲ್ಲಿ ಹಣ ಬರುವ ದಿನಾಂಕದ ಆಧಾರ:',
      totalPendingBanner: (cnt: number) =>
        `ಒಟ್ಟು ಬಾಕಿ ಬರಬೇಕಾದ ಹಣ (${toNativeDigits(cnt, lang)} ಬಿಲ್‌ಗಳು)`,
      totalUpcomingBanner: (cnt: number) =>
        `ಒಟ್ಟು ಮುಂಬರುವ ಬಿಲ್‌ಗಳು (${toNativeDigits(cnt, lang)} ಬಿಲ್‌ಗಳು)`,
      earlyPromiseBadge: 'ಮಾತು ಬೇಗ · ಅಭ್ಯಾಸ ತಡ',
      partialPaidBadge: (amt: string) => `ಭಾಗಶಃ ಬಂದಿದೆ (${amt})`,
      billedOnPrefix: 'ಬಿಲ್ ದಿನಾಂಕ',
      ofTotalSuffix: (tot: string) => `ಒಟ್ಟು ${tot} ರಲ್ಲಿ`,
      noneRecordedYet: 'ಇನ್ನೂ ದಾಖಲಾಗಿಲ್ಲ',
      expectedRangeHeader: 'ಹಣ ಬರುವ ಅಂದಾಜು ದಿನಾಂಕ',
      recordSettlementTitle: 'ಬಂದ ಹಣ ದಾಖಲಿಸಿ (ಪೂರ್ಣ ಅಥವಾ ಭಾಗಶಃ)',
      amountReceivedNowLabel: 'ಈಗ ಬಂದ ಮೊತ್ತ (₹)',
      actualPaymentDateLabel: 'ಹಣ ಬಂದ ದಿನಾಂಕ',
      confirmFullSettlementBtn: 'ಪೂರ್ಣ ಪಾವತಿ ಖಚಿತಪಡಿಸಿ',
      recordPartialBtn: 'ಭಾಗಶಃ ಹಣ ದಾಖಲಿಸಿ',
      legalNoticeDemandBadge: 'ಕಾನೂನು ನೋಟಿಸ್ ಬೇಡಿಕೆ',
      cashAfterBillLabel: 'ಬಿಲ್ ಕೊಟ್ಟ ನಂತರ ಉಳಿಯುವ ಹಣ:',
      actionPrefix: 'ಸಲಹೆ:',
      noPendingEmpty: 'ಈಗ ಯಾವುದೇ ಬಾಕಿ ಪಾವತಿಗಳಿಲ್ಲ. ಹೊಸ ಬಿಲ್ ಸೇರಿಸಲು ಮೇಲಿನ ಬಟನ್ ಒತ್ತಿರಿ.',
      noUpcomingEmpty: 'ಈಗ ಯಾವುದೇ ಮುಂಬರುವ ಬಿಲ್‌ಗಳಿಲ್ಲ. ಹೊಸ ಬಿಲ್ ಸೇರಿಸಲು ಮೇಲಿನ ಬಟನ್ ಒತ್ತಿರಿ.',
      horizonOutlookTitle: (d: number) => `${toNativeDigits(d, lang)} ದಿನಗಳ ನಗದು ನೋಟ`,
      lowestCashLabel: 'ಕನಿಷ್ಠ ನಗದು:',
      shortfallWord: 'ಕೊರತೆ',
      reserveDipWord: 'ಮೀಸಲು ಇಳಿಕೆ',
      healthyWord: 'ಸುರಕ್ಷಿತ',
      dueWord: 'ಗಡುವು',
      promisedWord: 'ಭರವಸೆ',
      expectedWord: 'ಅಂದಾಜು',
      allClearFollowUp: 'ಯಾವುದೇ ತಡವಾದ ಬಾಕಿ ಇಲ್ಲ — ಎಲ್ಲಾ ಗ್ರಾಹಕರ ಪಾವತಿಗಳು ಸಮಯಕ್ಕೆ ಸರಿಯಾಗಿವೆ.',
      noUpcomingScheduled: 'ಯಾವುದೇ ಮುಂಬರುವ ಬಿಲ್‌ಗಳಿಲ್ಲ.',
      dueDateCashImpactTitle: 'ಮಾರಾಟಗಾರರು ಮತ್ತು ಬಿಲ್‌ಗಳ ನಗದು ಪರಿಣಾಮ',
      projectedCashOnDueLabel: 'ಆ ದಿನ ಉಳಿಯುವ ಅಂದಾಜು ನಗದು',
      delayImpactBannerTitle: 'ತಡವಾದ ಪಾವತಿಗಳಿಂದ ನಿಮ್ಮ ನಗದಿನ ಮೇಲಾಗುವ ಪರಿಣಾಮ:',
      customerSummaryBanner: (cCnt: number, sCnt: number, oCnt: number, mae: string) =>
        `${toNativeDigits(cCnt, lang)} ಗ್ರಾಹಕರ ಖಾತೆಗಳು · ${toNativeDigits(sCnt, lang)} ಪೂರ್ಣಗೊಂಡ ಹಳೆಯ ಬಿಲ್‌ಗಳ ಅಭ್ಯಾಸ ಆಧಾರಿತ · ${toNativeDigits(oCnt, lang)} ಪಾವತಿ ಫಲಿತಾಂಶ ಪರಿಶೀಲಿಸಲಾಗಿದೆ (ಸರಾಸರಿ ವ್ಯತ್ಯಾಸ ±${mae} ದಿನ)`,
      addPhoneBtn: '+ ಫೋನ್ ಸಂಖ್ಯೆ ಸೇರಿಸಿ',
      saveBtn: 'ಉಳಿಸಿ',
      settledCountBadge: (cnt: number, rate: string) =>
        `${toNativeDigits(cnt, lang)} ಹಳೆಯ ಬಿಲ್ · ${rate}% ಸಮಯಕ್ಕೆ ಪಾವತಿ`,
      newCustomerZeroBills: 'ಹೊಸ ಗ್ರಾಹಕ (೦ ಹಳೆಯ ಬಿಲ್)',
      totalBilledCol: 'ಒಟ್ಟು ಬಿಲ್',
      openPendingCol: 'ಬಾಕಿ ಹಣ',
      avgDelayCol: 'ಸಾಮಾನ್ಯ ತಡ',
      nextExpectedCol: 'ಮುಂದಿನ ಅಂದಾಜು ಪಾವತಿ',
      invoiceHistoryHeading: (idLoc: string) =>
        `ಹಿಂದಿನ ಬಿಲ್ ಮತ್ತು ಪಾವತಿ ಇತಿಹಾಸ (${idLoc})`,
      colInvoice: 'ಬಿಲ್ ಸಂಖ್ಯೆ',
      colAmount: 'ಮೊತ್ತ',
      colDueDate: 'ಗಡುವು ದಿನಾಂಕ',
      colPromised: 'ಭರವಸೆ ದಿನಾಂಕ',
      colActualPaid: 'ಹಣ ಬಂದ ದಿನಾಂಕ',
      colDelayStatus: 'ಸ್ಥಿತಿ / ತಡ',
      paidOnTimeStatus: 'ಸಮಯಕ್ಕೆ ಬಂದಿದೆ',
      daysLateSuffix: (d: number) => `${toNativeDigits(d, lang)} ದಿನ ತಡ`,
      daysOverdueSuffix: (d: number) => `${toNativeDigits(d, lang)} ದಿನ ಮೀರಿದೆ`,
      pendingStatusWord: 'ಬಾಕಿ ಇದೆ',
      accuracySectionTitle: 'ಹಿಂದಿನ ಅಂದಾಜು ಮತ್ತು ನಿಜವಾದ ಪಾವತಿ ಹೋಲಿಕೆ',
      accuracySectionSub: 'ಗ್ರಾಹಕರು ಹಣ ಕೊಟ್ಟ ನಂತರ ನಮ್ಮ ಅಂದಾಜು ಎಷ್ಟು ಸರಿಯಾಗಿತ್ತು ಎಂಬ ನೈಜ ದಾಖಲೆ.',
      withinRangeRateLabel: 'ಅಂದಾಜು ಅವಧಿಯೊಳಗೆ ಬಂದ ಪಾವತಿ',
      avgErrorDaysLabel: 'ಸರಾಸರಿ ದಿನದ ವ್ಯತ್ಯಾಸ',
      daysUnit: 'ದಿನಗಳು',
      colPredictedRange: 'ಅಂದಾಜು ದಿನಾಂಕ (ಅವಧಿ)',
      colErrorResult: 'ವ್ಯತ್ಯಾಸ / ಫಲಿತಾಂಶ',
      accurateWithinBand: 'ನಿಖರ (ಅವಧಿಯೊಳಗೆ ಬಂದಿದೆ)',
      offByDays: (d: number) => `${toNativeDigits(d, lang)} ದಿನ ವ್ಯತ್ಯಾಸ`,
      weeklyBalanceCheckTitle: 'ವಾರದ ನಗದು ಶಿಲ್ಕು ಪರಿಶೀಲನೆ',
    };
  }

  if (lang === 'hi') {
    return {
      voiceHeaderBtn: 'वॉइस सहायक (अंग्रेज़ी / कन्नड़)',
      voiceFloatingBtn: 'वॉइस सहायक खोलें (अंग्रेज़ी / कन्नड़)',
      resetDemoBtn: 'डेमो रीसेट करें',
      privateWorkspaceSub: 'निजी असली व्यापार खाता',
      myRealLedgerTitle: 'मेरा असली व्यापार खाता',
      menuSubBalance: `${n7}, ${n30} और ${n90} दिन का नकद अनुमान`,
      menuSubPending: 'ग्राहकों से आने वाला पैसा और पिछले व्यवहार पर आधारित सरल अनुमान',
      menuSubUpcoming: 'सप्लायर, किराया, साहूकार और बिल चुकाने की क्षमता',
      menuSubAdvice: 'सबसे पहले किससे पैसे मांगें और देरी होने पर क्या असर होगा',
      menuSubCustomers: 'हर ग्राहक का पिछला भुगतान रिकॉर्ड और सटीकता',
      menuSubNotices: 'टैक्स व कानूनी नोटिस की सरल समझ',
      menuSubGuide: 'रूपिवंता इस्तेमाल करने के आसान कदम',
      priorityWord: 'ज़रूरी',
      openWord: 'खुले',
      customerNameField: 'ग्राहक का नाम *',
      supplierPayeeField: 'सप्लायर / साहूकार / पाने वाले का नाम *',
      totalAmountField: 'कुल बिल राशि (₹) *',
      alreadyPaidField: 'पहले से मिला / दिया गया पैसा (₹)',
      invoiceNoField: 'बिल नंबर',
      phoneField: 'मोबाइल नंबर (व्हाट्सएप के लिए)',
      promisedKeepNote: 'अलग से सुरक्षित रहेगा — अनुमानित तारीख़ इसे बदलेगी नहीं',
      descriptionField: 'विवरण / माल का नाम',
      editPendingHeading: 'बकाया भुगतान सुधारें',
      addPendingHeading: 'नया बकाया भुगतान जोड़ें (ग्राहक से आने वाला पैसा)',
      editUpcomingHeading: 'आगामी बिल सुधारें',
      addUpcomingHeading: 'नया आगामी भुगतान जोड़ें (देने वाला बिल / उधार)',
      endingBalanceHorizon: (d: number) => `${toNativeDigits(d, lang)} दिन बाद अनुमानित बैलेंस`,
      receiptsInLabel: 'आने वाला अनुमानित पैसा:',
      billsOutLabel: 'देने वाले बिल:',
      lowestOnDate: (dStr: string) => `न्यूनतम (${dStr}):`,
      cashDeficitBadge: 'पैसे की कमी',
      belowReserveBadge: 'सुरक्षित बचत से कम',
      shortageAlertHorizon: (d: number, gap: string, dt: string) =>
        `${toNativeDigits(d, lang)}-दिन चेतावनी: ${dt} को ${gap} कम पड़ सकते हैं`,
      reserveDipHorizon: (d: number, gap: string, dt: string) =>
        `${toNativeDigits(d, lang)} दिन में ${dt} को सुरक्षित बचत से ${gap} कम होगा`,
      billsCausingDip: 'नकदी कम करने वाले बिल:',
      delayedInvoicesAffecting: 'देरी वाले ग्राहक बिल जिनका असर पड़ रहा है:',
      askAssistantExplainBtn: 'आसान भाषा में समझें',
      explainShortBtn: 'समझें',
      whatsappRemindBtn: 'व्हाट्सएप याद दिलाएं',
      chartTimingBasisLabel: 'चार्ट में पैसा आने की तारीख़ का आधार:',
      totalPendingBanner: (cnt: number) =>
        `कुल आने वाला बकाया (${toNativeDigits(cnt, lang)} बिल)`,
      totalUpcomingBanner: (cnt: number) =>
        `कुल देने वाले आगामी बिल (${toNativeDigits(cnt, lang)} बिल)`,
      earlyPromiseBadge: 'वादा जल्दी · आदत देरी की',
      partialPaidBadge: (amt: string) => `आंशिक मिला (${amt})`,
      billedOnPrefix: 'बिल तारीख़',
      ofTotalSuffix: (tot: string) => `कुल ${tot} में से`,
      noneRecordedYet: 'दर्ज नहीं है',
      expectedRangeHeader: 'पैसा आने की अनुमानित तारीख़',
      recordSettlementTitle: 'मिला हुआ पैसा दर्ज करें (पूरा या आंशिक)',
      amountReceivedNowLabel: 'अभी मिली राशि (₹)',
      actualPaymentDateLabel: 'पैसा मिलने की तारीख़',
      confirmFullSettlementBtn: 'पूरा भुगतान पक्का करें',
      recordPartialBtn: 'आंशिक भुगतान जोड़ें',
      legalNoticeDemandBadge: 'कानूनी नोटिस मांग',
      cashAfterBillLabel: 'बिल देने के बाद बचेगा:',
      actionPrefix: 'सलाह:',
      noPendingEmpty: 'अभी कोई बकाया भुगतान नहीं है। नया बिल जोड़ने के लिए ऊपर बटन दबाएं।',
      noUpcomingEmpty: 'अभी कोई आगामी बिल नहीं है। नया बिल जोड़ने के लिए ऊपर बटन दबाएं।',
      horizonOutlookTitle: (d: number) => `${toNativeDigits(d, lang)} दिन का नकद अनुमान`,
      lowestCashLabel: 'न्यूनतम नकद:',
      shortfallWord: 'कमी',
      reserveDipWord: 'बचत कम',
      healthyWord: 'सुरक्षित',
      dueWord: 'देय',
      promisedWord: 'वादा',
      expectedWord: 'अनुमान',
      allClearFollowUp: 'कोई रुका हुआ बकाया नहीं — सभी ग्राहकों के भुगतान समय पर हैं।',
      noUpcomingScheduled: 'कोई आगामी बिल दर्ज नहीं है।',
      dueDateCashImpactTitle: 'आगामी बिल और नकद सामर्थ्य',
      projectedCashOnDueLabel: 'बिल के दिन अनुमानित नकद',
      delayImpactBannerTitle: 'ग्राहकों की देरी का आपके नकद पर असर:',
      customerSummaryBanner: (cCnt: number, sCnt: number, oCnt: number, mae: string) =>
        `${toNativeDigits(cCnt, lang)} ग्राहक खाते · ${toNativeDigits(sCnt, lang)} पुराने बिलों के अनुभव पर आधारित · ${toNativeDigits(oCnt, lang)} भुगतान जांचे गए (औसत अंतर ±${mae} दिन)`,
      addPhoneBtn: '+ फ़ोन जोड़ें',
      saveBtn: 'सेव करें',
      settledCountBadge: (cnt: number, rate: string) =>
        `${toNativeDigits(cnt, lang)} पुराने बिल · ${rate}% समय पर`,
      newCustomerZeroBills: 'नया ग्राहक (० पुराने बिल)',
      totalBilledCol: 'कुल बिल',
      openPendingCol: 'बाकी राशि',
      avgDelayCol: 'सामान्य देरी',
      nextExpectedCol: 'अगला अनुमानित भुगतान',
      invoiceHistoryHeading: (idLoc: string) =>
        `पुराने बिल और भुगतान का इतिहास (${idLoc})`,
      colInvoice: 'बिल नंबर',
      colAmount: 'राशि',
      colDueDate: 'देय तारीख़',
      colPromised: 'वादा तारीख़',
      colActualPaid: 'भुगतान तारीख़',
      colDelayStatus: 'स्थिति / देरी',
      paidOnTimeStatus: 'समय पर मिला',
      daysLateSuffix: (d: number) => `${toNativeDigits(d, lang)} दिन देरी`,
      daysOverdueSuffix: (d: number) => `${toNativeDigits(d, lang)} दिन ऊपर`,
      pendingStatusWord: 'बाकी है',
      accuracySectionTitle: 'अनुमान बनाम असली भुगतान की जांच',
      accuracySectionSub: 'जब ग्राहक भुगतान करते हैं, तो हमारे अनुमान और असली तारीख़ की तुलना यहाँ दिखती है।',
      withinRangeRateLabel: 'अनुमानित समय में मिले बिल',
      avgErrorDaysLabel: 'औसत दिन का अंतर',
      daysUnit: 'दिन',
      colPredictedRange: 'अनुमानित तारीख़ (सीमा)',
      colErrorResult: 'अंतर / परिणाम',
      accurateWithinBand: 'सटीक (अनुमानित समय के भीतर)',
      offByDays: (d: number) => `${toNativeDigits(d, lang)} दिन का अंतर`,
      weeklyBalanceCheckTitle: 'साप्ताहिक नकद मिलान रिकॉर्ड',
    };
  }

  if (lang === 'ta') {
    return {
      voiceHeaderBtn: 'குரல் உதவி (ஆங்கிலம் / கன்னடம்)',
      voiceFloatingBtn: 'குரல் உதவியாளரைத் திற (ஆங்கிலம் / கன்னடம்)',
      resetDemoBtn: 'டெமோ மீட்டமை',
      privateWorkspaceSub: 'தனிப்பட்ட உண்மை வணிகக் கணக்கு',
      myRealLedgerTitle: 'எனது உண்மை வணிகக் கணக்கு',
      menuSubBalance: `${n7}, ${n30} & ${n90} நாள் பணப்புழக்க கணிப்பு`,
      menuSubPending: 'வாடிக்கையாளர் நிலுவை மற்றும் பழைய பழக்கத்தின் அடிப்படைக் கணிப்பு',
      menuSubUpcoming: 'சப்ளையர், வாடகை, கடன் மற்றும் பில் செலுத்தும் தகுதி',
      menuSubAdvice: 'யாரை முதலில் கேட்க வேண்டும் & தாமதமானால் என்ன நடக்கும்',
      menuSubCustomers: 'வாடிக்கையாளர் பழைய பில் வரலாறு மற்றும் துல்லியம்',
      menuSubNotices: 'வரி மற்றும் சட்ட நோட்டீஸ் எளிய விளக்கம்',
      menuSubGuide: 'ரூபிவந்தா பயன்படுத்தும் எளிய முறை',
      priorityWord: 'முக்கியம்',
      openWord: 'திறந்தவை',
      customerNameField: 'வாடிக்கையாளர் பெயர் *',
      supplierPayeeField: 'சப்ளையர் / பணம் பெறுபவர் பெயர் *',
      totalAmountField: 'மொத்த பில் தொகை (₹) *',
      alreadyPaidField: 'ஏற்கனவே வந்த / கொடுத்த தொகை (₹)',
      invoiceNoField: 'பில் எண்',
      phoneField: 'மொபைல் எண் (வாட்ஸ்அப் நினைவூட்டலுக்கு)',
      promisedKeepNote: 'தனியாகச் சேமிக்கப்படும் — கணிப்பு தேதி இதை மாற்றாது',
      descriptionField: 'விவரம் / பொருள் பெயர்',
      editPendingHeading: 'நிலுவை வரவைத் திருத்து',
      addPendingHeading: 'புதிய நிலுவை வரவு சேர் (வர வேண்டிய பணம்)',
      editUpcomingHeading: 'வரவிருக்கும் பில்லைத் திருத்து',
      addUpcomingHeading: 'புதிய வரவிருக்கும் கட்டணம் சேர் (செலுத்த வேண்டிய பில்)',
      endingBalanceHorizon: (d: number) => `${toNativeDigits(d, lang)} நாள் இறுதி இருப்பு கணிப்பு`,
      receiptsInLabel: 'எதிர்பார்க்கும் வரவு:',
      billsOutLabel: 'செலுத்த வேண்டிய பில்கள்:',
      lowestOnDate: (dStr: string) => `குறைந்தபட்சம் (${dStr}):`,
      cashDeficitBadge: 'பணப் பற்றாக்குறை',
      belowReserveBadge: 'பாதுகாப்பு இருப்பை விடக் குறைவு',
      shortageAlertHorizon: (d: number, gap: string, dt: string) =>
        `${toNativeDigits(d, lang)}-நாள் எச்சரிக்கை: ${dt} அன்று ${gap} பற்றாக்குறை வரலாம்`,
      reserveDipHorizon: (d: number, gap: string, dt: string) =>
        `${toNativeDigits(d, lang)} நாளில் ${dt} அன்று பாதுகாப்பு இருப்பு ${gap} குறையும்`,
      billsCausingDip: 'இருப்பு குறையக் காரணமான பில்கள்:',
      delayedInvoicesAffecting: 'தாமதமாகும் வாடிக்கையாளர் பில்கள்:',
      askAssistantExplainBtn: 'எளிமையாக விளக்கு',
      explainShortBtn: 'விளக்கு',
      whatsappRemindBtn: 'வாட்ஸ்அப் நினைவூட்டு',
      chartTimingBasisLabel: 'வரைபடத்தில் பணம் வரும் தேதியின் அடிப்படை:',
      totalPendingBanner: (cnt: number) =>
        `மொத்த நிலுவை வரவு (${toNativeDigits(cnt, lang)} பில்கள்)`,
      totalUpcomingBanner: (cnt: number) =>
        `மொத்த வரவிருக்கும் பில்கள் (${toNativeDigits(cnt, lang)} பில்கள்)`,
      earlyPromiseBadge: 'வாக்குறுதி முன் · வழக்கம் தாமதம்',
      partialPaidBadge: (amt: string) => `பகுதி வந்தது (${amt})`,
      billedOnPrefix: 'பில் தேதி',
      ofTotalSuffix: (tot: string) => `மொத்தம் ${tot} இல்`,
      noneRecordedYet: 'பதிவு இல்லை',
      expectedRangeHeader: 'பணம் வரும் உத்தேச தேதி',
      recordSettlementTitle: 'வந்த பணத்தைப் பதிவு செய் (முழு / பகுதி)',
      amountReceivedNowLabel: 'இப்போது வந்த தொகை (₹)',
      actualPaymentDateLabel: 'பணம் வந்த தேதி',
      confirmFullSettlementBtn: 'முழு வரவை உறுதி செய்',
      recordPartialBtn: 'பகுதி வரவைச் சேர்',
      legalNoticeDemandBadge: 'சட்ட நோட்டீஸ் தொகை',
      cashAfterBillLabel: 'பில் செலுத்திய பின் இருப்பு:',
      actionPrefix: 'ஆலோசனை:',
      noPendingEmpty: 'நிலுவை வரவுகள் எதுவும் இல்லை. மேலே உள்ள பொத்தானை அழுத்திச் சேர்க்கவும்.',
      noUpcomingEmpty: 'வரவிருக்கும் பில்கள் எதுவும் இல்லை.',
      horizonOutlookTitle: (d: number) => `${toNativeDigits(d, lang)} நாள் பண நிலை`,
      lowestCashLabel: 'குறைந்த இருப்பு:',
      shortfallWord: 'பற்றாக்குறை',
      reserveDipWord: 'இருப்பு குறைவு',
      healthyWord: 'பாதுகாப்பு',
      dueWord: 'கெடு',
      promisedWord: 'வாக்குறுதி',
      expectedWord: 'எதிர்பார்ப்பு',
      allClearFollowUp: 'தாமதமான பில்கள் எதுவும் இல்லை — அனைத்தும் சரியான நேரத்தில் உள்ளன.',
      noUpcomingScheduled: 'வரவிருக்கும் பில்கள் இல்லை.',
      dueDateCashImpactTitle: 'பில் செலுத்தும் தகுதி மற்றும் இருப்பு',
      projectedCashOnDueLabel: 'கெடு நாளில் கையிருப்பு',
      delayImpactBannerTitle: 'தாமதமான வரவுகளால் பண இருப்பில் ஏற்படும் மாற்றம்:',
      customerSummaryBanner: (cCnt: number, sCnt: number, oCnt: number, mae: string) =>
        `${toNativeDigits(cCnt, lang)} வாடிக்கையாளர்கள் · ${toNativeDigits(sCnt, lang)} பழைய பில்களின் அடிப்படை · ${toNativeDigits(oCnt, lang)} முடிவுகள் சரிபார்க்கப்பட்டன (சராசரி வேறுபாடு ±${mae} நாள்)`,
      addPhoneBtn: '+ எண் சேர்',
      saveBtn: 'சேமி',
      settledCountBadge: (cnt: number, rate: string) =>
        `${toNativeDigits(cnt, lang)} பழைய பில் · ${rate}% சரியான நேரம்`,
      newCustomerZeroBills: 'புதியவர் (௦ பழைய பில்)',
      totalBilledCol: 'மொத்த பில்',
      openPendingCol: 'நிலுவை',
      avgDelayCol: 'வழக்கமான தாமதம்',
      nextExpectedCol: 'அடுத்த எதிர்பார்ப்பு',
      invoiceHistoryHeading: (idLoc: string) => `பழைய பில் வரலாறு (${idLoc})`,
      colInvoice: 'பில் எண்',
      colAmount: 'தொகை',
      colDueDate: 'கெடு தேதி',
      colPromised: 'வாக்குறுதி தேதி',
      colActualPaid: 'வந்த தேதி',
      colDelayStatus: 'நிலை / தாமதம்',
      paidOnTimeStatus: 'நேரத்திற்கு வந்தது',
      daysLateSuffix: (d: number) => `${toNativeDigits(d, lang)} நாள் தாமதம்`,
      daysOverdueSuffix: (d: number) => `${toNativeDigits(d, lang)} நாள் கடந்தது`,
      pendingStatusWord: 'நிலுவை',
      accuracySectionTitle: 'கணிப்பு மற்றும் உண்மை வரவு ஒப்பீடு',
      accuracySectionSub: 'வாடிக்கையாளர் பணம் செலுத்திய பின் நமது கணிப்பு எவ்வளவு சரியாக இருந்தது என்ற பதிவு.',
      withinRangeRateLabel: 'கணித்த காலத்திற்குள் வந்தவை',
      avgErrorDaysLabel: 'சராசரி நாள் வேறுபாடு',
      daysUnit: 'நாட்கள்',
      colPredictedRange: 'கணித்த தேதி (வரம்பு)',
      colErrorResult: 'வேறுபாடு / முடிவு',
      accurateWithinBand: 'துல்லியம் (வரம்பிற்குள் வந்தது)',
      offByDays: (d: number) => `${toNativeDigits(d, lang)} நாள் வேறுபாடு`,
      weeklyBalanceCheckTitle: 'வாராந்திர இருப்பு சரிபார்ப்பு',
    };
  }

  if (lang === 'te') {
    return {
      voiceHeaderBtn: 'వాయిస్ సహాయం (ఇంగ్లీష్ / కన్నడ)',
      voiceFloatingBtn: 'వాయిస్ అసిస్టెంట్ తెరవండి (ఇంగ్లీష్ / కన్నడ)',
      resetDemoBtn: 'డెమో రీసెట్',
      privateWorkspaceSub: 'వ్యక్తిగత నిజమైన వ్యాపార ఖాతా',
      myRealLedgerTitle: 'నా నిజమైన వ్యాపార ఖాతా',
      menuSubBalance: `${n7}, ${n30} & ${n90} రోజుల నగదు అంచనా`,
      menuSubPending: 'కస్టమర్ల నుండి రావలసిన డబ్బు & గత అలవాటు ఆధారిత అంచనా',
      menuSubUpcoming: 'సప్లయర్, అద్దె, వడ్డీ వ్యాపారి & బిల్లుల చెల్లింపు స్థోమత',
      menuSubAdvice: 'ముందు ఎవరిని అడగాలి & ఆలస్యమైతే ఏమవుతుంది',
      menuSubCustomers: 'ప్రతి కస్టమర్ గత చెల్లింపు చరిత్ర & ఖచ్చితత్వం',
      menuSubNotices: 'పన్ను & లీగల్ నోటీసుల సులభ వివరణ',
      menuSubGuide: 'రూపివంత వాడే సులభమైన విధానం',
      priorityWord: 'ముఖ్యం',
      openWord: 'పెండింగ్',
      customerNameField: 'కస్టమర్ పేరు *',
      supplierPayeeField: 'సప్లయర్ / వడ్డీ వ్యాపారి / చెల్లించాల్సిన వారి పేరు *',
      totalAmountField: 'మొత్తం బిల్లు విలువ (₹) *',
      alreadyPaidField: 'ఇప్పటికే వచ్చిన / చెల్లించిన మొత్తం (₹)',
      invoiceNoField: 'బిల్లు నంబర్',
      phoneField: 'మొబైల్ నంబర్ (వాట్సాప్ కోసం)',
      promisedKeepNote: 'వేరుగా భద్రపరచబడుతుంది — అంచనా తేదీ దీనిని మార్చదు',
      descriptionField: 'వివరాలు / సరుకు పేరు',
      editPendingHeading: 'పెండింగ్ చెల్లింపు సవరణ',
      addPendingHeading: 'కొత్త పెండింగ్ చెల్లింపు జోడించండి (రావలసిన డబ్బు)',
      editUpcomingHeading: 'రాబోయే బిల్లు సవరణ',
      addUpcomingHeading: 'కొత్త రాబోయే బిల్లు జోడించండి (చెల్లించాల్సిన బిల్లు)',
      endingBalanceHorizon: (d: number) => `${toNativeDigits(d, lang)} రోజుల ముగింపు బ్యాలెన్స్ అంచనా`,
      receiptsInLabel: 'రాబోయే అంచనా వసూళ్లు:',
      billsOutLabel: 'చెల్లించాల్సిన బిల్లులు:',
      lowestOnDate: (dStr: string) => `కనిష్టం (${dStr}):`,
      cashDeficitBadge: 'నగదు కొరత',
      belowReserveBadge: 'భద్రతా నిధి కంటే తక్కువ',
      shortageAlertHorizon: (d: number, gap: string, dt: string) =>
        `${toNativeDigits(d, lang)}-రోజుల హెచ్చరిక: ${dt} నాడు ${gap} తక్కువ పడవచ్చు`,
      reserveDipHorizon: (d: number, gap: string, dt: string) =>
        `${toNativeDigits(d, lang)} రోజుల్లో ${dt} నాడు భద్రతా నిధి కంటే ${gap} తగ్గుతుంది`,
      billsCausingDip: 'నగదు తగ్గడానికి కారణమయ్యే బిల్లులు:',
      delayedInvoicesAffecting: 'ఆలస్యమవుతున్న కస్టమర్ బిల్లులు:',
      askAssistantExplainBtn: 'సులభంగా వివరించండి',
      explainShortBtn: 'వివరించు',
      whatsappRemindBtn: 'వాట్సాప్ రిమైండర్',
      chartTimingBasisLabel: 'చార్ట్‌లో డబ్బు వచ్చే తేదీ ఆధారం:',
      totalPendingBanner: (cnt: number) =>
        `మొత్తం రావలసిన పెండింగ్ (${toNativeDigits(cnt, lang)} బిల్లులు)`,
      totalUpcomingBanner: (cnt: number) =>
        `మొత్తం రాబోయే బిల్లులు (${toNativeDigits(cnt, lang)} బిల్లులు)`,
      earlyPromiseBadge: 'మాట ముందు · అలవాటు ఆలస్యం',
      partialPaidBadge: (amt: string) => `పాక్షికంగా వచ్చింది (${amt})`,
      billedOnPrefix: 'బిల్లు తేదీ',
      ofTotalSuffix: (tot: string) => `మొత్తం ${tot} లో`,
      noneRecordedYet: 'నమోదు కాలేదు',
      expectedRangeHeader: 'డబ్బు వచ్చే అంచనా తేదీ',
      recordSettlementTitle: 'వచ్చిన డబ్బు నమోదు చేయండి (పూర్తి / పాక్షికం)',
      amountReceivedNowLabel: 'ఇప్పుడు వచ్చిన మొత్తం (₹)',
      actualPaymentDateLabel: 'డబ్బు వచ్చిన తేదీ',
      confirmFullSettlementBtn: 'పూర్తి చెల్లింపు నిర్ధారించండి',
      recordPartialBtn: 'పాక్షిక చెల్లింపు నమోదు',
      legalNoticeDemandBadge: 'లీగల్ నోటీసు మొత్తం',
      cashAfterBillLabel: 'బిల్లు తర్వాత మిగిలే నగదు:',
      actionPrefix: 'సలహా:',
      noPendingEmpty: 'పెండింగ్ చెల్లింపులు లేవు. పైన ఉన్న బటన్ ద్వారా కొత్త బిల్లు జోడించండి.',
      noUpcomingEmpty: 'రాబోయే బిల్లులు లేవు.',
      horizonOutlookTitle: (d: number) => `${toNativeDigits(d, lang)} రోజుల నగదు అంచనా`,
      lowestCashLabel: 'కనిష్ట నగదు:',
      shortfallWord: 'కొరత',
      reserveDipWord: 'రిజర్వ్ తగ్గుదల',
      healthyWord: 'సురక్షితం',
      dueWord: 'గడువు',
      promisedWord: 'వాగ్దానం',
      expectedWord: 'అంచనా',
      allClearFollowUp: 'ఆలస్యమైన బకాయిలు లేవు — అన్ని చెల్లింపులు సకాలంలో ఉన్నాయి.',
      noUpcomingScheduled: 'రాబోయే బిల్లులు లేవు.',
      dueDateCashImpactTitle: 'బిల్లుల చెల్లింపు స్థోమత',
      projectedCashOnDueLabel: 'గడువు రోజున మిగిలే నగదు',
      delayImpactBannerTitle: 'ఆలస్యపు చెల్లింపుల వల్ల మీ నగదుపై ప్రభావం:',
      customerSummaryBanner: (cCnt: number, sCnt: number, oCnt: number, mae: string) =>
        `${toNativeDigits(cCnt, lang)} కస్టమర్ ఖాతాలు · ${toNativeDigits(sCnt, lang)} పాత బిల్లుల ఆధారంగా · ${toNativeDigits(oCnt, lang)} ఫలితాలు పరిశీలించబడ్డాయి (సగటు తేడా ±${mae} రోజులు)`,
      addPhoneBtn: '+ ఫోన్ జోడించు',
      saveBtn: 'సేవ్',
      settledCountBadge: (cnt: number, rate: string) =>
        `${toNativeDigits(cnt, lang)} పాత బిల్లులు · ${rate}% సకాలంలో`,
      newCustomerZeroBills: 'కొత్త కస్టమర్ (౦ పాత బిల్లులు)',
      totalBilledCol: 'మొత్తం బిల్లు',
      openPendingCol: 'పెండింగ్',
      avgDelayCol: 'సాధారణ ఆలస్యం',
      nextExpectedCol: 'తదుపరి అంచనా తేదీ',
      invoiceHistoryHeading: (idLoc: string) => `గత బిల్లుల చరిత్ర (${idLoc})`,
      colInvoice: 'బిల్లు నం.',
      colAmount: 'మొత్తం',
      colDueDate: 'గడువు తేదీ',
      colPromised: 'వాగ్దానం తేదీ',
      colActualPaid: 'చెల్లించిన తేదీ',
      colDelayStatus: 'స్థితి / ఆలస్యం',
      paidOnTimeStatus: 'సమయానికి వచ్చింది',
      daysLateSuffix: (d: number) => `${toNativeDigits(d, lang)} రోజులు ఆలస్యం`,
      daysOverdueSuffix: (d: number) => `${toNativeDigits(d, lang)} రోజులు దాటింది`,
      pendingStatusWord: 'పెండింగ్',
      accuracySectionTitle: 'అంచనా మరియు అసలు చెల్లింపుల పోలిక',
      accuracySectionSub: 'కస్టమర్ డబ్బు చెల్లించిన తర్వాత మన అంచనా ఎంత దగ్గరగా ఉందో ఇక్కడ చూడవచ్చు.',
      withinRangeRateLabel: 'అంచనా గడువులోపు వచ్చినవి',
      avgErrorDaysLabel: 'సగటు రోజుల తేడా',
      daysUnit: 'రోజులు',
      colPredictedRange: 'అంచనా తేదీ (పరిధి)',
      colErrorResult: 'తేడా / ఫలితం',
      accurateWithinBand: 'ఖచ్చితం (పరిధిలో వచ్చింది)',
      offByDays: (d: number) => `${toNativeDigits(d, lang)} రోజుల తేడా`,
      weeklyBalanceCheckTitle: 'వారపు నగదు నిల్వ సరిపోలిక',
    };
  }

  if (lang === 'ml') {
    return {
      voiceHeaderBtn: 'വോയ്‌സ് സഹായി (ഇംഗ്ലീഷ് / കന്നഡ)',
      voiceFloatingBtn: 'വോയ്‌സ് അസിസ്റ്റന്റ് തുറക്കുക (ഇംഗ്ലീഷ് / കന്നഡ)',
      resetDemoBtn: 'ഡെമോ പുനഃക്രമീകരിക്കുക',
      privateWorkspaceSub: 'സ്വകാര്യ യഥാർത്ഥ ബിസിനസ് കണക്ക്',
      myRealLedgerTitle: 'എന്റെ യഥാർത്ഥ ബിസിനസ് കണക്ക്',
      menuSubBalance: `${n7}, ${n30}, ${n90} ദിവസത്തെ ക്യാഷ് പ്രവചനം`,
      menuSubPending: 'ഇടപാടുകാരിൽ നിന്ന് ലഭിക്കാനുള്ള തുകയും മുൻ ശീലമനുസരിച്ചുള്ള കണക്കും',
      menuSubUpcoming: 'സപ്ലയർ, വാടക, പലിശക്കാരൻ, ബില്ലുകൾ അടയ്ക്കാനുള്ള ശേഷി',
      menuSubAdvice: 'ആരെ ആദ്യം വിളിക്കണം, വൈകിയാൽ എന്ത് സംഭവിക്കും',
      menuSubCustomers: 'ഇടപാടുകാരുടെ മുൻകാല പേയ്‌മെന്റ് ചരിത്രവും കൃത്യതയും',
      menuSubNotices: 'നികുതി, നിയമ നോട്ടീസുകളുടെ ലളിതമായ വിശദീകരണം',
      menuSubGuide: 'രൂപിവന്ത ഉപയോഗിക്കാനുള്ള എളുപ്പവഴികൾ',
      priorityWord: 'പ്രധാനം',
      openWord: 'ബാക്കിയുള്ളവ',
      customerNameField: 'ഇടപാടുകാരന്റെ പേര് *',
      supplierPayeeField: 'സപ്ലയർ / പണം നൽകേണ്ടവരുടെ പേര് *',
      totalAmountField: 'ആകെ ബിൽ തുക (₹) *',
      alreadyPaidField: 'ഇതിനകം ലഭിച്ച / നൽകിയ തുക (₹)',
      invoiceNoField: 'ബിൽ നമ്പർ',
      phoneField: 'മൊബൈൽ നമ്പർ (വാട്ട്‌സ്ആപ്പിന്)',
      promisedKeepNote: 'പ്രത്യേകം സൂക്ഷിക്കും — കണക്കാക്കിയ തീയതി ഇത് മാറ്റില്ല',
      descriptionField: 'വിവരണം / സാധനത്തിന്റെ പേര്',
      editPendingHeading: 'ലഭിക്കാനുള്ള തുക തിരുത്തുക',
      addPendingHeading: 'പുതിയ ലഭിക്കാനുള്ള തുക ചേർക്കുക',
      editUpcomingHeading: 'വരാനിരിക്കുന്ന ബിൽ തിരുത്തുക',
      addUpcomingHeading: 'പുതിയ വരാനിരിക്കുന്ന ബിൽ ചേർക്കുക',
      endingBalanceHorizon: (d: number) => `${toNativeDigits(d, lang)} ദിവസത്തെ അവസാന ബാലൻസ്`,
      receiptsInLabel: 'പ്രതീക്ഷിക്കുന്ന വരവ്:',
      billsOutLabel: 'അടയ്ക്കാനുള്ള ബില്ലുകൾ:',
      lowestOnDate: (dStr: string) => `കുറഞ്ഞത് (${dStr}):`,
      cashDeficitBadge: 'പണക്ഷാമം',
      belowReserveBadge: 'കരുതൽ തുകയേക്കാൾ കുറവ്',
      shortageAlertHorizon: (d: number, gap: string, dt: string) =>
        `${toNativeDigits(d, lang)}-ദിവസ മുന്നറിയിപ്പ്: ${dt} ന് ${gap} കുറവുണ്ടാകാം`,
      reserveDipHorizon: (d: number, gap: string, dt: string) =>
        `${toNativeDigits(d, lang)} ദിവസത്തിൽ ${dt} ന് കരുതൽ ധനം ${gap} കുറയും`,
      billsCausingDip: 'പണം കുറയാൻ കാരണമാകുന്ന ബില്ലുകൾ:',
      delayedInvoicesAffecting: 'വൈകുന്ന ഇടപാടുകാരുടെ ബില്ലുകൾ:',
      askAssistantExplainBtn: 'ലളിതമായി വിശദീകരിക്കുക',
      explainShortBtn: 'വിശദീകരിക്കുക',
      whatsappRemindBtn: 'വാട്ട്‌സ്ആപ്പ് ഓർമ്മപ്പെടുത്തൽ',
      chartTimingBasisLabel: 'ചാർട്ടിൽ പണം വരുന്ന തീയതിയുടെ അടിസ്ഥാനം:',
      totalPendingBanner: (cnt: number) =>
        `ആകെ ലഭിക്കാനുള്ള തുക (${toNativeDigits(cnt, lang)} ബില്ലുകൾ)`,
      totalUpcomingBanner: (cnt: number) =>
        `ആകെ വരാനിരിക്കുന്ന ബില്ലുകൾ (${toNativeDigits(cnt, lang)} ബില്ലുകൾ)`,
      earlyPromiseBadge: 'വാക്ക് നേരത്തെ · ശീലം താമസം',
      partialPaidBadge: (amt: string) => `ഭാഗികമായി ലഭിച്ചു (${amt})`,
      billedOnPrefix: 'ബിൽ തീയതി',
      ofTotalSuffix: (tot: string) => `ആകെ ${tot} ൽ`,
      noneRecordedYet: 'രേഖപ്പെടുത്തിയിട്ടില്ല',
      expectedRangeHeader: 'പണം ലഭിക്കാൻ സാധ്യതയുള്ള തീയതി',
      recordSettlementTitle: 'ലഭിച്ച പണം രേഖപ്പെടുത്തുക (മുഴുവൻ / ഭാഗികം)',
      amountReceivedNowLabel: 'ഇപ്പോൾ ലഭിച്ച തുക (₹)',
      actualPaymentDateLabel: 'പണം ലഭിച്ച തീയതി',
      confirmFullSettlementBtn: 'മുഴുവൻ പേയ്‌മെന്റ് സ്ഥിരീകരിക്കുക',
      recordPartialBtn: 'ഭാഗിക തുക ചേർക്കുക',
      legalNoticeDemandBadge: 'നിയമ നോട്ടീസ് തുക',
      cashAfterBillLabel: 'ബിൽ കഴിഞ്ഞുള്ള പണം:',
      actionPrefix: 'നിർദ്ദേശം:',
      noPendingEmpty: 'ലഭിക്കാനുള്ള തുകകളൊന്നുമില്ല. മുകളിലെ ബട്ടൺ അമർത്തി ചേർക്കുക.',
      noUpcomingEmpty: 'വരാനിരിക്കുന്ന ബില്ലുകളൊന്നുമില്ല.',
      horizonOutlookTitle: (d: number) => `${toNativeDigits(d, lang)} ദിവസത്തെ പണനില`,
      lowestCashLabel: 'കുറഞ്ഞ ബാലൻസ്:',
      shortfallWord: 'കുറവ്',
      reserveDipWord: 'കരുതൽ കുറവ്',
      healthyWord: 'സുരക്ഷിതം',
      dueWord: 'അവസാന തീയതി',
      promisedWord: 'വാക്ക്',
      expectedWord: 'സാധ്യത',
      allClearFollowUp: 'വൈകിയ ബില്ലുകളില്ല — എല്ലാം കൃത്യസമയത്താണ്.',
      noUpcomingScheduled: 'വരാനിരിക്കുന്ന ബില്ലുകളില്ല.',
      dueDateCashImpactTitle: 'ബില്ലുകൾ അടയ്ക്കാനുള്ള ശേഷി',
      projectedCashOnDueLabel: 'അന്നത്തെ പ്രതീക്ഷിത പണം',
      delayImpactBannerTitle: 'താമസിച്ച പേയ്‌മെന്റുകൾ നിങ്ങളുടെ പണത്തെ എങ്ങനെ ബാധിക്കുന്നു:',
      customerSummaryBanner: (cCnt: number, sCnt: number, oCnt: number, mae: string) =>
        `${toNativeDigits(cCnt, lang)} ഇടപാടുകാർ · ${toNativeDigits(sCnt, lang)} മുൻ ബില്ലുകളുടെ അടിസ്ഥാനത്തിൽ · ${toNativeDigits(oCnt, lang)} ഫലങ്ങൾ പരിശോധിച്ചു (ശരാശരി വ്യത്യാസം ±${mae} ദിവസം)`,
      addPhoneBtn: '+ ഫോൺ ചേർക്കുക',
      saveBtn: 'സേവ്',
      settledCountBadge: (cnt: number, rate: string) =>
        `${toNativeDigits(cnt, lang)} മുൻ ബില്ലുകൾ · ${rate}% കൃത്യസമയം`,
      newCustomerZeroBills: 'പുതിയ ഇടപാടുകാരൻ (൦ മുൻ ബിൽ)',
      totalBilledCol: 'ആകെ ബിൽ',
      openPendingCol: 'ബാക്കി തുക',
      avgDelayCol: 'സാധാരണ താമസം',
      nextExpectedCol: 'അടുത്ത സാധ്യതാ തീയതി',
      invoiceHistoryHeading: (idLoc: string) => `മുൻ ബിൽ ചരിത്രം (${idLoc})`,
      colInvoice: 'ബിൽ നമ്പർ',
      colAmount: 'തുക',
      colDueDate: 'അവസാന തീയതി',
      colPromised: 'വാഗ്ദാന തീയതി',
      colActualPaid: 'ലഭിച്ച തീയതി',
      colDelayStatus: 'നില / താമസം',
      paidOnTimeStatus: 'കൃത്യസമയത്ത് ലഭിച്ചു',
      daysLateSuffix: (d: number) => `${toNativeDigits(d, lang)} ദിവസം വൈകി`,
      daysOverdueSuffix: (d: number) => `${toNativeDigits(d, lang)} ദിവസം കഴിഞ്ഞു`,
      pendingStatusWord: 'ബാക്കി',
      accuracySectionTitle: 'പ്രവചനവും യഥാർത്ഥ പേയ്‌മെന്റും തമ്മിലുള്ള താരതമ്യം',
      accuracySectionSub: 'ഇടപാടുകാർ പണം നൽകുമ്പോൾ നമ്മുടെ കണക്കുകൂട്ടൽ എത്രത്തോളം ശരിയായിരുന്നുവെന്ന് ഇവിടെ കാണാം.',
      withinRangeRateLabel: 'പ്രതീക്ഷിത സമയത്തിനുള്ളിൽ ലഭിച്ചവ',
      avgErrorDaysLabel: 'ശരാശരി ദിവസ വ്യത്യാസം',
      daysUnit: 'ദിവസം',
      colPredictedRange: 'പ്രതീക്ഷിച്ച തീയതി (പരിധി)',
      colErrorResult: 'വ്യത്യാസം / ഫലം',
      accurateWithinBand: 'കൃത്യം (പരിധിക്കുള്ളിൽ ലഭിച്ചു)',
      offByDays: (d: number) => `${toNativeDigits(d, lang)} ദിവസ വ്യത്യാസം`,
      weeklyBalanceCheckTitle: 'പ്രതിവാര ബാലൻസ് ഒത്തുനോക്കൽ',
    };
  }

  return {
    voiceHeaderBtn: 'Voice (English / ಕನ್ನಡ)',
    voiceFloatingBtn: 'Open Voice Assistant (English / ಕನ್ನಡ)',
    resetDemoBtn: 'Reset Demo',
    privateWorkspaceSub: 'Private Real Business Workspace',
    myRealLedgerTitle: 'My Real Business Ledger',
    menuSubBalance: '7, 30 & 90-day cash outlook based on past payment patterns',
    menuSubPending: 'Money customers owe you with simple arrival estimates',
    menuSubUpcoming: 'Bills, rent, suppliers & lenders with cash affordability check',
    menuSubAdvice: 'Who to call first & test what happens if payments are delayed',
    menuSubCustomers: 'Each customer’s past payment habit & past estimate accuracy',
    menuSubNotices: 'Plain-language GST, tax & cheque notice guidance',
    menuSubGuide: 'Simple step-by-step guide to using RupiVanta',
    priorityWord: 'priority',
    openWord: 'open',
    customerNameField: 'Customer Name *',
    supplierPayeeField: 'Supplier / Money Lender / Payee Name *',
    totalAmountField: 'Total Bill Amount (₹) *',
    alreadyPaidField: 'Already Paid / Received (₹)',
    invoiceNoField: 'Bill / Invoice No.',
    phoneField: 'Mobile Number (for WhatsApp)',
    promisedKeepNote: 'Kept separately — our pattern estimate never overwrites their promise',
    descriptionField: 'Description / Items',
    editPendingHeading: 'Edit Pending Payment',
    addPendingHeading: 'Add Pending Payment (Money Customer Owes You)',
    editUpcomingHeading: 'Edit Upcoming Bill',
    addUpcomingHeading: 'Add Upcoming Payment (Bill or Lender to Pay)',
    endingBalanceHorizon: (d: number) => `Ending Balance (${d}-Day Outlook)`,
    receiptsInLabel: 'Expected Receipts In:',
    billsOutLabel: 'Scheduled Bills Out:',
    lowestOnDate: (dStr: string) => `Lowest (${dStr}):`,
    cashDeficitBadge: 'Cash Shortage',
    belowReserveBadge: 'Below Safe Cushion',
    shortageAlertHorizon: (d: number, gap: string, dt: string) =>
      `${d}-Day Cash Shortage Alert: Short by ${gap} on ${dt}`,
    reserveDipHorizon: (d: number, gap: string, dt: string) =>
      `${d}-Day Safety Cushion Dip: ${gap} below reserve on ${dt}`,
    billsCausingDip: 'Bills Causing Cash Dip:',
    delayedInvoicesAffecting: 'Delayed Customer Bills Affecting Cash:',
    askAssistantExplainBtn: 'Explain Simply',
    explainShortBtn: 'Explain',
    whatsappRemindBtn: 'WhatsApp Remind',
    chartTimingBasisLabel: 'When Customer Money Is Counted on Chart:',
    totalPendingBanner: (cnt: number) => `Total Pending (${cnt} bills)`,
    totalUpcomingBanner: (cnt: number) => `Total Upcoming (${cnt} bills)`,
    earlyPromiseBadge: 'Promised Early · Usually Late',
    partialPaidBadge: (amt: string) => `Part Paid (${amt})`,
    billedOnPrefix: 'Billed',
    ofTotalSuffix: (tot: string) => `of ${tot} total`,
    noneRecordedYet: 'None recorded',
    expectedRangeHeader: 'Expected Arrival Date',
    recordSettlementTitle: 'Record Payment Received (Full or Part)',
    amountReceivedNowLabel: 'Amount Received Now (₹)',
    actualPaymentDateLabel: 'Payment Date',
    confirmFullSettlementBtn: 'Confirm Full Payment',
    recordPartialBtn: 'Record Part Payment',
    legalNoticeDemandBadge: 'Legal Notice Demand',
    cashAfterBillLabel: 'Cash left after bill:',
    actionPrefix: 'Next Step:',
    noPendingEmpty: 'No pending customer payments yet. Use Add Pending Payment above or Scan Bill.',
    noUpcomingEmpty: 'No upcoming bills scheduled. Use Add Upcoming Payment above or Scan Bill.',
    horizonOutlookTitle: (d: number) => `${d}-Day Cash Outlook`,
    lowestCashLabel: 'Lowest Cash:',
    shortfallWord: 'Shortage',
    reserveDipWord: 'Below Cushion',
    healthyWord: 'Safe',
    dueWord: 'Due',
    promisedWord: 'Promised',
    expectedWord: 'Expected',
    allClearFollowUp: 'All clear — no overdue or delayed customer bills need urgent follow-up.',
    noUpcomingScheduled: 'No upcoming bills scheduled.',
    dueDateCashImpactTitle: 'Bill Due Date & Cash Impact',
    projectedCashOnDueLabel: 'Expected Cash on Due Date',
    delayImpactBannerTitle: 'How Customer Delays Affect Your Cash:',
    customerSummaryBanner: (cCnt: number, sCnt: number, oCnt: number, mae: string) =>
      `${cCnt} customer accounts · Based on ${sCnt} settled past bills · ${oCnt} payment outcomes verified (avg ±${mae}d difference)`,
    addPhoneBtn: '+ Add Phone',
    saveBtn: 'Save',
    settledCountBadge: (cnt: number, rate: string) => `${cnt} past bills · ${rate}% on time`,
    newCustomerZeroBills: 'New Customer (0 past bills)',
    totalBilledCol: 'Total Billed',
    openPendingCol: 'Open Pending',
    avgDelayCol: 'Usual Delay',
    nextExpectedCol: 'Next Expected Arrival',
    invoiceHistoryHeading: (idLoc: string) => `Past Bill & Payment History (${idLoc})`,
    colInvoice: 'Bill No.',
    colAmount: 'Amount',
    colDueDate: 'Due Date',
    colPromised: 'Promised Date',
    colActualPaid: 'Paid Date',
    colDelayStatus: 'Status / Delay',
    paidOnTimeStatus: 'Paid on time',
    daysLateSuffix: (d: number) => `${d}d late`,
    daysOverdueSuffix: (d: number) => `${d}d overdue`,
    pendingStatusWord: 'Pending',
    accuracySectionTitle: 'Past Estimate vs Actual Payment Check',
    accuracySectionSub: 'Whenever a customer pays a bill, RupiVanta checks how close our pattern estimate was.',
    withinRangeRateLabel: 'Arrived Within Expected Window',
    avgErrorDaysLabel: 'Average Day Difference',
    daysUnit: 'days',
    colPredictedRange: 'Expected Date (Window)',
    colErrorResult: 'Difference / Result',
    accurateWithinBand: 'Accurate (Within Window)',
    offByDays: (d: number) => `Off by ${d}d`,
    weeklyBalanceCheckTitle: 'Weekly Cash Balance Check',
  };
}
