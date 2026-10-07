export interface Hotspot {
  id: string;
  name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  primaryItems: string[];
  quickFix: string;
  approxLocation: string;
  coordinates?: {
    x: number; // percentage 0-100
    y: number; // percentage 0-100
  };
}

export interface TaskItem {
  id: string;
  action: string;
  tips: string;
  estimatedMinutes: number;
  completed?: boolean;
}

export interface DeclutterPhase {
  phaseNumber: number;
  phaseTitle: string;
  goal: string;
  tasks: TaskItem[];
}

export interface TriageMatrix {
  keep: string[];
  donateOrSell: string[];
  recycleOrTrash: string[];
  relocate: string[];
}

export interface StorageSolution {
  category: string;
  recommendation: string;
  whyItHelps: string;
  budgetFriendlyDiyAlt: string;
}

export interface RoomAnalysisResult {
  roomType: string;
  roomSummary: string;
  clutterScore: number; // 1-100
  calmnessRating: string;
  estimatedTimeMinutes: number;
  hotspots: Hotspot[];
  declutterPhases: DeclutterPhase[];
  triageMatrix: TriageMatrix;
  recommendedStorageSolutions: StorageSolution[];
  dailyMaintenanceHabit: string;
  motivationalSummary?: string;
}

export type ChatRole = 'architect' | 'coach' | 'sprint';

export type ChatModel = 'gemini-3.5-flash' | 'gemini-3.1-flash-lite' | 'gemini-3.8-flash' | 'gemini-3.1-pro-preview';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  modelUsed?: ChatModel;
  roleUsed?: ChatRole;
}

export interface SampleRoom {
  id: string;
  title: string;
  roomType: string;
  description: string;
  imageUrl: string;
  clutterPreviewScore: number;
  tag: string;
}
