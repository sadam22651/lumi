// src/lib/shipping/couriers.ts
export const COURIER_CODES = [
  'jne', 'pos', 'tiki', 'jnt', 'sicepat', 'anteraja',
  'wahana', 'lion', 'ninja', 'sap', 'jet', 'rex',
] as const;

export type CourierCode = typeof COURIER_CODES[number];

export const COURIER_LABELS: Record<CourierCode, string> = {
  jne: 'JNE',
  pos: 'POS Indonesia',
  tiki: 'TIKI',
  jnt: 'J&T Express',
  sicepat: 'SiCepat',
  anteraja: 'Anteraja',
  wahana: 'Wahana Prestasi Logistik',
  lion: 'Lion Parcel',
  ninja: 'Ninja Xpress',
  sap: 'SAP Express',
  jet: 'JET Express',
  rex: 'RPX / REX',
};

// Normalisasi dari label/teks bebas → code (lowercase)
export function labelToCode(input: string | null | undefined): CourierCode | null {
  if (!input) return null;
  const s = input.toLowerCase().trim();

  // cocokkan langsung jika sudah code
  if ((COURIER_CODES as readonly string[]).includes(s)) return s as CourierCode;

  // beberapa kata kunci populer
  if (s.includes('j&t')) return 'jnt';
  if (s.includes('pos')) return 'pos';
  if (s.includes('sicepat')) return 'sicepat';
  if (s.includes('anteraja')) return 'anteraja';
  if (s.includes('wahana')) return 'wahana';
  if (s.includes('lion')) return 'lion';
  if (s.includes('ninja')) return 'ninja';
  if (s.includes('sap')) return 'sap';
  if (s.includes('jet')) return 'jet';
  if (s.includes('rpx') || s.includes('rex')) return 'rex';
  if (s.includes('jne')) return 'jne';
  if (s.includes('tiki')) return 'tiki';

  return null;
}
