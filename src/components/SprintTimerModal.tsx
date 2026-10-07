import React, { useState, useEffect } from 'react';
import { Timer, Play, Pause, RotateCcw, X, Sparkles, CheckCircle2 } from 'lucide-react';

interface SprintTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SprintTimerModal: React.FC<SprintTimerModalProps> = ({ isOpen, onClose }) => {
  const [minutesDuration, setMinutesDuration] = useState<number>(15);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(15 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeLeftSeconds > 0) {
      interval = setInterval(() => {
        setTimeLeftSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timeLeftSeconds === 0) {
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeftSeconds]);

  const selectDuration = (mins: number) => {
    setIsRunning(false);
    setMinutesDuration(mins);
    setTimeLeftSeconds(mins * 60);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeftSeconds(minutesDuration * 60);
  };

  if (!isOpen) return null;

  const displayMinutes = Math.floor(timeLeftSeconds / 60);
  const displaySeconds = timeLeftSeconds % 60;
  const isFinished = timeLeftSeconds === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl dark:border-stone-800 dark:bg-stone-900 text-center">
        <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-teal-600" />
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Declutter Sprint Timer
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Sprint Durations */}
        <div className="mt-4 flex justify-center gap-2">
          {[5, 10, 15, 25].map((mins) => (
            <button
              key={mins}
              onClick={() => selectDuration(mins)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                minutesDuration === mins
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300'
              }`}
            >
              {mins}m
            </button>
          ))}
        </div>

        {/* Big Countdown Clock */}
        <div className="my-6">
          <div className="text-5xl font-black tracking-tight text-stone-900 dark:text-stone-100 font-mono">
            {String(displayMinutes).padStart(2, '0')}:{String(displaySeconds).padStart(2, '0')}
          </div>
          <p className="mt-2 text-xs text-stone-500">
            {isFinished
              ? '🎉 Sprint complete! Take a step back and admire your progress.'
              : isRunning
              ? 'Keep momentum! Focus only on this single surface.'
              : 'Choose a target surface, set the timer, and blitz.'}
          </p>
        </div>

        {/* Controls */}
        <div className="flex justify-center items-center gap-3">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-md transition ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-teal-600 hover:bg-teal-700'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="h-4 w-4" /> Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4" /> Start Sprint
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            className="rounded-xl border border-stone-200 bg-stone-50 p-2.5 text-stone-600 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300"
            title="Reset Timer"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
