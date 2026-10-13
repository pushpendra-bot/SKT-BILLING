import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ArrowRightLeft, Plus } from 'lucide-react';

export const OrdersWorkflowView: React.FC = () => {
  const { parties } = useApp();
  const [orders, setOrders] = useState([
    { id: 'ord-101', type: 'Sales Order', party: parties[0]?.name || 'ABC Corp', date: '2026-10-08', amount: 65000, status: 'Processing' },
    { id: 'ord-102', type: 'Purchase Order', party: parties[1]?.name || 'XYZ Traders', date: '2026-10-07', amount: 32000, status: 'Shipped' },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [type, setType] = useState('Sales Order');
  const [party, setParty] = useState('');
  const [amount, setAmount] = useState('');

  const handleAddOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!party || !amount) return;
    setOrders([
      ...orders,
      {
        id: `ord-${Math.floor(100 + Math.random() * 900)}`,
        type,
        party,
        date: new Date().toISOString().split('T')[0],
        amount: Number(amount) || 10000,
        status: 'Processing',
      },
    ]);
    setParty('');
    setAmount('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2">
            <ArrowRightLeft className="w-4 h-4 text-indigo-600" /> Pipeline Module
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">Advanced Order Workflow</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track Sales Orders &rarr; Delivery Challans &rarr; Tax Invoices seamlessly with 1-click conversion.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all"
        >
          <Plus className="w-4 h-4" /> New Order / Challan
        </button>
      </div>

      <div className="space-y-3">
        {orders.map(ord => (
          <div key={ord.id} className="p-4 bg-white border rounded-2xl border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-lg">{ord.id}</span>
              <div>
                <div className="font-bold text-sm text-slate-900">{ord.party}</div>
                <div className="text-xs text-slate-500">{ord.type} &bull; {ord.date}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-black text-slate-900">₹{ord.amount.toLocaleString()}</div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">{ord.status}</span>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Create New Order</h3>
            <form onSubmit={handleAddOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Order Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="Sales Order">Sales Order</option>
                  <option value="Purchase Order">Purchase Order</option>
                  <option value="Delivery Challan">Delivery Challan</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Party Name</label>
                <input
                  type="text"
                  value={party}
                  onChange={(e) => setParty(e.target.value)}
                  placeholder="e.g. Acme Corporation"
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Order Amount (₹)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 25000"
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
                  Create Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
