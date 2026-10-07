import React, { useState } from 'react';
import { Zap, X, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

interface QuickTriageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickTriageModal: React.FC<QuickTriageModalProps> = ({ isOpen, onClose }) => {
  const [itemDescription, setItemDescription] = useState<string>('');
  const [frequency, setFrequency] = useState<string>("Haven't used in 1+ years");
  const [emotional, setEmotional] = useState<string>('Low / Neutral');
  const [verdict, setVerdict] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemDescription.trim() || isLoading) return;

    setIsLoading(true);
    setVerdict(null);

    try {
      const response = await fetch('/api/quick-triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemDescription,
          frequencyOfUse: frequency,
          emotionalAttachment: emotional,
        }),
      });

      const data = await response.json();
      setVerdict(data.verdict || 'Verdict could not be generated.');
    } catch (err: any) {
      setVerdict(`Could not connect to triage engine: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl dark:border-stone-800 dark:bg-stone-900 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                10-Second Keep vs. Toss Triage
              </h3>
              <p className="text-[11px] text-stone-500">
                Powered by Gemini 3.1 Flash-Lite
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleEvaluate} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              What item are you holding or considering?
            </label>
            <input
              type="text"
              value={itemDescription}
              onChange={(e) => setItemDescription(e.target.value)}
              placeholder="e.g. Old college textbook from 2016, 5th black tote bag, duplicate HDMI cable..."
              className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-900 focus:border-amber-500 focus:outline-hidden dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 mb-1">
                Last Used:
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full rounded-lg border border-stone-200 bg-stone-50 px-2 py-1.5 text-xs text-stone-800 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200"
              >
                <option value="Used this week">Used this week</option>
                <option value="Used past month">Used past month</option>
                <option value="Used past year">Used past year</option>
                <option value="Haven't used in 1+ years">Haven't used in 1+ years</option>
                <option value="Never used">Never used / Still in packaging</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 mb-1">
                Sentiment:
              </label>
              <select
                value={emotional}
                onChange={(e) => setEmotional(e.target.value)}
                className="w-full rounded-lg border border-stone-200 bg-stone-50 px-2 py-1.5 text-xs text-stone-800 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200"
              >
                <option value="Zero / Pure Utility">Zero / Pure utility</option>
                <option value="Low / Neutral">Low / Neutral</option>
                <option value="Moderate (Guilt / Cost)">Moderate (Guilt or cost)</option>
                <option value="High (Sentimental)">High (Sentimental)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={!itemDescription.trim() || isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-2.5 px-4 text-xs font-bold text-stone-900 hover:bg-amber-400 disabled:opacity-50 transition shadow-xs"
          >
            {isLoading ? (
              <span>Evaluating in 3 seconds...</span>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Get Instant Triage Verdict</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {verdict && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 dark:border-amber-900/60 dark:bg-amber-950/40">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-stone-800 dark:text-stone-200 whitespace-pre-wrap leading-relaxed">
                {verdict}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
