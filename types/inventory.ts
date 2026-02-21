/**
 * 拠点別在庫データの型定義
 */
export interface LocationInventory {
  body: number;                  // カット済みボディ在庫（既存製品）
  bottom: number;                // カット済み底在庫（既存製品）
  lid: number;                   // カット済み蓋在庫（既存製品）
  rolls: number;                 // ロール在庫本数（既存製品）
  pailBody: number;              // カット済みボディ在庫（ペール）
  pailBottom: number;            // カット済み底在庫（ペール）
  pailLid: number;               // カット済み蓋在庫（ペール）
  pailRolls: number;             // ロール在庫本数（ペール）
}

/**
 * 在庫データの型定義（複数拠点対応）
 */
export interface Inventory {
  office: LocationInventory;      // 事務所在庫
  sugisaki: LocationInventory;    // 杉崎（工場）在庫
  manufacturer: LocationInventory;// メーカー（原材料）在庫
  lastUpdated: string;            // 最終更新日時（ISO8601）
}

/**
 * 拠点タイプ
 */
export type LocationType = 'office' | 'sugisaki' | 'manufacturer';

/**
 * アイテムタイプ
 */
export type ItemType = 'body' | 'bottom' | 'lid' | 'rolls' | 'pailBody' | 'pailBottom' | 'pailLid' | 'pailRolls';

/**
 * 拠点情報
 */
export interface LocationInfo {
  id: LocationType;
  name: string;
  description: string;
}

/**
 * 在庫移動データの型定義
 */
export interface InventoryTransfer {
  id: string;
  userId: string;
  fromLocation: LocationType;
  toLocation: LocationType;
  itemType: ItemType;
  quantity: number;
  notes?: string;
  createdAt: string;
}

/**
 * 在庫移動フォームデータの型定義
 */
export interface InventoryTransferFormData {
  fromLocation: LocationType;
  toLocation: LocationType;
  itemType: ItemType;
  quantity: number;
  notes?: string;
}

/**
 * ロール換算設定の型定義
 */
export interface RollConversionConfig {
  rollLength: number;            // ロール長さ（m）
  piecesPerMeter: number;        // 1mあたりの枚数
  piecesPerRoll: number;         // 1本あたりの枚数（計算値）
  bottomCutLength: number;       // 底の切り出し長さ（mm）
  lidCutLength: number;          // 蓋の切り出し長さ（mm）
  averageCutLength: number;      // 平均切り出し長さ（m）
}

/**
 * 在庫引当ステータス
 */
export type AllocationStatus =
  | 'local_ok'              // 手元在庫でOK（事務所+杉崎）
  | 'manufacturer_pickup'   // メーカー取り寄せが必要
  | 'production_needed';    // メーカー生産が必要

/**
 * 在庫スナップショット - 各受注時点での在庫状況を記録
 */
export interface InventorySnapshot {
  orderId: string;               // 受注ID
  orderNumber: string;           // 受注番号
  customerName: string;          // 顧客名
  deliveryDate: string;          // 納期
  setQuantity: number;           // セット数
  additionalLids: number;        // 追加蓋数

  // 処理前の在庫（全拠点合計）
  beforeInventory: {
    body: number;
    bottom: number;
    lid: number;
    rolls: number;
    bottomLidPool: number;       // 底・蓋共通プール（枚数）
  };

  // 必要数
  required: {
    body: number;
    bottomLid: number;           // 底・蓋合計必要数
  };

  // 処理後の在庫（全拠点合計）
  afterInventory: {
    body: number;
    bottom: number;
    lid: number;
    rolls: number;
    bottomLidPool: number;
  };

  // ステータス
  isBodySufficient: boolean;     // ボディが足りているか
  isBottomLidSufficient: boolean;// 底・蓋が足りているか
  isAllSufficient: boolean;      // 全て足りているか

  // 不足数（足りない場合の不足量）
  bodyShortage: number;
  bottomLidShortage: number;
  bottomShortage: number;  // 底の生産必要数（個別）
  lidShortage: number;     // 蓋の生産必要数（個別）

  // 2段階引当情報
  allocationStatus: AllocationStatus; // 引当ステータス
  localInventoryUsed: {               // 拠点在庫使用量
    body: number;
    bottomLid: number;
  };
  manufacturerInventoryUsed: {        // メーカー在庫使用量
    body: number;
    bottomLid: number;
  };
  productionNeeded: {                 // 生産必要量
    body: number;
    bottomLid: number;
  };
}

/**
 * 在庫不足サマリー
 */
export interface InventorySummary {
  hasShortage: boolean;          // 不足があるか
  totalBodyShortage: number;     // 合計ボディ不足数
  totalBottomLidShortage: number;// 合計底・蓋不足数
  affectedOrders: InventorySnapshot[]; // 影響を受ける受注
}

/**
 * 合計在庫を計算するヘルパー関数（全拠点）
 */
export function getTotalInventory(inventory: Inventory): LocationInventory {
  return {
    body: inventory.office.body + inventory.sugisaki.body + inventory.manufacturer.body,
    bottom: inventory.office.bottom + inventory.sugisaki.bottom, // メーカーは底カット済み在庫なし
    lid: inventory.office.lid + inventory.sugisaki.lid,           // メーカーは蓋カット済み在庫なし
    rolls: inventory.office.rolls + inventory.sugisaki.rolls + inventory.manufacturer.rolls,
    pailBody: inventory.office.pailBody + inventory.sugisaki.pailBody + inventory.manufacturer.pailBody,
    pailBottom: inventory.office.pailBottom + inventory.sugisaki.pailBottom, // メーカーは底カット済み在庫なし
    pailLid: inventory.office.pailLid + inventory.sugisaki.pailLid,           // メーカーは蓋カット済み在庫なし
    pailRolls: inventory.office.pailRolls + inventory.sugisaki.pailRolls + inventory.manufacturer.pailRolls,
  };
}

/**
 * 拠点在庫を計算するヘルパー関数（事務所+杉崎のみ、メーカー除く）
 */
export function getLocalInventory(inventory: Inventory): LocationInventory {
  return {
    body: inventory.office.body + inventory.sugisaki.body,
    bottom: inventory.office.bottom + inventory.sugisaki.bottom,
    lid: inventory.office.lid + inventory.sugisaki.lid,
    rolls: inventory.office.rolls + inventory.sugisaki.rolls,
    pailBody: inventory.office.pailBody + inventory.sugisaki.pailBody,
    pailBottom: inventory.office.pailBottom + inventory.sugisaki.pailBottom,
    pailLid: inventory.office.pailLid + inventory.sugisaki.pailLid,
    pailRolls: inventory.office.pailRolls + inventory.sugisaki.pailRolls,
  };
}
