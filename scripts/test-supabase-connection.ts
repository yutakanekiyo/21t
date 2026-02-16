/**
 * Supabase接続テストスクリプト
 *
 * 実行方法:
 * npx tsx scripts/test-supabase-connection.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

// .env.localを読み込む
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

console.log("=".repeat(60));
console.log("Supabase接続テスト");
console.log("=".repeat(60));
console.log();

// 環境変数の確認
console.log("✓ 環境変数チェック:");
console.log(`  NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? "設定済み" : "未設定"}`);
console.log(`  SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? "設定済み" : "未設定"}`);
console.log();

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ エラー: 環境変数が設定されていません");
  console.error("   .env.localファイルを確認してください");
  process.exit(1);
}

// Supabaseクライアントを作成
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testConnection() {
  try {
    // 1. inventoriesテーブルの存在確認
    console.log("✓ inventoriesテーブルの確認:");
    const { data: inventoriesData, error: inventoriesError } = await supabase
      .from("inventories")
      .select("*")
      .limit(1);

    if (inventoriesError) {
      console.error(`  ❌ エラー: ${inventoriesError.message}`);
    } else {
      console.log(`  ✓ テーブルが存在します`);
      console.log(`  ✓ レコード数: ${inventoriesData?.length || 0}`);
    }
    console.log();

    // 2. inventory_transfersテーブルの存在確認
    console.log("✓ inventory_transfersテーブルの確認:");
    const { data: transfersData, error: transfersError } = await supabase
      .from("inventory_transfers")
      .select("*")
      .limit(1);

    if (transfersError) {
      console.error(`  ❌ エラー: ${transfersError.message}`);
      console.error(`  💡 マイグレーションを実行する必要があります:`);
      console.error(`     lib/supabase/migration_multi_location.sql`);
    } else {
      console.log(`  ✓ テーブルが存在します`);
      console.log(`  ✓ レコード数: ${transfersData?.length || 0}`);
    }
    console.log();

    // 3. ordersテーブルの存在確認
    console.log("✓ ordersテーブルの確認:");
    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .limit(1);

    if (ordersError) {
      console.error(`  ❌ エラー: ${ordersError.message}`);
    } else {
      console.log(`  ✓ テーブルが存在します`);
      console.log(`  ✓ レコード数: ${ordersData?.length || 0}`);
    }
    console.log();

    // 4. inventoriesテーブルの列構造確認
    console.log("✓ inventoriesテーブルの列構造確認:");
    const { data: inventoryColumns, error: inventoryColumnsError } = await supabase
      .from("inventories")
      .select("*")
      .limit(0);

    if (inventoryColumnsError) {
      console.error(`  ❌ エラー: ${inventoryColumnsError.message}`);
    } else {
      console.log(`  ✓ 列構造の取得成功`);

      // サンプルデータを1件取得して列を確認
      const { data: sampleData } = await supabase
        .from("inventories")
        .select("*")
        .limit(1)
        .single();

      if (sampleData) {
        const columns = Object.keys(sampleData);
        console.log(`  ✓ 列: ${columns.join(", ")}`);

        // 複数拠点対応の列が存在するか確認
        const requiredColumns = [
          "office_body", "office_bottom", "office_lid", "office_rolls",
          "sugisaki_body", "sugisaki_bottom", "sugisaki_lid", "sugisaki_rolls",
          "manufacturer_body", "manufacturer_bottom", "manufacturer_lid", "manufacturer_rolls"
        ];

        const missingColumns = requiredColumns.filter(col => !columns.includes(col));

        if (missingColumns.length > 0) {
          console.error(`  ❌ 不足している列: ${missingColumns.join(", ")}`);
          console.error(`  💡 マイグレーションを実行する必要があります`);
        } else {
          console.log(`  ✓ 複数拠点対応の列が全て存在します`);
        }
      } else {
        console.log(`  ⚠️  データがありません（列の確認をスキップ）`);
      }
    }
    console.log();

    console.log("=".repeat(60));
    console.log("テスト完了");
    console.log("=".repeat(60));

  } catch (error) {
    console.error("予期しないエラー:", error);
    process.exit(1);
  }
}

testConnection();
