"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Inventory, LocationType, ItemType, InventoryTransferFormData } from "@/types";
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
import { createTransfer } from "@/lib/actions/transfers";

interface InventoryTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentInventory: Inventory;
}

const ITEM_TYPES = [
  { id: "body", name: "ボディ", unit: "個" },
  { id: "bottom", name: "底", unit: "枚" },
  { id: "lid", name: "蓋", unit: "枚" },
  { id: "rolls", name: "ロール", unit: "本" },
];

export function InventoryTransferDialog({
  open,
  onOpenChange,
  currentInventory,
}: InventoryTransferDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState<InventoryTransferFormData>({
    fromLocation: "office",
    toLocation: "sugisaki",
    itemType: "body",
    quantity: 0,
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // バリデーション
    if (formData.fromLocation === formData.toLocation) {
      alert("移動元と移動先が同じです");
      return;
    }

    if (formData.quantity <= 0) {
      alert("移動数量は1以上を入力してください");
      return;
    }

    // 移動元の在庫確認
    const fromInventory = currentInventory[formData.fromLocation];
    const currentQuantity = fromInventory[formData.itemType];

    if (currentQuantity < formData.quantity) {
      alert(
        `移動元の在庫が不足しています\n現在: ${currentQuantity}、移動: ${formData.quantity}`
      );
      return;
    }

    startTransition(async () => {
      try {
        console.log("在庫移動開始:", formData);
        await createTransfer(formData);
        console.log("在庫移動成功");

        // 成功メッセージを表示
        alert("在庫移動が完了しました");

        // フォームをリセット
        setFormData({
          fromLocation: "office",
          toLocation: "sugisaki",
          itemType: "body",
          quantity: 0,
          notes: "",
        });

        // ダイアログを閉じる
        onOpenChange(false);

        // Next.jsのルーターを使ってページをリフレッシュ
        // これによりサーバーコンポーネントが再レンダリングされ、最新データが取得される
        router.refresh();

        // フォールバック: router.refresh()が効かない場合は強制リロード
        setTimeout(() => {
          // 念のため、500ms後に手動リロードを実行
          // （通常はrouter.refresh()で十分なはず）
          window.location.reload();
        }, 500);
      } catch (error) {
        console.error("在庫移動エラー:", error);
        const errorMessage = error instanceof Error ? error.message : "不明なエラー";
        alert(`在庫移動に失敗しました: ${errorMessage}`);
      }
    });
  };

  // 現在の移動元在庫を取得
  const fromInventory = currentInventory[formData.fromLocation];
  const availableQuantity = fromInventory[formData.itemType];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>在庫移動</DialogTitle>
            <DialogDescription>
              拠点間で在庫を移動します
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* 移動元 */}
            <div>
              <Label htmlFor="fromLocation">移動元</Label>
              <select
                id="fromLocation"
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={formData.fromLocation}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    fromLocation: e.target.value as LocationType,
                  }))
                }
              >
                {LOCATIONS.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 移動先 */}
            <div>
              <Label htmlFor="toLocation">移動先</Label>
              <select
                id="toLocation"
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={formData.toLocation}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    toLocation: e.target.value as LocationType,
                  }))
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
                  setFormData((prev) => ({
                    ...prev,
                    itemType: e.target.value as ItemType,
                  }))
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
              <Label htmlFor="quantity">
                移動数量（現在: {availableQuantity.toLocaleString()}）
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={availableQuantity}
                value={formData.quantity}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    quantity: parseInt(e.target.value) || 0,
                  }))
                }
                placeholder="移動する数量を入力"
              />
            </div>

            {/* 備考 */}
            <div>
              <Label htmlFor="notes">備考（任意）</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                placeholder="移動理由などを記入"
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
              {isPending ? "移動中..." : "移動"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
