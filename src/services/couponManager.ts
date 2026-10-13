import { SingleUseCoupon } from '../types';

// Standalone coupon manager (not linked to app UI or localStorage)
export class CouponManager {
  private coupons: SingleUseCoupon[] = [];

  constructor() {
    this.coupons = [];
  }

  generateCoupons(count: number, prefix: string): SingleUseCoupon[] {
    const newCoupons: SingleUseCoupon[] = [];
    for (let i = 0; i < count; i++) {
      newCoupons.push({
        code: `${prefix}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        label: `Coupon-${i}`,
        discountRupees: 100,
        description: 'Standalone coupon',
        isUsed: false,
        createdAt: new Date().toISOString(),
      });
    }
    this.coupons.push(...newCoupons);
    return newCoupons;
  }

  redeemCoupon(code: string): { success: boolean; message: string } {
    const coupon = this.coupons.find(c => c.code === code);
    if (!coupon) return { success: false, message: 'Coupon not found' };
    if (coupon.isUsed) return { success: false, message: 'Coupon already used' };
    
    coupon.isUsed = true;
    coupon.usedAt = new Date().toISOString();
    return { success: true, message: 'Coupon redeemed successfully' };
  }
}
