import React, { useState, useEffect } from 'react';
import { Sparkles, ShieldCheck, Receipt, Package, Building2, Layers, CheckCircle2, ArrowRight } from 'lucide-react';

interface StartupAnimationProps {
  onComplete: () => void;
  backupStatus?: { triggered: boolean; message?: string } | null;
}

export const StartupAnimation: React.FC<StartupAnimationProps> = ({ onComplete, backupStatus }) => {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);

  // Timed sequence across exactly 5 seconds
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timerInterval);
          return 100;
        }
        return prev + 2; // ~5 seconds total (100 / 50 steps * 100ms = 5000ms)
      });
    }, 100);

    const stepTimer1 = setTimeout(() => setStep(1), 1200); // Feature 1: GST & Invoicing
    const stepTimer2 = setTimeout(() => setStep(2), 2500); // Feature 2: 5 Company Slots & Inventory
    const stepTimer3 = setTimeout(() => setStep(3), 3700); // Final reveal: SKT BILLING
    const finishTimer = setTimeout(() => {
      onComplete();
    }, 5000);

    return () => {
      clearInterval(timerInterval);
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      clearTimeout(finishTimer);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-950 via-rose-950 to-slate-950 text-white flex flex-col items-center justify-center p-4 overflow-hidden select-none font-sans">
      
      {/* Background Glow effects */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-rose-600/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse"></div>

      {/* Skip Button */}
      <button
        type="button"
        onClick={onComplete}
        className="absolute top-6 right-6 px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-full backdrop-blur-md border border-white/20 transition-all flex items-center gap-1.5"
      >
        <span>Skip Intro</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </button>

      <div className="max-w-xl w-full text-center space-y-8 z-10 animate-in fade-in zoom-in-95 duration-700">
        
        {/* Animated Icon Badge */}
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-rose-600 to-amber-500 animate-spin opacity-75 blur-md" style={{ animationDuration: '6s' }}></div>
          <div className="relative w-20 h-20 rounded-2xl bg-slate-900 border border-white/20 flex items-center justify-center shadow-2xl">
            <Sparkles className="h-10 w-10 text-amber-300 animate-bounce" />
          </div>
        </div>

        {/* Dynamic Step Information */}
        <div className="space-y-3 min-h-[110px]">
          {step === 0 && (
            <div className="space-y-2 animate-in fade-in slide-in-from-bottom-3 duration-500">
              <span className="px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-black uppercase tracking-widest rounded-full">
                Professional Accounting Suite
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Initializing Indian GST Engine...
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Loading live taxpayer verification, tax calculators & statutory compliance.
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-2 animate-in fade-in slide-in-from-bottom-3 duration-500">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-black uppercase tracking-widest rounded-full flex items-center justify-center gap-1 mx-auto w-fit">
                <ShieldCheck className="h-3.5 w-3.5" /> GST Portal Connected
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Lightning Fast Invoicing & Quotations
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Create Tax Invoices, Delivery Challans & Purchase Bills with 1-click GSTIN autofill.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2 animate-in fade-in slide-in-from-bottom-3 duration-500">
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-black uppercase tracking-widest rounded-full flex items-center justify-center gap-1 mx-auto w-fit">
                <Receipt className="h-3.5 w-3.5" /> 20+ Print Styles
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Professional Thermal & Tax Print Formats
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Fully customizable print layouts, thermal POS slips & Rule 46 tax compliance.
              </p>
            </div>
          )}

          {step >= 3 && (
            <div className="space-y-3 animate-in zoom-in-95 duration-700">
              <span className="px-3.5 py-1 bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-widest rounded-full shadow-lg">
                100% Free & Unrestricted
              </span>
              <h1 className="text-4xl sm:text-6xl font-black tracking-tight bg-gradient-to-r from-white via-amber-200 to-rose-300 bg-clip-text text-transparent drop-shadow-lg">
                SKT BILLING
              </h1>
              <p className="text-sm sm:text-base text-rose-200 font-semibold">
                Your Ultimate Indian Business Accounting Companion
              </p>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2 max-w-md mx-auto">
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 font-mono">
            <span>
              {backupStatus?.triggered
                ? 'Daily Backup Secured ✓'
                : backupStatus?.message
                ? 'Daily Data Protected ✓'
                : 'Loading Modules'}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Feature Badges Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4">
          <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-[11px] font-bold text-slate-300 flex items-center justify-center gap-1.5 backdrop-blur-xs">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>GST Ready</span>
          </div>
          <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-[11px] font-bold text-slate-300 flex items-center justify-center gap-1.5 backdrop-blur-xs">
            <Receipt className="h-3.5 w-3.5 text-rose-400" />
            <span>Custom Prints</span>
          </div>
          <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-[11px] font-bold text-slate-300 flex items-center justify-center gap-1.5 backdrop-blur-xs">
            <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
            <span>Auto Daily Backup</span>
          </div>
          <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-[11px] font-bold text-slate-300 flex items-center justify-center gap-1.5 backdrop-blur-xs">
            <Building2 className="h-3.5 w-3.5 text-indigo-400" />
            <span>5 Slots</span>
          </div>
        </div>

      </div>
    </div>
  );
};
