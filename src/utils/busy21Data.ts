import * as XLSX from 'xlsx';
import { Party, InventoryItem, Invoice, BusinessProfile, InvoiceItem, UnitType } from '../types';

/**
 * Busy 21 XML, Excel (.xlsx/.xls), CSV & TSV Universal Data Sync Utilities
 * Robust bidirectional data engine for Busy 21 Accounting Software.
 * Exports COMPLETE details for every Party, Item, and Voucher.
 */

const VALID_UNITS: UnitType[] = ['PCS', 'BOX', 'KGS', 'MTR', 'NOS', 'SET', 'LTR', 'PKT'];

export function normalizeUnit(val?: string): UnitType {
  const upper = (val || '').toUpperCase().trim();
  if (VALID_UNITS.includes(upper as UnitType)) return upper as UnitType;
  if (upper.includes('BOX') || upper.includes('CTN') || upper.includes('CARTON')) return 'BOX';
  if (upper.includes('KG') || upper.includes('KILO') || upper.includes('GRAM')) return 'KGS';
  if (upper.includes('MTR') || upper.includes('METER') || upper.includes('YARD')) return 'MTR';
  if (upper.includes('NO') || upper.includes('PIECE') || upper.includes('PC')) return 'NOS';
  if (upper.includes('SET') || upper.includes('KIT')) return 'SET';
  if (upper.includes('LTR') || upper.includes('LITRE') || upper.includes('ML')) return 'LTR';
  if (upper.includes('PKT') || upper.includes('PACK') || upper.includes('POUCH')) return 'PKT';
  return 'PCS';
}

export interface Busy21ParsedData {
  firmName?: string;
  busyVersion?: string;
  parties: Party[];
  items: InventoryItem[];
  invoices: Invoice[];
  formatDetected: 'xml' | 'csv' | 'json' | 'tsv' | 'excel' | 'mixed';
  summary: {
    partiesCount: number;
    itemsCount: number;
    invoicesCount: number;
  };
}

/**
 * Robust text file downloader with Data URI fallback for strict iframe security
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain') {
  try {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 200);
  } catch (e) {
    try {
      const dataUri = `data:${mimeType};charset=utf-8,` + encodeURIComponent(content);
      const link = document.createElement('a');
      link.href = dataUri;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => document.body.removeChild(link), 200);
    } catch (err2) {
      console.error('Download failed, relying on clipboard copy', err2);
    }
  }
}

/**
 * Binary file downloader for Excel (.xlsx) files
 */
export function downloadBinaryFile(
  buffer: ArrayBuffer | Uint8Array,
  filename: string,
  mimeType: string = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
) {
  try {
    const blob = new Blob([buffer as any], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 200);
  } catch (e) {
    console.error('Binary download failed', e);
  }
}

/**
 * Consolidate and harvest all Parties across master records and all invoices
 * Ensures that no party is ever missing or lacking details during export
 */
export function getConsolidatedParties(parties: Party[] = [], invoices: Invoice[] = []): Party[] {
  const partyMap = new Map<string, Party>();

  // 1. Index master parties
  parties.forEach(p => {
    if (p.id) partyMap.set(p.id.toLowerCase(), { ...p });
    if (p.name) partyMap.set(p.name.toLowerCase().trim(), { ...p });
    if (p.gstin) partyMap.set(p.gstin.toUpperCase().trim(), { ...p });
  });

  // 2. Harvest all party details present on invoices
  invoices.forEach((inv, idx) => {
    const nameKey = (inv.partyName || '').toLowerCase().trim();
    if (!nameKey) return;

    const existing = partyMap.get(nameKey) || (inv.partyId ? partyMap.get(inv.partyId.toLowerCase()) : undefined);
    const cleanGstin = (inv.partyGstin || '').trim().toUpperCase();
    const pan = cleanGstin.length === 15 ? cleanGstin.substring(2, 12) : '';
    const stateCode = inv.partyStateCode || (cleanGstin.length === 15 ? cleanGstin.substring(0, 2) : '27');
    const isSupplier = inv.type === 'purchase';

    if (existing) {
      if (!existing.phone && inv.partyPhone) existing.phone = inv.partyPhone;
      if (!existing.gstin && cleanGstin) existing.gstin = cleanGstin;
      if (!existing.pan && pan) existing.pan = pan;
      if (!existing.billingAddress && inv.partyAddress) existing.billingAddress = inv.partyAddress;
      if (!existing.shippingAddress && inv.partyAddress) existing.shippingAddress = inv.partyAddress;
      if (!existing.state && inv.partyState) existing.state = inv.partyState;
      if (!existing.stateCode && stateCode) existing.stateCode = stateCode;
    } else {
      const newP: Party = {
        id: inv.partyId || `party-inv-${Date.now()}-${idx}`,
        name: inv.partyName,
        type: isSupplier ? 'supplier' : 'customer',
        gstin: cleanGstin,
        pan,
        phone: inv.partyPhone || '',
        email: '',
        billingAddress: inv.partyAddress || '',
        shippingAddress: inv.partyAddress || '',
        city: '',
        state: inv.partyState || 'Maharashtra',
        stateCode,
        pincode: '',
        openingBalance: 0,
        balanceType: isSupplier ? 'to_pay' : 'to_receive',
        currentBalance: inv.balanceDue || 0,
        creditLimit: 0,
        notes: `Imported from ${inv.invoiceNumber}`,
        createdAt: inv.date || new Date().toISOString().split('T')[0],
      };
      partyMap.set(nameKey, newP);
      if (newP.id) partyMap.set(newP.id.toLowerCase(), newP);
    }
  });

  // Deduplicate unique parties
  const seen = new Set<string>();
  const result: Party[] = [];
  for (const p of partyMap.values()) {
    const key = (p.name || '').toLowerCase().trim();
    if (key && !seen.has(key)) {
      seen.add(key);
      result.push(p);
    }
  }
  return result;
}

/**
 * Consolidate and harvest all Items across master inventory and all invoices
 * Ensures that no item is ever missing or lacking details during export
 */
export function getConsolidatedItems(items: InventoryItem[] = [], invoices: Invoice[] = []): InventoryItem[] {
  const itemMap = new Map<string, InventoryItem>();

  // 1. Index master items
  items.forEach(it => {
    if (it.id) itemMap.set(it.id.toLowerCase(), { ...it });
    if (it.name) itemMap.set(it.name.toLowerCase().trim(), { ...it });
    if (it.itemCode) itemMap.set(it.itemCode.toLowerCase().trim(), { ...it });
  });

  // 2. Harvest items present on invoices
  invoices.forEach(inv => {
    (inv.items || []).forEach((line, idx) => {
      const nameKey = (line.itemName || '').toLowerCase().trim();
      if (!nameKey) return;

      const existing = itemMap.get(nameKey) || (line.itemId ? itemMap.get(line.itemId.toLowerCase()) : undefined);
      if (existing) {
        if (!existing.hsnSac && line.hsnSac) existing.hsnSac = line.hsnSac;
        if (!existing.sellingPrice && line.price) existing.sellingPrice = line.price;
        if (!existing.unit && line.unit) existing.unit = line.unit;
        if (!existing.taxRate && line.taxRate) existing.taxRate = line.taxRate;
      } else {
        const salePrice = Number(line.price || 0);
        const costPrice = Number((salePrice * 0.75).toFixed(2));
        const newItem: InventoryItem = {
          id: line.itemId || `itm-inv-${Date.now()}-${idx}`,
          name: line.itemName,
          itemCode: `ITM-${1000 + itemMap.size}`,
          category: 'General',
          unit: line.unit || 'PCS',
          sellingPrice: salePrice,
          purchasePrice: costPrice,
          taxRate: Number(line.taxRate !== undefined ? line.taxRate : 18),
          taxInclusive: false,
          hsnSac: line.hsnSac || '',
          openingStock: 10,
          currentStock: 10,
          minStockAlert: 5,
          location: 'Main Warehouse',
          description: line.itemName,
          updatedAt: inv.date || new Date().toISOString().split('T')[0],
        };
        itemMap.set(nameKey, newItem);
        if (newItem.id) itemMap.set(newItem.id.toLowerCase(), newItem);
      }
    });
  });

  const seen = new Set<string>();
  const result: InventoryItem[] = [];
  for (const it of itemMap.values()) {
    const key = (it.name || '').toLowerCase().trim();
    if (key && !seen.has(key)) {
      seen.add(key);
      result.push(it);
    }
  }
  return result;
}

/**
 * Helper to build comprehensive Party detail object for export with ALL attributes
 */
export function buildPartyExportRow(p: Party, index: number = 0) {
  const isSupplier = p.type === 'supplier';
  const gstinClean = (p.gstin || '').trim().toUpperCase();
  const derivedPan = (p.pan || '').trim().toUpperCase() || (gstinClean.length === 15 ? gstinClean.substring(2, 12) : '');
  const derivedStateCode = p.stateCode || (gstinClean.length === 15 ? gstinClean.substring(0, 2) : '27');

  let derivedPincode = p.pincode || '';
  if (!derivedPincode && p.billingAddress) {
    const pinMatch = p.billingAddress.match(/\b\d{6}\b/);
    if (pinMatch) derivedPincode = pinMatch[0];
  }

  let derivedCity = p.city || '';
  if (!derivedCity && p.billingAddress) {
    const parts = p.billingAddress.split(',').map(s => s.trim());
    if (parts.length >= 2) {
      derivedCity = parts[parts.length - 2] || parts[parts.length - 1];
    }
  }

  const shippingAddr = p.shippingAddress || p.billingAddress || '';
  const opBal = Number(p.openingBalance || 0);
  const currBal = Number(p.currentBalance !== undefined ? p.currentBalance : opBal);
  const balType = p.balanceType
    ? (p.balanceType === 'to_pay' ? 'Cr (To Pay)' : 'Dr (To Receive)')
    : (currBal >= 0 ? 'Dr (To Receive)' : 'Cr (To Pay)');

  const gstRegType = gstinClean.length === 15
    ? 'Regular Registered Taxpayer'
    : gstinClean.length > 0
    ? 'Composition / Special'
    : 'Unregistered Consumer';

  return {
    'Party ID': p.id || `PRT-${1000 + index}`,
    'Account Name': p.name || 'Unnamed Party',
    'Print Name': p.name || 'Unnamed Party',
    'Parent Group': isSupplier ? 'Sundry Creditors' : 'Sundry Debtors',
    'Party Type': isSupplier ? 'Supplier / Vendor' : 'Customer',
    'GST Registration Type': gstRegType,
    'GSTIN': gstinClean,
    'PAN': derivedPan,
    'Mobile No': p.phone || '',
    'Email ID': p.email || '',
    'Billing Address': p.billingAddress || '',
    'Shipping Address': shippingAddr,
    'City': derivedCity || '',
    'State': p.state || 'Maharashtra',
    'State Code': derivedStateCode,
    'Pincode': derivedPincode,
    'Country': 'India',
    'Opening Balance (₹)': opBal,
    'Balance Type': balType,
    'Current Balance (₹)': currBal,
    'Credit Limit (₹)': Number(p.creditLimit || 0),
    'Credit Period (Days)': 30,
    'Reverse Charge Applicable': 'No',
    'Notes / Remarks': p.notes || '',
    'Created At': p.createdAt || new Date().toISOString().split('T')[0],
  };
}

/**
 * Helper to build comprehensive Inventory Item detail object for export with ALL attributes
 */
export function buildItemExportRow(it: InventoryItem, index: number = 0) {
  const itemCode = it.itemCode || `ITM-${1000 + index}`;
  const saleRate = Number(it.sellingPrice || 0);
  const costRate = Number(it.purchasePrice || 0) || Number((saleRate * 0.75).toFixed(2));
  const mrp = Number((saleRate * 1.1).toFixed(2));
  const currentStock = Number(it.currentStock || 0);
  const minStock = Number(it.minStockAlert !== undefined ? it.minStockAlert : 5);
  const opStock = Number(it.openingStock !== undefined ? it.openingStock : currentStock);

  const stockValCost = Number((currentStock * costRate).toFixed(2));
  const stockValSale = Number((currentStock * saleRate).toFixed(2));
  const potentialProfit = Number((stockValSale - stockValCost).toFixed(2));
  const profitMarginUnit = Number((saleRate - costRate).toFixed(2));
  const profitMarginPct = costRate > 0 ? Number(((profitMarginUnit / costRate) * 100).toFixed(1)) : 0;

  const stockStatus =
    currentStock <= 0
      ? 'Out of Stock'
      : currentStock <= minStock
      ? 'Low Stock Alert'
      : 'In Stock';

  return {
    'Item ID': it.id || `ITM-ID-${1000 + index}`,
    'Item Code': itemCode,
    'Item Name': it.name || 'Unnamed Item',
    'Print Name': it.name || 'Unnamed Item',
    'Item Group / Category': it.category || 'General',
    'Main Unit': it.unit || 'PCS',
    'Alternate Unit': it.unit || 'PCS',
    'Conversion Factor': 1,
    'HSN / SAC Code': it.hsnSac || '',
    'Sale Price / Rate (₹)': saleRate,
    'Purchase / Cost Price (₹)': costRate,
    'MRP (₹)': mrp,
    'Profit Margin per Unit (₹)': profitMarginUnit,
    'Profit Margin (%)': profitMarginPct,
    'Tax Rate (%)': Number(it.taxRate !== undefined ? it.taxRate : 18),
    'Tax Calculation': it.taxInclusive ? 'Inclusive of Tax' : 'Exclusive of Tax',
    'Opening Stock (Units)': opStock,
    'Opening Stock Value at Cost (₹)': Number((opStock * costRate).toFixed(2)),
    'Current Stock (Units)': currentStock,
    'Min Stock Alert Level': minStock,
    'Stock Status': stockStatus,
    'Total Stock Value at Cost (₹)': stockValCost,
    'Total Stock Value at Sale (₹)': stockValSale,
    'Potential Profit on Stock (₹)': potentialProfit,
    'Storage Location / Godown': it.location || 'Main Warehouse',
    'Description / Specs': it.description || '',
    'Last Updated': it.updatedAt || new Date().toISOString().split('T')[0],
  };
}

/**
 * Helper to build comprehensive Voucher line detail object with ALL Party, Item, and Financial details
 */
export function buildVoucherExportRows(
  invoices: Invoice[],
  parties: Party[] = [],
  items: InventoryItem[] = []
): any[] {
  const rows: any[] = [];

  const consolidatedParties = getConsolidatedParties(parties, invoices);
  const consolidatedItems = getConsolidatedItems(items, invoices);

  // Index parties for O(1) enrichment lookup
  const partyMap = new Map<string, Party>();
  consolidatedParties.forEach(p => {
    if (p.id) partyMap.set(p.id.toLowerCase(), p);
    if (p.name) partyMap.set(p.name.toLowerCase().trim(), p);
    if (p.gstin) partyMap.set(p.gstin.toUpperCase().trim(), p);
  });

  // Index items for O(1) enrichment lookup
  const itemMap = new Map<string, InventoryItem>();
  consolidatedItems.forEach(it => {
    if (it.id) itemMap.set(it.id.toLowerCase(), it);
    if (it.name) itemMap.set(it.name.toLowerCase().trim(), it);
    if (it.itemCode) itemMap.set(it.itemCode.toLowerCase().trim(), it);
  });

  invoices.forEach((inv, vchIdx) => {
    const vchType =
      inv.type === 'sale'
        ? 'Sales'
        : inv.type === 'purchase'
        ? 'Purchase'
        : inv.type === 'quotation'
        ? 'Quotation'
        : inv.type === 'delivery_challan'
        ? 'Delivery Challan'
        : 'Voucher';

    // Enrich party information
    const matchedParty =
      partyMap.get((inv.partyId || '').toLowerCase()) ||
      partyMap.get((inv.partyName || '').toLowerCase().trim()) ||
      (inv.partyGstin ? partyMap.get(inv.partyGstin.toUpperCase().trim()) : undefined);

    const partyType = matchedParty?.type === 'supplier' || inv.type === 'purchase' ? 'Supplier' : 'Customer';
    const partyGroup = partyType === 'Supplier' ? 'Sundry Creditors' : 'Sundry Debtors';
    const partyPhone = inv.partyPhone || matchedParty?.phone || '';
    const partyEmail = matchedParty?.email || '';
    const partyGstin = (inv.partyGstin || matchedParty?.gstin || '').trim().toUpperCase();
    const partyPan = matchedParty?.pan || (partyGstin.length === 15 ? partyGstin.substring(2, 12) : '');
    const partyBillingAddr = inv.partyAddress || matchedParty?.billingAddress || '';
    const partyShippingAddr = matchedParty?.shippingAddress || partyBillingAddr;
    const partyCity = matchedParty?.city || '';
    const partyState = inv.partyState || matchedParty?.state || 'Maharashtra';
    const partyStateCode = inv.partyStateCode || matchedParty?.stateCode || (partyGstin.length === 15 ? partyGstin.substring(0, 2) : '27');
    const partyPincode = matchedParty?.pincode || '';
    const partyCurrBal = matchedParty ? Number(matchedParty.currentBalance || 0) : Number(inv.balanceDue || 0);
    const partyOpBal = matchedParty ? Number(matchedParty.openingBalance || 0) : 0;
    const partyCreditLimit = matchedParty ? Number(matchedParty.creditLimit || 0) : 0;

    const baseVoucherInfo = {
      'Voucher Type': vchType,
      'Voucher No': inv.invoiceNumber,
      'Invoice Date': inv.date,
      'Due Date': inv.dueDate || inv.date,
      'Payment Mode': inv.paymentMode || 'Cash',
      'Payment Status': inv.status || 'Paid',
      'Paid Amount (₹)': Number(inv.paidAmount || 0),
      'Balance Due (₹)': Number(inv.balanceDue || 0),
      'PO Number': inv.poNumber || '',
      'PO Date': inv.poDate || '',
      'E-Way Bill No': inv.ewayBillNo || '',
      'Vehicle No': inv.vehicleNo || '',

      // Complete Party Details
      'Party ID': inv.partyId || matchedParty?.id || `PRT-${1000 + vchIdx}`,
      'Party Name': inv.partyName,
      'Party Print Name': matchedParty?.name || inv.partyName,
      'Party Parent Group': partyGroup,
      'Party Type': partyType,
      'Party Mobile No': partyPhone,
      'Party Email ID': partyEmail,
      'Party GSTIN': partyGstin,
      'Party PAN': partyPan,
      'Party Billing Address': partyBillingAddr,
      'Party Shipping Address': partyShippingAddr,
      'Party City': partyCity,
      'Party State': partyState,
      'Party State Code': partyStateCode,
      'Party Pincode': partyPincode,
      'Place of Supply': inv.placeOfSupply || `${partyState} (${partyStateCode})`,
      'Place of Supply Code': inv.placeOfSupplyCode || partyStateCode,
      'GST Supply Type': inv.gstType || 'Intra-State (CGST + SGST)',
      'Reverse Charge': inv.reverseCharge ? 'Yes' : 'No',
      'Party Opening Balance (₹)': partyOpBal,
      'Party Current Balance (₹)': partyCurrBal,
      'Party Credit Limit (₹)': partyCreditLimit,
    };

    if (!inv.items || inv.items.length === 0) {
      rows.push({
        ...baseVoucherInfo,
        // Line Item Details Fallback
        'Item ID': 'ITM-GEN-01',
        'Item Code': 'ITM-1001',
        'Item Name': 'General Goods / Services',
        'Item Print Name': 'General Goods / Services',
        'Item Category / Group': 'General',
        'Item Description': 'As per Invoice',
        'HSN / SAC Code': '9983',
        'Quantity': 1,
        'Unit': 'PCS',
        'Price per Unit (₹)': Number(inv.grandTotal || 0),
        'Cost Price per Unit (₹)': Number(((inv.grandTotal || 0) * 0.75).toFixed(2)),
        'Gross Item Total (₹)': Number(inv.grandTotal || 0),
        'Discount (%)': 0,
        'Discount Amount (₹)': 0,
        'Taxable Value (₹)': Number(inv.totalTaxable || inv.grandTotal || 0),
        'GST Rate (%)': 0,
        'CGST Rate (%)': 0,
        'CGST Amount (₹)': 0,
        'SGST Rate (%)': 0,
        'SGST Amount (₹)': 0,
        'IGST Rate (%)': 0,
        'IGST Amount (₹)': 0,
        'Item Total (₹)': Number(inv.grandTotal || 0),
        'Profit per Unit (₹)': Number(((inv.grandTotal || 0) * 0.25).toFixed(2)),
        'Total Line Profit (₹)': Number(((inv.grandTotal || 0) * 0.25).toFixed(2)),
        'Available Stock': 10,
        'Storage Location': 'Main Warehouse',

        // Invoice Totals
        'Invoice SubTotal (₹)': Number(inv.subTotal || inv.grandTotal || 0),
        'Invoice Total Discount (₹)': Number(inv.totalDiscount || 0),
        'Invoice Total Taxable (₹)': Number(inv.totalTaxable || inv.grandTotal || 0),
        'Invoice Total Tax (₹)': Number(inv.totalTax || 0),
        'Invoice Round Off (₹)': Number(inv.roundOff || 0),
        'Invoice Grand Total (₹)': Number(inv.grandTotal || 0),
        'Notes / Remarks': inv.notes || '',
        'Terms & Conditions': inv.terms || '',
      });
    } else {
      inv.items.forEach((line, lineIdx) => {
        const matchedItem =
          itemMap.get((line.itemId || '').toLowerCase()) ||
          itemMap.get((line.itemName || '').toLowerCase().trim());

        const itCode = matchedItem?.itemCode || `ITM-${1000 + lineIdx}`;
        const itCategory = matchedItem?.category || 'General';
        const itDesc = matchedItem?.description || line.itemName;
        const itPrice = Number(line.price || 0);
        const itCostPrice = matchedItem ? Number(matchedItem.purchasePrice || 0) : Number((itPrice * 0.75).toFixed(2));
        const itCurrentStock = matchedItem ? Number(matchedItem.currentStock || 0) : 10;
        const itLocation = matchedItem?.location || 'Main Warehouse';
        const itQty = Number(line.quantity || 1);
        const grossItemTotal = Number((itQty * itPrice).toFixed(2));
        const discPct = Number(line.discountPercent || 0);
        const discAmt = Number(line.discountAmount || 0);
        const taxableVal = Number(line.taxableAmount || (grossItemTotal - discAmt).toFixed(2));
        const lineTotal = Number(line.totalAmount || taxableVal);
        const profitUnit = Number((itPrice - itCostPrice).toFixed(2));
        const totalProfitLine = Number((profitUnit * itQty).toFixed(2));

        rows.push({
          ...baseVoucherInfo,
          // Complete Item Details
          'Item ID': line.itemId || matchedItem?.id || `ITM-ID-${1000 + lineIdx}`,
          'Item Code': itCode,
          'Item Name': line.itemName || '',
          'Item Print Name': matchedItem?.name || line.itemName || '',
          'Item Category / Group': itCategory,
          'Item Description': itDesc,
          'HSN / SAC Code': line.hsnSac || matchedItem?.hsnSac || '',
          'Quantity': itQty,
          'Unit': line.unit || matchedItem?.unit || 'PCS',
          'Price per Unit (₹)': itPrice,
          'Cost Price per Unit (₹)': itCostPrice,
          'Gross Item Total (₹)': grossItemTotal,
          'Discount (%)': discPct,
          'Discount Amount (₹)': discAmt,
          'Taxable Value (₹)': taxableVal,
          'GST Rate (%)': Number(line.taxRate || 0),
          'CGST Rate (%)': Number(line.cgstRate || 0),
          'CGST Amount (₹)': Number(line.cgstAmount || 0),
          'SGST Rate (%)': Number(line.sgstRate || 0),
          'SGST Amount (₹)': Number(line.sgstAmount || 0),
          'IGST Rate (%)': Number(line.igstRate || 0),
          'IGST Amount (₹)': Number(line.igstAmount || 0),
          'Item Total (₹)': lineTotal,
          'Profit per Unit (₹)': profitUnit,
          'Total Line Profit (₹)': totalProfitLine,
          'Available Stock': itCurrentStock,
          'Storage Location': itLocation,

          // Invoice Totals
          'Invoice SubTotal (₹)': Number(inv.subTotal || 0),
          'Invoice Total Discount (₹)': Number(inv.totalDiscount || 0),
          'Invoice Total Taxable (₹)': Number(inv.totalTaxable || 0),
          'Invoice CGST Total (₹)': Number(inv.cgstTotal || 0),
          'Invoice SGST Total (₹)': Number(inv.sgstTotal || 0),
          'Invoice IGST Total (₹)': Number(inv.igstTotal || 0),
          'Invoice Total Tax (₹)': Number(inv.totalTax || 0),
          'Invoice Round Off (₹)': Number(inv.roundOff || 0),
          'Invoice Grand Total (₹)': Number(inv.grandTotal || 0),
          'Notes / Remarks': inv.notes || '',
          'Terms & Conditions': inv.terms || '',
        });
      });
    }
  });

  return rows;
}

/**
 * Generate standard Busy 21 XML export with ALL Party, Item, and Voucher details
 */
export function generateBusy21Xml(
  profile: BusinessProfile,
  parties: Party[],
  items: InventoryItem[],
  invoices: Invoice[]
): string {
  const escapeXml = (unsafe: string | number | undefined | null) => {
    if (unsafe === undefined || unsafe === null) return '';
    return String(unsafe)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const consolidatedParties = getConsolidatedParties(parties, invoices);
  const consolidatedItems = getConsolidatedItems(items, invoices);
  const nowIso = new Date().toISOString();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<BUSYDATA Version="21.0" ExportDate="${nowIso}" Generator="SKT Billing Enterprise">\n`;

  // Company Profile
  xml += `  <COMPANY>\n`;
  xml += `    <NAME>${escapeXml(profile.businessName || 'My Business')}</NAME>\n`;
  xml += `    <TAGLINE>${escapeXml(profile.tagline)}</TAGLINE>\n`;
  xml += `    <GSTIN>${escapeXml(profile.gstin)}</GSTIN>\n`;
  xml += `    <PAN>${escapeXml(profile.pan)}</PAN>\n`;
  xml += `    <ADDRESS>${escapeXml(profile.address)}</ADDRESS>\n`;
  xml += `    <CITY>${escapeXml(profile.city)}</CITY>\n`;
  xml += `    <STATE>${escapeXml(profile.state || 'Maharashtra')}</STATE>\n`;
  xml += `    <STATE_CODE>${escapeXml(profile.stateCode || '27')}</STATE_CODE>\n`;
  xml += `    <PINCODE>${escapeXml(profile.pincode)}</PINCODE>\n`;
  xml += `    <PHONE>${escapeXml(profile.phone)}</PHONE>\n`;
  xml += `    <EMAIL>${escapeXml(profile.email)}</EMAIL>\n`;
  xml += `    <BANK_NAME>${escapeXml(profile.bankName)}</BANK_NAME>\n`;
  xml += `    <ACCOUNT_NO>${escapeXml(profile.accountNo)}</ACCOUNT_NO>\n`;
  xml += `    <IFSC>${escapeXml(profile.ifscCode)}</IFSC>\n`;
  xml += `    <BRANCH>${escapeXml(profile.branch)}</BRANCH>\n`;
  xml += `    <UPI_ID>${escapeXml(profile.upiId)}</UPI_ID>\n`;
  xml += `  </COMPANY>\n`;

  // Masters: Accounts (Parties) with ALL attributes
  xml += `  <MASTERS>\n`;
  xml += `    <ACCOUNTS>\n`;
  consolidatedParties.forEach(p => {
    const parentGroup = p.type === 'supplier' ? 'Sundry Creditors' : 'Sundry Debtors';
    const balType = p.currentBalance >= 0 ? 'Dr' : 'Cr';
    const pan = p.pan || (p.gstin && p.gstin.length === 15 ? p.gstin.substring(2, 12) : '');
    xml += `      <ACCOUNT>\n`;
    xml += `        <ID>${escapeXml(p.id)}</ID>\n`;
    xml += `        <NAME>${escapeXml(p.name)}</NAME>\n`;
    xml += `        <PRINTNAME>${escapeXml(p.name)}</PRINTNAME>\n`;
    xml += `        <ALIAS>${escapeXml(p.name)}</ALIAS>\n`;
    xml += `        <GROUP>${escapeXml(parentGroup)}</GROUP>\n`;
    xml += `        <PARTY_TYPE>${escapeXml(p.type)}</PARTY_TYPE>\n`;
    xml += `        <GSTIN>${escapeXml(p.gstin || '')}</GSTIN>\n`;
    xml += `        <PAN>${escapeXml(pan)}</PAN>\n`;
    xml += `        <MOBILE>${escapeXml(p.phone || '')}</MOBILE>\n`;
    xml += `        <PHONE>${escapeXml(p.phone || '')}</PHONE>\n`;
    xml += `        <EMAIL>${escapeXml(p.email || '')}</EMAIL>\n`;
    xml += `        <ADDRESS>${escapeXml(p.billingAddress || '')}</ADDRESS>\n`;
    xml += `        <BILLING_ADDRESS>${escapeXml(p.billingAddress || '')}</BILLING_ADDRESS>\n`;
    xml += `        <SHIPPING_ADDRESS>${escapeXml(p.shippingAddress || p.billingAddress || '')}</SHIPPING_ADDRESS>\n`;
    xml += `        <CITY>${escapeXml(p.city || '')}</CITY>\n`;
    xml += `        <STATE>${escapeXml(p.state || 'Maharashtra')}</STATE>\n`;
    xml += `        <STATE_CODE>${escapeXml(p.stateCode || '27')}</STATE_CODE>\n`;
    xml += `        <PINCODE>${escapeXml(p.pincode || '')}</PINCODE>\n`;
    xml += `        <COUNTRY>India</COUNTRY>\n`;
    xml += `        <OP_BAL>${Number(p.openingBalance || 0).toFixed(2)}</OP_BAL>\n`;
    xml += `        <CURR_BAL>${Number(p.currentBalance || 0).toFixed(2)}</CURR_BAL>\n`;
    xml += `        <BAL_TYPE>${balType}</BAL_TYPE>\n`;
    xml += `        <CREDIT_LIMIT>${Number(p.creditLimit || 0).toFixed(2)}</CREDIT_LIMIT>\n`;
    xml += `        <NOTES>${escapeXml(p.notes || '')}</NOTES>\n`;
    xml += `        <CREATED_AT>${escapeXml(p.createdAt || '')}</CREATED_AT>\n`;
    xml += `      </ACCOUNT>\n`;
  });
  xml += `    </ACCOUNTS>\n`;

  // Masters: Items (Inventory) with ALL attributes
  xml += `    <ITEMS>\n`;
  consolidatedItems.forEach(it => {
    const costPrice = it.purchasePrice || Number((it.sellingPrice * 0.75).toFixed(2));
    const mrp = Number((it.sellingPrice * 1.1).toFixed(2));
    xml += `      <ITEM>\n`;
    xml += `        <ID>${escapeXml(it.id)}</ID>\n`;
    xml += `        <CODE>${escapeXml(it.itemCode || '')}</CODE>\n`;
    xml += `        <ITEM_CODE>${escapeXml(it.itemCode || '')}</ITEM_CODE>\n`;
    xml += `        <NAME>${escapeXml(it.name)}</NAME>\n`;
    xml += `        <PRINTNAME>${escapeXml(it.name)}</PRINTNAME>\n`;
    xml += `        <ALIAS>${escapeXml(it.name)}</ALIAS>\n`;
    xml += `        <GROUP>${escapeXml(it.category || 'General')}</GROUP>\n`;
    xml += `        <CATEGORY>${escapeXml(it.category || 'General')}</CATEGORY>\n`;
    xml += `        <UNIT>${escapeXml(it.unit || 'PCS')}</UNIT>\n`;
    xml += `        <MAIN_UNIT>${escapeXml(it.unit || 'PCS')}</MAIN_UNIT>\n`;
    xml += `        <SALE_PRICE>${Number(it.sellingPrice || 0).toFixed(2)}</SALE_PRICE>\n`;
    xml += `        <PURCHASE_PRICE>${Number(costPrice).toFixed(2)}</PURCHASE_PRICE>\n`;
    xml += `        <MRP>${Number(mrp).toFixed(2)}</MRP>\n`;
    xml += `        <TAX_RATE>${Number(it.taxRate || 0).toFixed(2)}</TAX_RATE>\n`;
    xml += `        <TAX_INCLUSIVE>${it.taxInclusive ? 'Y' : 'N'}</TAX_INCLUSIVE>\n`;
    xml += `        <HSN_CODE>${escapeXml(it.hsnSac || '')}</HSN_CODE>\n`;
    xml += `        <HSN_SAC>${escapeXml(it.hsnSac || '')}</HSN_SAC>\n`;
    xml += `        <OP_STOCK>${Number(it.openingStock || 0).toFixed(2)}</OP_STOCK>\n`;
    xml += `        <CURRENT_STOCK>${Number(it.currentStock || 0).toFixed(2)}</CURRENT_STOCK>\n`;
    xml += `        <MIN_STOCK>${Number(it.minStockAlert || 5).toFixed(2)}</MIN_STOCK>\n`;
    xml += `        <LOCATION>${escapeXml(it.location || 'Main Warehouse')}</LOCATION>\n`;
    xml += `        <DESCRIPTION>${escapeXml(it.description || '')}</DESCRIPTION>\n`;
    xml += `        <UPDATED_AT>${escapeXml(it.updatedAt || '')}</UPDATED_AT>\n`;
    xml += `      </ITEM>\n`;
  });
  xml += `    </ITEMS>\n`;
  xml += `  </MASTERS>\n`;

  // Transactions: Vouchers (Sales & Purchases) with ALL Party & Item details
  xml += `  <TRANSACTIONS>\n`;
  xml += `    <VOUCHERS>\n`;
  invoices.forEach(inv => {
    const vchType =
      inv.type === 'sale'
        ? 'Sales'
        : inv.type === 'purchase'
        ? 'Purchase'
        : inv.type === 'quotation'
        ? 'Quotation'
        : 'Challan';

    const matchedParty = consolidatedParties.find(
      p => p.id === inv.partyId || p.name.toLowerCase() === inv.partyName.toLowerCase()
    );

    const partyGstin = inv.partyGstin || matchedParty?.gstin || '';
    const partyPan = matchedParty?.pan || (partyGstin.length === 15 ? partyGstin.substring(2, 12) : '');

    xml += `      <VOUCHER>\n`;
    xml += `        <ID>${escapeXml(inv.id)}</ID>\n`;
    xml += `        <TYPE>${escapeXml(vchType)}</TYPE>\n`;
    xml += `        <VCH_NO>${escapeXml(inv.invoiceNumber)}</VCH_NO>\n`;
    xml += `        <DATE>${escapeXml(inv.date)}</DATE>\n`;
    xml += `        <DUE_DATE>${escapeXml(inv.dueDate || inv.date)}</DUE_DATE>\n`;

    // Complete Party details in Voucher
    xml += `        <PARTY_ID>${escapeXml(inv.partyId || matchedParty?.id || '')}</PARTY_ID>\n`;
    xml += `        <PARTY_NAME>${escapeXml(inv.partyName)}</PARTY_NAME>\n`;
    xml += `        <PARTY_PRINT_NAME>${escapeXml(matchedParty?.name || inv.partyName)}</PARTY_PRINT_NAME>\n`;
    xml += `        <PARTY_TYPE>${escapeXml(matchedParty?.type || (inv.type === 'purchase' ? 'supplier' : 'customer'))}</PARTY_TYPE>\n`;
    xml += `        <PARTY_GSTIN>${escapeXml(partyGstin)}</PARTY_GSTIN>\n`;
    xml += `        <PARTY_PAN>${escapeXml(partyPan)}</PARTY_PAN>\n`;
    xml += `        <PARTY_PHONE>${escapeXml(inv.partyPhone || matchedParty?.phone || '')}</PARTY_PHONE>\n`;
    xml += `        <PARTY_EMAIL>${escapeXml(matchedParty?.email || '')}</PARTY_EMAIL>\n`;
    xml += `        <PARTY_ADDRESS>${escapeXml(inv.partyAddress || matchedParty?.billingAddress || '')}</PARTY_ADDRESS>\n`;
    xml += `        <PARTY_SHIPPING_ADDRESS>${escapeXml(matchedParty?.shippingAddress || inv.partyAddress || matchedParty?.billingAddress || '')}</PARTY_SHIPPING_ADDRESS>\n`;
    xml += `        <PARTY_CITY>${escapeXml(matchedParty?.city || '')}</PARTY_CITY>\n`;
    xml += `        <PARTY_STATE>${escapeXml(inv.partyState || matchedParty?.state || 'Maharashtra')}</PARTY_STATE>\n`;
    xml += `        <PARTY_STATE_CODE>${escapeXml(inv.partyStateCode || matchedParty?.stateCode || '27')}</PARTY_STATE_CODE>\n`;
    xml += `        <PARTY_PINCODE>${escapeXml(matchedParty?.pincode || '')}</PARTY_PINCODE>\n`;

    // Voucher Financials
    xml += `        <PLACE_OF_SUPPLY>${escapeXml(inv.placeOfSupply || 'Maharashtra (27)')}</PLACE_OF_SUPPLY>\n`;
    xml += `        <PLACE_OF_SUPPLY_CODE>${escapeXml(inv.placeOfSupplyCode || '27')}</PLACE_OF_SUPPLY_CODE>\n`;
    xml += `        <PO_NUMBER>${escapeXml(inv.poNumber || '')}</PO_NUMBER>\n`;
    xml += `        <PO_DATE>${escapeXml(inv.poDate || '')}</PO_DATE>\n`;
    xml += `        <EWAY_BILL_NO>${escapeXml(inv.ewayBillNo || '')}</EWAY_BILL_NO>\n`;
    xml += `        <VEHICLE_NO>${escapeXml(inv.vehicleNo || '')}</VEHICLE_NO>\n`;
    xml += `        <SUBTOTAL>${Number(inv.subTotal || 0).toFixed(2)}</SUBTOTAL>\n`;
    xml += `        <TOTAL_DISCOUNT>${Number(inv.totalDiscount || 0).toFixed(2)}</TOTAL_DISCOUNT>\n`;
    xml += `        <TOTAL_TAXABLE>${Number(inv.totalTaxable || 0).toFixed(2)}</TOTAL_TAXABLE>\n`;
    xml += `        <TOTAL_TAX>${Number(inv.totalTax || 0).toFixed(2)}</TOTAL_TAX>\n`;
    xml += `        <CGST_TOTAL>${Number(inv.cgstTotal || 0).toFixed(2)}</CGST_TOTAL>\n`;
    xml += `        <SGST_TOTAL>${Number(inv.sgstTotal || 0).toFixed(2)}</SGST_TOTAL>\n`;
    xml += `        <IGST_TOTAL>${Number(inv.igstTotal || 0).toFixed(2)}</IGST_TOTAL>\n`;
    xml += `        <ROUND_OFF>${Number(inv.roundOff || 0).toFixed(2)}</ROUND_OFF>\n`;
    xml += `        <GRAND_TOTAL>${Number(inv.grandTotal || 0).toFixed(2)}</GRAND_TOTAL>\n`;
    xml += `        <PAID_AMOUNT>${Number(inv.paidAmount || 0).toFixed(2)}</PAID_AMOUNT>\n`;
    xml += `        <BALANCE_DUE>${Number(inv.balanceDue || 0).toFixed(2)}</BALANCE_DUE>\n`;
    xml += `        <PAYMENT_MODE>${escapeXml(inv.paymentMode || 'Cash')}</PAYMENT_MODE>\n`;
    xml += `        <PAYMENT_STATUS>${escapeXml(inv.status)}</PAYMENT_STATUS>\n`;
    xml += `        <IS_INTERSTATE>${inv.isInterState ? 'Y' : 'N'}</IS_INTERSTATE>\n`;
    xml += `        <NOTES>${escapeXml(inv.notes || '')}</NOTES>\n`;
    xml += `        <TERMS>${escapeXml(inv.terms || '')}</TERMS>\n`;

    // Line items with full item specifications
    xml += `        <ITEMS>\n`;
    inv.items.forEach(line => {
      const matchedItem = consolidatedItems.find(
        it => it.id === line.itemId || it.name.toLowerCase() === line.itemName.toLowerCase()
      );
      xml += `          <ITEM_DETAIL>\n`;
      xml += `            <ITEM_ID>${escapeXml(line.itemId || matchedItem?.id || '')}</ITEM_ID>\n`;
      xml += `            <ITEM_CODE>${escapeXml(matchedItem?.itemCode || '')}</ITEM_CODE>\n`;
      xml += `            <ITEM_NAME>${escapeXml(line.itemName)}</ITEM_NAME>\n`;
      xml += `            <GROUP>${escapeXml(matchedItem?.category || 'General')}</GROUP>\n`;
      xml += `            <HSN>${escapeXml(line.hsnSac || matchedItem?.hsnSac || '')}</HSN>\n`;
      xml += `            <QTY>${Number(line.quantity || 1).toFixed(2)}</QTY>\n`;
      xml += `            <UNIT>${escapeXml(line.unit || matchedItem?.unit || 'PCS')}</UNIT>\n`;
      xml += `            <PRICE>${Number(line.price || 0).toFixed(2)}</PRICE>\n`;
      xml += `            <DISCOUNT_PERCENT>${Number(line.discountPercent || 0).toFixed(2)}</DISCOUNT_PERCENT>\n`;
      xml += `            <DISCOUNT_AMOUNT>${Number(line.discountAmount || 0).toFixed(2)}</DISCOUNT_AMOUNT>\n`;
      xml += `            <TAXABLE_AMOUNT>${Number(line.taxableAmount || 0).toFixed(2)}</TAXABLE_AMOUNT>\n`;
      xml += `            <TAX_RATE>${Number(line.taxRate || 0).toFixed(2)}</TAX_RATE>\n`;
      xml += `            <CGST_RATE>${Number(line.cgstRate || 0).toFixed(2)}</CGST_RATE>\n`;
      xml += `            <CGST_AMOUNT>${Number(line.cgstAmount || 0).toFixed(2)}</CGST_AMOUNT>\n`;
      xml += `            <SGST_RATE>${Number(line.sgstRate || 0).toFixed(2)}</SGST_RATE>\n`;
      xml += `            <SGST_AMOUNT>${Number(line.sgstAmount || 0).toFixed(2)}</SGST_AMOUNT>\n`;
      xml += `            <IGST_RATE>${Number(line.igstRate || 0).toFixed(2)}</IGST_RATE>\n`;
      xml += `            <IGST_AMOUNT>${Number(line.igstAmount || 0).toFixed(2)}</IGST_AMOUNT>\n`;
      xml += `            <TOTAL>${Number(line.totalAmount || 0).toFixed(2)}</TOTAL>\n`;
      xml += `            <COST_PRICE>${Number(matchedItem?.purchasePrice || (line.price * 0.75)).toFixed(2)}</COST_PRICE>\n`;
      xml += `            <DESCRIPTION>${escapeXml(matchedItem?.description || line.itemName)}</DESCRIPTION>\n`;
      xml += `          </ITEM_DETAIL>\n`;
    });
    xml += `        </ITEMS>\n`;
    xml += `      </VOUCHER>\n`;
  });
  xml += `    </VOUCHERS>\n`;
  xml += `  </TRANSACTIONS>\n`;

  xml += `</BUSYDATA>\n`;
  return xml;
}

/**
 * Generate Complete Busy 21 MS-Excel (.xlsx) Workbook with 4 Comprehensive Sheets:
 * - Accounts & Parties (All 25+ fields)
 * - Item Masters & Stock (All 28+ fields)
 * - Vouchers & Transactions (All 52+ fields with complete party & item breakdown)
 * - Summary & Business Metrics (Turnover, Stock, Outstanding)
 */
export function generateBusy21ExcelWorkbook(
  parties: Party[],
  items: InventoryItem[],
  invoices: Invoice[]
): Uint8Array {
  const wb = XLSX.utils.book_new();

  const consolidatedParties = getConsolidatedParties(parties, invoices);
  const consolidatedItems = getConsolidatedItems(items, invoices);

  // Sheet 1: Accounts & Parties
  const accountsData = consolidatedParties.map((p, idx) => buildPartyExportRow(p, idx));
  const wsAccounts = XLSX.utils.json_to_sheet(accountsData);
  XLSX.utils.book_append_sheet(wb, wsAccounts, 'Accounts');

  // Sheet 2: Item Masters
  const itemsData = consolidatedItems.map((it, idx) => buildItemExportRow(it, idx));
  const wsItems = XLSX.utils.json_to_sheet(itemsData);
  XLSX.utils.book_append_sheet(wb, wsItems, 'Items');

  // Sheet 3: Vouchers
  const vouchersData = buildVoucherExportRows(invoices, consolidatedParties, consolidatedItems);
  const wsVouchers = XLSX.utils.json_to_sheet(vouchersData);
  XLSX.utils.book_append_sheet(wb, wsVouchers, 'Vouchers');

  // Sheet 4: Summary Overview
  const totalSalesVal = invoices.filter(i => i.type === 'sale').reduce((sum, i) => sum + i.grandTotal, 0);
  const totalPurchVal = invoices.filter(i => i.type === 'purchase').reduce((sum, i) => sum + i.grandTotal, 0);
  const totalStockVal = consolidatedItems.reduce((sum, it) => sum + (it.currentStock * it.purchasePrice), 0);
  const totalReceivables = consolidatedParties.filter(p => p.type === 'customer').reduce((sum, p) => sum + Math.max(0, p.currentBalance), 0);
  const totalPayables = consolidatedParties.filter(p => p.type === 'supplier').reduce((sum, p) => sum + Math.max(0, Math.abs(p.currentBalance)), 0);

  const summaryData = [
    { 'Parameter / Metric': 'Export Date & Time', 'Value': new Date().toLocaleString() },
    { 'Parameter / Metric': 'Engine / Standard', 'Value': 'Busy 21 Universal Accounting Bridge' },
    { 'Parameter / Metric': 'Total Accounts / Parties', 'Value': consolidatedParties.length },
    { 'Parameter / Metric': 'Total Inventory Item Masters', 'Value': consolidatedItems.length },
    { 'Parameter / Metric': 'Total Vouchers / Invoices', 'Value': invoices.length },
    { 'Parameter / Metric': 'Total Sales Turnover (₹)', 'Value': Number(totalSalesVal.toFixed(2)) },
    { 'Parameter / Metric': 'Total Purchases (₹)', 'Value': Number(totalPurchVal.toFixed(2)) },
    { 'Parameter / Metric': 'Total Stock Valuation at Cost (₹)', 'Value': Number(totalStockVal.toFixed(2)) },
    { 'Parameter / Metric': 'Total Customer Receivables (₹)', 'Value': Number(totalReceivables.toFixed(2)) },
    { 'Parameter / Metric': 'Total Supplier Payables (₹)', 'Value': Number(totalPayables.toFixed(2)) },
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(excelBuffer);
}

/**
 * Generate Single-Sheet Excel file for Accounts with ALL 25+ fields
 */
export function generateBusy21AccountsExcel(parties: Party[], invoices: Invoice[] = []): Uint8Array {
  const wb = XLSX.utils.book_new();
  const consolidated = getConsolidatedParties(parties, invoices);
  const accountsData = consolidated.map((p, idx) => buildPartyExportRow(p, idx));
  const ws = XLSX.utils.json_to_sheet(accountsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Accounts');
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(excelBuffer);
}

/**
 * Generate Single-Sheet Excel file for Items with ALL 28+ fields
 */
export function generateBusy21ItemsExcel(items: InventoryItem[], invoices: Invoice[] = []): Uint8Array {
  const wb = XLSX.utils.book_new();
  const consolidated = getConsolidatedItems(items, invoices);
  const itemsData = consolidated.map((it, idx) => buildItemExportRow(it, idx));
  const ws = XLSX.utils.json_to_sheet(itemsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Items');
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(excelBuffer);
}

/**
 * Generate Single-Sheet Excel file for Vouchers with ALL Party & Item details
 */
export function generateBusy21VouchersExcel(
  invoices: Invoice[],
  parties: Party[] = [],
  items: InventoryItem[] = []
): Uint8Array {
  const wb = XLSX.utils.book_new();
  const consolidatedParties = getConsolidatedParties(parties, invoices);
  const consolidatedItems = getConsolidatedItems(items, invoices);
  const vouchersData = buildVoucherExportRows(invoices, consolidatedParties, consolidatedItems);
  const ws = XLSX.utils.json_to_sheet(vouchersData);
  XLSX.utils.book_append_sheet(wb, ws, 'Vouchers');
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(excelBuffer);
}

/**
 * Generate CSV format for Busy 21 Accounts with ALL 25+ fields
 */
export function generateBusy21AccountsCsv(parties: Party[], invoices: Invoice[] = []): string {
  const consolidated = getConsolidatedParties(parties, invoices);
  const rows = consolidated.map((p, idx) => buildPartyExportRow(p, idx));
  if (rows.length === 0) {
    return 'Party ID,Account Name,Print Name,Parent Group,Party Type,GSTIN,PAN,Mobile No,Email ID,Billing Address,Shipping Address,City,State,State Code,Pincode,Country,Opening Balance (₹),Balance Type,Current Balance (₹),Credit Limit (₹),Credit Period (Days),Reverse Charge Applicable,Notes / Remarks,Created At';
  }

  const keys = Object.keys(rows[0]);
  const headerLine = keys.map(k => `"${k}"`).join(',');
  const dataLines = rows.map(r => {
    return keys
      .map(k => {
        const val = (r as any)[k];
        if (typeof val === 'number') return val;
        return `"${String(val ?? '').replace(/"/g, '""')}"`;
      })
      .join(',');
  });

  return [headerLine, ...dataLines].join('\n');
}

/**
 * Generate CSV format for Busy 21 Items with ALL 28+ fields
 */
export function generateBusy21ItemsCsv(items: InventoryItem[], invoices: Invoice[] = []): string {
  const consolidated = getConsolidatedItems(items, invoices);
  const rows = consolidated.map((it, idx) => buildItemExportRow(it, idx));
  if (rows.length === 0) {
    return 'Item ID,Item Code,Item Name,Print Name,Item Group / Category,Main Unit,Alternate Unit,Conversion Factor,HSN / SAC Code,Sale Price / Rate (₹),Purchase / Cost Price (₹),MRP (₹),Profit Margin per Unit (₹),Profit Margin (%),Tax Rate (%),Tax Calculation,Opening Stock (Units),Opening Stock Value at Cost (₹),Current Stock (Units),Min Stock Alert Level,Stock Status,Total Stock Value at Cost (₹),Total Stock Value at Sale (₹),Potential Profit on Stock (₹),Storage Location / Godown,Description / Specs,Last Updated';
  }

  const keys = Object.keys(rows[0]);
  const headerLine = keys.map(k => `"${k}"`).join(',');
  const dataLines = rows.map(r => {
    return keys
      .map(k => {
        const val = (r as any)[k];
        if (typeof val === 'number') return val;
        return `"${String(val ?? '').replace(/"/g, '""')}"`;
      })
      .join(',');
  });

  return [headerLine, ...dataLines].join('\n');
}

/**
 * Generate CSV format for Busy 21 Vouchers with ALL Party & Item details
 */
export function generateBusy21VouchersCsv(
  invoices: Invoice[],
  parties: Party[] = [],
  items: InventoryItem[] = []
): string {
  const consolidatedParties = getConsolidatedParties(parties, invoices);
  const consolidatedItems = getConsolidatedItems(items, invoices);
  const rows = buildVoucherExportRows(invoices, consolidatedParties, consolidatedItems);
  if (rows.length === 0) {
    return 'Voucher Type,Voucher No,Invoice Date,Due Date,Payment Mode,Payment Status,Party Name,Party GSTIN,Party Mobile No,Item Name,HSN / SAC Code,Quantity,Unit,Price per Unit (₹),Total Item Amount (₹),Invoice Grand Total (₹)';
  }

  const keys = Object.keys(rows[0]);
  const headerLine = keys.map(k => `"${k}"`).join(',');

  const dataLines = rows.map(r => {
    return keys
      .map(k => {
        const val = r[k];
        if (typeof val === 'number') return val;
        return `"${String(val ?? '').replace(/"/g, '""')}"`;
      })
      .join(',');
  });

  return [headerLine, ...dataLines].join('\n');
}

/**
 * Sanitize XML content
 */
function sanitizeXml(raw: string): string {
  let clean = raw.replace(/^\uFEFF/, '').trim();
  clean = clean.replace(/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g, '&amp;');
  clean = clean.replace(
    /<\?xml\s+version="[^"]*"\s+encoding="[^"]*"\?>/i,
    '<?xml version="1.0" encoding="UTF-8"?>'
  );
  return clean;
}

/**
 * Tag-based fallback scanner for extracting text inside tags
 */
function extractTagValue(xmlBlock: string, tagNames: string[]): string {
  for (const tag of tagNames) {
    const regex = new RegExp(
      `<(?:[a-zA-Z0-9_-]+:)?${tag}[^>]*>([\\s\\S]*?)<\\/(?:[a-zA-Z0-9_-]+:)?${tag}>`,
      'i'
    );
    const match = xmlBlock.match(regex);
    if (match && match[1]) {
      let val = match[1].trim();
      val = val.replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/, '$1');
      return val
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .trim();
    }
  }
  return '';
}

/**
 * Fallback Regex XML Extractor: Runs if DOMParser fails or for non-standard XML
 */
function parseXmlWithRegex(rawXml: string): Busy21ParsedData {
  const parties: Party[] = [];
  const items: InventoryItem[] = [];
  const invoices: Invoice[] = [];

  // Extract Accounts / Parties / Ledgers
  const accountMatches =
    rawXml.match(
      /<(?:ACCOUNT|PARTY|MASTER|ACCOUNTS_MASTER|LEDGER)[\s\S]*?<\/(?:ACCOUNT|PARTY|MASTER|ACCOUNTS_MASTER|LEDGER)>/gi
    ) || [];
  accountMatches.forEach((block, idx) => {
    const name =
      extractTagValue(block, [
        'NAME',
        'PRINTNAME',
        'ACCOUNT_NAME',
        'PARTY_NAME',
        'ACC_NAME',
        'LEDGERNAME',
        'LEDGER_NAME',
      ]) || `Party ${idx + 1}`;
    if (!name || name === 'General' || name.length < 2) return;

    const group = extractTagValue(block, [
      'GROUP',
      'PARENT_GROUP',
      'PARENTGROUP',
      'ACCOUNT_GROUP',
      'PARENT',
    ]);
    const partyTypeAttr = extractTagValue(block, ['PARTY_TYPE', 'TYPE']);
    const isSupplier =
      partyTypeAttr.toLowerCase() === 'supplier' ||
      group.toLowerCase().includes('creditor') ||
      group.toLowerCase().includes('supplier') ||
      group.toLowerCase().includes('vendor');

    const opBal =
      parseFloat(
        extractTagValue(block, ['OP_BAL', 'OPENING_BAL', 'OPENINGBALANCE', 'BALANCE']) || '0'
      ) || 0;
    const currBal =
      parseFloat(
        extractTagValue(block, ['CURR_BAL', 'CURRENT_BAL', 'CURRENTBALANCE']) || String(opBal)
      ) || opBal;
    const address = extractTagValue(block, [
      'BILLING_ADDRESS',
      'ADDRESS',
      'ADDR',
      'ADDRESS1',
    ]);
    const shipAddr = extractTagValue(block, ['SHIPPING_ADDRESS']) || address;

    parties.push({
      id: extractTagValue(block, ['ID', 'GUID']) || `party-busy-${Date.now()}-${idx}`,
      name,
      type: isSupplier ? 'supplier' : 'customer',
      gstin: extractTagValue(block, ['GSTIN', 'GST_NO', 'GST', 'TIN_NO', 'PARTY_GSTIN']),
      pan: extractTagValue(block, ['PAN', 'PAN_NO', 'PANNO']),
      phone: extractTagValue(block, ['MOBILE', 'PHONE', 'MOBILE_NO', 'CONTACT']),
      email: extractTagValue(block, ['EMAIL', 'EMAIL_ID']),
      billingAddress: address,
      shippingAddress: shipAddr,
      city: extractTagValue(block, ['CITY']),
      state: extractTagValue(block, ['STATE']) || 'Maharashtra',
      stateCode: extractTagValue(block, ['STATE_CODE', 'STATECODE']) || '27',
      pincode: extractTagValue(block, ['PINCODE', 'PIN', 'ZIP']),
      openingBalance: opBal,
      balanceType: isSupplier ? 'to_pay' : 'to_receive',
      currentBalance: currBal,
      creditLimit: parseFloat(extractTagValue(block, ['CREDIT_LIMIT']) || '0') || 0,
      notes: extractTagValue(block, ['NOTES']),
      createdAt: extractTagValue(block, ['CREATED_AT']) || new Date().toISOString(),
    });
  });

  // Extract Items / Stock / Products
  const itemMatches =
    rawXml.match(
      /<(?:ITEM|ITEMMASTER|STOCK_ITEM|PRODUCT|STOCKITEM)[\s\S]*?<\/(?:ITEM|ITEMMASTER|STOCK_ITEM|PRODUCT|STOCKITEM)>/gi
    ) || [];
  itemMatches.forEach((block, idx) => {
    const name =
      extractTagValue(block, [
        'NAME',
        'PRINTNAME',
        'ITEM_NAME',
        'PRODUCT_NAME',
        'STOCKITEMNAME',
      ]) || `Item ${idx + 1}`;
    if (!name) return;

    const sellingPrice =
      parseFloat(
        extractTagValue(block, ['SALE_PRICE', 'SELLING_PRICE', 'PRICE', 'RATE', 'MRP']) || '0'
      ) || 0;
    const purchasePrice =
      parseFloat(extractTagValue(block, ['PURCHASE_PRICE', 'COST_PRICE', 'COST']) || '0') ||
      Number((sellingPrice * 0.75).toFixed(2));
    const taxRate =
      parseFloat(extractTagValue(block, ['TAX_RATE', 'GST_RATE', 'TAX', 'GST']) || '18') || 0;
    const stock =
      parseFloat(
        extractTagValue(block, ['OP_STOCK', 'OPENING_STOCK', 'STOCK', 'QTY']) || '0'
      ) || 0;
    const minStock = parseFloat(extractTagValue(block, ['MIN_STOCK', 'MIN_LEVEL']) || '5') || 5;

    items.push({
      id: extractTagValue(block, ['ID', 'GUID']) || `item-busy-${Date.now()}-${idx}`,
      name,
      itemCode:
        extractTagValue(block, ['CODE', 'ITEM_CODE', 'SKU']) || `ITM-${1000 + idx}`,
      category:
        extractTagValue(block, ['GROUP', 'PARENT_GROUP', 'CATEGORY', 'PARENT']) || 'General',
      unit: normalizeUnit(extractTagValue(block, ['UNIT', 'MAIN_UNIT', 'BASEUNITS'])),
      sellingPrice,
      purchasePrice,
      taxRate,
      taxInclusive: extractTagValue(block, ['TAX_INCLUSIVE']) === 'Y',
      hsnSac: extractTagValue(block, ['HSN_CODE', 'HSN', 'SAC']),
      openingStock: stock,
      currentStock: stock,
      minStockAlert: minStock,
      description: extractTagValue(block, ['DESCRIPTION', 'DESC']),
      location: extractTagValue(block, ['LOCATION']),
      updatedAt: new Date().toISOString(),
    });
  });

  // Extract Vouchers / Invoices / Transactions
  const voucherMatches =
    rawXml.match(/<(?:VOUCHER|TRANSACTION|BILL|INVOICE)[\s\S]*?<\/(?:VOUCHER|TRANSACTION|BILL|INVOICE)>/gi) ||
    [];
  voucherMatches.forEach((block, idx) => {
    const rawType = extractTagValue(block, [
      'TYPE',
      'VOUCHER_TYPE',
      'VCH_TYPE',
      'VOUCHERTYPENAME',
    ]).toLowerCase();
    const type = rawType.includes('purchase')
      ? 'purchase'
      : rawType.includes('quotation')
      ? 'quotation'
      : rawType.includes('challan')
      ? 'delivery_challan'
      : 'sale';

    const invNo =
      extractTagValue(block, ['VCH_NO', 'VOUCHER_NO', 'BILL_NO', 'INVOICE_NO', 'VOUCHERNUMBER']) ||
      `BUSY-${1000 + idx}`;
    const date =
      extractTagValue(block, ['DATE', 'VCH_DATE']) || new Date().toISOString().split('T')[0];
    const partyName =
      extractTagValue(block, ['PARTY_NAME', 'ACCOUNT_NAME', 'PARTY', 'PARTYLEDGERNAME']) ||
      'General Customer';
    const grandTotal =
      parseFloat(
        extractTagValue(block, ['GRAND_TOTAL', 'TOTAL_AMOUNT', 'NET_AMOUNT', 'AMOUNT']) || '0'
      ) || 0;
    const paidAmount =
      parseFloat(extractTagValue(block, ['PAID_AMOUNT', 'PAID']) || String(grandTotal)) ||
      grandTotal;

    const fallbackItem: InvoiceItem = {
      id: `item-line-reg-${idx}`,
      itemId: 'item-ref',
      itemName: 'Item as per Busy Bill',
      hsnSac: '',
      quantity: 1,
      unit: 'PCS',
      price: grandTotal,
      discountPercent: 0,
      discountAmount: 0,
      taxRate: 0,
      taxableAmount: grandTotal,
      cgstRate: 0,
      cgstAmount: 0,
      sgstRate: 0,
      sgstAmount: 0,
      igstRate: 0,
      igstAmount: 0,
      totalAmount: grandTotal,
    };

    invoices.push({
      id: `inv-busy-${Date.now()}-${idx}`,
      invoiceNumber: invNo,
      type,
      date,
      dueDate: date,
      partyId: extractTagValue(block, ['PARTY_ID']) || `party-ref-${idx}`,
      partyName,
      partyGstin: extractTagValue(block, ['PARTY_GSTIN', 'GSTIN']),
      partyPhone: extractTagValue(block, ['PARTY_PHONE', 'PHONE', 'MOBILE']),
      partyAddress: extractTagValue(block, ['PARTY_ADDRESS', 'ADDRESS']),
      partyState: extractTagValue(block, ['PARTY_STATE', 'STATE']) || 'Maharashtra',
      partyStateCode: extractTagValue(block, ['PARTY_STATE_CODE', 'STATE_CODE']) || '27',
      placeOfSupply:
        extractTagValue(block, ['PLACE_OF_SUPPLY']) || 'Maharashtra (27)',
      placeOfSupplyCode: extractTagValue(block, ['PLACE_OF_SUPPLY_CODE']) || '27',
      gstType: 'Intra-State (CGST + SGST)',
      isInterState: extractTagValue(block, ['IS_INTERSTATE']) === 'Y',
      reverseCharge: false,
      items: [fallbackItem],
      subTotal: grandTotal,
      totalDiscount: 0,
      totalTaxable: grandTotal,
      cgstTotal: 0,
      sgstTotal: 0,
      igstTotal: 0,
      totalTax: 0,
      roundOff: 0,
      grandTotal,
      paymentMode: 'Cash',
      paidAmount,
      balanceDue: Math.max(0, grandTotal - paidAmount),
      notes: 'Imported from Busy 21',
      terms: 'Standard Terms',
      status: paidAmount >= grandTotal ? 'Paid' : paidAmount > 0 ? 'Partially Paid' : 'Unpaid',
      createdAt: new Date().toISOString(),
    });
  });

  return {
    firmName: extractTagValue(rawXml, ['NAME', 'FIRM_NAME', 'COMPANYNAME']),
    busyVersion: '21.0 (XML)',
    parties,
    items,
    invoices,
    formatDetected: 'xml',
    summary: {
      partiesCount: parties.length,
      itemsCount: items.length,
      invoicesCount: invoices.length,
    },
  };
}

/**
 * Universal Busy 21 XML Parser (DOMParser with Regex Fallback)
 */
export function parseBusy21Xml(xmlContent: string): Busy21ParsedData {
  const sanitized = sanitizeXml(xmlContent);

  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(sanitized, 'text/xml');

    const parseError = xmlDoc.getElementsByTagName('parsererror');
    if (parseError.length > 0) {
      return parseXmlWithRegex(xmlContent);
    }

    const busyRoot = xmlDoc.querySelector('BUSYDATA, BusyData, busydata, ROOT, root, ENVELOPE');
    const firmName =
      xmlDoc.querySelector('COMPANY > NAME, FIRM > NAME, NAME, COMPANYNAME')?.textContent?.trim() ||
      undefined;
    const busyVersion = busyRoot?.getAttribute('Version') || '21.0';

    const parties: Party[] = [];
    const items: InventoryItem[] = [];
    const invoices: Invoice[] = [];

    const getNodeText = (node: Element, tags: string[]): string => {
      for (const t of tags) {
        const found = node.querySelector(t);
        if (found && found.textContent) {
          return found.textContent.trim();
        }
      }
      return '';
    };

    // 1. Accounts
    const accountElements = xmlDoc.querySelectorAll(
      'ACCOUNTS > ACCOUNT, ACCOUNT, MASTER, PARTY, LEDGER, ACCOUNTS_MASTER'
    );
    accountElements.forEach((accNode, idx) => {
      const name =
        getNodeText(accNode, [
          'NAME',
          'PRINTNAME',
          'AccountName',
          'PartyName',
          'ACC_NAME',
          'LEDGERNAME',
        ]) || `Party ${idx + 1}`;
      if (!name || name === 'General' || name.length < 2) return;

      const group = getNodeText(accNode, [
        'GROUP',
        'ParentGroup',
        'Parent_Group',
        'Category',
        'PARENT',
      ]);
      const partyTypeAttr = getNodeText(accNode, ['PARTY_TYPE', 'Party_Type', 'Type']);
      const isSupplier =
        partyTypeAttr.toLowerCase() === 'supplier' ||
        group.toLowerCase().includes('creditor') ||
        group.toLowerCase().includes('supplier') ||
        group.toLowerCase().includes('vendor');

      const opBal =
        parseFloat(
          getNodeText(accNode, ['OP_BAL', 'OpeningBalance', 'Opening_Bal', 'Balance']) || '0'
        ) || 0;
      const currBal =
        parseFloat(
          getNodeText(accNode, ['CURR_BAL', 'CurrentBalance', 'Current_Bal']) || String(opBal)
        ) || opBal;
      const address = getNodeText(accNode, [
        'BILLING_ADDRESS',
        'ADDRESS',
        'Address1',
        'Addr',
        'BillingAddress',
      ]);
      const shipAddress = getNodeText(accNode, ['SHIPPING_ADDRESS', 'ShippingAddress']) || address;

      parties.push({
        id: getNodeText(accNode, ['ID', 'GUID']) || `party-busy-${Date.now()}-${idx}`,
        name,
        type: isSupplier ? 'supplier' : 'customer',
        gstin: getNodeText(accNode, ['GSTIN', 'GST_NO', 'GST', 'PARTY_GSTIN']),
        pan: getNodeText(accNode, ['PAN', 'PAN_NO', 'PANNO']),
        phone: getNodeText(accNode, ['MOBILE', 'PHONE', 'Mobile_No', 'Contact']),
        email: getNodeText(accNode, ['EMAIL', 'Email_ID']),
        billingAddress: address,
        shippingAddress: shipAddress,
        city: getNodeText(accNode, ['CITY', 'City']),
        state: getNodeText(accNode, ['STATE', 'State']) || 'Maharashtra',
        stateCode: getNodeText(accNode, ['STATE_CODE', 'StateCode', 'State_Code']) || '27',
        pincode: getNodeText(accNode, ['PINCODE', 'Pincode', 'PIN', 'Zip']),
        openingBalance: opBal,
        balanceType: isSupplier ? 'to_pay' : 'to_receive',
        currentBalance: currBal,
        creditLimit: parseFloat(getNodeText(accNode, ['CREDIT_LIMIT']) || '0') || 0,
        notes: getNodeText(accNode, ['NOTES']),
        createdAt: new Date().toISOString(),
      });
    });

    // 2. Items
    const itemElements = xmlDoc.querySelectorAll(
      'ITEMS > ITEM, ITEM, ITEMMASTER, STOCK_ITEM, PRODUCT, STOCKITEM'
    );
    itemElements.forEach((itNode, idx) => {
      const name =
        getNodeText(itNode, [
          'NAME',
          'PRINTNAME',
          'ItemName',
          'Item_Name',
          'Description',
          'STOCKITEMNAME',
        ]) || `Item ${idx + 1}`;
      if (!name) return;

      const sellingPrice =
        parseFloat(
          getNodeText(itNode, [
            'SALE_PRICE',
            'SalePrice',
            'Sale_Price',
            'SellingPrice',
            'Rate',
            'MRP',
            'PRICE',
          ]) || '0'
        ) || 0;
      const purchasePrice =
        parseFloat(
          getNodeText(itNode, ['PURCHASE_PRICE', 'PurchasePrice', 'CostPrice', 'Cost']) || '0'
        ) || Number((sellingPrice * 0.75).toFixed(2));
      const taxRate =
        parseFloat(
          getNodeText(itNode, ['TAX_RATE', 'TaxRate', 'Tax_Rate', 'GST', 'Tax']) || '18'
        ) || 0;
      const stock =
        parseFloat(
          getNodeText(itNode, ['OP_STOCK', 'OpStock', 'OpeningStock', 'Stock', 'Qty']) || '0'
        ) || 0;
      const minStockAlert =
        parseFloat(getNodeText(itNode, ['MIN_STOCK', 'MinStock', 'Min_Stock']) || '5') || 5;

      items.push({
        id: getNodeText(itNode, ['ID', 'GUID']) || `item-busy-${Date.now()}-${idx}`,
        name,
        itemCode:
          getNodeText(itNode, ['CODE', 'ItemCode', 'ITEM_CODE', 'SKU']) ||
          `ITM-${1000 + idx}`,
        category: getNodeText(itNode, ['GROUP', 'Group', 'Category', 'PARENT']) || 'General',
        unit: normalizeUnit(getNodeText(itNode, ['UNIT', 'Unit', 'MainUnit', 'BASEUNITS'])),
        sellingPrice,
        purchasePrice,
        taxRate,
        taxInclusive: getNodeText(itNode, ['TAX_INCLUSIVE']) === 'Y',
        hsnSac: getNodeText(itNode, ['HSN_CODE', 'HSN', 'HsnCode', 'SAC']),
        openingStock: stock,
        currentStock: stock,
        minStockAlert,
        description: getNodeText(itNode, ['DESCRIPTION', 'Description', 'Desc']),
        location: getNodeText(itNode, ['LOCATION']) || 'Main Warehouse',
        updatedAt: new Date().toISOString(),
      });
    });

    // 3. Vouchers
    const voucherElements = xmlDoc.querySelectorAll(
      'VOUCHERS > VOUCHER, VOUCHER, TRANSACTION, BILL, INVOICE'
    );
    voucherElements.forEach((vchNode, idx) => {
      const rawType = (
        getNodeText(vchNode, ['TYPE', 'VoucherType', 'Vch_Type', 'Type', 'VOUCHERTYPENAME']) ||
        'Sales'
      ).toLowerCase();
      const type = rawType.includes('purchase')
        ? 'purchase'
        : rawType.includes('quotation')
        ? 'quotation'
        : rawType.includes('challan')
        ? 'delivery_challan'
        : 'sale';

      const invoiceNumber =
        getNodeText(vchNode, [
          'VCH_NO',
          'VoucherNo',
          'Vch_No',
          'InvoiceNumber',
          'Bill_No',
          'VOUCHERNUMBER',
        ]) || `BUSY-${1000 + idx}`;
      const date =
        getNodeText(vchNode, ['DATE', 'Date', 'Vch_Date']) ||
        new Date().toISOString().split('T')[0];
      const partyName =
        getNodeText(vchNode, [
          'PARTY_NAME',
          'PartyName',
          'Party_Name',
          'AccountName',
          'PARTYLEDGERNAME',
        ]) || 'General Customer';
      const grandTotal =
        parseFloat(
          getNodeText(vchNode, [
            'GRAND_TOTAL',
            'GrandTotal',
            'TotalAmount',
            'Net_Amount',
            'Amount',
          ]) || '0'
        ) || 0;
      const paidAmount =
        parseFloat(
          getNodeText(vchNode, ['PAID_AMOUNT', 'PaidAmount', 'Paid']) || String(grandTotal)
        ) || grandTotal;
      const placeOfSupply =
        getNodeText(vchNode, ['PLACE_OF_SUPPLY', 'PlaceOfSupply', 'POS']) ||
        'Maharashtra (27)';

      const lineItemNodes = vchNode.querySelectorAll(
        'ITEMS > ITEM_DETAIL, ITEM_DETAIL, DETAIL, ROW, ALLINVENTORYENTRIES.LIST, INVENTORYALLOCATIONS.LIST'
      );
      const invoiceItems: InvoiceItem[] = [];

      lineItemNodes.forEach((ln, lnIdx) => {
        const itName =
          getNodeText(ln, ['ITEM_NAME', 'ItemName', 'Item_Name', 'Description', 'STOCKITEMNAME']) ||
          'General Item';
        const qty =
          parseFloat(getNodeText(ln, ['QTY', 'Quantity', 'Qty', 'ACTUALQTY']) || '1') || 1;
        const unit = normalizeUnit(getNodeText(ln, ['UNIT', 'Unit']));
        const price =
          parseFloat(getNodeText(ln, ['PRICE', 'Rate', 'Price', 'RATE']) || '0') || 0;
        const taxRate =
          parseFloat(getNodeText(ln, ['TAX_RATE', 'TaxRate', 'GST']) || '18') || 0;
        const taxable =
          parseFloat(
            getNodeText(ln, ['TAXABLE_AMOUNT', 'TaxableAmount', 'Amount', 'AMOUNT']) || '0'
          ) || Number((qty * price).toFixed(2));
        const total =
          parseFloat(getNodeText(ln, ['TOTAL', 'Total', 'TotalAmount']) || '0') ||
          Number((taxable * (1 + taxRate / 100)).toFixed(2));

        invoiceItems.push({
          id: `item-line-${Date.now()}-${lnIdx}`,
          itemId: `item-ref-${idx}-${lnIdx}`,
          itemName: itName,
          hsnSac: getNodeText(ln, ['HSN', 'HsnCode', 'HSN_CODE']),
          quantity: qty,
          unit,
          price,
          discountPercent: 0,
          discountAmount: 0,
          taxRate,
          taxableAmount: taxable,
          cgstRate: taxRate / 2,
          cgstAmount: Number(((taxable * (taxRate / 2)) / 100).toFixed(2)),
          sgstRate: taxRate / 2,
          sgstAmount: Number(((taxable * (taxRate / 2)) / 100).toFixed(2)),
          igstRate: 0,
          igstAmount: 0,
          totalAmount: total,
        });
      });

      const fallbackItem: InvoiceItem = {
        id: `item-line-fallback-${idx}`,
        itemId: 'item-default',
        itemName: 'Item as per Busy Bill',
        hsnSac: '',
        quantity: 1,
        unit: 'PCS',
        price: grandTotal,
        discountPercent: 0,
        discountAmount: 0,
        taxRate: 0,
        taxableAmount: grandTotal,
        cgstRate: 0,
        cgstAmount: 0,
        sgstRate: 0,
        sgstAmount: 0,
        igstRate: 0,
        igstAmount: 0,
        totalAmount: grandTotal,
      };

      const isInterState = getNodeText(vchNode, ['IS_INTERSTATE', 'IsInterstate']) === 'Y';

      invoices.push({
        id: getNodeText(vchNode, ['ID', 'GUID']) || `inv-busy-${Date.now()}-${idx}`,
        invoiceNumber,
        type,
        date,
        dueDate: date,
        partyId: getNodeText(vchNode, ['PARTY_ID']) || `party-ref-${idx}`,
        partyName,
        partyGstin: getNodeText(vchNode, ['PARTY_GSTIN', 'PartyGstin', 'GSTIN']),
        partyPhone: getNodeText(vchNode, ['PARTY_PHONE', 'PartyPhone', 'Phone']),
        partyAddress: getNodeText(vchNode, ['PARTY_ADDRESS', 'Address']),
        partyState: getNodeText(vchNode, ['PARTY_STATE', 'State']) || 'Maharashtra',
        partyStateCode: getNodeText(vchNode, ['PARTY_STATE_CODE', 'StateCode']) || '27',
        placeOfSupply,
        placeOfSupplyCode: '27',
        gstType: isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)',
        isInterState,
        reverseCharge: false,
        items: invoiceItems.length > 0 ? invoiceItems : [fallbackItem],
        subTotal: parseFloat(getNodeText(vchNode, ['SUBTOTAL', 'SubTotal'])) || grandTotal,
        totalDiscount: 0,
        totalTaxable: parseFloat(getNodeText(vchNode, ['SUBTOTAL', 'SubTotal'])) || grandTotal,
        cgstTotal: 0,
        sgstTotal: 0,
        igstTotal: 0,
        totalTax: parseFloat(getNodeText(vchNode, ['TOTAL_TAX', 'TotalTax'])) || 0,
        roundOff: 0,
        grandTotal,
        paymentMode: 'Cash',
        paidAmount,
        balanceDue: Math.max(0, grandTotal - paidAmount),
        notes: 'Imported from Busy 21 Accounting System',
        terms: 'Standard Terms',
        status: paidAmount >= grandTotal ? 'Paid' : paidAmount > 0 ? 'Partially Paid' : 'Unpaid',
        createdAt: new Date().toISOString(),
      });
    });

    if (parties.length === 0 && items.length === 0 && invoices.length === 0) {
      return parseXmlWithRegex(xmlContent);
    }

    const finalParties = getConsolidatedParties(parties, invoices);
    const finalItems = getConsolidatedItems(items, invoices);

    return {
      firmName,
      busyVersion,
      parties: finalParties,
      items: finalItems,
      invoices,
      formatDetected: 'xml',
      summary: {
        partiesCount: finalParties.length,
        itemsCount: finalItems.length,
        invoicesCount: invoices.length,
      },
    };
  } catch (e) {
    return parseXmlWithRegex(xmlContent);
  }
}

/**
 * Universal Excel Parser: Parses all sheets in an Excel workbook (.xlsx / .xls)
 */
export function parseBusy21Excel(buffer: ArrayBuffer | Uint8Array): Busy21ParsedData {
  const wb = XLSX.read(buffer, { type: 'array' });
  const parties: Party[] = [];
  const items: InventoryItem[] = [];
  const invoices: Invoice[] = [];

  wb.SheetNames.forEach(sheetName => {
    const ws = wb.Sheets[sheetName];
    if (!ws) return;

    const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as any[][];
    if (rawRows.length === 0) return;

    let headerIdx = -1;
    for (let i = 0; i < Math.min(10, rawRows.length); i++) {
      const row = rawRows[i];
      if (!Array.isArray(row)) continue;
      const joined = row.map(c => String(c).toLowerCase()).join(' ');
      if (
        joined.includes('account') ||
        joined.includes('item') ||
        joined.includes('voucher') ||
        joined.includes('party') ||
        joined.includes('gstin') ||
        joined.includes('name') ||
        joined.includes('price') ||
        joined.includes('bill')
      ) {
        headerIdx = i;
        break;
      }
    }

    if (headerIdx === -1) headerIdx = 0;

    const headers = (rawRows[headerIdx] || []).map((h: any) =>
      String(h).toLowerCase().replace(/[^a-z0-9]/g, '')
    );

    const isItemsSheet =
      sheetName.toLowerCase().includes('item') ||
      sheetName.toLowerCase().includes('stock') ||
      sheetName.toLowerCase().includes('product') ||
      headers.some(
        h =>
          h.includes('itemname') ||
          h.includes('stock') ||
          h.includes('saleprice') ||
          h.includes('mrp')
      );

    const isVouchersSheet =
      sheetName.toLowerCase().includes('voucher') ||
      sheetName.toLowerCase().includes('sale') ||
      sheetName.toLowerCase().includes('invoice') ||
      sheetName.toLowerCase().includes('bill') ||
      headers.some(
        h =>
          h.includes('voucherno') ||
          h.includes('billno') ||
          h.includes('vchno') ||
          h.includes('grandtotal')
      );

    const isAccountsSheet =
      sheetName.toLowerCase().includes('account') ||
      sheetName.toLowerCase().includes('party') ||
      sheetName.toLowerCase().includes('customer') ||
      sheetName.toLowerCase().includes('vendor') ||
      (!isItemsSheet && !isVouchersSheet);

    for (let r = headerIdx + 1; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!Array.isArray(row) || !row.some(c => String(c).trim().length > 0)) continue;

      const getCol = (keys: string[]): string => {
        for (const k of keys) {
          const idx = headers.findIndex(h => h.includes(k));
          if (idx !== -1 && row[idx] !== undefined && row[idx] !== null) {
            return String(row[idx]).trim();
          }
        }
        return '';
      };

      if (isItemsSheet) {
        const name =
          getCol(['itemname', 'name', 'product', 'description']) || String(row[0] || '').trim();
        if (!name || name.length < 2) continue;

        const salePrice =
          parseFloat(getCol(['saleprice', 'sellingprice', 'price', 'rate', 'mrp']) || '0') || 0;
        const purchasePrice =
          parseFloat(getCol(['purchaseprice', 'costprice', 'cost']) || '0') ||
          Number((salePrice * 0.75).toFixed(2));
        const taxRate = parseFloat(getCol(['taxrate', 'tax', 'gst']) || '18') || 0;
        const stock =
          parseFloat(getCol(['currentstock', 'openingstock', 'stock', 'qty']) || '0') || 0;

        items.push({
          id: `item-xl-${Date.now()}-${r}`,
          name,
          itemCode: getCol(['code', 'itemcode', 'sku']) || `ITM-${1000 + r}`,
          category: getCol(['group', 'category']) || 'General',
          unit: normalizeUnit(getCol(['unit', 'mainunit', 'uom'])),
          sellingPrice: salePrice,
          purchasePrice,
          taxRate,
          taxInclusive: false,
          hsnSac: getCol(['hsn', 'hsncode', 'sac']),
          openingStock: stock,
          currentStock: stock,
          minStockAlert: parseFloat(getCol(['minstock', 'minlevel']) || '5') || 5,
          description: getCol(['description', 'desc']),
          location: getCol(['location', 'godown']) || 'Main Warehouse',
          updatedAt: new Date().toISOString(),
        });
      } else if (isVouchersSheet) {
        const vchNo =
          getCol(['voucherno', 'vchno', 'billno', 'invoicenumber']) || `BUSY-${1000 + r}`;
        const partyName =
          getCol(['partyname', 'party', 'accountname', 'customer']) || 'General Customer';
        const totalAmount =
          parseFloat(getCol(['itemtotal', 'totalamount', 'total', 'grandtotal', 'amount']) || '0') ||
          0;
        const paid = parseFloat(getCol(['paidamount', 'paid']) || String(totalAmount)) || totalAmount;
        const vchType = getCol(['vouchertype', 'type']).toLowerCase().includes('purchase')
          ? 'purchase'
          : 'sale';

        const itemName = getCol(['itemname', 'item']) || 'Items as per Bill';
        const qty = parseFloat(getCol(['qty', 'quantity']) || '1') || 1;
        const unit = normalizeUnit(getCol(['unit']));
        const price = parseFloat(getCol(['price', 'rate']) || String(totalAmount)) || totalAmount;
        const taxRate = parseFloat(getCol(['taxrate', 'gst']) || '0') || 0;

        invoices.push({
          id: `inv-xl-${Date.now()}-${r}`,
          invoiceNumber: vchNo,
          type: vchType,
          date: getCol(['date', 'invoicedate', 'vchdate']) || new Date().toISOString().split('T')[0],
          dueDate: getCol(['duedate', 'date', 'vchdate']) || new Date().toISOString().split('T')[0],
          partyId: getCol(['partyid']) || `party-ref-${r}`,
          partyName,
          partyGstin: getCol(['partygstin', 'gstin']),
          partyPhone: getCol(['partymobileno', 'phone', 'mobile']),
          partyAddress: getCol(['partybillingaddress', 'address']),
          partyState: getCol(['partystate', 'state']) || 'Maharashtra',
          partyStateCode: getCol(['partystatecode', 'statecode']) || '27',
          placeOfSupply: getCol(['placeofsupply']) || 'Maharashtra (27)',
          placeOfSupplyCode: getCol(['placeofsupplycode']) || '27',
          gstType: 'Intra-State (CGST + SGST)',
          isInterState: false,
          reverseCharge: false,
          items: [
            {
              id: `line-${r}`,
              itemId: getCol(['itemid']) || 'item-ref',
              itemName,
              hsnSac: getCol(['hsnsaccode', 'hsn', 'hsncode']),
              quantity: qty,
              unit,
              price,
              discountPercent: parseFloat(getCol(['discount']) || '0') || 0,
              discountAmount: parseFloat(getCol(['discountamount']) || '0') || 0,
              taxRate,
              taxableAmount: totalAmount,
              cgstRate: taxRate / 2,
              cgstAmount: 0,
              sgstRate: taxRate / 2,
              sgstAmount: 0,
              igstRate: 0,
              igstAmount: 0,
              totalAmount,
            },
          ],
          subTotal: totalAmount,
          totalDiscount: 0,
          totalTaxable: totalAmount,
          cgstTotal: 0,
          sgstTotal: 0,
          igstTotal: 0,
          totalTax: 0,
          roundOff: 0,
          grandTotal: totalAmount,
          paymentMode: (getCol(['paymentmode']) as any) || 'Cash',
          paidAmount: paid,
          balanceDue: Math.max(0, totalAmount - paid),
          notes: getCol(['notesremarks', 'notes']) || 'Imported from Busy 21 Excel',
          terms: 'Standard Terms',
          status: paid >= totalAmount ? 'Paid' : paid > 0 ? 'Partially Paid' : 'Unpaid',
          createdAt: new Date().toISOString(),
        });
      } else if (isAccountsSheet) {
        const name =
          getCol(['accountname', 'partyname', 'name', 'party', 'customer', 'vendor']) ||
          String(row[0] || '').trim();
        if (!name || name.length < 2) continue;

        const group = getCol(['group', 'parentgroup', 'type']);
        const isSupplier =
          group.toLowerCase().includes('creditor') ||
          group.toLowerCase().includes('supplier') ||
          group.toLowerCase().includes('vendor');

        const opBal = parseFloat(getCol(['openingbalance', 'opbal', 'balance']) || '0') || 0;
        const address = getCol(['billingaddress', 'address', 'address1', 'addr']);
        const shipAddr = getCol(['shippingaddress']) || address;

        parties.push({
          id: getCol(['partyid', 'id']) || `party-xl-${Date.now()}-${r}`,
          name,
          type: isSupplier ? 'supplier' : 'customer',
          gstin: getCol(['gstin', 'gst', 'gstnumber']),
          pan: getCol(['pan', 'panno']),
          phone: getCol(['mobileno', 'mobile', 'phone', 'contact']),
          email: getCol(['emailid', 'email']),
          billingAddress: address,
          shippingAddress: shipAddr,
          city: getCol(['city']),
          state: getCol(['state']) || 'Maharashtra',
          stateCode: getCol(['statecode']) || '27',
          pincode: getCol(['pincode', 'pin', 'zip']),
          openingBalance: opBal,
          balanceType: isSupplier ? 'to_pay' : 'to_receive',
          currentBalance: parseFloat(getCol(['currentbalance']) || String(opBal)) || opBal,
          creditLimit: parseFloat(getCol(['creditlimit']) || '0') || 0,
          notes: getCol(['notesremarks', 'notes']),
          createdAt: new Date().toISOString(),
        });
      }
    }
  });

  const finalParties = getConsolidatedParties(parties, invoices);
  const finalItems = getConsolidatedItems(items, invoices);

  return {
    firmName: wb.SheetNames[0] || 'Busy 21 Workbook',
    busyVersion: '21.0 Excel Workbook',
    parties: finalParties,
    items: finalItems,
    invoices,
    formatDetected: 'excel',
    summary: {
      partiesCount: finalParties.length,
      itemsCount: finalItems.length,
      invoicesCount: invoices.length,
    },
  };
}

/**
 * Robust CSV / TSV / Delimited parser that detects delimiter automatically
 */
export function parseDelimitedText(text: string): string[][] {
  const clean = text.replace(/^\uFEFF/, '').trim();
  const firstLine = clean.split('\n')[0] || '';

  let delimiter = ',';
  if (firstLine.includes('\t')) delimiter = '\t';
  else if (firstLine.includes(';') && (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length)
    delimiter = ';';
  else if (firstLine.includes('|')) delimiter = '|';

  const rows: string[][] = [];
  const lines = clean.split(/\r?\n/);

  for (const line of lines) {
    if (!line.trim()) continue;

    if (delimiter === ',') {
      const row: string[] = [];
      let inQuotes = false;
      let cur = '';
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          if (inQuotes && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (c === ',' && !inQuotes) {
          row.push(cur.trim());
          cur = '';
        } else {
          cur += c;
        }
      }
      row.push(cur.trim());
      rows.push(row);
    } else {
      rows.push(line.split(delimiter).map(c => c.trim().replace(/^"(.*)"$/, '$1')));
    }
  }

  return rows;
}

/**
 * Smart Universal Raw Text / CSV / XML / JSON Parser
 */
export function parseAnyBusy21Data(rawInput: string): Busy21ParsedData {
  const trimmed = rawInput.trim();

  // 1. Check if XML
  if (
    trimmed.startsWith('<') ||
    trimmed.includes('<BUSYDATA') ||
    trimmed.includes('<ACCOUNTS') ||
    trimmed.includes('<ACCOUNT') ||
    trimmed.includes('<ITEM') ||
    trimmed.includes('<ENVELOPE')
  ) {
    return parseBusy21Xml(trimmed);
  }

  // 2. Check if JSON
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsedJson = JSON.parse(trimmed);
      let candidateParties: Party[] = [];
      let candidateItems: InventoryItem[] = [];
      let candidateInvoices: Invoice[] = [];

      if (parsedJson.slots && Array.isArray(parsedJson.slots)) {
        parsedJson.slots.forEach((s: any) => {
          if (s.parties) candidateParties.push(...s.parties);
          if (s.items) candidateItems.push(...s.items);
          if (s.invoices) candidateInvoices.push(...s.invoices);
        });
      } else {
        candidateParties = parsedJson.parties || parsedJson.accounts || [];
        candidateItems = parsedJson.items || parsedJson.stock || [];
        candidateInvoices = parsedJson.invoices || parsedJson.vouchers || [];
      }

      return {
        firmName: parsedJson.firmName || parsedJson.profile?.businessName || 'Imported Busy JSON',
        busyVersion: '21.0 JSON',
        parties: candidateParties,
        items: candidateItems,
        invoices: candidateInvoices,
        formatDetected: 'json',
        summary: {
          partiesCount: candidateParties.length,
          itemsCount: candidateItems.length,
          invoicesCount: candidateInvoices.length,
        },
      };
    } catch {
      // Fall through to CSV
    }
  }

  // 3. Delimited CSV / TSV
  const rows = parseDelimitedText(trimmed);
  if (rows.length <= 1) {
    throw new Error('Could not recognize any valid Busy 21 XML, CSV, or JSON data format.');
  }

  // Find header row in first 10 rows
  let headerRowIdx = 0;
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const joined = rows[i].map(c => c.toLowerCase()).join(' ');
    if (
      joined.includes('account') ||
      joined.includes('party') ||
      joined.includes('item') ||
      joined.includes('voucher') ||
      joined.includes('name') ||
      joined.includes('gstin') ||
      joined.includes('price') ||
      joined.includes('total')
    ) {
      headerRowIdx = i;
      break;
    }
  }

  const headers = rows[headerRowIdx].map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const parties: Party[] = [];
  const items: InventoryItem[] = [];
  const invoices: Invoice[] = [];

  const isItemsFile = headers.some(
    h => h.includes('item') || h.includes('hsn') || h.includes('stock') || h.includes('mrp')
  );
  const isVouchersFile = headers.some(
    h =>
      h.includes('voucher') ||
      h.includes('billno') ||
      h.includes('vchno') ||
      h.includes('grandtotal') ||
      h.includes('itemtotal')
  );
  const isAccountsFile = headers.some(
    h =>
      h.includes('account') ||
      h.includes('debtor') ||
      h.includes('creditor') ||
      (h.includes('party') && !isVouchersFile)
  );

  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const cols = rows[i];
    if (cols.length === 0 || !cols.some(c => c.length > 0)) continue;

    const getCol = (keys: string[]): string => {
      for (const k of keys) {
        const idx = headers.findIndex(h => h.includes(k));
        if (idx !== -1 && cols[idx]) return cols[idx];
      }
      return '';
    };

    if (isItemsFile) {
      const name = getCol(['itemname', 'name', 'description', 'product']) || cols[0];
      if (!name) continue;
      const salePrice =
        parseFloat(getCol(['saleprice', 'sellingprice', 'price', 'rate', 'mrp']) || '0') || 0;
      const purchasePrice =
        parseFloat(getCol(['purchaseprice', 'costprice', 'cost']) || '0') ||
        Number((salePrice * 0.75).toFixed(2));
      const taxRate = parseFloat(getCol(['taxrate', 'tax', 'gst']) || '18') || 0;
      const stock =
        parseFloat(getCol(['currentstock', 'openingstock', 'stock', 'qty']) || '0') || 0;

      items.push({
        id: `item-csv-${Date.now()}-${i}`,
        name,
        itemCode: getCol(['code', 'itemcode', 'sku']) || `ITM-${1000 + i}`,
        category: getCol(['group', 'category']) || 'General',
        unit: normalizeUnit(getCol(['unit', 'mainunit', 'uom'])),
        sellingPrice: salePrice,
        purchasePrice,
        taxRate,
        taxInclusive: false,
        hsnSac: getCol(['hsn', 'hsncode', 'sac']),
        openingStock: stock,
        currentStock: stock,
        minStockAlert: parseFloat(getCol(['minstock', 'minlevel']) || '5') || 5,
        description: getCol(['description', 'desc']),
        location: getCol(['location', 'godown']) || 'Main Warehouse',
        updatedAt: new Date().toISOString(),
      });
    } else if (isVouchersFile) {
      const vchNo =
        getCol(['voucherno', 'vchno', 'billno', 'invoicenumber']) || `BUSY-${1000 + i}`;
      const partyName =
        getCol(['partyname', 'party', 'accountname', 'customer']) || 'General Customer';
      const totalAmount =
        parseFloat(
          getCol(['itemtotal', 'totalamount', 'total', 'grandtotal', 'amount']) || '0'
        ) || 0;
      const paid = parseFloat(getCol(['paidamount', 'paid']) || String(totalAmount)) || totalAmount;
      const vchType = getCol(['vouchertype', 'type']).toLowerCase().includes('purchase')
        ? 'purchase'
        : 'sale';

      const itemName = getCol(['itemname', 'item']) || 'Items as per Bill';
      const qty = parseFloat(getCol(['qty', 'quantity']) || '1') || 1;
      const unit = normalizeUnit(getCol(['unit']));
      const price = parseFloat(getCol(['price', 'rate']) || String(totalAmount)) || totalAmount;
      const taxRate = parseFloat(getCol(['taxrate', 'gst']) || '0') || 0;

      invoices.push({
        id: `inv-csv-${Date.now()}-${i}`,
        invoiceNumber: vchNo,
        type: vchType,
        date: getCol(['invoicedate', 'date', 'vchdate']) || new Date().toISOString().split('T')[0],
        dueDate: getCol(['duedate', 'date', 'vchdate']) || new Date().toISOString().split('T')[0],
        partyId: getCol(['partyid']) || `party-ref-${i}`,
        partyName,
        partyGstin: getCol(['partygstin', 'gstin']),
        partyPhone: getCol(['partymobileno', 'phone', 'mobile']),
        partyAddress: getCol(['partybillingaddress', 'address']),
        partyState: getCol(['partystate', 'state']) || 'Maharashtra',
        partyStateCode: getCol(['partystatecode', 'statecode']) || '27',
        placeOfSupply: getCol(['placeofsupply']) || 'Maharashtra (27)',
        placeOfSupplyCode: getCol(['placeofsupplycode']) || '27',
        gstType: 'Intra-State (CGST + SGST)',
        isInterState: false,
        reverseCharge: false,
        items: [
          {
            id: `line-${i}`,
            itemId: getCol(['itemid']) || 'item-ref',
            itemName,
            hsnSac: getCol(['hsnsaccode', 'hsn', 'hsncode']),
            quantity: qty,
            unit,
            price,
            discountPercent: parseFloat(getCol(['discount']) || '0') || 0,
            discountAmount: parseFloat(getCol(['discountamount']) || '0') || 0,
            taxRate,
            taxableAmount: totalAmount,
            cgstRate: 0,
            cgstAmount: 0,
            sgstRate: 0,
            sgstAmount: 0,
            igstRate: 0,
            igstAmount: 0,
            totalAmount,
          },
        ],
        subTotal: totalAmount,
        totalDiscount: 0,
        totalTaxable: totalAmount,
        cgstTotal: 0,
        sgstTotal: 0,
        igstTotal: 0,
        totalTax: 0,
        roundOff: 0,
        grandTotal: totalAmount,
        paymentMode: (getCol(['paymentmode']) as any) || 'Cash',
        paidAmount: paid,
        balanceDue: Math.max(0, totalAmount - paid),
        notes: getCol(['notesremarks', 'notes']) || 'Imported from Busy 21 CSV',
        terms: 'Standard Terms',
        status: paid >= totalAmount ? 'Paid' : paid > 0 ? 'Partially Paid' : 'Unpaid',
        createdAt: new Date().toISOString(),
      });
    } else {
      const name =
        getCol(['accountname', 'partyname', 'name', 'party', 'customer']) || cols[0];
      if (!name) continue;

      const group = getCol(['group', 'parentgroup', 'type']);
      const isSupplier =
        group.toLowerCase().includes('creditor') ||
        group.toLowerCase().includes('supplier') ||
        group.toLowerCase().includes('vendor');

      const opBal = parseFloat(getCol(['openingbalance', 'opbal', 'balance']) || '0') || 0;
      const address = getCol(['billingaddress', 'address', 'address1', 'addr']);
      const shipAddr = getCol(['shippingaddress']) || address;

      parties.push({
        id: getCol(['partyid', 'id']) || `party-csv-${Date.now()}-${i}`,
        name,
        type: isSupplier ? 'supplier' : 'customer',
        gstin: getCol(['gstin', 'gst', 'gstnumber']),
        pan: getCol(['pan', 'panno']),
        phone: getCol(['mobileno', 'mobile', 'phone', 'contact']),
        email: getCol(['emailid', 'email']),
        billingAddress: address,
        shippingAddress: shipAddr,
        city: getCol(['city']),
        state: getCol(['state']) || 'Maharashtra',
        stateCode: getCol(['statecode']) || '27',
        pincode: getCol(['pincode', 'pin', 'zip']),
        openingBalance: opBal,
        balanceType: isSupplier ? 'to_pay' : 'to_receive',
        currentBalance: parseFloat(getCol(['currentbalance']) || String(opBal)) || opBal,
        creditLimit: parseFloat(getCol(['creditlimit']) || '0') || 0,
        notes: getCol(['notesremarks', 'notes']),
        createdAt: new Date().toISOString(),
      });
    }
  }

  return {
    firmName: isAccountsFile
      ? 'Busy 21 Accounts'
      : isItemsFile
      ? 'Busy 21 Stock'
      : 'Busy 21 Vouchers',
    busyVersion: '21.0 CSV/TSV',
    parties,
    items,
    invoices,
    formatDetected: 'csv',
    summary: {
      partiesCount: parties.length,
      itemsCount: items.length,
      invoicesCount: invoices.length,
    },
  };
}

/**
 * Provide ready-to-test sample Busy 21 XML data
 */
export function getSampleBusy21Xml(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<BUSYDATA Version="21.0" ExportDate="${new Date().toISOString()}" Generator="Busy 21 Accounting Software">
  <COMPANY>
    <NAME>Apex Industrial Supplies Pvt Ltd</NAME>
    <TAGLINE>Authorized Industrial Distributor</TAGLINE>
    <GSTIN>27AABCA1234F1Z8</GSTIN>
    <PAN>AABCA1234F</PAN>
    <ADDRESS>Plot No 44, MIDC Industrial Area, Phase II</ADDRESS>
    <CITY>Pune</CITY>
    <STATE>Maharashtra</STATE>
    <STATE_CODE>27</STATE_CODE>
    <PINCODE>411018</PINCODE>
    <PHONE>9823012345</PHONE>
    <EMAIL>accounts@apexindustrial.co.in</EMAIL>
    <BANK_NAME>State Bank of India</BANK_NAME>
    <ACCOUNT_NO>30495867123</ACCOUNT_NO>
    <IFSC>SBIN0001234</IFSC>
    <UPI_ID>apexindustrial@sbi</UPI_ID>
  </COMPANY>
  <MASTERS>
    <ACCOUNTS>
      <ACCOUNT>
        <ID>ACC-1001</ID>
        <NAME>Shree Ganesh Enterprises &amp; Co</NAME>
        <PRINTNAME>Shree Ganesh Enterprises &amp; Co</PRINTNAME>
        <GROUP>Sundry Debtors</GROUP>
        <PARTY_TYPE>customer</PARTY_TYPE>
        <GSTIN>27AAACS1423B1ZT</GSTIN>
        <PAN>AAACS1423B</PAN>
        <MOBILE>9822456789</MOBILE>
        <EMAIL>ganesh.ent@gmail.com</EMAIL>
        <ADDRESS>Shop 14, Commercial Market</ADDRESS>
        <BILLING_ADDRESS>Shop 14, Commercial Market</BILLING_ADDRESS>
        <SHIPPING_ADDRESS>Godown 2, Transport Nagar</SHIPPING_ADDRESS>
        <CITY>Pune</CITY>
        <STATE>Maharashtra</STATE>
        <STATE_CODE>27</STATE_CODE>
        <PINCODE>411002</PINCODE>
        <OP_BAL>24500.00</OP_BAL>
        <CURR_BAL>24500.00</CURR_BAL>
        <BAL_TYPE>Dr</BAL_TYPE>
        <CREDIT_LIMIT>50000.00</CREDIT_LIMIT>
      </ACCOUNT>
      <ACCOUNT>
        <ID>ACC-1002</ID>
        <NAME>Bharat Steel &amp; Hardware Traders</NAME>
        <PRINTNAME>Bharat Steel &amp; Hardware Traders</PRINTNAME>
        <GROUP>Sundry Creditors</GROUP>
        <PARTY_TYPE>supplier</PARTY_TYPE>
        <GSTIN>27AABCB9876C1ZW</GSTIN>
        <PAN>AABCB9876C</PAN>
        <MOBILE>9422098765</MOBILE>
        <EMAIL>info@bharatsteel.com</EMAIL>
        <ADDRESS>Godown No 5, Loha Mandi</ADDRESS>
        <BILLING_ADDRESS>Godown No 5, Loha Mandi</BILLING_ADDRESS>
        <SHIPPING_ADDRESS>Godown No 5, Loha Mandi</SHIPPING_ADDRESS>
        <CITY>Mumbai</CITY>
        <STATE>Maharashtra</STATE>
        <STATE_CODE>27</STATE_CODE>
        <PINCODE>400009</PINCODE>
        <OP_BAL>18000.00</OP_BAL>
        <CURR_BAL>18000.00</CURR_BAL>
        <BAL_TYPE>Cr</BAL_TYPE>
        <CREDIT_LIMIT>100000.00</CREDIT_LIMIT>
      </ACCOUNT>
    </ACCOUNTS>
    <ITEMS>
      <ITEM>
        <ID>ITM-101</ID>
        <CODE>HEX-BOLT-12</CODE>
        <NAME>High Tensile Hex Bolt M12 x 50mm</NAME>
        <PRINTNAME>High Tensile Hex Bolt M12 x 50mm</PRINTNAME>
        <GROUP>Fasteners</GROUP>
        <UNIT>BOX</UNIT>
        <SALE_PRICE>850.00</SALE_PRICE>
        <PURCHASE_PRICE>620.00</PURCHASE_PRICE>
        <TAX_RATE>18</TAX_RATE>
        <TAX_INCLUSIVE>N</TAX_INCLUSIVE>
        <HSN_CODE>7318</HSN_CODE>
        <OP_STOCK>120</OP_STOCK>
        <CURRENT_STOCK>120</CURRENT_STOCK>
        <MIN_STOCK>20</MIN_STOCK>
        <LOCATION>Rack A-12</LOCATION>
        <DESCRIPTION>Grade 8.8 Galvanized Hex Bolt</DESCRIPTION>
      </ITEM>
    </ITEMS>
  </MASTERS>
  <TRANSACTIONS>
    <VOUCHERS>
      <VOUCHER>
        <TYPE>Sales</TYPE>
        <VCH_NO>INV/2026/0142</VCH_NO>
        <DATE>2026-10-05</DATE>
        <PARTY_ID>ACC-1001</PARTY_ID>
        <PARTY_NAME>Shree Ganesh Enterprises &amp; Co</PARTY_NAME>
        <PARTY_TYPE>customer</PARTY_TYPE>
        <PARTY_GSTIN>27AAACS1423B1ZT</PARTY_GSTIN>
        <PARTY_PAN>AAACS1423B</PARTY_PAN>
        <PARTY_PHONE>9822456789</PARTY_PHONE>
        <PARTY_EMAIL>ganesh.ent@gmail.com</PARTY_EMAIL>
        <PARTY_ADDRESS>Shop 14, Commercial Market, Pune</PARTY_ADDRESS>
        <PARTY_CITY>Pune</PARTY_CITY>
        <PARTY_STATE>Maharashtra</PARTY_STATE>
        <PARTY_STATE_CODE>27</PARTY_STATE_CODE>
        <PLACE_OF_SUPPLY>Maharashtra (27)</PLACE_OF_SUPPLY>
        <SUBTOTAL>8500.00</SUBTOTAL>
        <TOTAL_DISCOUNT>0.00</TOTAL_DISCOUNT>
        <TOTAL_TAXABLE>8500.00</TOTAL_TAXABLE>
        <TOTAL_TAX>1530.00</TOTAL_TAX>
        <GRAND_TOTAL>10030.00</GRAND_TOTAL>
        <PAID_AMOUNT>10030.00</PAID_AMOUNT>
        <PAYMENT_STATUS>Paid</PAYMENT_STATUS>
        <PAYMENT_MODE>Cash</PAYMENT_MODE>
        <IS_INTERSTATE>N</IS_INTERSTATE>
        <ITEMS>
          <ITEM_DETAIL>
            <ITEM_ID>ITM-101</ITEM_ID>
            <ITEM_CODE>HEX-BOLT-12</ITEM_CODE>
            <ITEM_NAME>High Tensile Hex Bolt M12 x 50mm</ITEM_NAME>
            <GROUP>Fasteners</GROUP>
            <HSN>7318</HSN>
            <QTY>10</QTY>
            <UNIT>BOX</UNIT>
            <PRICE>850.00</PRICE>
            <DISCOUNT_PERCENT>0.00</DISCOUNT_PERCENT>
            <DISCOUNT_AMOUNT>0.00</DISCOUNT_AMOUNT>
            <TAXABLE_AMOUNT>8500.00</TAXABLE_AMOUNT>
            <TAX_RATE>18</TAX_RATE>
            <CGST_RATE>9</CGST_RATE>
            <CGST_AMOUNT>765.00</CGST_AMOUNT>
            <SGST_RATE>9</SGST_RATE>
            <SGST_AMOUNT>765.00</SGST_AMOUNT>
            <IGST_RATE>0</IGST_RATE>
            <IGST_AMOUNT>0.00</IGST_AMOUNT>
            <TOTAL>10030.00</TOTAL>
            <COST_PRICE>620.00</COST_PRICE>
            <DESCRIPTION>Grade 8.8 Galvanized Hex Bolt</DESCRIPTION>
          </ITEM_DETAIL>
        </ITEMS>
      </VOUCHER>
    </VOUCHERS>
  </TRANSACTIONS>
</BUSYDATA>`;
}
