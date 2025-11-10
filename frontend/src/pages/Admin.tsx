import { useState, useEffect } from "react";
import { apiClient, RetrainResponse, UpdateThresholdResponse } from "../api";

function Admin() {
  const [token, setToken] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [retrainLoading, setRetrainLoading] = useState(false);
  const [retrainResult, setRetrainResult] = useState<RetrainResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [thresholdInfo, setThresholdInfo] = useState<UpdateThresholdResponse | null>(null);
  const [thresholdInput, setThresholdInput] = useState("0.6");
  const [thresholdSaving, setThresholdSaving] = useState(false);
  const [thresholdMessage, setThresholdMessage] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("admin_token");
    if (savedToken) {
      setToken(savedToken);
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    const fetchThreshold = async () => {
      try {
        const info = await apiClient.getThreshold();
        if (info?.threshold) {
          setThresholdInfo(info);
          setThresholdInput(info.threshold.toFixed(2));
        }
      } catch (err) {
        console.warn("⚠️ Failed to fetch threshold:", err);
      }
    };
    if (isAuthenticated) fetchThreshold();
  }, [isAuthenticated]);

  const handleLogin = () => {
    if (!token.trim()) {
      setError("Please enter a valid admin token.");
      return;
    }
    localStorage.setItem("admin_token", token);
    setIsAuthenticated(true);
    setError(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setToken("");
    setIsAuthenticated(false);
    setRetrainResult(null);
    setThresholdInfo(null);
  };

  const handleRetrain = async () => {
    setRetrainLoading(true);
    setError(null);
    setRetrainResult(null);
    try {
      const response = await apiClient.retrain();
      if (!response) throw new Error("Empty response from retrain API.");

      setRetrainResult(response);
      const appliedThreshold =
        response.user_threshold ?? response.recommended_threshold ?? 0.6;

      setThresholdInfo({
        threshold: appliedThreshold,
        source: response.user_threshold ? "user" : "recommended",
      });
      setThresholdInput(appliedThreshold.toFixed(2));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to retrain model.");
    } finally {
      setRetrainLoading(false);
    }
  };

  const handleExport = async () => {
    setExportLoading(true);
    setError(null);
    try {
      const blob = await apiClient.exportData();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "student_data_export.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export data.");
    } finally {
      setExportLoading(false);
    }
  };

  const handleThresholdSave = async () => {
    const parsed = parseFloat(thresholdInput);
    if (isNaN(parsed) || parsed <= 0 || parsed >= 1) {
      setThresholdMessage("Threshold must be between 0 and 1 (e.g., 0.65).");
      return;
    }

    setThresholdSaving(true);
    setThresholdMessage(null);
    try {
      const response = await apiClient.updateThreshold(parsed);
      if (response?.threshold) {
        setThresholdInfo(response);
        setThresholdMessage("✅ Threshold updated successfully.");
      } else {
        setThresholdMessage("⚠️ Could not update threshold.");
      }
    } catch (err) {
      setThresholdMessage(
        err instanceof Error ? err.message : "Failed to update threshold."
      );
    } finally {
      setThresholdSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center text-white">
        <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-xl p-8 w-full max-w-md shadow-2xl">
          <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            Admin Login
          </h2>
          <input
            type="password"
            placeholder="Enter admin token (default: changeme)"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="block w-full mb-2 rounded-md bg-white/10 border border-white/20 px-3 py-2 text-white focus:ring-2 focus:ring-cyan-400 outline-none"
          />
          <p className="text-xs text-white/50 mb-4 text-center">
            Default token: <code className="bg-white/10 px-1 rounded">changeme</code>
          </p>
          {error && <p className="text-sm text-red-400 mb-4 text-center">{error}</p>}
          <button
            onClick={handleLogin}
            className="w-full py-2 rounded-md bg-gradient-to-r from-cyan-400 to-indigo-500 text-black font-semibold hover:scale-105 transition-transform"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070E1E] text-white px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            Admin Dashboard
          </h2>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-md hover:bg-white/20"
          >
            Logout
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-400/40 rounded-md text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Retrain Section */}
        <div className="glass-card">
          <h3 className="card-title">⚙️ Retrain Model</h3>
          <p className="text-sm text-white/70 mb-4">
            Rebuild the ML model using the latest student dataset.
          </p>
          <button
            onClick={handleRetrain}
            disabled={retrainLoading}
            className="btn-gradient"
          >
            {retrainLoading ? "Training..." : "Retrain Model"}
          </button>

          {retrainResult && (
            <div className="mt-6 bg-white/5 border border-white/10 rounded-lg p-4 text-sm space-y-2">
              <h4 className="font-semibold text-cyan-300">✅ Model Retrained Successfully</h4>
              <p>Accuracy: {(retrainResult.accuracy * 100).toFixed(2)}%</p>
              <p>Precision: {(retrainResult.precision * 100).toFixed(2)}%</p>
              <p>Recall: {(retrainResult.recall * 100).toFixed(2)}%</p>
              <p>F1 Score: {(retrainResult.f1_score * 100).toFixed(2)}%</p>
              <p>Samples Used: {retrainResult.samples_used}</p>
              <p>Threshold: {retrainResult.recommended_threshold?.toFixed(2) ?? "N/A"}</p>
            </div>
          )}
        </div>

        {/* Threshold Section */}
        <div className="glass-card">
          <h3 className="card-title">🎯 Decision Threshold</h3>
          <p className="text-sm text-white/70 mb-4">
            Adjust the probability threshold for student classification.
          </p>
          <div className="flex items-center gap-3 mb-4">
            <input
              type="number"
              step="0.01"
              min="0.01"
              max="0.99"
              value={thresholdInput}
              onChange={(e) => setThresholdInput(e.target.value)}
              className="w-24 px-2 py-1 bg-white/10 border border-white/20 rounded-md focus:ring-2 focus:ring-cyan-400 outline-none"
            />
            <button
              onClick={handleThresholdSave}
              disabled={thresholdSaving}
              className="btn-gradient"
            >
              {thresholdSaving ? "Saving..." : "Save Threshold"}
            </button>
          </div>
          {thresholdInfo && (
            <p className="text-sm text-white/80">
              Current: <strong>{thresholdInfo.threshold.toFixed(2)}</strong> (source:{" "}
              {thresholdInfo.source})
            </p>
          )}
          {thresholdMessage && (
            <p className="mt-3 text-sm bg-white/10 border border-white/20 rounded-md px-3 py-2 text-cyan-300">
              {thresholdMessage}
            </p>
          )}
        </div>

        {/* Export Section */}
        <div className="glass-card">
          <h3 className="card-title">📊 Export Dataset</h3>
          <p className="text-sm text-white/70 mb-4">
            Download student data in CSV format for analysis or backup.
          </p>
          <button
            onClick={handleExport}
            disabled={exportLoading}
            className="btn-gradient"
          >
            {exportLoading ? "Exporting..." : "Export CSV"}
          </button>
        </div>
      </div>

      <style jsx>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 24px;
        }
        .card-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 0.75rem;
        }
        .btn-gradient {
          padding: 8px 18px;
          border-radius: 8px;
          font-weight: 600;
          background: linear-gradient(90deg, #00f5a0, #00d9f5, #a78bfa);
          color: #000;
          transition: all 0.3s ease;
        }
        .btn-gradient:hover {
          transform: scale(1.05);
          box-shadow: 0 0 15px #7cfffb66;
        }
      `}</style>
    </div>
  );
}

export default Admin;
