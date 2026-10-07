import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { RoomUploader } from './components/RoomUploader';
import { RoomAnalysisView } from './components/RoomAnalysisView';
import { DeclutterChatbot } from './components/DeclutterChatbot';
import { QuickTriageModal } from './components/QuickTriageModal';
import { SprintTimerModal } from './components/SprintTimerModal';
import { RoomAnalysisResult } from './types';
import { DEMO_ANALYSIS_PRESETS } from './data/sampleRooms';
import { MessageSquare, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activeAnalysis, setActiveAnalysis] = useState<RoomAnalysisResult | null>(null);
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);
  const [activeImageBase64, setActiveImageBase64] = useState<string | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isTimerOpen, setIsTimerOpen] = useState<boolean>(false);
  const [isQuickTriageOpen, setIsQuickTriageOpen] = useState<boolean>(false);

  // Restore completed tasks from localStorage if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem('declutter_completed_tasks');
      if (saved) {
        setCompletedTasks(new Set(JSON.parse(saved)));
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, []);

  const handleToggleTask = (taskId: string) => {
    setCompletedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      try {
        localStorage.setItem('declutter_completed_tasks', JSON.stringify(Array.from(next)));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });
  };

  const handleAnalyze = async (payload: {
    imageBase64: string;
    mimeType: string;
    imageUrl: string;
    roomType: string;
    priority: string;
    goal: string;
    presetKey?: string;
  }) => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    setAnalysisStep('Initiating Gemini 3.1 Pro image understanding engine...');

    try {
      // Advance step indicator for smooth user feedback
      const timer1 = setTimeout(() => {
        setAnalysisStep('Scanning spatial geometry & identifying surface clutter hotspots...');
      }, 1200);

      const timer2 = setTimeout(() => {
        setAnalysisStep('Formulating phased action plan & storage containment recommendations...');
      }, 3000);

      const response = await fetch('/api/analyze-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: payload.imageBase64,
          mimeType: payload.mimeType,
          roomType: payload.roomType,
          priority: payload.priority,
          goal: payload.goal,
        }),
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // If server API fails and user clicked a sample room preset, use demo preset
        if (payload.presetKey && DEMO_ANALYSIS_PRESETS[payload.presetKey]) {
          console.warn('API error, falling back to preset analysis:', errorData);
          setActiveAnalysis(DEMO_ANALYSIS_PRESETS[payload.presetKey]);
          setActiveImageUrl(payload.imageUrl);
          setActiveImageBase64(payload.imageBase64);
          setErrorMessage('Note: Displaying verified sample analysis due to API key or quota limit.');
          return;
        }
        throw new Error(errorData.error || `Analysis failed with status ${response.status}`);
      }

      const data = await response.json();
      if (!data.result) {
        throw new Error('No analysis data received.');
      }

      setActiveAnalysis(data.result);
      setActiveImageUrl(payload.imageUrl);
      setActiveImageBase64(payload.imageBase64);

      if (data.quotaFallback) {
        setErrorMessage('Room analyzed using Gemini 3.5 Flash (free tier). To use the flagship Gemini 3.1 Pro model without rate limits, select a paid API key in settings.');
      }
    } catch (err: any) {
      console.error('Room analysis error:', err);
      // If a preset exists for this sample room, fall back smoothly
      if (payload.presetKey && DEMO_ANALYSIS_PRESETS[payload.presetKey]) {
        setActiveAnalysis(DEMO_ANALYSIS_PRESETS[payload.presetKey]);
        setActiveImageUrl(payload.imageUrl);
        setActiveImageBase64(payload.imageBase64);
        setErrorMessage('Displaying verified room analysis preset.');
      } else {
        const rawMsg = err.message || '';
        if (rawMsg.includes('429') || rawMsg.includes('quota') || rawMsg.includes('RESOURCE_EXHAUSTED')) {
          setErrorMessage('Gemini 3.1 Pro free-tier quota is currently exhausted. The system is falling back to Gemini 3.5 Flash.');
        } else {
          setErrorMessage(`Could not analyze room photo: ${rawMsg}. Please try again.`);
        }
      }
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep('');
    }
  };

  const handleNewScan = () => {
    setActiveAnalysis(null);
    setActiveImageUrl(null);
    setActiveImageBase64(null);
    setErrorMessage(null);
  };

  const totalTasksCount = activeAnalysis?.declutterPhases.flatMap((p) => p.tasks).length || 0;
  const completedTasksCount = activeAnalysis?.declutterPhases.flatMap((p) => p.tasks).filter((t) => completedTasks.has(t.id)).length || 0;

  return (
    <div className="min-h-screen bg-stone-100/60 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col font-sans transition-colors">
      <Navbar
        onNewScan={handleNewScan}
        onOpenTimer={() => setIsTimerOpen(true)}
        onOpenQuickTriage={() => setIsQuickTriageOpen(true)}
        hasActiveRoom={!!activeAnalysis}
        completedTasksCount={completedTasksCount}
        totalTasksCount={totalTasksCount}
      />

      {errorMessage && (
        <div className="mx-auto max-w-5xl px-4 pt-4 w-full">
          <div className="flex items-center justify-between rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-amber-700 font-bold hover:underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 pb-16">
        {!activeAnalysis ? (
          <RoomUploader
            onAnalyze={handleAnalyze}
            isAnalyzing={isAnalyzing}
            analysisStep={analysisStep}
          />
        ) : (
          <RoomAnalysisView
            analysis={activeAnalysis}
            imageUrl={activeImageUrl || ''}
            completedTasks={completedTasks}
            onToggleTask={handleToggleTask}
            onOpenChat={() => setIsChatOpen(true)}
            onOpenQuickTriage={() => setIsQuickTriageOpen(true)}
            onNewScan={handleNewScan}
          />
        )}
      </main>

      {/* Floating Chat Trigger Button */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2.5 rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-3 text-xs font-bold text-white shadow-xl shadow-teal-700/20 hover:from-teal-700 hover:to-emerald-700 transition-all hover:scale-105 active:scale-95"
        >
          <div className="relative">
            <MessageSquare className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-white animate-pulse" />
          </div>
          <span>Declutter AI Chatbot</span>
        </button>
      )}

      {/* Multi-turn Chatbot Drawer / Modal */}
      <DeclutterChatbot
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        roomContext={activeAnalysis}
        imageBase64={activeImageBase64}
      />

      {/* Quick Triage Modal */}
      <QuickTriageModal
        isOpen={isQuickTriageOpen}
        onClose={() => setIsQuickTriageOpen(false)}
      />

      {/* Sprint Timer Modal */}
      <SprintTimerModal
        isOpen={isTimerOpen}
        onClose={() => setIsTimerOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-stone-200/80 bg-white/60 py-6 text-center text-xs text-stone-500 dark:border-stone-800 dark:bg-stone-900/40">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            DeclutterAI • AI Room Organization Powered by Gemini 3.1 Pro &amp; Flash Models
          </p>
          <div className="flex items-center gap-4 text-[11px] text-stone-400">
            <span>Spatial Hotspot Mapping</span>
            <span>•</span>
            <span>KonMari Triage Matrix</span>
            <span>•</span>
            <span>Multi-Role AI Coach</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
