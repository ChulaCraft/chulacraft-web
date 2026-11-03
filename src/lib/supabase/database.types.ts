export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      account_change_log: {
        Row: {
          actor_user_id: string | null
          created_at: string
          entity: string
          entity_id: string | null
          field: string
          id: string
          new_value: string | null
          old_value: string | null
          source: string
          target_user_id: string
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          entity: string
          entity_id?: string | null
          field: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          source?: string
          target_user_id: string
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          field?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          source?: string
          target_user_id?: string
        }
        Relationships: []
      }
      achievement_awards: {
        Row: {
          achievement_id: string
          awarded_by: string | null
          awarded_on: string
          created_at: string
          event_id: string | null
          id: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          awarded_by?: string | null
          awarded_on: string
          created_at?: string
          event_id?: string | null
          id?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          awarded_by?: string | null
          awarded_on?: string
          created_at?: string
          event_id?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievement_awards_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "achievement_awards_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      achievement_showcase: {
        Row: {
          achievement_id: string
          position: number
          user_id: string
        }
        Insert: {
          achievement_id: string
          position: number
          user_id: string
        }
        Update: {
          achievement_id?: string
          position?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievement_showcase_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      achievements: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          discord_role_id: string | null
          id: string
          image_path: string
          name: string
          status: string
          tier: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          discord_role_id?: string | null
          id?: string
          image_path: string
          name: string
          status?: string
          tier?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          discord_role_id?: string | null
          id?: string
          image_path?: string
          name?: string
          status?: string
          tier?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievements_discord_role_id_fkey"
            columns: ["discord_role_id"]
            isOneToOne: false
            referencedRelation: "discord_assignable_roles"
            referencedColumns: ["role_id"]
          },
        ]
      }
      announcements: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          discord_message_id: string | null
          discord_revision: number | null
          expires_at: string | null
          id: string
          image_path: string | null
          pinned: boolean
          post_to_discord: boolean
          published_at: string | null
          revision: number
          severity: string
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          discord_message_id?: string | null
          discord_revision?: number | null
          expires_at?: string | null
          id?: string
          image_path?: string | null
          pinned?: boolean
          post_to_discord?: boolean
          published_at?: string | null
          revision?: number
          severity?: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          discord_message_id?: string | null
          discord_revision?: number | null
          expires_at?: string | null
          id?: string
          image_path?: string | null
          pinned?: boolean
          post_to_discord?: boolean
          published_at?: string | null
          revision?: number
          severity?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_errors: {
        Row: {
          at: string
          digest: string | null
          fingerprint: string
          id: number
          kind: string
          message: string
          route: string
        }
        Insert: {
          at?: string
          digest?: string | null
          fingerprint: string
          id?: never
          kind: string
          message: string
          route: string
        }
        Update: {
          at?: string
          digest?: string | null
          fingerprint?: string
          id?: never
          kind?: string
          message?: string
          route?: string
        }
        Relationships: []
      }
      appeals: {
        Row: {
          admin_response: string | null
          ban_id: string
          created_at: string
          decided_at: string | null
          decided_by: string | null
          id: string
          message: string
          status: string
          user_id: string
        }
        Insert: {
          admin_response?: string | null
          ban_id: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          message: string
          status?: string
          user_id: string
        }
        Update: {
          admin_response?: string | null
          ban_id?: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          message?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appeals_ban_id_fkey"
            columns: ["ban_id"]
            isOneToOne: false
            referencedRelation: "bans"
            referencedColumns: ["id"]
          },
        ]
      }
      banner_grants: {
        Row: {
          banner_id: string
          created_at: string
          granted_by: string | null
          user_id: string
        }
        Insert: {
          banner_id: string
          created_at?: string
          granted_by?: string | null
          user_id: string
        }
        Update: {
          banner_id?: string
          created_at?: string
          granted_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "banner_grants_banner_id_fkey"
            columns: ["banner_id"]
            isOneToOne: false
            referencedRelation: "banners"
            referencedColumns: ["id"]
          },
        ]
      }
      banners: {
        Row: {
          colors: string[]
          id: string
          image_path: string | null
          kind: string
          name: string
          sort: number
          still_path: string | null
          style: string
        }
        Insert: {
          colors: string[]
          id: string
          image_path?: string | null
          kind: string
          name: string
          sort?: number
          still_path?: string | null
          style?: string
        }
        Update: {
          colors?: string[]
          id?: string
          image_path?: string | null
          kind?: string
          name?: string
          sort?: number
          still_path?: string | null
          style?: string
        }
        Relationships: []
      }
      bans: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          lifted_at: string | null
          lifted_by: string | null
          public_note: string | null
          reason: string
          revoked_registrations: string[]
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          lifted_at?: string | null
          lifted_by?: string | null
          public_note?: string | null
          reason: string
          revoked_registrations?: string[]
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          lifted_at?: string | null
          lifted_by?: string | null
          public_note?: string | null
          reason?: string
          revoked_registrations?: string[]
          user_id?: string
        }
        Relationships: []
      }
      blocks: {
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
        Relationships: []
      }
      bot_job_runs: {
        Row: {
          error: string | null
          finished_at: string | null
          id: number
          items: number | null
          job: string
          ok: boolean
          started_at: string
        }
        Insert: {
          error?: string | null
          finished_at?: string | null
          id?: never
          items?: number | null
          job: string
          ok: boolean
          started_at: string
        }
        Update: {
          error?: string | null
          finished_at?: string | null
          id?: never
          items?: number | null
          job?: string
          ok?: boolean
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bot_job_runs_job_fkey"
            columns: ["job"]
            isOneToOne: false
            referencedRelation: "bot_jobs"
            referencedColumns: ["name"]
          },
        ]
      }
      bot_jobs: {
        Row: {
          consecutive_failures: number
          enabled: boolean
          interval_seconds: number | null
          label: string
          last_error: string | null
          last_finished_at: string | null
          last_items: number | null
          last_ok: boolean | null
          last_started_at: string | null
          name: string
          registered_at: string
          retired_at: string | null
        }
        Insert: {
          consecutive_failures?: number
          enabled?: boolean
          interval_seconds?: number | null
          label: string
          last_error?: string | null
          last_finished_at?: string | null
          last_items?: number | null
          last_ok?: boolean | null
          last_started_at?: string | null
          name: string
          registered_at?: string
          retired_at?: string | null
        }
        Update: {
          consecutive_failures?: number
          enabled?: boolean
          interval_seconds?: number | null
          label?: string
          last_error?: string | null
          last_finished_at?: string | null
          last_items?: number | null
          last_ok?: boolean | null
          last_started_at?: string | null
          name?: string
          registered_at?: string
          retired_at?: string | null
        }
        Relationships: []
      }
      bot_settings: {
        Row: {
          applies: string
          bot_error: string | null
          bot_status: string | null
          checked_at: string | null
          default_value: string | null
          description: string
          key: string
          kind: string
          label: string
          max_value: number | null
          min_value: number | null
          registered_at: string
          retired_at: string | null
          updated_at: string | null
          updated_by: string | null
          value: string | null
        }
        Insert: {
          applies?: string
          bot_error?: string | null
          bot_status?: string | null
          checked_at?: string | null
          default_value?: string | null
          description?: string
          key: string
          kind: string
          label: string
          max_value?: number | null
          min_value?: number | null
          registered_at?: string
          retired_at?: string | null
          updated_at?: string | null
          updated_by?: string | null
          value?: string | null
        }
        Update: {
          applies?: string
          bot_error?: string | null
          bot_status?: string | null
          checked_at?: string | null
          default_value?: string | null
          description?: string
          key?: string
          kind?: string
          label?: string
          max_value?: number | null
          min_value?: number | null
          registered_at?: string
          retired_at?: string | null
          updated_at?: string | null
          updated_by?: string | null
          value?: string | null
        }
        Relationships: []
      }
      chula_claims: {
        Row: {
          claimed_at: string
          discord_id: string
          email: string
          google_sub: string
          user_id: string
        }
        Insert: {
          claimed_at?: string
          discord_id: string
          email: string
          google_sub: string
          user_id: string
        }
        Update: {
          claimed_at?: string
          discord_id?: string
          email?: string
          google_sub?: string
          user_id?: string
        }
        Relationships: []
      }
      discord_assignable_roles: {
        Row: {
          added_by: string | null
          created_at: string
          label: string
          role_id: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          label: string
          role_id: string
        }
        Update: {
          added_by?: string | null
          created_at?: string
          label?: string
          role_id?: string
        }
        Relationships: []
      }
      discord_role_state: {
        Row: {
          attempts: number
          discord_id: string
          last_error: string | null
          retry_after: string | null
          role_id: string
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          discord_id: string
          last_error?: string | null
          retry_after?: string | null
          role_id: string
          status: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          discord_id?: string
          last_error?: string | null
          retry_after?: string | null
          role_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      event_attendance: {
        Row: {
          created_at: string
          event_id: string
          method: string
          recorded_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          method: string
          recorded_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          method?: string
          recorded_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_attendance_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_checkin_secrets: {
        Row: {
          event_id: string
          rotated_at: string | null
          secret: string
        }
        Insert: {
          event_id: string
          rotated_at?: string | null
          secret?: string
        }
        Update: {
          event_id?: string
          rotated_at?: string | null
          secret?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_checkin_secrets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_interests: {
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
            foreignKeyName: "event_interests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_reminders: {
        Row: {
          event_id: string
          notified_at: string | null
          offset_minutes: number
          sent_at: string | null
          skipped_at: string | null
        }
        Insert: {
          event_id: string
          notified_at?: string | null
          offset_minutes: number
          sent_at?: string | null
          skipped_at?: string | null
        }
        Update: {
          event_id?: string
          notified_at?: string | null
          offset_minutes?: number
          sent_at?: string | null
          skipped_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_reminders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          banner_id: string | null
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string | null
          id: string
          image_path: string | null
          location: string | null
          name: string
          starts_at: string
          status: string
          updated_at: string
        }
        Insert: {
          banner_id?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          image_path?: string | null
          location?: string | null
          name: string
          starts_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          banner_id?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          image_path?: string | null
          location?: string | null
          name?: string
          starts_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_banner_id_fkey"
            columns: ["banner_id"]
            isOneToOne: false
            referencedRelation: "banners"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          addressee_id: string
          created_at: string
          requester_id: string
          status: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          requester_id: string
          status?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          requester_id?: string
          status?: string
        }
        Relationships: []
      }
      funnel_failures: {
        Row: {
          code: string
          count: number
          day: string
          step: string
        }
        Insert: {
          code: string
          count?: number
          day: string
          step: string
        }
        Update: {
          code?: string
          count?: number
          day?: string
          step?: string
        }
        Relationships: []
      }
      gallery_groups: {
        Row: {
          cover_path: string | null
          created_at: string
          description: string
          id: string
          name: string
          sort: number
        }
        Insert: {
          cover_path?: string | null
          created_at?: string
          description?: string
          id?: string
          name: string
          sort?: number
        }
        Update: {
          cover_path?: string | null
          created_at?: string
          description?: string
          id?: string
          name?: string
          sort?: number
        }
        Relationships: []
      }
      gallery_images: {
        Row: {
          alt: string
          created_at: string
          created_by: string | null
          group_id: string
          id: string
          image_path: string
          sort: number
          wide: boolean
        }
        Insert: {
          alt: string
          created_at?: string
          created_by?: string | null
          group_id: string
          id?: string
          image_path: string
          sort?: number
          wide?: boolean
        }
        Update: {
          alt?: string
          created_at?: string
          created_by?: string | null
          group_id?: string
          id?: string
          image_path?: string
          sort?: number
          wide?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "gallery_images_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "gallery_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      minecraft_ownership_history: {
        Row: {
          discord_user_id: string
          discord_username: string | null
          id: string
          linked_at: string
          minecraft_username: string
          minecraft_uuid: string
          registration_id: string
          transferred_at: string
          transferred_to: string
          user_id: string
        }
        Insert: {
          discord_user_id: string
          discord_username?: string | null
          id?: string
          linked_at: string
          minecraft_username: string
          minecraft_uuid: string
          registration_id: string
          transferred_at?: string
          transferred_to: string
          user_id: string
        }
        Update: {
          discord_user_id?: string
          discord_username?: string | null
          id?: string
          linked_at?: string
          minecraft_username?: string
          minecraft_uuid?: string
          registration_id?: string
          transferred_at?: string
          transferred_to?: string
          user_id?: string
        }
        Relationships: []
      }
      minecraft_registrations: {
        Row: {
          created_at: string
          desired_whitelisted: boolean
          discord_user_id: string
          discord_username: string | null
          id: string
          is_active: boolean
          last_sync_error_at: string | null
          last_sync_error_code: string | null
          minecraft_username: string
          minecraft_username_key: string
          minecraft_uuid: string
          next_sync_at: string
          revoked_at: string | null
          sync_attempts: number
          sync_failing_since: string | null
          sync_status: string
          updated_at: string
          user_id: string
          whitelisted_at: string | null
        }
        Insert: {
          created_at?: string
          desired_whitelisted?: boolean
          discord_user_id: string
          discord_username?: string | null
          id?: string
          is_active?: boolean
          last_sync_error_at?: string | null
          last_sync_error_code?: string | null
          minecraft_username: string
          minecraft_username_key: string
          minecraft_uuid: string
          next_sync_at?: string
          revoked_at?: string | null
          sync_attempts?: number
          sync_failing_since?: string | null
          sync_status?: string
          updated_at?: string
          user_id: string
          whitelisted_at?: string | null
        }
        Update: {
          created_at?: string
          desired_whitelisted?: boolean
          discord_user_id?: string
          discord_username?: string | null
          id?: string
          is_active?: boolean
          last_sync_error_at?: string | null
          last_sync_error_code?: string | null
          minecraft_username?: string
          minecraft_username_key?: string
          minecraft_uuid?: string
          next_sync_at?: string
          revoked_at?: string | null
          sync_attempts?: number
          sync_failing_since?: string | null
          sync_status?: string
          updated_at?: string
          user_id?: string
          whitelisted_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          kind: string
          payload: Json
          read_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          payload?: Json
          read_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          payload?: Json
          read_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      player_checkin_codes: {
        Row: {
          code: string
          created_at: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      privacy_settings: {
        Row: {
          achievements: string
          friends: string
          minecraft: string
          profile: string
          updated_at: string
          user_id: string
        }
        Insert: {
          achievements?: string
          friends?: string
          minecraft?: string
          profile?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          achievements?: string
          friends?: string
          minecraft?: string
          profile?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          banner_id: string | null
          created_at: string
          faculty: string | null
          first_name: string | null
          guest_verified_at: string | null
          guest_verified_by: string | null
          last_name: string | null
          major: string | null
          nickname: string | null
          role: string
          study_level: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          banner_id?: string | null
          created_at?: string
          faculty?: string | null
          first_name?: string | null
          guest_verified_at?: string | null
          guest_verified_by?: string | null
          last_name?: string | null
          major?: string | null
          nickname?: string | null
          role?: string
          study_level?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          banner_id?: string | null
          created_at?: string
          faculty?: string | null
          first_name?: string | null
          guest_verified_at?: string | null
          guest_verified_by?: string | null
          last_name?: string | null
          major?: string | null
          nickname?: string | null
          role?: string
          study_level?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_banner_id_fkey"
            columns: ["banner_id"]
            isOneToOne: false
            referencedRelation: "banners"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles_major_backup_20261005: {
        Row: {
          faculty: string | null
          major: string | null
          user_id: string | null
        }
        Insert: {
          faculty?: string | null
          major?: string | null
          user_id?: string | null
        }
        Update: {
          faculty?: string | null
          major?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      registration_attempt_windows: {
        Row: {
          attempts: number
          user_id: string
          window_started_at: string
        }
        Insert: {
          attempts?: number
          user_id: string
          window_started_at?: string
        }
        Update: {
          attempts?: number
          user_id?: string
          window_started_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          admin_note: string | null
          category: string
          created_at: string
          details: string
          evidence_url: string | null
          handled_at: string | null
          handled_by: string | null
          id: string
          reporter_id: string | null
          status: string
          target_user_id: string
        }
        Insert: {
          admin_note?: string | null
          category: string
          created_at?: string
          details: string
          evidence_url?: string | null
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          reporter_id?: string | null
          status?: string
          target_user_id: string
        }
        Update: {
          admin_note?: string | null
          category?: string
          created_at?: string
          details?: string
          evidence_url?: string | null
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          reporter_id?: string | null
          status?: string
          target_user_id?: string
        }
        Relationships: []
      }
      site_pages: {
        Row: {
          body: string
          slug: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          body: string
          slug: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          body?: string
          slug?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
      stats_daily: {
        Row: {
          banned: number
          created_at: string
          day: string
          guests: number
          players: number
          unverified: number
          verified: number
          whitelisted: number
        }
        Insert: {
          banned: number
          created_at?: string
          day: string
          guests: number
          players: number
          unverified: number
          verified: number
          whitelisted: number
        }
        Update: {
          banned?: number
          created_at?: string
          day?: string
          guests?: number
          players?: number
          unverified?: number
          verified?: number
          whitelisted?: number
        }
        Relationships: []
      }
      team_generations: {
        Row: {
          created_at: string
          id: string
          name: string
          sort: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort?: number
        }
        Relationships: []
      }
      team_members: {
        Row: {
          bio: string
          created_at: string
          generation_id: string
          id: string
          image_path: string | null
          kind: string
          link_url: string | null
          name: string
          sort: number
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          bio?: string
          created_at?: string
          generation_id: string
          id?: string
          image_path?: string | null
          kind: string
          link_url?: string | null
          name: string
          sort?: number
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          bio?: string
          created_at?: string
          generation_id?: string
          id?: string
          image_path?: string | null
          kind?: string
          link_url?: string | null
          name?: string
          sort?: number
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "team_generations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      achievement_groups: { Args: { p_user_id: string }; Returns: Json }
      add_minecraft_account: {
        Args: {
          p_minecraft_username: string
          p_minecraft_uuid: string
          p_user_id: string
        }
        Returns: {
          created: boolean
          desired_whitelisted: boolean
          id: string
          minecraft_username: string
          sync_status: string
          updated_at: string
        }[]
      }
      admin_app_errors: {
        Args: { p_hours?: number }
        Returns: {
          fingerprint: string
          first_at: string
          kind: string
          last_at: string
          message: string
          n: number
          route: string
        }[]
      }
      admin_apply_player_changes: {
        Args: { p_changes: Json; p_user_id: string }
        Returns: undefined
      }
      admin_audit_log: {
        Args: {
          p_actor?: string
          p_before_at?: string
          p_before_id?: string
          p_entity?: string
          p_from?: string
          p_limit?: number
          p_target?: string
          p_to?: string
        }
        Returns: {
          actor_name: string
          actor_user_id: string
          created_at: string
          entity: string
          entity_id: string
          field: string
          id: string
          new_value: string
          old_value: string
          target_name: string
          target_user_id: string
        }[]
      }
      admin_award: {
        Args: {
          p_achievement_id: string
          p_awarded_on: string
          p_event_id: string
          p_user_ids: string[]
        }
        Returns: number
      }
      admin_award_attendees: {
        Args: { p_achievement_id: string; p_event_id: string }
        Returns: number
      }
      admin_ban_user: {
        Args: {
          p_expires_at?: string
          p_public_note?: string
          p_reason: string
          p_user_id: string
        }
        Returns: string
      }
      admin_bot_overview: { Args: never; Returns: Json }
      admin_check_in_player: {
        Args: { p_code: string; p_event_id: string }
        Returns: {
          avatar_url: string
          display_name: string
          status: string
          user_id: string
        }[]
      }
      admin_checkin_token: {
        Args: { p_event_id: string }
        Returns: {
          expires_at: string
          token: string
        }[]
      }
      admin_decide_appeal: {
        Args: { p_accept: boolean; p_appeal_id: string; p_response: string }
        Returns: undefined
      }
      admin_delete_achievement: {
        Args: { p_id: string }
        Returns: {
          image_path: string
          removed: number
        }[]
      }
      admin_delete_announcement: { Args: { p_id: string }; Returns: undefined }
      admin_delete_banner: {
        Args: { p_id: string }
        Returns: {
          image_path: string
          still_path: string
        }[]
      }
      admin_delete_discord_role: {
        Args: { p_role_id: string }
        Returns: undefined
      }
      admin_delete_event: {
        Args: { p_id: string }
        Returns: {
          image_path: string
          removed: number
        }[]
      }
      admin_delete_gallery_group: { Args: { p_id: string }; Returns: string[] }
      admin_delete_gallery_image: { Args: { p_id: string }; Returns: string }
      admin_delete_team_generation: {
        Args: { p_id: string }
        Returns: string[]
      }
      admin_delete_team_member: { Args: { p_id: string }; Returns: string }
      admin_display_name: { Args: { p_user_id: string }; Returns: string }
      admin_event_reminders: {
        Args: { p_id: string }
        Returns: {
          offset_minutes: number
          sent_at: string
          skipped_at: string
        }[]
      }
      admin_export_appeals: {
        Args: { p_ids?: string[]; p_status?: string }
        Returns: {
          admin_response: string
          ban_id: string
          banned_at: string
          banned_by_name: string
          created_at: string
          decided_at: string
          decided_by_name: string
          expires_at: string
          id: string
          message: string
          public_note: string
          reason: string
          status: string
          user_id: string
          user_name: string
        }[]
      }
      admin_export_audit: {
        Args: {
          p_actor?: string
          p_before_at?: string
          p_before_id?: string
          p_entity?: string
          p_from?: string
          p_ids?: string[]
          p_limit?: number
          p_target?: string
          p_to?: string
        }
        Returns: {
          actor_name: string
          actor_user_id: string
          created_at: string
          entity: string
          entity_id: string
          field: string
          id: string
          new_value: string
          old_value: string
          target_name: string
          target_user_id: string
        }[]
      }
      admin_export_reports: {
        Args: { p_ids?: string[]; p_status?: string }
        Returns: {
          admin_note: string
          category: string
          created_at: string
          details: string
          evidence_url: string
          handled_at: string
          handled_by_name: string
          id: string
          reporter_id: string
          reporter_name: string
          status: string
          target_banned: boolean
          target_name: string
          target_open_reports: number
          target_user_id: string
        }[]
      }
      admin_get_user: { Args: { p_user_id: string }; Returns: Json }
      admin_grant_banner: {
        Args: { p_banner_id: string; p_grant: boolean; p_user_id: string }
        Returns: undefined
      }
      admin_handle_report: {
        Args: { p_note?: string; p_report_id: string; p_status: string }
        Returns: undefined
      }
      admin_lift_ban: { Args: { p_ban_id: string }; Returns: undefined }
      admin_list_achievements: {
        Args: never
        Returns: {
          award_count: number
          created_at: string
          description: string
          discord_role_id: string
          id: string
          image_path: string
          name: string
          status: string
          tier: string
          updated_at: string
        }[]
      }
      admin_list_announcements: {
        Args: never
        Returns: {
          body: string
          discord_message_id: string
          expires_at: string
          id: string
          image_path: string
          pinned: boolean
          post_to_discord: boolean
          published_at: string
          severity: string
          title: string
          updated_at: string
        }[]
      }
      admin_list_appeals: {
        Args: { p_status?: string }
        Returns: {
          admin_response: string
          ban_id: string
          banned_at: string
          banned_by_name: string
          created_at: string
          decided_at: string
          decided_by_name: string
          expires_at: string
          id: string
          message: string
          public_note: string
          reason: string
          status: string
          user_id: string
          user_name: string
        }[]
      }
      admin_list_attendance: {
        Args: { p_event_id: string }
        Returns: {
          avatar_url: string
          created_at: string
          display_name: string
          method: string
          recorded_by_name: string
          user_id: string
        }[]
      }
      admin_list_awards: {
        Args: { p_achievement_id: string }
        Returns: {
          awarded_by: string
          awarded_on: string
          created_at: string
          display_name: string
          event_id: string
          event_name: string
          id: string
          user_id: string
        }[]
      }
      admin_list_banners: {
        Args: never
        Returns: {
          colors: string[]
          event_ids: string[]
          id: string
          image_path: string
          kind: string
          name: string
          still_path: string
          style: string
        }[]
      }
      admin_list_discord_roles: {
        Args: never
        Returns: {
          created_at: string
          label: string
          role_id: string
        }[]
      }
      admin_list_event_interests: {
        Args: { p_event_id: string }
        Returns: {
          created_at: string
          display_name: string
          user_id: string
        }[]
      }
      admin_list_events: {
        Args: never
        Returns: {
          award_count: number
          category: string
          created_at: string
          description: string
          ends_at: string
          id: string
          image_path: string
          location: string
          name: string
          starts_at: string
          status: string
          updated_at: string
        }[]
      }
      admin_list_player_ids: {
        Args: { p_filters?: Json; p_query?: string }
        Returns: string[]
      }
      admin_list_players: {
        Args: {
          p_desc?: boolean
          p_filters?: Json
          p_limit?: number
          p_offset?: number
          p_query?: string
          p_sort?: string
        }
        Returns: {
          banned: boolean
          chula_email: string
          created_at: string
          display_name: string
          email: string
          handle: string
          minecraft_usernames: string
          role: string
          total: number
          user_id: string
          verification_kind: string
          whitelist: string
        }[]
      }
      admin_list_reports: {
        Args: { p_status?: string }
        Returns: {
          admin_note: string
          category: string
          created_at: string
          details: string
          evidence_url: string
          handled_at: string
          handled_by_name: string
          id: string
          reporter_id: string
          reporter_name: string
          status: string
          target_banned: boolean
          target_name: string
          target_open_reports: number
          target_user_id: string
        }[]
      }
      admin_mark_guest: { Args: { p_user_id: string }; Returns: undefined }
      admin_move_gallery_group: {
        Args: { p_id: string; p_up: boolean }
        Returns: undefined
      }
      admin_move_gallery_image: {
        Args: { p_id: string; p_up: boolean }
        Returns: undefined
      }
      admin_move_team_generation: {
        Args: { p_id: string; p_up: boolean }
        Returns: undefined
      }
      admin_move_team_member: {
        Args: { p_id: string; p_up: boolean }
        Returns: undefined
      }
      admin_newest_players: {
        Args: { p_limit?: number }
        Returns: {
          created_at: string
          display_name: string
          handle: string
          user_id: string
          verification_kind: string
        }[]
      }
      admin_ops_access: {
        Args: { p_action: string; p_jti: string; p_service: string }
        Returns: string
      }
      admin_overview_stats: {
        Args: never
        Returns: {
          guests: number
          oldest_failing_since: string
          pending_sync: number
          players: number
          removed_accounts: number
          retrying_sync: number
          unverified: number
          verified: number
          whitelisted_accounts: number
        }[]
      }
      admin_players_filtered: {
        Args: { p_filters: Json; p_query: string }
        Returns: {
          banned: boolean
          chula_email: string
          created_at: string
          display_name: string
          email: string
          handle: string
          id: string
          kind: string
          mc: string
          role: string
          wl: string
        }[]
      }
      admin_recent_activity: {
        Args: { p_limit?: number }
        Returns: {
          actor_name: string
          created_at: string
          entity: string
          field: string
          new_value: string
          old_value: string
          target_name: string
          target_user_id: string
        }[]
      }
      admin_remove_attendance: {
        Args: { p_event_id: string; p_user_id: string }
        Returns: undefined
      }
      admin_removed_accounts: {
        Args: never
        Returns: {
          discord_username: string
          id: string
          is_active: boolean
          minecraft_username: string
          removed_at: string
          removed_by: string
          user_id: string
        }[]
      }
      admin_reset_chula: { Args: { p_user_id: string }; Returns: undefined }
      admin_resolve_identifiers: {
        Args: { p_kind: string; p_values: string[] }
        Returns: {
          user_id: string
          value: string
        }[]
      }
      admin_revoke_award: { Args: { p_award_id: string }; Returns: number }
      admin_rotate_checkin_secret: {
        Args: { p_event_id: string }
        Returns: undefined
      }
      admin_save_banner: {
        Args: {
          p_colors: string[]
          p_id: string
          p_image_path: string
          p_name: string
          p_still_path: string
          p_style: string
        }
        Returns: string
      }
      admin_save_discord_role: {
        Args: { p_label: string; p_role_id: string }
        Returns: undefined
      }
      admin_save_gallery_group: {
        Args: { p_description: string; p_id: string; p_name: string }
        Returns: string
      }
      admin_save_gallery_image: {
        Args: {
          p_alt: string
          p_group_id: string
          p_id: string
          p_path: string
          p_wide: boolean
        }
        Returns: string
      }
      admin_save_site_page: {
        Args: { p_body: string; p_slug: string }
        Returns: undefined
      }
      admin_save_site_settings: {
        Args: { p_settings: Json }
        Returns: undefined
      }
      admin_save_team_generation: {
        Args: { p_id: string; p_name: string }
        Returns: string
      }
      admin_save_team_member: {
        Args: {
          p_bio: string
          p_generation_id: string
          p_id: string
          p_image_path: string
          p_kind: string
          p_link_url: string
          p_name: string
          p_title: string
          p_user_id: string
        }
        Returns: string
      }
      admin_search_users: {
        Args: { p_query: string }
        Returns: {
          chula_email: string
          created_at: string
          discord_username: string
          email: string
          minecraft_usernames: string
          role: string
          user_id: string
          verification_kind: string
        }[]
      }
      admin_set_achievement_meta: {
        Args: { p_discord_role_id: string; p_id: string; p_tier: string }
        Returns: undefined
      }
      admin_set_announcement_image: {
        Args: { p_id: string; p_path: string }
        Returns: string
      }
      admin_set_bot_job_enabled: {
        Args: { p_enabled: boolean; p_name: string }
        Returns: undefined
      }
      admin_set_bot_setting: {
        Args: { p_key: string; p_value: string }
        Returns: undefined
      }
      admin_set_event_banner: {
        Args: { p_banner_id: string; p_id: string }
        Returns: undefined
      }
      admin_set_event_category: {
        Args: { p_category: string; p_id: string }
        Returns: undefined
      }
      admin_set_event_reminders: {
        Args: { p_id: string; p_offsets: number[] }
        Returns: undefined
      }
      admin_set_gallery_cover: {
        Args: { p_id: string; p_path: string }
        Returns: string
      }
      admin_set_privacy: {
        Args: {
          p_achievements: string
          p_friends: string
          p_minecraft: string
          p_profile: string
          p_user_id: string
        }
        Returns: undefined
      }
      admin_set_role: {
        Args: { p_role: string; p_user_id: string }
        Returns: undefined
      }
      admin_set_whitelisted: {
        Args: { p_registration_id: string; p_value: boolean }
        Returns: undefined
      }
      admin_stats_daily: {
        Args: { p_days?: number }
        Returns: {
          banned: number
          created_at: string
          day: string
          guests: number
          players: number
          unverified: number
          verified: number
          whitelisted: number
        }[]
        SetofOptions: {
          from: "*"
          to: "stats_daily"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      admin_support_guard: { Args: { p_user_id: string }; Returns: undefined }
      admin_update_profile: {
        Args: {
          p_faculty: string
          p_first_name: string
          p_last_name: string
          p_major: string
          p_nickname: string
          p_study_level: string
          p_user_id: string
        }
        Returns: undefined
      }
      admin_upsert_achievement: {
        Args: {
          p_description: string
          p_id: string
          p_image_path: string
          p_name: string
          p_status: string
        }
        Returns: string
      }
      admin_upsert_announcement: {
        Args: {
          p_body: string
          p_expires_at: string
          p_id: string
          p_pinned: boolean
          p_post_to_discord: boolean
          p_published_at: string
          p_severity: string
          p_title: string
        }
        Returns: string
      }
      admin_upsert_event: {
        Args: {
          p_description: string
          p_ends_at: string
          p_id: string
          p_image_path: string
          p_location: string
          p_name: string
          p_starts_at: string
          p_status: string
        }
        Returns: string
      }
      admin_user_banners: {
        Args: { p_user_id: string }
        Returns: {
          colors: string[]
          event_names: string[]
          granted: boolean
          id: string
          image_path: string
          kind: string
          name: string
          owned: boolean
          selected: boolean
          still_path: string
          style: string
        }[]
      }
      admin_user_bans: {
        Args: { p_user_id: string }
        Returns: {
          active: boolean
          created_at: string
          created_by_name: string
          expires_at: string
          id: string
          lifted_at: string
          lifted_by_name: string
          public_note: string
          reason: string
        }[]
      }
      admin_user_profile: { Args: { p_user_id: string }; Returns: Json }
      am_i_player_verified: { Args: never; Returns: boolean }
      announcements_discord_queue: {
        Args: never
        Returns: {
          body: string
          deleted: boolean
          discord_message_id: string
          id: string
          revision: number
          severity: string
          title: string
        }[]
      }
      app_errors_recent: { Args: { p_minutes: number }; Returns: number }
      are_friends: { Args: { p_a: string; p_b: string }; Returns: boolean }
      banner_list: {
        Args: { p_user: string }
        Returns: {
          colors: string[]
          event_names: string[]
          granted: boolean
          id: string
          image_path: string
          kind: string
          name: string
          owned: boolean
          selected: boolean
          still_path: string
          style: string
        }[]
      }
      banner_of: { Args: { p_user: string }; Returns: string }
      banner_owned: {
        Args: { p_banner: string; p_user: string }
        Returns: boolean
      }
      block_player: { Args: { p_other: string }; Returns: number }
      bot_config: { Args: never; Returns: Json }
      bot_job_report: {
        Args: {
          p_error: string
          p_finished_at: string
          p_items: number
          p_job: string
          p_ok: boolean
          p_started_at: string
        }
        Returns: undefined
      }
      bot_register: {
        Args: { p_jobs: Json; p_settings: Json }
        Returns: undefined
      }
      bot_setting_ids: { Args: { p_value: string }; Returns: string[] }
      bot_settings_report: { Args: { p_items: Json }; Returns: number }
      can_view: {
        Args: { p_field: string; p_target: string; p_viewer: string }
        Returns: boolean
      }
      change_minecraft_account: {
        Args: {
          p_minecraft_username: string
          p_minecraft_uuid: string
          p_registration_id: string
          p_user_id: string
        }
        Returns: {
          created: boolean
          desired_whitelisted: boolean
          id: string
          minecraft_username: string
          sync_status: string
          updated_at: string
        }[]
      }
      check_in: {
        Args: { p_event_id: string; p_token: string }
        Returns: string
      }
      checkin_mac: {
        Args: { p_event_id: string; p_message: string }
        Returns: string
      }
      checkin_open: {
        Args: { p_event: Database["public"]["Tables"]["events"]["Row"] }
        Returns: boolean
      }
      checkin_proof: {
        Args: { p_event_id: string; p_token: string }
        Returns: string
      }
      checkin_verify: {
        Args: { p_event_id: string; p_token: string }
        Returns: boolean
      }
      claim_chula: {
        Args: { p_email: string; p_google_sub: string; p_user_id: string }
        Returns: undefined
      }
      cleanup_app_errors: { Args: never; Returns: number }
      cleanup_bot_job_runs: { Args: never; Returns: number }
      cleanup_notifications: { Args: never; Returns: number }
      consume_registration_attempt: { Args: never; Returns: boolean }
      current_app_role: { Args: never; Returns: string }
      discord_role_desired: {
        Args: never
        Returns: {
          discord_id: string
          role_id: string
        }[]
      }
      discord_role_queue: {
        Args: never
        Returns: {
          discord_id: string
          op: string
          role_id: string
        }[]
      }
      discord_role_queue_done: { Args: { p_items: Json }; Returns: number }
      event_attendance_backfill: { Args: never; Returns: number }
      event_history: { Args: { p_user_id: string }; Returns: Json }
      event_is_ended: {
        Args: { p_event: Database["public"]["Tables"]["events"]["Row"] }
        Returns: boolean
      }
      event_reminder_sent: {
        Args: { p_event_id: string; p_offset_minutes: number }
        Returns: boolean
      }
      event_reminders_due: {
        Args: never
        Returns: {
          event_id: string
          offset_minutes: number
        }[]
      }
      event_reminders_notify: { Args: never; Returns: number }
      event_reminders_queue: {
        Args: never
        Returns: {
          event_id: string
          interested_discord_ids: string[]
          location: string
          name: string
          offset_minutes: number
          starts_at: string
        }[]
      }
      get_event: { Args: { p_id: string }; Returns: Json }
      get_player_banner: {
        Args: { p_user_id: string }
        Returns: {
          colors: string[]
          image_path: string
          still_path: string
          style: string
        }[]
      }
      get_player_event_history: { Args: { p_user_id: string }; Returns: Json }
      get_player_profile: { Args: { p_user_id: string }; Returns: Json }
      get_site_page: {
        Args: { p_slug: string }
        Returns: {
          body: string
          updated_at: string
        }[]
      }
      get_site_settings: {
        Args: never
        Returns: {
          key: string
          value: string
        }[]
      }
      hook_only_discord_signups: { Args: { event: Json }; Returns: Json }
      insights_community: { Args: { p_days: number }; Returns: Json }
      insights_events: { Args: { p_days: number }; Returns: Json }
      insights_funnel: { Args: { p_days: number }; Returns: Json }
      insights_players: { Args: { p_days: number }; Returns: Json }
      insights_since: { Args: { p_days: number }; Returns: string }
      insights_staff: { Args: { p_days: number }; Returns: Json }
      is_banned: { Args: { p_user_id: string }; Returns: boolean }
      is_blocked_either: {
        Args: { p_a: string; p_b: string }
        Returns: boolean
      }
      is_chula_email: { Args: { p_email: string }; Returns: boolean }
      is_chula_verified: { Args: { p_user_id: string }; Returns: boolean }
      is_player_verified: { Args: { p_user_id: string }; Returns: boolean }
      lift_ban: {
        Args: { p_actor: string; p_ban_id: string; p_source: string }
        Returns: undefined
      }
      list_announcements: {
        Args: { p_limit?: number }
        Returns: {
          body: string
          id: string
          image_path: string
          pinned: boolean
          published_at: string
          severity: string
          title: string
        }[]
      }
      list_gallery: {
        Args: never
        Returns: {
          alt: string
          group_id: string
          id: string
          image_path: string
          wide: boolean
        }[]
      }
      list_gallery_groups: {
        Args: never
        Returns: {
          cover_path: string
          description: string
          id: string
          name: string
        }[]
      }
      list_past_events: {
        Args: { p_limit?: number }
        Returns: {
          category: string
          description_excerpt: string
          ends_at: string
          id: string
          image_path: string
          interest_count: number
          location: string
          name: string
          starts_at: string
        }[]
      }
      list_team: {
        Args: never
        Returns: {
          bio: string
          generation_id: string
          id: string
          image_path: string
          kind: string
          link_url: string
          name: string
          title: string
          user_id: string
        }[]
      }
      list_team_generations: {
        Args: never
        Returns: {
          id: string
          name: string
        }[]
      }
      list_upcoming_events: {
        Args: { p_limit?: number }
        Returns: {
          category: string
          description_excerpt: string
          ends_at: string
          id: string
          image_path: string
          interest_count: number
          location: string
          name: string
          starts_at: string
        }[]
      }
      log_account_change: {
        Args: {
          p_actor: string
          p_entity: string
          p_entity_id: string
          p_field: string
          p_new: string
          p_old: string
          p_source: string
          p_target: string
        }
        Returns: undefined
      }
      log_identity_change: {
        Args: {
          p_field: string
          p_identity_id: string
          p_new: string
          p_old: string
          p_user_id: string
        }
        Returns: undefined
      }
      mark_my_notifications_read: { Args: never; Returns: number }
      my_achievements: { Args: never; Returns: Json }
      my_ban: { Args: never; Returns: Json }
      my_banners: {
        Args: never
        Returns: {
          colors: string[]
          event_names: string[]
          granted: boolean
          id: string
          image_path: string
          kind: string
          name: string
          owned: boolean
          selected: boolean
          still_path: string
          style: string
        }[]
      }
      my_checkin_code: { Args: never; Returns: string }
      my_chula_claim: {
        Args: never
        Returns: {
          email: string
          google_sub: string
        }[]
      }
      my_event_history: { Args: never; Returns: Json }
      my_notifications: {
        Args: { p_limit?: number }
        Returns: {
          created_at: string
          id: string
          kind: string
          payload: Json
          read_at: string
        }[]
      }
      my_privacy: { Args: never; Returns: Json }
      my_social: { Args: never; Returns: Json }
      my_unread_notifications: { Args: never; Returns: number }
      player_avatar: { Args: { p_user: string }; Returns: string }
      player_card: {
        Args: { p_target: string; p_viewer: string }
        Returns: Json
      }
      player_display_name: { Args: { p_user: string }; Returns: string }
      privacy_level: {
        Args: { p_field: string; p_user: string }
        Returns: string
      }
      record_app_error: {
        Args: {
          p_digest: string
          p_kind: string
          p_message: string
          p_route: string
        }
        Returns: undefined
      }
      record_funnel_failure: {
        Args: { p_code: string; p_step: string }
        Returns: undefined
      }
      remove_friend: { Args: { p_other: string }; Returns: number }
      remove_minecraft_account: {
        Args: { p_registration_id: string; p_user_id: string }
        Returns: undefined
      }
      report_player: {
        Args: {
          p_category: string
          p_details: string
          p_evidence_url?: string
          p_target: string
        }
        Returns: undefined
      }
      respond_friend_request: {
        Args: { p_accept: boolean; p_requester: string }
        Returns: number
      }
      revoked_by_admin: {
        Args: { p_registration_id: string }
        Returns: boolean
      }
      search_players: { Args: { p_q: string }; Returns: Json }
      send_friend_request: { Args: { p_other: string }; Returns: string }
      set_event_interest: {
        Args: { p_event_id: string; p_interested: boolean }
        Returns: boolean
      }
      set_my_banner: { Args: { p_banner_id: string }; Returns: undefined }
      set_my_showcase: {
        Args: { p_achievement_ids: string[] }
        Returns: undefined
      }
      site_switch_on: { Args: { p_key: string }; Returns: boolean }
      snapshot_stats_daily: { Args: never; Returns: undefined }
      staff_area_functions: { Args: never; Returns: string[] }
      staff_can: { Args: { p_area: string }; Returns: boolean }
      staff_roles_replace: {
        Args: { p_from: string; p_src: string; p_to: string }
        Returns: string
      }
      submit_appeal: { Args: { p_message: string }; Returns: undefined }
      swap_order: {
        Args: { p_id: string; p_ids: string[]; p_up: boolean }
        Returns: string[]
      }
      unblock_player: { Args: { p_other: string }; Returns: number }
      update_privacy: {
        Args: {
          p_achievements: string
          p_friends: string
          p_minecraft: string
          p_profile: string
        }
        Returns: undefined
      }
      update_profile_details: {
        Args: {
          p_faculty: string
          p_first_name: string
          p_last_name: string
          p_major: string
          p_nickname: string
          p_study_level?: string
          p_user_id: string
        }
        Returns: undefined
      }
      verified_members: {
        Args: { p_discord_ids?: string[]; p_user_ids?: string[] }
        Returns: {
          discord_id: string
          faculty: string
          is_chula: boolean
          major: string
          study_level: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

