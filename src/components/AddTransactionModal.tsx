import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  ArrowDownLeft,
  ArrowUpRight
} from 'lucide-react';
import {
  ExpenseCategory,
  InflowCategory,
  PaymentStatus,
  Transaction,
  TransactionType
} from '../types/cashflow';
import { AppLanguage } from '../types/munimji';
import { TRANSLATIONS, getLocalizedExtraUI } from '../utils/translations';
import {
  fromNativeDigits,
  localizeInvoiceCode,
  toNativeDigits,
} from '../utils/localization';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  preloadDate?: string;
  language?: AppLanguage;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onAddTransaction,
  preloadDate,
  language = 'en',
}) => {
  const [type, setType] = useState<TransactionType>('inflow');
  const [partyName, setPartyName] = useState('');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(preloadDate || '2026-10-30');
  const [category, setCategory] = useState<ExpenseCategory | InflowCategory>('b2b_invoice');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen && preloadDate) {
      setDueDate(preloadDate);
    }
  }, [isOpen, preloadDate]);

  if (!isOpen) return null;

  const t = TRANSLATIONS[language];
  const extra = getLocalizedExtraUI(language);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(fromNativeDigits(amount).replace(/[^0-9.]/g, ''));
    if (!partyName || isNaN(parsedAmount) || parsedAmount <= 0) return;

    onAddTransaction({
      type,
      partyName,
      title: title || partyName,
      amount: Math.round(parsedAmount),
      dueDate,
      status: 'expected' as PaymentStatus,
      category,
      invoiceNumber: fromNativeDigits(invoiceNumber) || undefined,
      notes: notes || undefined,
    });

    setPartyName('');
    setTitle('');
    setAmount('');
    setInvoiceNumber('');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
      <div className="bg-[#FFFDF9] rounded-3xl shadow-2xl border-2 border-[#D6C5A9] w-full max-w-lg overflow-hidden max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#EADDC5] flex items-center justify-between bg-[#FAF1DF]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#14532D] text-[#FDE68A] flex items-center justify-center shrink-0">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-[#1C1917]">
                {t.addModalTitle}
              </h3>
              <p className="text-base text-[#57534E]">
                {extra.addModalSubtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-[#57534E] hover:bg-white cursor-pointer"
            aria-label={t.closeBtn}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-lg">
          {/* Money In vs Bill to Pay */}
          <div>
            <label className="block font-extrabold text-[#1C1917] mb-1.5">
              {extra.addDirectionLabel}
            </label>
            <div className="grid grid-cols-2 gap-2.5 p-1.5 bg-[#FAF1DF] border border-[#D6C5A9] rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setType('inflow');
                  setCategory('b2b_invoice');
                }}
                className={`min-h-[50px] py-2.5 px-3 rounded-xl font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  type === 'inflow'
                    ? 'bg-[#14532D] text-white shadow-xs'
                    : 'text-[#44403C] hover:text-[#1C1917]'
                }`}
              >
                <ArrowDownLeft className="w-5 h-5 shrink-0" />
                <span>{t.addMoneyInTab}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('outflow');
                  setCategory('supplier');
                }}
                className={`min-h-[50px] py-2.5 px-3 rounded-xl font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  type === 'outflow'
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'text-[#44403C] hover:text-[#1C1917]'
                }`}
              >
                <ArrowUpRight className="w-5 h-5 shrink-0" />
                <span>{t.addMoneyOutTab}</span>
              </button>
            </div>
          </div>

          {/* Party Name & Ref */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-[#1C1917] mb-1">
                {t.partyNameLabel} *
              </label>
              <input
                type="text"
                required
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                className="w-full min-h-[48px] px-3.5 py-2 bg-white border-2 border-[#D6C5A9] rounded-2xl text-lg text-[#1C1917] focus:outline-none focus:border-[#14532D]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#1C1917] mb-1">
                {extra.addInvoiceRefLabel}
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder={localizeInvoiceCode('INV-415', language)}
                className="w-full min-h-[48px] px-3.5 py-2 bg-white border-2 border-[#D6C5A9] rounded-2xl font-mono text-lg text-[#1C1917] focus:outline-none focus:border-[#14532D]"
              />
            </div>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-[#1C1917] mb-1">
                {extra.addAmountLabel}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-[#57534E] font-extrabold text-xl">
                  ₹
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={toNativeDigits('25000', language)}
                  className="w-full min-h-[48px] pl-9 pr-3.5 py-2 bg-white border-2 border-[#D6C5A9] rounded-2xl font-mono font-extrabold text-xl text-[#1C1917] focus:outline-none focus:border-[#14532D]"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#1C1917] mb-1">
                {extra.addDueDateLabel}
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full min-h-[48px] px-3.5 py-2 bg-white border-2 border-[#D6C5A9] rounded-2xl font-mono text-lg text-[#1C1917] focus:outline-none focus:border-[#14532D]"
              />
            </div>
          </div>

          {/* Item Note */}
          <div>
            <label className="block font-bold text-[#1C1917] mb-1">
              {t.billDescriptionLabel}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full min-h-[48px] px-3.5 py-2 bg-white border-2 border-[#D6C5A9] rounded-2xl text-lg text-[#1C1917] focus:outline-none focus:border-[#14532D]"
            />
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block font-bold text-[#1C1917] mb-1">
              {extra.addNotesLabel}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={extra.addNotesPlaceholder}
              className="w-full px-3.5 py-2 bg-white border-2 border-[#D6C5A9] rounded-2xl text-lg text-[#1C1917] focus:outline-none focus:border-[#14532D]"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-[#EADDC5] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[48px] px-4 py-2.5 rounded-2xl border border-[#D6C5A9] text-lg font-bold text-[#44403C] cursor-pointer"
            >
              {t.cancelBtn}
            </button>
            <button
              type="submit"
              className="min-h-[48px] px-5 py-2.5 bg-[#14532D] hover:bg-[#166534] text-white rounded-2xl text-lg font-extrabold cursor-pointer"
            >
              {t.saveEntryBtn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
