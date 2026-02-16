"use client";

import { Inventory } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Truck } from "lucide-react";
import { DEFAULT_ROLL_CONFIG, PAIL_ROLL_CONFIG } from "@/utils/constants";

interface ManufacturerInventoryBannerProps {
  inventory: Inventory;
}

export function ManufacturerInventoryBanner({
  inventory,
}: ManufacturerInventoryBannerProps) {
  const manufacturer = inventory.manufacturer;

  // 既存製品のロール換算枚数
  const standardRollPieces = manufacturer.rolls * DEFAULT_ROLL_CONFIG.piecesPerRoll;

  // ペール製品のロール換算セット数
  const pailRollSets = manufacturer.pailRolls * PAIL_ROLL_CONFIG.piecesPerRoll;

  return (
    <Card className="border-2 border-orange-500 bg-orange-50/50">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-orange-500 rounded-lg">
            <Truck className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-orange-900">
              メーカー預け在庫
            </h3>
            <p className="text-sm text-orange-700">
              メーカーに預けている在庫一覧
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* 既存製品 - ロール */}
          <div className="bg-white rounded-lg p-4 border border-orange-200">
            <p className="text-sm text-muted-foreground mb-1">
              ロール（既存製品）
            </p>
            <p className="text-4xl font-bold text-orange-600">
              {manufacturer.rolls.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              本（{standardRollPieces.toLocaleString()}枚）
            </p>
          </div>

          {/* ペール製品 - ロール */}
          <div className="bg-white rounded-lg p-4 border border-orange-200">
            <p className="text-sm text-muted-foreground mb-1">
              ロール（ペール製品）
            </p>
            <p className="text-4xl font-bold text-green-600">
              {manufacturer.pailRolls.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              本（{pailRollSets.toLocaleString()}セット）
            </p>
          </div>

          {/* 既存製品 - その他 */}
          <div className="bg-white rounded-lg p-4 border border-orange-200">
            <p className="text-sm text-muted-foreground mb-2">既存製品</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ボディ:</span>
                <span className="font-semibold">
                  {manufacturer.body.toLocaleString()}個
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">底:</span>
                <span className="font-semibold">
                  {manufacturer.bottom.toLocaleString()}枚
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">蓋:</span>
                <span className="font-semibold">
                  {manufacturer.lid.toLocaleString()}枚
                </span>
              </div>
            </div>
          </div>

          {/* ペール製品 - その他 */}
          <div className="bg-white rounded-lg p-4 border border-orange-200">
            <p className="text-sm text-muted-foreground mb-2">ペール製品</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ボディ:</span>
                <span className="font-semibold">
                  {manufacturer.pailBody.toLocaleString()}個
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">底:</span>
                <span className="font-semibold">
                  {manufacturer.pailBottom.toLocaleString()}枚
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">蓋:</span>
                <span className="font-semibold">
                  {manufacturer.pailLid.toLocaleString()}枚
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
