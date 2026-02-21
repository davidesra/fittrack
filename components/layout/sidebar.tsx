"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Activity,
  Utensils,
  Dumbbell,
  Camera,
  BarChart2,
  LogOut,
  Target,
  X,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useSidebar } from "./sidebar-context";

const nav = [
  {
    section: "Overview",
    icon: LayoutDashboard,
    color: "text-indigo-400",
    bg: "bg-indigo-400/10",
    links: [{ label: "Dashboard", href: "/dashboard" }],
  },
  {
    section: "Nutrition",
    icon: Utensils,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    links: [
      { label: "Log Food", href: "/nutrition" },
      { label: "AI Analysis", href: "/nutrition/analysis" },
    ],
  },
  {
    section: "Workouts",
    icon: Dumbbell,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    links: [
      { label: "Log Workout", href: "/workouts" },
      { label: "AI Analysis", href: "/workouts/analysis" },
    ],
  },
  {
    section: "Body Photos",
    icon: Camera,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    links: [
      { label: "Timeline", href: "/photos" },
      { label: "AI Analysis", href: "/photos/analysis" },
    ],
  },
  {
    section: "Goals",
    icon: Target,
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
    links: [{ label: "My Goals", href: "/goals" }],
  },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className="flex flex-col h-full">
      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {nav.map(({ section, icon: Icon, color, bg, links }) => (
          <div key={section}>
            <div className="flex items-center gap-2 px-2 mb-2">
              <div className={cn("w-6 h-6 rounded-md flex items-center justify-center", bg)}>
                <Icon className={cn("w-3.5 h-3.5", color)} />
              </div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {section}
              </span>
            </div>

            <div className="space-y-0.5 pl-2">
              {links.map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                    pathname === href
                      ? "bg-indigo-600/20 text-indigo-300 font-medium"
                      : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                  )}
                >
                  {label === "AI Analysis" ? (
                    <BarChart2 className="w-3.5 h-3.5 opacity-60" />
                  ) : (
                    <Target className="w-3.5 h-3.5 opacity-60" />
                  )}
                  {label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User + sign out */}
      {session?.user && (
        <div className="border-t border-[#2a2a32] p-3">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name ?? "User"}
                width={32}
                height={32}
                className="rounded-full flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                {session.user.name?.[0] ?? "U"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{session.user.name}</p>
              <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/auth/signin" })}
              className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors rounded-md hover:bg-white/5"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const { isOpen, close } = useSidebar();

  return (
    <>
      {/* Desktop sidebar — always visible on lg+ */}
      <aside className="hidden lg:flex w-60 flex-shrink-0 h-screen sticky top-0 flex-col border-r border-[#2a2a32] bg-[#111114]">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[#2a2a32]">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-lg">FitTrack</span>
        </div>
        <SidebarContent />
      </aside>

      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={close}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "lg:hidden fixed left-0 top-0 z-50 h-full w-72 bg-[#111114] border-r border-[#2a2a32] flex flex-col transition-transform duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-[#2a2a32]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-lg">FitTrack</span>
          </div>
          <button
            onClick={close}
            className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors rounded-lg hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <SidebarContent onNavigate={close} />
      </aside>
    </>
  );
}
