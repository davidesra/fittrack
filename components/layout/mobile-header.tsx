"use client";

import { Menu, Activity } from "lucide-react";
import { useSidebar } from "./sidebar-context";

export function MobileHeader() {
  const { open } = useSidebar();

  return (
    <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-[#111114] border-b border-[#2a2a32]">
      <button
        onClick={open}
        className="p-1.5 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center">
          <Activity className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="font-bold text-white text-sm">FitTrack</span>
      </div>
    </header>
  );
}
