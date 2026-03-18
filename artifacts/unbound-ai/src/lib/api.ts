import { supabase } from "./supabase";
import type { User } from "@supabase/supabase-js";

// Session types
export interface Session {
  id: number;
  user_id: string;
  title: string;
  model: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  session_id: number;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

export interface Memory {
  id: number;
  user_id: string;
  content: string;
  created_at: string;
}

export interface ApiKey {
  id: number;
  user_id: string;
  provider: "openrouter" | "huggingface";
  encrypted_key: string;
  created_at: string;
  updated_at: string;
}

// Simple XOR encryption (not secure for production, but hides key from casual view)
function encryptKey(key: string): string {
  const secret = "unbound_secret_";
  let result = "";
  for (let i = 0; i < key.length; i++) {
    result += String.fromCharCode(key.charCodeAt(i) ^ secret.charCodeAt(i % secret.length));
  }
  return btoa(result);
}

function decryptKey(encrypted: string): string {
  const secret = "unbound_secret_";
  const key = atob(encrypted);
  let result = "";
  for (let i = 0; i < key.length; i++) {
    result += String.fromCharCode(key.charCodeAt(i) ^ secret.charCodeAt(i % secret.length));
  }
  return result;
}

// Auth
export const auth = {
  getUser: () => supabase.auth.getUser(),
  getSession: () => supabase.auth.getSession(),
  signUp: (email: string, password: string) => 
    supabase.auth.signUp({ email, password }),
  signInWithPassword: (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password }),
  signOut: () => supabase.auth.signOut(),
  onAuthStateChange: (callback: (event: string, session: any) => void) =>
    supabase.auth.onAuthStateChange(callback),
};

// Sessions
export const sessions = {
  getAll: async (): Promise<Session[]> => {
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  getById: async (id: number): Promise<Session> => {
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  create: async (title: string, model?: string): Promise<Session> => {
    const { data, error } = await supabase
      .from("sessions")
      .insert({ title, model })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  update: async (id: number, updates: Partial<Session>): Promise<Session> => {
    const { data, error } = await supabase
      .from("sessions")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  delete: async (id: number): Promise<void> => {
    const { error } = await supabase
      .from("sessions")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },
};

// Messages
export const messages = {
  getBySession: async (sessionId: number): Promise<Message[]> => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  create: async (
    sessionId: number,
    role: "user" | "assistant" | "system",
    content: string
  ): Promise<Message> => {
    const { data, error } = await supabase
      .from("messages")
      .insert({ session_id: sessionId, role, content })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  delete: async (id: number): Promise<void> => {
    const { error } = await supabase
      .from("messages")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },
};

// Memories
export const memories = {
  getAll: async (): Promise<Memory[]> => {
    const { data, error } = await supabase
      .from("memories")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  create: async (content: string): Promise<Memory> => {
    const { data, error } = await supabase
      .from("memories")
      .insert({ content })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  update: async (id: number, content: string): Promise<Memory> => {
    const { data, error } = await supabase
      .from("memories")
      .update({ content })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  delete: async (id: number): Promise<void> => {
    const { error } = await supabase
      .from("memories")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },
};

// API Keys
export const apiKeys = {
  get: async (provider: "openrouter" | "huggingface"): Promise<string | null> => {
    const { data, error } = await supabase
      .from("api_keys")
      .select("encrypted_key")
      .eq("provider", provider)
      .single();
    if (error) return null;
    return decryptKey(data.encrypted_key);
  },

  set: async (provider: "openrouter" | "huggingface", key: string): Promise<void> => {
    const encrypted = encryptKey(key);
    const { error } = await supabase
      .from("api_keys")
      .upsert({ provider, encrypted_key: encrypted }, { onConflict: "user_id,provider" });
    if (error) throw error;
  },

  delete: async (provider: "openrouter" | "huggingface"): Promise<void> => {
    const { error } = await supabase
      .from("api_keys")
      .delete()
      .eq("provider", provider);
    if (error) throw error;
  },
};

// OpenRouter AI Chat
export async function chatWithAI(
  messages: { role: "user" | "assistant" | "system"; content: string }[],
  model: string = "openai/gpt-4o-mini"
): Promise<string> {
  const apiKey = await apiKeys.get("openrouter");
  if (!apiKey) {
    throw new Error("OpenRouter API key not configured. Please add your API key in settings.");
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": window.location.origin,
      "X-Title": "UnboundAI",
    },
    body: JSON.stringify({
      model,
      messages,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
