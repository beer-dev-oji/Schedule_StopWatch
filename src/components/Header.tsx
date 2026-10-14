import { useState, useEffect } from 'react';
import { Clock, ShieldCheck } from 'lucide-react';
import { formatJSTTime, formatJSTDate } from '../utils/time';
import { APP_CONFIG } from '../config';

export default function Header() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="border-b border-stone-200 bg-white/80 backdrop-blur-xs sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
        {/* タイトルとステータス */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-stone-900 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight leading-none">
              {APP_CONFIG.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] text-stone-500 font-mono">
                JST: {formatJSTDate(now)} {formatJSTTime(now)}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                <ShieldCheck className="w-3 h-3" />
                {APP_CONFIG.storageStatusText}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}