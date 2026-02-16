# Vercelデプロイ手順

## 1. Vercelにアクセス

https://vercel.com にアクセスして、GitHubアカウントでログイン

## 2. プロジェクトをインポート

1. 「Add New...」→「Project」をクリック
2. 「Import Git Repository」で `yutakanekiyo/21t` を選択
3. 「Import」をクリック

## 3. 環境変数を設定

「Environment Variables」セクションで以下を追加：

### Clerk環境変数

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
値: pk_test_d2FudGVkLWxhYnJhZG9yLTgxLmNsZXJrLmFjY291bnRzLmRldiQ
```

```
CLERK_SECRET_KEY
値: sk_test_WAtdiZz71avD8FYmEhgd7Hw7MuiKGudJerDsKNk9Pm
```

```
NEXT_PUBLIC_CLERK_SIGN_IN_URL
値: /sign-in
```

```
NEXT_PUBLIC_CLERK_SIGN_UP_URL
値: /sign-up
```

```
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL
値: /dashboard
```

```
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL
値: /dashboard
```

### Supabase環境変数

```
NEXT_PUBLIC_SUPABASE_URL
値: https://qsuzphbkdqgebanrvlel.supabase.co
```

```
NEXT_PUBLIC_SUPABASE_ANON_KEY
値: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzdXpwaGJrZHFnZWJhbnJ2bGVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNzQyOTcsImV4cCI6MjA4NjY1MDI5N30.vsoKcJ6O6nH1IQMLGYTneb8n_-kqCX4OmG8mBMinMF8
```

```
SUPABASE_SERVICE_ROLE_KEY
値: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzdXpwaGJrZHFnZWJhbnJ2bGVsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA3NDI5NywiZXhwIjoyMDg2NjUwMjk3fQ.G9hKGD2wg7W6MkkGSg5_XrlNk0tz913rCdGF9_qLyxk
```

## 4. デプロイ

1. すべての環境変数を設定したら「Deploy」をクリック
2. デプロイが完了するまで待機（約2-3分）

## 5. デプロイ後の設定

### Clerkの設定更新

1. [Clerk Dashboard](https://dashboard.clerk.com) を開く
2. 「Domains」→「Add domain」
3. Vercelから発行されたURL（例: `your-app.vercel.app`）を追加

### 動作確認

1. Vercelから発行されたURLにアクセス
2. 新規登録してログイン
3. 在庫・受注管理機能が正常に動作することを確認

## トラブルシューティング

### ビルドエラーが出る

- 環境変数が正しく設定されているか確認
- Vercelのログを確認

### 認証エラーが出る

- ClerkのDomains設定にVercel URLが追加されているか確認
- 環境変数が正しいか確認

### データベース接続エラー

- Supabase環境変数が正しいか確認
- Supabaseプロジェクトがアクティブか確認

---

## カスタムドメインの設定（オプション）

1. Vercelプロジェクトの「Settings」→「Domains」
2. カスタムドメインを追加
3. DNSレコードを設定
4. Clerkのドメイン設定にもカスタムドメインを追加
