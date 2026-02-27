import { RollConversionConfig, Inventory, LocationInfo, LocationInventory, ProductType } from '@/types';

/**
 * デフォルトのロール換算設定（既存製品）
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
 * ペール製品のロール換算設定
 *
 * ペール専用の歩留まりロジック：
 * - ボディ: 10ロール（メーカー在庫）→ 約3,700枚
 * - 底: 1ロール（200m）から655枚（200m / 0.305m）
 * - 蓋: 1ロール（200m）から606枚（200m / 0.330m）
 * piecesPerRoll は底の歩留まり（655）を基準値として使用
 */
export const PAIL_ROLL_CONFIG: RollConversionConfig = {
  rollLength: 200,              // ロール長さ（m）
  piecesPerMeter: 3.275,        // 1mあたり3.275枚（計算: 655 ÷ 200）
  piecesPerRoll: 655,           // 1本あたり655枚（底の歩留まりを基準）
  bottomCutLength: 305,         // 底の切り出し長さ（mm）
  lidCutLength: 330,            // 蓋の切り出し長さ（mm）
  averageCutLength: 0.318,      // 平均切り出し長さ（m）約318mm
};

/**
 * ペール製品のロール歩留まり定数（底と蓋で異なる）
 */
export const PAIL_BOTTOM_PIECES_PER_ROLL = 655; // 200m / 0.305m
export const PAIL_LID_PIECES_PER_ROLL = 606;    // 200m / 0.330m

/**
 * ペールボディの換算設定
 * ボディ: 10ロール → 約3,700枚
 */
export const PAIL_BODY_CONFIG = {
  rollsPerProduction: 10,       // 1回の生産に必要なロール数
  piecesPerProduction: 3700,    // 10ロールから算出される枚数
  piecesPerRoll: 370,           // 1ロールあたりの平均枚数
};

/**
 * 製品情報
 */
export const PRODUCTS = [
  {
    id: 'standard' as ProductType,
    name: 'WIP',
    description: 'ボディと底のセット製品（蓋は独立）',
  },
  {
    id: 'pail' as ProductType,
    name: 'ペール',
    description: 'ペール缶用の製品',
  },
];

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
  pailBody: 0,
  pailBottom: 0,
  pailLid: 0,
  pailRolls: 0,
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
