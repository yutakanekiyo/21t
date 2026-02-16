"use client";

import { useState } from "react";
import { IncomingDelivery } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TruckIcon } from "lucide-react";
import { IncomingDeliveryItem } from "./incoming-delivery-item";
import { IncomingDeliveryFormDialog } from "./incoming-delivery-form-dialog";

interface IncomingDeliveryPanelProps {
  deliveries: IncomingDelivery[];
}

export function IncomingDeliveryPanel({
  deliveries,
}: IncomingDeliveryPanelProps) {
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);

  // 入荷待ちのみフィルタ
  const pendingDeliveries = deliveries.filter((d) => d.status === "pending");

  // 納期超過をチェック
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueCount = pendingDeliveries.filter((d) => {
    const scheduledDate = new Date(d.scheduledDate);
    scheduledDate.setHours(0, 0, 0, 0);
    return scheduledDate < today;
  }).length;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <TruckIcon className="h-6 w-6" />
            入荷予定（入荷待ち）
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFormDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            入荷予定を追加
          </Button>
        </CardHeader>
        <CardContent>
          {/* サマリー */}
          <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-muted rounded-md">
            <div>
              <p className="text-sm text-muted-foreground">入荷待ち件数</p>
              <p className="text-2xl font-bold">
                {pendingDeliveries.length}件
              </p>
            </div>
            {overdueCount > 0 && (
              <div>
                <p className="text-sm text-muted-foreground">納期超過</p>
                <p className="text-2xl font-bold text-orange-600">
                  {overdueCount}件
                </p>
              </div>
            )}
          </div>

          {/* 入荷待ち一覧 */}
          {pendingDeliveries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>入荷待ちの予定はありません</p>
              <p className="text-sm mt-2">
                「入荷予定を追加」ボタンから登録してください
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingDeliveries.map((delivery) => (
                <IncomingDeliveryItem
                  key={delivery.id}
                  delivery={delivery}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 入荷予定追加ダイアログ */}
      <IncomingDeliveryFormDialog
        open={isFormDialogOpen}
        onOpenChange={setIsFormDialogOpen}
      />
    </>
  );
}
