# ペール製品の実装完了レポート

## 実装内容

新製品「ペール」を在庫管理・受注管理システムに統合しました。

## 完了した実装

### ✅ 1. 型定義の更新
- **ProductType** を追加: `'standard' | 'pail'`
- **Order型** に `productType` フィールドを追加
- **LocationInventory型** にペール用フィールドを追加:
  - `pailBody`, `pailBottom`, `pailLid`, `pailRolls`
- **ItemType** にペールアイテムを追加

### ✅ 2. データベーススキーマの更新
**マイグレーションファイル**: `lib/supabase/migration_add_pail_product.sql`

- **ordersテーブル**: `product_type` カラムを追加（デフォルト: 'standard'）
- **inventoriesテーブル**: ペール用在庫カラムを追加（各拠点 × 4アイテム = 12カラム）
  - office_pail_body, office_pail_bottom, office_pail_lid, office_pail_rolls
  - sugisaki_pail_body, sugisaki_pail_bottom, sugisaki_pail_lid, sugisaki_pail_rolls
  - manufacturer_pail_body, manufacturer_pail_bottom, manufacturer_pail_lid, manufacturer_pail_rolls
- **inventory_transfersテーブル**: item_type にペールアイテムを追加

### ✅ 3. 定数の追加（utils/constants.ts）
- **PAIL_ROLL_CONFIG**: ペール専用のロール換算設定
  - ロール長さ: 200m
  - 1本あたり630セット（底+蓋）
  - 底: 305mm、蓋: 330mm
- **PAIL_BODY_CONFIG**: ペールボディの換算設定
  - 10ロール = 3,700枚
  - 1ロールあたり平均 370枚
- **PRODUCTS配列**: 製品リスト（standard / pail）

### ✅ 4. Server Actionsの更新
- **lib/actions/inventory.ts**: ペール在庫フィールドの読み書きに対応
- **lib/actions/orders.ts**: `product_type` フィールドの処理を追加

### ✅ 5. 計算ロジックの実装（utils/calculations.ts）
**製品タイプごとに異なる在庫を使用:**
- 既存製品: body, bottom, lid, rolls
- ペール製品: pailBody, pailBottom, pailLid, pailRolls

**ペール専用の歩留まりロジック:**
- ボディ: 10ロール（メーカー在庫）→ 約3,700枚
- 底・蓋: 1ロール（200m）から、底（305mm）と蓋（330mm）をセットで約630個

**処理フロー:**
1. 受注を納期順にソート
2. 製品タイプを判定（standard / pail）
3. 該当する在庫から消費
4. 対応するロール換算設定を使用
5. 在庫スナップショットを作成

## 🚧 未実装（UI更新が必要）

### 1. 受注フォーム（components/order/order-form.tsx または order-form-dialog.tsx）
**追加が必要:**
- 製品タイプ選択ドロップダウン
  - 選択肢: 「既存製品」「ペール」
  - デフォルト: 「既存製品」

**実装例:**
```tsx
<div>
  <Label htmlFor="productType">製品タイプ</Label>
  <select
    id="productType"
    value={formData.productType}
    onChange={(e) => setFormData({...formData, productType: e.target.value as ProductType})}
    className="flex h-11 w-full rounded-md border..."
  >
    {PRODUCTS.map((product) => (
      <option key={product.id} value={product.id}>
        {product.name}
      </option>
    ))}
  </select>
</div>
```

### 2. 在庫パネル（components/inventory/multi-location-inventory-panel.tsx）
**追加が必要:**
- ペール在庫の表示セクション
- タブまたはセクション切り替えで「既存製品」「ペール」を切り替え

### 3. 在庫調整ダイアログ（components/inventory/inventory-adjustment-dialog.tsx）
**追加が必要:**
- ペール在庫の入力フィールド（各拠点 × 4アイテム = 12フィールド）

### 4. 在庫移動ダイアログ（components/inventory/inventory-transfer-dialog.tsx）
**現状**: ItemType に 'pailBody', 'pailBottom', 'pailLid', 'pailRolls' が含まれているため、
自動的にドロップダウンに表示される（ITEM_TYPES配列を更新すれば対応完了）

**更新が必要:**
```typescript
const ITEM_TYPES = [
  // 既存製品
  { id: "body", name: "ボディ（既存）", unit: "個" },
  { id: "bottom", name: "底（既存）", unit: "枚" },
  { id: "lid", name: "蓋（既存）", unit: "枚" },
  { id: "rolls", name: "ロール（既存）", unit: "本" },
  // ペール製品
  { id: "pailBody", name: "ボディ（ペール）", unit: "個" },
  { id: "pailBottom", name: "底（ペール）", unit: "枚" },
  { id: "pailLid", name: "蓋（ペール）", unit: "枚" },
  { id: "pailRolls", name: "ロール（ペール）", unit: "本" },
];
```

### 5. 受注一覧（components/dashboard/order-list.tsx）
**追加が必要:**
- 製品タイプの表示バッジ
  - 「既存製品」は青、「ペール」は緑など

## マイグレーション実行手順

### ⚠️ 重要：Supabaseマイグレーションを実行してください

1. Supabaseダッシュボードにアクセス: https://supabase.com/dashboard
2. プロジェクトを選択
3. 左メニューから「SQL Editor」をクリック
4. `lib/supabase/migration_add_pail_product.sql` の内容を全てコピー
5. SQL Editorに貼り付けて「Run」を実行
6. 成功メッセージを確認

**確認コマンド:**
```bash
npm run test:supabase
# または
npx tsx scripts/check-transfers.ts
```

## テスト手順

### 1. マイグレーション確認
```bash
npm run test:supabase
```
- inventories テーブルに pail カラムが追加されていることを確認
- orders テーブルに product_type カラムが追加されていることを確認

### 2. 既存機能の動作確認
- 既存の受注が正常に表示されるか
- 在庫計算が正常に動作するか
- 在庫移動が正常に動作するか

### 3. ペール機能のテスト（UI実装後）
- ペール製品の受注登録
- ペール在庫の入力・表示
- ペール在庫の移動
- ペール受注の在庫計算

## 計算ロジックの詳細

### ペールボディの消費ロジック
```typescript
// 必要ボディ数 = セット数
const requiredBody = order.setQuantity;

// ペールボディ在庫から引き落とし
currentPailBody -= requiredBody;

// ボディ不足判定
const isBodySufficient = currentPailBody >= 0;
```

### ペール底・蓋の消費ロジック
```typescript
// 底・蓋の共通プール計算
const bottomLidPool = currentPailBottom + currentPailLid + (currentPailRolls * 630);

// 必要数 = セット数 × 2（底+蓋） + 追加蓋数
const requiredBottomLid = order.setQuantity * 2 + order.additionalLids;

// 共通プールから引き落とし
// 1. ロールから優先消費
// 2. ロールが不足したらカット済み在庫（底→蓋の順）から消費
```

### ロール換算
**既存製品:**
- 1ロール = 300枚（200m × 1.5枚/m）

**ペール製品:**
- 1ロール = 630セット（底+蓋）
- ボディ: 10ロール = 3,700枚

## 技術的な注意点

### 在庫の分離管理
- 既存製品とペール製品の在庫は完全に分離
- それぞれ独立した在庫カラムを持つ
- 混在しないように注意

### 後方互換性
- 既存の受注は自動的に `product_type = 'standard'` として扱われる
- 既存機能に影響なし

### パフォーマンス
- 在庫計算はO(n)で動作（受注数に比例）
- 製品タイプの分岐による追加コストは最小限

## 今後の拡張性

### 製品タイプの追加
新しい製品タイプを追加する場合：
1. ProductType に新しいタイプを追加
2. LocationInventory に新しい在庫フィールドを追加
3. ロール換算設定を追加（constants.ts）
4. 計算ロジックに分岐を追加（calculations.ts）
5. マイグレーションSQLを作成
6. UIを更新

### 製品ごとの詳細設定
将来的には製品マスタテーブルを作成し、
歩留まり設定をデータベースで管理することも検討可能。

## 関連ファイル

### 型定義
- types/order.ts
- types/inventory.ts
- types/index.ts

### データベース
- lib/supabase/client.ts
- lib/supabase/migration_add_pail_product.sql

### ロジック
- utils/constants.ts
- utils/calculations.ts
- lib/actions/inventory.ts
- lib/actions/orders.ts

### UI（要更新）
- components/order/order-form*.tsx
- components/inventory/multi-location-inventory-panel.tsx
- components/inventory/inventory-adjustment-dialog.tsx
- components/inventory/inventory-transfer-dialog.tsx
- components/dashboard/order-list.tsx

---

実装日: 2026-02-16
実装者: Claude Sonnet 4.5
