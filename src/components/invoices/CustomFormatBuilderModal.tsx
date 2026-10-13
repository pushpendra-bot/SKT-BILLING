import React, { useState } from 'react';
import { CustomPrintFormat } from '../../types';
import { saveCustomFormat, createDefaultCustomFormat } from '../../utils/printFormats';
import {
  X,
  Save,
  CheckCircle2,
  Sliders,
  Type,
  Layout,
  Palette,
  Columns,
  Eye,
  Sparkles,
} from 'lucide-react';

interface CustomFormatBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFormat?: CustomPrintFormat | null;
  onSaved: (savedFormat: CustomPrintFormat) => void;
}

export const CustomFormatBuilderModal: React.FC<CustomFormatBuilderModalProps> = ({
  isOpen,
  onClose,
  initialFormat,
  onSaved,
}) => {
  const [format, setFormat] = useState<CustomPrintFormat>(() => {
    return initialFormat || createDefaultCustomFormat();
  });
  const [activeTab, setActiveTab] = useState<'design' | 'columns' | 'sections' | 'preview'>('design');
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const colorPresets = [
    { name: 'Vyapar Crimson', theme: '#dc2626', border: '#b91c1c', bg: '#fef2f2' },
    { name: 'Navy Corporate', theme: '#1e3a8a', border: '#1d4ed8', bg: '#eff6ff' },
    { name: 'Emerald GST', theme: '#059669', border: '#047857', bg: '#ecfdf5' },
    { name: 'Monochrome Slate', theme: '#1e293b', border: '#334155', bg: '#f8fafc' },
    { name: 'Amber Gold', theme: '#b45309', border: '#92400e', bg: '#fffbeb' },
    { name: 'Royal Purple', theme: '#7c3aed', border: '#6d28d9', bg: '#f5f3ff' },
    { name: 'Rose Boutique', theme: '#be123c', border: '#9f1239', bg: '#fff1f2' },
    { name: 'Teal Modern', theme: '#0f766e', border: '#115e59', bg: '#f0fdfa' },
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = { ...format, updatedAt: new Date().toISOString() };
    saveCustomFormat(updated);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onSaved(updated);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 font-sans">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-300">
        
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 to-rose-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-600/30 rounded-lg border border-rose-500/40">
              <Sliders className="h-5 w-5 text-rose-400" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>Create & Customize Invoice Format</span>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30">
                  Custom Format Studio
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Design your tailor-made invoice layout: adjust header, borders, columns, fonts, stamps & terms.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 border-b border-slate-200 bg-slate-50 flex items-center gap-2 pt-2">
          <button
            onClick={() => setActiveTab('design')}
            className={`px-3 py-2 text-xs font-bold rounded-t-lg border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'design'
                ? 'border-rose-600 text-rose-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Palette className="h-3.5 w-3.5" />
            <span>Theme & Typography</span>
          </button>
          <button
            onClick={() => setActiveTab('columns')}
            className={`px-3 py-2 text-xs font-bold rounded-t-lg border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'columns'
                ? 'border-rose-600 text-rose-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Columns className="h-3.5 w-3.5" />
            <span>Visible Columns</span>
          </button>
          <button
            onClick={() => setActiveTab('sections')}
            className={`px-3 py-2 text-xs font-bold rounded-t-lg border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'sections'
                ? 'border-rose-600 text-rose-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layout className="h-3.5 w-3.5" />
            <span>Sections & Stamp Boxes</span>
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-2 text-xs font-bold rounded-t-lg border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'preview'
                ? 'border-rose-600 text-rose-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Live Preview</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-5">
          
          {/* Format Name & Custom Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <label className="text-xs font-bold text-slate-700 block">Format Name</label>
              <input
                type="text"
                required
                value={format.name}
                onChange={e => setFormat({ ...format, name: e.target.value })}
                placeholder="e.g. My Premium Wholesale Format"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg mt-1 bg-white font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block">Document Title on Invoice</label>
              <input
                type="text"
                required
                value={format.customTitle}
                onChange={e => setFormat({ ...format, customTitle: e.target.value })}
                placeholder="e.g. TAX INVOICE / BILL OF SUPPLY"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg mt-1 bg-white font-bold"
              />
            </div>
          </div>

          {/* TAB 1: DESIGN & TYPOGRAPHY */}
          {activeTab === 'design' && (
            <div className="space-y-4">
              {/* Color Presets */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  1-Click Color Presets
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {colorPresets.map(p => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() =>
                        setFormat({
                          ...format,
                          themeColor: p.theme,
                          borderColor: p.border,
                          accentBg: p.bg,
                        })
                      }
                      className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-all ${
                        format.themeColor === p.theme
                          ? 'border-slate-900 ring-2 ring-slate-900/20 bg-slate-50'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: p.theme }}
                      />
                      <span className="text-[11px] font-semibold text-slate-800 truncate">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Color Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block">Theme Color</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={format.themeColor}
                      onChange={e => setFormat({ ...format, themeColor: e.target.value })}
                      className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={format.themeColor}
                      onChange={e => setFormat({ ...format, themeColor: e.target.value })}
                      className="flex-1 px-2 py-1 text-xs font-mono border border-slate-300 rounded"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block">Border Color</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={format.borderColor}
                      onChange={e => setFormat({ ...format, borderColor: e.target.value })}
                      className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={format.borderColor}
                      onChange={e => setFormat({ ...format, borderColor: e.target.value })}
                      className="flex-1 px-2 py-1 text-xs font-mono border border-slate-300 rounded"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block">Accent Background</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={format.accentBg}
                      onChange={e => setFormat({ ...format, accentBg: e.target.value })}
                      className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={format.accentBg}
                      onChange={e => setFormat({ ...format, accentBg: e.target.value })}
                      className="flex-1 px-2 py-1 text-xs font-mono border border-slate-300 rounded"
                    />
                  </div>
                </div>
              </div>

              {/* Layout & Typography Options */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block">Header Style</label>
                  <select
                    value={format.headerStyle}
                    onChange={e => setFormat({ ...format, headerStyle: e.target.value as any })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg mt-1 bg-white font-medium"
                  >
                    <option value="banner">Colored Banner (Classic)</option>
                    <option value="boxed">Boxed Border Grid</option>
                    <option value="centered">Centered Letterhead</option>
                    <option value="split">Two-Tone Split Bar</option>
                    <option value="minimal">Minimal Clean Line</option>
                    <option value="traditional">Traditional (॥ श्री ॥)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block">Font Family</label>
                  <select
                    value={format.fontFamily}
                    onChange={e => setFormat({ ...format, fontFamily: e.target.value as any })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg mt-1 bg-white font-medium"
                  >
                    <option value="sans">Modern Sans-Serif (Clean)</option>
                    <option value="serif">Classic Serif (Elegant / Luxury)</option>
                    <option value="mono">Developer Monospace (Accounting)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block">Outer Border Style</label>
                  <select
                    value={format.borderStyle}
                    onChange={e => setFormat({ ...format, borderStyle: e.target.value as any })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg mt-1 bg-white font-medium"
                  >
                    <option value="double">Double Ruled (Vyapar / Bahi)</option>
                    <option value="solid">Single Solid Line</option>
                    <option value="dashed">Dashed Voucher Border</option>
                    <option value="none">Borderless Minimal</option>
                  </select>
                </div>
              </div>

              {/* Watermark */}
              <div>
                <label className="text-xs font-bold text-slate-700 block">Background Watermark (Optional)</label>
                <input
                  type="text"
                  value={format.watermarkText || ''}
                  onChange={e => setFormat({ ...format, watermarkText: e.target.value })}
                  placeholder="e.g. ORIGINAL FOR RECIPIENT, PAID, DUPLICATE, or company name"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg mt-1 bg-white font-mono"
                />
              </div>
            </div>
          )}

          {/* TAB 2: COLUMNS */}
          {activeTab === 'columns' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Choose which columns to show or hide in the invoice table for this format:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={format.showDiscountCol}
                    onChange={e => setFormat({ ...format, showDiscountCol: e.target.checked })}
                    className="rounded text-rose-600 focus:ring-rose-500 h-4 w-4"
                  />
                  <span>Show Discount Column (%)</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={format.showTaxCol}
                    onChange={e => setFormat({ ...format, showTaxCol: e.target.checked })}
                    className="rounded text-rose-600 focus:ring-rose-500 h-4 w-4"
                  />
                  <span>Show Tax Rate & Tax Amount Columns</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={format.showHsnSummary}
                    onChange={e => setFormat({ ...format, showHsnSummary: e.target.checked })}
                    className="rounded text-rose-600 focus:ring-rose-500 h-4 w-4"
                  />
                  <span>Show Mandatory GST HSN / SAC Summary Table</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={format.showAmountInWords}
                    onChange={e => setFormat({ ...format, showAmountInWords: e.target.checked })}
                    className="rounded text-rose-600 focus:ring-rose-500 h-4 w-4"
                  />
                  <span>Show Total Amount in Words (INR Currency)</span>
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: SECTIONS & STAMP BOXES */}
          {activeTab === 'sections' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={format.showLogo}
                    onChange={e => setFormat({ ...format, showLogo: e.target.checked })}
                    className="rounded text-rose-600 h-4 w-4"
                  />
                  <span>Show Company Header Logo / Emblem</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={format.showTagline}
                    onChange={e => setFormat({ ...format, showTagline: e.target.checked })}
                    className="rounded text-rose-600 h-4 w-4"
                  />
                  <span>Show Business Tagline & Motto</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={format.showGstinBadges}
                    onChange={e => setFormat({ ...format, showGstinBadges: e.target.checked })}
                    className="rounded text-rose-600 h-4 w-4"
                  />
                  <span>Show GSTIN & PAN Badges</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={format.showBankDetails}
                    onChange={e => setFormat({ ...format, showBankDetails: e.target.checked })}
                    className="rounded text-rose-600 h-4 w-4"
                  />
                  <span>Show Bank Account & IFSC Code Box</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={format.showUpiQr}
                    onChange={e => setFormat({ ...format, showUpiQr: e.target.checked })}
                    className="rounded text-rose-600 h-4 w-4"
                  />
                  <span>Show UPI Payment Prompt / QR Box</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={format.showTerms}
                    onChange={e => setFormat({ ...format, showTerms: e.target.checked })}
                    className="rounded text-rose-600 h-4 w-4"
                  />
                  <span>Show Terms & Conditions Box</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={format.showSignatory}
                    onChange={e => setFormat({ ...format, showSignatory: e.target.checked })}
                    className="rounded text-rose-600 h-4 w-4"
                  />
                  <span>Show Authorized Signatory Signature Box</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={format.showCustomerSign}
                    onChange={e => setFormat({ ...format, showCustomerSign: e.target.checked })}
                    className="rounded text-rose-600 h-4 w-4"
                  />
                  <span>Show Receiver / Customer Acknowledgment Box</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={format.showOfficialStamp}
                    onChange={e => setFormat({ ...format, showOfficialStamp: e.target.checked })}
                    className="rounded text-rose-600 h-4 w-4"
                  />
                  <span>Show Official Circular Company Stamp Box</span>
                </label>
              </div>

              {/* Custom Terms Text */}
              <div>
                <label className="text-xs font-bold text-slate-700 block">Custom Terms & Conditions for this format</label>
                <textarea
                  rows={2}
                  value={format.customTermsText || ''}
                  onChange={e => setFormat({ ...format, customTermsText: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg mt-1"
                />
              </div>

              {/* Custom Footnote */}
              <div>
                <label className="text-xs font-bold text-slate-700 block">Bottom Footer Note</label>
                <input
                  type="text"
                  value={format.customFootnote || ''}
                  onChange={e => setFormat({ ...format, customFootnote: e.target.value })}
                  placeholder="e.g. This is a computer generated invoice and does not require physical signature."
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg mt-1"
                />
              </div>
            </div>
          )}

          {/* TAB 4: LIVE PREVIEW */}
          {activeTab === 'preview' && (
            <div className="bg-slate-100 p-4 rounded-xl border border-slate-300">
              <div
                style={{
                  borderColor: format.borderColor,
                  borderStyle: format.borderStyle === 'double' ? 'double' : format.borderStyle === 'dashed' ? 'dashed' : 'solid',
                  borderWidth: format.borderStyle === 'none' ? '0px' : format.borderStyle === 'double' ? '4px' : '1px',
                  fontFamily: format.fontFamily === 'serif' ? 'serif' : format.fontFamily === 'mono' ? 'monospace' : 'sans-serif',
                }}
                className="bg-white p-4 shadow rounded-xs max-w-xl mx-auto text-[11px]"
              >
                {/* Header Preview */}
                <div
                  style={{
                    backgroundColor: format.headerStyle === 'banner' ? format.themeColor : format.accentBg,
                    color: format.headerStyle === 'banner' ? '#ffffff' : format.themeColor,
                  }}
                  className="p-3 rounded-xs flex items-center justify-between mb-3"
                >
                  <div>
                    <h3 className="font-extrabold text-sm uppercase tracking-wide">{format.customTitle}</h3>
                    <p className="text-[10px] opacity-80">Sample Company Name Pvt Ltd</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-black/10 rounded">
                    ORIGINAL FOR RECIPIENT
                  </span>
                </div>

                {/* Body Preview */}
                <div className="border border-slate-200 p-2 rounded mb-3 grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <div className="font-bold text-slate-800">Billed To:</div>
                    <div className="text-slate-600">Sample Client Enterprises</div>
                    <div className="text-slate-500">GSTIN: 27AAAAA0000A1Z5</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-800">Invoice No: INV-2026-001</div>
                    <div className="text-slate-600">Date: 08 Oct 2026</div>
                    <div className="text-slate-500">Place of Supply: 27-Maharashtra</div>
                  </div>
                </div>

                {/* Table Preview */}
                <table className="w-full text-[10px] border border-slate-200 mb-3">
                  <thead style={{ backgroundColor: format.accentBg, color: format.themeColor }}>
                    <tr>
                      <th className="p-1 text-left">Item Description</th>
                      <th className="p-1 text-center">Qty</th>
                      <th className="p-1 text-right">Rate</th>
                      {format.showDiscountCol && <th className="p-1 text-right">Disc</th>}
                      {format.showTaxCol && <th className="p-1 text-right">Tax</th>}
                      <th className="p-1 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-slate-100">
                      <td className="p-1 font-medium">Standard Industrial Component</td>
                      <td className="p-1 text-center">10 PCS</td>
                      <td className="p-1 text-right">₹1,000</td>
                      {format.showDiscountCol && <td className="p-1 text-right">0%</td>}
                      {format.showTaxCol && <td className="p-1 text-right">18%</td>}
                      <td className="p-1 text-right font-bold">₹11,800</td>
                    </tr>
                  </tbody>
                </table>

                {/* Bottom Total */}
                <div className="flex justify-between items-center p-2 rounded" style={{ backgroundColor: format.accentBg }}>
                  <span className="font-bold" style={{ color: format.themeColor }}>Grand Total:</span>
                  <span className="font-black text-sm" style={{ color: format.themeColor }}>₹11,800.00</span>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-md transition-all active:scale-95"
            >
              {isSaved ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save & Use Custom Format</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
