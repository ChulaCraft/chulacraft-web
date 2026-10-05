
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "account_change_log": {
                  Row: {
                    "actor_user_id": string | null,"created_at": string,"entity": string,"entity_id": string | null,"field": string,"id": string,"new_value": string | null,"old_value": string | null,"source": string,"target_user_id": string
                  }
                  Insert: {
                    "actor_user_id"?: string | null,"created_at"?: string,"entity": string,"entity_id"?: string | null,"field": string,"id"?: string,"new_value"?: string | null,"old_value"?: string | null,"source"?: string,"target_user_id": string
                  }
                  Update: {
                    "actor_user_id"?: string | null,"created_at"?: string,"entity"?: string,"entity_id"?: string | null,"field"?: string,"id"?: string,"new_value"?: string | null,"old_value"?: string | null,"source"?: string,"target_user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"achievement_awards": {
                  Row: {
                    "achievement_id": string,"awarded_by": string | null,"awarded_on": string,"created_at": string,"event_id": string | null,"id": string,"user_id": string
                  }
                  Insert: {
                    "achievement_id": string,"awarded_by"?: string | null,"awarded_on": string,"created_at"?: string,"event_id"?: string | null,"id"?: string,"user_id": string
                  }
                  Update: {
                    "achievement_id"?: string,"awarded_by"?: string | null,"awarded_on"?: string,"created_at"?: string,"event_id"?: string | null,"id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "achievement_awards_achievement_id_fkey"
      columns: ["achievement_id"]
isOneToOne: false
      referencedRelation: "achievements"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "achievement_awards_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "events"
      referencedColumns: ["id"]
    }
                  ]
                },"achievements": {
                  Row: {
                    "created_at": string,"created_by": string | null,"description": string | null,"id": string,"image_path": string,"name": string,"status": string,"updated_at": string
                  }
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"description"?: string | null,"id"?: string,"image_path": string,"name": string,"status"?: string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"description"?: string | null,"id"?: string,"image_path"?: string,"name"?: string,"status"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"blocks": {
                  Row: {
                    "blocked_id": string,"blocker_id": string,"created_at": string
                  }
                  Insert: {
                    "blocked_id": string,"blocker_id": string,"created_at"?: string
                  }
                  Update: {
                    "blocked_id"?: string,"blocker_id"?: string,"created_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"chula_claims": {
                  Row: {
                    "claimed_at": string,"discord_id": string,"email": string,"google_sub": string,"user_id": string
                  }
                  Insert: {
                    "claimed_at"?: string,"discord_id": string,"email": string,"google_sub": string,"user_id": string
                  }
                  Update: {
                    "claimed_at"?: string,"discord_id"?: string,"email"?: string,"google_sub"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"event_interests": {
                  Row: {
                    "created_at": string,"event_id": string,"user_id": string
                  }
                  Insert: {
                    "created_at"?: string,"event_id": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"event_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "event_interests_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "events"
      referencedColumns: ["id"]
    }
                  ]
                },"events": {
                  Row: {
                    "created_at": string,"created_by": string | null,"description": string | null,"ends_at": string | null,"id": string,"image_path": string | null,"location": string | null,"name": string,"starts_at": string,"status": string,"updated_at": string,"event_is_ended": boolean | null
                  }
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"description"?: string | null,"ends_at"?: string | null,"id"?: string,"image_path"?: string | null,"location"?: string | null,"name": string,"starts_at": string,"status"?: string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"description"?: string | null,"ends_at"?: string | null,"id"?: string,"image_path"?: string | null,"location"?: string | null,"name"?: string,"starts_at"?: string,"status"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"friendships": {
                  Row: {
                    "addressee_id": string,"created_at": string,"requester_id": string,"status": string
                  }
                  Insert: {
                    "addressee_id": string,"created_at"?: string,"requester_id": string,"status"?: string
                  }
                  Update: {
                    "addressee_id"?: string,"created_at"?: string,"requester_id"?: string,"status"?: string
                  }
                  Relationships: [
                    
                  ]
                },"minecraft_registrations": {
                  Row: {
                    "created_at": string,"desired_whitelisted": boolean,"discord_user_id": string,"discord_username": string | null,"id": string,"is_active": boolean,"last_sync_error_at": string | null,"last_sync_error_code": string | null,"minecraft_username": string,"minecraft_username_key": string,"minecraft_uuid": string,"next_sync_at": string,"revoked_at": string | null,"sync_attempts": number,"sync_failing_since": string | null,"sync_status": string,"updated_at": string,"user_id": string,"whitelisted_at": string | null
                  }
                  Insert: {
                    "created_at"?: string,"desired_whitelisted"?: boolean,"discord_user_id": string,"discord_username"?: string | null,"id"?: string,"is_active"?: boolean,"last_sync_error_at"?: string | null,"last_sync_error_code"?: string | null,"minecraft_username": string,"minecraft_username_key": string,"minecraft_uuid": string,"next_sync_at"?: string,"revoked_at"?: string | null,"sync_attempts"?: number,"sync_failing_since"?: string | null,"sync_status"?: string,"updated_at"?: string,"user_id": string,"whitelisted_at"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"desired_whitelisted"?: boolean,"discord_user_id"?: string,"discord_username"?: string | null,"id"?: string,"is_active"?: boolean,"last_sync_error_at"?: string | null,"last_sync_error_code"?: string | null,"minecraft_username"?: string,"minecraft_username_key"?: string,"minecraft_uuid"?: string,"next_sync_at"?: string,"revoked_at"?: string | null,"sync_attempts"?: number,"sync_failing_since"?: string | null,"sync_status"?: string,"updated_at"?: string,"user_id"?: string,"whitelisted_at"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"privacy_settings": {
                  Row: {
                    "achievements": string,"friends": string,"minecraft": string,"profile": string,"updated_at": string,"user_id": string
                  }
                  Insert: {
                    "achievements"?: string,"friends"?: string,"minecraft"?: string,"profile"?: string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "achievements"?: string,"friends"?: string,"minecraft"?: string,"profile"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"faculty": string | null,"first_name": string | null,"guest_verified_at": string | null,"guest_verified_by": string | null,"last_name": string | null,"major": string | null,"nickname": string | null,"role": string,"study_level": string | null,"updated_at": string,"user_id": string
                  }
                  Insert: {
                    "created_at"?: string,"faculty"?: string | null,"first_name"?: string | null,"guest_verified_at"?: string | null,"guest_verified_by"?: string | null,"last_name"?: string | null,"major"?: string | null,"nickname"?: string | null,"role"?: string,"study_level"?: string | null,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"faculty"?: string | null,"first_name"?: string | null,"guest_verified_at"?: string | null,"guest_verified_by"?: string | null,"last_name"?: string | null,"major"?: string | null,"nickname"?: string | null,"role"?: string,"study_level"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"profiles_major_backup_20261005": {
                  Row: {
                    "faculty": string | null,"major": string | null,"user_id": string | null
                  }
                  Insert: {
                    "faculty"?: string | null,"major"?: string | null,"user_id"?: string | null
                  }
                  Update: {
                    "faculty"?: string | null,"major"?: string | null,"user_id"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"registration_attempt_windows": {
                  Row: {
                    "attempts": number,"user_id": string,"window_started_at": string
                  }
                  Insert: {
                    "attempts"?: number,"user_id": string,"window_started_at"?: string
                  }
                  Update: {
                    "attempts"?: number,"user_id"?: string,"window_started_at"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "achievement_groups":
{ Args: { "p_user_id": string }; Returns: Json
                           },
"add_minecraft_account":
{ Args: { "p_minecraft_username": string,"p_minecraft_uuid": string,"p_user_id": string }; Returns: {
              "created": boolean,"desired_whitelisted": boolean,"id": string,"minecraft_username": string,"sync_status": string,"updated_at": string
            }[]
                           },
"admin_award":
{ Args: { "p_achievement_id": string,"p_awarded_on": string,"p_event_id": string,"p_user_ids": (string)[] }; Returns: number
                           },
"admin_delete_achievement":
{ Args: { "p_id": string }; Returns: {
              "image_path": string,"removed": number
            }[]
                           },
"admin_delete_announcement":
{ Args: { "p_id": string }; Returns: undefined
                           },
"admin_server_console_access":
{ Args: { "p_action": string,"p_jti": string,"p_server": string }; Returns: string
                           },
"admin_delete_event":
{ Args: { "p_id": string }; Returns: {
              "image_path": string,"removed": number
            }[]
                           },
"admin_display_name":
{ Args: { "p_user_id": string }; Returns: string
                           },
"admin_get_user":
{ Args: { "p_user_id": string }; Returns: Json
                           },
"admin_list_achievements":
{ Args: Record<PropertyKey, never>; Returns: {
              "award_count": number,"created_at": string,"description": string,"id": string,"image_path": string,"name": string,"status": string,"updated_at": string
            }[]
                           },
"admin_list_announcements":
{ Args: Record<PropertyKey, never>; Returns: {
              "body": string,"discord_message_id": string,"expires_at": string,"id": string,"pinned": boolean,"post_to_discord": boolean,"published_at": string,"severity": string,"title": string,"updated_at": string
            }[]
                           },
"admin_list_awards":
{ Args: { "p_achievement_id": string }; Returns: {
              "awarded_by": string,"awarded_on": string,"created_at": string,"display_name": string,"event_id": string,"event_name": string,"id": string,"user_id": string
            }[]
                           },
"admin_list_event_interests":
{ Args: { "p_event_id": string }; Returns: {
              "created_at": string,"display_name": string,"user_id": string
            }[]
                           },
"admin_list_events":
{ Args: Record<PropertyKey, never>; Returns: {
              "award_count": number,"created_at": string,"description": string,"ends_at": string,"id": string,"image_path": string,"location": string,"name": string,"starts_at": string,"status": string,"updated_at": string
            }[]
                           },
"admin_mark_guest":
{ Args: { "p_user_id": string }; Returns: undefined
                           },
"admin_newest_players":
{ Args: { "p_limit"?: number }; Returns: {
              "created_at": string,"display_name": string,"handle": string,"user_id": string,"verification_kind": string
            }[]
                           },
"admin_overview_stats":
{ Args: Record<PropertyKey, never>; Returns: {
              "guests": number,"oldest_failing_since": string,"pending_sync": number,"players": number,"removed_accounts": number,"retrying_sync": number,"unverified": number,"verified": number,"whitelisted_accounts": number
            }[]
                           },
"admin_recent_activity":
{ Args: { "p_limit"?: number }; Returns: {
              "actor_name": string,"created_at": string,"entity": string,"field": string,"new_value": string,"old_value": string,"target_name": string,"target_user_id": string
            }[]
                           },
"admin_removed_accounts":
{ Args: Record<PropertyKey, never>; Returns: {
              "discord_username": string,"id": string,"is_active": boolean,"minecraft_username": string,"removed_at": string,"removed_by": string,"user_id": string
            }[]
                           },
"admin_reset_chula":
{ Args: { "p_user_id": string }; Returns: undefined
                           },
"admin_resolve_identifiers":
{ Args: { "p_kind": string,"p_values": (string)[] }; Returns: {
              "user_id": string,"value": string
            }[]
                           },
"admin_revoke_award":
{ Args: { "p_award_id": string }; Returns: number
                           },
"admin_search_users":
{ Args: { "p_query": string }; Returns: {
              "chula_email": string,"created_at": string,"discord_username": string,"email": string,"minecraft_usernames": string,"role": string,"user_id": string,"verification_kind": string
            }[]
                           },
"admin_set_role":
{ Args: { "p_role": string,"p_user_id": string }; Returns: undefined
                           },
"admin_set_whitelisted":
{ Args: { "p_registration_id": string,"p_value": boolean }; Returns: undefined
                           },
"admin_upsert_achievement":
{ Args: { "p_description": string,"p_id": string,"p_image_path": string,"p_name": string,"p_status": string }; Returns: string
                           },
"admin_upsert_announcement":
{ Args: { "p_body": string,"p_expires_at": string,"p_id": string,"p_pinned": boolean,"p_post_to_discord": boolean,"p_published_at": string,"p_severity": string,"p_title": string }; Returns: string
                           },
"admin_upsert_event":
{ Args: { "p_description": string,"p_ends_at": string,"p_id": string,"p_image_path": string,"p_location": string,"p_name": string,"p_starts_at": string,"p_status": string }; Returns: string
                           },
"am_i_player_verified":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"announcements_discord_queue":
{ Args: Record<PropertyKey, never>; Returns: {
              "body": string,"deleted": boolean,"discord_message_id": string,"id": string,"revision": number,"severity": string,"title": string
            }[]
                           },
"are_friends":
{ Args: { "p_a": string,"p_b": string }; Returns: boolean
                           },
"block_player":
{ Args: { "p_other": string }; Returns: number
                           },
"can_view":
{ Args: { "p_field": string,"p_target": string,"p_viewer": string }; Returns: boolean
                           },
"change_minecraft_account":
{ Args: { "p_minecraft_username": string,"p_minecraft_uuid": string,"p_registration_id": string,"p_user_id": string }; Returns: {
              "created": boolean,"desired_whitelisted": boolean,"id": string,"minecraft_username": string,"sync_status": string,"updated_at": string
            }[]
                           },
"claim_chula":
{ Args: { "p_email": string,"p_google_sub": string,"p_user_id": string }; Returns: undefined
                           },
"consume_registration_attempt":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"current_app_role":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"event_is_ended":
{ Args: { "p_event": Database["public"]['Tables']["events"]['Row'] }; Returns: boolean
                           },
"get_event":
{ Args: { "p_id": string }; Returns: Json
                           },
"get_player_profile":
{ Args: { "p_user_id": string }; Returns: Json
                           },
"hook_only_discord_signups":
{ Args: { "event": Json }; Returns: Json
                           },
"is_blocked_either":
{ Args: { "p_a": string,"p_b": string }; Returns: boolean
                           },
"is_chula_email":
{ Args: { "p_email": string }; Returns: boolean
                           },
"is_chula_verified":
{ Args: { "p_user_id": string }; Returns: boolean
                           },
"is_player_verified":
{ Args: { "p_user_id": string }; Returns: boolean
                           },
"list_announcements":
{ Args: { "p_limit"?: number }; Returns: {
              "body": string,"id": string,"pinned": boolean,"published_at": string,"severity": string,"title": string
            }[]
                           },
"list_past_events":
{ Args: { "p_limit"?: number }; Returns: {
              "description_excerpt": string,"ends_at": string,"id": string,"image_path": string,"interest_count": number,"location": string,"name": string,"starts_at": string
            }[]
                           },
"list_upcoming_events":
{ Args: { "p_limit"?: number }; Returns: {
              "description_excerpt": string,"ends_at": string,"id": string,"image_path": string,"interest_count": number,"location": string,"name": string,"starts_at": string
            }[]
                           },
"log_account_change":
{ Args: { "p_actor": string,"p_entity": string,"p_entity_id": string,"p_field": string,"p_new": string,"p_old": string,"p_source": string,"p_target": string }; Returns: undefined
                           },
"log_identity_change":
{ Args: { "p_field": string,"p_identity_id": string,"p_new": string,"p_old": string,"p_user_id": string }; Returns: undefined
                           },
"my_achievements":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"my_chula_claim":
{ Args: Record<PropertyKey, never>; Returns: {
              "email": string,"google_sub": string
            }[]
                           },
"my_privacy":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"my_social":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"player_avatar":
{ Args: { "p_user": string }; Returns: string
                           },
"player_card":
{ Args: { "p_target": string,"p_viewer": string }; Returns: Json
                           },
"player_display_name":
{ Args: { "p_user": string }; Returns: string
                           },
"privacy_level":
{ Args: { "p_field": string,"p_user": string }; Returns: string
                           },
"remove_friend":
{ Args: { "p_other": string }; Returns: number
                           },
"remove_minecraft_account":
{ Args: { "p_registration_id": string,"p_user_id": string }; Returns: undefined
                           },
"respond_friend_request":
{ Args: { "p_accept": boolean,"p_requester": string }; Returns: number
                           },
"revoked_by_admin":
{ Args: { "p_registration_id": string }; Returns: boolean
                           },
"search_players":
{ Args: { "p_q": string }; Returns: Json
                           },
"send_friend_request":
{ Args: { "p_other": string }; Returns: string
                           },
"set_event_interest":
{ Args: { "p_event_id": string,"p_interested": boolean }; Returns: boolean
                           },
"unblock_player":
{ Args: { "p_other": string }; Returns: number
                           },
"update_privacy":
{ Args: { "p_achievements": string,"p_friends": string,"p_minecraft": string,"p_profile": string }; Returns: undefined
                           },
"update_profile_details":
{ Args: { "p_faculty": string,"p_first_name": string,"p_last_name": string,"p_major": string,"p_nickname": string,"p_study_level"?: string,"p_user_id": string }; Returns: undefined
                           },
"verified_members":
{ Args: { "p_discord_ids"?: (string)[],"p_user_ids"?: (string)[] }; Returns: {
              "discord_id": string,"faculty": string,"is_chula": boolean,"major": string,"study_level": string
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
