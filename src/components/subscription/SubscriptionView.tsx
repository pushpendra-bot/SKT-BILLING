import React, { useState } from 'react';
import {
  Crown,
  Clock,
  Phone,
  PhoneCall,
  MessageCircle,
  Copy,
  Check,
  CheckCircle2,
  Building,
  Edit3,
  Save,
  Sparkles,
  Receipt,
  Mail,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SubscriptionReceivingBankDetails } from '../../types';
import {
  BASE_ANNUAL_PRICE,
  SUBSCRIPTION_CONTACT_NO,
  calculateTrialInfo,
  activateAnnualSubscription,
  activateCreatorFreeLicense,
  start7DayTrial,
  getReceivingBankDetails,
  saveReceivingBankDetails,
  validateAndRedeemCoupon,
} from '../../utils/subscriptionUtils';
import { formatINR } from '../../utils/gstUtils';

export const SubscriptionView: React.FC = () => {
  const { subscription, updateSubscription } = useApp();
  const [receivingBank, setReceivingBank] = useState<SubscriptionReceivingBankDetails>(() => getReceivingBankDetails());
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [bankEditForm, setBankEditForm] = useState<SubscriptionReceivingBankDetails>(() => getReceivingBankDetails());
  const [txnRefInput, setTxnRefInput] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [bankSaveSuccess, setBankSaveSuccess] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const trialInfo = calculateTrialInfo(subscription);

  const quickUpiPresets = [
    { label: `PhonePe (${SUBSCRIPTION_CONTACT_NO}@ybl)`, handle: `${SUBSCRIPTION_CONTACT_NO}@ybl` },
    { label: `Google Pay (${SUBSCRIPTION_CONTACT_NO}@oksbi)`, handle: `${SUBSCRIPTION_CONTACT_NO}@oksbi` },
    { label: `Paytm (${SUBSCRIPTION_CONTACT_NO}@paytm)`, handle: `${SUBSCRIPTION_CONTACT_NO}@paytm` },
    { label: `BHIM (${SUBSCRIPTION_CONTACT_NO}@upi)`, handle: `${SUBSCRIPTION_CONTACT_NO}@upi` },
    { label: 'Secondary (8278644090@ybl)', handle: '8278644090@ybl' },
  ];

  const handleCopy = (text: string, label: string) => { if (!text) return; navigator.clipboard.writeText(text); setCopiedField(label); setTimeout(() => setCopiedField(null), 2500); };
  const handleConfirmPayment = () => { const ref = txnRefInput.trim() || `UPI-TXN-${Date.now().toString().slice(-8)}`; const updated = activateAnnualSubscription(ref, receivingBank); updateSubscription(updated); setSuccessNotice(`Payment recorded! Commercial Annual Subscription activated. Reference: ${ref}`); };
  const handleActivateCreator = () => { const updated = activateCreatorFreeLicense(); updateSubscription(updated); setSuccessNotice('👑 Creator Lifetime VIP License Unlocked!'); };
  const handleSaveBankDetails = (e: React.FormEvent) => { e.preventDefault(); saveReceivingBankDetails(bankEditForm); setReceivingBank(bankEditForm); setIsEditingBank(false); setBankSaveSuccess(true); setTimeout(() => setBankSaveSuccess(false), 3000); };
  
  const handleApplyCoupon = (code?: string) => { 
    const couponCodeToApply = code || couponInput; 
    const result = validateAndRedeemCoupon(couponCodeToApply); 
    if (result.isValid) { 
      const updatedPlan = activateAnnualSubscription(`COUPON-${couponCodeToApply}`, receivingBank);
      updateSubscription(updatedPlan);
      setSuccessNotice(`Coupon "${couponCodeToApply}" applied successfully! Subscription Activated.`); 
    } else { 
      setSuccessNotice(result.error || 'Failed to apply coupon.'); 
    } 
    setTimeout(() => setSuccessNotice(null), 4000); 
  };
  
  const isCommercialActive = subscription.status === 'active' || subscription.status === 'creator_free';

  return (
    <div className="space-y-6 pb-12 font-sans">
      {successNotice && <div className="bg-emerald-600 text-white px-5 py-3 rounded-xl text-sm font-bold flex items-center justify-between">{successNotice} <button onClick={() => setSuccessNotice(null)} className="underline text-xs">Dismiss</button></div>}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xl border border-rose-900/60">
        <h1 className="text-2xl font-black">SKT Billing Pro</h1>
        <p className="text-sm text-slate-300">7 Days Free Trial, then ₹1,000/year.</p>
        <a href="tel:${SUBSCRIPTION_CONTACT_NO}" className="block mt-4 text-2xl font-mono text-amber-300">{SUBSCRIPTION_CONTACT_NO}</a>
      </div>
      <div className="bg-white rounded-2xl border p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${isCommercialActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}><Crown className="h-6 w-6" /></div>
          <div>
            <h2 className="text-base font-black">
              Status: {subscription.status === 'active' ? `Active (Subscription left for ${trialInfo.daysRemaining} days)` : subscription.status === 'creator_free' ? 'Creator VIP Lifetime (Unlimited)' : trialInfo.isTrial ? `Trial (Subscription left for ${trialInfo.daysRemaining} days)` : 'Expired'}
            </h2>
          </div>
        </div>
      </div>
      <div className="bg-gradient-to-br from-amber-50 to-white p-5 rounded-2xl border border-amber-200 shadow-xs space-y-4">
        <h3 className="text-sm font-black text-slate-900">Apply Coupon</h3>
        <div className="flex gap-2">
          <input type="text" value={couponInput} onChange={e => setCouponInput(e.target.value.toUpperCase())} placeholder="Enter coupon code" className="flex-1 px-3 py-2 text-xs border rounded-lg bg-white uppercase" />
          <button type="button" onClick={() => handleApplyCoupon()} className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-sm">Apply</button>
        </div>
      </div>
      <button type="button" onClick={() => setIsEditingBank(!isEditingBank)} className="text-xs font-bold text-indigo-700">Edit Bank</button>
      {isEditingBank && (
          <form onSubmit={handleSaveBankDetails} className="bg-indigo-50 p-4 rounded-xl space-y-3">
             <input type="text" value={bankEditForm.accountHolderName} onChange={e => setBankEditForm({...bankEditForm, accountHolderName: e.target.value})} className="w-full px-3 py-2 border rounded" placeholder="Account Holder Name" />
             <input type="text" value={bankEditForm.bankName} onChange={e => setBankEditForm({...bankEditForm, bankName: e.target.value})} className="w-full px-3 py-2 border rounded" placeholder="Bank Name" />
             <input type="text" value={bankEditForm.accountNumber} onChange={e => setBankEditForm({...bankEditForm, accountNumber: e.target.value})} className="w-full px-3 py-2 border rounded" placeholder="Account Number" />
             <input type="text" value={bankEditForm.ifscCode} onChange={e => setBankEditForm({...bankEditForm, ifscCode: e.target.value})} className="w-full px-3 py-2 border rounded" placeholder="IFSC Code" />
             <input type="text" value={bankEditForm.upiId} onChange={e => setBankEditForm({...bankEditForm, upiId: e.target.value})} className="w-full px-3 py-2 border rounded" placeholder="UPI ID" />
             <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded">Save Bank Details</button>
          </form>
      )}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
        <div className="space-y-2.5 text-xs">
            <p><strong>Account Holder:</strong> {receivingBank.accountHolderName}</p>
            <p><strong>Bank:</strong> {receivingBank.bankName}</p>
            <p><strong>Account Number:</strong> {receivingBank.accountNumber}</p>
            <p><strong>IFSC Code:</strong> {receivingBank.ifscCode}</p>
            <p><strong>UPI ID:</strong> {receivingBank.upiId}</p>
        </div>
        <div className="pt-3 border-t space-y-2">
            <input type="text" value={txnRefInput} onChange={e => setTxnRefInput(e.target.value.toUpperCase())} placeholder="UTR/UPI Reference Number" className="w-full px-3 py-2 border rounded" />
            <button type="button" onClick={handleConfirmPayment} className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded">Confirm Payment</button>
        </div>
      </div>
    </div>
  );
};
