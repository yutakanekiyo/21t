"use client";

import { useState } from "react";
import { Inventory, LocationType } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LOCATIONS } from "@/utils/constants";

type ProductTypeTab = 'standard' | 'pail';

interface InventoryAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventory: Inventory;
  onSubmit: (data: Omit<Inventory, "lastUpdated">) => void;
}

export function InventoryAdjustmentDialog({
  open,
  onOpenChange,
  inventory,
  onSubmit,
}: InventoryAdjustmentDialogProps) {
  const [formData, setFormData] = useState({
    office: { ...inventory.office },
    sugisaki: { ...inventory.sugisaki },
    manufacturer: { ...inventory.manufacturer },
  });

  // 選択された拠点と製品タイプ
  const [selectedLocation, setSelectedLocation] = useState<LocationType>('office');
  const [selectedProductType, setSelectedProductType] = useState<ProductTypeTab>('standard');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (
    location: LocationType,
    field: "body" | "bottom" | "lid" | "rolls" | "pailBody" | "pailBottom" | "pailLid" | "pailRolls",
    value: string
  ) => {
    const numValue = parseInt(value) || 0;
    setFormData((prev) => ({
      ...prev,
      [location]: {
        ...prev[location],
        [field]: numValue,
      },
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>在庫調整</DialogTitle>
            <DialogDescription>
              拠点と製品タイプを選択して、在庫数を直接入力できます
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 拠点選択タブ */}
            <div>
              <Label className="text-sm font-medium mb-2 block">拠点を選択</Label>
              <div className="grid grid-cols-3 gap-2">
                {LOCATIONS.map((location) => (
                  <button
                    key={location.id}
                    type="button"
                    onClick={() => setSelectedLocation(location.id)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      selectedLocation === location.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {location.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 製品タイプ選択タブ */}
            <div>
              <Label className="text-sm font-medium mb-2 block">製品タイプを選択</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedProductType('standard')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    selectedProductType === 'standard'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  既存製品
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedProductType('pail')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    selectedProductType === 'pail'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  ペール製品
                </button>
              </div>
            </div>

            {/* 選択された拠点と製品タイプの在庫入力フィールド */}
            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="text-sm font-medium mb-3">
                {LOCATIONS.find(l => l.id === selectedLocation)?.name} - {selectedProductType === 'standard' ? '既存製品' : 'ペール製品'}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {selectedProductType === 'standard' ? (
                  <>
                    <div>
                      <Label htmlFor="body">ボディ（個）</Label>
                      <Input
                        id="body"
                        type="number"
                        min="0"
                        value={formData[selectedLocation].body}
                        onChange={(e) => handleChange(selectedLocation, "body", e.target.value)}
                        onFocus={(e) => e.target.select()}
                      />
                    </div>
                    <div>
                      <Label htmlFor="bottom">底（枚）</Label>
                      <Input
                        id="bottom"
                        type="number"
                        min="0"
                        value={formData[selectedLocation].bottom}
                        onChange={(e) => handleChange(selectedLocation, "bottom", e.target.value)}
                        onFocus={(e) => e.target.select()}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lid">蓋（枚）</Label>
                      <Input
                        id="lid"
                        type="number"
                        min="0"
                        value={formData[selectedLocation].lid}
                        onChange={(e) => handleChange(selectedLocation, "lid", e.target.value)}
                        onFocus={(e) => e.target.select()}
                      />
                    </div>
                    <div>
                      <Label htmlFor="rolls">ロール（本）</Label>
                      <Input
                        id="rolls"
                        type="number"
                        min="0"
                        value={formData[selectedLocation].rolls}
                        onChange={(e) => handleChange(selectedLocation, "rolls", e.target.value)}
                        onFocus={(e) => e.target.select()}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label htmlFor="pailBody">ボディ（個）</Label>
                      <Input
                        id="pailBody"
                        type="number"
                        min="0"
                        value={formData[selectedLocation].pailBody}
                        onChange={(e) => handleChange(selectedLocation, "pailBody", e.target.value)}
                        onFocus={(e) => e.target.select()}
                      />
                    </div>
                    <div>
                      <Label htmlFor="pailBottom">底（枚）</Label>
                      <Input
                        id="pailBottom"
                        type="number"
                        min="0"
                        value={formData[selectedLocation].pailBottom}
                        onChange={(e) => handleChange(selectedLocation, "pailBottom", e.target.value)}
                        onFocus={(e) => e.target.select()}
                      />
                    </div>
                    <div>
                      <Label htmlFor="pailLid">蓋（枚）</Label>
                      <Input
                        id="pailLid"
                        type="number"
                        min="0"
                        value={formData[selectedLocation].pailLid}
                        onChange={(e) => handleChange(selectedLocation, "pailLid", e.target.value)}
                        onFocus={(e) => e.target.select()}
                      />
                    </div>
                    <div>
                      <Label htmlFor="pailRolls">ロール（本）</Label>
                      <Input
                        id="pailRolls"
                        type="number"
                        min="0"
                        value={formData[selectedLocation].pailRolls}
                        onChange={(e) => handleChange(selectedLocation, "pailRolls", e.target.value)}
                        onFocus={(e) => e.target.select()}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              キャンセル
            </Button>
            <Button type="submit">保存</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
