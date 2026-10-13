import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MessageSquare, Send, CheckCircle2, ShieldCheck, RefreshCw, Trash2, Smartphone, AlertCircle, Search } from 'lucide-react';

export const SmsNotificationsView: React.FC = () => {
  const { profile, parties, smsLogs, sendSmsNotification } = useApp() as any;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const logs = smsLogs || [];
  const filteredLogs = logs.filter((log: any) =>
    log.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.recipientPhone.includes(searchTerm) ||
    log.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendManualSms = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartyId || !customMessage.trim()) {
      alert('Please select a party and enter a message.');
      return;
    }
    const targetParty = parties.find((p: any) => p.id === selectedPartyId);
    if (!targetParty || !targetParty.phone) {
      alert('Selected party does not have a valid mobile number.');
      return;
    }

    setIsSending(true);
    setTimeout(() => {
      sendSmsNotification(
        targetParty.phone,
        targetParty.name,
        'manual_alert',
        `MANUAL-${Math.floor(1000 + Math.random() * 9000)}`,
        customMessage.trim()
      );
      setIsSending(false);
      setCustomMessage('');
      setSelectedPartyId('');
      setSuccessMsg('SMS sent successfully via Sandbox Gateway!');
      setTimeout(() => setSuccessMsg(''), 4000);
    }, 500);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <MessageSquare className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Automated SMS Notifications</h1>
              <p className="text-sm text-slate-500">
                Sandbox SMS Gateway connected. Instant alerts for invoices, payment receipts, and client updates.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Sandbox Gateway Active
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Send Manual SMS / Sandbox Test */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-1 space-y-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-indigo-600" />
            Send Quick SMS Alert
          </h2>
          <p className="text-xs text-slate-500">
            Dispatch an instant SMS to any client mobile number using the connected SMS gateway.
          </p>

          <form onSubmit={handleSendManualSms} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Client Party *</label>
              <select
                value={selectedPartyId}
                onChange={e => setSelectedPartyId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Choose Party --</option>
                {parties.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.phone || 'No Phone'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Message Body *</label>
              <textarea
                rows={4}
                value={customMessage}
                onChange={e => setCustomMessage(e.target.value)}
                placeholder="Type your alert message here..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Sender ID: {profile.businessName?.substring(0, 6).toUpperCase() || 'QUICKH'}
              </span>
            </div>

            <button
              type="submit"
              disabled={isSending}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm shadow-md shadow-indigo-200 flex items-center justify-center gap-2 transition"
            >
              <Send className="w-4 h-4" />
              {isSending ? 'Sending SMS...' : 'Send SMS Now'}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-2">
            <div className="font-semibold text-slate-700">Automated Triggers Enabled:</div>
            <ul className="list-disc list-inside space-y-1 text-slate-600">
              <li>New Sale / Purchase Bill creation</li>
              <li>Payment receipt recording</li>
              <li>Delivery Challan & Quotation alerts</li>
            </ul>
          </div>
        </div>

        {/* SMS Log Table */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">SMS Dispatch History ({logs.length})</h2>
              <p className="text-xs text-slate-500">Real-time log of all automated and manual SMS alerts sent to clients.</p>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search logs..."
                className="w-full sm:w-64 pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Type / Ref</th>
                  <th className="py-3 px-4">Message</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400">
                      <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      No SMS notifications sent yet. Create an invoice or record a payment to trigger automated SMS.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{log.recipientName}</div>
                        <div className="text-xs text-slate-500 font-mono">{log.recipientPhone}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium capitalize">
                          {log.messageType.replace('_', ' ')}
                        </span>
                        <div className="text-xs text-indigo-600 font-mono mt-0.5">{log.referenceNumber}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-xs max-w-xs truncate" title={log.messageBody}>
                        {log.messageBody}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
