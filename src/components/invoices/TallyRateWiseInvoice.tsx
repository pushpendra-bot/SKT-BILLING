import React from 'react';
import { Invoice, BusinessProfile } from '../../types';

interface TallyRateWiseInvoiceProps {
  invoice: Invoice;
  profile: BusinessProfile;
  copyType: string;
  formatINR: (num: number) => string;
  numberToWordsINR: (num: number) => string;
}

export const TallyRateWiseInvoice: React.FC<TallyRateWiseInvoiceProps> = ({
  invoice,
  profile,
  copyType,
  formatINR,
  numberToWordsINR,
}) => {
  // Group by GST tax rate for Rate Wise Breakup Grid
  const rateBreakupMap: {
    [key: number]: {
      taxRate: number;
      taxableAmount: number;
      cgstAmount: number;
      sgstAmount: number;
      igstAmount: number;
      totalTax: number;
    };
  } = {};

  invoice.items.forEach(item => {
    const rate = item.taxRate || 0;
    if (!rateBreakupMap[rate]) {
      rateBreakupMap[rate] = {
        taxRate: rate,
        taxableAmount: 0,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,
        totalTax: 0,
      };
    }
    rateBreakupMap[rate].taxableAmount += item.taxableAmount;
    rateBreakupMap[rate].cgstAmount += item.cgstAmount;
    rateBreakupMap[rate].sgstAmount += item.sgstAmount;
    rateBreakupMap[rate].igstAmount += item.igstAmount;
    rateBreakupMap[rate].totalTax += (item.cgstAmount + item.sgstAmount + item.igstAmount);
  });

  const rateBreakupList = Object.values(rateBreakupMap).sort((a, b) => a.taxRate - b.taxRate);

  const totalTaxable = rateBreakupList.reduce((s, r) => s + r.taxableAmount, 0);
  const totalCgst = rateBreakupList.reduce((s, r) => s + r.cgstAmount, 0);
  const totalSgst = rateBreakupList.reduce((s, r) => s + r.sgstAmount, 0);
  const totalIgst = rateBreakupList.reduce((s, r) => s + r.igstAmount, 0);
  const totalTaxAll = rateBreakupList.reduce((s, r) => s + r.totalTax, 0);

  return (
    <div className="border-2 border-black bg-white p-3 sm:p-4 text-xs text-black font-sans print:border-black print:p-1 print:text-[10px]">
      <style>{`
        @media print {
          @page { size: A4; margin: 6mm; }
          body { -webkit-print-color-adjust: exact; font-size: 10px; line-height: 1.2; }
          .tally-print-root { max-height: 275mm; overflow: hidden; }
        }
      `}</style>

      <div className="tally-print-root space-y-2">
        {/* Tally Header with Copy Type */}
        <div className="flex justify-between items-start border-b-2 border-black pb-2 mb-2">
          <div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-600">Tax Invoice</div>
            <h1 className="text-lg font-black uppercase tracking-tight">{profile.businessName}</h1>
            <p className="text-[10px] text-slate-800">{profile.address}, {profile.city}, {profile.state} - {profile.pincode}</p>
            <div className="mt-0.5 font-mono text-[10px]">
              <div>GSTIN/UIN: <strong className="font-bold">{profile.gstin || 'N/A'}</strong> | State: {profile.state} (Code: {profile.stateCode})</div>
              {profile.phone && <div>Contact: {profile.phone} {profile.email ? `| Email: ${profile.email}` : ''}</div>}
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
            <div className="border-2 border-black px-2.5 py-0.5 font-extrabold uppercase text-[10px] bg-slate-100 tracking-wider">
              {copyType}
            </div>
            <div className="mt-1 text-[9px] font-mono text-slate-600">
              Original / Duplicate / Triplicate
            </div>
          </div>
        </div>

        {/* Traditional Tally Bill To & Ship To Vertical / Side-by-Side Alignment */}
        <div className="border border-black grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-black mb-2 text-[10px]">
          {/* Consignee (Shipped To) */}
          <div className="p-2 space-y-1">
            <div className="font-bold uppercase text-[9px] text-slate-700 border-b border-black pb-0.5 tracking-wide">
              Consignee (Shipped to)
            </div>
            <div className="font-extrabold text-xs">{invoice.partyName}</div>
            <div className="text-slate-800">{invoice.partyAddress || 'Address not specified'}</div>
            <div className="font-mono pt-0.5">
              <div>GSTIN/UIN: <strong className="font-bold">{invoice.partyGstin || 'URP'}</strong></div>
              <div>State Name: <strong className="font-bold">{invoice.partyState}</strong>, Code: <strong className="font-bold">{invoice.partyStateCode}</strong></div>
            </div>
          </div>

          {/* Buyer (Bill To) */}
          <div className="p-2 space-y-1">
            <div className="font-bold uppercase text-[9px] text-slate-700 border-b border-black pb-0.5 tracking-wide">
              Buyer (Bill to)
            </div>
            <div className="font-extrabold text-xs">{invoice.partyName}</div>
            <div className="text-slate-800">{invoice.partyAddress || 'Address not specified'}</div>
            <div className="font-mono pt-0.5">
              <div>GSTIN/UIN: <strong className="font-bold">{invoice.partyGstin || 'URP'}</strong></div>
              <div>State Name: <strong className="font-bold">{invoice.partyState}</strong>, Code: <strong className="font-bold">{invoice.partyStateCode}</strong></div>
            </div>
          </div>
        </div>

        {/* Voucher Info Panel */}
        <div className="border border-black border-t-0 grid grid-cols-2 divide-x divide-black mb-2 text-[10px]">
          <div className="p-2 space-y-0.5 font-mono">
            <div>Invoice No.: <strong className="font-bold">{invoice.invoiceNumber}</strong></div>
            <div>Dated: <strong className="font-bold">{invoice.date}</strong></div>
            <div>Mode/Terms of Payment: <strong>{invoice.paymentMode || 'Cash / Credit'}</strong></div>
            <div>Supplier's Ref: <strong>N/A</strong></div>
          </div>
          <div className="p-2 space-y-0.5 font-mono">
            <div>Buyer's Order No.: <strong>PO-{invoice.invoiceNumber}</strong></div>
            <div>Despatched Through: <strong>By Road</strong></div>
            <div>Destination: <strong>{invoice.placeOfSupply}</strong></div>
            <div>Terms of Delivery: <strong>Standard</strong></div>
          </div>
        </div>

        {/* Main Items Table */}
        <table className="w-full border-collapse border border-black mb-2 text-[10px]">
          <thead>
            <tr className="border-b-2 border-black bg-slate-100 font-bold text-center">
              <th className="border-r border-black p-1 w-8">Sl No.</th>
              <th className="border-r border-black p-1 text-left">Description of Goods</th>
              <th className="border-r border-black p-1 w-20">HSN/SAC</th>
              <th className="border-r border-black p-1 w-14">Quantity</th>
              <th className="border-r border-black p-1 w-16">Rate</th>
              <th className="border-r border-black p-1 w-10">per</th>
              <th className="p-1 text-right w-20">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((it, idx) => (
              <tr key={idx} className="border-b border-black">
                <td className="border-r border-black p-1 text-center font-mono">{idx + 1}</td>
                <td className="border-r border-black p-1 font-bold">{it.itemName}</td>
                <td className="border-r border-black p-1 text-center font-mono">{it.hsnSac || '-'}</td>
                <td className="border-r border-black p-1 text-center font-mono">{it.quantity} {it.unit}</td>
                <td className="border-r border-black p-1 text-right font-mono">{formatINR(it.price)}</td>
                <td className="border-r border-black p-1 text-center">{it.unit}</td>
                <td className="p-1 text-right font-mono font-bold">{formatINR(it.totalAmount)}</td>
              </tr>
            ))}
            <tr className="border-b-2 border-black font-bold bg-slate-50">
              <td colSpan={3} className="border-r border-black p-1 text-right">Total</td>
              <td className="border-r border-black p-1 text-center font-mono">
                {invoice.items.reduce((s, i) => s + i.quantity, 0).toFixed(2)}
              </td>
              <td colSpan={2} className="border-r border-black p-1"></td>
              <td className="p-1 text-right font-mono">{formatINR(invoice.subTotal)}</td>
            </tr>
          </tbody>
        </table>

        {/* GST Rate Wise Breakup Grid (Special Tally Feature) */}
        <div className="border border-black border-t-0 p-2 mb-2">
          <div className="font-bold text-[9px] uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>GST Rate Wise Breakup Grid (Tax Analysis):</span>
            <span className="font-mono text-[9px] text-slate-600">Supply: {invoice.isInterState ? 'Inter-State' : 'Intra-State'}</span>
          </div>
          <table className="w-full border-collapse border border-black text-[9px] font-mono">
            <thead>
              <tr className="border-b border-black bg-slate-100 font-bold text-center">
                <th className="border-r border-black p-1">GST Rate</th>
                <th className="border-r border-black p-1 text-right">Taxable Value (₹)</th>
                {!invoice.isInterState ? (
                  <>
                    <th className="border-r border-black p-1 text-right">Central Tax (CGST)</th>
                    <th className="border-r border-black p-1 text-right">State Tax (SGST)</th>
                  </>
                ) : (
                  <th className="border-r border-black p-1 text-right">Integrated Tax (IGST)</th>
                )}
                <th className="p-1 text-right">Total Tax Amount</th>
              </tr>
            </thead>
            <tbody>
              {rateBreakupList.map((rb, idx) => (
                <tr key={idx} className="border-b border-black">
                  <td className="border-r border-black p-0.5 text-center font-bold">{rb.taxRate}%</td>
                  <td className="border-r border-black p-0.5 text-right">{formatINR(rb.taxableAmount)}</td>
                  {!invoice.isInterState ? (
                    <>
                      <td className="border-r border-black p-0.5 text-right">
                        {formatINR(rb.cgstAmount)} <span className="text-[7px]">({(rb.taxRate / 2)}%)</span>
                      </td>
                      <td className="border-r border-black p-0.5 text-right">
                        {formatINR(rb.sgstAmount)} <span className="text-[7px]">({(rb.taxRate / 2)}%)</span>
                      </td>
                    </>
                  ) : (
                    <td className="border-r border-black p-0.5 text-right">
                      {formatINR(rb.igstAmount)} <span className="text-[7px]">({rb.taxRate}%)</span>
                    </td>
                  )}
                  <td className="p-0.5 text-right font-bold">{formatINR(rb.totalTax)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-black font-bold bg-slate-50">
                <td className="border-r border-black p-0.5 text-center">Total</td>
                <td className="border-r border-black p-0.5 text-right">{formatINR(totalTaxable)}</td>
                {!invoice.isInterState ? (
                  <>
                    <td className="border-r border-black p-0.5 text-right">{formatINR(totalCgst)}</td>
                    <td className="border-r border-black p-0.5 text-right">{formatINR(totalSgst)}</td>
                  </>
                ) : (
                  <td className="border-r border-black p-0.5 text-right">{formatINR(totalIgst)}</td>
                )}
                <td className="p-0.5 text-right">{formatINR(totalTaxAll)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Grand Total & Amount in Words */}
        <div className="border border-black border-t-0 p-2 mb-2 space-y-1 font-mono text-[10px]">
          <div className="flex justify-between items-center text-xs font-black border-b border-black pb-1">
            <span>Grand Total Amount:</span>
            <span className="text-sm">₹ {formatINR(invoice.grandTotal)}</span>
          </div>
          <div>
            <span className="font-bold font-sans">Amount Chargeable (in words): </span>
            <span className="font-serif italic font-semibold">INR {numberToWordsINR(invoice.grandTotal)} Only</span>
          </div>
          {profile.bankName && (
            <div className="border-t border-black pt-1 text-[9px] space-y-0.5">
              <div className="font-bold font-sans">Company Bank Details:</div>
              <div>Bank: {profile.bankName} | A/c No: {profile.accountNo} | IFSC: {profile.ifscCode}</div>
              <div>Branch: {profile.branch} {profile.upiId ? `| UPI ID: ${profile.upiId}` : ''}</div>
            </div>
          )}
        </div>

        {/* Declaration & Signatory */}
        <div className="border border-black border-t-0 p-2 grid grid-cols-2 gap-3 text-[9px]">
          <div>
            <div className="font-bold uppercase text-[9px]">Declaration:</div>
            <p className="text-slate-800 italic mt-0.5 leading-tight">
              We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
            </p>
            <div className="mt-2 font-mono">
              Company's PAN: <strong className="font-bold">{profile.pan || 'N/A'}</strong>
            </div>
          </div>
          <div className="text-right flex flex-col justify-between">
            <div className="font-bold uppercase text-[9px]">for {profile.businessName}</div>
            <div className="h-8"></div>
            <div className="border-t border-black pt-0.5 font-bold">Authorised Signatory</div>
          </div>
        </div>
      </div>
    </div>
  );
};
