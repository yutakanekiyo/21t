"use server";

import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase/client";
import { Inventory } from "@/types";
import { revalidatePath } from "next/cache";
import { DEFAULT_INVENTORY } from "@/utils/constants";

/**
 * 在庫を取得（複数拠点対応）
 */
export async function getInventory(): Promise<Inventory | null> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("認証が必要です");
  }

  const { data, error } = await supabase
    .from("inventories")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    // レコードが存在しない場合はデフォルト値を返す
    if (error.code === "PGRST116") {
      return DEFAULT_INVENTORY;
    }
    throw error;
  }

  return {
    office: {
      body: data.office_body || 0,
      bottom: data.office_bottom || 0,
      lid: data.office_lid || 0,
      rolls: data.office_rolls || 0,
    },
    sugisaki: {
      body: data.sugisaki_body || 0,
      bottom: data.sugisaki_bottom || 0,
      lid: data.sugisaki_lid || 0,
      rolls: data.sugisaki_rolls || 0,
    },
    manufacturer: {
      body: data.manufacturer_body || 0,
      bottom: data.manufacturer_bottom || 0,
      lid: data.manufacturer_lid || 0,
      rolls: data.manufacturer_rolls || 0,
    },
    lastUpdated: data.last_updated,
  };
}

/**
 * 在庫を更新（複数拠点対応）
 */
export async function updateInventory(
  updates: Omit<Inventory, "lastUpdated">
): Promise<void> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("認証が必要です");
  }

  const { error } = await supabase.from("inventories").upsert(
    {
      user_id: userId,
      office_body: updates.office.body,
      office_bottom: updates.office.bottom,
      office_lid: updates.office.lid,
      office_rolls: updates.office.rolls,
      sugisaki_body: updates.sugisaki.body,
      sugisaki_bottom: updates.sugisaki.bottom,
      sugisaki_lid: updates.sugisaki.lid,
      sugisaki_rolls: updates.sugisaki.rolls,
      manufacturer_body: updates.manufacturer.body,
      manufacturer_bottom: updates.manufacturer.bottom,
      manufacturer_lid: updates.manufacturer.lid,
      manufacturer_rolls: updates.manufacturer.rolls,
      last_updated: new Date().toISOString(),
    },
    {
      onConflict: "user_id",
    }
  );

  if (error) {
    throw error;
  }

  revalidatePath("/dashboard");
}
