"use client";

import { useState } from "react";
import { Inventory } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface InventoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventory: Inventory;
  onSubmit: (data: Omit<Inventory, 'lastUpdated'>) => void;
}

export function InventoryFormDialog({
  open,
  onOpenChange,
  inventory,
  onSubmit,
}: InventoryFormDialogProps) {
  const [formData, setFormData] = useState({
    body: inventory.body,
    bottom: inventory.bottom,
    lid: inventory.lid,
    rolls: inventory.rolls,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    const numValue = parseInt(value) || 0;
    setFormData((prev) => ({ ...prev, [field]: numValue }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>在庫を編集</DialogTitle>
            <DialogDescription>
              現在の在庫数を入力してください
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="body" className="text-right">
                ボディ
              </Label>
              <Input
                id="body"
                type="number"
                min="0"
                value={formData.body}
                onChange={(e) => handleChange('body', e.target.value)}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bottom" className="text-right">
                底
              </Label>
              <Input
                id="bottom"
                type="number"
                min="0"
                value={formData.bottom}
                onChange={(e) => handleChange('bottom', e.target.value)}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lid" className="text-right">
                蓋
              </Label>
              <Input
                id="lid"
                type="number"
                min="0"
                value={formData.lid}
                onChange={(e) => handleChange('lid', e.target.value)}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rolls" className="text-right">
                ロール
              </Label>
              <Input
                id="rolls"
                type="number"
                min="0"
                value={formData.rolls}
                onChange={(e) => handleChange('rolls', e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              キャンセル
            </Button>
            <Button type="submit">保存</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
