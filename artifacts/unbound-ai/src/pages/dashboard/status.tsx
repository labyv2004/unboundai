import { TerminalPanel } from "@/components/Terminal";
import { useSettings } from "@/hooks/use-settings";
import { ArrowDown, CheckCircle, Shield, Zap } from "lucide-react";

const UNBOUND_PIPELINE = [
  {
    layer: "INPUT LAYER",
    model: "stepfun/step-3.5-flash:free",
    desc: "Fast preprocessing & intent classification",
    color: "#00ffff",
    active: true,
  },
  {
    layer: "CENTRAL LAYER",
    model: "arcee-ai/trinity-large-preview:free",
    desc: "Core reasoning & context management",
    color: "#00ffff",
    active: true,
  },
  {
    layer: "OPTIONAL LAYERS",
    models: [
      "nvidia/nemotron-3-super-120b",
      "z-ai/glm-4.5-air",
      "nvidia/nemotron-3-nano-30b",
    ],
    desc: "Specialized task routing (activated on demand)",
    color: "#5577ff",
    active: false,
  },
  {
    layer: "VISION LAYER",
    model: "nvidia/nemotron-nano-12b-v2-vl:free",
    desc: "Multimodal image & video understanding",
    color: "#00ff64",
    active: true,
  },
  {
    layer: "OUTPUT LAYER",
    model: "Dogge/llama-3-70B-instruct-uncensored:featherless-ai",
    desc: "Unrestricted generation — no safety filters",
    color: "#ff6655",
    badge: "UNCENSORED",
    active: true,
  },
];

const BOUND_PIPELINE = [
  {
    layer: "SAFETY LAYER",
    model: "arcee-ai/trinity-large-preview:free",
    desc: "Prompt safety classification — blocks unsafe requests",
    color: "#ff9944",
    badge: "GUARD",
    active: true,
  },
  {
    layer: "TEXT LAYER",
    model: "openrouter/hunter-alpha",
    desc: "Hunter Alpha — advanced reasoning & text generation",
    color: "#00ffff",
    active: true,
  },
  {
    layer: "VISION LAYER",
    model: "openrouter/healer-alpha",
    desc: "Healer Alpha — image, audio & video processing",
    color: "#00ff64",
    active: true,
  },
];

interface PipelineNode {
  layer: string;
  model?: string;
  models?: string[];
  desc: string;
  color: string;
  badge?: string;
  active: boolean;
}

function PipelineView({ nodes, mode }: { nodes: PipelineNode[]; mode: string }) {
  return (
    <div className="flex flex-col items-center gap-0 py-2">
      {nodes.map((node, i) => (
        <div key={node.layer} className="flex flex-col items-center w-full max-w-lg">
          {i > 0 && (
            <div className="flex flex-col items-center py-1">
              <div className="w-px h-4 bg-primary/30" />
              <ArrowDown size={12} className="text-primary/50" />
              <div className="w-px h-4 bg-primary/30" />
            </div>
          )}
          <div
            className="w-full border p-3 flex flex-col gap-2"
            style={{
              borderColor: `${node.color}40`,
              backgroundColor: `${node.color}06`,
              boxShadow: node.active ? `0 0 8px ${node.color}15` : undefined,
            }}
          >
            <div className="flex items-center gap-2">
              {node.active ? (
                <div
                  className="w-2 h-2 rounded-full status-dot flex-shrink-0"
                  style={{ backgroundColor: node.color, color: node.color }}
                />
              ) : (
                <div className="w-2 h-2 rounded-full bg-muted-foreground/30 flex-shrink-0" />
              )}
              <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: node.color }}>
                [{node.layer}]
              </span>
              {node.badge && (
                <span
                  className="text-[9px] font-mono px-1.5 py-0.5 border ml-auto"
                  style={{ borderColor: `${node.color}60`, color: node.color }}
                >
                  {node.badge}
                </span>
              )}
              {!node.active && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 border border-muted/40 text-muted-foreground ml-auto">
                  STANDBY
                </span>
              )}
            </div>

            {node.model ? (
              <div className="font-mono text-xs text-primary/90 pl-4">{node.model}</div>
            ) : (
              <div className="flex flex-col gap-0.5 pl-4">
                {node.models?.map((m) => (
                  <div key={m} className="font-mono text-xs text-muted-foreground">
                    • {m}
                  </div>
                ))}
              </div>
            )}

            <div className="font-mono text-[10px] text-muted-foreground/60 pl-4 italic">{node.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function StatusTab() {
  const { settings, update } = useSettings();
  const isBound = settings.mode === "bound";

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex gap-4 h-full min-h-0">
        {/* PIPELINE */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* Mode selector */}
          <div className="flex gap-2">
            <button
              onClick={() => update({ mode: "unbound" })}
              className={`flex items-center gap-2 px-4 py-2 border font-mono text-xs uppercase tracking-wider transition-colors ${
                !isBound
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/40 text-muted-foreground hover:border-primary/50 hover:text-primary"
              }`}
            >
              <Zap size={11} /> UNBOUND HYBRID
            </button>
            <button
              onClick={() => update({ mode: "bound" })}
              className={`flex items-center gap-2 px-4 py-2 border font-mono text-xs uppercase tracking-wider transition-colors ${
                isBound
                  ? "border-destructive bg-destructive/10 text-destructive"
                  : "border-border/40 text-muted-foreground hover:border-destructive/50 hover:text-destructive"
              }`}
            >
              <Shield size={11} /> HUNTER-HEALER ALPHA
            </button>
          </div>

          <TerminalPanel
            title={isBound ? "HUNTER_HEALER_ARCHITECTURE" : "UNBOUND_HYBRID_ARCHITECTURE"}
            className="flex-1 overflow-y-auto"
          >
            <PipelineView nodes={isBound ? BOUND_PIPELINE : UNBOUND_PIPELINE} mode={settings.mode} />
          </TerminalPanel>
        </div>

        {/* RIGHT PANELS */}
        <div className="w-64 flex flex-col gap-3">
          <TerminalPanel title="SYSTEM_STATUS" className="flex-shrink-0">
            <div className="flex flex-col gap-3">
              {[
                { label: "API GATEWAY", value: "ONLINE", ok: true },
                { label: "PRIMARY API", value: "CONNECTED", ok: true },
                { label: "DATABASE", value: "ACTIVE", ok: true },
                { label: "AUTH MODULE", value: "JWT/ACTIVE", ok: true },
                { label: "SAFETY LAYER", value: isBound ? "ACTIVE" : "BYPASSED", ok: isBound },
                { label: "ENCRYPTION", value: "AES-256", ok: true },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between font-mono text-[10px]">
                  <span className="text-muted-foreground uppercase tracking-wider">{item.label}</span>
                  <div className="flex items-center gap-1">
                    <div
                      className="w-1.5 h-1.5 rounded-full status-dot"
                      style={{
                        backgroundColor: item.ok ? "#00ff64" : "#aaaaaa",
                        color: item.ok ? "#00ff64" : "#aaaaaa",
                      }}
                    />
                    <span style={{ color: item.ok ? "#00ff64" : "#aaaaaa" }}>{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </TerminalPanel>

          <TerminalPanel title="ACTIVE_MODE">
            <div className="flex flex-col gap-2">
              <div
                className={`px-3 py-2 border text-center font-mono text-xs uppercase tracking-widest ${
                  isBound
                    ? "border-destructive/40 text-destructive bg-destructive/5"
                    : "border-primary/40 text-primary bg-primary/5"
                }`}
              >
                {isBound ? (
                  <><Shield size={12} className="inline mr-2" />BOUND</>
                ) : (
                  <><Zap size={12} className="inline mr-2" />UNBOUND</>
                )}
              </div>
              <div className="text-muted-foreground text-[10px] font-mono leading-relaxed">
                {isBound
                  ? "Safety filtered · OpenRouter · Privacy limited · Hunter-Healer Alpha routing"
                  : "Unrestricted · No filters · Featherless output layer · Full neural routing"}
              </div>
            </div>
          </TerminalPanel>

          <TerminalPanel title="CAPABILITIES">
            <div className="flex flex-col gap-1.5">
              {[
                { cap: "Multi-session chat history", ok: true },
                { cap: "File processing (img/txt/json/video)", ok: true },
                { cap: "Vision / image analysis", ok: true },
                { cap: "Unrestricted responses", ok: !isBound },
                { cap: "Safety content filter", ok: isBound },
                { cap: "Model routing pipeline", ok: true },
                { cap: "Custom typing speed", ok: true },
                { cap: "Chat rename & context menu", ok: true },
              ].map(({ cap, ok }) => (
                <div key={cap} className="flex items-start gap-2 font-mono text-[10px]">
                  <CheckCircle
                    size={10}
                    className="mt-0.5 flex-shrink-0"
                    style={{ color: ok ? "#00ff64" : "#5577ff" }}
                  />
                  <span className="text-muted-foreground">{cap}</span>
                </div>
              ))}
            </div>
          </TerminalPanel>
        </div>
      </div>
    </div>
  );
}
