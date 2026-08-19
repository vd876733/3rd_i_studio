"use client";

import React, { useState } from "react";
import { 
  Settings as SettingsIcon, 
  Database, 
  Key, 
  Cloud, 
  Eye, 
  EyeOff, 
  Save, 
  CheckCircle2 
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function SettingsPage() {
  const [showSecret, setShowSecret] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-cyan-500" />
            <span>Application Settings</span>
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
            Configure system integrations, keys, and cloud storage targets.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
        >
          {saveSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Saved!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{isSaving ? "Saving..." : "Save Config"}</span>
            </>
          )}
        </button>
      </div>

      <div className="space-y-6">
        {/* Database Config Card */}
        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-sm space-y-4">
          <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Database className="w-4 h-4 text-zinc-400" />
            <span>Database Connection (Prisma)</span>
          </h3>
          <div className="grid gap-3">
            <label className="text-xs font-semibold text-zinc-500">DATABASE_URL Connection String</label>
            <input
              type="text"
              readOnly
              value="postgresql://postgres:postgres@localhost:5432/myapp?schema=public"
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-mono text-zinc-600 dark:text-zinc-400 focus:outline-none cursor-default"
            />
            <span className="text-[10px] text-zinc-400">Connection string is currently read from local .env.local file.</span>
          </div>
        </div>

        {/* Security / Auth Config Card */}
        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-sm space-y-4">
          <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Key className="w-4 h-4 text-zinc-400" />
            <span>Authentication (NextAuth)</span>
          </h3>
          <div className="grid gap-3">
            <label className="text-xs font-semibold text-zinc-500">NEXTAUTH_SECRET JWT Key</label>
            <div className="relative">
              <input
                type={showSecret ? "text" : "password"}
                readOnly
                value="3rdistudio_project_secret_nextauth_jwt_key_2026"
                className="w-full pl-3 pr-10 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-mono text-zinc-600 dark:text-zinc-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            <label className="text-xs font-semibold text-zinc-500">NEXTAUTH_URL Base Address</label>
            <input
              type="text"
              readOnly
              value="http://localhost:3000"
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-mono text-zinc-600 dark:text-zinc-400 focus:outline-none cursor-default"
            />
          </div>
        </div>

        {/* Cloud Storage Config Card */}
        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-sm space-y-4">
          <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Cloud className="w-4 h-4 text-zinc-400" />
            <span>Cloudflare R2 Bucket Integration</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-xs font-semibold text-zinc-500">R2 Endpoint</label>
              <input
                type="text"
                readOnly
                value="https://<account_id>.r2.cloudflarestorage.com"
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-mono text-zinc-600 dark:text-zinc-400 focus:outline-none"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-semibold text-zinc-500">R2 Bucket Name</label>
              <input
                type="text"
                readOnly
                value="my-app-assets"
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-mono text-zinc-600 dark:text-zinc-400 focus:outline-none"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-semibold text-zinc-500">R2 Access Key ID</label>
              <input
                type="password"
                readOnly
                value="placeholder_r2_access_key_id"
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-mono text-zinc-600 dark:text-zinc-400 focus:outline-none"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-semibold text-zinc-500">R2 Secret Access Key</label>
              <input
                type="password"
                readOnly
                value="placeholder_r2_secret_access_key"
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-mono text-zinc-600 dark:text-zinc-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Appearance & Preferences Card */}
        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-sm space-y-4">
          <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <SettingsIcon className="w-4 h-4 text-zinc-400" />
            <span>Appearance & Preferences</span>
          </h3>
          <div className="flex items-center justify-between py-1.5">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-zinc-850 dark:text-zinc-200 block">Application Theme</span>
              <span className="text-[10px] text-zinc-450 dark:text-zinc-400">Select light theme, dark theme, or sync with your system defaults.</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  );
}
