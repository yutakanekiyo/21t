"use client";

import { useState } from "react";
import { IncomingDelivery } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { generateCalendarDays, getMonthName, WEEKDAY_NAMES, formatDateToYYYYMMDD } from "@/utils/calendarUtils";
import { IncomingDeliveryItem } from "./incoming-delivery-item";
import { LOCATIONS } from "@/utils/constants";

interface IncomingDeliveryCalendarProps {
  deliveries: IncomingDelivery[];
}

// 拠点ごとの色設定
const LOCATION_COLORS = {
  office: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    border: "border-blue-200",
  },
  sugisaki: {
    bg: "bg-purple-100",
    text: "text-purple-800",
    border: "border-purple-200",
  },
  manufacturer: {
    bg: "bg-orange-100",
    text: "text-orange-800",
    border: "border-orange-200",
  },
};

export function IncomingDeliveryCalendar({
  deliveries,
}: IncomingDeliveryCalendarProps) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // カレンダーの日付データを生成
  const calendarDays = generateCalendarDays(currentYear, currentMonth);

  // 日付ごとの入荷予定をマップ化
  const deliveriesByDate = new Map<string, IncomingDelivery[]>();
  deliveries.forEach((delivery) => {
    const dateKey = delivery.scheduledDate; // YYYY-MM-DD形式
    if (!deliveriesByDate.has(dateKey)) {
      deliveriesByDate.set(dateKey, []);
    }
    deliveriesByDate.get(dateKey)!.push(delivery);
  });

  // 前月へ
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  // 次月へ
  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // 今月に戻る
  const handleToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  // 日付をクリック
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  // 選択された日付の入荷予定
  const selectedDateKey = selectedDate
    ? formatDateToYYYYMMDD(selectedDate)
    : null;
  const selectedDeliveries = selectedDateKey
    ? deliveriesByDate.get(selectedDateKey) || []
    : [];

  return (
    <div className="space-y-4">
      {/* カレンダーヘッダー */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xl font-bold">
          {currentYear}年 {getMonthName(currentMonth)}
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleToday}>
            今月
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 色の凡例 */}
      <div className="flex gap-4 text-sm mb-4 p-2 bg-muted/30 rounded-md">
        <span className="font-medium">入荷先:</span>
        {LOCATIONS.map((location) => {
          const colors = LOCATION_COLORS[location.id];
          return (
            <div key={location.id} className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded ${colors.bg} border ${colors.border}`} />
              <span>{location.name}</span>
            </div>
          );
        })}
      </div>

      {/* カレンダーグリッド */}
      <div className="border rounded-lg overflow-hidden">
        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 bg-muted">
          {WEEKDAY_NAMES.map((day, index) => (
            <div
              key={day}
              className={`p-2 text-center text-sm font-semibold ${
                index === 0 ? "text-red-600" : index === 6 ? "text-blue-600" : ""
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 日付セル */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const dateKey = formatDateToYYYYMMDD(day.date);
            const dayDeliveries = deliveriesByDate.get(dateKey) || [];
            const hasDeliveries = dayDeliveries.length > 0;
            const hasOverdue = dayDeliveries.some(
              (d) => d.status === "pending" && day.isPast
            );

            return (
              <button
                key={index}
                onClick={() => day.isCurrentMonth && handleDateClick(day.date)}
                className={`
                  min-h-[80px] p-2 border-r border-b text-left
                  hover:bg-muted/50 transition-colors
                  ${!day.isCurrentMonth ? "bg-muted/30 text-muted-foreground" : ""}
                  ${day.isToday ? "bg-blue-50 border-2 border-blue-500" : ""}
                  ${selectedDate?.getTime() === day.date.getTime() ? "ring-2 ring-primary" : ""}
                `}
              >
                <div
                  className={`text-sm font-semibold mb-1 ${
                    day.isToday ? "text-blue-600" : ""
                  }`}
                >
                  {day.dayOfMonth}
                </div>
                {hasDeliveries && day.isCurrentMonth && (
                  <div className="space-y-1">
                    {dayDeliveries.slice(0, 2).map((delivery) => {
                      const isOverdue =
                        delivery.status === "pending" && day.isPast;
                      const locationColors = LOCATION_COLORS[delivery.location];
                      return (
                        <div
                          key={delivery.id}
                          className={`text-xs px-1 py-0.5 rounded truncate border ${
                            isOverdue
                              ? "bg-red-100 text-red-800 border-red-300"
                              : `${locationColors.bg} ${locationColors.text} ${locationColors.border}`
                          }`}
                        >
                          {delivery.quantity}
                        </div>
                      );
                    })}
                    {dayDeliveries.length > 2 && (
                      <div className="text-xs text-muted-foreground">
                        +{dayDeliveries.length - 2}件
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 選択された日付の詳細 */}
      {selectedDate && selectedDeliveries.length > 0 && (
        <Card className="border-2 border-primary">
          <CardContent className="pt-6">
            <h4 className="font-semibold mb-4">
              {selectedDate.getMonth() + 1}月{selectedDate.getDate()}日の入荷予定（
              {selectedDeliveries.length}件）
            </h4>
            <div className="space-y-3">
              {selectedDeliveries.map((delivery) => (
                <IncomingDeliveryItem key={delivery.id} delivery={delivery} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedDate && selectedDeliveries.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            {selectedDate.getMonth() + 1}月{selectedDate.getDate()}
            日に予定されている入荷はありません
          </CardContent>
        </Card>
      )}
    </div>
  );
}
