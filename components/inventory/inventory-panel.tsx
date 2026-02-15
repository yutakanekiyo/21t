"use client";

import { useState } from "react";
import { Inventory } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Edit } from "lucide-react";
import { InventoryFormDialog } from "./inventory-form-dialog";
import { DEFAULT_ROLL_CONFIG } from "@/utils/constants";

interface InventoryPanelProps {
  inventory: Inventory;
  onUpdate: (updates: Omit<Inventory, 'lastUpdated'>) => void;
}

export function InventoryPanel({ inventory, onUpdate }: InventoryPanelProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // ロール換算枚数を計算
  const rollPieces = inventory.rolls * DEFAULT_ROLL_CONFIG.piecesPerRoll;
  const bottomLidPool = inventory.bottom + inventory.lid + rollPieces;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-6 w-6" />
            現在の在庫状況
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditDialogOpen(true)}
          >
            <Edit className="h-4 w-4 mr-2" />
            在庫を編集
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* ボディ */}
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">ボディ</p>
              <p className="text-3xl font-bold">{inventory.body.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">個</p>
            </div>

            {/* 底 */}
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">底</p>
              <p className="text-3xl font-bold">{inventory.bottom.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">枚</p>
            </div>

            {/* 蓋 */}
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">蓋</p>
              <p className="text-3xl font-bold">{inventory.lid.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">枚</p>
            </div>

            {/* ロール */}
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">ロール</p>
              <p className="text-3xl font-bold">{inventory.rolls.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">本（{rollPieces.toLocaleString()}枚）</p>
            </div>
          </div>

          {/* 底・蓋共通プール */}
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

      <InventoryFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        inventory={inventory}
        onSubmit={(data) => {
          onUpdate(data);
          setIsEditDialogOpen(false);
        }}
      />
    </>
  );
}
