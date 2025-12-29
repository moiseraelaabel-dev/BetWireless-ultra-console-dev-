
import { GoogleGenAI, Type } from "@google/genai";
import { PredictionResult, DataPoint, SportsPrediction, CategorizedSportsPredictions } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Persistent cache to minimize API hits
let cachedSportsData: CategorizedSportsPredictions | null = null;
let lastSportsFetchTime = 0;
const CACHE_DURATION = 600000; // 10 minutes cache for global sports

// Rate limit protection: Prevent rapid-fire market predictions
let lastMarketPredictionTime = 0;
const MARKET_COOLDOWN = 15000; // 15 seconds cooldown between manual scans

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 4, initialDelay = 10000): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorMsg = error?.message || "";
      const isRateLimit = errorMsg.includes('429') || error?.status === 429 || errorMsg.includes('RESOURCE_EXHAUSTED');
      const isServerError = error?.status >= 500;

      if (isRateLimit || isServerError) {
        // High backoff for 429s to allow quota to reset
        const multiplier = isRateLimit ? 4 : 2;
        const delay = initialDelay * Math.pow(multiplier, i);
        console.warn(`API Quota Busy (${isRateLimit ? '429' : '5xx'}). Intelligent Backoff: ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export const getMarketPrediction = async (recentData: DataPoint[], marketNode: string = "Betway Botswana"): Promise<PredictionResult> => {
  const now = Date.now();
  if (now - lastMarketPredictionTime < MARKET_COOLDOWN) {
    throw new Error("Local Rate Limit: Please wait for node synchronization before next scan.");
  }
  
  return withRetry(async () => {
    try {
      const dataString = recentData.map(d => `[${d.time}: ${d.value}]`).join(', ');
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze this market trend data for the "${marketNode}" Aviator/Crash game. 
        Current Node: ${marketNode}. Focus on specific server patterns for this provider. 
        Predict the next crash multiplier and the exact delay (seconds from now).
        Recent values: ${dataString}. 
        Return JSON: {direction: 'UP'|'DOWN', confidence: 0-100, reasoning: string, multiplier: number, delaySeconds: number}.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              direction: { type: Type.STRING, enum: ['UP', 'DOWN', 'NEUTRAL'] },
              confidence: { type: Type.NUMBER },
              reasoning: { type: Type.STRING },
              multiplier: { type: Type.NUMBER },
              delaySeconds: { type: Type.NUMBER }
            },
            required: ['direction', 'confidence', 'reasoning', 'multiplier', 'delaySeconds']
          }
        }
      });

      lastMarketPredictionTime = Date.now();
      const text = response.text || '{}';
      const result = JSON.parse(text.trim());
      
      const crashTime = new Date();
      crashTime.setSeconds(crashTime.getSeconds() + (result.delaySeconds || 30));

      return {
        id: Math.random().toString(36).substring(2, 9),
        ...result,
        marketNode,
        timeRemaining: result.delaySeconds,
        timestamp: crashTime.toLocaleTimeString('en-GB', { timeZone: 'Africa/Gaborone', hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };
    } catch (error) {
      console.error("Gemini Prediction Error:", error);
      throw error;
    }
  }, 2, 15000).catch((e) => ({
    id: 'error-' + Date.now(),
    direction: 'NEUTRAL',
    confidence: 0,
    reasoning: e.message.includes('Local Rate Limit') 
      ? e.message 
      : "Node connection exhausted. Regional clusters are under heavy load. Please wait 30 seconds for automatic retry.",
    timestamp: "--:--"
  }));
};

export const getSportsPrediction = async (userInput: string): Promise<SportsPrediction> => {
  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Perform deep football analysis for Betway Botswana: "${userInput}". 
      Return strictly JSON with full metrics.`,
      config: {
        responseMimeType: "application/json"
      }
    });
    return JSON.parse(response.text || '{}');
  });
};

export const refreshGlobalSportsMarkets = async (): Promise<CategorizedSportsPredictions> => {
    // Check cache first to avoid unnecessary hits
    const now = Date.now();
    if (cachedSportsData && (now - lastSportsFetchTime < CACHE_DURATION)) {
      return cachedSportsData;
    }

    return withRetry(async () => {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: "Scan global markets. For live matches, include real-time scores and 1X2 odds. Return JSON: {live:[{match:string, league:string, score:string, odds:{home:number, draw:number, away:number}, minute:number}], upcoming:[], highlighted:[]}",
            config: { responseMimeType: "application/json" }
        });
        const result = JSON.parse(response.text || '{ "live": [], "upcoming": [], "highlighted": [] }');
        cachedSportsData = result;
        lastSportsFetchTime = Date.now();
        return result;
    }, 2, 20000); // Very patient backoff for global sync
};

export const analyzeCrashImage = async (base64Image: string, textPrompt: string): Promise<string> => {
  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Image.split(',')[1], mimeType: 'image/jpeg' } },
          { text: `Analyze Aviator image. User says: "${textPrompt}". Identify multipliers and trends.` }
        ]
      }
    });
    return response.text || "Analysis result unavailable.";
  });
};
