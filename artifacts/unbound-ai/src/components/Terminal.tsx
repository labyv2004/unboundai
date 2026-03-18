import React, { InputHTMLAttributes, ButtonHTMLAttributes, forwardRef, useEffect, useState, DragEvent } from "react";
import { cn } from "@/lib/utils";

export const CRTOverlay = () => (
  <>
    <div className="crt-overlay" />
    <div className="crt-scanlines" />
    <div className="crt-vignette" />
  </>
);

export const ASCII_LOGO = `
██╗░░  ██╗░░░██╗███╗░░██╗██████╗░░█████╗░██╗░░░██╗███╗░░██╗██████╗░░█████╗░██╗
╚██╗░  ██║░░░██║████╗░██║██╔══██╗██╔══██╗██║░░░██║████╗░██║██╔══██╗██╔══██╗██║
░╚██╗  ██║░░░██║██╔██╗██║██████╦╝██║░░██║██║░░░██║██╔██╗██║██║░░██║███████║██║
░██╔╝  ██║░░░██║██║╚████║██╔══██╗██║░░██║██║░░░██║██║╚████║██║░░██║██╔══██║██║
██╔╝░  ╚██████╔╝██║░╚███║██████╦╝╚█████╔╝╚██████╔╝██║░╚███║██████╔╝██║░░██║██║
╚═╝░░  ░╚═════╝░╚═╝░░╚══╝╚═════╝░░╚════╝░░╚═════╝░╚═╝░░╚══╝╚═════╝░╚═╝░░╚═╝╚═╝
`;

export interface TerminalPanelProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  titleClassName?: string;
  onDragOver?: (e: DragEvent<HTMLDivElement>) => void;
  onDragLeave?: (e: DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: DragEvent<HTMLDivElement>) => void;
}

export const TerminalPanel = ({
  children,
  title,
  className,
  titleClassName,
  onDragOver,
  onDragLeave,
  onDrop,
}: TerminalPanelProps) => (
  <div
    className={cn("border border-primary/30 bg-black/95 p-4 relative panel-glow", className)}
    onDragOver={onDragOver}
    onDragLeave={onDragLeave}
    onDrop={onDrop}
  >
    {/* Corner decorations */}
    <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-primary" />
    <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-primary" />
    <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-primary" />
    <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-primary" />

    {title && (
      <div className={cn("absolute -top-3 left-6 bg-black px-2 text-primary glow-text text-xs font-mono tracking-widest uppercase", titleClassName)}>
        ▸ {title}
      </div>
    )}
    <div className="h-full flex flex-col relative z-10">
      {children}
    </div>
  </div>
);

export interface TerminalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  variant?: "default" | "danger";
}

export const TerminalButton = forwardRef<HTMLButtonElement, TerminalButtonProps>(
  ({ className, active, variant = "default", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "px-3 py-1.5 border font-mono text-xs uppercase tracking-wider transition-all duration-150",
          "focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden",
          variant === "danger"
            ? active
              ? "bg-destructive text-black border-destructive"
              : "bg-transparent text-destructive border-destructive hover:bg-destructive hover:text-black"
            : active
              ? "bg-primary text-black border-primary shadow-[0_0_12px_rgba(0,255,255,0.4)]"
              : "bg-transparent text-primary border-primary/60 hover:border-primary hover:bg-primary/10 hover:shadow-[0_0_8px_rgba(0,255,255,0.2)]",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
TerminalButton.displayName = "TerminalButton";

export interface TerminalInputProps extends InputHTMLAttributes<HTMLInputElement> {
  prefix?: string;
}

export const TerminalInput = forwardRef<HTMLInputElement, TerminalInputProps>(
  ({ className, prefix, ...props }, ref) => {
    return (
      <div className="flex items-center w-full group">
        {prefix && <span className="text-primary mr-2 whitespace-nowrap glow-text font-mono text-sm">{prefix}</span>}
        <div className="relative flex-1 flex items-center">
          <input
            ref={ref}
            className={cn(
              "w-full bg-transparent text-primary placeholder:text-muted-foreground font-mono text-sm",
              "border-none outline-none focus:outline-none caret-primary",
              className
            )}
            {...props}
          />
        </div>
      </div>
    );
  }
);
TerminalInput.displayName = "TerminalInput";

export const TypewriterText = ({
  text,
  delay = 20,
  onComplete,
  className
}: {
  text: string;
  delay?: number;
  onComplete?: () => void;
  className?: string;
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setDisplayedText("");
    setCurrentIndex(0);
  }, [text]);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, delay);
      return () => clearTimeout(timeout);
    } else if (onComplete && currentIndex === text.length && text.length > 0) {
      onComplete();
    }
    return undefined;
  }, [currentIndex, delay, text, onComplete]);

  return (
    <span className={cn("whitespace-pre-wrap", className)}>
      {displayedText}
      {currentIndex < text.length && (
        <span className="inline-block w-2 h-4 bg-primary animate-cursor-blink align-middle ml-0.5" />
      )}
    </span>
  );
};
