import React, { useState } from 'react';
import { FileText, Plus } from 'lucide-react';

export const EWayView: React.FC = () => {
  const [eWayInvoices, setEWayInvoices] = useState([
    { id: 'ew-1', docNo: 'INV/2026/089', ewayBillNo: '581492039102', irn: '8d93f0c1a2b4...3e9f', transporter: 'TCI Freight', status: 'Generated & Valid' },
    { id: 'ew-2', docNo: 'INV/2026/090', ewayBillNo: '992019283109', irn: '4c29e1f0b3a5...7d1c', transporter: 'Safexpress', status: 'Generated & Valid' },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [docNo, setDocNo] = useState('');
  const [transporter, setTransporter] = useState('');

  const handleAddEWay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docNo) return;
    setEWayInvoices([
      ...eWayInvoices,
      {
        id: `ew-${Date.now()}`,
        docNo,
        ewayBillNo: Math.floor(100000000000 + Math.random() * 900000000000).toString(),
        irn: '9a82e1c0f4...b21e',
        transporter: transporter || 'Local Logistics',
        status: 'Generated & Valid',
      },
    ]);
    setDocNo('');
    setTransporter('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2">
            <FileText className="w-4 h-4 text-indigo-600" /> GST Compliance Module
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">E-Way Bill & E-Invoice Portal Integration</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Generate GST e-way bills and Invoice Reference Numbers (IRN) directly from tax invoices with 1-click JSON export.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all"
        >
          <Plus className="w-4 h-4" /> Generate E-Way / IRN
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
              <tr>
                <th className="p-3">Invoice Doc No</th>
                <th className="p-3">E-Way Bill No</th>
                <th className="p-3">IRN (Hash)</th>
                <th className="p-3">Transporter</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {eWayInvoices.map(ew => (
                <tr key={ew.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-indigo-900">{ew.docNo}</td>
                  <td className="p-3 font-mono font-semibold">{ew.ewayBillNo}</td>
                  <td className="p-3 font-mono text-slate-500 truncate max-w-[150px]">{ew.irn}</td>
                  <td className="p-3 text-slate-700">{ew.transporter}</td>
                  <td className="p-3">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      {ew.status}
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
            <h3 className="text-lg font-bold text-slate-900">Generate E-Way Bill / IRN</h3>
            <form onSubmit={handleAddEWay} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Invoice Document No</label>
                <input
                  type="text"
                  value={docNo}
                  onChange={(e) => setDocNo(e.target.value)}
                  placeholder="e.g. INV/2026/095"
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Transporter Name</label>
                <input
                  type="text"
                  value={transporter}
                  onChange={(e) => setTransporter(e.target.value)}
                  placeholder="e.g. Blue Dart Express"
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
                  Generate E-Way Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
