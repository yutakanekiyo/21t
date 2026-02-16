/**
 * 製品タイプ
 */
export type ProductType = 'standard' | 'pail';

/**
 * 受注ステータス
 */
export type OrderStatus = 'active' | 'completed' | 'archived';

/**
 * 受注データの型定義
 */
export interface Order {
  id: string;                    // UUID
  productType: ProductType;      // 製品タイプ（standard: 既存製品、pail: ペール）
  orderNumber: string;           // 受注番号
  customerName: string;          // 顧客名
  deliveryDate: string;          // 納期（ISO8601: YYYY-MM-DD）
  setQuantity: number;           // セット数（ボディ・底・蓋各1）
  additionalLids: number;        // 追加蓋数
  status: OrderStatus;           // ステータス（active: 進行中, completed: 完了, archived: アーカイブ）
  createdAt: string;             // 作成日時（ISO8601）
  updatedAt: string;             // 更新日時（ISO8601）
  notes?: string;                // 備考
}

/**
 * 受注入力フォームの型定義
 */
export interface OrderFormData {
  productType: ProductType;
  orderNumber: string;
  customerName: string;
  deliveryDate: string;
  setQuantity: number;
  additionalLids: number;
  notes?: string;
}
