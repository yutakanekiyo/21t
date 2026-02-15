import { RollConversionConfig, Inventory } from '@/types';

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
 * デフォルトの在庫データ
 */
export const DEFAULT_INVENTORY: Inventory = {
  body: 0,
  bottom: 0,
  lid: 0,
  rolls: 0,
  lastUpdated: new Date().toISOString(),
};
