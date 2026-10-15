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
      categories: {
        Row: {
          created_at: string
          id: string
          label: string
          slug: string
          sort: number
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          slug: string
          sort?: number
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          slug?: string
          sort?: number
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string
          updated_at: string
        }
        Insert: {
          address?: string
          created_at?: string
          email: string
          full_name?: string
          id?: string
          phone?: string
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      inquiries: {
        Row: {
          budget: string
          city: string
          created_at: string
          email: string
          event_date: string
          full_name: string
          guests: number
          id: string
          kind: string
          message: string
          phone: string
          status: string
          updated_at: string
        }
        Insert: {
          budget?: string
          city?: string
          created_at?: string
          email?: string
          event_date?: string
          full_name?: string
          guests?: number
          id?: string
          kind?: string
          message?: string
          phone?: string
          status?: string
          updated_at?: string
        }
        Update: {
          budget?: string
          city?: string
          created_at?: string
          email?: string
          event_date?: string
          full_name?: string
          guests?: number
          id?: string
          kind?: string
          message?: string
          phone?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          address: string
          created_at: string
          email: string
          full_name: string
          id: string
          items: Json
          phone: string
          status: string
          total: number
          tranzila_index: string
          tranzila_response: string
          updated_at: string
        }
        Insert: {
          address?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          items?: Json
          phone?: string
          status?: string
          total?: number
          tranzila_index?: string
          tranzila_response?: string
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          items?: Json
          phone?: string
          status?: string
          total?: number
          tranzila_index?: string
          tranzila_response?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          abv: string
          category_slug: string
          created_at: string
          discount_percent: number
          featured: boolean
          id: string
          image: string
          in_stock: boolean
          name: string
          note: string
          price: number
          sort: number
          subtitle: string
        }
        Insert: {
          abv?: string
          category_slug: string
          created_at?: string
          discount_percent?: number
          featured?: boolean
          id?: string
          image?: string
          in_stock?: boolean
          name: string
          note?: string
          price?: number
          sort?: number
          subtitle?: string
        }
        Update: {
          abv?: string
          category_slug?: string
          created_at?: string
          discount_percent?: number
          featured?: boolean
          id?: string
          image?: string
          in_stock?: boolean
          name?: string
          note?: string
          price?: number
          sort?: number
          subtitle?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_slug_fkey"
            columns: ["category_slug"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["slug"]
          },
        ]
      }
      products_backup_20261015: {
        Row: {
          abv: string | null
          category_slug: string | null
          created_at: string | null
          discount_percent: number | null
          featured: boolean | null
          id: string | null
          image: string | null
          in_stock: boolean | null
          name: string | null
          note: string | null
          price: number | null
          sort: number | null
          subtitle: string | null
        }
        Insert: {
          abv?: string | null
          category_slug?: string | null
          created_at?: string | null
          discount_percent?: number | null
          featured?: boolean | null
          id?: string | null
          image?: string | null
          in_stock?: boolean | null
          name?: string | null
          note?: string | null
          price?: number | null
          sort?: number | null
          subtitle?: string | null
        }
        Update: {
          abv?: string | null
          category_slug?: string | null
          created_at?: string | null
          discount_percent?: number | null
          featured?: boolean | null
          id?: string | null
          image?: string | null
          in_stock?: boolean | null
          name?: string | null
          note?: string | null
          price?: number | null
          sort?: number | null
          subtitle?: string | null
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
