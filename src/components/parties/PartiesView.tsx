import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Party } from '../../types';
import {
  INDIAN_STATES,
  formatINR,
  validateGSTIN,
  extractStateCodeFromGSTIN,
  getStateByCode,
  lookupGSTINDetails,
  GSTINDetails,
} from '../../utils/gstUtils';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Building2,
  Edit2,
  Trash2,
  X,
  FileText,
  Printer,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Download,
  Upload,
  FileSpreadsheet,
} from 'lucide-react';
import { BusyGstinModal } from '../common/BusyGstinModal';
import {
  downloadFile,
  downloadBinaryFile,
  generateBusy21AccountsCsv,
  generateBusy21AccountsExcel,
  parseAnyBusy21Data,
} from '../../utils/busy21Data';

interface PartiesViewProps {
  onOpenNewSaleToParty?: (party: Party) => void;
}

export const PartiesView: React.FC<PartiesViewProps> = () => {
  const { parties, profile, addParty, updateParty, deleteParty, invoices } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | 'customer' | 'supplier'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showBusyGstinModal, setShowBusyGstinModal] = useState(false);
  const [editingParty, setEditingParty] = useState<Party | null>(null);

  // Statement Drawer state
  const [selectedPartyForStatement, setSelectedPartyForStatement] = useState<Party | null>(null);

  // Bulk CSV & Busy 21 import/export
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleExportPartiesCsv = () => {
    const csv = generateBusy21AccountsCsv(parties, invoices);
    downloadFile(csv, `Parties_Accounts_All_Details_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
  };

  const handleExportPartiesExcel = () => {
    const buffer = generateBusy21AccountsExcel(parties, invoices);
    downloadBinaryFile(buffer, `Parties_Accounts_All_Details_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleImportPartiesFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const parsed = parseAnyBusy21Data(text);
        if (parsed.parties.length === 0) {
          alert('No parties/accounts detected in file. Please verify CSV columns or Busy 21 XML tags.');
          return;
        }

        let updatedCount = 0;
        let addedCount = 0;

        parsed.parties.forEach(newP => {
          const existing = parties.find(
            p => p.name.toLowerCase() === newP.name.toLowerCase() || (newP.gstin && p.gstin === newP.gstin)
          );
          if (existing) {
            updateParty({
              ...existing,
              phone: newP.phone || existing.phone,
              email: newP.email || existing.email,
              gstin: newP.gstin || existing.gstin,
              pan: newP.pan || existing.pan,
              billingAddress: newP.billingAddress || existing.billingAddress,
              city: newP.city || existing.city,
              state: newP.state || existing.state,
              stateCode: newP.stateCode || existing.stateCode,
              pincode: newP.pincode || existing.pincode,
              openingBalance: newP.openingBalance !== undefined ? newP.openingBalance : existing.openingBalance,
            });
            updatedCount++;
          } else {
            addParty(newP);
            addedCount++;
          }
        });

        setImportStatus(`Successfully updated ${updatedCount} parties and added ${addedCount} new parties!`);
        setTimeout(() => setImportStatus(null), 6000);
      } catch (err: any) {
        alert(`Failed to import parties: ${err.message}`);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Form fields
  const [name, setName] = useState('');
  const [type, setType] = useState<'customer' | 'supplier'>('customer');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateCode, setStateCode] = useState(profile.stateCode);
  const [pincode, setPincode] = useState('');
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [balanceType, setBalanceType] = useState<'to_receive' | 'to_pay'>('to_receive');
  const [creditLimit, setCreditLimit] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [gstinAutofillStatus, setGstinAutofillStatus] = useState<GSTINDetails | null>(null);

  const filteredParties = parties.filter(p => {
    const matchesTab = activeTab === 'all' || p.type === activeTab;
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.gstin && p.gstin.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.phone && p.phone.includes(searchTerm)) ||
      (p.city && p.city.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesTab && matchesSearch;
  });

  const totalReceivables = parties
    .filter(p => p.type === 'customer')
    .reduce((acc, p) => acc + (p.currentBalance > 0 ? p.currentBalance : 0), 0);

  const totalPayables = parties
    .filter(p => p.type === 'supplier')
    .reduce((acc, p) => acc + (p.currentBalance > 0 ? p.currentBalance : 0), 0);

  const handleOpenAdd = () => {
    setEditingParty(null);
    setName('');
    setType('customer');
    setPhone('');
    setEmail('');
    setGstin('');
    setPan('');
    setBillingAddress('');
    setShippingAddress('');
    setCity('');
    setStateCode(profile.stateCode);
    setPincode('');
    setOpeningBalance(0);
    setBalanceType('to_receive');
    setCreditLimit(0);
    setNotes('');
    setGstinAutofillStatus(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Party) => {
    setEditingParty(p);
    setName(p.name);
    setType(p.type);
    setPhone(p.phone);
    setEmail(p.email);
    setGstin(p.gstin);
    setPan(p.pan);
    setBillingAddress(p.billingAddress);
    setShippingAddress(p.shippingAddress);
    setCity(p.city);
    setStateCode(p.stateCode);
    setPincode(p.pincode);
    setOpeningBalance(p.openingBalance);
    setBalanceType(p.balanceType);
    setCreditLimit(p.creditLimit || 0);
    setNotes(p.notes || '');
    setGstinAutofillStatus(null);
    setIsModalOpen(true);
  };

  const handleTriggerAutofill = (gstinToLookup: string) => {
    const details = lookupGSTINDetails(gstinToLookup);
    if (details) {
      setGstinAutofillStatus(details);
      setGstin(details.gstin);
      setPan(details.pan);
      setStateCode(details.stateCode);
      if (details.city) setCity(details.city);
      if (details.pincode) setPincode(details.pincode);
      if (details.address && !billingAddress) {
        setBillingAddress(details.address);
        setShippingAddress(details.address);
      }
      if (details.isVerifiedRealName && (details.tradeName || details.legalName)) {
        if (!name.trim() || name.includes('New Party') || name.includes('Enter')) {
          setName(details.tradeName || details.legalName);
        }
      }
      if (details.phone && !phone) setPhone(details.phone);
      if (details.email && !email) setEmail(details.email);
    }
  };

  const handleGstinChange = (val: string) => {
    const cleaned = val.toUpperCase().trim();
    setGstin(cleaned);
    const code = extractStateCodeFromGSTIN(cleaned);
    if (code) {
      setStateCode(code);
    }
    if (cleaned.length >= 12) {
      setPan(cleaned.substring(2, 12));
    }
    if (cleaned.length === 15) {
      handleTriggerAutofill(cleaned);
    } else {
      setGstinAutofillStatus(null);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter party name.');
      return;
    }

    const stateObj = getStateByCode(stateCode);
    const stateName = stateObj?.name || profile.state;

    if (editingParty) {
      updateParty({
        ...editingParty,
        name: name.trim(),
        type,
        phone: phone.trim(),
        email: email.trim(),
        gstin: gstin.trim().toUpperCase(),
        pan: pan.trim().toUpperCase(),
        billingAddress,
        shippingAddress: shippingAddress || billingAddress,
        city: city.trim(),
        state: stateName,
        stateCode,
        pincode: pincode.trim(),
        openingBalance: Number(openingBalance) || 0,
        balanceType,
        creditLimit: Number(creditLimit) || 0,
        notes,
      });
    } else {
      addParty({
        name: name.trim(),
        type,
        phone: phone.trim(),
        email: email.trim(),
        gstin: gstin.trim().toUpperCase(),
        pan: pan.trim().toUpperCase(),
        billingAddress,
        shippingAddress: shippingAddress || billingAddress,
        city: city.trim(),
        state: stateName,
        stateCode,
        pincode: pincode.trim(),
        openingBalance: Number(openingBalance) || 0,
        balanceType,
        creditLimit: Number(creditLimit) || 0,
        notes,
      });
    }

    setIsModalOpen(false);
  };

  // Transactions for selected party in drawer
  const partyInvoices = selectedPartyForStatement
    ? invoices.filter(i => i.partyId === selectedPartyForStatement.id || i.partyName === selectedPartyForStatement.name)
    : [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Parties & Contacts</h1>
          <p className="text-xs text-slate-500">
            Customers and Suppliers with GSTIN, billing addresses, and outstanding balance tracking
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xml,.tsv,.txt,.json"
            onChange={handleImportPartiesFile}
            className="hidden"
            id="parties-bulk-import-input"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-200 transition-all active:scale-95"
            title="Import parties/accounts from CSV or Busy 21 XML"
          >
            <Upload className="h-4 w-4 text-indigo-600" />
            <span>Import CSV / Busy 21</span>
          </button>

          <button
            type="button"
            onClick={handleExportPartiesExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
            title="Export all party details to MS-Excel (.xlsx)"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            onClick={handleExportPartiesCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-200 transition-all active:scale-95 cursor-pointer"
            title="Export all party details to CSV spreadsheet"
          >
            <Download className="h-4 w-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Add New Party</span>
          </button>
        </div>
      </div>

      {/* Import Notification Banner */}
      {importStatus && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-900 font-semibold animate-in fade-in duration-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{importStatus}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <span className="text-[11px] font-medium text-slate-500">Total Registered Parties</span>
          <p className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-0.5">
            {parties.length} Entities
          </p>
          <span className="text-[10px] text-slate-400">
            {parties.filter(p => p.type === 'customer').length} Customers · {parties.filter(p => p.type === 'supplier').length} Vendors
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <span className="text-[11px] font-medium text-slate-500">You'll Receive (Customer Receivables)</span>
          <p className="text-lg font-bold text-emerald-600 font-mono tabular-nums mt-0.5">
            {formatINR(totalReceivables)}
          </p>
          <span className="text-[10px] text-emerald-600">Total balance due from clients</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <span className="text-[11px] font-medium text-slate-500">You'll Pay (Supplier Payables)</span>
          <p className="text-lg font-bold text-rose-600 font-mono tabular-nums mt-0.5">
            {formatINR(totalPayables)}
          </p>
          <span className="text-[10px] text-rose-600">Total balance payable to vendors</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search party name, phone, GSTIN or city..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              activeTab === 'all' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Parties
          </button>
          <button
            onClick={() => setActiveTab('customer')}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              activeTab === 'customer' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Customers
          </button>
          <button
            onClick={() => setActiveTab('supplier')}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              activeTab === 'supplier' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Suppliers
          </button>
        </div>
      </div>

      {/* Parties Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px] font-semibold">
                <th className="py-3 px-3">Party Name</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">GSTIN / PAN</th>
                <th className="py-3 px-3">State & Code</th>
                <th className="py-3 px-3">Contact</th>
                <th className="py-3 px-3 text-right">Balance (₹)</th>
                <th className="py-3 px-3 text-center w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredParties.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-slate-400">
                    <Users className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-700 text-sm">No parties registered in this Business Profile yet</p>
                    <p className="text-xs text-slate-500 mt-1 mb-3">Add customers or suppliers to track GSTIN, billing addresses, and balances.</p>
                    <button
                      onClick={handleOpenAdd}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95"
                    >
                      <Plus className="h-4 w-4 stroke-[2.5]" />
                      <span>Add Your First Party</span>
                    </button>
                  </td>
                </tr>
              ) : (
                filteredParties.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3">
                      <button
                        onClick={() => setSelectedPartyForStatement(p)}
                        className="font-bold text-slate-900 hover:text-rose-600 text-left block"
                      >
                        {p.name}
                      </button>
                      {p.city && <span className="text-[10px] text-slate-400">{p.city}</span>}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          p.type === 'customer'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {p.type === 'customer' ? 'Customer' : 'Supplier'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      {p.gstin ? (
                        <div className="font-bold text-slate-800">{p.gstin}</div>
                      ) : (
                        <div className="text-slate-400">Unregistered</div>
                      )}
                      {p.pan && <div className="text-[10px] text-slate-400">PAN: {p.pan}</div>}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      <div>{p.state}</div>
                      <span className="text-[10px] text-slate-400 font-mono">Code: {p.stateCode}</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      <div>{p.phone || '-'}</div>
                      {p.email && <div className="text-[10px] text-slate-400">{p.email}</div>}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold">
                      {p.currentBalance > 0 ? (
                        <span className={p.type === 'customer' ? 'text-emerald-600' : 'text-rose-600'}>
                          {formatINR(p.currentBalance)}
                        </span>
                      ) : (
                        <span className="text-slate-400">₹0.00</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedPartyForStatement(p)}
                          className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                          title="View Ledger Statement"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"
                          title="Edit Party"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete party ${p.name}?`)) deleteParty(p.id);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded transition-colors"
                          title="Delete Party"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Party Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200 p-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h2 className="text-base font-bold text-slate-900">
                {editingParty ? 'Edit Party Details' : 'Add New Customer / Supplier'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700">Party / Firm Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Larsen & Toubro EPC Division"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1 font-semibold text-slate-900 focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Party Type *</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as 'customer' | 'supplier')}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1 bg-white font-medium"
                  >
                    <option value="customer">Customer (Buyer)</option>
                    <option value="supplier">Supplier (Vendor)</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-700">GSTIN (15 Digits)</label>
                    <button
                      type="button"
                      onClick={() => setShowBusyGstinModal(true)}
                      className="text-[10px] text-indigo-700 hover:text-indigo-900 font-bold flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200"
                    >
                      <ShieldCheck className="h-3 w-3 text-indigo-600" /> ⚡ Validate Online (BUSY 21)
                    </button>
                  </div>
                  <input
                    type="text"
                    maxLength={15}
                    placeholder="e.g. 27AABCU9603R1ZM"
                    value={gstin}
                    onChange={e => handleGstinChange(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1 font-mono uppercase font-semibold text-slate-900 focus:ring-2 focus:ring-rose-500"
                  />
                  {gstinAutofillStatus && (
                    <div className="mt-1 flex items-center justify-between text-[10px] bg-slate-50 px-2 py-1 rounded border border-slate-200">
                      <div className="flex items-center gap-1.5 truncate">
                        {gstinAutofillStatus.isVerifiedRealName ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate text-emerald-800">
                              Verified: <strong>{gstinAutofillStatus.tradeName || gstinAutofillStatus.legalName}</strong> ({gstinAutofillStatus.state})
                            </span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                            <span className="truncate text-slate-700">
                              Valid GSTIN · {gstinAutofillStatus.state} ({gstinAutofillStatus.constitutionOfBusiness})
                            </span>
                          </>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowBusyGstinModal(true)}
                        className="text-indigo-600 hover:text-indigo-800 font-bold underline shrink-0 ml-1 text-[10px]"
                      >
                        {gstinAutofillStatus.isVerifiedRealName ? 'Edit' : 'Autofill / Verify'}
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="font-semibold text-slate-700">PAN Number</label>
                  <input
                    type="text"
                    placeholder="10 Digits"
                    value={pan}
                    onChange={e => setPan(e.target.value.toUpperCase())}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1 font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">State *</label>
                  <select
                    value={stateCode}
                    onChange={e => setStateCode(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1 bg-white font-medium"
                  >
                    {INDIAN_STATES.map(s => (
                      <option key={s.code} value={s.code}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Phone / Mobile Number</label>
                  <input
                    type="text"
                    placeholder="+91..."
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Email Address</label>
                  <input
                    type="email"
                    placeholder="accounts@firm.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai, Vadodara"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Pincode</label>
                  <input
                    type="text"
                    placeholder="6 digits"
                    value={pincode}
                    onChange={e => setPincode(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1 font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700">Billing Address</label>
                  <textarea
                    rows={2}
                    value={billingAddress}
                    onChange={e => setBillingAddress(e.target.value)}
                    placeholder="Complete factory/office address..."
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700">Shipping Address (Optional)</label>
                  <textarea
                    rows={2}
                    value={shippingAddress}
                    onChange={e => setShippingAddress(e.target.value)}
                    placeholder="Leave empty if same as billing address"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Credit Limit (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={creditLimit}
                    onChange={e => setCreditLimit(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1 font-mono tabular-nums"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Opening Balance (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={openingBalance}
                    onChange={e => setOpeningBalance(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1 font-mono tabular-nums"
                  />
                </div>
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
                  {editingParty ? 'Update Party' : 'Save Party'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Party Statement Drawer Modal */}
      {selectedPartyForStatement && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-slate-200 p-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Party Statement: {selectedPartyForStatement.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  GSTIN: {selectedPartyForStatement.gstin || 'N/A'} · State: {selectedPartyForStatement.state} ({selectedPartyForStatement.stateCode})
                </p>
              </div>
              <button
                onClick={() => setSelectedPartyForStatement(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500">Current Outstanding Balance:</span>
                <p className="text-lg font-bold font-mono text-rose-600 tabular-nums">
                  {formatINR(selectedPartyForStatement.currentBalance)}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Credit Limit:</span>
                <p className="text-lg font-bold font-mono text-slate-900 tabular-nums">
                  {selectedPartyForStatement.creditLimit ? formatINR(selectedPartyForStatement.creditLimit) : 'No limit'}
                </p>
              </div>
            </div>

            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Associated Invoices & Bills
            </h4>

            <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2">Date</th>
                    <th className="p-2">Bill / Inv #</th>
                    <th className="p-2">Type</th>
                    <th className="p-2 text-right">Total Bill (₹)</th>
                    <th className="p-2 text-right">Received (₹)</th>
                    <th className="p-2 text-right">Balance Due (₹)</th>
                    <th className="p-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {partyInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400">
                        No transactions found for this party.
                      </td>
                    </tr>
                  ) : (
                    partyInvoices.map(inv => (
                      <tr key={inv.id}>
                        <td className="p-2 font-mono tabular-nums">{inv.date}</td>
                        <td className="p-2 font-mono font-bold">{inv.invoiceNumber}</td>
                        <td className="p-2 uppercase text-[10px]">{inv.type}</td>
                        <td className="p-2 text-right font-mono tabular-nums font-semibold">{formatINR(inv.grandTotal)}</td>
                        <td className="p-2 text-right font-mono tabular-nums text-emerald-600">{formatINR(inv.paidAmount)}</td>
                        <td className="p-2 text-right font-mono tabular-nums text-rose-600 font-bold">{formatINR(inv.balanceDue)}</td>
                        <td className="p-2 text-center">
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 font-medium">
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSelectedPartyForStatement(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold"
              >
                Close Statement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BUSY 21 GSTIN Verification Modal */}
      <BusyGstinModal
        isOpen={showBusyGstinModal}
        onClose={() => setShowBusyGstinModal(false)}
        initialGstin={gstin}
        companyStateCode={profile.stateCode}
        targetEntityLabel="Party Master"
        onApply={(d) => {
          setGstinAutofillStatus(d);
          setGstin(d.gstin);
          setPan(d.pan);
          setStateCode(d.stateCode);
          if (d.tradeName || d.legalName) setName(d.tradeName || d.legalName);
          if (d.address) {
            setBillingAddress(d.address);
            setShippingAddress(d.address);
          }
          if (d.city) setCity(d.city);
          if (d.pincode) setPincode(d.pincode);
          if (d.phone) setPhone(d.phone);
          if (d.email) setEmail(d.email);
        }}
      />
    </div>
  );
};
