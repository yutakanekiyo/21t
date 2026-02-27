"use client";

import { useState } from "react";
import { Order, InventorySnapshot, OrderStatus } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Edit, Trash2, Check, Archive, RotateCcw } from "lucide-react";
import { formatDate } from "@/utils/dateUtils";
import { completeOrderWithInventoryDeduction } from "@/lib/actions/orders";

interface OrderItemProps {
  order: Order;
  snapshot: InventorySnapshot;
  onEdit: (order: Order) => void;
  onDelete: (orderId: string) => void;
  onUpdateStatus?: (orderId: string, status: OrderStatus) => void;
}

export function OrderItem({ order, snapshot, onEdit, onDelete, onUpdateStatus }: OrderItemProps) {
  const [isPendingComplete, setIsPendingComplete] = useState(false);
  const [blockMessage, setBlockMessage] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showReactivateDialog, setShowReactivateDialog] = useState(false);

  const handleDeleteClick = () => setShowDeleteDialog(true);
  const handleArchiveClick = () => setShowArchiveDialog(true);
  const handleReactivateClick = () => setShowReactivateDialog(true);

  // 完了可否チェック：local_ok かつ切り出し不要な場合のみ完了可能
  const getCompletionBlockReason = (): string | null => {
    if (snapshot.allocationStatus === 'production_needed') {
      return "完了できません。\nメーカーへの生産依頼が必要です。在庫（メーカー含む）が不足しているため、先にメーカーへ生産を依頼してください。";
    }
    if (snapshot.allocationStatus === 'manufacturer_pickup') {
      return "完了できません。\n発注が必要です。ローカル在庫では不足しているため、入荷予定を登録し入荷完了後に再度お試しください。";
    }
    // local_ok だが切り出しが必要なケース
    const issues: string[] = [];
    if (snapshot.localAfterInventory.bottom < 0) {
      issues.push(`底: ${Math.abs(snapshot.localAfterInventory.bottom).toLocaleString()}枚の切り出しが必要`);
    }
    if (snapshot.localAfterInventory.lid < 0) {
      issues.push(`蓋: ${Math.abs(snapshot.localAfterInventory.lid).toLocaleString()}枚の切り出しが必要`);
    }
    if (issues.length > 0) {
      return `完了できません。ロールからの切り出しが必要です。\n${issues.join('\n')}\n切り出し後に在庫を更新してから再度お試しください。`;
    }
    return null;
  };

  const handleCompleteClick = () => {
    const blockReason = getCompletionBlockReason();
    if (blockReason) {
      setBlockMessage(blockReason);
      return;
    }
    setShowCompleteDialog(true);
  };

  const handleConfirmComplete = async () => {
    setIsPendingComplete(true);
    try {
      await completeOrderWithInventoryDeduction(
        order.id,
        order.productType,
        order.setQuantity,
        order.additionalLids
      );
      alert("受注を完了しました。事務所在庫から減算されました。");
      window.location.reload();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "不明なエラー";
      setBlockMessage(`完了処理に失敗しました:\n${msg}`);
      setIsPendingComplete(false);
    }
  };

  const handleConfirmDelete = () => onDelete(order.id);
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
                  disabled={isPendingComplete}
                  className="text-green-600 hover:text-green-700"
                >
                  <Check className="h-4 w-4 mr-1" />
                  {isPendingComplete ? "処理中..." : "完了"}
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
              const bodyLocal = snapshot.localAfterInventory.body;
              const bottomLocal = snapshot.localAfterInventory.bottom;
              const lidLocal = snapshot.localAfterInventory.lid;
              const surplusBody = snapshot.surplus.body;
              const surplusBottomLid = snapshot.surplus.bottomLidPool;
              const status = snapshot.allocationStatus;

              // ボディ: 不足 = メーカー補充 or 生産必要
              const bodyNegClass = status === 'manufacturer_pickup'
                ? 'text-amber-600 font-semibold'
                : 'text-destructive font-semibold';

              // 底・蓋: ローカルOKでも切り出し必要なら青、発注/生産必要ならamber/red
              const bottomLidNegClass =
                status === 'local_ok'
                  ? 'text-blue-600 font-semibold'
                  : status === 'manufacturer_pickup'
                  ? 'text-amber-600 font-semibold'
                  : 'text-destructive font-semibold';

              const renderBodyValue = (value: number) => `${value.toLocaleString()}枚`;
              const renderBottomLidValue = (value: number) =>
                value < 0
                  ? `${value.toLocaleString()}枚（要カット: ${Math.abs(value).toLocaleString()}枚）`
                  : `${value.toLocaleString()}枚`;

              return (
                <>
                  {/* ボディ */}
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground">処理後ボディ:</span>
                    <div className="text-right">
                      <span className={bodyLocal < 0 ? bodyNegClass : ''}>
                        {renderBodyValue(bodyLocal)}
                      </span>
                      {bodyLocal < 0 && (
                        <p className="text-xs text-muted-foreground">
                          (トータル余力: {surplusBody.toLocaleString()}枚)
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 底 */}
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground">処理後底:</span>
                    <div className="text-right">
                      <span className={bottomLocal < 0 ? bottomLidNegClass : ''}>
                        {renderBottomLidValue(bottomLocal)}
                      </span>
                      {bottomLocal < 0 && status !== 'local_ok' && (
                        <p className="text-xs text-muted-foreground">
                          (トータル余力: {surplusBottomLid.toLocaleString()}枚)
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 蓋 */}
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground">処理後蓋:</span>
                    <div className="text-right">
                      <span className={lidLocal < 0 ? bottomLidNegClass : ''}>
                        {renderBottomLidValue(lidLocal)}
                      </span>
                      {lidLocal < 0 && status !== 'local_ok' && (
                        <p className="text-xs text-muted-foreground">
                          (トータル余力: {surplusBottomLid.toLocaleString()}枚)
                        </p>
                      )}
                    </div>
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

      {/* 完了ブロック理由ダイアログ */}
      <Dialog open={!!blockMessage} onOpenChange={(open) => !open && setBlockMessage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>完了できません</DialogTitle>
            <DialogDescription className="whitespace-pre-line">
              {blockMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setBlockMessage(null)}>閉じる</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
