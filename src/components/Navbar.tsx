import React from 'react';
import { Sparkles, Timer, Zap, PlusCircle, CheckCircle2 } from 'lucide-react';

interface NavbarProps {
  onNewScan: () => void;
  onOpenTimer: () => void;
  onOpenQuickTriage: () => void;
  hasActiveRoom: boolean;
  completedTasksCount: number;
  totalTasksCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNewScan,
  onOpenTimer,
  onOpenQuickTriage,
  hasActiveRoom,
  completedTasksCount,
  totalTasksCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-200/80 bg-stone-50/90 backdrop-blur-md dark:border-stone-800 dark:bg-stone-950/90 transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-md shadow-emerald-500/20 text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-stone-900 dark:text-stone-100">
                Declutter<span className="text-teal-600 dark:text-teal-400">AI</span>
              </span>
              <span className="hidden sm:inline-flex items-center rounded-full bg-teal-100 dark:bg-teal-900/40 px-2 py-0.5 text-xs font-medium text-teal-800 dark:text-teal-300">
                Gemini 3.5 Flash Vision
              </span>
            </div>
            <p className="hidden text-xs text-stone-500 dark:text-stone-400 md:block">
              AI Room Organization &amp; Decluttering Studio
            </p>
          </div>
        </div>

        {/* Progress pill if active room */}
        {hasActiveRoom && totalTasksCount > 0 && (
          <div className="hidden lg:flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-medium text-stone-700 shadow-xs dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300">
            <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
            <span>Progress: {completedTasksCount}/{totalTasksCount} tasks ({Math.round((completedTasksCount / totalTasksCount) * 100)}%)</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenQuickTriage}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50/80 px-2.5 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-900/40"
            title="Instant Keep vs Toss Decision using Gemini Flash-Lite"
          >
            <Zap className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            <span className="hidden sm:inline">Speed</span> Triage
          </button>

          <button
            onClick={onOpenTimer}
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-100 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 shadow-xs"
            title="Declutter Sprint Timer"
          >
            <Timer className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
            <span>Sprint Timer</span>
          </button>

          {hasActiveRoom && (
            <button
              onClick={onNewScan}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-700 active:scale-95"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Scan New Room</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
