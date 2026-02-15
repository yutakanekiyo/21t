# 21T企画 在庫・受注管理システム セットアップガイド

このガイドに従って、ClerkとSupabaseを設定してアプリケーションを起動します。

## 📋 前提条件

- Node.js 18以上がインストールされていること
- npmパッケージがインストール済み（`npm install` 実行済み）

## 🔐 Step 1: Clerk認証のセットアップ

### 1-1. Clerkアカウントの作成

1. [Clerk Dashboard](https://dashboard.clerk.com) にアクセス
2. 「Sign Up」をクリックしてアカウントを作成
3. メール認証を完了

### 1-2. アプリケーションの作成

1. Clerkダッシュボードで「+ New Application」をクリック
2. アプリケーション名を入力（例: "21T在庫管理"）
3. 認証方法を選択（推奨: Email + Password）
4. 「Create Application」をクリック

### 1-3. APIキーの取得

1. 左サイドバーから「API Keys」を選択
2. 以下の2つのキーをコピー：
   - **Publishable Key** (pk_test_から始まる)
   - **Secret Key** (sk_test_から始まる)

### 1-4. 環境変数に設定

`.env.local` ファイルを開き、以下を置き換え：

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_あなたのキー
CLERK_SECRET_KEY=sk_test_あなたのキー
```

✅ **Step 1完了！**

---

## 🗄️ Step 2: Supabaseデータベースのセットアップ

### 2-1. Supabaseアカウントの作成

1. [Supabase](https://supabase.com) にアクセス
2. 「Start your project」をクリック
3. GitHubアカウントでサインアップ（推奨）

### 2-2. プロジェクトの作成

1. 「New Project」をクリック
2. 以下を入力：
   - **Name**: 21t-inventory（任意）
   - **Database Password**: 強固なパスワード（保存しておく）
   - **Region**: Northeast Asia (Tokyo)（推奨）
3. 「Create new project」をクリック
4. プロジェクトの準備が完了するまで待機（約2分）

### 2-3. APIキーの取得

1. 左サイドバーから「Settings」→「API」を選択
2. 以下の3つをコピー：
   - **Project URL**
   - **anon public** key
   - **service_role** key（「Reveal」をクリックして表示）

### 2-4. 環境変数に設定

`.env.local` ファイルを開き、以下を置き換え：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://あなたのプロジェクトID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...あなたのanonキー
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...あなたのservice_roleキー
```

### 2-5. データベーススキーマの作成

1. Supabaseダッシュボードで「SQL Editor」を開く
2. 「+ New query」をクリック
3. `lib/supabase/schema.sql` の内容をコピー＆ペースト
4. 「Run」をクリックして実行

**確認方法：**
- 左サイドバー「Table Editor」を開く
- `inventories` と `orders` テーブルが表示されればOK

✅ **Step 2完了！**

---

## 🚀 Step 3: アプリケーションの起動

### 3-1. 環境変数の確認

`.env.local` の内容を確認：

```bash
cat .env.local
```

すべての `YOUR_` プレースホルダーが実際のキーに置き換わっていることを確認。

### 3-2. 開発サーバーの起動

```bash
npm run dev
```

以下のように表示されればOK：

```
▲ Next.js 15.5.12
- Local:        http://localhost:3000
```

### 3-3. ブラウザでアクセス

1. http://localhost:3000 を開く
2. 「新規登録」をクリック
3. メールアドレスとパスワードを入力
4. 登録完了後、自動的にダッシュボードにリダイレクト

✅ **すべて完了！**

---

## 🧪 動作確認

### 在庫管理のテスト

1. ダッシュボードで「在庫を編集」をクリック
2. 以下を入力：
   - ボディ: 100
   - 底: 50
   - 蓋: 50
   - ロール: 1
3. 「保存」をクリック
4. 数値が保存されて表示されることを確認

### 受注管理のテスト

1. 「新規受注を追加」をクリック
2. 以下を入力：
   - 受注番号: TEST-001
   - 顧客名: テスト株式会社
   - 納期: 2024-03-15（任意の日付）
   - セット数: 10
   - 追加蓋数: 5
3. 「追加」をクリック
4. 受注が一覧に表示され、在庫計算結果が表示されることを確認

### 在庫計算の確認

- 処理後の在庫が正しく計算されているか
- 在庫が足りている場合：緑の「OK」バッジ
- 在庫不足の場合：赤の「在庫不足」バッジ + 不足数

---

## 🐛 トラブルシューティング

### ビルドエラーが出る

```bash
npm run build
```

エラーメッセージを確認して、環境変数が正しく設定されているか確認。

### Clerkの認証エラー

- `.env.local` のキーが正しいか確認
- Clerk Dashboardで「Allowed origins」に `http://localhost:3000` が追加されているか確認

### Supabaseの接続エラー

- `.env.local` のURLとキーが正しいか確認
- Supabaseプロジェクトが「Active」状態か確認
- データベーススキーマが正しく実行されたか確認

### データが保存されない

- ブラウザのコンソール（F12）でエラーを確認
- Supabase Dashboard → Table Editor で直接データを確認

---

## 📚 次のステップ

- [README.md](./README.md) - プロジェクト全体の説明
- [lib/supabase/schema.sql](./lib/supabase/schema.sql) - データベーススキーマ
- [Clerk Documentation](https://clerk.com/docs/nextjs) - Clerk公式ドキュメント
- [Supabase Documentation](https://supabase.com/docs) - Supabase公式ドキュメント

---

## 🌐 Vercelデプロイ

ローカルで動作確認できたら、Vercelにデプロイ：

```bash
# GitHubにプッシュ
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_REPO
git push -u origin main

# Vercelでインポート
# https://vercel.com/new
# 環境変数を.env.localと同じように設定
```

---

質問がある場合は、README.mdを参照してください。
