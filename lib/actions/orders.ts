"use server";

import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase/client";
import { Order, OrderFormData } from "@/types";
import { revalidatePath } from "next/cache";

/**
 * 全受注を取得（納期順）
 */
export async function getOrders(): Promise<Order[]> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("認証が必要です");
  }

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("delivery_date", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (
    data?.map((row) => ({
      id: row.id,
      orderNumber: row.order_number,
      customerName: row.customer_name,
      deliveryDate: row.delivery_date,
      setQuantity: row.set_quantity,
      additionalLids: row.additional_lids,
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
    order_number: formData.orderNumber,
    customer_name: formData.customerName,
    delivery_date: formData.deliveryDate,
    set_quantity: formData.setQuantity,
    additional_lids: formData.additionalLids,
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
