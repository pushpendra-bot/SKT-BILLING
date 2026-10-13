import React, { useState } from 'react';
import { RefreshCw, Plus } from 'lucide-react';

export const FYClosingView: React.FC = () => {
  const [financialYears, setFinancialYears] = useState([
    { fy: '2024-25', status: 'Closed & Audited', totalTurnover: '₹42,50,000', netProfit: '₹8,20,000' },
    { fy: '2025-26', status: 'Closed & Audited', totalTurnover: '₹68,90,000', netProfit: '₹14,50,000' },
    { fy: '2026-27', status: 'Active (Current FY)', totalTurnover: '₹24,10,000', netProfit: '₹5,30,000' },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFy, setNewFy] = useState('');
  const [turnover, setTurnover] = useState('');

  const handleAddFY = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFy) return;
    setFinancialYears([
      ...financialYears,
      {
        fy: newFy,
        status: 'Active (New FY)',
        totalTurnover: turnover ? `₹${Number(turnover).toLocaleString()}` : '₹0',
        netProfit: '₹0',
      },
    ]);
    setNewFy('');
    setTurnover('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2">
            <RefreshCw className="w-4 h-4 text-indigo-600" /> Accounting Module
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">Financial Year (FY) Closing & Carry-Forward</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Automated year-end balance carry-forward, stock valuation transfer, and new FY opening ledger creation.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all"
        >
          <Plus className="w-4 h-4" /> Initialize New FY
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {financialYears.map(fy => (
          <div key={fy.fy} className="p-5 bg-white border rounded-2xl border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-base text-slate-900">FY {fy.fy}</span>
              <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${fy.status.includes('Active') ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                {fy.status}
              </span>
            </div>
            <div className="text-xs text-slate-600 flex justify-between">
              <span>Total Turnover:</span>
              <span className="font-bold text-slate-900">{fy.totalTurnover}</span>
            </div>
            <div className="text-xs text-slate-600 flex justify-between">
              <span>Net Profit:</span>
              <span className="font-bold text-emerald-600">{fy.netProfit}</span>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Initialize New Financial Year</h3>
            <form onSubmit={handleAddFY} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Financial Year (e.g. 2027-28)</label>
                <input
                  type="text"
                  value={newFy}
                  onChange={(e) => setNewFy(e.target.value)}
                  placeholder="2027-28"
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Opening Turnover (₹)</label>
                <input
                  type="number"
                  value={turnover}
                  onChange={(e) => setTurnover(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
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
                  Create FY
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
