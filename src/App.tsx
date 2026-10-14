import { useState, useEffect } from 'react';
import Header from './components/Header';
import StopwatchCard from './components/StopwatchCard';
import RecordsList from './components/RecordsList';
import { TimeEntry } from './types';
import { loadSavedEntries, saveEntriesToStorage, sendEntryToGAS } from './utils/time';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { APP_CONFIG } from './config';

export default function App() {
  const [entries, setEntries] = useState<TimeEntry[]>(() => loadSavedEntries());
  const [showGuide, setShowGuide] = useState(false);

  // エントリ変更時にLocalStorageへ自動永続化
  useEffect(() => {
    saveEntriesToStorage(entries);
  }, [entries]);

  const handleSaveEntry = async (newEntry: Omit<TimeEntry, 'id' | 'createdAt'>) => {
    const entry: TimeEntry = {
      ...newEntry,
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      createdAt: Date.now(),
    };

    // 1. ローカルステート＆LocalStorageへ保存（今まで通り即時反映）
    setEntries((prev) => [entry, ...prev]);

    // 2. スプレッドシート（GAS）へ非同期で飛ばす
    const success = await sendEntryToGAS(entry);
    if (success) {
      console.log('スプレッドシートへの保存成功！');
    } else {
      console.warn('スプレッドシートへの保存に失敗したかも（ローカルには残ってます）');
    }
  };

  const handleDeleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const handleClearAll = () => {
    setEntries([]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 font-sans selection:bg-stone-200">
      {/* 上部ヘッダー（JST現在時刻） */}
      <Header />

      {/* メインコンテンツエリア */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* 初回レクチャー・使い方ガイド（トグル式） */}
        <div className="mb-6 bg-white border border-stone-200 rounded-xl overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="w-full px-4 py-2.5 flex items-center justify-between text-left text-xs sm:text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-stone-500" />
              <span>💡 アプリの使い方とおすすめの連続記録フロー</span>
            </span>
            {showGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showGuide && (
            <div className="px-4 pb-4 pt-1 text-xs text-stone-600 border-t border-stone-100 bg-stone-50/50 space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div className="p-3 bg-white rounded-lg border border-stone-200/80">
                  <strong className="block text-stone-800 mb-1 font-semibold">1. タスクを入力してスタート</strong>
                  「タスク名」を入れてスタートを押すと、JST基準の開始時刻が自動で記録されます。
                </div>
                <div className="p-3 bg-white rounded-lg border border-stone-200/80">
                  <strong className="block text-stone-800 mb-1 font-semibold">2. 「次のタスクへ連続」が便利</strong>
                  前の作業を即座に保存し、そのまま次のタスクの計測をゼロ秒ラグで開始できます。
                </div>
                <div className="p-3 bg-white rounded-lg border border-stone-200/80">
                  <strong className="block text-stone-800 mb-1 font-semibold">3. スプレッドシート連携・CSV保存</strong>
                  一覧上部の「表形式でコピー」を押せば、GoogleスプレッドシートやExcelにそのまま貼り付け可能です。
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2分割表示（左右に配置）を固定表示 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* 左側：ストップウォッチ */}
          <div className="lg:col-span-5 sticky lg:top-24 space-y-4">
            <StopwatchCard onSaveEntry={handleSaveEntry} />
          </div>

          {/* 右側：記録一覧 */}
          <div className="lg:col-span-7">
            <RecordsList
              entries={entries}
              onDeleteEntry={handleDeleteEntry}
              onClearAll={handleClearAll}
            />
          </div>
        </div>
      </main>

      {/* フッター */}
      <footer className="border-t border-stone-200/80 bg-white py-4 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-400 gap-2">
          <span>{APP_CONFIG.name} (JST対応・スプレッドシート連携)</span>
          <span>{APP_CONFIG.storageDetailText}</span>
        </div>
      </footer>
    </div>
  );
}