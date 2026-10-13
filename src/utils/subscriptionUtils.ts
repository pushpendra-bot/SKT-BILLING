import { SubscriptionPlan, SubscriptionReceivingBankDetails } from '../types';
import { secureEncrypt, secureDecrypt } from './securityUtils';

const SUBSCRIPTION_STORAGE_KEY = 'skt_billing_subscription_v3';
const RECEIVING_BANK_STORAGE_KEY = 'skt_billing_subscription_bank_details';

export const TRIAL_DAYS = 7; // FIRST 7 DAYS FREE TRIAL
export const BASE_ANNUAL_PRICE = 1000; // 1000 RUPEES A YEAR
export const SUBSCRIPTION_CONTACT_NO = '9983854821'; // CONTACT NO FOR SUBSCRIPTION

export const DEFAULT_RECEIVING_BANK: SubscriptionReceivingBankDetails = {
  accountHolderName: 'Chatack Enterprises',
  accountNumber: '827864409012',
  ifscCode: 'SBIN0031804',
  bankName: 'State Bank of India',
  branch: 'Main City Branch',
  upiId: '9983854821@ybl',
  phone: '9983854821',
  email: 'chatackenterprises@gmail.com',
};

const USED_COUPONS_STORAGE_KEY = 'skt_billing_used_coupons_v1';

export function getUsedCoupons(): string[] {
  try {
    const stored = localStorage.getItem(USED_COUPONS_STORAGE_KEY);
    if (stored) {
      return secureDecrypt<string[]>(stored, []);
    }
  } catch (e) {
    console.error('Failed reading used coupons', e);
  }
  return [];
}

export function markCouponAsUsed(code: string): void {
  try {
    const used = getUsedCoupons();
    const normalized = code.trim().toUpperCase();
    if (!used.includes(normalized)) {
      used.push(normalized);
      localStorage.setItem(USED_COUPONS_STORAGE_KEY, secureEncrypt(used));
    }
  } catch (e) {
    console.error('Failed marking coupon as used', e);
  }
}

/**
 * Validate coupon code (One-time use per coupon code with tamper protection).
 */
export function validateAndRedeemCoupon(
  code: string,
  basePrice: number = BASE_ANNUAL_PRICE
): {
  isValid: boolean;
  discountAmount: number;
  finalPrice: number;
  error?: string;
} {
  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    return {
      isValid: false,
      discountAmount: 0,
      finalPrice: basePrice,
      error: 'Please enter a valid coupon code.',
    };
  }

  const validCoupons = [
    'SKT00',
    'SKT-01-100', 'SKT-02-100', 'SKT-03-100', 'SKT-04-100', 'SKT-05-100',
    'SKT-06-100', 'SKT-07-100', 'SKT-08-100', 'SKT-09-100', 'SKT-10-100',
    'SKT-11-100', 'SKT-12-100', 'SKT-13-100', 'SKT-14-100', 'SKT-15-100',
    'SKT-16-100', 'SKT-17-100', 'SKT-18-100', 'SKT-19-100', 'SKT-20-100',
    'FREE100', 'GIFT100', 'TEST100'
  ];

  if (!validCoupons.includes(normalized)) {
    return {
      isValid: false,
      discountAmount: 0,
      finalPrice: basePrice,
      error: `Coupon "${normalized}" is invalid.`,
    };
  }

  const usedCoupons = getUsedCoupons();
  if (usedCoupons.includes(normalized)) {
    return {
      isValid: false,
      discountAmount: 0,
      finalPrice: basePrice,
      error: `Coupon "${normalized}" has already been used and is now disabled.`,
    };
  }

  markCouponAsUsed(normalized);

  const discount = basePrice; // 100% discount
  const finalPrice = 0;

  return {
    isValid: true,
    discountAmount: discount,
    finalPrice,
  };
}

export function isSubscriptionActive(subscription: SubscriptionPlan): boolean {
  if (subscription.status === 'active' || subscription.status === 'creator_free') {
    return true;
  }
  const trialInfo = calculateTrialInfo(subscription);
  return trialInfo.isTrial && !trialInfo.isExpired;
}

export function getReceivingBankDetails(): SubscriptionReceivingBankDetails {
  try {
    const stored = localStorage.getItem(RECEIVING_BANK_STORAGE_KEY);
    if (stored) {
      const decrypted = secureDecrypt<SubscriptionReceivingBankDetails>(stored, DEFAULT_RECEIVING_BANK);
      return { ...DEFAULT_RECEIVING_BANK, ...decrypted };
    }
  } catch (e) {
    console.error('Failed reading receiving bank details', e);
  }
  return DEFAULT_RECEIVING_BANK;
}

export function saveReceivingBankDetails(details: SubscriptionReceivingBankDetails): void {
  try {
    localStorage.setItem(RECEIVING_BANK_STORAGE_KEY, secureEncrypt(details));
  } catch (e) {
    console.error('Failed saving receiving bank details', e);
  }
}

export function getInitialSubscription(): SubscriptionPlan {
  try {
    const stored = localStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
    if (stored) {
      const parsed = secureDecrypt<SubscriptionPlan | null>(stored, null);
      if (parsed && typeof parsed === 'object' && parsed.status) {
        if (parsed.pricePerYear !== BASE_ANNUAL_PRICE && parsed.status !== 'creator_free') {
          parsed.pricePerYear = BASE_ANNUAL_PRICE;
        }
        if (parsed.trialDaysTotal !== TRIAL_DAYS && parsed.status === 'trial') {
          parsed.trialDaysTotal = TRIAL_DAYS;
        }
        saveSubscription(parsed);
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed reading subscription', e);
  }

  const now = new Date();
  const trialEnd = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  const initialPlan: SubscriptionPlan = {
    status: 'trial',
    trialStartDate: now.toISOString(),
    trialDaysTotal: TRIAL_DAYS,
    planName: '7-Day Free Trial',
    pricePerYear: BASE_ANNUAL_PRICE,
    expiryDate: trialEnd.toISOString(),
    isCreatorFree: false,
  };

  saveSubscription(initialPlan);
  return initialPlan;
}

export function saveSubscription(plan: SubscriptionPlan): void {
  try {
    localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, secureEncrypt(plan));
  } catch (e) {
    console.error('Failed saving subscription', e);
  }
}

export function start7DayTrial(): SubscriptionPlan {
  const now = new Date();
  const trialEnd = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  const plan: SubscriptionPlan = {
    status: 'trial',
    trialStartDate: now.toISOString(),
    trialDaysTotal: TRIAL_DAYS,
    planName: '7-Day Free Trial',
    pricePerYear: BASE_ANNUAL_PRICE,
    expiryDate: trialEnd.toISOString(),
    isCreatorFree: false,
  };

  saveSubscription(plan);
  return plan;
}

export function calculateTrialInfo(plan: SubscriptionPlan): {
  isTrial: boolean;
  daysUsed: number;
  daysRemaining: number;
  isExpired: boolean;
  trialTotalDays: number;
} {
  const totalDays = plan.trialDaysTotal || TRIAL_DAYS;

  if (plan.status === 'creator_free') {
    return { isTrial: false, daysUsed: 0, daysRemaining: 9999, isExpired: false, trialTotalDays: totalDays };
  }
  if (plan.status === 'active') {
    const expiry = new Date(plan.expiryDate || (Date.now() + 365 * 24 * 60 * 60 * 1000)).getTime();
    const now = Date.now();
    const diffMs = expiry - now;
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    return { isTrial: false, daysUsed: 0, daysRemaining, isExpired: daysRemaining <= 0, trialTotalDays: 365 };
  }

  const start = new Date(plan.trialStartDate || Date.now()).getTime();
  const now = Date.now();
  const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  const daysUsed = Math.max(1, Math.min(totalDays, diffDays + 1));
  const daysRemaining = Math.max(0, totalDays - diffDays);
  const isExpired = daysRemaining <= 0 || plan.status === 'expired';

  return {
    isTrial: !isExpired,
    daysUsed,
    daysRemaining,
    isExpired,
    trialTotalDays: totalDays,
  };
}

export function activateCreatorFreeLicense(): SubscriptionPlan {
  const receivingBank = getReceivingBankDetails();
  const plan: SubscriptionPlan = {
    status: 'creator_free',
    trialStartDate: new Date().toISOString(),
    trialDaysTotal: TRIAL_DAYS,
    planName: 'Creator Lifetime VIP License (FREE)',
    pricePerYear: 0,
    isCreatorFree: true,
    activatedAt: new Date().toISOString(),
    expiryDate: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString(),
    licenseKey: `CREATOR-VIP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    paymentMethod: 'Creator Complimentary (₹0 Forever)',
    transactionRef: `VIP-FREE-${Date.now().toString().slice(-6)}`,
    receivingBank,
  };
  saveSubscription(plan);
  return plan;
}

export function activateAnnualSubscription(
  transactionRef?: string,
  bankDetails?: SubscriptionReceivingBankDetails
): SubscriptionPlan {
  const receivingBank = bankDetails || getReceivingBankDetails();

  const plan: SubscriptionPlan = {
    status: 'active',
    trialStartDate: new Date().toISOString(),
    trialDaysTotal: TRIAL_DAYS,
    planName: 'Annual Commercial Subscription (₹1,000/year)',
    pricePerYear: BASE_ANNUAL_PRICE,
    isCreatorFree: false,
    activatedAt: new Date().toISOString(),
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    licenseKey: `SKT-PRO-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    transactionRef: transactionRef || `UPI-${Date.now().toString().slice(-8)}`,
    paymentMethod: 'Direct Bank / UPI Transfer or Coupon (₹1,000)',
    receivingBank,
  };

  saveSubscription(plan);
  return plan;
}
