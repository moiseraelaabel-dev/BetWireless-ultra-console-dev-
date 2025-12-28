
import { GoogleGenAI, Type } from "@google/genai";
import { PredictionResult, DataPoint, SportsPrediction, CategorizedSportsPredictions } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, initialDelay = 1000): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const isRateLimit = error?.message?.includes('429') || error?.status === 429 || error?.message?.includes('RESOURCE_EXHAUSTED');
      const isServerError = error?.status >= 500;

      if (isRateLimit || isServerError) {
        const delay = initialDelay * Math.pow(2, i);
        console.warn(`API Error (${isRateLimit ? '429' : '5xx'}). Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export const getMarketPrediction = async (recentData: DataPoint[], marketNode: string = "Betway Botswana"): Promise<PredictionResult> => {
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
  }).catch(() => ({
    id: 'error-' + Date.now(),
    direction: 'NEUTRAL',
    confidence: 0,
    reasoning: "Node connection exhausted. Regional clusters are under heavy load. Please wait 30 seconds for automatic retry.",
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
    return withRetry(async () => {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: "Scan global markets. Return JSON: {live:[], upcoming:[], highlighted:[]}",
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || '{ "live": [], "upcoming": [], "highlighted": [] }');
    });
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
