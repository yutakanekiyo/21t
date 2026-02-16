-- 受注ステータス機能の追加マイグレーション
-- 実行日: 2026-02-16

-- =====================================================
-- Step 1: orders テーブルに status カラムを追加
-- =====================================================

-- status カラムを追加（デフォルトは 'active'）
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
CHECK (status IN ('active', 'completed', 'archived'));

-- 既存データはすべて 'active' に設定（デフォルト値で自動設定される）

-- =====================================================
-- Step 2: インデックスの作成
-- =====================================================

-- status カラムにインデックスを作成（ステータスでのフィルタリングを高速化）
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(user_id, status);

-- 納期とステータスの複合インデックス（アーカイブ処理用）
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON orders(user_id, delivery_date, status);

-- =====================================================
-- 完了メッセージ
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✓ マイグレーション完了: 受注ステータス機能';
  RAISE NOTICE '  - orders テーブルに status カラムを追加';
  RAISE NOTICE '  - インデックスを追加（status, delivery_date + status）';
  RAISE NOTICE '  - 既存データは全て active に設定されました';
END $$;
