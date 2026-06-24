import { useState, useEffect } from "react";
import type { User, ChatMessage, HistoryItem, Settings as SettingsType } from "./types";
import { Auth } from "./components/Auth";
import { Sidebar } from "./components/Sidebar";
import { VisualAnalyzer } from "./components/VisualAnalyzer";
import { SmartChat } from "./components/SmartChat";
import { History } from "./components/History";
import { Settings } from "./components/Settings";

function App() {
  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // App settings state
  const [settings, setSettings] = useState<SettingsType>({
    geminiApiKey: "",
    selectedModel: "gemini-2.5-flash",
  });

  // Chat & visual scan logs history state
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState("analyzer");

  // Load user session and state on mount
  useEffect(() => {
    const sessionUser = localStorage.getItem("currentUserSession");
    if (sessionUser) {
      try {
        setCurrentUser(JSON.parse(sessionUser));
      } catch (err) {
        console.error("Error restoring user session", err);
      }
    }

    const savedSettings = localStorage.getItem("vi_assistant_settings");
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (err) {
        console.error("Error reading settings", err);
      }
    }

    const savedHistory = localStorage.getItem("vi_assistant_history");
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (err) {
        console.error("Error reading scan history", err);
      }
    }

    const savedChat = localStorage.getItem("vi_assistant_chat");
    if (savedChat) {
      try {
        setChatHistory(JSON.parse(savedChat));
      } catch (err) {
        console.error("Error reading chat history", err);
      }
    }
  }, []);

  // Handlers for authentication
  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem("currentUserSession", JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("currentUserSession");
  };

  // Handler for settings update
  const handleSaveSettings = (newSettings: SettingsType) => {
    setSettings(newSettings);
    localStorage.setItem("vi_assistant_settings", JSON.stringify(newSettings));
  };

  // Handlers for history log
  const handleAddHistoryItem = (item: HistoryItem) => {
    const updated = [item, ...history];
    setHistory(updated);
    localStorage.setItem("vi_assistant_history", JSON.stringify(updated));
  };

  const handleDeleteHistoryItem = (id: string) => {
    const updated = history.filter((item) => item.id !== id);
    setHistory(updated);
    localStorage.setItem("vi_assistant_history", JSON.stringify(updated));
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.setItem("vi_assistant_history", JSON.stringify([]));
  };

  // Handlers for chatbot memory
  const handleAddChatMessage = (msg: ChatMessage) => {
    const updated = [...chatHistory, msg];
    setChatHistory(updated);
    localStorage.setItem("vi_assistant_chat", JSON.stringify(updated));
  };

  const handleClearChat = () => {
    setChatHistory([]);
    localStorage.setItem("vi_assistant_chat", JSON.stringify([]));
  };

  // If user is not authorized, show Auth screen
  if (!currentUser) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  // Dashboard layout
  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Workspace Frame */}
      <main className="cyber-card dashboard-main">
        {activeTab === "analyzer" && (
          <VisualAnalyzer settings={settings} onAddHistoryItem={handleAddHistoryItem} />
        )}
        {activeTab === "chat" && (
          <SmartChat
            settings={settings}
            chatHistory={chatHistory}
            onAddChatMessage={handleAddChatMessage}
            onClearChat={handleClearChat}
          />
        )}
        {activeTab === "history" && (
          <History
            history={history}
            onDeleteHistoryItem={handleDeleteHistoryItem}
            onClearHistory={handleClearHistory}
          />
        )}
        {activeTab === "settings" && (
          <Settings settings={settings} onSaveSettings={handleSaveSettings} />
        )}
      </main>
    </div>
  );
}

export default App;
