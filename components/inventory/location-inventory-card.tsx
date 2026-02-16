"use client";

import { LocationInventory, LocationType } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LOCATIONS, DEFAULT_ROLL_CONFIG } from "@/utils/constants";

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

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{locationInfo?.name}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {locationInfo?.description}
        </p>
      </CardHeader>
      <CardContent>
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
            <p className="text-2xl font-bold">{inventory.rolls.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">
              本 ({rollPieces.toLocaleString()}枚)
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
