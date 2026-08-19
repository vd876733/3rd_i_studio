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
import { ThemeToggle } from "@/components/theme-toggle";

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
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 bg-white border-r border-slate-200 lg:flex flex-col">
        {/* Brand Header */}
        <div className="flex h-16 items-center px-6 border-b border-slate-200 gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20">
            <span className="font-bold text-white text-sm">3D</span>
          </div>
          <div>
            <h1 className="font-semibold text-slate-900 leading-none">3rdiStudio</h1>
            <span className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">Platform</span>
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
                    ? "bg-slate-900 text-white shadow-sm shadow-black/10"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                )}
              >
                <Icon className={cn("w-5 h-5 transition-transform duration-200 group-hover:scale-105", isActive ? "text-white" : "text-slate-500")} />
                <span>{item.label}</span>
                {isActive && (
                  <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-cyan-400" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User profile section */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Appearance</span>
            <ThemeToggle />
          </div>
          <div className="flex items-center gap-3 p-2 rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
              <User className="w-5 h-5 text-slate-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">Administrator</p>
              <p className="text-[10px] text-slate-500 truncate">admin@3rdistudio.com</p>
            </div>
            <button className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Navigation Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-20 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center">
            <span className="font-bold text-white text-xs">3D</span>
          </div>
          <span className="font-semibold text-slate-900">3rdiStudio</span>
        </div>
        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          <button className="p-2 text-slate-500 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-500" />
          </button>
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
            <User className="w-4 h-4 text-slate-600" />
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-slate-200 bg-white z-20 flex items-center justify-around px-4 pb-safe">
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
                  ? "text-cyan-600"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              <div className={cn(
                "p-1 rounded-lg transition-all duration-200",
                isActive ? "bg-cyan-50/50" : ""
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
