import React, { useState, useRef } from 'react';
import {
  Upload,
  Camera,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ArrowRight,
  SlidersHorizontal,
  Home,
  Layers,
  Wand2
} from 'lucide-react';
import { SAMPLE_ROOMS } from '../data/sampleRooms';
import { SampleRoom } from '../types';
import { fileToBase64, urlToBase64 } from '../utils/imageUtils';

interface RoomUploaderProps {
  onAnalyze: (payload: {
    imageBase64: string;
    mimeType: string;
    imageUrl: string;
    roomType: string;
    priority: string;
    goal: string;
    presetKey?: string;
  }) => Promise<void>;
  isAnalyzing: boolean;
  analysisStep: string;
}

export const RoomUploader: React.FC<RoomUploaderProps> = ({
  onAnalyze,
  isAnalyzing,
  analysisStep,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedSample, setSelectedSample] = useState<SampleRoom | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [roomType, setRoomType] = useState<string>('Auto-detect');
  const [priority, setPriority] = useState<string>('Balanced, functional & calming');
  const [goal, setGoal] = useState<string>('Clear visual clutter and create sustainable storage systems');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPEG, PNG, WEBP).');
      return;
    }
    setSelectedFile(file);
    setSelectedSample(null);
    setMimeType(file.type || 'image/jpeg');

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSampleSelected = (sample: SampleRoom) => {
    setSelectedSample(sample);
    setSelectedFile(null);
    setSelectedImage(sample.imageUrl);
    setRoomType(sample.roomType);
    setMimeType('image/jpeg');
  };

  // Camera capture handlers
  const startCamera = async () => {
    try {
      setCameraError(null);
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('Unable to access camera. Please upload an image directly.');
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setSelectedImage(dataUrl);
      setSelectedFile(null);
      setSelectedSample(null);
      setMimeType('image/jpeg');
    }
    stopCamera();
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleStartAnalysis = async () => {
    if (!selectedImage) return;

    let base64 = '';
    let effectiveMime = mimeType;

    if (selectedFile) {
      const result = await fileToBase64(selectedFile);
      base64 = result.base64;
      effectiveMime = result.mimeType;
    } else if (selectedSample) {
      const result = await urlToBase64(selectedSample.imageUrl);
      base64 = result.base64;
      effectiveMime = result.mimeType;
    } else if (selectedImage.startsWith('data:image/')) {
      base64 = selectedImage.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
    }

    await onAnalyze({
      imageBase64: base64,
      mimeType: effectiveMime,
      imageUrl: selectedImage,
      roomType,
      priority,
      goal,
      presetKey: selectedSample?.id,
    });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Hero Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800/80 px-3.5 py-1 text-xs font-semibold text-teal-700 dark:text-teal-300 mb-3 shadow-xs">
          <Wand2 className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
          <span>Powered by Gemini 3.5 Flash Spatial Intelligence</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 dark:text-white sm:text-4xl md:text-5xl">
          Turn Room Chaos Into Calm Sanctuary
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-base text-stone-600 dark:text-stone-300 sm:text-lg">
          Upload a photo of your desk, living room, wardrobe, or counter. Gemini 3.5 Flash pinpoints clutter hotspots, calculates calmness friction, and generates your custom decluttering action plan.
        </p>
      </div>

      {/* Main Upload / Camera / Sample Card */}
      <div className="rounded-2xl border border-stone-200/80 bg-white/90 p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900/90 backdrop-blur-sm sm:p-7">
        {/* Sample Rooms Row */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Or Test With Real Cluttered Room Examples:
            </span>
            <span className="text-xs text-stone-400">1-click instant load</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {SAMPLE_ROOMS.map((sample) => {
              const isChosen = selectedSample?.id === sample.id;
              return (
                <button
                  key={sample.id}
                  onClick={() => handleSampleSelected(sample)}
                  className={`group relative flex flex-col overflow-hidden rounded-xl border text-left transition-all ${
                    isChosen
                      ? 'border-teal-600 ring-2 ring-teal-500/30 dark:border-teal-400'
                      : 'border-stone-200 hover:border-stone-400 dark:border-stone-800 dark:hover:border-stone-700'
                  }`}
                >
                  <div className="relative h-24 w-full overflow-hidden bg-stone-100 dark:bg-stone-800">
                    <img
                      src={sample.imageUrl}
                      alt={sample.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-1.5 right-1.5 rounded-full bg-stone-900/70 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs">
                      {sample.tag}
                    </div>
                  </div>
                  <div className="p-2.5 bg-white dark:bg-stone-900">
                    <p className="text-xs font-semibold text-stone-900 dark:text-stone-100 truncate">
                      {sample.title}
                    </p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                      {sample.roomType}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Upload Drop Zone & Camera */}
        {!selectedImage && !isCameraActive && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
              isDragOver
                ? 'border-teal-500 bg-teal-50/50 dark:border-teal-400 dark:bg-teal-950/30'
                : 'border-stone-300 bg-stone-50/60 hover:border-stone-400 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-950/40 dark:hover:border-stone-600'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])}
            />

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 mb-4 shadow-xs">
              <Upload className="h-7 w-7" />
            </div>

            <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
              Drag and drop your room photo here, or browse
            </h3>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
              Supports JPG, PNG, WEBP, HEIC (Max 20MB)
            </p>

            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-teal-700"
              >
                <ImageIcon className="h-4 w-4" />
                Select Photo
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  startCamera();
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 shadow-xs transition hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200"
              >
                <Camera className="h-4 w-4 text-stone-500" />
                Snap Photo with Camera
              </button>
            </div>
          </div>
        )}

        {/* Live Camera View */}
        {isCameraActive && (
          <div className="relative overflow-hidden rounded-2xl border border-stone-300 bg-black dark:border-stone-700">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="h-80 w-full object-cover"
            />
            <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4">
              <button
                onClick={capturePhoto}
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-bold text-stone-900 shadow-lg transition hover:bg-stone-200"
              >
                <Camera className="h-4 w-4 text-teal-600" />
                Capture Snapshot
              </button>
              <button
                onClick={stopCamera}
                className="rounded-full bg-stone-900/80 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-sm hover:bg-stone-800"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {cameraError && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{cameraError}</span>
          </div>
        )}

        {/* Selected Image Preview & Configuration */}
        {selectedImage && (
          <div className="space-y-6">
            <div className="relative overflow-hidden rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-950">
              <img
                src={selectedImage}
                alt="Room Preview"
                className="max-h-96 w-full object-contain"
              />
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedImage(null);
                    setSelectedFile(null);
                    setSelectedSample(null);
                  }}
                  className="rounded-lg bg-stone-900/80 px-3 py-1.5 text-xs font-medium text-white shadow-md backdrop-blur-md hover:bg-stone-900"
                >
                  Change Photo
                </button>
              </div>
              {selectedSample && (
                <div className="absolute bottom-3 left-3 rounded-lg bg-teal-900/90 px-3 py-1.5 text-xs font-semibold text-teal-100 backdrop-blur-md">
                  Sample Room: {selectedSample.title}
                </div>
              )}
            </div>

            {/* Customization Options */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Home className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                    Room Type
                  </span>
                </label>
                <select
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-medium text-stone-800 focus:border-teal-500 focus:outline-hidden dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200"
                >
                  <option value="Auto-detect">Auto-detect from image</option>
                  <option value="Home Office">Home Office / Desk</option>
                  <option value="Living Room">Living Room</option>
                  <option value="Bedroom">Bedroom</option>
                  <option value="Kitchen">Kitchen &amp; Counters</option>
                  <option value="Closet / Wardrobe">Closet / Wardrobe</option>
                  <option value="Entryway">Entryway / Hallway</option>
                  <option value="Kids Room">Kids Room / Play Area</option>
                  <option value="Garage / Storage">Garage / Storage</option>
                  <option value="Bathroom">Bathroom &amp; Vanity</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                    Organizing Style
                  </span>
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-medium text-stone-800 focus:border-teal-500 focus:outline-hidden dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200"
                >
                  <option value="Balanced, functional & calming">Balanced &amp; Functional</option>
                  <option value="Minimalist Zen (Clean empty surfaces)">Minimalist Zen (Clear Surfaces)</option>
                  <option value="KonMari Joy-Check (Sentiment & joy)">KonMari Method (Joy-Checked)</option>
                  <option value="15-Minute Rapid Sprint (Quick wins only)">15-Minute Sprint (High Impact)</option>
                  <option value="Budget-Friendly Storage Hacks">Budget DIY Storage Hacks</option>
                  <option value="Family / Kid-Proof Systems">Family / Kid-Friendly Systems</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                    Core Goal
                  </span>
                </label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-medium text-stone-800 focus:border-teal-500 focus:outline-hidden dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200"
                >
                  <option value="Clear visual clutter and create sustainable storage systems">Clear visual clutter &amp; create systems</option>
                  <option value="Rapid triage: What to keep, donate, and toss">Purge &amp; Donate: Declutter duplicate items</option>
                  <option value="Ergonomic layout & furniture positioning">Ergonomic layout &amp; spatial flow</option>
                  <option value="Daily 2-minute reset habit creation">Create a 2-minute daily reset habit</option>
                </select>
              </div>
            </div>

            {/* Action Button & Analyzing Indicator */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleStartAnalysis}
                disabled={isAnalyzing}
                className={`w-full relative flex items-center justify-center gap-2 rounded-xl py-3.5 px-6 text-sm font-bold text-white shadow-md transition-all active:scale-[0.99] ${
                  isAnalyzing
                    ? 'bg-teal-700 cursor-wait opacity-90'
                    : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-teal-600/20'
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>{analysisStep || 'Analyzing Room with Gemini 3.5 Flash...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Analyze Room &amp; Generate Declutter Plan (Gemini 3.5 Flash)</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              {isAnalyzing && (
                <div className="mt-3 rounded-lg bg-teal-50 p-3 text-center dark:bg-teal-950/40">
                  <p className="text-xs font-medium text-teal-800 dark:text-teal-200">
                    {analysisStep}
                  </p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-teal-200/60 dark:bg-teal-900">
                    <div className="h-full w-2/3 animate-pulse rounded-full bg-teal-600" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Feature Value Props */}
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-start gap-3 rounded-xl border border-stone-200/70 bg-white/60 p-4 dark:border-stone-800 dark:bg-stone-900/60">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">
              Hotspot Detection
            </h4>
            <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
              Pinpoints exact clutter sources (cable nests, paper drifts, overflowing bins) with 2-minute rapid relief fixes.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-stone-200/70 bg-white/60 p-4 dark:border-stone-800 dark:bg-stone-900/60">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">
              Keep / Donate / Toss Matrix
            </h4>
            <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
              Get an objective, guilt-free triage breakdown of what to retain, rehome, or recycle without decision fatigue.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-stone-200/70 bg-white/60 p-4 dark:border-stone-800 dark:bg-stone-900/60">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">
              Multi-Role Gemini AI Coach
            </h4>
            <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
              Chat across 3 specialized personas: Space Architect (3.1 Pro), Mindful Coach (3.5 Flash), and Sprint Organizer (3.1 Flash-Lite).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
