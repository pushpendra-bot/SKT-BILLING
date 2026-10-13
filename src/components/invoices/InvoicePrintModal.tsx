import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Invoice, CustomPrintFormat } from '../../types';
import { formatINR, numberToWordsINR } from '../../utils/gstUtils';
import { generateInvoicePdf, generateInvoicePdfFile } from '../../utils/pdfExport';
import {
  PRINT_FORMAT_STYLES_32,
  PrintFormatDefinition,
  getCustomFormats,
  LayoutArchitecture,
} from '../../utils/printFormats';
import { CustomFormatBuilderModal } from './CustomFormatBuilderModal';
import { TallyRateWiseInvoice } from './TallyRateWiseInvoice';
import { BwPrintFormats } from './BwPrintFormats';
import {
  Printer,
  X,
  ChevronLeft,
  ChevronRight,
  Palette,
  Sliders,
  CheckCircle2,
  Plus,
  Sparkles,
  QrCode,
  ShieldCheck,
  Check,
  Download,
  Mail,
  MessageSquare,
} from 'lucide-react';

interface InvoicePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({
  isOpen,
  onClose,
  invoice,
}) => {
  const { profile } = useApp();
  const [copyType, setCopyType] = useState<'Original for Recipient' | 'Duplicate for Transporter' | 'Triplicate for Supplier'>('Original for Recipient');
  const [selectedFormatId, setSelectedFormatId] = useState<number>(32); // Default to Global Solutions format #32
  const [selectedCustomId, setSelectedCustomId] = useState<string | null>(null);
  const [customFormats, setCustomFormats] = useState<CustomPrintFormat[]>([]);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingCustomFormat, setEditingCustomFormat] = useState<CustomPrintFormat | null>(null);

  // Reload custom formats when modal opens
  useEffect(() => {
    if (isOpen) {
      setCustomFormats(getCustomFormats());
    }
  }, [isOpen]);

  if (!isOpen || !invoice) return null;

  const currentPreset = PRINT_FORMAT_STYLES_32.find(f => f.id === selectedFormatId) || PRINT_FORMAT_STYLES_32[31];
  const currentCustom = selectedCustomId ? customFormats.find(c => c.id === selectedCustomId) : null;
  // Presets that render their own complete custom invoice body (items, totals, etc.)
  const hasDedicatedFullLayout = [
    'tally_prime',
    'tally_ratewise',
    'bw_grid_invoice',
    'bw_executive_memo',
    'bw_ledger_statement',
    'bw_compact_commercial',
    'bw_classic_ledger',
    'bw_modern_editorial',
    'bw_warehouse_packing',
    'bw_consultant_invoice',
    'bw_audit_compliant',
    'bw_mono_datamatrix',
    'global_solutions_invoice',
  ].includes(currentPreset.layoutKey);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    generateInvoicePdf(invoice, profile);
  };

  const handleSendWhatsApp = async () => {
    // 1. Convert to PDF and download to device
    generateInvoicePdf(invoice, profile);

    // 2. Try native file sharing if available
    try {
      const file = generateInvoicePdfFile(invoice, profile);
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Invoice #${invoice.invoiceNumber}`,
          text: `Hi ${invoice.partyName},\n\nHere is your invoice #${invoice.invoiceNumber} amounting to ₹${invoice.grandTotal}.\n\nThank you for your business!\n${profile.businessName}`,
        });
        return;
      }
    } catch (e) {
      // Fallback
    }

    const text = `Hi ${invoice.partyName},\n\nHere is your invoice #${invoice.invoiceNumber} dated ${invoice.date} amounting to ₹${invoice.grandTotal}.\n(The PDF invoice has been generated and downloaded to your device to attach)\n\nThank you for your business!\n${profile.businessName}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleSendGmail = async () => {
    // 1. Convert to PDF and download to device
    generateInvoicePdf(invoice, profile);

    // 2. Try native file sharing if available
    try {
      const file = generateInvoicePdfFile(invoice, profile);
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Invoice #${invoice.invoiceNumber} from ${profile.businessName}`,
          text: `Dear ${invoice.partyName},\n\nPlease find your tax invoice #${invoice.invoiceNumber} attached.\n\nRegards,\n${profile.businessName}`,
        });
        return;
      }
    } catch (e) {
      // Fallback
    }

    const subject = `Invoice #${invoice.invoiceNumber} from ${profile.businessName}`;
    const body = `Dear ${invoice.partyName},\n\nPlease find your invoice #${invoice.invoiceNumber} dated ${invoice.date} amounting to ₹${invoice.grandTotal}.\n(The PDF invoice has been generated and downloaded to your device. Please attach it to this email)\n\nThank you for your business!\n\nRegards,\n${profile.businessName}\nPhone: ${profile.phone}`;
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url, '_blank');
  };

  const handlePrevFormat = () => {
    const maxLen = PRINT_FORMAT_STYLES_32.length;
    if (selectedCustomId) {
      setSelectedCustomId(null);
      setSelectedFormatId(maxLen);
    } else {
      setSelectedFormatId(prev => (prev <= 1 ? maxLen : prev - 1));
    }
  };

  const handleNextFormat = () => {
    const maxLen = PRINT_FORMAT_STYLES_32.length;
    if (selectedCustomId) {
      setSelectedCustomId(null);
      setSelectedFormatId(1);
    } else {
      setSelectedFormatId(prev => (prev >= maxLen ? 1 : prev + 1));
    }
  };

  // Group line items by HSN/SAC for the mandatory GST HSN Summary Table
  const hsnSummaryMap: {
    [key: string]: {
      hsnSac: string;
      taxableAmount: number;
      cgstRate: number;
      cgstAmount: number;
      sgstRate: number;
      sgstAmount: number;
      igstRate: number;
      igstAmount: number;
      totalTax: number;
    };
  } = {};

  invoice.items.forEach(item => {
    const key = `${item.hsnSac || 'OTHER'}_${item.taxRate}`;
    if (!hsnSummaryMap[key]) {
      hsnSummaryMap[key] = {
        hsnSac: item.hsnSac || 'N/A',
        taxableAmount: 0,
        cgstRate: item.cgstRate,
        cgstAmount: 0,
        sgstRate: item.sgstRate,
        sgstAmount: 0,
        igstRate: item.igstRate,
        igstAmount: 0,
        totalTax: 0,
      };
    }
    hsnSummaryMap[key].taxableAmount += item.taxableAmount;
    hsnSummaryMap[key].cgstAmount += item.cgstAmount;
    hsnSummaryMap[key].sgstAmount += item.sgstAmount;
    hsnSummaryMap[key].igstAmount += item.igstAmount;
    hsnSummaryMap[key].totalTax += (item.cgstAmount + item.sgstAmount + item.igstAmount);
  });

  const hsnSummaryList = Object.values(hsnSummaryMap);

  const isThermal80 = !currentCustom && currentPreset.layoutKey === 'thermal_pos_80';
  const isThermal58 = !currentCustom && currentPreset.layoutKey === 'compact_slip_58';
  const isThermal = isThermal80 || isThermal58;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:fixed print:inset-0 print:z-9999 font-sans">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[96vh] flex flex-col overflow-hidden border border-slate-300 print:border-none print:shadow-none print:max-w-none print:max-h-none print:rounded-none">
        
        {/* Top Control Toolbar - Hidden during print */}
        <div className="px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5 bg-slate-50 no-print">
          
          {/* Format Selector Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Palette className="h-3.5 w-3.5 text-rose-600" />
              <span>Format:</span>
            </span>

            {/* Quick Prev / Next Arrows */}
            <div className="flex items-center gap-0.5 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
              <button
                onClick={handlePrevFormat}
                className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                title="Previous Format"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>

              <select
                value={selectedCustomId ? `custom:${selectedCustomId}` : `preset:${selectedFormatId}`}
                onChange={e => {
                  const val = e.target.value;
                  if (val.startsWith('custom:')) {
                    setSelectedCustomId(val.replace('custom:', ''));
                  } else {
                    setSelectedCustomId(null);
                    setSelectedFormatId(Number(val.replace('preset:', '')));
                  }
                }}
                className="text-xs font-semibold text-slate-800 bg-transparent px-2 py-0.5 border-none outline-none cursor-pointer max-w-[280px] truncate"
              >
                <optgroup label="32 Master Print Formats">
                  {PRINT_FORMAT_STYLES_32.map(f => (
                    <option key={f.id} value={`preset:${f.id}`}>
                      {f.name} ({f.badge})
                    </option>
                  ))}
                </optgroup>
                {customFormats.length > 0 && (
                  <optgroup label="My Custom Formats">
                    {customFormats.map(c => (
                      <option key={c.id} value={`custom:${c.id}`}>
                        ★ {c.name} (Custom)
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>

              <button
                onClick={handleNextFormat}
                className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                title="Next Format"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Create Custom Format Button */}
            <button
              onClick={() => {
                setEditingCustomFormat(null);
                setIsBuilderOpen(true);
              }}
              className="flex items-center gap-1 px-3 py-1 bg-white hover:bg-rose-50 text-rose-700 hover:text-rose-800 border border-rose-300 rounded-lg text-xs font-bold shadow-2xs transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Custom Format</span>
              {customFormats.length > 0 && (
                <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5">
                  {customFormats.length}
                </span>
              )}
            </button>
          </div>

          {/* Copy Selector, Print Button, and Close */}
          <div className="flex items-center gap-2">
            <select
              value={copyType}
              onChange={e => setCopyType(e.target.value as any)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 font-medium text-slate-700"
            >
              <option value="Original for Recipient">Original for Recipient</option>
              <option value="Duplicate for Transporter">Duplicate for Transporter</option>
              <option value="Triplicate for Supplier">Triplicate for Supplier</option>
            </select>

            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
              title="Download PDF"
            >
              <Download className="h-3.5 w-3.5" />
              <span>PDF</span>
            </button>

            <button
              onClick={handleSendWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
              title="Send to WhatsApp"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handleSendGmail}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
              title="Send to Gmail"
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Gmail</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Invoice</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Selected Format Info Bar (No-Print) */}
        <div className="px-4 py-1.5 bg-slate-100/80 border-b border-slate-200 text-[11px] flex flex-wrap items-center justify-between text-slate-600 no-print">
          <div>
            Active:{' '}
            <strong className="text-slate-900">
              {currentCustom ? currentCustom.name : currentPreset.name}
            </strong>{' '}
            ·{' '}
            <span className="text-slate-500">
              {currentCustom ? 'Custom Studio Format' : currentPreset.category}
            </span>{' '}
            ·{' '}
            <span className="font-mono font-semibold">
              {currentCustom ? 'A4 Standard' : currentPreset.paperSize}
            </span>
          </div>
          <span className="italic text-slate-500">
            {currentCustom
              ? 'User-designed custom layout with personalized columns & terms'
              : currentPreset.tagline}
          </span>
        </div>

        {/* Invoice Printable Viewport */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-200/50 print:p-0 print:bg-white text-slate-900">
          
          {/* RENDER CUSTOM USER FORMAT */}
          {currentCustom ? (
            <div
              style={{
                borderColor: currentCustom.borderColor,
                borderStyle: currentCustom.borderStyle === 'double' ? 'double' : currentCustom.borderStyle === 'dashed' ? 'dashed' : 'solid',
                borderWidth: currentCustom.borderStyle === 'none' ? '0px' : currentCustom.borderStyle === 'double' ? '4px' : '1px',
                fontFamily: currentCustom.fontFamily === 'serif' ? 'serif' : currentCustom.fontFamily === 'mono' ? 'monospace' : 'sans-serif',
              }}
              className="mx-auto bg-white shadow-xl p-6 sm:p-8 rounded-sm text-xs max-w-[850px] print:border-none print:shadow-none print:p-0 relative"
            >
              {/* Optional Watermark */}
              {currentCustom.watermarkText && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-5 font-black text-6xl uppercase tracking-widest rotate-[-30deg]">
                  {currentCustom.watermarkText}
                </div>
              )}

              {/* Custom Header */}
              <div
                style={{
                  backgroundColor: currentCustom.headerStyle === 'banner' ? currentCustom.themeColor : currentCustom.accentBg,
                  color: currentCustom.headerStyle === 'banner' ? '#ffffff' : currentCustom.themeColor,
                  borderColor: currentCustom.borderColor,
                }}
                className="p-4 rounded-sm flex items-center justify-between mb-4 border"
              >
                <div>
                  <h1 className="text-xl font-extrabold uppercase tracking-wide">
                    {currentCustom.customTitle || 'TAX INVOICE'}
                  </h1>
                  {currentCustom.showTagline && profile.tagline && (
                    <p className="text-[11px] opacity-90">{profile.tagline}</p>
                  )}
                </div>
                <div className="text-right">
                  <span className="inline-block px-2 py-0.5 text-[10px] font-bold bg-black/10 rounded uppercase">
                    {copyType}
                  </span>
                  <div className="text-[10px] mt-1 font-mono">
                    {invoice.isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'}
                  </div>
                </div>
              </div>

              {/* Seller and Buyer Grid */}
              <div className="border border-slate-200 p-4 rounded-sm grid grid-cols-2 gap-4 mb-4 text-xs">
                <div>
                  <h2 style={{ color: currentCustom.themeColor }} className="text-sm font-extrabold uppercase">
                    {profile.businessName}
                  </h2>
                  <p className="text-slate-600 leading-tight mt-0.5">
                    {profile.address}, {profile.city}, {profile.state} - {profile.pincode}
                  </p>
                  {currentCustom.showGstinBadges && (
                    <div className="mt-2 space-y-0.5 text-[11px] font-mono">
                      <div>GSTIN: <strong>{profile.gstin || 'NOT SPECIFIED'}</strong></div>
                      <div>PAN: <strong>{profile.pan || 'NOT SPECIFIED'}</strong></div>
                      <div>Phone: {profile.phone}</div>
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <div className="text-xs space-y-0.5">
                    <div>Invoice No: <strong className="font-mono text-sm">{invoice.invoiceNumber}</strong></div>
                    <div>Date: <strong>{invoice.date}</strong></div>
                    <div>Due Date: <strong>{invoice.dueDate || invoice.date}</strong></div>
                    <div>Place of Supply: <strong>{invoice.placeOfSupplyCode} - {invoice.placeOfSupply}</strong></div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200">
                    <div className="text-slate-500 text-[10px] uppercase font-bold">Billed To:</div>
                    <div className="font-extrabold text-slate-900">{invoice.partyName}</div>
                    <div className="text-slate-600 text-[11px]">{invoice.partyAddress}</div>
                    {invoice.partyGstin && (
                      <div className="font-mono text-[11px]">GSTIN: <strong>{invoice.partyGstin}</strong></div>
                    )}
                  </div>
                </div>
              </div>

              {/* Custom Line Items Table */}
              <table className="w-full text-xs border border-slate-200 mb-4">
                <thead style={{ backgroundColor: currentCustom.accentBg, color: currentCustom.themeColor }}>
                  <tr className="border-b border-slate-300 font-bold">
                    <th className="p-2 text-center w-8">#</th>
                    <th className="p-2 text-left">Item Description</th>
                    <th className="p-2 text-center">HSN/SAC</th>
                    <th className="p-2 text-center">Qty</th>
                    <th className="p-2 text-right">Rate</th>
                    {currentCustom.showDiscountCol && <th className="p-2 text-right">Disc %</th>}
                    {currentCustom.showTaxCol && <th className="p-2 text-right">Tax %</th>}
                    <th className="p-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {invoice.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2 text-center font-mono">{idx + 1}</td>
                      <td className="p-2 font-bold">{it.itemName}</td>
                      <td className="p-2 text-center font-mono text-slate-600">{it.hsnSac || '-'}</td>
                      <td className="p-2 text-center">{it.quantity} {it.unit}</td>
                      <td className="p-2 text-right font-mono">{formatINR(it.price)}</td>
                      {currentCustom.showDiscountCol && (
                        <td className="p-2 text-right font-mono">{it.discountPercent ? `${it.discountPercent}%` : '-'}</td>
                      )}
                      {currentCustom.showTaxCol && (
                        <td className="p-2 text-right font-mono">{it.taxRate}%</td>
                      )}
                      <td className="p-2 text-right font-bold font-mono">{formatINR(it.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals & Calculations */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  {currentCustom.showAmountInWords && (
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-[11px] mb-3">
                      <span className="font-bold text-slate-700">Amount in Words: </span>
                      <span className="italic">{numberToWordsINR(invoice.grandTotal)}</span>
                    </div>
                  )}

                  {currentCustom.showBankDetails && profile.bankName && (
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-[11px] space-y-0.5 font-mono">
                      <div className="font-bold text-slate-900 font-sans uppercase">Bank Payment Details</div>
                      <div>Bank: {profile.bankName}</div>
                      <div>A/C: {profile.accountNo}</div>
                      <div>IFSC: {profile.ifscCode} · Branch: {profile.branch}</div>
                      {profile.upiId && <div>UPI: <strong>{profile.upiId}</strong></div>}
                    </div>
                  )}
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Taxable Amount:</span>
                    <span className="font-mono">{formatINR(invoice.totalTaxable)}</span>
                  </div>
                  {invoice.isInterState ? (
                    <div className="flex justify-between text-slate-600">
                      <span>Integrated Tax (IGST):</span>
                      <span className="font-mono">{formatINR(invoice.igstTotal)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between text-slate-600">
                        <span>Central Tax (CGST):</span>
                        <span className="font-mono">{formatINR(invoice.cgstTotal)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>State Tax (SGST):</span>
                        <span className="font-mono">{formatINR(invoice.sgstTotal)}</span>
                      </div>
                    </>
                  )}
                  {invoice.roundOff !== 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Round Off:</span>
                      <span className="font-mono">{invoice.roundOff > 0 ? `+${invoice.roundOff}` : invoice.roundOff}</span>
                    </div>
                  )}
                  <div
                    style={{ backgroundColor: currentCustom.accentBg, color: currentCustom.themeColor }}
                    className="flex justify-between p-2 rounded font-black text-sm border-t border-slate-300 mt-2"
                  >
                    <span>GRAND TOTAL:</span>
                    <span>{formatINR(invoice.grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* HSN Table if enabled */}
              {currentCustom.showHsnSummary && hsnSummaryList.length > 0 && (
                <div className="mb-4">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    GST HSN / SAC Summary Table
                  </div>
                  <table className="w-full text-[10px] border border-slate-200">
                    <thead className="bg-slate-100 font-bold">
                      <tr>
                        <th className="p-1 text-left">HSN/SAC</th>
                        <th className="p-1 text-right">Taxable Value</th>
                        <th className="p-1 text-right">CGST</th>
                        <th className="p-1 text-right">SGST</th>
                        <th className="p-1 text-right">IGST</th>
                        <th className="p-1 text-right">Total Tax</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hsnSummaryList.map((h, i) => (
                        <tr key={i} className="border-t border-slate-100 font-mono">
                          <td className="p-1 font-bold">{h.hsnSac}</td>
                          <td className="p-1 text-right">{formatINR(h.taxableAmount)}</td>
                          <td className="p-1 text-right">{formatINR(h.cgstAmount)}</td>
                          <td className="p-1 text-right">{formatINR(h.sgstAmount)}</td>
                          <td className="p-1 text-right">{formatINR(h.igstAmount)}</td>
                          <td className="p-1 text-right font-bold">{formatINR(h.totalTax)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Terms and Signatures */}
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-200 text-xs">
                <div>
                  {currentCustom.showTerms && (
                    <>
                      <div className="font-bold text-slate-800 text-[11px] mb-1">Terms & Conditions:</div>
                      <p className="text-[10px] text-slate-600 whitespace-pre-line leading-relaxed font-mono">
                        {currentCustom.customTermsText || profile.termsAndConditions}
                      </p>
                    </>
                  )}
                  {currentCustom.customFootnote && (
                    <p className="text-[9px] text-slate-500 italic mt-2">{currentCustom.customFootnote}</p>
                  )}
                </div>

                <div className="text-right flex flex-col justify-between items-end">
                  {currentCustom.showSignatory && (
                    <div className="text-center w-48">
                      <div className="text-[10px] text-slate-500 mb-10">For {profile.businessName}</div>
                      <div className="border-t border-slate-400 pt-1 font-bold text-[11px]">
                        Authorized Signatory
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : isThermal ? (
            /* THERMAL POS RECEIPT LAYOUTS (80mm and 58mm) */
            <div
              className={`mx-auto bg-white p-4 shadow-md text-xs border border-dashed border-slate-400 print:border-none print:shadow-none print:p-0 ${
                isThermal58 ? 'max-w-[260px] text-[11px]' : 'max-w-[340px]'
              } font-mono`}
            >
              <div className="text-center pb-2 border-b border-dashed border-slate-400 space-y-0.5">
                <h2 className="text-sm font-extrabold uppercase tracking-tight">{profile.businessName}</h2>
                <p className="text-[10px] leading-tight">{profile.address}, {profile.city}</p>
                <p className="text-[10px]">GSTIN: <strong>{profile.gstin}</strong></p>
                <p className="text-[10px]">Ph: {profile.phone}</p>
                <div className="pt-1">
                  <span className="inline-block px-2 py-0.5 bg-slate-900 text-white font-bold text-[10px] rounded uppercase">
                    TAX INVOICE
                  </span>
                </div>
              </div>

              <div className="py-2 border-b border-dashed border-slate-400 text-[10px] space-y-0.5">
                <div className="flex justify-between">
                  <span>Bill No: <strong>{invoice.invoiceNumber}</strong></span>
                  <span>Date: <strong>{invoice.date}</strong></span>
                </div>
                <div className="flex justify-between">
                  <span>Party: <strong>{invoice.partyName}</strong></span>
                </div>
                {invoice.partyGstin && (
                  <div className="flex justify-between">
                    <span>Party GST: {invoice.partyGstin}</span>
                  </div>
                )}
              </div>

              <div className="py-2 border-b border-dashed border-slate-400">
                <table className="w-full text-left text-[10px]">
                  <thead>
                    <tr className="border-b border-dashed border-slate-400">
                      <th className="pb-1">Item</th>
                      <th className="pb-1 text-center">Qty</th>
                      <th className="pb-1 text-right">Rate</th>
                      <th className="pb-1 text-right">Amt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dotted divide-slate-200">
                    {invoice.items.map((it, idx) => (
                      <tr key={idx} className="py-1">
                        <td className="py-1 pr-1">
                          <div className="font-bold leading-tight">{it.itemName}</div>
                          <div className="text-[9px] text-slate-500">HSN:{it.hsnSac} ({it.taxRate}%)</div>
                        </td>
                        <td className="py-1 text-center font-bold">{it.quantity}</td>
                        <td className="py-1 text-right">{it.price}</td>
                        <td className="py-1 text-right font-bold">{formatINR(it.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="py-2 border-b border-dashed border-slate-400 text-[10px] space-y-1">
                <div className="flex justify-between">
                  <span>Taxable Value:</span>
                  <span>{formatINR(invoice.totalTaxable)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Tax:</span>
                  <span>{formatINR(invoice.totalTax)}</span>
                </div>
                <div className="flex justify-between text-xs font-extrabold pt-1 border-t border-slate-900">
                  <span>TOTAL AMOUNT:</span>
                  <span>{formatINR(invoice.grandTotal)}</span>
                </div>
              </div>

              <div className="pt-2 text-center text-[9px] space-y-1 text-slate-600">
                <p>Thank you for your business!</p>
                {profile.upiId && <p>UPI: <strong>{profile.upiId}</strong></p>}
                <p className="text-[8px] text-slate-400">SKT Billing · Customer Care: 8278644090</p>
              </div>
            </div>
          ) : currentPreset.layoutKey === 'global_solutions_invoice' ? (
            <div className="bg-white p-8 max-w-[850px] mx-auto text-slate-900 font-sans shadow-xl border border-slate-200 print:border-none print:shadow-none print:p-0">
              {/* Top Header: Logo on left, Tax Invoice on right */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6 mb-6">
                <div className="flex items-center gap-3">
                  {profile.logoUrl ? (
                    <div className="h-14 w-14 rounded-lg border border-slate-200 p-1 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                      <img src={profile.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                    </div>
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xl tracking-tighter shrink-0 shadow-md">
                      G
                    </div>
                  )}
                  <div>
                    <div className="text-[10px] font-mono tracking-widest text-slate-500 uppercase font-bold">YOUR LOGO</div>
                    <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                      {profile.businessName || 'GLOBAL SOLUTIONS INC.'}
                    </h1>
                    <p className="text-xs text-slate-600 mt-0.5 leading-tight">
                      {profile.address || 'New Delhi, India'} {profile.city ? `, ${profile.city}` : ''}
                    </p>
                    <p className="text-[11px] font-mono text-slate-500 mt-1">
                      GSTIN: <strong className="text-slate-800">{profile.gstin || '07AABCG1234F1Z9'}</strong>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="inline-block px-3 py-1 bg-slate-900 text-white font-black text-sm tracking-wider uppercase rounded-sm shadow-xs mb-2">
                    TAX INVOICE
                  </div>
                  <div className="text-xs font-mono space-y-0.5 text-slate-700">
                    <div>INVOICE NO: <strong className="text-slate-950 font-bold">GS-TXN-{invoice.invoiceNumber}</strong></div>
                    <div>DATE: <strong className="text-slate-950 font-bold">{invoice.date}</strong></div>
                    <div>STATE CODE: <strong className="text-slate-950">{profile.stateCode || '07'}</strong></div>
                  </div>
                </div>
              </div>

              {/* Two Light-Grey Shaded Rectangular Panels Side-by-Side: BILL TO & SHIP TO */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-slate-100/90 rounded-lg border border-slate-200 shadow-2xs">
                  <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1.5">
                    BILL TO
                  </div>
                  <div className="font-extrabold text-sm text-slate-900">{invoice.partyName}</div>
                  <div className="text-xs text-slate-700 mt-1 leading-relaxed">{invoice.partyAddress || 'Client Billing Address'}</div>
                  {invoice.partyGstin && (
                    <div className="text-xs font-mono text-slate-700 mt-1.5">
                      GSTIN: <strong className="text-slate-900">{invoice.partyGstin}</strong>
                    </div>
                  )}
                  <div className="text-xs font-mono text-slate-600 mt-0.5">Phone: {invoice.partyPhone || 'N/A'}</div>
                </div>

                <div className="p-4 bg-slate-100/90 rounded-lg border border-slate-200 shadow-2xs">
                  <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1.5">
                    SHIP TO / DELIVER TO
                  </div>
                  <div className="font-extrabold text-sm text-slate-900">{invoice.partyName}</div>
                  <div className="text-xs text-slate-700 mt-1 leading-relaxed">{invoice.partyAddress || 'Delivery Warehouse / Location'}</div>
                  <div className="text-xs font-mono text-slate-600 mt-2">
                    Place of Supply: <strong className="text-slate-900">{invoice.placeOfSupply} ({invoice.placeOfSupplyCode})</strong>
                  </div>
                </div>
              </div>

              {/* Center Structured Table with Precise Horizontal Lines */}
              <div className="mb-6 overflow-hidden rounded-lg border border-slate-300">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold text-center tracking-wide">
                      <th className="p-2.5 w-12 border-r border-slate-700">Sr No</th>
                      <th className="p-2.5 text-left border-r border-slate-700">Item Description</th>
                      <th className="p-2.5 w-24 border-r border-slate-700">HSN</th>
                      <th className="p-2.5 w-16 border-r border-slate-700">Qty</th>
                      <th className="p-2.5 w-24 text-right border-r border-slate-700">Rate</th>
                      <th className="p-2.5 w-16 text-right border-r border-slate-700">GST %</th>
                      <th className="p-2.5 w-28 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {invoice.items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-2.5 text-center font-mono text-slate-600 border-r border-slate-200">{idx + 1}</td>
                        <td className="p-2.5 font-bold text-slate-900 border-r border-slate-200">
                          <div>{it.itemName}</div>
                          {it.discountPercent > 0 && (
                            <div className="text-[10px] text-emerald-700 font-normal">Discount: {it.discountPercent}% applied</div>
                          )}
                        </td>
                        <td className="p-2.5 text-center font-mono text-slate-600 border-r border-slate-200">{it.hsnSac || '8471'}</td>
                        <td className="p-2.5 text-center font-mono font-bold border-r border-slate-200">{it.quantity} {it.unit}</td>
                        <td className="p-2.5 text-right font-mono border-r border-slate-200">{formatINR(it.price)}</td>
                        <td className="p-2.5 text-right font-mono border-r border-slate-200">{it.taxRate}%</td>
                        <td className="p-2.5 text-right font-mono font-extrabold text-slate-950">{formatINR(it.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bottom Grid: Bank Details (Left) & Financial Summary (Right) */}
              <div className="grid grid-cols-2 gap-6 items-start pt-2 border-t border-slate-200">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs font-mono space-y-1">
                  <div className="font-sans font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">
                    BANK DETAILS
                  </div>
                  <div>Bank Name: <strong className="text-slate-900">{profile.bankName || 'HDFC Bank Ltd.'}</strong></div>
                  <div>A/C Number: <strong className="text-slate-900">{profile.accountNo || '50200012345678'}</strong></div>
                  <div>IFSC Code: <strong className="text-slate-900">{profile.ifscCode || 'HDFC0001234'}</strong></div>
                  <div>Branch: {profile.branch || 'Connaught Place, New Delhi'}</div>
                  {profile.upiId && (
                    <div className="pt-1 border-t border-slate-200">
                      UPI ID: <strong className="text-slate-900">{profile.upiId}</strong>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-bold">{formatINR(invoice.subTotal)}</span>
                  </div>
                  {invoice.totalDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount:</span>
                      <span>-{formatINR(invoice.totalDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>Taxable Amount:</span>
                    <span>{formatINR(invoice.totalTaxable)}</span>
                  </div>
                  {invoice.isInterState ? (
                    <div className="flex justify-between text-slate-600">
                      <span>IGST (Integrated Tax):</span>
                      <span>{formatINR(invoice.igstTotal)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between text-slate-600">
                        <span>CGST (Central Tax):</span>
                        <span>{formatINR(invoice.cgstTotal)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>SGST (State Tax):</span>
                        <span>{formatINR(invoice.sgstTotal)}</span>
                      </div>
                    </>
                  )}
                  {invoice.roundOff !== 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Round Off:</span>
                      <span>{invoice.roundOff > 0 ? `+${invoice.roundOff}` : invoice.roundOff}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center p-3 bg-slate-900 text-white rounded-md text-sm font-black tracking-wide mt-2 shadow-sm font-sans">
                    <span>TOTAL AMOUNT:</span>
                    <span className="font-mono text-base">{formatINR(invoice.grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Signatory & Footer */}
              <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-end text-xs">
                <div>
                  <div className="font-bold text-slate-800 text-[11px] mb-1">Terms & Conditions:</div>
                  <p className="text-[10px] text-slate-600 whitespace-pre-line font-mono leading-tight max-w-md">
                    {profile.termsAndConditions}
                  </p>
                </div>
                <div className="text-center w-52">
                  <div className="text-[10px] text-slate-500 mb-12">For {profile.businessName || 'GLOBAL SOLUTIONS INC.'}</div>
                  <div className="border-t border-slate-400 pt-1 font-bold text-[11px]">
                    Authorized Signatory
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                borderColor: currentPreset.borderColor,
                backgroundColor: '#ffffff',
                fontFamily: currentPreset.fontFamily === 'serif' ? 'serif' : currentPreset.fontFamily === 'mono' ? 'monospace' : 'sans-serif',
              }}
              className={`mx-auto bg-white shadow-xl p-6 sm:p-8 rounded-sm text-xs border max-w-[850px] print:border-none print:shadow-none print:p-0 ${
                currentPreset.layoutKey === 'traditional_bahi_khata' ? 'border-4 border-double border-rose-900' : ''
              }`}
            >
              {/* TRADITIONAL BAHI-KHATA HEADER */}
              {currentPreset.layoutKey === 'traditional_bahi_khata' && (
                <div className="text-center pb-3 border-b-2 border-rose-900 mb-4">
                  <div className="text-rose-900 font-bold text-sm tracking-widest">
                    ॥ श्री गणेशाय नमः ॥ शुभ लाभ ॥ श्री महालक्ष्म्यै नमः ॥
                  </div>
                  <h1 className="text-2xl font-black text-rose-950 mt-1 uppercase tracking-wider">
                    {profile.businessName}
                  </h1>
                  <p className="text-xs text-rose-800 font-semibold">{profile.tagline || 'पारंपरिक भारतीय व्यापारिक बीजक'}</p>
                  <p className="text-[11px] text-slate-700 mt-0.5">{profile.address}, {profile.city} - {profile.pincode}</p>
                  <div className="inline-block mt-2 px-4 py-0.5 bg-rose-900 text-white font-bold text-xs rounded">
                    कर बीजक / TAX INVOICE (व्यापारिक बही-खाता)
                  </div>
                </div>
              )}

              {/* BUSY 21 HEADER */}
              {currentPreset.layoutKey === 'busy_standard' && (
                <div className="border-2 border-slate-800 p-3 mb-4 flex items-center justify-between bg-slate-100">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">BUSY 21 ACCOUNTING SERIES</span>
                    <h1 className="text-lg font-black text-slate-900 tracking-tight uppercase">
                      TAX INVOICE (RULE 46)
                    </h1>
                  </div>
                  <div className="text-right font-mono text-xs">
                    <div className="font-bold">VOUCHER NO: {invoice.invoiceNumber}</div>
                    <div>DATE: {invoice.date}</div>
                  </div>
                </div>
              )}

              {/* TALLY PRIME SAME-TO-SAME STATUTORY TAX INVOICE FORMAT */}
              {currentPreset.layoutKey === 'tally_prime' && (
                <div className="border-2 border-black bg-white p-4 sm:p-6 text-xs text-black font-sans">
                  {/* Tally Header */}
                  <div className="text-center border-b-2 border-black pb-3 mb-3">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-700">Tax Invoice</div>
                    <h1 className="text-xl font-black uppercase tracking-wider">{profile.businessName}</h1>
                    <p className="text-[11px] text-slate-800">{profile.address}, {profile.city}, {profile.state} - {profile.pincode}</p>
                    <div className="flex justify-between items-center mt-2 text-[11px] font-mono">
                      <div>GSTIN/UIN: <strong className="font-bold">{profile.gstin || 'N/A'}</strong></div>
                      <div className="border border-black px-2 py-0.5 font-bold uppercase text-[10px] bg-slate-50">{copyType}</div>
                      <div>State Name: {profile.state}, Code: {profile.stateCode}</div>
                    </div>
                  </div>

                  {/* Consignee & Buyer Grid */}
                  <div className="border border-black grid grid-cols-2 divide-x divide-black mb-3 text-[11px]">
                    <div className="p-2.5 space-y-1">
                      <div className="font-bold uppercase text-[10px] text-slate-700 border-b border-black pb-0.5">Consignee (Shipped to)</div>
                      <div className="font-extrabold text-sm">{invoice.partyName}</div>
                      <div>{invoice.partyAddress || 'Address not specified'}</div>
                      <div>GSTIN/UIN: <strong className="font-mono font-bold">{invoice.partyGstin || 'URP'}</strong></div>
                      <div>State Name: {invoice.partyState}, Code: {invoice.partyStateCode}</div>
                    </div>
                    <div className="p-2.5 space-y-1">
                      <div className="font-bold uppercase text-[10px] text-slate-700 border-b border-black pb-0.5">Buyer (Bill to)</div>
                      <div className="font-extrabold text-sm">{invoice.partyName}</div>
                      <div>{invoice.partyAddress || 'Address not specified'}</div>
                      <div>GSTIN/UIN: <strong className="font-mono font-bold">{invoice.partyGstin || 'URP'}</strong></div>
                      <div>State Name: {invoice.partyState}, Code: {invoice.partyStateCode}</div>
                    </div>
                  </div>

                  {/* Voucher Info Box */}
                  <div className="border border-black border-t-0 grid grid-cols-2 divide-x divide-black mb-3 text-[11px]">
                    <div className="p-2.5 space-y-1 font-mono">
                      <div>Invoice No.: <strong className="font-bold">{invoice.invoiceNumber}</strong></div>
                      <div>Dated: <strong className="font-bold">{invoice.date}</strong></div>
                      <div>Mode/Terms of Payment: <strong>{invoice.paymentMode || 'Cash / Credit'}</strong></div>
                      <div>Supplier's Ref: <strong>N/A</strong></div>
                    </div>
                    <div className="p-2.5 space-y-1 font-mono">
                      <div>Buyer's Order No.: <strong>PO-{invoice.invoiceNumber}</strong></div>
                      <div>Despatched through: <strong>By Road</strong></div>
                      <div>Destination: <strong>{invoice.placeOfSupply}</strong></div>
                      <div>Terms of Delivery: <strong>Standard</strong></div>
                    </div>
                  </div>

                  {/* Items Table */}
                  <table className="w-full border-collapse border border-black mb-3 text-[11px]">
                    <thead>
                      <tr className="border-b-2 border-black bg-slate-100 font-bold text-center">
                        <th className="border-r border-black p-1.5 w-10">Sl No.</th>
                        <th className="border-r border-black p-1.5 text-left">Description of Goods</th>
                        <th className="border-r border-black p-1.5 w-24">HSN/SAC</th>
                        <th className="border-r border-black p-1.5 w-16">Quantity</th>
                        <th className="border-r border-black p-1.5 w-20">Rate</th>
                        <th className="border-r border-black p-1.5 w-12">per</th>
                        <th className="p-1.5 text-right w-24">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((it, idx) => (
                        <tr key={idx} className="border-b border-black">
                          <td className="border-r border-black p-1.5 text-center font-mono">{idx + 1}</td>
                          <td className="border-r border-black p-1.5 font-bold">{it.itemName}</td>
                          <td className="border-r border-black p-1.5 text-center font-mono">
                            <div>{it.quantity} {it.unit}</div>
                            {it.isSecondaryUnit && it.conversionFactor && it.conversionFactor > 1 ? (
                              <div className="text-[9px] text-slate-600">({it.baseQuantity || (it.quantity * it.conversionFactor)})</div>
                            ) : null}
                          </td>
                          <td className="border-r border-black p-1.5 text-right font-mono">{formatINR(it.price)}</td>
                          <td className="border-r border-black p-1.5 text-center">{it.unit}</td>
                          <td className="p-1.5 text-right font-mono font-bold">{formatINR(it.totalAmount)}</td>
                        </tr>
                      ))}
                      <tr className="border-b-2 border-black font-bold">
                        <td colSpan={3} className="border-r border-black p-1.5 text-right">Total</td>
                        <td className="border-r border-black p-1.5 text-center font-mono">
                          {invoice.items.reduce((s, i) => s + i.quantity, 0).toFixed(2)}
                        </td>
                        <td colSpan={2} className="border-r border-black p-1.5"></td>
                        <td className="p-1.5 text-right font-mono">{formatINR(invoice.subTotal)}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Tax Breakdown & Totals */}
                  <div className="border border-black border-t-0 p-2.5 mb-3 text-[11px] space-y-1 font-mono">
                    {invoice.isInterState ? (
                      <div className="flex justify-between">
                        <span>Integrated Tax (IGST):</span>
                        <span>{formatINR(invoice.igstTotal)}</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span>Central Tax (CGST):</span>
                          <span>{formatINR(invoice.cgstTotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>State Tax (SGST):</span>
                          <span>{formatINR(invoice.sgstTotal)}</span>
                        </div>
                      </>
                    )}
                    {invoice.roundOff !== 0 && (
                      <div className="flex justify-between">
                        <span>Round Off:</span>
                        <span>{invoice.roundOff > 0 ? `+${invoice.roundOff}` : invoice.roundOff}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-black text-sm border-t border-black pt-1">
                      <span>Grand Total:</span>
                      <span>₹ {formatINR(invoice.grandTotal)}</span>
                    </div>
                  </div>

                  {/* Amount in Words & Bank Details */}
                  <div className="border border-black border-t-0 p-2.5 mb-3 text-[11px] space-y-2">
                    <div>
                      <span className="font-bold">Amount Chargeable (in words): </span>
                      <span className="font-serif italic font-semibold">INR {numberToWordsINR(invoice.grandTotal)} Only</span>
                    </div>
                    {profile.bankName && (
                      <div className="border-t border-black pt-2 font-mono text-[10px] space-y-0.5">
                        <div className="font-bold font-sans">Company Bank Details:</div>
                        <div>Bank Name: {profile.bankName} | A/c No: {profile.accountNo} | IFSC: {profile.ifscCode}</div>
                        <div>Branch: {profile.branch} {profile.upiId ? `| UPI ID: ${profile.upiId}` : ''}</div>
                      </div>
                    )}
                  </div>

                  {/* HSN Summary Table */}
                  {hsnSummaryList.length > 0 && (
                    <div className="border border-black border-t-0 p-2.5 mb-3">
                      <div className="font-bold text-[10px] uppercase mb-1">Tax Analysis (HSN/SAC Wise):</div>
                      <table className="w-full border-collapse border border-black text-[10px] font-mono">
                        <thead>
                          <tr className="border-b border-black bg-slate-50 font-bold text-center">
                            <th className="border-r border-black p-1">HSN/SAC</th>
                            <th className="border-r border-black p-1 text-right">Taxable Value</th>
                            <th className="border-r border-black p-1 text-right">CGST</th>
                            <th className="border-r border-black p-1 text-right">SGST</th>
                            <th className="border-r border-black p-1 text-right">IGST</th>
                            <th className="p-1 text-right">Total Tax</th>
                          </tr>
                        </thead>
                        <tbody>
                          {hsnSummaryList.map((h, i) => (
                            <tr key={i} className="border-b border-black">
                              <td className="border-r border-black p-1 font-bold text-center">{h.hsnSac}</td>
                              <td className="border-r border-black p-1 text-right">{formatINR(h.taxableAmount)}</td>
                              <td className="border-r border-black p-1 text-right">{formatINR(h.cgstAmount)}</td>
                              <td className="border-r border-black p-1 text-right">{formatINR(h.sgstAmount)}</td>
                              <td className="border-r border-black p-1 text-right">{formatINR(h.igstAmount)}</td>
                              <td className="p-1 text-right font-bold">{formatINR(h.totalTax)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Declaration & Signatory */}
                  <div className="border border-black border-t-0 p-3 grid grid-cols-2 gap-4 text-[10px]">
                    <div>
                      <div className="font-bold uppercase">Declaration:</div>
                      <p className="text-slate-800 italic mt-0.5">
                        We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
                      </p>
                      <div className="mt-4 font-mono">
                        Company's PAN: <strong className="font-bold">{profile.pan || 'N/A'}</strong>
                      </div>
                    </div>
                    <div className="text-right flex flex-col justify-between">
                      <div className="font-bold uppercase">for {profile.businessName}</div>
                      <div className="h-12"></div>
                      <div className="border-t border-black pt-1 font-bold">Authorised Signatory</div>
                    </div>
                  </div>
                </div>
              )}

              {/* TALLY PRIME RATE-WISE TAX INVOICE FORMAT */}
              {currentPreset.layoutKey === 'tally_ratewise' && (
                <TallyRateWiseInvoice
                  invoice={invoice}
                  profile={profile}
                  copyType={copyType}
                  formatINR={formatINR}
                  numberToWordsINR={numberToWordsINR}
                />
              )}

              {/* B&W NEW PRINT FORMATS (22 to 31) */}
              {[
                'bw_grid_invoice',
                'bw_executive_memo',
                'bw_ledger_statement',
                'bw_compact_commercial',
                'bw_classic_ledger',
                'bw_modern_editorial',
                'bw_warehouse_packing',
                'bw_consultant_invoice',
                'bw_audit_compliant',
                'bw_mono_datamatrix',
              ].includes(currentPreset.layoutKey) && (
                <BwPrintFormats
                  invoice={invoice}
                  profile={profile}
                  copyType={copyType}
                  formatINR={formatINR}
                  numberToWordsINR={numberToWordsINR}
                  hsnSummaryList={hsnSummaryList}
                  layoutKey={currentPreset.layoutKey}
                />
              )}

              {/* STANDARD BANNER & BODY (For standard presets & custom formats) */}
              {!hasDedicatedFullLayout && (
                <>
                  {/* Standard Banner (Hidden for Bahi-Khata and Busy 21 which have their own branded header) */}
                  {currentPreset.layoutKey !== 'traditional_bahi_khata' && currentPreset.layoutKey !== 'busy_standard' && (
                    <div
                      style={{
                        backgroundColor: currentPreset.themeColor,
                        color: '#ffffff',
                      }}
                      className="p-3.5 rounded-t-sm flex items-center justify-between mb-4"
                    >
                      <div>
                        <h1 className="text-lg font-extrabold uppercase tracking-wide">
                          {invoice.type === 'quotation'
                            ? 'QUOTATION'
                            : invoice.type === 'delivery_challan'
                            ? 'DELIVERY CHALLAN'
                            : invoice.type === 'purchase'
                            ? 'PURCHASE BILL'
                            : 'TAX INVOICE / SALE BILL'}
                        </h1>
                        <p className="text-[10px] opacity-90">
                          {currentPreset.name} · Issued under CGST Act, 2017
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold bg-white/20 rounded uppercase tracking-wider">
                          {copyType}
                        </span>
                        <p className="text-[10px] opacity-90 mt-0.5 font-mono">
                          Supply: {invoice.isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* COMPANY & PARTY GRID */}
                  <div className="border border-slate-300 p-4 grid grid-cols-2 gap-4 rounded-sm mb-4">
                    {/* Seller Profile */}
                    <div>
                      <h2 style={{ color: currentPreset.themeColor }} className="text-base font-extrabold uppercase tracking-tight">
                        {profile.businessName}
                      </h2>
                      <p className="text-[11px] text-slate-600 italic mb-1">{profile.tagline}</p>
                      <p className="text-[11px] text-slate-700 leading-relaxed">
                        {profile.address}, {profile.city}, {profile.state} - {profile.pincode}
                      </p>
                      <div className="mt-2 space-y-0.5 text-[11px]">
                        <div>
                          <span className="font-semibold text-slate-900">GSTIN:</span>{' '}
                          <span className="font-mono font-bold">{profile.gstin || 'NOT SPECIFIED'}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900">PAN:</span>{' '}
                          <span className="font-mono">{profile.pan || 'NOT SPECIFIED'}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900">State:</span> {profile.state}{' '}
                          <span className="text-slate-500 font-mono">(Code: {profile.stateCode})</span>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900">Contact:</span> {profile.phone} · {profile.email}
                        </div>
                      </div>
                    </div>

                    {/* Buyer / Invoice Metadata */}
                    <div className="text-right border-l border-slate-200 pl-4">
                      <div className="space-y-0.5 text-xs font-mono">
                        <div>
                          Invoice No: <strong className="text-slate-900 text-sm font-bold">{invoice.invoiceNumber}</strong>
                        </div>
                        <div>Date: <strong>{invoice.date}</strong></div>
                        <div>Due Date: <strong>{invoice.dueDate || invoice.date}</strong></div>
                        <div>Place of Supply: <strong>{invoice.placeOfSupplyCode} - {invoice.placeOfSupply}</strong></div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-200 text-left">
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                          Billed To (Recipient / Buyer):
                        </div>
                        <div className="font-extrabold text-slate-900 text-sm">{invoice.partyName}</div>
                        <p className="text-[11px] text-slate-600 leading-tight">{invoice.partyAddress || 'Address not specified'}</p>
                        {invoice.partyGstin && (
                          <div className="mt-1 text-[11px]">
                            <span className="font-semibold text-slate-700">GSTIN:</span>{' '}
                            <span className="font-mono font-bold">{invoice.partyGstin}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* LINE ITEMS TABLE */}
                  <table className="w-full text-xs border border-slate-300 mb-4">
                    <thead style={{ backgroundColor: currentPreset.tableHeaderBg, color: currentPreset.textColor }}>
                      <tr className="border-b border-slate-300 font-bold">
                        <th className="p-2 text-center w-8">#</th>
                        <th className="p-2 text-left">Item Description</th>
                        <th className="p-2 text-center">HSN/SAC</th>
                        <th className="p-2 text-center">Qty</th>
                        <th className="p-2 text-right">Rate</th>
                        <th className="p-2 text-right">Tax %</th>
                        <th className="p-2 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {invoice.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="p-2 text-center font-mono text-slate-500">{idx + 1}</td>
                          <td className="p-2 font-bold text-slate-900">{it.itemName}</td>
                          <td className="p-2 text-center font-mono text-slate-600">{it.hsnSac || '-'}</td>
                          <td className="p-2 text-center">{it.quantity} {it.unit}</td>
                          <td className="p-2 text-right font-mono">{formatINR(it.price)}</td>
                          <td className="p-2 text-right font-mono">{it.taxRate}%</td>
                          <td className="p-2 text-right font-bold font-mono">{formatINR(it.totalAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* TOTALS & SUMMARY */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-[11px] mb-3">
                        <span className="font-bold text-slate-700">Total in Words: </span>
                        <span className="italic">{numberToWordsINR(invoice.grandTotal)}</span>
                      </div>

                      {profile.bankName && (
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-[11px] space-y-0.5 font-mono">
                          <div className="font-bold text-slate-900 font-sans uppercase">Bank Payment Details</div>
                          <div>Bank: {profile.bankName}</div>
                          <div>A/C: {profile.accountNo}</div>
                          <div>IFSC: {profile.ifscCode} · Branch: {profile.branch}</div>
                          {profile.upiId && <div>UPI: <strong>{profile.upiId}</strong></div>}
                        </div>
                      )}
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-300 rounded space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Taxable Value:</span>
                        <span className="font-mono">{formatINR(invoice.totalTaxable)}</span>
                      </div>
                      {invoice.isInterState ? (
                        <div className="flex justify-between text-slate-600">
                          <span>IGST Total:</span>
                          <span className="font-mono">{formatINR(invoice.igstTotal)}</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between text-slate-600">
                            <span>CGST Total:</span>
                            <span className="font-mono">{formatINR(invoice.cgstTotal)}</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>SGST Total:</span>
                            <span className="font-mono">{formatINR(invoice.sgstTotal)}</span>
                          </div>
                        </>
                      )}
                      {invoice.roundOff !== 0 && (
                        <div className="flex justify-between text-slate-600">
                          <span>Round Off:</span>
                          <span className="font-mono">{invoice.roundOff > 0 ? `+${invoice.roundOff}` : invoice.roundOff}</span>
                        </div>
                      )}
                      <div
                        style={{ backgroundColor: currentPreset.accentBg, color: currentPreset.themeColor }}
                        className="flex justify-between p-2 rounded font-black text-sm border-t border-slate-300 mt-2"
                      >
                        <span>GRAND TOTAL:</span>
                        <span>{formatINR(invoice.grandTotal)}</span>
                      </div>
                    </div>
                  </div>

                  {/* GST HSN SUMMARY TABLE */}
                  {hsnSummaryList.length > 0 && (
                    <div className="mb-4">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                        GST HSN / SAC Statutory Summary
                      </div>
                      <table className="w-full text-[10px] border border-slate-300">
                        <thead className="bg-slate-100 font-bold">
                          <tr>
                            <th className="p-1 text-left">HSN/SAC</th>
                            <th className="p-1 text-right">Taxable Value</th>
                            <th className="p-1 text-right">CGST</th>
                            <th className="p-1 text-right">SGST</th>
                            <th className="p-1 text-right">IGST</th>
                            <th className="p-1 text-right">Total Tax</th>
                          </tr>
                        </thead>
                        <tbody>
                          {hsnSummaryList.map((h, i) => (
                            <tr key={i} className="border-t border-slate-200 font-mono">
                              <td className="p-1 font-bold">{h.hsnSac}</td>
                              <td className="p-1 text-right">{formatINR(h.taxableAmount)}</td>
                              <td className="p-1 text-right">{formatINR(h.cgstAmount)}</td>
                              <td className="p-1 text-right">{formatINR(h.sgstAmount)}</td>
                              <td className="p-1 text-right">{formatINR(h.igstAmount)}</td>
                              <td className="p-1 text-right font-bold">{formatINR(h.totalTax)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* FOOTER & TERMS */}
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-200 text-xs">
                    <div>
                      <div className="font-bold text-slate-800 text-[11px] mb-1">Terms & Conditions:</div>
                      <p className="text-[10px] text-slate-600 whitespace-pre-line leading-relaxed font-mono">
                        {profile.termsAndConditions}
                      </p>
                    </div>

                    <div className="text-right flex flex-col justify-between items-end">
                      <div className="text-center w-48">
                        <div className="text-[10px] text-slate-500 mb-10">For {profile.businessName}</div>
                        <div className="border-t border-slate-400 pt-1 font-bold text-[11px]">
                          Authorized Signatory
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Custom Format Builder Modal */}
      <CustomFormatBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        initialFormat={editingCustomFormat}
        onSaved={(newFormat) => {
          setCustomFormats(getCustomFormats());
          setSelectedCustomId(newFormat.id);
        }}
      />
    </div>
  );
};
