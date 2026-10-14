import { TimeEntry } from '../types';
import { APP_CONFIG } from '../config';

/**
 * 日本標準時（JST）で現在の日時文字列を取得
 */
export function getNowJST(): Date {
  return new Date();
}

/**
 * 秒数を HH:MM:SS または MM:SS にフォーマット
 */
export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * 日本標準時（JST）でフォーマットした日付（例: 2026年9月11日 (金)）
 */
export function formatJSTDate(isoOrTimestamp: string | number | Date): string {
  const date = new Date(isoOrTimestamp);
  return new Intl.DateTimeFormat('ja-JP-u-ca-japanese', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  }).format(date);
}

/**
 * 日本標準時（JST）でフォーマットした時刻（例: 14:05）
 */
export function formatJSTTime(isoOrTimestamp: string | number | Date): string {
  const date = new Date(isoOrTimestamp);
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

/**
 * 簡易版時刻（時:分）
 */
export function formatJSTShortTime(isoOrTimestamp: string | number | Date): string {
  const date = new Date(isoOrTimestamp);
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

/**
 * 所要時間を人間が読みやすい日本語表現に変換（例: 1時間25分10秒）
 */
export function formatDurationJapanese(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}時間${minutes}分${seconds > 0 ? `${seconds}秒` : ''}`;
  }
  if (minutes > 0) {
    return `${minutes}分${seconds}秒`;
  }
  return `${seconds}秒`;
}

/**
 * スプレッドシートやGAS連携に便利なCSV文字列を生成
 */
export function exportToCSV(entries: TimeEntry[]): string {
  const header = ['タスク名', '日付', '開始時刻', '終了時刻', '作業時間(秒)', '作業時間(表示)'];
  const rows = entries.map(e => [
    `"${(e.taskName || '名称未設定').replace(/"/g, '""')}"`,
    `"${formatJSTDate(e.startTime)}"`,
    `"${formatJSTTime(e.startTime)}"`,
    `"${formatJSTTime(e.endTime)}"`,
    e.durationSeconds,
    `"${formatDurationJapanese(e.durationSeconds)}"`,
  ]);

  const csvContent = [header.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  return '\uFEFF' + csvContent; // BOM付きUTF-8
}

const STORAGE_KEY = 'daily_schedule_stopwatch_entries_v1';

export function loadSavedEntries(): TimeEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as TimeEntry[];
  } catch (err) {
    console.error('Failed to load entries from localStorage', err);
    return [];
  }
}

export function saveEntriesToStorage(entries: TimeEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (err) {
    console.error('Failed to save entries to localStorage', err);
  }
}

// GASのウェブアプリURL
export const GAS_WEB_APP_URL = APP_CONFIG.gasWebAppUrl;

/**
 * GAS（スプレッドシート）へライフログを送信する関数
 */
export async function sendEntryToGAS(entry: {
  id: string;
  taskName: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  createdAt: number;
}): Promise<boolean> {
  try {
    // GASへのPOSTリクエストはCORSの仕様上 'no-cors' にするか、
    // テキスト形式で送るなどの工夫が必要になる場合があります。
    // まずは一番確実な 'text/plain' 経由での送信を行います。
    const response = await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      mode: 'no-cors', // GAS特有のCORS制限を回避するため
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(entry),
    });

    console.log('GASへの送信リクエスト完了', response);
    return true;
  } catch (error) {
    console.error('GAS送信エラー:', error);
    return false;
  }
}