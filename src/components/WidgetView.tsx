import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, ArrowRight, Maximize2, ShieldCheck } from 'lucide-react';
import { formatDuration, formatJSTTime, formatDurationJapanese } from '../utils/time';
import { TimeEntry } from '../types';
import { APP_CONFIG } from '../config';

interface WidgetViewProps {
  onSaveEntry: (entry: Omit<TimeEntry, 'id' | 'createdAt'>) => void;
  latestEntry?: TimeEntry;
  onExpandView: () => void;
}

export default function WidgetView({ onSaveEntry, latestEntry, onExpandView }: WidgetViewProps) {
  const [taskName, setTaskName] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);

  const timerRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(Date.now());

  useEffect(() => {
    if (isRunning) {
      lastTickRef.current = Date.now();
      timerRef.current = window.setInterval(() => {
        const now = Date.now();
        const delta = Math.floor((now - lastTickRef.current) / 1000);
        if (delta >= 1) {
          setElapsedSeconds((prev) => prev + delta);
          lastTickRef.current = now;
        }
      }, 200);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const handleStart = () => {
    if (!startTime) setStartTime(new Date());
    lastTickRef.current = Date.now();
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleSaveAndStop = () => {
    if (elapsedSeconds === 0 && !startTime) return;
    const start = startTime || new Date(Date.now() - elapsedSeconds * 1000);
    const end = new Date();

    onSaveEntry({
      taskName: taskName.trim() || '未分類タスク',
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      durationSeconds: Math.max(elapsedSeconds, 1),
    });

    setIsRunning(false);
    setElapsedSeconds(0);
    setStartTime(null);
    setTaskName('');
  };

  const handleNextTask = () => {
    if (elapsedSeconds > 0 || startTime) {
      const start = startTime || new Date(Date.now() - elapsedSeconds * 1000);
      const end = new Date();

      onSaveEntry({
        taskName: taskName.trim() || '未分類タスク',
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        durationSeconds: Math.max(elapsedSeconds, 1),
      });
    }

    setElapsedSeconds(0);
    setStartTime(new Date());
    lastTickRef.current = Date.now();
    setIsRunning(true);
    setTaskName('');
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh] p-4">
      <div
        id="widget-container"
        className="w-full max-w-sm bg-white border-2 border-stone-800 rounded-2xl shadow-xl p-4 sm:p-5 relative"
      >
        {/* ウィジェットヘッダー */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold tracking-wider text-stone-800">
              ミニウィジェット
            </span>
          </div>
          <button
            type="button"
            onClick={onExpandView}
            className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-2 py-1 rounded-md transition-colors cursor-pointer"
            title="標準画面に拡大"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            標準表示に戻す
          </button>
        </div>

        {/* タスク名入力 */}
        <div className="mt-3">
          <input
            type="text"
            placeholder="今何してる？"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-800"
          />
        </div>

        {/* タイマー数値 */}
        <div className="text-center py-4 my-2">
          <div className="text-4xl font-mono font-bold text-stone-900 tabular-nums">
            {formatDuration(elapsedSeconds)}
          </div>
          {startTime && (
            <div className="text-[11px] text-stone-500 mt-1 font-mono">
              開始: {formatJSTTime(startTime)} (JST)
            </div>
          )}
        </div>

        {/* 操作ボタン */}
        <div className="grid grid-cols-3 gap-2">
          {!isRunning ? (
            <button
              type="button"
              onClick={handleStart}
              className="flex items-center justify-center gap-1 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              開始
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePause}
              className="flex items-center justify-center gap-1 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5 fill-white" />
              一時停止
            </button>
          )}

          <button
            type="button"
            disabled={elapsedSeconds === 0 && !startTime}
            onClick={handleSaveAndStop}
            className="flex items-center justify-center gap-1 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-100 disabled:text-stone-400 text-white rounded-lg text-xs font-semibold cursor-pointer"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            保存
          </button>

          <button
            type="button"
            onClick={handleNextTask}
            className="flex items-center justify-center gap-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold cursor-pointer"
            title="次へ連続"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            次のタスク
          </button>
        </div>

        {/* 最新の直前ログ */}
        {latestEntry && (
          <div className="mt-4 pt-3 border-t border-stone-100 text-xs">
            <span className="text-[10px] text-stone-400 font-medium block">直前の完了タスク:</span>
            <div className="flex items-center justify-between mt-1 text-stone-700">
              <span className="truncate max-w-[170px] font-medium">{latestEntry.taskName}</span>
              <span className="font-mono text-stone-500 font-semibold">
                {formatDurationJapanese(latestEntry.durationSeconds)}
              </span>
            </div>
          </div>
        )}

        <div className="mt-3 text-center">
          <span className="inline-flex items-center gap-1 text-[10px] text-stone-400">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            {APP_CONFIG.storageStatusText}
          </span>
        </div>
      </div>
    </div>
  );
}
