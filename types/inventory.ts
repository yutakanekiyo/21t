/**
 * 在庫データの型定義
 */
export interface Inventory {
  body: number;                  // カット済みボディ在庫
  bottom: number;                // カット済み底在庫
  lid: number;                   // カット済み蓋在庫
  rolls: number;                 // ロール在庫本数
  lastUpdated: string;           // 最終更新日時（ISO8601）
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
 * 在庫スナップショット - 各受注時点での在庫状況を記録
 */
export interface InventorySnapshot {
  orderId: string;               // 受注ID
  orderNumber: string;           // 受注番号
  customerName: string;          // 顧客名
  deliveryDate: string;          // 納期
  setQuantity: number;           // セット数
  additionalLids: number;        // 追加蓋数

  // 処理前の在庫
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

  // 処理後の在庫
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
