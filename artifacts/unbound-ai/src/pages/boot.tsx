import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CRTOverlay } from "@/components/Terminal";

const BOOT_LINES = [
  { text: "UNBOUND AI BIOS v2.1.4 [BETA]", color: "#00ffff", delay: 0 },
  { text: "Copyright (C) 2025 Unbound Systems Corp. — unboundai.replit.app", color: "#00ffff", delay: 200 },
  { text: "", delay: 380 },
  { text: "CPU: Neural Core Array @ 4.2 THz ................ OK", color: "#00ff64", delay: 500 },
  { text: "RAM: 256TB Quantum Memory ........................ OK", color: "#00ff64", delay: 700 },
  { text: "VRAM: NEMOTRON-ULTRA 120B Tensor Array .......... OK", color: "#00ff64", delay: 900 },
  { text: "", delay: 1050 },
  { text: "MODEL ROUTING TABLE:", color: "#00ffff", delay: 1150 },
  { text: "  [UNBOUND] INPUT   → stepfun/step-3.5-flash:free", color: "#5577ff", delay: 1350 },
  { text: "  [UNBOUND] CENTRAL → arcee-ai/trinity-large-preview:free", color: "#5577ff", delay: 1500 },
  { text: "  [UNBOUND] VISION  → nvidia/nemotron-nano-12b-v2-vl:free", color: "#5577ff", delay: 1650 },
  { text: "  [UNBOUND] OUTPUT  → Nous-Hermes-2-Mixtral-8x7B-DPO [NO FILTERS]", color: "#ff6655", delay: 1800 },
  { text: "  [BOUND]   GUARD   → arcee-ai/trinity (safety classifier)", color: "#ff9944", delay: 1950 },
  { text: "  [BOUND]   TEXT    → openrouter/hunter-alpha", color: "#44aaff", delay: 2100 },
  { text: "  [BOUND]   VISION  → openrouter/healer-alpha", color: "#44aaff", delay: 2250 },
  { text: "", delay: 2400 },
  { text: "FEATURE MODULES:", color: "#00ffff", delay: 2500 },
  { text: "  ✓ Cross-chat persistent memory (user + AI-driven)", color: "#00ff64", delay: 2650 },
  { text: "  ✓ Session context injection (temporary memory)", color: "#00ff64", delay: 2800 },
  { text: "  ✓ MCP server configuration (Model Context Protocol)", color: "#00ff64", delay: 2950 },
  { text: "  ✓ Full markdown rendering (GFM + syntax highlight)", color: "#00ff64", delay: 3100 },
  { text: "  ✓ File upload: image / text / JSON / video", color: "#00ff64", delay: 3250 },
  { text: "  ✓ Multi-session chat + rename + context menu", color: "#00ff64", delay: 3400 },
  { text: "  ✓ Dual-mode: Unbound Hybrid / Hunter-Healer Bound", color: "#00ff64", delay: 3550 },
  { text: "  ✓ Adjustable typewriter speed (1–300ms/char)", color: "#00ff64", delay: 3700 },
  { text: "", delay: 3850 },
  { text: "Establishing secure connection ................... OK", color: "#00ff64", delay: 3950 },
  { text: "Encryption: AES-256-GCM ......................... ACTIVE", color: "#00ff64", delay: 4100 },
  { text: "", delay: 4250 },
  { text: "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%", color: "#00ffff", delay: 4350 },
  { text: "", delay: 4550 },
  { text: "BOOT COMPLETE — TRANSFERRING CONTROL TO MAIN OS.", color: "#00ffff", delay: 4650, bold: true },
];

export default function BootScreen() {
  const [, setLocation] = useLocation();
  const [visibleLines, setVisibleLines] = useState<number[]>([]);

  useEffect(() => {
    const timers = BOOT_LINES.map((line, idx) =>
      setTimeout(() => setVisibleLines((prev) => [...prev, idx]), line.delay)
    );
    const redirect = setTimeout(() => setLocation("/auth"), 5500);
    return () => { timers.forEach(clearTimeout); clearTimeout(redirect); };
  }, [setLocation]);

  return (
    <div className="h-screen w-full bg-black flex items-start justify-start p-8 overflow-hidden relative select-none">
      <CRTOverlay />
      <div className="w-full max-w-3xl z-10">
        <div className="flex items-center gap-4 mb-5 pb-3 border-b border-cyan-500/20">
          <span className="text-cyan-600 text-[10px] font-mono tracking-widest">BIOS ROM v2.1.4</span>
          <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/30 to-transparent" />
          <span className="text-cyan-600 text-[10px] font-mono">UNBOUND AI [BETA]</span>
        </div>

        <div className="space-y-0.5">
          {BOOT_LINES.map((line, idx) => (
            <div
              key={idx}
              className="font-mono text-sm leading-6 transition-opacity duration-100"
              style={{
                opacity: visibleLines.includes(idx) ? 1 : 0,
                color: line.color ?? "#00ffff",
                textShadow: line.color ? `0 0 5px ${line.color}50` : undefined,
                fontWeight: (line as any).bold ? "bold" : "normal",
              }}
            >
              {line.text || "\u00A0"}
            </div>
          ))}
        </div>

        {visibleLines.length > 0 && (
          <div className="mt-1">
            <span
              className="inline-block w-2.5 h-4 bg-cyan-400 animate-cursor-blink"
              style={{ filter: "drop-shadow(0 0 4px #00ffff)" }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
