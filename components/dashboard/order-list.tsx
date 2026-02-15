"use client";

import { useState } from "react";
import { Order, InventorySnapshot } from "@/types";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { OrderItem } from "@/components/order/order-item";
import { OrderFormDialog } from "@/components/order/order-form-dialog";

interface OrderListProps {
  orders: Order[];
  snapshots: InventorySnapshot[];
  onAddOrder: (data: any) => void;
  onUpdateOrder: (id: string, data: any) => void;
  onDeleteOrder: (id: string) => void;
}

export function OrderList({
  orders,
  snapshots,
  onAddOrder,
  onUpdateOrder,
  onDeleteOrder,
}: OrderListProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | undefined>(undefined);

  // スナップショットをマップ化（orderId -> snapshot）
  const snapshotMap = new Map(
    snapshots.map((snapshot) => [snapshot.orderId, snapshot])
  );

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
  };

  const handleCloseEditDialog = () => {
    setEditingOrder(undefined);
  };

  const handleSubmitEdit = (data: any) => {
    if (editingOrder) {
      onUpdateOrder(editingOrder.id, data);
      handleCloseEditDialog();
    }
  };

  const handleSubmitAdd = (data: any) => {
    onAddOrder(data);
    setIsAddDialogOpen(false);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">受注一覧</h2>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-5 w-5 mr-2" />
          新規受注を追加
        </Button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">受注がありません</p>
          <p className="text-sm mt-2">「新規受注を追加」ボタンから受注を登録してください</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const snapshot = snapshotMap.get(order.id);
            if (!snapshot) return null;

            return (
              <OrderItem
                key={order.id}
                order={order}
                snapshot={snapshot}
                onEdit={handleEdit}
                onDelete={onDeleteOrder}
              />
            );
          })}
        </div>
      )}

      {/* 新規追加ダイアログ */}
      <OrderFormDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleSubmitAdd}
      />

      {/* 編集ダイアログ */}
      <OrderFormDialog
        open={!!editingOrder}
        onOpenChange={(open) => {
          if (!open) handleCloseEditDialog();
        }}
        onSubmit={handleSubmitEdit}
        order={editingOrder}
      />
    </>
  );
}
