"use client";

import { useState, useTransition } from "react";
import { IncomingDelivery } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Check, Trash2, Calendar, MapPin, Package } from "lucide-react";
import { formatDate } from "@/utils/dateUtils";
import { LOCATIONS } from "@/utils/constants";
import {
  completeIncomingDelivery,
  deleteIncomingDelivery,
} from "@/lib/actions/incoming-deliveries";
import { useRouter } from "next/navigation";

interface IncomingDeliveryItemProps {
  delivery: IncomingDelivery;
}

const ITEM_TYPE_NAMES: Record<string, string> = {
  body: "ボディ（既存）",
  bottom: "底（既存）",
  lid: "蓋（既存）",
  rolls: "ロール（既存）",
  pailBody: "ボディ（ペール）",
  pailBottom: "底（ペール）",
  pailLid: "蓋（ペール）",
  pailRolls: "ロール（ペール）",
};

const ITEM_TYPE_UNITS: Record<string, string> = {
  body: "個",
  bottom: "枚",
  lid: "枚",
  rolls: "本",
  pailBody: "個",
  pailBottom: "枚",
  pailLid: "枚",
  pailRolls: "本",
};

// 拠点ごとの色設定（カレンダーと同じ）
const LOCATION_COLORS = {
  office: {
    border: "border-l-blue-500",
    bg: "bg-blue-50/50",
  },
  sugisaki: {
    border: "border-l-purple-500",
    bg: "bg-purple-50/50",
  },
  manufacturer: {
    border: "border-l-orange-500",
    bg: "bg-orange-50/50",
  },
};

export function IncomingDeliveryItem({ delivery }: IncomingDeliveryItemProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const locationInfo = LOCATIONS.find((loc) => loc.id === delivery.location);

  // 納期が過ぎているかチェック
  const scheduledDate = new Date(delivery.scheduledDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  scheduledDate.setHours(0, 0, 0, 0);
  const isOverdue = scheduledDate < today && delivery.status === "pending";

  // 拠点ごとの色を取得
  const locationColors = LOCATION_COLORS[delivery.location];

  const handleCompleteClick = () => {
    console.log("Complete button clicked for delivery:", delivery.id);
    setShowCompleteDialog(true);
  };

  const handleDeleteClick = () => {
    console.log("Delete button clicked for delivery:", delivery.id);
    setShowDeleteDialog(true);
  };

  const handleConfirmComplete = () => {
    console.log("User confirmed completion, starting transition");
    startTransition(async () => {
      try {
        console.log("入荷完了処理開始:", delivery.id);
        await completeIncomingDelivery(delivery.id);
        console.log("入荷完了成功");
        alert("入荷完了しました。在庫に反映されました。");
        router.refresh();
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } catch (error) {
        console.error("入荷完了エラー:", error);
        const errorMessage =
          error instanceof Error ? error.message : "不明なエラー";
        alert(`入荷完了に失敗しました: ${errorMessage}`);
      }
    });
  };

  const handleConfirmDelete = () => {
    console.log("User confirmed deletion, starting transition");
    startTransition(async () => {
      try {
        await deleteIncomingDelivery(delivery.id);
        alert("入荷予定を削除しました");
        router.refresh();
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } catch (error) {
        console.error("削除エラー:", error);
        const errorMessage =
          error instanceof Error ? error.message : "不明なエラー";
        alert(`削除に失敗しました: ${errorMessage}`);
      }
    });
  };

  return (
    <Card className={`border-l-4 ${locationColors.border} ${locationColors.bg} ${
      isOverdue ? "border-t-2 border-t-red-500" : ""
    }`}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {delivery.status === "completed" ? (
                <Badge variant="secondary">完了</Badge>
              ) : isOverdue ? (
                <Badge variant="destructive">納期超過</Badge>
              ) : (
                <Badge>入荷待ち</Badge>
              )}
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {formatDate(delivery.scheduledDate)}
                </span>
                {isOverdue && (
                  <span className="text-orange-600 text-xs">（納期超過）</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{locationInfo?.name}</span>
              </div>

              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span>
                  {ITEM_TYPE_NAMES[delivery.itemType]} ×{" "}
                  <strong>{delivery.quantity.toLocaleString()}</strong>
                  {ITEM_TYPE_UNITS[delivery.itemType]}
                </span>
              </div>

              {delivery.notes && (
                <p className="text-xs text-muted-foreground mt-2">
                  備考: {delivery.notes}
                </p>
              )}
            </div>
          </div>

          {delivery.status === "pending" && (
            <div className="flex gap-2 ml-4">
              <Button
                variant="default"
                size="sm"
                onClick={handleCompleteClick}
                disabled={isPending}
              >
                <Check className="h-4 w-4 mr-1" />
                完了
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteClick}
                disabled={isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}

          {delivery.status === "completed" && delivery.completedAt && (
            <div className="text-xs text-muted-foreground ml-4">
              完了日時: {formatDate(delivery.completedAt)}
            </div>
          )}
        </div>
      </CardContent>

      {/* 完了確認ダイアログ */}
      <ConfirmDialog
        open={showCompleteDialog}
        onOpenChange={setShowCompleteDialog}
        onConfirm={handleConfirmComplete}
        title="入荷完了"
        description="この入荷予定を完了しますか？指定拠点の在庫に加算されます。"
        confirmText="完了する"
        cancelText="キャンセル"
        variant="default"
      />

      {/* 削除確認ダイアログ */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleConfirmDelete}
        title="入荷予定を削除"
        description="この入荷予定を削除しますか？この操作は取り消せません。"
        confirmText="削除する"
        cancelText="キャンセル"
        variant="destructive"
      />
    </Card>
  );
}
