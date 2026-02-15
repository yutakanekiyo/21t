-- 21T企画 在庫・受注管理システム データベーススキーマ
-- Supabaseダッシュボードの SQL Editor で実行してください

-- inventories テーブル（在庫）
CREATE TABLE IF NOT EXISTS inventories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  body INTEGER NOT NULL DEFAULT 0,
  bottom INTEGER NOT NULL DEFAULT 0,
  lid INTEGER NOT NULL DEFAULT 0,
  rolls INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- orders テーブル（受注）
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  order_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  delivery_date DATE NOT NULL,
  set_quantity INTEGER NOT NULL DEFAULT 0,
  additional_lids INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス作成（パフォーマンス最適化）
CREATE INDEX IF NOT EXISTS idx_inventories_user_id ON inventories(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON orders(user_id, delivery_date);

-- Row Level Security (RLS) を有効化
ALTER TABLE inventories ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- RLSポリシー: ユーザーは自分のデータのみアクセス可能
-- 注意: Server ActionsでService Role Keyを使用するため、これらのポリシーはバイパスされます
-- データの安全性はServer Actions内でauth()を使用して保証します

-- inventories用ポリシー
DROP POLICY IF EXISTS "Users can access their own inventory" ON inventories;
CREATE POLICY "Users can access their own inventory"
  ON inventories
  FOR ALL
  USING (user_id = current_setting('app.user_id', true));

-- orders用ポリシー
DROP POLICY IF EXISTS "Users can access their own orders" ON orders;
CREATE POLICY "Users can access their own orders"
  ON orders
  FOR ALL
  USING (user_id = current_setting('app.user_id', true));

-- テーブル作成完了
-- 次に、.env.localにSupabaseの接続情報を設定してください
