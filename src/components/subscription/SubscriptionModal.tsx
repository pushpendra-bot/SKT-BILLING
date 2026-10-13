import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  CheckCircle2,
  Crown,
  Clock,
  Copy,
  Receipt,
  PhoneCall,
  Mail,
  Edit3,
  Save,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SubscriptionPlan, SubscriptionReceivingBankDetails } from '../../types';
import {
  BASE_ANNUAL_PRICE,
  SUBSCRIPTION_CONTACT_NO,
  calculateTrialInfo,
  activateAnnualSubscription,
  activateCreatorFreeLicense,
  getReceivingBankDetails,
  saveReceivingBankDetails,
  validateAndRedeemCoupon,
} from '../../utils/subscriptionUtils';
import { formatINR } from '../../utils/gstUtils';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: SubscriptionPlan;
  onUpdateSubscription: (updated: SubscriptionPlan) => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose, subscription, onUpdateSubscription }) => {
  const [receivingBank, setReceivingBank] = useState<SubscriptionReceivingBankDetails>(() => getReceivingBankDetails());
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [bankEditForm, setBankEditForm] = useState<SubscriptionReceivingBankDetails>(() => getReceivingBankDetails());
  const [txnRefInput, setTxnRefInput] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [bankSaveSuccess, setBankSaveSuccess] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponMessage, setCouponMessage] = useState<{ text: string; applied: boolean } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const currentBank = getReceivingBankDetails();
      setReceivingBank(currentBank);
      setBankEditForm(currentBank);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const trialInfo = calculateTrialInfo(subscription);
  const handleCopy = (text: string, label: string) => { if (!text) return; navigator.clipboard.writeText(text); setCopiedField(label); setTimeout(() => setCopiedField(null), 2500); };
  const handleSaveBankDetails = (e: React.FormEvent) => { e.preventDefault(); saveReceivingBankDetails(bankEditForm); setReceivingBank(bankEditForm); setIsEditingBank(false); setBankSaveSuccess(true); setTimeout(() => setBankSaveSuccess(false), 3000); };
  const handleConfirmPayment = () => { const ref = txnRefInput.trim() || `UPI-TXN-${Date.now().toString().slice(-8)}`; const updated = activateAnnualSubscription(ref, receivingBank); onUpdateSubscription(updated); setSuccessNotice(`Payment received! Annual subscription activated.`); };
  const handleActivateCreator = () => { const updated = activateCreatorFreeLicense(); onUpdateSubscription(updated); setSuccessNotice('👑 Free Lifetime Creator License Unlocked!'); };
  const handleApplyCoupon = (code?: string) => {
    const inputCode = code || couponInput;
    const result = validateAndRedeemCoupon(inputCode);
    if (result.isValid) {
      const updatedPlan = activateAnnualSubscription(`COUPON-${inputCode}`, receivingBank);
      onUpdateSubscription(updatedPlan);
      setCouponMessage({ text: 'Coupon applied successfully! Subscription Activated.', applied: true });
    } else {
      setCouponMessage({ text: result.error || 'Failed to apply coupon.', applied: false });
    }
    setTimeout(() => setCouponMessage(null), 4000);
  };
  const isAlreadyActive = subscription.status === 'active' || subscription.status === 'creator_free';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 font-sans">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-300">
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-900 text-white flex items-center justify-between">
            <h2 className="text-lg font-bold">Subscription Payment</h2>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6 space-y-5">
            {successNotice && <div className="bg-emerald-600 text-white p-3 rounded text-sm">{successNotice}</div>}
            
            <div className="p-4 bg-slate-100 rounded-xl font-bold text-sm text-slate-800">
              Status: {subscription.status === 'active' ? `Active (Subscription left for ${trialInfo.daysRemaining} days)` : subscription.status === 'creator_free' ? 'Creator VIP Lifetime (Unlimited)' : trialInfo.isTrial ? `Trial (Subscription left for ${trialInfo.daysRemaining} days)` : 'Expired'}
            </div>
            <div className="space-y-3">
              <h4 className="font-bold">Apply Coupon</h4>
              <div className="flex gap-2">
                <input type="text" value={couponInput} onChange={e => setCouponInput(e.target.value.toUpperCase())} className="flex-1 px-3 py-2 border rounded" />
                <button type="button" onClick={() => handleApplyCoupon()} className="px-4 py-2 bg-rose-600 text-white rounded">Apply</button>
              </div>
              {couponMessage && <p className={couponMessage.applied ? 'text-emerald-700' : 'text-rose-600'}>{couponMessage.text}</p>}
            </div>
            
            <button type="button" onClick={() => setIsEditingBank(!isEditingBank)} className="text-xs font-bold text-indigo-700">Edit Bank Details</button>
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

            <div className="bg-slate-50 p-4 rounded-xl border space-y-2 text-sm">
                <p><strong>Account Holder:</strong> {receivingBank.accountHolderName}</p>
                <p><strong>Bank:</strong> {receivingBank.bankName}</p>
                <p><strong>Account Number:</strong> {receivingBank.accountNumber}</p>
                <p><strong>IFSC Code:</strong> {receivingBank.ifscCode}</p>
                <p><strong>UPI ID:</strong> {receivingBank.upiId}</p>
            </div>
            <input type="text" value={txnRefInput} onChange={e => setTxnRefInput(e.target.value.toUpperCase())} placeholder="UTR/UPI Reference Number" className="w-full px-3 py-2 border rounded" />
            <button type="button" onClick={handleConfirmPayment} className="w-full bg-rose-600 text-white font-bold py-3 rounded">Confirm Payment</button>
        </div>
      </div>
    </div>
  );
};
