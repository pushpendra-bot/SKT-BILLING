import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../utils/gstUtils';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Download,
  X,
  FileSpreadsheet,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';

export const LedgerView: React.FC = () => {
  const { getLedgerTransactions, journals, addJournalEntry, parties } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'ledger' | 'journals'>('ledger');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPartyFilter, setSelectedPartyFilter] = useState<string>('All');

  // New Journal Entry Modal
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [journalDate, setJournalDate] = useState(new Date().toISOString().split('T')[0]);
  const [debitAccount, setDebitAccount] = useState('');
  const [creditAccount, setCreditAccount] = useState('');
  const [journalAmount, setJournalAmount] = useState<number>(0);
  const [journalNarration, setJournalNarration] = useState('');

  const transactions = getLedgerTransactions(selectedPartyFilter === 'All' ? undefined : selectedPartyFilter);

  const filteredTransactions = transactions.filter(t => {
    return (
      t.refNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.partyOrAccount.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.narration.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const totalDebits = transactions.reduce((acc, t) => acc + t.debit, 0);
  const totalCredits = transactions.reduce((acc, t) => acc + t.credit, 0);
  const netBalance = totalDebits - totalCredits;

  const handleOpenJournalModal = () => {
    setJournalDate(new Date().toISOString().split('T')[0]);
    setDebitAccount('');
    setCreditAccount('');
    setJournalAmount(0);
    setJournalNarration('Being ');
    setIsJournalModalOpen(true);
  };

  const handleSaveJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!debitAccount.trim() || !creditAccount.trim()) {
      alert('Please specify both Debit and Credit accounts.');
      return;
    }
    if (journalAmount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    const count = journals.length + 1;
    const entryNo = `JV-2026-${String(count).padStart(3, '0')}`;

    addJournalEntry({
      entryNumber: entryNo,
      date: journalDate,
      debitAccount: debitAccount.trim(),
      creditAccount: creditAccount.trim(),
      amount: Number(journalAmount),
      narration: journalNarration.trim(),
      referenceType: 'manual',
    });

    setIsJournalModalOpen(false);
  };

  const handleExportCSV = () => {
    let csv = 'Date,Type,Voucher/Ref No,Account / Party,Narration,Debit (INR),Credit (INR),Running Balance (INR)\n';
    filteredTransactions.forEach(t => {
      csv += `"${t.date}","${t.type}","${t.refNo}","${t.partyOrAccount.replace(/"/g, '""')}","${t.narration.replace(/"/g, '""')}",${t.debit},${t.credit},${t.balance || 0}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `General_Ledger_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Accounting & General Ledger</h1>
          <p className="text-xs text-slate-500">
            Chronological audit trail of all business sales, purchases, payments, expenses, and manual journal entries
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleOpenJournalModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>+ Manual Journal Entry</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <span className="text-[11px] font-medium text-slate-500">Total Debits (Receivables & Assets)</span>
          <p className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-0.5">
            {formatINR(totalDebits)}
          </p>
          <span className="text-[10px] text-slate-400">Total debit turnover</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <span className="text-[11px] font-medium text-slate-500">Total Credits (Payables & Income)</span>
          <p className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-0.5">
            {formatINR(totalCredits)}
          </p>
          <span className="text-[10px] text-slate-400">Total credit turnover</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <span className="text-[11px] font-medium text-slate-500">Net Ledger Balance</span>
          <p className={`text-lg font-bold font-mono tabular-nums mt-0.5 ${netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatINR(netBalance)}
          </p>
          <span className="text-[10px] text-slate-400">Net position</span>
        </div>
      </div>

      {/* Sub-tab Navigation & Filters */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
          <button
            onClick={() => setActiveSubTab('ledger')}
            className={`px-3 py-1 rounded-md font-semibold transition-colors ${
              activeSubTab === 'ledger'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            General Ledger (Chronological)
          </button>
          <button
            onClick={() => setActiveSubTab('journals')}
            className={`px-3 py-1 rounded-md font-semibold transition-colors ${
              activeSubTab === 'journals'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Journal Vouchers ({journals.length})
          </button>
        </div>

        {activeSubTab === 'ledger' && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search narration or ref #..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <select
              value={selectedPartyFilter}
              onChange={e => setSelectedPartyFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium"
            >
              <option value="All">All Parties & Accounts</option>
              {parties.map(p => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Table Area */}
      {activeSubTab === 'ledger' ? (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px] font-semibold">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Ref / Voucher #</th>
                  <th className="py-3 px-3">Account / Party</th>
                  <th className="py-3 px-3 min-w-[240px]">Narration / Particulars</th>
                  <th className="py-3 px-3 text-right">Debit (₹)</th>
                  <th className="py-3 px-3 text-right">Credit (₹)</th>
                  <th className="py-3 px-3 text-right">Balance (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <BookOpen className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-medium text-slate-600">No ledger transactions found</p>
                      <p className="text-[11px] mt-0.5">Transactions from sales, purchases, and expenses will appear here.</p>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2 px-3 font-mono text-slate-600 tabular-nums">{tx.date}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                            tx.type === 'Sale'
                              ? 'bg-rose-50 text-rose-700'
                              : tx.type === 'Purchase'
                              ? 'bg-blue-50 text-blue-700'
                              : tx.type === 'Expense'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-slate-800">{tx.refNo}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900">{tx.partyOrAccount}</td>
                      <td className="py-2 px-3 text-slate-600 leading-snug">{tx.narration}</td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-900 font-medium">
                        {tx.debit > 0 ? formatINR(tx.debit) : '-'}
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-900 font-medium">
                        {tx.credit > 0 ? formatINR(tx.credit) : '-'}
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                        {tx.balance !== undefined ? formatINR(tx.balance) : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Journal Entries List */
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px] font-semibold">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">JV Number</th>
                  <th className="py-3 px-3">Debit Account</th>
                  <th className="py-3 px-3">Credit Account</th>
                  <th className="py-3 px-3 text-right">Amount (₹)</th>
                  <th className="py-3 px-3">Narration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {journals.map(je => (
                  <tr key={je.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-600 tabular-nums">{je.date}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-rose-700">{je.entryNumber}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{je.debitAccount} (Dr)</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-700">{je.creditAccount} (Cr)</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                      {formatINR(je.amount)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 italic">{je.narration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Journal Entry Modal */}
      {isJournalModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-slate-200 p-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h2 className="text-base font-bold text-slate-900">Manual Journal Voucher (JV)</h2>
              <button onClick={() => setIsJournalModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveJournal} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Voucher Date *</label>
                <input
                  type="date"
                  required
                  value={journalDate}
                  onChange={e => setJournalDate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1 font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Debit Account (Dr) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rent Expense A/C, Tata Projects Ltd, Cash A/C"
                  value={debitAccount}
                  onChange={e => setDebitAccount(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1 font-semibold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Credit Account (Cr) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bank A/C (HDFC), Sales A/C, Capital A/C"
                  value={creditAccount}
                  onChange={e => setCreditAccount(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1 font-semibold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Voucher Amount (₹) *</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={journalAmount || ''}
                  onChange={e => setJournalAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1 font-mono font-bold text-sm tabular-nums"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Narration / Particulars *</label>
                <textarea
                  rows={2}
                  required
                  value={journalNarration}
                  onChange={e => setJournalNarration(e.target.value)}
                  placeholder="Being ..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsJournalModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-sm"
                >
                  Post Journal Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
