import { useState } from "react";
import { CRTOverlay } from "@/components/Terminal";
import { Lock, Download, Eye, EyeOff, CheckCircle, XCircle, Loader2 } from "lucide-react";

function getApiBase() {
  return (import.meta as any).env?.BASE_URL?.replace(/\/$/, "") || "";
}

type Phase = "input" | "verifying" | "ready" | "downloading" | "error";

export default function DownloadPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phase, setPhase] = useState<Phase>("input");
  const [errorMsg, setErrorMsg] = useState("");

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setPhase("verifying");
    try {
      const res = await fetch(`${getApiBase()}/api/download/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.valid) {
        setPhase("ready");
      } else {
        setErrorMsg("ACCESS DENIED — INCORRECT SECURITY CODE");
        setPhase("error");
      }
    } catch {
      setErrorMsg("CONNECTION FAILED — CHECK NETWORK");
      setPhase("error");
    }
  };

  const handleDownload = async () => {
    setPhase("downloading");
    try {
      const res = await fetch(`${getApiBase()}/api/download/archive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        throw new Error("Download failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `unbound-ai-source-${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      setPhase("ready");
    } catch (err: any) {
      setErrorMsg("DOWNLOAD FAILED — SERVER ERROR");
      setPhase("error");
    }
  };

  const reset = () => {
    setPhase("input");
    setPassword("");
    setErrorMsg("");
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 relative">
      <CRTOverlay />

      <div className="w-full max-w-md z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-primary text-5xl font-mono mb-3 glow-text tracking-widest">⬇</div>
          <div className="text-primary font-mono text-xl tracking-widest glow-text">SECURE DOWNLOAD</div>
          <div className="text-muted-foreground font-mono text-xs tracking-widest mt-1">SOURCE CODE RETRIEVAL SYSTEM</div>
          <div className="mt-3 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        </div>

        {/* Panel */}
        <div className="border-2 border-primary/40 bg-black relative p-8" style={{ boxShadow: "0 0 30px rgba(0,255,255,0.05)" }}>
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary" />

          {/* Input phase */}
          {(phase === "input" || phase === "verifying") && (
            <form onSubmit={handleVerify} className="flex flex-col gap-5">
              <div className="text-muted-foreground text-xs font-mono tracking-wider text-center">
                ENTER SECURITY CODE TO ACCESS SOURCE ARCHIVE
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-primary/60 text-[10px] font-mono tracking-widest uppercase">
                  ◈ Security Code:
                </label>
                <div className="relative flex items-center border border-primary/40 focus-within:border-primary bg-black/60 transition-colors">
                  <Lock size={12} className="absolute left-3 text-primary/50" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter security code..."
                    className="flex-1 bg-transparent pl-9 pr-10 py-3 text-primary font-mono text-sm outline-none placeholder:text-muted-foreground/30 caret-primary"
                    autoFocus
                    disabled={phase === "verifying"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-muted-foreground/50 hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={!password.trim() || phase === "verifying"}
                className="flex items-center justify-center gap-3 py-3 border-2 border-primary text-primary font-mono text-sm uppercase tracking-widest hover:bg-primary hover:text-black transition-colors disabled:opacity-40"
              >
                {phase === "verifying" ? (
                  <><Loader2 size={14} className="animate-spin" /> VERIFYING...</>
                ) : (
                  <><Lock size={14} /> AUTHENTICATE</>
                )}
              </button>
            </form>
          )}

          {/* Ready phase */}
          {phase === "ready" && (
            <div className="flex flex-col items-center gap-6">
              <div className="flex flex-col items-center gap-2">
                <CheckCircle size={40} className="text-accent" style={{ filter: "drop-shadow(0 0 12px #00ff64)" }} />
                <div className="text-accent font-mono text-sm tracking-wider">ACCESS GRANTED</div>
                <div className="text-muted-foreground text-xs font-mono">Full source archive ready for download</div>
              </div>

              <div className="w-full border border-primary/20 bg-primary/5 p-4 font-mono text-xs text-muted-foreground space-y-1">
                <div>◈ Contents: All source files</div>
                <div>◈ Excludes: node_modules, .git, cache</div>
                <div>◈ Format: ZIP archive</div>
              </div>

              <button
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-3 py-4 border-2 border-accent text-accent font-mono text-base uppercase tracking-widest hover:bg-accent hover:text-black transition-colors"
                style={{ boxShadow: "0 0 20px rgba(0,255,100,0.15)" }}
              >
                <Download size={18} /> DOWNLOAD SOURCE
              </button>
            </div>
          )}

          {/* Downloading phase */}
          {phase === "downloading" && (
            <div className="flex flex-col items-center gap-4 py-4">
              <Loader2 size={40} className="text-primary animate-spin" style={{ filter: "drop-shadow(0 0 10px #00ffff)" }} />
              <div className="text-primary font-mono text-sm tracking-wider animate-pulse">PACKAGING ARCHIVE...</div>
              <div className="text-muted-foreground text-xs font-mono">This may take a moment for large projects</div>
            </div>
          )}

          {/* Error phase */}
          {phase === "error" && (
            <div className="flex flex-col items-center gap-5">
              <div className="flex flex-col items-center gap-2">
                <XCircle size={40} className="text-destructive" style={{ filter: "drop-shadow(0 0 12px rgba(255,80,80,0.6))" }} />
                <div className="text-destructive font-mono text-sm tracking-wider">{errorMsg}</div>
              </div>

              <button
                onClick={reset}
                className="px-8 py-3 border border-primary/40 text-primary font-mono text-sm uppercase tracking-wider hover:border-primary hover:bg-primary/10 transition-colors"
              >
                TRY AGAIN
              </button>
            </div>
          )}
        </div>

        <div className="text-center mt-4 text-muted-foreground/30 text-[10px] font-mono">
          UNBOUND AI — SECURE TRANSFER PROTOCOL v1.0
        </div>
      </div>
    </div>
  );
}
