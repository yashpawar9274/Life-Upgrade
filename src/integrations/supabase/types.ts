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
      ai_usage_logs: {
        Row: {
          created_at: string
          estimated_tokens: number
          id: string
          request_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          estimated_tokens?: number
          id?: string
          request_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          estimated_tokens?: number
          id?: string
          request_type?: string
          user_id?: string
        }
        Relationships: []
      }
      coach_memory: {
        Row: {
          created_at: string
          id: string
          summary: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          summary: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          summary?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_logs: {
        Row: {
          day: string
          focus_minutes: number
          habit_done: string[]
          limit_counts: Json
          mood: string | null
          routine_done: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          day: string
          focus_minutes?: number
          habit_done?: string[]
          limit_counts?: Json
          mood?: string | null
          routine_done?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          day?: string
          focus_minutes?: number
          habit_done?: string[]
          limit_counts?: Json
          mood?: string | null
          routine_done?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      premium_members: {
        Row: {
          email: string
          granted_at: string
          lifetime: boolean
        }
        Insert: {
          email: string
          granted_at?: string
          lifetime?: boolean
        }
        Update: {
          email?: string
          granted_at?: string
          lifetime?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount: number
          cancelled_at: string | null
          cashfree_order_id: string | null
          cashfree_payment_id: string | null
          cashfree_subscription_id: string | null
          created_at: string
          currency: string
          current_period_end: string | null
          email: string | null
          id: string
          interval: string
          payu_payment_id: string | null
          payu_txnid: string | null
          plan_code: string
          provider: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          cancelled_at?: string | null
          cashfree_order_id?: string | null
          cashfree_payment_id?: string | null
          cashfree_subscription_id?: string | null
          created_at?: string
          currency?: string
          current_period_end?: string | null
          email?: string | null
          id?: string
          interval: string
          payu_payment_id?: string | null
          payu_txnid?: string | null
          plan_code: string
          provider?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          cancelled_at?: string | null
          cashfree_order_id?: string | null
          cashfree_payment_id?: string | null
          cashfree_subscription_id?: string | null
          created_at?: string
          currency?: string
          current_period_end?: string | null
          email?: string | null
          id?: string
          interval?: string
          payu_payment_id?: string | null
          payu_txnid?: string | null
          plan_code?: string
          provider?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_config: {
        Row: {
          chat: Json
          habits: Json
          limits: Json
          profile: Json
          roadmap: Json
          routines: Json
          updated_at: string
          user_id: string
          voice_sessions: Json
          voice_settings: Json
        }
        Insert: {
          chat?: Json
          habits?: Json
          limits?: Json
          profile?: Json
          roadmap?: Json
          routines?: Json
          updated_at?: string
          user_id: string
          voice_sessions?: Json
          voice_settings?: Json
        }
        Update: {
          chat?: Json
          habits?: Json
          limits?: Json
          profile?: Json
          roadmap?: Json
          routines?: Json
          updated_at?: string
          user_id?: string
          voice_sessions?: Json
          voice_settings?: Json
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_plan: { Args: never; Returns: string }
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
    Enums: {},
  },
} as const
