export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      chat_sessions: {
        Row: {
          id: string
          user_id: string | null
          title: string
          preview: string | null
          status: "active" | "completed"
          started_at: string
          ended_at: string | null
          duration_minutes: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          title?: string
          preview?: string | null
          status?: "active" | "completed"
          started_at?: string
          ended_at?: string | null
          duration_minutes?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          title?: string
          preview?: string | null
          status?: "active" | "completed"
          started_at?: string
          ended_at?: string | null
          duration_minutes?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          session_id: string
          role: "user" | "assistant"
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          role: "user" | "assistant"
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          role?: "user" | "assistant"
          content?: string
          created_at?: string
        }
        Relationships: []
      }
      session_keywords: {
        Row: {
          id: string
          session_id: string
          label: string
          intensity: "high" | "medium" | "low"
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          label: string
          intensity?: "high" | "medium" | "low"
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          label?: string
          intensity?: "high" | "medium" | "low"
          created_at?: string
        }
        Relationships: []
      }
      session_emotions: {
        Row: {
          id: string
          session_id: string
          label: string
          value: number
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          label: string
          value: number
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          label?: string
          value?: number
          created_at?: string
        }
        Relationships: []
      }
      action_items: {
        Row: {
          id: string
          session_id: string
          text: string
          is_completed: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          text: string
          is_completed?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          text?: string
          is_completed?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// Convenience types
export type ChatSession = Database["public"]["Tables"]["chat_sessions"]["Row"]
export type Message = Database["public"]["Tables"]["messages"]["Row"]
export type SessionKeyword = Database["public"]["Tables"]["session_keywords"]["Row"]
export type SessionEmotion = Database["public"]["Tables"]["session_emotions"]["Row"]
export type ActionItem = Database["public"]["Tables"]["action_items"]["Row"]
