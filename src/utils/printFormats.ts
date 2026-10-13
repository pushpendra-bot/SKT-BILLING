import { CustomPrintFormat } from '../types';

export type LayoutArchitecture =
  | 'vyapar_classic'
  | 'busy_standard'
  | 'tally_prime'
  | 'modern_minimal'
  | 'split_block'
  | 'thermal_pos_80'
  | 'compact_slip_58'
  | 'traditional_bahi_khata'
  | 'corporate_executive'
  | 'govt_rule_46'
  | 'wholesale_b2b_bulk'
  | 'transport_logistics'
  | 'export_international'
  | 'boutique_luxury_serif'
  | 'tech_developer_mono'
  | 'pharma_medical_batch'
  | 'automobile_jobcard'
  | 'jewellery_hallmark'
  | 'stamped_corporate_seal'
  | 'retro_typewriter_matrix'
  | 'tally_ratewise'
  | 'bw_grid_invoice'
  | 'bw_executive_memo'
  | 'bw_ledger_statement'
  | 'bw_compact_commercial'
  | 'bw_classic_ledger'
  | 'bw_modern_editorial'
  | 'bw_warehouse_packing'
  | 'bw_consultant_invoice'
  | 'bw_audit_compliant'
  | 'bw_mono_datamatrix'
  | 'global_solutions_invoice';

export interface PrintFormatDefinition {
  id: number;
  code: string;
  name: string;
  layoutKey: LayoutArchitecture;
  category: string;
  themeColor: string;
  accentBg: string;
  borderColor: string;
  textColor: string;
  tableHeaderBg: string;
  paperSize: 'A4' | 'A5' | 'Thermal 80mm' | 'Thermal 58mm';
  fontFamily: 'sans' | 'mono' | 'serif';
  tagline: string;
  badge: string;
}

export const PRINT_FORMAT_STYLES_20: PrintFormatDefinition[] = [
  {
    id: 1,
    code: 'VYAPAR-01',
    name: '01: Vyapar Indian Business Classic',
    layoutKey: 'vyapar_classic',
    category: 'Vyapar Classics',
    themeColor: '#dc2626',
    accentBg: '#fef2f2',
    borderColor: '#b91c1c',
    textColor: '#0f172a',
    tableHeaderBg: '#fee2e2',
    paperSize: 'A4',
    fontFamily: 'sans',
    tagline: 'Bold red dual-box header, tabular party split & bottom bank summary',
    badge: 'Popular',
  },
  {
    id: 2,
    code: 'BUSY-02',
    name: '02: BUSY 21 Standard Accounting Voucher',
    layoutKey: 'busy_standard',
    category: 'Accounting Standards',
    themeColor: '#1e293b',
    accentBg: '#f8fafc',
    borderColor: '#334155',
    textColor: '#0f172a',
    tableHeaderBg: '#e2e8f0',
    paperSize: 'A4',
    fontFamily: 'sans',
    tagline: 'Authentic Busy 21 sharp monochrome accounting grid & right voucher box',
    badge: 'Busy 21',
  },
  {
    id: 3,
    code: 'TALLY-03',
    name: '03: Tally Prime Statutory Tax Invoice',
    layoutKey: 'tally_prime',
    category: 'Accounting Standards',
    themeColor: '#0f172a',
    accentBg: '#ffffff',
    borderColor: '#0f172a',
    textColor: '#000000',
    tableHeaderBg: '#f1f5f9',
    paperSize: 'A4',
    fontFamily: 'sans',
    tagline: 'Clean double-ruled Tally accounting lines & detailed CGST/SGST/IGST breakdown',
    badge: 'Tally Standard',
  },
  {
    id: 4,
    code: 'MODERN-04',
    name: '04: Modern Minimalist Borderless',
    layoutKey: 'modern_minimal',
    category: 'Modern & Creative',
    themeColor: '#2563eb',
    accentBg: '#eff6ff',
    borderColor: '#e2e8f0',
    textColor: '#1e293b',
    tableHeaderBg: '#f8fafc',
    paperSize: 'A4',
    fontFamily: 'sans',
    tagline: 'Ultra sleek borderless whitespace, floating summary cards & modern sans typography',
    badge: 'Minimalist',
  },
  {
    id: 5,
    code: 'SPLIT-05',
    name: '05: Two-Tone Split Accent Block',
    layoutKey: 'split_block',
    category: 'Modern & Creative',
    themeColor: '#7c3aed',
    accentBg: '#f5f3ff',
    borderColor: '#ddd6fe',
    textColor: '#1e1b4b',
    tableHeaderBg: '#ede9fe',
    paperSize: 'A4',
    fontFamily: 'sans',
    tagline: 'Bold left vertical color stripe with large invoice total pill and carded party details',
    badge: 'Contemporary',
  },
  {
    id: 6,
    code: 'THERMAL-06',
    name: '06: Thermal POS Receipt (80mm)',
    layoutKey: 'thermal_pos_80',
    category: 'Retail POS & Thermal',
    themeColor: '#0f172a',
    accentBg: '#ffffff',
    borderColor: '#64748b',
    textColor: '#0f172a',
    tableHeaderBg: '#f1f5f9',
    paperSize: 'Thermal 80mm',
    fontFamily: 'mono',
    tagline: 'Continuous retail slip with centered store branding, dashed rules & barcode',
    badge: '80mm Roll',
  },
  {
    id: 7,
    code: 'COMPACT-07',
    name: '07: Compact Mini Counter Slip (58mm)',
    layoutKey: 'compact_slip_58',
    category: 'Retail POS & Thermal',
    themeColor: '#000000',
    accentBg: '#ffffff',
    borderColor: '#94a3b8',
    textColor: '#000000',
    tableHeaderBg: '#ffffff',
    paperSize: 'Thermal 58mm',
    fontFamily: 'mono',
    tagline: 'Pocket-sized 2-inch cash counter slip for quick retail grocery & kiosk billing',
    badge: '58mm Mini',
  },
  {
    id: 8,
    code: 'BAHI-08',
    name: '08: Traditional Bahi-Khata (बही-खाता)',
    layoutKey: 'traditional_bahi_khata',
    category: 'Indian Traditional',
    themeColor: '#881337',
    accentBg: '#fff1f2',
    borderColor: '#9f1239',
    textColor: '#4c0519',
    tableHeaderBg: '#ffe4e6',
    paperSize: 'A4',
    fontFamily: 'serif',
    tagline: '॥ श्री गणेशाय नमः ॥ शुभ लाभ sacred header with authentic Indian mercantile layout',
    badge: 'पारंपरिक',
  },
  {
    id: 9,
    code: 'CORP-09',
    name: '09: Corporate Executive & MNC',
    layoutKey: 'corporate_executive',
    category: 'Corporate & Legal',
    themeColor: '#0f2744',
    accentBg: '#f0f4f8',
    borderColor: '#1e3a5f',
    textColor: '#0a192f',
    tableHeaderBg: '#e2e8f0',
    paperSize: 'A4',
    fontFamily: 'sans',
    tagline: 'Formal letterhead executive layout with verified corporate emblem and director stamp box',
    badge: 'Executive',
  },
  {
    id: 10,
    code: 'RULE46-10',
    name: '10: Statutory GST Rule 46 Official',
    layoutKey: 'govt_rule_46',
    category: 'Corporate & Legal',
    themeColor: '#064e3b',
    accentBg: '#f0fdf4',
    borderColor: '#047857',
    textColor: '#022c22',
    tableHeaderBg: '#dcfce7',
    paperSize: 'A4',
    fontFamily: 'sans',
    tagline: 'Strict Rule 46 statutory tax invoice: B2B Reverse Charge, E-Way Bill & full HSN table',
    badge: 'GST Rule 46',
  },
  {
    id: 11,
    code: 'WHOLESALE-11',
    name: '11: Wholesale & B2B Bulk Packing Bill',
    layoutKey: 'wholesale_b2b_bulk',
    category: 'Industrial & Trade',
    themeColor: '#334155',
    accentBg: '#f8fafc',
    borderColor: '#64748b',
    textColor: '#1e293b',
    tableHeaderBg: '#e2e8f0',
    paperSize: 'A4',
    fontFamily: 'mono',
    tagline: 'High-density layout with Case/Carton packing columns, Unit Price & Lorry Receipt',
    badge: 'Bulk B2B',
  },
  {
    id: 12,
    code: 'LOGISTICS-12',
    name: '12: Logistics & Lorry Receipt (LR) Bill',
    layoutKey: 'transport_logistics',
    category: 'Industrial & Trade',
    themeColor: '#0284c7',
    accentBg: '#f0f9ff',
    borderColor: '#0369a1',
    textColor: '#0c4a6e',
    tableHeaderBg: '#e0f2fe',
    paperSize: 'A4',
    fontFamily: 'sans',
    tagline: 'Transport bill with Vehicle No, Driver Mobile, Station From/To & Freight balance',
    badge: 'LR Transport',
  },
  {
    id: 13,
    code: 'EXPORT-13',
    name: '13: Export & International Commercial',
    layoutKey: 'export_international',
    category: 'Corporate & Legal',
    themeColor: '#1e3a8a',
    accentBg: '#eff6ff',
    borderColor: '#1d4ed8',
    textColor: '#172554',
    tableHeaderBg: '#dbeafe',
    paperSize: 'A4',
    fontFamily: 'sans',
    tagline: 'IEC Code, Port of Loading/Discharge, Country of Destination & Terms of Sale FOB/CIF',
    badge: 'Export Commercial',
  },
  {
    id: 14,
    code: 'BOUTIQUE-14',
    name: '14: Boutique & Luxury Serif Elegant',
    layoutKey: 'boutique_luxury_serif',
    category: 'Modern & Creative',
    themeColor: '#854d0e',
    accentBg: '#fefce8',
    borderColor: '#ca8a04',
    textColor: '#422006',
    tableHeaderBg: '#fef9c3',
    paperSize: 'A4',
    fontFamily: 'serif',
    tagline: 'Warm champagne gold border accents, refined Playfair typography & luxury crest',
    badge: 'Luxury Boutique',
  },
  {
    id: 15,
    code: 'TECH-15',
    name: '15: Tech Monospace Terminal Style',
    layoutKey: 'tech_developer_mono',
    category: 'Modern & Creative',
    themeColor: '#059669',
    accentBg: '#ecfdf5',
    borderColor: '#10b981',
    textColor: '#064e3b',
    tableHeaderBg: '#d1fae5',
    paperSize: 'A4',
    fontFamily: 'mono',
    tagline: 'Terminal monospace grid with syntax accents, code metadata tags & clean calculation blocks',
    badge: 'Dev Terminal',
  },
  {
    id: 16,
    code: 'PHARMA-16',
    name: '16: Medical & Pharma Batch / Expiry',
    layoutKey: 'pharma_medical_batch',
    category: 'Specialized Industry',
    themeColor: '#0891b2',
    accentBg: '#ecfeff',
    borderColor: '#0e7490',
    textColor: '#155e75',
    tableHeaderBg: '#cffafe',
    paperSize: 'A4',
    fontFamily: 'sans',
    tagline: 'Batch No, Expiry Date (MM/YY), MRP, Drug License (20B/21B) & Schedule H notice',
    badge: 'Pharma / Medical',
  },
  {
    id: 17,
    code: 'AUTO-17',
    name: '17: Automobile & Workshop Job Card',
    layoutKey: 'automobile_jobcard',
    category: 'Specialized Industry',
    themeColor: '#b45309',
    accentBg: '#fffbeb',
    borderColor: '#d97706',
    textColor: '#78350f',
    tableHeaderBg: '#fef3c7',
    paperSize: 'A4',
    fontFamily: 'sans',
    tagline: 'Vehicle Reg No, KM reading, Chassis No, Labor vs Spare Parts segregation & job signoff',
    badge: 'Auto Workshop',
  },
  {
    id: 18,
    code: 'JEWEL-18',
    name: '18: Jewellery & Hallmark Certificate',
    layoutKey: 'jewellery_hallmark',
    category: 'Specialized Industry',
    themeColor: '#a16207',
    accentBg: '#fefce8',
    borderColor: '#eab308',
    textColor: '#713f12',
    tableHeaderBg: '#fef08a',
    paperSize: 'A4',
    fontFamily: 'serif',
    tagline: 'BIS Hallmark logo, Gold/Silver Purity, Gross/Net Weight, Making charges & stone weight',
    badge: 'Jewellery BIS',
  },
  {
    id: 19,
    code: 'SEALED-19',
    name: '19: Formal Sealed & Stamped Official',
    layoutKey: 'stamped_corporate_seal',
    category: 'Corporate & Legal',
    themeColor: '#1d4ed8',
    accentBg: '#eff6ff',
    borderColor: '#2563eb',
    textColor: '#1e3a8a',
    tableHeaderBg: '#dbeafe',
    paperSize: 'A4',
    fontFamily: 'sans',
    tagline: 'Embossed watermark seal, verified registration stamps & dual executive signatures',
    badge: 'Sealed & Stamped',
  },
  {
    id: 20,
    code: 'DOTMATRIX-20',
    name: '20: Retro Dot-Matrix Continuous Form',
    layoutKey: 'retro_typewriter_matrix',
    category: 'Accounting Standards',
    themeColor: '#374151',
    accentBg: '#f9fafb',
    borderColor: '#4b5563',
    textColor: '#111827',
    tableHeaderBg: '#e5e7eb',
    paperSize: 'A4',
    fontFamily: 'mono',
    tagline: 'Vintage tractor-feed perforated edge styling, 80-column courier font & ASCII lines',
    badge: 'Dot Matrix 80c',
  },
  {
    id: 21,
    code: 'TALLY-RATEWISE',
    name: '21: Tally Prime Rate-Wise Tax Invoice & GST Breakup',
    layoutKey: 'tally_ratewise',
    category: 'Accounting Standards',
    themeColor: '#0f172a',
    accentBg: '#ffffff',
    borderColor: '#0f172a',
    textColor: '#000000',
    tableHeaderBg: '#f1f5f9',
    paperSize: 'A4',
    fontFamily: 'sans',
    tagline: 'Authentic Tally Prime layout with vertical Bill To/Ship To and GST Rate-Wise Breakup Grid',
    badge: 'Tally Rate-Wise',
  },
  {
    id: 22,
    code: 'BW-GRID-22',
    name: '22: B&W Grid Structured Tax Invoice',
    layoutKey: 'bw_grid_invoice',
    category: 'Black & White',
    themeColor: '#000000',
    accentBg: '#ffffff',
    borderColor: '#000000',
    textColor: '#000000',
    tableHeaderBg: '#e5e5e5',
    paperSize: 'A4',
    fontFamily: 'sans',
    tagline: 'Strict black and white grid structured invoice with explicit double borders',
    badge: 'B&W Grid',
  },
  {
    id: 23,
    code: 'BW-MEMO-23',
    name: '23: B&W Executive Memorandum Statement',
    layoutKey: 'bw_executive_memo',
    category: 'Black & White',
    themeColor: '#000000',
    accentBg: '#ffffff',
    borderColor: '#000000',
    textColor: '#000000',
    tableHeaderBg: '#f3f4f6',
    paperSize: 'A4',
    fontFamily: 'sans',
    tagline: 'Executive memorandum layout with right-aligned voucher box and clean black rules',
    badge: 'B&W Memo',
  },
  {
    id: 24,
    code: 'BW-LEDGER-24',
    name: '24: B&W Classic Ledger Statement',
    layoutKey: 'bw_ledger_statement',
    category: 'Black & White',
    themeColor: '#000000',
    accentBg: '#ffffff',
    borderColor: '#000000',
    textColor: '#000000',
    tableHeaderBg: '#e5e5e5',
    paperSize: 'A4',
    fontFamily: 'serif',
    tagline: 'Traditional mercantile ledger statement with serif typography and boxed party data',
    badge: 'B&W Ledger',
  },
  {
    id: 25,
    code: 'BW-COMPACT-25',
    name: '25: B&W Compact Commercial B2B',
    layoutKey: 'bw_compact_commercial',
    category: 'Black & White',
    themeColor: '#000000',
    accentBg: '#ffffff',
    borderColor: '#000000',
    textColor: '#000000',
    tableHeaderBg: '#f3f4f6',
    paperSize: 'A4',
    fontFamily: 'sans',
    tagline: 'Compact commercial supply chain statement with high-density item rows',
    badge: 'B&W Commercial',
  },
  {
    id: 26,
    code: 'BW-REGISTER-26',
    name: '26: B&W Boxed Government Register',
    layoutKey: 'bw_classic_ledger',
    category: 'Black & White',
    themeColor: '#000000',
    accentBg: '#ffffff',
    borderColor: '#000000',
    textColor: '#000000',
    tableHeaderBg: '#e5e5e5',
    paperSize: 'A4',
    fontFamily: 'mono',
    tagline: 'Government tax register style with fixed-width monospace alignment',
    badge: 'B&W Register',
  },
  {
    id: 27,
    code: 'BW-EDITORIAL-27',
    name: '27: B&W Modern Editorial Minimal',
    layoutKey: 'bw_modern_editorial',
    category: 'Black & White',
    themeColor: '#000000',
    accentBg: '#ffffff',
    borderColor: '#000000',
    textColor: '#000000',
    tableHeaderBg: '#f3f4f6',
    paperSize: 'A4',
    fontFamily: 'sans',
    tagline: 'Modern magazine editorial style with oversized title and clean white space',
    badge: 'B&W Editorial',
  },
  {
    id: 28,
    code: 'BW-WAREHOUSE-28',
    name: '28: B&W Industrial Dispatch & Packing',
    layoutKey: 'bw_warehouse_packing',
    category: 'Black & White',
    themeColor: '#000000',
    accentBg: '#ffffff',
    borderColor: '#000000',
    textColor: '#000000',
    tableHeaderBg: '#e5e5e5',
    paperSize: 'A4',
    fontFamily: 'mono',
    tagline: 'Industrial warehouse dispatch slip with transport LR number and weight details',
    badge: 'B&W Dispatch',
  },
  {
    id: 29,
    code: 'BW-CONSULTANT-29',
    name: '29: B&W Professional Services Invoice',
    layoutKey: 'bw_consultant_invoice',
    category: 'Black & White',
    themeColor: '#000000',
    accentBg: '#ffffff',
    borderColor: '#000000',
    textColor: '#000000',
    tableHeaderBg: '#f3f4f6',
    paperSize: 'A4',
    fontFamily: 'sans',
    tagline: 'Clean professional advisory and consultancy invoice with service breakdowns',
    badge: 'B&W Consultant',
  },
  {
    id: 30,
    code: 'BW-AUDIT-30',
    name: '30: B&W Strict Audit Tax Invoice',
    layoutKey: 'bw_audit_compliant',
    category: 'Black & White',
    themeColor: '#000000',
    accentBg: '#ffffff',
    borderColor: '#000000',
    textColor: '#000000',
    tableHeaderBg: '#e5e5e5',
    paperSize: 'A4',
    fontFamily: 'mono',
    tagline: 'Strict tax audit compliant layout with verification badge and dual sign-off',
    badge: 'B&W Audit',
  },
  {
    id: 31,
    code: 'BW-DATAMATRIX-31',
    name: '31: B&W Monospace Data Ledger',
    layoutKey: 'bw_mono_datamatrix',
    category: 'Black & White',
    themeColor: '#000000',
    accentBg: '#ffffff',
    borderColor: '#000000',
    textColor: '#000000',
    tableHeaderBg: '#f3f4f6',
    paperSize: 'A4',
    fontFamily: 'mono',
    tagline: 'High-density monospace data ledger with dashed borders and raw ascii style',
    badge: 'B&W Data Matrix',
  },
  {
    id: 32,
    code: 'GLOBAL-SOLUTIONS-32',
    name: '32: Global Solutions Executive Tax Invoice',
    layoutKey: 'global_solutions_invoice',
    category: 'Corporate Executive',
    themeColor: '#0f172a',
    accentBg: '#f8fafc',
    borderColor: '#cbd5e1',
    textColor: '#0f172a',
    tableHeaderBg: '#f1f5f9',
    paperSize: 'A4',
    fontFamily: 'sans',
    tagline: 'Professional clean corporate Tax Invoice with side-by-side Bill To / Ship To panels and HDFC Bank details',
    badge: 'Global Solutions',
  },
];

export const PRINT_FORMAT_STYLES_32 = PRINT_FORMAT_STYLES_20;
export const PRINT_FORMAT_STYLES_31 = PRINT_FORMAT_STYLES_20;

// Custom format storage
const CUSTOM_FORMATS_STORAGE_KEY = 'quick_hisaab_custom_formats_v2';

export function getCustomFormats(): CustomPrintFormat[] {
  try {
    const raw = localStorage.getItem(CUSTOM_FORMATS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed reading custom formats', e);
  }
  return [];
}

export function saveCustomFormat(format: CustomPrintFormat): void {
  try {
    const current = getCustomFormats();
    const existingIndex = current.findIndex(f => f.id === format.id);
    let updated: CustomPrintFormat[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = format;
    } else {
      updated = [format, ...current];
    }
    localStorage.setItem(CUSTOM_FORMATS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed saving custom format', e);
  }
}

export function deleteCustomFormat(id: string): void {
  try {
    const current = getCustomFormats();
    const filtered = current.filter(f => f.id !== id);
    localStorage.setItem(CUSTOM_FORMATS_STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed deleting custom format', e);
  }
}

export function getPrintFormatById(id: number): PrintFormatDefinition {
  const found = PRINT_FORMAT_STYLES_20.find(f => f.id === id);
  return found || PRINT_FORMAT_STYLES_20[0];
}

export function createDefaultCustomFormat(): CustomPrintFormat {
  return {
    id: `custom-${Date.now()}`,
    name: 'My Custom Format 1',
    headerStyle: 'banner',
    themeColor: '#dc2626',
    accentBg: '#fef2f2',
    borderColor: '#b91c1c',
    textColor: '#0f172a',
    fontFamily: 'sans',
    borderStyle: 'double',
    customTitle: 'TAX INVOICE',
    showLogo: true,
    showTagline: true,
    showGstinBadges: true,
    showBankDetails: true,
    showUpiQr: true,
    showTerms: true,
    showSignatory: true,
    showCustomerSign: true,
    showOfficialStamp: true,
    showHsnSummary: true,
    showAmountInWords: true,
    showDiscountCol: true,
    showTaxCol: true,
    watermarkText: 'ORIGINAL',
    customTermsText: '1. Goods once sold will not be taken back.\n2. Payment due within 15 days.\n3. Subject to local jurisdiction.\n4. E. & O.E.',
    customFootnote: 'Thank you for your business! For queries, contact customer care.',
    updatedAt: new Date().toISOString(),
  };
}
