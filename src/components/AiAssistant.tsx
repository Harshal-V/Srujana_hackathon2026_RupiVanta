import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Send,
  Volume2,
  VolumeX,
  Languages,
  Mic,
  MicOff,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Edit2,
  RotateCcw,
  SlidersHorizontal,
  FileBarChart,
  Users,
  Calendar,
  Check,
  Minus,
  Maximize2,
  Bot,
  Activity,
  FileText,
  Clock,
  Globe
} from 'lucide-react';
import { BusinessProfile, ProposedAction, Transaction, TransactionType, WhatIfScenario } from '../types/cashflow';
import { formatINR, formatDateLabel } from '../utils/forecastEngine';

interface AiAssistantProps {
  business: BusinessProfile;
  currentCash: number;
  minimumReserve: number;
  transactions: Transaction[];
  lowestProjectedBalance: number;
  shortfallDate: string;
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
  onApplyRemedy: (remedyType: string) => void;
  onSelectScenario: (scenario: WhatIfScenario | null) => void;
  onNavigateTab: (tab: any) => void;
  onOpenFollowUpFor: (customerName: string, amount: number, invoiceNo?: string) => void;
  language: 'en' | 'kn';
  onLanguageChange: (lang: 'en' | 'kn') => void;
  isDocked?: boolean;
  onToggleDock?: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  lang?: 'en' | 'kn';
  timestamp: string;
  actionProposal?: ProposedAction | null;
  itemsList?: Array<{ icon: any; text: string }>;
}

export const AiAssistant: React.FC<AiAssistantProps> = ({
  business,
  currentCash,
  minimumReserve,
  transactions,
  lowestProjectedBalance,
  shortfallDate,
  onAddTransaction,
  onApplyRemedy,
  onSelectScenario,
  onNavigateTab,
  onOpenFollowUpFor,
  language,
  onLanguageChange,
  isDocked = true,
  onToggleDock,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Editable proposal for user confirmation
  const [editingProposal, setEditingProposal] = useState<ProposedAction | null>(null);
  const [editParty, setEditParty] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editType, setEditType] = useState<TransactionType>('inflow');
  const [editTitle, setEditTitle] = useState('');

  const recognitionRef = useRef<any>(null);

  // Initial welcome message matching reference screenshot
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text:
        language === 'kn'
          ? "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ರೂಪಿವಂತ ಸಹಾಯಕ (RupiVanta Sahayak). ನಾನು ಇವುಗಳಲ್ಲಿ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ:"
          : "Hello! I'm RupiVanta Sahayak. I can help you with:",
      itemsList: [
        { icon: FileText, text: language === 'kn' ? 'ಆದಾಯ ಅಥವಾ ವೆಚ್ಚ ಸೇರಿಸಿ' : 'Add income or expense' },
        { icon: Users, text: language === 'kn' ? 'ಬಾಕಿ ಇರುವ ಗ್ರಾಹಕರನ್ನು ನೋಡಿ' : 'Show overdue customers' },
        { icon: Activity, text: language === 'kn' ? 'ನಗದು ಹರಿವಿನ ಮುನ್ಸೂಚನೆ' : 'Forecast cash flow' },
        { icon: SlidersHorizontal, text: language === 'kn' ? 'ವಾಟ್-ಇಫ್ ಸನ್ನಿವೇಶಗಳನ್ನು ಚಲಾಯಿಸಿ' : 'Run what-if scenarios' },
        { icon: FileBarChart, text: language === 'kn' ? 'ಹಣಕಾಸು ವರದಿಗಳನ್ನು ರಚಿಸಿ' : 'Generate financial reports' },
      ],
      lang: language,
      timestamp: '10:24 AM',
    },
  ]);

  // Suggested prompt chips matching reference screenshot
  const suggestedChips = [
    {
      en: "Add today's sale",
      kn: "ಇಂದಿನ ಮಾರಾಟ ಸೇರಿಸಿ",
      action: () => handleSendQuery(language === 'kn' ? "ಇಂದಿನ ಮಾರಾಟ ₹12,000 ನಮೂದಿಸಿ" : "Add today's sale of ₹12,000"),
    },
    {
      en: 'Show overdue payments',
      kn: 'ಬಾಕಿ ಪಾವತಿಗಳನ್ನು ತೋರಿಸಿ',
      action: () => handleSendQuery(language === 'kn' ? 'ಯಾವ ಇನ್‌ವಾಯ್ಸ್‌ಗಳು ಬಾಕಿ ಇವೆ?' : 'Show overdue payments'),
    },
    {
      en: 'What happens if my customer pays late?',
      kn: 'ಗ್ರಾಹಕ ತಡವಾಗಿ ಪಾವತಿಸಿದರೆ ಏನಾಗುತ್ತದೆ?',
      action: () => handleSendQuery(language === 'kn' ? 'ಗ್ರಾಹಕರ ಪಾವತಿ 7 ದಿನ ತಡವಾದರೆ ಏನಾಗುತ್ತದೆ?' : 'What happens if my customer pays 7 days late?'),
    },
    {
      en: 'Generate weekly report',
      kn: 'ವಾರದ ವರದಿ ತಯಾರಿಸಿ',
      action: () => {
        onNavigateTab('reports');
        handleSendQuery(language === 'kn' ? 'ವಾರದ ಆರ್ಥಿಕ ವರದಿಯನ್ನು ರಚಿಸಿ' : 'Generate weekly financial report');
      },
    },
  ];

  // Speech Recognition setup
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language === 'kn' ? 'kn-IN' : 'en-IN';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setInputText(transcript);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, [language]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setMessages((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          sender: 'assistant',
          text: 'Speech recognition is not supported in this browser. Please type your question below.',
          timestamp: 'Just now',
        },
      ]);
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.lang = language === 'kn' ? 'kn-IN' : 'en-IN';
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleVoiceSpeak = (text: string) => {
    if (isSpeaking) {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
      return;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'kn' ? 'kn-IN' : 'en-IN';
      utterance.rate = 0.95;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSendQuery = async (queryText?: string) => {
    const query = queryText || inputText.trim();
    if (!query) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const nowFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: nowFormatted,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          language,
          context: {
            currentCash,
            minimumReserve,
            lowestBalance: lowestProjectedBalance,
            shortfallDate,
            transactionsCount: transactions.length,
          },
        }),
      });

      if (!res.ok) throw new Error('AI service error');
      const data = await res.json();

      let actionProposal: ProposedAction | null = null;
      if (data.proposedAction) {
        actionProposal = {
          id: `prop-${Date.now()}`,
          type: data.proposedAction.type,
          title: data.proposedAction.title,
          description: data.proposedAction.description,
          data: data.proposedAction.data,
          status: 'pending',
        };

        if (data.proposedAction.type === 'add_transaction' && data.proposedAction.data) {
          const d = data.proposedAction.data;
          setEditParty(d.partyName || '');
          setEditAmount(d.amount ? d.amount.toString() : '');
          setEditDate(d.dueDate || '2026-11-05');
          setEditType(d.type === 'outflow' ? 'outflow' : 'inflow');
          setEditTitle(d.title || `${d.type === 'inflow' ? 'Sale' : 'Bill'} - ${d.partyName}`);
          setEditingProposal(actionProposal);
        } else if (data.proposedAction.type === 'simulate_scenario') {
          // Immediately simulate
          onSelectScenario({
            id: 'sim-assistant',
            name: data.proposedAction.title,
            shortDescription: data.proposedAction.description,
            customerDelayDays: 7,
            salesDropPercent: 0,
            unexpectedExpense: 0,
            rescheduledSupplierDays: 0,
          });
        }
      }

      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: data.reply,
        lang: language,
        timestamp: nowFormatted,
        actionProposal,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error(err);
      const lower = query.toLowerCase();
      let fallback =
        language === 'kn'
          ? `ಪ್ರಸ್ತುತ ನಿಮ್ಮ ಬ್ಯಾಂಕ್‌ನಲ್ಲಿ ${formatINR(currentCash)} ಲಭ್ಯವಿದೆ. ಅಕ್ಟೋಬರ್ 29 ರಂದು ₹40,000 ಬಿಲ್ ಪಾವತಿಸಬೇಕಿದ್ದು ₹10,000 ನಗದು ಕೊರತೆ ಉಂಟಾಗುತ್ತದೆ. ರಾಯಲ್ ಕಿರಾಣಾ ಸ್ಟೋರ್ಸ್‌ನಿಂದ ₹15,000 ಬಾಕಿ ವಸೂಲು ಮಾಡಲು ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ.`
          : `You currently have ${formatINR(currentCash)} in verified cash. On Oct 29, ₹40,000 is due to Malnad Agro, causing a ₹10,000 shortfall before Sri Balaji's ₹20,000 clears on Oct 31. Recommended action: Fast-track the ₹15,000 overdue from Royal Kirana Stores.`;

      if (lower.includes('late') || lower.includes('what happens') || lower.includes('ತಡ')) {
        fallback =
          language === 'kn'
            ? 'ಗ್ರಾಹಕರ ಪಾವತಿ 7 ದಿನ ತಡವಾದರೆ, ನಿಮ್ಮ ನಗದು ಕೊರತೆಯು ₹10,000 ದಿಂದ ₹30,000 ಕ್ಕೆ ಏರುತ್ತದೆ ಮತ್ತು 9 ದಿನಗಳ ಕಾಲ ಬ್ಯಾಂಕ್ ರಿಸರ್ವ್ ಶೂನ್ಯಕ್ಕಿಂತ ಕೆಳಗೆ ಇರುತ್ತದೆ.'
            : 'If Sri Balaji pays 7 days late (Nov 07 instead of Oct 31), your cash deficit widens to -₹30,000 and your reserve remains breached for 9 continuous days.';
        onSelectScenario({
          id: 'delay-balaji-sim',
          name: 'Customer Pays 7 Days Late',
          shortDescription: 'Simulating 7-day payment delay from Sri Balaji Supermarket.',
          customerDelayDays: 7,
          targetCustomerName: 'Balaji',
          salesDropPercent: 0,
          unexpectedExpense: 0,
          rescheduledSupplierDays: 0,
        });
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `a-fb-${Date.now()}`,
          sender: 'assistant',
          text: fallback,
          lang: language,
          timestamp: nowFormatted,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAction = (proposal: ProposedAction) => {
    if (proposal.type === 'add_transaction') {
      const parsedAmount = parseFloat(editAmount);
      if (!editParty || isNaN(parsedAmount) || parsedAmount <= 0) return;

      onAddTransaction({
        partyName: editParty,
        amount: parsedAmount,
        dueDate: editDate || '2026-11-05',
        type: editType,
        category: editType === 'inflow' ? 'b2b_invoice' : 'supplier',
        status: 'expected',
        title: editTitle || `${editType === 'inflow' ? 'Invoice' : 'Bill'} - ${editParty}`,
      });

      setEditingProposal(null);
      setMessages((prev) => [
        ...prev,
        {
          id: `exec-${Date.now()}`,
          sender: 'assistant',
          text:
            language === 'kn'
              ? `ಖಚಿತಪಡಿಸಲಾಗಿದೆ! ${editParty} ರವರಿಗೆ ${formatINR(parsedAmount)} ನಮೂದಿಸಲಾಗಿದೆ. ನಗದು ಹರಿವಿನ ಮುನ್ಸೂಚನೆಯನ್ನು ತಕ್ಷಣವೇ ನವೀಕರಿಸಲಾಗಿದೆ.`
              : `Confirmed! Recorded ${formatINR(parsedAmount)} for ${editParty}. Cash forecast updated immediately.`,
          timestamp: 'Just now',
        },
      ]);
    } else if (proposal.type === 'apply_remedy') {
      onApplyRemedy(proposal.data?.remedyType || 'split_payment');
    } else if (proposal.type === 'send_reminder') {
      onOpenFollowUpFor(proposal.data?.customerName || 'Royal Kirana Stores', proposal.data?.amount || 15000, 'INV-402');
    } else if (proposal.type === 'generate_report') {
      onNavigateTab('reports');
    }
  };

  // If collapsed completely on mobile / float mode
  if (!isOpen) {
    return (
      <div className="fixed bottom-5 right-5 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-4 py-3 bg-[#0B1528] hover:bg-[#13223B] text-white rounded-full shadow-2xl border border-teal-500/30 transition-all cursor-pointer group hover:scale-105"
        >
          <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white shrink-0 shadow-sm">
            <Bot className="w-4 h-4" />
          </div>
          <div className="text-left hidden sm:block">
            <span className="block text-xs font-bold leading-tight">RupiVanta Sahayak</span>
            <span className="text-[10px] text-teal-300 font-medium">Your AI Financial Co-Pilot</span>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full lg:w-80 xl:w-88 bg-[#0B1728] rounded-2xl shadow-xl border border-[#162744] flex flex-col overflow-hidden shrink-0 h-full min-h-[580px] select-none transition-all">
      {/* Header matching screenshot: Glowing robot circle, RupiVanta Sahayak, Your AI Financial Co-Pilot, minimize button */}
      <div className="px-4 py-3.5 bg-gradient-to-r from-[#0B1728] via-[#0E2038] to-[#0B1728] text-white flex items-center justify-between border-b border-[#1A2E4E] shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-full bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300 shadow-sm shrink-0 relative">
            <Bot className="w-5 h-5 text-teal-300" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#0B1728]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-white tracking-tight leading-tight">
              RupiVanta Sahayak
            </h3>
            <span className="text-[10px] text-slate-400 block leading-tight">
              Your AI Financial Co-Pilot
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-slate-400">
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:text-white rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
            title="Minimize"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Message Flow Area */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-[#0B1728] text-xs">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`p-3.5 rounded-2xl max-w-[95%] leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-teal-600 text-white rounded-br-xs shadow-sm'
                  : 'bg-white text-slate-900 rounded-bl-xs shadow-md border border-slate-100'
              }`}
            >
              <p className="whitespace-pre-wrap font-medium">{m.text}</p>

              {/* Items checklist for welcome bubble */}
              {m.itemsList && (
                <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1.5">
                  {m.itemsList.map((item, idx) => {
                    const IconComp = item.icon;
                    return (
                      <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-700 font-medium">
                        <span className="w-4 h-4 rounded bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                          <IconComp className="w-2.5 h-2.5" />
                        </span>
                        <span>{item.text}</span>
                      </div>
                    );
                  })}
                  <p className="pt-2 text-xs font-semibold text-slate-900">
                    {language === 'kn' ? 'ನಾನು ನಿಮಗೆ ಇಂದು ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?' : 'How can I help you today?'}
                  </p>
                </div>
              )}

              {/* Action Proposal Card */}
              {m.actionProposal && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-teal-800">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>{m.actionProposal.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-600">{m.actionProposal.description}</p>

                  {/* Add Transaction Confirmation Fields */}
                  {m.actionProposal.type === 'add_transaction' && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 mt-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Confirm or edit details before saving:
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="text-[10px] text-slate-500 block">Party</label>
                          <input
                            type="text"
                            value={editParty}
                            onChange={(e) => setEditParty(e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block">Amount (₹)</label>
                          <input
                            type="number"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono font-bold"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => handleConfirmAction(m.actionProposal!)}
                        className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                      >
                        Confirm & Record to Live Forecast
                      </button>
                    </div>
                  )}

                  {m.actionProposal.type !== 'add_transaction' && (
                    <button
                      onClick={() => handleConfirmAction(m.actionProposal!)}
                      className="w-full py-1.5 px-3 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>Execute Action</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* Timestamp and Voice Listen */}
              <div className="mt-2 pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                <span>{m.timestamp}</span>
                {m.sender === 'assistant' && (
                  <button
                    onClick={() => handleVoiceSpeak(m.text)}
                    className="flex items-center gap-1 text-teal-700 hover:text-teal-900 cursor-pointer font-medium"
                  >
                    {isSpeaking ? <VolumeX className="w-3 h-3 text-rose-600" /> : <Volume2 className="w-3 h-3" />}
                    <span>{isSpeaking ? 'Mute' : 'Listen'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2 items-center text-xs text-slate-400 py-1">
            <div className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" />
            <div className="w-2 h-2 rounded-full bg-teal-400 animate-bounce [animation-delay:0.2s]" />
            <div className="w-2 h-2 rounded-full bg-teal-400 animate-bounce [animation-delay:0.4s]" />
            <span className="text-[11px] text-slate-300 font-medium ml-1">Analyzing cash flows...</span>
          </div>
        )}
      </div>

      {/* Suggested Prompt Chips matching screenshot */}
      <div className="px-3 py-2 bg-[#0E1C30] border-t border-[#182C4A] space-y-1.5 shrink-0">
        <div className="flex flex-col gap-1.5">
          {suggestedChips.map((chip, idx) => {
            const label = language === 'kn' ? chip.kn : chip.en;
            return (
              <button
                key={idx}
                onClick={chip.action}
                className="w-full text-left px-3 py-1.5 rounded-full bg-white hover:bg-slate-100 text-slate-800 text-[11px] font-medium shadow-2xs transition-all cursor-pointer flex items-center justify-between group"
              >
                <span className="truncate">{label}</span>
                <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-teal-700 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Input Area matching screenshot: Cyan Mic, Input Field, Teal Send Button */}
      <div className="p-3 bg-[#0B1728] border-t border-[#182C4A] space-y-2 shrink-0">
        <div className="flex items-center gap-2">
          {/* Cyan Microphone Button */}
          <button
            onClick={toggleListening}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse ring-2 ring-rose-400'
                : 'bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 border border-teal-500/30'
            }`}
            title={isListening ? 'Listening...' : 'Tap to speak (Kannada / English)'}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendQuery()}
            placeholder={
              isListening
                ? language === 'kn' ? 'ಕೇಳಿಸಿಕೊಳ್ಳುತ್ತಿದ್ದೇನೆ...' : 'Listening... speak now...'
                : language === 'kn'
                ? 'ಮಾತನಾಡಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ...'
                : 'Tap to speak or type...'
            }
            className="flex-1 px-3 py-2 bg-[#13223B] border border-[#1E3458] rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-400"
          />

          {/* Teal Circular Send Button */}
          <button
            onClick={() => handleSendQuery()}
            disabled={!inputText.trim() || isLoading}
            className="w-9 h-9 rounded-full bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-sm"
            aria-label="Send query"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom Bar: Language Selector & Soundwave Indicator */}
        <div className="flex items-center justify-between pt-1 px-1 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Globe className="w-3 h-3 text-teal-400" />
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value as 'en' | 'kn')}
              className="bg-transparent text-slate-300 hover:text-white border-none focus:ring-0 cursor-pointer text-[11px] font-medium"
            >
              <option value="en" className="bg-[#0B1728] text-white">English</option>
              <option value="kn" className="bg-[#0B1728] text-white">ಕನ್ನಡ (Kannada)</option>
            </select>
          </div>

          <div className="flex items-center gap-1 text-teal-400" title="Audio response enabled">
            <span className="w-1 h-3 bg-teal-400 rounded-full animate-pulse" />
            <span className="w-1 h-4 bg-teal-400 rounded-full animate-pulse [animation-delay:0.15s]" />
            <span className="w-1 h-2 bg-teal-400 rounded-full animate-pulse [animation-delay:0.3s]" />
          </div>
        </div>
      </div>
    </div>
  );
};
