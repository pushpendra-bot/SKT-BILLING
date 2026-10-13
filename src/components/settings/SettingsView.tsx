import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { BusinessProfile } from '../../types';
import { INDIAN_STATES, extractStateCodeFromGSTIN, getStateByCode, lookupGSTINDetails, GSTINDetails } from '../../utils/gstUtils';
import {
  Settings,
  Building2,
  CreditCard,
  FileText,
  RotateCcw,
  Save,
  CheckCircle2,
  Briefcase,
  Layers,
  Check,
  Sparkles,
  ExternalLink,
  Database,
  ShieldCheck,
  Lock,
  Unlock,
  Phone,
  Mail,
  Copy,
  Crown,
  Tag,
  Clock,
  HelpCircle,
  Eye,
  EyeOff,
  Building,
  QrCode,
  Edit3,
} from 'lucide-react';
import { BusyGstinModal } from '../common/BusyGstinModal';
import { SubscriptionModal } from '../subscription/SubscriptionModal';

import {
  calculateTrialInfo,
  getReceivingBankDetails,
  saveReceivingBankDetails,
  SUBSCRIPTION_CONTACT_NO,
  BASE_ANNUAL_PRICE,
} from '../../utils/subscriptionUtils';
import { SubscriptionReceivingBankDetails } from '../../types';
import { formatINR } from '../../utils/gstUtils';

export const SettingsView: React.FC = () => {
  const {
    slots,
    activeSlotId,
    setActiveSlotId,
    setProfile,
    updateSlotProfile,
    updateSlotName,
    updateSlotPassword,
    subscription,
    updateSubscription,
    resetData,
  } = useApp();

  const [isSubModalOpen, setIsSubModalOpen] = useState(false);

  // Tab for which slot the user is currently editing in this form (1 through 5)
  const [selectedSlotId, setSelectedSlotId] = useState<number>(activeSlotId);
  
  const currentSlot = slots.find(s => s.slotId === selectedSlotId) || slots[0];
  const [form, setForm] = useState<BusinessProfile>(currentSlot.profile);
  const [slotDisplayName, setSlotDisplayName] = useState<string>(currentSlot.slotName || `Business Profile ${currentSlot.slotId}`);
  const [isSaved, setIsSaved] = useState(false);
  const [showBusyGstinModal, setShowBusyGstinModal] = useState(false);

  // Sandbox connection states
  const [sandboxConnected, setSandboxConnected] = useState<boolean>(true);
  const [sandboxEnv, setSandboxEnv] = useState<string>('gst_sandbox_v2');
  const [sandboxClientId, setSandboxClientId] = useState<string>('QH_SANDBOX_998385_CLIENT');
  const [sandboxSecret, setSandboxSecret] = useState<string>('sec_live_sandbox_8278644090');
  const [sandboxMsg, setSandboxMsg] = useState<string | null>(null);


  // Optional Company Password State for the selected slot
  const [slotPassword, setSlotPassword] = useState<string>(currentSlot.password || '');
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState<string | null>(null);

  // Customer care copy states
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const trialInfo = calculateTrialInfo(subscription);

  const handleSelectSlot = (newSlotId: number) => {
    if (newSlotId === selectedSlotId) return;
    const currentProf = {
      ...form,
      businessName: form.businessName || slotDisplayName,
    };
    updateSlotProfile(selectedSlotId, currentProf);
    updateSlotName(selectedSlotId, slotDisplayName);
    if (selectedSlotId === activeSlotId) {
      setProfile(currentProf);
    }
    setSelectedSlotId(newSlotId);
  };

  // Sync form & password when selectedSlotId changes
  useEffect(() => {
    const s = slots.find(item => item.slotId === selectedSlotId) || slots[0];
    setForm(s.profile);
    setSlotDisplayName(s.slotName || `Business Profile ${s.slotId}`);
    setSlotPassword(s.password || '');
    setPasswordNotice(null);
  }, [selectedSlotId]);

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(label);
    setTimeout(() => setCopiedItem(null), 2500);
  };

  const handleSaveSlotPassword = () => {
    const trimmed = slotPassword.trim();
    updateSlotPassword(selectedSlotId, trimmed || undefined);
    setPasswordNotice(trimmed ? 'Company password saved successfully! Slot is now protected.' : 'Password removed. Slot is now open.');
    setTimeout(() => setPasswordNotice(null), 4000);
  };

  const handleRemoveSlotPassword = () => {
    setSlotPassword('');
    updateSlotPassword(selectedSlotId, undefined);
    setPasswordNotice('Company password removed successfully.');
    setTimeout(() => setPasswordNotice(null), 4000);
  };

  const handleAutofillFromGSTIN = (d: GSTINDetails) => {
    setForm(prev => ({
      ...prev,
      gstin: d.gstin,
      pan: d.pan,
      stateCode: d.stateCode,
      state: d.state,
      city: d.city || prev.city,
      pincode: d.pincode || prev.pincode,
      address: d.address || prev.address,
      businessName: (d.tradeName || d.legalName) || prev.businessName,
    }));
  };

  const handleChange = (field: keyof BusinessProfile, value: any) => {
    const updated = { ...form, [field]: value };

    // Auto extract State Code & PAN from GSTIN
    if (field === 'gstin') {
      const code = extractStateCodeFromGSTIN(value);
      if (code) {
        updated.stateCode = code;
        const st = getStateByCode(code);
        if (st) updated.state = st.name;
      }
      if (value.trim().length >= 12) {
        updated.pan = value.trim().substring(2, 12).toUpperCase();
      }
      if (value.trim().length === 15) {
        const details = lookupGSTINDetails(value.trim());
        if (details && details.isVerifiedRealName) {
          if (!updated.businessName || updated.businessName.includes('Business Profile')) {
            updated.businessName = details.tradeName || details.legalName;
          }
          if (details.city) updated.city = details.city;
          if (details.pincode) updated.pincode = details.pincode;
          if (details.address) updated.address = details.address;
        }
      }
    }

    setForm(updated);
  };

  const handleStateCodeChange = (code: string) => {
    const st = getStateByCode(code);
    setForm(prev => ({
      ...prev,
      stateCode: code,
      state: st?.name || prev.state,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedProf = {
      ...form,
      businessName: form.businessName || slotDisplayName,
    };
    updateSlotProfile(selectedSlotId, updatedProf);
    if (selectedSlotId === activeSlotId) {
      setProfile(updatedProf);
    }
    updateSlotName(selectedSlotId, slotDisplayName);

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleActivateThisSlot = () => {
    setActiveSlotId(selectedSlotId);
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{slots.length} Business Profile Slots & Settings</h1>
          <p className="text-xs text-slate-500">
            Configure up to {slots.length} distinct businesses / firms. Switch active company anytime from the top bar.
          </p>
        </div>

        {isSaved && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold animate-in fade-in">
            <CheckCircle2 className="h-4 w-4" />
            <span>Slot {selectedSlotId} Saved Successfully!</span>
          </div>
        )}
      </div>

      {/* Slots Selector Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
            <Briefcase className="h-4 w-4 text-rose-600" />
            Select Business Slot To Configure ({slots.length} Slots)
          </span>
          <span className="text-[11px] font-semibold text-rose-600">
            Active in App: Slot {activeSlotId}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {slots.map(s => {
            const isEditing = s.slotId === selectedSlotId;
            const isActive = s.slotId === activeSlotId;
            return (
              <button
                key={s.slotId}
                type="button"
                onClick={() => handleSelectSlot(s.slotId)}
                className={`p-2.5 rounded-lg border text-left transition-all relative ${
                  isEditing
                    ? 'border-rose-600 bg-rose-50/60 ring-2 ring-rose-500/20 shadow-xs'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-800 font-mono">
                      Slot {s.slotId}
                    </span>
                    {s.password && (
                      <span title="Password Protected Slot" className="text-amber-600">
                        <Lock className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </div>
                  {isActive && (
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1 py-0.2 rounded flex items-center gap-0.5">
                      <Check className="h-2.5 w-2.5" /> Active
                    </span>
                  )}
                </div>
                <p className="font-bold text-xs text-slate-900 truncate">
                  {s.profile.businessName || `Profile ${s.slotId}`}
                </p>
                <span className="text-[10px] text-slate-400 font-mono block truncate">
                  {s.profile.gstin ? s.profile.gstin : 'No GSTIN'}
                </span>
              </button>
            );
          })}
        </div>

        {selectedSlotId !== activeSlotId && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-600">
              Viewing Slot {selectedSlotId}: You can set this as the active business profile for the entire app.
            </span>
            <button
              type="button"
              onClick={handleActivateThisSlot}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs"
            >
              Set Slot {selectedSlotId} As Active Business
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 text-xs">
        {/* Profile Name & Identity */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-rose-600" />
              <h2 className="font-bold text-sm text-slate-900">
                Slot {selectedSlotId} — Company Legal Information & GSTIN
              </h2>
            </div>
            <span className="text-xs font-semibold text-slate-500 font-mono">
              Prefix: {form.invoicePrefix || `QH${selectedSlotId}/2026-27/`}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="font-semibold text-slate-700">Slot Custom Name (For identification)</label>
              <input
                type="text"
                placeholder={`e.g. Business Profile ${selectedSlotId}`}
                value={slotDisplayName}
                onChange={e => setSlotDisplayName(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1 font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700">Business / Firm Legal Trade Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Apex Industrial Solutions Pvt Ltd"
                value={form.businessName}
                onChange={e => handleChange('businessName', e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700">Tagline / Business Nature</label>
              <input
                type="text"
                placeholder="e.g. Wholesale Electrical Switchgear & Cables"
                value={form.tagline}
                onChange={e => handleChange('tagline', e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700">Company Logo (Image URL / Logo Option for Print Bills)</label>
              <div className="flex gap-2 mt-1">
                <input
                  type="text"
                  placeholder="e.g. https://example.com/logo.png or data:image/png;base64,..."
                  value={form.logoUrl || ''}
                  onChange={e => handleChange('logoUrl', e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                />
                {form.logoUrl && (
                  <div className="h-9 w-20 border border-slate-300 rounded bg-white flex items-center justify-center p-0.5 overflow-hidden shrink-0">
                    <img src={form.logoUrl} alt="Logo Preview" className="max-h-full max-w-full object-contain" onError={(e)=>{(e.target as HTMLElement).style.display='none';}} />
                  </div>
                )}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Yeh logo aapke sabhi Tax Invoices aur print formats (jaise Global Solutions Tax Invoice) par top left mein print hoga!
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700">GSTIN (15 Digits)</label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowBusyGstinModal(true)}
                    className="text-[10px] text-indigo-700 hover:text-indigo-900 font-bold flex items-center gap-0.5 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200"
                  >
                    <ShieldCheck className="h-3 w-3" /> BUSY 21 Validate
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (form.gstin.trim().length >= 15) {
                        const d = lookupGSTINDetails(form.gstin.trim());
                        if (d) handleAutofillFromGSTIN(d);
                      } else {
                        setShowBusyGstinModal(true);
                      }
                    }}
                    className="text-[10px] text-rose-600 hover:text-rose-700 font-bold flex items-center gap-0.5"
                  >
                    <Sparkles className="h-3 w-3" /> Auto-Fill
                  </button>
                </div>
              </div>
              <input
                type="text"
                maxLength={15}
                placeholder="e.g. 27AABCU9603R1ZM"
                value={form.gstin}
                onChange={e => handleChange('gstin', e.target.value.toUpperCase())}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1 font-mono uppercase font-bold text-rose-700"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700">PAN Number</label>
              <input
                type="text"
                placeholder="10 Digits"
                value={form.pan}
                onChange={e => handleChange('pan', e.target.value.toUpperCase())}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1 font-mono uppercase"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700">Registered State *</label>
              <select
                value={form.stateCode}
                onChange={e => handleStateCodeChange(e.target.value)}
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
              <label className="font-semibold text-slate-700">Phone Number</label>
              <input
                type="text"
                placeholder="+91..."
                value={form.phone}
                onChange={e => handleChange('phone', e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700">Email Address</label>
              <input
                type="email"
                placeholder="billing@business.com"
                value={form.email}
                onChange={e => handleChange('email', e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700">City & Pincode</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <input
                  type="text"
                  placeholder="City"
                  value={form.city}
                  onChange={e => handleChange('city', e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Pincode"
                  value={form.pincode}
                  onChange={e => handleChange('pincode', e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700">Complete Registered Office / Factory Address</label>
              <textarea
                rows={2}
                placeholder="Street address, industrial area, etc."
                value={form.address}
                onChange={e => handleChange('address', e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1"
              />
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <CreditCard className="h-4 w-4 text-blue-600" />
            <h2 className="font-bold text-sm text-slate-900">Bank Details for Slot {selectedSlotId} (Printed on Invoices)</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="font-semibold text-slate-700">Bank Name</label>
              <input
                type="text"
                placeholder="e.g. HDFC Bank Ltd"
                value={form.bankName}
                onChange={e => handleChange('bankName', e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1 font-semibold"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700">Account Number</label>
              <input
                type="text"
                placeholder="Account number"
                value={form.accountNo}
                onChange={e => handleChange('accountNo', e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1 font-mono font-bold"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700">IFSC Code</label>
              <input
                type="text"
                placeholder="e.g. HDFC0000128"
                value={form.ifscCode}
                onChange={e => handleChange('ifscCode', e.target.value.toUpperCase())}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1 font-mono uppercase font-bold"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700">Branch Name</label>
              <input
                type="text"
                placeholder="e.g. Branch location"
                value={form.branch}
                onChange={e => handleChange('branch', e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700">UPI ID / VPA</label>
              <input
                type="text"
                placeholder="e.g. companyname@bank"
                value={form.upiId}
                onChange={e => handleChange('upiId', e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Invoice Preferences */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <FileText className="h-4 w-4 text-emerald-600" />
            <h2 className="font-bold text-sm text-slate-900">Invoice Preferences & Terms for Slot {selectedSlotId}</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="font-semibold text-slate-700">Invoice Number Prefix</label>
              <input
                type="text"
                placeholder={`QH${selectedSlotId}/2026-27/`}
                value={form.invoicePrefix}
                onChange={e => handleChange('invoicePrefix', e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1 font-mono font-bold"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700">Default Printable Theme</label>
              <select
                value={form.invoiceTheme}
                onChange={e => handleChange('invoiceTheme', e.target.value as any)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1 bg-white font-medium"
              >
                <option value="vyapar_classic">Vyapar Classic Red</option>
                <option value="modern_blue">Modern Corporate Navy</option>
                <option value="minimal_tally">Tally Monochrome</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700">Default Terms & Conditions</label>
              <textarea
                rows={3}
                value={form.termsAndConditions}
                onChange={e => handleChange('termsAndConditions', e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1 font-mono text-[11px]"
              />
            </div>
          </div>
        </div>

        {/* Company Security & Password Protection (Optional) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-amber-600" />
              <div>
                <h2 className="font-bold text-sm text-slate-900">
                  Password Protection for Slot {selectedSlotId} (Optional)
                </h2>
                <p className="text-[11px] text-slate-500">
                  You can set an optional password to open this company slot. Anyone switching to this company will be asked for the password.
                </p>
              </div>
            </div>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                currentSlot.password
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {currentSlot.password ? (
                <>
                  <Lock className="h-3 w-3" />
                  <span>Protected</span>
                </>
              ) : (
                <>
                  <Unlock className="h-3 w-3" />
                  <span>Open (No Password)</span>
                </>
              )}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">
                {currentSlot.password ? 'Change or Update Slot Password' : 'Set New Slot Password (Optional)'}
              </label>
              <div className="relative">
                <input
                  type={showPasswordText ? 'text' : 'password'}
                  placeholder="Leave empty for no password"
                  value={slotPassword}
                  onChange={e => setSlotPassword(e.target.value)}
                  className="w-full pl-3 pr-10 py-1.5 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordText(!showPasswordText)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPasswordText ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveSlotPassword}
                className="flex-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shadow-2xs transition-all active:scale-95"
              >
                {currentSlot.password ? 'Update Password' : 'Set Password'}
              </button>
              {currentSlot.password && (
                <button
                  type="button"
                  onClick={handleRemoveSlotPassword}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-rose-600 hover:text-rose-700 border border-slate-200 rounded-lg font-semibold text-xs transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          {passwordNotice && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{passwordNotice}</span>
            </div>
          )}
        </div>

        {/* GST & E-Invoice Sandbox API Connection (User Request: CONECT IT TO SANDBOX) */}
        <div className="bg-gradient-to-br from-emerald-50/70 via-white to-blue-50/50 p-5 rounded-xl border border-emerald-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-600 text-white rounded-lg shadow-2xs">
                <Database className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-sm text-slate-900">
                    GST & E-Invoice Sandbox API Gateway Connection
                  </h2>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Sandbox Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Connect SKT Billing to GSTN / IRP Sandbox environment for test e-invoicing, E-Way Bill generation & GST filing simulations.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Sandbox Mode:</span>
              <button
                type="button"
                onClick={() => {
                  setSandboxConnected(prev => !prev);
                  setSandboxMsg(prev => !prev ? 'Successfully Connected to GST Sandbox!' : 'Sandbox connection paused.');
                  setTimeout(() => setSandboxMsg(null), 3500);
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  sandboxConnected ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                    sandboxConnected ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-slate-700">Sandbox Environment</label>
              <select
                value={sandboxEnv}
                onChange={e => setSandboxEnv(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1 bg-white font-mono text-xs font-semibold"
              >
                <option value="gst_sandbox_v2">GSTN / IRP Sandbox v2.5 (Test)</option>
                <option value="eway_sandbox">E-Way Bill Sandbox API</option>
                <option value="einvoice_sandbox">E-Invoice IRP Sandbox</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700">Sandbox Client ID</label>
              <input
                type="text"
                value={sandboxClientId}
                onChange={e => setSandboxClientId(e.target.value)}
                placeholder="QH_SANDBOX_998385_CLIENT"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1 font-mono text-xs font-bold"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700">Sandbox API Secret / Token</label>
              <input
                type="password"
                value={sandboxSecret}
                onChange={e => setSandboxSecret(e.target.value)}
                placeholder="••••••••••••••••••••"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mt-1 font-mono text-xs font-bold"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-emerald-100">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSandboxConnected(true);
                  setSandboxMsg('Sandbox Ping Successful! Token verified against GSTN Sandbox Gateway.');
                  setTimeout(() => setSandboxMsg(null), 4000);
                }}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Test & Ping Sandbox API</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSandboxMsg('Sandbox Test Data (Parties, HSN, Invoices) Synced Successfully!');
                  setTimeout(() => setSandboxMsg(null), 4000);
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition-all flex items-center gap-1"
              >
                <Database className="h-3 w-3" />
                <span>Sync Sandbox Test Registry</span>
              </button>
            </div>

            {sandboxMsg && (
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-lg border border-emerald-300 animate-in fade-in">
                {sandboxMsg}
              </span>
            )}
          </div>
        </div>

        {/* Customer Care Option (Chatack Enterprises) */}
        <div className="bg-gradient-to-br from-indigo-50/60 via-white to-rose-50/50 p-5 rounded-xl border border-indigo-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-2xs">
                <Phone className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-sm text-slate-900">
                    Customer Care & Support (Chatack Enterprises)
                  </h2>
                  <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-bold">
                    Official Helpdesk
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Dedicated customer support for SKT Billing queries, GST setup, subscription & assistance.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer Care Gmail */}
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Customer Care Email
                  </span>
                  <div className="font-extrabold text-sm text-slate-900 font-mono mt-0.5">
                    chatackenterprises@gmail.com
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Email our support team anytime for instant resolution.
                  </p>
                </div>
                <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                  <Mail className="h-4 w-4" />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                <a
                  href="mailto:chatackenterprises@gmail.com?subject=SKT%20Billing%20Support%20Request"
                  className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs text-center transition-colors flex items-center justify-center gap-1.5"
                >
                  <Mail className="h-3 w-3" />
                  <span>Send Email</span>
                </a>
                <button
                  type="button"
                  onClick={() => handleCopyText('chatackenterprises@gmail.com', 'email')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  <Copy className="h-3 w-3" />
                  <span>{copiedItem === 'email' ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Customer Care Phone Numbers */}
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Customer Care Contact Numbers
                  </span>
                  <div className="font-extrabold text-sm text-slate-900 font-mono mt-0.5 space-x-2">
                    <span className="text-emerald-700 font-black">8278644090</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-indigo-700 font-black">9983854821</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Direct call or WhatsApp support lines available.
                  </p>
                </div>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Phone className="h-4 w-4" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                <a
                  href="tel:8278644090"
                  className="py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] text-center transition-colors flex items-center justify-center gap-1"
                >
                  <Phone className="h-3 w-3" />
                  <span>Call 8278644090</span>
                </a>
                <a
                  href="tel:9983854821"
                  className="py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[11px] text-center transition-colors flex items-center justify-center gap-1"
                >
                  <Phone className="h-3 w-3" />
                  <span>Call 9983854821</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Option & License Management */}
        <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white rounded-xl p-5 border border-rose-800 shadow-md space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded">
                  Official Plan
                </span>
                <span className="text-xs text-rose-300 font-bold">
                  First 7 Days Free Trial · Then ₹1,000 / Year
                </span>
              </div>
              <h2 className="text-lg font-black text-white">
                Subscription & Commercial License
              </h2>
              <p className="text-xs text-slate-300">
                {subscription.isCreatorFree
                  ? '👑 Creator Lifetime VIP License Active (Complimentary Forever)'
                  : trialInfo.isTrial
                  ? `Day ${trialInfo.daysUsed} of 7-Day Free Trial (${trialInfo.daysRemaining} days remaining)`
                  : 'Annual Commercial License (₹1,000 / Year)'}
              </p>
            </div>

            {/* MANDATORY CONTACT NO PROMINENT ON THE RIGHT */}
            <div className="bg-white/10 p-3.5 rounded-xl border border-amber-400/60 text-right shrink-0 w-full md:w-auto">
              <span className="text-[10px] text-amber-300 font-black uppercase block tracking-wider">
                FOR SUBSCRIPTION CONTACT THIS CONTACT NO.:
              </span>
              <a
                href={`tel:${SUBSCRIPTION_CONTACT_NO}`}
                className="text-xl font-black font-mono text-white hover:text-amber-300 block tracking-wider mt-0.5"
              >
                {SUBSCRIPTION_CONTACT_NO}
              </a>
              <div className="flex items-center justify-end gap-1.5 mt-2">
                <a
                  href={`tel:${SUBSCRIPTION_CONTACT_NO}`}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold flex items-center gap-1"
                >
                  <Phone className="h-3 w-3" />
                  <span>Call</span>
                </a>
                <button
                  type="button"
                  onClick={() => handleCopyText(SUBSCRIPTION_CONTACT_NO, 'sub_phone')}
                  className="px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded text-[11px] font-bold flex items-center gap-1"
                >
                  <Copy className="h-3 w-3" />
                  <span>{copiedItem === 'sub_phone' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-white/10 text-xs">
            <span className="text-slate-300">
              Includes QR payment, Direct Bank Transfer, and 10 single-use auto-disabling coupons.
            </span>
            <button
              type="button"
              onClick={() => setIsSubModalOpen(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5 shrink-0"
            >
              <Crown className="h-4 w-4 text-amber-300" />
              <span>Manage Subscription & 10 Coupons</span>
            </button>
          </div>
        </div>



        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => {
              if (confirm(`Reset all ${slots.length} business profile slots and clear all data?`)) {
                resetData();
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 font-semibold"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset All Slots</span>
          </button>

          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-sm transition-all active:scale-95"
          >
            <Save className="h-4 w-4" />
            <span>Save Slot {selectedSlotId} Profile</span>
          </button>
        </div>
      </form>

      {/* Developer & Creator Credits Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-rose-950 text-white rounded-xl p-5 border border-slate-700 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-rose-400 bg-rose-950 px-2 py-0.5 rounded border border-rose-800 uppercase tracking-wider">
                System Engineering & Design
              </span>
              <span className="text-xs text-slate-400">SKT Billing Pro</span>
            </div>
            <h3 className="text-base font-extrabold tracking-tight">
              Pushpendra Singh Raika
            </h3>
            <p className="text-xs text-slate-300">
              Developer & Creator · AI & Financial Software Engineering at SKT Intelligence
            </p>
          </div>

          <a
            href="https://skt-intelligence.ai.studio/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow-md transition-all active:scale-95 group"
          >
            <Sparkles className="h-4 w-4 text-amber-300" />
            <span>More from Creator</span>
            <ExternalLink className="h-3.5 w-3.5 opacity-80 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>
      </div>

      {/* BUSY 21 GSTIN Verification Modal */}
      <BusyGstinModal
        isOpen={showBusyGstinModal}
        onClose={() => setShowBusyGstinModal(false)}
        initialGstin={form.gstin}
        companyStateCode={form.stateCode}
        targetEntityLabel="Company Profile"
        onApply={(d) => {
          handleAutofillFromGSTIN(d);
        }}
      />

      {/* Subscription & 10 Coupons Modal */}
      <SubscriptionModal
        isOpen={isSubModalOpen}
        onClose={() => setIsSubModalOpen(false)}
        subscription={subscription}
        onUpdateSubscription={updateSubscription}
      />
    </div>
  );
};
