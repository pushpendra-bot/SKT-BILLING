import React, { useState } from 'react';
import { Tag, Plus } from 'lucide-react';

export const SchemesView: React.FC = () => {
  const [schemes, setSchemes] = useState([
    { id: 'sch-1', name: 'Diwali Bulk Discount Scheme', criteria: 'Buy 10 Get 1 Free', applicableOn: 'All FMCG Items', status: 'Active' },
    { id: 'sch-2', name: 'Wholesaler Cash Rebate', criteria: 'Flat 5% on orders > ₹50,000', applicableOn: 'Gold Tier Parties', status: 'Active' },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [criteria, setCriteria] = useState('');
  const [applicableOn, setApplicableOn] = useState('');

  const handleAddScheme = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !criteria) return;
    setSchemes([
      ...schemes,
      {
        id: `sch-${Date.now()}`,
        name,
        criteria,
        applicableOn: applicableOn || 'All Items',
        status: 'Active',
      },
    ]);
    setName('');
    setCriteria('');
    setApplicableOn('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2">
            <Tag className="w-4 h-4 text-indigo-600" /> Sales Promotion Module
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">Scheme & Discount Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Automate quantity-based schemes (Buy X Get Y Free) and tiered cash discounts for high-volume parties.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all"
        >
          <Plus className="w-4 h-4" /> Add New Scheme
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {schemes.map(sch => (
          <div key={sch.id} className="p-5 bg-white border rounded-2xl border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-sm text-slate-900">{sch.name}</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-bold">{sch.status}</span>
            </div>
            <div className="text-xs text-slate-600">
              Criteria: <span className="font-bold text-indigo-900">{sch.criteria}</span>
            </div>
            <div className="text-xs text-slate-600">
              Applicable On: <span className="font-medium text-slate-800">{sch.applicableOn}</span>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Add Discount Scheme</h3>
            <form onSubmit={handleAddScheme} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Scheme Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Summer Special Rebate"
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Criteria (e.g. Buy 5 Get 1)</label>
                <input
                  type="text"
                  value={criteria}
                  onChange={(e) => setCriteria(e.target.value)}
                  placeholder="e.g. Flat 10% on ₹10,000+"
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Applicable On</label>
                <input
                  type="text"
                  value={applicableOn}
                  onChange={(e) => setApplicableOn(e.target.value)}
                  placeholder="e.g. Electronics Category"
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
                  Save Scheme
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
