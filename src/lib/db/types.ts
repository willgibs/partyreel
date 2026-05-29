export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      events: {
        Row: {
          accepting_uploads: boolean
          created_at: string
          deleted_at: string | null
          description: string | null
          event_date: string | null
          host_id: string
          id: string
          is_public: boolean
          moderation_mode: Database["public"]["Enums"]["moderation_mode"]
          name: string
          purge_at: string | null
          qr_token: string
          require_display_name: boolean
          require_email: boolean
          share_token: string
          updated_at: string
        }
        Insert: {
          accepting_uploads?: boolean
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          event_date?: string | null
          host_id: string
          id?: string
          is_public?: boolean
          moderation_mode?: Database["public"]["Enums"]["moderation_mode"]
          name: string
          purge_at?: string | null
          qr_token?: string
          require_display_name?: boolean
          require_email?: boolean
          share_token?: string
          updated_at?: string
        }
        Update: {
          accepting_uploads?: boolean
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          event_date?: string | null
          host_id?: string
          id?: string
          is_public?: boolean
          moderation_mode?: Database["public"]["Enums"]["moderation_mode"]
          name?: string
          purge_at?: string | null
          qr_token?: string
          require_display_name?: boolean
          require_email?: boolean
          share_token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          event_id: string
          id: string
          session_token: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          event_id: string
          id?: string
          session_token: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          event_id?: string
          id?: string
          session_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "guests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      highlight_reels: {
        Row: {
          created_at: string
          event_id: string
          id: string
          output_key: string | null
          status: Database["public"]["Enums"]["reel_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          output_key?: string | null
          status?: Database["public"]["Enums"]["reel_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          output_key?: string | null
          status?: Database["public"]["Enums"]["reel_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "highlight_reels_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          clip_end_seconds: number | null
          clip_start_seconds: number | null
          created_at: string
          duration_seconds: number | null
          event_id: string
          file_size_bytes: number
          guest_id: string | null
          height: number | null
          highlight_score: number | null
          id: string
          original_key: string
          preview_key: string | null
          reel_eligible: boolean
          removed_at: string | null
          status: Database["public"]["Enums"]["media_status"]
          type: Database["public"]["Enums"]["media_type"]
          updated_at: string
          width: number | null
        }
        Insert: {
          clip_end_seconds?: number | null
          clip_start_seconds?: number | null
          created_at?: string
          duration_seconds?: number | null
          event_id: string
          file_size_bytes: number
          guest_id?: string | null
          height?: number | null
          highlight_score?: number | null
          id?: string
          original_key: string
          preview_key?: string | null
          reel_eligible?: boolean
          removed_at?: string | null
          status?: Database["public"]["Enums"]["media_status"]
          type: Database["public"]["Enums"]["media_type"]
          updated_at?: string
          width?: number | null
        }
        Update: {
          clip_end_seconds?: number | null
          clip_start_seconds?: number | null
          created_at?: string
          duration_seconds?: number | null
          event_id?: string
          file_size_bytes?: number
          guest_id?: string | null
          height?: number | null
          highlight_score?: number | null
          id?: string
          original_key?: string
          preview_key?: string | null
          reel_eligible?: boolean
          removed_at?: string | null
          status?: Database["public"]["Enums"]["media_status"]
          type?: Database["public"]["Enums"]["media_type"]
          updated_at?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          is_admin: boolean
          storage_cap_bytes: number | null
          storage_used_bytes: number
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: Database["public"]["Enums"]["tier_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          is_admin?: boolean
          storage_cap_bytes?: number | null
          storage_used_bytes?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["tier_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          is_admin?: boolean
          storage_cap_bytes?: number | null
          storage_used_bytes?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["tier_type"]
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          event_id: string
          id: string
          media_id: string | null
          reason: string | null
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["report_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          media_id?: string | null
          reason?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          media_id?: string | null
          reason?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      storage_ledger: {
        Row: {
          created_at: string
          cumulative_bytes: number
          host_id: string
          id: string
          period: string
          photo_count: number
          updated_at: string
          video_count: number
        }
        Insert: {
          created_at?: string
          cumulative_bytes?: number
          host_id: string
          id?: string
          period: string
          photo_count?: number
          updated_at?: string
          video_count?: number
        }
        Update: {
          created_at?: string
          cumulative_bytes?: number
          host_id?: string
          id?: string
          period?: string
          photo_count?: number
          updated_at?: string
          video_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "storage_ledger_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_guest: {
        Args: { p_display_name?: string; p_email?: string; p_qr_token: string }
        Returns: Json
      }
      create_media: {
        Args: {
          p_duration_seconds?: number
          p_file_size_bytes: number
          p_height?: number
          p_media_id: string
          p_original_key: string
          p_preview_key?: string
          p_session_token: string
          p_type: Database["public"]["Enums"]["media_type"]
          p_width?: number
        }
        Returns: Json
      }
      create_report: {
        Args: { p_media_id?: string; p_reason?: string; p_share_token: string }
        Returns: Json
      }
      get_event_by_qr_token: {
        Args: { p_qr_token: string }
        Returns: {
          accepting_uploads: boolean
          description: string
          event_date: string
          id: string
          is_public: boolean
          moderation_mode: Database["public"]["Enums"]["moderation_mode"]
          name: string
          require_display_name: boolean
          require_email: boolean
        }[]
      }
      get_public_album: { Args: { p_share_token: string }; Returns: Json }
      get_upload_context: {
        Args: {
          p_session_token: string
          p_type: Database["public"]["Enums"]["media_type"]
        }
        Returns: Json
      }
      purge_media_rows: {
        Args: { p_media_ids: string[] }
        Returns: {
          freed_bytes: number
          host_id: string
        }[]
      }
      tier_limits: {
        Args: { p_tier: Database["public"]["Enums"]["tier_type"] }
        Returns: {
          default_storage_cap_bytes: number
          max_events: number
          monthly_ingress_bytes: number
        }[]
      }
    }
    Enums: {
      media_status: "pending" | "approved" | "hidden" | "removed"
      media_type: "photo" | "video"
      moderation_mode: "live" | "hold_for_approval"
      reel_status: "pending" | "processing" | "ready"
      report_status: "open" | "reviewed" | "dismissed" | "actioned"
      tier_type: "free" | "event_pass" | "pro" | "max"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      media_status: ["pending", "approved", "hidden", "removed"],
      media_type: ["photo", "video"],
      moderation_mode: ["live", "hold_for_approval"],
      reel_status: ["pending", "processing", "ready"],
      report_status: ["open", "reviewed", "dismissed", "actioned"],
      tier_type: ["free", "event_pass", "pro", "max"],
    },
  },
} as const
