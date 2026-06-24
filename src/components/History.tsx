import { useState } from "react";
import type { HistoryItem } from "../types";
import { Trash2, Search, Calendar, Eye, X, FileText } from "lucide-react";

interface HistoryProps {
  history: HistoryItem[];
  onDeleteHistoryItem: (id: string) => void;
  onClearHistory: () => void;
}

export const History: React.FC<HistoryProps> = ({
  history,
  onDeleteHistoryItem,
  onClearHistory,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  const filteredHistory = history.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderFormattedText = (text: string) => {
    const paragraphs = text.split("\n\n").filter((p) => p.trim() !== "");
    return paragraphs.map((p, idx) => {
      let formatted = p.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      if (formatted.startsWith("- ") || formatted.startsWith("* ")) {
        const items = formatted.split(/\n[*-] /);
        return (
          <ul key={idx} className="list-disc pl-5 space-y-1 mb-3 text-slate-300" style={{ paddingLeft: "16px", marginBottom: "12px", listStyleType: "disc" }}>
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
          className="mb-3 text-sm text-slate-200 leading-relaxed font-sans"
          style={{ marginBottom: "12px" }}
          dangerouslySetInnerHTML={{ __html: formatted }}
        />
      );
    });
  };

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="history-header">
        <div>
          <h2 className="section-title font-orbitron">LeafGuard Diagnostics Log</h2>
          <p className="section-desc" style={{ marginBottom: 0 }}>Review historical crop logs, plant diagnostics, and LeafGuard insights.</p>
        </div>
        {history.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm("Are you sure you want to delete all saved scan logs?")) {
                onClearHistory();
              }
            }}
            className="cyber-btn-rose-outline"
            style={{ fontSize: "0.75rem", padding: "8px 16px" }}
          >
            Clear History
          </button>
        )}
      </div>

      {/* Filter and search */}
      <div className="search-wrapper" style={{ marginBottom: "24px" }}>
        <span className="search-icon">
          <Search size={18} />
        </span>
        <input
          type="text"
          placeholder="Search items by title or diagnosis details..."
          className="cyber-input search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Grid gallery */}
      {filteredHistory.length === 0 ? (
        <div className="cyber-card" style={{ padding: "48px", textAlign: "center", opacity: 0.5 }}>
          <Calendar size={48} style={{ color: "var(--neon-blue)", opacity: 0.25, margin: "0 auto 16px auto" }} />
          <div>
            <h4 className="font-orbitron" style={{ fontSize: "0.85rem", color: "var(--text-main)", fontWeight: "700" }}>NO DIAGNOSTIC LOGS</h4>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", maxWidth: "280px", margin: "6px auto 0 auto", lineHeight: "1.4" }}>
              {searchQuery ? "No matches found for your query." : "Your LeafGuard inspection timeline is empty. Capture crop images to generate records."}
            </p>
          </div>
        </div>
      ) : (
        <div className="history-grid">
          {filteredHistory.map((item) => (
            <div key={item.id} className="cyber-card history-card">
              {/* Thumbnail */}
              <div className="history-thumb-wrapper">
                <img src={item.image} alt={item.title} className="history-thumb" />
                <div className="history-thumb-overlay">
                  <button
                    onClick={() => setSelectedItem(item)}
                    className="cyber-btn"
                    style={{ fontSize: "0.7rem", padding: "6px 12px" }}
                  >
                    <Eye size={12} /> Open Report
                  </button>
                </div>
              </div>

              {/* Title & Info */}
              <div className="history-info-section">
                <h4 className="history-title" title={item.title}>
                  {item.title}
                </h4>
                <div className="history-date-row">
                  <Calendar size={10} />
                  <span>{item.timestamp}</span>
                </div>
                <p className="history-text-clamp">
                  {item.description.replace(/[*#]/g, "")}
                </p>
              </div>

              {/* Toolbar */}
              <div className="history-actions-row">
                <button
                  onClick={() => setSelectedItem(item)}
                  className="history-btn-small"
                  title="View full text logs"
                >
                  <FileText size={14} />
                </button>
                <button
                  onClick={() => onDeleteHistoryItem(item.id)}
                  className="history-btn-small delete"
                  title="Delete scan record"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Overlay Drawer */}
      {selectedItem && (
        <div className="modal-overlay">
          <div className="cyber-card modal-content-container">
            {/* Modal Header */}
            <div className="modal-header-row">
              <div>
                <h3 className="modal-header-title">{selectedItem.title}</h3>
                <div className="modal-header-date">
                  <Calendar size={10} /> <span>{selectedItem.timestamp}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="modal-close-btn"
                title="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-scroll-body">
              <div className="modal-image-wrapper">
                <img src={selectedItem.image} alt={selectedItem.title} className="modal-image" />
              </div>

              <div className="modal-report-text bot-formatted text-slate-200">
                {renderFormattedText(selectedItem.description)}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              <button
                onClick={() => setSelectedItem(null)}
                className="cyber-btn"
                style={{ fontSize: "0.75rem", padding: "8px 16px" }}
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
