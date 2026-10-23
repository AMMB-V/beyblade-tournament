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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          created_at: string
          id: number
          new_data: Json | null
          old_data: Json | null
          performed_by: string | null
          reason: string | null
          record_id: string
          table_name: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: number
          new_data?: Json | null
          old_data?: Json | null
          performed_by?: string | null
          reason?: string | null
          record_id: string
          table_name: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: number
          new_data?: Json | null
          old_data?: Json | null
          performed_by?: string | null
          reason?: string | null
          record_id?: string
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      banned_parts: {
        Row: {
          created_at: string
          id: string
          part_name: string
          reason: string | null
          tournament_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          part_name: string
          reason?: string | null
          tournament_id: string
        }
        Update: {
          created_at?: string
          id?: string
          part_name?: string
          reason?: string | null
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "banned_parts_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      battles: {
        Row: {
          battle_number: number
          finish: Database["public"]["Enums"]["finish_type"] | null
          id: string
          match_id: string
          p1_combo: string | null
          p2_combo: string | null
          points_scored: number | null
          recorded_at: string
          recorded_by: string | null
          scorer_id: string | null
        }
        Insert: {
          battle_number: number
          finish?: Database["public"]["Enums"]["finish_type"] | null
          id?: string
          match_id: string
          p1_combo?: string | null
          p2_combo?: string | null
          points_scored?: number | null
          recorded_at?: string
          recorded_by?: string | null
          scorer_id?: string | null
        }
        Update: {
          battle_number?: number
          finish?: Database["public"]["Enums"]["finish_type"] | null
          id?: string
          match_id?: string
          p1_combo?: string | null
          p2_combo?: string | null
          points_scored?: number | null
          recorded_at?: string
          recorded_by?: string | null
          scorer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "battles_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battles_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battles_scorer_id_fkey"
            columns: ["scorer_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      bey_checks: {
        Row: {
          checked_at: string
          checked_by: string
          combo_checked: string
          id: string
          match_id: string
          notes: string | null
          participant_id: string
          passed: boolean
          substitute_approved: boolean
        }
        Insert: {
          checked_at?: string
          checked_by: string
          combo_checked: string
          id?: string
          match_id: string
          notes?: string | null
          participant_id: string
          passed: boolean
          substitute_approved?: boolean
        }
        Update: {
          checked_at?: string
          checked_by?: string
          combo_checked?: string
          id?: string
          match_id?: string
          notes?: string | null
          participant_id?: string
          passed?: boolean
          substitute_approved?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "bey_checks_checked_by_fkey"
            columns: ["checked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bey_checks_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bey_checks_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      finish_point_rules: {
        Row: {
          finish_type: Database["public"]["Enums"]["finish_type"]
          id: string
          points: number
          tournament_id: string
        }
        Insert: {
          finish_type: Database["public"]["Enums"]["finish_type"]
          id?: string
          points: number
          tournament_id: string
        }
        Update: {
          finish_type?: Database["public"]["Enums"]["finish_type"]
          id?: string
          points?: number
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finish_point_rules_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      group_participants: {
        Row: {
          group_id: string
          participant_id: string
          seed_in_group: number | null
        }
        Insert: {
          group_id: string
          participant_id: string
          seed_in_group?: number | null
        }
        Update: {
          group_id?: string
          participant_id?: string
          seed_in_group?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "group_participants_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_participants_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          id: string
          name: string
          position: number
          stage_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          position: number
          stage_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          position?: number
          stage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "stages"
            referencedColumns: ["id"]
          },
        ]
      }
      match_decks: {
        Row: {
          combo_1: string
          combo_2: string | null
          combo_3: string | null
          declared_at: string
          id: string
          match_id: string
          participant_id: string
        }
        Insert: {
          combo_1: string
          combo_2?: string | null
          combo_3?: string | null
          declared_at?: string
          id?: string
          match_id: string
          participant_id: string
        }
        Update: {
          combo_1?: string
          combo_2?: string | null
          combo_3?: string | null
          declared_at?: string
          id?: string
          match_id?: string
          participant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_decks_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_decks_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          bracket_side: Database["public"]["Enums"]["bracket_side"]
          completed_at: string | null
          created_at: string
          group_id: string | null
          id: string
          locked_at: string | null
          loser_next_match_id: string | null
          loser_next_slot: number | null
          match_number: number
          next_match_id: string | null
          next_match_slot: number | null
          p1_match_points: number
          p2_match_points: number
          participant1_id: string | null
          participant2_id: string | null
          referee_id: string | null
          round: number
          stage_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["match_status"]
          winner_id: string | null
        }
        Insert: {
          bracket_side?: Database["public"]["Enums"]["bracket_side"]
          completed_at?: string | null
          created_at?: string
          group_id?: string | null
          id?: string
          locked_at?: string | null
          loser_next_match_id?: string | null
          loser_next_slot?: number | null
          match_number: number
          next_match_id?: string | null
          next_match_slot?: number | null
          p1_match_points?: number
          p2_match_points?: number
          participant1_id?: string | null
          participant2_id?: string | null
          referee_id?: string | null
          round: number
          stage_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          winner_id?: string | null
        }
        Update: {
          bracket_side?: Database["public"]["Enums"]["bracket_side"]
          completed_at?: string | null
          created_at?: string
          group_id?: string | null
          id?: string
          locked_at?: string | null
          loser_next_match_id?: string | null
          loser_next_slot?: number | null
          match_number?: number
          next_match_id?: string | null
          next_match_slot?: number | null
          p1_match_points?: number
          p2_match_points?: number
          participant1_id?: string | null
          participant2_id?: string | null
          referee_id?: string | null
          round?: number
          stage_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_loser_next_match_id_fkey"
            columns: ["loser_next_match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_next_match_id_fkey"
            columns: ["next_match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_participant1_id_fkey"
            columns: ["participant1_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_participant2_id_fkey"
            columns: ["participant2_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_referee_id_fkey"
            columns: ["referee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          accepted_at: string | null
          invited_at: string
          org_id: string
          profile_id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          accepted_at?: string | null
          invited_at?: string
          org_id: string
          profile_id: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          accepted_at?: string | null
          invited_at?: string
          org_id?: string
          profile_id?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          owner_id: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          owner_id: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      participants: {
        Row: {
          checked_in_at: string | null
          created_at: string
          display_name: string
          id: string
          notes: string | null
          profile_id: string | null
          seed: number | null
          status: Database["public"]["Enums"]["participant_status"]
          tournament_id: string
        }
        Insert: {
          checked_in_at?: string | null
          created_at?: string
          display_name: string
          id?: string
          notes?: string | null
          profile_id?: string | null
          seed?: number | null
          status?: Database["public"]["Enums"]["participant_status"]
          tournament_id: string
        }
        Update: {
          checked_in_at?: string | null
          created_at?: string
          display_name?: string
          id?: string
          notes?: string | null
          profile_id?: string | null
          seed?: number | null
          status?: Database["public"]["Enums"]["participant_status"]
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "participants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participants_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      penalties: {
        Row: {
          battle_id: string | null
          card_type: Database["public"]["Enums"]["card_type"]
          id: string
          issued_at: string
          issued_by: string
          match_id: string
          participant_id: string
          reason: string | null
        }
        Insert: {
          battle_id?: string | null
          card_type: Database["public"]["Enums"]["card_type"]
          id?: string
          issued_at?: string
          issued_by: string
          match_id: string
          participant_id: string
          reason?: string | null
        }
        Update: {
          battle_id?: string | null
          card_type?: Database["public"]["Enums"]["card_type"]
          id?: string
          issued_at?: string
          issued_by?: string
          match_id?: string
          participant_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "penalties_battle_id_fkey"
            columns: ["battle_id"]
            isOneToOne: false
            referencedRelation: "battles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "penalties_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "penalties_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "penalties_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          elo_rating: number
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          wbo_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name: string
          elo_rating?: number
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          wbo_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          elo_rating?: number
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          wbo_id?: string | null
        }
        Relationships: []
      }
      stage_standings: {
        Row: {
          advanced: boolean
          buchholz_score: number
          draws: number
          group_id: string | null
          id: string
          losses: number
          participant_id: string
          points_against: number
          points_for: number
          position: number | null
          stage_id: string
          updated_at: string
          wins: number
        }
        Insert: {
          advanced?: boolean
          buchholz_score?: number
          draws?: number
          group_id?: string | null
          id?: string
          losses?: number
          participant_id: string
          points_against?: number
          points_for?: number
          position?: number | null
          stage_id: string
          updated_at?: string
          wins?: number
        }
        Update: {
          advanced?: boolean
          buchholz_score?: number
          draws?: number
          group_id?: string | null
          id?: string
          losses?: number
          participant_id?: string
          points_against?: number
          points_for?: number
          position?: number | null
          stage_id?: string
          updated_at?: string
          wins?: number
        }
        Relationships: [
          {
            foreignKeyName: "stage_standings_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stage_standings_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stage_standings_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "stages"
            referencedColumns: ["id"]
          },
        ]
      }
      stages: {
        Row: {
          advance_per_group: number | null
          best_of: number
          completed_at: string | null
          created_at: string
          format: Database["public"]["Enums"]["stage_format"]
          grand_finals_modifier: string | null
          group_size: number | null
          groups_count: number | null
          id: string
          match_type: Database["public"]["Enums"]["match_type"]
          name: string
          points_to_win: number
          position: number
          started_at: string | null
          status: Database["public"]["Enums"]["tournament_status"]
          swiss_rounds: number | null
          tiebreakers: Database["public"]["Enums"]["tiebreaker_method"][]
          tournament_id: string
        }
        Insert: {
          advance_per_group?: number | null
          best_of?: number
          completed_at?: string | null
          created_at?: string
          format: Database["public"]["Enums"]["stage_format"]
          grand_finals_modifier?: string | null
          group_size?: number | null
          groups_count?: number | null
          id?: string
          match_type?: Database["public"]["Enums"]["match_type"]
          name: string
          points_to_win?: number
          position: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["tournament_status"]
          swiss_rounds?: number | null
          tiebreakers?: Database["public"]["Enums"]["tiebreaker_method"][]
          tournament_id: string
        }
        Update: {
          advance_per_group?: number | null
          best_of?: number
          completed_at?: string | null
          created_at?: string
          format?: Database["public"]["Enums"]["stage_format"]
          grand_finals_modifier?: string | null
          group_size?: number | null
          groups_count?: number | null
          id?: string
          match_type?: Database["public"]["Enums"]["match_type"]
          name?: string
          points_to_win?: number
          position?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["tournament_status"]
          swiss_rounds?: number | null
          tiebreakers?: Database["public"]["Enums"]["tiebreaker_method"][]
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stages_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_referees: {
        Row: {
          assigned_at: string
          profile_id: string
          tournament_id: string
        }
        Insert: {
          assigned_at?: string
          profile_id: string
          tournament_id: string
        }
        Update: {
          assigned_at?: string
          profile_id?: string
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_referees_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_referees_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          banner_url: string | null
          checkin_close: string | null
          checkin_open: string | null
          created_at: string
          created_by: string
          description: string | null
          ends_at: string | null
          entry_fee: number | null
          id: string
          location: string | null
          max_participants: number | null
          name: string
          org_id: string | null
          registration_close: string | null
          registration_open: string | null
          rotation_rules: string | null
          seeding_method: string
          slug: string
          stadium: string | null
          starts_at: string | null
          status: Database["public"]["Enums"]["tournament_status"]
          updated_at: string
          visibility: Database["public"]["Enums"]["tournament_visibility"]
        }
        Insert: {
          banner_url?: string | null
          checkin_close?: string | null
          checkin_open?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          ends_at?: string | null
          entry_fee?: number | null
          id?: string
          location?: string | null
          max_participants?: number | null
          name: string
          org_id?: string | null
          registration_close?: string | null
          registration_open?: string | null
          rotation_rules?: string | null
          seeding_method?: string
          slug: string
          stadium?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["tournament_status"]
          updated_at?: string
          visibility?: Database["public"]["Enums"]["tournament_visibility"]
        }
        Update: {
          banner_url?: string | null
          checkin_close?: string | null
          checkin_open?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          ends_at?: string | null
          entry_fee?: number | null
          id?: string
          location?: string | null
          max_participants?: number | null
          name?: string
          org_id?: string | null
          registration_close?: string | null
          registration_open?: string | null
          rotation_rules?: string | null
          seeding_method?: string
          slug?: string
          stadium?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["tournament_status"]
          updated_at?: string
          visibility?: Database["public"]["Enums"]["tournament_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "tournaments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournaments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auth_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_tournament_organizer: {
        Args: { p_tournament_id: string }
        Returns: boolean
      }
      is_tournament_referee: {
        Args: { p_tournament_id: string }
        Returns: boolean
      }
      seed_default_finish_points: {
        Args: { p_tournament_id: string }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      bracket_side: "winners" | "losers" | "grand_finals"
      card_type: "yellow" | "red"
      finish_type: "spin" | "over" | "burst" | "xtreme"
      match_status: "pending" | "in_progress" | "completed" | "disputed" | "bye"
      match_type: "1on1" | "deck" | "3on3" | "5g"
      participant_status:
        | "registered"
        | "checked_in"
        | "disqualified"
        | "withdrawn"
      stage_format:
        | "single_elimination"
        | "double_elimination"
        | "round_robin"
        | "swiss"
        | "groups"
      tiebreaker_method:
        | "wins"
        | "point_diff"
        | "head_to_head"
        | "buchholz"
        | "draw"
      tournament_status:
        | "draft"
        | "registration"
        | "checkin"
        | "in_progress"
        | "completed"
        | "cancelled"
      tournament_visibility: "public" | "private" | "unlisted"
      user_role: "admin" | "organizer" | "referee" | "blader"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      bracket_side: ["winners", "losers", "grand_finals"],
      card_type: ["yellow", "red"],
      finish_type: ["spin", "over", "burst", "xtreme"],
      match_status: ["pending", "in_progress", "completed", "disputed", "bye"],
      match_type: ["1on1", "deck", "3on3", "5g"],
      participant_status: [
        "registered",
        "checked_in",
        "disqualified",
        "withdrawn",
      ],
      stage_format: [
        "single_elimination",
        "double_elimination",
        "round_robin",
        "swiss",
        "groups",
      ],
      tiebreaker_method: [
        "wins",
        "point_diff",
        "head_to_head",
        "buchholz",
        "draw",
      ],
      tournament_status: [
        "draft",
        "registration",
        "checkin",
        "in_progress",
        "completed",
        "cancelled",
      ],
      tournament_visibility: ["public", "private", "unlisted"],
      user_role: ["admin", "organizer", "referee", "blader"],
    },
  },
} as const
