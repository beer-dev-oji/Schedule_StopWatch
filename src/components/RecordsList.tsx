import { useState } from 'react';
import { Download, Copy, Trash2, Calendar, Clock, Check, ListFilter, AlertCircle } from 'lucide-react';
import { TimeEntry } from '../types';
import { formatJSTDate, formatJSTShortTime, formatDurationJapanese, exportToCSV } from '../utils/time';

interface RecordsListProps {
  entries: TimeEntry[];
  onDeleteEntry: (id: string) => void;
  onClearAll: () => void;
}

export default function RecordsList({ entries, onDeleteEntry, onClearAll }: RecordsListProps) {
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // フィルタリング（検索語句）
  const filteredEntries = entries.filter((e) =>
    e.taskName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 合計作業時間の計算（本日分と全体）
  const totalSeconds = entries.reduce((acc, curr) => acc + curr.durationSeconds, 0);

  const todayStr = formatJSTDate(new Date());
  const todaySeconds = entries
    .filter((e) => formatJSTDate(e.startTime) === todayStr)
    .reduce((acc, curr) => acc + curr.durationSeconds, 0);

  const handleDownloadCSV = () => {
    if (entries.length === 0) return;
    const csv = exportToCSV(entries);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `スケジュール記録_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyClipboard = async () => {
    if (entries.length === 0) return;
    // スプレッドシートに直接貼り付けやすいTSV（タブ区切り）形式でコピー
    const tsvHeader = ['タスク名', '日付', '開始時刻', '終了時刻', '作業時間'].join('\t');
    const tsvRows = entries.map((e) =>
      [
        e.taskName,
        formatJSTDate(e.startTime),
        formatJSTShortTime(e.startTime),
        formatJSTShortTime(e.endTime),
        formatDurationJapanese(e.durationSeconds),
      ].join('\t')
    );
    const tsvText = [tsvHeader, ...tsvRows].join('\n');

    try {
      await navigator.clipboard.writeText(tsvText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // フォールバック
      alert('クリップボードへのアクセスが許可されていません');
    }
  };

  return (
    <div id="records-container" className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 sm:p-7">
      {/* 上部ヘッダーとアクション */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-stone-900">作業ログ一覧</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600 font-semibold">
              {entries.length} 件
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            新しい記録が一番上に表示されます (JST基準)
          </p>
        </div>

        {/* アクションボタン（CSV、コピー、クリア） */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-copy-tsv"
            type="button"
            disabled={entries.length === 0}
            onClick={handleCopyClipboard}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors disabled:opacity-40 cursor-pointer"
            title="スプレッドシートやExcelにそのまま貼り付けできる形式でコピー"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'コピー完了' : '表形式でコピー'}
          </button>

          <button
            id="btn-download-csv"
            type="button"
            disabled={entries.length === 0}
            onClick={handleDownloadCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors disabled:opacity-40 cursor-pointer"
            title="CSV形式でダウンロード"
          >
            <Download className="w-3.5 h-3.5" />
            CSV保存
          </button>

          {entries.length > 0 && (
            <button
              id="btn-clear-records"
              type="button"
              onClick={() => {
                if (window.confirm('すべての記録を削除してもよろしいですか？この操作は取り消せません。')) {
                  onClearAll();
                }
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer ml-1"
              title="全件消去"
            >
              <Trash2 className="w-3.5 h-3.5" />
              クリア
            </button>
          )}
        </div>
      </div>

      {/* サマリーバー（本日の合計と総計） */}
      {entries.length > 0 && (
        <div className="grid grid-cols-2 gap-3 my-4 p-3.5 bg-stone-50 rounded-xl border border-stone-100">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-stone-500 font-medium block">本日の合計作業時間</span>
            <span className="text-base sm:text-lg font-bold text-stone-800 font-mono">
              {formatDurationJapanese(todaySeconds)}
            </span>
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider text-stone-500 font-medium block">累計作業時間</span>
            <span className="text-base sm:text-lg font-bold text-stone-600 font-mono">
              {formatDurationJapanese(totalSeconds)}
            </span>
          </div>
        </div>
      )}

      {/* 検索バー */}
      {entries.length > 3 && (
        <div className="relative my-3">
          <ListFilter className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            id="input-search-records"
            type="text"
            placeholder="タスク名で絞り込み..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-400"
          />
        </div>
      )}

      {/* リスト表示 */}
      {filteredEntries.length === 0 ? (
        <div className="py-12 text-center text-stone-400">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40 text-stone-400" />
          <p className="text-sm font-medium">まだ記録がありません</p>
          <p className="text-xs text-stone-400 mt-1">
            上のストップウォッチでタスクを開始して「記録して保存」を押すとここに一覧化されます。
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1 mt-3">
          {filteredEntries.map((item, index) => (
            <div
              key={item.id}
              id={`record-item-${item.id}`}
              className="group p-3.5 rounded-xl border border-stone-200/80 bg-white hover:border-stone-300 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
            >
              {/* 左側：タスク名と日付・時間 */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-stone-900 text-sm sm:text-base">
                    {item.taskName}
                  </span>
                  {index === 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200/60">
                      最新
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 font-medium">
                  {/* 日付 */}
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    {formatJSTDate(item.startTime)}
                  </span>
                  {/* 何時から何時まで */}
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    <span className="font-mono text-stone-700 font-medium">
                      {formatJSTShortTime(item.startTime)} 〜 {formatJSTShortTime(item.endTime)}
                    </span>
                  </span>
                </div>
              </div>

              {/* 右側：所要時間バッジと削除ボタン */}
              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                <div className="px-3 py-1 bg-stone-100 group-hover:bg-stone-200/70 text-stone-800 rounded-lg text-xs sm:text-sm font-semibold font-mono transition-colors">
                  {formatDurationJapanese(item.durationSeconds)}
                </div>

                <button
                  id={`btn-delete-${item.id}`}
                  type="button"
                  onClick={() => onDeleteEntry(item.id)}
                  className="opacity-60 sm:opacity-0 group-hover:opacity-100 p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                  title="この記録を削除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
