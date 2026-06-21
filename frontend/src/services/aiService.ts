import { api } from "@/services/apiClient";

export const aiService = {
  chat(message: string, history: Array<{ role: "user" | "assistant"; content: string }> = []) {
    return api.post<{ reply: string }>("/ai/chat", { message, history });
  },
};
