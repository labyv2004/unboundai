import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials not configured");
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

// Database table types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: number;
          username: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          username: string;
          password_hash: string;
        };
        Update: {
          username?: string;
          password_hash?: string;
        };
      };
      sessions: {
        Row: {
          id: number;
          user_id: number;
          title: string;
          model: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: number;
          title: string;
          model?: string;
        };
        Update: {
          title?: string;
          model?: string;
        };
      };
      messages: {
        Row: {
          id: number;
          session_id: number;
          role: "user" | "assistant" | "system";
          content: string;
          created_at: string;
        };
        Insert: {
          session_id: number;
          role: "user" | "assistant" | "system";
          content: string;
        };
        Update: {
          content?: string;
        };
      };
      memories: {
        Row: {
          id: number;
          user_id: number;
          content: string;
          created_at: string;
        };
        Insert: {
          user_id: number;
          content: string;
        };
        Update: {
          content?: string;
        };
      };
    };
  };
}
