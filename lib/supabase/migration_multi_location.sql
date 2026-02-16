-- 複数拠点在庫管理のためのマイグレーション
-- 実行日: 2026-02-16

-- =====================================================
-- Step 1: inventoriesテーブルの拠点別カラム追加
-- =====================================================

-- 事務所の在庫カラムを追加
ALTER TABLE inventories
ADD COLUMN IF NOT EXISTS office_body INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS office_bottom INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS office_lid INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS office_rolls INTEGER DEFAULT 0;

-- 杉崎（工場）の在庫カラムを追加
ALTER TABLE inventories
ADD COLUMN IF NOT EXISTS sugisaki_body INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sugisaki_bottom INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sugisaki_lid INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sugisaki_rolls INTEGER DEFAULT 0;

-- メーカー（原材料）の在庫カラムを追加
ALTER TABLE inventories
ADD COLUMN IF NOT EXISTS manufacturer_body INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS manufacturer_bottom INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS manufacturer_lid INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS manufacturer_rolls INTEGER DEFAULT 0;

-- =====================================================
-- Step 2: 既存データの移行
-- =====================================================

-- 既存の在庫データを事務所に移行（body, bottom, lid, rollsカラムが存在する場合）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventories' AND column_name = 'body'
  ) THEN
    UPDATE inventories
    SET
      office_body = COALESCE(body, 0),
      office_bottom = COALESCE(bottom, 0),
      office_lid = COALESCE(lid, 0),
      office_rolls = COALESCE(rolls, 0)
    WHERE office_body = 0 AND office_bottom = 0 AND office_lid = 0 AND office_rolls = 0;
  END IF;
END $$;

-- =====================================================
-- Step 3: 古いカラムの削除（オプション）
-- =====================================================

-- 注意: 既存のカラムを削除する場合は、データ移行が完了していることを確認してください
-- ALTER TABLE inventories DROP COLUMN IF EXISTS body;
-- ALTER TABLE inventories DROP COLUMN IF EXISTS bottom;
-- ALTER TABLE inventories DROP COLUMN IF EXISTS lid;
-- ALTER TABLE inventories DROP COLUMN IF EXISTS rolls;

-- =====================================================
-- Step 4: 在庫移動履歴テーブルの作成
-- =====================================================

CREATE TABLE IF NOT EXISTS inventory_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  from_location TEXT NOT NULL CHECK (from_location IN ('office', 'sugisaki', 'manufacturer')),
  to_location TEXT NOT NULL CHECK (to_location IN ('office', 'sugisaki', 'manufacturer')),
  item_type TEXT NOT NULL CHECK (item_type IN ('body', 'bottom', 'lid', 'rolls')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT different_locations CHECK (from_location != to_location)
);

-- =====================================================
-- Step 5: インデックスの作成
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_transfers_user_id ON inventory_transfers(user_id);
CREATE INDEX IF NOT EXISTS idx_transfers_created_at ON inventory_transfers(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transfers_locations ON inventory_transfers(from_location, to_location);

-- =====================================================
-- Step 6: RLS (Row Level Security) の設定
-- =====================================================

ALTER TABLE inventory_transfers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access their own transfers" ON inventory_transfers;
CREATE POLICY "Users can access their own transfers"
  ON inventory_transfers
  FOR ALL
  USING (user_id = current_setting('app.user_id', true));

-- =====================================================
-- 完了メッセージ
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✓ マイグレーション完了: 複数拠点在庫管理';
  RAISE NOTICE '  - inventoriesテーブルに拠点別カラムを追加';
  RAISE NOTICE '  - inventory_transfersテーブルを作成';
  RAISE NOTICE '  - インデックスとRLSを設定';
END $$;
