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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          after_snapshot: Json | null
          before_snapshot: Json | null
          created_at: string | null
          entity_id: string | null
          entity_type: Database["public"]["Enums"]["entity_type"]
          hash: string | null
          id: string
          ip_address: unknown | null
          maker_checker_state:
            | Database["public"]["Enums"]["approval_status"]
            | null
          prev_hash: string | null
          request_id: string | null
          tenant_id: string | null
          user_agent: string | null
          version_number: number | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          after_snapshot?: Json | null
          before_snapshot?: Json | null
          created_at?: string | null
          entity_id?: string | null
          entity_type: Database["public"]["Enums"]["entity_type"]
          hash?: string | null
          id?: string
          ip_address?: unknown | null
          maker_checker_state?:
            | Database["public"]["Enums"]["approval_status"]
            | null
          prev_hash?: string | null
          request_id?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          version_number?: number | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          after_snapshot?: Json | null
          before_snapshot?: Json | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: Database["public"]["Enums"]["entity_type"]
          hash?: string | null
          id?: string
          ip_address?: unknown | null
          maker_checker_state?:
            | Database["public"]["Enums"]["approval_status"]
            | null
          prev_hash?: string | null
          request_id?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          version_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      company_kpis: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string | null
          id: string
          kpi_name: string
          kpi_value: number | null
          reporting_period: string | null
          target_value: number | null
          tenant_id: string
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          kpi_name: string
          kpi_value?: number | null
          reporting_period?: string | null
          target_value?: number | null
          tenant_id: string
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          kpi_name?: string
          kpi_value?: number | null
          reporting_period?: string | null
          target_value?: number | null
          tenant_id?: string
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      esg_responses: {
        Row: {
          category: string | null
          company_id: string
          created_at: string | null
          created_by: string | null
          id: string
          question_id: string
          response_value: string | null
          score: number | null
          subcategory: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          question_id: string
          response_value?: string | null
          score?: number | null
          subcategory?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          question_id?: string
          response_value?: string | null
          score?: number | null
          subcategory?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      funds: {
        Row: {
          created_at: string | null
          created_by: string | null
          currency: string
          exclusion_terms: string[] | null
          id: string
          inclusion_terms: string[] | null
          name: string
          sectors: string[] | null
          size: string
          stage: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          currency?: string
          exclusion_terms?: string[] | null
          id?: string
          inclusion_terms?: string[] | null
          name: string
          sectors?: string[] | null
          size: string
          stage: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          currency?: string
          exclusion_terms?: string[] | null
          id?: string
          inclusion_terms?: string[] | null
          name?: string
          sectors?: string[] | null
          size?: string
          stage?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      portfolio_companies: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          employee_count: number | null
          equity_percentage: number | null
          esg_score: number | null
          founded_year: number | null
          fund_id: string | null
          headquarters: string | null
          id: string
          industry: string | null
          investment_amount: number | null
          name: string
          stage: string | null
          tenant_id: string
          updated_at: string | null
          valuation: number | null
          website: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          employee_count?: number | null
          equity_percentage?: number | null
          esg_score?: number | null
          founded_year?: number | null
          fund_id?: string | null
          headquarters?: string | null
          id?: string
          industry?: string | null
          investment_amount?: number | null
          name: string
          stage?: string | null
          tenant_id: string
          updated_at?: string | null
          valuation?: number | null
          website?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          employee_count?: number | null
          equity_percentage?: number | null
          esg_score?: number | null
          founded_year?: number | null
          fund_id?: string | null
          headquarters?: string | null
          id?: string
          industry?: string | null
          investment_amount?: number | null
          name?: string
          stage?: string | null
          tenant_id?: string
          updated_at?: string | null
          valuation?: number | null
          website?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          created_by: string | null
          designation: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean | null
          mobile_number: string | null
          role: Database["public"]["Enums"]["user_role"]
          tenant_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          designation?: string | null
          email: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          mobile_number?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          designation?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          mobile_number?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          designation: string | null
          email: string
          full_name: string
          id: string
          invitation_token: string | null
          invited_at: string | null
          invited_by: string | null
          is_active: boolean | null
          mobile_number: string | null
          role: Database["public"]["Enums"]["user_role"]
          tenant_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          designation?: string | null
          email: string
          full_name: string
          id?: string
          invitation_token?: string | null
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          mobile_number?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          designation?: string | null
          email?: string
          full_name?: string
          id?: string
          invitation_token?: string | null
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          mobile_number?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          access_notes: string | null
          approval_requested_at: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          description: string | null
          id: string
          is_approved: boolean
          is_demo: boolean
          name: string
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          access_notes?: string | null
          approval_requested_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_approved?: boolean
          is_demo?: boolean
          name: string
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          access_notes?: string | null
          approval_requested_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_approved?: boolean
          is_demo?: boolean
          name?: string
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      confirm_demo_user: {
        Args: { user_email: string }
        Returns: undefined
      }
    }
    Enums: {
      approval_status: "draft" | "pending_approval" | "approved" | "rejected"
      entity_type:
        | "investor"
        | "portfolio"
        | "company"
        | "deal"
        | "note"
        | "task"
        | "document"
        | "user"
        | "permission"
      user_role:
        | "investor_admin"
        | "team_member_editor"
        | "team_member_readonly"
        | "auditor"
        | "super_admin"
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
    Enums: {
      approval_status: ["draft", "pending_approval", "approved", "rejected"],
      entity_type: [
        "investor",
        "portfolio",
        "company",
        "deal",
        "note",
        "task",
        "document",
        "user",
        "permission",
      ],
      user_role: [
        "investor_admin",
        "team_member_editor",
        "team_member_readonly",
        "auditor",
        "super_admin",
      ],
    },
  },
} as const
