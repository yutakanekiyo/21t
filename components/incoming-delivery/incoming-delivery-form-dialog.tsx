"use client";

import { useState, useTransition } from "react";
import { IncomingDeliveryFormData, LocationType, ItemType } from "@/types";
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
import { Textarea } from "@/components/ui/textarea";
import { LOCATIONS } from "@/utils/constants";
import { addIncomingDelivery } from "@/lib/actions/incoming-deliveries";
import { formatDateISO } from "@/utils/dateUtils";

interface IncomingDeliveryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ITEM_TYPES = [
  // 既存製品
  { id: "body" as ItemType, name: "ボディ（既存）", unit: "個" },
  { id: "bottom" as ItemType, name: "底（既存）", unit: "枚" },
  { id: "lid" as ItemType, name: "蓋（既存）", unit: "枚" },
  { id: "rolls" as ItemType, name: "ロール（既存）", unit: "本" },
  // ペール製品
  { id: "pailBody" as ItemType, name: "ボディ（ペール）", unit: "個" },
  { id: "pailBottom" as ItemType, name: "底（ペール）", unit: "枚" },
  { id: "pailLid" as ItemType, name: "蓋（ペール）", unit: "枚" },
  { id: "pailRolls" as ItemType, name: "ロール（ペール）", unit: "本" },
];

export function IncomingDeliveryFormDialog({
  open,
  onOpenChange,
}: IncomingDeliveryFormDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState<IncomingDeliveryFormData>({
    location: "manufacturer",
    itemType: "body",
    quantity: 0,
    scheduledDate: formatDateISO(new Date()),
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // バリデーション
    if (formData.quantity <= 0) {
      alert("数量は1以上を入力してください");
      return;
    }

    if (!formData.scheduledDate) {
      alert("入荷予定日を入力してください");
      return;
    }

    startTransition(async () => {
      try {
        console.log("入荷予定追加:", formData);
        await addIncomingDelivery(formData);
        console.log("入荷予定追加成功");
        alert("入荷予定を追加しました");
        onOpenChange(false);
        // フォームをリセット
        setFormData({
          location: "manufacturer",
          itemType: "body",
          quantity: 0,
          scheduledDate: formatDateISO(new Date()),
          notes: "",
        });
        // ページをリロードして反映
        window.location.reload();
      } catch (error) {
        console.error("入荷予定追加エラー:", error);
        const errorMessage =
          error instanceof Error ? error.message : "不明なエラー";
        alert(`入荷予定の追加に失敗しました: ${errorMessage}`);
      }
    });
  };

  const handleChange = (
    field: keyof IncomingDeliveryFormData,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>入荷予定を追加</DialogTitle>
            <DialogDescription>
              メーカーからの入荷予定を登録します
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* 入荷先拠点 */}
            <div>
              <Label htmlFor="location">入荷先拠点</Label>
              <select
                id="location"
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={formData.location}
                onChange={(e) =>
                  handleChange("location", e.target.value as LocationType)
                }
              >
                {LOCATIONS.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* アイテムタイプ */}
            <div>
              <Label htmlFor="itemType">アイテム</Label>
              <select
                id="itemType"
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={formData.itemType}
                onChange={(e) =>
                  handleChange("itemType", e.target.value as ItemType)
                }
              >
                {ITEM_TYPES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}（{item.unit}）
                  </option>
                ))}
              </select>
            </div>

            {/* 数量 */}
            <div>
              <Label htmlFor="quantity">数量</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) =>
                  handleChange("quantity", parseInt(e.target.value) || 0)
                }
                onFocus={(e) => e.target.select()}
                placeholder="入荷予定の数量を入力"
              />
            </div>

            {/* 入荷予定日 */}
            <div>
              <Label htmlFor="scheduledDate">入荷予定日</Label>
              <Input
                id="scheduledDate"
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => handleChange("scheduledDate", e.target.value)}
              />
            </div>

            {/* 備考 */}
            <div>
              <Label htmlFor="notes">備考（任意）</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="発注番号や注意事項など"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "追加中..." : "追加"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
