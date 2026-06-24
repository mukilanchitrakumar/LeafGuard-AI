import React, { useState, useRef, useEffect } from "react";
import type { Settings, HistoryItem } from "../types";
import { Camera, Upload, RefreshCw, AlertCircle, Play, Square, Image as ImageIcon } from "lucide-react";

interface VisualAnalyzerProps {
  settings: Settings;
  onAddHistoryItem: (item: HistoryItem) => void;
}

export const VisualAnalyzer: React.FC<VisualAnalyzerProps> = ({
  settings,
  onAddHistoryItem,
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Camera settings states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Prompt settings
  const analysisPrompt =
    "Analyze this image. If it's a plant, identify the plant species, list any visible diseases or issues, and provide three concise care tips. If it is a non-plant object, identify it clearly. Format the output as simple, clear paragraphs with bold headings.";
  const systemPrompt =
    "You are a helpful and simple plant care and object information assistant. Keep answers concise and friendly, similar to a knowledgeable expert giving quick tips.";

  // Fetch camera devices
  useEffect(() => {
    if (isCameraActive) {
      navigator.mediaDevices
        .enumerateDevices()
        .then((devices) => {
          const videoInputs = devices.filter((d) => d.kind === "videoinput");
          setVideoDevices(videoInputs);
          if (videoInputs.length > 0 && !selectedDeviceId) {
            setSelectedDeviceId(videoInputs[0].deviceId);
          }
        })
        .catch((err) => console.error("Error listing cameras:", err));
    }
  }, [isCameraActive]);

  // Start Camera
  const startCamera = async (deviceId?: string) => {
    stopCamera();
    try {
      const constraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : true,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
      setErrorMessage(null);
    } catch (err) {
      console.error("Camera access error:", err);
      setErrorMessage("Could not access camera. Please check permissions.");
      setIsCameraActive(false);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Capture Image
  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setImageSrc(dataUrl);
        stopCamera();
        // Auto analyze
        analyzeImage(dataUrl);
      }
    }
  };

  // File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setImageSrc(base64);
        stopCamera();
        analyzeImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  // API Call to Gemini
  const analyzeImage = async (base64Data: string) => {
    if (!settings.geminiApiKey) {
      setErrorMessage("🚨 API Key Required! Please add your Gemini API Key in the Settings tab.");
      return;
    }

    setIsScanning(true);
    setAnalysisResult(null);
    setErrorMessage(null);

    try {
      const parts = base64Data.split(",");
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
      const rawData = parts[1];

      const modelName = settings.selectedModel || "gemini-2.5-flash";
      const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${settings.geminiApiKey}`;

      const payload = {
        contents: [
          {
            role: "user",
            parts: [
              { text: analysisPrompt },
              { inlineData: { mimeType: mimeType, data: rawData } },
            ],
          },
        ],
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
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (text) {
        setAnalysisResult(text);

        // Detect a title from the first paragraph
        let title = "Visual Analysis";
        const trimmed = text.trim();
        if (trimmed) {
          const lines = trimmed.split("\n").filter((l: string) => l.trim().length > 0);
          if (lines.length > 0) {
            title = lines[0].replace(/[#*:]/g, "").substring(0, 40).trim();
          }
        }

        // Add to history
        const newItem: HistoryItem = {
          id: Date.now().toString(),
          image: base64Data,
          title: title || "Scanned Object/Plant",
          description: text,
          timestamp: new Date().toLocaleString(),
        };
        onAddHistoryItem(newItem);
      } else {
        setErrorMessage("AI Vision Model did not return content. Try another image.");
      }
    } catch (err) {
      console.error("Vision Analysis Error:", err);
      setErrorMessage("Analysis failed. Ensure API key is valid and you are online.");
    } finally {
      setIsScanning(false);
    }
  };

  // Helper to render markdown format simply
  const renderFormattedText = (text: string) => {
    const paragraphs = text.split("\n\n").filter((p) => p.trim() !== "");
    return paragraphs.map((p, idx) => {
      let formatted = p.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      if (formatted.startsWith("- ") || formatted.startsWith("* ")) {
        const items = formatted.split(/\n[*-] /);
        return (
          <ul key={idx} className="list-disc pl-5 space-y-1 mb-3 text-slate-300" style={{ paddingLeft: "20px", marginBottom: "12px", listStyleType: "disc" }}>
            {items.map((item, i) => (
              <li
                key={i}
                style={{ marginBottom: "4px" }}
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
      <div style={{ marginBottom: "24px" }}>
        <h2 className="section-title font-orbitron">LeafGuard Vision Lens</h2>
        <p className="section-desc">
          Upload crop/plant photographs or open your camera lens to analyze health, detect plant diseases, and receive care directions.
        </p>
      </div>

      <div className="two-column-grid">
        {/* Input Panel */}
        <div className="cyber-card analyzer-card">
          <h3 className="font-orbitron" style={{ fontSize: "0.95rem", color: "var(--neon-cyan)", display: "flex", alignItems: "center", justifyContent: "between", width: "100%" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>📸 Image Source Selection</span>
            {isCameraActive && (
              <span style={{ display: "inline-flex", height: "8px", width: "8px", position: "relative", marginLeft: "auto" }}>
                <span style={{ animation: "pulse 1.5s infinite", position: "absolute", borderRadius: "50%", width: "100%", height: "100%", backgroundColor: "#ef4444" }}></span>
              </span>
            )}
          </h3>

          {/* Viewport Frame */}
          <div className="analyzer-viewport scanner-viewport">
            {isScanning && <div className="scanner-laser"></div>}

            {isCameraActive ? (
              <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                <video ref={videoRef} className="camera-preview" playsInline muted></video>
                <div className="camera-overlay-controls">
                  <button onClick={captureImage} className="cyber-btn" style={{ padding: "8px 16px", fontSize: "0.75rem" }}>
                    <Camera size={14} /> Snap Photo
                  </button>
                  <button onClick={stopCamera} className="cyber-btn-rose-outline" style={{ padding: "8px 16px", fontSize: "0.75rem" }}>
                    <Square size={14} /> Stop
                  </button>
                </div>
              </div>
            ) : imageSrc ? (
              <div className="image-preview-group">
                <img src={imageSrc} alt="Preview" className="preview-image" />
                <div className="preview-actions-overlay">
                  <button onClick={() => fileInputRef.current?.click()} className="cyber-btn" style={{ fontSize: "0.75rem", padding: "8px 16px" }}>
                    <Upload size={14} /> Upload New
                  </button>
                  <button onClick={() => startCamera(selectedDeviceId)} className="cyber-btn-outline" style={{ fontSize: "0.75rem", padding: "8px 16px" }}>
                    <Camera size={14} /> Retake
                  </button>
                </div>
              </div>
            ) : (
              <div className="viewport-placeholder">
                <ImageIcon size={48} style={{ opacity: 0.25, color: "var(--neon-blue)", marginBottom: "8px" }} />
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", maxWidth: "200px" }}>
                  Stream your webcam feed or upload an image file.
                </p>
              </div>
            )}
          </div>

          {/* Action Toolbar */}
          <div className="analyzer-toolbar">
            <div className="toolbar-buttons">
              <button
                onClick={() => {
                  stopCamera();
                  fileInputRef.current?.click();
                }}
                className="cyber-btn"
                disabled={isScanning}
              >
                <Upload size={16} /> Upload Image
              </button>
              <button
                onClick={() => startCamera(selectedDeviceId)}
                className="cyber-btn-outline"
                disabled={isScanning}
              >
                <Play size={16} /> Open Web Camera
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
            </div>

            {/* Camera Selectors */}
            {isCameraActive && videoDevices.length > 1 && (
              <div className="form-group" style={{ marginTop: "12px" }}>
                <label className="form-label" style={{ fontSize: "0.75rem" }}>Select Active Lens Camera</label>
                <select
                  className="cyber-input"
                  style={{ fontSize: "0.8rem", padding: "8px 12px" }}
                  value={selectedDeviceId}
                  onChange={(e) => {
                    setSelectedDeviceId(e.target.value);
                    startCamera(e.target.value);
                  }}
                >
                  {videoDevices.map((device, idx) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${idx + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Results Panel */}
        <div className="cyber-card results-card">
          <h3 className="font-orbitron" style={{ fontSize: "0.95rem", color: "var(--neon-cyan)", borderBottom: "1px solid rgba(148,163,184,0.1)", paddingBottom: "10px" }}>
            🛡️ LeafGuard Diagnostic Report
          </h3>

          <div className="results-content">
            {isScanning ? (
              <div className="loader-container">
                <RefreshCw className="animate-spin" style={{ color: "var(--neon-blue)" }} size={32} />
                <div>
                  <p className="loader-title">ANALYZING PLANT HEALTH...</p>
                  <p className="loader-desc">Inspecting foliage and cellular patterns with Gemini AI</p>
                </div>
              </div>
            ) : errorMessage ? (
              <div className="error-container">
                <AlertCircle size={20} style={{ flexShrink: 0 }} />
                <div>
                  <h4 className="error-title">SYSTEM ERROR</h4>
                  <p className="error-desc">{errorMessage}</p>
                </div>
              </div>
            ) : analysisResult ? (
              <div className="bot-formatted text-slate-200">
                {renderFormattedText(analysisResult)}
              </div>
            ) : (
              <div className="loader-container" style={{ color: "var(--text-muted)", opacity: 0.5 }}>
                <AlertCircle size={32} style={{ marginBottom: "8px" }} />
                <p style={{ fontSize: "0.85rem", fontWeight: "600" }}>Ready for Crop Inspection</p>
                <p style={{ fontSize: "0.75rem", maxWidth: "200px" }}>Upload or capture a leaf/crop image to run diagnostic models.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
