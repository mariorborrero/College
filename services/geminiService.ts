
import { GoogleGenAI, Type, SchemaType } from "@google/genai";
import { ChatMessage, FeedbackPoint, OutlineItem } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const MODEL_FLASH = 'gemini-2.5-flash';

export const getBrainstormResponse = async (
  history: ChatMessage[],
  topic: string,
  lastUserMessage: string
): Promise<string> => {
  try {
    // Construct a prompt that encourages Socratic questioning
    const systemInstruction = `You are a wise, encouraging writing mentor in a fantasy adventure setting. 
    The student is writing an essay on "${topic}". 
    Your goal is to help them BRAINSTORM ideas. 
    Do NOT write the essay for them. 
    Ask probing questions to help them develop a thesis. 
    Keep responses concise (under 100 words) and conversational. 
    Adopt a slight fantasy RPG tone (e.g., "Adventurer", "Quest").`;

    const context = history.map(h => `${h.role === 'user' ? 'Student' : 'Mentor'}: ${h.text}`).join('\n');
    const prompt = `${context}\nStudent: ${lastUserMessage}\nMentor:`;

    const response = await ai.models.generateContent({
      model: MODEL_FLASH,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    return response.text || "The spirits are silent... try asking again.";
  } catch (error) {
    console.error("Gemini Brainstorm Error:", error);
    return "I'm having trouble connecting to the wisdom of the ancients. Please try again.";
  }
};

export const extractOutlineIdeas = async (
  topic: string,
  history: ChatMessage[]
): Promise<string[]> => {
  try {
    if (history.length === 0) return [];

    const context = history.map(h => `${h.role}: ${h.text}`).join('\n');
    const prompt = `
      Topic: ${topic}
      Conversation History:
      ${context}

      Based on this conversation, extract 3 to 5 key ideas, arguments, or themes that the student discussed.
      These will be used as "building blocks" for their outline.
      Return them as a simple JSON array of strings.
      Keep each string concise (under 10 words).
    `;

    const response = await ai.models.generateContent({
      model: MODEL_FLASH,
      contents: prompt,
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
    return JSON.parse(text) as string[];
  } catch (error) {
    console.error("Gemini Extraction Error", error);
    return ["Main Argument", "Supporting Evidence", "Counter Argument"];
  }
};

export const generateOutlineFeedback = async (
  topic: string, 
  currentPoints: OutlineItem[]
): Promise<string> => {
  try {
    const pointsText = currentPoints.map((p, i) => `${i + 1}. ${p.title}: ${p.description}`).join('\n');
    const prompt = `
      Topic: ${topic}
      Current Outline:
      ${pointsText}

      Review this outline. Is it logical? Does it flow well? 
      Provide specific, constructive advice on how to improve the structure.
      Do not rewrite it. Just guide.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_FLASH,
      contents: prompt,
      config: {
        systemInstruction: "You are a strategic battle planner (writing tutor). Analyze the student's outline plan.",
      }
    });
    return response.text || "No feedback generated.";
  } catch (error) {
    console.error("Gemini Outline Error", error);
    return "Could not analyze the battle plan.";
  }
};

export const generateRefinementFeedback = async (
  draft: string,
  topic: string,
  goals: any
): Promise<FeedbackPoint[]> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_FLASH,
      contents: `Draft text: "${draft}"\n\nTopic: ${topic}\nGoals: ${JSON.stringify(goals)}`,
      config: {
        systemInstruction: `You are a wise editor. Analyze the student's draft. 
        Identify 3-5 key points of feedback: Strengths, Areas for Improvement, or Specific Suggestions.
        Focus on flow, clarity, and argumentation. Do NOT rewrite the text.
        Return the result as a JSON object matching the schema.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, enum: ["strength", "improvement", "suggestion"] },
              text: { type: Type.STRING },
              area: { type: Type.STRING, description: "The specific part of writing involved (e.g. 'Intro', 'Transition', 'Vocabulary')" }
            },
            required: ["type", "text", "area"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text) as FeedbackPoint[];
  } catch (error) {
    console.error("Gemini Refine Error", error);
    return [{ type: 'suggestion', text: "Could not connect to analysis server.", area: "System" }];
  }
};
