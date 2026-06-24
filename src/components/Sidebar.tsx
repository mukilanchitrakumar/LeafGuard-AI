import React from "react";
import type { User } from "../types";
import { Camera, MessageSquare, History as HistoryIcon, Settings as SettingsIcon, LogOut, User as UserIcon } from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
}) => {
  const tabs = [
    { id: "analyzer", label: "Vision Analyzer", icon: <Camera size={18} /> },
    { id: "chat", label: "Smart Chatbot", icon: <MessageSquare size={18} /> },
    { id: "history", label: "Scan History", icon: <HistoryIcon size={18} /> },
    { id: "settings", label: "Settings", icon: <SettingsIcon size={18} /> },
  ];

  return (
    <aside className="cyber-card sidebar-container">
      {/* Title */}
      <div className="sidebar-logo">
        <span>🌿</span>
        <h2 className="cyber-title text-xl tracking-wider" style={{ fontSize: "1.1rem" }}>
          LEAFGUARD AI
        </h2>
      </div>

      {/* Tabs */}
      <nav className="sidebar-nav">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`sidebar-tab-btn ${isActive ? "active" : ""}`}
            >
              {tab.icon}
              <span className="font-orbitron" style={{ fontSize: "0.8rem", letterSpacing: "0.5px" }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="sidebar-user">
        <div className="user-profile-row">
          <div className="user-avatar">
            <UserIcon size={18} />
          </div>
          <div className="user-info">
            <span className="user-name">{currentUser.name}</span>
            <span className="user-email">{currentUser.email}</span>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="cyber-btn-rose-outline"
          style={{ width: "100%", fontSize: "0.75rem", padding: "8px 16px" }}
        >
          <LogOut size={12} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};
