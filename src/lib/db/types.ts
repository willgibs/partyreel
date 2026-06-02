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
      announcements: {
        Row: {
          body: string
          created_at: string
          href: string | null
          id: string
          published_at: string
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          href?: string | null
          id?: string
          published_at?: string
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          href?: string | null
          id?: string
          published_at?: string
          title?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          handled_at: string | null
          handled_by: string | null
          id: string
          message: string
          name: string
          source: string | null
          status: string
          subject: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email: string
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          message: string
          name: string
          source?: string | null
          status?: string
          subject?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          message?: string
          name?: string
          source?: string | null
          status?: string
          subject?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_submissions_handled_by_fkey"
            columns: ["handled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          accepting_uploads: boolean
          created_at: string
          deleted_at: string | null
          description: string | null
          event_date: string | null
          event_password_hash: string | null
          host_id: string
          id: string
          moderation_mode: Database["public"]["Enums"]["moderation_mode"]
          name: string
          purge_at: string | null
          qr_style: string
          qr_token: string
          require_email: boolean
          updated_at: string
          visibility: Database["public"]["Enums"]["event_visibility"]
        }
        Insert: {
          accepting_uploads?: boolean
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          event_date?: string | null
          event_password_hash?: string | null
          host_id: string
          id?: string
          moderation_mode?: Database["public"]["Enums"]["moderation_mode"]
          name: string
          purge_at?: string | null
          qr_style?: string
          qr_token?: string
          require_email?: boolean
          updated_at?: string
          visibility?: Database["public"]["Enums"]["event_visibility"]
        }
        Update: {
          accepting_uploads?: boolean
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          event_date?: string | null
          event_password_hash?: string | null
          host_id?: string
          id?: string
          moderation_mode?: Database["public"]["Enums"]["moderation_mode"]
          name?: string
          purge_at?: string | null
          qr_style?: string
          qr_token?: string
          require_email?: boolean
          updated_at?: string
          visibility?: Database["public"]["Enums"]["event_visibility"]
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
          email: string | null
          event_id: string
          id: string
          session_token: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          event_id: string
          id?: string
          session_token: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          event_id?: string
          id?: string
          session_token?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      job_applications: {
        Row: {
          created_at: string
          email: string
          handled_at: string | null
          handled_by: string | null
          id: string
          links: string | null
          message: string
          name: string
          resume_url: string | null
          role_slug: string
          source: string | null
          status: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email: string
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          links?: string | null
          message: string
          name: string
          resume_url?: string | null
          role_slug: string
          source?: string | null
          status?: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          links?: string | null
          message?: string
          name?: string
          resume_url?: string | null
          role_slug?: string
          source?: string | null
          status?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_handled_by_fkey"
            columns: ["handled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      link_stats: {
        Row: {
          count: number
          day: string
          event_id: string
          kind: Database["public"]["Enums"]["link_hit_kind"]
        }
        Insert: {
          count?: number
          day?: string
          event_id: string
          kind: Database["public"]["Enums"]["link_hit_kind"]
        }
        Update: {
          count?: number
          day?: string
          event_id?: string
          kind?: Database["public"]["Enums"]["link_hit_kind"]
        }
        Relationships: [
          {
            foreignKeyName: "link_stats_event_id_fkey"
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
      newsletter_signups: {
        Row: {
          created_at: string
          email: string
          event_id: string | null
          id: string
          opted_in_at: string
          source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          event_id?: string | null
          id?: string
          opted_in_at?: string
          source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          event_id?: string | null
          id?: string
          opted_in_at?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_signups_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          announcements_seen_at: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          is_admin: boolean
          last_active_at: string
          storage_cap_bytes: number | null
          storage_grace_until: string | null
          storage_used_bytes: number
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: Database["public"]["Enums"]["tier_type"]
          tier_expires_at: string | null
          updated_at: string
          welcomed_at: string | null
        }
        Insert: {
          announcements_seen_at?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          is_admin?: boolean
          last_active_at?: string
          storage_cap_bytes?: number | null
          storage_grace_until?: string | null
          storage_used_bytes?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["tier_type"]
          tier_expires_at?: string | null
          updated_at?: string
          welcomed_at?: string | null
        }
        Update: {
          announcements_seen_at?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          is_admin?: boolean
          last_active_at?: string
          storage_cap_bytes?: number | null
          storage_grace_until?: string | null
          storage_used_bytes?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["tier_type"]
          tier_expires_at?: string | null
          updated_at?: string
          welcomed_at?: string | null
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
      saved_events: {
        Row: {
          event_id: string
          saved_at: string
          user_id: string
        }
        Insert: {
          event_id: string
          saved_at?: string
          user_id: string
        }
        Update: {
          event_id?: string
          saved_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sent_emails: {
        Row: {
          dedupe_key: string
          id: string
          kind: string
          profile_id: string | null
          sent_at: string
        }
        Insert: {
          dedupe_key: string
          id?: string
          kind: string
          profile_id?: string | null
          sent_at?: string
        }
        Update: {
          dedupe_key?: string
          id?: string
          kind?: string
          profile_id?: string | null
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sent_emails_profile_id_fkey"
            columns: ["profile_id"]
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
      capture_guest_email: {
        Args: {
          p_email: string
          p_newsletter_opt_in?: boolean
          p_session_token: string
        }
        Returns: Json
      }
      clear_event_password: { Args: { p_event_id: string }; Returns: undefined }
      create_guest: {
        Args: { p_email?: string; p_qr_token: string }
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
      create_media_as_host: {
        Args: {
          p_duration_seconds?: number
          p_event_id: string
          p_file_size_bytes: number
          p_height?: number
          p_media_id: string
          p_original_key: string
          p_preview_key?: string
          p_type: Database["public"]["Enums"]["media_type"]
          p_width?: number
        }
        Returns: Json
      }
      create_report: {
        Args: { p_media_id?: string; p_qr_token: string; p_reason?: string }
        Returns: Json
      }
      get_event_by_qr_token: {
        Args: { p_qr_token: string }
        Returns: {
          accepting_uploads: boolean
          description: string
          event_date: string
          has_password: boolean
          host_display_name: string
          id: string
          moderation_mode: Database["public"]["Enums"]["moderation_mode"]
          name: string
          qr_style: string
          require_email: boolean
          visibility: Database["public"]["Enums"]["event_visibility"]
        }[]
      }
      get_event_media_by_qr_token: {
        Args: { p_qr_token: string }
        Returns: {
          created_at: string
          duration_seconds: number
          height: number
          id: string
          original_key: string
          type: Database["public"]["Enums"]["media_type"]
          width: number
        }[]
      }
      get_host_upload_context: {
        Args: {
          p_event_id: string
          p_type: Database["public"]["Enums"]["media_type"]
        }
        Returns: Json
      }
      get_saved_events: {
        Args: never
        Returns: {
          accessible: boolean
          cover_key: string
          event_date: string
          event_id: string
          has_password: boolean
          host_display_name: string
          name: string
          qr_token: string
          saved_at: string
          visibility: Database["public"]["Enums"]["event_visibility"]
        }[]
      }
      get_upload_context: {
        Args: {
          p_session_token: string
          p_type: Database["public"]["Enums"]["media_type"]
        }
        Returns: Json
      }
      has_password: {
        Args: never
        Returns: boolean
      }
      purge_media_rows: {
        Args: { p_media_ids: string[] }
        Returns: {
          freed_bytes: number
          host_id: string
        }[]
      }
      record_link_hit: {
        Args: {
          p_event_id: string
          p_kind: Database["public"]["Enums"]["link_hit_kind"]
        }
        Returns: undefined
      }
      save_event: {
        Args: { p_qr_token: string }
        Returns: string
      }
      set_event_password: {
        Args: { p_event_id: string; p_password: string }
        Returns: undefined
      }
      tier_limits: {
        Args: { p_tier: Database["public"]["Enums"]["tier_type"] }
        Returns: {
          default_storage_cap_bytes: number
          max_events: number
          monthly_ingress_bytes: number
        }[]
      }
      verify_current_password: {
        Args: { p_password: string }
        Returns: boolean
      }
      verify_event_password: {
        Args: { p_password?: string; p_qr_token: string }
        Returns: string
      }
    }
    Enums: {
      event_visibility: "open" | "password" | "private"
      link_hit_kind: "qr_scan" | "album_view"
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
      event_visibility: ["open", "password", "private"],
      link_hit_kind: ["qr_scan", "album_view"],
      media_status: ["pending", "approved", "hidden", "removed"],
      media_type: ["photo", "video"],
      moderation_mode: ["live", "hold_for_approval"],
      reel_status: ["pending", "processing", "ready"],
      report_status: ["open", "reviewed", "dismissed", "actioned"],
      tier_type: ["free", "event_pass", "pro", "max"],
    },
  },
} as const
