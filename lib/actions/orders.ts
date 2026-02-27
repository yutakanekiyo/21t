"use server";

import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase/client";
import { Order, OrderFormData, OrderStatus } from "@/types";
import { revalidatePath } from "next/cache";

/**
 * 全受注を取得（納期順）
 * @param statusFilter - ステータスでフィルタリング（指定しない場合は 'active' のみ）
 */
export async function getOrders(statusFilter?: OrderStatus | 'all'): Promise<Order[]> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("認証が必要です");
  }

  let query = supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId);

  // ステータスでフィルタリング（デフォルトは 'active' のみ）
  if (!statusFilter || statusFilter === 'active') {
    query = query.eq("status", "active");
  } else if (statusFilter !== 'all') {
    query = query.eq("status", statusFilter);
  }

  query = query
    .order("delivery_date", { ascending: true })
    .order("created_at", { ascending: true });

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (
    data?.map((row) => ({
      id: row.id,
      productType: (row.product_type || 'standard') as 'standard' | 'pail',
      orderNumber: row.order_number,
      customerName: row.customer_name,
      deliveryDate: row.delivery_date,
      setQuantity: row.set_quantity,
      additionalLids: row.additional_lids,
      status: (row.status || 'active') as OrderStatus,
      notes: row.notes || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })) || []
  );
}

/**
 * 受注を追加
 */
export async function addOrder(formData: OrderFormData): Promise<void> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("認証が必要です");
  }

  const now = new Date().toISOString();

  const { error } = await supabase.from("orders").insert({
    user_id: userId,
    product_type: formData.productType,
    order_number: formData.orderNumber,
    customer_name: formData.customerName,
    delivery_date: formData.deliveryDate,
    set_quantity: formData.setQuantity,
    additional_lids: formData.additionalLids,
    status: 'active', // 新規受注はすべて active
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
 * 受注を更新
 */
export async function updateOrder(
  id: string,
  formData: OrderFormData
): Promise<void> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("認証が必要です");
  }

  const { error } = await supabase
    .from("orders")
    .update({
      product_type: formData.productType,
      order_number: formData.orderNumber,
      customer_name: formData.customerName,
      delivery_date: formData.deliveryDate,
      set_quantity: formData.setQuantity,
      additional_lids: formData.additionalLids,
      notes: formData.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  revalidatePath("/dashboard");
}

/**
 * 受注を削除
 */
export async function deleteOrder(id: string): Promise<void> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("認証が必要です");
  }

  const { error } = await supabase
    .from("orders")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  revalidatePath("/dashboard");
}

/**
 * 受注完了処理（事務所在庫からボディ・底・蓋を直接減算）
 */
export async function completeOrderWithInventoryDeduction(
  orderId: string,
  productType: "standard" | "pail",
  setQuantity: number,
  additionalLids: number
): Promise<void> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("認証が必要です");
  }

  console.log("completeOrderWithInventoryDeduction:", { orderId, productType, setQuantity, additionalLids });

  // 現在の事務所在庫を取得
  const { data: inv, error: fetchError } = await supabase
    .from("inventories")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (fetchError || !inv) {
    throw new Error(`在庫の取得に失敗しました: ${fetchError?.message ?? "データなし"}`);
  }

  // 事務所在庫から減算するフィールドを構築
  const updateFields =
    productType === "pail"
      ? {
          office_pail_body: Math.max(0, (inv.office_pail_body || 0) - setQuantity),
          office_pail_bottom: Math.max(0, (inv.office_pail_bottom || 0) - setQuantity),
          office_pail_lid: Math.max(0, (inv.office_pail_lid || 0) - additionalLids),
          last_updated: new Date().toISOString(),
        }
      : {
          office_body: Math.max(0, (inv.office_body || 0) - setQuantity),
          office_bottom: Math.max(0, (inv.office_bottom || 0) - setQuantity),
          office_lid: Math.max(0, (inv.office_lid || 0) - additionalLids),
          last_updated: new Date().toISOString(),
        };

  console.log("updateFields:", updateFields);

  // 在庫を更新
  const { error: invError } = await supabase
    .from("inventories")
    .update(updateFields)
    .eq("user_id", userId);

  if (invError) {
    throw new Error(`在庫の更新に失敗しました: ${invError.message}`);
  }

  // 受注ステータスを完了に更新
  const { error: orderError } = await supabase
    .from("orders")
    .update({
      status: "completed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("user_id", userId);

  if (orderError) {
    throw new Error(`受注の更新に失敗しました: ${orderError.message}`);
  }

  console.log("completeOrderWithInventoryDeduction: success");
  revalidatePath("/dashboard");
}

/**
 * 受注のステータスを更新
 */
export async function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<void> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("認証が必要です");
  }

  const { error } = await supabase
    .from("orders")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  revalidatePath("/dashboard");
}
