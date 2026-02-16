import { LocationType, ItemType } from './inventory';

/**
 * 入荷予定のステータス
 */
export type IncomingDeliveryStatus = 'pending' | 'completed';

/**
 * 入荷予定データの型定義
 */
export interface IncomingDelivery {
  id: string;
  userId: string;
  location: LocationType;           // 入荷先拠点
  itemType: ItemType;                // アイテムタイプ
  quantity: number;                  // 数量
  scheduledDate: string;             // 入荷予定日（ISO8601: YYYY-MM-DD）
  status: IncomingDeliveryStatus;    // ステータス（入荷待ち / 完了）
  completedAt?: string;              // 完了日時（ISO8601）
  notes?: string;                    // 備考
  createdAt: string;                 // 作成日時（ISO8601）
  updatedAt: string;                 // 更新日時（ISO8601）
}

/**
 * 入荷予定入力フォームの型定義
 */
export interface IncomingDeliveryFormData {
  location: LocationType;
  itemType: ItemType;
  quantity: number;
  scheduledDate: string;
  notes?: string;
}
