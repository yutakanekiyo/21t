/**
 * 受注データの型定義
 */
export interface Order {
  id: string;                    // UUID
  orderNumber: string;           // 受注番号
  customerName: string;          // 顧客名
  deliveryDate: string;          // 納期（ISO8601: YYYY-MM-DD）
  setQuantity: number;           // セット数（ボディ・底・蓋各1）
  additionalLids: number;        // 追加蓋数
  createdAt: string;             // 作成日時（ISO8601）
  updatedAt: string;             // 更新日時（ISO8601）
  notes?: string;                // 備考
}

/**
 * 受注入力フォームの型定義
 */
export interface OrderFormData {
  orderNumber: string;
  customerName: string;
  deliveryDate: string;
  setQuantity: number;
  additionalLids: number;
  notes?: string;
}
