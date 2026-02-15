"use server";

import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase/client";
import { Inventory } from "@/types";
import { revalidatePath } from "next/cache";

/**
 * 在庫を取得
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
      return {
        body: 0,
        bottom: 0,
        lid: 0,
        rolls: 0,
        lastUpdated: new Date().toISOString(),
      };
    }
    throw error;
  }

  return {
    body: data.body,
    bottom: data.bottom,
    lid: data.lid,
    rolls: data.rolls,
    lastUpdated: data.last_updated,
  };
}

/**
 * 在庫を更新
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
      body: updates.body,
      bottom: updates.bottom,
      lid: updates.lid,
      rolls: updates.rolls,
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
