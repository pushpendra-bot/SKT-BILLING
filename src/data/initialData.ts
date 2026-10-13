import {
  BusinessProfile,
  BusinessSlotData,
  Party,
  InventoryItem,
  Invoice,
  Expense,
  JournalEntry,
} from '../types';
import { secureEncrypt, secureDecrypt } from '../utils/securityUtils';

export const createBlankProfile = (slotNum: number, name: string): BusinessProfile => ({
  businessName: name,
  tagline: 'GST Billing & Invoicing',
  gstin: '',
  pan: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: 'Maharashtra',
  stateCode: '27',
  pincode: '',
  bankName: '',
  accountNo: '',
  ifscCode: '',
  branch: '',
  upiId: '',
  invoicePrefix: `QH${slotNum}/2026-27/`,
  termsAndConditions: '1. Goods once sold will not be taken back.\n2. Interest @ 18% p.a. will be charged if payment is delayed beyond 30 days.\n3. Subject to local jurisdiction.\n4. E. & O.E.',
  signatoryName: `For ${name}\nAuthorized Signatory`,
  invoiceTheme: 'vyapar_classic',
});

export const DEFAULT_SLOTS: BusinessSlotData[] = [
  {
    slotId: 1,
    slotName: 'Business Profile 1',
    profile: {
      ...createBlankProfile(1, 'SKT Billing Business 1'),
      gstin: '',
      pan: '',
    },
    parties: [],
    items: [],
    invoices: [],
    expenses: [],
    journals: [],
    smsLogs: [],
  },
  {
    slotId: 2,
    slotName: 'Business Profile 2',
    profile: createBlankProfile(2, 'Business Profile 2'),
    parties: [],
    items: [],
    invoices: [],
    expenses: [],
    journals: [],
    smsLogs: [],
  },
  {
    slotId: 3,
    slotName: 'Business Profile 3',
    profile: createBlankProfile(3, 'Business Profile 3'),
    parties: [],
    items: [],
    invoices: [],
    expenses: [],
    journals: [],
    smsLogs: [],
  },
  {
    slotId: 4,
    slotName: 'Business Profile 4',
    profile: createBlankProfile(4, 'Business Profile 4'),
    parties: [],
    items: [],
    invoices: [],
    expenses: [],
    journals: [],
    smsLogs: [],
  },
  {
    slotId: 5,
    slotName: 'Business Profile 5',
    profile: createBlankProfile(5, 'Business Profile 5'),
    parties: [],
    items: [],
    invoices: [],
    expenses: [],
    journals: [],
    smsLogs: [],
  },
  {
    slotId: 6,
    slotName: 'Business Profile 6',
    profile: createBlankProfile(6, 'Business Profile 6'),
    parties: [],
    items: [],
    invoices: [],
    expenses: [],
    journals: [],
    smsLogs: [],
  },
  {
    slotId: 7,
    slotName: 'Business Profile 7',
    profile: createBlankProfile(7, 'Business Profile 7'),
    parties: [],
    items: [],
    invoices: [],
    expenses: [],
    journals: [],
    smsLogs: [],
  },
];

export const STORAGE_KEYS = {
  ACTIVE_SLOT: 'skt_billing_active_slot_v2',
  SLOTS_DATA: 'skt_billing_business_slots_v2',
  PURGED_FLAG: 'skt_billing_purged_dummy_data_v2',
};

export function loadSlotsData(): { activeSlotId: number; slots: BusinessSlotData[] } {
  try {
    const isPurged = localStorage.getItem(STORAGE_KEYS.PURGED_FLAG);
    if (!isPurged) {
      localStorage.removeItem('quick_hisaab_business_profile');
      localStorage.removeItem('quick_hisaab_parties');
      localStorage.removeItem('quick_hisaab_inventory_items');
      localStorage.removeItem('quick_hisaab_invoices');
      localStorage.removeItem('quick_hisaab_expenses');
      localStorage.removeItem('quick_hisaab_journal_entries');
      localStorage.setItem(STORAGE_KEYS.PURGED_FLAG, 'true');
    }

    const storedActive = localStorage.getItem(STORAGE_KEYS.ACTIVE_SLOT);
    const activeSlotId = storedActive ? parseInt(storedActive, 10) : 1;

    const storedSlots = localStorage.getItem(STORAGE_KEYS.SLOTS_DATA);
    if (storedSlots) {
      let parsedSlots: BusinessSlotData[] | null = null;
      if (storedSlots.startsWith('SKTSALTED_ENC_')) {
        parsedSlots = secureDecrypt<BusinessSlotData[], null>(storedSlots, null);
      } else {
        try {
          const raw = JSON.parse(storedSlots);
          if (Array.isArray(raw)) {
            parsedSlots = raw;
          } else if (raw && Array.isArray(raw.slots)) {
            parsedSlots = raw.slots;
          }
        } catch {
          parsedSlots = null;
        }
      }

      if (parsedSlots && Array.isArray(parsedSlots) && parsedSlots.length > 0) {
        const mergedSlots: BusinessSlotData[] = [...parsedSlots];
        for (let i = mergedSlots.length + 1; i <= DEFAULT_SLOTS.length; i++) {
          mergedSlots.push({
            slotId: i,
            slotName: `Business Profile ${i}`,
            profile: createBlankProfile(i, `Business Profile ${i}`),
            parties: [],
            items: [],
            invoices: [],
            expenses: [],
            journals: [],
            smsLogs: [],
          });
        }
        const encData = secureEncrypt(mergedSlots);
        localStorage.setItem(STORAGE_KEYS.SLOTS_DATA, encData);
        return { activeSlotId: (activeSlotId >= 1 && activeSlotId <= mergedSlots.length) ? activeSlotId : 1, slots: mergedSlots };
      }
    }

    const defaultEnc = secureEncrypt(DEFAULT_SLOTS);
    localStorage.setItem(STORAGE_KEYS.SLOTS_DATA, defaultEnc);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SLOT, '1');
    return { activeSlotId: 1, slots: DEFAULT_SLOTS };
  } catch {
    return { activeSlotId: 1, slots: DEFAULT_SLOTS };
  }
}

export function saveSlotsData(slots: BusinessSlotData[], activeSlotId: number) {
  try {
    const encrypted = secureEncrypt(slots);
    localStorage.setItem(STORAGE_KEYS.SLOTS_DATA, encrypted);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SLOT, activeSlotId.toString());
  } catch (err) {
    console.error('Failed to save slots data to localStorage', err);
  }
}

export function resetAllSlots() {
  const defaultEnc = secureEncrypt(DEFAULT_SLOTS);
  localStorage.setItem(STORAGE_KEYS.SLOTS_DATA, defaultEnc);
  localStorage.setItem(STORAGE_KEYS.ACTIVE_SLOT, '1');
  window.location.reload();
}
