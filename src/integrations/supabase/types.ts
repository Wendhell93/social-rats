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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_emails: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      award_prizes: {
        Row: {
          award_id: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          placement: number
          title: string
          winner_member_id: string | null
        }
        Insert: {
          award_id: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          placement: number
          title: string
          winner_member_id?: string | null
        }
        Update: {
          award_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          placement?: number
          title?: string
          winner_member_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "award_prizes_award_id_fkey"
            columns: ["award_id"]
            isOneToOne: false
            referencedRelation: "awards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "award_prizes_winner_member_id_fkey"
            columns: ["winner_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      awards: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean
          start_date: string | null
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          start_date?: string | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          start_date?: string | null
          title?: string
        }
        Relationships: []
      }
      content_type_multipliers: {
        Row: {
          announcement: number
          id: string
          meme: number
          technical: number
          updated_at: string
        }
        Insert: {
          announcement?: number
          id?: string
          meme?: number
          technical?: number
          updated_at?: string
        }
        Update: {
          announcement?: number
          id?: string
          meme?: number
          technical?: number
          updated_at?: string
        }
        Relationships: []
      }
      creation_school_spaces: {
        Row: {
          button_label: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          name: string
          url: string
        }
        Insert: {
          button_label?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          name: string
          url: string
        }
        Update: {
          button_label?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          name?: string
          url?: string
        }
        Relationships: []
      }
      engagement_weights: {
        Row: {
          comments_weight: number
          id: string
          likes_weight: number
          saves_weight: number
          shares_weight: number
          updated_at: string
        }
        Insert: {
          comments_weight?: number
          id?: string
          likes_weight?: number
          saves_weight?: number
          shares_weight?: number
          updated_at?: string
        }
        Update: {
          comments_weight?: number
          id?: string
          likes_weight?: number
          saves_weight?: number
          shares_weight?: number
          updated_at?: string
        }
        Relationships: []
      }
      members: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          name: string
          role: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name: string
          role?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string
          role?: string | null
        }
        Relationships: []
      }
      post_creators: {
        Row: {
          creator_id: string
          id: string
          post_id: string
        }
        Insert: {
          creator_id: string
          id?: string
          post_id: string
        }
        Update: {
          creator_id?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_creators_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_creators_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          comments: number
          content_type: string | null
          created_at: string
          cta_clicks: number
          format: string
          forwards: number
          id: string
          interactions: number
          likes: number
          member_id: string | null
          platform: string
          posted_at: string | null
          saves: number
          score: number
          shares: number
          thumbnail_url: string | null
          title: string | null
          url: string
          views_pico: number
        }
        Insert: {
          comments?: number
          content_type?: string | null
          created_at?: string
          cta_clicks?: number
          format?: string
          forwards?: number
          id?: string
          interactions?: number
          likes?: number
          member_id?: string | null
          platform: string
          posted_at?: string | null
          saves?: number
          score?: number
          shares?: number
          thumbnail_url?: string | null
          title?: string | null
          url: string
          views_pico?: number
        }
        Update: {
          comments?: number
          content_type?: string | null
          created_at?: string
          cta_clicks?: number
          format?: string
          forwards?: number
          id?: string
          interactions?: number
          likes?: number
          member_id?: string | null
          platform?: string
          posted_at?: string | null
          saves?: number
          score?: number
          shares?: number
          thumbnail_url?: string | null
          title?: string | null
          url?: string
          views_pico?: number
        }
        Relationships: [
          {
            foreignKeyName: "posts_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      score_spaces: {
        Row: {
          button_label: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          name: string
          url: string
        }
        Insert: {
          button_label?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          name: string
          url: string
        }
        Update: {
          button_label?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          name?: string
          url?: string
        }
        Relationships: []
      }
      stories_weights: {
        Row: {
          cta_clicks_weight: number
          forwards_weight: number
          id: string
          interactions_weight: number
          updated_at: string
          views_pico_weight: number
        }
        Insert: {
          cta_clicks_weight?: number
          forwards_weight?: number
          id?: string
          interactions_weight?: number
          updated_at?: string
          views_pico_weight?: number
        }
        Update: {
          cta_clicks_weight?: number
          forwards_weight?: number
          id?: string
          interactions_weight?: number
          updated_at?: string
          views_pico_weight?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin_email: { Args: { _email: string }; Returns: boolean }
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
