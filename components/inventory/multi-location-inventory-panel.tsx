"use client";

import { useState } from "react";
import { Inventory, getTotalInventory } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Edit, ArrowRightLeft } from "lucide-react";
import { LocationInventoryCard } from "./location-inventory-card";
import { InventoryAdjustmentDialog } from "./inventory-adjustment-dialog";
import { InventoryTransferDialog } from "./inventory-transfer-dialog";
import { DEFAULT_ROLL_CONFIG } from "@/utils/constants";

interface MultiLocationInventoryPanelProps {
  inventory: Inventory;
  onUpdate: (updates: Omit<Inventory, "lastUpdated">) => void;
}

export function MultiLocationInventoryPanel({
  inventory,
  onUpdate,
}: MultiLocationInventoryPanelProps) {
  const [isAdjustmentDialogOpen, setIsAdjustmentDialogOpen] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);

  // 合計在庫を計算
  const totalInventory = getTotalInventory(inventory);
  const totalRollPieces = totalInventory.rolls * DEFAULT_ROLL_CONFIG.piecesPerRoll;
  const bottomLidPool =
    totalInventory.bottom + totalInventory.lid + totalRollPieces;

  return (
    <>
      <div className="space-y-4">
        {/* 合計在庫カード */}
        <Card className="border-2 border-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-6 w-6" />
              合計在庫（全拠点）
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsTransferDialogOpen(true)}
              >
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                在庫移動
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAdjustmentDialogOpen(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                在庫調整
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">ボディ</p>
                <p className="text-3xl font-bold">
                  {totalInventory.body.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">個</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">底</p>
                <p className="text-3xl font-bold">
                  {totalInventory.bottom.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">枚</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">蓋</p>
                <p className="text-3xl font-bold">
                  {totalInventory.lid.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">枚</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">ロール</p>
                <p className="text-3xl font-bold">
                  {totalInventory.rolls.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  本 ({totalRollPieces.toLocaleString()}枚)
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">底・蓋 合計在庫</p>
                <p className="text-xl font-bold text-primary">
                  {bottomLidPool.toLocaleString()}枚
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ※底と蓋は同じロール材から切り出されます
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 拠点別在庫カード */}
        <div>
          <h3 className="text-lg font-semibold mb-3">拠点別在庫</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <LocationInventoryCard
              locationType="office"
              inventory={inventory.office}
            />
            <LocationInventoryCard
              locationType="sugisaki"
              inventory={inventory.sugisaki}
            />
            <LocationInventoryCard
              locationType="manufacturer"
              inventory={inventory.manufacturer}
            />
          </div>
        </div>
      </div>

      {/* 在庫調整ダイアログ */}
      <InventoryAdjustmentDialog
        open={isAdjustmentDialogOpen}
        onOpenChange={setIsAdjustmentDialogOpen}
        inventory={inventory}
        onSubmit={(data) => {
          onUpdate(data);
          setIsAdjustmentDialogOpen(false);
        }}
      />

      {/* 在庫移動ダイアログ */}
      <InventoryTransferDialog
        open={isTransferDialogOpen}
        onOpenChange={setIsTransferDialogOpen}
        currentInventory={inventory}
      />
    </>
  );
}
