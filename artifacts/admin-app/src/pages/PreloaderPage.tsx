export default function PreloaderPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-[#0a0f1e]">
      <div className="relative flex items-center justify-center mb-8">
        <span className="absolute w-24 h-24 rounded-full bg-blue-500/20"
          style={{ animation: "pulse-ring 1.4s cubic-bezier(0.215,0.61,0.355,1) infinite" }} />
        <span className="absolute w-24 h-24 rounded-full bg-blue-500/10"
          style={{ animation: "pulse-ring 1.4s cubic-bezier(0.215,0.61,0.355,1) 0.5s infinite" }} />
        <div className="relative z-10 w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-xl shadow-blue-900/40">
          <svg viewBox="0 0 24 24" fill="none" className="w-11 h-11 text-white" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
            <circle cx="12" cy="9" r="2.5" />
          </svg>
        </div>
      </div>
      <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Streetly Admin</h1>
      <p className="text-blue-400/70 text-sm mb-10">Platform Management Console</p>
      <div className="w-8 h-8 rounded-full border-[3px] border-blue-500/30 border-t-blue-400 spin-slow" />
    </div>
  );
}
