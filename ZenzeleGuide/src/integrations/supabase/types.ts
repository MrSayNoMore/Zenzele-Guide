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
      admin_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          diff: Json | null
          id: string
          target_id: string | null
          target_table: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          diff?: Json | null
          id?: string
          target_id?: string | null
          target_table?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          diff?: Json | null
          id?: string
          target_id?: string | null
          target_table?: string | null
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          anon_id: string | null
          created_at: string
          event: string
          id: string
          properties: Json
          user_id: string | null
        }
        Insert: {
          anon_id?: string | null
          created_at?: string
          event: string
          id?: string
          properties?: Json
          user_id?: string | null
        }
        Update: {
          anon_id?: string | null
          created_at?: string
          event?: string
          id?: string
          properties?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      aps_rule_versions: {
        Row: {
          created_at: string
          effective_from: string
          effective_to: string | null
          id: string
          notes: string | null
          published_by: string | null
          rules: Json
          university_id: string
          version_label: string
        }
        Insert: {
          created_at?: string
          effective_from: string
          effective_to?: string | null
          id?: string
          notes?: string | null
          published_by?: string | null
          rules: Json
          university_id: string
          version_label: string
        }
        Update: {
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          notes?: string | null
          published_by?: string | null
          rules?: Json
          university_id?: string
          version_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "aps_rule_versions_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      bursaries: {
        Row: {
          created_at: string
          description: string | null
          eligibility: Json
          fields_of_study: string[]
          id: string
          is_published: boolean
          last_verified_at: string | null
          name: string
          provider: string
          slug: string
          source_url: string | null
          updated_at: string
          value_description: string | null
          verified_by: string | null
          website_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          eligibility?: Json
          fields_of_study?: string[]
          id?: string
          is_published?: boolean
          last_verified_at?: string | null
          name: string
          provider: string
          slug: string
          source_url?: string | null
          updated_at?: string
          value_description?: string | null
          verified_by?: string | null
          website_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          eligibility?: Json
          fields_of_study?: string[]
          id?: string
          is_published?: boolean
          last_verified_at?: string | null
          name?: string
          provider?: string
          slug?: string
          source_url?: string | null
          updated_at?: string
          value_description?: string | null
          verified_by?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      bursary_cycles: {
        Row: {
          bursary_id: string
          closes_at: string | null
          id: string
          notes: string | null
          opens_at: string | null
          year: number
        }
        Insert: {
          bursary_id: string
          closes_at?: string | null
          id?: string
          notes?: string | null
          opens_at?: string | null
          year: number
        }
        Update: {
          bursary_id?: string
          closes_at?: string | null
          id?: string
          notes?: string | null
          opens_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "bursary_cycles_bursary_id_fkey"
            columns: ["bursary_id"]
            isOneToOne: false
            referencedRelation: "bursaries"
            referencedColumns: ["id"]
          },
        ]
      }
      career_subjects: {
        Row: {
          career_id: string
          id: string
          is_essential: boolean
          recommended_min_level: number | null
          subject_id: string
        }
        Insert: {
          career_id: string
          id?: string
          is_essential?: boolean
          recommended_min_level?: number | null
          subject_id: string
        }
        Update: {
          career_id?: string
          id?: string
          is_essential?: boolean
          recommended_min_level?: number | null
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "career_subjects_career_id_fkey"
            columns: ["career_id"]
            isOneToOne: false
            referencedRelation: "careers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "career_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      careers: {
        Row: {
          created_at: string
          description: string | null
          field_of_study: string | null
          id: string
          is_published: boolean
          name: string
          outlook: string | null
          slug: string
          typical_salary_range: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          field_of_study?: string | null
          id?: string
          is_published?: boolean
          name: string
          outlook?: string | null
          slug: string
          typical_salary_range?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          field_of_study?: string | null
          id?: string
          is_published?: boolean
          name?: string
          outlook?: string | null
          slug?: string
          typical_salary_range?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      course_requirements: {
        Row: {
          course_id: string
          created_at: string
          id: string
          is_required: boolean
          min_level: number
          notes: string | null
          subject_group: string | null
          subject_id: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          is_required?: boolean
          min_level: number
          notes?: string | null
          subject_group?: string | null
          subject_id?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          is_required?: boolean
          min_level?: number
          notes?: string | null
          subject_group?: string | null
          subject_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_requirements_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_requirements_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          description: string | null
          draft_state: Database["public"]["Enums"]["draft_state"]
          duration_years: number | null
          faculty_id: string
          field_of_study: string | null
          id: string
          is_published: boolean
          last_verified_at: string | null
          min_aps: number | null
          name: string
          qualification_type: string | null
          requires_nbt: boolean
          slug: string
          source_url: string | null
          updated_at: string
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          draft_state?: Database["public"]["Enums"]["draft_state"]
          duration_years?: number | null
          faculty_id: string
          field_of_study?: string | null
          id?: string
          is_published?: boolean
          last_verified_at?: string | null
          min_aps?: number | null
          name: string
          qualification_type?: string | null
          requires_nbt?: boolean
          slug: string
          source_url?: string | null
          updated_at?: string
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          draft_state?: Database["public"]["Enums"]["draft_state"]
          duration_years?: number | null
          faculty_id?: string
          field_of_study?: string | null
          id?: string
          is_published?: boolean
          last_verified_at?: string | null
          min_aps?: number | null
          name?: string
          qualification_type?: string | null
          requires_nbt?: boolean
          slug?: string
          source_url?: string | null
          updated_at?: string
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculties"
            referencedColumns: ["id"]
          },
        ]
      }
      draft_extractions: {
        Row: {
          confidence: number | null
          created_at: string
          id: string
          notes: string | null
          payload: Json
          promoted_row_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          state: Database["public"]["Enums"]["draft_state"]
          target_table: string
          upload_id: string
          checks: Json
          chunk_index: number | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          payload: Json
          promoted_row_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          state?: Database["public"]["Enums"]["draft_state"]
          target_table: string
          upload_id: string
          checks?: Json
          chunk_index?: number | null
        }
        Update: {
          confidence?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          payload?: Json
          promoted_row_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          state?: Database["public"]["Enums"]["draft_state"]
          target_table?: string
          upload_id?: string
          checks?: Json
          chunk_index?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "draft_extractions_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "prospectus_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      email_waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
          journey: Database["public"]["Enums"]["journey_type"] | null
          source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          journey?: Database["public"]["Enums"]["journey_type"] | null
          source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          journey?: Database["public"]["Enums"]["journey_type"] | null
          source?: string | null
        }
        Relationships: []
      }
      faculties: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          university_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          university_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          university_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "faculties_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      nsfas_rule_versions: {
        Row: {
          created_at: string
          effective_from: string
          effective_to: string | null
          id: string
          notes: string | null
          published_by: string | null
          rules: Json
          version_label: string
        }
        Insert: {
          created_at?: string
          effective_from: string
          effective_to?: string | null
          id?: string
          notes?: string | null
          published_by?: string | null
          rules: Json
          version_label: string
        }
        Update: {
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          notes?: string | null
          published_by?: string | null
          rules?: Json
          version_label?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          career_stage: string | null
          created_at: string
          display_name: string | null
          first_name: string | null
          grade: string | null
          id: string
          last_name: string | null
          province: string | null
          updated_at: string
        }
        Insert: {
          career_stage?: string | null
          created_at?: string
          display_name?: string | null
          first_name?: string | null
          grade?: string | null
          id: string
          last_name?: string | null
          province?: string | null
          updated_at?: string
        }
        Update: {
          career_stage?: string | null
          created_at?: string
          display_name?: string | null
          first_name?: string | null
          grade?: string | null
          id?: string
          last_name?: string | null
          province?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      prospectus_uploads: {
        Row: {
          created_at: string
          error_message: string | null
          filename: string
          id: string
          intake_year: number | null
          status: string
          storage_path: string | null
          university_id: string | null
          updated_at: string
          uploaded_by: string | null
          content_type: string
          source_kind: string
          source_url: string | null
          source_text: string | null
          page_range: string | null
          ai_model: string | null
          chunk_pages: number | null
          chunks_total: number | null
          chunks_done: number
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          filename: string
          id?: string
          intake_year?: number | null
          status?: string
          storage_path?: string | null
          university_id?: string | null
          updated_at?: string
          uploaded_by?: string | null
          content_type?: string
          source_kind?: string
          source_url?: string | null
          source_text?: string | null
          page_range?: string | null
          ai_model?: string | null
          chunk_pages?: number | null
          chunks_total?: number | null
          chunks_done?: number
        }
        Update: {
          created_at?: string
          error_message?: string | null
          filename?: string
          id?: string
          intake_year?: number | null
          status?: string
          storage_path?: string | null
          university_id?: string | null
          updated_at?: string
          uploaded_by?: string | null
          content_type?: string
          source_kind?: string
          source_url?: string | null
          source_text?: string | null
          page_range?: string | null
          ai_model?: string | null
          chunk_pages?: number | null
          chunks_total?: number | null
          chunks_done?: number
        }
        Relationships: [
          {
            foreignKeyName: "prospectus_uploads_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      results: {
        Row: {
          anon_id: string | null
          aps_rule_version_ids: string[]
          created_at: string
          engine_version: string
          id: string
          inputs: Json
          journey: Database["public"]["Enums"]["journey_type"]
          nsfas_rule_version_id: string | null
          output: Json
          share_slug: string
          user_id: string | null
        }
        Insert: {
          anon_id?: string | null
          aps_rule_version_ids?: string[]
          created_at?: string
          engine_version: string
          id?: string
          inputs: Json
          journey: Database["public"]["Enums"]["journey_type"]
          nsfas_rule_version_id?: string | null
          output: Json
          share_slug?: string
          user_id?: string | null
        }
        Update: {
          anon_id?: string | null
          aps_rule_version_ids?: string[]
          created_at?: string
          engine_version?: string
          id?: string
          inputs?: Json
          journey?: Database["public"]["Enums"]["journey_type"]
          nsfas_rule_version_id?: string | null
          output?: Json
          share_slug?: string
          user_id?: string | null
        }
        Relationships: []
      }
      saved_items: {
        Row: {
          created_at: string
          id: string
          kind: string
          note: string | null
          ref_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          note?: string | null
          ref_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          note?: string | null
          ref_id?: string
          user_id?: string
        }
        Relationships: []
      }
      subjects: {
        Row: {
          code: string
          created_at: string
          id: string
          is_language: boolean
          is_life_orientation: boolean
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_language?: boolean
          is_life_orientation?: boolean
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_language?: boolean
          is_life_orientation?: boolean
          name?: string
        }
        Relationships: []
      }
      tvet_colleges: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          last_verified_at: string | null
          name: string
          province: string | null
          slug: string
          source_url: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          last_verified_at?: string | null
          name: string
          province?: string | null
          slug: string
          source_url?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          last_verified_at?: string | null
          name?: string
          province?: string | null
          slug?: string
          source_url?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      tvet_programs: {
        Row: {
          college_id: string
          created_at: string
          description: string | null
          draft_state: Database["public"]["Enums"]["draft_state"]
          duration_years: number | null
          field_of_study: string | null
          id: string
          is_published: boolean
          last_verified_at: string | null
          min_grade: number | null
          name: string
          nqf_level: number | null
          program_type: Database["public"]["Enums"]["tvet_program_type"]
          slug: string
          source_url: string | null
          updated_at: string
        }
        Insert: {
          college_id: string
          created_at?: string
          description?: string | null
          draft_state?: Database["public"]["Enums"]["draft_state"]
          duration_years?: number | null
          field_of_study?: string | null
          id?: string
          is_published?: boolean
          last_verified_at?: string | null
          min_grade?: number | null
          name: string
          nqf_level?: number | null
          program_type: Database["public"]["Enums"]["tvet_program_type"]
          slug: string
          source_url?: string | null
          updated_at?: string
        }
        Update: {
          college_id?: string
          created_at?: string
          description?: string | null
          draft_state?: Database["public"]["Enums"]["draft_state"]
          duration_years?: number | null
          field_of_study?: string | null
          id?: string
          is_published?: boolean
          last_verified_at?: string | null
          min_grade?: number | null
          name?: string
          nqf_level?: number | null
          program_type?: Database["public"]["Enums"]["tvet_program_type"]
          slug?: string
          source_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tvet_programs_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "tvet_colleges"
            referencedColumns: ["id"]
          },
        ]
      }
      universities: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          last_verified_at: string | null
          logo_url: string | null
          name: string
          province: string | null
          short_name: string | null
          slug: string
          source_url: string | null
          uni_type: Database["public"]["Enums"]["uni_type"]
          updated_at: string
          verified_by: string | null
          website_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          last_verified_at?: string | null
          logo_url?: string | null
          name: string
          province?: string | null
          short_name?: string | null
          slug: string
          source_url?: string | null
          uni_type?: Database["public"]["Enums"]["uni_type"]
          updated_at?: string
          verified_by?: string | null
          website_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          last_verified_at?: string | null
          logo_url?: string | null
          name?: string
          province?: string | null
          short_name?: string | null
          slug?: string
          source_url?: string | null
          uni_type?: Database["public"]["Enums"]["uni_type"]
          updated_at?: string
          verified_by?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "super_admin" | "content_admin" | "learner"
      draft_state: "pending" | "approved" | "rejected"
      journey_type:
        | "grade_12"
        | "nsfas"
        | "bursary"
        | "tvet"
        | "grade_10"
        | "grade_11"
        | "gap_year"
        | "university"
        | "learnership"
        | "graduate"
      match_status: "qualifies" | "borderline" | "below" | "missing_info"
      tvet_program_type: "ncv" | "report_191" | "occupational"
      uni_type: "traditional" | "university_of_technology" | "comprehensive"
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
      app_role: ["super_admin", "content_admin", "learner"],
      draft_state: ["pending", "approved", "rejected"],
      journey_type: [
        "grade_12",
        "nsfas",
        "bursary",
        "tvet",
        "grade_10",
        "grade_11",
        "gap_year",
        "university",
        "learnership",
        "graduate",
      ],
      match_status: ["qualifies", "borderline", "below", "missing_info"],
      tvet_program_type: ["ncv", "report_191", "occupational"],
      uni_type: ["traditional", "university_of_technology", "comprehensive"],
    },
  },
} as const
