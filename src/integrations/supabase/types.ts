export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      company_esg_kpis: {
        Row: {
          company_id: string
          created_at: string
          id: string
          kpi_metric: number | null
          kpi_name: string
          metric_unit: string | null
          reported_year: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          kpi_metric?: number | null
          kpi_name: string
          metric_unit?: string | null
          reported_year: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          kpi_metric?: number | null
          kpi_name?: string
          metric_unit?: string | null
          reported_year?: string
          updated_at?: string
        }
        Relationships: []
      }
      ehs_audit_responses: {
        Row: {
          action_deadline: string | null
          action_required: string | null
          action_status:
            | Database["public"]["Enums"]["action_status_type"]
            | null
          action_status_date: string | null
          action_taken: string | null
          audit_id: string
          created_at: string
          id: string
          non_conformance_description: string | null
          notes: string | null
          question_id: string
          response: Database["public"]["Enums"]["ehs_audit_response_type"]
          score: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          action_deadline?: string | null
          action_required?: string | null
          action_status?:
            | Database["public"]["Enums"]["action_status_type"]
            | null
          action_status_date?: string | null
          action_taken?: string | null
          audit_id: string
          created_at?: string
          id?: string
          non_conformance_description?: string | null
          notes?: string | null
          question_id: string
          response: Database["public"]["Enums"]["ehs_audit_response_type"]
          score?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          action_deadline?: string | null
          action_required?: string | null
          action_status?:
            | Database["public"]["Enums"]["action_status_type"]
            | null
          action_status_date?: string | null
          action_taken?: string | null
          audit_id?: string
          created_at?: string
          id?: string
          non_conformance_description?: string | null
          notes?: string | null
          question_id?: string
          response?: Database["public"]["Enums"]["ehs_audit_response_type"]
          score?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ehs_audit_responses_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "ehs_audit_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ehs_audit_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "ehs_checklist_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      ehs_audit_sessions: {
        Row: {
          audit_date: string
          auditor_id: string
          completion_date: string | null
          created_at: string
          enterprise_id: string
          id: string
          max_score: number | null
          notes: string | null
          status: string | null
          template_id: string
          total_score: number | null
          updated_at: string
        }
        Insert: {
          audit_date: string
          auditor_id: string
          completion_date?: string | null
          created_at?: string
          enterprise_id: string
          id?: string
          max_score?: number | null
          notes?: string | null
          status?: string | null
          template_id: string
          total_score?: number | null
          updated_at?: string
        }
        Update: {
          audit_date?: string
          auditor_id?: string
          completion_date?: string | null
          created_at?: string
          enterprise_id?: string
          id?: string
          max_score?: number | null
          notes?: string | null
          status?: string | null
          template_id?: string
          total_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ehs_audit_sessions_auditor_id_fkey"
            columns: ["auditor_id"]
            isOneToOne: false
            referencedRelation: "ehs_auditors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ehs_audit_sessions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "ehs_checklist_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      ehs_auditor_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          auditor_id: string
          enterprise_id: string
          id: string
          status: string | null
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          auditor_id: string
          enterprise_id: string
          id?: string
          status?: string | null
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          auditor_id?: string
          enterprise_id?: string
          id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ehs_auditor_assignments_auditor_id_fkey"
            columns: ["auditor_id"]
            isOneToOne: false
            referencedRelation: "ehs_auditors"
            referencedColumns: ["id"]
          },
        ]
      }
      ehs_auditors: {
        Row: {
          certifications: string[] | null
          created_at: string
          email: string
          id: string
          name: string
          specialization: string | null
          updated_at: string
        }
        Insert: {
          certifications?: string[] | null
          created_at?: string
          email: string
          id: string
          name: string
          specialization?: string | null
          updated_at?: string
        }
        Update: {
          certifications?: string[] | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          specialization?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ehs_checklist_questions: {
        Row: {
          category: string | null
          created_at: string
          id: string
          iso_standard: string | null
          question_text: string
          sequence_order: number | null
          template_id: string | null
          updated_at: string
          weightage: number
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          iso_standard?: string | null
          question_text: string
          sequence_order?: number | null
          template_id?: string | null
          updated_at?: string
          weightage?: number
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          iso_standard?: string | null
          question_text?: string
          sequence_order?: number | null
          template_id?: string | null
          updated_at?: string
          weightage?: number
        }
        Relationships: [
          {
            foreignKeyName: "ehs_checklist_questions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "ehs_checklist_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      ehs_checklist_templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          industry_category: string
          is_default: boolean | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          industry_category: string
          is_default?: boolean | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          industry_category?: string
          is_default?: boolean | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      ehs_question_overrides: {
        Row: {
          auditor_id: string
          created_at: string
          custom_question_text: string | null
          custom_weightage: number | null
          enterprise_id: string
          id: string
          question_id: string
          updated_at: string
        }
        Insert: {
          auditor_id: string
          created_at?: string
          custom_question_text?: string | null
          custom_weightage?: number | null
          enterprise_id: string
          id?: string
          question_id: string
          updated_at?: string
        }
        Update: {
          auditor_id?: string
          created_at?: string
          custom_question_text?: string | null
          custom_weightage?: number | null
          enterprise_id?: string
          id?: string
          question_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ehs_question_overrides_auditor_id_fkey"
            columns: ["auditor_id"]
            isOneToOne: false
            referencedRelation: "ehs_auditors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ehs_question_overrides_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "ehs_checklist_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      enterprise_ai_chats: {
        Row: {
          ai_response: string
          created_at: string
          enterprise_id: string
          id: string
          user_query: string
        }
        Insert: {
          ai_response: string
          created_at?: string
          enterprise_id: string
          id?: string
          user_query: string
        }
        Update: {
          ai_response?: string
          created_at?: string
          enterprise_id?: string
          id?: string
          user_query?: string
        }
        Relationships: []
      }
      enterprise_audit_responses: {
        Row: {
          action_deadline: string | null
          action_required: string | null
          action_status: string | null
          action_status_date: string | null
          action_taken: string | null
          audit_id: string
          created_at: string
          id: string
          non_conformance_description: string | null
          question_id: string
          response: string
          score: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          action_deadline?: string | null
          action_required?: string | null
          action_status?: string | null
          action_status_date?: string | null
          action_taken?: string | null
          audit_id: string
          created_at?: string
          id?: string
          non_conformance_description?: string | null
          question_id: string
          response: string
          score?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          action_deadline?: string | null
          action_required?: string | null
          action_status?: string | null
          action_status_date?: string | null
          action_taken?: string | null
          audit_id?: string
          created_at?: string
          id?: string
          non_conformance_description?: string | null
          question_id?: string
          response?: string
          score?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enterprise_audit_responses_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "enterprise_ehs_audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enterprise_audit_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "ehs_checklist_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      enterprise_auditor_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          auditor_id: string
          enterprise_id: string
          id: string
          status: string | null
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          auditor_id: string
          enterprise_id: string
          id?: string
          status?: string | null
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          auditor_id?: string
          enterprise_id?: string
          id?: string
          status?: string | null
        }
        Relationships: []
      }
      enterprise_compliance: {
        Row: {
          compliance_type: string
          created_at: string
          description: string
          due_date: string | null
          enterprise_id: string
          id: string
          remediation_plan: string | null
          severity: string | null
          status: string
          updated_at: string
        }
        Insert: {
          compliance_type: string
          created_at?: string
          description: string
          due_date?: string | null
          enterprise_id: string
          id?: string
          remediation_plan?: string | null
          severity?: string | null
          status: string
          updated_at?: string
        }
        Update: {
          compliance_type?: string
          created_at?: string
          description?: string
          due_date?: string | null
          enterprise_id?: string
          id?: string
          remediation_plan?: string | null
          severity?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      enterprise_data_approvals: {
        Row: {
          approver_id: string
          comments: string | null
          data_id: string
          data_type: string
          enterprise_id: string
          id: string
          responded_at: string | null
          status: string | null
          submitted_at: string
          submitted_by: string
        }
        Insert: {
          approver_id: string
          comments?: string | null
          data_id: string
          data_type: string
          enterprise_id: string
          id?: string
          responded_at?: string | null
          status?: string | null
          submitted_at?: string
          submitted_by: string
        }
        Update: {
          approver_id?: string
          comments?: string | null
          data_id?: string
          data_type?: string
          enterprise_id?: string
          id?: string
          responded_at?: string | null
          status?: string | null
          submitted_at?: string
          submitted_by?: string
        }
        Relationships: []
      }
      enterprise_ehs_audits: {
        Row: {
          audit_date: string | null
          auditor_id: string | null
          completion_date: string | null
          created_at: string
          enterprise_id: string
          id: string
          max_score: number | null
          notes: string | null
          status: string
          template_id: string | null
          total_score: number | null
          updated_at: string
        }
        Insert: {
          audit_date?: string | null
          auditor_id?: string | null
          completion_date?: string | null
          created_at?: string
          enterprise_id: string
          id?: string
          max_score?: number | null
          notes?: string | null
          status?: string
          template_id?: string | null
          total_score?: number | null
          updated_at?: string
        }
        Update: {
          audit_date?: string | null
          auditor_id?: string | null
          completion_date?: string | null
          created_at?: string
          enterprise_id?: string
          id?: string
          max_score?: number | null
          notes?: string | null
          status?: string
          template_id?: string | null
          total_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enterprise_ehs_audits_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "ehs_checklist_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      enterprise_esg_risks: {
        Row: {
          created_at: string
          enterprise_id: string
          id: string
          impact: string
          likelihood: string
          mitigation_plan: string | null
          risk_category: string
          risk_description: string
          risk_score: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          enterprise_id: string
          id?: string
          impact: string
          likelihood: string
          mitigation_plan?: string | null
          risk_category: string
          risk_description: string
          risk_score?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          enterprise_id?: string
          id?: string
          impact?: string
          likelihood?: string
          mitigation_plan?: string | null
          risk_category?: string
          risk_description?: string
          risk_score?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      enterprise_ghg_emissions: {
        Row: {
          created_at: string
          emission_source: string
          emission_unit: string
          emission_value: number
          enterprise_id: string
          id: string
          industry_category: string
          reporting_period_end: string
          reporting_period_start: string
          scope_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          emission_source: string
          emission_unit: string
          emission_value: number
          enterprise_id: string
          id?: string
          industry_category: string
          reporting_period_end: string
          reporting_period_start: string
          scope_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          emission_source?: string
          emission_unit?: string
          emission_value?: number
          enterprise_id?: string
          id?: string
          industry_category?: string
          reporting_period_end?: string
          reporting_period_start?: string
          scope_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      enterprise_materiality_assessments: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          enterprise_id: string
          id: string
          start_date: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          enterprise_id: string
          id?: string
          start_date?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          enterprise_id?: string
          id?: string
          start_date?: string | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      enterprise_materiality_invites: {
        Row: {
          assessment_id: string | null
          completed_at: string | null
          created_at: string
          email_sent_at: string | null
          id: string
          invite_token: string | null
          stakeholder_id: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          assessment_id?: string | null
          completed_at?: string | null
          created_at?: string
          email_sent_at?: string | null
          id?: string
          invite_token?: string | null
          stakeholder_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          assessment_id?: string | null
          completed_at?: string | null
          created_at?: string
          email_sent_at?: string | null
          id?: string
          invite_token?: string | null
          stakeholder_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enterprise_materiality_invites_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "enterprise_materiality_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enterprise_materiality_invites_stakeholder_id_fkey"
            columns: ["stakeholder_id"]
            isOneToOne: false
            referencedRelation: "enterprise_stakeholders"
            referencedColumns: ["id"]
          },
        ]
      }
      enterprise_materiality_responses: {
        Row: {
          comments: string | null
          created_at: string
          id: string
          impact_on_business: number
          impact_on_environment: number
          invite_id: string | null
          topic_id: string | null
          updated_at: string
        }
        Insert: {
          comments?: string | null
          created_at?: string
          id?: string
          impact_on_business: number
          impact_on_environment: number
          invite_id?: string | null
          topic_id?: string | null
          updated_at?: string
        }
        Update: {
          comments?: string | null
          created_at?: string
          id?: string
          impact_on_business?: number
          impact_on_environment?: number
          invite_id?: string | null
          topic_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enterprise_materiality_responses_invite_id_fkey"
            columns: ["invite_id"]
            isOneToOne: false
            referencedRelation: "enterprise_materiality_invites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enterprise_materiality_responses_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "enterprise_materiality_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      enterprise_materiality_topics: {
        Row: {
          assessment_id: string | null
          category: string | null
          created_at: string
          description: string | null
          id: string
          sequence_order: number | null
          topic_name: string
          updated_at: string
        }
        Insert: {
          assessment_id?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          sequence_order?: number | null
          topic_name: string
          updated_at?: string
        }
        Update: {
          assessment_id?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          sequence_order?: number | null
          topic_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enterprise_materiality_topics_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "enterprise_materiality_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      enterprise_sdg_progress: {
        Row: {
          created_at: string
          enterprise_id: string
          id: string
          initiatives: string | null
          metrics: string | null
          progress_percentage: number
          sdg_number: number
          target_description: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enterprise_id: string
          id?: string
          initiatives?: string | null
          metrics?: string | null
          progress_percentage: number
          sdg_number: number
          target_description: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enterprise_id?: string
          id?: string
          initiatives?: string | null
          metrics?: string | null
          progress_percentage?: number
          sdg_number?: number
          target_description?: string
          updated_at?: string
        }
        Relationships: []
      }
      enterprise_stakeholders: {
        Row: {
          created_at: string
          email: string
          enterprise_id: string
          id: string
          name: string
          notes: string | null
          organization: string | null
          phone: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          enterprise_id: string
          id?: string
          name: string
          notes?: string | null
          organization?: string | null
          phone?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          enterprise_id?: string
          id?: string
          name?: string
          notes?: string | null
          organization?: string | null
          phone?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      funds: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      partner_case_studies: {
        Row: {
          client_name: string
          created_at: string
          description: string
          id: string
          outcome: string | null
          partner_id: string
          updated_at: string
          year: number | null
        }
        Insert: {
          client_name: string
          created_at?: string
          description: string
          id?: string
          outcome?: string | null
          partner_id: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          client_name?: string
          created_at?: string
          description?: string
          id?: string
          outcome?: string | null
          partner_id?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_case_studies_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_profiles: {
        Row: {
          address: string | null
          created_at: string
          gst_number: string | null
          id: string
          organization_name: string
          partner_type: string
          profile_status: string
          services_offered: string[] | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          gst_number?: string | null
          id: string
          organization_name: string
          partner_type: string
          profile_status?: string
          services_offered?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          gst_number?: string | null
          id?: string
          organization_name?: string
          partner_type?: string
          profile_status?: string
          services_offered?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      team_member_funds: {
        Row: {
          created_at: string
          fund_id: string
          id: string
          team_member_id: string
        }
        Insert: {
          created_at?: string
          fund_id: string
          id?: string
          team_member_id: string
        }
        Update: {
          created_at?: string
          fund_id?: string
          id?: string
          team_member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_member_funds_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_member_funds_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          accepted: boolean | null
          created_at: string
          designation: string | null
          email: string
          fund_admin_id: string
          id: string
          invite_sent_at: string | null
          mobile_number: string | null
          name: string
          password: string | null
          updated_at: string
        }
        Insert: {
          accepted?: boolean | null
          created_at?: string
          designation?: string | null
          email: string
          fund_admin_id: string
          id?: string
          invite_sent_at?: string | null
          mobile_number?: string | null
          name: string
          password?: string | null
          updated_at?: string
        }
        Update: {
          accepted?: boolean | null
          created_at?: string
          designation?: string | null
          email?: string
          fund_admin_id?: string
          id?: string
          invite_sent_at?: string | null
          mobile_number?: string | null
          name?: string
          password?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_default_iso_checklist: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      action_status_type: "open" | "in_progress" | "closed"
      ehs_audit_response_type: "yes" | "no" | "partial" | "na"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      action_status_type: ["open", "in_progress", "closed"],
      ehs_audit_response_type: ["yes", "no", "partial", "na"],
    },
  },
} as const
