import { TerminalPanel } from "@/components/Terminal";
import { useGetSessions, useDeleteSession } from "@workspace/api-client-react";
import { getAuthHeaders } from "@/lib/utils";
import { format } from "date-fns";
import { Trash2, MessageSquare, Clock, Hash } from "lucide-react";
import { useLocation } from "wouter";

export default function SessionsTab() {
  const headers = getAuthHeaders();

  const { data: sessions, isLoading, refetch } = useGetSessions({
    request: { headers },
  });

  const deleteMutation = useDeleteSession({ request: { headers } });
  const [, setLocation] = useLocation();

  const handleDelete = async (id: number) => {
    if (!confirm("CONFIRM: Permanently delete this session log?")) return;
    try {
      await deleteMutation.mutateAsync({ sessionId: id });
      refetch();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  return (
    <TerminalPanel title="SESSION_LOG // DATABASE" className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header row */}
      <div className="grid grid-cols-[40px_1fr_80px_160px_80px] gap-2 px-3 py-2 border-b border-primary/20 text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">
        <div className="flex items-center gap-1"><Hash size={10} /> ID</div>
        <div className="flex items-center gap-1"><MessageSquare size={10} /> SESSION</div>
        <div>MSGS</div>
        <div className="flex items-center gap-1"><Clock size={10} /> CREATED</div>
        <div className="text-right">ACTION</div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="px-3 py-8 text-center text-muted-foreground text-xs font-mono animate-pulse">
            ▸ FETCHING RECORDS FROM DATABASE...
          </div>
        )}

        {!isLoading && (!sessions || sessions.length === 0) && (
          <div className="px-3 py-12 text-center">
            <div className="text-muted-foreground text-xs font-mono">NO RECORDS FOUND</div>
            <div className="text-muted-foreground/40 text-[10px] font-mono mt-1">Start chatting to create session logs</div>
          </div>
        )}

        {sessions?.map((s, idx) => (
          <div
            key={s.id}
            className="grid grid-cols-[40px_1fr_80px_160px_80px] gap-2 px-3 py-2.5 border-b border-primary/10 hover:bg-primary/5 transition-colors group items-center"
          >
            <div className="text-muted-foreground text-xs font-mono">#{s.id}</div>
            <button
              onClick={() => setLocation("/dashboard")}
              className="text-primary text-xs font-mono text-left truncate hover:glow-text hover:underline uppercase"
            >
              {s.title}
            </button>
            <div className="text-secondary text-xs font-mono text-center">{s.messageCount}</div>
            <div className="text-muted-foreground text-[10px] font-mono">
              {format(new Date(s.createdAt), "MM-dd HH:mm:ss")}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => handleDelete(s.id)}
                disabled={deleteMutation.isPending}
                className="text-destructive/60 hover:text-destructive transition-colors disabled:opacity-40 p-1"
                title="Delete session"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {sessions && sessions.length > 0 && (
        <div className="border-t border-primary/20 pt-2 px-3 text-[10px] font-mono text-muted-foreground">
          {sessions.length} SESSION{sessions.length !== 1 ? "S" : ""} • {sessions.reduce((a, s) => a + s.messageCount, 0)} TOTAL MESSAGES
        </div>
      )}
    </TerminalPanel>
  );
}
