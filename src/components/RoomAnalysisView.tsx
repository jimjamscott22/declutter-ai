import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  AlertTriangle,
  Clock,
  Sparkles,
  HeartHandshake,
  Trash2,
  ArrowRightLeft,
  Package,
  Repeat,
  Share2,
  Copy,
  Check,
  Flame,
  Info,
  ChevronRight,
  ShieldAlert,
  Sliders,
  MessageSquare,
  Trophy,
  TrendingUp,
  CheckCheck,
  RotateCcw
} from 'lucide-react';
import { Hotspot, RoomAnalysisResult, TaskItem } from '../types';

interface RoomAnalysisViewProps {
  analysis: RoomAnalysisResult;
  imageUrl: string;
  completedTasks: Set<string>;
  onToggleTask: (taskId: string) => void;
  onOpenChat: () => void;
  onOpenQuickTriage: () => void;
  onNewScan: () => void;
}

export const RoomAnalysisView: React.FC<RoomAnalysisViewProps> = ({
  analysis,
  imageUrl,
  completedTasks,
  onToggleTask,
  onOpenChat,
  onOpenQuickTriage,
  onNewScan,
}) => {
  const [activeTab, setActiveTab] = useState<'plan' | 'hotspots' | 'triage' | 'storage' | 'habits'>('plan');
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [copiedPlan, setCopiedPlan] = useState<boolean>(false);
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Compute total and completed tasks
  const allTasks: TaskItem[] = analysis.declutterPhases.flatMap((p) => p.tasks);
  const totalTasks = allTasks.length;
  const completedCount = allTasks.filter((t) => completedTasks.has(t.id)).length;
  const remainingCount = totalTasks - completedCount;
  const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  // Compute estimated remaining time
  const remainingMinutes = allTasks
    .filter((t) => !completedTasks.has(t.id))
    .reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0);

  // Dynamic status feedback based on percentage
  const getProgressStatus = (percent: number) => {
    if (percent === 100) {
      return {
        message: '🎉 Extraordinary achievement! All tasks completed — your room has achieved sanctuary status!',
        color: 'text-emerald-700 dark:text-emerald-300',
        bgColor: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
      };
    }
    if (percent >= 75) {
      return {
        message: '🌟 Final stretch! The finish line is in sight and mental clarity is flowing.',
        color: 'text-teal-700 dark:text-teal-300',
        bgColor: 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800',
      };
    }
    if (percent >= 50) {
      return {
        message: '⚡ Halfway milestone reached! The visual static is disappearing rapidly.',
        color: 'text-amber-700 dark:text-amber-300',
        bgColor: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
      };
    }
    if (percent >= 25) {
      return {
        message: '🌱 Great initial momentum! Surface clutter is clearing and space is opening up.',
        color: 'text-teal-700 dark:text-teal-300',
        bgColor: 'bg-teal-50/60 dark:bg-teal-950/30 border-teal-100 dark:border-teal-900',
      };
    }
    return {
      message: '🏁 Ready to declutter — check off your first task below to watch your progress soar!',
      color: 'text-stone-600 dark:text-stone-400',
      bgColor: 'bg-stone-50 dark:bg-stone-800/50 border-stone-200 dark:border-stone-800',
    };
  };

  const statusInfo = getProgressStatus(progressPercent);

  // Clutter score colors
  const getScoreColor = (score: number) => {
    if (score >= 75) return { bg: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400', badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' };
    if (score >= 50) return { bg: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' };
    return { bg: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' };
  };

  const scoreTheme = getScoreColor(analysis.clutterScore);

  const handleCopyPlan = () => {
    const text = `
=== DeclutterAI Plan for ${analysis.roomType} ===
Clutter Score: ${analysis.clutterScore}/100 (${analysis.calmnessRating})
Estimated Time: ${analysis.estimatedTimeMinutes} minutes
Progress: ${completedCount}/${totalTasks} tasks completed (${progressPercent}%)

Summary:
${analysis.roomSummary}

${analysis.declutterPhases.map((phase) => `
${phase.phaseTitle} (Goal: ${phase.goal})
${phase.tasks.map((t) => `- [${completedTasks.has(t.id) ? 'x' : ' '}] ${t.action} (~${t.estimatedMinutes}m): ${t.tips}`).join('\n')}
`).join('\n')}

Daily Micro-Habit:
${analysis.dailyMaintenanceHabit}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopiedPlan(true);
    setTimeout(() => setCopiedPlan(false), 2500);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Top Banner & Overview */}
      <div className="mb-6 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-xs dark:border-stone-800 dark:bg-stone-900 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="rounded-lg bg-teal-100 px-2.5 py-0.5 text-xs font-bold text-teal-800 dark:bg-teal-950/60 dark:text-teal-300">
                {analysis.roomType}
              </span>
              <span className={`rounded-lg px-2.5 py-0.5 text-xs font-bold ${scoreTheme.badge}`}>
                Clutter Score: {analysis.clutterScore}/100
              </span>
              <span className="rounded-lg bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                {analysis.calmnessRating}
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-stone-900 dark:text-stone-100 sm:text-2xl">
              Declutter Action Blueprint
            </h1>
            <p className="mt-1 max-w-3xl text-xs sm:text-sm text-stone-600 dark:text-stone-400">
              {analysis.roomSummary}
            </p>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl bg-stone-50 px-3.5 py-2 border border-stone-200 dark:bg-stone-800 dark:border-stone-700">
              <Clock className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-stone-500 dark:text-stone-400">
                  Estimated Time
                </p>
                <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  {analysis.estimatedTimeMinutes} mins
                </p>
              </div>
            </div>

            <button
              onClick={handleCopyPlan}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 shadow-xs hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700 transition"
              title="Copy formatted plan to clipboard"
            >
              {copiedPlan ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-stone-500" />
                  <span>Copy Plan</span>
                </>
              )}
            </button>

            <button
              onClick={onOpenChat}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-700 transition"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Ask AI Organizer</span>
            </button>
          </div>
        </div>

        {/* Enhanced Visual Progress Bar Tracker */}
        <div className="mt-6 border-t border-stone-100 pt-5 dark:border-stone-800">
          <div className="rounded-2xl border border-stone-200/90 bg-gradient-to-b from-stone-50/80 to-white/90 p-4 sm:p-5 shadow-xs dark:border-stone-800 dark:from-stone-900/60 dark:to-stone-900">
            {/* Metric Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3.5">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-600 text-white shadow-xs">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
                      Declutter Transformation Progress
                    </h3>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">
                      {remainingCount > 0
                        ? `${remainingCount} task${remainingCount === 1 ? '' : 's'} remaining • Estimated ${remainingMinutes} mins left`
                        : 'All planned organizing steps completed!'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress Stat Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700 shadow-xs dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300">
                  <CheckCheck className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                  <span>{completedCount} / {totalTasks} Tasks</span>
                </div>

                <div className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700 shadow-xs dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300">
                  <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  <span>{progressPercent === 100 ? 'Finished!' : `~${remainingMinutes}m left`}</span>
                </div>

                <div className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-extrabold shadow-xs transition-colors ${
                  progressPercent === 100
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white animate-pulse'
                    : progressPercent >= 50
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    : 'bg-teal-100 text-teal-800 dark:bg-teal-950/70 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                }`}>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{progressPercent}% Complete</span>
                </div>
              </div>
            </div>

            {/* Visual Progress Bar Track */}
            <div className="relative">
              <div className="h-4 w-full overflow-hidden rounded-full bg-stone-200/80 p-0.5 shadow-inner dark:bg-stone-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-400 transition-all duration-700 ease-out shadow-sm relative overflow-hidden"
                  style={{ width: `${progressPercent}%` }}
                >
                  {/* Subtle Shimmer Effect on bar */}
                  <div className="absolute inset-0 bg-white/20 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:24px_24px] animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]" />
                </div>
              </div>

              {/* Milestone Checkpoints (25%, 50%, 75%, 100%) */}
              <div className="mt-2 flex items-center justify-between px-1 text-[10px] font-semibold text-stone-400 dark:text-stone-500">
                <span className={progressPercent >= 0 ? 'text-teal-700 dark:text-teal-400 font-bold' : ''}>
                  Start (0%)
                </span>
                <span className={progressPercent >= 25 ? 'text-teal-700 dark:text-teal-400 font-bold' : ''}>
                  25%
                </span>
                <span className={progressPercent >= 50 ? 'text-teal-700 dark:text-teal-400 font-bold' : ''}>
                  Halfway (50%)
                </span>
                <span className={progressPercent >= 75 ? 'text-teal-700 dark:text-teal-400 font-bold' : ''}>
                  75%
                </span>
                <span className={progressPercent === 100 ? 'text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-0.5' : ''}>
                  {progressPercent === 100 && <Trophy className="h-3 w-3 inline text-amber-500" />}
                  Sanctuary (100%)
                </span>
              </div>
            </div>

            {/* Dynamic Status / Motivation Banner */}
            <div className={`mt-3.5 flex items-center gap-2.5 rounded-xl border p-2.5 sm:p-3 text-xs ${statusInfo.bgColor}`}>
              <Sparkles className={`h-4 w-4 shrink-0 ${statusInfo.color}`} />
              <p className={`font-medium ${statusInfo.color}`}>
                {statusInfo.message}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left is Photo & Hotspots, Right is Tabs & Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Photo with Interactive Hotspot Pins (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-xs dark:border-stone-800 dark:bg-stone-900">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-rose-500" />
                Detected Clutter Zones ({analysis.hotspots.length})
              </span>
              <span className="text-[11px] text-stone-400">Click pins to inspect</span>
            </div>

            {/* Image Overlay */}
            <div className="relative overflow-hidden rounded-xl border border-stone-200 bg-stone-950 dark:border-stone-800">
              <img
                src={imageUrl}
                alt="Room Analysis"
                className="w-full max-h-80 object-cover sm:max-h-96"
              />

              {/* Hotspot Pins */}
              {analysis.hotspots.map((hotspot, idx) => {
                const x = hotspot.coordinates?.x ?? 20 + (idx * 25) % 65;
                const y = hotspot.coordinates?.y ?? 30 + (idx * 22) % 60;
                const isSelected = selectedHotspot?.id === hotspot.id;

                return (
                  <button
                    key={hotspot.id}
                    onClick={() => {
                      setSelectedHotspot(isSelected ? null : hotspot);
                      setActiveTab('hotspots');
                    }}
                    style={{ left: `${x}%`, top: `${y}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 group transition-transform ${
                      isSelected ? 'scale-125 z-30' : 'hover:scale-110 z-20'
                    }`}
                  >
                    <span className="relative flex h-7 w-7 items-center justify-center">
                      <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${
                        hotspot.severity === 'critical' ? 'bg-rose-500' : hotspot.severity === 'high' ? 'bg-amber-500' : 'bg-teal-500'
                      }`} />
                      <span className={`relative inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black text-white shadow-md border-2 border-white ${
                        hotspot.severity === 'critical' ? 'bg-rose-600' : hotspot.severity === 'high' ? 'bg-amber-600' : 'bg-teal-600'
                      }`}>
                        {idx + 1}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected Hotspot Drawer */}
            {selectedHotspot ? (
              <div className="mt-3 rounded-xl border border-teal-200 bg-teal-50/70 p-3.5 dark:border-teal-900 dark:bg-teal-950/40">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="rounded-md bg-teal-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                      Hotspot: {selectedHotspot.name}
                    </span>
                    <p className="mt-1 text-xs text-stone-700 dark:text-stone-300">
                      {selectedHotspot.description}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedHotspot(null)}
                    className="text-stone-400 hover:text-stone-600 text-xs font-bold px-1"
                  >
                    ✕
                  </button>
                </div>
                <div className="mt-2 text-xs font-semibold text-teal-900 dark:text-teal-200">
                  ⚡ 2-Minute Fix: {selectedHotspot.quickFix}
                </div>
              </div>
            ) : (
              <p className="mt-2 text-center text-xs text-stone-400">
                Click any numbered pin to see the rapid 2-minute fix.
              </p>
            )}
          </div>

          {/* Daily Reset Micro-Habit Callout */}
          <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 shadow-xs dark:border-emerald-950 dark:from-emerald-950/30 dark:to-teal-950/30">
            <div className="flex items-center gap-2 mb-1.5 text-emerald-800 dark:text-emerald-300">
              <Repeat className="h-4 w-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Daily 2-Minute Reset Routine
              </h3>
            </div>
            <p className="text-xs text-emerald-900/90 dark:text-emerald-200 leading-relaxed">
              {analysis.dailyMaintenanceHabit}
            </p>
          </div>
        </div>

        {/* Right Column: Tabbed Content (7 Cols) */}
        <div className="lg:col-span-7">
          {/* Tab Navigation */}
          <div className="flex overflow-x-auto rounded-xl border border-stone-200 bg-stone-100 p-1 dark:border-stone-800 dark:bg-stone-900/80 mb-4 scrollbar-none">
            <button
              onClick={() => setActiveTab('plan')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold whitespace-nowrap transition ${
                activeTab === 'plan'
                  ? 'bg-white text-stone-900 shadow-xs dark:bg-stone-800 dark:text-stone-100'
                  : 'text-stone-600 hover:text-stone-900 dark:text-stone-400'
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
              <span>Action Plan &amp; Checklist</span>
            </button>

            <button
              onClick={() => setActiveTab('hotspots')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold whitespace-nowrap transition ${
                activeTab === 'hotspots'
                  ? 'bg-white text-stone-900 shadow-xs dark:bg-stone-800 dark:text-stone-100'
                  : 'text-stone-600 hover:text-stone-900 dark:text-stone-400'
              }`}
            >
              <Flame className="h-3.5 w-3.5 text-rose-500" />
              <span>Hotspot Breakdown</span>
            </button>

            <button
              onClick={() => setActiveTab('triage')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold whitespace-nowrap transition ${
                activeTab === 'triage'
                  ? 'bg-white text-stone-900 shadow-xs dark:bg-stone-800 dark:text-stone-100'
                  : 'text-stone-600 hover:text-stone-900 dark:text-stone-400'
              }`}
            >
              <ArrowRightLeft className="h-3.5 w-3.5 text-amber-500" />
              <span>Keep / Donate / Toss</span>
            </button>

            <button
              onClick={() => setActiveTab('storage')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold whitespace-nowrap transition ${
                activeTab === 'storage'
                  ? 'bg-white text-stone-900 shadow-xs dark:bg-stone-800 dark:text-stone-100'
                  : 'text-stone-600 hover:text-stone-900 dark:text-stone-400'
              }`}
            >
              <Package className="h-3.5 w-3.5 text-indigo-500" />
              <span>Storage &amp; DIY Hacks</span>
            </button>
          </div>

          {/* Tab 1: Action Plan & Interactive Checklist */}
          {activeTab === 'plan' && (
            <div className="space-y-4">
              {analysis.declutterPhases.map((phase) => {
                const phaseCompleted = phase.tasks.filter((t) => completedTasks.has(t.id)).length;
                const phaseTotal = phase.tasks.length;
                const phasePercent = phaseTotal > 0 ? Math.round((phaseCompleted / phaseTotal) * 100) : 0;

                return (
                  <div
                    key={phase.phaseNumber}
                    className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-xs dark:border-stone-800 dark:bg-stone-900"
                  >
                    <div className="border-b border-stone-100 pb-3 dark:border-stone-800">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                              Phase {phase.phaseNumber}
                            </span>
                            <span className="text-xs text-stone-400">•</span>
                            <span className="text-xs text-stone-500 dark:text-stone-400">
                              Goal: {phase.goal}
                            </span>
                          </div>
                          <h3 className="text-sm font-extrabold text-stone-900 dark:text-stone-100">
                            {phase.phaseTitle}
                          </h3>
                        </div>

                        {/* Phase Progress Badge */}
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            phasePercent === 100
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
                          }`}>
                            {phaseCompleted}/{phaseTotal} done ({phasePercent}%)
                          </span>
                        </div>
                      </div>

                      {/* Phase Mini Progress Bar */}
                      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500"
                          style={{ width: `${phasePercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-3.5 space-y-2.5">
                    {phase.tasks.map((task) => {
                      const isDone = completedTasks.has(task.id);
                      return (
                        <div
                          key={task.id}
                          onClick={() => onToggleTask(task.id)}
                          className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                            isDone
                              ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/60 dark:bg-emerald-950/20'
                              : 'border-stone-200 bg-stone-50/40 hover:border-stone-300 dark:border-stone-800 dark:bg-stone-950/30 dark:hover:border-stone-700'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleTask(task.id);
                              }}
                              className="mt-0.5 shrink-0 text-stone-400 hover:text-teal-600 transition"
                            >
                              {isDone ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Circle className="h-5 w-5" />
                              )}
                            </button>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className={`text-xs font-bold ${
                                  isDone
                                    ? 'line-through text-stone-400 dark:text-stone-500'
                                    : 'text-stone-900 dark:text-stone-100'
                                }`}>
                                  {task.action}
                                </p>
                                <span className="ml-2 rounded-md bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-500 dark:bg-stone-800 dark:text-stone-400 shrink-0">
                                  ~{task.estimatedMinutes}m
                                </span>
                              </div>
                              <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
                                💡 Tip: {task.tips}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

          {/* Tab 2: Hotspot Breakdown */}
          {activeTab === 'hotspots' && (
            <div className="space-y-3">
              {analysis.hotspots.map((hotspot, idx) => (
                <div
                  key={hotspot.id}
                  className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-xs dark:border-stone-800 dark:bg-stone-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-600 text-xs font-black text-white">
                        {idx + 1}
                      </span>
                      <h4 className="text-sm font-extrabold text-stone-900 dark:text-stone-100">
                        {hotspot.name}
                      </h4>
                    </div>
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                      hotspot.severity === 'critical'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        : hotspot.severity === 'high'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300'
                    }`}>
                      {hotspot.severity}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-stone-600 dark:text-stone-400">
                    {hotspot.description}
                  </p>

                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {hotspot.primaryItems.map((item, i) => (
                      <span
                        key={i}
                        className="rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600 dark:bg-stone-800 dark:text-stone-300"
                      >
                        {item}
                      </span>
                    ))}
                  </div>

                  <div className="mt-3 rounded-xl bg-amber-50/80 p-2.5 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                    <span className="font-bold">⚡ Rapid 2-Min Relief:</span> {hotspot.quickFix}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 3: Triage Matrix */}
          {activeTab === 'triage' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Four-quadrant declutter triage strategy:
                </p>
                <button
                  onClick={onOpenQuickTriage}
                  className="text-xs font-bold text-amber-600 hover:text-amber-700 underline flex items-center gap-1"
                >
                  Ask Quick Keep/Toss Question
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* KEEP */}
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 dark:border-emerald-950 dark:bg-emerald-950/20">
                  <div className="flex items-center gap-2 mb-2 text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">Keep (High Value)</h4>
                  </div>
                  <ul className="space-y-1.5">
                    {analysis.triageMatrix.keep.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-stone-700 dark:text-stone-300">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* DONATE / SELL */}
                <div className="rounded-2xl border border-teal-200 bg-teal-50/40 p-4 dark:border-teal-950 dark:bg-teal-950/20">
                  <div className="flex items-center gap-2 mb-2 text-teal-800 dark:text-teal-300">
                    <HeartHandshake className="h-4 w-4" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">Donate or Sell</h4>
                  </div>
                  <ul className="space-y-1.5">
                    {analysis.triageMatrix.donateOrSell.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-stone-700 dark:text-stone-300">
                        <span className="text-teal-500 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* RECYCLE / TRASH */}
                <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-4 dark:border-rose-950 dark:bg-rose-950/20">
                  <div className="flex items-center gap-2 mb-2 text-rose-800 dark:text-rose-300">
                    <Trash2 className="h-4 w-4" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">Recycle / Discard</h4>
                  </div>
                  <ul className="space-y-1.5">
                    {analysis.triageMatrix.recycleOrTrash.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-stone-700 dark:text-stone-300">
                        <span className="text-rose-500 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* RELOCATE */}
                <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4 dark:border-blue-950 dark:bg-blue-950/20">
                  <div className="flex items-center gap-2 mb-2 text-blue-800 dark:text-blue-300">
                    <ArrowRightLeft className="h-4 w-4" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">Relocate to Other Rooms</h4>
                  </div>
                  <ul className="space-y-1.5">
                    {analysis.triageMatrix.relocate.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-stone-700 dark:text-stone-300">
                        <span className="text-blue-500 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Storage Solutions */}
          {activeTab === 'storage' && (
            <div className="space-y-3">
              {analysis.recommendedStorageSolutions.map((storage, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-xs dark:border-stone-800 dark:bg-stone-900"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Package className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
                      {storage.category}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    {storage.recommendation}
                  </h4>
                  <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">
                    <span className="font-semibold text-stone-800 dark:text-stone-200">Why it works:</span> {storage.whyItHelps}
                  </p>
                  <div className="mt-2.5 rounded-xl bg-stone-50 p-2.5 text-xs text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                    <span className="font-bold text-teal-700 dark:text-teal-400">💰 Zero-Cost / Budget DIY Hack:</span>{' '}
                    {storage.budgetFriendlyDiyAlt}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
