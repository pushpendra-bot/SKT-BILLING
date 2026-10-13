import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Expense, ExpenseCategory, PaymentMode } from '../../types';
import { formatINR, GST_RATES } from '../../utils/gstUtils';
import {
  Wallet,
  Plus,
  Search,
  Trash2,
  X,
  CreditCard,
  Building,
  Receipt,
  FileSpreadsheet,
} from 'lucide-react';

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Office Supplies & Stationery',
  'Rent & Premises',
  'Salaries & Wages',
  'Electricity & Utilities',
  'Freight & Transportation',
  'Travel & Conveyance',
  'Repairs & Maintenance',
  'Advertising & Marketing',
  'Legal & Professional Charges',
  'Bank & Merchant Charges',
  'Packaging & Materials',
  'Miscellaneous Expense',
];

interface ExpensesViewProps {
  onOpenAddExpense?: () => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = () => {
  const { expenses, addExpense, deleteExpense } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<ExpenseCategory>('Office Supplies & Stationery');
  const [vendorName, setVendorName] = useState('');
  const [vendorGstin, setVendorGstin] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMode>('Bank Transfer / NEFT');
  const [notes, setNotes] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');

  const taxAmount = Number(((amount * taxRate) / 100).toFixed(2));
  const totalAmount = Number((amount + taxAmount).toFixed(2));

  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch =
      exp.expenseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || exp.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const totalExpenseSum = expenses.reduce((acc, e) => acc + e.totalAmount, 0);
  const totalGstPaid = expenses.reduce((acc, e) => acc + e.taxAmount, 0);

  // Category breakdown top spender
  const categoryTotals: { [key: string]: number } = {};
  expenses.forEach(e => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.totalAmount;
  });
  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

  const handleOpenModal = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setCategory('Office Supplies & Stationery');
    setVendorName('');
    setVendorGstin('');
    setAmount(0);
    setTaxRate(0);
    setPaymentMethod('Bank Transfer / NEFT');
    setNotes('');
    setReceiptNumber('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      alert('Please enter a valid expense amount.');
      return;
    }

    const count = expenses.length + 1;
    const expNum = `EXP-2026-${String(count).padStart(3, '0')}`;

    addExpense({
      expenseNumber: expNum,
      date,
      category,
      vendorName: vendorName.trim() || 'Direct Expense',
      vendorGstin: vendorGstin.trim().toUpperCase(),
      amount: Number(amount),
      taxRate: Number(taxRate),
      taxAmount,
      totalAmount,
      paymentMethod,
      notes: notes.trim(),
      receiptNumber: receiptNumber.trim(),
    });

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Expenses & Overhead</h1>
          <p className="text-xs text-slate-500">
            Record operational expenses, overheads, and input tax credits for accurate profit calculations
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>Record Expense</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <span className="text-[11px] font-medium text-slate-500">Total Operating Expenses</span>
          <p className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-0.5">
            {formatINR(totalExpenseSum)}
          </p>
          <span className="text-[10px] text-slate-400">{expenses.length} expense receipts recorded</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <span className="text-[11px] font-medium text-slate-500">Top Spending Category</span>
          <p className="text-lg font-bold text-slate-900 truncate mt-0.5">
            {topCategory ? topCategory[0] : 'N/A'}
          </p>
          <span className="text-[10px] text-rose-600 font-mono tabular-nums">
            {topCategory ? formatINR(topCategory[1]) : ''}
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <span className="text-[11px] font-medium text-slate-500">GST Paid on Expenses (ITC)</span>
          <p className="text-lg font-bold text-emerald-600 font-mono tabular-nums mt-0.5">
            {formatINR(totalGstPaid)}
          </p>
          <span className="text-[10px] text-emerald-600">Eligible input tax credit</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by expense #, category or vendor..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-medium"
        >
          <option value="All">All Categories</option>
          {EXPENSE_CATEGORIES.map(cat => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px] font-semibold">
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Expense #</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Paid To / Vendor</th>
                <th className="py-3 px-3">Payment Mode</th>
                <th className="py-3 px-3 text-right">Taxable Amount</th>
                <th className="py-3 px-3 text-right">GST Paid</th>
                <th className="py-3 px-3 text-right">Total Amount (₹)</th>
                <th className="py-3 px-3 text-center w-16">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Receipt className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600">No expenses found</p>
                    <p className="text-[11px] mt-0.5">Click "Record Expense" to track rent, salaries, utilities, etc.</p>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-600 tabular-nums">{exp.date}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{exp.expenseNumber}</td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-slate-900">{exp.category}</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      <div>{exp.vendorName}</div>
                      {exp.notes && <div className="text-[10px] text-slate-400 truncate max-w-[200px]">{exp.notes}</div>}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-medium">{exp.paymentMethod}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">
                      {formatINR(exp.amount)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-emerald-600">
                      {formatINR(exp.taxAmount)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                      {formatINR(exp.totalAmount)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => deleteExpense(exp.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        title="Delete Expense"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-slate-200 p-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h2 className="text-base font-bold text-slate-900">Record Expense</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Expense Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1 font-medium"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Expense Category *</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as ExpenseCategory)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1 bg-white font-medium"
                  >
                    {EXPENSE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Paid To / Vendor / Beneficiary</label>
                <input
                  type="text"
                  placeholder="e.g. MIDC Realties or Adani Electricity"
                  value={vendorName}
                  onChange={e => setVendorName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Base Amount (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={amount || ''}
                    onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1 font-mono font-bold text-sm tabular-nums"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">GST Rate (%)</label>
                  <select
                    value={taxRate}
                    onChange={e => setTaxRate(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1 bg-white font-medium"
                  >
                    <option value={0}>0% (Exempt / Nil)</option>
                    <option value={5}>5% GST</option>
                    <option value={12}>12% GST</option>
                    <option value={18}>18% GST</option>
                    <option value={28}>28% GST</option>
                  </select>
                </div>
              </div>

              {/* Total preview */}
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex justify-between text-xs font-semibold">
                <span>Total Payment:</span>
                <span className="font-mono text-rose-600 font-bold tabular-nums">
                  {formatINR(totalAmount)} {taxAmount > 0 ? `(Includes ₹${taxAmount} GST)` : ''}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as PaymentMode)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1 bg-white font-medium"
                  >
                    <option value="Bank Transfer / NEFT">Bank Transfer / NEFT</option>
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Bill / Receipt Number</label>
                  <input
                    type="text"
                    placeholder="e.g. REC/8821"
                    value={receiptNumber}
                    onChange={e => setReceiptNumber(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Vendor GSTIN (For ITC Claim)</label>
                <input
                  type="text"
                  placeholder="15-character GSTIN"
                  value={vendorGstin}
                  onChange={e => setVendorGstin(e.target.value.toUpperCase())}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1 font-mono uppercase"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Notes / Purpose</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Purpose of expenditure..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-sm"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
