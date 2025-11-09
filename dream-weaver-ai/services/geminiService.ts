import { GoogleGenAI } from "@google/genai";
import { type ChatMessage, type DreamAnalysisResult } from "../types";

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export async function generateDreamAnalysis(transcript: string): Promise<DreamAnalysisResult> {
  try {
    const interpretationPromise = ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a dream analyst specializing in Jungian psychology. Analyze the following dream transcript. Provide a structured interpretation focusing on archetypes, symbols, and the dreamer's potential emotional state. Structure your response in Markdown with clear headings for 'Core Emotional Theme', 'Key Symbols & Archetypes', and 'Potential Meaning'. Dream: "${transcript}"`
    });

    const imagePromise = ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: `Create a surrealist, dream-like painting representing the core emotional theme of the following dream. Focus on symbolism and abstract concepts over literal depiction. Do not include any text or words in the image. Dream: "${transcript}"`,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/png',
        aspectRatio: '1:1',
      }
    });

    const [interpretationResponse, imageResponse] = await Promise.all([interpretationPromise, imagePromise]);
    
    const interpretation = interpretationResponse.text;
    const base64ImageBytes = imageResponse.generatedImages[0].image.imageBytes;
    const imageUrl = `data:image/png;base64,${base64ImageBytes}`;

    if (!interpretation || !imageUrl) {
        throw new Error('Failed to get complete analysis from API.');
    }

    return { imageUrl, interpretation };
  } catch (error) {
    console.error("Error in generateDreamAnalysis:", error);
    throw new Error("Failed to generate dream analysis.");
  }
}

export async function getChatResponse(transcript: string, interpretation: string, history: ChatMessage[]): Promise<string> {
  try {
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: `You are a helpful assistant specializing in dream interpretation, continuing a conversation about a specific dream. Your task is to answer the user's follow-up questions about symbols and themes.
        ---
        ORIGINAL DREAM: "${transcript}"
        ---
        INITIAL INTERPRETATION: "${interpretation}"
        ---
        Now, answer the user's question based on this context.`,
      }
    });

    // The chat SDK expects messages in a specific format. Since we only have one user message to send,
    // we take the last message from our history.
    const lastUserMessage = history[history.length - 1];

    if (lastUserMessage.role !== 'user') {
        throw new Error("Last message in history is not from the user");
    }

    const response = await chat.sendMessage({ message: lastUserMessage.text });

    return response.text;
  } catch (error) {
    console.error("Error in getChatResponse:", error);
    throw new Error("Failed to get chat response.");
  }
}
