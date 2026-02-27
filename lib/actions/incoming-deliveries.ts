"use server";

import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase/client";
import {
  IncomingDelivery,
  IncomingDeliveryFormData,
  ItemType,
  LocationType,
} from "@/types";
import { revalidatePath } from "next/cache";
import { getInventory, updateInventory } from "./inventory";

/**
 * 全ての入荷予定を取得（納期順）
 */
export async function getIncomingDeliveries(): Promise<IncomingDelivery[]> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("認証が必要です");
  }

  const { data, error } = await supabase
    .from("incoming_deliveries")
    .select("*")
    .eq("user_id", userId)
    .order("scheduled_date", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (
    data?.map((row) => ({
      id: row.id,
      userId: row.user_id,
      location: row.location as LocationType,
      itemType: row.item_type as ItemType,
      quantity: row.quantity,
      scheduledDate: row.scheduled_date,
      status: row.status as "pending" | "completed",
      completedAt: row.completed_at || undefined,
      notes: row.notes || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })) || []
  );
}

/**
 * 入荷待ちの予定のみを取得
 */
export async function getPendingIncomingDeliveries(): Promise<
  IncomingDelivery[]
> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("認証が必要です");
  }

  const { data, error } = await supabase
    .from("incoming_deliveries")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "pending")
    .order("scheduled_date", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (
    data?.map((row) => ({
      id: row.id,
      userId: row.user_id,
      location: row.location as LocationType,
      itemType: row.item_type as ItemType,
      quantity: row.quantity,
      scheduledDate: row.scheduled_date,
      status: row.status as "pending" | "completed",
      completedAt: row.completed_at || undefined,
      notes: row.notes || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })) || []
  );
}

/**
 * 入荷予定を追加
 */
export async function addIncomingDelivery(
  formData: IncomingDeliveryFormData
): Promise<void> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("認証が必要です");
  }

  // バリデーション
  if (formData.quantity <= 0) {
    throw new Error("数量は1以上である必要があります");
  }

  const now = new Date().toISOString();

  const { error } = await supabase.from("incoming_deliveries").insert({
    user_id: userId,
    location: formData.location,
    item_type: formData.itemType,
    quantity: formData.quantity,
    scheduled_date: formData.scheduledDate,
    status: "pending",
    notes: formData.notes || null,
    created_at: now,
    updated_at: now,
  });

  if (error) {
    throw error;
  }

  revalidatePath("/dashboard");
}

/**
 * 入荷完了処理（在庫に加算 + status更新）
 */
export async function completeIncomingDelivery(id: string): Promise<void> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("認証が必要です");
  }

  console.log("completeIncomingDelivery called:", { userId, id });

  // 入荷予定を取得
  const { data: deliveryData, error: deliveryError } = await supabase
    .from("incoming_deliveries")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (deliveryError || !deliveryData) {
    throw new Error("入荷予定が見つかりません");
  }

  if (deliveryData.status === "completed") {
    throw new Error("この入荷予定は既に完了しています");
  }

  console.log("Delivery data:", deliveryData);

  // 現在の在庫を取得
  const currentInventory = await getInventory();
  if (!currentInventory) {
    throw new Error("在庫データが見つかりません");
  }

  console.log("Current inventory:", currentInventory);

  // 在庫を更新（指定拠点の指定アイテムに加算）
  const location = deliveryData.location as LocationType;
  const itemType = deliveryData.item_type as ItemType;
  const quantity = deliveryData.quantity;

  // アイテムタイプのキー名をマッピング（pailBodyなどのキャメルケース）
  const itemKeyMap: Record<string, keyof typeof currentInventory.office> = {
    body: "body",
    bottom: "bottom",
    lid: "lid",
    rolls: "rolls",
    pailBody: "pailBody",
    pailBottom: "pailBottom",
    pailLid: "pailLid",
    pailRolls: "pailRolls",
  };

  const itemKey = itemKeyMap[itemType];
  if (!itemKey) {
    throw new Error(`不明なアイテムタイプ: ${itemType}`);
  }

  const updatedInventory = {
    ...currentInventory,
    // 入荷先に加算
    [location]: {
      ...currentInventory[location],
      [itemKey]: currentInventory[location][itemKey] + quantity,
    },
    // メーカー在庫から減算（入荷先がメーカー自身の場合は二重操作を避ける）
    ...(location !== "manufacturer" && {
      manufacturer: {
        ...currentInventory.manufacturer,
        [itemKey]: Math.max(0, currentInventory.manufacturer[itemKey] - quantity),
      },
    }),
  };

  console.log("Updated inventory:", updatedInventory);

  try {
    // 在庫を更新
    await updateInventory(updatedInventory);

    // 入荷予定のステータスを完了に更新
    const { error: updateError } = await supabase
      .from("incoming_deliveries")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", userId);

    if (updateError) {
      throw updateError;
    }

    console.log("Delivery completed successfully");
    revalidatePath("/dashboard");
  } catch (error) {
    console.error("入荷完了エラー:", error);
    throw error;
  }
}

/**
 * 入荷予定を削除
 */
export async function deleteIncomingDelivery(id: string): Promise<void> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("認証が必要です");
  }

  const { error } = await supabase
    .from("incoming_deliveries")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  revalidatePath("/dashboard");
}
