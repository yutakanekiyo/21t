"use client";

import { InventorySnapshot } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, Factory, Package, TrendingUp } from "lucide-react";
import { formatDate } from "@/utils/dateUtils";
import { DEFAULT_ROLL_CONFIG, PAIL_BOTTOM_PIECES_PER_ROLL, PAIL_LID_PIECES_PER_ROLL } from "@/utils/constants";

interface ManufacturerStockAlertProps {
  snapshots: InventorySnapshot[];
}

export function ManufacturerStockAlert({ snapshots }: ManufacturerStockAlertProps) {
  const productionNeededOrders = snapshots.filter(
    (snapshot) => snapshot.allocationStatus === "production_needed"
  );

  if (productionNeededOrders.length === 0) {
    return null;
  }

  // 製品タイプ別に分離
  const wipOrders = productionNeededOrders.filter((s) => s.productType === 'standard');
  const pailOrders = productionNeededOrders.filter((s) => s.productType === 'pail');

  // WIP 集計
  const wipBodyNeeded = wipOrders.reduce((sum, s) => sum + s.productionNeeded.body, 0);
  const wipBottomNeeded = wipOrders.reduce((sum, s) => sum + s.bottomShortage, 0);
  const wipLidNeeded = wipOrders.reduce((sum, s) => sum + s.lidShortage, 0);
  const wipTotalRolls = Math.ceil((wipBottomNeeded + wipLidNeeded) / DEFAULT_ROLL_CONFIG.piecesPerRoll);
  const wipTotalMeters = wipTotalRolls * 200;

  // ペール 集計
  const pailBodyNeeded = pailOrders.reduce((sum, s) => sum + s.productionNeeded.body, 0);
  const pailBottomNeeded = pailOrders.reduce((sum, s) => sum + s.bottomShortage, 0);
  const pailLidNeeded = pailOrders.reduce((sum, s) => sum + s.lidShortage, 0);
  const pailBottomRolls = Math.ceil(pailBottomNeeded / PAIL_BOTTOM_PIECES_PER_ROLL);
  const pailLidRolls = Math.ceil(pailLidNeeded / PAIL_LID_PIECES_PER_ROLL);
  const pailTotalRolls = pailBottomRolls + pailLidRolls;
  const pailTotalMeters = pailTotalRolls * 200;

  // 最も早い納期
  const earliestDeliveryDate = productionNeededOrders.reduce((earliest, snapshot) => {
    if (!earliest) return snapshot.deliveryDate;
    return snapshot.deliveryDate < earliest ? snapshot.deliveryDate : earliest;
  }, "");

  const deliveryDate = new Date(earliestDeliveryDate);
  const today = new Date();
  const monthsUntilDelivery =
    (deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30);
  const isUrgent = monthsUntilDelivery < 3;

  return (
    <Alert
      className={`border-2 ${
        isUrgent ? "border-red-600 bg-red-50/50" : "border-yellow-600 bg-yellow-50/50"
      }`}
    >
      <AlertTriangle className={`h-5 w-5 ${isUrgent ? "text-red-600" : "text-yellow-600"}`} />
      <AlertTitle className={`${isUrgent ? "text-red-900" : "text-yellow-900"} text-lg font-bold`}>
        <Factory className="h-5 w-5 inline mr-2" />
        メーカー生産が必要です
        {isUrgent && (
          <Badge variant="destructive" className="ml-2">緊急</Badge>
        )}
      </AlertTitle>
      <AlertDescription>
        <div className="space-y-4 mt-3">
          {/* 警告メッセージ */}
          <div className={`p-3 rounded-md ${isUrgent ? "bg-red-100" : "bg-yellow-100"}`}>
            <p className={`font-bold ${isUrgent ? "text-red-900" : "text-yellow-900"}`}>
              全在庫（拠点+メーカー）でも不足します
            </p>
            <p className={`text-sm mt-1 ${isUrgent ? "text-red-800" : "text-yellow-800"}`}>
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

          {/* WIP 生産必要量 */}
          {wipOrders.length > 0 && (
            <Card className="border-red-300 bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  WIP 生産必要量
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <div className="grid grid-cols-2 gap-3">
                  {wipBodyNeeded > 0 && (
                    <div className="bg-red-100 p-3 rounded-md col-span-2">
                      <p className="text-xs text-red-700 mb-1">ボディ</p>
                      <p className="text-2xl font-bold text-red-900">
                        {wipBodyNeeded.toLocaleString()}
                        <span className="text-base font-normal ml-1">枚</span>
                      </p>
                    </div>
                  )}
                  {(wipBottomNeeded > 0 || wipLidNeeded > 0) && (
                    <div className="bg-red-100 p-3 rounded-md col-span-2">
                      <p className="text-xs text-red-700 mb-1">ロール（底・蓋）</p>
                      <div className="space-y-1">
                        <p className="text-2xl font-bold text-red-900">
                          {wipTotalMeters.toLocaleString()}
                          <span className="text-base font-normal ml-1">m</span>
                          <span className="text-sm font-normal text-red-700 ml-2">
                            （{wipTotalRolls}本）
                          </span>
                        </p>
                        <p className="text-sm text-red-700">
                          底 {wipBottomNeeded.toLocaleString()}枚 / 蓋 {wipLidNeeded.toLocaleString()}枚
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ペール 生産必要量 */}
          {pailOrders.length > 0 && (
            <Card className="border-pink-300 bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  ペール 生産必要量
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <div className="grid grid-cols-2 gap-3">
                  {pailBodyNeeded > 0 && (
                    <div className="bg-pink-100 p-3 rounded-md col-span-2">
                      <p className="text-xs text-pink-700 mb-1">ボディ</p>
                      <p className="text-2xl font-bold text-pink-900">
                        {pailBodyNeeded.toLocaleString()}
                        <span className="text-base font-normal ml-1">枚</span>
                      </p>
                    </div>
                  )}
                  {(pailBottomNeeded > 0 || pailLidNeeded > 0) && (
                    <div className="bg-pink-100 p-3 rounded-md col-span-2">
                      <p className="text-xs text-pink-700 mb-1">ロール（底・蓋）</p>
                      <div className="space-y-1">
                        <p className="text-2xl font-bold text-pink-900">
                          {pailTotalMeters.toLocaleString()}
                          <span className="text-base font-normal ml-1">m</span>
                          <span className="text-sm font-normal text-pink-700 ml-2">
                            （{pailTotalRolls}本）
                          </span>
                        </p>
                        <p className="text-sm text-pink-700">
                          底 {pailBottomNeeded.toLocaleString()}枚 / 蓋 {pailLidNeeded.toLocaleString()}枚
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 影響を受ける受注一覧 */}
          <Card className="border-red-300 bg-white">
            <CardContent className="pt-4">
              <p className="text-sm text-red-800 mb-2 font-semibold">
                生産が必要な受注（{productionNeededOrders.length}件）
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {productionNeededOrders.map((snapshot) => (
                  <div
                    key={snapshot.orderId}
                    className="flex items-center justify-between text-sm bg-red-50 p-2 rounded"
                  >
                    <div>
                      <span className="font-medium">{snapshot.customerName}</span>
                      <span className="text-red-700 ml-2">{snapshot.orderNumber}</span>
                      <Badge
                        variant={snapshot.productType === 'pail' ? 'secondary' : 'default'}
                        className="ml-2 text-xs"
                      >
                        {snapshot.productType === 'pail' ? 'ペール' : 'WIP'}
                      </Badge>
                    </div>
                    <div className="text-red-800 font-medium">
                      {formatDate(snapshot.deliveryDate)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* アクションアドバイス */}
          <div className={`text-xs p-2 rounded ${isUrgent ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>
            <TrendingUp className="h-3 w-3 inline mr-1" />
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
