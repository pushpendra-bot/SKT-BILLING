import React, { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, X, ShieldCheck } from 'lucide-react';
import { BusinessSlotData } from '../../types';

interface CompanyUnlockModalProps {
  isOpen: boolean;
  targetSlot: BusinessSlotData | null;
  onClose: () => void;
  onSuccess: (slotId: number) => void;
}

export const CompanyUnlockModal: React.FC<CompanyUnlockModalProps> = ({
  isOpen,
  targetSlot,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !targetSlot) return null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSlot.password) {
      onSuccess(targetSlot.slotId);
      onClose();
      return;
    }

    if (password === targetSlot.password) {
      setError('');
      setPassword('');
      onSuccess(targetSlot.slotId);
      onClose();
    } else {
      setError('Incorrect company password. Please enter the valid password to open this company.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-300 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 to-rose-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-600/30 rounded-xl border border-rose-500/30">
              <Lock className="h-5 w-5 text-rose-400" />
            </div>
            <div>
              <h3 className="text-base font-bold">Company Password Required</h3>
              <p className="text-xs text-slate-300">Slot {targetSlot.slotId}: {targetSlot.slotName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleUnlock} className="p-5 space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              This company slot has optional security protection enabled. Please enter the password to switch to and access this company&apos;s vouchers and accounts.
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Enter Company Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoFocus
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Enter password to unlock"
                className="w-full pl-3 pr-10 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold text-rose-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Unlock & Open Company</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
