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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      action_attempts: {
        Row: {
          created_at: string
          ip_hash: string
          kind: string
          scope_hash: string | null
        }
        Insert: {
          created_at?: string
          ip_hash: string
          kind: string
          scope_hash?: string | null
        }
        Update: {
          created_at?: string
          ip_hash?: string
          kind?: string
          scope_hash?: string | null
        }
        Relationships: []
      }
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
          topic: string | null
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
          topic?: string | null
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
          topic?: string | null
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
      event_passes: {
        Row: {
          consumed_at: string | null
          consumed_reason: string | null
          created_at: string
          expires_at: string
          id: string
          price_cents: number
          profile_id: string
          source: string
          start_at: string
          stripe_session_id: string | null
        }
        Insert: {
          consumed_at?: string | null
          consumed_reason?: string | null
          created_at?: string
          expires_at: string
          id?: string
          price_cents: number
          profile_id: string
          source: string
          start_at: string
          stripe_session_id?: string | null
        }
        Update: {
          consumed_at?: string | null
          consumed_reason?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          price_cents?: number
          profile_id?: string
          source?: string
          start_at?: string
          stripe_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_passes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          accepting_uploads: boolean
          allow_anonymous_uploads: boolean
          created_at: string
          custom_slug: string | null
          deleted_at: string | null
          description: string | null
          display_in_profile: boolean
          event_date: string | null
          event_password_hash: string | null
          host_id: string
          id: string
          max_upload_bytes: number | null
          moderation_mode: Database["public"]["Enums"]["moderation_mode"]
          name: string
          purge_at: string | null
          qr_style: string
          qr_token: string
          show_guest_list: boolean
          updated_at: string
          visibility: Database["public"]["Enums"]["event_visibility"]
        }
        Insert: {
          accepting_uploads?: boolean
          allow_anonymous_uploads?: boolean
          created_at?: string
          custom_slug?: string | null
          deleted_at?: string | null
          description?: string | null
          display_in_profile?: boolean
          event_date?: string | null
          event_password_hash?: string | null
          host_id: string
          id?: string
          max_upload_bytes?: number | null
          moderation_mode?: Database["public"]["Enums"]["moderation_mode"]
          name: string
          purge_at?: string | null
          qr_style?: string
          qr_token?: string
          show_guest_list?: boolean
          updated_at?: string
          visibility?: Database["public"]["Enums"]["event_visibility"]
        }
        Update: {
          accepting_uploads?: boolean
          allow_anonymous_uploads?: boolean
          created_at?: string
          custom_slug?: string | null
          deleted_at?: string | null
          description?: string | null
          display_in_profile?: boolean
          event_date?: string | null
          event_password_hash?: string | null
          host_id?: string
          id?: string
          max_upload_bytes?: number | null
          moderation_mode?: Database["public"]["Enums"]["moderation_mode"]
          name?: string
          purge_at?: string | null
          qr_style?: string
          qr_token?: string
          show_guest_list?: boolean
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
      export_log: {
        Row: {
          created_at: string
          error: string | null
          event_id: string | null
          id: string
          item_count: number
          jti: string | null
          outcome: string
          requester_hash: string | null
          scope: string
          total_bytes: number
        }
        Insert: {
          created_at?: string
          error?: string | null
          event_id?: string | null
          id?: string
          item_count?: number
          jti?: string | null
          outcome: string
          requester_hash?: string | null
          scope: string
          total_bytes?: number
        }
        Update: {
          created_at?: string
          error?: string | null
          event_id?: string | null
          id?: string
          item_count?: number
          jti?: string | null
          outcome?: string
          requester_hash?: string | null
          scope?: string
          total_bytes?: number
        }
        Relationships: []
      }
      forensic_audit_log: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          detail: Json | null
          error: string | null
          event_id: string | null
          id: string
          media_id: string | null
          outcome: string
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          detail?: Json | null
          error?: string | null
          event_id?: string | null
          id?: string
          media_id?: string | null
          outcome?: string
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          detail?: Json | null
          error?: string | null
          event_id?: string | null
          id?: string
          media_id?: string | null
          outcome?: string
        }
        Relationships: []
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
          cover_media_id: string | null
          created_at: string
          event_id: string
          guest_visible: boolean
          id: string
          length_seconds: number | null
          orientation: string
          output_key: string | null
          render_cost_usd: number | null
          render_error: string | null
          render_id: string | null
          render_started_at: string | null
          rendered_at: string | null
          rendered_hash: string | null
          seed: number
          status: Database["public"]["Enums"]["reel_status"]
          style_id: string
          theme: string
          updated_at: string
        }
        Insert: {
          cover_media_id?: string | null
          created_at?: string
          event_id: string
          guest_visible?: boolean
          id?: string
          length_seconds?: number | null
          orientation?: string
          output_key?: string | null
          render_cost_usd?: number | null
          render_error?: string | null
          render_id?: string | null
          render_started_at?: string | null
          rendered_at?: string | null
          rendered_hash?: string | null
          seed?: number
          status?: Database["public"]["Enums"]["reel_status"]
          style_id?: string
          theme?: string
          updated_at?: string
        }
        Update: {
          cover_media_id?: string | null
          created_at?: string
          event_id?: string
          guest_visible?: boolean
          id?: string
          length_seconds?: number | null
          orientation?: string
          output_key?: string | null
          render_cost_usd?: number | null
          render_error?: string | null
          render_id?: string | null
          render_started_at?: string | null
          rendered_at?: string | null
          rendered_hash?: string | null
          seed?: number
          status?: Database["public"]["Enums"]["reel_status"]
          style_id?: string
          theme?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "highlight_reels_cover_media_id_fkey"
            columns: ["cover_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
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
          legal_hold_at: string | null
          legal_hold_reason: string | null
          original_key: string
          preview_key: string | null
          purge_at: string | null
          reel_eligible: boolean
          removed_at: string | null
          removed_by_admin: boolean
          removed_by_system: boolean
          removed_by_uploader: boolean
          status: Database["public"]["Enums"]["media_status"]
          status_before_removed:
            | Database["public"]["Enums"]["media_status"]
            | null
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
          legal_hold_at?: string | null
          legal_hold_reason?: string | null
          original_key: string
          preview_key?: string | null
          purge_at?: string | null
          reel_eligible?: boolean
          removed_at?: string | null
          removed_by_admin?: boolean
          removed_by_system?: boolean
          removed_by_uploader?: boolean
          status?: Database["public"]["Enums"]["media_status"]
          status_before_removed?:
            | Database["public"]["Enums"]["media_status"]
            | null
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
          legal_hold_at?: string | null
          legal_hold_reason?: string | null
          original_key?: string
          preview_key?: string | null
          purge_at?: string | null
          reel_eligible?: boolean
          removed_at?: string | null
          removed_by_admin?: boolean
          removed_by_system?: boolean
          removed_by_uploader?: boolean
          status?: Database["public"]["Enums"]["media_status"]
          status_before_removed?:
            | Database["public"]["Enums"]["media_status"]
            | null
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
      media_likes: {
        Row: {
          liked_at: string
          media_id: string
          user_id: string
        }
        Insert: {
          liked_at?: string
          media_id: string
          user_id: string
        }
        Update: {
          liked_at?: string
          media_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_likes_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      notification_prefs: {
        Row: {
          created_at: string
          marketing_opt_in: boolean
          notify_album_shared: boolean
          notify_new_follower: boolean
          notify_new_uploads_digest: boolean
          notify_reel_ready: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          marketing_opt_in?: boolean
          notify_album_shared?: boolean
          notify_new_follower?: boolean
          notify_new_uploads_digest?: boolean
          notify_reel_ready?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          marketing_opt_in?: boolean
          notify_album_shared?: boolean
          notify_new_follower?: boolean
          notify_new_uploads_digest?: boolean
          notify_reel_ready?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_prefs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ops_flags: {
        Row: {
          enabled: boolean
          key: string
          updated_at: string
        }
        Insert: {
          enabled?: boolean
          key: string
          updated_at?: string
        }
        Update: {
          enabled?: boolean
          key?: string
          updated_at?: string
        }
        Relationships: []
      }
      profile_hidden_events: {
        Row: {
          created_at: string
          event_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_hidden_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_hidden_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          announcements_seen_at: string | null
          avatar_updated_at: string | null
          created_at: string
          display_name: string | null
          email: string | null
          event_slots: number | null
          id: string
          is_admin: boolean
          last_active_at: string
          password_set_at: string | null
          slug: string | null
          storage_cap_bytes: number | null
          storage_grace_until: string | null
          storage_used_bytes: number
          stripe_customer_id: string | null
          stripe_event_created_at: string
          stripe_subscription_id: string | null
          tier: Database["public"]["Enums"]["tier_type"]
          tier_expires_at: string | null
          updated_at: string
          welcomed_at: string | null
        }
        Insert: {
          announcements_seen_at?: string | null
          avatar_updated_at?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          event_slots?: number | null
          id: string
          is_admin?: boolean
          last_active_at?: string
          password_set_at?: string | null
          slug?: string | null
          storage_cap_bytes?: number | null
          storage_grace_until?: string | null
          storage_used_bytes?: number
          stripe_customer_id?: string | null
          stripe_event_created_at?: string
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["tier_type"]
          tier_expires_at?: string | null
          updated_at?: string
          welcomed_at?: string | null
        }
        Update: {
          announcements_seen_at?: string | null
          avatar_updated_at?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          event_slots?: number | null
          id?: string
          is_admin?: boolean
          last_active_at?: string
          password_set_at?: string | null
          slug?: string | null
          storage_cap_bytes?: number | null
          storage_grace_until?: string | null
          storage_used_bytes?: number
          stripe_customer_id?: string | null
          stripe_event_created_at?: string
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["tier_type"]
          tier_expires_at?: string | null
          updated_at?: string
          welcomed_at?: string | null
        }
        Relationships: []
      }
      reel_items: {
        Row: {
          added_at: string
          event_id: string
          media_id: string
          position: number
        }
        Insert: {
          added_at?: string
          event_id: string
          media_id: string
          position?: number
        }
        Update: {
          added_at?: string
          event_id?: string
          media_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "reel_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reel_items_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      reel_render_log: {
        Row: {
          cost_usd: number | null
          created_at: string
          duration_sec: number | null
          error: string | null
          event_id: string | null
          id: string
          outcome: string
          render_id: string | null
          requester_hash: string | null
        }
        Insert: {
          cost_usd?: number | null
          created_at?: string
          duration_sec?: number | null
          error?: string | null
          event_id?: string | null
          id?: string
          outcome: string
          render_id?: string | null
          requester_hash?: string | null
        }
        Update: {
          cost_usd?: number | null
          created_at?: string
          duration_sec?: number | null
          error?: string | null
          event_id?: string | null
          id?: string
          outcome?: string
          render_id?: string | null
          requester_hash?: string | null
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
      unlock_attempts: {
        Row: {
          attempted_at: string
          ip_hash: string
          token_hash: string
        }
        Insert: {
          attempted_at?: string
          ip_hash: string
          token_hash: string
        }
        Update: {
          attempted_at?: string
          ip_hash?: string
          token_hash?: string
        }
        Relationships: []
      }
      upload_forensics: {
        Row: {
          client_hints: Json | null
          created_at: string
          device_uuid: string | null
          event_id: string
          geo: Json | null
          guest_email: string | null
          guest_id: string | null
          guest_user_id: string | null
          host_user_id: string | null
          id: string
          ip: string | null
          media_id: string
          preserved_at: string | null
          preserved_by: string | null
          preserved_forensics_key: string | null
          preserved_original_key: string | null
          uploader_kind: string
          user_agent: string | null
        }
        Insert: {
          client_hints?: Json | null
          created_at?: string
          device_uuid?: string | null
          event_id: string
          geo?: Json | null
          guest_email?: string | null
          guest_id?: string | null
          guest_user_id?: string | null
          host_user_id?: string | null
          id?: string
          ip?: string | null
          media_id: string
          preserved_at?: string | null
          preserved_by?: string | null
          preserved_forensics_key?: string | null
          preserved_original_key?: string | null
          uploader_kind: string
          user_agent?: string | null
        }
        Update: {
          client_hints?: Json | null
          created_at?: string
          device_uuid?: string | null
          event_id?: string
          geo?: Json | null
          guest_email?: string | null
          guest_id?: string | null
          guest_user_id?: string | null
          host_user_id?: string | null
          id?: string
          ip?: string | null
          media_id?: string
          preserved_at?: string | null
          preserved_by?: string | null
          preserved_forensics_key?: string | null
          preserved_original_key?: string | null
          uploader_kind?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "upload_forensics_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_follows: {
        Row: {
          created_at: string
          followee_id: string
          follower_id: string
        }
        Insert: {
          created_at?: string
          followee_id: string
          follower_id: string
        }
        Update: {
          created_at?: string
          followee_id?: string
          follower_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_follows_followee_id_fkey"
            columns: ["followee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_follows_follower_id_fkey"
            columns: ["follower_id"]
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
      action_rate: {
        Args: {
          p_breadth_since: string
          p_ip_hash: string
          p_kind: string
          p_scope_hash: string
          p_scope_since: string
        }
        Returns: Json
      }
      add_to_reel: { Args: { p_media_id: string }; Returns: Json }
      block_user: { Args: { p_blocked: string }; Returns: undefined }
      capture_guest_email: {
        Args: {
          p_email: string
          p_newsletter_opt_in?: boolean
          p_session_token: string
        }
        Returns: Json
      }
      check_slug_available: {
        Args: { p_event_id?: string; p_slug: string }
        Returns: boolean
      }
      claim_anonymous_uploads: {
        Args: { p_session_tokens: string[] }
        Returns: number
      }
      clear_event_password: { Args: { p_event_id: string }; Returns: undefined }
      clear_event_slug: { Args: { p_event_id: string }; Returns: undefined }
      create_guest: {
        Args: {
          p_qr_token: string
          p_unlock_proven?: boolean
          p_user_id?: string
        }
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
          p_host_id: string
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
      follow_user: { Args: { p_followee: string }; Returns: undefined }
      get_event_by_qr_token: {
        Args: { p_qr_token: string }
        Returns: {
          accepting_uploads: boolean
          allow_anonymous_uploads: boolean
          custom_slug: string
          description: string
          event_date: string
          has_password: boolean
          host_display_name: string
          id: string
          moderation_mode: Database["public"]["Enums"]["moderation_mode"]
          name: string
          qr_style: string
          qr_token: string
          visibility: Database["public"]["Enums"]["event_visibility"]
        }[]
      }
      get_event_like_counts: {
        Args: { p_event_id: string }
        Returns: {
          like_count: number
          media_id: string
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
          preview_key: string
          type: Database["public"]["Enums"]["media_type"]
          width: number
        }[]
      }
      get_event_reel_by_qr_token: {
        Args: { p_qr_token: string }
        Returns: {
          cover_media_id: string
          item_ids: string[]
          length_seconds: number
          mp4_ready: boolean
          orientation: string
          seed: number
          style_id: string
          watermark: boolean
        }[]
      }
      get_host_upload_context: {
        Args: {
          p_event_id: string
          p_type: Database["public"]["Enums"]["media_type"]
        }
        Returns: Json
      }
      get_my_likes: {
        Args: { p_limit?: number }
        Returns: {
          duration_seconds: number
          event_date: string
          event_id: string
          event_name: string
          event_qr_token: string
          height: number
          id: string
          liked_at: string
          original_key: string
          preview_key: string
          type: Database["public"]["Enums"]["media_type"]
          width: number
        }[]
      }
      get_my_uploads: {
        Args: { p_limit?: number }
        Returns: {
          created_at: string
          duration_seconds: number
          event_date: string
          event_id: string
          event_name: string
          event_qr_token: string
          height: number
          id: string
          is_host_upload: boolean
          original_key: string
          preview_key: string
          type: Database["public"]["Enums"]["media_type"]
          width: number
        }[]
      }
      get_public_profile: { Args: { p_slug: string }; Returns: Json }
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
      has_password: { Args: never; Returns: boolean }
      host_active_bytes: { Args: { p_host_id: string }; Returns: number }
      like_media: { Args: { p_media_id: string }; Returns: Json }
      mark_password_set: { Args: never; Returns: undefined }
      monthly_ingress_cap: {
        Args: {
          p_storage_cap_bytes: number
          p_tier: Database["public"]["Enums"]["tier_type"]
        }
        Returns: number
      }
      purge_media_now: { Args: { p_media_ids: string[] }; Returns: Json }
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
      remove_my_upload: { Args: { p_media_id: string }; Returns: Json }
      reorder_reel: {
        Args: { p_event_id: string; p_media_ids: string[] }
        Returns: Json
      }
      restore_event: { Args: { p_event_id: string }; Returns: Json }
      restore_media: { Args: { p_media_id: string }; Returns: Json }
      save_event: { Args: { p_qr_token: string }; Returns: string }
      set_event_password: {
        Args: { p_event_id: string; p_password: string }
        Returns: undefined
      }
      set_event_slug: {
        Args: { p_event_id: string; p_slug: string }
        Returns: undefined
      }
      set_reel_guest_visible: {
        Args: { p_event_id: string; p_visible: boolean }
        Returns: Json
      }
      tier_limits: {
        Args: { p_tier: Database["public"]["Enums"]["tier_type"] }
        Returns: {
          default_storage_cap_bytes: number
          ingress_cap_multiplier: number
          max_events: number
          max_reel_seconds: number
          monthly_ingress_bytes: number
        }[]
      }
      upsert_reel_config: {
        Args: {
          p_cover_media_id?: string
          p_event_id: string
          p_length_seconds?: number
          p_orientation: string
          p_seed: number
          p_style_id: string
        }
        Returns: Json
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
