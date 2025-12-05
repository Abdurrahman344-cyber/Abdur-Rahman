import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { UserSettings } from "../types";

const getAiClient = () => {
    // Always create a new instance to pick up potential key changes (for Veo)
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const sendMessageToGemini = async (
  prompt: string,
  settings: UserSettings,
  history: { role: string; parts: { text: string }[] }[]
): Promise<string> => {
  const ai = getAiClient();
  
  // Choose model based on settings
  const model = settings.useDeepThinking ? 'gemini-3-pro-preview' : 'gemini-2.5-flash';
  
  const config: any = {
    systemInstruction: "You are a helpful assistant in a chat application. Keep responses concise unless asked for detail.",
  };

  if (settings.useDeepThinking) {
    config.thinkingConfig = { thinkingBudget: 32768 };
    // DO NOT set maxOutputTokens when using thinkingBudget logic for Gemini 3 Pro as per instructions
  }

  try {
    const chat = ai.chats.create({
      model: model,
      config: config,
      history: history
    });

    const response: GenerateContentResponse = await chat.sendMessage({ message: prompt });
    return response.text || "No response text generated.";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    throw error;
  }
};

export const generateVeoVideo = async (
  prompt: string,
  imageBase64: string,
  aspectRatio: '16:9' | '9:16' = '16:9'
): Promise<string> => {
    // Veo requires the user to select their own key first
    if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
            if (window.aistudio.openSelectKey) {
                await window.aistudio.openSelectKey();
            } else {
                throw new Error("API Key selection not available.");
            }
        }
    }

    const ai = getAiClient();
    
    try {
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt || "Animate this image",
            image: {
                imageBytes: imageBase64,
                mimeType: 'image/png', // Assuming PNG for simplicity, can detect from header
            },
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: aspectRatio
            }
        });

        // Poll for completion
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // 5s poll
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!videoUri) throw new Error("Video generation failed or returned no URI.");

        // Append key for download
        return `${videoUri}&key=${process.env.API_KEY}`;
    } catch (error) {
        console.error("Veo Error:", error);
        throw error;
    }
};