"use client";

import { useState, useEffect } from "react";
import { Order, OrderFormData, ProductType } from "@/types";
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
import { Textarea } from '@/components/ui/textarea';
import { formatDateISO } from '@/utils/dateUtils';
import { PRODUCTS } from '@/utils/constants';

interface OrderFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: OrderFormData) => void;
  order?: Order; // 編集モードの場合は既存データを渡す
}

export function OrderFormDialog({
  open,
  onOpenChange,
  onSubmit,
  order,
}: OrderFormDialogProps) {
  const [formData, setFormData] = useState<OrderFormData>({
    productType: 'standard',
    orderNumber: '',
    customerName: '',
    deliveryDate: formatDateISO(new Date()),
    setQuantity: 0,
    additionalLids: 0,
    notes: '',
  });

  // 編集モードの場合、既存データをセット
  useEffect(() => {
    if (order) {
      setFormData({
        productType: order.productType,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        deliveryDate: order.deliveryDate,
        setQuantity: order.setQuantity,
        additionalLids: order.additionalLids,
        notes: order.notes || '',
      });
    } else {
      // 新規作成の場合はリセット
      setFormData({
        productType: 'standard',
        orderNumber: '',
        customerName: '',
        deliveryDate: formatDateISO(new Date()),
        setQuantity: 0,
        additionalLids: 0,
        notes: '',
      });
    }
  }, [order, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // バリデーション
    if (!formData.orderNumber.trim()) {
      alert('受注番号を入力してください');
      return;
    }
    if (!formData.customerName.trim()) {
      alert('顧客名を入力してください');
      return;
    }
    if (!formData.deliveryDate) {
      alert('納期を入力してください');
      return;
    }
    if (formData.setQuantity < 0) {
      alert('セット数は0以上を入力してください');
      return;
    }
    if (formData.additionalLids < 0) {
      alert('追加蓋数は0以上を入力してください');
      return;
    }

    onSubmit(formData);
  };

  const handleChange = (
    field: keyof OrderFormData,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {order ? '受注を編集' : '新規受注を追加'}
            </DialogTitle>
            <DialogDescription>
              受注情報を入力してください
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* 製品タイプ選択 */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="productType" className="text-right">
                製品タイプ <span className="text-destructive">*</span>
              </Label>
              <select
                id="productType"
                value={formData.productType}
                onChange={(e) => handleChange('productType', e.target.value as ProductType)}
                className="col-span-3 flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              >
                {PRODUCTS.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} - {product.description}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="orderNumber" className="text-right">
                受注番号 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="orderNumber"
                value={formData.orderNumber}
                onChange={(e) => handleChange('orderNumber', e.target.value)}
                className="col-span-3"
                placeholder="例: 2024-001"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="customerName" className="text-right">
                顧客名 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => handleChange('customerName', e.target.value)}
                className="col-span-3"
                placeholder="例: 株式会社サンプル"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="deliveryDate" className="text-right">
                納期 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="deliveryDate"
                type="date"
                value={formData.deliveryDate}
                onChange={(e) => handleChange('deliveryDate', e.target.value)}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="setQuantity" className="text-right">
                セット数 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="setQuantity"
                type="number"
                min="0"
                value={formData.setQuantity}
                onChange={(e) =>
                  handleChange('setQuantity', parseInt(e.target.value) || 0)
                }
                onFocus={(e) => e.target.select()}
                className="col-span-3"
                placeholder="ボディ・底・蓋各1のセット数"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="additionalLids" className="text-right">
                追加蓋数
              </Label>
              <Input
                id="additionalLids"
                type="number"
                min="0"
                value={formData.additionalLids}
                onChange={(e) =>
                  handleChange('additionalLids', parseInt(e.target.value) || 0)
                }
                onFocus={(e) => e.target.select()}
                className="col-span-3"
                placeholder="蓋のみ追加する場合"
              />
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="notes" className="text-right pt-2">
                備考
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                className="col-span-3"
                placeholder="その他メモなど"
                rows={3}
              />
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
            <Button type="submit">{order ? '更新' : '追加'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
