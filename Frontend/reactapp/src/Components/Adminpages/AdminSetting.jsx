import React, { useState, useEffect } from "react";
import axios from "axios";

const AdminSettings = () => {
  const [systemSettings, setSystemSettings] = useState({
    applicationName: "BookingSystem",
    applicationVersion: "1.0.0",
    maintenanceMode: false,
    maintenanceMessage: "",
    timezone: "UTC",
    language: "en",
    maxUploadSize: 10,
    currency: "USD",
    supportEmail: "support@example.com",
    supportPhone: "+1-800-000-0000",
  });

  const [systemInfo, setSystemInfo] = useState({
    serverStatus: "Online",
    databaseStatus: "Connected",
    uptime: "45 days, 12 hours",
    cpuUsage: 45,
    memoryUsage: 62,
    activeUsers: 245,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const API_BASE_URL = "http://localhost:8080/api/admin/settings";

  useEffect(() => {
    fetchSystemSettings();
    fetchSystemInfo();
  }, []);

  const fetchSystemSettings = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setSystemSettings(response.data || systemSettings);
    } catch (error) {
      console.error("Error fetching system settings:", error);
      showMessage("Failed to load system settings", "error");
    }
  };

  const fetchSystemInfo = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/info`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setSystemInfo(response.data || systemInfo);
    } catch (error) {
      console.error("Error fetching system info:", error);
      showMessage("Failed to load system information", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSystemSettings({
      ...systemSettings,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const saveSystemSettings = async () => {
    try {
      await axios.post(`${API_BASE_URL}`, systemSettings, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      showMessage("System settings saved successfully!", "success");
    } catch (error) {
      console.error("Error saving settings:", error);
      showMessage("Failed to save system settings", "error");
    }
  };

  const handleMaintenanceToggle = async () => {
    const newValue = !systemSettings.maintenanceMode;
    setSystemSettings({
      ...systemSettings,
      maintenanceMode: newValue,
    });

    try {
      await axios.post(
        `${API_BASE_URL}/maintenance`,
        { enabled: newValue, message: systemSettings.maintenanceMessage },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      showMessage(
        newValue ? "Maintenance mode enabled" : "Maintenance mode disabled",
        "success"
      );
    } catch (error) {
      console.error("Error toggling maintenance:", error);
      showMessage("Failed to toggle maintenance mode", "error");
    }
  };

  const clearCache = async () => {
    try {
      await axios.post(`${API_BASE_URL}/cache/clear`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      showMessage("Cache cleared successfully!", "success");
    } catch (error) {
      console.error("Error clearing cache:", error);
      showMessage("Failed to clear cache", "error");
    }
  };

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 4000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">⚙️ System Settings</h1>
          <p className="text-slate-400">
            Configure application-wide settings and system information
          </p>
        </div>

        {/* Message Alert */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              messageType === "success"
                ? "bg-green-500/20 border-green-500 text-green-200"
                : "bg-red-500/20 border-red-500 text-red-200"
            }`}
          >
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* System Status Cards */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Server Status</p>
                <p className="text-2xl font-bold text-green-400 mt-2">
                  {systemInfo.serverStatus}
                </p>
              </div>
              <span className="text-4xl">🖥️</span>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Active Users</p>
                <p className="text-2xl font-bold text-blue-400 mt-2">
                  {systemInfo.activeUsers}
                </p>
              </div>
              <span className="text-4xl">👥</span>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Uptime</p>
                <p className="text-xl font-bold text-purple-400 mt-2">
                  {systemInfo.uptime}
                </p>
              </div>
              <span className="text-4xl">⏱️</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* System Settings */}
          <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-8">System Configuration</h2>

            <div className="space-y-6">
              {/* Application Name */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Application Name
                </label>
                <input
                  type="text"
                  name="applicationName"
                  value={systemSettings.applicationName}
                  onChange={handleSettingChange}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Support Email */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Support Email
                </label>
                <input
                  type="email"
                  name="supportEmail"
                  value={systemSettings.supportEmail}
                  onChange={handleSettingChange}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Support Phone */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Support Phone
                </label>
                <input
                  type="tel"
                  name="supportPhone"
                  value={systemSettings.supportPhone}
                  onChange={handleSettingChange}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Timezone */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Timezone
                </label>
                <select
                  name="timezone"
                  value={systemSettings.timezone}
                  onChange={handleSettingChange}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="UTC">UTC</option>
                  <option value="EST">Eastern Standard Time</option>
                  <option value="CST">Central Standard Time</option>
                  <option value="MST">Mountain Standard Time</option>
                  <option value="PST">Pacific Standard Time</option>
                  <option value="IST">India Standard Time</option>
                </select>
              </div>

              {/* Currency */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Currency
                </label>
                <select
                  name="currency"
                  value={systemSettings.currency}
                  onChange={handleSettingChange}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>

              {/* Max Upload Size */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Max Upload Size (MB)
                </label>
                <input
                  type="number"
                  name="maxUploadSize"
                  value={systemSettings.maxUploadSize}
                  onChange={handleSettingChange}
                  min="1"
                  max="100"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Save Button */}
              <button
                onClick={saveSystemSettings}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Save System Settings
              </button>
            </div>
          </div>

          {/* Maintenance & System Info */}
          <div className="space-y-6">
            {/* Maintenance Mode */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-4">Maintenance Mode</h3>

              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-400">Enable Maintenance</span>
                <input
                  type="checkbox"
                  checked={systemSettings.maintenanceMode}
                  onChange={handleMaintenanceToggle}
                  className="w-6 h-6 rounded cursor-pointer accent-blue-500"
                />
              </div>

              {systemSettings.maintenanceMode && (
                <textarea
                  name="maintenanceMessage"
                  value={systemSettings.maintenanceMessage}
                  onChange={handleSettingChange}
                  placeholder="Maintenance message for users..."
                  rows="4"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              )}

              <div
                className={`mt-4 p-3 rounded-lg border ${
                  systemSettings.maintenanceMode
                    ? "bg-yellow-500/20 border-yellow-500 text-yellow-200"
                    : "bg-green-500/20 border-green-500 text-green-200"
                }`}
              >
                <p className="text-sm font-semibold">
                  {systemSettings.maintenanceMode ? "🔴 Maintenance Active" : "🟢 System Live"}
                </p>
              </div>
            </div>

            {/* System Health */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-4">System Health</h3>

              <div className="space-y-4">
                <div>
                  <p className="text-slate-400 text-sm mb-2">CPU Usage</p>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                      style={{ width: `${systemInfo.cpuUsage}%` }}
                    ></div>
                  </div>
                  <p className="text-blue-400 text-xs mt-1">{systemInfo.cpuUsage}%</p>
                </div>

                <div>
                  <p className="text-slate-400 text-sm mb-2">Memory Usage</p>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-600"
                      style={{ width: `${systemInfo.memoryUsage}%` }}
                    ></div>
                  </div>
                  <p className="text-purple-400 text-xs mt-1">{systemInfo.memoryUsage}%</p>
                </div>

                <div className="pt-4 border-t border-slate-600">
                  <p className="text-slate-400 text-sm mb-1">Database</p>
                  <p className="text-green-400 font-semibold">
                    ✓ {systemInfo.databaseStatus}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <button
              onClick={clearCache}
              className="w-full px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
            >
              Clear Cache
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;