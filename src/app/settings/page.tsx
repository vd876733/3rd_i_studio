"use client";

import React, { useState } from "react";
import { 
  Settings as SettingsIcon, 
  User, 
  Mail, 
  Camera, 
  Bell, 
  Globe, 
  Save, 
  CheckCircle2 
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Safe UI / App Settings state
  const [profile, setProfile] = useState({
    name: "Administrator",
    email: "admin@3rdistudio.com"
  });

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    statusAlerts: true
  });

  const [regional, setRegional] = useState({
    timezone: "UTC-05:00 (EST)",
    dateFormat: "YYYY-MM-DD",
    defaultLocation: "Manhattan Main Warehouse"
  });

  const handleSave = () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1000);
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-955 dark:text-zinc-50 flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-cyan-500" />
            <span>Application Settings</span>
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
            Configure your personal profile, notification thresholds, and regional preferences.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
        >
          {saveSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Saved!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{isSaving ? "Saving..." : "Save Settings"}</span>
            </>
          )}
        </button>
      </div>

      <div className="space-y-6">
        {/* Profile Settings Card */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-sm text-slate-900 font-bold flex items-center gap-2">
            <User className="w-4 h-4 text-slate-500" />
            <span>Profile Settings</span>
          </h3>
          
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                <User className="w-10 h-10 text-slate-500" />
              </div>
              <button className="absolute bottom-0 right-0 p-1.5 rounded-full bg-cyan-500 hover:bg-cyan-600 text-white shadow-md transition-colors cursor-pointer">
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div className="grid gap-2">
                <label className="text-xs font-semibold text-slate-500">Full Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-xs font-semibold text-slate-500">Email Address</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Notification Preferences Card */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-sm text-slate-900 font-bold flex items-center gap-2">
            <Bell className="w-4 h-4 text-slate-500" />
            <span>Notification Preferences</span>
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-1 border-b border-slate-200 pb-3">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 block">Email Alerts & Summaries</span>
                <span className="text-[10px] text-slate-500">Receive automated daily summaries and logistics reports.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.emailAlerts}
                  onChange={(e) => setNotifications({ ...notifications, emailAlerts: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between py-1">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 block">Project Status Alerts</span>
                <span className="text-[10px] text-slate-500">Get notified when a project is updated, packed, or shipped.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.statusAlerts}
                  onChange={(e) => setNotifications({ ...notifications, statusAlerts: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Display & Regional Settings Card */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-sm text-slate-900 font-bold flex items-center gap-2">
            <Globe className="w-4 h-4 text-slate-500" />
            <span>Display & Regional Settings</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <label className="text-xs font-semibold text-slate-500">Preferred Timezone</label>
              <select
                value={regional.timezone}
                onChange={(e) => setRegional({ ...regional, timezone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="UTC-08:00 (PST)">UTC-08:00 (PST)</option>
                <option value="UTC-05:00 (EST)">UTC-05:00 (EST)</option>
                <option value="UTC+00:00 (GMT)">UTC+00:00 (GMT)</option>
                <option value="UTC+01:00 (CET)">UTC+01:00 (CET)</option>
                <option value="UTC+05:30 (IST)">UTC+05:30 (IST)</option>
              </select>
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-semibold text-slate-500">Date Format</label>
              <select
                value={regional.dateFormat}
                onChange={(e) => setRegional({ ...regional, dateFormat: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              </select>
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-semibold text-slate-500">Default Studio Location</label>
              <input
                type="text"
                value={regional.defaultLocation}
                onChange={(e) => setRegional({ ...regional, defaultLocation: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Appearance & Preferences Card */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-sm text-slate-900 font-bold flex items-center gap-2">
            <SettingsIcon className="w-4 h-4 text-slate-500" />
            <span>Appearance & Preferences</span>
          </h3>
          <div className="flex items-center justify-between py-1.5">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-900 block">Application Theme</span>
              <span className="text-[10px] text-slate-500">Select light theme, dark theme, or sync with your system defaults.</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  );
}
