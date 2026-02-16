# 在庫移動機能のデバッグガイド

## 問題: 在庫移動フォームを入力しても反映されない

### Step 1: ブラウザのコンソールログを確認

1. ブラウザで F12 キーを押して開発者ツールを開く
2. Console タブを選択
3. 在庫移動フォームを入力して「移動」ボタンをクリック
4. 以下のログが表示されるか確認:

```
在庫移動開始: {fromLocation: "office", toLocation: "sugisaki", ...}
(Server側) createTransfer called: {userId: "...", formData: {...}}
(Server側) Current inventory: {...}
(Server側) Inserting transfer record...
(Server側) Transfer record created: [...]
(Server側) Updating inventory... {...}
(Server側) Inventory updated successfully
在庫移動成功
```

### Step 2: エラーメッセージを確認

コンソールに赤いエラーメッセージが表示されている場合:

- **"Table 'inventory_transfers' does not exist"**:
  → Supabaseのマイグレーションを実行する必要があります（Step 3へ）

- **"移動元の在庫が不足しています"**:
  → 移動元の在庫数量を確認してください

- **その他のエラー**:
  → エラーメッセージの内容を確認してください

### Step 3: Supabaseマイグレーションの実行確認

1. Supabaseのダッシュボード (https://supabase.com/dashboard) にアクセス
2. プロジェクトを選択
3. 左メニューから「SQL Editor」をクリック
4. 以下のSQLを実行して `inventory_transfers` テーブルが存在するか確認:

```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'inventory_transfers'
);
```

5. 結果が `false` の場合、マイグレーションを実行する必要があります:

```bash
# プロジェクトルートで以下のファイルを開く
# lib/supabase/migration_multi_location.sql

# このファイルの内容を全てコピーして、Supabase SQL Editorに貼り付けて実行
```

### Step 4: データが保存されているか確認

1. Supabaseダッシュボードの「Table Editor」をクリック
2. `inventory_transfers` テーブルを選択
3. レコードが追加されているか確認
4. `inventories` テーブルで在庫数量が更新されているか確認

### Step 5: ネットワークリクエストの確認

1. 開発者ツールの「Network」タブを選択
2. 在庫移動を実行
3. `/dashboard` へのPOSTリクエストを確認:
   - **Status 200**: リクエストは成功しているが、UIが更新されていない可能性
   - **Status 4xx or 5xx**: サーバーエラーが発生している

### Step 6: 環境変数の確認

`.env.local` ファイルに以下の環境変数が正しく設定されているか確認:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
```

### Step 7: 手動でページをリロード

在庫移動実行後、以下を試してください:
1. ブラウザの更新ボタン（F5）を押す
2. 在庫パネルの数値が変わっているか確認
3. 変わっている場合 → キャッシュの問題（window.location.reload()が動作していない）
4. 変わっていない場合 → データが保存されていない

## よくある原因と解決方法

### 原因1: マイグレーションが実行されていない
**解決方法**: Step 3 のマイグレーションを実行してください

### 原因2: 環境変数が設定されていない
**解決方法**: `.env.local` ファイルを確認し、必要な環境変数を設定してください

### 原因3: Supabaseの接続エラー
**解決方法**:
- SupabaseのURLとService Role Keyが正しいか確認
- Supabaseプロジェクトが稼働しているか確認

### 原因4: UIキャッシュの問題
**解決方法**:
- ブラウザのキャッシュをクリア
- 開発サーバーを再起動: `npm run dev`

## トラブルシューティングコマンド

```bash
# 開発サーバーを再起動
npm run dev

# Node.jsのキャッシュをクリア
rm -rf .next
npm run dev

# 依存関係を再インストール
rm -rf node_modules package-lock.json
npm install
npm run dev
```

## サポートが必要な場合

上記の手順で解決しない場合、以下の情報を提供してください:

1. ブラウザのコンソールログ（全文）
2. ネットワークタブのエラーメッセージ
3. Supabaseのテーブル構造のスクリーンショット
4. 環境変数が設定されているか（値は除く）
