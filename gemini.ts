import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API with your API Key
// Note: In a production environment, use environment variables
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "YOUR_API_KEY_HERE";
const genAI = new GoogleGenerativeAI(API_KEY);

export const getAICounseling = async (prompt: string, history: { role: string; parts: { text: string }[] }[] = []) => {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: "You are Pragyan AI, a world-class educational tutor. Your goal is to help students understand complex concepts by breaking them down into simple terms. Be encouraging, clear, and always provide examples."
    });

    const chat = model.startChat({
      history: history,
    });

    const result = await chat.sendMessage(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "I'm sorry, I'm having trouble connecting to my brain right now. Please try again later!";
  }
};