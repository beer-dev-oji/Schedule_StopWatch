import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, ArrowRight, RotateCcw, Clock, Sparkles } from 'lucide-react';
import { formatDuration, formatJSTTime } from '../utils/time';
import { TimeEntry } from '../types';

interface StopwatchCardProps {
  onSaveEntry: (entry: Omit<TimeEntry, 'id' | 'createdAt'>) => void;
  compact?: boolean;
}

const QUICK_TAGS = ['開発作業', '会議・打合せ', '資料作成', 'メール・連絡', '調査・読書', '休憩'];

// ローカルストレージ用のキー
const ACTIVE_TIMER_KEY = 'active_timer_state_v1';

interface ActiveTimerState {
  taskName: string;
  startTimeIso: string;
  accumulatedSeconds: number; // 停止していた時間などを考慮する場合の積算（今回はシンプルに開始時刻からの差分ベース）
  isRunning: boolean;
}

export default function StopwatchCard({ onSaveEntry, compact = false }: StopwatchCardProps) {
  const [taskName, setTaskName] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);

  const timerRef = useRef<number | null>(null);

  // 1. マウント時（アプリ起動時）にローカルストレージから「生きていたタイマー」を復元
  useEffect(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_TIMER_KEY);
      if (saved) {
        const state: ActiveTimerState = JSON.parse(saved);
        if (state.startTimeIso) {
          const start = new Date(state.startTimeIso);
          setStartTime(start);
          setTaskName(state.taskName || '');

          if (state.isRunning) {
            // アプリを閉じていた間も時間が進んでいるので、現在時刻との差分を計算
            const now = Date.now();
            const diffSec = Math.floor((now - start.getTime()) / 1000);
            setElapsedSeconds(Math.max(0, diffSec));
            setIsRunning(true);
          }
        }
      }
    } catch (err) {
      console.error('Failed to restore timer state from localStorage', err);
    }
  }, []);

  // 2. 状態が変わるたびにローカルストレージへタイマー状態を保存
  useEffect(() => {
    try {
      if (startTime && (isRunning || elapsedSeconds > 0)) {
        const state: ActiveTimerState = {
          taskName,
          startTimeIso: startTime.toISOString(),
          accumulatedSeconds: elapsedSeconds,
          isRunning,
        };
        localStorage.setItem(ACTIVE_TIMER_KEY, JSON.stringify(state));
      } else {
        localStorage.removeItem(ACTIVE_TIMER_KEY);
      }
    } catch (err) {
      console.error('Failed to save timer state to localStorage', err);
    }
  }, [taskName, startTime, elapsedSeconds, isRunning]);

  // 3. タイマーの正確な刻み（1秒ごと、バックグラウンド復帰後もズレにくい設計）
  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        if (startTime) {
          const now = Date.now();
          const diffSec = Math.floor((now - startTime.getTime()) / 1000);
          setElapsedSeconds(Math.max(0, diffSec));
        }
      }, 500); // 0.5秒おきにチェックして現在時刻との差分で同期
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, startTime]);

  const handleStart = () => {
    const now = new Date();
    const currentStart = startTime || now;
    if (!startTime) {
      setStartTime(currentStart);
    }
    // もし一時停止からの再開の場合、開始時刻を「現在時刻 - すでに経過した秒数」に再設定してジワッとつなげる
    if (elapsedSeconds > 0 && !startTime) {
      const adjustedStart = new Date(Date.now() - elapsedSeconds * 1000);
      setStartTime(adjustedStart);
    } else if (!startTime) {
      setStartTime(now);
    }
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setElapsedSeconds(0);
    setStartTime(null);
    localStorage.removeItem(ACTIVE_TIMER_KEY);
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

    // 状態リセット ＆ ローカルストレージ掃除
    setIsRunning(false);
    setElapsedSeconds(0);
    setStartTime(null);
    setTaskName('');
    localStorage.removeItem(ACTIVE_TIMER_KEY);
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

    // すぐに次のタスクを開始（ローカルストレージも更新される）
    const now = new Date();
    setElapsedSeconds(0);
    setStartTime(now);
    setIsRunning(true);
    setTaskName('');
  };

  return (
    <div
      id="stopwatch-container"
      className={`bg-white rounded-2xl border border-stone-200 shadow-sm transition-all ${compact ? 'p-4' : 'p-6 sm:p-8'
        }`}
    >
      {/* タスク入力欄 */}
      <div className="mb-4">
        <label
          htmlFor="task-name-input"
          className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1.5"
        >
          タスク名 / 今やっていること
        </label>
        <div className="relative">
          <input
            id="task-name-input"
            type="text"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            placeholder="例: プロジェクト設計書作成、社内MTG..."
            className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-800 transition-all text-sm sm:text-base font-medium"
          />
        </div>

        {/* クイックタグ入力 */}
        {!compact && (
          <div className="flex flex-wrap gap-1.5 mt-2.5 items-center">
            <span className="text-[11px] text-stone-400 font-medium flex items-center gap-1 mr-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              クイック:
            </span>
            {QUICK_TAGS.map((tag) => (
              <button
                key={tag}
                id={`quick-tag-${tag}`}
                type="button"
                onClick={() => setTaskName(tag)}
                className="text-xs px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200/80 text-stone-600 transition-colors cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ストップウォッチメイン表示 */}
      <div className={`text-center my-6 py-6 rounded-2xl bg-stone-50/80 border border-stone-100 ${compact ? 'py-4 my-3' : ''}`}>
        <div className="font-mono font-bold tracking-tight text-stone-900 tabular-nums text-4xl sm:text-6xl select-none">
          {formatDuration(elapsedSeconds)}
        </div>

        {/* JST開始時刻の表示 */}
        <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-stone-500 font-medium">
          <Clock className="w-3.5 h-3.5 text-stone-400" />
          {startTime ? (
            <span>
              開始時刻 (JST): <strong className="text-stone-700">{formatJSTTime(startTime)}</strong>
              {isRunning && <span className="ml-2 text-emerald-600 font-semibold">● 計測中</span>}
            </span>
          ) : (
            <span>待機中（スタートでJST現在時刻を自動取得開始）</span>
          )}
        </div>
      </div>

      {/* コントロールボタン群 */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        {!isRunning ? (
          <button
            id="btn-start-timer"
            type="button"
            onClick={handleStart}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3 bg-stone-900 hover:bg-stone-800 active:scale-[0.98] text-white rounded-xl font-medium text-sm sm:text-base shadow-sm transition-all cursor-pointer min-w-[130px]"
          >
            <Play className="w-4 h-4 fill-white" />
            {elapsedSeconds > 0 ? '再開する' : 'スタート'}
          </button>
        ) : (
          <button
            id="btn-pause-timer"
            type="button"
            onClick={handlePause}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white rounded-xl font-medium text-sm sm:text-base shadow-sm transition-all cursor-pointer min-w-[130px]"
          >
            <Pause className="w-4 h-4 fill-white" />
            一時停止
          </button>
        )}

        {/* 記録して保存ボタン */}
        <button
          id="btn-save-entry"
          type="button"
          disabled={elapsedSeconds === 0 && !startTime}
          onClick={handleSaveAndStop}
          className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium text-sm sm:text-base transition-all cursor-pointer ${elapsedSeconds > 0 || startTime
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-[0.98] shadow-sm'
              : 'bg-stone-100 text-stone-400 cursor-not-allowed border border-stone-200'
            }`}
        >
          <Square className="w-4 h-4 fill-current" />
          記録して保存
        </button>

        {/* 次のタスクへ（連続記録用） */}
        <button
          id="btn-next-task"
          type="button"
          onClick={handleNextTask}
          className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-medium text-sm transition-all cursor-pointer"
          title="現在のタスクを保存して、すぐに新しいタスクの記録を開始します"
        >
          <ArrowRight className="w-4 h-4 text-stone-600" />
          次のタスクへ
        </button>

        {/* リセット */}
        {elapsedSeconds > 0 && !isRunning && (
          <button
            id="btn-reset-timer"
            type="button"
            onClick={handleReset}
            className="p-3 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
            title="リセット"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}