"use client";

import { InventorySnapshot } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, Factory } from "lucide-react";
import { formatDate } from "@/utils/dateUtils";

interface ManufacturerStockAlertProps {
  snapshots: InventorySnapshot[];
}

export function ManufacturerStockAlert({ snapshots }: ManufacturerStockAlertProps) {
  // production_needed のステータスを持つ受注を抽出
  const productionNeededOrders = snapshots.filter(
    (snapshot) => snapshot.allocationStatus === "production_needed"
  );

  if (productionNeededOrders.length === 0) {
    return null;
  }

  // 生産が必要な合計量を計算
  const totalBodyProductionNeeded = productionNeededOrders.reduce(
    (sum, snapshot) => sum + snapshot.productionNeeded.body,
    0
  );
  const totalBottomLidProductionNeeded = productionNeededOrders.reduce(
    (sum, snapshot) => sum + snapshot.productionNeeded.bottomLid,
    0
  );

  // 最も早い納期を取得
  const earliestDeliveryDate = productionNeededOrders.reduce((earliest, snapshot) => {
    if (!earliest) return snapshot.deliveryDate;
    return snapshot.deliveryDate < earliest ? snapshot.deliveryDate : earliest;
  }, "");

  // リードタイム警告（納期まで3ヶ月未満の場合）
  const deliveryDate = new Date(earliestDeliveryDate);
  const today = new Date();
  const monthsUntilDelivery =
    (deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30);
  const isUrgent = monthsUntilDelivery < 3;

  return (
    <Alert
      className={`border-2 ${
        isUrgent
          ? "border-red-600 bg-red-50/50"
          : "border-yellow-600 bg-yellow-50/50"
      }`}
    >
      <AlertTriangle
        className={`h-5 w-5 ${isUrgent ? "text-red-600" : "text-yellow-600"}`}
      />
      <AlertTitle
        className={`${
          isUrgent ? "text-red-900" : "text-yellow-900"
        } text-lg font-bold`}
      >
        <Factory className="h-5 w-5 inline mr-2" />
        メーカー生産が必要です
        {isUrgent && (
          <Badge variant="destructive" className="ml-2">
            緊急
          </Badge>
        )}
      </AlertTitle>
      <AlertDescription>
        <div className="space-y-4 mt-3">
          {/* 警告メッセージ */}
          <div
            className={`p-3 rounded-md ${
              isUrgent ? "bg-red-100" : "bg-yellow-100"
            }`}
          >
            <p
              className={`font-bold ${
                isUrgent ? "text-red-900" : "text-yellow-900"
              }`}
            >
              全在庫（拠点+メーカー）でも不足します
            </p>
            <p
              className={`text-sm mt-1 ${
                isUrgent ? "text-red-800" : "text-yellow-800"
              }`}
            >
              <Clock className="h-4 w-4 inline mr-1" />
              メーカーの生産リードタイム: <strong>2〜3ヶ月</strong>
            </p>
            {isUrgent && (
              <p className="text-sm mt-2 text-red-800 font-bold">
                ⚠️ 最も早い納期（{formatDate(earliestDeliveryDate)}
                ）まで3ヶ月未満です。至急メーカーに連絡してください。
              </p>
            )}
          </div>

          {/* 生産必要量 */}
          <Card className="border-orange-300 bg-white">
            <CardContent className="pt-4">
              <p className="text-sm text-orange-800 mb-3 font-semibold">
                生産必要量（メーカー発注量）
              </p>
              <div className="grid grid-cols-2 gap-3">
                {totalBodyProductionNeeded > 0 && (
                  <div className="bg-orange-100 p-3 rounded-md">
                    <p className="text-xs text-orange-700">ボディ</p>
                    <p className="text-xl font-bold text-orange-900">
                      {totalBodyProductionNeeded.toLocaleString()}
                      <span className="text-sm font-normal ml-1">個</span>
                    </p>
                  </div>
                )}

                {totalBottomLidProductionNeeded > 0 && (
                  <div className="bg-orange-100 p-3 rounded-md">
                    <p className="text-xs text-orange-700">底・蓋</p>
                    <p className="text-xl font-bold text-orange-900">
                      {totalBottomLidProductionNeeded.toLocaleString()}
                      <span className="text-sm font-normal ml-1">枚</span>
                    </p>
                    <p className="text-xs text-orange-600 mt-1">
                      ≈ {Math.ceil(totalBottomLidProductionNeeded / 300)}本
                      （ロール）
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 影響を受ける受注一覧 */}
          <Card className="border-orange-300 bg-white">
            <CardContent className="pt-4">
              <p className="text-sm text-orange-800 mb-2 font-semibold">
                生産が必要な受注（{productionNeededOrders.length}件）
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {productionNeededOrders.map((snapshot) => (
                  <div
                    key={snapshot.orderId}
                    className="flex items-center justify-between text-sm bg-orange-50 p-2 rounded"
                  >
                    <div>
                      <span className="font-medium">{snapshot.customerName}</span>
                      <span className="text-orange-700 ml-2">
                        {snapshot.orderNumber}
                      </span>
                    </div>
                    <div className="text-orange-800 font-medium">
                      {formatDate(snapshot.deliveryDate)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* アクションアドバイス */}
          <div
            className={`text-xs p-2 rounded ${
              isUrgent
                ? "bg-red-100 text-red-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            <strong>推奨アクション:</strong>{" "}
            {isUrgent
              ? "至急メーカーに連絡し、生産可能か確認してください。間に合わない場合は顧客と納期調整が必要です。"
              : "早めにメーカーに連絡し、生産スケジュールを確認してください。"}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
