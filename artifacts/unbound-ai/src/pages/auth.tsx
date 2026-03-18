import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { CRTOverlay, ASCII_LOGO } from "@/components/Terminal";
import { Eye, EyeOff, Terminal, UserPlus } from "lucide-react";

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!username || !password) {
      setErrorMsg("ERR: Credentials cannot be empty.");
      return;
    }

    setIsPending(true);

    try {
      if (isLogin) {
        await login(username, password);
      } else {
        await register(username, password);
        setSuccessMsg("SUCCESS: Account created! Welcome to UnboundAI.");
      }
    } catch (err: any) {
      const msg = err?.message || "Authentication failed.";
      setErrorMsg(`ERR: ${msg}`);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      <CRTOverlay />

      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `linear-gradient(rgba(0,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.3) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="z-10 w-full max-w-2xl flex flex-col items-center">
        {/* ASCII LOGO */}
        <pre
          className="text-primary text-[0.45rem] sm:text-[0.55rem] leading-[0.6rem] mb-8 glow-text font-mono whitespace-pre overflow-x-auto w-full text-center"
          style={{ textShadow: "0 0 8px rgba(0,255,255,0.7), 0 0 20px rgba(0,255,255,0.4)" }}
        >
          {ASCII_LOGO}
        </pre>

        {/* AUTH PANEL */}
        <div className="w-full max-w-md relative">
          {/* Corner decorations */}
          <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-primary" />
          <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-primary" />
          <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-primary" />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-primary" />

          {/* Title bar */}
          <div className="bg-primary/10 border border-primary/40 px-4 py-2 flex items-center gap-2 border-b-0">
            <span className="text-primary text-[10px] font-mono tracking-widest glow-text">
              ▸ {isLogin ? "SYSTEM ACCESS" : "CREATE USER"} REQUIRED
            </span>
            <div className="flex-1" />
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-destructive/60" />
              <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
              <div className="w-2 h-2 rounded-full bg-accent/60" />
            </div>
          </div>

          <div className="border border-primary/40 bg-black p-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Username */}
              <div className="flex flex-col gap-1">
                <label className="text-muted-foreground text-[10px] font-mono tracking-widest">USERNAME:</label>
                <div className="flex items-center gap-2 border border-primary/30 bg-primary/5 px-3 py-2 focus-within:border-primary/70 focus-within:bg-primary/8 transition-colors">
                  <span className="text-primary/60 text-xs font-mono">user@unbound:~$</span>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoFocus
                    disabled={isPending}
                    spellCheck={false}
                    autoComplete="username"
                    type="text"
                    className="flex-1 bg-transparent text-primary font-mono text-sm outline-none caret-primary placeholder:text-muted-foreground/40"
                    placeholder="enter username"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1">
                <label className="text-muted-foreground text-[10px] font-mono tracking-widest">PASSCODE:</label>
                <div className="flex items-center gap-2 border border-primary/30 bg-primary/5 px-3 py-2 focus-within:border-primary/70 transition-colors">
                  <span className="text-primary/60 text-xs font-mono">user@unbound:~$</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isPending}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    className="flex-1 bg-transparent text-primary font-mono text-sm outline-none caret-primary placeholder:text-muted-foreground/40"
                    placeholder="enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {errorMsg && (
                <div className="text-destructive text-xs font-mono border border-destructive/30 bg-destructive/5 px-3 py-2">
                  {errorMsg}
                </div>
              )}

              {/* Success */}
              {successMsg && (
                <div className="text-green-500 text-xs font-mono border border-green-500/30 bg-green-500/5 px-3 py-2">
                  {successMsg}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-2 border-t border-primary/20">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-primary bg-primary/10 text-primary font-mono text-xs uppercase tracking-wider hover:bg-primary hover:text-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isPending ? (
                    <span className="animate-pulse">PROCESSING...</span>
                  ) : (
                    <>
                      <Terminal size={12} />
                      {isLogin ? "INITIATE LOGIN" : "CREATE USER"}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => { setIsLogin(!isLogin); setErrorMsg(""); }}
                  disabled={isPending}
                  className="flex items-center gap-2 px-4 py-2 border border-primary/40 text-muted-foreground font-mono text-xs uppercase tracking-wider hover:border-primary hover:text-primary transition-colors disabled:opacity-40"
                >
                  <UserPlus size={12} />
                  {isLogin ? "REGISTER" : "LOGIN"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-muted-foreground text-[10px] font-mono text-center opacity-40">
          UNBOUND AI — UNRESTRICTED INTELLIGENCE PLATFORM
        </div>
      </div>
    </div>
  );
}
