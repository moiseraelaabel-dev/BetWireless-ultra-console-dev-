
export interface DataPoint {
  time: string;
  value: number;
}

export interface PredictionResult {
  id: string;
  direction: 'UP' | 'DOWN' | 'NEUTRAL';
  confidence: number;
  reasoning: string;
  timestamp: string;
  multiplier?: number;
  timeRemaining?: number;
  isManual?: boolean;
  marketNode?: string;
}

export interface User {
  id: string;
  username: string;
  nodeAccess: 'VIP' | 'ULTRA' | 'ADMIN';
  lastSync: string;
}

export interface MatchHistoryItem {
  opponent: string;
  score: string;
  result: 'W' | 'L' | 'D';
  date: string;
}

export interface SportsPrediction {
  sport: string;
  league: string;
  match: string;
  prediction: string;
  odds: string;
  confidence: number;
  aiFix: string;
  form: string[];
  performanceIndex: number[];
  goalsPerGame: number;
  cleanSheetChance: number;
  history: MatchHistoryItem[];
  squadNodes: { name: string; impact: number }[];
}

export interface CategorizedSportsPredictions {
  live: any[];
  upcoming: any[];
  highlighted: any[];
}

export interface MarketStats {
  accuracy: string;
  winRate: string;
  dailyProfit: string;
  activeUsers: string;
}

export type AppTab = 'AVIATOR' | 'SPORTS' | 'CAMERA' | 'EDIT' | 'TUTORIAL' | 'DEV_HUB';
