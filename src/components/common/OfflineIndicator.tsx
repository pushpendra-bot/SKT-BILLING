import React from 'react';
import { WifiOff } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const OfflineIndicator: React.FC = () => {
  const { isOnline } = usePWAInstall();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-slate-900 border border-amber-500/50 text-white px-3.5 py-2 text-xs font-semibold shadow-2xl animate-in slide-in-from-bottom-2">
      <WifiOff className="h-4 w-4 text-amber-400 animate-pulse" />
      <div>
        <p className="text-amber-300 font-bold leading-tight">Desktop Offline Mode</p>
        <p className="text-[10px] text-slate-300 font-normal">All GST data & invoices saved securely on your device.</p>
      </div>
    </div>
  );
};
