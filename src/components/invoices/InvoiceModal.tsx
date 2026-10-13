import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Invoice,
  InvoiceItem,
  InvoiceType,
  PaymentMode,
  GstTypeOption,
  UnitType,
} from '../../types';
import {
  INDIAN_STATES,
  calculateGSTComponents,
  formatINR,
  numberToWordsINR,
  extractStateCodeFromGSTIN,
  getStateByCode,
  lookupGSTINDetails,
  GSTINDetails,
  GST_RATES,
} from '../../utils/gstUtils';
import {
  X,
  Plus,
  Trash2,
  Printer,
  ChevronDown,
  ChevronUp,
  Truck,
  Check,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { BusyGstinModal } from '../common/BusyGstinModal';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: InvoiceType;
  invoiceToEdit?: Invoice | null;
  onSaved: (invoice: Invoice, printNow: boolean) => void;
}

const COMMON_UNITS: UnitType[] = [
  'PCS',
  'BOX',
  'CTN',
  'BAG',
  'DOZ',
  'KGS',
  'LTR',
  'MTR',
  'NOS',
  'SET',
  'PKT',
  'CASE',
  'TIN',
  'ROLL',
  'BNDL',
];

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  type,
  invoiceToEdit,
  onSaved,
}) => {
  const { profile, parties, items, addInvoice, updateInvoice, nextInvoiceNumber, addParty, updateParty, addItem } = useApp();

  // 4 Core Busy 21 Primary Header Fields
  const [partyId, setPartyId] = useState('');
  const [partyName, setPartyName] = useState('');
  const [date, setDate] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [gstType, setGstType] = useState<GstTypeOption>('Intra-State (CGST + SGST)');

  // Secondary details
  const [dueDate, setDueDate] = useState('');
  const [partyGstin, setPartyGstin] = useState('');
  const [partyPhone, setPartyPhone] = useState('');
  const [partyAddress, setPartyAddress] = useState('');
  const [partyState, setPartyState] = useState('');
  const [partyStateCode, setPartyStateCode] = useState('');
  const [placeOfSupply, setPlaceOfSupply] = useState('');
  const [placeOfSupplyCode, setPlaceOfSupplyCode] = useState('');
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [gstinAutofillStatus, setGstinAutofillStatus] = useState<GSTINDetails | null>(null);
  const [poNumber, setPoNumber] = useState('');
  const [ewayBillNo, setEwayBillNo] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Bank Transfer / NEFT');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');

  // Line items state
  const [lineItems, setLineItems] = useState<InvoiceItem[]>([]);

  // Quick party add modal inside invoice
  const [showAddPartyModal, setShowAddPartyModal] = useState(false);
  const [showBusyGstinModal, setShowBusyGstinModal] = useState(false);
  const [newPartyName, setNewPartyName] = useState('');
  const [newPartyPhone, setNewPartyPhone] = useState('');
  const [newPartyGstin, setNewPartyGstin] = useState('');
  const [newPartyStateCode, setNewPartyStateCode] = useState(profile.stateCode);

  const handleApplyBusyGstin = (d: GSTINDetails) => {
    setGstinAutofillStatus(d);
    setPartyGstin(d.gstin);
    if (d.tradeName || d.legalName) {
      setPartyName(d.tradeName || d.legalName);
    }
    if (d.address) setPartyAddress(d.address);
    if (d.state) setPartyState(d.state);
    if (d.stateCode) {
      setPartyStateCode(d.stateCode);
      setPlaceOfSupplyCode(d.stateCode);
      setPlaceOfSupply(d.state || getStateByCode(d.stateCode)?.name || profile.state);
    }
    if (d.phone) setPartyPhone(d.phone);
    const targetStateCode = d.stateCode || profile.stateCode;
    const autoGst: GstTypeOption = targetStateCode !== profile.stateCode ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)';
    handleGstTypeChange(autoGst);
  };

  useEffect(() => {
    if (!isOpen) return;

    if (invoiceToEdit) {
      setInvoiceNumber(invoiceToEdit.invoiceNumber);
      setDate(invoiceToEdit.date);
      setDueDate(invoiceToEdit.dueDate);
      setPartyId(invoiceToEdit.partyId);
      setPartyName(invoiceToEdit.partyName);
      setPartyGstin(invoiceToEdit.partyGstin);
      setPartyPhone(invoiceToEdit.partyPhone);
      setPartyAddress(invoiceToEdit.partyAddress);
      setPartyState(invoiceToEdit.partyState);
      setPartyStateCode(invoiceToEdit.partyStateCode);
      setPlaceOfSupply(invoiceToEdit.placeOfSupply);
      setPlaceOfSupplyCode(invoiceToEdit.placeOfSupplyCode);
      setGstType(invoiceToEdit.gstType || (invoiceToEdit.isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'));
      setPoNumber(invoiceToEdit.poNumber || '');
      setEwayBillNo(invoiceToEdit.ewayBillNo || '');
      setVehicleNo(invoiceToEdit.vehicleNo || '');
      setPaymentMode(invoiceToEdit.paymentMode);
      setPaidAmount(invoiceToEdit.paidAmount);
      setNotes(invoiceToEdit.notes || '');
      setTerms(invoiceToEdit.terms || profile.termsAndConditions);
      setLineItems(invoiceToEdit.items);
    } else {
      const today = new Date().toISOString().split('T')[0];
      const due = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      setInvoiceNumber(nextInvoiceNumber(type));
      setDate(today);
      setDueDate(due);
      setPartyId('');
      setPartyName('');
      setPartyGstin('');
      setPartyPhone('');
      setPartyAddress('');
      setPartyState(profile.state);
      setPartyStateCode(profile.stateCode);
      setPlaceOfSupply(profile.state);
      setPlaceOfSupplyCode(profile.stateCode);
      setGstType('Intra-State (CGST + SGST)');
      setPoNumber('');
      setEwayBillNo('');
      setVehicleNo('');
      setPaymentMode(type === 'delivery_challan' ? 'Credit' : 'Bank Transfer / NEFT');
      setPaidAmount(0);
      setNotes(type === 'delivery_challan' ? 'Goods despatched under Delivery Challan for job work / transport.' : '');
      setTerms(profile.termsAndConditions);

      // Default with one clean empty row
      setLineItems([
        {
          id: `item-${Date.now()}`,
          itemName: '',
          hsnSac: '',
          quantity: 1,
          unit: 'PCS',
          price: 0,
          discountPercent: 0,
          discountAmount: 0,
          taxRate: 18,
          taxableAmount: 0,
          cgstRate: 9,
          cgstAmount: 0,
          sgstRate: 9,
          sgstAmount: 0,
          igstRate: 0,
          igstAmount: 0,
          totalAmount: 0,
        },
      ]);
    }
  }, [isOpen, invoiceToEdit, type]);

  const isInterState = gstType === 'Inter-State (IGST)';

  const handlePartySelect = (id: string) => {
    setPartyId(id);
    const selected = parties.find(p => p.id === id);
    if (selected) {
      setPartyName(selected.name);
      setPartyGstin(selected.gstin || '');
      setPartyPhone(selected.phone || '');
      setPartyAddress(selected.billingAddress || '');
      setPartyState(selected.state || profile.state);
      setPartyStateCode(selected.stateCode || profile.stateCode);
      setPlaceOfSupply(selected.state || profile.state);
      setPlaceOfSupplyCode(selected.stateCode || profile.stateCode);

      // Auto set GST Type based on state
      const targetStateCode = selected.stateCode || profile.stateCode;
      const autoGstType: GstTypeOption = targetStateCode !== profile.stateCode ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)';
      setGstType(autoGstType);

      recalculateAllRows(autoGstType, targetStateCode);
    }
  };

  const handleGstTypeChange = (newGstType: GstTypeOption) => {
    setGstType(newGstType);
    recalculateAllRows(newGstType, placeOfSupplyCode);
  };

  const recalculateAllRows = (targetGstType: GstTypeOption, targetPlaceCode: string) => {
    const isInter = targetGstType === 'Inter-State (IGST)';
    const isExempt = targetGstType === 'Exempt / Nil';

    setLineItems(prev =>
      prev.map(row => {
        const taxable = Number((row.quantity * row.price - row.discountAmount).toFixed(2));
        const activeTaxRate = isExempt ? 0 : row.taxRate;

        if (isExempt || activeTaxRate === 0) {
          return {
            ...row,
            taxableAmount: taxable,
            cgstRate: 0,
            cgstAmount: 0,
            sgstRate: 0,
            sgstAmount: 0,
            igstRate: 0,
            igstAmount: 0,
            totalAmount: taxable,
          };
        }

        if (isInter) {
          const igstAmount = Number(((taxable * activeTaxRate) / 100).toFixed(2));
          return {
            ...row,
            taxableAmount: taxable,
            cgstRate: 0,
            cgstAmount: 0,
            sgstRate: 0,
            sgstAmount: 0,
            igstRate: activeTaxRate,
            igstAmount,
            totalAmount: Number((taxable + igstAmount).toFixed(2)),
          };
        } else {
          const halfRate = activeTaxRate / 2;
          const cgstAmount = Number(((taxable * halfRate) / 100).toFixed(2));
          const sgstAmount = Number(((taxable * halfRate) / 100).toFixed(2));
          return {
            ...row,
            taxableAmount: taxable,
            cgstRate: halfRate,
            cgstAmount,
            sgstRate: halfRate,
            sgstAmount,
            igstRate: 0,
            igstAmount: 0,
            totalAmount: Number((taxable + cgstAmount + sgstAmount).toFixed(2)),
          };
        }
      })
    );
  };

  const handleLineItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...lineItems];
    const current = { ...updated[index], [field]: value };

    // Auto-fill from inventory
    if (field === 'itemId') {
      const invItem = items.find(i => i.id === value);
      if (invItem) {
        current.itemId = invItem.id;
        current.itemName = invItem.name;
        current.hsnSac = invItem.hsnSac;
        current.unit = invItem.unit;
        current.isSecondaryUnit = false;
        current.conversionFactor = invItem.conversionFactor || 1;
        current.baseQuantity = current.quantity;
        current.price = type === 'purchase' ? invItem.purchasePrice : invItem.sellingPrice;
        current.taxRate = gstType === 'Exempt / Nil' ? 0 : invItem.taxRate;
      }
    }

    // Switch between Primary Unit (PCS) and Secondary Unit (BOX/CTN/BAG)
    if (field === 'unit') {
      const invItem = items.find(i => i.id === current.itemId);
      if (invItem && invItem.hasSecondaryUnit && invItem.secondaryUnit) {
        if (value === invItem.secondaryUnit) {
          const factor = invItem.conversionFactor || 1;
          current.isSecondaryUnit = true;
          current.conversionFactor = factor;
          if (type === 'purchase') {
            current.price = invItem.secondaryPurchasePrice || Number((invItem.purchasePrice * factor).toFixed(2));
          } else {
            current.price = invItem.secondarySellingPrice || Number((invItem.sellingPrice * factor).toFixed(2));
          }
          current.baseQuantity = Number((current.quantity * factor).toFixed(4));
        } else if (value === invItem.unit) {
          current.isSecondaryUnit = false;
          current.conversionFactor = 1;
          current.price = type === 'purchase' ? invItem.purchasePrice : invItem.sellingPrice;
          current.baseQuantity = current.quantity;
        }
      }
    }

    if (field === 'quantity') {
      const factor = current.isSecondaryUnit && current.conversionFactor ? current.conversionFactor : 1;
      current.baseQuantity = Number(((parseFloat(value) || 0) * factor).toFixed(4));
    }

    const gross = current.quantity * current.price;
    if (field === 'discountPercent') {
      current.discountAmount = Number(((gross * (Number(value) || 0)) / 100).toFixed(2));
    } else if (field === 'price' || field === 'quantity') {
      current.discountAmount = Number(((gross * (current.discountPercent || 0)) / 100).toFixed(2));
    }

    const taxable = Math.max(0, Number((gross - current.discountAmount).toFixed(2)));
    current.taxableAmount = taxable;

    const isExempt = gstType === 'Exempt / Nil';
    const rateToUse = isExempt ? 0 : current.taxRate;

    if (isExempt || rateToUse === 0) {
      current.cgstRate = 0;
      current.cgstAmount = 0;
      current.sgstRate = 0;
      current.sgstAmount = 0;
      current.igstRate = 0;
      current.igstAmount = 0;
      current.totalAmount = taxable;
    } else if (isInterState) {
      const igstAmount = Number(((taxable * rateToUse) / 100).toFixed(2));
      current.cgstRate = 0;
      current.cgstAmount = 0;
      current.sgstRate = 0;
      current.sgstAmount = 0;
      current.igstRate = rateToUse;
      current.igstAmount = igstAmount;
      current.totalAmount = Number((taxable + igstAmount).toFixed(2));
    } else {
      const halfRate = rateToUse / 2;
      const cgstAmount = Number(((taxable * halfRate) / 100).toFixed(2));
      const sgstAmount = Number(((taxable * halfRate) / 100).toFixed(2));
      current.cgstRate = halfRate;
      current.cgstAmount = cgstAmount;
      current.sgstRate = halfRate;
      current.sgstAmount = sgstAmount;
      current.igstRate = 0;
      current.igstAmount = 0;
      current.totalAmount = Number((taxable + cgstAmount + sgstAmount).toFixed(2));
    }

    updated[index] = current;
    setLineItems(updated);
  };

  const handleAddRow = () => {
    const isExempt = gstType === 'Exempt / Nil';
    const defaultRate = isExempt ? 0 : 18;

    const newRow: InvoiceItem = {
      id: `item-${Date.now()}`,
      itemName: '',
      hsnSac: '',
      quantity: 1,
      unit: 'PCS',
      price: 0,
      discountPercent: 0,
      discountAmount: 0,
      taxRate: defaultRate,
      taxableAmount: 0,
      cgstRate: isInterState || isExempt ? 0 : 9,
      cgstAmount: 0,
      sgstRate: isInterState || isExempt ? 0 : 9,
      sgstAmount: 0,
      igstRate: isInterState && !isExempt ? 18 : 0,
      igstAmount: 0,
      totalAmount: 0,
      baseQuantity: 1,
      isSecondaryUnit: false,
      conversionFactor: 1,
    };
    setLineItems([...lineItems, newRow]);
  };

  const handleRemoveRow = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  // Totals calculations
  const subTotal = lineItems.reduce((acc, row) => acc + row.quantity * row.price, 0);
  const totalDiscount = lineItems.reduce((acc, row) => acc + row.discountAmount, 0);
  const totalTaxable = lineItems.reduce((acc, row) => acc + row.taxableAmount, 0);
  const cgstTotal = lineItems.reduce((acc, row) => acc + row.cgstAmount, 0);
  const sgstTotal = lineItems.reduce((acc, row) => acc + row.sgstAmount, 0);
  const igstTotal = lineItems.reduce((acc, row) => acc + row.igstAmount, 0);
  const totalTax = cgstTotal + sgstTotal + igstTotal;

  const rawGrandTotal = totalTaxable + totalTax;
  const roundedGrandTotal = Math.round(rawGrandTotal);
  const roundOff = Number((roundedGrandTotal - rawGrandTotal).toFixed(2));
  const grandTotal = roundedGrandTotal;

  const balanceDue = Math.max(0, grandTotal - paidAmount);

  const handleSave = (printNow: boolean) => {
    if (!partyName.trim()) {
      alert('Please enter or select Party Name.');
      return;
    }

    if (lineItems.length === 0 || lineItems.every(i => !i.itemName.trim())) {
      alert('Please add at least one item.');
      return;
    }

    let status: Invoice['status'] = 'Unpaid';
    if (type === 'delivery_challan') {
      status = 'Dispatched';
    } else if (paidAmount >= grandTotal) {
      status = 'Paid';
    } else if (paidAmount > 0) {
      status = 'Partially Paid';
    }

    const payload: Omit<Invoice, 'id' | 'createdAt'> = {
      type,
      invoiceNumber: invoiceNumber.trim() || nextInvoiceNumber(type),
      date,
      dueDate,
      partyId: partyId || `party-${Date.now()}`,
      partyName: partyName.trim(),
      partyGstin: partyGstin.trim().toUpperCase(),
      partyPhone,
      partyAddress,
      partyState: partyState || profile.state,
      partyStateCode: partyStateCode || profile.stateCode,
      placeOfSupply: placeOfSupply || profile.state,
      placeOfSupplyCode: placeOfSupplyCode || profile.stateCode,
      gstType,
      isInterState,
      reverseCharge: false,
      items: lineItems.filter(i => i.itemName.trim() !== ''),
      subTotal: Number(subTotal.toFixed(2)),
      totalDiscount: Number(totalDiscount.toFixed(2)),
      totalTaxable: Number(totalTaxable.toFixed(2)),
      cgstTotal: Number(cgstTotal.toFixed(2)),
      sgstTotal: Number(sgstTotal.toFixed(2)),
      igstTotal: Number(igstTotal.toFixed(2)),
      totalTax: Number(totalTax.toFixed(2)),
      roundOff,
      grandTotal,
      paymentMode,
      paidAmount: Number(paidAmount) || 0,
      balanceDue,
      notes,
      terms,
      status,
      poNumber,
      ewayBillNo,
      vehicleNo,
    };

    let savedInv: Invoice;
    if (invoiceToEdit) {
      savedInv = { ...payload, id: invoiceToEdit.id, createdAt: invoiceToEdit.createdAt };
      updateInvoice(savedInv);
    } else {
      savedInv = addInvoice(payload);
    }

    // Auto-create or enrich Party in master records so that all details are preserved
    const trimmedPartyName = partyName.trim();
    if (trimmedPartyName) {
      const existingParty = parties.find(
        p => (partyId && p.id === partyId) || p.name.toLowerCase().trim() === trimmedPartyName.toLowerCase()
      );
      const isSupplier = type === 'purchase';
      const cleanGstin = partyGstin.trim().toUpperCase();
      const pan = cleanGstin.length === 15 ? cleanGstin.substring(2, 12) : '';

      if (!existingParty) {
        addParty({
          name: trimmedPartyName,
          type: isSupplier ? 'supplier' : 'customer',
          gstin: cleanGstin,
          pan,
          phone: partyPhone.trim(),
          email: '',
          billingAddress: partyAddress.trim(),
          shippingAddress: partyAddress.trim(),
          city: '',
          state: partyState || profile.state,
          stateCode: partyStateCode || profile.stateCode,
          pincode: '',
          openingBalance: 0,
          balanceType: isSupplier ? 'to_pay' : 'to_receive',
          creditLimit: 0,
        });
      } else {
        // Enrich existing party if invoice has more details (GSTIN, address, phone)
        const needsUpdate =
          (!existingParty.gstin && cleanGstin) ||
          (!existingParty.phone && partyPhone.trim()) ||
          (!existingParty.billingAddress && partyAddress.trim()) ||
          (!existingParty.pan && pan);

        if (needsUpdate) {
          updateParty({
            ...existingParty,
            gstin: existingParty.gstin || cleanGstin,
            pan: existingParty.pan || pan,
            phone: existingParty.phone || partyPhone.trim(),
            billingAddress: existingParty.billingAddress || partyAddress.trim(),
            shippingAddress: existingParty.shippingAddress || partyAddress.trim(),
            state: existingParty.state || partyState || profile.state,
            stateCode: existingParty.stateCode || partyStateCode || profile.stateCode,
          });
        }
      }
    }

    // Auto-create any new line items in inventory items master with full details
    payload.items.forEach((lineItem, idx) => {
      const trimmedItemName = lineItem.itemName.trim();
      if (!trimmedItemName) return;

      const existingItem = items.find(
        it => (lineItem.itemId && it.id === lineItem.itemId) || it.name.toLowerCase().trim() === trimmedItemName.toLowerCase()
      );

      if (!existingItem) {
        const salePrice = Number(lineItem.price || 0);
        addItem({
          name: trimmedItemName,
          itemCode: `ITM-${1000 + items.length + idx}`,
          category: 'General',
          unit: lineItem.unit || 'PCS',
          sellingPrice: type === 'purchase' ? Number((salePrice * 1.25).toFixed(2)) : salePrice,
          purchasePrice: type === 'purchase' ? salePrice : Number((salePrice * 0.75).toFixed(2)),
          taxRate: Number(lineItem.taxRate !== undefined ? lineItem.taxRate : 18),
          taxInclusive: false,
          hsnSac: lineItem.hsnSac || '',
          openingStock: 10,
          currentStock: 10,
          minStockAlert: 5,
          location: 'Main Warehouse',
          description: trimmedItemName,
        });
      }
    });

    onSaved(savedInv, printNow);
    onClose();
  };

  const handleQuickAddParty = () => {
    if (!newPartyName.trim()) return;
    const state = getStateByCode(newPartyStateCode)?.name || profile.state;
    const newP = addParty({
      name: newPartyName.trim(),
      type: type === 'purchase' ? 'supplier' : 'customer',
      phone: newPartyPhone.trim(),
      email: '',
      gstin: newPartyGstin.trim().toUpperCase(),
      pan: newPartyGstin.length >= 12 ? newPartyGstin.substring(2, 12) : '',
      billingAddress: '',
      shippingAddress: '',
      city: '',
      state,
      stateCode: newPartyStateCode,
      pincode: '',
      openingBalance: 0,
      balanceType: type === 'purchase' ? 'to_pay' : 'to_receive',
    });

    handlePartySelect(newP.id);
    setShowAddPartyModal(false);
    setNewPartyName('');
    setNewPartyPhone('');
    setNewPartyGstin('');
  };

  if (!isOpen) return null;

  const voucherTitle =
    type === 'sale'
      ? 'SALE BILL'
      : type === 'purchase'
      ? 'PURCHASE BILL'
      : type === 'quotation'
      ? 'QUOTATION'
      : 'DELIVERY CHALLAN';

  const badgeColor =
    type === 'sale'
      ? 'bg-rose-600'
      : type === 'purchase'
      ? 'bg-blue-600'
      : type === 'quotation'
      ? 'bg-amber-600'
      : 'bg-emerald-600';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-2 sm:p-4 font-sans">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[96vh] flex flex-col overflow-hidden border border-slate-300 animate-in fade-in zoom-in-95 duration-100">
        
        {/* Busy 21 Style Clean Top Bar */}
        <div className="px-5 py-2.5 bg-slate-800 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <span className={`px-2 py-0.5 rounded font-bold text-xs uppercase tracking-wider text-white ${badgeColor}`}>
              {voucherTitle}
            </span>
            <span className="text-xs text-slate-300">
              Company: <span className="font-semibold text-white">{profile.businessName}</span> ({profile.state} - {profile.stateCode})
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
          
          {/* BUSY 21 CLEAN 4-MASTER HEADER ROW: PARTY NAME | DATE | INVOICE NO | GST TYPE */}
          <div className="bg-white p-3.5 rounded-lg border border-slate-300 shadow-2xs space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
              
              {/* 1. NAME OF THE PARTY (5 cols) */}
              <div className="sm:col-span-5 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 uppercase tracking-tight flex items-center gap-1 text-[11px]">
                    Name of the Party *
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowBusyGstinModal(true)}
                      className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200 flex items-center gap-1 transition-colors"
                      title="Validate & Autofill Party details directly using 15-digit GSTIN (BUSY 21 style)"
                    >
                      <ShieldCheck className="h-3 w-3 text-indigo-600" />
                      <span>⚡ Autofill with GST</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddPartyModal(true)}
                      className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-0.5"
                    >
                      <Plus className="h-3 w-3" /> New Party
                    </button>
                  </div>
                </div>

                <div className="flex gap-1.5">
                  <select
                    value={partyId}
                    onChange={e => handlePartySelect(e.target.value)}
                    className="w-1/2 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded font-medium focus:bg-white focus:ring-1 focus:ring-rose-500"
                  >
                    <option value="">-- Pick Party --</option>
                    {parties
                      .filter(p => (type === 'purchase' ? p.type === 'supplier' : p.type === 'customer'))
                      .map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                  </select>

                  <input
                    type="text"
                    required
                    placeholder="Enter Party / Firm Name"
                    value={partyName}
                    onChange={e => setPartyName(e.target.value)}
                    className="w-1/2 px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded font-bold text-slate-900 focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>

              {/* 2. DATE (2 cols) */}
              <div className="sm:col-span-2 space-y-1">
                <label className="font-bold text-slate-800 uppercase tracking-tight text-[11px] block">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded font-semibold focus:ring-1 focus:ring-rose-500"
                />
              </div>

              {/* 3. INVOICE NO / VOUCHER NO (2 cols) */}
              <div className="sm:col-span-2 space-y-1">
                <label className="font-bold text-slate-800 uppercase tracking-tight text-[11px] block">
                  {type === 'delivery_challan' ? 'Challan No. *' : type === 'quotation' ? 'Quote No. *' : type === 'purchase' ? 'Bill No. *' : 'Invoice No. *'}
                </label>
                <input
                  type="text"
                  required
                  value={invoiceNumber}
                  onChange={e => setInvoiceNumber(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono font-bold text-rose-700 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-rose-500"
                />
              </div>

              {/* 4. GST TYPE (3 cols) */}
              <div className="sm:col-span-3 space-y-1">
                <label className="font-bold text-slate-800 uppercase tracking-tight text-[11px] block">
                  GST Type *
                </label>
                <select
                  value={gstType}
                  onChange={e => handleGstTypeChange(e.target.value as GstTypeOption)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded font-bold text-slate-900 focus:ring-1 focus:ring-rose-500"
                >
                  <option value="Intra-State (CGST + SGST)">Local: Intra-State (CGST + SGST)</option>
                  <option value="Inter-State (IGST)">Central: Inter-State (IGST)</option>
                  <option value="Exempt / Nil">Exempt / Zero Rated (0%)</option>
                </select>
              </div>
            </div>

            {/* Quick Toggle for Secondary Details (Address, GSTIN, PO, Vehicle) */}
            <div className="pt-1 flex items-center justify-between border-t border-slate-100 text-[11px]">
              <div className="text-slate-500 font-mono flex items-center gap-2">
                {partyGstin ? (
                  <span>GSTIN: <strong className="text-slate-800">{partyGstin}</strong></span>
                ) : (
                  <span className="text-slate-400">GSTIN: Unregistered</span>
                )}
                <span>· POS: <strong>{placeOfSupply} ({placeOfSupplyCode})</strong></span>
              </div>

              <button
                type="button"
                onClick={() => setShowMoreDetails(!showMoreDetails)}
                className="text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1"
              >
                <span>{showMoreDetails ? 'Hide Extra Fields' : '+ PO#, Transport & Address Fields'}</span>
                {showMoreDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            </div>

            {/* Collapsible Secondary Fields */}
            {showMoreDetails && (
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs animate-in fade-in">
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-600 block">Party GSTIN</label>
                    <button
                      type="button"
                      onClick={() => setShowBusyGstinModal(true)}
                      className="text-[10px] text-indigo-700 hover:text-indigo-900 font-bold flex items-center gap-0.5 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200"
                    >
                      <ShieldCheck className="h-3 w-3" /> BUSY 21 Validate
                    </button>
                  </div>
                  <input
                    type="text"
                    maxLength={15}
                    placeholder="15-digit GSTIN"
                    value={partyGstin}
                    onChange={e => {
                      const val = e.target.value.toUpperCase().trim();
                      setPartyGstin(val);
                      const code = extractStateCodeFromGSTIN(val);
                      if (code) {
                        setPartyStateCode(code);
                        setPlaceOfSupplyCode(code);
                        const s = getStateByCode(code);
                        if (s) {
                          setPartyState(s.name);
                          setPlaceOfSupply(s.name);
                        }
                        const autoGst: GstTypeOption = code !== profile.stateCode ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)';
                        handleGstTypeChange(autoGst);
                      }
                      if (val.length === 15) {
                        const details = lookupGSTINDetails(val);
                        if (details) {
                          setGstinAutofillStatus(details);
                          if (details.isVerifiedRealName && (details.tradeName || details.legalName)) {
                            // Only set party name if currently blank or generic
                            if (!partyName || partyName === 'Cash Party' || partyName.includes('New Party')) {
                              setPartyName(details.tradeName || details.legalName);
                            }
                            if (details.address && !partyAddress) {
                              setPartyAddress(details.address);
                            }
                          }
                        }
                      } else {
                        setGstinAutofillStatus(null);
                      }
                    }}
                    className="w-full px-2 py-1 text-xs font-mono uppercase bg-white border border-slate-300 rounded mt-0.5 font-bold text-slate-900"
                  />
                  {gstinAutofillStatus && (
                    <div className="mt-1 flex items-center justify-between text-[10px] bg-slate-50 px-2 py-1 rounded border border-slate-200">
                      <div className="flex items-center gap-1.5 truncate">
                        {gstinAutofillStatus.isVerifiedRealName ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate text-emerald-800">Verified: <strong>{gstinAutofillStatus.tradeName || gstinAutofillStatus.legalName}</strong></span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                            <span className="truncate text-slate-700">Valid GSTIN · {gstinAutofillStatus.state} ({gstinAutofillStatus.constitutionOfBusiness})</span>
                          </>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowBusyGstinModal(true)}
                        className="text-indigo-600 hover:text-indigo-800 font-bold underline shrink-0 ml-1 text-[10px]"
                      >
                        {gstinAutofillStatus.isVerifiedRealName ? 'Edit' : 'Autofill / Verify'}
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 block">Place of Supply (POS)</label>
                  <select
                    value={placeOfSupplyCode}
                    onChange={e => {
                      setPlaceOfSupplyCode(e.target.value);
                      const s = getStateByCode(e.target.value);
                      if (s) setPlaceOfSupply(s.name);
                      const autoGst: GstTypeOption = e.target.value !== profile.stateCode ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)';
                      handleGstTypeChange(autoGst);
                    }}
                    className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded mt-0.5"
                  >
                    {INDIAN_STATES.map(s => (
                      <option key={s.code} value={s.code}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 block">Buyer PO Number</label>
                  <input
                    type="text"
                    placeholder="e.g. PO/2026/041"
                    value={poNumber}
                    onChange={e => setPoNumber(e.target.value)}
                    className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded mt-0.5"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 block">Vehicle / Transport No.</label>
                  <input
                    type="text"
                    placeholder="e.g. MH-04-AZ-1234"
                    value={vehicleNo}
                    onChange={e => setVehicleNo(e.target.value.toUpperCase())}
                    className="w-full px-2 py-1 text-xs font-mono bg-white border border-slate-300 rounded mt-0.5 uppercase"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="text-[10px] font-bold text-slate-600 block">Billing Address</label>
                  <input
                    type="text"
                    placeholder="Factory / Office Street Address, City, Pincode"
                    value={partyAddress}
                    onChange={e => setPartyAddress(e.target.value)}
                    className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded mt-0.5"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ITEM GRID (Clean Busy 21 High-Density Data Grid) */}
          <div className="bg-white border border-slate-300 rounded-lg overflow-hidden shadow-2xs">
            <div className="px-3 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                Item Details ({lineItems.length} {lineItems.length === 1 ? 'Item' : 'Items'})
              </span>
              <button
                type="button"
                onClick={handleAddRow}
                className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded text-xs font-bold shadow-2xs transition-all"
              >
                <Plus className="h-3.5 w-3.5 text-rose-600" />
                <span>Add Item (Insert)</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 border-b border-slate-300 text-[11px] font-bold">
                    <th className="py-2 px-2 text-center w-8">#</th>
                    <th className="py-2 px-2 min-w-[220px]">Item Description</th>
                    <th className="py-2 px-1 text-center w-20">HSN/SAC</th>
                    <th className="py-2 px-1 text-right w-16">Qty</th>
                    <th className="py-2 px-1 text-center w-16">Unit</th>
                    <th className="py-2 px-1 text-right w-24">Price (₹)</th>
                    <th className="py-2 px-1 text-right w-16">Disc %</th>
                    <th className="py-2 px-2 text-right w-24">Taxable (₹)</th>
                    <th className="py-2 px-1 text-center w-20">GST %</th>
                    {isInterState ? (
                      <th className="py-2 px-2 text-right w-24">IGST (₹)</th>
                    ) : (
                      <>
                        <th className="py-2 px-1 text-right w-20">CGST (₹)</th>
                        <th className="py-2 px-1 text-right w-20">SGST (₹)</th>
                      </>
                    )}
                    <th className="py-2 px-2 text-right w-28">Amount (₹)</th>
                    <th className="py-2 px-1 text-center w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {lineItems.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-1.5 px-2 text-center text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>

                      {/* Item Selector & Name */}
                      <td className="py-1.5 px-2">
                        <div className="space-y-1">
                          <select
                            value={item.itemId || ''}
                            onChange={e => handleLineItemChange(idx, 'itemId', e.target.value)}
                            className="w-full text-xs py-1 px-1.5 border border-slate-200 rounded bg-white text-slate-700"
                          >
                            <option value="">-- Pick from catalog --</option>
                            {items.map(it => (
                              <option key={it.id} value={it.id}>
                                {it.name} {it.hasSecondaryUnit && it.secondaryUnit ? `[1 ${it.secondaryUnit} = ${it.conversionFactor} ${it.unit}]` : ''} ({it.hsnSac})
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            placeholder="Item name / particulars"
                            value={item.itemName}
                            onChange={e => handleLineItemChange(idx, 'itemName', e.target.value)}
                            className="w-full text-xs py-1 px-1.5 border border-slate-300 rounded font-semibold text-slate-900"
                          />
                        </div>
                      </td>

                      {/* HSN/SAC */}
                      <td className="py-1.5 px-1">
                        <input
                          type="text"
                          placeholder="8536"
                          value={item.hsnSac}
                          onChange={e => handleLineItemChange(idx, 'hsnSac', e.target.value)}
                          className="w-full text-xs py-1 px-1 border border-slate-300 rounded font-mono text-center"
                        />
                      </td>

                      {/* Quantity */}
                      <td className="py-1.5 px-1">
                        <input
                          type="number"
                          min="0.01"
                          step="any"
                          value={item.quantity}
                          onChange={e => handleLineItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full text-xs py-1 px-1 border border-slate-300 rounded font-mono text-right tabular-nums font-bold"
                        />
                        {item.isSecondaryUnit && item.conversionFactor && item.conversionFactor > 1 && (
                          <div 
                            className="text-[9px] font-mono text-blue-700 font-bold text-right mt-0.5 whitespace-nowrap"
                            title={`Base equivalent: ${item.quantity} × ${item.conversionFactor}`}
                          >
                            = {item.baseQuantity || (item.quantity * item.conversionFactor)}
                          </div>
                        )}
                      </td>

                      {/* Unit */}
                      <td className="py-1.5 px-1">
                        {(() => {
                          const matchedInv = items.find(i => i.id === item.itemId);
                          return (
                            <select
                              value={item.unit}
                              onChange={e => handleLineItemChange(idx, 'unit', e.target.value as UnitType)}
                              className={`w-full text-xs py-1 px-0.5 border rounded text-center font-bold ${
                                item.isSecondaryUnit
                                  ? 'bg-blue-50 border-blue-400 text-blue-800'
                                  : 'bg-white border-slate-300 text-slate-800'
                              }`}
                            >
                              {matchedInv && matchedInv.hasSecondaryUnit && matchedInv.secondaryUnit ? (
                                <optgroup label="Item Specific Units">
                                  <option value={matchedInv.unit}>
                                    {matchedInv.unit} (Base)
                                  </option>
                                  <option value={matchedInv.secondaryUnit}>
                                    📦 {matchedInv.secondaryUnit} (1={matchedInv.conversionFactor})
                                  </option>
                                </optgroup>
                              ) : null}
                              <optgroup label="All Units">
                                {COMMON_UNITS.filter(
                                  u => !(matchedInv?.hasSecondaryUnit && (u === matchedInv.unit || u === matchedInv.secondaryUnit))
                                ).map(u => (
                                  <option key={u} value={u}>
                                    {u}
                                  </option>
                                ))}
                              </optgroup>
                            </select>
                          );
                        })()}
                      </td>

                      {/* Price */}
                      <td className="py-1.5 px-1">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.price}
                          onChange={e => handleLineItemChange(idx, 'price', parseFloat(e.target.value) || 0)}
                          className="w-full text-xs py-1 px-1 border border-slate-300 rounded font-mono text-right tabular-nums font-bold"
                        />
                      </td>

                      {/* Discount % */}
                      <td className="py-1.5 px-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discountPercent}
                          onChange={e => handleLineItemChange(idx, 'discountPercent', parseFloat(e.target.value) || 0)}
                          className="w-full text-xs py-1 px-1 border border-slate-300 rounded font-mono text-right tabular-nums text-slate-600"
                        />
                      </td>

                      {/* Taxable */}
                      <td className="py-1.5 px-2 text-right font-mono text-slate-800 font-semibold tabular-nums">
                        {item.taxableAmount.toFixed(2)}
                      </td>

                      {/* GST % */}
                      <td className="py-1.5 px-1">
                        <select
                          disabled={gstType === 'Exempt / Nil'}
                          value={item.taxRate}
                          onChange={e => handleLineItemChange(idx, 'taxRate', parseInt(e.target.value, 10))}
                          className="w-full text-xs py-1 px-0.5 border border-slate-300 rounded bg-white text-center font-bold"
                        >
                          {GST_RATES.map(rate => (
                            <option key={rate} value={rate}>
                              {rate}%
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Tax Split */}
                      {isInterState ? (
                        <td className="py-1.5 px-2 text-right font-mono text-blue-700 font-semibold tabular-nums">
                          {item.igstAmount.toFixed(2)}
                        </td>
                      ) : (
                        <>
                          <td className="py-1.5 px-1 text-right font-mono text-emerald-700 tabular-nums">
                            {item.cgstAmount.toFixed(2)}
                          </td>
                          <td className="py-1.5 px-1 text-right font-mono text-emerald-700 tabular-nums">
                            {item.sgstAmount.toFixed(2)}
                          </td>
                        </>
                      )}

                      {/* Total */}
                      <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-900 tabular-nums">
                        {item.totalAmount.toFixed(2)}
                      </td>

                      {/* Remove Row */}
                      <td className="py-1.5 px-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(idx)}
                          className="text-slate-300 hover:text-rose-600"
                          title="Remove row"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* BOTTOM SUMMARY & ACTIONS BAR */}
          <div className="bg-white p-3.5 rounded-lg border border-slate-300 shadow-2xs grid grid-cols-1 sm:grid-cols-12 gap-4 text-xs">
            {/* Left Column: Payment & Remarks (7 cols) */}
            <div className="sm:col-span-7 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 text-[11px] block">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={e => setPaymentMode(e.target.value as PaymentMode)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-medium"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer / NEFT">Bank Transfer / NEFT</option>
                    <option value="UPI">UPI</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Credit">Credit (Full Unpaid)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 text-[11px] block">Amount Received / Paid</label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={paidAmount}
                      onChange={e => setPaidAmount(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 font-mono font-bold border border-slate-300 rounded tabular-nums text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => setPaidAmount(grandTotal)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-[11px] font-bold whitespace-nowrap"
                    >
                      Full
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 text-[11px] block">Narration / Notes</label>
                <input
                  type="text"
                  placeholder="Notes printed on bill..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-2.5 py-1 border border-slate-300 rounded"
                />
              </div>

              <div className="text-[11px] text-slate-500 font-semibold italic">
                Amount In Words: <strong className="text-slate-900">{numberToWordsINR(grandTotal)}</strong>
              </div>
            </div>

            {/* Right Column: Financial Totals (5 cols) */}
            <div className="sm:col-span-5 bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Gross):</span>
                <span className="font-mono tabular-nums">{formatINR(subTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Taxable Value:</span>
                <span className="font-mono tabular-nums font-semibold text-slate-800">{formatINR(totalTaxable)}</span>
              </div>
              {isInterState ? (
                <div className="flex justify-between text-blue-700 font-semibold">
                  <span>IGST Total:</span>
                  <span className="font-mono tabular-nums">{formatINR(igstTotal)}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-emerald-700">
                    <span>CGST Total:</span>
                    <span className="font-mono tabular-nums font-semibold">{formatINR(cgstTotal)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span>SGST Total:</span>
                    <span className="font-mono tabular-nums font-semibold">{formatINR(sgstTotal)}</span>
                  </div>
                </>
              )}
              {roundOff !== 0 && (
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Round Off:</span>
                  <span className="font-mono tabular-nums">{roundOff > 0 ? `+${roundOff}` : roundOff}</span>
                </div>
              )}
              <div className="flex justify-between border-t-2 border-slate-800 pt-1 text-sm font-bold text-slate-900">
                <span>Total Amount:</span>
                <span className="font-mono tabular-nums text-rose-700 text-base">{formatINR(grandTotal)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-rose-600">
                <span>Balance Due:</span>
                <span className="font-mono tabular-nums">{formatINR(balanceDue)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="px-5 py-2.5 bg-slate-100 border-t border-slate-300 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSave(false)}
              className="px-4 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded text-xs font-bold shadow-2xs transition-colors"
            >
              Save Voucher
            </button>

            <button
              type="button"
              onClick={() => handleSave(true)}
              className="flex items-center gap-1.5 px-5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold shadow-xs transition-colors active:scale-95"
            >
              <Printer className="h-4 w-4" />
              <span>Save & Print (F2)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Add Party Modal */}
      {showAddPartyModal && (
        <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5 border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-slate-900">
                Quick Add {type === 'purchase' ? 'Supplier' : 'Customer'}
              </h3>
              <button
                onClick={() => setShowAddPartyModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-medium text-slate-700">Party / Firm Name *</label>
                <input
                  type="text"
                  value={newPartyName}
                  onChange={e => setNewPartyName(e.target.value)}
                  placeholder="e.g. Reliance Projects Ltd"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded mt-1 font-semibold"
                />
              </div>
              <div>
                <label className="font-medium text-slate-700">Phone Number</label>
                <input
                  type="text"
                  value={newPartyPhone}
                  onChange={e => setNewPartyPhone(e.target.value)}
                  placeholder="+91..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded mt-1"
                />
              </div>
              <div>
                <label className="font-medium text-slate-700">GSTIN (Optional)</label>
                <input
                  type="text"
                  value={newPartyGstin}
                  onChange={e => {
                    const val = e.target.value.toUpperCase();
                    setNewPartyGstin(val);
                    const code = extractStateCodeFromGSTIN(val);
                    if (code) setNewPartyStateCode(code);
                  }}
                  placeholder="15 Characters"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded mt-1 font-mono uppercase"
                />
              </div>
              <div>
                <label className="font-medium text-slate-700">State *</label>
                <select
                  value={newPartyStateCode}
                  onChange={e => setNewPartyStateCode(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded mt-1"
                >
                  {INDIAN_STATES.map(s => (
                    <option key={s.code} value={s.code}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddPartyModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleQuickAddParty}
                  className="px-4 py-1.5 bg-rose-600 text-white rounded font-semibold hover:bg-rose-700"
                >
                  Add Party
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BUSY 21 GSTIN Online Verification Modal */}
      <BusyGstinModal
        isOpen={showBusyGstinModal}
        onClose={() => setShowBusyGstinModal(false)}
        initialGstin={partyGstin}
        companyStateCode={profile.stateCode}
        targetEntityLabel="Invoice"
        onApply={handleApplyBusyGstin}
      />
    </div>
  );
};
