import React, { useMemo, useState } from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Edit3,
  Plus,
  CheckCircle2,
  Trash2,
  Scan,
  AlertTriangle,
  Shield,
  MessageSquare,
  Check,
  X,
  Calendar,
  TrendingUp,
  Info,
  Mic,
  Split,
} from 'lucide-react';
import {
  CustomerProfile,
  DayForecast,
  ExpenseAffordabilityItem,
  FinancialAdviceReport,
  MLPaymentPrediction,
  Transaction,
} from '../types/cashflow';
import { AppLanguage } from '../types/munimji';
import { ANCHOR_DATE } from '../data/initialData';
import {
  formatHeaderDate,
  formatIndianNumber,
  formatLocalDate,
  formatRupee,
  getPredictiveFinanceText,
  TRANSLATIONS,
} from '../utils/translations';
import {
  fromNativeDigits,
  getDashboardExtraStrings,
  getSimpleAffordabilityCopy,
  getSimpleDelayImpactHeadline,
  getSimplePredictionCopy,
  localizeBusinessLabel,
  localizeInvoiceCode,
  localizePartyName,
  localizeTxTitle,
  toNativeDigits,
} from '../utils/localization';
import { ForecastChart } from './ForecastChart';

export type LedgerSingleSection =
  | 'present_balance'
  | 'pending_payments'
  | 'upcoming_payments';

export type ForecastTimingMode = 'ml_predicted' | 'promised' | 'contractual_due';

interface BalanceAndPaymentsTabProps {
  activeSection: LedgerSingleSection;
  onOpenMenu: () => void;
  businessName: string;
  isDemoWorkspace?: boolean;
  currentCash: number;
  minimumReserve: number;
  pendingPayments: Transaction[];
  upcomingPayments: Transaction[];
  customers: CustomerProfile[];
  mlPredictionsByTxId: Record<string, MLPaymentPrediction>;
  adviceReport: FinancialAdviceReport;
  dailyForecast: DayForecast[];
  comparisonForecastDays?: DayForecast[] | null;
  forecastTimingMode: ForecastTimingMode;
  onChangeForecastTimingMode: (mode: ForecastTimingMode) => void;
  timeframe: 7 | 30 | 90;
  onTimeframeChange: (tf: 7 | 30 | 90) => void;
  hasShortfall: boolean;
  shortfallDate: string;
  shortfallAmount: number;
  language: AppLanguage;
  onUpdateBalance: (newCash: number, newReserve: number) => Promise<void> | void;
  onAddPayment: (newTx: Omit<Transaction, 'id'>) => Promise<void> | void;
  onEditPayment: (id: string, updates: Partial<Transaction>) => Promise<void> | void;
  onDeletePayment: (id: string) => Promise<void> | void;
  onSettlePayment: (
    id: string,
    options?: { actualPaidDate?: string; partialAmount?: number }
  ) => Promise<void> | void;
  onRemindCustomer: (tx: Transaction) => void;
  onOpenScanModal: () => void;
  onSelectForecastDay: (day: DayForecast) => void;
  onAskVanta?: (prompt: string) => void;
  onOpenAdviceSection?: () => void;
}

interface LocalizedSectionStrings {
  presentBalanceTitle: string;
  presentBalanceSubtitle: string;
  editBalanceBtn: string;
  cashInputLabel: string;
  reserveInputLabel: string;
  safeReserveLine: string;
  freeToSpendLine: string;
  pendingTitle: string;
  pendingSubtitle: string;
  addPendingBtn: string;
  overdueTodayLabel: string;
  noPendingMsg: string;
  upcomingTitle: string;
  upcomingSubtitle: string;
  addUpcomingBtn: string;
  scanBillBtn: string;
  noUpcomingMsg: string;
  editBtn: string;
  saveBtn: string;
  cancelBtn: string;
  remindBtn: string;
  settleBtn: string;
}

const SECTION_STRINGS: Record<AppLanguage, LocalizedSectionStrings> = {
  en: {
    presentBalanceTitle: 'Present Balance',
    presentBalanceSubtitle: 'Confirmed cash & bank balance in hand today',
    editBalanceBtn: 'Edit Balance',
    cashInputLabel: 'Present Cash / Bank Balance (₹)',
    reserveInputLabel: 'Minimum Safe Reserve (₹)',
    safeReserveLine: 'Safe Reserve Kept Aside',
    freeToSpendLine: 'Available Above Reserve',
    pendingTitle: 'Pending Customer Payments & Arrival Analysis',
    pendingSubtitle: 'Money customers owe you with due date, promised date & expected arrival based on past habits',
    addPendingBtn: 'Add Pending Payment',
    overdueTodayLabel: 'Overdue as of today',
    noPendingMsg: 'No pending customer payments yet. Add a bill or scan a photo to see expected arrival dates.',
    upcomingTitle: 'Upcoming Bills & Cash Check',
    upcomingSubtitle: 'Supplier bills, rent, wages & money-lender dues checked against incoming cash',
    addUpcomingBtn: 'Add Upcoming Payment',
    scanBillBtn: 'Scan Bill Photo',
    noUpcomingMsg: 'No upcoming bills or expenses scheduled yet.',
    editBtn: 'Edit',
    saveBtn: 'Save Changes',
    cancelBtn: 'Cancel',
    remindBtn: 'WhatsApp Remind',
    settleBtn: 'Record Payment',
  },
  kn: {
    presentBalanceTitle: 'ಪ್ರಸ್ತುತ ಬ್ಯಾಲೆನ್ಸ್',
    presentBalanceSubtitle: 'ಇಂದು ಅಂಗಡಿ ಮತ್ತು ಬ್ಯಾಂಕ್‌ನಲ್ಲಿ ಲಭ್ಯವಿರುವ ಒಟ್ಟು ಹಣ',
    editBalanceBtn: 'ಬ್ಯಾಲೆನ್ಸ್ ತಿದ್ದುಪಡಿ',
    cashInputLabel: 'ಪ್ರಸ್ತುತ ನಗದು / ಬ್ಯಾಂಕ್ ಬ್ಯಾಲೆನ್ಸ್ (₹)',
    reserveInputLabel: 'ಕನಿಷ್ಠ ಸುರಕ್ಷಿತ ಮೀಸಲು (₹)',
    safeReserveLine: 'ಮೀಸಲಿಟ್ಟ ಸುರಕ್ಷಿತ ಹಣ',
    freeToSpendLine: 'ಬಳಸಲು ಲಭ್ಯವಿರುವ ಹಣ',
    pendingTitle: 'ಬಾಕಿ ಬರಬೇಕಾದ ಹಣ ಮತ್ತು ಪಾವತಿ ಅಭ್ಯಾಸದ ವಿಶ್ಲೇಷಣೆ',
    pendingSubtitle: 'ಗ್ರಾಹಕರ ಗಡುವು ದಿನಾಂಕ, ಕೊಟ್ಟ ಮಾತು ಮತ್ತು ಹಿಂದಿನ ಪಾವತಿ ಅಭ್ಯಾಸದ ಆಧಾರದ ಮೇಲೆ ಹಣ ಬರುವ ನಿರೀಕ್ಷಿತ ದಿನಾಂಕ',
    addPendingBtn: 'ಬಾಕಿ ಪಾವತಿ ಸೇರಿಸಿ',
    overdueTodayLabel: 'ಇಂದಿಗೆ ಅವಧಿ ಮೀರಿದ ಬಾಕಿ',
    noPendingMsg: 'ಪ್ರಸ್ತುತ ಯಾವುದೇ ಬಾಕಿ ಗ್ರಾಹಕ ಪಾವತಿಗಳಿಲ್ಲ.',
    upcomingTitle: 'ಮುಂಬರುವ ಪಾವತಿಗಳು ಮತ್ತು ಹಣದ ಸಾಮರ್ಥ್ಯ ಪರಿಶೀಲನೆ',
    upcomingSubtitle: 'ಪೂರೈಕೆದಾರರ ಬಿಲ್‌ಗಳು, ಬಾಡಿಗೆ, ಸಂಬಳ ಮತ್ತು ಸಾಲಗಾರರ ಪಾವತಿಗಳ ಪರಿಶೀಲನೆ',
    addUpcomingBtn: 'ಮುಂಬರುವ ಪಾವತಿ ಸೇರಿಸಿ',
    scanBillBtn: 'ಬಿಲ್ ಫೋಟೋ ಸ್ಕ್ಯಾನ್',
    noUpcomingMsg: 'ಯಾವುದೇ ಮುಂಬರುವ ಬಿಲ್ ಅಥವಾ ಪಾವತಿಗಳಿಲ್ಲ.',
    editBtn: 'ತಿದ್ದುಪಡಿ',
    saveBtn: 'ಉಳಿಸಿ',
    cancelBtn: 'ರದ್ದುಮಾಡಿ',
    remindBtn: 'ವಾಟ್ಸಾಪ್ ನೆನಪು',
    settleBtn: 'ಪಾವತಿ ದಾಖಲಿಸಿ',
  },
  hi: {
    presentBalanceTitle: 'वर्तमान बैलेंस',
    presentBalanceSubtitle: 'आज दुकान और बैंक में उपलब्ध कुल नकद राशि',
    editBalanceBtn: 'बैलेंस एडिट करें',
    cashInputLabel: 'वर्तमान नकद / बैंक बैलेंस (₹)',
    reserveInputLabel: 'सुरक्षित रिज़र्व राशि (₹)',
    safeReserveLine: 'अलग रखी सुरक्षित राशि',
    freeToSpendLine: 'खर्च के लिए उपलब्ध राशि',
    pendingTitle: 'ग्राहकों से बाक़ी पैसे और भुगतान आदत विश्लेषण',
    pendingSubtitle: 'ग्राहकों की देय तारीख़, वादा की गई तारीख़ और पिछली भुगतान आदत के आधार पर अनुमानित तारीख़',
    addPendingBtn: 'लंबित भुगतान जोड़ें',
    overdueTodayLabel: 'आज तक बकाया',
    noPendingMsg: 'अभी कोई लंबित ग्राहक भुगतान नहीं है।',
    upcomingTitle: 'आगामी बिल और नकद सामर्थ्य जाँच',
    upcomingSubtitle: 'सप्लायर बिल, किराया, वेतन और साहूकार भुगतान की उपलब्ध नकदी से जाँच',
    addUpcomingBtn: 'आगामी बिल जोड़ें',
    scanBillBtn: 'बिल फ़ोटो स्कैन करें',
    noUpcomingMsg: 'कोई आगामी बिल या भुगतान दर्ज नहीं है।',
    editBtn: 'एडिट',
    saveBtn: 'सेव करें',
    cancelBtn: 'रद्द करें',
    remindBtn: 'व्हाट्सएप याद दिलाएं',
    settleBtn: 'भुगतान दर्ज करें',
  },
  ta: {
    presentBalanceTitle: 'தற்போதைய இருப்பு',
    presentBalanceSubtitle: 'இன்று கையிலும் வங்கியிலும் உள்ள மொத்த பணம்',
    editBalanceBtn: 'இருப்பைத் திருத்து',
    cashInputLabel: 'தற்போதைய ரொக்கம் / வங்கி இருப்பு (₹)',
    reserveInputLabel: 'குறைந்தபட்ச பாதுகாப்பு இருப்பு (₹)',
    safeReserveLine: 'ஒதுக்கப்பட்ட பாதுகாப்பு இருப்பு',
    freeToSpendLine: 'செலவழிக்கக் கூடிய தொகை',
    pendingTitle: 'நிலுவை வரவுகள் மற்றும் கடந்த பழக்க பகுப்பாய்வு',
    pendingSubtitle: 'கெடு தேதி, வாடிக்கையாளர் அளித்த வாக்கு மற்றும் கடந்தகால பழக்கத்தின் அடிப்படையில் பணம் வரும் தேதி',
    addPendingBtn: 'நிலுவை வரவு சேர்',
    overdueTodayLabel: 'இன்று வரை காலாவதியானவை',
    noPendingMsg: 'தற்போது நிலுவையில் உள்ள வாடிக்கையாளர் வரவுகள் எதுவும் இல்லை.',
    upcomingTitle: 'வரவிருக்கும் பில்கள் மற்றும் பணத் தகுதி',
    upcomingSubtitle: 'சப்ளையர் பில்கள், வாடகை, சம்பளம் மற்றும் கடன் தவணைகளின் பணப் பரிசோதனை',
    addUpcomingBtn: 'வரவிருக்கும் பில் சேர்',
    scanBillBtn: 'பில் புகைப்படம் ஸ்கேன்',
    noUpcomingMsg: 'வரவிருக்கும் பில்கள் எதுவும் திட்டமிடப்படவில்லை.',
    editBtn: 'திருத்து',
    saveBtn: 'சேமி',
    cancelBtn: 'ரத்து',
    remindBtn: 'வாட்ஸ்அப் நினைவூட்டல்',
    settleBtn: 'வரவு பதிவு செய்',
  },
  te: {
    presentBalanceTitle: 'ప్రస్తుత బ్యాలెన్స్',
    presentBalanceSubtitle: 'ఈరోజు చేతిలో మరియు బ్యాంకులో అందుబాటులో ఉన్న నగదు',
    editBalanceBtn: 'బ్యాలెన్స్ మార్చండి',
    cashInputLabel: 'ప్రస్తుత నగదు / బ్యాంక్ బ్యాలెన్స్ (₹)',
    reserveInputLabel: 'కనీస సురక్షిత రిజర్వ్ (₹)',
    safeReserveLine: 'పక్కన పెట్టిన సురక్షిత రిజర్వ్',
    freeToSpendLine: 'ఖర్చుకు అందుబాటులో ఉన్న నగదు',
    pendingTitle: 'రావాల్సిన డబ్బు మరియు గత చెల్లింపు అలవాటు విశ్లేషణ',
    pendingSubtitle: 'గడువు తేదీ, కస్టమర్ ఇచ్చిన మాట మరియు గత చెల్లింపు అలవాటు ప్రకారం డబ్బు వచ్చే తేదీ',
    addPendingBtn: 'పెండింగ్ చెల్లింపు జోడించు',
    overdueTodayLabel: 'ఈరోజు నాటికి గడువు దాటినవి',
    noPendingMsg: 'ప్రస్తుతం పెండింగ్ కస్టమర్ చెల్లింపులు ఏవీ లేవు.',
    upcomingTitle: 'రాబోయే బిల్లులు మరియు నగదు స్థోమత',
    upcomingSubtitle: 'సప్లయర్ బిల్లులు, అద్దె, జీతాలు మరియు వడ్డీ వ్యాపారుల చెల్లింపుల తనిఖీ',
    addUpcomingBtn: 'రాబోయే బిల్లు జోడించు',
    scanBillBtn: 'బిల్లు ఫోటో స్కాన్',
    noUpcomingMsg: 'రాబోయే బిల్లులు లేదా ఖర్చులు ఏవీ నమోదు కాలేదు.',
    editBtn: 'సవరించు',
    saveBtn: 'సేవ్ చేయి',
    cancelBtn: 'రద్దు',
    remindBtn: 'వాట్సాప్ రిమైండర్',
    settleBtn: 'చెల్లింపు నమోదు',
  },
  ml: {
    presentBalanceTitle: 'നിലവിലെ ബാലൻസ്',
    presentBalanceSubtitle: 'ഇന്ന് കൈവശവും ബാങ്കിലുമുള്ള ആകെ തുക',
    editBalanceBtn: 'ബാലൻസ് തിരുത്തുക',
    cashInputLabel: 'നിലവിലെ ക്യാഷ് / ബാങ്ക് ബാലൻസ് (₹)',
    reserveInputLabel: 'മിനിമം സുരക്ഷാ കരുതൽ (₹)',
    safeReserveLine: 'മാറ്റിവെച്ച സുരക്ഷാ കരുതൽ',
    freeToSpendLine: 'ചെലവാക്കാൻ ലഭ്യമായ തുക',
    pendingTitle: 'ലഭിക്കാനുള്ള തുകയും മുൻ ശീലമനുസരിച്ചുള്ള വിശകലനവും',
    pendingSubtitle: 'അവസാന തീയതി, ഇടപാടുകാരന്റെ വാക്കും മുൻകാല പേയ്‌മെന്റ് ശീലമനുസരിച്ചുള്ള തീയതിയും',
    addPendingBtn: 'ലഭിക്കാനുള്ള തുക ചേർക്കുക',
    overdueTodayLabel: 'ഇന്നുവരെ കുടിശ്ശികയായത്',
    noPendingMsg: 'നിലവിൽ ഇടപാടുകാരിൽ നിന്ന് ലഭിക്കാനുള്ള കുടിശ്ശികകളൊന്നുമില്ല.',
    upcomingTitle: 'വരാനിരിക്കുന്ന ബില്ലുകളും പണപരിശോധനയും',
    upcomingSubtitle: 'സപ്ലയർ ബില്ലുകൾ, വാടക, ശമ്പളം, പലിശക്കാരുടെ തുക എന്നിവയുടെ പരിശോധന',
    addUpcomingBtn: 'വരാനിരിക്കുന്ന ബിൽ ചേർക്കുക',
    scanBillBtn: 'ബിൽ ഫോട്ടോ സ്കാൻ',
    noUpcomingMsg: 'വരാനിരിക്കുന്ന ബില്ലുകളൊന്നും രേഖപ്പെടുത്തിയിട്ടില്ല.',
    editBtn: 'തിരുത്തുക',
    saveBtn: 'സേവ് ചെയ്യുക',
    cancelBtn: 'റദ്ദാക്കുക',
    remindBtn: 'വാട്ട്‌സ്ആപ്പ് ഓർമ്മപ്പെടുത്തൽ',
    settleBtn: 'തുക രേഖപ്പെടുത്തുക',
  },
};

export const BalanceAndPaymentsTab: React.FC<BalanceAndPaymentsTabProps> = ({
  activeSection,
  businessName,
  isDemoWorkspace = false,
  currentCash,
  minimumReserve,
  pendingPayments,
  upcomingPayments,
  customers,
  mlPredictionsByTxId,
  adviceReport,
  dailyForecast,
  comparisonForecastDays = null,
  forecastTimingMode,
  onChangeForecastTimingMode,
  timeframe,
  onTimeframeChange,
  hasShortfall,
  shortfallDate,
  shortfallAmount,
  language,
  onUpdateBalance,
  onAddPayment,
  onEditPayment,
  onDeletePayment,
  onSettlePayment,
  onRemindCustomer,
  onOpenScanModal,
  onSelectForecastDay,
  onAskVanta,
  onOpenAdviceSection,
}) => {
  const t = TRANSLATIONS[language];
  const pf = getPredictiveFinanceText(language);
  const s = SECTION_STRINGS[language] || SECTION_STRINGS.en;
  const uiExtra = getDashboardExtraStrings(language);

  // Inline Balance Editor State
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [cashInput, setCashInput] = useState(String(currentCash));
  const [reserveInput, setReserveInput] = useState(String(minimumReserve));

  // Filter State for Pending Payments
  const [pendingFilter, setPendingFilter] = useState<
    'all' | 'overdue' | 'optimistic_promise' | 'partial'
  >('all');

  // Add / Edit Payment Form State
  const [editorMode, setEditorMode] = useState<
    'closed' | 'add_pending' | 'add_upcoming' | 'edit'
  >('closed');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formType, setFormType] = useState<'inflow' | 'outflow'>('inflow');
  const [formParty, setFormParty] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formInvoiceNumber, setFormInvoiceNumber] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formPaidAmount, setFormPaidAmount] = useState('0');
  const [formInvoiceDate, setFormInvoiceDate] = useState(ANCHOR_DATE);
  const [formDueDate, setFormDueDate] = useState('2026-10-30');
  const [formPromisedDate, setFormPromisedDate] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Inline Settlement / Partial Payment Drawer State
  const [settlingTxId, setSettlingTxId] = useState<string | null>(null);
  const [settleMode, setSettleMode] = useState<'full' | 'partial'>('full');
  const [settleActualDate, setSettleActualDate] = useState<string>(ANCHOR_DATE);
  const [settlePartialAmount, setSettlePartialAmount] = useState<string>('');

  const affordabilityMap = useMemo(() => {
    const map = new Map<string, ExpenseAffordabilityItem>();
    for (const item of adviceReport.expenseAffordability) {
      map.set(item.transactionId, item);
    }
    return map;
  }, [adviceReport.expenseAffordability]);

  const totalPendingAmount = pendingPayments.reduce(
    (sum, tx) => sum + Math.max(0, tx.amount - (tx.paidAmount || 0)),
    0
  );
  const overduePendingAmount = pendingPayments
    .filter((p) => p.status === 'overdue' || p.dueDate < ANCHOR_DATE)
    .reduce((sum, p) => sum + Math.max(0, p.amount - (p.paidAmount || 0)), 0);

  const totalUpcomingAmount = upcomingPayments.reduce(
    (sum, tx) => sum + Math.max(0, tx.amount - (tx.paidAmount || 0)),
    0
  );

  const freeAboveReserve = Math.max(0, currentCash - minimumReserve);

  const filteredPendingPayments = useMemo(() => {
    return pendingPayments
      .filter((tx) => {
        const pred = mlPredictionsByTxId[tx.id];
        if (pendingFilter === 'overdue') {
          return tx.status === 'overdue' || tx.dueDate < ANCHOR_DATE;
        }
        if (pendingFilter === 'optimistic_promise') {
          return Boolean(pred?.hasOptimisticPromiseWarning);
        }
        if (pendingFilter === 'partial') {
          return Boolean(tx.paidAmount && tx.paidAmount > 0 && tx.paidAmount < tx.amount);
        }
        return true;
      })
      .slice()
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [pendingPayments, mlPredictionsByTxId, pendingFilter]);

  const openBalanceEditor = () => {
    setCashInput(toNativeDigits(String(currentCash), language));
    setReserveInput(toNativeDigits(String(minimumReserve), language));
    setIsEditingBalance(true);
  };

  const handleSaveBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedCash = parseFloat(fromNativeDigits(cashInput).replace(/[^0-9.]/g, ''));
    const parsedReserve = parseFloat(fromNativeDigits(reserveInput).replace(/[^0-9.]/g, ''));
    if (isNaN(parsedCash) || parsedCash < 0) return;
    await onUpdateBalance(
      Math.round(parsedCash),
      !isNaN(parsedReserve) && parsedReserve >= 0
        ? Math.round(parsedReserve)
        : minimumReserve
    );
    setIsEditingBalance(false);
  };

  const openAddForm = (type: 'inflow' | 'outflow') => {
    setEditingId(null);
    setFormType(type);
    setFormParty('');
    setFormPhone('');
    const rawCode =
      type === 'inflow'
        ? `INV-${Math.floor(440 + Math.random() * 500)}`
        : `BILL-${Math.floor(200 + Math.random() * 600)}`;
    setFormInvoiceNumber(localizeInvoiceCode(rawCode, language));
    setFormTitle('');
    setFormAmount('');
    setFormPaidAmount(toNativeDigits('0', language));
    setFormInvoiceDate(ANCHOR_DATE);
    setFormDueDate('2026-10-30');
    setFormPromisedDate('');
    setFormNotes('');
    setEditorMode(type === 'inflow' ? 'add_pending' : 'add_upcoming');
  };

  const openEditForm = (tx: Transaction) => {
    setEditingId(tx.id);
    setFormType(tx.type);
    setFormParty(localizePartyName(tx.partyName, language));
    setFormPhone(tx.contactPhone ? toNativeDigits(tx.contactPhone, language) : '');
    setFormInvoiceNumber(
      tx.invoiceNumber ? localizeInvoiceCode(tx.invoiceNumber, language) : ''
    );
    setFormTitle(localizeTxTitle(tx.title, language));
    setFormAmount(toNativeDigits(String(tx.amount), language));
    setFormPaidAmount(toNativeDigits(String(tx.paidAmount || 0), language));
    setFormInvoiceDate(tx.invoiceDate || ANCHOR_DATE);
    setFormDueDate(tx.dueDate);
    setFormPromisedDate(tx.promisedDate || '');
    setFormNotes(tx.notes || '');
    setEditorMode('edit');
  };

  const handlePartyNameChange = (val: string) => {
    setFormParty(val);
    if (formType === 'inflow') {
      const existing = customers.find(
        (c) => c.name.trim().toLowerCase() === val.trim().toLowerCase()
      );
      if (existing && existing.contactPhone && existing.contactPhone !== 'N/A' && !formPhone) {
        setFormPhone(existing.contactPhone);
      }
    }
  };

  const handleSavePaymentForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(fromNativeDigits(formAmount));
    const paidAmt = Math.max(0, parseFloat(fromNativeDigits(formPaidAmount)) || 0);
    if (!formParty.trim() || isNaN(amt) || amt <= 0 || !formDueDate) return;

    const cleanTotal = Math.round(amt);
    const cleanPaid = Math.min(cleanTotal - 1, Math.round(paidAmt));
    const matchedCust =
      formType === 'inflow'
        ? customers.find(
            (c) => c.name.trim().toLowerCase() === formParty.trim().toLowerCase()
          )
        : undefined;

    const nextStatus =
      cleanPaid > 0
        ? 'partially_paid'
        : formDueDate < ANCHOR_DATE
        ? 'overdue'
        : 'expected';

    if (editorMode === 'edit' && editingId) {
      await onEditPayment(editingId, {
        type: formType,
        customerId: matchedCust?.id,
        partyName: formParty.trim(),
        contactPhone: formPhone.trim() || undefined,
        invoiceNumber: formInvoiceNumber.trim() || undefined,
        title:
          formTitle.trim() ||
          (formType === 'inflow'
            ? `Order (${formParty.trim()})`
            : `Bill (${formParty.trim()})`),
        amount: cleanTotal,
        paidAmount: cleanPaid > 0 ? cleanPaid : 0,
        invoiceDate: formInvoiceDate || ANCHOR_DATE,
        dueDate: formDueDate,
        promisedDate: formType === 'inflow' ? formPromisedDate.trim() || null : null,
        status: nextStatus,
        notes: formNotes.trim(),
      });
    } else {
      await onAddPayment({
        type: formType,
        customerId: matchedCust?.id,
        partyName: formParty.trim(),
        contactPhone: formPhone.trim() || undefined,
        invoiceNumber: formInvoiceNumber.trim() || undefined,
        title:
          formTitle.trim() ||
          (formType === 'inflow'
            ? `Customer Invoice (${formParty.trim()})`
            : `Upcoming Bill (${formParty.trim()})`),
        amount: cleanTotal,
        paidAmount: cleanPaid > 0 ? cleanPaid : undefined,
        invoiceDate: formInvoiceDate || ANCHOR_DATE,
        dueDate: formDueDate,
        promisedDate: formType === 'inflow' ? formPromisedDate.trim() || null : null,
        status: nextStatus,
        category: formType === 'inflow' ? 'b2b_invoice' : 'supplier',
        notes: formNotes.trim(),
        isDemoData: isDemoWorkspace,
      });
    }

    setEditorMode('closed');
    setEditingId(null);
  };

  const handleOpenSettleDrawer = (tx: Transaction) => {
    const remaining = Math.max(0, tx.amount - (tx.paidAmount || 0));
    setSettlingTxId(tx.id);
    setSettleMode('full');
    setSettleActualDate(ANCHOR_DATE);
    setSettlePartialAmount(toNativeDigits(String(Math.round(remaining / 2)), language));
  };

  const handleConfirmSettlement = async (tx: Transaction) => {
    const remaining = Math.max(0, tx.amount - (tx.paidAmount || 0));
    if (settleMode === 'partial') {
      const part = Math.round(
        parseFloat(fromNativeDigits(settlePartialAmount).replace(/[^0-9.]/g, '')) || 0
      );
      if (part <= 0 || part >= remaining) {
        await onSettlePayment(tx.id, { actualPaidDate: settleActualDate });
      } else {
        await onSettlePayment(tx.id, {
          actualPaidDate: settleActualDate,
          partialAmount: part,
        });
      }
    } else {
      await onSettlePayment(tx.id, { actualPaidDate: settleActualDate });
    }
    setSettlingTxId(null);
  };

  const handleSplitOutflowHalf = async (tx: Transaction) => {
    const remaining = Math.max(0, tx.amount - (tx.paidAmount || 0));
    if (remaining < 1000) return;
    const firstHalf = Math.round(remaining / 2);
    const secondHalf = remaining - firstHalf;

    // Shift second installment +7 days
    const parts = tx.dueDate.split('-').map(Number);
    const dt = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + 7));
    const secondDate = dt.toISOString().slice(0, 10);

    await onEditPayment(tx.id, {
      amount: firstHalf + (tx.paidAmount || 0),
      title: `${tx.title} (Part 1/2)`,
    });
    await onAddPayment({
      type: 'outflow',
      partyName: tx.partyName,
      title: `${tx.title} (Part 2/2 Deferred +7d)`,
      amount: secondHalf,
      invoiceDate: tx.invoiceDate || ANCHOR_DATE,
      dueDate: secondDate,
      status: 'expected',
      category: tx.category,
      invoiceNumber: tx.invoiceNumber ? `${tx.invoiceNumber}-P2` : undefined,
      notes: 'Split 50/50 to protect minimum cash reserve',
      isDemoData: isDemoWorkspace,
    });
  };

  const renderPaymentEditor = () => {
    if (editorMode === 'closed') return null;
    const editorHeading =
      editorMode === 'edit'
        ? `${formType === 'inflow' ? uiExtra.editPendingHeading : uiExtra.editUpcomingHeading} — ${localizePartyName(formParty, language)}`
        : editorMode === 'add_pending'
        ? uiExtra.addPendingHeading
        : uiExtra.addUpcomingHeading;

    return (
      <section className="khata-card rounded-3xl p-5 sm:p-6 border border-[#14532D] bg-[#FFFDF9] space-y-4">
        <div className="flex items-center justify-between gap-3 border-b border-[#EADDC5] pb-3">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#1C1917]">
              {editorHeading}
            </h2>
            <p className="text-sm text-[#57534E]">
              {formType === 'inflow' ? uiExtra.promisedKeepNote : s.upcomingSubtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEditorMode('closed')}
            className="min-h-[40px] px-3 py-1.5 rounded-xl bg-white border border-[#D6C5A9] text-[#44403C] text-sm font-bold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
          >
            <X className="w-4 h-4" />
            <span>{s.cancelBtn}</span>
          </button>
        </div>

        <form
          onSubmit={handleSavePaymentForm}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end"
        >
          <div>
            <label className="block text-xs font-extrabold text-[#44403C] mb-1">
              {formType === 'inflow'
                ? uiExtra.customerNameField
                : uiExtra.supplierPayeeField}
            </label>
            <input
              type="text"
              list={formType === 'inflow' ? 'known-customers-list' : undefined}
              value={formParty}
              onChange={(e) => handlePartyNameChange(e.target.value)}
              placeholder={
                formType === 'inflow'
                  ? localizePartyName('Sri Balaji Kirana', language)
                  : localizePartyName('Mahadev Traders', language)
              }
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-[#D6C5A9] font-bold text-sm text-[#1C1917] focus:outline-none focus:border-[#14532D]"
              required
            />
            {formType === 'inflow' && (
              <datalist id="known-customers-list">
                {customers.map((c) => (
                  <option key={c.id} value={c.name}>
                    {localizePartyName(c.name, language)}
                  </option>
                ))}
              </datalist>
            )}
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#44403C] mb-1">
              {uiExtra.invoiceNoField}
            </label>
            <input
              type="text"
              value={formInvoiceNumber}
              onChange={(e) => setFormInvoiceNumber(e.target.value)}
              placeholder={localizeInvoiceCode('INV-425', language)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-[#D6C5A9] font-mono text-sm text-[#1C1917] focus:outline-none focus:border-[#14532D]"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#44403C] mb-1">
              {uiExtra.totalAmountField}
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={formAmount}
              onChange={(e) => setFormAmount(e.target.value)}
              placeholder={toNativeDigits('24000', language)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-[#D6C5A9] font-mono tabular-nums font-extrabold text-base text-[#1C1917] focus:outline-none focus:border-[#14532D]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#44403C] mb-1">
              {uiExtra.alreadyPaidField}
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={formPaidAmount}
              onChange={(e) => setFormPaidAmount(e.target.value)}
              placeholder={toNativeDigits('0', language)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-[#D6C5A9] font-mono tabular-nums text-sm text-[#1C1917] focus:outline-none focus:border-[#14532D]"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#44403C] mb-1">
              {pf.invoiceDateLabel}
            </label>
            <input
              type="date"
              value={formInvoiceDate}
              onChange={(e) => setFormInvoiceDate(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white border border-[#D6C5A9] font-mono tabular-nums text-sm text-[#1C1917] focus:outline-none focus:border-[#14532D]"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#44403C] mb-1">
              {pf.dueDateLabel} *
            </label>
            <input
              type="date"
              value={formDueDate}
              onChange={(e) => setFormDueDate(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white border border-[#D6C5A9] font-mono tabular-nums font-bold text-sm text-[#1C1917] focus:outline-none focus:border-[#14532D]"
              required
            />
          </div>

          {formType === 'inflow' && (
            <div>
              <label className="block text-xs font-extrabold text-[#1E3A8A] mb-1">
                {pf.promisedDateLabel}
              </label>
              <input
                type="date"
                value={formPromisedDate}
                onChange={(e) => setFormPromisedDate(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white border border-[#93C5FD] font-mono tabular-nums text-sm text-[#1C1917] focus:outline-none focus:border-[#1E3A8A]"
              />
            </div>
          )}

          {formType === 'inflow' && (
            <div>
              <label className="block text-xs font-extrabold text-[#44403C] mb-1">
                {uiExtra.phoneField}
              </label>
              <input
                type="tel"
                value={formPhone}
                onChange={(e) => setFormPhone(fromNativeDigits(e.target.value))}
                placeholder={toNativeDigits('9845123401', language)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-[#D6C5A9] font-mono tabular-nums text-sm text-[#1C1917] focus:outline-none focus:border-[#14532D]"
              />
            </div>
          )}

          <div className={formType === 'inflow' ? 'sm:col-span-2 lg:col-span-2' : 'sm:col-span-2'}>
            <label className="block text-xs font-extrabold text-[#44403C] mb-1">
              {uiExtra.descriptionField}
            </label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-[#D6C5A9] text-sm text-[#1C1917] focus:outline-none focus:border-[#14532D]"
            />
          </div>

          <div
            className={`${
              formType === 'inflow' ? 'sm:col-span-2 lg:col-span-2' : 'sm:col-span-2 lg:col-span-4'
            } flex flex-wrap items-center justify-end gap-2.5 pt-1`}
          >
            <button
              type="button"
              onClick={() => setEditorMode('closed')}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-white border border-[#D6C5A9] text-[#44403C] text-sm font-bold cursor-pointer whitespace-nowrap"
            >
              {s.cancelBtn}
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-6 py-2 rounded-xl bg-[#14532D] hover:bg-[#166534] text-white text-sm font-extrabold inline-flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <Check className="w-4 h-4 text-[#FDE68A]" />
              <span>{s.saveBtn}</span>
            </button>
          </div>
        </form>
      </section>
    );
  };

  // =========================================================================
  // VIEW 1: PRESENT BALANCE & 7 / 30 / 90-DAY CASH OUTLOOK
  // =========================================================================
  if (activeSection === 'present_balance') {
    const horizonCards = [
      { key: 7 as const, title: t.days7Btn, summary: adviceReport.horizons.days7 },
      { key: 30 as const, title: t.days30Btn, summary: adviceReport.horizons.days30 },
      { key: 90 as const, title: t.days90Btn, summary: adviceReport.horizons.days90 },
    ];

    const explainBalancePrompt =
      language === 'kn'
        ? 'ನನ್ನ ಮುಂದಿನ ೭, ೩೦ ಮತ್ತು ೯೦ ದಿನಗಳ ನಗದು ಸ್ಥಿತಿ ಮತ್ತು ಯಾವ ಗ್ರಾಹಕರನ್ನು ಮೊದಲು ಕೇಳಬೇಕು ಎಂಬುದನ್ನು ಸರಳವಾಗಿ ವಿವರಿಸಿ.'
        : 'Explain my 7, 30 and 90-day cash outlook and who I should follow up with first in simple words.';

    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <section className="khata-card rounded-3xl p-6 sm:p-8 border border-[#D6C5A9] space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[#14532D] font-extrabold text-base sm:text-lg">
                <Wallet className="w-5 h-5 shrink-0" />
                <span>{s.presentBalanceTitle}</span>
              </div>
              <p className="text-sm text-[#57534E]">
                {s.presentBalanceSubtitle} · {localizeBusinessLabel(businessName, language)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {!isEditingBalance && (
                <button
                  type="button"
                  onClick={openBalanceEditor}
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-[#FAF1DF] hover:bg-[#F3E5C8] border border-[#D6C5A9] text-[#1C1917] text-sm font-extrabold inline-flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap"
                >
                  <Edit3 className="w-4 h-4 text-[#14532D]" />
                  <span>{s.editBalanceBtn}</span>
                </button>
              )}
              {onOpenAdviceSection && (
                <button
                  type="button"
                  onClick={onOpenAdviceSection}
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-[#14532D] hover:bg-[#166534] text-white text-sm font-extrabold inline-flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap"
                >
                  <TrendingUp className="w-4 h-4 text-[#FDE68A]" />
                  <span>{pf.navAdviceSimulator}</span>
                </button>
              )}
            </div>
          </div>

          {isEditingBalance ? (
            <form
              onSubmit={handleSaveBalance}
              className="pt-4 border-t border-[#EFE6D5] space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-[#44403C] mb-1.5">
                    {s.cashInputLabel}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cashInput}
                    onChange={(e) => setCashInput(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border-2 border-[#14532D] font-mono tabular-nums font-extrabold text-2xl text-[#1C1917] focus:outline-none"
                    autoFocus
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-[#44403C] mb-1.5">
                    {s.reserveInputLabel}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={reserveInput}
                    onChange={(e) => setReserveInput(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#D6C5A9] font-mono tabular-nums font-bold text-xl text-[#1C1917] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditingBalance(false)}
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-white border border-[#D6C5A9] text-[#44403C] text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>{s.cancelBtn}</span>
                </button>
                <button
                  type="submit"
                  className="min-h-[42px] px-5 py-2 rounded-xl bg-[#14532D] hover:bg-[#166534] text-white text-sm font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4 text-[#FDE68A]" />
                  <span>{s.saveBtn}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="text-4xl sm:text-5xl font-black font-mono tabular-nums text-[#1C1917] tracking-tight">
                {formatRupee(currentCash, language)}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#EFE6D5]">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#57534E]">
                    <Shield className="w-4 h-4 text-[#14532D]" />
                    <span>{s.safeReserveLine}</span>
                  </div>
                  <div className="text-xl font-extrabold font-mono tabular-nums text-[#1C1917]">
                    {formatRupee(minimumReserve, language)}
                  </div>
                </div>

                <div className="space-y-1 sm:border-l sm:border-[#EFE6D5] sm:pl-6">
                  <div className="text-xs font-bold text-[#14532D]">
                    {s.freeToSpendLine}
                  </div>
                  <div className="text-xl font-extrabold font-mono tabular-nums text-[#14532D]">
                    {formatRupee(freeAboveReserve, language)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 7, 30 & 90-Day Cash-Flow Horizons */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {horizonCards.map(({ key, title, summary }) => {
            const isSelected = timeframe === key;
            const statusText = summary.hasShortageBelowZero
              ? `${uiExtra.cashDeficitBadge}: -${formatRupee(summary.shortageAmount, language)}`
              : summary.hasReserveBreach
              ? `${uiExtra.belowReserveBadge}: ${formatRupee(summary.reserveGapAmount, language)}`
              : t.statusSafe;

            return (
              <button
                key={key}
                type="button"
                onClick={() => onTimeframeChange(key)}
                className={`khata-card rounded-3xl p-5 text-left border transition-colors cursor-pointer space-y-3 ${
                  isSelected
                    ? 'border-[#14532D] bg-[#FFFDF9]'
                    : 'border-[#E5D9C3] bg-[#FFFDF9]/85 hover:bg-[#FAF1DF]/45'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-extrabold text-[#1C1917]">{title}</span>
                  <span
                    className={`text-xs font-bold ${
                      summary.hasShortageBelowZero
                        ? 'text-rose-700'
                        : summary.hasReserveBreach
                        ? 'text-amber-800'
                        : 'text-[#14532D]'
                    }`}
                  >
                    {statusText}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-[#57534E] block">
                    {uiExtra.endingBalanceHorizon(key)}
                  </span>
                  <span
                    className={`text-2xl font-black font-mono tabular-nums ${
                      summary.endingBalance < 0 ? 'text-rose-700' : 'text-[#1C1917]'
                    }`}
                  >
                    {formatRupee(summary.endingBalance, language)}
                  </span>
                </div>

                <div className="pt-2 border-t border-[#EFE6D5] text-xs text-[#57534E] space-y-1 font-mono tabular-nums">
                  <div className="flex justify-between">
                    <span className="font-sans">{uiExtra.receiptsInLabel}</span>
                    <span className="text-[#14532D] font-bold">
                      +{formatRupee(summary.predictedInflows, language)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans">{uiExtra.billsOutLabel}</span>
                    <span className="text-[#9A3412] font-bold">
                      -{formatRupee(summary.scheduledOutflows, language)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans">
                      {uiExtra.lowestOnDate(formatLocalDate(summary.lowestBalanceDate, language))}
                    </span>
                    <span
                      className={`font-bold ${
                        summary.lowestBalance < 0
                          ? 'text-rose-700'
                          : summary.lowestBalance < minimumReserve
                          ? 'text-amber-800'
                          : 'text-[#1C1917]'
                      }`}
                    >
                      {formatRupee(summary.lowestBalance, language)}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </section>

        {/* Cash-Flow Shortage & Delay Alert Banner */}
        <section
          className={`rounded-3xl p-5 border flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
            hasShortfall || adviceReport.horizons.days30.hasShortageBelowZero
              ? 'bg-rose-50/90 border-rose-300'
              : adviceReport.horizons.days30.hasReserveBreach
              ? 'bg-amber-50/90 border-amber-300'
              : 'bg-emerald-50/90 border-emerald-300'
          }`}
        >
          <div className="flex items-start gap-3">
            {hasShortfall || adviceReport.horizons.days30.hasShortageBelowZero ? (
              <AlertTriangle className="w-6 h-6 text-rose-700 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-6 h-6 text-[#14532D] shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-extrabold text-[#1C1917]">
                {hasShortfall
                  ? t.shortfallHeading(
                      formatLocalDate(shortfallDate, language),
                      formatRupee(shortfallAmount, language)
                    )
                  : getSimpleDelayImpactHeadline(adviceReport.delayCashImpactSummary, language)}
              </h3>
              <p className="text-sm text-[#44403C]">
                {adviceReport.horizons.days30.affectedDelayedInvoices.length > 0
                  ? `${uiExtra.delayedInvoicesAffecting} ${adviceReport.horizons.days30.affectedDelayedInvoices
                      .slice(0, 3)
                      .map(
                        (inv) =>
                          `${localizePartyName(inv.partyName, language)} (${localizeInvoiceCode(inv.invoiceNumber, language)}, ${formatRupee(inv.amount, language)} → ${formatLocalDate(inv.predictedDate, language)})`
                      )
                      .join(' · ')}`
                  : t.safeReasonDetail}
              </p>
            </div>
          </div>

          {onAskVanta && (
            <button
              type="button"
              onClick={() => onAskVanta(explainBalancePrompt)}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-white hover:bg-[#FAF1DF] border border-[#D6C5A9] text-[#14532D] text-xs sm:text-sm font-extrabold inline-flex items-center gap-1.5 cursor-pointer shrink-0 self-start lg:self-center whitespace-nowrap"
            >
              <Mic className="w-4 h-4" />
              <span>{uiExtra.askAssistantExplainBtn}</span>
            </button>
          )}
        </section>

        {/* Forecast Receipt Timing Mode Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs sm:text-sm font-bold text-[#44403C]">
            {uiExtra.chartTimingBasisLabel}
          </div>
          <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-[#FAF1DF] border border-[#D6C5A9] rounded-xl">
            {(
              [
                { id: 'ml_predicted', label: pf.forecastModeML },
                { id: 'promised', label: pf.forecastModePromised },
                { id: 'contractual_due', label: pf.forecastModeDue },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChangeForecastTimingMode(opt.id)}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap ${
                  forecastTimingMode === opt.id
                    ? 'bg-[#14532D] text-white'
                    : 'text-[#44403C] hover:text-[#1C1917]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Day-by-Day Forecast Chart */}
        <ForecastChart
          days={dailyForecast}
          comparisonDays={comparisonForecastDays}
          minimumReserve={minimumReserve}
          timeframe={timeframe}
          onTimeframeChange={onTimeframeChange}
          scenarioName={
            forecastTimingMode === 'ml_predicted'
              ? null
              : forecastTimingMode === 'promised'
              ? pf.forecastModePromised
              : pf.forecastModeDue
          }
          onSelectDate={onSelectForecastDay}
          language={language}
        />
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: PENDING PAYMENTS & PAST PAYMENT HABIT ANALYSIS
  // =========================================================================
  if (activeSection === 'pending_payments') {
    const optimisticCount = pendingPayments.filter(
      (tx) => mlPredictionsByTxId[tx.id]?.hasOptimisticPromiseWarning
    ).length;
    const overdueCount = pendingPayments.filter(
      (p) => p.status === 'overdue' || p.dueDate < ANCHOR_DATE
    ).length;
    const partialCount = pendingPayments.filter(
      (p) => p.paidAmount && p.paidAmount > 0
    ).length;

    return (
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Summary Header for Pending Payments */}
        <section className="khata-card rounded-3xl p-6 sm:p-7 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[#1E3A8A] font-extrabold text-base sm:text-lg">
                <ArrowDownLeft className="w-5 h-5 shrink-0" />
                <span>{s.pendingTitle}</span>
              </div>
              <p className="text-sm text-[#57534E] mt-0.5">{s.pendingSubtitle}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onOpenScanModal}
                className="min-h-[42px] px-3.5 py-2 rounded-xl bg-white hover:bg-[#FAF1DF] border border-[#D6C5A9] text-[#14532D] text-xs sm:text-sm font-extrabold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Scan className="w-4 h-4" />
                <span>{s.scanBillBtn}</span>
              </button>

              <button
                type="button"
                onClick={() => openAddForm('inflow')}
                className="min-h-[42px] px-4 py-2 rounded-xl bg-[#14532D] hover:bg-[#166534] text-white text-sm font-extrabold inline-flex items-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4 text-[#FDE68A]" />
                <span>{s.addPendingBtn}</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-baseline justify-between gap-4 pt-3 border-t border-[#EFE6D5]">
            <div>
              <span className="text-xs font-bold text-[#57534E] block">
                {uiExtra.totalPendingBanner(pendingPayments.length)}
              </span>
              <span className="text-3xl sm:text-4xl font-black font-mono tabular-nums text-[#1E3A8A]">
                {formatRupee(totalPendingAmount, language)}
              </span>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs font-bold text-rose-700 block">
                {s.overdueTodayLabel} ({formatHeaderDate(ANCHOR_DATE, language)})
              </span>
              <span className="text-xl font-extrabold font-mono tabular-nums text-rose-700">
                {formatRupee(overduePendingAmount, language)}
              </span>
            </div>
          </div>

          {/* Interactive Filter Controls */}
          <div className="pt-2 flex flex-wrap items-center gap-1.5">
            {(
              [
                {
                  id: 'all',
                  label: `${t.filterAll} (${formatIndianNumber(pendingPayments.length, language)})`,
                },
                {
                  id: 'overdue',
                  label: `${t.filterOverdue} (${formatIndianNumber(overdueCount, language)})`,
                },
                {
                  id: 'optimistic_promise',
                  label: `${uiExtra.earlyPromiseBadge} (${formatIndianNumber(optimisticCount, language)})`,
                },
                {
                  id: 'partial',
                  label: uiExtra.partialPaidBadge(formatIndianNumber(partialCount, language)),
                },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setPendingFilter(f.id)}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  pendingFilter === f.id
                    ? 'bg-[#14532D] text-white'
                    : 'bg-[#FAF1DF] text-[#44403C] hover:text-[#1C1917]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </section>

        {renderPaymentEditor()}

        {/* Pending Payments Ledger List with Simple Pattern Analysis */}
        <section className="khata-card rounded-3xl overflow-hidden">
          <div className="divide-y divide-[#EFE6D5]">
            {filteredPendingPayments.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <p className="text-[#57534E] text-base max-w-xl mx-auto">
                  {uiExtra.noPendingEmpty}
                </p>
                <button
                  type="button"
                  onClick={() => openAddForm('inflow')}
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-[#14532D] text-white text-sm font-extrabold inline-flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#FDE68A]" />
                  <span>{s.addPendingBtn}</span>
                </button>
              </div>
            ) : (
              filteredPendingPayments.map((tx) => {
                const remaining = Math.max(0, tx.amount - (tx.paidAmount || 0));
                const isOverdue = tx.status === 'overdue' || tx.dueDate < ANCHOR_DATE;
                const pred = mlPredictionsByTxId[tx.id];
                const predCopy = pred ? getSimplePredictionCopy(pred, language) : null;
                const isSettlingThis = settlingTxId === tx.id;
                const displayParty = localizePartyName(tx.partyName, language);
                const displayTitle = localizeTxTitle(tx, language);
                const displayInv = localizeInvoiceCode(tx.invoiceNumber || tx.id, language);

                const explainTxPrompt =
                  language === 'kn'
                    ? `${displayParty} (${displayInv}) ಅವರ ಬಾಕಿ ಪಾವತಿ ಮತ್ತು ಹಿಂದಿನ ಪಾವತಿ ಅಭ್ಯಾಸದ ಪ್ರಕಾರ ಹಣ ಯಾವಾಗ ಬರುತ್ತದೆ ಎಂದು ಸರಳವಾಗಿ ವಿವರಿಸಿ.`
                    : `Explain in simple words when ${tx.partyName} (${tx.invoiceNumber || tx.id}) is likely to pay based on previous payment patterns.`;

                return (
                  <div
                    key={tx.id}
                    className="p-5 sm:p-6 space-y-4 hover:bg-[#FAF1DF]/25 transition-colors"
                  >
                    {/* Header Row: Customer Name, Unboxed Metadata, Amount */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 space-y-1">
                        <h3 className="text-lg sm:text-xl font-extrabold text-[#1C1917]">
                          {displayParty}
                        </h3>
                        <p className="text-sm text-[#57534E]">{displayTitle}</p>

                        {/* Unboxed Metadata Line (Zero-Pill Discipline) */}
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#57534E] font-medium">
                          <span className="font-mono tabular-nums text-[#1C1917] font-bold">
                            {displayInv}
                          </span>
                          {tx.invoiceDate && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums">
                                {uiExtra.billedOnPrefix} {formatLocalDate(tx.invoiceDate, language)}
                              </span>
                            </>
                          )}
                          <span aria-hidden="true">·</span>
                          <span
                            className={
                              isOverdue
                                ? 'text-rose-700 font-bold'
                                : tx.paidAmount && tx.paidAmount > 0
                                ? 'text-amber-800 font-bold'
                                : 'text-[#14532D] font-semibold'
                            }
                          >
                            {isOverdue
                              ? pred && pred.currentOverdueDays > 0
                                ? uiExtra.daysOverdueSuffix(pred.currentOverdueDays)
                                : t.filterOverdue
                              : tx.paidAmount && tx.paidAmount > 0
                              ? uiExtra.partialPaidBadge(formatRupee(tx.paidAmount, language))
                              : t.pendingLabel}
                          </span>
                          {predCopy && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-[#44403C]">{predCopy.basisBadge}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="block text-xl sm:text-2xl font-extrabold font-mono tabular-nums text-[#1E3A8A]">
                          {formatRupee(remaining, language)}
                        </span>
                        {tx.paidAmount && tx.paidAmount > 0 ? (
                          <span className="block text-xs text-[#57534E] font-mono tabular-nums">
                            {uiExtra.ofTotalSuffix(formatRupee(tx.amount, language))}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* 3-Column Date & Pattern Comparison Grid */}
                    {pred && predCopy && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#EFE6D5] text-sm">
                        <div>
                          <span className="text-xs font-bold text-[#57534E] block">
                            {pf.dueDateLabel}
                          </span>
                          <span className="font-mono tabular-nums font-bold text-[#1C1917]">
                            {formatLocalDate(tx.dueDate, language)}
                          </span>
                        </div>

                        <div>
                          <span className="text-xs font-bold text-[#57534E] block">
                            {pf.promisedDateLabel}
                          </span>
                          {tx.promisedDate ? (
                            <span className="font-mono tabular-nums font-bold text-[#1E3A8A]">
                              {formatLocalDate(tx.promisedDate, language)}
                            </span>
                          ) : (
                            <span className="text-xs text-[#78716C]">
                              {uiExtra.noneRecordedYet}
                            </span>
                          )}
                        </div>

                        <div>
                          <span className="text-xs font-bold text-[#14532D] block">
                            {uiExtra.expectedRangeHeader}
                          </span>
                          <span className="font-mono tabular-nums font-extrabold text-[#14532D]">
                            {formatLocalDate(pred.predictedDate, language)}
                          </span>
                          <span className="block text-xs font-mono tabular-nums text-[#57534E]">
                            {formatLocalDate(pred.predictedRangeStart, language)} –{' '}
                            {formatLocalDate(pred.predictedRangeEnd, language)} ·{' '}
                            {predCopy.delayBadge} · {predCopy.confidenceBadge}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Simple Everyday Pattern Explanation + Promise Comparison + Reasons */}
                    {pred && predCopy && (
                      <div className="p-3.5 rounded-2xl bg-[#FAF1DF]/60 border border-[#E5D9C3] space-y-2 text-xs sm:text-sm text-[#292524]">
                        <p className="leading-relaxed">
                          <span className="font-extrabold text-[#14532D]">
                            {predCopy.predictionHeading}:{' '}
                          </span>
                          {predCopy.predictionBody}
                        </p>

                        {predCopy.promiseBody && (
                          <p
                            className={`leading-relaxed pt-1.5 border-t border-[#E5D9C3] ${
                              pred.hasOptimisticPromiseWarning
                                ? 'text-amber-950 font-semibold'
                                : 'text-[#44403C]'
                            }`}
                          >
                            <span className="font-extrabold">
                              {predCopy.promiseHeading}:{' '}
                            </span>
                            {predCopy.promiseBody}
                          </p>
                        )}

                        {predCopy.reasons.length > 0 && (
                          <div className="pt-1.5 border-t border-[#E5D9C3] space-y-1">
                            <span className="font-extrabold text-[#44403C] block">
                              {predCopy.reasonsHeading}:
                            </span>
                            <ul className="list-disc pl-5 space-y-0.5 text-xs text-[#44403C]">
                              {predCopy.reasons.map((reason, idx) => (
                                <li key={idx}>{reason}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Inline Settlement / Partial Payment Recording Panel */}
                    {isSettlingThis && (
                      <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#14532D] space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-extrabold text-[#1C1917]">
                            {uiExtra.recordSettlementTitle}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSettlingTxId(null)}
                            className="text-xs font-bold text-[#57534E] hover:text-[#1C1917] cursor-pointer"
                          >
                            {s.cancelBtn}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                          <div>
                            <div className="grid grid-cols-2 gap-1 p-1 bg-[#FAF1DF] rounded-xl border border-[#D6C5A9]">
                              <button
                                type="button"
                                onClick={() => setSettleMode('full')}
                                className={`py-1.5 px-2 rounded-lg text-xs font-bold cursor-pointer ${
                                  settleMode === 'full'
                                    ? 'bg-[#14532D] text-white'
                                    : 'text-[#44403C]'
                                }`}
                              >
                                {formatRupee(remaining, language)}
                              </button>
                              <button
                                type="button"
                                onClick={() => setSettleMode('partial')}
                                className={`py-1.5 px-2 rounded-lg text-xs font-bold cursor-pointer ${
                                  settleMode === 'partial'
                                    ? 'bg-[#14532D] text-white'
                                    : 'text-[#44403C]'
                                }`}
                              >
                                {uiExtra.recordPartialBtn}
                              </button>
                            </div>
                          </div>

                          {settleMode === 'partial' && (
                            <div>
                              <label className="block text-xs font-bold text-[#44403C] mb-1">
                                {uiExtra.amountReceivedNowLabel}
                              </label>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={settlePartialAmount}
                                onChange={(e) => setSettlePartialAmount(e.target.value)}
                                className="w-full min-h-[40px] px-3 py-1.5 rounded-xl bg-white border border-[#D6C5A9] font-mono tabular-nums font-bold text-sm"
                              />
                            </div>
                          )}

                          <div>
                            <label className="block text-xs font-bold text-[#44403C] mb-1">
                              {uiExtra.actualPaymentDateLabel}
                            </label>
                            <input
                              type="date"
                              value={settleActualDate}
                              onChange={(e) => setSettleActualDate(e.target.value)}
                              className="w-full min-h-[40px] px-3 py-1.5 rounded-xl bg-white border border-[#D6C5A9] font-mono tabular-nums text-sm"
                            />
                          </div>

                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleConfirmSettlement(tx)}
                              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#14532D] hover:bg-[#166534] text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                            >
                              <CheckCircle2 className="w-4 h-4 text-[#FDE68A]" />
                              <span>
                                {settleMode === 'full'
                                  ? uiExtra.confirmFullSettlementBtn
                                  : uiExtra.recordPartialBtn}
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => openEditForm(tx)}
                        className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#FAF1DF] border border-[#D6C5A9] text-[#1C1917] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#14532D]" />
                        <span>{s.editBtn}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenSettleDrawer(tx)}
                        className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-[#14532D] text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{s.settleBtn}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onRemindCustomer(tx)}
                        className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#FAF1DF] border border-[#D6C5A9] text-[#15803D] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{uiExtra.whatsappRemindBtn}</span>
                      </button>

                      {onAskVanta && (
                        <button
                          type="button"
                          onClick={() => onAskVanta(explainTxPrompt)}
                          className="min-h-[38px] px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF1DF] border border-[#D6C5A9] text-[#44403C] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                        >
                          <Info className="w-3.5 h-3.5 text-[#1E3A8A]" />
                          <span>{uiExtra.explainShortBtn}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onDeletePayment(tx.id)}
                        className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-white hover:bg-rose-50 border border-[#D6C5A9] hover:border-rose-300 text-[#78716C] hover:text-rose-700 text-xs font-bold inline-flex items-center gap-1 cursor-pointer ml-auto"
                        aria-label={`${s.cancelBtn} ${displayParty}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: UPCOMING PAYMENTS & EXPENSE AFFORDABILITY CHECK
  // =========================================================================
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Summary Header for Upcoming Payments */}
      <section className="khata-card rounded-3xl p-6 sm:p-7 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#9A3412] font-extrabold text-base sm:text-lg">
              <ArrowUpRight className="w-5 h-5 shrink-0" />
              <span>{s.upcomingTitle}</span>
            </div>
            <p className="text-sm text-[#57534E] mt-0.5">{s.upcomingSubtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenScanModal}
              className="min-h-[42px] px-3.5 py-2 rounded-xl bg-white hover:bg-[#FAF1DF] border border-[#D6C5A9] text-[#14532D] text-xs sm:text-sm font-extrabold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Scan className="w-4 h-4" />
              <span>{s.scanBillBtn}</span>
            </button>

            <button
              type="button"
              onClick={() => openAddForm('outflow')}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-[#9A3412] hover:bg-[#7C2D12] text-white text-sm font-extrabold inline-flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4 text-[#FDE68A]" />
              <span>{s.addUpcomingBtn}</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-baseline justify-between gap-4 pt-3 border-t border-[#EFE6D5]">
          <div>
            <span className="text-xs font-bold text-[#57534E] block">
              {uiExtra.totalUpcomingBanner(upcomingPayments.length)}
            </span>
            <span className="text-3xl sm:text-4xl font-black font-mono tabular-nums text-[#9A3412]">
              {formatRupee(totalUpcomingAmount, language)}
            </span>
          </div>

          <span className="text-xs font-medium text-[#57534E]">
            {pf.presentDatePrefix}: {formatHeaderDate(ANCHOR_DATE, language)}
          </span>
        </div>
      </section>

      {renderPaymentEditor()}

      {/* Upcoming Payments Ledger List with Affordability Verdicts */}
      <section className="khata-card rounded-3xl overflow-hidden">
        <div className="divide-y divide-[#EFE6D5]">
          {upcomingPayments.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <p className="text-[#57534E] text-base">{uiExtra.noUpcomingEmpty}</p>
              <button
                type="button"
                onClick={onOpenScanModal}
                className="min-h-[42px] px-4 py-2 rounded-xl bg-[#14532D] text-white text-sm font-extrabold inline-flex items-center gap-2 cursor-pointer"
              >
                <Scan className="w-4 h-4 text-[#FDE68A]" />
                <span>{s.scanBillBtn}</span>
              </button>
            </div>
          ) : (
            upcomingPayments
              .slice()
              .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
              .map((tx) => {
                const isNoticeLinked = tx.id.startsWith('tx-notice-');
                const remaining = Math.max(0, tx.amount - (tx.paidAmount || 0));
                const afford = affordabilityMap.get(tx.id);
                const affordCopy = afford
                  ? getSimpleAffordabilityCopy(afford, minimumReserve, language)
                  : null;
                const displayParty = localizePartyName(tx.partyName, language);
                const displayTitle = localizeTxTitle(tx, language);
                const displayInv = tx.invoiceNumber
                  ? localizeInvoiceCode(tx.invoiceNumber, language)
                  : '';

                const verdictLabel =
                  afford?.verdict === 'unaffordable_shortage'
                    ? pf.unaffordableLabel
                    : afford?.verdict === 'tight_dips_reserve'
                    ? pf.tightReserveLabel
                    : pf.affordableLabel;

                const verdictColor =
                  afford?.verdict === 'unaffordable_shortage'
                    ? 'text-rose-700'
                    : afford?.verdict === 'tight_dips_reserve'
                    ? 'text-amber-800'
                    : 'text-[#14532D]';

                return (
                  <div
                    key={tx.id}
                    className="p-5 sm:p-6 space-y-3 hover:bg-[#FAF1DF]/25 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 space-y-1">
                        <h3 className="text-lg font-extrabold text-[#1C1917] truncate">
                          {displayParty}
                        </h3>
                        <p className="text-sm text-[#57534E] truncate">{displayTitle}</p>

                        <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
                          <Calendar className="w-3.5 h-3.5 text-[#78716C]" />
                          <span className="font-mono tabular-nums text-[#44403C]">
                            {t.duePrefix}: {formatLocalDate(tx.dueDate, language)}
                          </span>
                          {displayInv && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums text-[#57534E]">
                                {displayInv}
                              </span>
                            </>
                          )}
                          <span aria-hidden="true">·</span>
                          <span className={`font-bold ${verdictColor}`}>
                            {isNoticeLinked ? `${uiExtra.legalNoticeDemandBadge} · ` : ''}
                            {verdictLabel}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="block text-xl sm:text-2xl font-extrabold font-mono tabular-nums text-[#9A3412]">
                          {formatRupee(remaining, language)}
                        </span>
                        {afford && (
                          <span className="block text-xs font-mono tabular-nums text-[#57534E]">
                            {uiExtra.cashAfterBillLabel}{' '}
                            <strong
                              className={
                                afford.projectedBalanceOnDueDate < 0
                                  ? 'text-rose-700'
                                  : afford.projectedBalanceOnDueDate < minimumReserve
                                  ? 'text-amber-800'
                                  : 'text-[#14532D]'
                              }
                            >
                              {formatRupee(afford.projectedBalanceOnDueDate, language)}
                            </strong>
                          </span>
                        )}
                      </div>
                    </div>

                    {afford && affordCopy && (
                      <div className="p-3.5 rounded-2xl bg-[#FAF1DF]/55 border border-[#E5D9C3] text-xs sm:text-sm text-[#44403C] space-y-1">
                        <p>{affordCopy.explanation}</p>
                        <p className="font-bold text-[#1C1917]">
                          {uiExtra.actionPrefix} {affordCopy.recommendedStep}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {!isNoticeLinked && (
                        <button
                          type="button"
                          onClick={() => openEditForm(tx)}
                          className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#FAF1DF] border border-[#D6C5A9] text-[#1C1917] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#14532D]" />
                          <span>{s.editBtn}</span>
                        </button>
                      )}

                      {!isNoticeLinked &&
                        afford &&
                        afford.verdict !== 'affordable' &&
                        remaining >= 2000 && (
                          <button
                            type="button"
                            onClick={() => handleSplitOutflowHalf(tx)}
                            className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                          >
                            <Split className="w-3.5 h-3.5" />
                            <span>{t.splitHalfBtn}</span>
                          </button>
                        )}

                      <button
                        type="button"
                        onClick={() =>
                          onSettlePayment(tx.id, { actualPaidDate: ANCHOR_DATE })
                        }
                        className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-[#14532D] text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{t.markPaidBtn}</span>
                      </button>

                      {!isNoticeLinked && (
                        <button
                          type="button"
                          onClick={() => onDeletePayment(tx.id)}
                          className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-white hover:bg-rose-50 border border-[#D6C5A9] hover:border-rose-300 text-[#78716C] hover:text-rose-700 text-xs font-bold inline-flex items-center gap-1 cursor-pointer ml-auto"
                          aria-label={`${s.cancelBtn} ${displayParty}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </section>
    </div>
  );
};
