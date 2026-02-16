"use server";

import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase/client";
import {
  InventoryTransfer,
  InventoryTransferFormData,
  LocationType,
  ItemType
} from "@/types";
import { revalidatePath } from "next/cache";
import { getInventory, updateInventory } from "./inventory";

/**
 * 在庫移動履歴を取得
 */
export async function getTransfers(): Promise<InventoryTransfer[]> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("認証が必要です");
  }

  const { data, error } = await supabase
    .from("inventory_transfers")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (
    data?.map((row) => ({
      id: row.id,
      userId: row.user_id,
      fromLocation: row.from_location as LocationType,
      toLocation: row.to_location as LocationType,
      itemType: row.item_type as ItemType,
      quantity: row.quantity,
      notes: row.notes || undefined,
      createdAt: row.created_at,
    })) || []
  );
}

/**
 * 在庫移動を実行
 */
export async function createTransfer(
  formData: InventoryTransferFormData
): Promise<void> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("認証が必要です");
  }

  // バリデーション
  if (formData.fromLocation === formData.toLocation) {
    throw new Error("移動元と移動先が同じです");
  }

  if (formData.quantity <= 0) {
    throw new Error("移動数量は1以上である必要があります");
  }

  // 現在の在庫を取得
  const currentInventory = await getInventory();
  if (!currentInventory) {
    throw new Error("在庫データが見つかりません");
  }

  // 移動元の在庫が十分か確認
  const fromLocationInventory = currentInventory[formData.fromLocation];
  const currentQuantity = fromLocationInventory[formData.itemType];

  if (currentQuantity < formData.quantity) {
    throw new Error(
      `移動元の在庫が不足しています（現在: ${currentQuantity}、必要: ${formData.quantity}）`
    );
  }

  // 在庫を更新
  const updatedInventory = { ...currentInventory };
  updatedInventory[formData.fromLocation] = {
    ...updatedInventory[formData.fromLocation],
    [formData.itemType]: currentQuantity - formData.quantity,
  };
  updatedInventory[formData.toLocation] = {
    ...updatedInventory[formData.toLocation],
    [formData.itemType]:
      updatedInventory[formData.toLocation][formData.itemType] +
      formData.quantity,
  };

  // トランザクション的に実行
  try {
    // 在庫移動履歴を記録
    const { error: transferError } = await supabase
      .from("inventory_transfers")
      .insert({
        user_id: userId,
        from_location: formData.fromLocation,
        to_location: formData.toLocation,
        item_type: formData.itemType,
        quantity: formData.quantity,
        notes: formData.notes || null,
        created_at: new Date().toISOString(),
      });

    if (transferError) {
      throw transferError;
    }

    // 在庫を更新
    await updateInventory(updatedInventory);

    revalidatePath("/dashboard");
  } catch (error) {
    console.error("在庫移動エラー:", error);
    throw new Error("在庫移動に失敗しました");
  }
}

/**
 * 在庫移動履歴を削除
 */
export async function deleteTransfer(id: string): Promise<void> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("認証が必要です");
  }

  const { error } = await supabase
    .from("inventory_transfers")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  revalidatePath("/dashboard");
}
