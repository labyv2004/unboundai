import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { CRTOverlay } from "@/components/Terminal";
import { useAuth } from "@/hooks/use-auth";
import { useLogout } from "@workspace/api-client-react";
import { getAuthHeaders } from "@/lib/utils";
import { MessageSquare, Database, Cpu, LogOut, Zap, Brain } from "lucide-react";

const NAV_ITEMS = [
  { path: "/dashboard", label: "CHAT", icon: MessageSquare },
  { path: "/dashboard/memory", label: "MEMORY", icon: Brain },
  { path: "/dashboard/sessions", label: "LOGS", icon: Database },
  { path: "/dashboard/status", label: "SYSTEM", icon: Cpu },
];

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span>
      {time.toLocaleDateString()} {time.toLocaleTimeString()}
    </span>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const logoutMutation = useLogout({ request: { headers: getAuthHeaders() } });

  const handleLogout = async () => {
    try { await logoutMutation.mutateAsync(); } catch { /* ignore */ } finally { logout(); }
  };

  return (
    <div className="min-h-screen h-screen bg-black text-primary flex overflow-hidden relative">
      <CRTOverlay />

      {/* SIDEBAR */}
      <aside className="w-56 flex-shrink-0 flex flex-col border-r border-primary/20 bg-black z-10 relative">
        <div className="absolute top-0 right-0 w-px h-full border-r border-primary/8 pointer-events-none" />

        {/* LOGO */}
        <div className="p-4 border-b border-primary/20">
          <div className="flex items-center gap-2 mb-0.5">
            <Zap size={15} className="text-primary flex-shrink-0" style={{ filter: "drop-shadow(0 0 6px #00ffff)" }} />
            <span className="text-primary font-mono text-sm tracking-widest glow-text">UNBOUND</span>
            <span className="ml-1 px-1.5 py-0.5 border border-primary/40 text-primary/60 text-[8px] font-mono tracking-widest">BETA</span>
          </div>
          <div className="text-muted-foreground font-mono text-[9px] tracking-widest">AI OS v2.1.4 — unboundai.replit.app</div>
          <div className="mt-2 h-px bg-gradient-to-r from-primary/50 to-transparent" />
        </div>

        {/* STATUS BAR */}
        <div className="px-4 py-1.5 border-b border-primary/10 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-accent status-dot" style={{ color: "#00ff64" }} />
          <span className="text-accent text-[10px] font-mono tracking-wider">SYSTEM ONLINE</span>
        </div>

        {/* NAV */}
        <nav className="flex flex-col p-3 gap-1 flex-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              location === item.path ||
              (item.path !== "/dashboard" && location.startsWith(item.path));
            const Icon = item.icon;
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={`flex items-center gap-3 px-3 py-2 font-mono text-xs tracking-wider uppercase cursor-pointer transition-all border ${
                    isActive
                      ? "border-primary/60 bg-primary/10 text-primary shadow-[inset_0_0_8px_rgba(0,255,255,0.08)]"
                      : "border-transparent text-muted-foreground hover:border-primary/30 hover:text-primary hover:bg-primary/5"
                  }`}
                >
                  <Icon size={13} className={isActive ? "text-primary" : "text-muted-foreground"} />
                  <span>{isActive ? "▸ " : "  "}{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* BOTTOM */}
        <div className="p-3 border-t border-primary/20 flex flex-col gap-2">
          <div className="px-3 py-2 bg-primary/5 border border-primary/20">
            <div className="text-primary text-xs font-mono truncate">{user?.email || 'user'}@unbound</div>
            <div className="text-muted-foreground text-[9px] font-mono">:~$ authenticated</div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 border border-destructive/40 text-destructive text-xs font-mono uppercase tracking-wider hover:bg-destructive hover:text-black transition-colors w-full"
          >
            <LogOut size={11} />
            TERMINATE SESSION
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 z-10 flex flex-col min-w-0 overflow-hidden p-4">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="text-muted-foreground text-[10px] font-mono tracking-widest uppercase">
            ◈{" "}
            {NAV_ITEMS.find(
              (n) => location === n.path || (n.path !== "/dashboard" && location.startsWith(n.path))
            )?.label ?? "CHAT"}{" "}
            MODULE
          </div>
          <div className="text-muted-foreground text-[10px] font-mono">
            <LiveClock />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
      </main>
    </div>
  );
}
