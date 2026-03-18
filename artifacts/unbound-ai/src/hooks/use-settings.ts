import { useState, useEffect } from "react";

export type ChatMode = "unbound" | "bound";

interface Settings {
  typingDelay: number;
  mode: ChatMode;
  boundWarningShown: boolean;
}

const DEFAULTS: Settings = {
  typingDelay: 15,
  mode: "unbound",
  boundWarningShown: false,
};

const STORAGE_KEY = "unbound_settings";

function load(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

function save(s: Settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(load);

  const update = (patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      save(next);
      return next;
    });
  };

  return { settings, update };
}
