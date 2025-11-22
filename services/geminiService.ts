import { GoogleGenAI, Type } from "@google/genai";
import { Objective, KeyResult, JournalEntry, AIUpdateSuggestion } from "../types";

const apiKey = process.env.API_KEY || '';

// Helper to check if API key exists without throwing immediately, handled in UI
const getAI = () => {
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const suggestKeyResults = async (objectiveTitle: string): Promise<string[]> => {
  const ai = getAI();
  if (!ai) return ["Set specific target", "Achieve milestone X", "Maintain metric Y"];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Suggest 3 measurable Key Results (KRs) for the following personal objective: "${objectiveTitle}". Return only the text of the KRs.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating KRs:", error);
    return [];
  }
};

export const analyzeJournalEntry = async (content: string, mood: number, energy: number): Promise<string> => {
  const ai = getAI();
  if (!ai) return "Keep going! Reflection is key to progress.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
        Analyze this journal entry: "${content}".
        The user reported Mood: ${mood}/10 and Energy: ${energy}/10.
        Provide a short, supportive, and insightful feedback summary (max 3 sentences).
        Focus on patterns or encouragement.
      `,
    });
    return response.text || "Great entry!";
  } catch (error) {
    console.error("Error analyzing journal:", error);
    return "Unable to generate insight at this moment.";
  }
};

export const draftJournalFromSchedule = async (schedule: string): Promise<string> => {
  const ai = getAI();
  if (!ai) return "";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
        Role: You are a thoughtful personal assistant helping the user reflect on their day.
        Task: Draft a daily journal entry based on the user's schedule/agenda for the day.
        
        User's Schedule:
        "${schedule}"
        
        Instructions:
        1. Write in the first person ("I").
        2. Create a narrative flow of the day based on the events.
        3. For each key event/meeting, add a reflective placeholder or question about how it went (e.g., "The 10am sync with the team was [productive/challenging]...").
        4. Keep the tone natural, reflective, and slightly structured.
        5. Do not invent specific outcomes or decisions, just frame the entry around the events occurring.
        6. Keep it under 200 words.
      `,
    });
    return response.text || "";
  } catch (error) {
    console.error("Error drafting journal from schedule:", error);
    return "";
  }
};

export const suggestOKRUpdates = async (
  entryContent: string,
  objectives: Objective[]
): Promise<AIUpdateSuggestion[]> => {
  const ai = getAI();
  if (!ai) return [];

  // Simplify objectives for the prompt to save tokens and reduce noise
  const simpleOkrs = objectives.map(o => ({
    id: o.id,
    title: o.title,
    krs: o.keyResults.map(k => ({
      id: k.id,
      title: k.title,
      current: k.currentValue,
      target: k.targetValue,
      unit: k.unit
    }))
  }));

  try {
    const prompt = `
      Based on the user's journal entry below, detect if they made progress on any of their Key Results.
      
      Journal Entry: "${entryContent}"
      
      Current OKRs:
      ${JSON.stringify(simpleOkrs, null, 2)}
      
      Return a list of suggestions where the 'suggestedValue' is the NEW TOTAL value (not just the increment).
      If no clear progress is detected, return an empty array.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              objectiveId: { type: Type.STRING },
              keyResultId: { type: Type.STRING },
              suggestedValue: { type: Type.NUMBER },
              reasoning: { type: Type.STRING }
            },
            required: ["objectiveId", "keyResultId", "suggestedValue", "reasoning"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("Error suggesting updates:", error);
    return [];
  }
};

export const generateInsights = async (entries: JournalEntry[], objectives: Objective[]): Promise<string> => {
  const ai = getAI();
  if (!ai) return "Connect API Key for insights.";

  const recentEntries = entries.slice(0, 5); // Analyze last 5 entries

  try {
      const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `
            Analyze the last 5 journal entries and current OKR progress.
            Identify one major positive trend and one area for improvement.
            Keep it concise.
            
            Entries: ${JSON.stringify(recentEntries.map(e => ({date: e.date, mood: e.mood, text: e.content})))}
            OKR Progress: ${JSON.stringify(objectives.map(o => ({title: o.title, progress: o.progress})))}
          `
      });
      return response.text || "No insights available.";
  } catch (e) {
      return "Unable to generate insights.";
  }
}