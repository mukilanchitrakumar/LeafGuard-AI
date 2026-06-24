export interface User {
  name: string;
  email: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  isError?: boolean;
}

export interface HistoryItem {
  id: string;
  image: string; // Base64 image
  title: string;
  description: string;
  timestamp: string;
}

export interface Settings {
  geminiApiKey: string;
  selectedModel: string;
}
