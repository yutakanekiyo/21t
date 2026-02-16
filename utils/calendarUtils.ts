/**
 * カレンダー表示用のユーティリティ関数
 */

export interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
}

/**
 * 指定された年月のカレンダーデータを生成
 */
export function generateCalendarDays(year: number, month: number): CalendarDay[] {
  const days: CalendarDay[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 月の最初の日
  const firstDay = new Date(year, month, 1);
  const firstDayOfWeek = firstDay.getDay(); // 0 = 日曜日

  // 月の最後の日
  const lastDay = new Date(year, month + 1, 0);
  const lastDayOfMonth = lastDay.getDate();

  // 前月の日付を追加（カレンダーの最初の週を埋める）
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonthLastDay - i);
    days.push({
      date,
      dayOfMonth: prevMonthLastDay - i,
      isCurrentMonth: false,
      isToday: false,
      isPast: date < today,
    });
  }

  // 当月の日付を追加
  for (let day = 1; day <= lastDayOfMonth; day++) {
    const date = new Date(year, month, day);
    const isToday = date.getTime() === today.getTime();
    days.push({
      date,
      dayOfMonth: day,
      isCurrentMonth: true,
      isToday,
      isPast: date < today,
    });
  }

  // 次月の日付を追加（カレンダーの最後の週を埋める）
  const remainingDays = 42 - days.length; // 6週間 × 7日 = 42日
  for (let day = 1; day <= remainingDays; day++) {
    const date = new Date(year, month + 1, day);
    days.push({
      date,
      dayOfMonth: day,
      isCurrentMonth: false,
      isToday: false,
      isPast: false,
    });
  }

  return days;
}

/**
 * 月の名前を取得（日本語）
 */
export function getMonthName(month: number): string {
  return `${month + 1}月`;
}

/**
 * 曜日名を取得（日本語）
 */
export const WEEKDAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];

/**
 * DateオブジェクトをYYYY-MM-DD形式の文字列に変換（タイムゾーン考慮）
 */
export function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
