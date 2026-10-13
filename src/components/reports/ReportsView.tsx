import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../utils/gstUtils';
import { generateMonthlyReportPdf } from '../../utils/pdfExport';
import {
  BarChart3,
  Download,
  Printer,
  FileSpreadsheet,
  TrendingUp,
  Receipt,
  ShieldCheck,
  Package,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { profile, invoices, expenses, items } = useApp();

  const [activeReportTab, setActiveReportTab] = useState<'gstr1' | 'gstr3b' | 'pnl' | 'stock'>('gstr1');

  const sales = invoices.filter(i => i.type === 'sale');
  const purchases = invoices.filter(i => i.type === 'purchase');

  // GSTR-1 Calculations
  const b2bSales = sales.filter(s => s.partyGstin && s.partyGstin.trim().length === 15);
  const b2cSales = sales.filter(s => !s.partyGstin || s.partyGstin.trim().length !== 15);

  const b2bTaxable = b2bSales.reduce((acc, s) => acc + s.totalTaxable, 0);
  const b2bCGST = b2bSales.reduce((acc, s) => acc + s.cgstTotal, 0);
  const b2bSGST = b2bSales.reduce((acc, s) => acc + s.sgstTotal, 0);
  const b2bIGST = b2bSales.reduce((acc, s) => acc + s.igstTotal, 0);

  // Group all sales by HSN for Table 12
  const hsnTableMap: {
    [hsn: string]: {
      hsn: string;
      qty: number;
      uqc: string;
      taxable: number;
      cgst: number;
      sgst: number;
      igst: number;
      total: number;
    };
  } = {};

  sales.forEach(inv => {
    inv.items.forEach(it => {
      const hsn = it.hsnSac || 'OTHER';
      if (!hsnTableMap[hsn]) {
        hsnTableMap[hsn] = {
          hsn,
          qty: 0,
          uqc: it.unit,
          taxable: 0,
          cgst: 0,
          sgst: 0,
          igst: 0,
          total: 0,
        };
      }
      hsnTableMap[hsn].qty += it.quantity;
      hsnTableMap[hsn].taxable += it.taxableAmount;
      hsnTableMap[hsn].cgst += it.cgstAmount;
      hsnTableMap[hsn].sgst += it.sgstAmount;
      hsnTableMap[hsn].igst += it.igstAmount;
      hsnTableMap[hsn].total += it.totalAmount;
    });
  });

  const hsnList = Object.values(hsnTableMap);

  // GSTR-3B Calculations
  const totalOutwardTaxable = sales.reduce((acc, s) => acc + s.totalTaxable, 0);
  const totalOutwardCGST = sales.reduce((acc, s) => acc + s.cgstTotal, 0);
  const totalOutwardSGST = sales.reduce((acc, s) => acc + s.sgstTotal, 0);
  const totalOutwardIGST = sales.reduce((acc, s) => acc + s.igstTotal, 0);
  const totalOutwardTax = totalOutwardCGST + totalOutwardSGST + totalOutwardIGST;

  const totalInwardPurchasesTaxable = purchases.reduce((acc, p) => acc + p.totalTaxable, 0);
  const totalPurchaseITC = purchases.reduce((acc, p) => acc + p.totalTax, 0);
  const totalExpenseITC = expenses.reduce((acc, e) => acc + e.taxAmount, 0);
  const totalEligibleITC = totalPurchaseITC + totalExpenseITC;

  const netTaxPayable = Math.max(0, totalOutwardTax - totalEligibleITC);

  // Profit and Loss
  const revenueFromOperations = sales.reduce((acc, s) => acc + s.totalTaxable, 0);
  const costOfGoodsPurchased = purchases.reduce((acc, p) => acc + p.totalTaxable, 0);
  const grossProfit = revenueFromOperations - costOfGoodsPurchased;
  const totalOperatingExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = grossProfit - totalOperatingExpenses;

  // Stock Valuation
  const totalStockValuation = items.reduce((acc, i) => acc + i.currentStock * i.purchasePrice, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    if (activeReportTab === 'gstr1') {
      const headers = ['Invoice #', 'Date', 'Party Name', 'GSTIN', 'Taxable (₹)', 'CGST (₹)', 'SGST (₹)', 'IGST (₹)', 'Total (₹)'];
      const data = sales.map(s => [
        s.invoiceNumber,
        s.date,
        s.partyName,
        s.partyGstin || 'Unregistered',
        formatINR(s.totalTaxable),
        formatINR(s.cgstTotal),
        formatINR(s.sgstTotal),
        formatINR(s.igstTotal),
        formatINR(s.grandTotal),
      ]);
      generateMonthlyReportPdf('GSTR-1 Outward Supplies Summary', profile, headers, data, `Total Invoices: ${sales.length} | Taxable Value: ${formatINR(totalOutwardTaxable)}`);
    } else if (activeReportTab === 'gstr3b') {
      const headers = ['Particulars', 'Taxable Value (₹)', 'Integrated Tax (₹)', 'Central Tax (₹)', 'State/UT Tax (₹)', 'Total Tax (₹)'];
      const data = [
        ['Outward Taxable Supplies (Other than zero/nil/exempt)', formatINR(totalOutwardTaxable), formatINR(totalOutwardIGST), formatINR(totalOutwardCGST), formatINR(totalOutwardSGST), formatINR(totalOutwardTax)],
        ['Inward Supplies Liable to Reverse Charge', '₹0.00', '₹0.00', '₹0.00', '₹0.00', '₹0.00'],
        ['Eligible ITC Available (Purchases + Expenses)', formatINR(totalInwardPurchasesTaxable), '₹0.00', '₹0.00', '₹0.00', formatINR(totalEligibleITC)],
        ['Net Tax Payable', '—', '—', '—', '—', formatINR(netTaxPayable)],
      ];
      generateMonthlyReportPdf('GSTR-3B Tax Liability & ITC Summary', profile, headers, data, `Net Tax Payable: ${formatINR(netTaxPayable)}`);
    } else if (activeReportTab === 'pnl') {
      const headers = ['Particulars', 'Amount (₹)'];
      const data = [
        ['Revenue from Operations (Sales)', formatINR(revenueFromOperations)],
        ['Cost of Goods Sold (Purchases)', formatINR(costOfGoodsPurchased)],
        ['Gross Profit', formatINR(grossProfit)],
        ['Total Operating Expenses', formatINR(totalOperatingExpenses)],
        ['Net Profit / (Loss)', formatINR(netProfit)],
      ];
      generateMonthlyReportPdf('Profit and Loss Statement', profile, headers, data, `Net Profit: ${formatINR(netProfit)}`);
    } else if (activeReportTab === 'stock') {
      const headers = ['Item Name', 'HSN/SAC', 'Current Stock', 'Unit', 'Purchase Price (₹)', 'Total Valuation (₹)'];
      const data = items.map(it => [
        it.name,
        it.hsnSac || '-',
        it.currentStock,
        it.unit,
        formatINR(it.purchasePrice),
        formatINR(it.currentStock * it.purchasePrice),
      ]);
      generateMonthlyReportPdf('Stock Summary & Valuation', profile, headers, data, `Total Inventory Valuation: ${formatINR(totalStockValuation)}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">GST & Financial Reports</h1>
          <p className="text-xs text-slate-500">
            Government compliant GSTR-1, GSTR-3B monthly return summaries and Profit & Loss statement
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
          >
            <Download className="h-4 w-4" />
            <span>Download PDF Summary</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
          >
            <Printer className="h-4 w-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 flex flex-wrap gap-1 text-xs no-print">
        <button
          onClick={() => setActiveReportTab('gstr1')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            activeReportTab === 'gstr1'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          GSTR-1 Summary (Outward Supplies)
        </button>
        <button
          onClick={() => setActiveReportTab('gstr3b')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            activeReportTab === 'gstr3b'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          GSTR-3B (Tax Liability & ITC)
        </button>
        <button
          onClick={() => setActiveReportTab('pnl')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            activeReportTab === 'pnl'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Profit & Loss Statement
        </button>
        <button
          onClick={() => setActiveReportTab('stock')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            activeReportTab === 'stock'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Stock Summary & Valuation
        </button>
      </div>

      {/* REPORT CONTENT */}

      {/* 1. GSTR-1 Report */}
      {activeReportTab === 'gstr1' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-base font-bold text-slate-900">FORM GSTR-1: Outward Supplies of Goods/Services</h2>
            <p className="text-xs text-slate-500 font-mono">
              Taxpayer: {profile.businessName} · GSTIN: {profile.gstin} · State: {profile.state} ({profile.stateCode})
            </p>
          </div>

          {/* Section 4: B2B Invoices */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Table 4: Taxable Outward Supplies to Registered Persons (B2B Invoices)
              </h3>
              <span className="text-xs text-slate-500 font-medium">{b2bSales.length} Invoices</span>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Receiver GSTIN</th>
                    <th className="p-2.5">Buyer Name</th>
                    <th className="p-2.5">Invoice #</th>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Place of Supply</th>
                    <th className="p-2.5 text-right">Taxable Value</th>
                    <th className="p-2.5 text-right">IGST (₹)</th>
                    <th className="p-2.5 text-right">CGST (₹)</th>
                    <th className="p-2.5 text-right">SGST (₹)</th>
                    <th className="p-2.5 text-right">Total Invoice (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {b2bSales.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50/50">
                      <td className="p-2 font-mono font-bold text-slate-800">{inv.partyGstin}</td>
                      <td className="p-2 font-semibold text-slate-900">{inv.partyName}</td>
                      <td className="p-2 font-mono text-rose-700">{inv.invoiceNumber}</td>
                      <td className="p-2 font-mono tabular-nums">{inv.date}</td>
                      <td className="p-2 font-mono">{inv.placeOfSupplyCode} - {inv.placeOfSupply}</td>
                      <td className="p-2 text-right font-mono tabular-nums">{formatINR(inv.totalTaxable)}</td>
                      <td className="p-2 text-right font-mono tabular-nums text-blue-700">{formatINR(inv.igstTotal)}</td>
                      <td className="p-2 text-right font-mono tabular-nums text-emerald-700">{formatINR(inv.cgstTotal)}</td>
                      <td className="p-2 text-right font-mono tabular-nums text-emerald-700">{formatINR(inv.sgstTotal)}</td>
                      <td className="p-2 text-right font-mono tabular-nums font-bold text-slate-900">{formatINR(inv.grandTotal)}</td>
                    </tr>
                  ))}
                  {/* Totals row */}
                  <tr className="bg-slate-50 font-bold border-t-2 border-slate-300">
                    <td colSpan={5} className="p-2 text-right uppercase">B2B Total:</td>
                    <td className="p-2 text-right font-mono tabular-nums">{formatINR(b2bTaxable)}</td>
                    <td className="p-2 text-right font-mono tabular-nums text-blue-700">{formatINR(b2bIGST)}</td>
                    <td className="p-2 text-right font-mono tabular-nums text-emerald-700">{formatINR(b2bCGST)}</td>
                    <td className="p-2 text-right font-mono tabular-nums text-emerald-700">{formatINR(b2bSGST)}</td>
                    <td className="p-2 text-right font-mono tabular-nums text-slate-900">
                      {formatINR(b2bSales.reduce((acc, s) => acc + s.grandTotal, 0))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 12: HSN Summary */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Table 12: HSN-wise Summary of Outward Supplies
            </h3>
            <div className="border border-slate-200 rounded-lg overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">HSN / SAC</th>
                    <th className="p-2.5 text-right">Total Qty</th>
                    <th className="p-2.5 text-center">UQC</th>
                    <th className="p-2.5 text-right">Total Value (₹)</th>
                    <th className="p-2.5 text-right">Taxable Value (₹)</th>
                    <th className="p-2.5 text-right">IGST (₹)</th>
                    <th className="p-2.5 text-right">CGST (₹)</th>
                    <th className="p-2.5 text-right">SGST (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {hsnList.map((h, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="p-2 font-mono font-bold text-slate-800">{h.hsn}</td>
                      <td className="p-2 text-right font-mono tabular-nums">{h.qty}</td>
                      <td className="p-2 text-center text-slate-500">{h.uqc}</td>
                      <td className="p-2 text-right font-mono tabular-nums font-medium">{formatINR(h.total)}</td>
                      <td className="p-2 text-right font-mono tabular-nums">{formatINR(h.taxable)}</td>
                      <td className="p-2 text-right font-mono tabular-nums text-blue-700">{formatINR(h.igst)}</td>
                      <td className="p-2 text-right font-mono tabular-nums text-emerald-700">{formatINR(h.cgst)}</td>
                      <td className="p-2 text-right font-mono tabular-nums text-emerald-700">{formatINR(h.sgst)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. GSTR-3B Report */}
      {activeReportTab === 'gstr3b' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-base font-bold text-slate-900">FORM GSTR-3B: Monthly Summary Return</h2>
            <p className="text-xs text-slate-500 font-mono">
              Consolidated Tax Liability vs Eligible Input Tax Credit (ITC)
            </p>
          </div>

          {/* Section 3.1: Outward Supplies */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              3.1: Details of Outward Supplies and Inward Supplies Liable to Reverse Charge
            </h3>
            <div className="border border-slate-200 rounded-lg overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Nature of Supplies</th>
                    <th className="p-2.5 text-right">Total Taxable Value (₹)</th>
                    <th className="p-2.5 text-right">Integrated Tax (₹)</th>
                    <th className="p-2.5 text-right">Central Tax (₹)</th>
                    <th className="p-2.5 text-right">State / UT Tax (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  <tr>
                    <td className="p-2.5 font-sans font-semibold text-slate-900">
                      (a) Outward Taxable Supplies (Other than zero rated, nil and exempted)
                    </td>
                    <td className="p-2.5 text-right tabular-nums font-bold">{formatINR(totalOutwardTaxable)}</td>
                    <td className="p-2.5 text-right tabular-nums text-blue-700">{formatINR(totalOutwardIGST)}</td>
                    <td className="p-2.5 text-right tabular-nums text-emerald-700">{formatINR(totalOutwardCGST)}</td>
                    <td className="p-2.5 text-right tabular-nums text-emerald-700">{formatINR(totalOutwardSGST)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Eligible ITC */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              4: Eligible Input Tax Credit (ITC) from Purchases & Expenses
            </h3>
            <div className="border border-slate-200 rounded-lg overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Details</th>
                    <th className="p-2.5 text-right">Taxable Turnover (₹)</th>
                    <th className="p-2.5 text-right">Eligible ITC (GST)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  <tr>
                    <td className="p-2.5 font-sans font-medium text-slate-800">
                      Inward supplies from registered persons (Material & Stock Purchases)
                    </td>
                    <td className="p-2.5 text-right tabular-nums">{formatINR(totalInwardPurchasesTaxable)}</td>
                    <td className="p-2.5 text-right tabular-nums text-blue-600 font-bold">{formatINR(totalPurchaseITC)}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-sans font-medium text-slate-800">
                      Operating Overheads & Business Expenses (Rent, Freight, Supplies)
                    </td>
                    <td className="p-2.5 text-right tabular-nums">{formatINR(expenses.reduce((a, e) => a + e.amount, 0))}</td>
                    <td className="p-2.5 text-right tabular-nums text-blue-600 font-bold">{formatINR(totalExpenseITC)}</td>
                  </tr>
                  <tr className="bg-slate-50 font-bold border-t-2 border-slate-300">
                    <td className="p-2.5 font-sans uppercase">Total Available ITC (A):</td>
                    <td></td>
                    <td className="p-2.5 text-right tabular-nums text-emerald-700">{formatINR(totalEligibleITC)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Net Settlement */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
            <h3 className="font-bold text-slate-900 uppercase">5: Net Tax Settlement Summary</h3>
            <div className="flex justify-between text-slate-600">
              <span>Total Outward GST Liability:</span>
              <span className="font-mono tabular-nums font-bold text-slate-900">{formatINR(totalOutwardTax)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Less: Total Eligible ITC Offset:</span>
              <span className="font-mono tabular-nums font-bold text-emerald-600">-{formatINR(totalEligibleITC)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold border-t border-slate-300 pt-2 text-slate-900">
              <span>Net Tax Payable in Cash (Electronic Cash Ledger):</span>
              <span className="font-mono tabular-nums text-rose-600">{formatINR(netTaxPayable)}</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Profit & Loss Statement */}
      {activeReportTab === 'pnl' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-5">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-base font-bold text-slate-900">Profit & Loss Statement (Operating View)</h2>
            <p className="text-xs text-slate-500 font-mono">
              For Period: 01-Apr-2026 to 31-Mar-2027 · {profile.businessName}
            </p>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="p-3">Particulars</th>
                  <th className="p-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {/* Revenue */}
                <tr className="bg-slate-50/70 font-semibold text-slate-900">
                  <td className="p-3">I. Revenue from Operations (Gross Sales Taxable)</td>
                  <td className="p-3 text-right font-mono tabular-nums font-bold text-emerald-700">
                    {formatINR(revenueFromOperations)}
                  </td>
                </tr>

                {/* COGS */}
                <tr>
                  <td className="p-3 text-slate-700 pl-6">Less: Cost of Materials Purchased</td>
                  <td className="p-3 text-right font-mono tabular-nums text-slate-700">
                    -{formatINR(costOfGoodsPurchased)}
                  </td>
                </tr>

                {/* Gross Profit */}
                <tr className="bg-slate-100 font-bold text-slate-900 border-t border-b border-slate-300">
                  <td className="p-3">Gross Operating Margin (I - COGS)</td>
                  <td className="p-3 text-right font-mono tabular-nums">
                    {formatINR(grossProfit)}
                  </td>
                </tr>

                {/* Operating Expenses */}
                <tr className="bg-slate-50/70 font-semibold text-slate-900">
                  <td className="p-3">II. Operating Overheads & Expenses</td>
                  <td className="p-3 text-right font-mono tabular-nums font-bold text-rose-700">
                    -{formatINR(totalOperatingExpenses)}
                  </td>
                </tr>

                {expenses.map(e => (
                  <tr key={e.id} className="text-slate-600">
                    <td className="p-2 pl-8">{e.category} ({e.vendorName})</td>
                    <td className="p-2 text-right font-mono tabular-nums text-slate-500">
                      {formatINR(e.amount)}
                    </td>
                  </tr>
                ))}

                {/* Net Profit */}
                <tr className="bg-slate-900 text-white font-extrabold text-sm">
                  <td className="p-3">Net Operating Profit Before Taxes</td>
                  <td className={`p-3 text-right font-mono tabular-nums ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatINR(netProfit)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Stock Summary & Valuation */}
      {activeReportTab === 'stock' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-slate-900">Stock Valuation & Inventory Asset Register</h2>
              <p className="text-xs text-slate-500">Valuation at Cost (Purchase Price)</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500">Total Asset Value:</span>
              <p className="text-lg font-bold font-mono text-slate-900 tabular-nums">
                {formatINR(totalStockValuation)}
              </p>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Item Name</th>
                  <th className="p-2.5">HSN Code</th>
                  <th className="p-2.5">Category</th>
                  <th className="p-2.5 text-right">Available Qty</th>
                  <th className="p-2.5 text-right">Purchase Price (₹)</th>
                  <th className="p-2.5 text-right">Selling Price (₹)</th>
                  <th className="p-2.5 text-right">Stock Valuation (Cost)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map(it => (
                  <tr key={it.id}>
                    <td className="p-2.5 font-bold text-slate-900">{it.name}</td>
                    <td className="p-2.5 font-mono text-slate-600">{it.hsnSac}</td>
                    <td className="p-2.5 text-slate-600">{it.category}</td>
                    <td className="p-2.5 text-right font-mono tabular-nums font-semibold">
                      {it.currentStock} {it.unit}
                    </td>
                    <td className="p-2.5 text-right font-mono tabular-nums text-slate-600">
                      {formatINR(it.purchasePrice)}
                    </td>
                    <td className="p-2.5 text-right font-mono tabular-nums text-slate-900 font-medium">
                      {formatINR(it.sellingPrice)}
                    </td>
                    <td className="p-2.5 text-right font-mono tabular-nums font-bold text-slate-900">
                      {formatINR(it.currentStock * it.purchasePrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
