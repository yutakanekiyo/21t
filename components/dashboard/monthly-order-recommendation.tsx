"use client";

import { MonthlyOrderRecommendation } from "@/utils/calculations-v2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, TrendingUp, Calendar, Package } from "lucide-react";
import { formatDate } from "@/utils/dateUtils";

interface MonthlyOrderRecommendationProps {
  recommendation: MonthlyOrderRecommendation;
}

export function MonthlyOrderRecommendationPanel({
  recommendation,
}: MonthlyOrderRecommendationProps) {
  const { targetPeriod, shortage, recommendedOrder, affectedOrders } = recommendation;

  // 発注が必要かどうか
  const needsOrder =
    shortage.body > 0 ||
    shortage.pailBody > 0 ||
    shortage.bottomLid > 0 ||
    shortage.pailBottomLid > 0;

  if (!needsOrder) {
    return (
      <Card className="border-green-500 bg-green-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900">
            <ShoppingCart className="h-5 w-5" />
            月次発注レコメンド
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-green-700">
            <p className="font-medium">
              翌月末（{formatDate(targetPeriod.end)}）まで拠点在庫で対応可能です
            </p>
            <p className="text-xs mt-1">対象受注: {affectedOrders.length}件</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Alert className="border-2 border-orange-500 bg-orange-50/50">
      <ShoppingCart className="h-5 w-5 text-orange-600" />
      <AlertTitle className="text-orange-900 text-lg font-bold">
        月次発注レコメンド（今月の推奨発注量）
      </AlertTitle>
      <AlertDescription>
        <div className="space-y-4 mt-3">
          {/* 対象期間 */}
          <div className="flex items-center gap-2 text-sm text-orange-800">
            <Calendar className="h-4 w-4" />
            <span>
              対象期間: {formatDate(targetPeriod.start)} 〜{" "}
              <strong>{formatDate(targetPeriod.end)}</strong>（翌月末）
            </span>
            <Badge variant="secondary">{affectedOrders.length}件の受注</Badge>
          </div>

          {/* WIP製品の発注推奨 */}
          {(shortage.body > 0 || shortage.bottomLid > 0) && (
            <Card className="border-orange-300 bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  WIP製品の発注推奨量
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {shortage.body > 0 && (
                  <div className="bg-orange-100 p-3 rounded-md">
                    <p className="text-xs text-orange-700 mb-1">ボディ</p>
                    <p className="text-2xl font-bold text-orange-900">
                      {recommendedOrder.bodySets.toLocaleString()}
                      <span className="text-base font-normal ml-1">枚</span>
                    </p>
                  </div>
                )}

                {shortage.bottomLid > 0 && (
                  <div className="bg-orange-100 p-3 rounded-md">
                    <p className="text-xs text-orange-700 mb-1">ロール</p>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold text-orange-900">
                        {recommendedOrder.bottomLidMeters.toLocaleString()}
                        <span className="text-base font-normal ml-1">m</span>
                        <span className="text-sm font-normal text-orange-700 ml-2">
                          （{recommendedOrder.bottomLidRolls.toLocaleString()}本）
                        </span>
                      </p>
                      <p className="text-sm text-orange-700">
                        = {recommendedOrder.bottomLidPieces.toLocaleString()}枚
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ペール製品の発注推奨 */}
          {(shortage.pailBody > 0 || shortage.pailBottomLid > 0) && (
            <Card className="border-amber-300 bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  ペール製品の発注推奨量
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {shortage.pailBody > 0 && (
                  <div className="bg-amber-100 p-3 rounded-md">
                    <p className="text-xs text-amber-700 mb-1">ボディ</p>
                    <p className="text-2xl font-bold text-amber-900">
                      {recommendedOrder.pailBodySets.toLocaleString()}
                      <span className="text-base font-normal ml-1">枚</span>
                    </p>
                  </div>
                )}

                {shortage.pailBottomLid > 0 && (
                  <div className="bg-amber-100 p-3 rounded-md">
                    <p className="text-xs text-amber-700 mb-1">ロール</p>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold text-amber-900">
                        {recommendedOrder.pailBottomLidMeters.toLocaleString()}
                        <span className="text-base font-normal ml-1">m</span>
                        <span className="text-sm font-normal text-amber-700 ml-2">
                          （{recommendedOrder.pailBottomLidRolls.toLocaleString()}本）
                        </span>
                      </p>
                      <p className="text-sm text-amber-700">
                        = {recommendedOrder.pailBottomLidPieces.toLocaleString()}枚
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 補足情報 */}
          <div className="text-xs text-orange-700 bg-orange-100 p-2 rounded">
            <TrendingUp className="h-3 w-3 inline mr-1" />
            <strong>発注のタイミング:</strong>{" "}
            拠点在庫（事務所+杉崎）の不足分を今月中にメーカーへ発注してください。
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
