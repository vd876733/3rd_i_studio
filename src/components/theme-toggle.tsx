"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch: only render interactive toggle after mounting on client
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={cn("w-[108px] h-8.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 animate-pulse shrink-0", className)} />
    );
  }

  return (
    <div className={cn("flex items-center gap-1 p-1 bg-slate-100 border border-slate-200/50 rounded-xl shrink-0 w-max", className)}>
      {[
        { value: "light", icon: Sun, label: "Light" },
        { value: "dark", icon: Moon, label: "Dark" },
        { value: "system", icon: Monitor, label: "System" }
      ].map((opt) => {
        const Icon = opt.icon;
        const isActive = theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setTheme(opt.value)}
            title={`${opt.label} Mode`}
            className={cn(
              "p-1.5 rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center relative group",
              isActive 
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            <Icon className="w-4 h-4 transition-transform duration-200 group-hover:scale-105" />
          </button>
        );
      })}
    </div>
  );
}
