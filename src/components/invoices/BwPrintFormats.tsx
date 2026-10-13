import { Invoice, BusinessProfile } from '../../types';

export interface HsnSummaryItem {
  hsnSac: string;
  taxableAmount: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalTax: number;
}

interface BwFormatProps {
  invoice: Invoice;
  profile: BusinessProfile;
  copyType: string;
  formatINR: (num: number) => string;
  numberToWordsINR: (num: number) => string;
  hsnSummaryList: HsnSummaryItem[];
  layoutKey: string;
}

export const BwPrintFormats: React.FC<BwFormatProps> = ({
  invoice,
  profile,
  copyType,
  formatINR,
  numberToWordsINR,
  hsnSummaryList,
  layoutKey,
}) => {
  // Common shared header helper
  const renderHeader = (title: string, subtitle?: string) => (
    <div className="border-b-2 border-black pb-3 mb-3 text-center">
      <div className="text-[10px] font-mono tracking-widest uppercase">{copyType}</div>
      <h1 className="text-xl font-black uppercase tracking-tight text-black">{profile.businessName}</h1>
      <p className="text-[11px] text-black">{profile.address}, {profile.city}, {profile.state} - {profile.pincode}</p>
      <div className="flex justify-between items-center mt-2 text-[11px] font-mono border-t border-black pt-1">
        <div>GSTIN: <span className="font-bold">{profile.gstin || 'N/A'}</span></div>
        <div className="font-bold text-xs uppercase underline">{title}</div>
        <div>State Code: {profile.stateCode}</div>
      </div>
      {subtitle && <div className="text-[10px] italic mt-0.5 text-black">{subtitle}</div>}
    </div>
  );

  const renderPartyBoxes = () => (
    <div className="border border-black grid grid-cols-2 divide-x divide-black mb-3 text-[11px]">
      <div className="p-2 space-y-0.5">
        <div className="font-bold text-[10px] uppercase border-b border-black pb-0.5">Bill To (Customer)</div>
        <div className="font-extrabold text-sm">{invoice.partyName}</div>
        <div>{invoice.partyAddress || 'Address not specified'}</div>
        <div>GSTIN: <span className="font-mono font-bold">{invoice.partyGstin || 'URP'}</span></div>
        <div>State: {invoice.partyState} (Code: {invoice.partyStateCode})</div>
      </div>
      <div className="p-2 space-y-0.5">
        <div className="font-bold text-[10px] uppercase border-b border-black pb-0.5">Ship To (Consignee)</div>
        <div className="font-extrabold text-sm">{invoice.partyName}</div>
        <div>{invoice.partyAddress || 'Address not specified'}</div>
        <div>GSTIN: <span className="font-mono font-bold">{invoice.partyGstin || 'URP'}</span></div>
        <div>State: {invoice.partyState} (Code: {invoice.partyStateCode})</div>
      </div>
    </div>
  );

  const renderVoucherInfo = () => (
    <div className="border border-black border-t-0 grid grid-cols-2 divide-x divide-black mb-3 text-[11px] font-mono p-2">
      <div className="space-y-0.5">
        <div>Invoice No: <strong>{invoice.invoiceNumber}</strong></div>
        <div>Dated: <strong>{invoice.date}</strong></div>
        <div>Payment Mode: <strong>{invoice.paymentMode || 'Credit'}</strong></div>
      </div>
      <div className="space-y-0.5">
        <div>Order Ref: <strong>PO-{invoice.invoiceNumber}</strong></div>
        <div>Place of Supply: <strong>{invoice.placeOfSupply}</strong></div>
        <div>Due Date: <strong>{invoice.dueDate || invoice.date}</strong></div>
      </div>
    </div>
  );

  const renderItemsTable = (customHeaderClass = 'bg-gray-100') => (
    <table className="w-full border-collapse border border-black mb-3 text-[11px]">
      <thead>
        <tr className={`border-b-2 border-black ${customHeaderClass} font-bold text-center`}>
          <th className="border-r border-black p-1.5 w-10">S.No</th>
          <th className="border-r border-black p-1.5 text-left">Item Description</th>
          <th className="border-r border-black p-1.5 w-20">HSN/SAC</th>
          <th className="border-r border-black p-1.5 w-16">Qty</th>
          <th className="border-r border-black p-1.5 w-20">Rate</th>
          <th className="border-r border-black p-1.5 w-12">GST</th>
          <th className="p-1.5 text-right w-24">Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        {invoice.items.map((it, idx) => (
          <tr key={idx} className="border-b border-black">
            <td className="border-r border-black p-1.5 text-center font-mono">{idx + 1}</td>
            <td className="border-r border-black p-1.5 font-bold">{it.itemName}</td>
            <td className="border-r border-black p-1.5 text-center font-mono">{it.hsnSac || '-'}</td>
            <td className="border-r border-black p-1.5 text-center font-mono">{it.quantity} {it.unit}</td>
            <td className="border-r border-black p-1.5 text-right font-mono">{formatINR(it.price)}</td>
            <td className="border-r border-black p-1.5 text-center font-mono">{it.taxRate}%</td>
            <td className="p-1.5 text-right font-mono font-bold">{formatINR(it.totalAmount)}</td>
          </tr>
        ))}
        <tr className="border-b-2 border-black font-bold">
          <td colSpan={3} className="border-r border-black p-1.5 text-right">Total Quantity & Subtotal:</td>
          <td className="border-r border-black p-1.5 text-center font-mono">
            {invoice.items.reduce((s, i) => s + i.quantity, 0).toFixed(2)}
          </td>
          <td colSpan={2} className="border-r border-black p-1.5"></td>
          <td className="p-1.5 text-right font-mono">{formatINR(invoice.subTotal)}</td>
        </tr>
      </tbody>
    </table>
  );

  const renderTotalsAndSign = () => (
    <>
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
          <span>GRAND TOTAL:</span>
          <span>₹ {formatINR(invoice.grandTotal)}</span>
        </div>
      </div>

      <div className="border border-black border-t-0 p-2.5 mb-3 text-[11px] space-y-1">
        <div>
          <span className="font-bold">Amount in Words: </span>
          <span className="font-serif italic font-semibold">INR {numberToWordsINR(invoice.grandTotal)} Only</span>
        </div>
        {profile.bankName && (
          <div className="border-t border-black pt-1.5 font-mono text-[10px]">
            <span className="font-bold font-sans">Bank Details:</span> {profile.bankName} | A/c: {profile.accountNo} | IFSC: {profile.ifscCode} | Branch: {profile.branch}
          </div>
        )}
      </div>

      <div className="border border-black border-t-0 p-3 grid grid-cols-2 gap-4 text-[10px]">
        <div>
          <div className="font-bold uppercase">Terms & Conditions:</div>
          <p className="italic text-black mt-0.5">1. Goods once sold will not be taken back.<br/>2. Subject to local jurisdiction.<br/>3. E. & O.E.</p>
          <div className="mt-3 font-mono">PAN: <strong className="font-bold">{profile.pan || 'N/A'}</strong></div>
        </div>
        <div className="text-right flex flex-col justify-between">
          <div className="font-bold uppercase">For {profile.businessName}</div>
          <div className="h-10"></div>
          <div className="border-t border-black pt-1 font-bold">Authorised Signatory</div>
        </div>
      </div>
    </>
  );

  switch (layoutKey) {
    case 'bw_grid_invoice':
      return (
        <div className="border-4 border-black bg-white p-4 sm:p-5 text-xs text-black font-sans">
          {renderHeader('TAX INVOICE - GRID STRUCTURED')}
          {renderPartyBoxes()}
          {renderVoucherInfo()}
          {renderItemsTable('bg-gray-200')}
          {renderTotalsAndSign()}
        </div>
      );

    case 'bw_executive_memo':
      return (
        <div className="border-2 border-black bg-white p-4 sm:p-5 text-xs text-black font-sans">
          <div className="flex justify-between items-start border-b-2 border-black pb-3 mb-3">
            <div>
              <h1 className="text-xl font-black uppercase">{profile.businessName}</h1>
              <p className="text-[11px]">{profile.address}, {profile.city} - {profile.pincode}</p>
              <p className="text-[10px] font-mono mt-1">GSTIN: {profile.gstin || 'N/A'}</p>
            </div>
            <div className="text-right border border-black p-2 font-mono text-[11px]">
              <div className="font-bold uppercase text-xs border-b border-black pb-1 mb-1">MEMO INVOICE</div>
              <div>No: {invoice.invoiceNumber}</div>
              <div>Date: {invoice.date}</div>
              <div>Copy: {copyType}</div>
            </div>
          </div>
          {renderPartyBoxes()}
          {renderItemsTable('bg-gray-100')}
          {renderTotalsAndSign()}
        </div>
      );

    case 'bw_ledger_statement':
      return (
        <div className="border border-black bg-white p-4 sm:p-5 text-xs text-black font-serif">
          {renderHeader('STATEMENT OF ACCOUNT & INVOICE')}
          <div className="border border-black p-3 mb-3 font-sans text-[11px] grid grid-cols-2 gap-2">
            <div><strong>Party:</strong> {invoice.partyName} ({invoice.partyGstin || 'URP'})</div>
            <div><strong>Invoice Ref:</strong> {invoice.invoiceNumber} Dated {invoice.date}</div>
            <div><strong>Address:</strong> {invoice.partyAddress || 'N/A'}</div>
            <div><strong>Place of Supply:</strong> {invoice.placeOfSupply}</div>
          </div>
          {renderItemsTable('bg-gray-200 font-sans')}
          {renderTotalsAndSign()}
        </div>
      );

    case 'bw_compact_commercial':
      return (
        <div className="border-2 border-black bg-white p-3 sm:p-4 text-xs text-black font-sans">
          <div className="border-b border-black pb-2 mb-2 flex justify-between items-end">
            <div>
              <span className="text-[9px] font-mono bg-black text-white px-1 py-0.5 uppercase">B2B COMMERCIAL</span>
              <h1 className="text-lg font-black mt-1">{profile.businessName}</h1>
            </div>
            <div className="text-right font-mono text-[11px]">
              <div><strong>INV:</strong> {invoice.invoiceNumber}</div>
              <div><strong>DATE:</strong> {invoice.date}</div>
            </div>
          </div>
          <div className="border border-black grid grid-cols-2 gap-2 p-2 mb-2 text-[11px] bg-gray-50">
            <div><strong>Billed To:</strong> {invoice.partyName} | GSTIN: {invoice.partyGstin || 'URP'}</div>
            <div><strong>State:</strong> {invoice.partyState} ({invoice.partyStateCode})</div>
          </div>
          {renderItemsTable('bg-gray-100')}
          {renderTotalsAndSign()}
        </div>
      );

    case 'bw_classic_ledger':
      return (
        <div className="border-4 border-black bg-white p-4 sm:p-5 text-xs text-black font-mono">
          <div className="text-center border-b-2 border-black pb-2 mb-3">
            <h1 className="text-lg font-black uppercase">GOVERNMENT REGISTER TAX INVOICE</h1>
            <p className="text-[11px]">{profile.businessName} — GSTIN: {profile.gstin || 'N/A'}</p>
          </div>
          {renderPartyBoxes()}
          {renderItemsTable('bg-gray-200')}
          {renderTotalsAndSign()}
        </div>
      );

    case 'bw_modern_editorial':
      return (
        <div className="border border-black bg-white p-5 sm:p-6 text-xs text-black font-sans">
          <div className="flex justify-between items-start border-b border-black pb-4 mb-4">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tighter">INVOICE</h1>
              <p className="text-[11px] font-mono mt-1">{profile.businessName} ({profile.gstin || 'N/A'})</p>
            </div>
            <div className="text-right font-mono text-xs">
              <div># {invoice.invoiceNumber}</div>
              <div>{invoice.date}</div>
            </div>
          </div>
          <div className="mb-4 text-[11px] pb-3 border-b border-black">
            <div className="font-bold text-[10px] uppercase text-gray-600">BILLED TO:</div>
            <div className="font-bold text-sm">{invoice.partyName}</div>
            <div>{invoice.partyAddress || 'N/A'} | GSTIN: {invoice.partyGstin || 'URP'}</div>
          </div>
          {renderItemsTable('bg-gray-100')}
          {renderTotalsAndSign()}
        </div>
      );

    case 'bw_warehouse_packing':
      return (
        <div className="border-2 border-black bg-white p-4 sm:p-5 text-xs text-black font-mono">
          {renderHeader('WAREHOUSE DISPATCH & TAX INVOICE', 'Industrial Bulk Cargo Sheet')}
          {renderPartyBoxes()}
          <div className="border border-black border-t-0 p-2 mb-3 text-[10px] grid grid-cols-3 gap-2">
            <div>Transport: <strong>By Road</strong></div>
            <div>LR Number: <strong>LR-{invoice.invoiceNumber}</strong></div>
            <div>Weight: <strong>Standard</strong></div>
          </div>
          {renderItemsTable('bg-gray-200')}
          {renderTotalsAndSign()}
        </div>
      );

    case 'bw_consultant_invoice':
      return (
        <div className="border border-black bg-white p-5 sm:p-6 text-xs text-black font-sans">
          <div className="border-b-2 border-black pb-3 mb-4 flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold">{profile.businessName}</h1>
              <p className="text-[10px] text-gray-700">Professional Consultancy & Services</p>
            </div>
            <div className="text-right font-mono text-xs">
              <div className="font-bold text-sm">TAX INVOICE</div>
              <div>Invoice #: {invoice.invoiceNumber}</div>
              <div>Date: {invoice.date}</div>
            </div>
          </div>
          {renderPartyBoxes()}
          {renderItemsTable('bg-gray-100')}
          {renderTotalsAndSign()}
        </div>
      );

    case 'bw_audit_compliant':
      return (
        <div className="border-4 border-black bg-white p-4 sm:p-5 text-xs text-black font-mono">
          <div className="text-center border-b-2 border-black pb-3 mb-3">
            <div className="text-[9px] bg-black text-white px-2 py-0.5 inline-block uppercase font-bold mb-1">AUDIT COMPLIANT STMT</div>
            <h1 className="text-xl font-black uppercase">{profile.businessName}</h1>
            <p className="text-[11px]">{profile.address} | GSTIN: {profile.gstin || 'N/A'}</p>
          </div>
          {renderPartyBoxes()}
          {renderVoucherInfo()}
          {renderItemsTable('bg-gray-200')}
          {renderTotalsAndSign()}
        </div>
      );

    case 'bw_mono_datamatrix':
      return (
        <div className="border-2 border-dashed border-black bg-white p-4 sm:p-5 text-xs text-black font-mono">
          <div className="border-b border-black pb-2 mb-3 text-center">
            <h1 className="text-lg font-bold uppercase">[ MONOSPACE DATA LEDGER INVOICE ]</h1>
            <p className="text-[10px]">{profile.businessName} | GSTIN: {profile.gstin || 'N/A'}</p>
          </div>
          {renderPartyBoxes()}
          {renderItemsTable('bg-gray-100')}
          {renderTotalsAndSign()}
        </div>
      );

    default:
      return (
        <div className="border border-black bg-white p-4 text-xs font-sans">
          {renderHeader('TAX INVOICE')}
          {renderPartyBoxes()}
          {renderItemsTable()}
          {renderTotalsAndSign()}
        </div>
      );
  }
};
