"use client";

import { InventorySummary } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface InventoryAlertProps {
  summary: InventorySummary;
}

export function InventoryAlert({ summary }: InventoryAlertProps) {
  if (!summary.hasShortage) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-5 w-5" />
      <AlertTitle className="text-lg font-bold">在庫不足があります</AlertTitle>
      <AlertDescription>
        <div className="mt-2 space-y-2">
          {summary.totalBodyShortage > 0 && (
            <p>
              <span className="font-semibold">ボディ:</span>{' '}
              {summary.totalBodyShortage.toLocaleString()}個 不足
            </p>
          )}
          {summary.totalBottomLidShortage > 0 && (
            <p>
              <span className="font-semibold">底・蓋:</span>{' '}
              {summary.totalBottomLidShortage.toLocaleString()}枚 不足
            </p>
          )}
          <p className="text-sm mt-3">
            影響を受ける受注: {summary.affectedOrders.length}件
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
}
