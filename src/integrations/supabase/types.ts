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
      a_la_carte_bar512: {
        Row: {
          allergens: string[]
          category: string
          created_at: string
          description: string | null
          dietary: string[]
          id: string
          name: string
          price_pln: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          allergens?: string[]
          category: string
          created_at?: string
          description?: string | null
          dietary?: string[]
          id?: string
          name: string
          price_pln?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          allergens?: string[]
          category?: string
          created_at?: string
          description?: string | null
          dietary?: string[]
          id?: string
          name?: string
          price_pln?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      a_la_carte_polskie_smaki: {
        Row: {
          allergens: string[]
          category: string
          created_at: string
          description: string | null
          dietary: string[]
          id: string
          name: string
          price_pln: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          allergens?: string[]
          category: string
          created_at?: string
          description?: string | null
          dietary?: string[]
          id?: string
          name: string
          price_pln?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          allergens?: string[]
          category?: string
          created_at?: string
          description?: string | null
          dietary?: string[]
          id?: string
          name?: string
          price_pln?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          category: string | null
          created_at: string
          email: string | null
          extension: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          email?: string | null
          extension?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          email?: string | null
          extension?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      contacts_konferencje: {
        Row: {
          category: string | null
          created_at: string
          email: string | null
          extension: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          email?: string | null
          extension?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          email?: string | null
          extension?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      contacts_polskie_smaki: {
        Row: {
          category: string | null
          created_at: string
          email: string | null
          extension: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          email?: string | null
          extension?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          email?: string | null
          extension?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          beverage_menu: string | null
          category: string | null
          created_at: string
          description: string | null
          event_date: string
          event_time: string | null
          food_menu: string | null
          guest_count: number | null
          id: string
          is_recurring: boolean
          location: string | null
          recurrence_rule: string | null
          title: string
          updated_at: string
        }
        Insert: {
          beverage_menu?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          event_date: string
          event_time?: string | null
          food_menu?: string | null
          guest_count?: number | null
          id?: string
          is_recurring?: boolean
          location?: string | null
          recurrence_rule?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          beverage_menu?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          event_date?: string
          event_time?: string | null
          food_menu?: string | null
          guest_count?: number | null
          id?: string
          is_recurring?: boolean
          location?: string | null
          recurrence_rule?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      events_konferencje: {
        Row: {
          beverage_menu: string | null
          category: string | null
          created_at: string
          description: string | null
          event_date: string
          event_time: string | null
          food_menu: string | null
          guest_count: number | null
          id: string
          is_recurring: boolean
          location: string | null
          recurrence_rule: string | null
          title: string
          updated_at: string
        }
        Insert: {
          beverage_menu?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          event_date: string
          event_time?: string | null
          food_menu?: string | null
          guest_count?: number | null
          id?: string
          is_recurring?: boolean
          location?: string | null
          recurrence_rule?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          beverage_menu?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          event_date?: string
          event_time?: string | null
          food_menu?: string | null
          guest_count?: number | null
          id?: string
          is_recurring?: boolean
          location?: string | null
          recurrence_rule?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      events_polskie_smaki: {
        Row: {
          beverage_menu: string | null
          category: string | null
          created_at: string
          description: string | null
          event_date: string
          event_time: string | null
          food_menu: string | null
          guest_count: number | null
          id: string
          is_recurring: boolean
          location: string | null
          recurrence_rule: string | null
          title: string
          updated_at: string
        }
        Insert: {
          beverage_menu?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          event_date: string
          event_time?: string | null
          food_menu?: string | null
          guest_count?: number | null
          id?: string
          is_recurring?: boolean
          location?: string | null
          recurrence_rule?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          beverage_menu?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          event_date?: string
          event_time?: string | null
          food_menu?: string | null
          guest_count?: number | null
          id?: string
          is_recurring?: boolean
          location?: string | null
          recurrence_rule?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          category: string
          created_at: string
          flagged_at: string | null
          id: string
          name: string
          needs_restock: boolean
          restock_note: string | null
          subcategory: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          flagged_at?: string | null
          id: string
          name: string
          needs_restock?: boolean
          restock_note?: string | null
          subcategory?: string | null
          unit: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          flagged_at?: string | null
          id?: string
          name?: string
          needs_restock?: boolean
          restock_note?: string | null
          subcategory?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory_items_konferencje: {
        Row: {
          category: string
          created_at: string
          flagged_at: string | null
          id: string
          name: string
          needs_restock: boolean
          restock_note: string | null
          subcategory: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          flagged_at?: string | null
          id: string
          name: string
          needs_restock?: boolean
          restock_note?: string | null
          subcategory?: string | null
          unit: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          flagged_at?: string | null
          id?: string
          name?: string
          needs_restock?: boolean
          restock_note?: string | null
          subcategory?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory_items_polskie_smaki: {
        Row: {
          category: string
          created_at: string
          flagged_at: string | null
          id: string
          name: string
          needs_restock: boolean
          restock_note: string | null
          subcategory: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          flagged_at?: string | null
          id: string
          name: string
          needs_restock?: boolean
          restock_note?: string | null
          subcategory?: string | null
          unit: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          flagged_at?: string | null
          id?: string
          name?: string
          needs_restock?: boolean
          restock_note?: string | null
          subcategory?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      recipes: {
        Row: {
          category: string
          created_at: string
          id: string
          image_url: string | null
          ingredients: string
          instructions: string
          name: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          image_url?: string | null
          ingredients: string
          instructions: string
          name: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          image_url?: string | null
          ingredients?: string
          instructions?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      recipes_konferencje: {
        Row: {
          category: string
          created_at: string
          id: string
          image_url: string | null
          ingredients: string
          instructions: string
          name: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          image_url?: string | null
          ingredients: string
          instructions: string
          name: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          image_url?: string | null
          ingredients?: string
          instructions?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      recipes_polskie_smaki: {
        Row: {
          category: string
          created_at: string
          id: string
          image_url: string | null
          ingredients: string
          instructions: string
          name: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          image_url?: string | null
          ingredients: string
          instructions: string
          name: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          image_url?: string | null
          ingredients?: string
          instructions?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      subcategories: {
        Row: {
          category: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      subcategories_konferencje: {
        Row: {
          category: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      subcategories_polskie_smaki: {
        Row: {
          category: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          name?: string
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
