"use client";

import { useState, useOptimistic, useTransition } from "react";
import { Order, Inventory, OrderFormData, IncomingDelivery, OrderStatus } from "@/types";
import { MultiLocationInventoryPanel } from "@/components/inventory/multi-location-inventory-panel";
import { OrderList } from "./order-list";
import { InventoryAlert } from "./inventory-alert";
import { IncomingDeliveryPanel } from "@/components/incoming-delivery/incoming-delivery-panel";
import { MonthlyOrderRecommendationPanel } from "./monthly-order-recommendation";
import { ManufacturerStockAlert } from "./manufacturer-stock-alert";
import { calculateInventorySnapshotsV2 as calculateInventorySnapshots, getInventorySummary, calculateMonthlyOrderRecommendation } from "@/utils/calculations-v2";
import { DEFAULT_ROLL_CONFIG } from "@/utils/constants";
import { addOrder, updateOrder, deleteOrder, updateOrderStatus } from "@/lib/actions/orders";
import { updateInventory } from "@/lib/actions/inventory";

interface DashboardProps {
  initialOrders: Order[];
  initialInventory: Inventory;
  initialIncomingDeliveries: IncomingDelivery[];
}

export function Dashboard({
  initialOrders,
  initialInventory,
  initialIncomingDeliveries
}: DashboardProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [inventory, setInventory] = useState(initialInventory);
  const [incomingDeliveries, setIncomingDeliveries] = useState(initialIncomingDeliveries);
  const [isPending, startTransition] = useTransition();

  // 在庫計算
  const snapshots = calculateInventorySnapshots(orders, inventory, DEFAULT_ROLL_CONFIG);
  const summary = getInventorySummary(snapshots);

  // 月次発注レコメンド計算
  const monthlyRecommendation = calculateMonthlyOrderRecommendation(orders, inventory);

  // 在庫更新ハンドラー
  const handleUpdateInventory = async (updates: Omit<Inventory, "lastUpdated">) => {
    const newInventory = {
      ...updates,
      lastUpdated: new Date().toISOString(),
    };

    setInventory(newInventory);

    startTransition(async () => {
      try {
        await updateInventory(updates);
      } catch (error) {
        console.error("在庫更新エラー:", error);
        alert("在庫の更新に失敗しました");
        setInventory(inventory); // ロールバック
      }
    });
  };

  // 受注追加ハンドラー
  const handleAddOrder = async (formData: OrderFormData) => {
    startTransition(async () => {
      try {
        await addOrder(formData);
        // Server Actionがrevalidateするので、実際のデータは次回レンダリングで取得される
        // 楽観的UIのため、ローカルに追加
        const newOrder: Order = {
          id: crypto.randomUUID(),
          ...formData,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setOrders((prev) => [...prev, newOrder]);
      } catch (error) {
        console.error("受注追加エラー:", error);
        alert("受注の追加に失敗しました");
      }
    });
  };

  // 受注更新ハンドラー
  const handleUpdateOrder = async (id: string, formData: OrderFormData) => {
    startTransition(async () => {
      try {
        await updateOrder(id, formData);
        // 楽観的UIのため、ローカルに更新
        setOrders((prev) =>
          prev.map((order) =>
            order.id === id
              ? {
                  ...order,
                  ...formData,
                  updatedAt: new Date().toISOString(),
                }
              : order
          )
        );
      } catch (error) {
        console.error("受注更新エラー:", error);
        alert("受注の更新に失敗しました");
      }
    });
  };

  // 受注削除ハンドラー
  const handleDeleteOrder = async (id: string) => {
    startTransition(async () => {
      try {
        await deleteOrder(id);
        // 楽観的UIのため、ローカルから削除
        setOrders((prev) => prev.filter((order) => order.id !== id));
      } catch (error) {
        console.error("受注削除エラー:", error);
        alert("受注の削除に失敗しました");
      }
    });
  };

  // 受注ステータス更新ハンドラー
  const handleUpdateOrderStatus = async (id: string, status: OrderStatus) => {
    startTransition(async () => {
      try {
        await updateOrderStatus(id, status);
        // 楽観的UIのため、ローカルに更新
        setOrders((prev) =>
          prev.map((order) =>
            order.id === id
              ? {
                  ...order,
                  status,
                  updatedAt: new Date().toISOString(),
                }
              : order
          )
        );
      } catch (error) {
        console.error("ステータス更新エラー:", error);
        alert("ステータスの更新に失敗しました");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* 在庫パネル（複数拠点対応） */}
      <MultiLocationInventoryPanel inventory={inventory} onUpdate={handleUpdateInventory} />

      {/* 入荷予定パネル */}
      <IncomingDeliveryPanel deliveries={incomingDeliveries} />

      {/* 月次発注レコメンド */}
      <MonthlyOrderRecommendationPanel recommendation={monthlyRecommendation} />

      {/* メーカー生産アラート */}
      <ManufacturerStockAlert snapshots={snapshots} />

      {/* 在庫不足アラート */}
      <InventoryAlert summary={summary} />

      {/* 受注一覧 */}
      <OrderList
        orders={orders}
        snapshots={snapshots}
        onAddOrder={handleAddOrder}
        onUpdateOrder={handleUpdateOrder}
        onDeleteOrder={handleDeleteOrder}
        onUpdateStatus={handleUpdateOrderStatus}
      />
    </div>
  );
}
