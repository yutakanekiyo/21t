/**
 * 在庫移動履歴を確認するスクリプト
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTransfers() {
  console.log("=".repeat(60));
  console.log("在庫移動履歴の確認");
  console.log("=".repeat(60));
  console.log();

  // 在庫移動履歴を取得
  const { data: transfers, error: transfersError } = await supabase
    .from("inventory_transfers")
    .select("*")
    .order("created_at", { ascending: false });

  if (transfersError) {
    console.error("❌ エラー:", transfersError.message);
    return;
  }

  console.log(`✓ 在庫移動履歴: ${transfers?.length || 0}件`);
  console.log();

  if (transfers && transfers.length > 0) {
    transfers.forEach((transfer, index) => {
      console.log(`[${index + 1}] ID: ${transfer.id}`);
      console.log(`    ユーザー: ${transfer.user_id}`);
      console.log(`    移動: ${transfer.from_location} → ${transfer.to_location}`);
      console.log(`    アイテム: ${transfer.item_type}`);
      console.log(`    数量: ${transfer.quantity}`);
      console.log(`    備考: ${transfer.notes || "なし"}`);
      console.log(`    作成日時: ${transfer.created_at}`);
      console.log();
    });
  }

  // 現在の在庫状況を取得
  const { data: inventories, error: inventoriesError } = await supabase
    .from("inventories")
    .select("*");

  if (inventoriesError) {
    console.error("❌ エラー:", inventoriesError.message);
    return;
  }

  console.log("=".repeat(60));
  console.log("現在の在庫状況");
  console.log("=".repeat(60));
  console.log();

  if (inventories && inventories.length > 0) {
    inventories.forEach((inv, index) => {
      console.log(`[${index + 1}] ユーザー: ${inv.user_id}`);
      console.log(`    事務所:`);
      console.log(`      ボディ: ${inv.office_body}, 底: ${inv.office_bottom}, 蓋: ${inv.office_lid}, ロール: ${inv.office_rolls}`);
      console.log(`    杉崎:`);
      console.log(`      ボディ: ${inv.sugisaki_body}, 底: ${inv.sugisaki_bottom}, 蓋: ${inv.sugisaki_lid}, ロール: ${inv.sugisaki_rolls}`);
      console.log(`    メーカー:`);
      console.log(`      ボディ: ${inv.manufacturer_body}, 底: ${inv.manufacturer_bottom}, 蓋: ${inv.manufacturer_lid}, ロール: ${inv.manufacturer_rolls}`);
      console.log(`    最終更新: ${inv.last_updated}`);
      console.log();
    });
  }
}

checkTransfers();
