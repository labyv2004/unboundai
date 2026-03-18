import { useState, useEffect } from "react";
import { TerminalPanel } from "@/components/Terminal";
import { getAuthHeaders } from "@/lib/utils";
import {
  Brain, Plus, Pencil, Trash2, Check, X, Cpu, Server,
  RefreshCw, Link, ToggleLeft, ToggleRight, AlertCircle,
} from "lucide-react";

function getApiBase() {
  return (import.meta as any).env?.BASE_URL?.replace(/\/$/, "") || "";
}

interface Memory {
  id: number;
  content: string;
  source: string;
  createdAt: string;
}

interface McpServer {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  transport: "http" | "sse";
}

const MCP_STORAGE_KEY = "unbound_mcp_servers";

function loadMcpServers(): McpServer[] {
  try {
    return JSON.parse(localStorage.getItem(MCP_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveMcpServers(servers: McpServer[]) {
  localStorage.setItem(MCP_STORAGE_KEY, JSON.stringify(servers));
}

export default function MemoryTab() {
  const [tab, setTab] = useState<"memory" | "context" | "mcp">("memory");
  const headers = getAuthHeaders();

  // ── MEMORY ─────────────────────────────────────────────────────────────────
  const [memories, setMemories] = useState<Memory[]>([]);
  const [memLoading, setMemLoading] = useState(false);
  const [newMemory, setNewMemory] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const fetchMemories = async () => {
    setMemLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/api/memories`, { headers });
      const data = await res.json();
      setMemories(Array.isArray(data) ? data : []);
    } catch {
    } finally {
      setMemLoading(false);
    }
  };

  useEffect(() => { fetchMemories(); }, []);

  const addMemory = async () => {
    if (!newMemory.trim()) return;
    await fetch(`${getApiBase()}/api/memories`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ content: newMemory.trim() }),
    });
    setNewMemory("");
    fetchMemories();
  };

  const saveEdit = async (id: number) => {
    if (!editValue.trim()) return;
    await fetch(`${getApiBase()}/api/memories/${id}`, {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ content: editValue.trim() }),
    });
    setEditingId(null);
    fetchMemories();
  };

  const deleteMemory = async (id: number) => {
    if (!confirm("Delete this memory permanently?")) return;
    await fetch(`${getApiBase()}/api/memories/${id}`, { method: "DELETE", headers });
    fetchMemories();
  };

  // ── CONTEXT ────────────────────────────────────────────────────────────────
  const CONTEXT_KEY = "unbound_session_context";
  const [context, setContext] = useState(() => localStorage.getItem(CONTEXT_KEY) || "");
  const [contextSaved, setContextSaved] = useState(false);

  const saveContext = () => {
    localStorage.setItem(CONTEXT_KEY, context);
    setContextSaved(true);
    setTimeout(() => setContextSaved(false), 2000);
  };

  const clearContext = () => {
    setContext("");
    localStorage.removeItem(CONTEXT_KEY);
  };

  // ── MCP ────────────────────────────────────────────────────────────────────
  const [mcpServers, setMcpServers] = useState<McpServer[]>(loadMcpServers);
  const [addingMcp, setAddingMcp] = useState(false);
  const [mcpForm, setMcpForm] = useState({ name: "", url: "", transport: "http" as "http" | "sse" });

  const saveMcp = () => {
    if (!mcpForm.name.trim() || !mcpForm.url.trim()) return;
    const updated = [
      ...mcpServers,
      {
        id: Date.now().toString(),
        name: mcpForm.name.trim(),
        url: mcpForm.url.trim(),
        enabled: true,
        transport: mcpForm.transport,
      },
    ];
    setMcpServers(updated);
    saveMcpServers(updated);
    setMcpForm({ name: "", url: "", transport: "http" });
    setAddingMcp(false);
  };

  const toggleMcp = (id: string) => {
    const updated = mcpServers.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s));
    setMcpServers(updated);
    saveMcpServers(updated);
  };

  const deleteMcp = (id: string) => {
    const updated = mcpServers.filter((s) => s.id !== id);
    setMcpServers(updated);
    saveMcpServers(updated);
  };

  return (
    <div className="h-full flex flex-col gap-3">
      {/* TAB BAR */}
      <div className="flex gap-1">
        {[
          { key: "memory", label: "CROSS-CHAT MEMORY", icon: Brain },
          { key: "context", label: "SESSION CONTEXT", icon: Cpu },
          { key: "mcp", label: "MCP SERVERS", icon: Server },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as any)}
            className={`flex items-center gap-2 px-3 py-2 border font-mono text-xs uppercase tracking-wider transition-colors ${
              tab === key
                ? "border-primary bg-primary/10 text-primary"
                : "border-border/40 text-muted-foreground hover:border-primary/40 hover:text-primary"
            }`}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      {/* MEMORY TAB */}
      {tab === "memory" && (
        <div className="flex-1 flex flex-col gap-3 min-h-0">
          <TerminalPanel title="CROSS_CHAT_MEMORY" className="flex-1 flex flex-col min-h-0">
            <div className="text-muted-foreground text-[10px] font-mono mb-3 leading-relaxed">
              Memories persist across all conversations. The AI can read and write memories automatically.
              Add <code className="text-primary">[MEMORY: text]</code> to any AI response to save it.
            </div>

            {/* Add new */}
            <div className="flex gap-2 mb-3">
              <input
                value={newMemory}
                onChange={(e) => setNewMemory(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addMemory()}
                placeholder="Add a new memory..."
                className="flex-1 bg-primary/5 border border-primary/30 px-3 py-2 text-primary font-mono text-xs outline-none focus:border-primary/60 placeholder:text-muted-foreground/40"
              />
              <button
                onClick={addMemory}
                disabled={!newMemory.trim()}
                className="px-3 py-2 border border-primary text-primary font-mono text-xs uppercase hover:bg-primary hover:text-black transition-colors disabled:opacity-30"
              >
                <Plus size={13} />
              </button>
              <button
                onClick={fetchMemories}
                className="px-3 py-2 border border-border/40 text-muted-foreground font-mono text-xs hover:border-primary hover:text-primary transition-colors"
                title="Refresh"
              >
                <RefreshCw size={13} />
              </button>
            </div>

            {/* Memory list */}
            <div className="flex-1 overflow-y-auto space-y-2 sessions-scroll">
              {memLoading && (
                <div className="text-muted-foreground text-xs font-mono text-center py-4 animate-pulse">
                  LOADING MEMORIES...
                </div>
              )}
              {!memLoading && memories.length === 0 && (
                <div className="text-muted-foreground/50 text-xs font-mono text-center py-8 border border-border/20">
                  NO MEMORIES STORED<br />
                  <span className="text-[10px] opacity-60">The AI will build memories as you chat</span>
                </div>
              )}
              {memories.map((mem) => (
                <div key={mem.id} className="border border-primary/20 bg-primary/3 p-3 flex items-start gap-3 group">
                  <div className="flex-1 min-w-0">
                    {editingId === mem.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") saveEdit(mem.id); if (e.key === "Escape") setEditingId(null); }}
                          className="flex-1 bg-transparent border-b border-primary text-primary font-mono text-xs outline-none caret-primary"
                          autoFocus
                        />
                        <button onClick={() => saveEdit(mem.id)} className="text-primary"><Check size={12} /></button>
                        <button onClick={() => setEditingId(null)} className="text-muted-foreground"><X size={12} /></button>
                      </div>
                    ) : (
                      <>
                        <div className="text-primary/90 text-xs font-mono leading-relaxed">{mem.content}</div>
                        <div className="text-muted-foreground/40 text-[9px] font-mono mt-1 flex items-center gap-2">
                          <span className={`px-1 border text-[8px] uppercase ${mem.source === "ai" ? "border-secondary/40 text-secondary/60" : "border-primary/30 text-primary/50"}`}>
                            {mem.source === "ai" ? "AI" : "USER"}
                          </span>
                          {new Date(mem.createdAt).toLocaleDateString()}
                        </div>
                      </>
                    )}
                  </div>
                  {editingId !== mem.id && (
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button onClick={() => { setEditingId(mem.id); setEditValue(mem.content); }} className="text-primary/60 hover:text-primary">
                        <Pencil size={11} />
                      </button>
                      <button onClick={() => deleteMemory(mem.id)} className="text-destructive/60 hover:text-destructive">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-primary/20 pt-2 mt-2 text-muted-foreground text-[10px] font-mono">
              {memories.length} MEMORIES · {memories.filter((m) => m.source === "ai").length} AI-GENERATED
            </div>
          </TerminalPanel>
        </div>
      )}

      {/* CONTEXT TAB */}
      {tab === "context" && (
        <TerminalPanel title="SESSION_CONTEXT // TEMPORARY_MEMORY" className="flex-1 flex flex-col">
          <div className="text-muted-foreground text-[10px] font-mono mb-3 leading-relaxed">
            Session context is injected into every new conversation as temporary notes. Unlike memories, it
            doesn't persist automatically — you manage it manually. Use it for current goals, preferences, or
            constraints for this work session.
          </div>

          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Enter session context... (e.g., 'Working on a Python project. User prefers concise code. No markdown formatting needed.')"
            className="flex-1 bg-primary/5 border border-primary/30 p-3 text-primary font-mono text-xs outline-none resize-none focus:border-primary/60 placeholder:text-muted-foreground/30 leading-relaxed min-h-[200px]"
          />

          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-primary/20">
            <button
              onClick={saveContext}
              className="flex items-center gap-2 px-4 py-2 border border-primary text-primary font-mono text-xs uppercase hover:bg-primary hover:text-black transition-colors"
            >
              {contextSaved ? <><Check size={12} /> SAVED</> : <><Check size={12} /> SAVE CONTEXT</>}
            </button>
            <button
              onClick={clearContext}
              className="flex items-center gap-2 px-4 py-2 border border-destructive/40 text-destructive font-mono text-xs uppercase hover:bg-destructive hover:text-black transition-colors"
            >
              <X size={12} /> CLEAR
            </button>
            <div className="text-muted-foreground/50 text-[10px] font-mono ml-auto">
              {context.length} chars · Saved to browser storage
            </div>
          </div>
        </TerminalPanel>
      )}

      {/* MCP TAB */}
      {tab === "mcp" && (
        <TerminalPanel title="MCP_SERVER_MANAGEMENT // MODEL_CONTEXT_PROTOCOL" className="flex-1 flex flex-col">
          <div className="flex items-start gap-2 mb-3 p-2 border border-primary/20 bg-primary/5">
            <AlertCircle size={12} className="text-primary/60 mt-0.5 flex-shrink-0" />
            <div className="text-muted-foreground text-[10px] font-mono leading-relaxed">
              MCP (Model Context Protocol) lets you connect external data sources and tools. Add your MCP server
              URLs here — they'll be included in the AI's system context. Full tool execution requires server-side
              WebSocket/SSE relay support.
            </div>
          </div>

          {/* Add server form */}
          {addingMcp ? (
            <div className="border border-primary/40 p-4 mb-3 flex flex-col gap-3 bg-primary/5">
              <div className="text-primary text-[10px] font-mono tracking-widest">▸ ADD MCP SERVER</div>
              <div className="flex gap-2">
                <input
                  placeholder="Server name..."
                  value={mcpForm.name}
                  onChange={(e) => setMcpForm({ ...mcpForm, name: e.target.value })}
                  className="flex-1 bg-transparent border border-primary/30 px-3 py-2 text-primary font-mono text-xs outline-none focus:border-primary/60 placeholder:text-muted-foreground/40"
                />
                <select
                  value={mcpForm.transport}
                  onChange={(e) => setMcpForm({ ...mcpForm, transport: e.target.value as any })}
                  className="bg-black border border-primary/30 px-2 py-2 text-primary font-mono text-xs outline-none"
                >
                  <option value="http">HTTP</option>
                  <option value="sse">SSE</option>
                </select>
              </div>
              <input
                placeholder="Server URL (e.g., http://localhost:3001/mcp)..."
                value={mcpForm.url}
                onChange={(e) => setMcpForm({ ...mcpForm, url: e.target.value })}
                className="bg-transparent border border-primary/30 px-3 py-2 text-primary font-mono text-xs outline-none focus:border-primary/60 placeholder:text-muted-foreground/40"
              />
              <div className="flex gap-2">
                <button onClick={saveMcp} className="flex items-center gap-2 px-3 py-2 border border-primary text-primary font-mono text-xs uppercase hover:bg-primary hover:text-black transition-colors">
                  <Check size={12} /> ADD SERVER
                </button>
                <button onClick={() => setAddingMcp(false)} className="px-3 py-2 border border-border/40 text-muted-foreground font-mono text-xs uppercase hover:border-primary hover:text-primary transition-colors">
                  <X size={12} /> CANCEL
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingMcp(true)}
              className="flex items-center gap-2 px-3 py-2 border border-primary/40 text-primary/70 font-mono text-xs uppercase hover:border-primary hover:text-primary transition-colors mb-3 self-start"
            >
              <Plus size={12} /> ADD MCP SERVER
            </button>
          )}

          {/* Server list */}
          <div className="flex-1 overflow-y-auto space-y-2 sessions-scroll">
            {mcpServers.length === 0 && (
              <div className="text-muted-foreground/50 text-xs font-mono text-center py-8 border border-border/20">
                NO MCP SERVERS CONFIGURED<br />
                <span className="text-[10px] opacity-60">Add an MCP server to extend AI capabilities</span>
              </div>
            )}
            {mcpServers.map((server) => (
              <div key={server.id} className={`border p-3 flex items-center gap-3 ${server.enabled ? "border-primary/30 bg-primary/5" : "border-border/20 bg-black/30 opacity-60"}`}>
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0 status-dot"
                  style={{ backgroundColor: server.enabled ? "#00ff64" : "#666", color: server.enabled ? "#00ff64" : "#666" }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-primary text-xs font-mono">{server.name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Link size={9} className="text-muted-foreground/50" />
                    <span className="text-muted-foreground/60 text-[10px] font-mono truncate">{server.url}</span>
                    <span className="text-[9px] px-1 border border-primary/20 text-primary/50 font-mono uppercase">{server.transport}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => toggleMcp(server.id)} className="text-primary/60 hover:text-primary transition-colors">
                    {server.enabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  </button>
                  <button onClick={() => deleteMcp(server.id)} className="text-destructive/60 hover:text-destructive transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </TerminalPanel>
      )}
    </div>
  );
}
