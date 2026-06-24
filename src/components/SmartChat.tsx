import React, { useState, useRef, useEffect } from "react";
import type { Settings, ChatMessage } from "../types";
import { Send, Mic, MicOff, Volume2, VolumeX, RefreshCw, Bot, AlertTriangle } from "lucide-react";

interface SmartChatProps {
  settings: Settings;
  chatHistory: ChatMessage[];
  onAddChatMessage: (msg: ChatMessage) => void;
  onClearChat: () => void;
}

export const SmartChat: React.FC<SmartChatProps> = ({
  settings,
  chatHistory,
  onAddChatMessage,
  onClearChat,
}) => {
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [activeSpeechId, setActiveSpeechId] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

  const systemPrompt =
    "You are a helpful and simple plant care and object information assistant. Keep answers concise and friendly, similar to a knowledgeable expert giving quick tips.";

  // Scroll to bottom on updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onstart = () => setIsListening(true);
      rec.onend = () => setIsListening(false);
      rec.onerror = (e: any) => {
        console.error("Speech recognition error:", e);
        setIsListening(false);
      };
      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText((prev) => (prev ? prev + " " + transcript : transcript));
        }
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Toggle Voice Typing
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Try Chrome or Safari.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  // Text-To-Speech
  const speakMessage = (messageId: string, text: string) => {
    if ("speechSynthesis" in window) {
      if (activeSpeechId === messageId) {
        window.speechSynthesis.cancel();
        setActiveSpeechId(null);
        return;
      }

      window.speechSynthesis.cancel();
      
      const cleanText = text.replace(/[^a-zA-Z0-9\s.,?!]/g, "");
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.onend = () => setActiveSpeechId(null);
      utterance.onerror = () => setActiveSpeechId(null);

      setActiveSpeechId(messageId);
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-speech is not supported in your browser.");
    }
  };

  // Handle Send Chat
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = inputText.trim();
    if (!query || isSending) return;

    if (!settings.geminiApiKey) {
      alert("🚨 API Key Required! Please configure your Gemini API Key in the Settings tab.");
      return;
    }

    const userMsgId = Date.now().toString();
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    onAddChatMessage(userMsg);
    setInputText("");
    setIsSending(true);

    try {
      const modelName = settings.selectedModel || "gemini-2.5-flash";
      const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${settings.geminiApiKey}`;

      const contentsPayload = chatHistory.concat(userMsg).map((msg) => ({
        role: msg.sender === "user" ? "user" : "model",
        parts: [{ text: msg.text }],
      }));

      const payload = {
        contents: contentsPayload,
        systemInstruction: { parts: [{ text: systemPrompt }] },
      };

      const response = await fetch(apiURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP Error status ${response.status}`);
      }

      const result = await response.json();
      const botText = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (botText) {
        onAddChatMessage({
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: botText,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });
      } else {
        throw new Error("No clear text candidate generated.");
      }
    } catch (err) {
      console.error("Chat Error:", err);
      onAddChatMessage({
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: "🚨 Connection failed: I could not reach the Gemini services. Verify your API key or network connection.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isError: true,
      });
    } finally {
      setIsSending(false);
    }
  };

  const renderMessageText = (text: string) => {
    const paragraphs = text.split("\n\n").filter((p) => p.trim() !== "");
    return paragraphs.map((p, idx) => {
      let formatted = p.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      if (formatted.startsWith("- ") || formatted.startsWith("* ")) {
        const items = formatted.split(/\n[*-] /);
        return (
          <ul key={idx} className="list-disc pl-5 space-y-1 mb-2" style={{ paddingLeft: "16px", marginBottom: "8px", listStyleType: "disc" }}>
            {items.map((item, i) => (
              <li
                key={i}
                dangerouslySetInnerHTML={{
                  __html: item.replace(/^[*-]\s+/, "").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
                }}
              />
            ))}
          </ul>
        );
      }
      return (
        <p
          key={idx}
          className="mb-2 leading-relaxed"
          style={{ marginBottom: "8px" }}
          dangerouslySetInnerHTML={{ __html: formatted }}
        />
      );
    });
  };

  return (
    <div className="chat-layout animate-fadeIn">
      {/* Top Panel Header */}
      <div className="chat-header">
        <div>
          <h2 className="section-title font-orbitron">LeafGuard Advisor Chat</h2>
          <p className="section-desc" style={{ marginBottom: 0 }}>Consult botanical guidelines, ask crop diagnostic queries, or get fertilizing advice.</p>
        </div>
        {chatHistory.length > 0 && (
          <button onClick={onClearChat} className="cyber-btn-outline" style={{ fontSize: "0.7rem", padding: "6px 12px" }}>
            Clear Logs
          </button>
        )}
      </div>

      {/* API Alert */}
      {!settings.geminiApiKey && (
        <div className="alert-card animate-pulse">
          <AlertTriangle className="flex-shrink-0" size={18} style={{ marginTop: "2px" }} />
          <div>
            <h4 className="alert-title">API CONFIGURATION REQUIRED</h4>
            <p className="alert-desc">
              The chatbot requires an API Key to respond. Please insert your key in the <strong>Settings</strong> tab.
            </p>
          </div>
        </div>
      )}

      {/* Conversations log */}
      <div className="cyber-card chat-messages">
        {chatHistory.length === 0 ? (
          <div className="loader-container" style={{ color: "var(--text-muted)", opacity: 0.5 }}>
            <Bot size={48} style={{ color: "var(--neon-blue)", animation: "bounce 2s infinite", marginBottom: "12px" }} />
            <h4 className="font-orbitron" style={{ fontSize: "0.85rem", fontWeight: "700" }}>LEAFGUARD AI ONLINE</h4>
            <p style={{ fontSize: "0.75rem", maxWidth: "280px" }}>
              Hello! I am your LeafGuard AI agricultural model. Ask questions like "how to treat rust on wheat?" or "soil pH requirements for tomatoes" to begin.
            </p>
          </div>
        ) : (
          chatHistory.map((msg) => {
            const isUser = msg.sender === "user";
            const speechActive = activeSpeechId === msg.id;

            return (
              <div key={msg.id} className={`chat-bubble-container ${isUser ? "user" : "bot"}`}>
                <div className="chat-bubble-row" style={{ flexDirection: isUser ? "row-reverse" : "row" }}>
                  {!isUser && (
                    <button
                      onClick={() => speakMessage(msg.id, msg.text)}
                      className={`msg-speaker-btn ${speechActive ? "active" : ""}`}
                      title={speechActive ? "Mute Output" : "Speak Response"}
                    >
                      {speechActive ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    </button>
                  )}

                  <div className={`message-bubble bot-formatted ${isUser ? "user-bubble" : "bot-bubble"} ${msg.isError ? "bg-rose-950/20 border-rose-500/30 text-rose-400" : ""}`} style={{ maxWidth: "100%" }}>
                    {renderMessageText(msg.text)}
                  </div>
                </div>
                <span className="message-time">{msg.timestamp}</span>
              </div>
            );
          })
        )}

        {isSending && (
          <div className="chat-bubble-container bot">
            <div className="chat-bubble-row">
              <div className="message-bubble bot-bubble" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <RefreshCw size={12} className="animate-spin" style={{ color: "var(--neon-blue)" }} />
                <span className="font-orbitron" style={{ fontSize: "0.75rem", color: "var(--neon-blue)", fontWeight: "600" }}>
                  ASSISTANT IS THINKING...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input panel bar */}
      <form onSubmit={handleSend} className="chat-input-row">
        <button
          type="button"
          onClick={toggleListening}
          className={`voice-input-btn ${isListening ? "active" : ""}`}
          title={isListening ? "Listening... click to pause" : "Voice typing dictation"}
        >
          {isListening ? <MicOff size={18} /> : <Mic size={18} />}
        </button>

        <input
          type="text"
          placeholder="Ask something about plant care, identification, or general tips..."
          className="cyber-input"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isSending}
        />

        <button type="submit" className="cyber-btn" style={{ padding: "0 24px" }} disabled={isSending || !inputText.trim()}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};
