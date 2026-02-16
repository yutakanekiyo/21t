"use client";

import { LocationInventory, LocationType } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LOCATIONS, DEFAULT_ROLL_CONFIG, PAIL_ROLL_CONFIG } from "@/utils/constants";

interface LocationInventoryCardProps {
  locationType: LocationType;
  inventory: LocationInventory;
}

export function LocationInventoryCard({
  locationType,
  inventory,
}: LocationInventoryCardProps) {
  const locationInfo = LOCATIONS.find((loc) => loc.id === locationType);
  const rollPieces = inventory.rolls * DEFAULT_ROLL_CONFIG.piecesPerRoll;
  const pailRollPieces = inventory.pailRolls * PAIL_ROLL_CONFIG.piecesPerRoll;
  const isManufacturer = locationType === "manufacturer";

  return (
    <Card className={isManufacturer ? "border-2 border-orange-500 bg-orange-50/30" : ""}>
      <CardHeader className="pb-3">
        <CardTitle className={`text-lg ${isManufacturer ? "text-orange-900" : ""}`}>
          {locationInfo?.name}
          {isManufacturer && (
            <span className="ml-2 text-xs font-normal text-orange-700">
              （メーカー預け）
            </span>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {locationInfo?.description}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 既存製品 */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">既存製品</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">ボディ</p>
              <p className="text-2xl font-bold">{inventory.body.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">個</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">底</p>
              <p className="text-2xl font-bold">{inventory.bottom.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">枚</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">蓋</p>
              <p className="text-2xl font-bold">{inventory.lid.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">枚</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">ロール</p>
              <p className={`text-2xl font-bold ${isManufacturer ? "text-orange-600" : ""}`}>
                {inventory.rolls.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                本 ({rollPieces.toLocaleString()}枚)
              </p>
            </div>
          </div>
        </div>

        {/* ペール製品 */}
        <div className="border-t pt-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">ペール製品</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">ボディ</p>
              <p className="text-2xl font-bold">{inventory.pailBody.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">個</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">底</p>
              <p className="text-2xl font-bold">{inventory.pailBottom.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">枚</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">蓋</p>
              <p className="text-2xl font-bold">{inventory.pailLid.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">枚</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">ロール</p>
              <p className={`text-2xl font-bold ${isManufacturer ? "text-green-600" : ""}`}>
                {inventory.pailRolls.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                本 ({pailRollPieces.toLocaleString()}セット)
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
