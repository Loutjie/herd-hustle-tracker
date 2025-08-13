export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      cattle_transactions: {
        Row: {
          average_weight_kg: number | null
          batch_id: string | null
          breed: string | null
          created_at: string
          id: string
          input_cost_deduction: number
          notes: string | null
          occurred_on: string
          price_per_head: number
          quantity: number
          total_amount: number
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          average_weight_kg?: number | null
          batch_id?: string | null
          breed?: string | null
          created_at?: string
          id?: string
          input_cost_deduction?: number
          notes?: string | null
          occurred_on?: string
          price_per_head: number
          quantity: number
          total_amount: number
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          average_weight_kg?: number | null
          batch_id?: string | null
          breed?: string | null
          created_at?: string
          id?: string
          input_cost_deduction?: number
          notes?: string | null
          occurred_on?: string
          price_per_head?: number
          quantity?: number
          total_amount?: number
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      input_costs: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string | null
          id: string
          occurred_on: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          description?: string | null
          id?: string
          occurred_on?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          occurred_on?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sale_batch_allocations: {
        Row: {
          cost_per_head: number
          created_at: string
          id: string
          purchase_transaction_id: string
          quantity: number
          sale_transaction_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cost_per_head: number
          created_at?: string
          id?: string
          purchase_transaction_id: string
          quantity: number
          sale_transaction_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cost_per_head?: number
          created_at?: string
          id?: string
          purchase_transaction_id?: string
          quantity?: number
          sale_transaction_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_purchase_txn"
            columns: ["purchase_transaction_id"]
            isOneToOne: false
            referencedRelation: "available_batches"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "fk_purchase_txn"
            columns: ["purchase_transaction_id"]
            isOneToOne: false
            referencedRelation: "cattle_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sale_txn"
            columns: ["sale_transaction_id"]
            isOneToOne: false
            referencedRelation: "available_batches"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "fk_sale_txn"
            columns: ["sale_transaction_id"]
            isOneToOne: false
            referencedRelation: "cattle_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      available_batches: {
        Row: {
          average_weight_kg: number | null
          batch_id: string | null
          breed: string | null
          price_per_head: number | null
          purchase_date: string | null
          purchase_notes: string | null
          purchased_quantity: number | null
          remaining_quantity: number | null
          sold_quantity: number | null
        }
        Relationships: []
      }
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
