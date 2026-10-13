import React, { useState } from 'react';
import { FileSpreadsheet, Plus } from 'lucide-react';

export const BRSView: React.FC = () => {
  const [brsItems, setBrsItems] = useState([
    { id: 'brs-1', particulars: 'Cheque issued to Vendor X (No. 9921)', bookDate: '2026-09-28', clearingDate: '2026-10-03', amount: 12500, status: 'Cleared' },
    { id: 'brs-2', particulars: 'Cheque received from Customer Y (No. 4412)', bookDate: '2026-09-30', clearingDate: '-', amount: 28000, status: 'Not Cleared' },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [particulars, setParticulars] = useState('');
  const [amount, setAmount] = useState('');

  const handleAddBRS = (e: React.FormEvent) => {
    e.preventDefault();
    if (!particulars || !amount) return;
    setBrsItems([
      ...brsItems,
      {
        id: `brs-${Date.now()}`,
        particulars,
        bookDate: new Date().toISOString().split('T')[0],
        clearingDate: '-',
        amount: Number(amount) || 5000,
        status: 'Not Cleared',
      },
    ]);
    setParticulars('');
    setAmount('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2">
            <FileSpreadsheet className="w-4 h-4 text-indigo-600" /> Banking Module
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">Bank Reconciliation Statement (BRS)</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Reconcile cash/bank book ledger entries with bank statement clearing dates and un-cleared instruments.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all"
        >
          <Plus className="w-4 h-4" /> Add Bank Entry
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
              <tr>
                <th className="p-3">Particulars</th>
                <th className="p-3">Book Date</th>
                <th className="p-3">Clearing Date</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Reconciliation Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {brsItems.map(brs => (
                <tr key={brs.id} className="hover:bg-slate-50">
                  <td className="p-3 font-semibold text-slate-900">{brs.particulars}</td>
                  <td className="p-3">{brs.bookDate}</td>
                  <td className="p-3 font-mono">{brs.clearingDate}</td>
                  <td className="p-3 font-bold">₹{brs.amount.toLocaleString()}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded font-medium ${brs.status === 'Cleared' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {brs.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Add BRS Entry</h3>
            <form onSubmit={handleAddBRS} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Particulars / Cheque details</label>
                <input
                  type="text"
                  value={particulars}
                  onChange={(e) => setParticulars(e.target.value)}
                  placeholder="e.g. Cheque issued to Supplier Z"
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 15000"
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
                >
                  Add Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
