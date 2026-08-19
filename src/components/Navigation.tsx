"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  ScanBarcode, 
  Package, 
  Settings, 
  Menu, 
  User,
  LogOut,
  Bell,
  Briefcase
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: Briefcase },
  { href: "/scan", label: "Barcode Scanner", icon: ScanBarcode },
  { href: "/inventory", label: "Inventory DB", icon: Package },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar Navigation */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-zinc-200/80 bg-zinc-50/70 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/70 lg:flex flex-col">
        {/* Brand Header */}
        <div className="flex h-16 items-center px-6 border-b border-zinc-200/80 dark:border-zinc-800/80 gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20">
            <span className="font-bold text-white text-sm">3D</span>
          </div>
          <div>
            <h1 className="font-semibold text-zinc-900 dark:text-zinc-50 leading-none">3rdiStudio</h1>
            <span className="text-[10px] text-zinc-500 font-medium tracking-wider uppercase">Platform</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1.5 px-4 py-6">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                  isActive
                    ? "bg-zinc-900 text-white shadow-sm shadow-black/10 dark:bg-zinc-100 dark:text-zinc-950"
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800/50"
                )}
              >
                <Icon className={cn("w-5 h-5 transition-transform duration-200 group-hover:scale-105", isActive ? "" : "text-zinc-500 dark:text-zinc-400")} />
                <span>{item.label}</span>
                {isActive && (
                  <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-cyan-400 dark:bg-cyan-600" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User profile section */}
        <div className="p-4 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-100/40 dark:bg-zinc-950/40">
          <div className="flex items-center gap-3 p-2 rounded-xl">
            <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center border border-zinc-300 dark:border-zinc-700">
              <User className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">Administrator</p>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">admin@3rdistudio.com</p>
            </div>
            <button className="p-1.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Navigation Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 border-b border-zinc-200/80 bg-white/70 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/70 z-20 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center">
            <span className="font-bold text-white text-xs">3D</span>
          </div>
          <span className="font-semibold text-zinc-950 dark:text-zinc-50">3rdiStudio</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-500" />
          </button>
          <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
            <User className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-zinc-200/80 bg-white/70 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/70 z-20 flex items-center justify-around px-4 pb-safe">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 py-1 rounded-xl transition-all duration-200 relative",
                isActive
                  ? "text-cyan-600 dark:text-cyan-400"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              )}
            >
              <div className={cn(
                "p-1 rounded-lg transition-all duration-200",
                isActive ? "bg-cyan-50/50 dark:bg-cyan-950/30" : ""
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium tracking-wide">{item.label.split(" ")[0]}</span>
              {isActive && (
                <span className="absolute top-1 w-1 h-1 rounded-full bg-cyan-500" />
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
