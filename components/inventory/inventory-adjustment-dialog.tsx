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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (
    location: LocationType,
    field: "body" | "bottom" | "lid" | "rolls",
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
              各拠点の在庫数を直接入力して調整できます
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {LOCATIONS.map((location) => (
              <div key={location.id} className="space-y-3">
                <div className="font-semibold text-lg border-b pb-2">
                  {location.name}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`${location.id}-body`}>ボディ（個）</Label>
                    <Input
                      id={`${location.id}-body`}
                      type="number"
                      min="0"
                      value={formData[location.id].body}
                      onChange={(e) =>
                        handleChange(location.id, "body", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor={`${location.id}-bottom`}>底（枚）</Label>
                    <Input
                      id={`${location.id}-bottom`}
                      type="number"
                      min="0"
                      value={formData[location.id].bottom}
                      onChange={(e) =>
                        handleChange(location.id, "bottom", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor={`${location.id}-lid`}>蓋（枚）</Label>
                    <Input
                      id={`${location.id}-lid`}
                      type="number"
                      min="0"
                      value={formData[location.id].lid}
                      onChange={(e) =>
                        handleChange(location.id, "lid", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor={`${location.id}-rolls`}>ロール（本）</Label>
                    <Input
                      id={`${location.id}-rolls`}
                      type="number"
                      min="0"
                      value={formData[location.id].rolls}
                      onChange={(e) =>
                        handleChange(location.id, "rolls", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
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
