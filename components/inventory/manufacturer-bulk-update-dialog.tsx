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
  const [formData, setFormData] = useState<LocationInventory>(
    currentManufacturerInventory
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
            {/* 既存製品 */}
            <Card className="border-blue-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Package className="h-5 w-5 text-blue-600" />
                  既存製品
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="body">ボディ（個）</Label>
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
                    <Label htmlFor="bottom">底（枚）</Label>
                    <Input
                      id="bottom"
                      type="number"
                      min="0"
                      value={formData.bottom}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "") {
                          handleChange("bottom", 0);
                        } else {
                          const num = parseInt(value);
                          if (!isNaN(num)) {
                            handleChange("bottom", num);
                          }
                        }
                      }}
                      onFocus={(e) => e.target.select()}
                      className="text-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lid">蓋（枚）</Label>
                    <Input
                      id="lid"
                      type="number"
                      min="0"
                      value={formData.lid}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "") {
                          handleChange("lid", 0);
                        } else {
                          const num = parseInt(value);
                          if (!isNaN(num)) {
                            handleChange("lid", num);
                          }
                        }
                      }}
                      onFocus={(e) => e.target.select()}
                      className="text-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rolls">ロール（本）</Label>
                    <Input
                      id="rolls"
                      type="number"
                      min="0"
                      value={formData.rolls}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "") {
                          handleChange("rolls", 0);
                        } else {
                          const num = parseInt(value);
                          if (!isNaN(num)) {
                            handleChange("rolls", num);
                          }
                        }
                      }}
                      onFocus={(e) => e.target.select()}
                      className="text-lg"
                    />
                    <p className="text-xs text-muted-foreground">
                      ※ 1本 = 300枚（底・蓋共通）
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
                    <Label htmlFor="pailBody">ボディ（個）</Label>
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
                    <Label htmlFor="pailBottom">底（枚）</Label>
                    <Input
                      id="pailBottom"
                      type="number"
                      min="0"
                      value={formData.pailBottom}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "") {
                          handleChange("pailBottom", 0);
                        } else {
                          const num = parseInt(value);
                          if (!isNaN(num)) {
                            handleChange("pailBottom", num);
                          }
                        }
                      }}
                      onFocus={(e) => e.target.select()}
                      className="text-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pailLid">蓋（枚）</Label>
                    <Input
                      id="pailLid"
                      type="number"
                      min="0"
                      value={formData.pailLid}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "") {
                          handleChange("pailLid", 0);
                        } else {
                          const num = parseInt(value);
                          if (!isNaN(num)) {
                            handleChange("pailLid", num);
                          }
                        }
                      }}
                      onFocus={(e) => e.target.select()}
                      className="text-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pailRolls">ロール（本）</Label>
                    <Input
                      id="pailRolls"
                      type="number"
                      min="0"
                      value={formData.pailRolls}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "") {
                          handleChange("pailRolls", 0);
                        } else {
                          const num = parseInt(value);
                          if (!isNaN(num)) {
                            handleChange("pailRolls", num);
                          }
                        }
                      }}
                      onFocus={(e) => e.target.select()}
                      className="text-lg"
                    />
                    <p className="text-xs text-muted-foreground">
                      ※ 1本 = 630セット（底・蓋共通）
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
