import { useEffect, useRef, useState, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ContextMenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  danger?: boolean;
  separator?: boolean;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  x: number;
  y: number;
  onClose: () => void;
}

export function ContextMenu({ items, x, y, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent && e.key === "Escape") {
        onClose();
      } else if (e instanceof MouseEvent && ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", handler);
    };
  }, [onClose]);

  useEffect(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (x + rect.width > vw) ref.current.style.left = `${vw - rect.width - 8}px`;
    if (y + rect.height > vh) ref.current.style.top = `${vh - rect.height - 8}px`;
  }, [x, y]);

  return (
    <div
      ref={ref}
      className="fixed z-[9999] min-w-[200px] border border-primary/50 bg-black shadow-[0_0_20px_rgba(0,255,255,0.15)] py-1"
      style={{ left: x, top: y }}
    >
      <div className="px-3 py-1 border-b border-primary/20 mb-1">
        <span className="text-primary/40 text-[9px] font-mono tracking-widest">◈ CONTEXT</span>
      </div>

      {items.map((item, idx) =>
        item.separator ? (
          <div key={idx} className="h-px bg-primary/15 mx-2 my-1" />
        ) : (
          <button
            key={idx}
            onClick={() => { item.onClick(); onClose(); }}
            className={cn(
              "w-full text-left flex items-center gap-2 px-3 py-2 font-mono text-xs uppercase tracking-wider transition-colors",
              item.danger
                ? "text-destructive hover:bg-destructive hover:text-black"
                : "text-primary/80 hover:bg-primary/10 hover:text-primary"
            )}
          >
            {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
            {item.label}
          </button>
        )
      )}
    </div>
  );
}

export function useContextMenu() {
  const [menu, setMenu] = useState<{ x: number; y: number; items: ContextMenuItem[] } | null>(null);

  const open = (e: React.MouseEvent, items: ContextMenuItem[]) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ x: e.clientX, y: e.clientY, items });
  };

  const close = () => setMenu(null);

  return { menu, open, close };
}
