# 21T企画 在庫・受注管理システム

特殊素材を用いた筒状プロダクトの在庫と受注を管理するWebアプリケーション。

## 🚀 技術スタック

- **フレームワーク**: Next.js 15 (App Router)
- **認証**: Clerk
- **データベース**: Supabase (PostgreSQL)
- **スタイリング**: Tailwind CSS + shadcn/ui
- **言語**: TypeScript
- **デプロイ**: Vercel

## 📋 機能

- ✅ ユーザー認証（ID/パスワード）
- ✅ 在庫管理（ボディ、底、蓋、ロール）
- ✅ 受注管理（CRUD操作）
- ✅ 底・蓋共通ロール計算（1本 = 300枚）
- ✅ 納期順ソート
- ✅ 在庫不足アラート
- ✅ ユーザーごとのデータ分離

## 🛠️ セットアップ手順

### 1. リポジトリのクローン

```bash
cd /Users/kanekiyo/Developer/21t
npm install
```

### 2. Clerkアカウントの作成

1. [Clerk](https://clerk.com) にアクセス
2. 「Sign Up」から新規アカウント作成
3. 新しいアプリケーションを作成
4. **API Keys** ページから以下をコピー：
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`

### 3. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com) にアクセス
2. 「New Project」から新規プロジェクト作成
3. **Settings > API** から以下をコピー：
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

### 4. データベーススキーマの作成

Supabaseダッシュボードの **SQL Editor** で `lib/supabase/schema.sql` を実行：

```sql
-- lib/supabase/schema.sql の内容を実行
```

### 5. 環境変数の設定

`.env.local` ファイルに以下を設定：

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### 6. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開く

## 🌐 Vercelデプロイ手順

### 1. GitHubリポジトリの作成

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/21t.git
git push -u origin main
```

### 2. Vercelでインポート

1. [Vercel](https://vercel.com) にアクセス
2. 「New Project」→ GitHubリポジトリを選択
3. **Environment Variables** に `.env.local` の内容を全てコピー
4. 「Deploy」をクリック

### 3. デプロイ完了

- デプロイが完了すると、URLが発行されます
- Clerkの **Allowed origins** にVercel URLを追加

## 📊 データベーススキーマ

### inventories テーブル

| カラム        | 型           | 説明               |
| ------------- | ------------ | ------------------ |
| id            | UUID         | 主キー             |
| user_id       | TEXT         | Clerk User ID      |
| body          | INTEGER      | ボディ在庫数       |
| bottom        | INTEGER      | 底在庫数           |
| lid           | INTEGER      | 蓋在庫数           |
| rolls         | INTEGER      | ロール在庫本数     |
| last_updated  | TIMESTAMPTZ  | 最終更新日時       |

### orders テーブル

| カラム          | 型           | 説明                   |
| --------------- | ------------ | ---------------------- |
| id              | UUID         | 主キー                 |
| user_id         | TEXT         | Clerk User ID          |
| order_number    | TEXT         | 受注番号               |
| customer_name   | TEXT         | 顧客名                 |
| delivery_date   | DATE         | 納期                   |
| set_quantity    | INTEGER      | セット数               |
| additional_lids | INTEGER      | 追加蓋数               |
| notes           | TEXT         | 備考                   |
| created_at      | TIMESTAMPTZ  | 作成日時               |
| updated_at      | TIMESTAMPTZ  | 更新日時               |

## 🔒 セキュリティ

- **認証**: Clerk による安全な認証
- **Server Actions**: サーバーサイドでデータ操作
- **RLS**: Supabaseの Row Level Security で権限管理
- **環境変数**: APIキーは `.env.local` で管理（Git除外）

## 📱 使い方

### 在庫管理

1. ダッシュボードの「在庫を編集」ボタンをクリック
2. ボディ、底、蓋、ロールの数量を入力
3. 「保存」をクリック

### 受注管理

1. 「新規受注を追加」ボタンをクリック
2. 受注情報を入力：
   - 受注番号
   - 顧客名
   - 納期
   - セット数
   - 追加蓋数（任意）
   - 備考（任意）
3. 「追加」をクリック

### 在庫計算

- 受注は自動的に納期順にソートされます
- 各受注の処理後の在庫が表示されます
- 在庫不足の場合、赤字で「在庫不足」バッジが表示されます

## 🧮 計算ロジック

**重要**: 底と蓋は同じロール材から切り出されます

- ロール換算: 1本 = 300枚
- 底・蓋共通プール = 底在庫 + 蓋在庫 + (ロール本数 × 300)
- 受注ごとに共通プールから引き落とし
- 不足時はマイナス値で表示

## 📄 ライセンス

MIT

## 👤 開発

21T企画
