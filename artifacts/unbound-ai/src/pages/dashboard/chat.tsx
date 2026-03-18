import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { TerminalPanel, TypewriterText } from "@/components/Terminal";
import { ContextMenu, useContextMenu } from "@/components/ContextMenu";
import { useAuth } from "@/hooks/use-auth";
import { useSettings } from "@/hooks/use-settings";
import { useGetSessions, useCreateSession, useGetSession } from "@workspace/api-client-react";
import { getAuthHeaders } from "@/lib/utils";
import {
  PlusCircle, MessageSquare, Paperclip, Pencil, Trash2,
  Check, X, Shield, Zap, SlidersHorizontal,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

type FileAttachment = {
  name: string;
  type: "image" | "text" | "json" | "video";
  preview?: string;
  content: string;
};

type OptimisticMessage = {
  id: string;
  role: "user";
  content: string;
  pending: true;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getFileType(file: File): FileAttachment["type"] {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.name.endsWith(".json") || file.type === "application/json") return "json";
  return "text";
}

function fileIcon(t: string) {
  return ({ image: "📷", text: "📄", json: "{}", video: "🎬" } as Record<string, string>)[t] || "📎";
}

function getApiBase() {
  return (import.meta as any).env?.BASE_URL?.replace(/\/$/, "") || "";
}

const CONTEXT_KEY = "unbound_session_context";

async function sendMessageApi(
  sessionId: number,
  data: { content: string; fileType?: string; fileName?: string; mode: string; sessionContext?: string },
  headers: Record<string, string>
) {
  const res = await fetch(`${getApiBase()}/api/sessions/${sessionId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || `HTTP ${res.status}`);
  }
  return res.json();
}

async function renameSessionApi(sessionId: number, title: string, headers: Record<string, string>) {
  const res = await fetch(`${getApiBase()}/api/sessions/${sessionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("Rename failed");
  return res.json();
}

// ─── Markdown styles ─────────────────────────────────────────────────────────

const MD: any = {
  p: ({ children }: any) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
  h1: ({ children }: any) => <h1 className="text-primary glow-text text-base font-bold mb-2 mt-3 border-b border-primary/30 pb-1">{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-primary text-sm font-bold mb-2 mt-3">{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-primary/90 text-xs font-bold mb-1 mt-2">{children}</h3>,
  code: ({ inline, children }: any) =>
    inline ? (
      <code className="bg-primary/10 border border-primary/20 px-1 py-0.5 text-primary font-mono text-[11px]">{children}</code>
    ) : (
      <pre className="bg-black/80 border border-primary/20 p-3 overflow-x-auto my-2">
        <code className="text-primary/90 font-mono text-[11px] leading-relaxed">{children}</code>
      </pre>
    ),
  ul: ({ children }: any) => <ul className="list-none space-y-1 my-2 pl-4">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal list-inside space-y-1 my-2 pl-2">{children}</ol>,
  li: ({ children }: any) => (
    <li className="text-primary/90 text-sm"><span className="text-primary/50 mr-2">▸</span>{children}</li>
  ),
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-2 border-primary/40 pl-3 my-2 text-muted-foreground italic">{children}</blockquote>
  ),
  strong: ({ children }: any) => <strong className="text-primary font-bold">{children}</strong>,
  em: ({ children }: any) => <em className="text-primary/80 italic">{children}</em>,
  hr: () => <hr className="border-primary/20 my-3" />,
  a: ({ href, children }: any) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-secondary underline hover:text-primary transition-colors">{children}</a>
  ),
  table: ({ children }: any) => (
    <div className="overflow-x-auto my-2">
      <table className="border-collapse border border-primary/30 text-xs font-mono w-full">{children}</table>
    </div>
  ),
  th: ({ children }: any) => <th className="border border-primary/30 px-3 py-1 text-primary bg-primary/10 text-left">{children}</th>,
  td: ({ children }: any) => <td className="border border-primary/20 px-3 py-1 text-primary/80">{children}</td>,
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function ChatTab() {
  const { user } = useAuth();
  const headers = getAuthHeaders();
  const { settings, update: updateSettings } = useSettings();

  const [input, setInput] = useState("");
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [attachment, setAttachment] = useState<FileAttachment | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [newMsgId, setNewMsgId] = useState<number | null>(null);
  const [isSendingMsg, setIsSendingMsg] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [boundWarningVisible, setBoundWarningVisible] = useState(false);
  const [optimisticMessages, setOptimisticMessages] = useState<OptimisticMessage[]>([]);

  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { menu, open: openCtx, close: closeCtx } = useContextMenu();

  const { data: sessions, refetch: refetchSessions } = useGetSessions({ request: { headers } });
  const { data: sessionData, refetch: refetchSession } = useGetSession(activeSessionId!, {
    query: { queryKey: [`/api/sessions/${activeSessionId}`], enabled: !!activeSessionId },
    request: { headers },
  });
  const createSession = useCreateSession({ request: { headers } });

  // Auto-select first session on load
  useEffect(() => {
    if (sessions && sessions.length > 0 && !activeSessionId) {
      setActiveSessionId(sessions[0].id);
    }
  }, [sessions]);

  // ── Tab-switch recovery: if last message is from user with no AI response
  //    (meaning AI was mid-generation when user navigated away), poll until done
  useEffect(() => {
    if (!sessionData) return;
    const msgs = sessionData.messages;
    const lastMsg = msgs[msgs.length - 1];
    const isWaiting = lastMsg && lastMsg.role === "user" && !isSendingMsg;

    if (isWaiting) {
      // Start polling every 2.5s
      pollRef.current = setInterval(async () => {
        const res = await refetchSession();
        const latest = res.data?.messages;
        const last = latest?.[latest.length - 1];
        if (last && last.role === "assistant") {
          // AI responded — stop polling, show new message
          if (pollRef.current) clearInterval(pollRef.current);
          setOptimisticMessages([]);
        }
      }, 2500);
    } else {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    }

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [sessionData, activeSessionId, isSendingMsg]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [sessionData?.messages, optimisticMessages, isSendingMsg]);

  // Rename input focus
  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  // File processing
  const processFile = useCallback(async (file: File) => {
    const type = getFileType(file);
    let content = "";
    let preview: string | undefined;

    if (type === "image") {
      preview = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
      content = `[Image: ${file.name}]`;
    } else if (type === "video") {
      content = `[Video: ${file.name}]`;
    } else {
      content = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string) ?? "");
        reader.readAsText(file);
      });
      if (content.length > 3000) content = content.slice(0, 3000) + "\n...[truncated]";
    }
    setAttachment({ name: file.name, type, preview, content });
  }, []);

  // Clipboard paste
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file) { processFile(file); break; }
        }
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [processFile]);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleNewChat = async () => {
    const s = await createSession.mutateAsync({ data: { title: `SESSION_${Date.now().toString(36).toUpperCase()}` } });
    await refetchSessions();
    setActiveSessionId(s.id);
    setOptimisticMessages([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !attachment) return;
    if (isSendingMsg) return;

    let msgContent: string;
    if (attachment) {
      const fileText = attachment.type === "image"
        ? `[Image attached: ${attachment.name}]`
        : attachment.content;
      msgContent = input.trim() ? `${input}\n\n${fileText}` : fileText;
    } else {
      msgContent = input.trim();
    }

    // ── Optimistic: show user message immediately ────────────────────────────
    const optimisticId = `opt_${Date.now()}`;
    const displayContent = attachment
      ? `${input.trim() ? input.trim() + "\n\n" : ""}${attachment.type === "image" ? `📷 ${attachment.name}` : `📎 ${attachment.name}`}`
      : msgContent;

    setOptimisticMessages((prev) => [
      ...prev,
      { id: optimisticId, role: "user", content: displayContent, pending: true },
    ]);
    setInput("");
    setIsSendingMsg(true);

    try {
      let sid = activeSessionId;
      if (!sid) {
        const s = await createSession.mutateAsync({ data: { title: `SESSION_${Date.now().toString(36).toUpperCase()}` } });
        sid = s.id;
        setActiveSessionId(sid);
        await refetchSessions();
      }

      const sessionContext = localStorage.getItem(CONTEXT_KEY) || "";

      const res = await sendMessageApi(sid, {
        content: msgContent,
        ...(attachment ? { fileType: attachment.type, fileName: attachment.name } : {}),
        mode: settings.mode,
        sessionContext,
      }, headers);

      setAttachment(null);
      setNewMsgId(res.id);
      // Fetch updated messages (includes both user + AI)
      await refetchSession();
      // Clear optimistic messages — server has the real ones now
      setOptimisticMessages([]);
    } catch (err: any) {
      console.error("Send failed", err);
      // On error, keep optimistic message but mark it
      setOptimisticMessages((prev) =>
        prev.map((m) =>
          m.id === optimisticId
            ? { ...m, content: m.content + "\n\n**[SEND FAILED]**" }
            : m
        )
      );
    } finally {
      setIsSendingMsg(false);
    }
  };

  const handleRenameStart = (id: number, currentTitle: string) => {
    setRenamingId(id);
    setRenameValue(currentTitle);
  };

  const handleRenameSubmit = async () => {
    if (!renamingId || !renameValue.trim()) { setRenamingId(null); return; }
    try {
      await renameSessionApi(renamingId, renameValue.trim(), headers);
      await refetchSessions();
    } catch {}
    setRenamingId(null);
  };

  const handleDeleteSession = async (id: number) => {
    try {
      await fetch(`${getApiBase()}/api/sessions/${id}`, { method: "DELETE", headers });
      if (activeSessionId === id) { setActiveSessionId(null); setOptimisticMessages([]); }
      await refetchSessions();
    } catch {}
  };

  const handleModeToggle = (newMode: "unbound" | "bound") => {
    if (newMode === "bound" && !settings.boundWarningShown) {
      setBoundWarningVisible(true);
    } else {
      updateSettings({ mode: newMode });
    }
  };

  const acceptBoundWarning = () => {
    updateSettings({ mode: "bound", boundWarningShown: true });
    setBoundWarningVisible(false);
  };

  const isBound = settings.mode === "bound";
  const activeSession = sessions?.find((s) => s.id === activeSessionId);

  // Merge server messages + optimistic messages, deduplicating by content
  const serverMessages = sessionData?.messages ?? [];
  const displayOptimistic = optimisticMessages.filter(
    (om) => !serverMessages.some((sm) => sm.role === "user" && sm.content === om.content)
  );
  const allMessages = [...serverMessages, ...displayOptimistic];

  // Check if server-side AI is still processing (last message is from user)
  const serverLastIsUser =
    serverMessages.length > 0 && serverMessages[serverMessages.length - 1].role === "user";
  const showAIThinking = isSendingMsg || (serverLastIsUser && !isSendingMsg);

  return (
    <>
      {menu && <ContextMenu items={menu.items} x={menu.x} y={menu.y} onClose={closeCtx} />}

      {/* BOUND WARNING */}
      {boundWarningVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
          <div className="max-w-lg w-full border-2 border-destructive/60 bg-black p-6 relative shadow-[0_0_40px_rgba(255,50,50,0.15)]">
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-destructive" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-destructive" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-destructive" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-destructive" />
            <div className="flex items-center gap-2 mb-4">
              <Shield size={16} className="text-destructive" />
              <span className="text-destructive font-mono text-sm tracking-widest">⚠ PRIVACY WARNING — BOUND MODE</span>
            </div>
            <div className="text-foreground/80 font-mono text-xs leading-relaxed mb-4 space-y-2">
              <p>Activating <span className="text-primary">Hunter-Healer Alpha</span> (Bound mode).</p>
              <p className="text-destructive/90">All messages are processed by OpenRouter. Your prompts <strong>may be collected</strong> for model training.</p>
              <p>Images are analyzed by <span className="text-primary">Healer Alpha</span>, then responded to by <span className="text-primary">Hunter Alpha</span> — a two-stage pipeline.</p>
              <p>Bound mode includes a <span className="text-primary">safety filter</span> that blocks flagged prompts.</p>
            </div>
            <div className="flex gap-3 border-t border-destructive/20 pt-4">
              <button onClick={acceptBoundWarning} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-primary bg-primary/10 text-primary font-mono text-xs uppercase hover:bg-primary hover:text-black transition-colors">
                <Check size={12} /> I UNDERSTAND — ENABLE
              </button>
              <button onClick={() => setBoundWarningVisible(false)} className="px-4 py-2 border border-border text-muted-foreground font-mono text-xs hover:border-primary hover:text-primary transition-colors">
                <X size={12} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex h-full gap-3">
        {/* SESSION LIST */}
        <div className="w-60 flex-shrink-0 flex flex-col gap-2">
          <div className="flex gap-1">
            <button onClick={handleNewChat} className="flex-1 flex items-center gap-2 px-3 py-2 border-2 border-primary text-primary text-xs font-mono uppercase tracking-wider hover:bg-primary hover:text-black transition-colors">
              <PlusCircle size={12} /> NEW_CHAT
            </button>
            <button onClick={() => setShowSettings(!showSettings)} className={`px-2 border-2 transition-colors ${showSettings ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary hover:text-primary"}`}>
              <SlidersHorizontal size={12} />
            </button>
          </div>

          {showSettings && (
            <div className="border border-primary/30 bg-black p-3 flex flex-col gap-4">
              <div className="text-primary text-[10px] font-mono tracking-widest">◈ SETTINGS</div>
              <div className="flex flex-col gap-2">
                <div className="text-muted-foreground text-[10px] font-mono">MODE:</div>
                <div className="flex gap-1">
                  <button onClick={() => handleModeToggle("unbound")} className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 border font-mono text-[10px] uppercase transition-colors ${!isBound ? "border-primary bg-primary/15 text-primary" : "border-border/40 text-muted-foreground hover:border-primary/60 hover:text-primary"}`}>
                    <Zap size={9} /> UNBOUND
                  </button>
                  <button onClick={() => handleModeToggle("bound")} className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 border font-mono text-[10px] uppercase transition-colors ${isBound ? "border-destructive bg-destructive/10 text-destructive" : "border-border/40 text-muted-foreground hover:border-destructive/60 hover:text-destructive"}`}>
                    <Shield size={9} /> BOUND
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="text-muted-foreground text-[10px] font-mono">TYPING SPEED:</div>
                  <div className="text-primary text-[10px] font-mono">{settings.typingDelay}ms</div>
                </div>
                <input type="range" min={1} max={300} value={settings.typingDelay} onChange={(e) => updateSettings({ typingDelay: Number(e.target.value) })} className="w-full h-1 accent-primary" />
                <div className="flex justify-between text-[9px] font-mono text-muted-foreground/40">
                  <span>1ms</span><span>300ms</span>
                </div>
              </div>
            </div>
          )}

          <div className={`px-2 py-1 border text-[9px] font-mono tracking-wider flex items-center gap-2 ${isBound ? "border-destructive/40 text-destructive/80 bg-destructive/5" : "border-primary/20 text-primary/60 bg-primary/5"}`}>
            {isBound ? <Shield size={9} /> : <Zap size={9} />}
            {isBound ? "BOUND — HUNTER-HEALER" : "UNBOUND — HYBRID"}
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col gap-0.5 sessions-scroll">
            {!sessions || sessions.length === 0 ? (
              <div className="text-muted-foreground text-xs font-mono px-2 py-6 text-center border border-border/30">
                NO SESSIONS<br /><span className="text-[9px] opacity-50">START A NEW CHAT</span>
              </div>
            ) : (
              sessions.map((s) => (
                <div
                  key={s.id}
                  onContextMenu={(e) =>
                    openCtx(e, [
                      { label: "Open", icon: <MessageSquare size={10} />, onClick: () => setActiveSessionId(s.id) },
                      { label: "Rename", icon: <Pencil size={10} />, onClick: () => handleRenameStart(s.id, s.title) },
                      { separator: true } as any,
                      { label: "Delete", icon: <Trash2 size={10} />, danger: true, onClick: () => handleDeleteSession(s.id) },
                    ])
                  }
                  onClick={() => { if (renamingId !== s.id) { setActiveSessionId(s.id); setOptimisticMessages([]); } }}
                  className={`group flex items-center gap-2 px-2 py-2 border font-mono text-xs transition-colors cursor-pointer ${activeSessionId === s.id ? "border-primary/50 bg-primary/8 text-primary" : "border-transparent hover:border-primary/20 hover:bg-primary/5 text-muted-foreground hover:text-primary"}`}
                >
                  <MessageSquare size={9} className="flex-shrink-0" />
                  {renamingId === s.id ? (
                    <div className="flex-1 flex items-center gap-1 min-w-0">
                      <input
                        ref={renameInputRef}
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value.toUpperCase())}
                        onKeyDown={(e) => { if (e.key === "Enter") handleRenameSubmit(); if (e.key === "Escape") setRenamingId(null); }}
                        onBlur={handleRenameSubmit}
                        className="flex-1 bg-transparent text-primary font-mono text-xs outline-none border-b border-primary caret-primary uppercase min-w-0"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button onClick={(e) => { e.stopPropagation(); handleRenameSubmit(); }} className="text-primary flex-shrink-0"><Check size={9} /></button>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 truncate uppercase text-[10px]">{s.title}</span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="text-[9px] opacity-40">{s.messageCount}</span>
                        <button onClick={(e) => { e.stopPropagation(); handleRenameStart(s.id, s.title); }} className="opacity-0 group-hover:opacity-50 hover:!opacity-100 text-primary transition-opacity">
                          <Pencil size={8} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* MAIN CHAT */}
        <TerminalPanel
          title={activeSession?.title ?? "CHAT_INTERFACE"}
          className="flex-1 flex flex-col h-full min-w-0 relative"
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          {isDragging && (
            <div className="absolute inset-0 z-50 bg-black/90 border-4 border-primary border-dashed flex items-center justify-center">
              <div className="text-primary text-xl glow-text font-mono text-center">
                <div className="text-4xl mb-4">↓</div>DROP FILE TO ATTACH
              </div>
            </div>
          )}

          <div className={`flex items-center gap-2 px-2 py-0.5 mb-2 border-b text-[9px] font-mono ${isBound ? "border-destructive/20 text-destructive/60" : "border-primary/10 text-primary/30"}`}>
            {isBound ? <Shield size={8} /> : <Zap size={8} />}
            <span>{isBound ? "HUNTER-HEALER ALPHA — BOUND — HEALER VISION + HUNTER TEXT" : "UNBOUND HYBRID — UNRESTRICTED — FULL MARKDOWN"}</span>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto mb-3 space-y-4 min-h-0 px-1 sessions-scroll">
            {allMessages.length === 0 && !showAIThinking && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-12">
                <div className="font-mono text-[80px] leading-none opacity-8 select-none" style={{ color: isBound ? "#ff5555" : "#00ffff" }}>
                  {isBound ? "⚔" : "▓"}
                </div>
                <div className="text-muted-foreground text-sm font-mono">
                  {activeSessionId ? "NO MESSAGES. BEGIN TRANSMISSION." : "SELECT OR CREATE A SESSION."}
                </div>
                <div className="text-muted-foreground/30 text-[10px] font-mono">
                  Ctrl+V to paste · Drag & drop files · Click 📎 to attach
                </div>
              </div>
            )}

            {allMessages.map((msg, idx) => {
              const isOptimistic = "pending" in msg && msg.pending;
              const isLast = idx === allMessages.length - 1;
              const isNewAI = msg.role === "assistant" && (msg as any).id === newMsgId && isLast;

              return (
                <div key={(msg as any).id} className="flex flex-col gap-0.5">
                  {msg.role === "user" ? (
                    <div className={`font-mono transition-opacity ${isOptimistic ? "opacity-70" : "opacity-100"}`}>
                      <span className="text-primary glow-text mr-2 text-sm" style={{ textShadow: isBound ? "0 0 8px rgba(255,80,80,0.6)" : undefined }}>
                        {user?.username || 'user'}@{isBound ? "bound" : "unbound"}:~$
                      </span>
                      <span className="text-foreground/90 text-sm whitespace-pre-wrap">{msg.content}</span>
                      {isOptimistic && <span className="ml-2 text-primary/30 text-[10px] animate-pulse">sending...</span>}
                    </div>
                  ) : (
                    <div className="font-mono pl-3 border-l-2 border-primary/25">
                      <div className={`text-[10px] mb-1.5 ${isBound ? "text-destructive/60" : "text-secondary/80"}`}>
                        [{isBound ? "HUNTER-HEALER" : "UNBOUND-AI"}]&gt;
                      </div>
                      <div className="text-primary/90 text-sm markdown-body">
                        {isNewAI ? (
                          <TypewriterText text={msg.content} delay={settings.typingDelay} />
                        ) : (
                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD}>
                            {msg.content}
                          </ReactMarkdown>
                        )}
                      </div>
                      {(msg as any).model && (
                        <div className="text-[9px] text-muted-foreground/30 mt-1">↳ via {(msg as any).model}</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {showAIThinking && (
              <div className="font-mono pl-3 border-l-2 border-primary/25">
                <div className={`text-[10px] mb-1 ${isBound ? "text-destructive/60" : "text-secondary/80"}`}>
                  [{isBound ? "HUNTER-HEALER" : "UNBOUND-AI"}]&gt;
                </div>
                <div className="text-primary text-sm flex items-center gap-2">
                  <span className="inline-flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="animate-bounce" style={{ animationDelay: `${i * 0.15}s` }}>■</span>
                    ))}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {serverLastIsUser && !isSendingMsg ? "PROCESSING (TAB RESUMED)..." : "PROCESSING..."}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Attachment preview */}
          {attachment && (
            <div className="mb-2 border border-primary/40 bg-primary/5 p-2 flex items-center gap-3">
              {attachment.preview ? (
                <img src={attachment.preview} alt="preview" className="h-10 w-10 object-cover border border-primary/30 flex-shrink-0" />
              ) : (
                <span className="text-lg flex-shrink-0">{fileIcon(attachment.type)}</span>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-primary text-xs font-mono truncate">{attachment.name}</div>
                <div className="text-muted-foreground text-[9px] font-mono uppercase">{attachment.type} attached</div>
              </div>
              <button onClick={() => setAttachment(null)} className="text-destructive hover:text-destructive/70 font-mono text-xs flex-shrink-0">✕</button>
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="mt-auto border-t-2 border-border pt-3">
            <div className="flex items-center gap-2">
              <span className="text-primary glow-text font-mono text-sm whitespace-nowrap flex-shrink-0" style={{ textShadow: isBound ? "0 0 8px rgba(255,80,80,0.8)" : undefined }}>
                {user?.username || 'user'}@{isBound ? "bound" : "unbound"}:~$
              </span>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e as any); } }}
                disabled={isSendingMsg}
                placeholder={attachment ? "Add message... (Enter to send)" : "Type message... (Ctrl+V for file)"}
                className="flex-1 bg-transparent text-primary font-mono text-sm outline-none border-none placeholder:text-muted-foreground/30 caret-primary"
                autoFocus
              />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0" title="Attach file">
                <Paperclip size={14} />
              </button>
              <button
                type="submit"
                disabled={isSendingMsg || (!input.trim() && !attachment)}
                className={`px-3 py-1 border font-mono text-xs uppercase tracking-wider transition-colors disabled:opacity-30 flex-shrink-0 ${isBound ? "border-destructive text-destructive hover:bg-destructive hover:text-black" : "border-primary text-primary hover:bg-primary hover:text-black"}`}
              >
                {isSendingMsg ? "..." : "SEND"}
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,.txt,.json,.md,.csv"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); e.target.value = ""; }}
            />
          </form>
        </TerminalPanel>
      </div>
    </>
  );
}
