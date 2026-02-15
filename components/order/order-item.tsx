"use client";

import { Order, InventorySnapshot } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import { formatDate } from "@/utils/dateUtils";

interface OrderItemProps {
  order: Order;
  snapshot: InventorySnapshot;
  onEdit: (order: Order) => void;
  onDelete: (orderId: string) => void;
}

export function OrderItem({ order, snapshot, onEdit, onDelete }: OrderItemProps) {
  const handleDelete = () => {
    if (window.confirm(`受注番号 ${order.orderNumber} を削除しますか？`)) {
      onDelete(order.id);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold">{order.orderNumber}</h3>
              {snapshot.isAllSufficient ? (
                <Badge variant="success">OK</Badge>
              ) : (
                <Badge variant="destructive">在庫不足</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{order.customerName}</p>
            <p className="text-sm text-muted-foreground">
              納期: {formatDate(order.deliveryDate)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(order)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 受注内容 */}
        <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-muted rounded-md">
          <div>
            <p className="text-sm text-muted-foreground">セット数</p>
            <p className="font-semibold">{order.setQuantity.toLocaleString()}セット</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">追加蓋</p>
            <p className="font-semibold">{order.additionalLids.toLocaleString()}枚</p>
          </div>
        </div>

        {/* 在庫状況 */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">ボディ必要数:</span>
            <span>{snapshot.required.body.toLocaleString()}個</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">底・蓋必要数:</span>
            <span>{snapshot.required.bottomLid.toLocaleString()}枚</span>
          </div>

          <div className="pt-2 border-t">
            <div className="flex justify-between">
              <span className="text-muted-foreground">処理後ボディ:</span>
              <span className={snapshot.isBodySufficient ? '' : 'text-destructive font-semibold'}>
                {snapshot.afterInventory.body.toLocaleString()}個
                {!snapshot.isBodySufficient && ` (不足: ${snapshot.bodyShortage.toLocaleString()}個)`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">処理後底・蓋:</span>
              <span className={snapshot.isBottomLidSufficient ? '' : 'text-destructive font-semibold'}>
                {snapshot.afterInventory.bottomLidPool.toLocaleString()}枚
                {!snapshot.isBottomLidSufficient && ` (不足: ${snapshot.bottomLidShortage.toLocaleString()}枚)`}
              </span>
            </div>
          </div>
        </div>

        {order.notes && (
          <div className="mt-4 p-3 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground mb-1">備考:</p>
            <p className="text-sm">{order.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
