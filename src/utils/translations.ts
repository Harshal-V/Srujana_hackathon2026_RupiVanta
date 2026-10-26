import { AppLanguage, PersonRole } from '../types/munimji';
import {
  LegalNotice,
  NoticeSeverity,
  NoticeStatus,
  FieldConfidence,
  AdvisorVerdict
} from '../types/notices';
import {
  CustomerProfile,
  ForecastAccuracyRecord,
  Transaction
} from '../types/cashflow';
import { TA_TRANSLATIONS } from './translations/ta';
import { TE_TRANSLATIONS } from './translations/te';
import { ML_TRANSLATIONS } from './translations/ml';
import {
  localizeBusinessLabel,
  localizeInvoiceCode,
  localizePartyName,
  localizeTxTitle,
  toNativeDigits,
} from './localization';

// ============================================================================
// 1. DETERMINISTIC INDIAN NUMBER, CURRENCY & DATE FORMATTING (6 LANGUAGES)
// ============================================================================

const MONTHS_SHORT: Record<AppLanguage, string[]> = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  kn: ['ಜನ', 'ಫೆಬ್ರ', 'ಮಾರ್ಚ್', 'ಏಪ್ರಿ', 'ಮೇ', 'ಜೂನ್', 'ಜುಲೈ', 'ಆಗ', 'ಸೆಪ್ಟೆಂ', 'ಅಕ್ಟೋ', 'ನವೆಂ', 'ಡಿಸೆಂ'],
  hi: ['जन', 'फ़र', 'मार्च', 'अप्रै', 'मई', 'जून', 'जुला', 'अग', 'सितं', 'अक्टू', 'नवं', 'दिसं'],
  ta: ['ஜன', 'பிப்', 'மார்', 'ஏப்', 'மே', 'ஜூன்', 'ஜூலை', 'ஆக', 'செப்', 'அக்', 'நவ', 'டிச'],
  te: ['జన', 'ఫిబ్ర', 'మార్చి', 'ఏప్రి', 'మే', 'జూన్', 'జూలై', 'ఆగ', 'సెప్టెం', 'అక్టో', 'నవం', 'డిసెం'],
  ml: ['ജനു', 'ഫെബ്രു', 'മാർച്ച്', 'ഏപ്രിൽ', 'മേയ്', 'ജൂൺ', 'ജൂലൈ', 'ഓഗ', 'സെപ്റ്റം', 'ഒക്ടോ', 'നവം', 'ഡിസം'],
};

const WEEKDAYS_SHORT: Record<AppLanguage, string[]> = {
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  kn: ['ಭಾನು', 'ಸೋಮ', 'ಮಂಗಳ', 'ಬುಧ', 'ಗುರು', 'ಶುಕ್ರ', 'ಶನಿ'],
  hi: ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'],
  ta: ['ஞாயிறு', 'திங்கள்', 'செவ்வாய்', 'புதன்', 'வியாழன்', 'வெள்ளி', 'சனி'],
  te: ['ఆది', 'సోమ', 'మంగళ', 'బుధ', 'గురు', 'శుక్ర', 'శని'],
  ml: ['ഞായർ', 'തിങ്കൾ', 'ചൊവ്വ', 'ബുധൻ', 'വ്യാഴം', 'വെള്ളി', 'ശനി'],
};

export function formatIndianNumber(val: number, lang: AppLanguage = 'en'): string {
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
    numberingSystem: 'latn',
  }).format(Math.round(Math.abs(val)));
  return toNativeDigits(formatted, lang);
}

export function formatRupee(
  amount: number,
  lang: AppLanguage = 'en',
  showPlus: boolean = false
): string {
  const formatted = formatIndianNumber(amount, lang);
  if (amount < 0) return `-₹${formatted}`;
  if (showPlus && amount > 0) return `+₹${formatted}`;
  return `₹${formatted}`;
}

export function formatLocalDate(dateStr: string, lang: AppLanguage = 'en'): string {
  if (!dateStr) return '—';
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return toNativeDigits(dateStr, lang);
  const [y, m, d] = parts;
  const monthName = MONTHS_SHORT[lang]?.[m - 1] || MONTHS_SHORT.en[m - 1];
  return toNativeDigits(`${d} ${monthName} ${y}`, lang);
}

export function formatShortDate(dateStr: string, lang: AppLanguage = 'en'): string {
  if (!dateStr) return '—';
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return toNativeDigits(dateStr, lang);
  const [, m, d] = parts;
  const monthName = MONTHS_SHORT[lang]?.[m - 1] || MONTHS_SHORT.en[m - 1];
  return toNativeDigits(`${d} ${monthName}`, lang);
}

const WEEKDAYS_FULL: Record<AppLanguage, string[]> = {
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  kn: ['ಭಾನುವಾರ', 'ಸೋಮವಾರ', 'ಮಂಗಳವಾರ', 'ಬುಧವಾರ', 'ಗುರುವಾರ', 'ಶುಕ್ರವಾರ', 'ಶನಿವಾರ'],
  hi: ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'],
  ta: ['ஞாயிற்றுக்கிழமை', 'திங்கட்கிழமை', 'செவ்வாய்க்கிழமை', 'புதன்கிழமை', 'வியாழக்கிழமை', 'வெள்ளிக்கிழமை', 'சனிக்கிழமை'],
  te: ['ఆదివారం', 'सोమవారం'.replace('सो', 'సో'), 'మంగళవారం', 'బుధవారం', 'గురువారం', 'శుక్రవారం', 'శనివారం'],
  ml: ['ഞായറാഴ്ച', 'തിങ്കളാഴ്ച', 'ചൊവ്വാഴ്ച', 'ബുധനാഴ്ച', 'വ്യാഴാഴ്ച', 'വെള്ളിയാഴ്ച', 'ശനിയാഴ്ച'],
};

const MONTHS_FULL_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function formatHeaderDate(dateStr: string, lang: AppLanguage = 'en'): string {
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return toNativeDigits(dateStr, lang);
  const dt = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  const dow = WEEKDAYS_FULL[lang]?.[dt.getUTCDay()] || WEEKDAYS_FULL.en[dt.getUTCDay()];
  const monthName =
    lang === 'en'
      ? MONTHS_FULL_EN[parts[1] - 1]
      : MONTHS_SHORT[lang]?.[parts[1] - 1] || MONTHS_SHORT.en[parts[1] - 1];
  return toNativeDigits(`${dow}, ${parts[2]} ${monthName} ${parts[0]}`, lang);
}

export function translateWeekdayAbbr(dayAbbr: string, lang: AppLanguage): string {
  const idx = WEEKDAYS_SHORT.en.findIndex(
    (w) => w.toLowerCase() === dayAbbr.slice(0, 3).toLowerCase()
  );
  if (idx === -1) return dayAbbr;
  return WEEKDAYS_SHORT[lang]?.[idx] || dayAbbr;
}

export function formatDaysLeftLabel(
  daysLeft: number,
  lang: AppLanguage,
  hoursLeft?: number
): string {
  let raw = '';
  if (lang === 'hi') {
    if (daysLeft > 1) raw = `${daysLeft} दिन बाकी`;
    else if (daysLeft === 1) raw = '1 दिन बाकी';
    else if (daysLeft === 0) {
      raw = hoursLeft !== undefined ? `आज आख़िरी दिन (${hoursLeft} घं. बाकी)` : 'आज आख़िरी दिन';
    } else raw = `${Math.abs(daysLeft)} दिन बीत गए`;
    return toNativeDigits(raw, lang);
  }
  if (lang === 'kn') {
    if (daysLeft > 1) raw = `${daysLeft} ದಿನ ಬಾಕಿ ಇದೆ`;
    else if (daysLeft === 1) raw = '1 ದಿನ ಬಾಕಿ ಇದೆ';
    else if (daysLeft === 0) {
      raw = hoursLeft !== undefined ? `ಇಂದೇ ಕೊನೆಯ ದಿನ (${hoursLeft} ಗಂ. ಬಾಕಿ)` : 'ಇಂದೇ ಕೊನೆಯ ದಿನ';
    } else raw = `${Math.abs(daysLeft)} ದಿನ ಮೀರಿದೆ`;
    return toNativeDigits(raw, lang);
  }
  if (lang === 'ta') {
    if (daysLeft > 1) raw = `${daysLeft} நாட்கள் உள்ளன`;
    else if (daysLeft === 1) raw = '1 நாள் உள்ளது';
    else if (daysLeft === 0) {
      raw = hoursLeft !== undefined ? `இன்றே கடைசி நாள் (${hoursLeft} மணி நேரம்)` : 'இன்றே கடைசி நாள்';
    } else raw = `${Math.abs(daysLeft)} நாட்கள் தாமதம்`;
    return toNativeDigits(raw, lang);
  }
  if (lang === 'te') {
    if (daysLeft > 1) raw = `${daysLeft} రోజులు మిగిలి ఉన్నాయి`;
    else if (daysLeft === 1) raw = '1 రోజు మిగిలి ఉంది';
    else if (daysLeft === 0) {
      raw = hoursLeft !== undefined ? `ఈరోజే చివరి రోజు (${hoursLeft} గం. మిగిలి ఉంది)` : 'ఈరోజే చివరి రోజు';
    } else raw = `${Math.abs(daysLeft)} రోజులు మించిపోయాయి`;
    return toNativeDigits(raw, lang);
  }
  if (lang === 'ml') {
    if (daysLeft > 1) raw = `${daysLeft} ദിവസങ്ങൾ ബാക്കി`;
    else if (daysLeft === 1) raw = '1 ദിവസം ബാക്കി';
    else if (daysLeft === 0) {
      raw = hoursLeft !== undefined ? `ഇന്നാണ് അവസാന ദിവസം (${hoursLeft} മ. ബാക്കി)` : 'ഇന്നാണ് അവസാന ദിവസം';
    } else raw = `${Math.abs(daysLeft)} ദിവസം കഴിഞ്ഞു`;
    return toNativeDigits(raw, lang);
  }
  if (daysLeft > 1) return `${daysLeft} days left`;
  if (daysLeft === 1) return '1 day left';
  if (daysLeft === 0) {
    return hoursLeft !== undefined ? `Due today (${hoursLeft}h left)` : 'Due today';
  }
  if (daysLeft === -1) return '1 day overdue';
  return `${Math.abs(daysLeft)} days overdue`;
}

// ============================================================================
// 2. SINGLE CENTRALIZED UI DICTIONARY (ZERO HARD-CODED ENGLISH)
// ============================================================================

export interface UITranslations {
  // Brand & Header
  appName: string;
  appFullTitle: string;
  appTagline: string;
  navHome: string;
  navNotices: string;
  navMoney: string;
  navHelp: string;
  navMore: string;
  chooseShopAria: string;
  chooseLangAria: string;
  startDemoBtn: string;
  stopDemoBtn: string;
  hearSummaryBtn: string;

  // Welcome flow
  welcomeTitle: string;
  welcomeSubtitle: string;
  tapToStart: string;
  chooseLanguagePrompt: string;
  tapMicSayLang: string;
  listeningSayLang: string;
  answerByVoiceYesLater: string;
  yesExplainButton: string;
  laterButton: string;

  // Home screen & Safety Score Gauge
  homeGreeting: string;
  safetyTitle: string;
  safetyOutOf100: string;
  safetyGood: string;
  safetyAttention: string;
  safetyUrgent: string;
  safetyFactorsLine: (openCount: number, urgentCount: number, filingsCount: number) => string;
  safetyImproveUrgent: (noticeTitle: string, dateStr: string, points: number) => string;
  safetyImproveAllGood: string;

  card1Title: string;
  explainToMeBtn: string;
  amountAskedLabel: string;
  noUrgentNoticesRightNow: string;
  card2Title: string;
  todayCashLabel: string;
  seeMoneyBtn: string;
  moneyShortfallSentence: (dateLabel: string, amt: string) => string;
  moneySafeSentence: string;
  card3Title: string;
  card3Subtitle: string;
  tapMicBtn: string;
  listeningNow: string;

  // Automatic Reminder Strip
  autoReminderTitle: string;
  remindCaWhatsAppBtn: string;
  hearReminderBtn: string;

  // Notices Decoder & Tracker
  openAndDueSummary: (openCount: number, dueWeekCount: number) => string;
  selectedNoticeBadge: string;
  whoSentIt: string;
  looksGenuine: string;
  suspiciousCheck: string;
  checkCarefully: string;
  whatTheyWant: string;
  howSerious: string;
  lastDate: string;
  receivedDateQuestion: string;
  recalculatedNote: (days: number, recDate: string, dueDate: string) => string;
  readFromNoticeBadge: string;
  estimatedConfirmBadge: string;
  guidanceDisclaimer: string;
  privacyMaskedFooter: string;
  privacyIdsMaskedCount: (count: number, types: string) => string;
  privacyNoRawIds: string;

  moreDetails: string;
  hideDetails: string;
  effectOnShopMoneyTitle: string;
  cashLinkSentence: (cost: string, dateStr: string, balance: string) => string;
  cashLinkShortfallWarn: (dateStr: string) => string;
  isNoticeGenuineTitle: string;
  dinCheckLabel: string;
  officialSenderLabel: string;
  paymentSafetyLabel: string;
  whichLawTitle: string;
  doINeedCaTitle: string;
  verdictYes: string;
  verdictMaybe: string;
  verdictNo: string;
  whatHappensIgnoreTitle: string;
  stepWord: string;
  documentsToGatherTitle: string;
  readyCountLabel: (done: number, total: number) => string;
  readyReplyTitle: string;
  mainReplyBtn: string;
  requestMoreTimeBtn: string;
  copyBtn: string;
  copiedBtn: string;
  downloadDocxBtn: string;
  statusLabel: string;
  statusNew: string;
  statusInProgress: string;
  statusReplied: string;
  statusClosed: string;

  seeAllNotices: string;
  hideAllNotices: string;
  openListBtn: string;
  closeListBtn: string;
  selectedBtn: string;
  readThisBtn: string;

  uploadOrSampleTitle: string;
  uploadSubtitle: string;
  trySampleNotice: string;
  uploadPdfPhotoTab: string;
  pasteNoticeTextTab: string;
  dropzoneTitle: string;
  dropzoneSubtitle: string;
  pastePlaceholder: string;
  explainPastedBtn: string;
  analyzingNoticeMsg: string;
  maskingIdsSubMsg: string;
  aiFallbackFriendlyMsg: string;
  orTapSampleHeading: string;
  sample1Label: string;
  sample1Sub: string;
  sample2Label: string;
  sample2Sub: string;
  sample3Label: string;
  sample3Sub: string;

  listenMunimji: string;
  sendWhatsApp: string;
  totalMoneyMayPay: string;
  moneyKeepAside: string;
  seeThisDay: string;

  // Severity plain labels
  severityUrgent: string;
  severityAttention: string;
  severityRoutine: string;

  // Money Screen & Chart
  moneySubtitle: string;
  scanBillPhotoBtn: string;
  addSaleOrBillBtn: string;
  moneyInHandToday: string;
  customersOweYou: string;
  billsNext7Days: string;
  shortfallHeading: (dateStr: string, amt: string) => string;
  safeHeading: string;
  shortfallReasonDetail: string;
  safeReasonDetail: string;
  undoBillSplitBtn: string;
  tryBillSplitBtn: string;
  askRoyalWhatsAppBtn: string;
  upcomingBillsLinkedTitle: string;
  duePrefix: string;
  markPaidBtn: string;
  markReceivedBtn: string;

  // Forecast Chart
  chartTitle: string;
  chartSubtitle: (days: number) => string;
  simulatingPrefix: string;
  days7Btn: string;
  days30Btn: string;
  days90Btn: string;
  shortfallPinLabel: (dateStr: string) => string;
  statusShortOfMoney: string;
  statusLowCash: string;
  statusSafe: string;
  chartStartLabel: string;
  chartMoneyInLabel: string;
  chartBillsOutLabel: string;
  chartEndDayLabel: string;
  legendExpectedMoney: string;

  // Voice Bar & Missing Voice Fallback
  munimjiName: string;
  munimjiSpeaking: string;
  youAskedLabel: string;
  pauseBtn: string;
  resumeBtn: string;
  repeatBtn: string;
  closeBtn: string;
  tapQuestionOrSay: string;
  micUnsupportedNote: string;
  speechUnsupportedNote: string;
  missingVoiceFallbackNote: (missingLang: string, fallbackLang: string) => string;
  typeQuestionPlaceholder: string;
  sendBtn: string;

  // Help & My People
  helpTitle: string;
  helpSubtitle: string;
  replayWelcomeBtn: string;
  chooseYourLanguageTitle: string;
  thingsYouCanSayTitle: string;
  myPeopleTitle: string;
  myPeopleSubtitle: string;
  addPersonBtn: string;
  addByVoiceBtn: string;
  personNameLabel: string;
  personNamePlaceholder: string;
  personRoleLabel: string;
  personPhoneLabel: string;
  removeBtn: string;
  voiceAddPrompt: string;
  voiceAddedConfirmed: (name: string) => string;
  autoSendToggleLabel: string;
  autoSendOnLabel: string;
  autoSendOffLabel: string;
  autoSendDisclaimer: string;
  sendToMyPeopleLabel: string;
  sayYesToConfirmPrompt: string;
  confirmSendYes: string;
  cancelBtn: string;
  whatsappReadyInstruction: string;
  openWhatsAppPressSend: string;
  copyMessageBtn: string;
  demoSentPreviewTitle: string;
  demoDeliveredNote: string;

  // More Page & Plain-Language Sub-Tools + "Details for your CA"
  morePageTitle: string;
  morePageSubtitle: string;
  changeKeepAsideBtn: string;
  detailsForCaShow: string;
  detailsForCaHide: string;
  toolReceivables: string;
  toolPayables: string;
  toolSimulator: string;
  toolIntelligence: string;
  toolAccuracy: string;
  toolReports: string;

  // Receivables & Payables
  receivablesSubtitle: string;
  filterAll: string;
  filterOverdue: string;
  filterDueSoon: string;
  filterExpected: string;
  colCustomerInvoice: string;
  colAmount: string;
  colDueDate: string;
  colStatus: string;
  colAction: string;
  daysLateSuffix: (days: number) => string;
  payablesSubtitle: string;
  lowersKeepAsideBadge: string;
  splitHalfBtn: string;

  // What-if Simulator (Plain Words)
  simTitle: string;
  simSubtitle: string;
  simCustomSlidersShow: string;
  simCustomSlidersHide: string;
  simResetBtn: string;
  simChooseQuestion: string;
  simApplyCustomBtn: string;
  simSliderDelay: string;
  simSliderSalesDrop: string;
  simSliderExtraRepair: string;
  simSliderExtraStock: string;
  simImpactTitle: string;
  simLowestMoney: string;
  simShortageDate: string;
  simKeepAsideStatus: string;
  simBelowKeepAside: string;
  simSafeProtected: string;
  simWaysToFixTitle: string;
  simWaysToFixSubtitle: string;
  simRecommendedBadge: string;
  simTryThisBtn: string;
  simActiveFixBtn: string;

  // Customer Payment History (Plain Words)
  custTitle: string;
  custSubtitle: string;
  custSearchPlaceholder: string;
  custListHeading: string;
  custReliableHigh: string;
  custReliableModerate: string;
  custReliableCaution: string;
  custUsualDelay: string;
  custPaysOnTime: string;
  custTotalSold: string;
  custTotalReceived: string;
  custExpectedArrival: string;
  custHistoryHeading: string;
  colInvoiceNo: string;
  colPaidDate: string;
  colDelay: string;
  paidOnTimeLabel: string;
  paidLateLabel: string;
  pendingLabel: string;

  // Past Forecast Check (Plain Words replacing MAPE / Fidelity / Variance / Reconciliation)
  accTitle: string;
  accSubtitle: string;
  accPlainHeadline1: (offAmount: string) => string;
  accPlainHeadline2: (cashToday: string) => string;
  accPlainHeadline3: (pct: string) => string;
  accTableHeading: string;
  colWeek: string;
  colWeGuessed: string;
  colActualBank: string;
  colDifference: string;
  colSimpleReason: string;
  accCaTechSummary: (avgErr: string, totalDiff: string) => string;

  // Shop Money Report (Plain Words replacing Safety Buffer Breach / Reconciliation)
  repTitle: string;
  repSubtitle: (shopName: string) => string;
  repExportCsvBtn: string;
  repPrintBtn: string;
  repPlainBanner: (daysCount: number, keepAsideAmt: string) => string;
  repBox1: string;
  repBox2: string;
  repBox3: string;
  repBox4: string;
  repDaysUnit: (d: number) => string;
  repTableTitle: string;
  repCaLedgerNote: (inflows: string, outflows: string, net: string) => string;

  // Modals (Date Inspection, Cash Breakdown, Settings, Add Entry, Scan Bill, WhatsApp Customer)
  modalDaySubtitle: string;
  modalDayShortfallTitle: string;
  modalDayShortfallDesc: (bal: string) => string;
  modalDayLowTitle: string;
  modalDayLowDesc: (bal: string, keepAside: string) => string;
  modalDaySafeTitle: string;
  modalDaySafeDesc: (bal: string) => string;
  modalStartMoney: string;
  modalDayChange: string;
  modalMoneyComingIn: string;
  modalBillsGoingOut: string;
  modalNoMoneyIn: string;
  modalNoBillsOut: string;
  modalAddEntryOnDay: (dateStr: string) => string;

  cashModalTitle: string;
  cashModalTotalToday: string;
  cashModalBankTitle: string;
  cashModalBankSub: string;
  cashModalDrawerTitle: string;
  cashModalDrawerSub: string;
  cashModalFreeToSpend: string;
  doneBtn: string;

  settingsTitle: string;
  settingsSubtitle: string;
  settingsKeepAsideLabel: string;
  settingsKeepAsideHelp: string;
  saveChangesBtn: string;

  addModalTitle: string;
  addMoneyInTab: string;
  addMoneyOutTab: string;
  partyNameLabel: string;
  billDescriptionLabel: string;
  saveEntryBtn: string;

  scanModalTitle: string;
  scanModalSubtitle: string;
  scanTapUpload: string;
  scanTrySampleBills: string;
  scanReadingMsg: string;

  waCustomerModalTitle: string;
  waCustomerSubtitle: string;
  messageLangLabel: string;

  // 90-Second Guided Demo Mode
  demoTitle: string;
  demoStepCounter: (current: number, total: number) => string;
  demoNextBtn: string;
  demoPrevBtn: string;
  demoStep1Title: string;
  demoStep1Caption: string;
  demoStep1Speech: string;
  demoStep2Title: string;
  demoStep2Caption: string;
  demoStep2Speech: string;
  demoStep3Title: string;
  demoStep3Caption: string;
  demoStep3Speech: string;
  demoStep4Title: string;
  demoStep4Caption: string;
  demoStep4Speech: string;
  demoStep5Title: string;
  demoStep5Caption: string;
  demoStep5Speech: string;
}

export const TRANSLATIONS: Record<AppLanguage, UITranslations> = {
  // ==========================================================================
  // ENGLISH ('en')
  // ==========================================================================
  en: {
    appName: 'RUPIVANTA',
    appFullTitle: 'RupiVanta — Cash Command Center | VANTA AI Financial Assistant',
    appTagline: 'Predictive cash-flow forecasting & VANTA AI Financial Assistant',
    navHome: 'Home',
    navNotices: 'Notices',
    navMoney: 'Money',
    navHelp: 'Help',
    navMore: 'More',
    chooseShopAria: 'Choose shop',
    chooseLangAria: 'Choose language',
    startDemoBtn: 'Start',
    stopDemoBtn: 'Stop',
    hearSummaryBtn: 'Hear summary',

    welcomeTitle: 'Namaste! I am VANTA',
    welcomeSubtitle: 'Your AI Financial Assistant. Tap below so I can manage your cash flow, overdue payments, and tasks.',
    tapToStart: 'Tap to start',
    chooseLanguagePrompt: 'Namaste! I am VANTA. Which language do you prefer?',
    tapMicSayLang: 'Or tap mic to say your language',
    listeningSayLang: 'Listening... say your language',
    answerByVoiceYesLater: 'Answer by voice ("Yes" or "Later")',
    yesExplainButton: 'Yes, explain it',
    laterButton: 'Later',

    homeGreeting: 'Namaste, Sharma ji',
    safetyTitle: "Your shop's notice safety",
    safetyOutOf100: 'out of 100',
    safetyGood: 'Good & safe',
    safetyAttention: 'Needs action soon',
    safetyUrgent: 'Act this week',
    safetyFactorsLine: (openCount, urgentCount, filingsCount) =>
      `Based on ${openCount} open notices, ${urgentCount} due within 7 days, and ${filingsCount} upcoming bills.`,
    safetyImproveUrgent: (noticeTitle, dateStr, points) =>
      `Reply to or settle "${noticeTitle}" before ${dateStr} to improve your score by +${points} points.`,
    safetyImproveAllGood:
      'All urgent notices are answered! Keep filing monthly GST on time to stay at 100.',

    card1Title: 'Your most urgent notice',
    explainToMeBtn: 'Explain it to me',
    amountAskedLabel: 'Amount asked',
    noUrgentNoticesRightNow: 'No urgent open notices right now.',
    card2Title: 'Your money this week',
    todayCashLabel: 'Today',
    seeMoneyBtn: 'See my money',
    moneyShortfallSentence: (dateLabel, amt) =>
      `You may run short of money on ${dateLabel} (by ${amt}).`,
    moneySafeSentence: 'Your money is safe for all bills this week.',
    card3Title: 'Ask VANTA',
    card3Subtitle: 'Tap the microphone and speak naturally in your language.',
    tapMicBtn: 'Tap to speak to VANTA',
    listeningNow: 'Listening... speak now',

    autoReminderTitle: 'Urgent Deadline Reminder',
    remindCaWhatsAppBtn: 'Remind my CA on WhatsApp',
    hearReminderBtn: 'Hear reminder',

    openAndDueSummary: (openCount, dueWeekCount) =>
      `${openCount} open, ${dueWeekCount} due this week`,
    selectedNoticeBadge: 'Selected notice',
    whoSentIt: 'Who sent it',
    looksGenuine: 'Looks genuine',
    suspiciousCheck: 'Suspicious — check!',
    checkCarefully: 'Check carefully',
    whatTheyWant: 'What they want',
    howSerious: 'How serious',
    lastDate: 'Last date',
    receivedDateQuestion: 'On which date did you receive this notice?',
    recalculatedNote: (days, recDate, dueDate) =>
      `Calculated as ${days} days from receipt (${recDate} + ${days} days = ${dueDate}).`,
    readFromNoticeBadge: 'Read from the notice',
    estimatedConfirmBadge: 'Estimated, please confirm',
    guidanceDisclaimer: 'Guidance only, not legal advice.',
    privacyMaskedFooter: 'Personal IDs (PAN, Aadhaar, GSTIN) are masked before analysis.',
    privacyIdsMaskedCount: (count, types) =>
      `Masked ${count} personal ID(s) (${types}) before sending to AI.`,
    privacyNoRawIds: 'Privacy checked — no raw PAN, Aadhaar, or GSTIN sent.',

    moreDetails: 'More details',
    hideDetails: 'Hide details',
    effectOnShopMoneyTitle: 'Effect on your shop money',
    cashLinkSentence: (cost, dateStr, balance) =>
      `This notice may cost ${cost} by ${dateStr}. Your projected balance on that day: ${balance}.`,
    cashLinkShortfallWarn: (dateStr) =>
      `Paying this on ${dateStr} causes a money shortage in your shop account.`,
    isNoticeGenuineTitle: 'Genuine or suspicious details',
    dinCheckLabel: 'Reference / DIN check',
    officialSenderLabel: 'Sender domain check',
    paymentSafetyLabel: 'Payment account check',
    whichLawTitle: 'Law in one plain sentence',
    doINeedCaTitle: 'Do I need a CA?',
    verdictYes: 'Yes',
    verdictMaybe: 'Maybe',
    verdictNo: 'No',
    whatHappensIgnoreTitle: 'What happens if you ignore this',
    stepWord: 'Step',
    documentsToGatherTitle: 'Documents to gather',
    readyCountLabel: (done, total) => `${done} of ${total} ready`,
    readyReplyTitle: 'Draft reply (you can edit)',
    mainReplyBtn: 'Main reply',
    requestMoreTimeBtn: 'Request more time letter',
    copyBtn: 'Copy',
    copiedBtn: 'Copied!',
    downloadDocxBtn: 'Download DOCX',
    statusLabel: 'Status',
    statusNew: 'New',
    statusInProgress: 'In progress',
    statusReplied: 'Replied',
    statusClosed: 'Closed',

    seeAllNotices: 'See all notices',
    hideAllNotices: 'Hide all notices',
    openListBtn: 'Open',
    closeListBtn: 'Close',
    selectedBtn: 'Selected',
    readThisBtn: 'Open',

    uploadOrSampleTitle: 'Upload a notice or try a sample',
    uploadSubtitle: 'Upload a photo or PDF, paste notice text, or open one of the 3 instant samples.',
    trySampleNotice: 'Try a sample notice',
    uploadPdfPhotoTab: 'Upload PDF or photo',
    pasteNoticeTextTab: 'Paste notice text',
    dropzoneTitle: 'Tap here to choose a notice photo or PDF',
    dropzoneSubtitle: 'Works with camera photos, WhatsApp images, PDFs, or text files.',
    pastePlaceholder: 'Paste the text of your GST, Income Tax, or legal notice here...',
    explainPastedBtn: 'Explain this notice',
    analyzingNoticeMsg: 'Munimji is reading your notice...',
    maskingIdsSubMsg: 'Masking PAN, Aadhaar, and GSTIN before analysis...',
    aiFallbackFriendlyMsg:
      'Live AI reading could not connect right now — opened a built-in sample notice so you can continue smoothly.',
    orTapSampleHeading: 'Three built-in sample notices (work instantly):',
    sample1Label: '(a) GST Notice (DRC-01)',
    sample1Sub: '₹18,500 · 12 days left',
    sample2Label: '(b) Income Tax 143(1)',
    sample2Sub: '₹6,400 · 25 days left',
    sample3Label: '(c) Cheque Bounce u/s 138',
    sample3Sub: '₹25,000 · 6 days left',

    listenMunimji: 'Read it aloud',
    sendWhatsApp: 'Send on WhatsApp',
    totalMoneyMayPay: 'Total money you may need to pay',
    moneyKeepAside: 'Money you must keep aside',
    seeThisDay: 'See this day',

    severityUrgent: 'Urgent — act quickly',
    severityAttention: 'Needs attention',
    severityRoutine: 'Routine — don’t worry',

    moneySubtitle: 'Simple view of your cash today, customer dues, and upcoming bills.',
    scanBillPhotoBtn: 'Scan bill photo',
    addSaleOrBillBtn: 'Add sale or bill',
    moneyInHandToday: 'Money in hand today',
    customersOweYou: 'Customers owe you',
    billsNext7Days: 'Bills in next 7 days',
    shortfallHeading: (dateStr, amt) =>
      `You may run short of money on ${dateStr} by ${amt}`,
    safeHeading: 'Good news! Your shop money stays safe above zero.',
    shortfallReasonDetail:
      'Malnad Agro’s ₹40,000 bill is due on 29 Oct, two days before Sri Balaji’s ₹20,000 arrives on 31 Oct. Plus, your ₹25,000 Cheque Bounce notice is due on 30 Oct.',
    safeReasonDetail:
      'Paying Malnad Agro in two parts keeps enough cash in your shop this week.',
    undoBillSplitBtn: 'Undo 50-50 bill split',
    tryBillSplitBtn: 'Pay Malnad half now, half later',
    askRoyalWhatsAppBtn: 'Remind Royal Kirana (₹15,000) on WhatsApp',
    upcomingBillsLinkedTitle: 'Upcoming bills and notices linked to money',
    duePrefix: 'Due',
    markPaidBtn: 'Mark paid',
    markReceivedBtn: 'Mark received',

    chartTitle: 'Day-by-day money forecast',
    chartSubtitle: (days) => `Expected shop money for the next ${days} days`,
    simulatingPrefix: 'Testing',
    days7Btn: '7 days',
    days30Btn: '30 days',
    days90Btn: '90 days',
    shortfallPinLabel: (dateStr) => `Short on ${dateStr}`,
    statusShortOfMoney: 'Short of money',
    statusLowCash: 'Below keep-aside',
    statusSafe: 'Safe',
    chartStartLabel: 'Start money',
    chartMoneyInLabel: '+ Money in',
    chartBillsOutLabel: '- Bills out',
    chartEndDayLabel: 'End of day',
    legendExpectedMoney: 'Expected money in hand',

    munimjiName: 'VANTA — AI Financial Assistant',
    munimjiSpeaking: 'VANTA is speaking',
    youAskedLabel: 'You said',
    pauseBtn: 'Pause',
    resumeBtn: 'Resume',
    repeatBtn: 'Repeat',
    closeBtn: 'Close',
    tapQuestionOrSay: 'Tap a task or say it aloud to VANTA:',
    micUnsupportedNote:
      'Microphone is not available in this browser — tap any task below or type in the box.',
    speechUnsupportedNote:
      'Voice playback is not supported in this browser — showing VANTA’s message clearly on screen.',
    missingVoiceFallbackNote: (missingLang, fallbackLang) =>
      `${missingLang} voice is not installed on this device — speaking in ${fallbackLang} while showing ${missingLang} text on screen.`,
    typeQuestionPlaceholder: 'Type a task or question for VANTA...',
    sendBtn: 'Execute',

    helpTitle: 'VANTA Help & Voice Task Guide',
    helpSubtitle: 'Tap any task below or press the microphone to speak in 6 Indian languages.',
    replayWelcomeBtn: 'Replay welcome',
    chooseYourLanguageTitle: 'Choose your language (6 supported)',
    thingsYouCanSayTitle: 'Tasks & questions you can say to VANTA (tap to execute):',
    myPeopleTitle: 'My People (WhatsApp)',
    myPeopleSubtitle: 'Send any notice summary to your CA, shop accountant, lawyer, or family.',
    addPersonBtn: 'Add person',
    addByVoiceBtn: 'Add by voice',
    personNameLabel: 'Name',
    personNamePlaceholder: 'e.g. CA Ramesh',
    personRoleLabel: 'Role',
    personPhoneLabel: 'WhatsApp number',
    removeBtn: 'Remove',
    voiceAddPrompt: 'Say name, role, and 10-digit mobile number (for example: "Raju Accountant 9845012345")',
    voiceAddedConfirmed: (name) => `${name} added to My People.`,
    autoSendToggleLabel: 'Auto-send (demo mode)',
    autoSendOnLabel: 'ON (Demo)',
    autoSendOffLabel: 'OFF (Real WhatsApp)',
    autoSendDisclaimer: 'Demo simulation. Real automatic sending needs the WhatsApp Business API.',
    sendToMyPeopleLabel: 'Send to:',
    sayYesToConfirmPrompt: 'Tap Yes or say "Yes" to confirm:',
    confirmSendYes: 'Yes, confirm',
    cancelBtn: 'Cancel',
    whatsappReadyInstruction: 'The message is ready. Please press Send in WhatsApp.',
    openWhatsAppPressSend: 'Open WhatsApp & press Send',
    copyMessageBtn: 'Copy message',
    demoSentPreviewTitle: 'WhatsApp preview (Demo mode)',
    demoDeliveredNote: 'Simulated preview for demo only.',

    morePageTitle: 'More shop ledger tools',
    morePageSubtitle: 'Customer payments, past forecast checks, what-if testing, and full money reports.',
    changeKeepAsideBtn: 'Change keep-aside money',
    detailsForCaShow: 'Details for your CA',
    detailsForCaHide: 'Hide CA details',
    toolReceivables: 'Customers who owe money',
    toolPayables: 'All bills to pay',
    toolSimulator: 'What-if simulator',
    toolIntelligence: 'Customer payment habits',
    toolAccuracy: 'Past forecast check',
    toolReports: 'Shop money report',

    receivablesSubtitle: 'Money expected from wholesale and retail buyers. Remind late buyers on WhatsApp.',
    filterAll: 'All',
    filterOverdue: 'Late',
    filterDueSoon: 'Due soon',
    filterExpected: 'Upcoming',
    colCustomerInvoice: 'Customer & bill',
    colAmount: 'Amount',
    colDueDate: 'Due date',
    colStatus: 'Status',
    colAction: 'Action',
    daysLateSuffix: (days) => `${days} days late`,
    payablesSubtitle: 'Supplier bills, shop rent, staff wages, electricity, and open notice demands.',
    lowersKeepAsideBadge: 'Causes shortage',
    splitHalfBtn: 'Pay half now',

    simTitle: 'Test "What if" changes before spending',
    simSubtitle: 'See what happens to your cash if a buyer pays late or you buy festive stock.',
    simCustomSlidersShow: 'Adjust custom sliders',
    simCustomSlidersHide: 'Hide sliders',
    simResetBtn: 'Back to normal',
    simChooseQuestion: 'Tap a situation to test:',
    simApplyCustomBtn: 'Test these numbers',
    simSliderDelay: 'Customer pays late by',
    simSliderSalesDrop: 'Sales drop by',
    simSliderExtraRepair: 'Sudden repair cost',
    simSliderExtraStock: 'Extra festive stock',
    simImpactTitle: 'What happens to your shop money:',
    simLowestMoney: 'Lowest cash point',
    simShortageDate: 'Date cash runs low',
    simKeepAsideStatus: 'Keep-aside money check',
    simBelowKeepAside: 'Goes below keep-aside money',
    simSafeProtected: 'Stays safe',
    simWaysToFixTitle: 'Simple ways to avoid running short',
    simWaysToFixSubtitle: 'Tap any option to see how it helps your cash this week.',
    simRecommendedBadge: 'Best choice',
    simTryThisBtn: 'Try this fix',
    simActiveFixBtn: 'Applied to forecast',

    custTitle: 'Customer payment habits',
    custSubtitle: 'See which buyers pay on time and who usually pays a few days late.',
    custSearchPlaceholder: 'Search customer name...',
    custListHeading: 'Your buyers',
    custReliableHigh: 'Pays on time',
    custReliableModerate: 'Sometimes late',
    custReliableCaution: 'Often late',
    custUsualDelay: 'Usual delay',
    custPaysOnTime: 'On-time bills',
    custTotalSold: 'Total billed',
    custTotalReceived: 'Money received',
    custExpectedArrival: 'Likely payment date',
    custHistoryHeading: 'Past bills and payment dates',
    colInvoiceNo: 'Bill no.',
    colPaidDate: 'Paid on',
    colDelay: 'Delay',
    paidOnTimeLabel: 'On time',
    paidLateLabel: 'Paid late',
    pendingLabel: 'Waiting',

    accTitle: 'How close were our past forecasts?',
    accSubtitle: 'Comparing what Munimji estimated each week with your real bank passbook.',
    accPlainHeadline1: (offAmount) =>
      `Our forecast was off by about ${offAmount} across the last month.`,
    accPlainHeadline2: (cashToday) =>
      `Today’s money in hand (${cashToday}) matches your bank passbook.`,
    accPlainHeadline3: (pct) =>
      `Over the last 4 weeks, our weekly cash estimate was ${pct}% close to actual cash.`,
    accTableHeading: 'Last 4 weeks: our estimate vs real bank money',
    colWeek: 'Week',
    colWeGuessed: 'Our estimate',
    colActualBank: 'Real bank money',
    colDifference: 'Difference',
    colSimpleReason: 'Why it differed',
    accCaTechSummary: (avgErr, totalDiff) =>
      `Technical summary for CA: 4-week average percentage error = ${avgErr}%, total absolute difference across 4 weekly passbook checks = ${totalDiff}.`,

    repTitle: 'Shop money report (90-day view)',
    repSubtitle: (shopName) =>
      `Simple summary of incoming money, bills due, and daily balance for ${shopName}.`,
    repExportCsvBtn: 'Download CSV',
    repPrintBtn: 'Print report',
    repPlainBanner: (daysCount, keepAsideAmt) =>
      `Your cash may go below the money you keep aside (${keepAsideAmt}) for ${daysCount} days.`,
    repBox1: 'Money in hand today',
    repBox2: 'Money coming from buyers',
    repBox3: 'Total bills & notices due',
    repBox4: 'Days below keep-aside money',
    repDaysUnit: (d) => `${d} days`,
    repTableTitle: 'Day-by-day shop money book (next 30 days)',
    repCaLedgerNote: (inflows, outflows, net) =>
      `CA ledger totals: Expected receivables = ${inflows} · Scheduled payables & notices = ${outflows} · Net cash movement = ${net}.`,

    modalDaySubtitle: 'Money coming in and bills going out on this day',
    modalDayShortfallTitle: 'You may run short of money on this day',
    modalDayShortfallDesc: (bal) =>
      `End-of-day balance drops to ${bal} because bills are due before customer money arrives.`,
    modalDayLowTitle: 'Cash goes below your keep-aside amount',
    modalDayLowDesc: (bal, keepAside) =>
      `End-of-day money (${bal}) is lower than the ${keepAside} you keep aside.`,
    modalDaySafeTitle: 'Enough cash in hand on this day',
    modalDaySafeDesc: (bal) =>
      `End-of-day money stays safe at ${bal}.`,
    modalStartMoney: 'Morning cash',
    modalDayChange: 'Day change',
    modalMoneyComingIn: 'Money coming in',
    modalBillsGoingOut: 'Bills going out',
    modalNoMoneyIn: 'No customer money expected on this day.',
    modalNoBillsOut: 'No bills due on this day.',
    modalAddEntryOnDay: (dateStr) => `Add bill or sale on ${dateStr}`,

    cashModalTitle: 'Where your money is today',
    cashModalTotalToday: 'Total money available today',
    cashModalBankTitle: 'State Bank of India (Shop Current A/c)',
    cashModalBankSub: 'A/c ending 4092 · Matches passbook',
    cashModalDrawerTitle: 'Shop cash counter drawer',
    cashModalDrawerSub: 'Counted cash in shop today',
    cashModalFreeToSpend: 'Money free to spend (after keep-aside)',
    doneBtn: 'Done',

    settingsTitle: 'Money you keep aside',
    settingsSubtitle: 'Choose how much emergency cash your shop should always keep safe.',
    settingsKeepAsideLabel: 'Money you must keep aside (₹)',
    settingsKeepAsideHelp: 'Munimji warns you early whenever your cash may dip below this amount.',
    saveChangesBtn: 'Save amount',

    addModalTitle: 'Add a customer sale or supplier bill',
    addMoneyInTab: 'Money coming in',
    addMoneyOutTab: 'Bill to pay',
    partyNameLabel: 'Customer or supplier name',
    billDescriptionLabel: 'Item or bill note',
    saveEntryBtn: 'Save to khata',

    scanModalTitle: 'Scan a bill photo',
    scanModalSubtitle: 'Take a photo of a bill or test one of the sample shop bills below.',
    scanTapUpload: 'Tap to choose a bill photo',
    scanTrySampleBills: 'Or tap a sample shop bill:',
    scanReadingMsg: 'Reading bill details...',

    waCustomerModalTitle: 'Remind customer on WhatsApp',
    waCustomerSubtitle: 'Press Send inside WhatsApp after opening.',
    messageLangLabel: 'Message language:',

    demoTitle: '90-Second Guided Tour',
    demoStepCounter: (current, total) => `Step ${current} of ${total}`,
    demoNextBtn: 'Next',
    demoPrevBtn: 'Back',
    demoStep1Title: '1. Choose your language',
    demoStep1Caption: 'Every word, date, rupee figure, and spoken guide switches instantly between English, Hindi, and Kannada.',
    demoStep1Speech: 'Namaste Sharma ji! Welcome to RupiVanta, Munimji for your shop. You can use the entire app in English, Hindi, or Kannada with one tap.',
    demoStep2Title: '2. Notice safety & urgent alert',
    demoStep2Caption: "Your shop's notice safety score is 48 out of 100 because 1 Cheque Bounce notice is due in 6 days.",
    demoStep2Speech: 'On your Home screen, your notice safety score is 48 out of 100. Your most urgent notice is a Cheque Bounce notice of 25,000 rupees with 6 days left.',
    demoStep3Title: '3. Plain-language explanation',
    demoStep3Caption: 'Shows only 4 clear facts first: Who sent it, How serious, What they want, and Last date with receipt-date recalculator.',
    demoStep3Speech: 'Here on the Notices screen, I verify whether the sender looks genuine, explain what they want in three simple lines, and recalculate your exact last date from when you received it.',
    demoStep4Title: '4. Cash-flow impact check',
    demoStep4Caption: 'Links the ₹25,000 notice to your shop khata and flags the ₹10,000 cash shortage on 29 Oct.',
    demoStep4Speech: 'Now look at your Money screen. Because Malnad Agro needs 40,000 rupees on 29 October and this notice needs 25,000 rupees on 30 October, you may run short by 10,000 rupees.',
    demoStep5Title: '5. Send summary to CA Ramesh',
    demoStep5Caption: 'One tap prepares a polite WhatsApp summary for CA Ramesh or your lawyer, asking your confirmation first.',
    demoStep5Speech: 'Finally, with one tap I prepare the complete notice summary and last date for your CA Ramesh on WhatsApp. Tap Send or try the app yourself now!',
  },

  // ==========================================================================
  // HINDI ('hi')
  // ==========================================================================
  hi: {
    appName: 'रूपिवंता',
    appFullTitle: 'रूपिवंता — आपकी दुकान के मुनीमजी',
    appTagline: 'आपकी दुकान के भरोसेमंद वित्तीय सहायक',
    navHome: 'होम',
    navNotices: 'नोटिस',
    navMoney: 'पैसा',
    navHelp: 'मदद',
    navMore: 'अन्य',
    chooseShopAria: 'दुकान चुनें',
    chooseLangAria: 'भाषा चुनें',
    startDemoBtn: 'डेमो देखें',
    stopDemoBtn: 'डेमो रोकें',
    hearSummaryBtn: 'सार सुनें',

    welcomeTitle: 'नमस्ते! मैं मुनीमजी हूँ',
    welcomeSubtitle: 'आपकी दुकान का भरोसेमंद मुनीम। नीचे दबाएं ताकि मैं आपके नोटिस और पैसों का हिसाब बोलकर समझा सकूँ।',
    tapToStart: 'शुरू करने के लिए दबाएं',
    chooseLanguagePrompt: 'नमस्ते! मैं मुनीमजी हूँ। आप कौन सी भाषा पसंद करेंगे?',
    tapMicSayLang: 'या माइक दबाकर अपनी भाषा बोलें',
    listeningSayLang: 'सुन रहा हूँ... "हिन्दी", "कन्नड़" या "English" बोलें',
    answerByVoiceYesLater: 'बोलकर जवाब दें ("हाँ" या "बाद में")',
    yesExplainButton: 'हाँ, समझाइए',
    laterButton: 'बाद में',

    homeGreeting: 'नमस्ते, शर्मा जी',
    safetyTitle: 'आपकी दुकान की नोटिस सुरक्षा',
    safetyOutOf100: '100 में से',
    safetyGood: 'सुरक्षित',
    safetyAttention: 'जल्द ध्यान दें',
    safetyUrgent: 'इस हफ़्ते कदम उठाएं',
    safetyFactorsLine: (openCount, urgentCount, filingsCount) =>
      `${openCount} खुले नोटिस, ${urgentCount} इस हफ़्ते की तारीख़ और ${filingsCount} आने वाले बिलों के आधार पर।`,
    safetyImproveUrgent: (noticeTitle, dateStr, points) =>
      `${dateStr} से पहले "${noticeTitle}" का जवाब या निपटारा करने से आपका स्कोर +${points} अंक बढ़ जाएगा।`,
    safetyImproveAllGood:
      'सभी ज़रूरी नोटिसों का जवाब दिया जा चुका है! 100 स्कोर बनाए रखने के लिए समय पर GST भरते रहें।',

    card1Title: 'आपका सबसे ज़रूरी नोटिस',
    explainToMeBtn: 'मुझे आसान शब्दों में समझाएं',
    amountAskedLabel: 'मांगी गई राशि',
    noUrgentNoticesRightNow: 'अभी कोई तुरंत ज़रूरी नोटिस नहीं है।',
    card2Title: 'इस हफ़्ते आपका पैसा',
    todayCashLabel: 'आज नकद',
    seeMoneyBtn: 'पैसे का हिसाब देखें',
    moneyShortfallSentence: (dateLabel, amt) =>
      `${dateLabel} को आपके पास ${amt} कम पड़ सकते हैं।`,
    moneySafeSentence: 'इस हफ़्ते सभी बिल भरने के लिए आपके पास पर्याप्त पैसा है।',
    card3Title: 'मुनीमजी से पूछें',
    card3Subtitle: 'माइक का बड़ा बटन दबाएं और अपनी भाषा में बेझिझक बोलें।',
    tapMicBtn: 'मुनीमजी से बोलकर पूछें',
    listeningNow: 'सुन रहा हूँ... अब बोलिए',

    autoReminderTitle: 'ज़रूरी आख़िरी तारीख़ याद दिलाना',
    remindCaWhatsAppBtn: 'CA को WhatsApp पर भेजें',
    hearReminderBtn: 'मुनीमजी से सुनें',

    openAndDueSummary: (openCount, dueWeekCount) =>
      `${openCount} खुले नोटिस, ${dueWeekCount} इस हफ़्ते देय`,
    selectedNoticeBadge: 'चुना गया नोटिस',
    whoSentIt: 'किसने भेजा है',
    looksGenuine: 'असली लगता है',
    suspiciousCheck: 'संदिग्ध — जांच करें!',
    checkCarefully: 'ध्यान से जांचें',
    whatTheyWant: 'वे क्या चाहते हैं',
    howSerious: 'कितना गंभीर है',
    lastDate: 'आख़िरी तारीख़',
    receivedDateQuestion: 'आपको यह नोटिस किस तारीख़ को मिला?',
    recalculatedNote: (days, recDate, dueDate) =>
      `नोटिस मिलने की तारीख़ से ${days} दिन जोड़कर गणना की गई (${recDate} + ${days} दिन = ${dueDate})।`,
    readFromNoticeBadge: 'नोटिस में लिखा है',
    estimatedConfirmBadge: 'अनुमानित, कृपया जांच लें',
    guidanceDisclaimer: 'केवल मार्गदर्शन के लिए, यह कानूनी सलाह नहीं है।',
    privacyMaskedFooter: 'जांच से पहले व्यक्तिगत नंबर (PAN, आधार, GSTIN) छुपा दिए जाते हैं।',
    privacyIdsMaskedCount: (count, types) =>
      `AI को भेजने से पहले ${count} पहचान नंबर (${types}) सुरक्षित रूप से छुपाए गए।`,
    privacyNoRawIds: 'सुरक्षा जांच पूरी — कोई खुला PAN, आधार या GSTIN नहीं भेजा गया।',

    moreDetails: 'पूरी जानकारी देखें',
    hideDetails: 'जानकारी छुपाएं',
    effectOnShopMoneyTitle: 'दुकान के पैसे पर असर',
    cashLinkSentence: (cost, dateStr, balance) =>
      `इस नोटिस पर ${dateStr} तक ${cost} लग सकते हैं। उस दिन आपका अनुमानित बैलेंस: ${balance}।`,
    cashLinkShortfallWarn: (dateStr) =>
      `सावधान: ${dateStr} को यह भुगतान करने से खाते में पैसे कम पड़ जाएंगे!`,
    isNoticeGenuineTitle: 'असली या नकली की पूरी जांच',
    dinCheckLabel: 'DIN / रेफ़रेंस जांच',
    officialSenderLabel: 'भेजने वाले की वेबसाइट',
    paymentSafetyLabel: 'भुगतान सुरक्षा जांच',
    whichLawTitle: 'कानून का नियम (एक आसान वाक्य में)',
    doINeedCaTitle: 'क्या मुझे CA या वकील चाहिए?',
    verdictYes: 'हाँ',
    verdictMaybe: 'शायद',
    verdictNo: 'नहीं',
    whatHappensIgnoreTitle: 'अनदेखा करने पर क्या होगा',
    stepWord: 'कदम',
    documentsToGatherTitle: 'कौन से कागज़ इकट्ठा करें',
    readyCountLabel: (done, total) => `${total} में से ${done} तैयार`,
    readyReplyTitle: 'तैयार जवाब पत्र (आप बदल सकते हैं)',
    mainReplyBtn: 'मुख्य जवाब पत्र',
    requestMoreTimeBtn: 'और समय मांगने का पत्र',
    copyBtn: 'कॉपी करें',
    copiedBtn: 'कॉपी हो गया!',
    downloadDocxBtn: 'DOCX डाउनलोड करें',
    statusLabel: 'स्थिति',
    statusNew: 'नया',
    statusInProgress: 'काम जारी',
    statusReplied: 'जवाब भेजा',
    statusClosed: 'बंद / पूरा हुआ',

    seeAllNotices: 'सभी नोटिस देखें',
    hideAllNotices: 'सूची छुपाएं',
    openListBtn: 'खोलें',
    closeListBtn: 'बंद करें',
    selectedBtn: 'चुना हुआ',
    readThisBtn: 'पढ़ें',

    uploadOrSampleTitle: 'नया नोटिस जांचें या उदाहरण देखें',
    uploadSubtitle: 'नोटिस की फोटो या PDF डालें, टेक्स्ट पेस्ट करें, या नीचे दिए 3 उदाहरण तुरंत देखें।',
    trySampleNotice: 'उदाहरण नोटिस देखें',
    uploadPdfPhotoTab: 'PDF या फोटो अपलोड करें',
    pasteNoticeTextTab: 'नोटिस का टेक्स्ट पेस्ट करें',
    dropzoneTitle: 'नोटिस की फोटो या PDF चुनने के लिए यहाँ दबाएं',
    dropzoneSubtitle: 'मोबाइल कैमरा फोटो, WhatsApp इमेज और PDF सब चलते हैं।',
    pastePlaceholder: 'अपने GST, इनकम टैक्स या कानूनी नोटिस का संदेश यहाँ पेस्ट करें...',
    explainPastedBtn: 'यह नोटिस समझाएं',
    analyzingNoticeMsg: 'मुनीमजी आपका नोटिस पढ़ रहे हैं...',
    maskingIdsSubMsg: 'PAN, आधार और GSTIN नंबर छुपाए जा रहे हैं...',
    aiFallbackFriendlyMsg:
      'अभी लाइव AI से संपर्क नहीं हो सका — इसलिए हमने तुरंत एक उदाहरण नोटिस खोल दिया है ताकि आपका काम न रुके।',
    orTapSampleHeading: 'तीन तैयार उदाहरण नोटिस (तुरंत खुलते हैं):',
    sample1Label: '(a) GST कारण बताओ नोटिस (DRC-01)',
    sample1Sub: '₹18,500 · 12 दिन बाकी',
    sample2Label: '(b) इनकम टैक्स सूचना 143(1)',
    sample2Sub: '₹6,400 · 25 दिन बाकी',
    sample3Label: '(c) चेक बाउंस नोटिस धारा 138',
    sample3Sub: '₹25,000 · 6 दिन बाकी',

    listenMunimji: 'बोलकर सुनाएं',
    sendWhatsApp: 'WhatsApp पर भेजें',
    totalMoneyMayPay: 'कुल पैसा जो देना पड़ सकता है',
    moneyKeepAside: 'पैसा जो अलग सुरक्षित रखना है',
    seeThisDay: 'यह दिन देखें',

    severityUrgent: 'बहुत ज़रूरी — तुरंत ध्यान दें',
    severityAttention: 'ध्यान देने योग्य',
    severityRoutine: 'सामान्य — चिंता न करें',

    moneySubtitle: 'आज की नकदी, ग्राहकों से आने वाला पैसा और आने वाले बिलों का सीधा हिसाब।',
    scanBillPhotoBtn: 'बिल की फोटो स्कैन करें',
    addSaleOrBillBtn: 'बिक्री या बिल जोड़ें',
    moneyInHandToday: 'आज हाथ में पैसा',
    customersOweYou: 'ग्राहकों से लेना है',
    billsNext7Days: 'अगले 7 दिन के बिल',
    shortfallHeading: (dateStr, amt) =>
      `${dateStr} को आपके पास ${amt} कम पड़ सकते हैं`,
    safeHeading: 'अच्छी ख़बर! इस हफ़्ते आपकी दुकान का पैसा सुरक्षित है।',
    shortfallReasonDetail:
      'मलनाड एग्रो का ₹40,000 का बिल 29 अक्टू को देना है, जबकि श्री बालाजी से ₹20,000 31 अक्टू को आएंगे। साथ ही ₹25,000 का चेक बाउंस नोटिस 30 अक्टू को है।',
    safeReasonDetail:
      'सप्लायर का बिल दो हिस्सों में देने से इस हफ़्ते आपके पास पर्याप्त नकदी बनी रहेगी।',
    undoBillSplitBtn: '50-50 बिल विभाजन हटाएं',
    tryBillSplitBtn: 'मलनाड को अभी आधा, आधा बाद में दें',
    askRoyalWhatsAppBtn: 'रॉयल किराना से ₹15,000 WhatsApp पर मांगें',
    upcomingBillsLinkedTitle: 'आने वाले बिल और पैसों से जुड़े नोटिस',
    duePrefix: 'तारीख़',
    markPaidBtn: 'भुगतान हो गया',
    markReceivedBtn: 'पैसा मिल गया',

    chartTitle: 'रोज़ाना पैसे का अनुमान',
    chartSubtitle: (days) => `अगले ${days} दिनों का अनुमानित बैलेंस`,
    simulatingPrefix: 'परख रहे हैं',
    days7Btn: '7 दिन',
    days30Btn: '30 दिन',
    days90Btn: '90 दिन',
    shortfallPinLabel: (dateStr) => `${dateStr} को कमी`,
    statusShortOfMoney: 'पैसे की कमी',
    statusLowCash: 'सुरक्षित राशि से कम',
    statusSafe: 'सुरक्षित',
    chartStartLabel: 'सुबह नकद',
    chartMoneyInLabel: '+ आया पैसा',
    chartBillsOutLabel: '- गए बिल',
    chartEndDayLabel: 'दिन के अंत में',
    legendExpectedMoney: 'हाथ में अनुमानित पैसा',

    munimjiName: 'मुनीमजी',
    munimjiSpeaking: 'मुनीमजी बोल रहे हैं',
    youAskedLabel: 'आपने पूछा',
    pauseBtn: 'रोकें',
    resumeBtn: 'चालू करें',
    repeatBtn: 'फिर से सुनें',
    closeBtn: 'बंद करें',
    tapQuestionOrSay: 'नीचे कोई सवाल दबाएं या माइक में बोलें:',
    micUnsupportedNote:
      'इस ब्राउज़र में माइक उपलब्ध नहीं है — कृपया नीचे दिए बटन दबाएं या लिखकर पूछें।',
    speechUnsupportedNote:
      'इस ब्राउज़र में आवाज़ उपलब्ध नहीं है — मुनीमजी की बात ऊपर बड़े अक्षरों में दिखाई गई है।',
    missingVoiceFallbackNote: (missingLang, fallbackLang) =>
      `इस फ़ोन/कंप्यूटर में ${missingLang} आवाज़ नहीं मिली — इसलिए मुनीमजी ${fallbackLang} में बोल रहे हैं और ${missingLang} में साफ़ लिख रहे हैं।`,
    typeQuestionPlaceholder: 'या यहाँ लिखकर मुनीमजी से पूछें...',
    sendBtn: 'पूछें',

    helpTitle: 'मुनीमजी मदद और आवाज़ गाइड',
    helpSubtitle: 'टाइप करने की ज़रूरत नहीं — कोई भी वाक्य दबाएं या माइक दबाकर बोलें।',
    replayWelcomeBtn: 'स्वागत फिर से देखें',
    chooseYourLanguageTitle: 'अपनी भाषा चुनें',
    thingsYouCanSayTitle: 'आप मुनीमजी से ये बातें कह सकते हैं (दबाकर आज़माएं):',
    myPeopleTitle: 'मेरे अपने लोग (WhatsApp)',
    myPeopleSubtitle: 'अपने CA, मुनीम, वकील या परिवार को एक बटन से नोटिस का सार भेजें।',
    addPersonBtn: 'नया नाम जोड़ें',
    addByVoiceBtn: 'बोलकर जोड़ें',
    personNameLabel: 'नाम',
    personNamePlaceholder: 'जैसे: CA रमेश',
    personRoleLabel: 'रिश्ता / काम',
    personPhoneLabel: 'WhatsApp नंबर',
    removeBtn: 'हटाएं',
    voiceAddPrompt: 'नाम, काम और 10 अंकों का मोबाइल नंबर बोलें (जैसे: "राजू मुनीम 9845012345")',
    voiceAddedConfirmed: (name) => `${name} को मेरे अपने लोग में जोड़ दिया गया है।`,
    autoSendToggleLabel: 'ऑटो-सेंड (डेमो मोड)',
    autoSendOnLabel: 'चालू (डेमो)',
    autoSendOffLabel: 'बंद (असली WhatsApp)',
    autoSendDisclaimer: 'डेमो सिमुलेशन। असली ऑटोमैटिक भेजने के लिए WhatsApp Business API चाहिए।',
    sendToMyPeopleLabel: 'किसे भेजें:',
    sayYesToConfirmPrompt: 'भेजने की पुष्टि के लिए "हाँ" दबाएं या बोलें:',
    confirmSendYes: 'हाँ, भेजें',
    cancelBtn: 'रद्द करें',
    whatsappReadyInstruction: 'संदेश तैयार है। कृपया WhatsApp खुलने पर Send दबाएं।',
    openWhatsAppPressSend: 'WhatsApp खोलें और Send दबाएं',
    copyMessageBtn: 'संदेश कॉपी करें',
    demoSentPreviewTitle: 'WhatsApp झलक (डेमो मोड)',
    demoDeliveredNote: 'यह केवल डेमो दिखाने के लिए सिमुलेशन है।',

    morePageTitle: 'दुकान के अन्य खाता औज़ार',
    morePageSubtitle: 'ग्राहकों की उधारी, पिछले अनुमानों की जांच, क्या-हो-अगर परख और पूरी रिपोर्ट।',
    changeKeepAsideBtn: 'अलग रखने वाली राशि बदलें',
    detailsForCaShow: 'आपके CA के लिए तकनीकी विवरण',
    detailsForCaHide: 'CA विवरण छुपाएं',
    toolReceivables: 'ग्राहक जिनसे पैसा लेना है',
    toolPayables: 'सभी देने वाले बिल',
    toolSimulator: 'क्या-हो-अगर परख (Simulator)',
    toolIntelligence: 'ग्राहकों के भुगतान की आदत',
    toolAccuracy: 'पिछले अनुमान की जांच',
    toolReports: 'दुकान की पैसों की रिपोर्ट',

    receivablesSubtitle: 'थोक और खुदरा खरीदारों से आने वाला पैसा। देर करने वालों को WhatsApp याद दिलाएं।',
    filterAll: 'सभी',
    filterOverdue: 'देरी वाले',
    filterDueSoon: 'जल्द देय',
    filterExpected: 'आने वाले',
    colCustomerInvoice: 'ग्राहक और बिल',
    colAmount: 'राशि',
    colDueDate: 'तारीख़',
    colStatus: 'स्थिति',
    colAction: 'कदम',
    daysLateSuffix: (days) => `${days} दिन देरी`,
    payablesSubtitle: 'सप्लायर के बिल, दुकान किराया, स्टाफ वेतन, बिजली और नोटिस की राशि।',
    lowersKeepAsideBadge: 'पैसे कम पड़ेंगे',
    splitHalfBtn: 'अभी आधा दें',

    simTitle: 'खर्च करने से पहले "क्या हो अगर" परखें',
    simSubtitle: 'देखें कि अगर ग्राहक देर से पैसे दे या त्योहार का माल खरीदें तो नकदी पर क्या असर होगा।',
    simCustomSlidersShow: 'कस्टम स्लाइडर खोलें',
    simCustomSlidersHide: 'स्लाइडर छुपाएं',
    simResetBtn: 'सामान्य करें',
    simChooseQuestion: 'परखने के लिए कोई स्थिति चुनें:',
    simApplyCustomBtn: 'यह हिसाब परखें',
    simSliderDelay: 'ग्राहक से देरी',
    simSliderSalesDrop: 'बिक्री में कमी',
    simSliderExtraRepair: 'अचानक मरम्मत खर्च',
    simSliderExtraStock: 'त्योहार का नया माल',
    simImpactTitle: 'आपकी दुकान के पैसे पर असर:',
    simLowestMoney: 'सबसे कम बैलेंस',
    simShortageDate: 'कमी की तारीख़',
    simKeepAsideStatus: 'सुरक्षित राशि की स्थिति',
    simBelowKeepAside: 'अलग रखी राशि से कम जाएगा',
    simSafeProtected: 'पूरी तरह सुरक्षित',
    simWaysToFixTitle: 'पैसे की कमी रोकने के आसान उपाय',
    simWaysToFixSubtitle: 'किसी भी उपाय को दबाकर देखें कि इस हफ़्ते पैसे कैसे बचेंगे।',
    simRecommendedBadge: 'सबसे अच्छा उपाय',
    simTryThisBtn: 'यह उपाय आज़माएं',
    simActiveFixBtn: 'हिसाब में लागू है',

    custTitle: 'ग्राहकों के भुगतान की आदत',
    custSubtitle: 'देखें कौन समय पर पैसे देता है और कौन कुछ दिन देर करता है।',
    custSearchPlaceholder: 'ग्राहक का नाम खोजें...',
    custListHeading: 'आपके खरीदार',
    custReliableHigh: 'समय पर भुगतान',
    custReliableModerate: 'कभी-कभी देरी',
    custReliableCaution: 'अक्सर देरी',
    custUsualDelay: 'सामान्य देरी',
    custPaysOnTime: 'समय पर बिल',
    custTotalSold: 'कुल बिक्री',
    custTotalReceived: 'मिला पैसा',
    custExpectedArrival: 'पैसा आने की संभावित तारीख़',
    custHistoryHeading: 'पुराने बिल और भुगतान की तारीख़ें',
    colInvoiceNo: 'बिल नं.',
    colPaidDate: 'भुगतान तारीख़',
    colDelay: 'देरी',
    paidOnTimeLabel: 'समय पर',
    paidLateLabel: 'देर से मिला',
    pendingLabel: 'बाकी है',

    accTitle: 'हमारे पिछले अनुमान कितने सही रहे?',
    accSubtitle: 'मुनीमजी के साप्ताहिक अनुमान और आपकी असली बैंक पासबुक की सीधी तुलना।',
    accPlainHeadline1: (offAmount) =>
      `पिछले महीने हमारा अनुमान कुल मिलाकर लगभग ${offAmount} के अंतर पर रहा।`,
    accPlainHeadline2: (cashToday) =>
      `आज आपके हाथ की नकदी (${cashToday}) आपकी बैंक पासबुक से पूरी तरह मेल खाती है।`,
    accPlainHeadline3: (pct) =>
      `पिछले 4 हफ़्तों में हमारा अनुमान असली बैंक बैलेंस के ${pct}% करीब रहा।`,
    accTableHeading: 'पिछले 4 हफ़्ते: हमारा अनुमान बनाम असली बैंक पैसा',
    colWeek: 'हफ़्ता',
    colWeGuessed: 'हमारा अनुमान',
    colActualBank: 'असली बैंक पैसा',
    colDifference: 'अंतर',
    colSimpleReason: 'आसान कारण',
    accCaTechSummary: (avgErr, totalDiff) =>
      `CA के लिए तकनीकी आंकड़े: 4-हफ़्ते औसत प्रतिशत अंतर = ${avgErr}%, कुल 4-हफ़्ते पासबुक अंतर = ${totalDiff}।`,

    repTitle: 'दुकान के पैसों की रिपोर्ट (90 दिन)',
    repSubtitle: (shopName) =>
      `${shopName} के आने वाले पैसे, देने वाले बिल और रोज़ाना बैलेंस का सीधा हिसाब।`,
    repExportCsvBtn: 'CSV डाउनलोड करें',
    repPrintBtn: 'रिपोर्ट प्रिंट करें',
    repPlainBanner: (daysCount, keepAsideAmt) =>
      `आपका नकद बैलेंस ${daysCount} दिनों तक अलग रखे सुरक्षित पैसे (${keepAsideAmt}) से नीचे जा सकता है।`,
    repBox1: 'आज हाथ में पैसा',
    repBox2: 'ग्राहकों से आने वाला पैसा',
    repBox3: 'कुल बिल और नोटिस देय',
    repBox4: 'सुरक्षित राशि से कम वाले दिन',
    repDaysUnit: (d) => `${d} दिन`,
    repTableTitle: 'रोज़ाना खाता बही (अगले 30 दिन)',
    repCaLedgerNote: (inflows, outflows, net) =>
      `CA लेजर योग: कुल प्राप्तियां = ${inflows} · कुल देय बिल व नोटिस = ${outflows} · शुद्ध अंतर = ${net}।`,

    modalDaySubtitle: 'इस दिन आने वाला पैसा और जाने वाले बिल',
    modalDayShortfallTitle: 'इस दिन पैसे कम पड़ सकते हैं',
    modalDayShortfallDesc: (bal) =>
      `दिन के अंत में बैलेंस ${bal} तक गिर सकता है क्योंकि ग्राहकों के पैसे से पहले बिल देने हैं।`,
    modalDayLowTitle: 'नकदी अलग रखी सुरक्षित राशि से कम है',
    modalDayLowDesc: (bal, keepAside) =>
      `दिन के अंत का पैसा (${bal}) आपकी ${keepAside} की सुरक्षित राशि से कम है।`,
    modalDaySafeTitle: 'इस दिन पर्याप्त पैसा उपलब्ध है',
    modalDaySafeDesc: (bal) =>
      `दिन के अंत में ${bal} का सुरक्षित बैलेंस रहेगा।`,
    modalStartMoney: 'सुबह का पैसा',
    modalDayChange: 'दिन का अंतर',
    modalMoneyComingIn: 'आने वाला पैसा',
    modalBillsGoingOut: 'जाने वाले बिल',
    modalNoMoneyIn: 'इस तारीख़ को किसी ग्राहक से पैसा आने की उम्मीद नहीं है।',
    modalNoBillsOut: 'इस तारीख़ को कोई बिल देय नहीं है।',
    modalAddEntryOnDay: (dateStr) => `${dateStr} को नया हिसाब जोड़ें`,

    cashModalTitle: 'आज आपका पैसा कहाँ-कहाँ है',
    cashModalTotalToday: 'आज कुल उपलब्ध पैसा',
    cashModalBankTitle: 'स्टेट बैंक ऑफ इंडिया (चालू खाता)',
    cashModalBankSub: 'खाता ****4092 · पासबुक से मिला हुआ',
    cashModalDrawerTitle: 'दुकान के गल्ले में नकद',
    cashModalDrawerSub: 'आज गल्ले में गिना हुआ नकद पैसा',
    cashModalFreeToSpend: 'खर्च करने योग्य खुला पैसा (सुरक्षित राशि छोड़कर)',
    doneBtn: 'ठीक है',

    settingsTitle: 'अलग सुरक्षित रखने वाला पैसा',
    settingsSubtitle: 'तय करें कि आपातकाल के लिए दुकान में हमेशा कितना पैसा अलग रहना चाहिए।',
    settingsKeepAsideLabel: 'अलग रखने वाली राशि (₹)',
    settingsKeepAsideHelp: 'जब भी आपका बैलेंस इस राशि से कम होने लगेगा, मुनीमजी पहले ही सचेत कर देंगे।',
    saveChangesBtn: 'राशि सेव करें',

    addModalTitle: 'बिक्री या बिल खाते में जोड़ें',
    addMoneyInTab: 'आने वाला पैसा',
    addMoneyOutTab: 'देने वाला बिल',
    partyNameLabel: 'ग्राहक या सप्लायर का नाम',
    billDescriptionLabel: 'सामान या बिल का विवरण',
    saveEntryBtn: 'खाते में जोड़ें',

    scanModalTitle: 'बिल की फोटो स्कैन करें',
    scanModalSubtitle: 'बिल की फोटो अपलोड करें या नीचे दिए तैयार बिल उदाहरण आज़माएं।',
    scanTapUpload: 'बिल की फोटो चुनने के लिए दबाएं',
    scanTrySampleBills: 'या कोई उदाहरण बिल चुनें:',
    scanReadingMsg: 'बिल पढ़ा जा रहा है...',

    waCustomerModalTitle: 'ग्राहक को WhatsApp पर याद दिलाएं',
    waCustomerSubtitle: 'WhatsApp खुलने के बाद Send बटन दबाएं।',
    messageLangLabel: 'संदेश की भाषा:',

    demoTitle: '90-सेकंड आसान डेमो टूर',
    demoStepCounter: (current, total) => `कदम ${current} / ${total}`,
    demoNextBtn: 'आगे',
    demoPrevBtn: 'पीछे',
    demoStep1Title: '1. अपनी भाषा चुनें',
    demoStep1Caption: 'हर शब्द, तारीख़, ₹ राशि और मुनीमजी की आवाज़ तुरंत हिन्दी, कन्नड़ या अंग्रेज़ी में बदलती है।',
    demoStep1Speech: 'नमस्ते शर्मा जी! RupiVanta में आपका स्वागत है। आप एक बटन दबाकर पूरा ऐप हिन्दी, कन्नड़ या अंग्रेज़ी में चला सकते हैं।',
    demoStep2Title: '2. नोटिस सुरक्षा स्कोर और ज़रूरी अलर्ट',
    demoStep2Caption: 'आपकी दुकान का सुरक्षा स्कोर 100 में से 48 है क्योंकि 1 चेक बाउंस नोटिस में सिर्फ़ 6 दिन बाकी हैं।',
    demoStep2Speech: 'होम स्क्रीन पर आपकी दुकान का नोटिस सुरक्षा स्कोर 100 में से 48 दिख रहा है। सबसे ज़रूरी ₹25,000 के चेक बाउंस नोटिस में 6 दिन बाकी हैं।',
    demoStep3Title: '3. आसान भाषा में नोटिस का मतलब',
    demoStep3Caption: 'पहले सिर्फ़ 4 ज़रूरी बातें दिखती हैं: किसने भेजा, कितना गंभीर, क्या चाहते हैं, और मिलने की तारीख़ से आख़िरी दिन।',
    demoStep3Speech: 'नोटिस पन्ने पर मैं तुरंत जांचता हूँ कि नोटिस असली है या नकली, आसान शब्दों में बताता हूँ कि क्या करना है, और नोटिस मिलने की तारीख़ से सही आख़िरी दिन निकालता हूँ।',
    demoStep4Title: '4. दुकान के पैसों पर असर',
    demoStep4Caption: '₹25,000 के नोटिस को आपके खाते से जोड़कर 29 अक्टू को ₹10,000 की संभावित कमी दिखाता है।',
    demoStep4Speech: 'अब पैसे के पन्ने पर देखिए। 29 अक्टूबर को मलनाड एग्रो के ₹40,000 और 30 अक्टूबर को नोटिस के ₹25,000 के कारण ₹10,000 कम पड़ सकते हैं।',
    demoStep5Title: '5. CA रमेश को WhatsApp पर भेजें',
    demoStep5Caption: 'एक बटन से CA रमेश के लिए पूरा सार तैयार होता है और आपकी मंज़ूरी पूछकर WhatsApp खोलता है।',
    demoStep5Speech: 'अंत में, एक बटन दबाकर मैं आपके CA रमेश के लिए WhatsApp संदेश तैयार कर देता हूँ। अब आप खुद ऐप चलाकर देखें!',
  },

  // ==========================================================================
  // KANNADA ('kn')
  // ==========================================================================
  kn: {
    appName: 'ರೂಪಿವಂತ',
    appFullTitle: 'ರೂಪಿವಂತ — ನಿಮ್ಮ ಅಂಗಡಿಯ ಹಣಕಾಸು ಸಹಾಯಕ',
    appTagline: 'ನಿಮ್ಮ ಅಂಗಡಿಯ ನಂಬಿಕಸ್ತ ಹಣಕಾಸು ಸಹಾಯಕ',
    navHome: 'ಮುಖಪುಟ',
    navNotices: 'ನೋಟಿಸ್',
    navMoney: 'ಹಣ',
    navHelp: 'ಸಹಾಯ',
    navMore: 'ಇನ್ನಷ್ಟು',
    chooseShopAria: 'ಅಂಗಡಿ ಆಯ್ಕೆಮಾಡಿ',
    chooseLangAria: 'ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ',
    startDemoBtn: 'ಡೆಮೊ ಪ್ರಾರಂಭಿಸಿ',
    stopDemoBtn: 'ಡೆಮೊ ನಿಲ್ಲಿಸಿ',
    hearSummaryBtn: 'ಸಾರಾಂಶ ಕೇಳಿ',

    welcomeTitle: 'ನಮಸ್ಕಾರ! ನಾನು ಮುನೀಮ್‌ಜಿ',
    welcomeSubtitle: 'ನಿಮ್ಮ ಅಂಗಡಿಯ ನಂಬಿಕಸ್ತ ಲೆಕ್ಕಿಗ. ನಿಮ್ಮ ನೋಟಿಸ್ ಮತ್ತು ಹಣದ ಲೆಕ್ಕವನ್ನು ಧ್ವನಿಯಲ್ಲಿ ಕೇಳಲು ಕೆಳಗೆ ಒತ್ತಿರಿ.',
    tapToStart: 'ಪ್ರಾರಂಭಿಸಲು ಇಲ್ಲಿ ಒತ್ತಿರಿ',
    chooseLanguagePrompt: 'ನಮಸ್ಕಾರ! ನಾನು ಮುನೀಮ್‌ಜಿ. ನಿಮಗೆ ಯಾವ ಭಾಷೆ ಇಷ್ಟ?',
    tapMicSayLang: 'ಅಥವಾ ಮೈಕ್ ಒತ್ತಿ ನಿಮ್ಮ ಭಾಷೆ ಹೇಳಿ',
    listeningSayLang: 'ಕೇಳಿಸಿಕೊಳ್ಳುತ್ತಿದ್ದೇನೆ... "ಕನ್ನಡ", "ಹಿಂದಿ" ಅಥವಾ "English" ಹೇಳಿ',
    answerByVoiceYesLater: 'ಧ್ವನಿಯಲ್ಲಿ ಉತ್ತರಿಸಿ ("ಹೌದು" ಅಥವಾ "ನಂತರ")',
    yesExplainButton: 'ಹೌದು, ವಿವರಿಸಿ',
    laterButton: 'ನಂತರ ನೋಡುವೆ',

    homeGreeting: 'ನಮಸ್ಕಾರ, ಶರ್ಮಾ ಜಿ',
    safetyTitle: 'ನಿಮ್ಮ ಅಂಗಡಿಯ ನೋಟಿಸ್ ಸುರಕ್ಷತೆ',
    safetyOutOf100: '100 ರಲ್ಲಿ',
    safetyGood: 'ಸುರಕ್ಷಿತವಾಗಿದೆ',
    safetyAttention: 'ಶೀಘ್ರ ಗಮನಿಸಿ',
    safetyUrgent: 'ಈ ವಾರವೇ ಕ್ರಮ ಕೈಗೊಳ್ಳಿ',
    safetyFactorsLine: (openCount, urgentCount, filingsCount) =>
      `${openCount} ತೆರೆದ ನೋಟಿಸ್, 7 ದಿನದೊಳಗಿನ ${urgentCount} ತುರ್ತು ನೋಟಿಸ್ ಮತ್ತು ${filingsCount} ಬಾಕಿ ಬಿಲ್ ಆಧರಿಸಿ.`,
    safetyImproveUrgent: (noticeTitle, dateStr, points) =>
      `${dateStr} ಒಳಗೆ "${noticeTitle}" ಗೆ ಉತ್ತರಿಸಿದರೆ ನಿಮ್ಮ ಸುರಕ್ಷತಾ ಅಂಕ +${points} ಹೆಚ್ಚಾಗುತ್ತದೆ.`,
    safetyImproveAllGood:
      'ಎಲ್ಲಾ ತುರ್ತು ನೋಟಿಸ್‌ಗಳಿಗೆ ಉತ್ತರಿಸಲಾಗಿದೆ! 100 ಅಂಕ ಉಳಿಸಿಕೊಳ್ಳಲು ಸಮಯಕ್ಕೆ ಸರಿಯಾಗಿ GST ಸಲ್ಲಿಸಿ.',

    card1Title: 'ನಿಮ್ಮ ಅತ್ಯಂತ ತುರ್ತು ನೋಟಿಸ್',
    explainToMeBtn: 'ನನಗೆ ಸರಳವಾಗಿ ವಿವರಿಸಿ',
    amountAskedLabel: 'ಕೇಳಲಾದ ಮೊತ್ತ',
    noUrgentNoticesRightNow: 'ಈಗ ಯಾವುದೇ ತುರ್ತು ನೋಟಿಸ್ ಬಾಕಿ ಇಲ್ಲ.',
    card2Title: 'ಈ ವಾರ ನಿಮ್ಮ ಹಣದ ಸ್ಥಿತಿ',
    todayCashLabel: 'ಇಂದು ಕೈಯಲ್ಲಿ',
    seeMoneyBtn: 'ಹಣದ ಲೆಕ್ಕ ನೋಡಿ',
    moneyShortfallSentence: (dateLabel, amt) =>
      `${dateLabel} ರಂದು ನಿಮಗೆ ${amt} ಹಣ ಕಡಿಮೆ ಬೀಳಬಹುದು.`,
    moneySafeSentence: 'ಈ ವಾರ ಎಲ್ಲಾ ಬಿಲ್ ಪಾವತಿಸಲು ನಿಮ್ಮ ಬಳಿ ಸಾಕಷ್ಟು ಹಣವಿದೆ.',
    card3Title: 'ಮುನೀಮ್‌ಜಿಯನ್ನು ಕೇಳಿ',
    card3Subtitle: 'ಮೈಕ್ ಬಟನ್ ಒತ್ತಿ ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ಸಹಜವಾಗಿ ಮಾತನಾಡಿ.',
    tapMicBtn: 'ಮುನೀಮ್‌ಜಿ ಜೊತೆ ಮಾತನಾಡಿ',
    listeningNow: 'ಕೇಳಿಸಿಕೊಳ್ಳುತ್ತಿದ್ದೇನೆ... ಮಾತನಾಡಿ',

    autoReminderTitle: 'ತುರ್ತು ಕೊನೆಯ ದಿನಾಂಕ ನೆನಪು',
    remindCaWhatsAppBtn: 'CA ಅವರಿಗೆ WhatsApp ಕಳುಹಿಸಿ',
    hearReminderBtn: 'ಮುನೀಮ್‌ಜಿಯಿಂದ ಕೇಳಿ',

    openAndDueSummary: (openCount, dueWeekCount) =>
      `${openCount} ತೆರೆದಿವೆ, ${dueWeekCount} ಈ ವಾರ ಕೊನೆಯ ದಿನ`,
    selectedNoticeBadge: 'ಆಯ್ಕೆ ಮಾಡಿದ ನೋಟಿಸ್',
    whoSentIt: 'ಯಾರು ಕಳುಹಿಸಿದ್ದಾರೆ',
    looksGenuine: 'ಅಸಲಿ ನೋಟಿಸ್ ಆಗಿದೆ',
    suspiciousCheck: 'ಸಂಶಯಾಸ್ಪದ — ಪರಿಶೀಲಿಸಿ!',
    checkCarefully: 'ಎಚ್ಚರಿಕೆಯಿಂದ ಪರಿಶೀಲಿಸಿ',
    whatTheyWant: 'ಅವರು ಏನು ಕೇಳುತ್ತಿದ್ದಾರೆ',
    howSerious: 'ಎಷ್ಟು ಗಂಭೀರವಾಗಿದೆ',
    lastDate: 'ಕೊನೆಯ ದಿನಾಂಕ',
    receivedDateQuestion: 'ಈ ನೋಟಿಸ್ ನಿಮಗೆ ಯಾವ ದಿನಾಂಕದಂದು ತಲುಪಿತು?',
    recalculatedNote: (days, recDate, dueDate) =>
      `ನೋಟಿಸ್ ತಲುಪಿದ ದಿನದಿಂದ ${days} ದಿನ ಸೇರಿಸಿ ಲೆಕ್ಕ ಹಾಕಲಾಗಿದೆ (${recDate} + ${days} ದಿನ = ${dueDate}).`,
    readFromNoticeBadge: 'ನೋಟಿಸ್‌ನಿಂದ ಓದಲಾಗಿದೆ',
    estimatedConfirmBadge: 'ಅಂದಾಜಿಸಲಾಗಿದೆ, ದಯವಿಟ್ಟು ಖಚಿತಪಡಿಸಿ',
    guidanceDisclaimer: 'ಇದು ಮಾರ್ಗದರ್ಶನ ಮಾತ್ರ, ಕಾನೂನು ಸಲಹೆಯಲ್ಲ.',
    privacyMaskedFooter: 'ಪರಿಶೀಲಿಸುವ ಮೊದಲು ವೈಯಕ್ತಿಕ ಸಂಖ್ಯೆಗಳನ್ನು (PAN, ಆಧಾರ್, GSTIN) ಮರೆಮಾಚಲಾಗುತ್ತದೆ.',
    privacyIdsMaskedCount: (count, types) =>
      `AI ಗೆ ಕಳುಹಿಸುವ ಮೊದಲು ${count} ಗುರುತಿನ ಸಂಖ್ಯೆಗಳನ್ನು (${types}) ಸುರಕ್ಷಿತವಾಗಿ ಮರೆಮಾಚಲಾಗಿದೆ.`,
    privacyNoRawIds: 'ಗೌಪ್ಯತೆ ಪರಿಶೀಲಿಸಲಾಗಿದೆ — ಯಾವುದೇ PAN, ಆಧಾರ್ ಅಥವಾ GSTIN ಕಳುಹಿಸಿಲ್ಲ.',

    moreDetails: 'ಹೆಚ್ಚಿನ ವಿವರಗಳು',
    hideDetails: 'ವಿವರ ಮುಚ್ಚಿರಿ',
    effectOnShopMoneyTitle: 'ನಿಮ್ಮ ಅಂಗಡಿಯ ಹಣದ ಮೇಲಿನ ಪರಿಣಾಮ',
    cashLinkSentence: (cost, dateStr, balance) =>
      `ಈ ನೋಟಿಸ್‌ಗೆ ${dateStr} ಒಳಗೆ ${cost} ಬೇಕಾಗಬಹುದು. ಆ ದಿನ ನಿಮ್ಮ ಅಂದಾಜು ಬ್ಯಾಲೆನ್ಸ್: ${balance}.`,
    cashLinkShortfallWarn: (dateStr) =>
      `ಎಚ್ಚರಿಕೆ: ${dateStr} ರಂದು ಇದನ್ನು ಪಾವತಿಸಿದರೆ ಹಣದ ಕೊರತೆ ಉಂಟಾಗುತ್ತದೆ!`,
    isNoticeGenuineTitle: 'ಅಸಲಿ ಅಥವಾ ನಕಲಿ ವಿವರವಾದ ಪರಿಶೀಲನೆ',
    dinCheckLabel: 'DIN / ಉಲ್ಲೇಖ ಸಂಖ್ಯೆ ಪರಿಶೀಲನೆ',
    officialSenderLabel: 'ಕಳುಹಿಸಿದವರ ವೆಬ್‌ಸೈಟ್ ಪರಿಶೀಲನೆ',
    paymentSafetyLabel: 'ಪಾವತಿ ಖಾತೆ ಸುರಕ್ಷತೆ',
    whichLawTitle: 'ಕಾನೂನು ನಿಯಮ (ಒಂದು ಸರಳ ವಾಕ್ಯದಲ್ಲಿ)',
    doINeedCaTitle: 'ನನಗೆ CA ಅಥವಾ ವಕೀಲರು ಬೇಕೇ?',
    verdictYes: 'ಹೌದು',
    verdictMaybe: 'ಬಹುಶಃ ಬೇಕು',
    verdictNo: 'ಅಗತ್ಯವಿಲ್ಲ',
    whatHappensIgnoreTitle: 'ಇದನ್ನು ನಿರ್ಲಕ್ಷಿಸಿದರೆ ಏನಾಗುತ್ತದೆ',
    stepWord: 'ಹಂತ',
    documentsToGatherTitle: 'ಸಂಗ್ರಹಿಸಬೇಕಾದ ದಾಖಲೆಗಳು',
    readyCountLabel: (done, total) => `${total} ರಲ್ಲಿ ${done} ಸಿದ್ಧವಾಗಿದೆ`,
    readyReplyTitle: 'ಸಿದ್ಧ ಉತ್ತರ ಪತ್ರ (ನೀವು ತಿದ್ದಬಹುದು)',
    mainReplyBtn: 'ಮುಖ್ಯ ಉತ್ತರ ಪತ್ರ',
    requestMoreTimeBtn: 'ಹೆಚ್ಚಿನ ಸಮಯ ಕೇಳುವ ಪತ್ರ',
    copyBtn: 'ಕಾಪಿ ಮಾಡಿ',
    copiedBtn: 'ಕಾಪಿ ಆಯಿತು!',
    downloadDocxBtn: 'DOCX ಡೌನ್‌ಲೋಡ್',
    statusLabel: 'ಸ್ಥಿತಿ',
    statusNew: 'ಹೊಸದು',
    statusInProgress: 'ಪ್ರಗತಿಯಲ್ಲಿದೆ',
    statusReplied: 'ಉತ್ತರಿಸಲಾಗಿದೆ',
    statusClosed: 'ಮುಕ್ತಾಯವಾಗಿದೆ',

    seeAllNotices: 'ಎಲ್ಲಾ ನೋಟಿಸ್ ನೋಡಿ',
    hideAllNotices: 'ಪಟ್ಟಿ ಮುಚ್ಚಿರಿ',
    openListBtn: 'ತೆರೆಯಿರಿ',
    closeListBtn: 'ಮುಚ್ಚಿರಿ',
    selectedBtn: 'ಆಯ್ಕೆಯಾಗಿದೆ',
    readThisBtn: 'ನೋಡಿ',

    uploadOrSampleTitle: 'ನೋಟಿಸ್ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ ಅಥವಾ ಮಾದರಿ ನೋಡಿ',
    uploadSubtitle: 'ನೋಟಿಸ್ ಫೋಟೋ ಅಥವಾ PDF ಹಾಕಿ, ಪಠ್ಯ ಪೇಸ್ಟ್ ಮಾಡಿ, ಅಥವಾ 3 ಮಾದರಿಗಳನ್ನು ತಕ್ಷಣ ಪರೀಕ್ಷಿಸಿ.',
    trySampleNotice: 'ಮಾದರಿ ನೋಟಿಸ್ ನೋಡಿ',
    uploadPdfPhotoTab: 'PDF ಅಥವಾ ಫೋಟೋ ಹಾಕಿ',
    pasteNoticeTextTab: 'ನೋಟಿಸ್ ಪಠ್ಯ ಪೇಸ್ಟ್ ಮಾಡಿ',
    dropzoneTitle: 'ನೋಟಿಸ್ ಫೋಟೋ ಅಥವಾ PDF ಆಯ್ಕೆ ಮಾಡಲು ಇಲ್ಲಿ ಒತ್ತಿರಿ',
    dropzoneSubtitle: 'ಕ್ಯಾಮೆರಾ ಫೋಟೋ, WhatsApp ಚಿತ್ರ ಅಥವಾ PDF ಎಲ್ಲವೂ ನಡೆಯುತ್ತದೆ.',
    pastePlaceholder: 'ನಿಮ್ಮ GST, ಆದಾಯ ತೆರಿಗೆ ಅಥವಾ ಕಾನೂನು ನೋಟಿಸ್ ಪಠ್ಯವನ್ನು ಇಲ್ಲಿ ಪೇಸ್ಟ್ ಮಾಡಿ...',
    explainPastedBtn: 'ಈ ನೋಟಿಸ್ ವಿವರಿಸಿ',
    analyzingNoticeMsg: 'ಮುನೀಮ್‌ಜಿ ನಿಮ್ಮ ನೋಟಿಸ್ ಓದುತ್ತಿದ್ದಾರೆ...',
    maskingIdsSubMsg: 'PAN, ಆಧಾರ್ ಮತ್ತು GSTIN ಸಂಖ್ಯೆಗಳನ್ನು ಮರೆಮಾಚಲಾಗುತ್ತಿದೆ...',
    aiFallbackFriendlyMsg:
      'ಈಗ ಲೈವ್ AI ಸಂಪರ್ಕ ಸಾಧ್ಯವಾಗಲಿಲ್ಲ — ಆದ್ದರಿಂದ ನಾವು ತಕ್ಷಣವೇ ಮಾದರಿ ನೋಟಿಸ್ ತೆರೆದಿದ್ದೇವೆ.',
    orTapSampleHeading: 'ಮೂರು ಸಿದ್ಧ ಮಾದರಿ ನೋಟಿಸ್‌ಗಳು (ತಕ್ಷಣ ತೆರೆಯುತ್ತವೆ):',
    sample1Label: '(a) GST ನೋಟಿಸ್ (DRC-01)',
    sample1Sub: '₹18,500 · 12 ದಿನ ಬಾಕಿ ಇದೆ',
    sample2Label: '(b) ಆದಾಯ ತೆರಿಗೆ 143(1)',
    sample2Sub: '₹6,400 · 25 ದಿನ ಬಾಕಿ ಇದೆ',
    sample3Label: '(c) ಚೆಕ್ ಬೌನ್ಸ್ ನೋಟಿಸ್ 138',
    sample3Sub: '₹25,000 · 6 ದಿನ ಬಾಕಿ ಇದೆ',

    listenMunimji: 'ಓದಿ ಹೇಳಿ',
    sendWhatsApp: 'WhatsApp ನಲ್ಲಿ ಕಳುಹಿಸಿ',
    totalMoneyMayPay: 'ನೀವು ಕಟ್ಟಬೇಕಾಗಬಹುದಾದ ಒಟ್ಟು ಹಣ',
    moneyKeepAside: 'ಬದಿಗೆ ಇಡಬೇಕಾದ ಸುರಕ್ಷತಾ ಹಣ',
    seeThisDay: 'ಈ ದಿನವನ್ನು ನೋಡಿ',

    severityUrgent: 'ತುರ್ತು — ತಕ್ಷಣ ಗಮನಿಸಿ',
    severityAttention: 'ಗಮನ ಕೊಡಬೇಕು',
    severityRoutine: 'ಸಾಮಾನ್ಯ — ಗಾಬರಿ ಬೇಡ',

    moneySubtitle: 'ಇಂದಿನ ನಗದು, ಗ್ರಾಹಕರಿಂದ ಬರಬೇಕಾದ ಹಣ ಮತ್ತು ಮುಂದಿನ ಬಿಲ್‌ಗಳ ಸರಳ ಲೆಕ್ಕ.',
    scanBillPhotoBtn: 'ಬಿಲ್ ಫೋಟೋ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ',
    addSaleOrBillBtn: 'ಮಾರಾಟ ಅಥವಾ ಬಿಲ್ ಸೇರಿಸಿ',
    moneyInHandToday: 'ಇಂದು ಕೈಯಲ್ಲಿರುವ ಹಣ',
    customersOweYou: 'ಗ್ರಾಹಕರಿಂದ ಬರಬೇಕಾದ ಹಣ',
    billsNext7Days: 'ಮುಂದಿನ 7 ದಿನಗಳ ಬಿಲ್',
    shortfallHeading: (dateStr, amt) =>
      `${dateStr} ರಂದು ನಿಮಗೆ ${amt} ಹಣ ಕಡಿಮೆ ಬೀಳಬಹುದು`,
    safeHeading: 'ಶುಭ ಸುದ್ದಿ! ಈ ವಾರ ನಿಮ್ಮ ಅಂಗಡಿಯ ಹಣ ಸುರಕ್ಷಿತವಾಗಿದೆ.',
    shortfallReasonDetail:
      'ಮಲೆನಾಡು ಆಗ್ರೋ ₹40,000 ಬಿಲ್ 29 ಅಕ್ಟೋ ರಂದು ಕೊಡಬೇಕು, ಆದರೆ ಶ್ರೀ ಬಾಲಾಜಿ ಅವರಿಂದ ₹20,000 ಬರುವುದು 31 ಅಕ್ಟೋ ರಂದು. ಜೊತೆಗೆ ₹25,000 ಚೆಕ್ ಬೌನ್ಸ್ ನೋಟಿಸ್ 30 ಅಕ್ಟೋ ರಂದಿದೆ.',
    safeReasonDetail:
      'ಸರಬರಾಜುದಾರರ ಬಿಲ್ ಅನ್ನು ಎರಡು ಭಾಗವಾಗಿ ಕೊಡುವುದರಿಂದ ಈ ವಾರ ಸಾಕಷ್ಟು ಹಣ ಉಳಿಯುತ್ತದೆ.',
    undoBillSplitBtn: '50-50 ಬಿಲ್ ವಿಭಜನೆ ರದ್ದುಮಾಡಿ',
    tryBillSplitBtn: 'ಮಲೆನಾಡು ಆಗ್ರೋಗೆ ಈಗ ಅರ್ಧ, ನಂತರ ಅರ್ಧ ಕೊಡಿ',
    askRoyalWhatsAppBtn: 'ರಾಯಲ್ ಕಿರಾಣಿಗೆ ₹15,000 ಗಾಗಿ WhatsApp ಕಳುಹಿಸಿ',
    upcomingBillsLinkedTitle: 'ಮುಂದಿನ ಬಿಲ್‌ಗಳು ಮತ್ತು ಹಣಕ್ಕೆ ಸಂಬಂಧಿಸಿದ ನೋಟಿಸ್‌ಗಳು',
    duePrefix: 'ದಿನಾಂಕ',
    markPaidBtn: 'ಪಾವತಿಸಲಾಗಿದೆ',
    markReceivedBtn: 'ಹಣ ಬಂದಿದೆ',

    chartTitle: 'ದಿನವಹಿ ಹಣದ ಅಂದಾಜು',
    chartSubtitle: (days) => `ಮುಂದಿನ ${days} ದಿನಗಳ ಅಂದಾಜು ಹಣ`,
    simulatingPrefix: 'ಪರೀಕ್ಷಿಸಲಾಗುತ್ತಿದೆ',
    days7Btn: '7 ದಿನ',
    days30Btn: '30 ದಿನ',
    days90Btn: '90 ದಿನ',
    shortfallPinLabel: (dateStr) => `${dateStr} ಕೊರತೆ`,
    statusShortOfMoney: 'ಹಣದ ಕೊರತೆ',
    statusLowCash: 'ಸುರಕ್ಷತಾ ಹಣಕ್ಕಿಂತ ಕಡಿಮೆ',
    statusSafe: 'ಸುರಕ್ಷಿತ',
    chartStartLabel: 'ಬೆಳಗಿನ ಹಣ',
    chartMoneyInLabel: '+ ಬಂದ ಹಣ',
    chartBillsOutLabel: '- ಹೋದ ಬಿಲ್',
    chartEndDayLabel: 'ದಿನದ ಅಂತ್ಯಕ್ಕೆ',
    legendExpectedMoney: 'ಕೈಯಲ್ಲಿರಬಹುದಾದ ಅಂದಾಜು ಹಣ',

    munimjiName: 'ಮುನೀಮ್‌ಜಿ',
    munimjiSpeaking: 'ಮುನೀಮ್‌ಜಿ ಮಾತನಾಡುತ್ತಿದ್ದಾರೆ',
    youAskedLabel: 'ನೀವು ಕೇಳಿದ್ದು',
    pauseBtn: 'ನಿಲ್ಲಿಸಿ',
    resumeBtn: 'ಮುಂದುವರಿಸಿ',
    repeatBtn: 'ಮತ್ತೆ ಹೇಳಿ',
    closeBtn: 'ಮುಚ್ಚಿರಿ',
    tapQuestionOrSay: 'ಕೆಳಗಿನ ಪ್ರಶ್ನೆ ಒತ್ತಿರಿ ಅಥವಾ ಮೈಕ್‌ನಲ್ಲಿ ಹೇಳಿ:',
    micUnsupportedNote:
      'ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಮೈಕ್ ಲಭ್ಯವಿಲ್ಲ — ದಯವಿಟ್ಟು ಕೆಳಗಿನ ಪ್ರಶ್ನೆ ಒತ್ತಿರಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ.',
    speechUnsupportedNote:
      'ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಧ್ವನಿ ಲಭ್ಯವಿಲ್ಲ — ಮುನೀಮ್‌ಜಿ ಸಂದೇಶವನ್ನು ಮೇಲೆ ದೊಡ್ಡ ಅಕ್ಷರಗಳಲ್ಲಿ ತೋರಿಸಲಾಗಿದೆ.',
    missingVoiceFallbackNote: (missingLang, fallbackLang) =>
      `ಈ ಸಾಧನದಲ್ಲಿ ${missingLang} ಧ್ವನಿ ಇಲ್ಲ — ಆದ್ದರಿಂದ ಮುನೀಮ್‌ಜಿ ${fallbackLang} ಭಾಷೆಯಲ್ಲಿ ಮಾತನಾಡುತ್ತಾ ಮೇಲೆ ${missingLang} ಅಕ್ಷರಗಳನ್ನು ತೋರಿಸುತ್ತಿದ್ದಾರೆ.`,
    typeQuestionPlaceholder: 'ಅಥವಾ ಇಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ ಕೇಳಿ...',
    sendBtn: 'ಕೇಳಿ',

    helpTitle: 'ಮುನೀಮ್‌ಜಿ ಸಹಾಯ ಮತ್ತು ಧ್ವನಿ ಮಾರ್ಗದರ್ಶಿ',
    helpSubtitle: 'ಟೈಪ್ ಮಾಡುವ ಅಗತ್ಯವಿಲ್ಲ — ಯಾವುದೇ ವಾಕ್ಯ ಒತ್ತಿರಿ ಅಥವಾ ಮೈಕ್ ಒತ್ತಿ ಮಾತನಾಡಿ.',
    replayWelcomeBtn: 'ಸ್ವಾಗತ ಮತ್ತೆ ನೋಡಿ',
    chooseYourLanguageTitle: 'ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    thingsYouCanSayTitle: 'ಮುನೀಮ್‌ಜಿಗೆ ನೀವು ಹೇಳಬಹುದಾದ ಮಾತುಗಳು (ಒತ್ತಿ ನೋಡಿ):',
    myPeopleTitle: 'ನನ್ನವರು (WhatsApp)',
    myPeopleSubtitle: 'ನಿಮ್ಮ CA, ಅಕೌಂಟೆಂಟ್, ವಕೀಲರು ಅಥವಾ ಕುಟುಂಬಕ್ಕೆ ನೋಟಿಸ್ ಸಾರಾಂಶ ಕಳುಹಿಸಿ.',
    addPersonBtn: 'ಹೊಸ ಹೆಸರು ಸೇರಿಸಿ',
    addByVoiceBtn: 'ಧ್ವನಿ ಮೂಲಕ ಸೇರಿಸಿ',
    personNameLabel: 'ಹೆಸರು',
    personNamePlaceholder: 'ಉದಾ: CA ರಮೇಶ್',
    personRoleLabel: 'ಪಾತ್ರ / ಕೆಲಸ',
    personPhoneLabel: 'WhatsApp ಸಂಖ್ಯೆ',
    removeBtn: 'ತೆಗೆದುಹಾಕಿ',
    voiceAddPrompt: 'ಹೆಸರು, ಕೆಲಸ ಮತ್ತು 10 ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಹೇಳಿ (ಉದಾ: "ರಾಜು ಅಕೌಂಟೆಂಟ್ 9845012345")',
    voiceAddedConfirmed: (name) => `${name} ಅವರನ್ನು ನನ್ನವರು ಪಟ್ಟಿಗೆ ಸೇರಿಸಲಾಗಿದೆ.`,
    autoSendToggleLabel: 'ಆಟೋ-ಸೆಂಡ್ (ಡೆಮೊ ಮೋಡ್)',
    autoSendOnLabel: 'ಆನ್ (ಡೆಮೊ)',
    autoSendOffLabel: 'ಆಫ್ (ನಿಜವಾದ WhatsApp)',
    autoSendDisclaimer: 'ಇದು ಡೆಮೊ ಸಿಮ್ಯುಲೇಶನ್. ನಿಜವಾದ ಸ್ವಯಂಚಾಲಿತ ಸಂದೇಶಕ್ಕೆ WhatsApp Business API ಬೇಕು.',
    sendToMyPeopleLabel: 'ಯಾರಿಗೆ ಕಳುಹಿಸಬೇಕು:',
    sayYesToConfirmPrompt: 'ಖಚಿತಪಡಿಸಲು "ಹೌದು" ಒತ್ತಿರಿ ಅಥವಾ ಹೇಳಿ:',
    confirmSendYes: 'ಹೌದು, ಕಳುಹಿಸಿ',
    cancelBtn: 'ರದ್ದುಮಾಡಿ',
    whatsappReadyInstruction: 'ಸಂದೇಶ ಸಿದ್ಧವಾಗಿದೆ. ದಯವಿಟ್ಟು WhatsApp ನಲ್ಲಿ Send ಒತ್ತಿರಿ.',
    openWhatsAppPressSend: 'WhatsApp ತೆರೆದು Send ಒತ್ತಿರಿ',
    copyMessageBtn: 'ಸಂದೇಶ ಕಾಪಿ ಮಾಡಿ',
    demoSentPreviewTitle: 'WhatsApp ಮುನ್ನೋಟ (ಡೆಮೊ ಮೋಡ್)',
    demoDeliveredNote: 'ಇದು ಡೆಮೊಗಾಗಿ ಮಾತ್ರ ತೋರಿಸಿದ ಸಿಮ್ಯುಲೇಶನ್.',

    morePageTitle: 'ಅಂಗಡಿಯ ಇತರ ಖಾತಾ ಸಾಧನಗಳು',
    morePageSubtitle: 'ಗ್ರಾಹಕರ ಬಾಕಿ, ಹಿಂದಿನ ಅಂದಾಜು ಪರಿಶೀಲನೆ, ವಾಟ್-ಇಫ್ ಪರೀಕ್ಷೆ ಮತ್ತು ಹಣದ ವರದಿ.',
    changeKeepAsideBtn: 'ಬದಿಗೆ ಇಡುವ ಹಣ ಬದಲಿಸಿ',
    detailsForCaShow: 'ನಿಮ್ಮ CA ಗಾಗಿ ತಾಂತ್ರಿಕ ವಿವರಗಳು',
    detailsForCaHide: 'CA ವಿವರ ಮುಚ್ಚಿರಿ',
    toolReceivables: 'ಹಣ ಕೊಡಬೇಕಾದ ಗ್ರಾಹಕರು',
    toolPayables: 'ಪಾವತಿಸಬೇಕಾದ ಎಲ್ಲಾ ಬಿಲ್‌ಗಳು',
    toolSimulator: 'ಏನಾಗುತ್ತದೆ ಎಂದು ಪರೀಕ್ಷಿಸಿ (Simulator)',
    toolIntelligence: 'ಗ್ರಾಹಕರ ಪಾವತಿ ಅಭ್ಯಾಸ',
    toolAccuracy: 'ಹಿಂದಿನ ಅಂದಾಜು ಪರಿಶೀಲನೆ',
    toolReports: 'ಅಂಗಡಿ ಹಣದ ವರದಿ',

    receivablesSubtitle: 'ಸಗಟು ಮತ್ತು ಚಿಲ್ಲರೆ ಖರೀದಿದಾರರಿಂದ ಬರಬೇಕಾದ ಹಣ. ತಡವಾದವರಿಗೆ WhatsApp ಕಳುಹಿಸಿ.',
    filterAll: 'ಎಲ್ಲಾ',
    filterOverdue: 'ತಡವಾದವು',
    filterDueSoon: 'ಶೀಘ್ರ ಬಾಕಿ',
    filterExpected: 'ಬರಲಿರುವವು',
    colCustomerInvoice: 'ಗ್ರಾಹಕ ಮತ್ತು ಬಿಲ್',
    colAmount: 'ಮೊತ್ತ',
    colDueDate: 'ದಿನಾಂಕ',
    colStatus: 'ಸ್ಥಿತಿ',
    colAction: 'ಕ್ರಮ',
    daysLateSuffix: (days) => `${days} ದಿನ ತಡ`,
    payablesSubtitle: 'ಸರಬರಾಜುದಾರರ ಬಿಲ್, ಅಂಗಡಿ ಬಾಡಿಗೆ, ಸಂಬಳ, ವಿದ್ಯುತ್ ಮತ್ತು ನೋಟಿಸ್ ಮೊತ್ತ.',
    lowersKeepAsideBadge: 'ಹಣ ಕಡಿಮೆಯಾಗುತ್ತದೆ',
    splitHalfBtn: 'ಈಗ ಅರ್ಧ ಕೊಡಿ',

    simTitle: 'ಖರ್ಚು ಮಾಡುವ ಮುನ್ನ "ಏನಾಗುತ್ತದೆ" ಎಂದು ಪರೀಕ್ಷಿಸಿ',
    simSubtitle: 'ಗ್ರಾಹಕರು ತಡವಾಗಿ ಹಣ ಕೊಟ್ಟರೆ ಅಥವಾ ಹಬ್ಬದ ಸರಕು ಖರೀದಿಸಿದರೆ ಏನಾಗುತ್ತದೆ ನೋಡಿ.',
    simCustomSlidersShow: 'ಸ್ಲೈಡರ್ ತೆರೆಯಿರಿ',
    simCustomSlidersHide: 'ಸ್ಲೈಡರ್ ಮುಚ್ಚಿರಿ',
    simResetBtn: 'ಮೊದಲಿನಂತೆ ಮಾಡಿ',
    simChooseQuestion: 'ಪರೀಕ್ಷಿಸಲು ಒಂದು ಸನ್ನಿವೇಶ ಒತ್ತಿರಿ:',
    simApplyCustomBtn: 'ಈ ಸಂಖ್ಯೆಗಳನ್ನು ಪರೀಕ್ಷಿಸಿ',
    simSliderDelay: 'ಗ್ರಾಹಕರ ತಡ ದಿನಗಳು',
    simSliderSalesDrop: 'ಮಾರಾಟ ಇಳಿಕೆ',
    simSliderExtraRepair: 'ದಿಢೀರ್ ರಿಪೇರಿ ಖರ್ಚು',
    simSliderExtraStock: 'ಹೆಚ್ಚುವರಿ ಹಬ್ಬದ ಸರಕು',
    simImpactTitle: 'ನಿಮ್ಮ ಅಂಗಡಿಯ ಹಣದ ಮೇಲಾಗುವ ಪರಿಣಾಮ:',
    simLowestMoney: 'ಕನಿಷ್ಠ ನಗದು ಹಂತ',
    simShortageDate: 'ಹಣ ಕಡಿಮೆಯಾಗುವ ದಿನಾಂಕ',
    simKeepAsideStatus: 'ಸುರಕ್ಷತಾ ಹಣದ ಸ್ಥಿತಿ',
    simBelowKeepAside: 'ಬದಿಗೆ ಇಟ್ಟ ಹಣಕ್ಕಿಂತ ಕಡಿಮೆಯಾಗುತ್ತದೆ',
    simSafeProtected: 'ಸುರಕ್ಷಿತವಾಗಿದೆ',
    simWaysToFixTitle: 'ಹಣದ ಕೊರತೆ ತಪ್ಪಿಸಲು ಸರಳ ದಾರಿಗಳು',
    simWaysToFixSubtitle: 'ಯಾವುದೇ ಉಪಾಯ ಒತ್ತಿ ಈ ವಾರ ಹಣ ಹೇಗೆ ಉಳಿಯುತ್ತದೆ ನೋಡಿ.',
    simRecommendedBadge: 'ಉತ್ತಮ ಆಯ್ಕೆ',
    simTryThisBtn: 'ಈ ಉಪಾಯ ಪರೀಕ್ಷಿಸಿ',
    simActiveFixBtn: 'ಲೆಕ್ಕದಲ್ಲಿ ಅನ್ವಯಿಸಲಾಗಿದೆ',

    custTitle: 'ಗ್ರಾಹಕರ ಪಾವತಿ ಅಭ್ಯಾಸ',
    custSubtitle: 'ಯಾರು ಸಮಯಕ್ಕೆ ಸರಿಯಾಗಿ ಹಣ ಕೊಡುತ್ತಾರೆ ಮತ್ತು ಯಾರು ತಡ ಮಾಡುತ್ತಾರೆ ನೋಡಿ.',
    custSearchPlaceholder: 'ಗ್ರಾಹಕರ ಹೆಸರು ಹುಡುಕಿ...',
    custListHeading: 'ನಿಮ್ಮ ಖರೀದಿದಾರರು',
    custReliableHigh: 'ಸಮಯಕ್ಕೆ ಪಾವತಿ',
    custReliableModerate: 'ಕೆಲವೊಮ್ಮೆ ತಡ',
    custReliableCaution: 'ಪದೇ ಪದೇ ತಡ',
    custUsualDelay: 'ಸಾಮಾನ್ಯ ವಿಳಂಬ',
    custPaysOnTime: 'ಸಮಯಕ್ಕೆ ಕೊಟ್ಟ ಬಿಲ್',
    custTotalSold: 'ಒಟ್ಟು ಮಾರಾಟ',
    custTotalReceived: 'ಬಂದ ಹಣ',
    custExpectedArrival: 'ಹಣ ಬರಬಹುದಾದ ದಿನಾಂಕ',
    custHistoryHeading: 'ಹಿಂದಿನ ಬಿಲ್ ಮತ್ತು ಪಾವತಿ ದಿನಾಂಕಗಳು',
    colInvoiceNo: 'ಬಿಲ್ ಸಂ.',
    colPaidDate: 'ಪಾವತಿಸಿದ ದಿನ',
    colDelay: 'ವಿಳಂಬ',
    paidOnTimeLabel: 'ಸಮಯಕ್ಕೆ ಸರಿಯಾಗಿ',
    paidLateLabel: 'ತಡವಾಗಿ ಬಂದಿದೆ',
    pendingLabel: 'ಬಾಕಿ ಇದೆ',

    accTitle: 'ನಮ್ಮ ಹಿಂದಿನ ಅಂದಾಜು ಎಷ್ಟು ನಿಖರವಾಗಿತ್ತು?',
    accSubtitle: 'ಮುನೀಮ್‌ಜಿಯ ವಾರದ ಅಂದಾಜು ಮತ್ತು ನಿಮ್ಮ ನಿಜವಾದ ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್ ಹೋಲಿಕೆ.',
    accPlainHeadline1: (offAmount) =>
      `ಕಳೆದ ತಿಂಗಳು ನಮ್ಮ ಅಂದಾಜಿನಲ್ಲಿ ಒಟ್ಟು ಸುಮಾರು ${offAmount} ಮಾತ್ರ ವ್ಯತ್ಯಾಸವಿತ್ತು.`,
    accPlainHeadline2: (cashToday) =>
      `ಇಂದು ನಿಮ್ಮ ಕೈಯಲ್ಲಿರುವ ಹಣ (${cashToday}) ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್‌ಗೆ ಸಂಪೂರ್ಣ ಹೊಂದಿಕೆಯಾಗುತ್ತದೆ.`,
    accPlainHeadline3: (pct) =>
      `ಕಳೆದ 4 ವಾರಗಳಲ್ಲಿ ನಮ್ಮ ಹಣದ ಅಂದಾಜು ನಿಜವಾದ ಬ್ಯಾಂಕ್ ಹಣಕ್ಕೆ ${pct}% ಹತ್ತಿರವಾಗಿತ್ತು.`,
    accTableHeading: 'ಕಳೆದ 4 ವಾರಗಳು: ನಮ್ಮ ಅಂದಾಜು ಮತ್ತು ನಿಜವಾದ ಬ್ಯಾಂಕ್ ಹಣ',
    colWeek: 'ವಾರ',
    colWeGuessed: 'ನಮ್ಮ ಅಂದಾಜು',
    colActualBank: 'ನಿಜವಾದ ಬ್ಯಾಂಕ್ ಹಣ',
    colDifference: 'ವ್ಯತ್ಯಾಸ',
    colSimpleReason: 'ಸರಳ ಕಾರಣ',
    accCaTechSummary: (avgErr, totalDiff) =>
      `CA ಗಾಗಿ ತಾಂತ್ರಿಕ ಸಾರಾಂಶ: 4 ವಾರಗಳ ಸರಾಸರಿ ಶೇಕಡಾವಾರು ವ್ಯತ್ಯಾಸ = ${avgErr}%, ಒಟ್ಟು 4 ವಾರಗಳ ಪಾಸ್‌ಬುಕ್ ವ್ಯತ್ಯಾಸ = ${totalDiff}.`,

    repTitle: 'ಅಂಗಡಿ ಹಣದ ವರದಿ (90 ದಿನಗಳ ನೋಟ)',
    repSubtitle: (shopName) =>
      `${shopName} ಗಾಗಿ ಬರುವ ಹಣ, ಕಟ್ಟಬೇಕಾದ ಬಿಲ್ ಮತ್ತು ದಿನವಹಿ ಬ್ಯಾಲೆನ್ಸ್ ಸಾರಾಂಶ.`,
    repExportCsvBtn: 'CSV ಡೌನ್‌ಲೋಡ್',
    repPrintBtn: 'ವರದಿ ಪ್ರಿಂಟ್ ಮಾಡಿ',
    repPlainBanner: (daysCount, keepAsideAmt) =>
      `ನಿಮ್ಮ ನಗದು ಹಣವು ${daysCount} ದಿನಗಳ ಕಾಲ ನೀವು ಬದಿಗೆ ಇಡುವ ಸುರಕ್ಷತಾ ಹಣಕ್ಕಿಂತ (${keepAsideAmt}) ಕಡಿಮೆಯಾಗಬಹುದು.`,
    repBox1: 'ಇಂದು ಕೈಯಲ್ಲಿರುವ ಹಣ',
    repBox2: 'ಗ್ರಾಹಕರಿಂದ ಬರುವ ಹಣ',
    repBox3: 'ಒಟ್ಟು ಬಿಲ್ ಮತ್ತು ನೋಟಿಸ್ ಬಾಕಿ',
    repBox4: 'ಸುರಕ್ಷತಾ ಹಣಕ್ಕಿಂತ ಕಡಿಮೆ ದಿನಗಳು',
    repDaysUnit: (d) => `${d} ದಿನಗಳು`,
    repTableTitle: 'ದಿನವಹಿ ಖಾತಾ ಪುಸ್ತಕ (ಮುಂದಿನ 30 ದಿನಗಳು)',
    repCaLedgerNote: (inflows, outflows, net) =>
      `CA ಲೆಡ್ಜರ್ ಒಟ್ಟು: ಬರಬೇಕಾದ ಹಣ = ${inflows} · ಪಾವತಿಸಬೇಕಾದ ಬಿಲ್ ಮತ್ತು ನೋಟಿಸ್ = ${outflows} · ನಿವ್ವಳ ವ್ಯತ್ಯಾಸ = ${net}.`,

    modalDaySubtitle: 'ಈ ದಿನ ಬರುವ ಹಣ ಮತ್ತು ಹೋಗುವ ಬಿಲ್‌ಗಳ ವಿವರ',
    modalDayShortfallTitle: 'ಈ ದಿನ ನಿಮಗೆ ಹಣ ಕಡಿಮೆ ಬೀಳಬಹುದು',
    modalDayShortfallDesc: (bal) =>
      `ಗ್ರಾಹಕರ ಹಣ ಬರುವ ಮುನ್ನ ಬಿಲ್ ಕಟ್ಟಬೇಕಿರುವುದರಿಂದ ದಿನದ ಅಂತ್ಯಕ್ಕೆ ಬ್ಯಾಲೆನ್ಸ್ ${bal} ಗೆ ಇಳಿಯುತ್ತದೆ.`,
    modalDayLowTitle: 'ಹಣವು ನೀವು ಬದಿಗೆ ಇಟ್ಟ ಮೊತ್ತಕ್ಕಿಂತ ಕಡಿಮೆಯಾಗುತ್ತದೆ',
    modalDayLowDesc: (bal, keepAside) =>
      `ದಿನದ ಅಂತ್ಯದ ಹಣ (${bal}) ನೀವು ಬದಿಗೆ ಇಡುವ ${keepAside} ಗಿಂತ ಕಡಿಮೆಯಿದೆ.`,
    modalDaySafeTitle: 'ಈ ದಿನ ಸಾಕಷ್ಟು ಹಣ ಕೈಯಲ್ಲಿದೆ',
    modalDaySafeDesc: (bal) =>
      `ದಿನದ ಅಂತ್ಯಕ್ಕೆ ${bal} ಸುರಕ್ಷಿತವಾಗಿ ಉಳಿಯುತ್ತದೆ.`,
    modalStartMoney: 'ಬೆಳಗಿನ ಹಣ',
    modalDayChange: 'ದಿನದ ಬದಲಾವಣೆ',
    modalMoneyComingIn: 'ಬರುವ ಹಣ',
    modalBillsGoingOut: 'ಹೋಗುವ ಬಿಲ್‌ಗಳು',
    modalNoMoneyIn: 'ಈ ದಿನಾಂಕದಂದು ಯಾವುದೇ ಗ್ರಾಹಕರ ಹಣ ನಿರೀಕ್ಷೆಯಿಲ್ಲ.',
    modalNoBillsOut: 'ಈ ದಿನಾಂಕದಂದು ಯಾವುದೇ ಬಿಲ್ ಬಾಕಿ ಇಲ್ಲ.',
    modalAddEntryOnDay: (dateStr) => `${dateStr} ರಂದು ಬಿಲ್ ಅಥವಾ ಮಾರಾಟ ಸೇರಿಸಿ`,

    cashModalTitle: 'ಇಂದು ನಿಮ್ಮ ಹಣ ಎಲ್ಲೆಲ್ಲಿದೆ',
    cashModalTotalToday: 'ಇಂದು ಲಭ್ಯವಿರುವ ಒಟ್ಟು ಹಣ',
    cashModalBankTitle: 'ಸ್ಟೇಟ್ ಬ್ಯಾಂಕ್ ಆಫ್ ಇಂಡಿಯಾ (ಚಾಲ್ತಿ ಖಾತೆ)',
    cashModalBankSub: 'ಖಾತೆ ****4092 · ಪಾಸ್‌ಬುಕ್‌ಗೆ ಹೊಂದಿಕೆಯಾಗಿದೆ',
    cashModalDrawerTitle: 'ಅಂಗಡಿ ಗಲ್ಲಾಪೆಟ್ಟಿಗೆ ನಗದು',
    cashModalDrawerSub: 'ಇಂದು ಅಂಗಡಿಯಲ್ಲಿ ಎಣಿಸಿದ ನಗದು ಹಣ',
    cashModalFreeToSpend: 'ಖರ್ಚಿಗೆ ಲಭ್ಯವಿರುವ ಮುಕ್ತ ಹಣ (ಸುರಕ್ಷತಾ ಹಣ ಬಿಟ್ಟು)',
    doneBtn: 'ಸರಿ',

    settingsTitle: 'ಬದಿಗೆ ಇಡುವ ಸುರಕ್ಷತಾ ಹಣ',
    settingsSubtitle: 'ತುರ್ತು ಪರಿಸ್ಥಿತಿಗಾಗಿ ಅಂಗಡಿಯಲ್ಲಿ ಯಾವಾಗಲೂ ಎಷ್ಟು ಹಣ ಬದಿಗೆ ಇರಬೇಕೆಂದು ಆಯ್ಕೆಮಾಡಿ.',
    settingsKeepAsideLabel: 'ಬದಿಗೆ ಇಡಬೇಕಾದ ಹಣ (₹)',
    settingsKeepAsideHelp: 'ನಿಮ್ಮ ಹಣ ಇದಕ್ಕಿಂತ ಕಡಿಮೆಯಾಗುವ ಮುನ್ನ ಮುನೀಮ್‌ಜಿ ನಿಮಗೆ ಎಚ್ಚರಿಕೆ ನೀಡುತ್ತಾರೆ.',
    saveChangesBtn: 'ಮೊತ್ತ ಉಳಿಸಿ',

    addModalTitle: 'ಗ್ರಾಹಕರ ಮಾರಾಟ ಅಥವಾ ಬಿಲ್ ಸೇರಿಸಿ',
    addMoneyInTab: 'ಬರುವ ಹಣ',
    addMoneyOutTab: 'ಕಟ್ಟಬೇಕಾದ ಬಿಲ್',
    partyNameLabel: 'ಗ್ರಾಹಕ ಅಥವಾ ಸರಬರಾಜುದಾರರ ಹೆಸರು',
    billDescriptionLabel: 'ಸರಕು ಅಥವಾ ಬಿಲ್ ವಿವರ',
    saveEntryBtn: 'ಖಾತೆಯಲ್ಲಿ ಉಳಿಸಿ',

    scanModalTitle: 'ಬಿಲ್ ಫೋಟೋ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ',
    scanModalSubtitle: 'ಬಿಲ್ ಫೋಟೋ ಹಾಕಿ ಅಥವಾ ಕೆಳಗಿನ ಮಾದರಿ ಬಿಲ್‌ಗಳನ್ನು ಒತ್ತಿ ಪರೀಕ್ಷಿಸಿ.',
    scanTapUpload: 'ಬಿಲ್ ಫೋಟೋ ಆಯ್ಕೆ ಮಾಡಲು ಒತ್ತಿರಿ',
    scanTrySampleBills: 'ಅಥವಾ ಮಾದರಿ ಬಿಲ್ ಒತ್ತಿರಿ:',
    scanReadingMsg: 'ಬಿಲ್ ವಿವರ ಓದಲಾಗುತ್ತಿದೆ...',

    waCustomerModalTitle: 'ಗ್ರಾಹಕರಿಗೆ WhatsApp ನೆನಪು ಕಳುಹಿಸಿ',
    waCustomerSubtitle: 'WhatsApp ತೆರೆದ ನಂತರ Send ಒತ್ತಿರಿ.',
    messageLangLabel: 'ಸಂದೇಶದ ಭಾಷೆ:',

    demoTitle: '90-ಸೆಕೆಂಡ್ ಮಾರ್ಗದರ್ಶಿ ಡೆಮೊ',
    demoStepCounter: (current, total) => `ಹಂತ ${current} / ${total}`,
    demoNextBtn: 'ಮುಂದೆ',
    demoPrevBtn: 'ಹಿಂದೆ',
    demoStep1Title: '1. ನಿಮ್ಮ ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ',
    demoStep1Caption: 'ಪ್ರತಿ ಪದ, ದಿನಾಂಕ, ₹ ಸಂಖ್ಯೆ ಮತ್ತು ಮುನೀಮ್‌ಜಿಯ ಧ್ವನಿ ತಕ್ಷಣ ಕನ್ನಡ, ಹಿಂದಿ ಅಥವಾ ಇಂಗ್ಲಿಷ್‌ಗೆ ಬದಲಾಗುತ್ತದೆ.',
    demoStep1Speech: 'ನಮಸ್ಕಾರ ಶರ್ಮಾ ಜಿ! RupiVanta ಗೆ ಸ್ವಾಗತ. ಒಂದೇ ಒತ್ತುವಿಕೆಯಿಂದ ನೀವು ಇಡೀ ಆಪ್ ಅನ್ನು ಕನ್ನಡ, ಹಿಂದಿ ಅಥವಾ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಬಳಸಬಹುದು.',
    demoStep2Title: '2. ನೋಟಿಸ್ ಸುರಕ್ಷತಾ ಅಂಕ ಮತ್ತು ತುರ್ತು ಎಚ್ಚರಿಕೆ',
    demoStep2Caption: 'ನಿಮ್ಮ ಅಂಗಡಿಯ ನೋಟಿಸ್ ಸುರಕ್ಷತಾ ಅಂಕ 100 ರಲ್ಲಿ 48 ಇದೆ, ಏಕೆಂದರೆ 1 ಚೆಕ್ ಬೌನ್ಸ್ ನೋಟಿಸ್‌ಗೆ ಕೇವಲ 6 ದಿನ ಬಾಕಿ ಇದೆ.',
    demoStep2Speech: 'ಮುಖಪುಟದಲ್ಲಿ ನಿಮ್ಮ ನೋಟಿಸ್ ಸುರಕ್ಷತಾ ಅಂಕ 100 ರಲ್ಲಿ 48 ಇದೆ. ಅತ್ಯಂತ ತುರ್ತು ₹25,000 ಚೆಕ್ ಬೌನ್ಸ್ ನೋಟಿಸ್‌ಗೆ 6 ದಿನ ಬಾಕಿ ಇದೆ.',
    demoStep3Title: '3. ಸರಳ ಮಾತುಗಳಲ್ಲಿ ನೋಟಿಸ್ ವಿವರಣೆ',
    demoStep3Caption: 'ಮೊದಲು ಕೇವಲ 4 ಮುಖ್ಯ ವಿವರಗಳನ್ನು ತೋರಿಸುತ್ತದೆ: ಯಾರು ಕಳುಹಿಸಿದ್ದಾರೆ, ಎಷ್ಟು ಗಂಭೀರ, ಏನು ಬೇಕು ಮತ್ತು ತಲುಪಿದ ದಿನದಿಂದ ಕೊನೆಯ ದಿನಾಂಕ.',
    demoStep3Speech: 'ನೋಟಿಸ್ ಪುಟದಲ್ಲಿ ಇದು ಅಸಲಿಯೇ ಎಂದು ಪರಿಶೀಲಿಸಿ, ಸರಳ ಸಾಲುಗಳಲ್ಲಿ ಏನು ಮಾಡಬೇಕೆಂದು ಹೇಳಿ, ನಿಮಗೆ ತಲುಪಿದ ದಿನಾಂಕದಿಂದ ಕೊನೆಯ ದಿನಾಂಕವನ್ನು ಲೆಕ್ಕ ಹಾಕುತ್ತೇನೆ.',
    demoStep4Title: '4. ಅಂಗಡಿಯ ಹಣದ ಮೇಲಿನ ಪರಿಣಾಮ',
    demoStep4Caption: '₹25,000 ನೋಟಿಸ್ ಅನ್ನು ನಿಮ್ಮ ಖಾತೆಯೊಂದಿಗೆ ಜೋಡಿಸಿ 29 ಅಕ್ಟೋ ರಂದು ₹10,000 ಕೊರತೆಯನ್ನು ತೋರಿಸುತ್ತದೆ.',
    demoStep4Speech: 'ಈಗ ಹಣದ ಪುಟ ನೋಡಿ. 29 ಅಕ್ಟೋಬರ್ ರಂದು ಮಲೆನಾಡು ಆಗ್ರೋ ₹40,000 ಬಿಲ್ ಮತ್ತು 30 ಅಕ್ಟೋಬರ್ ನೋಟಿಸ್‌ನಿಂದಾಗಿ ನಿಮಗೆ ₹10,000 ಹಣ ಕಡಿಮೆ ಬೀಳಬಹುದು.',
    demoStep5Title: '5. CA ರಮೇಶ್ ಅವರಿಗೆ WhatsApp ಕಳುಹಿಸಿ',
    demoStep5Caption: 'ಒಂದೇ ಒತ್ತುವಿಕೆಯಲ್ಲಿ CA ರಮೇಶ್‌ಗಾಗಿ ನೋಟಿಸ್ ಸಾರಾಂಶ ಸಿದ್ಧವಾಗುತ್ತದೆ ಮತ್ತು ನಿಮ್ಮ ಒಪ್ಪಿಗೆ ಕೇಳುತ್ತದೆ.',
    demoStep5Speech: 'ಕೊನೆಯದಾಗಿ, ಒಂದೇ ಬಟನ್ ಮೂಲಕ ನಿಮ್ಮ CA ರಮೇಶ್ ಅವರಿಗೆ WhatsApp ಸಂದೇಶ ಸಿದ್ಧಪಡಿಸುತ್ತೇನೆ.',
  },
  ta: TA_TRANSLATIONS,
  te: TE_TRANSLATIONS,
  ml: ML_TRANSLATIONS,
};

// ============================================================================
// 3. LOCALIZED ROLES, SEVERITIES, STATUSES, CONFIDENCE & VOICE COMMANDS
// ============================================================================

export function getRoleLabel(role: PersonRole, lang: AppLanguage): string {
  if (lang === 'hi') {
    switch (role) {
      case 'CA': return 'चार्टर्ड अकाउंटेंट (CA)';
      case 'Accountant': return 'दुकान मुनीम / अकाउंटेंट';
      case 'Lawyer': return 'वकील';
      case 'Family': return 'परिवार';
      default: return 'विश्वसनीय संपर्क';
    }
  }
  if (lang === 'kn') {
    switch (role) {
      case 'CA': return 'ಚಾರ್ಟರ್ಡ್ ಅಕೌಂಟೆಂಟ್ (CA)';
      case 'Accountant': return 'ಅಂಗಡಿ ಅಕೌಂಟೆಂಟ್ / ಮುನೀಮ್';
      case 'Lawyer': return 'ವಕೀಲರು';
      case 'Family': return 'ಕುಟುಂಬ';
      default: return 'ನಂಬಿಕಸ್ತ ಸಂಪರ್ಕ';
    }
  }
  switch (role) {
    case 'CA': return 'Chartered Accountant (CA)';
    case 'Accountant': return 'Shop Accountant / Munim';
    case 'Lawyer': return 'Lawyer / Advocate';
    case 'Family': return 'Family';
    default: return 'Trusted Contact';
  }
}

export function getSeverityPlainLabel(sev: NoticeSeverity, lang: AppLanguage): string {
  const t = TRANSLATIONS[lang];
  if (sev === 'Urgent') return t.severityUrgent;
  if (sev === 'Needs attention') return t.severityAttention;
  return t.severityRoutine;
}

export function getNoticeStatusLabel(status: NoticeStatus, lang: AppLanguage): string {
  const t = TRANSLATIONS[lang];
  switch (status) {
    case 'New': return t.statusNew;
    case 'In progress': return t.statusInProgress;
    case 'Replied': return t.statusReplied;
    case 'Closed': return t.statusClosed;
  }
}

export function getConfidenceLabel(conf: FieldConfidence, lang: AppLanguage): string {
  const t = TRANSLATIONS[lang];
  return conf === 'Read from notice' ? t.readFromNoticeBadge : t.estimatedConfirmBadge;
}

export function getAdvisorVerdictLabel(verdict: AdvisorVerdict, lang: AppLanguage): string {
  const t = TRANSLATIONS[lang];
  if (verdict === 'Yes') return t.verdictYes;
  if (verdict === 'Maybe') return t.verdictMaybe;
  return t.verdictNo;
}

export function getLocalizedVoicePrompts(lang: AppLanguage): Array<{ label: string; cmd: string }> {
  if (lang === 'hi') {
    return [
      { label: 'राकेश को 29 अक्टूबर तक ₹15,000 देने हैं', cmd: 'Rakesh needs to pay me ₹15,000 by 29 October' },
      { label: 'मैंने आज माल के लिए ₹3,000 दिए', cmd: 'I paid ₹3,000 for stock today' },
      { label: 'किसने अभी तक पैसे नहीं दिए?', cmd: 'Who has not paid me yet?' },
      { label: 'अगले हफ़्ते पैसे कम क्यों पड़ सकते हैं?', cmd: 'Why might I run out of money next week?' },
      { label: 'यह नोटिस आसान भाषा में समझाएं', cmd: 'Explain this notice' },
      { label: 'साप्ताहिक वित्तीय रिपोर्ट तैयार करें', cmd: 'Prepare my weekly financial report' },
      { label: 'CA रमेश को WhatsApp पर भेजें', cmd: 'Send this notice to my CA Ramesh' },
    ];
  }
  if (lang === 'kn') {
    return [
      { label: 'ರಾಕೇಶ್ 29 ಅಕ್ಟೋಬರ್ ಒಳಗೆ ₹15,000 ಕೊಡಬೇಕು', cmd: 'Rakesh needs to pay me ₹15,000 by 29 October' },
      { label: 'ಇಂದು ಸರಕಿಗಾಗಿ ₹3,000 ಪಾವತಿಸಿದ್ದೇನೆ', cmd: 'I paid ₹3,000 for stock today' },
      { label: 'ಯಾರು ಇನ್ನೂ ಹಣ ಕೊಟ್ಟಿಲ್ಲ?', cmd: 'Who has not paid me yet?' },
      { label: 'ಮುಂದಿನ ವಾರ ಹಣ ಏಕೆ ಕಡಿಮೆಯಾಗಬಹುದು?', cmd: 'Why might I run out of money next week?' },
      { label: 'ಈ ನೋಟಿಸ್ ಸರಳವಾಗಿ ವಿವರಿಸಿ', cmd: 'Explain this notice' },
      { label: 'ವಾರದ ಆರ್ಥಿಕ ವರದಿ ಸಿದ್ಧಪಡಿಸಿ', cmd: 'Prepare my weekly financial report' },
      { label: 'CA ರಮೇಶ್‌ಗೆ WhatsApp ಕಳುಹಿಸಿ', cmd: 'Send this notice to my CA Ramesh' },
    ];
  }
  if (lang === 'ta') {
    return [
      { label: 'ராகேஷ் அக்டோபர் 29க்குள் ₹15,000 தர வேண்டும்', cmd: 'Rakesh needs to pay me ₹15,000 by 29 October' },
      { label: 'இன்று சரக்குக்கு ₹3,000 கொடுத்தேன்', cmd: 'I paid ₹3,000 for stock today' },
      { label: 'யார் இன்னும் பணம் தரவில்லை?', cmd: 'Who has not paid me yet?' },
      { label: 'அடுத்த வாரம் ஏன் பணப் பற்றாக்குறை வரலாம்?', cmd: 'Why might I run out of money next week?' },
      { label: 'இந்த நோட்டீஸை விளக்குங்கள்', cmd: 'Explain this notice' },
      { label: 'வாராந்திர நிதி அறிக்கை தயார் செய்', cmd: 'Prepare my weekly financial report' },
    ];
  }
  if (lang === 'te') {
    return [
      { label: 'రాకేష్ అక్టోబర్ 29 లోపు ₹15,000 ఇవ్వాలి', cmd: 'Rakesh needs to pay me ₹15,000 by 29 October' },
      { label: 'ఈరోజు సరుకు కోసం ₹3,000 చెల్లించాను', cmd: 'I paid ₹3,000 for stock today' },
      { label: 'ఎవరు ఇంకా డబ్బు ఇవ్వలేదు?', cmd: 'Who has not paid me yet?' },
      { label: 'వచ్చే వారం డబ్బు ఎందుకు తగ్గవచ్చు?', cmd: 'Why might I run out of money next week?' },
      { label: 'ఈ నోటీసును వివరించండి', cmd: 'Explain this notice' },
      { label: 'వారపు ఆర్థిక నివేదిక సిద్ధం చేయండి', cmd: 'Prepare my weekly financial report' },
    ];
  }
  if (lang === 'ml') {
    return [
      { label: 'രാകേഷ് ഒക്ടോബർ 29-നകം ₹15,000 തരണം', cmd: 'Rakesh needs to pay me ₹15,000 by 29 October' },
      { label: 'ഇന്ന് സ്റ്റോക്കിനായി ₹3,000 നൽകി', cmd: 'I paid ₹3,000 for stock today' },
      { label: 'ആരാണ് ഇതുവരെ പണം തരാത്തത്?', cmd: 'Who has not paid me yet?' },
      { label: 'അടുത്ത ആഴ്ച പണക്കുറവ് വരാൻ കാരണമെന്ത്?', cmd: 'Why might I run out of money next week?' },
      { label: 'ഈ നോട്ടീസ് വിശദീകരിക്കുക', cmd: 'Explain this notice' },
      { label: 'പ്രതിവാര സാമ്പത്തിക റിപ്പോർട്ട് തയ്യാറാക്കുക', cmd: 'Prepare my weekly financial report' },
    ];
  }
  return [
    { label: 'Rakesh needs to pay me ₹15,000 by 29 October', cmd: 'Rakesh needs to pay me ₹15,000 by 29 October' },
    { label: 'I paid ₹3,000 for stock today', cmd: 'I paid ₹3,000 for stock today' },
    { label: 'Who has not paid me yet?', cmd: 'Who has not paid me yet?' },
    { label: 'Why might I run out of money next week?', cmd: 'Why might I run out of money next week?' },
    { label: 'What happens if my customer pays 7 days late?', cmd: 'What happens if my biggest customer pays 7 days late?' },
    { label: 'Explain this notice', cmd: 'Explain this notice' },
    { label: 'Prepare my weekly financial report', cmd: 'Prepare my weekly financial report' },
    { label: 'Send this notice to my CA Ramesh', cmd: 'Send this notice to my CA Ramesh' },
  ];
}

// ============================================================================
// 4. LOCALIZED SAMPLE NOTICES (Full Hindi & Kannada Translation of All 3 Samples)
// ============================================================================

export function getLocalizedNotice(notice: LegalNotice, lang: AppLanguage): LegalNotice {
  const t = TRANSLATIONS[lang];
  const recFormatted = formatLocalDate(notice.receivedDate, lang);
  const dueFormatted = formatLocalDate(notice.deadlineDate, lang);
  const localizedCalcBasis = t.recalculatedNote(
    notice.statutoryDaysFromReceipt,
    recFormatted,
    dueFormatted
  );

  if (lang === 'en') {
    return {
      ...notice,
      deadlineCalculationBasis: localizedCalcBasis,
    };
  }

  // Hindi translations for the 3 built-in sample notices
  if (lang === 'hi') {
    if (notice.sampleKey === 'ni_138_cheque') {
      return {
        ...notice,
        title: 'चेक बाउंस कानूनी मांग नोटिस (धारा 138 NI Act)',
        authorityName: 'एडवोकेट एम. विश्वनाथ एंड एसोसिएट्स (डेक्कन फ्रेट एंड पैकेजिंग प्रा. लि. की ओर से)',
        authenticity: {
          ...notice.authenticity,
          summary:
            'असली लगता है — पंजीकृत वकील द्वारा डाक से भेजा गया नोटिस है और भुगतान केवल सप्लायर कंपनी के बैंक खाते में मांगा गया है।',
          dinCheckNote:
            'सरकारी DIN लागू नहीं (यह चेक बाउंस का वकील नोटिस है; वकील पंजीकरण KAR/1942/2014 दर्ज है)।',
          domainCheckNote: 'असली कानूनी कार्यालय का पता और ईमेल दर्ज है।',
          paymentCheckNote:
            'सुरक्षित: किसी निजी UPI में नहीं, केवल "Deccan Freight & Packaging Pvt. Ltd." के चालू बैंक खाते में भुगतान कहा गया है।',
        },
        lawSection: 'निगोशिएबल इंस्ट्रूमेंट्स एक्ट, 1881 की धारा 138',
        lawPlainExplanation:
          'यदि बैंक में कम बैलेंस के कारण दुकान का चेक बाउंस हो जाए, तो कोर्ट केस रोकने के लिए नोटिस मिलने के 15 दिन के अंदर चेक की राशि देनी होती है।',
        whatIsAskedLines: [
          'डेक्कन फ्रेट को दिया गया ₹25,000 का चेक नं. 482910 कम बैलेंस के कारण बाउंस हो गया है।',
          'कोर्ट केस से बचने के लिए नोटिस मिलने के 15 दिन के अंदर ₹25,000 का भुगतान करें।',
          'भुगतान के बाद लिखित रसीद लें और अपना पुराना चेक वापस प्राप्त करें।',
        ],
        amountBreakdown: 'चेक राशि: ₹25,000 (15 दिन के भीतर ₹25,000 देने पर कोर्ट केस रुक जाता है)।',
        severityReason:
          'नोटिस मिलने से सिर्फ़ 15 दिन का कड़ा समय होता है — चूकने पर कोर्ट में केस दर्ज हो सकता है।',
        deadlineCalculationBasis: localizedCalcBasis,
        ignoreTimeline: [
          {
            timeframe: '16वें दिन (30 अक्टू के बाद)',
            title: 'मजिस्ट्रेट कोर्ट में केस',
            detail: 'सप्लायर को चेक बाउंस की शिकायत दर्ज करने का अधिकार मिल जाता है।',
          },
          {
            timeframe: '2–3 महीने बाद',
            title: 'कोर्ट समन और 20% जमा',
            detail: 'कोर्ट में पेश होना पड़ेगा और 20% राशि तुरंत जमा करने का आदेश हो सकता है।',
          },
          {
            timeframe: 'अंतिम आदेश',
            title: 'दोगुना जुर्माना (₹50,000 तक)',
            detail: 'चेक की दोगुनी राशि तक का जुर्माना और कानूनी परेशानी हो सकती है।',
          },
        ],
        documentsChecklist: notice.documentsChecklist.map((d, i) => ({
          ...d,
          label:
            [
              'डाक का लिफ़ाफ़ा जिस पर डिलीवरी तारीख़ की मुहर हो',
              'बैंक का चेक रिटर्न मेमो और अक्टूबर पासबुक स्टेटमेंट',
              'डेक्कन फ्रेट के बिल और माल मिलने की रसीद',
              'भुगतान के बाद NEFT/RTGS बैंक रसीद',
            ][i] || d.label,
          detail:
            [
              'इससे साबित होता है कि नोटिस किस तारीख़ को मिला।',
              'चेक वापस होने की सही तारीख़ और कारण जांचें।',
              'पक्का करें कि ₹25,000 का माल वास्तव में आया था।',
              'बैंक ट्रांसफर में चेक नं. 482910 ज़रूर लिखें।',
            ][i] || d.detail,
        })),
        advisorGuidance: {
          verdict: 'Yes',
          roleLabel: 'स्थानीय वकील (Advocate)',
          reasons: [
            'चेक बाउंस नोटिस में कोर्ट केस का जोखिम होता है, इसलिए वकील से लिखित जवाब और भुगतान रसीद पक्की करवाएं।',
            'यदि माल खराब था या चेक सिक्योरिटी के लिए था, तो 15 दिन के अंदर वकील द्वारा जवाब भेजना ज़रूरी है।',
          ],
        },
      };
    }

    if (notice.sampleKey === 'gst_drc01') {
      return {
        ...notice,
        title: 'GST कारण बताओ नोटिस (फ़ॉर्म GST DRC-01)',
        authorityName: 'सहायक आयुक्त, वाणिज्यिक कर (GST कार्यालय LGSTO-020), बेंगलुरु',
        authenticity: {
          ...notice.authenticity,
          summary:
            'असली सरकारी नोटिस है — इसमें आधिकारिक DIN नंबर है, @gst.gov.in से आया है और भुगतान केवल सरकारी पोर्टल पर कहा गया है।',
          dinCheckNote: 'सरकारी DIN CBIC-2026-10-4918273645 साफ़ छपा है।',
          domainCheckNote: 'आधिकारिक सरकारी ईमेल (@gst.gov.in)।',
          paymentCheckNote: 'सुरक्षित: केवल services.gst.gov.in पोर्टल पर, किसी निजी खाते में नहीं।',
        },
        lawSection: 'CGST / KGST अधिनियम 2017 की धारा 73(1) (फ़ॉर्म DRC-01)',
        lawPlainExplanation:
          'GST अधिकारी आपके द्वारा लिए गए टैक्स क्रेडिट और सप्लायर के अपलोड किए बिलों के अंतर का कारण पूछ रहे हैं।',
        whatIsAskedLines: [
          'आपके GST रिटर्न में सप्लायर रिकॉर्ड से ₹15,200 अधिक टैक्स क्रेडिट दिखा है।',
          'अपने पक्के खरीद बिल, ट्रांसपोर्ट रसीद और बैंक भुगतान का सबूत पोर्टल पर अपलोड करें।',
          'या यदि गलती से क्रेडिट लिया गया था, तो 30 दिन में ₹18,500 जमा करें।',
        ],
        amountBreakdown: 'टैक्स: ₹15,200 · ब्याज: ₹1,800 · जुर्माना: ₹1,500 (कुल: ₹18,500)',
        severityReason:
          'जवाब देने के लिए समय है — समय पर सप्लायर के बिल दिखाने पर यह पैसा नहीं देना पड़ेगा।',
        deadlineCalculationBasis: localizedCalcBasis,
        ignoreTimeline: [
          {
            timeframe: '5 नवं 2026 के बाद',
            title: 'एकतरफ़ा पक्का टैक्स आदेश (DRC-07)',
            detail: 'जवाब न देने पर अधिकारी ₹18,500 की मांग पक्की कर देंगे।',
          },
          {
            timeframe: '1 से 3 महीने बाद',
            title: '18% सालाना ब्याज बढ़ता रहेगा',
            detail: '₹15,200 पर रोज़ाना ब्याज जुड़ता रहेगा।',
          },
          {
            timeframe: '3 महीने बाद',
            title: 'ई-वे बिल रोक और बैंक वसूली',
            detail: 'माल भेजने के ई-वे बिल रुक सकते हैं और बैंक खाते से वसूली हो सकती है।',
          },
        ],
        documentsChecklist: notice.documentsChecklist.map((d, i) => ({
          ...d,
          label:
            [
              'GSTR-3B और सप्लायर GSTR-2B के मिलान की सूची',
              'सप्लायर के मूल GST खरीद बिल',
              'ई-वे बिल और ट्रांसपोर्ट लॉरी रसीद',
              'सप्लायर को बैंक (NEFT) से किए भुगतान का स्टेटमेंट',
            ][i] || d.label,
          detail: undefined,
        })),
        advisorGuidance: {
          verdict: 'Maybe',
          roleLabel: 'चार्टर्ड अकाउंटेंट (CA)',
          reasons: [
            'यदि CA रमेश आपका मासिक GST भरते हैं, तो उन्हें यह नोटिस WhatsApp कर दें ताकि वे DRC-06 अपलोड कर दें।',
            'इसके लिए कोर्ट के वकील की ज़रूरत नहीं है।',
          ],
        },
      };
    }

    if (notice.sampleKey === 'it_143_1') {
      return {
        ...notice,
        title: 'इनकम टैक्स सूचना पत्र — धारा 143(1)',
        authorityName: 'आयकर विभाग (CPC बेंगलुरु)',
        authenticity: {
          ...notice.authenticity,
          summary:
            'असली कंप्यूटर सूचना है — CPC बेंगलुरु का रेफ़रेंस नंबर और @cpc.incometax.gov.in ईमेल मौजूद है।',
          dinCheckNote: 'आधिकारिक CPC रेफ़रेंस CPC/2627/A6/2491827345 पोर्टल पर उपलब्ध है।',
          domainCheckNote: 'आधिकारिक आयकर विभाग (.gov.in) ईमेल।',
          paymentCheckNote: 'सुरक्षित: कोई निजी खाता नहीं मांगा गया है।',
        },
        lawSection: 'आयकर अधिनियम, 1961 की धारा 143(1)',
        lawPlainExplanation:
          'यह कंप्यूटर द्वारा आपके इनकम टैक्स रिटर्न और पोर्टल पर दिख रहे TDS टैक्स क्रेडिट का सामान्य मिलान है।',
        whatIsAskedLines: [
          'कंप्यूटर को आपके फ़ॉर्म 26AS में ₹6,400 कम TDS क्रेडिट मिला है।',
          'जांचें कि आपके खरीदार ने अब अपना TDS रिटर्न अपडेट कर दिया है या नहीं।',
          'पोर्टल पर मुफ़्त दोबारा जांच (Rectification) चुनें, या गलती होने पर ₹6,400 जमा करें।',
        ],
        amountBreakdown: 'TDS अंतर: ₹6,150 · ब्याज: ₹250 (कुल: ₹6,400)',
        severityReason:
          'यह कोई छापा या जांच नहीं है, सामान्य कंप्यूटर मिलान है और अभी 25 दिन का समय है।',
        deadlineCalculationBasis: localizedCalcBasis,
        ignoreTimeline: [
          {
            timeframe: '18 नवं 2026 के बाद',
            title: '1% मासिक ब्याज शुरू',
            detail: '₹6,400 पर हर महीने लगभग ₹64 ब्याज जुड़ेगा।',
          },
          {
            timeframe: 'अगले रिटर्न में',
            title: 'रिफ़ंड से कटौती',
            detail: 'अगले साल मिलने वाले टैक्स रिफ़ंड से ₹6,400 काट लिए जाएंगे।',
          },
          {
            timeframe: '6 महीने बाद',
            title: 'पोर्टल रिमाइंडर ईमेल',
            detail: 'लंबित मांग का जवाब देने के लिए स्मरण पत्र आएगा।',
          },
        ],
        documentsChecklist: notice.documentsChecklist.map((d, i) => ({
          ...d,
          label:
            [
              'नया फ़ॉर्म 26AS और AIS टैक्स स्टेटमेंट',
              'ग्राहक से मिला फ़ॉर्म 16A TDS प्रमाणपत्र',
              'इस वर्ष भरे गए इनकम टैक्स रिटर्न की प्रति',
            ][i] || d.label,
          detail: undefined,
        })),
        advisorGuidance: {
          verdict: 'No',
          roleLabel: 'ऑनलाइन पोर्टल (या नियमित मुलाकात में CA से पूछें)',
          reasons: [
            'छोटे ₹6,400 TDS मिलान के लिए पोर्टल पर ऑनलाइन जवाब देने में 5 मिनट लगते हैं।',
            'यदि पासवर्ड CA रमेश के पास है, तो उन्हें WhatsApp पर भेज दें।',
          ],
        },
      };
    }
  }

  // Kannada translations for the 3 built-in sample notices
  if (lang === 'kn') {
    if (notice.sampleKey === 'ni_138_cheque') {
      return {
        ...notice,
        title: 'ಚೆಕ್ ಬೌನ್ಸ್ ಕಾನೂನು ನೋಟಿಸ್ (ಸೆಕ್ಷನ್ 138 NI Act)',
        authorityName: 'ವಕೀಲರು ಎಂ. ವಿಶ್ವನಾಥ್ ಮತ್ತು ಅಸೋಸಿಯೇಟ್ಸ್ (ಡೆಕ್ಕನ್ ಫ್ರೈಟ್ ಪರವಾಗಿ)',
        authenticity: {
          ...notice.authenticity,
          summary:
            'ಅಸಲಿ ನೋಟಿಸ್ ಆಗಿದೆ — ನೋಂದಾಯಿತ ವಕೀಲರು ಅಂಚೆ ಮೂಲಕ ಕಳುಹಿಸಿದ್ದಾರೆ ಮತ್ತು ಕಂಪನಿಯ ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ ಮಾತ್ರ ಪಾವತಿಸಲು ಕೇಳಿದ್ದಾರೆ.',
          dinCheckNote:
            'ಸರ್ಕಾರಿ DIN ಅಗತ್ಯವಿಲ್ಲ (ವಕೀಲರ ನೋಂದಣಿ ಸಂಖ್ಯೆ KAR/1942/2014 ನಮೂದಿಸಲಾಗಿದೆ).',
          domainCheckNote: 'ನಿಜವಾದ ವಕೀಲರ ಕಚೇರಿ ವಿಳಾಸ ಮತ್ತು ಇಮೇಲ್ ಇದೆ.',
          paymentCheckNote:
            'ಸುರಕ್ಷಿತ: ಯಾವುದೇ ವೈಯಕ್ತಿಕ UPI ಅಲ್ಲ, ಕೇವಲ "Deccan Freight & Packaging Pvt. Ltd." ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ ಪಾವತಿಸಲು ತಿಳಿಸಿದೆ.',
        },
        lawSection: 'ನೆಗೋಷಿಯಬಲ್ ಇನ್‌ಸ್ಟ್ರುಮೆಂಟ್ಸ್ ಕಾಯ್ದೆ 1881 ರ ಸೆಕ್ಷನ್ 138',
        lawPlainExplanation:
          'ಬ್ಯಾಂಕ್ ಬ್ಯಾಲೆನ್ಸ್ ಕಡಿಮೆಯಾಗಿ ಚೆಕ್ ಬೌನ್ಸ್ ಆದರೆ, ಕೋರ್ಟ್ ಕೇಸ್ ತಪ್ಪಿಸಲು ನೋಟಿಸ್ ಸಿಕ್ಕ 15 ದಿನಗಳ ಒಳಗೆ ಆ ಚೆಕ್ ಹಣವನ್ನು ಪಾವತಿಸಬೇಕು.',
        whatIsAskedLines: [
          'ಡೆಕ್ಕನ್ ಫ್ರೈಟ್ ಕಂಪನಿಗೆ ನೀಡಿದ್ದ ₹25,000 ಮೊತ್ತದ ಚೆಕ್ ಸಂ. 482910 ಬ್ಯಾಲೆನ್ಸ್ ಕೊರತೆಯಿಂದ ಬೌನ್ಸ್ ಆಗಿದೆ.',
          'ಕೋರ್ಟ್ ಕೇಸ್ ತಪ್ಪಿಸಲು ನೋಟಿಸ್ ತಲುಪಿದ 15 ದಿನಗಳ ಒಳಗೆ ₹25,000 ಪಾವತಿಸಿ.',
          'ಹಣ ಪಾವತಿಸಿದ ನಂತರ ಲಿಖಿತ ರಸೀದಿ ಪಡೆದು ಹಳೆಯ ಚೆಕ್ ವಾಪಸ್ ಪಡೆಯಿರಿ.',
        ],
        amountBreakdown: 'ಚೆಕ್ ಮೊತ್ತ: ₹25,000 (15 ದಿನದೊಳಗೆ ₹25,000 ಪಾವತಿಸಿದರೆ ಕೋರ್ಟ್ ಕೇಸ್ ನಿಲ್ಲುತ್ತದೆ).',
        severityReason:
          'ನೋಟಿಸ್ ಸಿಕ್ಕಿದ ದಿನದಿಂದ ಕೇವಲ 15 ದಿನಗಳ ಕಟ್ಟುನಿಟ್ಟಿನ ಸಮಯವಿದೆ — ತಪ್ಪಿದರೆ ಕೋರ್ಟ್ ಕೇಸ್ ಆಗಬಹುದು.',
        deadlineCalculationBasis: localizedCalcBasis,
        ignoreTimeline: [
          {
            timeframe: '16ನೇ ದಿನ (30 ಅಕ್ಟೋ ನಂತರ)',
            title: 'ಮ್ಯಾಜಿಸ್ಟ್ರೇಟ್ ಕೋರ್ಟ್ ಕೇಸ್',
            detail: 'ಸರಬರಾಜುದಾರರು ನ್ಯಾಯಾಲಯದಲ್ಲಿ ಚೆಕ್ ಬೌನ್ಸ್ ದೂರು ದಾಖಲಿಸಬಹುದು.',
          },
          {
            timeframe: '2–3 ತಿಂಗಳ ನಂತರ',
            title: 'ಕೋರ್ಟ್ ಸಮನ್ಸ್ ಮತ್ತು 20% ಠೇವಣಿ',
            detail: 'ನೀವು ಖುದ್ದಾಗಿ ಕೋರ್ಟ್‌ಗೆ ಹಾಜರಾಗಬೇಕಾಗುತ್ತದೆ ಮತ್ತು 20% ಮಧ್ಯಂತರ ಹಣ ಕಟ್ಟಬೇಕಾಗಬಹುದು.',
          },
          {
            timeframe: 'ಅಂತಿಮ ಆದೇಶ',
            title: 'ಚೆಕ್ ಮೊತ್ತದ ಎರಡು ಪಟ್ಟು ದಂಡ (₹50,000)',
            detail: 'ಭಾರೀ ದಂಡ ಮತ್ತು ಕಾನೂನು ತೊಂದರೆ ಎದುರಾಗಬಹುದು.',
          },
        ],
        documentsChecklist: notice.documentsChecklist.map((d, i) => ({
          ...d,
          label:
            [
              'ಅಂಚೆ ಲಕೋಟೆ (ಇಂಡಿಯಾ ಪೋಸ್ಟ್ ತಲುಪಿದ ದಿನಾಂಕದ ಮುದ್ರೆ ಸಹಿತ)',
              'ಬ್ಯಾಂಕ್ ಚೆಕ್ ಬೌನ್ಸ್ ಸ್ಲಿಪ್ ಮತ್ತು ಅಕ್ಟೋಬರ್ ಬ್ಯಾಂಕ್ ಸ್ಟೇಟ್‌ಮೆಂಟ್',
              'ಡೆಕ್ಕನ್ ಫ್ರೈಟ್ ಸರಕು ಬಿಲ್ ಮತ್ತು ಡೆಲಿವರಿ ರಸೀದಿ',
              'ಹಣ ಕಳುಹಿಸಿದ ನಂತರ NEFT/RTGS ಬ್ಯಾಂಕ್ ರಸೀದಿ',
            ][i] || d.label,
          detail: undefined,
        })),
        advisorGuidance: {
          verdict: 'Yes',
          roleLabel: 'ಸ್ಥಳೀಯ ವಕೀಲರು (Advocate)',
          reasons: [
            'ಚೆಕ್ ಬೌನ್ಸ್ ನೋಟಿಸ್ ಕೋರ್ಟ್ ಕೇಸ್‌ಗೆ ಕಾರಣವಾಗುವುದರಿಂದ ವಕೀಲರ ಮೂಲಕ ಸರಿಯಾದ ಉತ್ತರ ಮತ್ತು ರಸೀದಿ ಪಡೆಯುವುದು ಸುರಕ್ಷಿತ.',
            'ಸರಕು ಹಾಳಾಗಿದ್ದರೆ 15 ದಿನದೊಳಗೆ ವಕೀಲರಿಂದ ಲಿಖಿತ ಉತ್ತರ ಕಳುಹಿಸಲೇಬೇಕು.',
          ],
        },
      };
    }

    if (notice.sampleKey === 'gst_drc01') {
      return {
        ...notice,
        title: 'GST ಕಾರಣ ಕೇಳುವ ನೋಟಿಸ್ (ಫಾರ್ಮ್ GST DRC-01)',
        authorityName: 'ಸಹಾಯಕ ಆಯುಕ್ತರು, ವಾಣಿಜ್ಯ ತೆರಿಗೆ (GST ಕಚೇರಿ LGSTO-020), ಬೆಂಗಳೂರು',
        authenticity: {
          ...notice.authenticity,
          summary:
            'ಅಸಲಿ ಸರ್ಕಾರಿ ನೋಟಿಸ್ — ಅಧಿಕೃತ DIN ಸಂಖ್ಯೆ ಇದೆ, @gst.gov.in ಇಮೇಲ್‌ನಿಂದ ಬಂದಿದೆ ಮತ್ತು ಸರ್ಕಾರಿ ಪೋರ್ಟಲ್‌ನಲ್ಲೇ ಪಾವತಿ ಕೇಳಿದೆ.',
          dinCheckNote: 'ಅಧಿಕೃತ DIN CBIC-2026-10-4918273645 ಮುದ್ರಿತವಾಗಿದೆ.',
          domainCheckNote: 'ಅಧಿಕೃತ ಸರ್ಕಾರಿ GST ಇಮೇಲ್ (@gst.gov.in).',
          paymentCheckNote: 'ಸುರಕ್ಷಿತ: ಕೇವಲ services.gst.gov.in ನಲ್ಲಿ ಮಾತ್ರ, ಯಾವುದೇ ಖಾಸಗಿ ಖಾತೆಗೆ ಅಲ್ಲ.',
        },
        lawSection: 'CGST / KGST ಕಾಯ್ದೆ 2017 ರ ಸೆಕ್ಷನ್ 73(1) (ಫಾರ್ಮ್ DRC-01)',
        lawPlainExplanation:
          'ನೀವು ಪಡೆದ GST ಕ್ರೆಡಿಟ್ ಮತ್ತು ಸರಬರಾಜುದಾರರು ಅಪ್‌ಲೋಡ್ ಮಾಡಿದ ಬಿಲ್‌ಗಳ ನಡುವಿನ ವ್ಯತ್ಯಾಸಕ್ಕೆ ಅಧಿಕಾರಿ ವಿವರಣೆ ಕೇಳುತ್ತಿದ್ದಾರೆ.',
        whatIsAskedLines: [
          'ನಿಮ್ಮ GST ರಿಟರ್ನ್‌ನಲ್ಲಿ ಸರಬರಾಜುದಾರರ ದಾಖಲೆಗಿಂತ ₹15,200 ಹೆಚ್ಚು ಕ್ರೆಡಿಟ್ ಕಂಡುಬಂದಿದೆ.',
          'ನಿಮ್ಮ ಖರೀದಿ ಬಿಲ್, ಲಾರಿ ರಸೀದಿ ಮತ್ತು ಬ್ಯಾಂಕ್ ಪಾವತಿ ದಾಖಲೆಯನ್ನು ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.',
          'ಅಥವಾ ತಪ್ಪಾಗಿ ಕ್ಲೈಮ್ ಆಗಿದ್ದರೆ 30 ದಿನದೊಳಗೆ ₹18,500 ಪಾವತಿಸಿ.',
        ],
        amountBreakdown: 'ತೆರಿಗೆ: ₹15,200 · ಬಡ್ಡಿ: ₹1,800 · ದಂಡ: ₹1,500 (ಒಟ್ಟು: ₹18,500)',
        severityReason:
          'ಉತ್ತರಿಸಲು ಸಮಯವಿದೆ — ಸರಿಯಾದ ಖರೀದಿ ಬಿಲ್ ತೋರಿಸಿದರೆ ನೀವು ಈ ಹಣ ಕಟ್ಟಬೇಕಾಗಿಲ್ಲ.',
        deadlineCalculationBasis: localizedCalcBasis,
        ignoreTimeline: [
          {
            timeframe: '5 ನವೆಂ 2026 ನಂತರ',
            title: 'ಏಕಪಕ್ಷೀಯ ಅಂತಿಮ ತೆರಿಗೆ ಆದೇಶ (DRC-07)',
            detail: 'ಉತ್ತರಿಸದಿದ್ದರೆ ₹18,500 ಬಿಲ್ ಅನ್ನು ಅಧಿಕಾರಿ ಅಂತಿಮಗೊಳಿಸುತ್ತಾರೆ.',
          },
          {
            timeframe: '1 ರಿಂದ 3 ತಿಂಗಳ ನಂತರ',
            title: 'ವಾರ್ಷಿಕ 18% ಬಡ್ಡಿ ಏರಿಕೆ',
            detail: '₹15,200 ಮೇಲೆ ಪ್ರತಿದಿನ ಬಡ್ಡಿ ಸೇರಿಸಲಾಗುತ್ತದೆ.',
          },
          {
            timeframe: '3 ತಿಂಗಳ ನಂತರ',
            title: 'ಇ-ವೇ ಬಿಲ್ ಸ್ಥಗಿತ ಮತ್ತು ಬ್ಯಾಂಕ್ ವಸೂಲಿ',
            detail: 'ಅಂಗಡಿಯ ಸರಕು ಸಾಗಾಟದ ಇ-ವೇ ಬಿಲ್ ನಿಲ್ಲಬಹುದು ಮತ್ತು ಬ್ಯಾಂಕ್ ಖಾತೆಯಿಂದ ಹಣ ಕಡಿತವಾಗಬಹುದು.',
          },
        ],
        documentsChecklist: notice.documentsChecklist.map((d, i) => ({
          ...d,
          label:
            [
              'ನಿಮ್ಮ GSTR-3B ಮತ್ತು ಸರಬರಾಜುದಾರರ GSTR-2B ಹೋಲಿಕೆ ಪಟ್ಟಿ',
              'ಸರಬರಾಜುದಾರರ ಮೂಲ GST ಖರೀದಿ ಬಿಲ್‌ಗಳು',
              'ಇ-ವೇ ಬಿಲ್ ಮತ್ತು ಸಾಗಾಟದ ಲಾರಿ ರಸೀದಿಗಳು',
              'ಸರಬರಾಜುದಾರರಿಗೆ ಬ್ಯಾಂಕ್ ಮೂಲಕ ಹಣ ಕೊಟ್ಟ ಸ್ಟೇಟ್‌ಮೆಂಟ್',
            ][i] || d.label,
          detail: undefined,
        })),
        advisorGuidance: {
          verdict: 'Maybe',
          roleLabel: 'ಚಾರ್ಟರ್ಡ್ ಅಕೌಂಟೆಂಟ್ (CA)',
          reasons: [
            'ನಿಮ್ಮ CA ರಮೇಶ್ ಪ್ರತಿ ತಿಂಗಳು GST ಸಲ್ಲಿಸುತ್ತಿದ್ದರೆ ಇದನ್ನು ಅವರಿಗೆ WhatsApp ಮಾಡಿ, ಅವರು DRC-06 ಸಲ್ಲಿಸುತ್ತಾರೆ.',
            'ಇದಕ್ಕೆ ಕೋರ್ಟ್ ವಕೀಲರ ಅಗತ್ಯವಿಲ್ಲ.',
          ],
        },
      };
    }

    if (notice.sampleKey === 'it_143_1') {
      return {
        ...notice,
        title: 'ಆದಾಯ ತೆರಿಗೆ ಮಾಹಿತಿ ಪತ್ರ — ಸೆಕ್ಷನ್ 143(1)',
        authorityName: 'ಆದಾಯ ತೆರಿಗೆ ಇಲಾಖೆ (CPC ಬೆಂಗಳೂರು)',
        authenticity: {
          ...notice.authenticity,
          summary:
            'ಅಸಲಿ ಕಂಪ್ಯೂಟರ್ ಮಾಹಿತಿ — CPC ಬೆಂಗಳೂರು ಉಲ್ಲೇಖ ಸಂಖ್ಯೆ ಮತ್ತು @cpc.incometax.gov.in ಇಮೇಲ್ ಇದೆ.',
          dinCheckNote: 'ಅಧಿಕೃತ CPC ಸಂಖ್ಯೆ CPC/2627/A6/2491827345 ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಲಭ್ಯವಿದೆ.',
          domainCheckNote: 'ಅಧಿಕೃತ ಆದಾಯ ತೆರಿಗೆ ಇಲಾಖೆ (.gov.in) ಇಮೇಲ್.',
          paymentCheckNote: 'ಸುರಕ್ಷಿತ: ಯಾವುದೇ ಖಾಸಗಿ ಬ್ಯಾಂಕ್ ಖಾತೆ ಕೇಳಿಲ್ಲ.',
        },
        lawSection: 'ಆದಾಯ ತೆರಿಗೆ ಕಾಯ್ದೆ 1961 ರ ಸೆಕ್ಷನ್ 143(1)',
        lawPlainExplanation:
          'ಇದು ನೀವು ಸಲ್ಲಿಸಿದ ಆದಾಯ ತೆರಿಗೆ ರಿಟರ್ನ್ ಮತ್ತು ಪೋರ್ಟಲ್‌ನಲ್ಲಿರುವ TDS ದಾಖಲೆಯ ಸ್ವಯಂಚಾಲಿತ ಕಂಪ್ಯೂಟರ್ ಹೋಲಿಕೆಯಾಗಿದೆ.',
        whatIsAskedLines: [
          'ನಿಮ್ಮ ಫಾರ್ಮ್ 26AS ನಲ್ಲಿ ₹6,400 ಕಡಿಮೆ TDS ಕ್ರೆಡಿಟ್ ಕಂಡುಬಂದಿದೆ.',
          'ನಿಮ್ಮ ಸಗಟು ಖರೀದಿದಾರರು ಈಗ TDS ಅಪ್‌ಡೇಟ್ ಮಾಡಿದ್ದಾರೆಯೇ ಎಂದು ಪರಿಶೀಲಿಸಿ.',
          'ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಉಚಿತ ಮರು-ಪರಿಶೀಲನೆಗೆ (Rectification) ಅರ್ಜಿ ಹಾಕಿ ಅಥವಾ ತಪ್ಪಾಗಿದ್ದರೆ ₹6,400 ಕಟ್ಟಿ.',
        ],
        amountBreakdown: 'TDS ವ್ಯತ್ಯಾಸ: ₹6,150 · ಬಡ್ಡಿ: ₹250 (ಒಟ್ಟು: ₹6,400)',
        severityReason:
          'ಇದು ದಾಳಿ ಅಥವಾ ತನಿಖೆಯಲ್ಲ, ಸಾಮಾನ್ಯ ಕಂಪ್ಯೂಟರ್ ಮಾಹಿತಿ ಮತ್ತು ಇನ್ನೂ 25 ದಿನ ಸಮಯವಿದೆ.',
        deadlineCalculationBasis: localizedCalcBasis,
        ignoreTimeline: [
          {
            timeframe: '18 ನವೆಂ 2026 ನಂತರ',
            title: 'ತಿಂಗಳಿಗೆ 1% ಬಡ್ಡಿ ಪ್ರಾರಂಭ',
            detail: '₹6,400 ಮೇಲೆ ತಿಂಗಳಿಗೆ ಸುಮಾರು ₹64 ಬಡ್ಡಿ ಸೇರುತ್ತದೆ.',
          },
          {
            timeframe: 'ಮುಂದಿನ ರಿಟರ್ನ್‌ನಲ್ಲಿ',
            title: 'ಮುಂದಿನ ರಿಫಂಡ್‌ನಲ್ಲಿ ಕಡಿತ',
            detail: 'ಮುಂದಿನ ವರ್ಷ ಬರುವ ತೆರಿಗೆ ರಿಫಂಡ್‌ನಿಂದ ₹6,400 ಕಡಿತಗೊಳಿಸಲಾಗುತ್ತದೆ.',
          },
          {
            timeframe: '6 ತಿಂಗಳ ನಂತರ',
            title: 'ಪೋರ್ಟಲ್ ನೆನಪಿನ ಇಮೇಲ್',
            detail: 'ಬಾಕಿ ಮೊತ್ತದ ಬಗ್ಗೆ ಉತ್ತರಿಸಲು ಇಮೇಲ್ ಬರುತ್ತದೆ.',
          },
        ],
        documentsChecklist: notice.documentsChecklist.map((d, i) => ({
          ...d,
          label:
            [
              'ಇತ್ತೀಚಿನ ಫಾರ್ಮ್ 26AS ಮತ್ತು AIS ತೆರಿಗೆ ಸ್ಟೇಟ್‌ಮೆಂಟ್',
              'ಗ್ರಾಹಕರು ನೀಡಿದ ಫಾರ್ಮ್ 16A TDS ಪ್ರಮಾಣಪತ್ರ',
              'ಈ ವರ್ಷ ಸಲ್ಲಿಸಿದ ಆದಾಯ ತೆರಿಗೆ ರಿಟರ್ನ್ ಪ್ರತಿ',
            ][i] || d.label,
          detail: undefined,
        })),
        advisorGuidance: {
          verdict: 'No',
          roleLabel: 'ಆನ್‌ಲೈನ್ ಪೋರ್ಟಲ್ (ಅಥವಾ CA ರಮೇಶ್‌ಗೆ ತೋರಿಸಿ)',
          reasons: [
            'ಸಣ್ಣ ₹6,400 TDS ವ್ಯತ್ಯಾಸಕ್ಕೆ ಆನ್‌ಲೈನ್ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ 5 ನಿಮಿಷದಲ್ಲಿ ಉಚಿತವಾಗಿ ಉತ್ತರಿಸಬಹುದು.',
            'ನಿಮ್ಮ ಪಾಸ್‌ವರ್ಡ್ CA ರಮೇಶ್ ಬಳಿ ಇದ್ದರೆ ಅವರಿಗೆ WhatsApp ಕಳುಹಿಸಿ.',
          ],
        },
      };
    }
  }

  return {
    ...notice,
    deadlineCalculationBasis: localizedCalcBasis,
  };
}

// ============================================================================
// 5. LOCALIZED TRANSACTIONS, ACCURACY RECORDS & CUSTOMER DATA HELPERS
// ============================================================================

export function getLocalizedTxTitle(tx: Transaction, lang: AppLanguage): string {
  return localizeTxTitle(tx, lang);
}

export function getLocalizedTxStatus(status: Transaction['status'], lang: AppLanguage): string {
  const t = TRANSLATIONS[lang];
  switch (status) {
    case 'overdue':
      return t.filterOverdue;
    case 'due_soon':
      return t.filterDueSoon;
    case 'partially_paid': {
      const m: Record<AppLanguage, string> = {
        en: 'Part Paid',
        kn: 'ಭಾಗಶಃ ಬಂದಿದೆ',
        hi: 'आंशिक मिला',
        ta: 'பகுதி வந்தது',
        te: 'పాక్షికంగా వచ్చింది',
        ml: 'ഭാഗികമായി ലഭിച്ചു',
      };
      return m[lang];
    }
    case 'paid': {
      const m: Record<AppLanguage, string> = {
        en: 'Paid',
        kn: 'ಪಾವತಿಸಲಾಗಿದೆ',
        hi: 'पूरा हुआ',
        ta: 'செலுத்தப்பட்டது',
        te: 'చెల్లించబడింది',
        ml: 'അടച്ചു',
      };
      return m[lang];
    }
    default:
      return t.filterExpected;
  }
}

export function getLocalizedAccuracyRecord(
  rec: ForecastAccuracyRecord,
  index: number,
  lang: AppLanguage
): { period: string; reason: string } {
  if (lang === 'en') {
    const plainEnReasons = [
      '₹700 extra railway parcel loading fee was paid in cash.',
      'Very close! Cauvery Mart and shop counter sales arrived right on time.',
      'Royal Kirana Stores delayed their ₹15,000 bill (INV-402) past 20 Oct.',
      'Today’s ₹30,000 cash matches your bank passbook.',
    ];
    return { period: rec.periodLabel, reason: plainEnReasons[index] || rec.explanation };
  }
  const mapByLang: Record<Exclude<AppLanguage, 'en'>, { periods: string[]; reasons: string[] }> = {
    kn: {
      periods: [
        'ವಾರ ೧ (೩ ಅಕ್ಟೋ – ೯ ಅಕ್ಟೋ ೨೦೨೬)',
        'ವಾರ ೨ (೧೦ ಅಕ್ಟೋ – ೧೬ ಅಕ್ಟೋ ೨೦೨೬)',
        'ವಾರ ೩ (೧೭ ಅಕ್ಟೋ – ೨೩ ಅಕ್ಟೋ ೨೦೨೬)',
        'ವಾರ ೪ (೨೫ ಅಕ್ಟೋ ೨೦೨೬ — ಇಂದು)',
      ],
      reasons: [
        'ರೈಲ್ವೆ ಪಾರ್ಸೆಲ್ ಕಚೇರಿಯಲ್ಲಿ ₹೭೦೦ ಹೆಚ್ಚುವರಿ ಕೂಲಿ ನಗದು ನೀಡಲಾಯಿತು.',
        'ಬಹಳ ನಿಖರ! ಕಾವೇರಿ ಮಾರ್ಟ್ ಮತ್ತು ಕೌಂಟರ್ ಮಾರಾಟ ಸಮಯಕ್ಕೆ ಬಂದಿದೆ.',
        'ರಾಯಲ್ ಕಿರಾಣಿ ಸ್ಟೋರ್ಸ್ ₹೧೫,೦೦೦ ಬಿಲ್ (ಬಿಲ್-೪೦೨) ಅನ್ನು ೨೦ ಅಕ್ಟೋ ನಂತರ ತಡ ಮಾಡಿದೆ.',
        'ಇಂದಿನ ₹೩೦,೦೦೦ ನಗದು ನಿಮ್ಮ ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್‌ಗೆ ಸಂಪೂರ್ಣ ಹೊಂದಿಕೆಯಾಗುತ್ತದೆ.',
      ],
    },
    hi: {
      periods: [
        'हफ़्ता १ (३ अक्टू – ९ अक्टू २०२६)',
        'हफ़्ता २ (१० अक्टू – १६ अक्टू २०२६)',
        'हफ़्ता ३ (१७ अक्टू – २३ अक्टू २०२६)',
        'हफ़्ता ४ (२५ अक्टू २०२६ — आज)',
      ],
      reasons: [
        'रेलवे पार्सल कार्यालय में ₹७०० अतिरिक्त माल ढुलाई नकद दी गई।',
        'बिल्कुल सटीक! कावेरी मार्ट और दुकान की बिक्री समय पर आई।',
        'रॉयल किराना स्टोर्स ने ₹१५,००० का बिल (बिल-४०२) २० अक्टू के बाद लटकाया।',
        'आज का ₹३०,००० बैलेंस बैंक पासबुक से पूरी तरह मिलता है।',
      ],
    },
    ta: {
      periods: [
        'வாரம் ௧ (௩ அக் – ௯ அக் ௨௦௨௬)',
        'வாரம் ௨ (௧௦ அக் – ௧௬ அக் ௨௦௨௬)',
        'வாரம் ௩ (௧௭ அக் – ௨௩ அக் ௨௦௨௬)',
        'வாரம் ௪ (௨௫ அக் ௨௦௨௬ — இன்று)',
      ],
      reasons: [
        'ரயில்வே பார்சல் அலுவலகத்தில் ₹௭௦௦ கூடுதல் சுமை கூலி ரொக்கமாக வழங்கப்பட்டது.',
        'மிகவும் துல்லியம்! காவேரி மார்ட் மற்றும் கடை விற்பனை நேரத்திற்கு வந்தது.',
        'ராயல் கிரானா ஸ்டோர்ஸ் ₹௧௫,௦௦௦ பில் (பில்-௪௦௨) ௨௦ அக் பிறகு தாமதமானது.',
        'இன்றைய ₹௩௦,௦௦௦ இருப்பு வங்கி கணக்குடன் முழுமையாகப் பொருந்துகிறது.',
      ],
    },
    te: {
      periods: [
        'వారం ౧ (౩ అక్టో – ౯ అక్టో ౨౦౨౬)',
        'వారం ౨ (౧౦ అక్టో – ౧౬ అక్టో ౨౦౨౬)',
        'వారం ౩ (౧౭ అక్టో – ౨౩ అక్టో ౨౦౨౬)',
        'వారం ౪ (౨౫ అక్టో ౨౦౨౬ — ఈరోజు)',
      ],
      reasons: [
        'రైల్వే పార్శిల్ ఆఫీసులో ₹౭౦౦ అదనపు కూలీ నగదు చెల్లించారు.',
        'చాలా ఖచ్చితం! కావేరి మార్ట్ మరియు షాపు అమ్మకాలు సమయానికి వచ్చాయి.',
        'రాయల్ కిరాణా స్టోర్స్ ₹౧౫,౦౦౦ బిల్లు (బిల్లు-౪౦౨) ౨౦ అక్టో తర్వాత ఆలస్యం చేశారు.',
        'ఈరోజు ₹౩౦,౦౦౦ నిల్వ బ్యాంక్ పాస్‌బుక్‌తో పూర్తిగా సరిపోలింది.',
      ],
    },
    ml: {
      periods: [
        'ആഴ്ച ൧ (൩ ഒക്ടോ – ൯ ഒക്ടോ ൨൦൨൬)',
        'ആഴ്ച ൨ (൧൦ ഒക്ടോ – ൧൬ ഒക്ടോ ൨൦൨൬)',
        'ആഴ്ച ൩ (൧൭ ഒക്ടോ – ൨൩ ഒക്ടോ ൨൦൨൬)',
        'ആഴ്ച ൪ (൨൫ ഒക്ടോ ൨൦൨൬ — ഇന്ന്)',
      ],
      reasons: [
        'റെയിൽവേ പാഴ്സൽ ഓഫീസിൽ ₹൭൦൦ അധിക ചുമട്ടുകൂലി നൽകി.',
        'വളരെ കൃത്യം! കാവേരി മാർട്ട്, കൗണ്ടർ വിൽപ്പന എന്നിവ സമയത്ത് ലഭിച്ചു.',
        'റോയൽ കിരാന സ്റ്റോഴ്സ് ₹൧൫,൦൦൦ ബിൽ (ബിൽ-൪൦൨) ൨൦ ഒക്ടോ കഴിഞ്ഞ് വൈകിപ്പിച്ചു.',
        'ഇന്നത്തെ ₹൩൦,൦൦൦ ബാലൻസ് ബാങ്ക് പാസ്ബുക്കുമായി പൂർണ്ണമായും ഒത്തുപോകുന്നു.',
      ],
    },
  };
  const entry = mapByLang[lang];
  return {
    period: entry.periods[index] || toNativeDigits(rec.periodLabel, lang),
    reason: entry.reasons[index] || toNativeDigits(rec.explanation, lang),
  };
}

export function getLocalizedCustomerNote(cust: CustomerProfile, lang: AppLanguage): string {
  if (lang === 'en') return cust.cautiousEstimate.uncertaintyReason;
  const party = localizePartyName(cust.name, lang);
  const expDate = formatShortDate(cust.cautiousEstimate.expectedSettlementDate, lang);
  const settledCount = cust.history.filter((h) => h.paidDate !== null).length;
  const cntStr = toNativeDigits(settledCount, lang);
  const avgStr = toNativeDigits(Math.round(cust.avgPaymentDelayDays), lang);

  if (settledCount === 0) {
    const newMap: Record<Exclude<AppLanguage, 'en'>, string> = {
      kn: `${party} ಹೊಸ ಗ್ರಾಹಕರು — ಇನ್ನೂ ಹಳೆಯ ಬಿಲ್ ದಾಖಲೆ ಇಲ್ಲ. ಸಾಮಾನ್ಯ ವ್ಯಾಪಾರದ ಅಭ್ಯಾಸದಂತೆ ಸುಮಾರು ${expDate} ವೇಳೆಗೆ ಹಣ ಬರಬಹುದು.`,
      hi: `${party} नए ग्राहक हैं — अभी पुराने बिलों का रिकॉर्ड नहीं है। सामान्य व्यापार अनुभव से लगभग ${expDate} तक पैसा आ सकता है।`,
      ta: `${party} புதிய வாடிக்கையாளர் — பழைய பில் பதிவு இல்லை. வழக்கமான நடைமுறைப்படி ${expDate} அளவில் பணம் வரலாம்.`,
      te: `${party} కొత్త కస్టమర్ — పాత బిల్లుల చరిత్ర లేదు. సాధారణ వ్యాపార అలవాటు ప్రకారం సుమారు ${expDate} నాటికి రావచ్చు.`,
      ml: `${party} പുതിയ ഇടപാടുകാരനാണ് — മുൻ ബിൽ രേഖകളില്ല. സാധാരണ ശീലമനുസരിച്ച് ഏകദേശം ${expDate} ഓടെ പണം ലഭിക്കാം.`,
    };
    return newMap[lang];
  }

  if (cust.avgPaymentDelayDays <= 1) {
    const onTimeMap: Record<Exclude<AppLanguage, 'en'>, string> = {
      kn: `ಹಿಂದಿನ ${cntStr} ಬಿಲ್‌ಗಳನ್ನು ಸಮಯಕ್ಕೆ ಸರಿಯಾಗಿ ಕೊಟ್ಟಿದ್ದಾರೆ. ಮುಂದಿನ ಪಾವತಿ ${expDate} ವೇಳೆಗೆ ಬರುವ ನಿರೀಕ್ಷೆ ಇದೆ.`,
      hi: `पिछले ${cntStr} बिल समय पर चुकाए हैं। अगला भुगतान ${expDate} के आसपास मिलने की उम्मीद है।`,
      ta: `கடந்த ${cntStr} பில்களை நேரத்திற்குச் செலுத்தியுள்ளார். அடுத்த வரவு ${expDate} அன்று எதிர்பார்க்கப்படுகிறது.`,
      te: `గత ${cntStr} బిల్లులను సమయానికి చెల్లించారు. తదుపరి చెల్లింపు ${expDate} నాటికి ఆశించవచ్చు.`,
      ml: `കഴിഞ്ഞ ${cntStr} ബില്ലുകളും കൃത്യസമയത്ത് അടച്ചു. അടുത്ത തുക ${expDate} ഓടെ പ്രതീക്ഷിക്കാം.`,
    };
    return onTimeMap[lang];
  }

  const delayMap: Record<Exclude<AppLanguage, 'en'>, string> = {
    kn: `ಹಿಂದಿನ ${cntStr} ಬಿಲ್‌ಗಳಲ್ಲಿ ಸಾಮಾನ್ಯವಾಗಿ ಸುಮಾರು ${avgStr} ದಿನ ತಡವಾಗಿ ಪಾವತಿಸಿದ್ದಾರೆ. ಹೀಗಾಗಿ ಹಣ ${expDate} ವೇಳೆಗೆ ಬರಬಹುದು.`,
    hi: `पिछले ${cntStr} बिलों में औसतन ${avgStr} दिन बाद पैसे भेजे हैं। इसलिए भुगतान ${expDate} के आसपास आ सकता है।`,
    ta: `கடந்த ${cntStr} பில்களில் சராசரியாக ${avgStr} நாட்கள் தாமதமாகச் செலுத்தியுள்ளார். எனவே ${expDate} அளவில் வரலாம்.`,
    te: `గత ${cntStr} బిల్లులలో సగటున ${avgStr} రోజులు ఆలస్యంగా చెల్లించారు. కాబట్టి ${expDate} నాటికి రావచ్చు.`,
    ml: `കഴിഞ്ഞ ${cntStr} ബില്ലുകളിൽ ശരാശരി ${avgStr} ദിവസം വൈകിയാണ് പണം നൽകിയത്. അതിനാൽ ${expDate} ഓടെ ലഭിക്കാം.`,
  };
  return delayMap[lang];
}

// ============================================================================
// 6. MUNIMJI SPOKEN SCRIPTS & WHATSAPP TEMPLATES (EN / HI / KN)
// ============================================================================

export function buildPersonalSummarySpeech(
  lang: AppLanguage,
  urgentCount: number,
  nearestDaysLeft: number,
  hasShortfall: boolean,
  shortfallDateReadable: string
): string {
  if (lang === 'hi') {
    if (urgentCount > 0 && hasShortfall) {
      return `शर्मा जी, आपके पास ${urgentCount} ज़रूरी नोटिस है। आख़िरी तारीख़ में ${nearestDaysLeft} दिन बाकी हैं। साथ ही, ${shortfallDateReadable} को आपके पास पैसे कम पड़ सकते हैं। क्या मैं पहले यह नोटिस समझाऊं?`;
    }
    if (urgentCount > 0) {
      return `शर्मा जी, आपके पास ${urgentCount} ज़रूरी नोटिस है। आख़िरी तारीख़ में ${nearestDaysLeft} दिन बाकी हैं। क्या मैं यह नोटिस समझाऊं?`;
    }
    return `शर्मा जी, आज कोई नया ज़रूरी नोटिस नहीं है। ${
      hasShortfall ? `${shortfallDateReadable} को पैसे कम पड़ सकते हैं।` : 'आपका खाता सुरक्षित है।'
    }`;
  }

  if (lang === 'kn') {
    if (urgentCount > 0 && hasShortfall) {
      return `ಶರ್ಮಾ ಜಿ, ನಿಮಗೆ ${urgentCount} ತುರ್ತು ನೋಟಿಸ್ ಬಂದಿದೆ. ಕೊನೆಯ ದಿನಾಂಕಕ್ಕೆ ${nearestDaysLeft} ದಿನ ಬಾಕಿ ಇದೆ. ಹಾಗೆಯೇ, ${shortfallDateReadable} ರಂದು ನಿಮಗೆ ಹಣ ಕಡಿಮೆ ಬೀಳಬಹುದು. ನಾನು ಈ ನೋಟಿಸ್ ವಿವರಿಸಲೇ?`;
    }
    if (urgentCount > 0) {
      return `ಶರ್ಮಾ ಜಿ, ನಿಮಗೆ ${urgentCount} ತುರ್ತು ನೋಟಿಸ್ ಬಂದಿದೆ. ಕೊನೆಯ ದಿನಾಂಕಕ್ಕೆ ${nearestDaysLeft} ದಿನ ಬಾಕಿ ಇದೆ. ನಾನು ವಿವರಿಸಲೇ?`;
    }
    return `ಶರ್ಮಾ ಜಿ, ಇಂದು ಯಾವುದೇ ತುರ್ತು ನೋಟಿಸ್ ಇಲ್ಲ. ${
      hasShortfall ? `${shortfallDateReadable} ರಂದು ಹಣ ಕಡಿಮೆ ಬೀಳಬಹುದು.` : 'ನಿಮ್ಮ ಖಾತಾ ಸುರಕ್ಷಿತವಾಗಿದೆ.'
    }`;
  }

  if (urgentCount > 0 && hasShortfall) {
    return `Sharma ji, you have ${urgentCount} urgent notice. The last date is in ${nearestDaysLeft} days. Also, you may run short of money on ${shortfallDateReadable}. Shall I explain the notice?`;
  }
  if (urgentCount > 0) {
    return `Sharma ji, you have ${urgentCount} urgent notice. The last date is in ${nearestDaysLeft} days. Shall I explain the notice?`;
  }
  return `Sharma ji, you have no urgent notices due this week. ${
    hasShortfall
      ? `You may run short of money on ${shortfallDateReadable}.`
      : 'Your shop money looks safe this week.'
  }`;
}

export function buildNoticeExplanationSpeech(
  notice: LegalNotice,
  daysLeft: number,
  lang: AppLanguage
): string {
  const localized = getLocalizedNotice(notice, lang);
  const amt = formatRupee(localized.amountDemanded, lang);
  const due = formatLocalDate(localized.deadlineDate, lang);

  if (lang === 'hi') {
    if (localized.sampleKey === 'ni_138_cheque') {
      return `शर्मा जी, यह चेक बाउंस का ज़रूरी कानूनी नोटिस है। इसे डेक्कन फ्रेट के वकील ने भेजा है। ${amt} का चेक बाउंस हुआ था। कोर्ट केस से बचने के लिए ${due} से पहले, यानी ${daysLeft} दिन के अंदर ${amt} का भुगतान या वकील से जवाब भेजना ज़रूरी है।`;
    }
    if (localized.sampleKey === 'gst_drc01') {
      return `शर्मा जी, यह GST विभाग का असली नोटिस है। आपके GST रिटर्न में ${amt} का अंतर दिखा है। घबराएं नहीं, ${due} तक अपने खरीद बिल और बैंक पेमेंट की रसीद अपलोड कर दें।`;
    }
    if (localized.sampleKey === 'it_143_1') {
      return `शर्मा जी, यह इनकम टैक्स कंप्यूटर की सामान्य सूचना है। इसमें ${amt} का TDS अंतर दिखा है। आख़िरी तारीख़ ${due} है, यानी अभी ${daysLeft} दिन बाकी हैं।`;
    }
    return `शर्मा जी, यह नोटिस ${localized.authorityName} से आया है। इसमें ${amt} की मांग है और आख़िरी तारीख़ ${due} (${daysLeft} दिन बाकी) है। ${localized.whatIsAskedLines[0] || ''}`;
  }

  if (lang === 'kn') {
    if (localized.sampleKey === 'ni_138_cheque') {
      return `ಶರ್ಮಾ ಜಿ, ಇದು ಚೆಕ್ ಬೌನ್ಸ್ ಕುರಿತ ತುರ್ತು ನೋಟಿಸ್. ಡೆಕ್ಕನ್ ಫ್ರೈಟ್ ಕಂಪನಿಯ ವಕೀಲರು ಕಳುಹಿಸಿದ್ದಾರೆ. ಕೋರ್ಟ್ ಕೇಸ್ ತಪ್ಪಿಸಲು ${due} ಒಳಗೆ, ಅಂದರೆ ಇನ್ನು ${daysLeft} ದಿನಗಳಲ್ಲಿ ${amt} ಪಾವತಿಸಬೇಕು ಅಥವಾ ವಕೀಲರ ಮೂಲಕ ಉತ್ತರಿಸಬೇಕು.`;
    }
    if (localized.sampleKey === 'gst_drc01') {
      return `ಶರ್ಮಾ ಜಿ, ಇದು GST ಇಲಾಖೆಯ ನೋಟಿಸ್. ನಿಮ್ಮ GST ಲೆಕ್ಕದಲ್ಲಿ ${amt} ವ್ಯತ್ಯಾಸ ಕಂಡುಬಂದಿದೆ. ಗಾಬರಿ ಬೇಡ, ${due} ಒಳಗೆ ನಿಮ್ಮ ಖರೀದಿ ಬಿಲ್ ಮತ್ತು ಬ್ಯಾಂಕ್ ರಸೀದಿ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.`;
    }
    if (localized.sampleKey === 'it_143_1') {
      return `ಶರ್ಮಾ ಜಿ, ಇದು ಆದಾಯ ತೆರಿಗೆ ಇಲಾಖೆಯ ಸಾಮಾನ್ಯ ಕಂಪ್ಯೂಟರ್ ಮಾಹಿತಿ. ${amt} TDS ವ್ಯತ್ಯಾಸ ತೋರಿಸುತ್ತಿದೆ. ಕೊನೆಯ ದಿನಾಂಕ ${due}, ಇನ್ನು ${daysLeft} ದಿನ ಸಮಯವಿದೆ.`;
    }
    return `ಶರ್ಮಾ ಜಿ, ಈ ನೋಟಿಸ್ ${localized.authorityName} ಅವರಿಂದ ಬಂದಿದೆ. ಮೊತ್ತ ${amt}, ಮತ್ತು ಕೊನೆಯ ದಿನಾಂಕ ${due} (${daysLeft} ದಿನ ಬಾಕಿ ಇದೆ).`;
  }

  return `Sharma ji, this notice was sent by ${localized.authorityName}. ${
    localized.whatIsAskedLines[0] || localized.lawPlainExplanation
  } It is marked ${localized.severity.toLowerCase()}. Your last date is ${due}, which means ${daysLeft} days left.`;
}

export function buildWhatsAppNoticeMessage(
  personName: string,
  notice: LegalNotice,
  businessName: string,
  lang: AppLanguage
): string {
  const localized = getLocalizedNotice(notice, lang);
  const amt =
    localized.amountDemanded > 0 ? formatRupee(localized.amountDemanded, lang) : formatRupee(0, lang);
  const due = formatLocalDate(localized.deadlineDate, lang);
  const personLoc = localizePartyName(personName, lang);
  const cleanShop = businessName.replace(/\s*\[Demo\]\s*/gi, '').trim() || businessName;
  const shopLoc = localizeBusinessLabel(cleanShop, lang);
  const refLoc = localizeInvoiceCode(localized.referenceNumber, lang);
  const summaryLine = toNativeDigits(
    localized.whatIsAskedLines[0] || localized.lawPlainExplanation,
    lang
  );

  if (lang === 'hi') {
    return `नमस्ते ${personLoc} जी,\n${shopLoc} को एक नोटिस मिला है, कृपया देख लें:\n\n• नोटिस: ${toNativeDigits(localized.title, lang)} (${refLoc})\n• किसने भेजा: ${toNativeDigits(localized.authorityName, lang)}\n• राशि: ${amt}\n• आख़िरी तारीख़: ${due}\n• सार: ${summaryLine}\n\nकृपया बताएं हमें आगे क्या करना चाहिए। धन्यवाद!`;
  }
  if (lang === 'kn') {
    return `ನಮಸ್ಕಾರ ${personLoc} ಅವರೇ,\n${shopLoc} ಗೆ ಒಂದು ನೋಟಿಸ್ ಬಂದಿದೆ, ದಯವಿಟ್ಟು ಪರಿಶೀಲಿಸಿ:\n\n• ನೋಟಿಸ್: ${toNativeDigits(localized.title, lang)} (${refLoc})\n• ಕಳುಹಿಸಿದವರು: ${toNativeDigits(localized.authorityName, lang)}\n• ಮೊತ್ತ: ${amt}\n• ಕೊನೆಯ ದಿನಾಂಕ: ${due}\n• ವಿವರ: ${summaryLine}\n\nಮುಂದೆ ಏನು ಮಾಡಬೇಕೆಂದು ದಯವಿಟ್ಟು ತಿಳಿಸಿ. ಧನ್ಯವಾದಗಳು!`;
  }
  if (lang === 'ta') {
    return `வணக்கம் ${personLoc} அவர்களே,\n${shopLoc} நிறுவனத்திற்கு ஒரு நோட்டீஸ் வந்துள்ளது, தயவுசெய்து சரிபார்க்கவும்:\n\n• நோட்டீஸ்: ${toNativeDigits(localized.title, lang)} (${refLoc})\n• அனுப்பியவர்: ${toNativeDigits(localized.authorityName, lang)}\n• தொகை: ${amt}\n• கடைசி தேதி: ${due}\n• சுருக்கம்: ${summaryLine}\n\nஅடுத்த கட்ட நடவடிக்கையை வழிகாட்டவும். நன்றி!`;
  }
  if (lang === 'te') {
    return `నమస్కారం ${personLoc} గారు,\n${shopLoc} కు ఒక నోటీసు వచ్చింది, దయచేసి పరిశీలించండి:\n\n• నోటీసు: ${toNativeDigits(localized.title, lang)} (${refLoc})\n• పంపినవారు: ${toNativeDigits(localized.authorityName, lang)}\n• మొత్తం: ${amt}\n• చివరి తేదీ: ${due}\n• సారాంశం: ${summaryLine}\n\nతదుపరి ఏమి చేయాలో సూచించగలరు. ధన్యవాదాలు!`;
  }
  if (lang === 'ml') {
    return `നമസ്കാരം ${personLoc},\n${shopLoc} ന് ഒരു നോട്ടീസ് ലഭിച്ചിട്ടുണ്ട്, ദയവായി പരിശോധിക്കുക:\n\n• നോട്ടീസ്: ${toNativeDigits(localized.title, lang)} (${refLoc})\n• അയച്ചത്: ${toNativeDigits(localized.authorityName, lang)}\n• തുക: ${amt}\n• അവസാന തീയതി: ${due}\n• സംഗ്രഹം: ${summaryLine}\n\nഅടുത്തതായി എന്ത് ചെയ്യണമെന്ന് നിർദ്ദേശിക്കുക. നന്ദി!`;
  }

  return `Namaste ${personName},\n${cleanShop} received a notice. Please check these details:\n\n• Notice: ${localized.title} (${localized.referenceNumber})\n• Sent by: ${localized.authorityName}\n• Amount asked: ${amt}\n• Last date: ${due}\n• Summary: ${localized.whatIsAskedLines[0] || localized.lawPlainExplanation}\n\nPlease guide us on the next step. Thank you!`;
}

export function buildCustomerReminderWhatsApp(
  customerName: string,
  invoiceNo: string,
  amount: number,
  dueDateStr: string,
  businessName: string,
  lang: AppLanguage
): string {
  const amt = formatRupee(amount, lang);
  const due = formatLocalDate(dueDateStr, lang);
  const custLoc = localizePartyName(customerName, lang);
  const invLoc = localizeInvoiceCode(invoiceNo, lang);
  const cleanShopRaw = businessName.replace(/\s*\[Demo\]\s*/gi, '').trim() || businessName;
  const shopLoc = localizeBusinessLabel(cleanShopRaw, lang);

  if (lang === 'hi') {
    return `नमस्ते ${custLoc} जी, ${shopLoc} की ओर से विनम्र स्मरण। आपका बिल #${invLoc} राशि ${amt} (देय तिथि ${due}) अभी बाकी है। कृपया आज यूपीआई या बैंक ट्रांसफर से भुगतान कर सहयोग करें। धन्यवाद!`;
  }
  if (lang === 'kn') {
    return `ನಮಸ್ಕಾರ ${custLoc}, ${shopLoc} ಕಡೆಯಿಂದ ವಿನಮ್ರ ನೆನಪು. ನಿಮ್ಮ ಬಿಲ್ #${invLoc} ಮೊತ್ತ ${amt} (ಗಡುವು ದಿನಾಂಕ ${due}) ಬಾಕಿ ಇದೆ. ದಯವಿಟ್ಟು ಇಂದು ಯುಪಿಐ ಅಥವಾ ಬ್ಯಾಂಕ್ ಮೂಲಕ ಪಾವತಿಸಿ ಸಹಕರಿಸಿ. ಧನ್ಯವಾದಗಳು!`;
  }
  if (lang === 'ta') {
    return `வணக்கம் ${custLoc}, ${shopLoc} சார்பாக அன்பான நினைவூட்டல். உங்கள் பில் #${invLoc} தொகை ${amt} (கெடு தேதி ${due}) நிலுவையில் உள்ளது. தயவுசெய்து இன்று யுபிஐ அல்லது வங்கி மூலம் செலுத்தி உதவவும். நன்றி!`;
  }
  if (lang === 'te') {
    return `నమస్కారం ${custLoc}, ${shopLoc} నుండి వినయపూర్వక రిమైండర్. మీ బిల్లు #${invLoc} మొత్తం ${amt} (గడువు తేదీ ${due}) పెండింగ్‌లో ఉంది. దయచేసి ఈరోజు యూపీఐ లేదా బ్యాంక్ ద్వారా చెల్లించగలరు. ధన్యవాదాలు!`;
  }
  if (lang === 'ml') {
    return `നമസ്കാരം ${custLoc}, ${shopLoc} നൽകുന്ന സ്നേഹപൂർവ്വമായ ഓർമ്മപ്പെടുത്തൽ. നിങ്ങളുടെ ബിൽ #${invLoc} തുക ${amt} (അവസാന തീയതി ${due}) കുടിശ്ശികയാണ്. ദയവായി ഇന്ന് യുപിഐ അല്ലെങ്കിൽ ബാങ്ക് വഴി അടച്ച് സഹകരിക്കുക. നന്ദി!`;
  }
  return `Namaste ${customerName}, friendly reminder from ${cleanShopRaw}. Bill #${invoiceNo} for ${amt} (due ${due}) is pending. Kindly clear it today via UPI or NEFT. Thank you!`;
}

// ============================================================================
// 7. EXTENDED MULTILINGUAL HELPERS FOR SUB-TOOLS, MODALS & VOICE COMMANDS
// ============================================================================

export function getLocalizedBusinessName(name: string, lang: AppLanguage): string {
  return localizeBusinessLabel(name, lang);
}

export function getLocalizedWhatIfPresets(lang: AppLanguage) {
  const mapDigits = <T extends { name: string; shortDescription: string; additionalPurchaseName?: string }[]>(
    items: T
  ): T =>
    items.map((item) => ({
      ...item,
      name: toNativeDigits(item.name, lang),
      shortDescription: toNativeDigits(item.shortDescription, lang),
      ...(item.additionalPurchaseName
        ? { additionalPurchaseName: toNativeDigits(item.additionalPurchaseName, lang) }
        : {}),
    })) as T;

  if (lang === 'hi') {
    return mapDigits([
      {
        id: 'scenario-delay-customer',
        name: 'ग्राहक 7 दिन देर से पैसे दे',
        shortDescription: 'श्री बालाजी सुपरमार्केट के ₹20,000, 31 अक्टू की जगह 7 नवं को आएं।',
        customerDelayDays: 7,
        targetCustomerName: 'Balaji',
        salesDropPercent: 0,
        unexpectedExpense: 0,
        rescheduledSupplierDays: 0,
      },
      {
        id: 'scenario-sales-drop',
        name: 'मासिक बिक्री 15% कम हो जाए',
        shortDescription: 'दुकान की वसूली और बिक्री में सामान्य गिरावट।',
        customerDelayDays: 0,
        salesDropPercent: 15,
        unexpectedExpense: 0,
        rescheduledSupplierDays: 0,
      },
      {
        id: 'scenario-emergency-expense',
        name: 'अचानक ₹10,000 मशीन मरम्मत खर्च',
        shortDescription: 'मसाला पीसने की मोटर या कोल्ड स्टोरेज की तुरंत मरम्मत।',
        customerDelayDays: 0,
        salesDropPercent: 0,
        unexpectedExpense: 10000,
        rescheduledSupplierDays: 0,
      },
      {
        id: 'scenario-additional-purchase',
        name: 'त्योहार के लिए ₹25,000 नया माल खरीदें',
        shortDescription: 'दिवाली से पहले इलायची का थोक माल खरीदने का असर देखें।',
        customerDelayDays: 0,
        salesDropPercent: 0,
        unexpectedExpense: 0,
        additionalPurchaseAmount: 25000,
        additionalPurchaseName: 'दिवाली थोक मसाला खरीद',
        rescheduledSupplierDays: 0,
      },
      {
        id: 'scenario-reschedule-supplier',
        name: 'सप्लायर बिल 5 दिन आगे बढ़ाएं',
        shortDescription: 'मलनाड एग्रो ₹40,000 का बिल 29 अक्टू से 3 नवं करने को मान जाए।',
        customerDelayDays: 0,
        salesDropPercent: 0,
        unexpectedExpense: 0,
        rescheduledSupplierDays: 5,
        targetSupplierName: 'Malnad',
      },
    ]);
  }

  if (lang === 'kn') {
    return mapDigits([
      {
        id: 'scenario-delay-customer',
        name: 'ಗ್ರಾಹಕರು 7 ದಿನ ತಡವಾಗಿ ಕೊಟ್ಟರೆ',
        shortDescription: 'ಶ್ರೀ ಬಾಲಾಜಿ ಸೂಪರ್‌ಮಾರ್ಕೆಟ್ ₹20,000 ಹಣ 31 ಅಕ್ಟೋ ಬದಲು 7 ನವೆಂಗೆ ಬಂದರೆ.',
        customerDelayDays: 7,
        targetCustomerName: 'Balaji',
        salesDropPercent: 0,
        unexpectedExpense: 0,
        rescheduledSupplierDays: 0,
      },
      {
        id: 'scenario-sales-drop',
        name: 'ತಿಂಗಳ ಮಾರಾಟ 15% ಕಡಿಮೆಯಾದರೆ',
        shortDescription: 'ಅಂಗಡಿಯ ಒಟ್ಟು ವಸೂಲಾತಿಯಲ್ಲಿ ನಿಧಾನಗತಿ ಉಂಟಾದರೆ.',
        customerDelayDays: 0,
        salesDropPercent: 15,
        unexpectedExpense: 0,
        rescheduledSupplierDays: 0,
      },
      {
        id: 'scenario-emergency-expense',
        name: 'ದಿಢೀರ್ ₹10,000 ಯಂತ್ರ ರಿಪೇರಿ ಖರ್ಚು',
        shortDescription: 'ಮಸಾಲೆ ಮಿಲ್ ಅಥವಾ ಕೋಲ್ಡ್ ಸ್ಟೋರೇಜ್ ಮೋಟಾರ್ ತಕ್ಷಣ ರಿಪೇರಿ ಬಂದರೆ.',
        customerDelayDays: 0,
        salesDropPercent: 0,
        unexpectedExpense: 10000,
        rescheduledSupplierDays: 0,
      },
      {
        id: 'scenario-additional-purchase',
        name: 'ಹಬ್ಬಕ್ಕೆ ₹25,000 ಹೊಸ ಸರಕು ಖರೀದಿ',
        shortDescription: 'ದೀಪಾವಳಿಗೆ ಮುನ್ನ ಏಲಕ್ಕಿ ಸಗಟು ಸರಕು ಖರೀದಿಸಿದರೆ ಆಗುವ ಪರಿಣಾಮ.',
        customerDelayDays: 0,
        salesDropPercent: 0,
        unexpectedExpense: 0,
        additionalPurchaseAmount: 25000,
        additionalPurchaseName: 'ದೀಪಾವಳಿ ಹಬ್ಬದ ಸರಕು ಖರೀದಿ',
        rescheduledSupplierDays: 0,
      },
      {
        id: 'scenario-reschedule-supplier',
        name: 'ಸರಬರಾಜುದಾರರ ಬಿಲ್ 5 ದಿನ ಮುಂದೂಡಿದರೆ',
        shortDescription: 'ಮಲ್ನಾಡ್ ಆಗ್ರೋ ₹40,000 ಬಿಲ್ 29 ಅಕ್ಟೋ ಬದಲು 3 ನವೆಂಗೆ ಒಪ್ಪಿದರೆ.',
        customerDelayDays: 0,
        salesDropPercent: 0,
        unexpectedExpense: 0,
        rescheduledSupplierDays: 5,
        targetSupplierName: 'Malnad',
      },
    ]);
  }

  if (lang === 'ta') {
    return mapDigits([
      {
        id: 'scenario-delay-customer',
        name: 'வாடிக்கையாளர் 7 நாள் தாமதமாகக் கொடுத்தால்',
        shortDescription: 'ஸ்ரீ பாலாஜி சூப்பர்மார்க்கெட் ₹20,000 தொகை 31 அக் பதில் 7 நவ அன்று வந்தால்.',
        customerDelayDays: 7,
        targetCustomerName: 'Balaji',
        salesDropPercent: 0,
        unexpectedExpense: 0,
        rescheduledSupplierDays: 0,
      },
      {
        id: 'scenario-sales-drop',
        name: 'மாத விற்பனை 15% குறைந்தால்',
        shortDescription: 'கடையின் மொத்த வசூலில் ஏற்படும் சாதாரண மந்தநிலை.',
        customerDelayDays: 0,
        salesDropPercent: 15,
        unexpectedExpense: 0,
        rescheduledSupplierDays: 0,
      },
      {
        id: 'scenario-emergency-expense',
        name: 'திடீர் ₹10,000 இயந்திரப் பழுது செலவு',
        shortDescription: 'மசாலா இயந்திரம் அல்லது குளிர்பதனப் பெட்டி உடனடி பழுது.',
        customerDelayDays: 0,
        salesDropPercent: 0,
        unexpectedExpense: 10000,
        rescheduledSupplierDays: 0,
      },
      {
        id: 'scenario-additional-purchase',
        name: 'பண்டிகைக்கு ₹25,000 கூடுதல் சரக்கு கொள்முதல்',
        shortDescription: 'தீபாவளிக்கு முன் ஏலக்காய் மொத்த கொள்முதல் செய்தால் ஏற்படும் மாற்றம்.',
        customerDelayDays: 0,
        salesDropPercent: 0,
        unexpectedExpense: 0,
        additionalPurchaseAmount: 25000,
        additionalPurchaseName: 'தீபாவளி மொத்த சரக்கு கொள்முதல்',
        rescheduledSupplierDays: 0,
      },
      {
        id: 'scenario-reschedule-supplier',
        name: 'சப்ளையர் பில்லை 5 நாள் தள்ளிவைத்தால்',
        shortDescription: 'மல்நாடு அக்ரோ ₹40,000 பில்லை 29 அக் பதில் 3 நவ அன்று கொடுக்க ஒப்புக்கொண்டால்.',
        customerDelayDays: 0,
        salesDropPercent: 0,
        unexpectedExpense: 0,
        rescheduledSupplierDays: 5,
        targetSupplierName: 'Malnad',
      },
    ]);
  }

  if (lang === 'te') {
    return mapDigits([
      {
        id: 'scenario-delay-customer',
        name: 'కస్టమర్ 7 రోజులు ఆలస్యంగా చెల్లిస్తే',
        shortDescription: 'శ్రీ బాలాజీ సూపర్‌మార్కెట్ ₹20,000 డబ్బు 31 అక్టో బదులు 7 నవం నాడు వస్తే.',
        customerDelayDays: 7,
        targetCustomerName: 'Balaji',
        salesDropPercent: 0,
        unexpectedExpense: 0,
        rescheduledSupplierDays: 0,
      },
      {
        id: 'scenario-sales-drop',
        name: 'నెలవారీ అమ్మకాలు 15% తగ్గితే',
        shortDescription: 'దుకాణం వసూళ్లలో సాధారణ తగ్గుదల ఏర్పడితే.',
        customerDelayDays: 0,
        salesDropPercent: 15,
        unexpectedExpense: 0,
        rescheduledSupplierDays: 0,
      },
      {
        id: 'scenario-emergency-expense',
        name: 'అకస్మాత్తుగా ₹10,000 మిషన్ రిపేర్ ఖర్చు',
        shortDescription: 'మసాలా మిల్లు లేదా కోల్డ్ స్టోరేజ్ మోటార్ అత్యవసర రిపేర్.',
        customerDelayDays: 0,
        salesDropPercent: 0,
        unexpectedExpense: 10000,
        rescheduledSupplierDays: 0,
      },
      {
        id: 'scenario-additional-purchase',
        name: 'పండుగ కోసం ₹25,000 అదనపు సరుకు కొనుగోలు',
        shortDescription: 'దీపావళికి ముందు యాలకుల హోల్‌సేల్ సరుకు కొంటే నగదుపై ప్రభావం.',
        customerDelayDays: 0,
        salesDropPercent: 0,
        unexpectedExpense: 0,
        additionalPurchaseAmount: 25000,
        additionalPurchaseName: 'దీపావళి హోల్‌సేల్ సరుకు కొనుగోలు',
        rescheduledSupplierDays: 0,
      },
      {
        id: 'scenario-reschedule-supplier',
        name: 'సప్లయర్ బిల్లును 5 రోజులు వాయిదా వేస్తే',
        shortDescription: 'మల్నాడ్ ఆగ్రో ₹40,000 బిల్లును 29 అక్టో బదులు 3 నవం నాడు తీసుకోవడానికి ఒప్పుకుంటే.',
        customerDelayDays: 0,
        salesDropPercent: 0,
        unexpectedExpense: 0,
        rescheduledSupplierDays: 5,
        targetSupplierName: 'Malnad',
      },
    ]);
  }

  if (lang === 'ml') {
    return mapDigits([
      {
        id: 'scenario-delay-customer',
        name: 'ഇടപാടുകാരൻ 7 ദിവസം വൈകി പണം നൽകിയാൽ',
        shortDescription: 'ശ്രീ ബാലാജി സൂപ്പർമാർക്കറ്റ് ₹20,000 തുക 31 ഒക്ടോ പകരം 7 നവം ന് ലഭിച്ചാൽ.',
        customerDelayDays: 7,
        targetCustomerName: 'Balaji',
        salesDropPercent: 0,
        unexpectedExpense: 0,
        rescheduledSupplierDays: 0,
      },
      {
        id: 'scenario-sales-drop',
        name: 'പ്രതിമാസ വിൽപ്പന 15% കുറഞ്ഞാൽ',
        shortDescription: 'കടയിലെ പൊതുവായ പിരിവിലും വിൽപ്പനയിലുമുണ്ടാകുന്ന കുറവ്.',
        customerDelayDays: 0,
        salesDropPercent: 15,
        unexpectedExpense: 0,
        rescheduledSupplierDays: 0,
      },
      {
        id: 'scenario-emergency-expense',
        name: 'പെട്ടെന്ന് ₹10,000 മെഷീൻ റിപ്പയർ ചെലവ്',
        shortDescription: 'മസാല മിൽ അല്ലെങ്കിൽ കോൾഡ് സ്റ്റോറേജ് മോട്ടോർ അടിയന്തര അറ്റകുറ്റപ്പണി.',
        customerDelayDays: 0,
        salesDropPercent: 0,
        unexpectedExpense: 10000,
        rescheduledSupplierDays: 0,
      },
      {
        id: 'scenario-additional-purchase',
        name: 'ഉത്സവത്തിന് ₹25,000 അധിക സ്റ്റോക്ക് വാങ്ങിയാൽ',
        shortDescription: 'ദീപാവലിക്ക് മുമ്പ് ഏലയ്ക്ക മൊത്തമായി വാങ്ങിയാലുള്ള മാറ്റം.',
        customerDelayDays: 0,
        salesDropPercent: 0,
        unexpectedExpense: 0,
        additionalPurchaseAmount: 25000,
        additionalPurchaseName: 'ദീപാവലി മൊത്തവ്യാപാര സ്റ്റോക്ക്',
        rescheduledSupplierDays: 0,
      },
      {
        id: 'scenario-reschedule-supplier',
        name: 'സപ്ലയർ ബിൽ 5 ദിവസം നീട്ടിവെച്ചാൽ',
        shortDescription: 'മൽനാട് അഗ്രോ ₹40,000 ബിൽ 29 ഒക്ടോ പകരം 3 നവം ന് നൽകാൻ സമ്മതിച്ചാൽ.',
        customerDelayDays: 0,
        salesDropPercent: 0,
        unexpectedExpense: 0,
        rescheduledSupplierDays: 5,
        targetSupplierName: 'Malnad',
      },
    ]);
  }

  return [
    {
      id: 'scenario-delay-customer',
      name: 'Customer pays 7 days late',
      shortDescription: 'Sri Balaji Supermarket ₹20,000 arrives on 7 Nov instead of 31 Oct.',
      customerDelayDays: 7,
      targetCustomerName: 'Balaji',
      salesDropPercent: 0,
      unexpectedExpense: 0,
      rescheduledSupplierDays: 0,
    },
    {
      id: 'scenario-sales-drop',
      name: 'Monthly sales drop by 15%',
      shortDescription: 'General slowdown in customer collections across your shop.',
      customerDelayDays: 0,
      salesDropPercent: 15,
      unexpectedExpense: 0,
      rescheduledSupplierDays: 0,
    },
    {
      id: 'scenario-emergency-expense',
      name: 'Sudden ₹10,000 machine repair',
      shortDescription: 'Cold storage or spice grinder motor needs immediate repair.',
      customerDelayDays: 0,
      salesDropPercent: 0,
      unexpectedExpense: 10000,
      rescheduledSupplierDays: 0,
    },
    {
      id: 'scenario-additional-purchase',
      name: 'Buy ₹25,000 extra festival stock',
      shortDescription: 'Test buying bulk cardamom stock early before Diwali.',
      customerDelayDays: 0,
      salesDropPercent: 0,
      unexpectedExpense: 0,
      additionalPurchaseAmount: 25000,
      additionalPurchaseName: 'Diwali Bulk Spice Stock',
      rescheduledSupplierDays: 0,
    },
    {
      id: 'scenario-reschedule-supplier',
      name: 'Move supplier bill +5 days later',
      shortDescription: 'Malnad Agro agrees to take ₹40,000 on 3 Nov instead of 29 Oct.',
      customerDelayDays: 0,
      salesDropPercent: 0,
      unexpectedExpense: 0,
      rescheduledSupplierDays: 5,
      targetSupplierName: 'Malnad',
    },
  ];
}

export function getLocalizedRemedyActions(lang: AppLanguage) {
  const mapDigits = <
    T extends Array<{
      id: string;
      title: string;
      mechanism: string;
      balanceImpact: string;
      financialEffect: string;
      tradeoff: string;
      isRecommended: boolean;
    }>,
  >(
    items: T
  ): T =>
    items.map((it) => ({
      ...it,
      title: toNativeDigits(it.title, lang),
      mechanism: toNativeDigits(it.mechanism, lang),
      balanceImpact: toNativeDigits(it.balanceImpact, lang),
      financialEffect: toNativeDigits(it.financialEffect, lang),
      tradeoff: toNativeDigits(it.tradeoff, lang),
    })) as T;

  if (lang === 'hi') {
    return mapDigits([
      {
        id: 'split_payment',
        title: 'सप्लायर का बिल आधा-आधा (50-50) दें',
        mechanism: '29 अक्टू को मलनाड एग्रो को ₹20,000 दें, और बाकी ₹20,000 ग्राहकों से पैसा आने के बाद 4 नवं को दें।',
        balanceImpact: '29 अक्टू को +₹20,000 नकद बचेंगे।',
        financialEffect: '₹750 बैंक बाउंस शुल्क बचेगा और ₹10,000 सुरक्षित रहेंगे।',
        tradeoff: 'फ़ायदा: पैसे की कमी नहीं होगी। ध्यान दें: सप्लायर से फोन पर सहमति लेनी होगी।',
        isRecommended: true,
      },
      {
        id: 'early_discount',
        title: 'जल्दी भुगतान पर 2% छूट दें',
        mechanism: 'श्री बालाजी सुपरमार्केट को ₹400 (2%) छूट देकर 31 अक्टू की जगह 28 अक्टू को बिल मँगवा लें।',
        balanceImpact: 'सप्लायर बिल से पहले +₹19,600 हाथ में आ जाएंगे।',
        financialEffect: '3 दिन पहले पैसा आएगा; केवल ₹400 की छूट देनी होगी।',
        tradeoff: 'फ़ायदा: बिना उधार तुरंत नकद। ध्यान दें: मुनाफ़े में ₹400 कम होंगे।',
        isRecommended: false,
      },
      {
        id: 'collect_overdue',
        title: 'रुके हुए ₹15,000 तुरंत मँगवाएं',
        mechanism: 'रॉयल किराना स्टोर्स (बिल #बिल-402, 4 दिन से बाकी) को आज ही व्हाट्सएप संदेश भेजें।',
        balanceImpact: 'खाते में +₹15,000 नकद जुड़ेंगे।',
        financialEffect: 'बिना किसी खर्च के पैसे की कमी दूर होगी।',
        tradeoff: 'फ़ायदा: पूरा पैसा मिलेगा। ध्यान दें: ग्राहक के तुरंत भेजने पर निर्भर है।',
        isRecommended: true,
      },
    ]);
  }

  if (lang === 'kn') {
    return mapDigits([
      {
        id: 'split_payment',
        title: 'ಸರಬರಾಜುದಾರರ ಬಿಲ್ ಅರ್ಧ-ಅರ್ಧ (50-50) ಕೊಡಿ',
        mechanism: '29 ಅಕ್ಟೋ ರಂದು ಮಲ್ನಾಡ್ ಆಗ್ರೋಗೆ ₹20,000 ಕೊಡಿ, ಉಳಿದ ₹20,000 ಅನ್ನು 4 ನವೆಂ ರಂದು ಗ್ರಾಹಕರ ಹಣ ಬಂದ ಮೇಲೆ ಕೊಡಿ.',
        balanceImpact: '29 ಅಕ್ಟೋ ರಂದು +₹20,000 ಹಣ ಉಳಿಯುತ್ತದೆ.',
        financialEffect: '₹750 ಬ್ಯಾಂಕ್ ದಂಡ ತಪ್ಪುತ್ತದೆ ಮತ್ತು ₹10,000 ಸುರಕ್ಷತಾ ಹಣ ಉಳಿಯುತ್ತದೆ.',
        tradeoff: 'ಲಾಭ: ಹಣದ ಕೊರತೆ ಆಗುವುದಿಲ್ಲ. ಗಮನಿಸಿ: ಸರಬರಾಜುದಾರರ ಒಪ್ಪಿಗೆ ಕೇಳಬೇಕು.',
        isRecommended: true,
      },
      {
        id: 'early_discount',
        title: 'ಶೀಘ್ರ ಪಾವತಿಗೆ 2% ರಿಯಾಯಿತಿ ನೀಡಿ',
        mechanism: 'ಶ್ರೀ ಬಾಲಾಜಿ ಸೂಪರ್‌ಮಾರ್ಕೆಟ್‌ಗೆ ₹400 (2%) ರಿಯಾಯಿತಿ ನೀಡಿ 31 ಅಕ್ಟೋ ಬದಲು 28 ಅಕ್ಟೋ ರಂದೇ ಹಣ ತರಿಸಿಕೊಳ್ಳಿ.',
        balanceImpact: 'ಬಿಲ್ ದಿನಾಂಕಕ್ಕೂ ಮುನ್ನ +₹19,600 ಕೈಸೇರುತ್ತದೆ.',
        financialEffect: '3 ದಿನ ಮುಂಚಿತವಾಗಿ ಹಣ ಬರುತ್ತದೆ; ₹400 ಮಾತ್ರ ರಿಯಾಯಿತಿ ಖರ್ಚು.',
        tradeoff: 'ಲಾಭ: ಸಾಲವಿಲ್ಲದೆ ತಕ್ಷಣ ನಗದು. ಗಮನಿಸಿ: ₹400 ಲಾಭ ಕಡಿಮೆಯಾಗುತ್ತದೆ.',
        isRecommended: false,
      },
      {
        id: 'collect_overdue',
        title: 'ತಡವಾದ ₹15,000 ಬಾಕಿ ಇಂದೇ ತರಿಸಿ',
        mechanism: 'ರಾಯಲ್ ಕಿರಾಣಿ ಸ್ಟೋರ್ಸ್‌ಗೆ (ಬಿಲ್ #ಬಿಲ್-402, 4 ದಿನ ತಡ) ಇಂದೇ ವಾಟ್ಸಾಪ್ ನೆನಪು ಕಳುಹಿಸಿ.',
        balanceImpact: '+₹15,000 ನಗದು ನಿಮ್ಮ ಖಾತೆಗೆ ಸೇರುತ್ತದೆ.',
        financialEffect: 'ಯಾವುದೇ ಬಡ್ಡಿ ಇಲ್ಲದೆ ಹಣದ ಕೊರತೆ ಬಗೆಹರಿಯುತ್ತದೆ.',
        tradeoff: 'ಲಾಭ: ಪೂರ್ಣ ಹಣ ಸಿಗುತ್ತದೆ. ಗಮನಿಸಿ: ಗ್ರಾಹಕರ ತಕ್ಷಣದ ಪಾವತಿಯ ಮೇಲೆ ಅವಲಂಬಿತ.',
        isRecommended: true,
      },
    ]);
  }

  if (lang === 'ta') {
    return mapDigits([
      {
        id: 'split_payment',
        title: 'சப்ளையர் பில்லைப் பாதி பாதியாக (50-50) செலுத்தவும்',
        mechanism: '29 அக் அன்று மல்நாடு அக்ரோவிற்கு ₹20,000 கொடுத்து, மீதமுள்ள ₹20,000 ஐ 4 நவ அன்று கொடுக்கவும்.',
        balanceImpact: '29 அக் அன்று +₹20,000 கையிருப்பு உಳியும்.',
        financialEffect: '₹750 வங்கி அபராதம் தவிர்க்கப்படும், ₹10,000 பாதுகாப்புப் பணம் காக்கப்படும்.',
        tradeoff: 'நன்மை: பணப் பற்றாக்குறை வராது. குறிப்பு: சப்ளையரிடம் பேசி ஒப்புதல் பெற வேண்டும்.',
        isRecommended: true,
      },
      {
        id: 'early_discount',
        title: 'முன்கூட்டியே செலுத்த 2% தள்ளுபடி அளிக்கவும்',
        mechanism: 'ஸ்ரீ பாலாஜி சூப்பர்மார்க்கெட்டிற்கு ₹400 (2%) தள்ளுபடி தந்து 28 அக் அன்றே பணத்தை வசூலிக்கவும்.',
        balanceImpact: 'பில் தேதிக்கு முன்பே +₹19,600 கைக்கு வரும்.',
        financialEffect: '3 நாள் முன்பே பணம் வரும்; ₹400 மட்டுமே தள்ளுபடி செலவு.',
        tradeoff: 'நன்மை: கடன் இல்லாமல் உடனடி ரொக்கம். குறிப்பு: லாபத்தில் ₹400 குறையும்.',
        isRecommended: false,
      },
      {
        id: 'collect_overdue',
        title: 'தாமதமான ₹15,000 நிலுவையை இன்றே வசூலிக்கவும்',
        mechanism: 'ராயல் கிரானா ஸ்டோர்ஸிற்கு (பில் #பில்-402, 4 நாள் தாமதம்) இன்றே வாட்ஸ்அப் நினைவூட்டல் அனுப்பவும்.',
        balanceImpact: 'கணக்கில் +₹15,000 ரொக்கம் சேரும்.',
        financialEffect: 'செலவின்றி பணப் பற்றாக்குறை நீங்கும்.',
        tradeoff: 'நன்மை: முழுப் பணமும் கிடைக்கும். குறிப்பு: வாடிக்கையாளர் உடனே அனுப்புவதைப் பொறுத்தது.',
        isRecommended: true,
      },
    ]);
  }

  if (lang === 'te') {
    return mapDigits([
      {
        id: 'split_payment',
        title: 'సప్లయర్ బిల్లును సగం-సగం (50-50) చెల్లించండి',
        mechanism: '29 అక్టో నాడు మల్నాడ్ ఆగ్రోకు ₹20,000 ఇచ్చి, మిగిలిన ₹20,000 ను 4 నవం నాడు చెల్లించండి.',
        balanceImpact: '29 అక్టో నాడు +₹20,000 నగదు చేతిలో ఉంటుంది.',
        financialEffect: '₹750 బ్యాంక్ జరిమానా తప్పుతుంది మరియు ₹10,000 భద్రతా నిధి సురక్షితంగా ఉంటుంది.',
        tradeoff: 'లాభం: నగదు కొరత రాదు. గమనిక: సప్లయర్‌తో ముందుగా మాట్లాడాలి.',
        isRecommended: true,
      },
      {
        id: 'early_discount',
        title: 'ముందస్తు చెల్లింపుకు 2% తగ్గింపు ఇవ్వండి',
        mechanism: 'శ్రీ బాలాజీ సూపర్‌మార్కెట్‌కు ₹400 (2%) తగ్గింపు ఇచ్చి 28 అక్టో నాడే డబ్బు తెప్పించుకోండి.',
        balanceImpact: 'బిల్లు గడువుకు ముందే +₹19,600 చేతికి వస్తుంది.',
        financialEffect: '3 రోజులు ముందే డబ్బు వస్తుంది; ₹400 మాత్రమే తగ్గింపు ఖర్చు.',
        tradeoff: 'లాభం: అప్పు లేకుండా తక్షణ నగదు. గమనిక: లాభంలో ₹400 తగ్గుతుంది.',
        isRecommended: false,
      },
      {
        id: 'collect_overdue',
        title: 'ఆలస్యమైన ₹15,000 బిల్లును ఈరోజే వసూలు చేయండి',
        mechanism: 'రాయల్ కిరాణా స్టోర్స్‌కు (బిల్లు #బిల్లు-402, 4 రోజులు ఆలస్యం) ఈరోజే వాట్సాప్ రిమైండర్ పంపండి.',
        balanceImpact: 'ఖాతాలో +₹15,000 నగదు చేరుతుంది.',
        financialEffect: 'ఎలాంటి ఖర్చు లేకుండా నగదు కొరత తీరుతుంది.',
        tradeoff: 'లాభం: పూర్తి డబ్బు వస్తుంది. గమనిక: కస్టమర్ వెంటనే పంపడంపై ఆధారపడి ఉంటుంది.',
        isRecommended: true,
      },
    ]);
  }

  if (lang === 'ml') {
    return mapDigits([
      {
        id: 'split_payment',
        title: 'സപ്ലയർ ബിൽ പകുതി വീതം (50-50) നൽകുക',
        mechanism: '29 ഒക്ടോ ന് മൽനാട് അഗ്രോയ്ക്ക് ₹20,000 നൽകുക, ബാക്കി ₹20,000 തുക 4 നവം ന് നൽകുക.',
        balanceImpact: '29 ഒക്ടോ ന് +₹20,000 പണം കൈയിൽ ബാക്കിയുണ്ടാകും.',
        financialEffect: '₹750 ബാങ്ക് പിഴ ഒഴിവാകും, ₹10,000 കരുതൽ ധനം സുരക്ഷിതമാകും.',
        tradeoff: 'ഗുണം: പണക്ഷാമം ഉണ്ടാകില്ല. ശ്രദ്ധിക്കുക: സപ്ലയറോട് മുൻകൂട്ടി സംസാരിക്കണം.',
        isRecommended: true,
      },
      {
        id: 'early_discount',
        title: 'നേരത്തെയുള്ള പേയ്‌മെന്റിന് 2% കിഴിവ് നൽകുക',
        mechanism: 'ശ്രീ ബാലാജി സൂപ്പർമാർക്കറ്റിന് ₹400 (2%) കിഴിവ് നൽകി 28 ഒക്ടോ ന് തന്നെ തുക വാങ്ങുക.',
        balanceImpact: 'ബിൽ തീയതിക്ക് മുമ്പ് +₹19,600 കൈയിലെത്തും.',
        financialEffect: '3 ദിവസം മുമ്പ് പണം ലഭിക്കും; ₹400 മാത്രമാണ് കിഴിവ്.',
        tradeoff: 'ഗുണം: കടമില്ലാതെ ഉടൻ പണം. ശ്രദ്ധിക്കുക: ലാഭത്തിൽ ₹400 കുറയും.',
        isRecommended: false,
      },
      {
        id: 'collect_overdue',
        title: 'വൈകിയ ₹15,000 കുടിശ്ശിക ഇന്ന് തന്നെ വാങ്ങുക',
        mechanism: 'റോയൽ കിരാന സ്റ്റോഴ്സിന് (ബിൽ #ബിൽ-402, 4 ദിവസം വൈകി) ഇന്ന് തന്നെ വാട്ട്‌സ്ആപ്പ് സന്ദേശം അയയ്ക്കുക.',
        balanceImpact: 'അക്കൗണ്ടിൽ +₹15,000 പണം ചേരും.',
        financialEffect: 'ചെലവില്ലാതെ പണക്ഷാമം പരിഹരിക്കാം.',
        tradeoff: 'ഗുണം: മുഴുവൻ തുകയും ലഭിക്കും. ശ്രദ്ധിക്കുക: ഇടപാടുകാരൻ ഉടൻ അയയ്ക്കുന്നതിനെ ആശ്രയിച്ചിരിക്കും.',
        isRecommended: true,
      },
    ]);
  }

  return [
    {
      id: 'split_payment',
      title: 'Pay supplier half now, half next week',
      mechanism: 'Pay ₹20,000 to Malnad Agro on 29 Oct, and the remaining ₹20,000 on 4 Nov after buyer money arrives.',
      balanceImpact: '+₹20,000 cash stays in your hand on 29 Oct.',
      financialEffect: 'Saves ₹750 bank bounce charge and keeps your ₹10,000 emergency cash safe.',
      tradeoff: 'Good: Prevents cash shortage. Note: Call supplier first to agree.',
      isRecommended: true,
    },
    {
      id: 'early_discount',
      title: 'Give 2% discount for early payment',
      mechanism: 'Offer Sri Balaji Supermarket ₹400 (2%) off to pay on 28 Oct instead of 31 Oct.',
      balanceImpact: '+₹19,600 arrives 3 days earlier before bills are due.',
      financialEffect: 'Money comes 3 days early; costs ₹400 in discount.',
      tradeoff: 'Good: Quick cash without borrowing. Note: Reduces profit by ₹400.',
      isRecommended: false,
    },
    {
      id: 'collect_overdue',
      title: 'Collect ₹15,000 overdue bill today',
      mechanism: 'Send a polite WhatsApp reminder to Royal Kirana Stores (Bill INV-402, 4 days late).',
      balanceImpact: '+₹15,000 added to your shop cash.',
      financialEffect: 'Zero cost; directly solves the cash shortage.',
      tradeoff: 'Good: Full money collected. Note: Depends on buyer paying today.',
      isRecommended: true,
    },
  ];
}

export function getLocalizedExtraUI(lang: AppLanguage) {
  if (lang === 'hi') {
    return {
      simActiveLabel: 'चालू परख:',
      simDiffLabel: 'सामान्य से अंतर:',
      simCustomScenarioName: 'कस्टम स्लाइडर परख',
      simImpactPrefix: 'असर:',
      simBenefitPrefix: 'फ़ायदा:',
      simExecuteFormalBtn: 'खाते में पक्का लागू करें',
      simConfirmTitle: 'क्या यह उपाय खाते में लागू करें?',
      simConfirmNote: 'रूपिवंता आपकी अनुमति के बिना कभी बैंक से पैसा नहीं भेजता और न ही संदेश भेजता है। हाँ दबाने से केवल आपके पैसों का हिसाब अपडेट होगा।',
      simConfirmApplyBtn: 'हाँ, लागू करें',
      custPhoneLabel: 'फ़ोन',
      custCycleLabel: 'भुगतान नियम',
      custCautionBanner: 'ध्यान दें: ग्राहक से पैसे आने की तारीख़ अनुमानित है — बैंक में पैसा आने तक अलग रखी सुरक्षित राशि खर्च न करें।',
      custCaSummary: (billed: string, paid: string, delay: string, onTime: string) =>
        `खाता विवरण: कुल बिल = ${billed} · कुल वसूली = ${paid} · सामान्य देरी = +${toNativeDigits(delay, lang)} दिन · समय पर भुगतान = ${toNativeDigits(onTime, lang)}%।`,
      modalClosingBalanceTitle: 'दिन के अंत का बैलेंस',
      cashModalSubtitle: (shop: string) => `${localizeBusinessLabel(shop, lang)} · आज का पक्का नकद व बैंक हिसाब`,
      cashModalPassbookNote: toNativeDigits('पासबुक मिलान: रविवार, 25 अक्टू 2026 सुबह 09:30 बजे', lang),
      settingsHorizonLabel: 'कितने दिन पहले चेतावनी दें',
      settingsDaysOption: (d: number, rec?: boolean) =>
        toNativeDigits(rec ? `${d} दिन पहले (सुझाया गया)` : `${d} दिन पहले`, lang),
      settingsWhatsappTitle: 'सुबह व्हाट्सएप पर पैसे का सार',
      settingsWhatsappSub: 'बिल ज़्यादा होने पर सुबह आसान संदेश पाएं',
      addModalSubtitle: 'ग्राहक से आने वाला पैसा या सप्लायर का बिल लिखें',
      addDirectionLabel: 'यह कैसा हिसाब है?',
      addInvoiceRefLabel: 'बिल / रसीद नंबर',
      addAmountLabel: 'राशि (₹) *',
      addDueDateLabel: 'देय तारीख़ *',
      addNotesLabel: 'छोटा नोट (ऐच्छिक)',
      addNotesPlaceholder: toNativeDigits('जैसे: 10 दिन उधार, यूपीआई या बैंक विवरण...', lang),
      scanUploadFormats: 'दुकान के बिल की फोटो या पीडीएफ चलेगी',
      scanFieldsReady: 'बिल पढ़ लिया गया! सेव करने से पहले नीचे जांच लें:',
      scanAnotherBtn: 'दूसरा बिल स्कैन करें',
      scanErrorFallback: 'फोटो अपने-आप नहीं पढ़ी जा सकी — आप नीचे बिल लिख सकते हैं।',
      scanSamples: [
        {
          id: 'sample-balaji',
          name: toNativeDigits('श्री बालाजी सुपरमार्केट (बिल-418)', lang),
          type: 'inflow' as const,
          amount: 24500,
          dueDate: '2026-11-06',
          invoiceNumber: 'INV-418',
          partyName: 'Sri Balaji Supermarket',
          title: 'काली मिर्च और लौंग थोक खेप',
          category: 'b2b_invoice',
          notes: toNativeDigits('14 दिन में बैंक भुगतान।', lang),
        },
        {
          id: 'sample-malnad',
          name: toNativeDigits('मलनाड एग्रो सप्लायर्स (बिल-915)', lang),
          type: 'outflow' as const,
          amount: 22000,
          dueDate: '2026-11-04',
          invoiceNumber: 'BILL-915',
          partyName: 'Malnad Agro Suppliers',
          title: toNativeDigits('हरी इलायची उत्तम दर्जा 50 किलो', lang),
          category: 'supplier',
          notes: 'माल मिलने पर भुगतान।',
        },
        {
          id: 'sample-bescom',
          name: toNativeDigits('बेसकॉम बिजली बिल (बिजली-88412)', lang),
          type: 'outflow' as const,
          amount: 4850,
          dueDate: '2026-11-10',
          invoiceNumber: 'BES-88412',
          partyName: 'BESCOM Karnataka',
          title: 'कोल्ड स्टोरेज अक्टूबर बिजली बिल',
          category: 'utilities',
          notes: 'मासिक बिजली बिल।',
        },
      ],
      langNameEn: 'अंग्रेज़ी',
      langNameHi: 'हिन्दी',
      langNameKn: 'कन्नड़',
      voiceLangChanged: 'भाषा हिन्दी में बदल दी गई है। शर्मा जी, बताइए मैं क्या मदद करूँ?',
      voiceWaConfirm: (name: string) =>
        `मैं ${localizePartyName(name, lang)} को व्हाट्सएप पर नोटिस का सार और आख़िरी तारीख़ भेजूंगा। पुष्टि करने के लिए हरा बटन दबाएं।`,
      voiceShowNotices: (count: number, title: string, days: number) =>
        toNativeDigits(`आपके पास ${count} खुले नोटिस हैं। सबसे ज़रूरी नोटिस "${title}" है जिसमें ${days} दिन बाकी हैं।`, lang),
      voiceMoneyRead: (cash: string, hasShort: boolean, shortAmt: string, shortDate: string) =>
        hasShort
          ? toNativeDigits(`शर्मा जी, आज आपके पास ${cash} हैं, लेकिन ${shortDate} को ${shortAmt} कम पड़ सकते हैं।`, lang)
          : `शर्मा जी, आज आपके पास ${cash} हैं और इस हफ़्ते आपके पैसे पूरी तरह सुरक्षित हैं।`,
      voiceLastDate: (dueStr: string, days: number) =>
        toNativeDigits(`इस नोटिस की आख़िरी तारीख़ ${dueStr} है। आपके पास ${days} दिन बाकी हैं।`, lang),
      voiceAmountAsk: (thisAmt: string, count: number, totalAmt: string) =>
        toNativeDigits(`इस नोटिस में ${thisAmt} मांगे गए हैं। सभी ${count} खुले नोटिस मिलाकर कुल ${totalAmt} हैं।`, lang),
      voiceHelp: 'यहाँ मदद पन्ना है। किसी भी सवाल को दबाएं।',
      voiceAutoReminder: (title: string, days: number, dueStr: string, amt: string) =>
        toNativeDigits(`याद दिलाना शर्मा जी: "${title}" की आख़िरी तारीख़ ${dueStr} (${days} दिन बाकी) है। राशि ${amt} है।`, lang),
      voiceOfflineFallback: toNativeDigits('शर्मा जी, आपके पास 3 खुले नोटिस हैं और आज हाथ में ₹30,000 नकद हैं।', lang),
    };
  }

  if (lang === 'kn') {
    return {
      simActiveLabel: 'ಚಾಲ್ತಿ ಪರೀಕ್ಷೆ:',
      simDiffLabel: 'ಸಾಮಾನ್ಯಕ್ಕಿಂತ ವ್ಯತ್ಯಾಸ:',
      simCustomScenarioName: 'ಕಸ್ಟಮ್ ಸ್ಲೈಡರ್ ಪರೀಕ್ಷೆ',
      simImpactPrefix: 'ಪರಿಣಾಮ:',
      simBenefitPrefix: 'ಲಾಭ:',
      simExecuteFormalBtn: 'ಖಾತೆಯಲ್ಲಿ ಖಚಿತಪಡಿಸಿ',
      simConfirmTitle: 'ಈ ಉಪಾಯವನ್ನು ನಿಮ್ಮ ಖಾತೆಯಲ್ಲಿ ಅನ್ವಯಿಸಲೇ?',
      simConfirmNote: 'ನಿಮ್ಮ ಅನುಮತಿಯಿಲ್ಲದೆ ರೂಪಿವಂತ ಎಂದಿಗೂ ಬ್ಯಾಂಕ್ ಹಣ ಕಳುಹಿಸುವುದಿಲ್ಲ ಅಥವಾ ಸಂದೇಶ ಕಳುಹಿಸುವುದಿಲ್ಲ. ಒಪ್ಪಿದರೆ ನಿಮ್ಮ ಹಣದ ಮುನ್ಸೂಚನೆ ನವೀಕರಿಸಲಾಗುತ್ತದೆ.',
      simConfirmApplyBtn: 'ಹೌದು, ಅನ್ವಯಿಸಿ',
      custPhoneLabel: 'ಫೋನ್',
      custCycleLabel: 'ಪಾವತಿ ನಿಯಮ',
      custCautionBanner: 'ಗಮನಿಸಿ: ಗ್ರಾಹಕರ ಪಾವತಿ ದಿನಾಂಕ ಅಂದಾಜು ಮಾತ್ರ — ಬ್ಯಾಂಕ್‌ಗೆ ಹಣ ಬರುವವರೆಗೆ ಸುರಕ್ಷತಾ ಹಣ ಬದಿಗೆ ಇಡಿ.',
      custCaSummary: (billed: string, paid: string, delay: string, onTime: string) =>
        `ಖಾತೆ ವಿವರ: ಒಟ್ಟು ಬಿಲ್ = ${billed} · ಬಂದ ಹಣ = ${paid} · ಸಾಮಾನ್ಯ ವಿಳಂಬ = +${toNativeDigits(delay, lang)} ದಿನ · ಸಮಯಕ್ಕೆ ಪಾವತಿ = ${toNativeDigits(onTime, lang)}%.`,
      modalClosingBalanceTitle: 'ದಿನದ ಅಂತ್ಯದ ಬ್ಯಾಲೆನ್ಸ್',
      cashModalSubtitle: (shop: string) => `${localizeBusinessLabel(shop, lang)} · ಇಂದಿನ ನಗದು ಮತ್ತು ಬ್ಯಾಂಕ್ ಲೆಕ್ಕ`,
      cashModalPassbookNote: toNativeDigits('ಪಾಸ್‌ಬುಕ್ ಪರಿಶೀಲನೆ: ಭಾನುವಾರ, 25 ಅಕ್ಟೋ 2026 ಬೆಳಿಗ್ಗೆ 09:30', lang),
      settingsHorizonLabel: 'ಎಷ್ಟು ದಿನ ಮುಂಚಿತವಾಗಿ ಎಚ್ಚರಿಸಬೇಕು',
      settingsDaysOption: (d: number, rec?: boolean) =>
        toNativeDigits(rec ? `${d} ದಿನ ಮುಂಚಿತವಾಗಿ (ಶಿಫಾರಸು)` : `${d} ದಿನ ಮುಂಚಿತವಾಗಿ`, lang),
      settingsWhatsappTitle: 'ಬೆಳಿಗ್ಗೆ ವಾಟ್ಸಾಪ್ ಹಣದ ಸಾರಾಂಶ',
      settingsWhatsappSub: 'ಬಿಲ್ ಹೆಚ್ಚಾದರೆ ಬೆಳಿಗ್ಗೆ ಸರಳ ಸಂದೇಶ ಪಡೆಯಿರಿ',
      addModalSubtitle: 'ಗ್ರಾಹಕರಿಂದ ಬರುವ ಹಣ ಅಥವಾ ಸರಬರಾಜುದಾರರ ಬಿಲ್ ಸೇರಿಸಿ',
      addDirectionLabel: 'ಇದು ಯಾವ ರೀತಿಯ ಲೆಕ್ಕ?',
      addInvoiceRefLabel: 'ಬಿಲ್ / ರಸೀದಿ ಸಂಖ್ಯೆ',
      addAmountLabel: 'ಮೊತ್ತ (₹) *',
      addDueDateLabel: 'ಗಡುವು ದಿನಾಂಕ *',
      addNotesLabel: 'ಟಿಪ್ಪಣಿ (ಐಚ್ಛಿಕ)',
      addNotesPlaceholder: toNativeDigits('ಉದಾ: 10 ದಿನ ಸಾಲ, ಯುಪಿಐ ಅಥವಾ ಬ್ಯಾಂಕ್ ವಿವರ...', lang),
      scanUploadFormats: 'ಅಂಗಡಿ ಬಿಲ್‌ನ ಫೋಟೋ ಅಥವಾ ಪಿಡಿಎಫ್ ನಡೆಯುತ್ತದೆ',
      scanFieldsReady: 'ಬಿಲ್ ಓದಲಾಗಿದೆ! ಉಳಿಸುವ ಮುನ್ನ ಕೆಳಗಿನ ವಿವರ ಪರಿಶೀಲಿಸಿ:',
      scanAnotherBtn: 'ಮತ್ತೊಂದು ಬಿಲ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ',
      scanErrorFallback: 'ಫೋಟೋ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಓದಲಾಗಲಿಲ್ಲ — ಕೆಳಗೆ ವಿವರ ಟೈಪ್ ಮಾಡಿ.',
      scanSamples: [
        {
          id: 'sample-balaji',
          name: toNativeDigits('ಶ್ರೀ ಬಾಲಾಜಿ ಸೂಪರ್‌ಮಾರ್ಕೆಟ್ (ಬಿಲ್-418)', lang),
          type: 'inflow' as const,
          amount: 24500,
          dueDate: '2026-11-06',
          invoiceNumber: 'INV-418',
          partyName: 'Sri Balaji Supermarket',
          title: 'ಕರಿಮೆಣಸು ಮತ್ತು ಲವಂಗ ಸಗಟು ಸರಕು',
          category: 'b2b_invoice',
          notes: toNativeDigits('14 ದಿನದಲ್ಲಿ ಬ್ಯಾಂಕ್ ಪಾವತಿ.', lang),
        },
        {
          id: 'sample-malnad',
          name: toNativeDigits('ಮಲ್ನಾಡ್ ಆಗ್ರೋ ಸಪ್ಲೈಯರ್ಸ್ (ರಸೀದಿ-915)', lang),
          type: 'outflow' as const,
          amount: 22000,
          dueDate: '2026-11-04',
          invoiceNumber: 'BILL-915',
          partyName: 'Malnad Agro Suppliers',
          title: toNativeDigits('ಹಸಿರು ಏಲಕ್ಕಿ ಉತ್ತಮ ದರ್ಜೆ 50 ಕೆಜಿ', lang),
          category: 'supplier',
          notes: 'ಸರಕು ತಲುಪಿದ ನಂತರ ಪಾವತಿ.',
        },
        {
          id: 'sample-bescom',
          name: toNativeDigits('ಬೆಸ್ಕಾಂ ವಿದ್ಯುತ್ ಬಿಲ್ (ಬೆಸ್ಕಾಂ-88412)', lang),
          type: 'outflow' as const,
          amount: 4850,
          dueDate: '2026-11-10',
          invoiceNumber: 'BES-88412',
          partyName: 'BESCOM Karnataka',
          title: 'ಕೋಲ್ಡ್ ಸ್ಟೋರೇಜ್ ಅಕ್ಟೋಬರ್ ವಿದ್ಯುತ್ ಬಿಲ್',
          category: 'utilities',
          notes: 'ಮಾಸಿಕ ವಿದ್ಯುತ್ ಬಿಲ್.',
        },
      ],
      langNameEn: 'ಇಂಗ್ಲಿಷ್',
      langNameHi: 'ಹಿಂದಿ',
      langNameKn: 'ಕನ್ನಡ',
      voiceLangChanged: 'ಭಾಷೆಯನ್ನು ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಲಾಗಿದೆ. ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?',
      voiceWaConfirm: (name: string) =>
        `ನಾನು ${localizePartyName(name, lang)} ಅವರಿಗೆ ವಾಟ್ಸಾಪ್‌ನಲ್ಲಿ ನೋಟಿಸ್ ವಿವರ ಮತ್ತು ಕೊನೆಯ ದಿನಾಂಕ ಕಳುಹಿಸಲು ಸಿದ್ಧಪಡಿಸಿದ್ದೇನೆ. ಖಚಿತಪಡಿಸಲು ಹಸಿರು ಬಟನ್ ಒತ್ತಿರಿ.`,
      voiceShowNotices: (count: number, title: string, days: number) =>
        toNativeDigits(`ನಿಮಗೆ ${count} ತೆರೆದ ನೋಟಿಸ್‌ಗಳಿವೆ. ಅತ್ಯಂತ ತುರ್ತು ನೋಟಿಸ್ "${title}", ಇದಕ್ಕೆ ${days} ದಿನ ಬಾಕಿ ಇದೆ.`, lang),
      voiceMoneyRead: (cash: string, hasShort: boolean, shortAmt: string, shortDate: string) =>
        hasShort
          ? toNativeDigits(`ಇಂದು ನಿಮ್ಮ ಬಳಿ ${cash} ಇದೆ, ಆದರೆ ${shortDate} ರಂದು ${shortAmt} ಕಡಿಮೆ ಬೀಳಬಹುದು.`, lang)
          : `ಇಂದು ನಿಮ್ಮ ಬಳಿ ${cash} ಇದೆ ಮತ್ತು ಈ ವಾರ ನಿಮ್ಮ ಹಣ ಸುರಕ್ಷಿತವಾಗಿದೆ.`,
      voiceLastDate: (dueStr: string, days: number) =>
        toNativeDigits(`ಈ ನೋಟಿಸ್‌ನ ಕೊನೆಯ ದಿನಾಂಕ ${dueStr}. ನಿಮಗೆ ${days} ದಿನ ಬಾಕಿ ಇದೆ.`, lang),
      voiceAmountAsk: (thisAmt: string, count: number, totalAmt: string) =>
        toNativeDigits(`ಈ ನೋಟಿಸ್‌ನಲ್ಲಿ ${thisAmt} ಕೇಳಲಾಗಿದೆ. ಎಲ್ಲಾ ${count} ನೋಟಿಸ್ ಸೇರಿ ಒಟ್ಟು ${totalAmt} ಆಗಿದೆ.`, lang),
      voiceHelp: 'ಇದು ಸಹಾಯ ಪುಟ. ಯಾವುದೇ ಪ್ರಶ್ನೆಯನ್ನು ಒತ್ತಿರಿ.',
      voiceAutoReminder: (title: string, days: number, dueStr: string, amt: string) =>
        toNativeDigits(`ನೆನಪು: "${title}" ಕೊನೆಯ ದಿನಾಂಕ ${dueStr} (${days} ದಿನ ಬಾಕಿ). ಮೊತ್ತ ${amt}.`, lang),
      voiceOfflineFallback: toNativeDigits('ನಿಮಗೆ 3 ತೆರೆದ ನೋಟಿಸ್‌ಗಳಿವೆ ಮತ್ತು ಇಂದು ಕೈಯಲ್ಲಿ ₹30,000 ನಗದು ಇದೆ.', lang),
    };
  }

  if (lang === 'ta') {
    return {
      simActiveLabel: 'செயலில் உள்ள சோதனை:',
      simDiffLabel: 'வழக்கத்திலிருந்து மாற்றம்:',
      simCustomScenarioName: 'தனிப்பயன் சோதனை',
      simImpactPrefix: 'பண விளைவு:',
      simBenefitPrefix: 'நன்மை:',
      simExecuteFormalBtn: 'கணக்கில் உறுதி செய்து பயன்படுத்து',
      simConfirmTitle: 'இந்தத் தீர்வை உங்கள் கணக்கில் பயன்படுத்தலாமா?',
      simConfirmNote: 'ரூபிவந்தா உங்கள் அனுமதியின்றி வங்கிப் பணத்தையோ செய்தியையோ அனுப்பாது. உறுதி செய்தால் பணக் கணிப்பு மட்டும் புதுப்பிக்கப்படும்.',
      simConfirmApplyBtn: 'ஆம், பயன்படுத்து',
      custPhoneLabel: 'தொலைபேசி',
      custCycleLabel: 'வழக்கமான தவணை',
      custCautionBanner: 'குறிப்பு: பணம் வரும் தேதிகள் உத்தேசமானவை — பணம் வங்கியில் சேரும் வரை பாதுகாப்பு இருப்பை மாற்ற வேண்டாம்.',
      custCaSummary: (billed: string, paid: string, delay: string, onTime: string) =>
        `கணக்கு விவரம்: மொத்த பில் = ${billed} · வந்த பணம் = ${paid} · சராசரி தாமதம் = +${toNativeDigits(delay, lang)} நாள் · சரியான நேரம் = ${toNativeDigits(onTime, lang)}%.`,
      modalClosingBalanceTitle: 'நாள் இறுதி இருப்பு',
      cashModalSubtitle: (shop: string) => `${localizeBusinessLabel(shop, lang)} · ரொக்கம் மற்றும் வங்கி இருப்பு`,
      cashModalPassbookNote: toNativeDigits('பாஸ்புக் சரிபார்ப்பு: ஞாயிற்றுக்கிழமை, 25 அக் 2026 காலை 09:30', lang),
      settingsHorizonLabel: 'எத்தனை நாட்களுக்கு முன் எச்சரிக்க வேண்டும்',
      settingsDaysOption: (d: number, rec?: boolean) =>
        toNativeDigits(rec ? `${d} நாட்களுக்கு முன் (பரிந்துரை)` : `${d} நாட்களுக்கு முன்`, lang),
      settingsWhatsappTitle: 'காலை வாட்ஸ்அப் பணச் சுருக்கம்',
      settingsWhatsappSub: 'பில்கள் அதிகமாக இருந்தால் காலை எளிய தகவல் பெறவும்',
      addModalSubtitle: 'வாடிக்கையாளர் வரவு அல்லது செலுத்த வேண்டிய பில்லைப் பதிவு செய்க',
      addDirectionLabel: 'இது எந்த வகை கணக்கு?',
      addInvoiceRefLabel: 'பில் எண்',
      addAmountLabel: 'தொகை (₹) *',
      addDueDateLabel: 'கெடு தேதி *',
      addNotesLabel: 'சிறு குறிப்பு (விருப்பம்)',
      addNotesPlaceholder: toNativeDigits('எ.கா: 10 நாள் தவணை, யுபிஐ விவரம்...', lang),
      scanUploadFormats: 'கடை பில்லின் புகைப்படம் அல்லது பிடிஎஃப் பதிவேற்றலாம்',
      scanFieldsReady: 'பில் படிக்கப்பட்டது! சேமிக்கும் முன் கீழே சரிபார்க்கவும்:',
      scanAnotherBtn: 'மற்றொரு பில்லை ஸ்கேன் செய்',
      scanErrorFallback: 'புகைப்படத்தைத் தானாகப் படிக்க முடியவில்லை — கீழே விவரங்களை உள்ளிடவும்.',
      scanSamples: [
        {
          id: 'sample-balaji',
          name: toNativeDigits('ஸ்ரீ பாலாஜி சூப்பர்மார்க்கெட் (பில்-418)', lang),
          type: 'inflow' as const,
          amount: 24500,
          dueDate: '2026-11-06',
          invoiceNumber: 'INV-418',
          partyName: 'Sri Balaji Supermarket',
          title: 'மிளகு மற்றும் கிராம்பு மொத்த சரக்கு',
          category: 'b2b_invoice',
          notes: toNativeDigits('14 நாளில் வங்கி மூலம் பணம்.', lang),
        },
        {
          id: 'sample-malnad',
          name: toNativeDigits('மல்நாடு அக்ரோ சப்ளையர்ஸ் (பில்-915)', lang),
          type: 'outflow' as const,
          amount: 22000,
          dueDate: '2026-11-04',
          invoiceNumber: 'BILL-915',
          partyName: 'Malnad Agro Suppliers',
          title: toNativeDigits('பச்சை ஏலக்காய் முதல் தரம் 50 கிலோ', lang),
          category: 'supplier',
          notes: 'சரக்கு வந்ததும் பணம்.',
        },
        {
          id: 'sample-bescom',
          name: toNativeDigits('பெஸ்காம் மின்சார பில் (மின்-88412)', lang),
          type: 'outflow' as const,
          amount: 4850,
          dueDate: '2026-11-10',
          invoiceNumber: 'BES-88412',
          partyName: 'BESCOM Karnataka',
          title: 'குளிர்பதனக் கிடங்கு அக்டோபர் மின்சார பில்',
          category: 'utilities',
          notes: 'மாதாந்திர மின்சாரக் கட்டணம்.',
        },
      ],
      langNameEn: 'ஆங்கிலம்',
      langNameHi: 'இந்தி',
      langNameKn: 'கன்னடம்',
      voiceLangChanged: 'மொழி மாற்றப்பட்டது.',
      voiceWaConfirm: (name: string) =>
        `${localizePartyName(name, lang)} அவர்களுக்கு வாட்ஸ்அப் செய்தி தயாராக உள்ளது.`,
      voiceShowNotices: (count: number, title: string, days: number) =>
        toNativeDigits(`உங்களுக்கு ${count} திறந்த நோட்டீஸ்கள் உள்ளன: "${title}" (${days} நாட்கள் உள்ளன).`, lang),
      voiceMoneyRead: (cash: string, hasShort: boolean, shortAmt: string, shortDate: string) =>
        hasShort
          ? toNativeDigits(`இன்று ${cash} உள்ளது, ஆனால் ${shortDate} அன்று ${shortAmt} பற்றாக்குறை வரலாம்.`, lang)
          : `இன்று ${cash} உள்ளது, பண நிலை பாதுகாப்பாக உள்ளது.`,
      voiceLastDate: (dueStr: string, days: number) =>
        toNativeDigits(`கடைசி தேதி ${dueStr} (${days} நாட்கள் உள்ளன).`, lang),
      voiceAmountAsk: (thisAmt: string, count: number, totalAmt: string) =>
        toNativeDigits(`இந்த நோட்டீஸ் தொகை ${thisAmt}. மொத்தம் ${count} நோட்டீஸ்கள் சேர்த்து ${totalAmt}.`, lang),
      voiceHelp: 'இது உதவிப் பக்கம்.',
      voiceAutoReminder: (title: string, days: number, dueStr: string, amt: string) =>
        toNativeDigits(`நினைவூட்டல்: "${title}" கடைசி தேதி ${dueStr} (${days} நாட்கள்). தொகை ${amt}.`, lang),
      voiceOfflineFallback: toNativeDigits('இன்று கையில் ₹30,000 இருப்பு உள்ளது.', lang),
    };
  }

  if (lang === 'te') {
    return {
      simActiveLabel: 'అమలులో ఉన్న పరీక్ష:',
      simDiffLabel: 'సాధారణం నుండి మార్పు:',
      simCustomScenarioName: 'కస్టమ్ స్లైడర్ పరీక్ష',
      simImpactPrefix: 'నగదు ప్రభావం:',
      simBenefitPrefix: 'లాభం:',
      simExecuteFormalBtn: 'ఖాతాలో నిర్ధారించి వర్తింపజేయి',
      simConfirmTitle: 'ఈ పరిష్కారాన్ని మీ ఖాతాలో అమలు చేయాలా?',
      simConfirmNote: 'మీ అనుమతి లేకుండా రూపివంత ఎప్పుడూ బ్యాంక్ డబ్బు లేదా సందేశాలను పంపదు. నిర్ధారిస్తే మీ నగదు అంచనా మాత్రమే అప్‌డేట్ అవుతుంది.',
      simConfirmApplyBtn: 'అవును, అమలు చేయి',
      custPhoneLabel: 'ఫోన్',
      custCycleLabel: 'సాధారణ గడువు',
      custCautionBanner: 'గమనిక: కస్టమర్ చెల్లింపు తేదీలు అంచనా మాత్రమే — డబ్బు బ్యాంకులో జమ అయ్యే వరకు భద్రతా నిధిని ఉంచండి.',
      custCaSummary: (billed: string, paid: string, delay: string, onTime: string) =>
        `ఖాతా వివరాలు: మొత్తం బిల్లు = ${billed} · వసూలు = ${paid} · సగటు ఆలస్యం = +${toNativeDigits(delay, lang)} రోజులు · సమయానికి = ${toNativeDigits(onTime, lang)}%.`,
      modalClosingBalanceTitle: 'రోజు ముగింపు నిల్వ',
      cashModalSubtitle: (shop: string) => `${localizeBusinessLabel(shop, lang)} · నగదు మరియు బ్యాంక్ నిల్వ`,
      cashModalPassbookNote: toNativeDigits('పాస్‌బుక్ పరిశీలన: ఆదివారం, 25 అక్టో 2026 ఉదయం 09:30', lang),
      settingsHorizonLabel: 'ఎన్ని రోజుల ముందు హెచ్చరించాలి',
      settingsDaysOption: (d: number, rec?: boolean) =>
        toNativeDigits(rec ? `${d} రోజుల ముందు (సూచించబడింది)` : `${d} రోజుల ముందు`, lang),
      settingsWhatsappTitle: 'ఉదయం వాట్సాప్ నగదు సారాంశం',
      settingsWhatsappSub: 'బిల్లులు ఎక్కువైతే ఉదయం సులభ సందేశం పొందండి',
      addModalSubtitle: 'కస్టమర్ నుండి రావలసిన డబ్బు లేదా చెల్లించాల్సిన బిల్లు నమోదు చేయండి',
      addDirectionLabel: 'ఇది ఎలాంటి పద్దు?',
      addInvoiceRefLabel: 'బిల్లు నంబర్',
      addAmountLabel: 'మొత్తం (₹) *',
      addDueDateLabel: 'గడువు తేదీ *',
      addNotesLabel: 'చిన్న గమనిక (ఐచ్ఛికం)',
      addNotesPlaceholder: toNativeDigits('ఉదా: 10 రోజుల గడువు, యూపీఐ వివరాలు...', lang),
      scanUploadFormats: 'షాపు బిల్లు ఫోటో లేదా పీడీఎఫ్ అప్‌లోడ్ చేయవచ్చు',
      scanFieldsReady: 'బిల్లు చదవబడింది! సేవ్ చేసే ముందు దిగువ వివరాలు సరిచూడండి:',
      scanAnotherBtn: 'మరొక బిల్లు స్కాన్ చేయండి',
      scanErrorFallback: 'ఫోటో స్వయంచాలకంగా చదవడం కుదరలేదు — దిగువ వివరాలు టైప్ చేయండి.',
      scanSamples: [
        {
          id: 'sample-balaji',
          name: toNativeDigits('శ్రీ బాలాజీ సూపర్‌మార్కెట్ (బిల్లు-418)', lang),
          type: 'inflow' as const,
          amount: 24500,
          dueDate: '2026-11-06',
          invoiceNumber: 'INV-418',
          partyName: 'Sri Balaji Supermarket',
          title: 'మిరియాలు మరియు లవంగాల హోల్‌సేల్ సరుకు',
          category: 'b2b_invoice',
          notes: toNativeDigits('14 రోజుల్లో బ్యాంక్ చెల్లింపు.', lang),
        },
        {
          id: 'sample-malnad',
          name: toNativeDigits('మల్నాడ్ ఆగ్రో సప్లయర్స్ (బిల్లు-915)', lang),
          type: 'outflow' as const,
          amount: 22000,
          dueDate: '2026-11-04',
          invoiceNumber: 'BILL-915',
          partyName: 'Malnad Agro Suppliers',
          title: toNativeDigits('పచ్చ యాలకులు మొదటి రకం 50 కిలోలు', lang),
          category: 'supplier',
          notes: 'సరుకు అందిన వెంటనే చెల్లింపు.',
        },
        {
          id: 'sample-bescom',
          name: toNativeDigits('బెస్కామ్ విద్యుత్ బిల్లు (విద్యుత్-88412)', lang),
          type: 'outflow' as const,
          amount: 4850,
          dueDate: '2026-11-10',
          invoiceNumber: 'BES-88412',
          partyName: 'BESCOM Karnataka',
          title: 'కోల్డ్ స్టోరేజ్ అక్టోబర్ విద్యుత్ బిల్లు',
          category: 'utilities',
          notes: 'నెలవారీ కరెంట్ బిల్లు.',
        },
      ],
      langNameEn: 'ఇంగ్లీష్',
      langNameHi: 'హిందీ',
      langNameKn: 'కన్నడ',
      voiceLangChanged: 'భాష మార్చబడింది.',
      voiceWaConfirm: (name: string) =>
        `${localizePartyName(name, lang)} కోసం వాట్సాప్ సందేశం సిద్ధంగా ఉంది.`,
      voiceShowNotices: (count: number, title: string, days: number) =>
        toNativeDigits(`మీకు ${count} నోటీసులు ఉన్నాయి: "${title}" (${days} రోజులు మిగిలి ఉన్నాయి).`, lang),
      voiceMoneyRead: (cash: string, hasShort: boolean, shortAmt: string, shortDate: string) =>
        hasShort
          ? toNativeDigits(`ఈరోజు ${cash} ఉంది, కానీ ${shortDate} నాడు ${shortAmt} తక్కువ పడవచ్చు.`, lang)
          : `ఈరోజు ${cash} ఉంది, నగదు స్థితి సురక్షితంగా ఉంది.`,
      voiceLastDate: (dueStr: string, days: number) =>
        toNativeDigits(`చివరి తేదీ ${dueStr} (${days} రోజులు మిగిలి ఉన్నాయి).`, lang),
      voiceAmountAsk: (thisAmt: string, count: number, totalAmt: string) =>
        toNativeDigits(`ఈ నోటీసు మొత్తం ${thisAmt}. మొత్తం ${count} నోటీసులు కలిపి ${totalAmt}.`, lang),
      voiceHelp: 'ఇది సహాయం పేజీ.',
      voiceAutoReminder: (title: string, days: number, dueStr: string, amt: string) =>
        toNativeDigits(`రిమైండర్: "${title}" చివరి తేదీ ${dueStr} (${days} రోజులు). మొత్తం ${amt}.`, lang),
      voiceOfflineFallback: toNativeDigits('ఈరోజు చేతిలో ₹30,000 నగదు ఉంది.', lang),
    };
  }

  if (lang === 'ml') {
    return {
      simActiveLabel: 'സജീവ പരീക്ഷണം:',
      simDiffLabel: 'സാധാരണയിൽ നിന്നുള്ള മാറ്റം:',
      simCustomScenarioName: 'കസ്റ്റം സ്ലൈഡർ പരീക്ഷണം',
      simImpactPrefix: 'പണത്തിലെ മാറ്റം:',
      simBenefitPrefix: 'ഗുണം:',
      simExecuteFormalBtn: 'കണക്കിൽ സ്ഥിരീകരിച്ച് നടപ്പാക്കുക',
      simConfirmTitle: 'ഈ പരിഹാരം നിങ്ങളുടെ കണക്കിൽ ചേർക്കട്ടെ?',
      simConfirmNote: 'നിങ്ങളുടെ അനുവാദമില്ലാതെ രൂപിവന്ത ഒരിക്കലും ബാങ്ക് പണമോ സന്ദേശങ്ങളോ അയയ്ക്കില്ല. സ്ഥിരീകരിച്ചാൽ പണത്തിന്റെ കണക്ക് മാത്രം പുതുക്കും.',
      simConfirmApplyBtn: 'അതെ, നടപ്പാക്കുക',
      custPhoneLabel: 'ഫോൺ',
      custCycleLabel: 'സാധാരണ കാലാവധി',
      custCautionBanner: 'ശ്രദ്ധിക്കുക: പണം ലഭിക്കുന്ന തീയതികൾ ഏകദേശ കണക്കാണ് — ബാങ്കിൽ പണം എത്തുന്നതുവരെ കരുതൽ തുക മാറ്റിവെക്കുക.',
      custCaSummary: (billed: string, paid: string, delay: string, onTime: string) =>
        `കണക്ക് വിവരം: ആകെ ബിൽ = ${billed} · ലഭിച്ചത് = ${paid} · ശരാശരി താമസം = +${toNativeDigits(delay, lang)} ദിവസം · കൃത്യസമയം = ${toNativeDigits(onTime, lang)}%.`,
      modalClosingBalanceTitle: 'ദിവസാവസാന ബാലൻസ്',
      cashModalSubtitle: (shop: string) => `${localizeBusinessLabel(shop, lang)} · ഇന്നത്തെ പണവും ബാങ്ക് നീക്കിയിരിപ്പും`,
      cashModalPassbookNote: toNativeDigits('പാസ്ബുക്ക് പരിശോധന: ഞായറാഴ്ച, 25 ഒക്ടോ 2026 രാവിലെ 09:30', lang),
      settingsHorizonLabel: 'എത്ര ദിവസം മുമ്പ് മുന്നറിയിപ്പ് നൽകണം',
      settingsDaysOption: (d: number, rec?: boolean) =>
        toNativeDigits(rec ? `${d} ദിവസം മുമ്പ് (ശുപാർശ)` : `${d} ദിവസം മുമ്പ്`, lang),
      settingsWhatsappTitle: 'രാവിലെയുള്ള വാട്ട്‌സ്ആപ്പ് പണ സംഗ്രഹം',
      settingsWhatsappSub: 'ബില്ലുകൾ കൂടുമ്പോൾ രാവിലെ ലളിതമായ സന്ദേശം നേടുക',
      addModalSubtitle: 'ഇടപാടുകാരനിൽ നിന്ന് ലഭിക്കാനുള്ള തുകയോ അടയ്ക്കാനുള്ള ബില്ലോ ചേർക്കുക',
      addDirectionLabel: 'ഇത് ഏത് തരം കണക്കാണ്?',
      addInvoiceRefLabel: 'ബിൽ നമ്പർ',
      addAmountLabel: 'തുക (₹) *',
      addDueDateLabel: 'അവസാന തീയതി *',
      addNotesLabel: 'ചെറിയ കുറിപ്പ് (ഐച്ഛികം)',
      addNotesPlaceholder: toNativeDigits('ഉദാ: 10 ദിവസത്തെ കടം, യുപിഐ വിവരം...', lang),
      scanUploadFormats: 'കടയിലെ ബില്ലിന്റെ ഫോട്ടോ അല്ലെങ്കിൽ പിഡിഎഫ് മതിയാകും',
      scanFieldsReady: 'ബിൽ വായിച്ചു! സേവ് ചെയ്യുന്നതിന് മുമ്പ് താഴെ പരിശോധിക്കുക:',
      scanAnotherBtn: 'മറ്റൊരു ബിൽ സ്കാൻ ചെയ്യുക',
      scanErrorFallback: 'ഫോട്ടോ തനിയെ വായിക്കാൻ കഴിഞ്ഞില്ല — താഴെ വിവരങ്ങൾ ടൈപ്പ് ചെയ്യുക.',
      scanSamples: [
        {
          id: 'sample-balaji',
          name: toNativeDigits('ശ്രീ ബാലാജി സൂപ്പർമാർക്കറ്റ് (ബിൽ-418)', lang),
          type: 'inflow' as const,
          amount: 24500,
          dueDate: '2026-11-06',
          invoiceNumber: 'INV-418',
          partyName: 'Sri Balaji Supermarket',
          title: 'കുരുമുളകും ഗ്രാമ്പൂവും മൊത്തവ്യാപാര ചരക്ക്',
          category: 'b2b_invoice',
          notes: toNativeDigits('14 ദിവസത്തിനുള്ളിൽ ബാങ്ക് പേയ്‌മെന്റ്.', lang),
        },
        {
          id: 'sample-malnad',
          name: toNativeDigits('മൽനാട് അഗ്രോ സപ്ലയേഴ്സ് (ബിൽ-915)', lang),
          type: 'outflow' as const,
          amount: 22000,
          dueDate: '2026-11-04',
          invoiceNumber: 'BILL-915',
          partyName: 'Malnad Agro Suppliers',
          title: toNativeDigits('പച്ച ഏലയ്ക്ക ഒന്നാം തരം 50 കിലോ', lang),
          category: 'supplier',
          notes: 'ചരക്ക് ലഭിക്കുമ്പോൾ പണം നൽകണം.',
        },
        {
          id: 'sample-bescom',
          name: toNativeDigits('ബെസ്കോം വൈദ്യുതി ബിൽ (വൈദ്യുതി-88412)', lang),
          type: 'outflow' as const,
          amount: 4850,
          dueDate: '2026-11-10',
          invoiceNumber: 'BES-88412',
          partyName: 'BESCOM Karnataka',
          title: 'കോൾഡ് സ്റ്റോറേജ് ഒക്ടോബർ വൈദ്യുതി ബിൽ',
          category: 'utilities',
          notes: 'പ്രതിമാസ വൈദ്യുതി ചാർജ്.',
        },
      ],
      langNameEn: 'ഇംഗ്ലീഷ്',
      langNameHi: 'ഹിന്ദി',
      langNameKn: 'കന്നഡ',
      voiceLangChanged: 'ഭാഷ മാറ്റി.',
      voiceWaConfirm: (name: string) =>
        `${localizePartyName(name, lang)} നുള്ള വാട്ട്‌സ്ആപ്പ് സന്ദേശം തയ്യാറാണ്.`,
      voiceShowNotices: (count: number, title: string, days: number) =>
        toNativeDigits(`നിങ്ങൾക്ക് ${count} നോട്ടീസുകളുണ്ട്: "${title}" (${days} ദിവസം ബാക്കി).`, lang),
      voiceMoneyRead: (cash: string, hasShort: boolean, shortAmt: string, shortDate: string) =>
        hasShort
          ? toNativeDigits(`ഇന്ന് ${cash} ഉണ്ട്, എന്നാൽ ${shortDate} ന് ${shortAmt} കുറവുണ്ടാകാം.`, lang)
          : `ഇന്ന് ${cash} ഉണ്ട്, പണനില സുരക്ഷിതമാണ്.`,
      voiceLastDate: (dueStr: string, days: number) =>
        toNativeDigits(`അവസാന തീയതി ${dueStr} (${days} ദിവസം ബാക്കി).`, lang),
      voiceAmountAsk: (thisAmt: string, count: number, totalAmt: string) =>
        toNativeDigits(`ഈ നോട്ടീസിലെ തുക ${thisAmt}. ആകെ ${count} നോട്ടീസുകൾ ചേർത്ത് ${totalAmt}.`, lang),
      voiceHelp: 'ഇത് സഹായ പേജാണ്.',
      voiceAutoReminder: (title: string, days: number, dueStr: string, amt: string) =>
        toNativeDigits(`ഓർമ്മപ്പെടുത്തൽ: "${title}" അവസാന തീയതി ${dueStr} (${days} ദിവസം). തുക ${amt}.`, lang),
      voiceOfflineFallback: toNativeDigits('ഇന്ന് കൈയിൽ ₹30,000 ബാലൻസ് ഉണ്ട്.', lang),
    };
  }

  return {
    simActiveLabel: 'Active test:',
    simDiffLabel: 'Change from normal:',
    simCustomScenarioName: 'Custom slider test',
    simImpactPrefix: 'Cash effect:',
    simBenefitPrefix: 'Benefit:',
    simExecuteFormalBtn: 'Approve & apply to khata',
    simConfirmTitle: 'Apply this fix to your khata?',
    simConfirmNote: 'RupiVanta never moves bank money or sends messages without your permission. Confirming updates your shop money forecast.',
    simConfirmApplyBtn: 'Yes, apply fix',
    custPhoneLabel: 'Phone',
    custCycleLabel: 'Usual terms',
    custCautionBanner: 'Note: Expected customer dates are estimates — always keep your emergency money aside until payment reaches your bank.',
    custCaSummary: (billed: string, paid: string, delay: string, onTime: string) =>
      `Ledger figures: Total billed = ${billed} · Total collected = ${paid} · Average settlement delay = +${delay} days · On-time rate = ${onTime}%.`,
    modalClosingBalanceTitle: 'End-of-day balance',
    cashModalSubtitle: (shop: string) => `${shop} · Confirmed cash & bank passbook`,
    cashModalPassbookNote: 'Passbook checked: Sunday, 25 October 2026 at 09:30 AM',
    settingsHorizonLabel: 'Warn me ahead of time',
    settingsDaysOption: (d: number, rec?: boolean) =>
      rec ? `${d} days ahead (Recommended)` : `${d} days ahead`,
    settingsWhatsappTitle: 'Morning WhatsApp money summary',
    settingsWhatsappSub: 'Get a simple morning alert if bills exceed incoming cash',
    addModalSubtitle: 'Record money coming from a customer or a bill to pay',
    addDirectionLabel: 'What kind of entry is this?',
    addInvoiceRefLabel: 'Bill / Invoice No.',
    addAmountLabel: 'Amount (₹) *',
    addDueDateLabel: 'Date *',
    addNotesLabel: 'Short note (optional)',
    addNotesPlaceholder: 'e.g. 10 days credit, UPI or NEFT note...',
    scanUploadFormats: 'Supports JPG, PNG, or PDF photos of shop bills',
    scanFieldsReady: 'Bill read! Check or edit any box below before saving:',
    scanAnotherBtn: 'Scan another bill',
    scanErrorFallback: 'Could not read photo automatically — you can type the bill details below.',
    scanSamples: [
      {
        id: 'sample-balaji',
        name: 'Sri Balaji Supermarket (INV-418)',
        type: 'inflow' as const,
        amount: 24500,
        dueDate: '2026-11-06',
        invoiceNumber: 'INV-418',
        partyName: 'Sri Balaji Supermarket',
        title: 'Bulk Black Pepper & Cloves Consignment',
        category: 'b2b_invoice',
        notes: '14 days NEFT payment.',
      },
      {
        id: 'sample-malnad',
        name: 'Malnad Agro Suppliers (BILL-915)',
        type: 'outflow' as const,
        amount: 22000,
        dueDate: '2026-11-04',
        invoiceNumber: 'BILL-915',
        partyName: 'Malnad Agro Suppliers',
        title: 'Green Cardamom Grade-A 50kg Bags',
        category: 'supplier',
        notes: 'Pay on delivery.',
      },
      {
        id: 'sample-bescom',
        name: 'BESCOM Electricity Bill (BES-88412)',
        type: 'outflow' as const,
        amount: 4850,
        dueDate: '2026-11-10',
        invoiceNumber: 'BES-88412',
        partyName: 'BESCOM Karnataka',
        title: 'Cold Storage October Electricity Bill',
        category: 'utilities',
        notes: 'Monthly power bill.',
      },
    ],
    langNameEn: 'English',
    langNameHi: 'Hindi',
    langNameKn: 'Kannada',
    voiceLangChanged: 'Language changed to English. How can I help you?',
    voiceWaConfirm: (name: string) =>
      `I will prepare the notice summary and last date for ${name} on WhatsApp. Tap the green button to confirm.`,
    voiceShowNotices: (count: number, title: string, days: number) =>
      `You have ${count} open notices. Showing the most urgent notice first: ${title}, with ${days} days left.`,
    voiceMoneyRead: (cash: string, hasShort: boolean, shortAmt: string, shortDate: string) =>
      hasShort
        ? `You have ${cash} today, and you may run short by ${shortAmt} on ${shortDate}.`
        : `You have ${cash} today and your shop money stays safe this week.`,
    voiceLastDate: (dueStr: string, days: number) =>
      `Your last date for this notice is ${dueStr}. You have ${days} days left.`,
    voiceAmountAsk: (thisAmt: string, count: number, totalAmt: string) =>
      `This notice asks for ${thisAmt}. Across all ${count} open notices, the total money you may need to pay is ${totalAmt}.`,
    voiceHelp: 'Here is the Help page.',
    voiceAutoReminder: (title: string, days: number, dueStr: string, amt: string) =>
      `Reminder: ${title} is due in ${days} days on ${dueStr}. Amount asked is ${amt}.`,
    voiceOfflineFallback: 'You have 3 open notices and ₹30,000 cash in hand today.',
  };
}

export function getVantaUIText(lang: AppLanguage) {
  if (lang === 'kn') {
    return {
      vantaName: 'ವಂಟಾ — ನಿಮ್ಮ ಹಣಕಾಸು ಸಹಾಯಕ',
      vantaRole: 'ಧ್ವನಿ ಮತ್ತು ಪಠ್ಯ ಹಣಕಾಸು ಸಹಾಯಕ',
      availableCash: 'ಪ್ರಸ್ತುತ ನಗದು ಶಿಲ್ಕು',
      settledPaidNote: 'ಸ್ವೀಕರಿಸಿದ ಪಾವತಿಗಳು',
      expectedReceipts: 'ಬಾಕಿ ಇರುವ ಪಾವತಿಗಳು (ಬರಬೇಕಾದ ಹಣ)',
      overdueCollectibles: 'ಅವಧಿ ಮೀರಿದ ಬಾಕಿ',
      upcomingPayments: 'ಮುಂಬರುವ ಪಾವತಿಗಳು (ಕೊಡಬೇಕಾದ ಬಿಲ್)',
      minimumReserve: 'ಕನಿಷ್ಠ ಸುರಕ್ಷಿತ ಮೀಸಲು',
      maxReserveGap: 'ಮೀಸಲು ಕೊರತೆ',
      projectedLowest: 'ಕನಿಷ್ಠ ಅಂದಾಜು ಶಿಲ್ಕು',
      shortageWarningTitle: 'ನಗದು ಕೊರತೆ ಎಚ್ಚರಿಕೆ',
      cashHealthyTitle: 'ನಗದು ಸ್ಥಿತಿ ಸುರಕ್ಷಿತವಾಗಿದೆ',
      simulationActiveNote: (name: string) => `ಪರೀಕ್ಷೆ ಸಕ್ರಿಯವಾಗಿದೆ: ${name}`,
      clearSimulationBtn: 'ಪರೀಕ್ಷೆ ತೆರವುಗೊಳಿಸಿ',
      simulateDelayBtn: '೭ ದಿನಗಳ ವಿಳಂಬ ಪರೀಕ್ಷಿಸಿ',
      askVantaWhyBtn: 'ಸರಳವಾಗಿ ಕಾರಣ ಕೇಳಿ',
      waStatusPreparedNotSent: 'ಸಿದ್ಧವಾಗಿದೆ · ಇನ್ನೂ ಕಳುಹಿಸಿಲ್ಲ',
      waNotConfiguredBanner: 'ಕೆಳಗಿನ ಸ್ವೀಕರಿಸುವವರ ಸಂಖ್ಯೆ ಮತ್ತು ಸಂದೇಶವನ್ನು ಪರಿಶೀಲಿಸಿ, ನಂತರ ವಾಟ್ಸಾಪ್ ತೆರೆಯಲು ದೃಢೀಕರಿಸಿ.',
      waInvalidPhoneError: 'ದಯವಿಟ್ಟು ಮಾನ್ಯವಾದ ೧೦ ಅಂಕಿಯ ಭಾರತೀಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ.',
      waConfirmRecipientStepBtn: 'ಸ್ವೀಕರಿಸುವವರು ಮತ್ತು ಸಂದೇಶ ದೃಢೀಕರಿಸಿ',
      waRecipientConfirmedNote: 'ಸ್ವೀಕರಿಸುವವರನ್ನು ದೃಢೀಕರಿಸಲಾಗಿದೆ. ವಾಟ್ಸಾಪ್ ತೆರೆಯಲು ಸಿದ್ಧವಾಗಿದೆ.',
      showcaseContactsBadge: 'ತ್ವರಿತ ಸಂಪರ್ಕಗಳು',
    };
  }

  if (lang === 'hi') {
    return {
      vantaName: 'वंता — आपका वित्तीय सहायक',
      vantaRole: 'वॉइस और टेक्स्ट वित्तीय सहायक',
      availableCash: 'वर्तमान नकद शेष',
      settledPaidNote: 'प्राप्त भुगतान',
      expectedReceipts: 'लंबित भुगतान (आने वाला पैसा)',
      overdueCollectibles: 'अतिदेय बकाया',
      upcomingPayments: 'आगामी भुगतान (देने वाले बिल)',
      minimumReserve: 'न्यूनतम सुरक्षित रिज़र्व',
      maxReserveGap: 'अधिकतम रिज़र्व अंतर',
      projectedLowest: 'अनुमानित न्यूनतम शेष',
      shortageWarningTitle: 'नकदी कमी चेतावनी',
      cashHealthyTitle: 'नकदी स्थिति सुरक्षित है',
      simulationActiveNote: (name: string) => `परख सक्रिय: ${name}`,
      clearSimulationBtn: 'परख हटाएँ',
      simulateDelayBtn: '७-दिन देरी जांचें',
      askVantaWhyBtn: 'सरल कारण पूछें',
      waStatusPreparedNotSent: 'तैयार · अभी भेजा नहीं गया',
      waNotConfiguredBanner: 'नीचे प्राप्तकर्ता और संदेश की जाँच करें, फिर व्हाट्सएप खोलने के लिए पुष्टि करें।',
      waInvalidPhoneError: 'कृपया मान्य १० अंकों का भारतीय मोबाइल नंबर दर्ज करें।',
      waConfirmRecipientStepBtn: 'प्राप्तकर्ता और संदेश की पुष्टि करें',
      waRecipientConfirmedNote: 'प्राप्तकर्ता की पुष्टि हो गई है। व्हाट्सएप खोलने के लिए तैयार।',
      showcaseContactsBadge: 'त्वरित संपर्क',
    };
  }

  if (lang === 'ta') {
    return {
      vantaName: 'வாண்டா — உங்கள் நிதி உதவியாளர்',
      vantaRole: 'குரல் மற்றும் உரை நிதி உதவியாளர்',
      availableCash: 'தற்போதைய இருப்பு',
      settledPaidNote: 'பெறப்பட்ட தொகை',
      expectedReceipts: 'நிலுவை வரவுகள்',
      overdueCollectibles: 'காலாவதியான நிலுவை',
      upcomingPayments: 'வரவிருக்கும் கட்டணங்கள்',
      minimumReserve: 'பாதுகாப்பு இருப்பு',
      maxReserveGap: 'பாதுகாப்பு பற்றாக்குறை',
      projectedLowest: 'கணிக்கப்பட்ட குறைந்த இருப்பு',
      shortageWarningTitle: 'பணப் பற்றாக்குறை எச்சரிக்கை',
      cashHealthyTitle: 'பண நிலை பாதுகாப்பாக உள்ளது',
      simulationActiveNote: (name: string) => `சோதனை செயலில்: ${name}`,
      clearSimulationBtn: 'சோதனையை நீக்கு',
      simulateDelayBtn: '௭-நாள் தாமத சோதனை',
      askVantaWhyBtn: 'காரணம் கேள்',
      waStatusPreparedNotSent: 'தயாராக உள்ளது · இன்னும் அனுப்பப்படவில்லை',
      waNotConfiguredBanner:
        'கீழே உள்ள பெறுநர் எண் மற்றும் செய்தியைச் சரிபார்த்து, வாட்ஸ்அப் திறக்க உறுதிப்படுத்தவும்.',
      waInvalidPhoneError: 'சரியான ௧௦ இலக்க இந்திய மொபைல் எண்ணை உள்ளிடவும்.',
      waConfirmRecipientStepBtn: 'பெறுநர் & செய்தியை உறுதிப்படுத்து',
      waRecipientConfirmedNote: 'பெறுநர் உறுதிப்படுத்தப்பட்டார். வாட்ஸ்அப் திறக்க தயாராக உள்ளது.',
      showcaseContactsBadge: 'சேமிக்கப்பட்ட தொடர்புகள்',
    };
  }

  if (lang === 'te') {
    return {
      vantaName: 'వాంటా — మీ ఆర్థిక సహాయకుడు',
      vantaRole: 'వాయిస్ & టెక్స్ట్ ఆర్థిక సహాయకుడు',
      availableCash: 'ప్రస్తుత బ్యాలెన్స్',
      settledPaidNote: 'వసూలైన చెల్లింపులు',
      expectedReceipts: 'పెండింగ్ చెల్లింపులు',
      overdueCollectibles: 'గడువు ముగిసిన బకాయి',
      upcomingPayments: 'రాబోయే చెల్లింపులు',
      minimumReserve: 'కనీస సురక్షిత రిజర్వ్',
      maxReserveGap: 'రిజర్వ్ లోటు',
      projectedLowest: 'అంచనా కనిష్ట బ్యాలెన్స్',
      shortageWarningTitle: 'నగదు కొరత హెచ్చరిక',
      cashHealthyTitle: 'నగదు స్థితి సురక్షితంగా ఉంది',
      simulationActiveNote: (name: string) => `పరీక్ష అమలులో ఉంది: ${name}`,
      clearSimulationBtn: 'పరీక్ష తొలగించు',
      simulateDelayBtn: '౭-రోజుల ఆలస్య పరీక్ష',
      askVantaWhyBtn: 'కారణం అడగండి',
      waStatusPreparedNotSent: 'సిద్ధంగా ఉంది · ఇంకా పంపలేదు',
      waNotConfiguredBanner:
        'దిగువ గ్రహీత ఫోన్ నంబర్ మరియు సందేశాన్ని సరిచూసి, వాట్సాప్ తెరవడానికి నిర్ధారించండి.',
      waInvalidPhoneError: 'దయచేసి సరైన ౧౦ అంకెల భారతీయ మొబైల్ నంబర్ నమోదు చేయండి.',
      waConfirmRecipientStepBtn: 'గ్రహీత & సందేశాన్ని నిర్ధారించండి',
      waRecipientConfirmedNote: 'గ్రహీత నిర్ధారించబడ్డారు. వాట్సాప్ తెరవడానికి సిద్ధం.',
      showcaseContactsBadge: 'సేవ్ చేసిన పరిచయాలు',
    };
  }

  if (lang === 'ml') {
    return {
      vantaName: 'വാന്റ — നിങ്ങളുടെ സാമ്പത്തിക സഹായി',
      vantaRole: 'വോയ്‌സ് & ടെക്സ്റ്റ് സാമ്പത്തിക സഹായി',
      availableCash: 'നിലവിലെ ബാലൻസ്',
      settledPaidNote: 'ലഭിച്ച തുക',
      expectedReceipts: 'ലഭിക്കാനുള്ള തുക',
      overdueCollectibles: 'കുടിശ്ശിക',
      upcomingPayments: 'വരാനിരിക്കുന്ന ബില്ലുകൾ',
      minimumReserve: 'മിനിമം സുരക്ഷാ കരുതൽ',
      maxReserveGap: 'കരുതൽ കുറവ്',
      projectedLowest: 'കുറഞ്ഞ പ്രതീക്ഷിത ബാലൻസ്',
      shortageWarningTitle: 'പണക്ഷാമ മുന്നറിയിപ്പ്',
      cashHealthyTitle: 'പണനില സുരക്ഷിതമാണ്',
      simulationActiveNote: (name: string) => `പരീക്ഷണം സജീവം: ${name}`,
      clearSimulationBtn: 'പരീക്ഷണം മാറ്റുക',
      simulateDelayBtn: '൭-ദിവസത്തെ താമസം പരിശോധിക്കുക',
      askVantaWhyBtn: 'കാരണം ചോദിക്കുക',
      waStatusPreparedNotSent: 'തയ്യാറാണ് · ഇതുവരെ അയച്ചിട്ടില്ല',
      waNotConfiguredBanner:
        'താഴെയുള്ള ഫോൺ നമ്പറും സന്ദേശവും പരിശോധിച്ച് വാട്ട്‌സ്ആപ്പ് തുറക്കാൻ സ്ഥിരീകരിക്കുക.',
      waInvalidPhoneError: 'സാധുവായ ൧൦ അക്ക ഇന്ത്യൻ മൊബൈൽ നമ്പർ നൽകുക.',
      waConfirmRecipientStepBtn: 'സ്വീകർത്താവിനെയും സന്ദേശത്തെയും സ്ഥിരീകരിക്കുക',
      waRecipientConfirmedNote: 'സ്വീകർത്താവിനെ സ്ഥിരീകരിച്ചു. വാട്ട്‌സ്ആപ്പ് തുറക്കാൻ തയ്യാറാണ്.',
      showcaseContactsBadge: 'സേവ് ചെയ്ത നമ്പറുകൾ',
    };
  }

  return {
    vantaName: 'VANTA — Financial Assistant',
    vantaRole: 'Voice & Text Financial Assistant',
    availableCash: 'Present Balance',
    settledPaidNote: 'Settled inflows',
    expectedReceipts: 'Pending Payments',
    overdueCollectibles: 'Overdue',
    upcomingPayments: 'Upcoming Payments',
    minimumReserve: 'Minimum Safe Reserve',
    maxReserveGap: 'Max Reserve Gap',
    projectedLowest: 'Projected Lowest Balance',
    shortageWarningTitle: 'Cash Shortfall Alert',
    cashHealthyTitle: 'Cash Position Healthy',
    simulationActiveNote: (name: string) => `Simulation active: ${name}`,
    clearSimulationBtn: 'Clear Simulation',
    simulateDelayBtn: 'Test 7-Day Delay',
    askVantaWhyBtn: 'Explain Why',
    waStatusPreparedNotSent: 'Prepared · Not Sent Yet',
    waNotConfiguredBanner:
      'Review the recipient phone number and message below, then confirm to open WhatsApp.',
    waInvalidPhoneError: 'Please enter a valid 10-digit Indian mobile number.',
    waConfirmRecipientStepBtn: 'Confirm Recipient & Message',
    waRecipientConfirmedNote: 'Recipient confirmed. Ready to open WhatsApp.',
    showcaseContactsBadge: 'Saved Contacts',
  };
}

export interface PredictiveFinanceUIText {
  menuBtn: string;
  selectViewTitle: string;
  selectViewSubtitle: string;
  navPresentBalance: string;
  navPendingPayments: string;
  navUpcomingPayments: string;
  navAdviceSimulator: string;
  navCustomersAccuracy: string;
  navNotices: string;
  navGuide: string;
  presentDatePrefix: string;
  demoModeBadge: string;
  realModeBadge: string;
  switchRealBtn: string;
  switchDemoBtn: string;
  mlPredictedDateLabel: string;
  promisedDateLabel: string;
  dueDateLabel: string;
  invoiceDateLabel: string;
  estimatedDelayLabel: string;
  confidenceLabel: string;
  basisHistory: string;
  basisHybrid: string;
  basisBaseline: string;
  adviceTitle: string;
  adviceSubtitle: string;
  followUpHeading: string;
  affordabilityHeading: string;
  affordableLabel: string;
  tightReserveLabel: string;
  unaffordableLabel: string;
  voiceSupportedOnlyNote: string;
  forecastModeML: string;
  forecastModeDue: string;
  forecastModePromised: string;
}

export function getPredictiveFinanceText(lang: AppLanguage): PredictiveFinanceUIText {
  const dict: Record<AppLanguage, PredictiveFinanceUIText> = {
    en: {
      menuBtn: 'Menu',
      selectViewTitle: 'Select View',
      selectViewSubtitle: 'One focused section at a time',
      navPresentBalance: 'Present Balance & Outlook',
      navPendingPayments: 'Pending Payments (Pattern Analysis)',
      navUpcomingPayments: 'Upcoming Payments & Bills',
      navAdviceSimulator: 'Financial Advice & Delay Test',
      navCustomersAccuracy: 'Customer History & Accuracy',
      navNotices: 'Legal Notices',
      navGuide: 'How to Use',
      presentDatePrefix: 'Present Date',
      demoModeBadge: 'DEMO DATA — Sample Records (Kept Separate from Your Real Ledger)',
      realModeBadge: 'REAL LEDGER — Private Business Records',
      switchRealBtn: 'Switch to My Real Ledger',
      switchDemoBtn: 'View Demo Businesses',
      mlPredictedDateLabel: 'Expected Arrival Date',
      promisedDateLabel: 'Customer Promised Date',
      dueDateLabel: 'Due Date',
      invoiceDateLabel: 'Bill Date',
      estimatedDelayLabel: 'Expected Delay',
      confidenceLabel: 'Pattern Surety',
      basisHistory: 'Based on Past Bills',
      basisHybrid: 'Based on Recent Bills',
      basisBaseline: 'New Customer Estimate',
      adviceTitle: 'Simple Financial Advice & Cash Outlook',
      adviceSubtitle: '7, 30 & 90-day cash outlook from past payment habits, who to call first & bill affordability',
      followUpHeading: 'Who to Follow Up With First',
      affordabilityHeading: 'Can You Easily Pay Upcoming Bills?',
      affordableLabel: 'Safe to Pay',
      tightReserveLabel: 'Tight — Uses Safety Cushion',
      unaffordableLabel: 'Shortage Risk — Split or Collect First',
      voiceSupportedOnlyNote: 'Supported Voice Assistant Languages: English & ಕನ್ನಡ (Kannada) only',
      forecastModeML: 'Past Payment Pattern',
      forecastModeDue: 'Bill Due Dates',
      forecastModePromised: 'Customer Promised Dates',
    },
    kn: {
      menuBtn: 'ಮೆನು',
      selectViewTitle: 'ವಿಭಾಗ ಆಯ್ಕೆಮಾಡಿ',
      selectViewSubtitle: 'ಒಮ್ಮೆಗೆ ಒಂದೇ ಸರಳ ವಿಭಾಗ',
      navPresentBalance: 'ಪ್ರಸ್ತುತ ಬ್ಯಾಲೆನ್ಸ್ ಮತ್ತು ಮುನ್ಸೂಚನೆ',
      navPendingPayments: 'ಬಾಕಿ ಪಾವತಿಗಳು (ಹಿಂದಿನ ಅಭ್ಯಾಸ ಆಧಾರಿತ)',
      navUpcomingPayments: 'ಮುಂಬರುವ ಪಾವತಿಗಳು ಮತ್ತು ಬಿಲ್',
      navAdviceSimulator: 'ಹಣಕಾಸು ಸಲಹೆ ಮತ್ತು ಪರೀಕ್ಷೆ',
      navCustomersAccuracy: 'ಗ್ರಾಹಕರ ಇತಿಹಾಸ ಮತ್ತು ನಿಖರತೆ',
      navNotices: 'ಕಾನೂನು ನೋಟಿಸ್‌ಗಳು',
      navGuide: 'ಬಳಸುವುದು ಹೇಗೆ',
      presentDatePrefix: 'ಇಂದಿನ ದಿನಾಂಕ',
      demoModeBadge: 'ಡೆಮೊ ಡೇಟಾ — ಮಾದರಿ ದಾಖಲೆಗಳು (ನಿಮ್ಮ ನೈಜ ಖಾತೆಯಿಂದ ಪ್ರತ್ಯೇಕ)',
      realModeBadge: 'ನೈಜ ಖಾತೆ — ನಿಮ್ಮ ಖಾಸಗಿ ವ್ಯಾಪಾರ ದಾಖಲೆಗಳು',
      switchRealBtn: 'ನನ್ನ ನೈಜ ಖಾತೆಗೆ ಬದಲಿಸಿ',
      switchDemoBtn: 'ಡೆಮೊ ಖಾತೆ ನೋಡಿ',
      mlPredictedDateLabel: 'ಹಣ ಬರುವ ಅಂದಾಜು ದಿನಾಂಕ',
      promisedDateLabel: 'ಗ್ರಾಹಕರು ಭರವಸೆ ನೀಡಿದ ದಿನಾಂಕ',
      dueDateLabel: 'ಗಡುವು ದಿನಾಂಕ',
      invoiceDateLabel: 'ಬಿಲ್ ದಿನಾಂಕ',
      estimatedDelayLabel: 'ಅಂದಾಜು ತಡ',
      confidenceLabel: 'ನಂಬಿಕೆ ಮಟ್ಟ',
      basisHistory: 'ಹಿಂದಿನ ಬಿಲ್ ಅಭ್ಯಾಸ ಆಧಾರಿತ',
      basisHybrid: 'ಇತ್ತೀಚಿನ ಪಾವತಿ ಆಧಾರಿತ',
      basisBaseline: 'ಹೊಸ ಗ್ರಾಹಕರ ಸರಳ ಅಂದಾಜು',
      adviceTitle: 'ಸರಳ ಹಣಕಾಸು ಸಲಹೆ ಮತ್ತು ನಗದು ಮುನ್ಸೂಚನೆ',
      adviceSubtitle: '೭, ೩೦ ಮತ್ತು ೯೦ ದಿನಗಳ ನಗದು ನೋಟ, ಮೊದಲು ಯಾರನ್ನು ಕೇಳಬೇಕು ಮತ್ತು ಬಿಲ್ ಪಾವತಿ ಸಾಮರ್ಥ್ಯ',
      followUpHeading: 'ಮೊದಲು ಯಾರನ್ನು ಸಂಪರ್ಕಿಸಬೇಕು',
      affordabilityHeading: 'ಮುಂಬರುವ ಬಿಲ್‌ಗಳನ್ನು ಸುಲಭವಾಗಿ ಕೊಡಬಹುದೇ?',
      affordableLabel: 'ಪಾವತಿಸಲು ಸುರಕ್ಷಿತ',
      tightReserveLabel: 'ಸುರಕ್ಷತಾ ಹಣ ಸ್ವಲ್ಪ ಕಡಿಮೆಯಾಗುತ್ತದೆ',
      unaffordableLabel: 'ಹಣದ ಕೊರತೆ — ಕಂತು ಮಾಡಿ ಅಥವಾ ಬಾಕಿ ತರಿಸಿ',
      voiceSupportedOnlyNote: 'ಧ್ವನಿ ಸಹಾಯಕ ಬೆಂಬಲಿಸುವ ಭಾಷೆಗಳು: ಇಂಗ್ಲಿಷ್ ಮತ್ತು ಕನ್ನಡ ಮಾತ್ರ',
      forecastModeML: 'ಹಿಂದಿನ ಪಾವತಿ ಅಭ್ಯಾಸದ ದಿನಾಂಕ',
      forecastModeDue: 'ಬಿಲ್ ಗಡುವು ದಿನಾಂಕ',
      forecastModePromised: 'ಗ್ರಾಹಕರ ಭರವಸೆ ದಿನಾಂಕ',
    },
    hi: {
      menuBtn: 'मेनू',
      selectViewTitle: 'सेक्शन चुनें',
      selectViewSubtitle: 'एक बार में एक सरल सेक्शन',
      navPresentBalance: 'वर्तमान बैलेंस और अनुमान',
      navPendingPayments: 'बकाया भुगतान (पिछले पैटर्न से अनुमान)',
      navUpcomingPayments: 'आगामी भुगतान और बिल',
      navAdviceSimulator: 'सरल वित्तीय सलाह और परख',
      navCustomersAccuracy: 'ग्राहक इतिहास और सटीकता',
      navNotices: 'कानूनी नोटिस',
      navGuide: 'उपयोग कैसे करें',
      presentDatePrefix: 'आज की तारीख़',
      demoModeBadge: 'डेमो डेटा — नमूना रिकॉर्ड (असली खाते से अलग)',
      realModeBadge: 'असली खाता — आपके निजी व्यापार रिकॉर्ड',
      switchRealBtn: 'असली खाते पर जाएं',
      switchDemoBtn: 'डेमो व्यवसाय देखें',
      mlPredictedDateLabel: 'पैसा आने की अनुमानित तारीख़',
      promisedDateLabel: 'ग्राहक द्वारा वादा की गई तारीख़',
      dueDateLabel: 'तय देय तारीख़',
      invoiceDateLabel: 'बिल तारीख़',
      estimatedDelayLabel: 'अनुमानित देरी',
      confidenceLabel: 'भरोसे का स्तर',
      basisHistory: 'पुराने बिलों के आधार पर',
      basisHybrid: 'हाल के भुगतानों के आधार पर',
      basisBaseline: 'नए ग्राहक का सरल अनुमान',
      adviceTitle: 'सरल वित्तीय सलाह और नकदी अनुमान',
      adviceSubtitle: '७, ३० और ९० दिन का नकद हिसाब, किससे पहले पैसे मांगें और बिल चुकाने की क्षमता',
      followUpHeading: 'सबसे पहले किससे संपर्क करें',
      affordabilityHeading: 'क्या आगामी बिल आसानी से चुकाए जा सकते हैं?',
      affordableLabel: 'चुकाने के लिए सुरक्षित',
      tightReserveLabel: 'सुरक्षित बचत कम होगी',
      unaffordableLabel: 'पैसे की कमी — किस्त करें या बकाया मँगवाएं',
      voiceSupportedOnlyNote: 'वॉइस सहायक केवल अंग्रेज़ी और कन्नड़ भाषाओं में उपलब्ध है',
      forecastModeML: 'पिछले भुगतान पैटर्न की तारीख़',
      forecastModeDue: 'बिल की तय तारीख़',
      forecastModePromised: 'ग्राहक की वादा तारीख़',
    },
    ta: {
      menuBtn: 'பட்டியல்',
      selectViewTitle: 'பிரிவைத் தேர்ந்தெடுக்கவும்',
      selectViewSubtitle: 'ஒரு நேரத்தில் ஒரு எளிய பிரிவு',
      navPresentBalance: 'தற்போதைய இருப்பு & கணிப்பு',
      navPendingPayments: 'நிலுவை வரவுகள் (பழைய வழக்கக் கணிப்பு)',
      navUpcomingPayments: 'வரவிருக்கும் கட்டணங்கள்',
      navAdviceSimulator: 'நிதி ஆலோசனை & தாமதச் சோதனை',
      navCustomersAccuracy: 'வாடிக்கையாளர் வரலாறு & துல்லியம்',
      navNotices: 'சட்ட நோட்டீஸ்கள்',
      navGuide: 'பயன்படுத்துவது எப்படி',
      presentDatePrefix: 'இன்றைய தேதி',
      demoModeBadge: 'டெமோ தரவு — மாதிரி பதிவுகள் (உண்மைக் கணக்கிலிருந்து தனி)',
      realModeBadge: 'உண்மைக் கணக்கு — உங்கள் வணிகப் பதிவுகள்',
      switchRealBtn: 'என் உண்மைக் கணக்கிற்கு மாறு',
      switchDemoBtn: 'டெமோ கணக்குகளைப் பார்',
      mlPredictedDateLabel: 'பணம் வரும் உத்தேச தேதி',
      promisedDateLabel: 'வாடிக்கையாளர் உறுதியளித்த தேதி',
      dueDateLabel: 'கெடு தேதி',
      invoiceDateLabel: 'பில் தேதி',
      estimatedDelayLabel: 'எதிர்பார்க்கும் தாமதம்',
      confidenceLabel: 'நம்பிக்கை அளவு',
      basisHistory: 'கடந்த பில் பழக்கத்தின் அடிப்படை',
      basisHybrid: 'சமீபத்திய வரவு அடிப்படை',
      basisBaseline: 'புதிய வாடிக்கையாளர் மதிப்பீடு',
      adviceTitle: 'எளிய நிதி ஆலோசனை & பணப்புழக்க கணிப்பு',
      adviceSubtitle: '௭, ௩௦ & ௯௦ நாள் பணப்புழக்கம், யாரை முதலில் கேட்க வேண்டும் & பில் தகுதி',
      followUpHeading: 'யாரை முதலில் தொடர்பு கொள்ள வேண்டும்',
      affordabilityHeading: 'வரவிருக்கும் பில்களை எளிதாகச் செலுத்த முடியுமா?',
      affordableLabel: 'செலுத்தப் பாதுகாப்பானது',
      tightReserveLabel: 'பாதுகாப்பு இருப்பைக் குறைக்கும்',
      unaffordableLabel: 'பணப் பற்றாக்குறை — பிரித்துச் செலுத்தவும்',
      voiceSupportedOnlyNote: 'குரல் உதவியாளர் ஆங்கிலம் மற்றும் கன்னடம் ஆகிய மொழிகளை மட்டுமே ஆதரிக்கிறது',
      forecastModeML: 'கடந்த பணம் செலுத்தும் வழக்கம்',
      forecastModeDue: 'பில் கெடு தேதிகள்',
      forecastModePromised: 'உறுதியளித்த தேதிகள்',
    },
    te: {
      menuBtn: 'మెనూ',
      selectViewTitle: 'విభాగాన్ని ఎంచుకోండి',
      selectViewSubtitle: 'ఒకేసారి ఒక సులభమైన విభాగం',
      navPresentBalance: 'ప్రస్తుత బ్యాలెన్స్ & అంచనా',
      navPendingPayments: 'పెండింగ్ చెల్లింపులు (గత అలవాటు అంచనా)',
      navUpcomingPayments: 'రాబోయే చెల్లింపులు & బిల్లులు',
      navAdviceSimulator: 'ఆర్థిక సలహా & ఆలస్య పరీక్ష',
      navCustomersAccuracy: 'కస్టమర్ చరిత్ర & ఖచ్చితత్వం',
      navNotices: 'లీగల్ నోటీసులు',
      navGuide: 'ఎలా ఉపయోగించాలి',
      presentDatePrefix: 'ఈరోజు తేదీ',
      demoModeBadge: 'డెమో డేటా — నమూనా రికార్డులు (నిజమైన ఖాతా నుండి వేరు)',
      realModeBadge: 'నిజమైన ఖాతా — మీ వ్యాపార రికార్డులు',
      switchRealBtn: 'నా నిజమైన ఖాతాకు మారండి',
      switchDemoBtn: 'డెమో వ్యాపారాలను చూడండి',
      mlPredictedDateLabel: 'డబ్బు వచ్చే అంచనా తేదీ',
      promisedDateLabel: 'కస్టమర్ వాగ్దానం చేసిన తేదీ',
      dueDateLabel: 'గడువు తేదీ',
      invoiceDateLabel: 'బిల్లు తేదీ',
      estimatedDelayLabel: 'అంచనా ఆలస్యం',
      confidenceLabel: 'నమ్మక స్థాయి',
      basisHistory: 'గత బిల్లుల అలవాటు ఆధారంగా',
      basisHybrid: 'ఇటీవలి చెల్లింపుల ఆధారంగా',
      basisBaseline: 'కొత్త కస్టమర్ సాధారణ అంచనా',
      adviceTitle: 'సులభ ఆర్థిక సలహా & నగదు అంచనా',
      adviceSubtitle: '౭, ౩౦ & ౯౦ రోజుల నగదు అంచనా, ఎవరిని ముందుగా అడగాలి & బిల్లుల స్థోమత',
      followUpHeading: 'ముందుగా ఎవరిని అడగాలి',
      affordabilityHeading: 'రాబోయే బిల్లులు సులಭంగా కట్టగలమా?',
      affordableLabel: 'చెల్లించడానికి సురక్షితం',
      tightReserveLabel: 'భద్రతా నిధి తగ్గుతుంది',
      unaffordableLabel: 'నగదు కొరత — వాయిదా లేదా బకాయి వసూలు చేయండి',
      voiceSupportedOnlyNote: 'వాయిస్ అసిస్టెంట్ ఇంగ్లీష్ మరియు కన్నడ భాషలను మాత్రమే సపోర్ట్ చేస్తుంది',
      forecastModeML: 'గత చెల్లింపు అలవాటు తేదీలు',
      forecastModeDue: 'బిల్లు గడువు తేదీలు',
      forecastModePromised: 'వాగ్దానం చేసిన తేదీలు',
    },
    ml: {
      menuBtn: 'മെനു',
      selectViewTitle: 'വിഭാഗം തിരഞ്ഞെടുക്കുക',
      selectViewSubtitle: 'ഒരു സമയം ഒരു ലളിതമായ വിഭാഗം',
      navPresentBalance: 'നിലവിലെ ബാലൻസും പ്രവചനവും',
      navPendingPayments: 'ലഭിക്കാനുള്ള തുക (മുൻ ശീലമനുസരിച്ച്)',
      navUpcomingPayments: 'വരാനിരിക്കുന്ന ബില്ലുകൾ',
      navAdviceSimulator: 'സാമ്പത്തിക ഉപദേശവും പരീക്ഷണവും',
      navCustomersAccuracy: 'ഇടപാടുകാരുടെ ചരിത്രവും കൃത്യതയും',
      navNotices: 'നിയമ നോട്ടീസുകൾ',
      navGuide: 'എങ്ങനെ ഉപയോഗിക്കാം',
      presentDatePrefix: 'ഇന്നത്തെ തീയതി',
      demoModeBadge: 'ഡെമോ ഡാറ്റ — മാതൃകാ രേഖകൾ (യഥാർത്ഥ കണക്കിൽ നിന്ന് വേറിട്ടത്)',
      realModeBadge: 'യഥാർത്ഥ കണക്ക് — നിങ്ങളുടെ സ്വകാര്യ ബിസിനസ് രേഖകൾ',
      switchRealBtn: 'എന്റെ യഥാർത്ഥ കണക്കിലേക്ക് മാറുക',
      switchDemoBtn: 'ഡെമോ ബിസിനസുകൾ കാണുക',
      mlPredictedDateLabel: 'പണം ലഭിക്കാൻ സാധ്യതയുള്ള തീയതി',
      promisedDateLabel: 'ഇടപാടുകാരൻ വാഗ്ദാനം ചെയ്ത തീയതി',
      dueDateLabel: 'അവസാന തീയതി',
      invoiceDateLabel: 'ബിൽ തീയതി',
      estimatedDelayLabel: 'പ്രതീക്ഷിക്കുന്ന താമസം',
      confidenceLabel: 'ഉറപ്പിന്റെ നില',
      basisHistory: 'മുൻ ബില്ലുകളുടെ ശീലമനുസരിച്ച്',
      basisHybrid: 'സമീപകാല പേയ്‌മെന്റ് അടിസ്ഥാനത്തിൽ',
      basisBaseline: 'പുതിയ ഇടപാടുകാരന്റെ ഏകദേശ കണക്ക്',
      adviceTitle: 'ലളിതമായ സാമ്പത്തിക ഉപദേശവും പണനിലയും',
      adviceSubtitle: '൭, ൩൦, ൯൦ ദിവസത്തെ പണനില, ആരെ ആദ്യം വിളിക്കണം, ബിൽ അടയ്ക്കാനുള്ള ശേഷി',
      followUpHeading: 'ആരെ ആദ്യം ബന്ധപ്പെടണം',
      affordabilityHeading: 'വരാനിരിക്കുന്ന ബില്ലുകൾ സുരക്ഷിതമായി അടയ്ക്കാമോ?',
      affordableLabel: 'സുരക്ഷിതമായി അടയ്ക്കാം',
      tightReserveLabel: 'കരുതൽ ധനം കുറയും',
      unaffordableLabel: 'പണക്ഷാമം — തവണകളാക്കുക അല്ലെങ്കിൽ കുടിശ്ശിക പിരിക്കുക',
      voiceSupportedOnlyNote: 'വോയ്‌സ് അസിസ്റ്റന്റ് ഇംഗ്ലീഷ്, കന്നഡ ഭാഷകൾ മാത്രമേ പിന്തുണയ്ക്കുന്നുള്ളൂ',
      forecastModeML: 'മുൻകാല പേയ്‌മെന്റ് ശീലം',
      forecastModeDue: 'ബിൽ അവസാന തീയതികൾ',
      forecastModePromised: 'വാഗ്ദാനം ചെയ്ത തീയതികൾ',
    },
  };
  return dict[lang] || dict.en;
}


