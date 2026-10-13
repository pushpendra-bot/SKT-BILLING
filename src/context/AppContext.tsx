import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  BusinessProfile,
  BusinessSlotData,
  Party,
  InventoryItem,
  Invoice,
  Expense,
  JournalEntry,
  LedgerTransaction,
  InvoiceType,
  SubscriptionPlan,
  SmsLog,
} from '../types';
import {
  loadSlotsData,
  saveSlotsData,
  resetAllSlots,
} from '../data/initialData';
import {
  getInitialSubscription,
  saveSubscription,
} from '../utils/subscriptionUtils';

interface AppContextType {
  slots: BusinessSlotData[];
  activeSlotId: number;
  setActiveSlotId: (slotId: number) => void;
  updateSlotName: (slotId: number, newName: string) => void;
  updateSlotProfile: (slotId: number, profile: BusinessProfile) => void;
  updateSlotPassword: (slotId: number, password?: string) => void;
  unlockedSlotIds: number[];
  unlockSlot: (slotId: number) => void;

  subscription: SubscriptionPlan;
  updateSubscription: (plan: SubscriptionPlan) => void;

  profile: BusinessProfile;
  setProfile: (profile: BusinessProfile) => void;
  parties: Party[];
  items: InventoryItem[];
  invoices: Invoice[];
  expenses: Expense[];
  journals: JournalEntry[];
  smsLogs: SmsLog[];
  
  // Invoice actions
  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt'>) => Invoice;
  updateInvoice: (invoice: Invoice) => void;
  deleteInvoice: (id: string) => void;
  convertQuotationToSale: (quotationId: string) => Invoice | null;
  convertChallanToSale: (challanId: string) => Invoice | null;
  
  // SMS actions
  sendSmsNotification: (recipientPhone: string, recipientName: string, messageType: 'invoice_created' | 'payment_recorded' | 'manual_alert', referenceNumber: string, messageBody: string) => void;
  clearSmsLogs: () => void;
  
  // Item actions
  addItem: (item: Omit<InventoryItem, 'id' | 'updatedAt'>) => InventoryItem;
  updateItem: (item: InventoryItem) => void;
  adjustStock: (itemId: string, qtyDelta: number, reason: string) => void;
  
  // Party actions
  addParty: (party: Omit<Party, 'id' | 'createdAt' | 'currentBalance'>) => Party;
  updateParty: (party: Party) => void;
  deleteParty: (id: string) => void;
  
  // Expense actions
  addExpense: (expense: Omit<Expense, 'id'>) => Expense;
  deleteExpense: (id: string) => void;
  
  // Journal actions
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt'>) => JournalEntry;
  
  // Helpers & Ledger
  getLedgerTransactions: (partyIdOrName?: string) => LedgerTransaction[];
  resetData: () => void;
  nextInvoiceNumber: (type: InvoiceType) => string;
  restoreSlotsData: (newSlots: BusinessSlotData[], newActiveSlotId?: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const initial = loadSlotsData();

  const [slots, setSlots] = useState<BusinessSlotData[]>(initial.slots);
  const [activeSlotId, setActiveSlotIdState] = useState<number>(initial.activeSlotId || 1);
  const [unlockedSlotIds, setUnlockedSlotIds] = useState<number[]>([initial.activeSlotId || 1]);
  const [subscription, setSubscriptionState] = useState<SubscriptionPlan>(() => getInitialSubscription());

  const updateSubscription = (plan: SubscriptionPlan) => {
    setSubscriptionState(plan);
    saveSubscription(plan);
  };

  const unlockSlot = (slotId: number) => {
    if (!unlockedSlotIds.includes(slotId)) {
      setUnlockedSlotIds(prev => [...prev, slotId]);
    }
    setActiveSlotIdState(slotId);
  };

  const updateSlotPassword = (slotId: number, password?: string) => {
    setSlots(prev =>
      prev.map(slot =>
        slot.slotId === slotId
          ? {
              ...slot,
              password: password && password.trim() ? password.trim() : undefined,
            }
          : slot
      )
    );
  };

  // Sync to local storage whenever slots or activeSlotId changes
  useEffect(() => {
    saveSlotsData(slots, activeSlotId);
  }, [slots, activeSlotId]);

  const activeSlot = slots.find(s => s.slotId === activeSlotId) || slots[0];

  const profile = activeSlot.profile;
  const parties = activeSlot.parties || [];
  const items = activeSlot.items || [];
  const invoices = activeSlot.invoices || [];
  const expenses = activeSlot.expenses || [];
  const journals = activeSlot.journals || [];
  const smsLogs = activeSlot.smsLogs || [];

  const setActiveSlotId = (id: number) => {
    if (id >= 1 && id <= slots.length) {
      setActiveSlotIdState(id);
    }
  };

  const updateSlotName = (slotId: number, newName: string) => {
    setSlots(prev =>
      prev.map(slot =>
        slot.slotId === slotId
          ? {
              ...slot,
              slotName: newName,
              profile: { ...slot.profile, businessName: newName },
            }
          : slot
      )
    );
  };

  const setProfile = (newProfile: BusinessProfile) => {
    setSlots(prev =>
      prev.map(slot =>
        slot.slotId === activeSlotId
          ? {
              ...slot,
              slotName: newProfile.businessName || slot.slotName,
              profile: newProfile,
            }
          : slot
      )
    );
  };

  const updateSlotProfile = (slotId: number, newProfile: BusinessProfile) => {
    setSlots(prev =>
      prev.map(slot =>
        slot.slotId === slotId
          ? {
              ...slot,
              slotName: newProfile.businessName || slot.slotName,
              profile: newProfile,
            }
          : slot
      )
    );
  };

  // Generate sequence invoice numbers per slot
  const nextInvoiceNumber = (type: InvoiceType): string => {
    const prefix = profile.invoicePrefix || `QH${activeSlotId}/2026-27/`;
    const filtered = invoices.filter(inv => inv.type === type);
    const count = filtered.length + 1;
    const padded = String(count).padStart(4, '0');

    if (type === 'sale') return `${prefix}${padded}`;
    if (type === 'quotation') return `QT${activeSlotId}/2026-27/${padded}`;
    if (type === 'delivery_challan') return `DC${activeSlotId}/2026-27/${padded}`;
    if (type === 'purchase') return `PB${activeSlotId}/2026-27/${padded}`;
    if (type === 'sale_return') return `SR${activeSlotId}/2026-27/${padded}`;
    if (type === 'purchase_return') return `PR${activeSlotId}/2026-27/${padded}`;
    return `DOC${activeSlotId}/2026-27/${padded}`;
  };

  // Add Invoice to active slot
  const addInvoice = (data: Omit<Invoice, 'id' | 'createdAt'>): Invoice => {
    const newInvoice: Invoice = {
      ...data,
      id: `inv-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    setSlots(prev =>
      prev.map(slot => {
        if (slot.slotId !== activeSlotId) return slot;

        // 1. Stock update
        let updatedItems = [...slot.items];
        if (newInvoice.type === 'sale') {
          updatedItems = updatedItems.map(item => {
            const matchedLine = newInvoice.items.find(i => i.itemId === item.id);
            if (matchedLine) {
              const deductQty = matchedLine.baseQuantity !== undefined ? matchedLine.baseQuantity : matchedLine.quantity;
              return {
                ...item,
                currentStock: Math.max(0, item.currentStock - deductQty),
                updatedAt: new Date().toISOString().split('T')[0],
              };
            }
            return item;
          });
        } else if (newInvoice.type === 'purchase') {
          updatedItems = updatedItems.map(item => {
            const matchedLine = newInvoice.items.find(i => i.itemId === item.id);
            if (matchedLine) {
              const addQty = matchedLine.baseQuantity !== undefined ? matchedLine.baseQuantity : matchedLine.quantity;
              return {
                ...item,
                currentStock: item.currentStock + addQty,
                updatedAt: new Date().toISOString().split('T')[0],
              };
            }
            return item;
          });
        }

        // 2. Party balance updates
        let updatedParties = [...slot.parties];
        if (newInvoice.type === 'sale' || newInvoice.type === 'purchase') {
          updatedParties = updatedParties.map(p => {
            if (p.id === newInvoice.partyId) {
              return {
                ...p,
                currentBalance: p.currentBalance + newInvoice.balanceDue,
              };
            }
            return p;
          });
        }

        // 3. Auto-journal entry for sale
        let updatedJournals = [...slot.journals];
        if (newInvoice.type === 'sale') {
          const newJournal: JournalEntry = {
            id: `je-${Date.now()}`,
            entryNumber: `JV-${new Date().getFullYear()}-${String(slot.journals.length + 1).padStart(3, '0')}`,
            date: newInvoice.date,
            debitAccount: newInvoice.paidAmount >= newInvoice.grandTotal ? 'Bank / Cash A/C' : newInvoice.partyName,
            creditAccount: 'Sales A/C',
            amount: newInvoice.grandTotal,
            narration: `Being sales invoice issued #${newInvoice.invoiceNumber}`,
            referenceType: 'sale',
            referenceId: newInvoice.id,
            createdAt: new Date().toISOString(),
          };
          updatedJournals = [newJournal, ...updatedJournals];
        }

        return {
          ...slot,
          items: updatedItems,
          parties: updatedParties,
          invoices: [newInvoice, ...slot.invoices],
          journals: updatedJournals,
        };
      })
    );

    if (newInvoice.partyPhone && (newInvoice.type === 'sale' || newInvoice.type === 'purchase')) {
      const msg = `Dear ${newInvoice.partyName}, Invoice #${newInvoice.invoiceNumber} (Amt: Rs.${newInvoice.grandTotal.toFixed(2)}) generated by ${profile.businessName}. Due: ${newInvoice.dueDate}. Thank you!`;
      sendSmsNotification(newInvoice.partyPhone, newInvoice.partyName, 'invoice_created', newInvoice.invoiceNumber, msg);
    }

    return newInvoice;
  };

  const updateInvoice = (updated: Invoice) => {
    const existing = invoices.find(i => i.id === updated.id);
    if (existing && updated.paidAmount > existing.paidAmount) {
      const paidDiff = updated.paidAmount - existing.paidAmount;
      if (updated.partyPhone) {
        const msg = `Dear ${updated.partyName}, We received your payment of Rs.${paidDiff.toFixed(2)} against #${updated.invoiceNumber}. Balance Due: Rs.${updated.balanceDue.toFixed(2)}. Thank you! - ${profile.businessName}`;
        sendSmsNotification(updated.partyPhone, updated.partyName, 'payment_recorded', updated.invoiceNumber, msg);
      }
    }

    setSlots(prev =>
      prev.map(slot =>
        slot.slotId === activeSlotId
          ? {
              ...slot,
              invoices: slot.invoices.map(inv => (inv.id === updated.id ? updated : inv)),
            }
          : slot
      )
    );
  };

  const deleteInvoice = (id: string) => {
    setSlots(prev =>
      prev.map(slot => {
        if (slot.slotId !== activeSlotId) return slot;
        const target = slot.invoices.find(i => i.id === id);
        if (!target) return slot;

        let updatedItems = [...slot.items];
        let updatedParties = [...slot.parties];

        if (target.type === 'sale') {
          updatedItems = updatedItems.map(item => {
            const matchedLine = target.items.find(i => i.itemId === item.id);
            if (matchedLine) {
              const qtyToRestore = matchedLine.baseQuantity !== undefined ? matchedLine.baseQuantity : matchedLine.quantity;
              return {
                ...item,
                currentStock: item.currentStock + qtyToRestore,
              };
            }
            return item;
          });
          updatedParties = updatedParties.map(p =>
            p.id === target.partyId ? { ...p, currentBalance: Math.max(0, p.currentBalance - target.balanceDue) } : p
          );
        } else if (target.type === 'purchase') {
          updatedItems = updatedItems.map(item => {
            const matchedLine = target.items.find(i => i.itemId === item.id);
            if (matchedLine) {
              const qtyToReduce = matchedLine.baseQuantity !== undefined ? matchedLine.baseQuantity : matchedLine.quantity;
              return {
                ...item,
                currentStock: Math.max(0, item.currentStock - qtyToReduce),
              };
            }
            return item;
          });
          updatedParties = updatedParties.map(p =>
            p.id === target.partyId ? { ...p, currentBalance: Math.max(0, p.currentBalance - target.balanceDue) } : p
          );
        }

        return {
          ...slot,
          items: updatedItems,
          parties: updatedParties,
          invoices: slot.invoices.filter(i => i.id !== id),
        };
      })
    );
  };

  const convertQuotationToSale = (quotationId: string): Invoice | null => {
    const quote = invoices.find(i => i.id === quotationId && i.type === 'quotation');
    if (!quote) return null;

    const saleNumber = nextInvoiceNumber('sale');
    const today = new Date().toISOString().split('T')[0];

    const saleInvoice: Omit<Invoice, 'id' | 'createdAt'> = {
      ...quote,
      type: 'sale',
      invoiceNumber: saleNumber,
      date: today,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Unpaid',
      balanceDue: quote.grandTotal,
      paidAmount: 0,
      originalQuotationId: quote.id,
      notes: `Converted from Quotation #${quote.invoiceNumber}`,
    };

    // Mark original quote as converted
    updateInvoice({ ...quote, status: 'Converted' });

    return addInvoice(saleInvoice);
  };

  const convertChallanToSale = (challanId: string): Invoice | null => {
    const challan = invoices.find(i => i.id === challanId && i.type === 'delivery_challan');
    if (!challan) return null;

    const saleNumber = nextInvoiceNumber('sale');
    const today = new Date().toISOString().split('T')[0];

    const saleInvoice: Omit<Invoice, 'id' | 'createdAt'> = {
      ...challan,
      type: 'sale',
      invoiceNumber: saleNumber,
      date: today,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Unpaid',
      balanceDue: challan.grandTotal,
      paidAmount: 0,
      originalQuotationId: challan.id,
      notes: `Billed against Delivery Challan #${challan.invoiceNumber}`,
    };

    updateInvoice({ ...challan, status: 'Converted' });
    return addInvoice(saleInvoice);
  };

  // Item actions
  const addItem = (itemData: Omit<InventoryItem, 'id' | 'updatedAt'>): InventoryItem => {
    const newItem: InventoryItem = {
      ...itemData,
      id: `it-${Date.now()}`,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setSlots(prev =>
      prev.map(slot =>
        slot.slotId === activeSlotId
          ? { ...slot, items: [newItem, ...slot.items] }
          : slot
      )
    );
    return newItem;
  };

  const updateItem = (item: InventoryItem) => {
    setSlots(prev =>
      prev.map(slot =>
        slot.slotId === activeSlotId
          ? {
              ...slot,
              items: slot.items.map(i => (i.id === item.id ? { ...item, updatedAt: new Date().toISOString().split('T')[0] } : i)),
            }
          : slot
      )
    );
  };

  const adjustStock = (itemId: string, qtyDelta: number, reason: string) => {
    setSlots(prev =>
      prev.map(slot =>
        slot.slotId === activeSlotId
          ? {
              ...slot,
              items: slot.items.map(item => {
                if (item.id === itemId) {
                  return {
                    ...item,
                    currentStock: Math.max(0, item.currentStock + qtyDelta),
                    updatedAt: new Date().toISOString().split('T')[0],
                  };
                }
                return item;
              }),
            }
          : slot
      )
    );
  };

  // Party actions
  const addParty = (partyData: Omit<Party, 'id' | 'createdAt' | 'currentBalance'>): Party => {
    const newParty: Party = {
      ...partyData,
      id: `p-${Date.now()}`,
      currentBalance: partyData.openingBalance || 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setSlots(prev =>
      prev.map(slot =>
        slot.slotId === activeSlotId
          ? { ...slot, parties: [newParty, ...slot.parties] }
          : slot
      )
    );
    return newParty;
  };

  const updateParty = (party: Party) => {
    setSlots(prev =>
      prev.map(slot =>
        slot.slotId === activeSlotId
          ? { ...slot, parties: slot.parties.map(p => (p.id === party.id ? party : p)) }
          : slot
      )
    );
  };

  const deleteParty = (id: string) => {
    setSlots(prev =>
      prev.map(slot =>
        slot.slotId === activeSlotId
          ? { ...slot, parties: slot.parties.filter(p => p.id !== id) }
          : slot
      )
    );
  };

  // Expense actions
  const addExpense = (expenseData: Omit<Expense, 'id'>): Expense => {
    const newExpense: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
    };

    const newJournal: JournalEntry = {
      id: `je-${Date.now()}`,
      entryNumber: `JV-${new Date().getFullYear()}-${String(journals.length + 1).padStart(3, '0')}`,
      date: newExpense.date,
      debitAccount: `${newExpense.category} A/C`,
      creditAccount: newExpense.paymentMethod.includes('Cash') ? 'Cash A/C' : 'Bank A/C',
      amount: newExpense.totalAmount,
      narration: `Being expense incurred for ${newExpense.category} - ${newExpense.notes || newExpense.vendorName}`,
      referenceType: 'expense',
      referenceId: newExpense.id,
      createdAt: new Date().toISOString(),
    };

    setSlots(prev =>
      prev.map(slot =>
        slot.slotId === activeSlotId
          ? {
              ...slot,
              expenses: [newExpense, ...slot.expenses],
              journals: [newJournal, ...slot.journals],
            }
          : slot
      )
    );

    return newExpense;
  };

  const deleteExpense = (id: string) => {
    setSlots(prev =>
      prev.map(slot =>
        slot.slotId === activeSlotId
          ? { ...slot, expenses: slot.expenses.filter(e => e.id !== id) }
          : slot
      )
    );
  };

  // SMS actions
  const sendSmsNotification = (
    recipientPhone: string,
    recipientName: string,
    messageType: 'invoice_created' | 'payment_recorded' | 'manual_alert',
    referenceNumber: string,
    messageBody: string
  ) => {
    if (!recipientPhone || !recipientPhone.trim()) return;
    const newSms: SmsLog = {
      id: `sms-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      recipientPhone: recipientPhone.trim(),
      recipientName: recipientName || 'Client',
      messageType,
      referenceNumber,
      messageBody,
      status: 'Sent',
    };

    setSlots(prev =>
      prev.map(slot =>
        slot.slotId === activeSlotId
          ? { ...slot, smsLogs: [newSms, ...slot.smsLogs] }
          : slot
      )
    );
  };

  const clearSmsLogs = () => {
    setSlots(prev =>
      prev.map(slot =>
        slot.slotId === activeSlotId ? { ...slot, smsLogs: [] } : slot
      )
    );
  };

  // Journal actions
  const addJournalEntry = (entryData: Omit<JournalEntry, 'id' | 'createdAt'>): JournalEntry => {
    const newEntry: JournalEntry = {
      ...entryData,
      id: `je-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setSlots(prev =>
      prev.map(slot =>
        slot.slotId === activeSlotId
          ? { ...slot, journals: [newEntry, ...slot.journals] }
          : slot
      )
    );
    return newEntry;
  };

  // General Ledger generator
  const getLedgerTransactions = (partyIdOrName?: string): LedgerTransaction[] => {
    const transactions: LedgerTransaction[] = [];

    invoices.forEach(inv => {
      if (inv.type === 'quotation') return;
      if (partyIdOrName && inv.partyId !== partyIdOrName && inv.partyName !== partyIdOrName) {
        return;
      }

      if (inv.type === 'sale') {
        transactions.push({
          id: `t-${inv.id}`,
          date: inv.date,
          type: 'Sale',
          refNo: inv.invoiceNumber,
          partyOrAccount: inv.partyName,
          narration: `Sale Invoice #${inv.invoiceNumber} (Taxable ₹${inv.totalTaxable.toFixed(2)} + GST ₹${inv.totalTax.toFixed(2)})`,
          debit: inv.grandTotal,
          credit: 0,
        });

        if (inv.paidAmount > 0) {
          transactions.push({
            id: `tp-${inv.id}`,
            date: inv.date,
            type: 'Payment In',
            refNo: `REC-${inv.invoiceNumber}`,
            partyOrAccount: inv.partyName,
            narration: `Payment received via ${inv.paymentMode} against #${inv.invoiceNumber}`,
            debit: 0,
            credit: inv.paidAmount,
          });
        }
      } else if (inv.type === 'purchase') {
        transactions.push({
          id: `t-${inv.id}`,
          date: inv.date,
          type: 'Purchase',
          refNo: inv.invoiceNumber,
          partyOrAccount: inv.partyName,
          narration: `Purchase Bill #${inv.invoiceNumber}`,
          debit: 0,
          credit: inv.grandTotal,
        });
      }
    });

    if (!partyIdOrName) {
      expenses.forEach(exp => {
        transactions.push({
          id: `t-${exp.id}`,
          date: exp.date,
          type: 'Expense',
          refNo: exp.expenseNumber,
          partyOrAccount: exp.category,
          narration: `${exp.vendorName} - ${exp.notes || 'Operating Expense'}`,
          debit: exp.totalAmount,
          credit: 0,
        });
      });

      journals.forEach(je => {
        transactions.push({
          id: `t-${je.id}`,
          date: je.date,
          type: 'Journal Entry',
          refNo: je.entryNumber,
          partyOrAccount: `${je.debitAccount} / ${je.creditAccount}`,
          narration: je.narration,
          debit: je.amount,
          credit: je.amount,
        });
      });
    }

    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let runningBalance = 0;
    return transactions.map(tx => {
      runningBalance += tx.debit - tx.credit;
      return { ...tx, balance: runningBalance };
    });
  };

  const resetData = () => {
    resetAllSlots();
  };

  const restoreSlotsData = (newSlots: BusinessSlotData[], newActiveSlotId?: number) => {
    setSlots(newSlots);
    const targetSlot = newActiveSlotId && newActiveSlotId >= 1 && newActiveSlotId <= newSlots.length ? newActiveSlotId : activeSlotId;
    setActiveSlotIdState(targetSlot);
    saveSlotsData(newSlots, targetSlot);
  };

  return (
    <AppContext.Provider
      value={{
        slots,
        activeSlotId,
        setActiveSlotId,
        updateSlotName,
        updateSlotProfile,
        updateSlotPassword,
        unlockedSlotIds,
        unlockSlot,
        subscription,
        updateSubscription,
        profile,
        setProfile,
        parties,
        items,
        invoices,
        expenses,
        journals,
        smsLogs,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        convertQuotationToSale,
        convertChallanToSale,
        sendSmsNotification,
        clearSmsLogs,
        addItem,
        updateItem,
        adjustStock,
        addParty,
        updateParty,
        deleteParty,
        addExpense,
        deleteExpense,
        addJournalEntry,
        getLedgerTransactions,
        resetData,
        nextInvoiceNumber,
        restoreSlotsData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
