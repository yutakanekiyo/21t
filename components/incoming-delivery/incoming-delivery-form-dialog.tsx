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

const PRODUCT_TYPES = [
  { id: "wip", name: "WIP" },
  { id: "pail", name: "ペール" },
] as const;

const ITEM_KINDS = [
  { id: "body", name: "ボディ", unit: "枚" },
  { id: "rolls", name: "ロール", unit: "m" },
] as const;

type ProductType = "wip" | "pail";
type ItemKind = "body" | "rolls";

function toItemType(productType: ProductType, itemKind: ItemKind): ItemType {
  if (productType === "wip") return itemKind === "body" ? "body" : "rolls";
  return itemKind === "body" ? "pailBody" : "pailRolls";
}

export function IncomingDeliveryFormDialog({
  open,
  onOpenChange,
}: IncomingDeliveryFormDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [productType, setProductType] = useState<ProductType>("wip");
  const [itemKind, setItemKind] = useState<ItemKind>("body");
  const [formData, setFormData] = useState<Omit<IncomingDeliveryFormData, "itemType">>({
    location: "office",
    quantity: 0,
    scheduledDate: formatDateISO(new Date()),
    notes: "",
  });

  const unit = itemKind === "rolls" ? "m" : "枚";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.quantity <= 0) {
      alert("数量は1以上を入力してください");
      return;
    }
    if (!formData.scheduledDate) {
      alert("入荷予定日を入力してください");
      return;
    }

    // ロールはm入力→本数に変換（200m = 1本）
    const quantity =
      itemKind === "rolls"
        ? Math.ceil(formData.quantity / 200)
        : formData.quantity;

    const submitData: IncomingDeliveryFormData = {
      ...formData,
      itemType: toItemType(productType, itemKind),
      quantity,
    };

    startTransition(async () => {
      try {
        await addIncomingDelivery(submitData);
        alert("入荷予定を追加しました");
        onOpenChange(false);
        setProductType("wip");
        setItemKind("body");
        setFormData({
          location: "office",
          quantity: 0,
          scheduledDate: formatDateISO(new Date()),
          notes: "",
        });
        window.location.reload();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "不明なエラー";
        alert(`入荷予定の追加に失敗しました: ${errorMessage}`);
      }
    });
  };

  const handleChange = (
    field: keyof Omit<IncomingDeliveryFormData, "itemType">,
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
                {LOCATIONS.filter((loc) => loc.id !== "manufacturer").map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 製品タイプ */}
            <div>
              <Label htmlFor="productType">製品タイプ</Label>
              <select
                id="productType"
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={productType}
                onChange={(e) => setProductType(e.target.value as ProductType)}
              >
                {PRODUCT_TYPES.map((pt) => (
                  <option key={pt.id} value={pt.id}>
                    {pt.name}
                  </option>
                ))}
              </select>
            </div>

            {/* アイテム */}
            <div>
              <Label htmlFor="itemKind">アイテム</Label>
              <select
                id="itemKind"
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={itemKind}
                onChange={(e) => setItemKind(e.target.value as ItemKind)}
              >
                {ITEM_KINDS.map((ik) => (
                  <option key={ik.id} value={ik.id}>
                    {ik.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 数量 */}
            <div>
              <Label htmlFor="quantity">数量（{unit}）</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) =>
                    handleChange("quantity", parseInt(e.target.value) || 0)
                  }
                  onFocus={(e) => e.target.select()}
                  placeholder={`入荷予定の数量を入力（${unit}）`}
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">{unit}</span>
              </div>
              {itemKind === "rolls" && formData.quantity > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  = {Math.ceil(formData.quantity / 200)}本
                </p>
              )}
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
