export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          email: string
          is_pro: boolean
          streak_days: number
          avatar_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          email: string
          is_pro?: boolean
          streak_days?: number
          avatar_id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          is_pro?: boolean
          streak_days?: number
          avatar_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      routines: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          category: string | null
          last_executed: string | null
          ticking_sound_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          user_id: string
          name: string
          description?: string | null
          category?: string | null
          last_executed?: string | null
          ticking_sound_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          category?: string | null
          last_executed?: string | null
          ticking_sound_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "routines_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      routine_steps: {
        Row: {
          id: string
          routine_id: string
          name: string
          description: string | null
          duration: number
          cue: string
          type: string
          position: number
          step_format: string
          sets: number
          reps: number
          rep_pace: number
          audio_base64: string | null
        }
        Insert: {
          id: string
          routine_id: string
          name: string
          description?: string | null
          duration: number
          cue: string
          type: string
          position: number
          step_format?: string
          sets?: number
          reps?: number
          rep_pace?: number
          audio_base64?: string | null
        }
        Update: {
          id?: string
          routine_id?: string
          name?: string
          description?: string | null
          duration?: number
          cue?: string
          type?: string
          position?: number
          step_format?: string
          sets?: number
          reps?: number
          rep_pace?: number
          audio_base64?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "routine_steps_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          }
        ]
      }
      routine_checklist_items: {
        Row: {
          id: string
          routine_id: string
          label: string
          checked: boolean
          position: number
        }
        Insert: {
          id: string
          routine_id: string
          label: string
          checked?: boolean
          position: number
        }
        Update: {
          id?: string
          routine_id?: string
          label?: string
          checked?: boolean
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "routine_checklist_items_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          }
        ]
      }
      global_checklist_items: {
        Row: {
          id: string
          user_id: string
          label: string
          checked: boolean
          position: number
        }
        Insert: {
          id: string
          user_id: string
          label: string
          checked?: boolean
          position: number
        }
        Update: {
          id?: string
          user_id?: string
          label?: string
          checked?: boolean
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "global_checklist_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      session_history: {
        Row: {
          id: string
          user_id: string
          routine_name: string
          timestamp: string
          duration_minutes: number
          completion_rate: number
          created_at: string
        }
        Insert: {
          id: string
          user_id: string
          routine_name: string
          timestamp: string
          duration_minutes: number
          completion_rate: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          routine_name?: string
          timestamp?: string
          duration_minutes?: number
          completion_rate?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
