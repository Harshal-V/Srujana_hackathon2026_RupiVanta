import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Upload,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Calendar,
  Scale,
  UserCheck,
  Loader2,
  Check,
  Lock,
  ClipboardPaste,
  FileUp,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Frown,
  Meh,
  Smile,
  Volume2,
  MessageSquare,
  Eye,
  BellRing,
  ListChecks
} from 'lucide-react';
import {
  LegalNotice,
  NoticeSeverity,
  NoticeStatus,
  FieldConfidence,
  AdvisorVerdict
} from '../types/notices';
import { DayForecast } from '../types/cashflow';
import { AppLanguage } from '../types/munimji';
import {
  TRANSLATIONS,
  formatDaysLeftLabel,
  formatIndianNumber,
  formatLocalDate,
  formatRupee,
  getAdvisorVerdictLabel,
  getConfidenceLabel,
  getLocalizedNotice,
  getNoticeStatusLabel,
  getSeverityPlainLabel
} from '../utils/translations';
import { getSampleNoticeByKey } from '../data/sampleNotices';
import {
  maskSensitiveIndianIDs,
  addCalendarDays,
  computeNoticeCountdown
} from '../utils/privacyMasker';
import { downloadTextAsDocx } from '../utils/docxGenerator';
import { calculateCashForecast } from '../utils/forecastEngine';
import { ANCHOR_DATE } from '../data/initialData';

interface NoticesViewProps {
  notices: LegalNotice[];
  selectedNoticeId: string;
  onSelectNotice: (id: string) => void;
  onUpsertNotice: (notice: LegalNotice) => void;
  onUpdateNoticeStatus: (id: string, status: NoticeStatus) => void;
  onUpdateReceivedDate: (id: string, newReceivedDate: string) => void;
  onToggleChecklistItem: (noticeId: string, itemId: string) => void;
  onUpdateDraftText: (
    noticeId: string,
    mode: 'reply' | 'extension',
    newText: string
  ) => void;
  businessName: string;
  currentCash: number;
  minimumReserve: number;
  dailyForecast: DayForecast[];
  baseTransactions: any[];
  onInspectCashDate: (dateStr: string) => void;
  onOpenWhatsAppForNotice: (notice: LegalNotice) => void;
  onSpeakNoticeExplanation: (notice: LegalNotice) => void;
  language: AppLanguage;
}

export const NoticesView: React.FC<NoticesViewProps> = ({
  notices,
  selectedNoticeId,
  onSelectNotice,
  onUpsertNotice,
  onUpdateNoticeStatus,
  onUpdateReceivedDate,
  onToggleChecklistItem,
  onUpdateDraftText,
  businessName,
  currentCash,
  minimumReserve,
  dailyForecast,
  baseTransactions,
  onInspectCashDate,
  onOpenWhatsAppForNotice,
  onSpeakNoticeExplanation,
  language,
}) => {
  const t = TRANSLATIONS[language];

  // Live clock tick so countdown stays genuinely live
  const [nowTick, setNowTick] = useState<number>(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNowTick(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  // Progressive disclosure states
  const [showMoreDetails, setShowMoreDetails] = useState<boolean>(false);
  const [showAllNoticesList, setShowAllNoticesList] = useState<boolean>(false);

  // Upload & Paste UI states
  const [inputMode, setInputMode] = useState<'file' | 'paste'>('file');
  const [isDragging, setIsDragging] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [friendlyFallbackShown, setFriendlyFallbackShown] = useState<boolean>(false);
  const [lastMaskStats, setLastMaskStats] = useState<{
    count: number;
    types: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const resultCardRef = useRef<HTMLDivElement | null>(null);

  // Draft editor state ('reply' | 'extension') & Copy toast
  const [draftMode, setDraftMode] = useState<'reply' | 'extension'>('reply');
  const [copiedFlag, setCopiedFlag] = useState(false);

  // Sort open notices by nearest deadline so the most urgent notice is always first
  const openNoticesSorted = useMemo(() => {
    return notices
      .filter((n) => n.status !== 'Closed')
      .sort((a, b) => a.deadlineDate.localeCompare(b.deadlineDate));
  }, [notices]);

  const allNoticesSorted = useMemo(() => {
    return [...notices].sort((a, b) => {
      if (a.status === 'Closed' && b.status !== 'Closed') return 1;
      if (a.status !== 'Closed' && b.status === 'Closed') return -1;
      return a.deadlineDate.localeCompare(b.deadlineDate);
    });
  }, [notices]);

  const activeNoticeRaw = useMemo(() => {
    return (
      notices.find((n) => n.id === selectedNoticeId) ||
      openNoticesSorted[0] ||
      notices[0] ||
      null
    );
  }, [notices, selectedNoticeId, openNoticesSorted]);

  const activeNotice = useMemo(() => {
    if (!activeNoticeRaw) return null;
    return getLocalizedNotice(activeNoticeRaw, language);
  }, [activeNoticeRaw, language]);

  useEffect(() => {
    setDraftMode('reply');
    setCopiedFlag(false);
  }, [activeNoticeRaw?.id]);

  const dueThisWeekCount = useMemo(() => {
    return openNoticesSorted.filter((n) => {
      const cd = computeNoticeCountdown(n.deadlineDate, ANCHOR_DATE, nowTick);
      return cd.daysLeft <= 7;
    }).length;
  }, [openNoticesSorted, nowTick]);

  const totalMoneyMayNeedToPay = useMemo(() => {
    return openNoticesSorted.reduce((sum, n) => sum + (n.amountDemanded || 0), 0);
  }, [openNoticesSorted]);

  // Live preview of IDs masked in pasted text
  const pasteMaskPreview = useMemo(() => {
    if (!pastedText.trim()) return null;
    return maskSensitiveIndianIDs(pastedText);
  }, [pastedText]);

  // Cash-Flow Link calculation for activeNotice
  const cashImpact = useMemo(() => {
    if (!activeNoticeRaw || activeNoticeRaw.amountDemanded <= 0) return null;

    const targetDate = activeNoticeRaw.deadlineDate;
    let matchedDay = dailyForecast.find((d) => d.date === targetDate);
    let extendedDaysNeeded = 90;

    if (!matchedDay) {
      const diffMs =
        new Date(targetDate + 'T00:00:00').getTime() -
        new Date(ANCHOR_DATE + 'T00:00:00').getTime();
      const diffDays = Math.max(95, Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 5);
      extendedDaysNeeded = Math.min(diffDays, 365);

      const allObligations = [
        ...baseTransactions,
        ...notices
          .filter((n) => n.amountDemanded > 0 && n.status !== 'Closed' && n.linkedToCashflow)
          .map((n) => ({
            id: `tx-notice-${n.id}`,
            type: 'outflow' as const,
            title: `Notice: ${n.title}`,
            partyName: n.authorityName,
            amount: n.amountDemanded,
            dueDate: n.deadlineDate,
            status: 'expected' as const,
            category: 'taxes' as const,
            invoiceNumber: n.referenceNumber,
          })),
      ];
      const extForecast = calculateCashForecast(
        currentCash,
        minimumReserve,
        allObligations,
        ANCHOR_DATE,
        extendedDaysNeeded,
        null
      );
      matchedDay = extForecast.dailyForecast.find((d) => d.date === targetDate);
    }

    const otherNoticeObligations = notices
      .filter(
        (n) =>
          n.id !== activeNoticeRaw.id &&
          n.amountDemanded > 0 &&
          n.status !== 'Closed' &&
          n.linkedToCashflow
      )
      .map((n) => ({
        id: `tx-notice-${n.id}`,
        type: 'outflow' as const,
        title: `Notice: ${n.title}`,
        partyName: n.authorityName,
        amount: n.amountDemanded,
        dueDate: n.deadlineDate,
        status: 'expected' as const,
        category: 'taxes' as const,
        invoiceNumber: n.referenceNumber,
      }));

    const withoutThisForecast = calculateCashForecast(
      currentCash,
      minimumReserve,
      [...baseTransactions, ...otherNoticeObligations],
      ANCHOR_DATE,
      extendedDaysNeeded,
      null
    );
    const dayWithoutNotice = withoutThisForecast.dailyForecast.find(
      (d) => d.date === targetDate
    );

    const balanceBeforeNotice = dayWithoutNotice ? dayWithoutNotice.endingBalance : currentCash;
    const projectedBalanceOnDay =
      activeNoticeRaw.status === 'Closed'
        ? balanceBeforeNotice - activeNoticeRaw.amountDemanded
        : matchedDay
        ? matchedDay.endingBalance
        : balanceBeforeNotice - activeNoticeRaw.amountDemanded;

    const causesShortfall = projectedBalanceOnDay < 0;
    const breachesReserve = projectedBalanceOnDay >= 0 && projectedBalanceOnDay < minimumReserve;

    return {
      targetDate,
      formattedDate: formatLocalDate(targetDate, language),
      projectedBalanceOnDay,
      causesShortfall,
      breachesReserve,
    };
  }, [
    activeNoticeRaw,
    dailyForecast,
    baseTransactions,
    notices,
    currentCash,
    minimumReserve,
    language,
  ]);

  // Convert API response into LegalNotice
  const buildNoticeFromApiPayload = (raw: any, sourceSnippet?: string): LegalNotice => {
    const severityVal: NoticeSeverity =
      raw.severity === 'Urgent' || raw.severity === 'Needs attention' || raw.severity === 'Routine'
        ? raw.severity
        : 'Needs attention';

    const normalizeConf = (val: any): FieldConfidence =>
      val === 'Read from notice' ? 'Read from notice' : 'Estimated, please confirm';

    const issueDate =
      typeof raw.issueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.issueDate)
        ? raw.issueDate
        : '2026-10-18';
    const receivedDate =
      typeof raw.receivedDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.receivedDate)
        ? raw.receivedDate
        : '2026-10-20';
    const statutoryDays =
      typeof raw.statutoryDaysFromReceipt === 'number' && raw.statutoryDaysFromReceipt > 0
        ? Math.round(raw.statutoryDaysFromReceipt)
        : 30;
    const deadlineDate = addCalendarDays(receivedDate, statutoryDays);

    const rawLines = Array.isArray(raw.whatIsAskedLines)
      ? raw.whatIsAskedLines.filter(Boolean).slice(0, 3)
      : [t.guidanceDisclaimer];

    const verdictVal: AdvisorVerdict =
      raw.advisorGuidance?.verdict === 'Yes' ||
      raw.advisorGuidance?.verdict === 'Maybe' ||
      raw.advisorGuidance?.verdict === 'No'
        ? raw.advisorGuidance.verdict
        : 'Maybe';

    const authVerdict =
      raw.authenticity?.verdict === 'genuine' ||
      raw.authenticity?.verdict === 'suspicious' ||
      raw.authenticity?.verdict === 'verify_carefully'
        ? raw.authenticity.verdict
        : 'verify_carefully';

    return {
      id: `notice-${Date.now()}`,
      title: raw.title || 'GST / Tax Notice',
      referenceNumber: raw.referenceNumber || `REF-${Date.now().toString().slice(-6)}`,
      status: 'New',
      createdAt: ANCHOR_DATE,
      authorityName: raw.authorityName || 'Department Officer',
      authenticity: {
        verdict: authVerdict,
        summary: raw.authenticity?.summary || t.checkCarefully,
        dinValue: raw.authenticity?.dinValue || null,
        dinCheckNote: raw.authenticity?.dinCheckNote || '—',
        officialDomainValue: raw.authenticity?.officialDomainValue || null,
        domainCheckNote: raw.authenticity?.domainCheckNote || '—',
        requestsPersonalAccount: Boolean(raw.authenticity?.requestsPersonalAccount),
        paymentCheckNote: raw.authenticity?.paymentCheckNote || '—',
      },
      lawSection: raw.lawSection || '—',
      lawPlainExplanation: raw.lawPlainExplanation || '—',
      whatIsAskedLines: rawLines,
      amountDemanded:
        typeof raw.amountDemanded === 'number' && raw.amountDemanded >= 0
          ? Math.round(raw.amountDemanded)
          : 0,
      amountBreakdown: raw.amountBreakdown || undefined,
      severity: severityVal,
      severityReason: raw.severityReason || t.guidanceDisclaimer,
      issueDate,
      receivedDate,
      receivedDateConfirmed: false,
      statutoryDaysFromReceipt: statutoryDays,
      deadlineDate,
      deadlineCalculationBasis: t.recalculatedNote(
        statutoryDays,
        formatLocalDate(receivedDate, language),
        formatLocalDate(deadlineDate, language)
      ),
      ignoreTimeline:
        Array.isArray(raw.ignoreTimeline) && raw.ignoreTimeline.length > 0
          ? raw.ignoreTimeline.slice(0, 4)
          : [],
      documentsChecklist:
        Array.isArray(raw.documentsChecklist) && raw.documentsChecklist.length > 0
          ? raw.documentsChecklist.map((d: any, idx: number) => ({
              id: `chk-${Date.now()}-${idx}`,
              label: d.label || `${idx + 1}`,
              detail: d.detail || undefined,
              checked: false,
            }))
          : [],
      advisorGuidance: {
        verdict: verdictVal,
        roleLabel: raw.advisorGuidance?.roleLabel || 'CA',
        reasons:
          Array.isArray(raw.advisorGuidance?.reasons) && raw.advisorGuidance.reasons.length > 0
            ? raw.advisorGuidance.reasons
            : [],
      },
      draftReplyText:
        raw.draftReplyText ||
        `Date: ${formatLocalDate(ANCHOR_DATE, 'en')}\n\nTo,\n${
          raw.authorityName || 'The Officer'
        }\n\nRef: ${raw.referenceNumber || 'Notice'}\n\nRespected Sir/Madam,\nWe are submitting our purchase invoices and bank statements for verification.\n\nYours faithfully,\nFor ${businessName}`,
      extensionLetterText:
        raw.extensionLetterText ||
        `Date: ${formatLocalDate(ANCHOR_DATE, 'en')}\n\nTo,\n${
          raw.authorityName || 'The Officer'
        }\n\nRef: ${raw.referenceNumber || 'Notice'}\n\nRespected Sir/Madam,\nKindly grant 15 additional days to gather all supporting invoices and bank records.\n\nYours faithfully,\nFor ${businessName}`,
      confidence: {
        sender: normalizeConf(raw.confidence?.sender),
        lawSection: normalizeConf(raw.confidence?.lawSection),
        whatIsAsked: normalizeConf(raw.confidence?.whatIsAsked),
        amountDemanded: normalizeConf(raw.confidence?.amountDemanded),
        deadline: normalizeConf(raw.confidence?.deadline),
      },
      sourceSnippet,
      linkedToCashflow: true,
    };
  };

  // Instant zero-API sample loader (never fails!)
  const handleLoadSample = (sampleKey: 'gst_drc01' | 'it_143_1' | 'ni_138_cheque') => {
    setFriendlyFallbackShown(false);
    setLastMaskStats(null);

    const existing = notices.find((n) => n.sampleKey === sampleKey);
    if (existing) {
      if (existing.status === 'Closed') {
        onUpsertNotice({ ...existing, status: 'New', linkedToCashflow: true });
      }
      onSelectNotice(existing.id);
    } else {
      const sample = getSampleNoticeByKey(sampleKey);
      onUpsertNotice(sample);
      onSelectNotice(sample.id);
    }

    setTimeout(() => {
      resultCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  const triggerSampleFallback = (
    hintKey: 'gst_drc01' | 'it_143_1' | 'ni_138_cheque' = 'gst_drc01'
  ) => {
    setFriendlyFallbackShown(true);
    const existing = notices.find((n) => n.sampleKey === hintKey);
    if (existing) {
      onSelectNotice(existing.id);
    } else {
      const fallbackSample = getSampleNoticeByKey(hintKey);
      onUpsertNotice(fallbackSample);
      onSelectNotice(fallbackSample.id);
    }
    setTimeout(() => {
      resultCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  const handleAnalyzePastedText = async () => {
    if (!pastedText.trim()) return;

    const masked = maskSensitiveIndianIDs(pastedText);
    setLastMaskStats({
      count: masked.maskedCount,
      types: masked.typesFound.join(', '),
    });

    setIsAnalyzing(true);
    setFriendlyFallbackShown(false);

    try {
      const res = await fetch('/api/notices/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textContent: masked.maskedText,
          businessName,
          language,
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload.success || !payload.notice) {
        triggerSampleFallback(payload.fallbackSampleKey || 'gst_drc01');
        return;
      }

      const decoded = buildNoticeFromApiPayload(
        payload.notice,
        masked.maskedText.slice(0, 280)
      );
      onUpsertNotice(decoded);
      onSelectNotice(decoded.id);
      setPastedText('');
      setTimeout(() => {
        resultCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    } catch {
      triggerSampleFallback('gst_drc01');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const processUploadedFile = (file: File) => {
    setFriendlyFallbackShown(false);
    setIsAnalyzing(true);

    const isTextFile =
      file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt');

    if (isTextFile) {
      const textReader = new FileReader();
      textReader.onload = async () => {
        const rawText = String(textReader.result || '');
        const masked = maskSensitiveIndianIDs(rawText);
        setLastMaskStats({
          count: masked.maskedCount,
          types: masked.typesFound.join(', '),
        });
        try {
          const res = await fetch('/api/notices/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              textContent: masked.maskedText,
              fileName: file.name,
              businessName,
              language,
            }),
          });
          const payload = await res.json().catch(() => ({}));
          if (!res.ok || !payload.success || !payload.notice) {
            triggerSampleFallback(payload.fallbackSampleKey || 'gst_drc01');
            return;
          }
          const decoded = buildNoticeFromApiPayload(
            payload.notice,
            masked.maskedText.slice(0, 280)
          );
          onUpsertNotice(decoded);
          onSelectNotice(decoded.id);
        } catch {
          triggerSampleFallback('gst_drc01');
        } finally {
          setIsAnalyzing(false);
        }
      };
      textReader.onerror = () => {
        setIsAnalyzing(false);
        triggerSampleFallback('gst_drc01');
      };
      textReader.readAsText(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = String(reader.result || '');
      const inferredMime =
        file.type ||
        (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');

      setLastMaskStats({ count: 0, types: '' });

      try {
        const res = await fetch('/api/notices/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileBase64: base64Data,
            mimeType: inferredMime,
            fileName: file.name,
            businessName,
            language,
          }),
        });

        const payload = await res.json().catch(() => ({}));
        if (!res.ok || !payload.success || !payload.notice) {
          triggerSampleFallback(payload.fallbackSampleKey || 'gst_drc01');
          return;
        }

        const decoded = buildNoticeFromApiPayload(payload.notice, file.name);
        onUpsertNotice(decoded);
        onSelectNotice(decoded.id);
        setTimeout(() => {
          resultCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 80);
      } catch {
        triggerSampleFallback('gst_drc01');
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.onerror = () => {
      setIsAnalyzing(false);
      triggerSampleFallback('gst_drc01');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processUploadedFile(droppedFile);
      return;
    }
    const droppedText = e.dataTransfer.getData('text/plain');
    if (droppedText && droppedText.trim()) {
      setInputMode('paste');
      setPastedText(droppedText);
    }
  };

  const handleCopyDraft = async () => {
    if (!activeNoticeRaw) return;
    const textToCopy =
      draftMode === 'reply'
        ? activeNoticeRaw.draftReplyText
        : activeNoticeRaw.extensionLetterText;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedFlag(true);
      setTimeout(() => setCopiedFlag(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = textToCopy;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedFlag(true);
      setTimeout(() => setCopiedFlag(false), 2000);
    }
  };

  const handleDownloadDocx = () => {
    if (!activeNoticeRaw || !activeNotice) return;
    const activeText =
      draftMode === 'reply'
        ? activeNoticeRaw.draftReplyText
        : activeNoticeRaw.extensionLetterText;
    const safeRef = activeNoticeRaw.referenceNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
    const docHeading =
      draftMode === 'reply'
        ? `${t.mainReplyBtn} — ${activeNotice.title}`
        : `${t.requestMoreTimeBtn} — ${activeNotice.title}`;
    const filename =
      draftMode === 'reply'
        ? `Reply_${safeRef}.docx`
        : `Request_More_Time_${safeRef}.docx`;

    downloadTextAsDocx({
      title: docHeading,
      referenceNumber: activeNoticeRaw.referenceNumber,
      bodyText: activeText,
      filename,
    });
  };

  const renderSeverityFace = (severity: NoticeSeverity) => {
    if (severity === 'Urgent') {
      return (
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-800">
          <Frown className="w-7 h-7 text-rose-600 shrink-0" />
          <span className="text-xl font-extrabold">
            {getSeverityPlainLabel(severity, language)}
          </span>
        </div>
      );
    }
    if (severity === 'Needs attention') {
      return (
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900">
          <Meh className="w-7 h-7 text-amber-600 shrink-0" />
          <span className="text-xl font-extrabold">
            {getSeverityPlainLabel(severity, language)}
          </span>
        </div>
      );
    }
    return (
      <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-800">
        <Smile className="w-7 h-7 text-emerald-600 shrink-0" />
        <span className="text-xl font-extrabold">
          {getSeverityPlainLabel(severity, language)}
        </span>
      </div>
    );
  };

  const renderConfidenceBadge = (conf: FieldConfidence) => {
    const isDirect = conf === 'Read from notice';
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-base font-bold ${
          isDirect
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            : 'bg-amber-50 text-amber-900 border border-amber-200'
        }`}
      >
        {isDirect ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        ) : (
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
        )}
        <span>{getConfidenceLabel(conf, language)}</span>
      </span>
    );
  };

  const activeCountdown = useMemo(() => {
    if (!activeNoticeRaw) return null;
    return computeNoticeCountdown(activeNoticeRaw.deadlineDate, ANCHOR_DATE, nowTick);
  }, [activeNoticeRaw, nowTick]);

  const completedDocsCount = useMemo(() => {
    if (!activeNotice) return 0;
    return activeNotice.documentsChecklist.filter((d) => d.checked).length;
  }, [activeNotice]);

  const maskFooterText = lastMaskStats
    ? lastMaskStats.count > 0
      ? t.privacyIdsMaskedCount(lastMaskStats.count, lastMaskStats.types)
      : t.privacyNoRawIds
    : t.privacyMaskedFooter;

  return (
    <div className="space-y-6 max-w-4xl mx-auto" ref={resultCardRef}>
      {/* =====================================================================
          SUMMARY STRIP AT TOP ("3 open, 1 due this week" + Plain Words)
         ===================================================================== */}
      <div className="khata-card rounded-3xl px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2.5 text-xl font-extrabold text-[#1C1917]">
          <Scale className="w-6 h-6 text-[#14532D] shrink-0" />
          <span>{t.openAndDueSummary(openNoticesSorted.length, dueThisWeekCount)}</span>
        </div>

        {totalMoneyMayNeedToPay > 0 && (
          <div className="text-lg font-bold text-[#44403C]">
            {t.totalMoneyMayPay}:{' '}
            <span className="font-mono font-extrabold text-[#1C1917]">
              {formatRupee(totalMoneyMayNeedToPay, language)}
            </span>
          </div>
        )}
      </div>

      {/* Friendly Fallback Banner if AI offline */}
      {friendlyFallbackShown && (
        <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 text-lg font-semibold flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
          <span>{t.aiFallbackFriendlyMsg}</span>
        </div>
      )}

      {/* =====================================================================
          MAIN RESULT CARD — SHOWS 4 THINGS FIRST + RECEIPT DATE RECALCULATOR
         ===================================================================== */}
      {activeNotice && activeNoticeRaw && activeCountdown && (
        <motion.section
          key={activeNotice.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24 }}
          className="khata-card rounded-3xl overflow-hidden"
        >
          {/* Khata Ledger Header */}
          <div className="khata-ledger-header px-5 sm:px-6 py-5 border-b border-[#E5D9C3] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base font-bold text-[#9A3412] uppercase tracking-wide">
                  {activeNotice.id === openNoticesSorted[0]?.id
                    ? t.card1Title
                    : t.selectedNoticeBadge}
                </span>
                <span className="text-base font-mono text-[#57534E]">
                  · {activeNotice.referenceNumber}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C1917] leading-snug">
                {activeNotice.title}
              </h1>
            </div>

            {activeCountdown.daysLeft <= 7 && activeNotice.status !== 'Closed' && (
              <button
                type="button"
                onClick={() => onOpenWhatsAppForNotice(activeNoticeRaw)}
                className="min-h-[50px] px-4 py-2.5 rounded-2xl bg-[#15803D] hover:bg-[#166534] text-white text-lg font-extrabold inline-flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <BellRing className="w-5 h-5 text-[#FDE68A]" />
                <span>{t.remindCaWhatsAppBtn}</span>
              </button>
            )}
          </div>

          {/* THE 4 CORE ITEMS SHOWN FIRST */}
          <div className="p-5 sm:p-7 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* 1. WHO SENT IT (with genuine or suspicious check + confidence badge) */}
              <div className="p-5 rounded-2xl bg-[#FAF1DF]/70 border border-[#E5D9C3] space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-lg font-extrabold text-[#57534E]">
                    1. {t.whoSentIt}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-base font-extrabold ${
                      activeNotice.authenticity.verdict === 'genuine'
                        ? 'bg-emerald-100 text-emerald-900'
                        : activeNotice.authenticity.verdict === 'suspicious'
                        ? 'bg-rose-100 text-rose-900'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    <ShieldCheck className="w-5 h-5 shrink-0" />
                    <span>
                      {activeNotice.authenticity.verdict === 'genuine'
                        ? t.looksGenuine
                        : activeNotice.authenticity.verdict === 'suspicious'
                        ? t.suspiciousCheck
                        : t.checkCarefully}
                    </span>
                  </span>
                </div>

                <p className="text-xl font-extrabold text-[#1C1917] leading-snug">
                  {activeNotice.authorityName}
                </p>

                <div>{renderConfidenceBadge(activeNotice.confidence.sender)}</div>
              </div>

              {/* 2. HOW SERIOUS (face icon + one-line reason) */}
              <div className="p-5 rounded-2xl bg-[#FAF1DF]/70 border border-[#E5D9C3] flex flex-col justify-between gap-3">
                <div className="space-y-2.5">
                  <span className="text-lg font-extrabold text-[#57534E] block">
                    2. {t.howSerious}
                  </span>
                  {renderSeverityFace(activeNotice.severity)}
                  <p className="text-lg text-[#44403C] leading-snug">
                    {activeNotice.severityReason}
                  </p>
                </div>
              </div>
            </div>

            {/* 3. WHAT THEY WANT (Max 3 short plain lines + ₹ Amount + confidence badge) */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white border-2 border-[#E5D9C3] space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-lg font-extrabold text-[#57534E]">
                    3. {t.whatTheyWant}
                  </span>
                  {renderConfidenceBadge(activeNotice.confidence.whatIsAsked)}
                </div>

                {activeNotice.amountDemanded > 0 && (
                  <span className="px-4 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-xl font-extrabold text-rose-800">
                    {t.amountAskedLabel}:{' '}
                    <span className="font-mono">
                      {formatRupee(activeNotice.amountDemanded, language)}
                    </span>
                  </span>
                )}
              </div>

              <ul className="space-y-2.5 text-xl text-[#1C1917] font-semibold leading-relaxed">
                {activeNotice.whatIsAskedLines.map((line, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full bg-[#14532D] text-white font-mono text-base font-bold flex items-center justify-center shrink-0 mt-1">
                      {formatIndianNumber(i + 1, language)}
                    </span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 4. LAST DATE WITH LIVE COUNTDOWN + RECEIPT DATE PROMPT & RECALCULATION */}
            <div
              className={`p-5 sm:p-6 rounded-2xl border-2 space-y-4 ${
                activeCountdown.daysLeft <= 7
                  ? 'bg-rose-50 border-rose-300'
                  : activeCountdown.daysLeft <= 15
                  ? 'bg-amber-50 border-amber-300'
                  : 'bg-emerald-50 border-emerald-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-lg font-extrabold text-[#57534E]">
                      4. {t.lastDate}
                    </span>
                    {renderConfidenceBadge(activeNotice.confidence.deadline)}
                  </div>
                  <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[#1C1917] block">
                    {formatLocalDate(activeNotice.deadlineDate, language)}
                  </span>
                </div>

                <span
                  className={`px-5 py-2.5 rounded-2xl font-mono text-xl sm:text-2xl font-extrabold self-start sm:self-auto ${
                    activeCountdown.daysLeft <= 7
                      ? 'bg-rose-600 text-white urgent-days-pulse'
                      : activeCountdown.daysLeft <= 15
                      ? 'bg-amber-600 text-white'
                      : 'bg-emerald-700 text-white'
                  }`}
                >
                  {formatDaysLeftLabel(
                    activeCountdown.daysLeft,
                    language,
                    activeCountdown.hoursRemainingInDay
                  )}
                </span>
              </div>

              {/* Ask "On which date did you receive this notice?" + 1-line recalculation */}
              <div className="pt-4 border-t border-[#D6C5A9]/70 space-y-2.5">
                <label
                  htmlFor="notice-received-date"
                  className="text-lg font-extrabold text-[#1C1917] flex items-center gap-2"
                >
                  <Calendar className="w-5 h-5 text-[#14532D] shrink-0" />
                  <span>{t.receivedDateQuestion}</span>
                </label>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3.5">
                  <input
                    id="notice-received-date"
                    type="date"
                    value={activeNoticeRaw.receivedDate}
                    onChange={(e) => {
                      if (e.target.value) {
                        onUpdateReceivedDate(activeNoticeRaw.id, e.target.value);
                      }
                    }}
                    className="min-h-[48px] px-4 py-2 rounded-xl bg-white border border-[#CBBBA0] font-mono text-lg font-bold text-[#1C1917] self-start"
                  />
                  <p className="text-lg text-[#44403C] font-medium">
                    {activeNotice.deadlineCalculationBasis}
                  </p>
                </div>
              </div>
            </div>

            {/* PRIMARY BIG TOUCH BUTTONS (>= 54px tall) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
              <button
                type="button"
                onClick={() => onSpeakNoticeExplanation(activeNoticeRaw)}
                className="min-h-[56px] px-5 py-3.5 rounded-2xl bg-[#C2410C] hover:bg-[#9A3412] text-white text-lg font-extrabold shadow-xs inline-flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Volume2 className="w-6 h-6 text-[#FDE68A] shrink-0" />
                <span>{t.listenMunimji}</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenWhatsAppForNotice(activeNoticeRaw)}
                className="min-h-[56px] px-5 py-3.5 rounded-2xl bg-[#15803D] hover:bg-[#166534] text-white text-lg font-extrabold shadow-xs inline-flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <MessageSquare className="w-6 h-6 shrink-0" />
                <span>{t.sendWhatsApp}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowMoreDetails(!showMoreDetails)}
                className="min-h-[56px] px-5 py-3.5 rounded-2xl bg-[#14532D] hover:bg-[#166534] text-white text-lg font-extrabold shadow-xs inline-flex items-center justify-center gap-2.5 cursor-pointer"
              >
                {showMoreDetails ? (
                  <ChevronUp className="w-6 h-6 text-[#FDE68A] shrink-0" />
                ) : (
                  <ChevronDown className="w-6 h-6 text-[#FDE68A] shrink-0" />
                )}
                <span>{showMoreDetails ? t.hideDetails : t.moreDetails}</span>
              </button>
            </div>

            {/* Trust & Guidance Disclaimer on Result Screen */}
            <div className="pt-3 border-t border-[#EFE6D5] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-base text-[#57534E]">
              <span className="inline-flex items-center gap-2 font-semibold text-[#14532D]">
                <Lock className="w-4 h-4 shrink-0" />
                <span>{maskFooterText}</span>
              </span>
              <span className="font-bold text-[#44403C]">{t.guidanceDisclaimer}</span>
            </div>
          </div>

          {/* =================================================================
              "MORE DETAILS" EXPANDER (Law, Cash Link, Ignore Timeline, Docs, CA, Draft Reply)
             ================================================================= */}
          {showMoreDetails && (
            <div className="border-t-2 border-[#E5D9C3] bg-[#FFFDF9] p-5 sm:p-7 space-y-6">
              {/* A. CASH LINK */}
              {cashImpact && (
                <div
                  className={`p-5 rounded-2xl border-2 space-y-3 ${
                    cashImpact.causesShortfall
                      ? 'bg-rose-50 border-rose-300'
                      : cashImpact.breachesReserve
                      ? 'bg-amber-50 border-amber-300'
                      : 'bg-emerald-50 border-emerald-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-base font-extrabold uppercase tracking-wide text-[#57534E] block">
                        {t.effectOnShopMoneyTitle}
                      </span>
                      <p className="text-xl font-extrabold text-[#1C1917]">
                        {t.cashLinkSentence(
                          formatRupee(activeNotice.amountDemanded, language),
                          cashImpact.formattedDate,
                          formatRupee(cashImpact.projectedBalanceOnDay, language)
                        )}
                      </p>
                      {cashImpact.causesShortfall && (
                        <p className="text-lg font-bold text-rose-800">
                          {t.cashLinkShortfallWarn(cashImpact.formattedDate)}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onInspectCashDate(cashImpact.targetDate)}
                      className="min-h-[50px] px-4 py-2.5 rounded-2xl bg-white border border-[#D6C5A9] text-[#1C1917] text-lg font-bold inline-flex items-center gap-2 shrink-0 cursor-pointer"
                    >
                      <Eye className="w-5 h-5 text-[#14532D]" />
                      <span>{t.seeThisDay}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* B. GENUINE OR SUSPICIOUS DETAILS + LAW IN ONE PLAIN SENTENCE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="p-5 rounded-2xl bg-white border border-[#E5D9C3] space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h3 className="text-xl font-extrabold text-[#1C1917]">
                      {t.isNoticeGenuineTitle}
                    </h3>
                    {renderConfidenceBadge(activeNotice.confidence.sender)}
                  </div>
                  <p className="text-lg font-semibold text-[#1C1917]">
                    {activeNotice.authenticity.summary}
                  </p>
                  <ul className="space-y-2 text-lg text-[#44403C]">
                    <li>
                      <strong>{t.dinCheckLabel}:</strong>{' '}
                      {activeNotice.authenticity.dinCheckNote}
                    </li>
                    <li>
                      <strong>{t.officialSenderLabel}:</strong>{' '}
                      {activeNotice.authenticity.domainCheckNote}
                    </li>
                    <li>
                      <strong>{t.paymentSafetyLabel}:</strong>{' '}
                      {activeNotice.authenticity.paymentCheckNote}
                    </li>
                  </ul>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-[#E5D9C3] space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h3 className="text-xl font-extrabold text-[#1C1917]">
                      {t.whichLawTitle}
                    </h3>
                    {renderConfidenceBadge(activeNotice.confidence.lawSection)}
                  </div>
                  <p className="text-lg font-extrabold text-[#14532D]">
                    {activeNotice.lawSection}
                  </p>
                  <p className="text-lg text-[#44403C] leading-relaxed">
                    {activeNotice.lawPlainExplanation}
                  </p>
                  {activeNotice.amountBreakdown && (
                    <div className="pt-2 border-t border-[#EFE6D5] flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-base text-[#57534E]">
                        {activeNotice.amountBreakdown}
                      </span>
                      {renderConfidenceBadge(activeNotice.confidence.amountDemanded)}
                    </div>
                  )}
                </div>
              </div>

              {/* C. DO I NEED A CA? */}
              <div className="p-5 rounded-2xl bg-white border border-[#E5D9C3] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-xl font-extrabold text-[#1C1917] flex items-center gap-2">
                    <UserCheck className="w-6 h-6 text-[#14532D]" />
                    <span>{t.doINeedCaTitle}</span>
                  </h3>
                  <span
                    className={`px-4 py-1.5 rounded-xl text-xl font-extrabold ${
                      activeNotice.advisorGuidance.verdict === 'Yes'
                        ? 'bg-rose-100 text-rose-900'
                        : activeNotice.advisorGuidance.verdict === 'Maybe'
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-emerald-100 text-emerald-900'
                    }`}
                  >
                    {getAdvisorVerdictLabel(
                      activeNotice.advisorGuidance.verdict,
                      language
                    )}{' '}
                    — {activeNotice.advisorGuidance.roleLabel}
                  </span>
                </div>

                <ul className="space-y-2 text-lg text-[#44403C] list-disc pl-6">
                  {activeNotice.advisorGuidance.reasons.map((r, idx) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              </div>

              {/* D. WHAT HAPPENS IF YOU IGNORE THIS */}
              {activeNotice.ignoreTimeline.length > 0 && (
                <div className="p-5 rounded-2xl bg-white border border-[#E5D9C3] space-y-4">
                  <h3 className="text-xl font-extrabold text-[#1C1917] flex items-center gap-2">
                    <Clock className="w-6 h-6 text-rose-600" />
                    <span>{t.whatHappensIgnoreTitle}</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {activeNotice.ignoreTimeline.map((step, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-[#FAF1DF]/70 border border-[#E5D9C3] space-y-1.5"
                      >
                        <span className="text-base font-extrabold text-[#9A3412] block">
                          {t.stepWord} {formatIndianNumber(idx + 1, language)} ·{' '}
                          {step.timeframe}
                        </span>
                        <h4 className="text-lg font-extrabold text-[#1C1917]">
                          {step.title}
                        </h4>
                        <p className="text-lg text-[#44403C]">{step.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* E. DOCUMENTS TO GATHER (Checkbox Checklist) */}
              {activeNotice.documentsChecklist.length > 0 && (
                <div className="p-5 rounded-2xl bg-white border border-[#E5D9C3] space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xl font-extrabold text-[#1C1917] flex items-center gap-2">
                      <ListChecks className="w-6 h-6 text-[#14532D]" />
                      <span>{t.documentsToGatherTitle}</span>
                    </h3>
                    <span className="text-lg font-bold font-mono text-[#14532D]">
                      {t.readyCountLabel(
                        completedDocsCount,
                        activeNotice.documentsChecklist.length
                      )}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {activeNotice.documentsChecklist.map((doc) => (
                      <label
                        key={doc.id}
                        className={`p-4 rounded-2xl border flex items-start gap-3.5 cursor-pointer transition-colors ${
                          doc.checked
                            ? 'bg-emerald-50/70 border-emerald-300'
                            : 'bg-[#FFFDF9] border-[#E5D9C3] hover:bg-[#FAF1DF]/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={doc.checked}
                          onChange={() =>
                            onToggleChecklistItem(activeNoticeRaw.id, doc.id)
                          }
                          className="w-6 h-6 mt-1 accent-[#14532D] rounded cursor-pointer shrink-0"
                        />
                        <div>
                          <span
                            className={`text-lg font-bold block ${
                              doc.checked
                                ? 'line-through text-[#57534E]'
                                : 'text-[#1C1917]'
                            }`}
                          >
                            {doc.label}
                          </span>
                          {doc.detail && (
                            <span className="text-base text-[#57534E] block mt-0.5">
                              {doc.detail}
                            </span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* F. EDITABLE DRAFT REPLY (Normal readable sans-serif font) */}
              <div className="p-5 rounded-2xl bg-white border border-[#E5D9C3] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="text-xl font-extrabold text-[#1C1917]">
                    {t.readyReplyTitle}
                  </h3>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDraftMode('reply')}
                      className={`min-h-[48px] px-4 py-2 rounded-xl text-base font-bold inline-flex items-center gap-2 cursor-pointer ${
                        draftMode === 'reply'
                          ? 'bg-[#14532D] text-white'
                          : 'bg-[#FAF1DF] text-[#1C1917] border border-[#D6C5A9]'
                      }`}
                    >
                      <FileText className="w-5 h-5" />
                      <span>{t.mainReplyBtn}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDraftMode('extension')}
                      className={`min-h-[48px] px-4 py-2 rounded-xl text-base font-bold inline-flex items-center gap-2 cursor-pointer ${
                        draftMode === 'extension'
                          ? 'bg-[#14532D] text-white'
                          : 'bg-[#FAF1DF] text-[#1C1917] border border-[#D6C5A9]'
                      }`}
                    >
                      <Clock className="w-5 h-5" />
                      <span>{t.requestMoreTimeBtn}</span>
                    </button>
                  </div>
                </div>

                <textarea
                  rows={9}
                  value={
                    draftMode === 'reply'
                      ? activeNoticeRaw.draftReplyText
                      : activeNoticeRaw.extensionLetterText
                  }
                  onChange={(e) =>
                    onUpdateDraftText(activeNoticeRaw.id, draftMode, e.target.value)
                  }
                  className="w-full rounded-2xl border border-[#CBBBA0] bg-[#FFFDF9] p-4 font-sans text-lg text-[#1C1917] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#14532D]"
                />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={handleCopyDraft}
                      className="min-h-[50px] px-5 py-2.5 rounded-2xl bg-[#FAF1DF] hover:bg-[#F3E5C8] border border-[#D6C5A9] text-[#1C1917] text-lg font-bold inline-flex items-center gap-2 cursor-pointer"
                    >
                      {copiedFlag ? (
                        <Check className="w-5 h-5 text-emerald-700" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                      <span>{copiedFlag ? t.copiedBtn : t.copyBtn}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadDocx}
                      className="min-h-[50px] px-5 py-2.5 rounded-2xl bg-[#14532D] hover:bg-[#166534] text-white text-lg font-bold inline-flex items-center gap-2 cursor-pointer"
                    >
                      <Download className="w-5 h-5 text-[#FDE68A]" />
                      <span>{t.downloadDocxBtn}</span>
                    </button>
                  </div>

                  {/* Status Updater */}
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="active-notice-status"
                      className="text-lg font-bold text-[#44403C]"
                    >
                      {t.statusLabel}:
                    </label>
                    <select
                      id="active-notice-status"
                      value={activeNoticeRaw.status}
                      onChange={(e) =>
                        onUpdateNoticeStatus(
                          activeNoticeRaw.id,
                          e.target.value as NoticeStatus
                        )
                      }
                      className="min-h-[48px] px-4 py-2 rounded-xl bg-white border border-[#CBBBA0] text-lg font-bold text-[#1C1917]"
                    >
                      <option value="New">{t.statusNew}</option>
                      <option value="In progress">{t.statusInProgress}</option>
                      <option value="Replied">{t.statusReplied}</option>
                      <option value="Closed">{t.statusClosed}</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.section>
      )}

      {/* =====================================================================
          "SEE ALL NOTICES" BELOW (Full Tracker Sorted by Nearest Deadline)
         ===================================================================== */}
      <section className="khata-card rounded-3xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAllNoticesList(!showAllNoticesList)}
          className="w-full min-h-[60px] px-5 sm:px-6 py-4 khata-ledger-header flex items-center justify-between gap-3 text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Scale className="w-6 h-6 text-[#14532D] shrink-0" />
            <span className="text-xl font-extrabold text-[#1C1917]">
              {showAllNoticesList ? t.hideAllNotices : t.seeAllNotices} (
              <span className="font-mono">
                {formatIndianNumber(notices.length, language)}
              </span>
              )
            </span>
          </div>
          <div className="inline-flex items-center gap-2 text-lg font-bold text-[#14532D]">
            <span>{showAllNoticesList ? t.closeListBtn : t.openListBtn}</span>
            {showAllNoticesList ? (
              <ChevronUp className="w-6 h-6" />
            ) : (
              <ChevronDown className="w-6 h-6" />
            )}
          </div>
        </button>

        {showAllNoticesList && (
          <div className="divide-y divide-[#EFE6D5] bg-[#FFFDF9]">
            {allNoticesSorted.map((rawItem) => {
              const item = getLocalizedNotice(rawItem, language);
              const cd = computeNoticeCountdown(rawItem.deadlineDate, ANCHOR_DATE, nowTick);
              const isCurrent = activeNoticeRaw?.id === rawItem.id;
              return (
                <div
                  key={rawItem.id}
                  className={`p-5 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isCurrent ? 'bg-[#FAF1DF]/70' : ''
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span
                        className={`px-3 py-1 rounded-xl text-base font-extrabold ${
                          rawItem.severity === 'Urgent'
                            ? 'bg-rose-100 text-rose-800'
                            : rawItem.severity === 'Needs attention'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {getSeverityPlainLabel(rawItem.severity, language)}
                      </span>
                      <h3 className="text-xl font-extrabold text-[#1C1917]">
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-lg text-[#57534E]">{item.authorityName}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <div className="text-left md:text-right mr-2">
                      <span className="block text-lg font-extrabold font-mono text-[#1C1917]">
                        {formatRupee(rawItem.amountDemanded || 0, language)}
                      </span>
                      <span
                        className={`block text-base font-mono font-bold ${
                          rawItem.status === 'Closed'
                            ? 'text-[#78716C] line-through'
                            : cd.daysLeft <= 7
                            ? 'text-rose-700'
                            : 'text-[#44403C]'
                        }`}
                      >
                        {rawItem.status === 'Closed'
                          ? getNoticeStatusLabel('Closed', language)
                          : formatDaysLeftLabel(cd.daysLeft, language, cd.hoursRemainingInDay)}
                      </span>
                    </div>

                    <select
                      aria-label={`${t.statusLabel}: ${item.title}`}
                      value={rawItem.status}
                      onChange={(e) =>
                        onUpdateNoticeStatus(
                          rawItem.id,
                          e.target.value as NoticeStatus
                        )
                      }
                      className="min-h-[48px] px-3.5 py-2 rounded-xl bg-white border border-[#CBBBA0] text-base font-bold text-[#1C1917]"
                    >
                      <option value="New">{t.statusNew}</option>
                      <option value="In progress">{t.statusInProgress}</option>
                      <option value="Replied">{t.statusReplied}</option>
                      <option value="Closed">{t.statusClosed}</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectNotice(rawItem.id);
                        resultCardRef.current?.scrollIntoView({
                          behavior: 'smooth',
                          block: 'start',
                        });
                      }}
                      className={`min-h-[48px] px-4 py-2 rounded-xl text-lg font-bold inline-flex items-center gap-2 cursor-pointer ${
                        isCurrent
                          ? 'bg-[#14532D] text-white'
                          : 'bg-white border border-[#D6C5A9] text-[#1C1917] hover:bg-[#FAF1DF]'
                      }`}
                    >
                      <Eye className="w-5 h-5" />
                      <span>{isCurrent ? t.selectedBtn : t.readThisBtn}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* =====================================================================
          UPLOAD A NOTICE OR TRY THE 3 BUILT-IN INSTANT SAMPLES
         ===================================================================== */}
      <section className="khata-card rounded-3xl p-5 sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#1C1917]">
              {t.uploadOrSampleTitle}
            </h2>
            <p className="text-lg text-[#57534E]">{t.uploadSubtitle}</p>
          </div>

          <button
            type="button"
            onClick={() => handleLoadSample('gst_drc01')}
            className="min-h-[52px] px-5 py-3 rounded-2xl bg-[#14532D] hover:bg-[#166534] text-white text-lg font-extrabold inline-flex items-center gap-2.5 shrink-0 cursor-pointer"
          >
            <FileText className="w-5 h-5 text-[#FDE68A]" />
            <span>{t.trySampleNotice}</span>
          </button>
        </div>

        {/* Mode Switcher: Upload File vs Paste Text */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setInputMode('file')}
            className={`min-h-[50px] px-5 py-2.5 rounded-2xl text-lg font-bold inline-flex items-center gap-2 cursor-pointer ${
              inputMode === 'file'
                ? 'bg-[#14532D] text-white'
                : 'bg-[#FAF1DF] text-[#1C1917] border border-[#D6C5A9]'
            }`}
          >
            <FileUp className="w-5 h-5" />
            <span>{t.uploadPdfPhotoTab}</span>
          </button>

          <button
            type="button"
            onClick={() => setInputMode('paste')}
            className={`min-h-[50px] px-5 py-2.5 rounded-2xl text-lg font-bold inline-flex items-center gap-2 cursor-pointer ${
              inputMode === 'paste'
                ? 'bg-[#14532D] text-white'
                : 'bg-[#FAF1DF] text-[#1C1917] border border-[#D6C5A9]'
            }`}
          >
            <ClipboardPaste className="w-5 h-5" />
            <span>{t.pasteNoticeTextTab}</span>
          </button>
        </div>

        {isAnalyzing ? (
          <div className="border-2 border-dashed border-[#14532D] bg-[#FAF1DF]/50 rounded-3xl p-10 text-center space-y-3">
            <Loader2 className="w-10 h-10 text-[#14532D] animate-spin mx-auto" />
            <p className="text-xl font-extrabold text-[#1C1917]">
              {t.analyzingNoticeMsg}
            </p>
            <p className="text-lg text-[#57534E]">{t.maskingIdsSubMsg}</p>
          </div>
        ) : inputMode === 'file' ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 sm:p-10 text-center transition-colors cursor-pointer ${
              isDragging
                ? 'border-[#14532D] bg-[#ECFDF5]'
                : 'border-[#CBBBA0] hover:border-[#14532D] bg-[#FAF1DF]/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/*,.txt,application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) processUploadedFile(file);
                e.target.value = '';
              }}
              className="hidden"
            />
            <div className="w-14 h-14 rounded-2xl bg-white border border-[#D6C5A9] flex items-center justify-center mx-auto mb-3 text-[#14532D]">
              <Upload className="w-7 h-7" />
            </div>
            <p className="text-xl font-extrabold text-[#1C1917]">
              {t.dropzoneTitle}
            </p>
            <p className="text-lg text-[#57534E] mt-1">{t.dropzoneSubtitle}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              rows={5}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder={t.pastePlaceholder}
              className="w-full rounded-2xl border border-[#CBBBA0] bg-white p-4 text-lg text-[#1C1917] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#14532D]"
            />
            {pasteMaskPreview && pasteMaskPreview.maskedCount > 0 && (
              <p className="text-base font-bold text-[#14532D]">
                {t.privacyIdsMaskedCount(
                  pasteMaskPreview.maskedCount,
                  pasteMaskPreview.typesFound.join(', ')
                )}
              </p>
            )}
            <button
              type="button"
              onClick={handleAnalyzePastedText}
              disabled={!pastedText.trim()}
              className="min-h-[54px] px-6 py-3 rounded-2xl bg-[#14532D] hover:bg-[#166534] disabled:opacity-45 text-white text-xl font-extrabold inline-flex items-center gap-2.5 cursor-pointer"
            >
              <FileText className="w-6 h-6 text-[#FDE68A]" />
              <span>{t.explainPastedBtn}</span>
            </button>
          </div>
        )}

        {/* 3 Instant Built-In Samples (Work instantly without any API call) */}
        <div className="space-y-3 pt-2 border-t border-[#EFE6D5]">
          <span className="block text-lg font-extrabold text-[#1C1917]">
            {t.orTapSampleHeading}
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => handleLoadSample('gst_drc01')}
              className="min-h-[56px] p-4 rounded-2xl bg-[#FAF1DF] hover:bg-[#F3E5C8] border border-[#D6C5A9] text-left cursor-pointer flex items-center gap-3"
            >
              <FileText className="w-6 h-6 text-amber-700 shrink-0" />
              <div>
                <span className="block text-lg font-extrabold text-[#1C1917]">
                  {t.sample1Label}
                </span>
                <span className="block text-base text-[#57534E]">
                  {t.sample1Sub}
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleLoadSample('it_143_1')}
              className="min-h-[56px] p-4 rounded-2xl bg-[#FAF1DF] hover:bg-[#F3E5C8] border border-[#D6C5A9] text-left cursor-pointer flex items-center gap-3"
            >
              <FileText className="w-6 h-6 text-emerald-700 shrink-0" />
              <div>
                <span className="block text-lg font-extrabold text-[#1C1917]">
                  {t.sample2Label}
                </span>
                <span className="block text-base text-[#57534E]">
                  {t.sample2Sub}
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleLoadSample('ni_138_cheque')}
              className="min-h-[56px] p-4 rounded-2xl bg-[#FAF1DF] hover:bg-[#F3E5C8] border border-[#D6C5A9] text-left cursor-pointer flex items-center gap-3"
            >
              <FileText className="w-6 h-6 text-rose-700 shrink-0" />
              <div>
                <span className="block text-lg font-extrabold text-[#1C1917]">
                  {t.sample3Label}
                </span>
                <span className="block text-base text-[#57534E]">
                  {t.sample3Sub}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Privacy & Trust Footer */}
        <div className="pt-3 border-t border-[#EFE6D5] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-base text-[#57534E]">
          <div className="flex items-center gap-2 font-semibold text-[#14532D]">
            <Lock className="w-5 h-5 shrink-0" />
            <span>{maskFooterText}</span>
          </div>
          <span className="font-semibold">{t.guidanceDisclaimer}</span>
        </div>
      </section>
    </div>
  );
};
