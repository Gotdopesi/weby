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
      kadernictvi: {
        Row: {
          id: number
          name: string
          slug: string
          email: string | null
          sms_price: number
          credit_balance: number
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          slug: string
          email?: string | null
          sms_price?: number
          credit_balance?: number
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          slug?: string
          email?: string | null
          sms_price?: number
          credit_balance?: number
          created_at?: string
        }
        Relationships: []
      }
      booking_slots: {
        Row: {
          kadernictvi_id: number
          created_at: string
          id: number
          is_available: boolean
          rezervace_id: string | null
          slot_date: string
          slot_time: string
        }
        Insert: {
          kadernictvi_id: number
          created_at?: string
          id?: number
          is_available?: boolean
          rezervace_id?: string | null
          slot_date: string
          slot_time: string
        }
        Update: {
          kadernictvi_id?: number
          created_at?: string
          id?: number
          is_available?: boolean
          rezervace_id?: string | null
          slot_date?: string
          slot_time?: string
        }
        Relationships: []
      }
      kadernictvi_sluzby: {
        Row: {
          kadernictvi_id: number
          created_at: string
          duration_minutes: number
          id: number
          name: string
          price: number
        }
        Insert: {
          kadernictvi_id: number
          created_at?: string
          duration_minutes?: number
          id?: number
          name: string
          price: number
        }
        Update: {
          kadernictvi_id?: number
          created_at?: string
          duration_minutes?: number
          id?: number
          name?: string
          price?: number
        }
        Relationships: []
      }
      kadernictvi_rezervace: {
        Row: {
          kadernictvi_id: number | null
          pracovnik_id: number | null
          booking_date: string
          booking_time: string
          created_at: string
          duration_minutes: number | null
          email: string
          first_name: string
          id: string
          last_name: string
          note: string | null
          phone: string
          service: string
          service_id: number | null
          sms_sent: boolean
          status: string
          total_price: number | null
        }
        Insert: {
          kadernictvi_id?: number | null
          pracovnik_id?: number | null
          booking_date: string
          booking_time: string
          created_at?: string
          duration_minutes?: number | null
          email: string
          first_name: string
          id?: string
          last_name: string
          note?: string | null
          phone: string
          service: string
          service_id?: number | null
          sms_sent?: boolean
          status?: string
          total_price?: number | null
        }
        Update: {
          kadernictvi_id?: number | null
          pracovnik_id?: number | null
          booking_date?: string
          booking_time?: string
          created_at?: string
          duration_minutes?: number | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          note?: string | null
          phone?: string
          service?: string
          service_id?: number | null
          sms_sent?: boolean
          status?: string
          total_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "kadernictvi_rezervace_kadernictvi_id_fkey"
            columns: ["kadernictvi_id"]
            isOneToOne: false
            referencedRelation: "kadernictvi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kadernictvi_rezervace_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "kadernictvi_sluzby"
            referencedColumns: ["id"]
          },
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
