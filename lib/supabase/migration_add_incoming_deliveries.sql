-- 入荷予定管理機能の追加マイグレーション
-- 実行日: 2026-02-16

-- =====================================================
-- Step 1: incoming_deliveries テーブルの作成
-- =====================================================

CREATE TABLE IF NOT EXISTS incoming_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  location TEXT NOT NULL CHECK (location IN ('office', 'sugisaki', 'manufacturer')),
  item_type TEXT NOT NULL CHECK (item_type IN ('body', 'bottom', 'lid', 'rolls', 'pailBody', 'pailBottom', 'pailLid', 'pailRolls')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  scheduled_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- Step 2: インデックスの作成
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_incoming_deliveries_user_id ON incoming_deliveries(user_id);
CREATE INDEX IF NOT EXISTS idx_incoming_deliveries_status ON incoming_deliveries(user_id, status);
CREATE INDEX IF NOT EXISTS idx_incoming_deliveries_scheduled_date ON incoming_deliveries(user_id, scheduled_date);

-- =====================================================
-- Step 3: RLS (Row Level Security) の設定
-- =====================================================

ALTER TABLE incoming_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access their own deliveries" ON incoming_deliveries;
CREATE POLICY "Users can access their own deliveries"
  ON incoming_deliveries
  FOR ALL
  USING (user_id = current_setting('app.user_id', true));

-- =====================================================
-- 完了メッセージ
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✓ マイグレーション完了: 入荷予定管理機能';
  RAISE NOTICE '  - incoming_deliveriesテーブルを作成';
  RAISE NOTICE '  - インデックスを追加（user_id, status, scheduled_date）';
  RAISE NOTICE '  - RLSポリシーを設定';
END $$;
