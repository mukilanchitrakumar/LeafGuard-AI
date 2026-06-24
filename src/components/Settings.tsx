import React, { useState, useEffect } from "react";
import type { Settings as SettingsType } from "../types";
import { Key, Bot, Save, ShieldAlert, Trash2 } from "lucide-react";

interface SettingsProps {
  settings: SettingsType;
  onSaveSettings: (settings: SettingsType) => void;
}

export const Settings: React.FC<SettingsProps> = ({ settings, onSaveSettings }) => {
  const [apiKey, setApiKey] = useState(settings.geminiApiKey);
  const [model, setModel] = useState(settings.selectedModel);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setApiKey(settings.geminiApiKey);
    setModel(settings.selectedModel);
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      geminiApiKey: apiKey.trim(),
      selectedModel: model,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleClearAllData = () => {
    if (
      window.confirm(
        "⚠️ WARNING: This will permanently delete your settings, vision scan history, chatbot logs, and local user data. Are you sure?"
      )
    ) {
      localStorage.clear();
      alert("All local data has been successfully cleared. The application will now reload.");
      window.location.reload();
    }
  };

  return (
    <div className="animate-fadeIn">
      {/* Configuration Header */}
      <div style={{ marginBottom: "24px" }}>
        <h2 className="section-title font-orbitron">Settings & API Gateway</h2>
        <p className="section-desc">Configure your secure access to the Gemini AI vision models.</p>
      </div>

      <div className="two-column-grid" style={{ gridTemplateColumns: "2fr 1fr" }}>
        {/* Core Config Card */}
        <div className="cyber-card" style={{ padding: "24px" }}>
          <h3 className="font-orbitron" style={{ fontSize: "1rem", color: "var(--neon-cyan)", marginBottom: "20px", paddingBottom: "10px", borderBottom: "1px solid rgba(148,163,184,0.1)", display: "flex", alignItems: "center", gap: "8px" }}>
            <Bot size={18} /> API Configuration
          </h3>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">
                <Key size={14} /> Gemini API Key
              </label>
              <input
                type="password"
                placeholder="Enter your Gemini API key (AIzaSy...)"
                className="cyber-input"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                Don't have a key? Get one free at{" "}
                <a
                  href="https://aistudio.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-btn"
                >
                  Google AI Studio
                </a>. Your key is stored locally on your browser.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">
                <Bot size={14} /> Model Selector
              </label>
              <select
                className="cyber-input"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended - Ultra Fast)</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro (High Accuracy - Complex Tasks)</option>
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "8px" }}>
              <button type="submit" className="cyber-btn">
                <Save size={16} /> Save Configuration
              </button>
              {isSaved && (
                <span className="font-orbitron" style={{ fontSize: "0.8rem", color: "#10b981", fontWeight: "600", animation: "pulse 1.5s infinite" }}>
                  ✅ Configuration Saved!
                </span>
              )}
            </div>
          </form>
        </div>

        {/* Security & System Info */}
        <div className="card-column">
          <div className="cyber-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 className="font-orbitron" style={{ fontSize: "0.9rem", color: "#f43f5e", display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid rgba(148,163,184,0.1)", paddingBottom: "10px" }}>
              <ShieldAlert size={16} /> System Operations
            </h3>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: "1.4" }}>
              Use these tools to clean cached local data or reset credentials if you are on a shared computer.
            </p>
            <button
              onClick={handleClearAllData}
              className="cyber-btn-rose-outline"
              style={{ width: "100%", fontSize: "0.8rem" }}
            >
              <Trash2 size={14} />
              Reset & Wipe All Data
            </button>
          </div>

          <div className="cyber-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px", background: "rgba(14, 165, 233, 0.03)", borderColor: "rgba(14, 165, 233, 0.1)" }}>
            <h3 className="font-orbitron" style={{ fontSize: "0.85rem", color: "var(--neon-blue)", fontWeight: "600" }}>🔒 Security Shield</h3>
            <ul style={{ fontSize: "0.75rem", color: "var(--text-muted)", listStyleType: "disc", listStylePosition: "inside", paddingLeft: "4px" }}>
              <li style={{ marginBottom: "6px" }}>API requests are made directly from your browser to Google Generative Language endpoints.</li>
              <li style={{ marginBottom: "6px" }}>No key data is ever sent to intermediate backend servers or third-party databases.</li>
              <li>Local storage encryption is managed by your browser sandbox policies.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
