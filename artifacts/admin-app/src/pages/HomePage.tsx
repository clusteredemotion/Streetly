import { useState, type ReactElement } from "react";
import { clearToken } from "../lib/api";
import FeedSection from "./sections/FeedSection";
import BusinessesSection from "./sections/BusinessesSection";
import UsersSection from "./sections/UsersSection";
import ChatsSection from "./sections/ChatsSection";
import RidersSection from "./sections/RidersSection";

type Tab = "feed" | "businesses" | "users" | "chats" | "riders";

const TABS: { id: Tab; label: string; icon: (active: boolean) => ReactElement }[] = [
  {
    id: "feed",
    label: "Feed",
    icon: (active) => (
      <svg className={`w-5 h-5 ${active ? "text-blue-400" : "text-slate-500"}`} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
      </svg>
    ),
  },
  {
    id: "businesses",
    label: "Businesses",
    icon: (active) => (
      <svg className={`w-5 h-5 ${active ? "text-blue-400" : "text-slate-500"}`} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016 2.993 2.993 0 0 0 2.25-1.016 3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72" />
      </svg>
    ),
  },
  {
    id: "users",
    label: "Users",
    icon: (active) => (
      <svg className={`w-5 h-5 ${active ? "text-blue-400" : "text-slate-500"}`} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
      </svg>
    ),
  },
  {
    id: "chats",
    label: "Chats",
    icon: (active) => (
      <svg className={`w-5 h-5 ${active ? "text-blue-400" : "text-slate-500"}`} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
      </svg>
    ),
  },
  {
    id: "riders",
    label: "Riders",
    icon: (active) => (
      <svg className={`w-5 h-5 ${active ? "text-blue-400" : "text-slate-500"}`} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
  },
];

const SECTION_TITLES: Record<Tab, string> = {
  feed: "Activity Feed",
  businesses: "Businesses",
  users: "Users",
  chats: "Chats",
  riders: "Riders",
};

interface Props {
  onLogout: () => void;
}

export default function HomePage({ onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("feed");

  function handleLogout() {
    clearToken();
    onLogout();
  }

  return (
    <div className="flex flex-col min-h-dvh bg-[#0a0f1e]">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-safe-top pt-4 pb-4 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-4.5 h-4.5 text-white" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-none">Streetly Admin</p>
            <p className="text-slate-500 text-[10px] mt-0.5">{SECTION_TITLES[activeTab]}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="text-slate-500 hover:text-slate-300 text-xs px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
        >
          Sign out
        </button>
      </header>

      {/* Main content — one section visible at a time */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full" style={{ display: activeTab === "feed" ? "flex" : "none", flexDirection: "column" }}>
          <FeedSection onNavigate={(tab) => setActiveTab(tab as Tab)} />
        </div>
        <div className="h-full" style={{ display: activeTab === "businesses" ? "flex" : "none", flexDirection: "column" }}>
          <BusinessesSection />
        </div>
        <div className="h-full" style={{ display: activeTab === "users" ? "flex" : "none", flexDirection: "column" }}>
          <UsersSection />
        </div>
        <div className="h-full" style={{ display: activeTab === "chats" ? "flex" : "none", flexDirection: "column" }}>
          <ChatsSection />
        </div>
        <div className="h-full" style={{ display: activeTab === "riders" ? "flex" : "none", flexDirection: "column" }}>
          <RidersSection />
        </div>
      </div>

      {/* Bottom Tab Bar */}
      <nav className="shrink-0 border-t border-white/5 bg-[#0a0f1e] pb-safe-bottom">
        <div className="flex">
          {TABS.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-all active:opacity-60 ${active ? "opacity-100" : "opacity-70"}`}
              >
                {tab.icon(active)}
                <span className={`text-[10px] font-medium leading-none ${active ? "text-blue-400" : "text-slate-500"}`}>
                  {tab.label}
                </span>
                {active && <span className="w-1 h-1 rounded-full bg-blue-400" />}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
