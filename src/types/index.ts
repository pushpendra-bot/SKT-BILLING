export type SupplyType = 'intra_state' | 'inter_state';

export interface BusinessProfile {
  businessName: string;
  tagline: string;
  gstin: string;
  pan: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  bankName: string;
  accountNo: string;
  ifscCode: string;
  branch: string;
  upiId: string;
  invoicePrefix: string;
  termsAndConditions: string;
  signatoryName: string;
  invoiceTheme: 'vyapar_classic' | 'modern_blue' | 'minimal_tally';
  logoUrl?: string;
}

export interface SmsLog {
  id: string;
  timestamp: string;
  recipientPhone: string;
  recipientName: string;
  messageType: 'invoice_created' | 'payment_recorded' | 'manual_alert';
  referenceNumber: string;
  messageBody: string;
  status: 'Sent' | 'Delivered' | 'Failed';
}

export interface BusinessSlotData {
  slotId: number; // 1 | 2 | 3 | 4 | 5
  slotName: string;
  password?: string; // Optional company password
  profile: BusinessProfile;
  parties: Party[];
  items: InventoryItem[];
  invoices: Invoice[];
  expenses: Expense[];
  journals: JournalEntry[];
  smsLogs: SmsLog[];
}

export interface CustomPrintFormat {
  id: string; // 'custom-...'
  name: string;
  headerStyle: 'banner' | 'boxed' | 'centered' | 'split' | 'minimal' | 'traditional' | 'letterhead';
  themeColor: string;
  accentBg: string;
  borderColor: string;
  textColor: string;
  fontFamily: 'sans' | 'serif' | 'mono';
  borderStyle: 'double' | 'solid' | 'dashed' | 'none';
  customTitle: string; // e.g. "TAX INVOICE"
  showLogo: boolean;
  showTagline: boolean;
  showGstinBadges: boolean;
  showBankDetails: boolean;
  showUpiQr: boolean;
  showTerms: boolean;
  showSignatory: boolean;
  showCustomerSign: boolean;
  showOfficialStamp: boolean;
  showHsnSummary: boolean;
  showAmountInWords: boolean;
  showDiscountCol: boolean;
  showTaxCol: boolean;
  watermarkText?: string;
  customTermsText?: string;
  customFootnote?: string;
  updatedAt: string;
}

export interface SubscriptionReceivingBankDetails {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branch?: string;
  upiId: string;
  phone?: string;
  email?: string;
}

export interface SingleUseCoupon {
  code: string;
  label: string;
  discountRupees: number;
  description: string;
  isUsed: boolean;
  usedAt?: string;
  createdAt: string;
}

export interface SubscriptionPlan {
  status: 'trial' | 'active' | 'creator_free' | 'expired';
  trialStartDate: string;
  trialDaysTotal: number; // 7 days free trial
  planName: string;
  pricePerYear: number; // 1000 rupees a year
  expiryDate?: string;
  isCreatorFree: boolean;
  appliedCoupon?: {
    code: string;
    discountAmount: number;
    finalPrice: number;
  };
  activatedAt?: string;
  licenseKey?: string;
  transactionRef?: string;
  paymentMethod?: string;
  receivingBank?: SubscriptionReceivingBankDetails;
}

export interface Party {
  id: string;
  name: string;
  type: 'customer' | 'supplier';
  phone: string;
  email: string;
  gstin: string;
  pan: string;
  billingAddress: string;
  shippingAddress: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  openingBalance: number;
  balanceType: 'to_receive' | 'to_pay';
  currentBalance: number;
  creditLimit?: number;
  notes?: string;
  createdAt: string;
}

export type UnitType = 
  | 'PCS' 
  | 'BOX' 
  | 'KGS' 
  | 'MTR' 
  | 'NOS' 
  | 'SET' 
  | 'LTR' 
  | 'PKT' 
  | 'BAG' 
  | 'CTN' 
  | 'DOZ' 
  | 'CASE' 
  | 'TIN' 
  | 'ROLL' 
  | 'BNDL';

export interface InventoryItem {
  id: string;
  name: string;
  itemCode: string;
  hsnSac: string;
  category: string;
  unit: UnitType; // Primary / Base unit (e.g. PCS)
  purchasePrice: number;
  sellingPrice: number;
  taxRate: number; // 0, 5, 12, 18, 28
  taxInclusive: boolean;
  openingStock: number;
  currentStock: number;
  minStockAlert: number;
  description?: string;
  location?: string;
  updatedAt: string;

  // Alternate / Secondary Unit Conversion (e.g., 1 BOX = 24 PCS)
  hasSecondaryUnit?: boolean;
  secondaryUnit?: UnitType;
  conversionFactor?: number; // e.g. 1 secondaryUnit = X base units (e.g. 24)
  secondarySellingPrice?: number; // Selling rate per secondary unit
  secondaryPurchasePrice?: number; // Purchase rate per secondary unit
}

export interface StockAdjustment {
  id: string;
  itemId: string;
  itemName: string;
  date: string;
  type: 'add' | 'reduce';
  quantity: number;
  reason: 'Purchase' | 'Sale' | 'Damaged' | 'Inventory Count Correction' | 'Lost / Theft' | 'Internal Use';
  notes?: string;
  unitUsed?: string;
  baseQuantityAdjusted?: number;
}

export interface InvoiceItem {
  id: string;
  itemId?: string;
  itemName: string;
  hsnSac: string;
  quantity: number;
  unit: UnitType;
  price: number; // Rate per unit (exclusive of tax)
  discountPercent: number;
  discountAmount: number;
  taxRate: number; // 0, 5, 12, 18, 28
  taxableAmount: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalAmount: number;

  // Secondary Unit Tracking in Invoicing
  baseQuantity?: number; // Total quantity in primary/base units (e.g. 2 BOX * 24 = 48 PCS)
  conversionFactor?: number; // Conversion multiplier at time of bill
  isSecondaryUnit?: boolean; // Whether secondary unit was chosen for this line
}

export type InvoiceType = 'sale' | 'quotation' | 'purchase' | 'delivery_challan' | 'sale_return' | 'purchase_return';
export type PaymentMode = 'Cash' | 'Bank Transfer / NEFT' | 'UPI' | 'Cheque' | 'Credit';
export type InvoiceStatus = 'Paid' | 'Unpaid' | 'Partially Paid' | 'Converted' | 'Cancelled' | 'Dispatched';
export type GstTypeOption = 'Intra-State (CGST + SGST)' | 'Inter-State (IGST)' | 'Exempt / Nil';

export interface Invoice {
  id: string;
  type: InvoiceType;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  partyId: string;
  partyName: string;
  partyGstin: string;
  partyPhone: string;
  partyAddress: string;
  partyState: string;
  partyStateCode: string;
  placeOfSupply: string;
  placeOfSupplyCode: string;
  gstType: GstTypeOption;
  isInterState: boolean;
  reverseCharge: boolean;
  items: InvoiceItem[];
  subTotal: number;
  totalDiscount: number;
  totalTaxable: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  totalTax: number;
  discountType?: 'percent' | 'amount';
  discountValue?: number;
  billDiscountAmount?: number;
  freightCharge?: number;
  roundOffType?: 'auto' | 'manual';
  roundOffSign?: '+' | '-';
  roundOff: number;
  grandTotal: number;
  paymentMode: PaymentMode;
  paidAmount: number;
  balanceDue: number;
  notes: string;
  terms: string;
  status: InvoiceStatus;
  poNumber?: string;
  poDate?: string;
  ewayBillNo?: string;
  vehicleNo?: string;
  originalQuotationId?: string;
  createdAt: string;
}

export type ExpenseCategory = 
  | 'Office Supplies & Stationery'
  | 'Rent & Premises'
  | 'Salaries & Wages'
  | 'Electricity & Utilities'
  | 'Freight & Transportation'
  | 'Travel & Conveyance'
  | 'Repairs & Maintenance'
  | 'Advertising & Marketing'
  | 'Legal & Professional Charges'
  | 'Bank & Merchant Charges'
  | 'Packaging & Materials'
  | 'Miscellaneous Expense';

export interface Expense {
  id: string;
  expenseNumber: string;
  date: string;
  category: ExpenseCategory;
  vendorName: string;
  vendorGstin?: string;
  amount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMode;
  notes?: string;
  receiptNumber?: string;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  narration: string;
  referenceType?: 'sale' | 'purchase' | 'expense' | 'manual';
  referenceId?: string;
  createdAt: string;
}

export interface LedgerTransaction {
  id: string;
  date: string;
  type: 'Sale' | 'Purchase' | 'Quotation' | 'Payment In' | 'Payment Out' | 'Expense' | 'Journal Entry';
  refNo: string;
  partyOrAccount: string;
  narration: string;
  debit: number;
  credit: number;
  balance?: number;
}
