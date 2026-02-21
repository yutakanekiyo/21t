"use client";

import { useState } from "react";
import { LocationInventory } from "@/types";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Factory, Package } from "lucide-react";

interface ManufacturerBulkUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentManufacturerInventory: LocationInventory;
  onSubmit: (newInventory: LocationInventory) => void;
}

export function ManufacturerBulkUpdateDialog({
  open,
  onOpenChange,
  currentManufacturerInventory,
  onSubmit,
}: ManufacturerBulkUpdateDialogProps) {
  // メーカーはボディとロールのみ。底・蓋は常に0
  const [formData, setFormData] = useState<LocationInventory>({
    ...currentManufacturerInventory,
    bottom: 0,
    lid: 0,
    pailBottom: 0,
    pailLid: 0,
  });

  // ロール入力はm（メートル）単位で受け付ける（内部では本に変換）
  const [wipRollsInput, setWipRollsInput] = useState(
    (currentManufacturerInventory.rolls * 200).toString()
  );
  const [pailRollsInput, setPailRollsInput] = useState(
    (currentManufacturerInventory.pailRolls * 200).toString()
  );

  const handleChange = (field: keyof LocationInventory, value: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: Math.max(0, value),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleReset = () => {
    setFormData(currentManufacturerInventory);
    setWipRollsInput((currentManufacturerInventory.rolls * 200).toString());
    setPailRollsInput((currentManufacturerInventory.pailRolls * 200).toString());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Factory className="h-6 w-6 text-orange-600" />
            メーカー在庫一括更新
          </DialogTitle>
          <DialogDescription>
            メーカーから送られてきた月次在庫レポートを一括で入力できます。
            各製品タイプの全アイテムを一度に更新します。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {/* WIP製品 */}
            <Card className="border-blue-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Package className="h-5 w-5 text-blue-600" />
                  WIP
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="body">ボディ（枚）</Label>
                    <Input
                      id="body"
                      type="number"
                      min="0"
                      value={formData.body}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "") {
                          handleChange("body", 0);
                        } else {
                          const num = parseInt(value);
                          if (!isNaN(num)) {
                            handleChange("body", num);
                          }
                        }
                      }}
                      onFocus={(e) => e.target.select()}
                      className="text-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rolls">ロール（m）</Label>
                    <Input
                      id="rolls"
                      type="number"
                      min="0"
                      step="200"
                      value={wipRollsInput}
                      onChange={(e) => {
                        setWipRollsInput(e.target.value);
                        const meters = parseInt(e.target.value) || 0;
                        handleChange("rolls", Math.floor(meters / 200));
                      }}
                      onFocus={(e) => e.target.select()}
                      className="text-lg"
                    />
                    <p className="text-xs text-muted-foreground">
                      ※ 200m = 1本 = 300枚（底・蓋共通）
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ペール製品 */}
            <Card className="border-purple-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Package className="h-5 w-5 text-purple-600" />
                  ペール製品
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pailBody">ボディ（枚）</Label>
                    <Input
                      id="pailBody"
                      type="number"
                      min="0"
                      value={formData.pailBody}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "") {
                          handleChange("pailBody", 0);
                        } else {
                          const num = parseInt(value);
                          if (!isNaN(num)) {
                            handleChange("pailBody", num);
                          }
                        }
                      }}
                      onFocus={(e) => e.target.select()}
                      className="text-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pailRolls">ロール（m）</Label>
                    <Input
                      id="pailRolls"
                      type="number"
                      min="0"
                      step="200"
                      value={pailRollsInput}
                      onChange={(e) => {
                        setPailRollsInput(e.target.value);
                        const meters = parseInt(e.target.value) || 0;
                        handleChange("pailRolls", Math.floor(meters / 200));
                      }}
                      onFocus={(e) => e.target.select()}
                      className="text-lg"
                    />
                    <p className="text-xs text-muted-foreground">
                      ※ 200m = 1本（底655枚・蓋606枚）
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 使い方の説明 */}
            <div className="bg-orange-50 border border-orange-200 rounded-md p-3 text-sm text-orange-900">
              <p className="font-semibold mb-1">💡 使い方</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>メーカーから送られてきた在庫レポートの数値をそのまま入力</li>
                <li>ロールはメートル（m）単位で入力してください（200m単位）</li>
                <li>各フィールドをクリックすると全選択されるので、上書き入力が簡単</li>
                <li>入力後「更新」ボタンでメーカー在庫が一括更新されます</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleReset}>
              リセット
            </Button>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              キャンセル
            </Button>
            <Button type="submit">更新</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
