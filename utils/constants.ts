import { RollConversionConfig, Inventory, LocationInfo, LocationInventory } from '@/types';

/**
 * デフォルトのロール換算設定
 *
 * 重要：底と蓋は同じロール材（幅1000mm × 長さ200m）から切り出される
 * - ロール長さ：200m
 * - 1mあたり1.5枚
 * - 1本あたり300枚（200m × 1.5枚/m）
 */
export const DEFAULT_ROLL_CONFIG: RollConversionConfig = {
  rollLength: 200,              // ロール長さ（m）
  piecesPerMeter: 1.5,          // 1mあたり1.5枚
  piecesPerRoll: 300,           // 1本あたり300枚（200m × 1.5）
  bottomCutLength: 570,         // 底の切り出し長さ（mm）
  lidCutLength: 610,            // 蓋の切り出し長さ（mm）
  averageCutLength: 0.66,       // 平均切り出し長さ（m）
};

/**
 * LocalStorageのキー名
 */
export const STORAGE_KEYS = {
  ORDERS: 'orders',
  INVENTORY: 'inventory',
  ROLL_CONFIG: 'rollConfig',
} as const;

/**
 * 拠点情報
 */
export const LOCATIONS: LocationInfo[] = [
  {
    id: 'office',
    name: '事務所',
    description: '本社事務所の在庫',
  },
  {
    id: 'sugisaki',
    name: '杉崎（工場）',
    description: '製造工場の在庫',
  },
  {
    id: 'manufacturer',
    name: 'メーカー（原材料）',
    description: 'メーカー保管の原材料',
  },
];

/**
 * デフォルトの拠点別在庫データ
 */
export const DEFAULT_LOCATION_INVENTORY: LocationInventory = {
  body: 0,
  bottom: 0,
  lid: 0,
  rolls: 0,
};

/**
 * デフォルトの在庫データ（複数拠点対応）
 */
export const DEFAULT_INVENTORY: Inventory = {
  office: { ...DEFAULT_LOCATION_INVENTORY },
  sugisaki: { ...DEFAULT_LOCATION_INVENTORY },
  manufacturer: { ...DEFAULT_LOCATION_INVENTORY },
  lastUpdated: new Date().toISOString(),
};
