import { format, parseISO } from 'date-fns';

/**
 * 日付を「YYYY年MM月DD日」形式でフォーマット
 */
export function formatDate(dateString: string): string {
  try {
    return format(parseISO(dateString), 'yyyy年MM月dd日');
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
}

/**
 * 日付を「YYYY-MM-DD」形式でフォーマット
 */
export function formatDateISO(date: Date): string {
  try {
    return format(date, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

/**
 * 日付文字列をDateオブジェクトに変換
 */
export function parseDate(dateString: string): Date {
  try {
    return parseISO(dateString);
  } catch (error) {
    console.error('Error parsing date:', error);
    return new Date();
  }
}

/**
 * 2つの日付を比較（納期順ソート用）
 * @returns 負の数: date1が先、0: 同じ、正の数: date2が先
 */
export function compareDates(date1: string, date2: string): number {
  const d1 = parseISO(date1);
  const d2 = parseISO(date2);
  return d1.getTime() - d2.getTime();
}
