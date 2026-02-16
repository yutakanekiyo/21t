-- ペール製品の追加マイグレーション
-- 実行日: 2026-02-16

-- =====================================================
-- Step 1: ordersテーブルに product_type カラムを追加
-- =====================================================

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'standard' CHECK (product_type IN ('standard', 'pail'));

-- 既存のレコードは全て standard として扱う
UPDATE orders SET product_type = 'standard' WHERE product_type IS NULL;

-- product_type を NOT NULL に変更
ALTER TABLE orders ALTER COLUMN product_type SET NOT NULL;

-- =====================================================
-- Step 2: inventoriesテーブルにペール用在庫カラムを追加
-- =====================================================

-- 事務所のペール在庫カラムを追加
ALTER TABLE inventories
ADD COLUMN IF NOT EXISTS office_pail_body INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS office_pail_bottom INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS office_pail_lid INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS office_pail_rolls INTEGER DEFAULT 0;

-- 杉崎のペール在庫カラムを追加
ALTER TABLE inventories
ADD COLUMN IF NOT EXISTS sugisaki_pail_body INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sugisaki_pail_bottom INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sugisaki_pail_lid INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sugisaki_pail_rolls INTEGER DEFAULT 0;

-- メーカーのペール在庫カラムを追加
ALTER TABLE inventories
ADD COLUMN IF NOT EXISTS manufacturer_pail_body INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS manufacturer_pail_bottom INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS manufacturer_pail_lid INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS manufacturer_pail_rolls INTEGER DEFAULT 0;

-- =====================================================
-- Step 3: inventory_transfersテーブルの item_type を更新
-- =====================================================

-- 既存の CHECK 制約を削除
ALTER TABLE inventory_transfers DROP CONSTRAINT IF EXISTS inventory_transfers_item_type_check;

-- 新しい CHECK 制約を追加（ペールアイテムを含む）
ALTER TABLE inventory_transfers
ADD CONSTRAINT inventory_transfers_item_type_check
CHECK (item_type IN ('body', 'bottom', 'lid', 'rolls', 'pailBody', 'pailBottom', 'pailLid', 'pailRolls'));

-- =====================================================
-- 完了メッセージ
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✓ マイグレーション完了: ペール製品の追加';
  RAISE NOTICE '  - ordersテーブルに product_type カラムを追加';
  RAISE NOTICE '  - inventoriesテーブルにペール用在庫カラムを追加（各拠点 × 4アイテム = 12カラム）';
  RAISE NOTICE '  - inventory_transfersテーブルの item_type にペールアイテムを追加';
END $$;
