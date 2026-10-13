import { UnitType } from '../types';

export interface UnitDefinition {
  code: UnitType;
  nameEn: string;
  nameHi: string;
}

export const ALL_SUPPORTED_UNITS: UnitDefinition[] = [
  { code: 'PCS', nameEn: 'Pieces', nameHi: 'पीस / नंग' },
  { code: 'BOX', nameEn: 'Box', nameHi: 'बॉक्स / डिब्बा' },
  { code: 'CTN', nameEn: 'Carton', nameHi: 'कार्टन / पेटी' },
  { code: 'BAG', nameEn: 'Bag', nameHi: 'बैग / बोरी' },
  { code: 'DOZ', nameEn: 'Dozen', nameHi: 'दर्जन (12 पीस)' },
  { code: 'KGS', nameEn: 'Kilograms', nameHi: 'किलोग्राम' },
  { code: 'LTR', nameEn: 'Liters', nameHi: 'लीटर' },
  { code: 'MTR', nameEn: 'Meters', nameHi: 'मीटर' },
  { code: 'NOS', nameEn: 'Numbers', nameHi: 'नंबर' },
  { code: 'SET', nameEn: 'Set', nameHi: 'सेट' },
  { code: 'PKT', nameEn: 'Packet', nameHi: 'पैकेट' },
  { code: 'CASE', nameEn: 'Case', nameHi: 'केस' },
  { code: 'TIN', nameEn: 'Tin', nameHi: 'टिन' },
  { code: 'ROLL', nameEn: 'Roll', nameHi: 'रोल' },
  { code: 'BNDL', nameEn: 'Bundle', nameHi: 'बंडल' },
];

export interface ConversionPreset {
  secondary: UnitType;
  base: UnitType;
  factor: number;
  label: string;
}

export const POPULAR_CONVERSION_PRESETS: ConversionPreset[] = [
  { secondary: 'CTN', base: 'PCS', factor: 24, label: '1 Carton (पेटी) = 24 Pieces' },
  { secondary: 'CTN', base: 'PCS', factor: 12, label: '1 Carton (पेटी) = 12 Pieces' },
  { secondary: 'BOX', base: 'PCS', factor: 10, label: '1 Box (डिब्बा) = 10 Pieces' },
  { secondary: 'BOX', base: 'PCS', factor: 20, label: '1 Box (डिब्बा) = 20 Pieces' },
  { secondary: 'BOX', base: 'PCS', factor: 50, label: '1 Box (डिब्बा) = 50 Pieces' },
  { secondary: 'BOX', base: 'PCS', factor: 100, label: '1 Box (डिब्बा) = 100 Pieces' },
  { secondary: 'DOZ', base: 'PCS', factor: 12, label: '1 Dozen (दर्जन) = 12 Pieces' },
  { secondary: 'BAG', base: 'KGS', factor: 50, label: '1 Bag (बोरी) = 50 KGs' },
  { secondary: 'BAG', base: 'KGS', factor: 25, label: '1 Bag (बोरी) = 25 KGs' },
  { secondary: 'TIN', base: 'LTR', factor: 15, label: '1 Tin = 15 Liters' },
  { secondary: 'BNDL', base: 'NOS', factor: 10, label: '1 Bundle = 10 Numbers' },
];

/**
 * Format stock in dual units (e.g. 53 PCS -> "2 CTN + 5 PCS")
 */
export function formatDualStock(
  stock: number,
  baseUnit: string,
  secondaryUnit?: string,
  conversionFactor?: number
): {
  primaryText: string;
  secondaryText: string | null;
  combinedText: string;
} {
  const primaryText = `${stock} ${baseUnit}`;

  if (!secondaryUnit || !conversionFactor || conversionFactor <= 1) {
    return {
      primaryText,
      secondaryText: null,
      combinedText: primaryText,
    };
  }

  const factor = Number(conversionFactor);
  const secondaryCount = Math.floor(stock / factor);
  const looseRemainder = Number((stock % factor).toFixed(2));

  let secondaryText = '';
  if (secondaryCount > 0 && looseRemainder > 0) {
    secondaryText = `${secondaryCount} ${secondaryUnit} + ${looseRemainder} ${baseUnit}`;
  } else if (secondaryCount > 0 && looseRemainder === 0) {
    secondaryText = `${secondaryCount} ${secondaryUnit}`;
  } else {
    secondaryText = `${looseRemainder} ${baseUnit}`;
  }

  return {
    primaryText,
    secondaryText,
    combinedText: `${secondaryText} (${stock} ${baseUnit})`,
  };
}

/**
 * Convert quantity from selected unit to primary base quantity
 */
export function getBaseQuantity(
  qty: number,
  selectedUnit: string,
  itemBaseUnit: string,
  conversionFactor?: number
): number {
  if (selectedUnit !== itemBaseUnit && conversionFactor && conversionFactor > 0) {
    return Number((qty * conversionFactor).toFixed(4));
  }
  return qty;
}
