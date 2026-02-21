"use client";

import { LocationInventory, LocationType } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LOCATIONS, DEFAULT_ROLL_CONFIG, PAIL_ROLL_CONFIG, PAIL_BOTTOM_PIECES_PER_ROLL, PAIL_LID_PIECES_PER_ROLL } from "@/utils/constants";

// カレンダーと同じ色体系
const LOCATION_COLORS: Record<LocationType, {
  card: string;
  title: string;
  subtitle: string;
  roll: string;
}> = {
  office: {
    card: "border-2 border-blue-300 bg-blue-50/30",
    title: "text-blue-900",
    subtitle: "text-blue-700",
    roll: "text-blue-600",
  },
  sugisaki: {
    card: "border-2 border-purple-300 bg-purple-50/30",
    title: "text-purple-900",
    subtitle: "text-purple-700",
    roll: "text-purple-600",
  },
  manufacturer: {
    card: "border-2 border-orange-500 bg-orange-50/30",
    title: "text-orange-900",
    subtitle: "text-orange-700",
    roll: "text-orange-600",
  },
};

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
  const colors = LOCATION_COLORS[locationType];

  return (
    <Card className={colors.card}>
      <CardHeader className="pb-3">
        <CardTitle className={`text-lg ${colors.title}`}>
          {locationInfo?.name}
          {isManufacturer && (
            <span className={`ml-2 text-xs font-normal ${colors.subtitle}`}>
              （メーカー預け）
            </span>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {locationInfo?.description}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* WIP製品 */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">WIP</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">ボディ</p>
              <p className="text-2xl font-bold">{inventory.body.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">枚</p>
            </div>

            {!isManufacturer && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">底</p>
                <p className="text-2xl font-bold">{inventory.bottom.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">枚</p>
              </div>
            )}

            {!isManufacturer && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">蓋</p>
                <p className="text-2xl font-bold">{inventory.lid.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">枚</p>
              </div>
            )}

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">ロール</p>
              <p className={`text-2xl font-bold ${colors.roll}`}>
                {inventory.rolls.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                本（{inventory.rolls * 200}m / {rollPieces.toLocaleString()}枚分）
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
              <p className="text-xs text-muted-foreground">枚</p>
            </div>

            {!isManufacturer && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">底</p>
                <p className="text-2xl font-bold">{inventory.pailBottom.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">枚</p>
              </div>
            )}

            {!isManufacturer && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">蓋</p>
                <p className="text-2xl font-bold">{inventory.pailLid.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">枚</p>
              </div>
            )}

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">ロール</p>
              <p className={`text-2xl font-bold ${colors.roll}`}>
                {inventory.pailRolls.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                本（{inventory.pailRolls * 200}m / 底{(inventory.pailRolls * PAIL_BOTTOM_PIECES_PER_ROLL).toLocaleString()}枚 / 蓋{(inventory.pailRolls * PAIL_LID_PIECES_PER_ROLL).toLocaleString()}枚）
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
