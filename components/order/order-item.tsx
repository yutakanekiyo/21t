"use client";

import { useState } from "react";
import { Order, InventorySnapshot, OrderStatus } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Edit, Trash2, Check, Archive, RotateCcw } from "lucide-react";
import { formatDate } from "@/utils/dateUtils";

interface OrderItemProps {
  order: Order;
  snapshot: InventorySnapshot;
  onEdit: (order: Order) => void;
  onDelete: (orderId: string) => void;
  onUpdateStatus?: (orderId: string, status: OrderStatus) => void;
}

export function OrderItem({ order, snapshot, onEdit, onDelete, onUpdateStatus }: OrderItemProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showReactivateDialog, setShowReactivateDialog] = useState(false);

  const handleDeleteClick = () => setShowDeleteDialog(true);
  const handleCompleteClick = () => setShowCompleteDialog(true);
  const handleArchiveClick = () => setShowArchiveDialog(true);
  const handleReactivateClick = () => setShowReactivateDialog(true);

  const handleConfirmDelete = () => onDelete(order.id);
  const handleConfirmComplete = () => onUpdateStatus?.(order.id, 'completed');
  const handleConfirmArchive = () => onUpdateStatus?.(order.id, 'archived');
  const handleConfirmReactivate = () => onUpdateStatus?.(order.id, 'active');

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold">{order.orderNumber}</h3>
              {/* 製品タイプバッジ */}
              <Badge variant={order.productType === 'pail' ? 'default' : 'secondary'}>
                {order.productType === 'pail' ? 'ペール' : 'WIP'}
              </Badge>
              {/* ステータスバッジ */}
              {order.status === 'completed' && (
                <Badge variant="default" className="bg-green-600">
                  完了
                </Badge>
              )}
              {order.status === 'archived' && (
                <Badge variant="secondary">
                  アーカイブ
                </Badge>
              )}
              {/* 在庫状況バッジ（3択） */}
              {snapshot.allocationStatus === 'local_ok' && (
                <Badge variant="success">OK</Badge>
              )}
              {snapshot.allocationStatus === 'manufacturer_pickup' && (
                <Badge className="bg-amber-500 text-white">発注必要</Badge>
              )}
              {snapshot.allocationStatus === 'production_needed' && (
                <Badge variant="destructive">生産必要</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{order.customerName}</p>
            <p className="text-sm text-muted-foreground">
              納期: {formatDate(order.deliveryDate)}
            </p>
          </div>
          <div className="flex gap-2">
            {/* ステータス変更ボタン */}
            {order.status === 'active' && onUpdateStatus && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCompleteClick}
                  className="text-green-600 hover:text-green-700"
                >
                  <Check className="h-4 w-4 mr-1" />
                  完了
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleArchiveClick}
                >
                  <Archive className="h-4 w-4 mr-1" />
                  アーカイブ
                </Button>
              </>
            )}
            {order.status === 'completed' && onUpdateStatus && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReactivateClick}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  進行中に戻す
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleArchiveClick}
                >
                  <Archive className="h-4 w-4 mr-1" />
                  アーカイブ
                </Button>
              </>
            )}
            {order.status === 'archived' && onUpdateStatus && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReactivateClick}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                進行中に戻す
              </Button>
            )}
            {/* 編集・削除ボタン */}
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
              onClick={handleDeleteClick}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 受注内容 */}
        <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-muted rounded-md">
          <div>
            <p className="text-sm text-muted-foreground">セット数（ボディ・底）</p>
            <p className="font-semibold">{order.setQuantity.toLocaleString()}セット</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">蓋数（トータル）</p>
            <p className="font-semibold">{order.additionalLids.toLocaleString()}枚</p>
          </div>
        </div>

        {/* 在庫状況 */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">ボディ必要数:</span>
            <span>{snapshot.setQuantity.toLocaleString()}枚</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">底必要数:</span>
            <span>{snapshot.setQuantity.toLocaleString()}枚</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">蓋必要数:</span>
            <span>{snapshot.additionalLids.toLocaleString()}枚</span>
          </div>

          <div className="pt-2 border-t">
            {(() => {
              const netBody = snapshot.afterInventory.body - snapshot.bodyShortage;
              const netBottom = snapshot.afterInventory.bottom - snapshot.bottomShortage;
              const netLid = snapshot.afterInventory.lid - snapshot.lidShortage;
              return (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">処理後ボディ:</span>
                    <span className={netBody < 0 ? 'text-destructive font-semibold' : ''}>
                      {netBody.toLocaleString()}枚
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">処理後底:</span>
                    <span className={netBottom < 0 ? 'text-destructive font-semibold' : ''}>
                      {netBottom.toLocaleString()}枚
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">処理後蓋:</span>
                    <span className={netLid < 0 ? 'text-destructive font-semibold' : ''}>
                      {netLid.toLocaleString()}枚
                    </span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {order.notes && (
          <div className="mt-4 p-3 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground mb-1">備考:</p>
            <p className="text-sm">{order.notes}</p>
          </div>
        )}
      </CardContent>

      {/* 完了確認ダイアログ */}
      <ConfirmDialog
        open={showCompleteDialog}
        onOpenChange={setShowCompleteDialog}
        onConfirm={handleConfirmComplete}
        title="受注を完了"
        description={`受注番号 ${order.orderNumber} を完了にしますか？`}
        confirmText="完了する"
        cancelText="キャンセル"
        variant="default"
      />

      {/* アーカイブ確認ダイアログ */}
      <ConfirmDialog
        open={showArchiveDialog}
        onOpenChange={setShowArchiveDialog}
        onConfirm={handleConfirmArchive}
        title="受注をアーカイブ"
        description={`受注番号 ${order.orderNumber} をアーカイブしますか？`}
        confirmText="アーカイブする"
        cancelText="キャンセル"
        variant="default"
      />

      {/* 再開確認ダイアログ */}
      <ConfirmDialog
        open={showReactivateDialog}
        onOpenChange={setShowReactivateDialog}
        onConfirm={handleConfirmReactivate}
        title="受注を進行中に戻す"
        description={`受注番号 ${order.orderNumber} を進行中に戻しますか？`}
        confirmText="進行中に戻す"
        cancelText="キャンセル"
        variant="default"
      />

      {/* 削除確認ダイアログ */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleConfirmDelete}
        title="受注を削除"
        description={`受注番号 ${order.orderNumber} を削除しますか？この操作は取り消せません。`}
        confirmText="削除する"
        cancelText="キャンセル"
        variant="destructive"
      />
    </Card>
  );
}
