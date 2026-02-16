"use client";

import { useState } from "react";
import { Order, InventorySnapshot, OrderStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Plus, Archive, ListChecks, List } from "lucide-react";
import { OrderItem } from "@/components/order/order-item";
import { OrderFormDialog } from "@/components/order/order-form-dialog";

interface OrderListProps {
  orders: Order[];
  snapshots: InventorySnapshot[];
  onAddOrder: (data: any) => void;
  onUpdateOrder: (id: string, data: any) => void;
  onDeleteOrder: (id: string) => void;
  onUpdateStatus: (id: string, status: OrderStatus) => void;
}

export function OrderList({
  orders,
  snapshots,
  onAddOrder,
  onUpdateOrder,
  onDeleteOrder,
  onUpdateStatus,
}: OrderListProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<'active' | 'completed' | 'archived' | 'all'>('active');

  // ステータスでフィルタリング
  const filteredOrders = orders.filter((order) => {
    if (statusFilter === 'all') return true;
    return order.status === statusFilter;
  });

  // 受注を納期順（昇順）にソート
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const dateA = new Date(a.deliveryDate).getTime();
    const dateB = new Date(b.deliveryDate).getTime();
    // 納期が同じ場合は作成日時順
    if (dateA === dateB) {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    return dateA - dateB;
  });

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
      <div className="space-y-4 mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">受注一覧</h2>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-5 w-5 mr-2" />
            新規受注を追加
          </Button>
        </div>

        {/* ステータスフィルター */}
        <div className="flex gap-2">
          <Button
            variant={statusFilter === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('active')}
          >
            <List className="h-4 w-4 mr-2" />
            進行中（{orders.filter(o => o.status === 'active').length}）
          </Button>
          <Button
            variant={statusFilter === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('completed')}
          >
            <ListChecks className="h-4 w-4 mr-2" />
            完了（{orders.filter(o => o.status === 'completed').length}）
          </Button>
          <Button
            variant={statusFilter === 'archived' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('archived')}
          >
            <Archive className="h-4 w-4 mr-2" />
            アーカイブ（{orders.filter(o => o.status === 'archived').length}）
          </Button>
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
          >
            すべて（{orders.length}）
          </Button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">受注がありません</p>
          <p className="text-sm mt-2">「新規受注を追加」ボタンから受注を登録してください</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedOrders.map((order) => {
            const snapshot = snapshotMap.get(order.id);
            if (!snapshot) return null;

            return (
              <OrderItem
                key={order.id}
                order={order}
                snapshot={snapshot}
                onEdit={handleEdit}
                onDelete={onDeleteOrder}
                onUpdateStatus={onUpdateStatus}
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
