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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      app_users: {
        Row: {
          auth_token: string
          claimed_achievements: string[]
          claimed_milestones: string[]
          created_at: string
          gave_up: number
          golden_stars: number
          id: string
          last_login_date: string | null
          login_streak: number
          on_leaderboard: boolean
          stars: number
          titles: string[]
          updated_at: string
          username: string
          xp: number
          xp_bonus: number
        }
        Insert: {
          auth_token?: string
          claimed_achievements?: string[]
          claimed_milestones?: string[]
          created_at?: string
          gave_up?: number
          golden_stars?: number
          id?: string
          last_login_date?: string | null
          login_streak?: number
          on_leaderboard?: boolean
          stars?: number
          titles?: string[]
          updated_at?: string
          username: string
          xp?: number
          xp_bonus?: number
        }
        Update: {
          auth_token?: string
          claimed_achievements?: string[]
          claimed_milestones?: string[]
          created_at?: string
          gave_up?: number
          golden_stars?: number
          id?: string
          last_login_date?: string | null
          login_streak?: number
          on_leaderboard?: boolean
          stars?: number
          titles?: string[]
          updated_at?: string
          username?: string
          xp?: number
          xp_bonus?: number
        }
        Relationships: []
      }
      daily_chest_claims: {
        Row: {
          claim_date: string
          created_at: string
          golden_awarded: number
          id: string
          stars_awarded: number
          username: string
        }
        Insert: {
          claim_date?: string
          created_at?: string
          golden_awarded?: number
          id?: string
          stars_awarded?: number
          username: string
        }
        Update: {
          claim_date?: string
          created_at?: string
          golden_awarded?: number
          id?: string
          stars_awarded?: number
          username?: string
        }
        Relationships: []
      }
      marathon_completions: {
        Row: {
          correct: number
          created_at: string
          id: string
          marathon_date: string
          stars_awarded: number
          total: number
          username: string
          xp_awarded: number
        }
        Insert: {
          correct?: number
          created_at?: string
          id?: string
          marathon_date?: string
          stars_awarded?: number
          total?: number
          username: string
          xp_awarded?: number
        }
        Update: {
          correct?: number
          created_at?: string
          id?: string
          marathon_date?: string
          stars_awarded?: number
          total?: number
          username?: string
          xp_awarded?: number
        }
        Relationships: []
      }
      news_posts: {
        Row: {
          body: string
          created_at: string
          id: string
          pinned: boolean
          title: string
          updated_at: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          pinned?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          pinned?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      purchase_requests: {
        Row: {
          cost: number
          created_at: string
          currency: string
          id: string
          item_key: string
          item_label: string
          status: string
          username: string
        }
        Insert: {
          cost: number
          created_at?: string
          currency: string
          id?: string
          item_key: string
          item_label: string
          status?: string
          username: string
        }
        Update: {
          cost?: number
          created_at?: string
          currency?: string
          id?: string
          item_key?: string
          item_label?: string
          status?: string
          username?: string
        }
        Relationships: []
      }
      quiz_completions: {
        Row: {
          correct: number
          created_at: string
          id: string
          quiz_date: string
          stars_awarded: number
          username: string
        }
        Insert: {
          correct?: number
          created_at?: string
          id?: string
          quiz_date?: string
          stars_awarded?: number
          username: string
        }
        Update: {
          correct?: number
          created_at?: string
          id?: string
          quiz_date?: string
          stars_awarded?: number
          username?: string
        }
        Relationships: []
      }
      shop_items: {
        Row: {
          cost: number
          created_at: string
          currency: string
          description: string
          id: string
          is_daily: boolean
          key: string
          kind: string
          label: string
          rarity: string | null
          reward_meta: Json
          updated_at: string
        }
        Insert: {
          cost: number
          created_at?: string
          currency: string
          description?: string
          id?: string
          is_daily?: boolean
          key: string
          kind?: string
          label: string
          rarity?: string | null
          reward_meta?: Json
          updated_at?: string
        }
        Update: {
          cost?: number
          created_at?: string
          currency?: string
          description?: string
          id?: string
          is_daily?: boolean
          key?: string
          kind?: string
          label?: string
          rarity?: string | null
          reward_meta?: Json
          updated_at?: string
        }
        Relationships: []
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
    Enums: {},
  },
} as const
