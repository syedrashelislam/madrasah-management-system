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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          created_at: string
          date: string
          id: string
          status: string
          student_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          status?: string
          student_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          status?: string
          student_id?: string
        }
        Relationships: []
      }
      book_issues: {
        Row: {
          book_id: string
          created_at: string
          id: string
          issue_date: string | null
          return_date: string | null
          status: string
          student_id: string
        }
        Insert: {
          book_id: string
          created_at?: string
          id?: string
          issue_date?: string | null
          return_date?: string | null
          status?: string
          student_id: string
        }
        Update: {
          book_id?: string
          created_at?: string
          id?: string
          issue_date?: string | null
          return_date?: string | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_issues_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      books: {
        Row: {
          author: string
          available_copies: number
          book_id: string
          category: string | null
          created_at: string
          id: string
          title: string
          total_copies: number
          updated_at: string
        }
        Insert: {
          author: string
          available_copies?: number
          book_id: string
          category?: string | null
          created_at?: string
          id?: string
          title: string
          total_copies?: number
          updated_at?: string
        }
        Update: {
          author?: string
          available_copies?: number
          book_id?: string
          category?: string | null
          created_at?: string
          id?: string
          title?: string
          total_copies?: number
          updated_at?: string
        }
        Relationships: []
      }
      classes: {
        Row: {
          class_id: number
          created_at: string | null
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          class_id: number
          created_at?: string | null
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          class_id?: number
          created_at?: string | null
          id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      exam_subjects: {
        Row: {
          exam_id: string
          full_marks: number
          id: string
          name: string
          pass_marks: number
        }
        Insert: {
          exam_id: string
          full_marks?: number
          id?: string
          name: string
          pass_marks?: number
        }
        Update: {
          exam_id?: string
          full_marks?: number
          id?: string
          name?: string
          pass_marks?: number
        }
        Relationships: [
          {
            foreignKeyName: "exam_subjects_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          class_id: number
          class_name: string
          created_at: string
          date: string
          id: string
          name: string
        }
        Insert: {
          class_id: number
          class_name?: string
          created_at?: string
          date?: string
          id?: string
          name: string
        }
        Update: {
          class_id?: number
          class_name?: string
          created_at?: string
          date?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      mark_entries: {
        Row: {
          created_at: string
          exam_id: string
          id: string
          marks: number
          student_id: string
          subject_name: string
        }
        Insert: {
          created_at?: string
          exam_id: string
          id?: string
          marks?: number
          student_id: string
          subject_name: string
        }
        Update: {
          created_at?: string
          exam_id?: string
          id?: string
          marks?: number
          student_id?: string
          subject_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "mark_entries_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      notices: {
        Row: {
          content: string | null
          created_at: string
          date: string
          id: string
          pinned: boolean | null
          priority: string | null
          target: string | null
          title: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          date?: string
          id?: string
          pinned?: boolean | null
          priority?: string | null
          target?: string | null
          title: string
        }
        Update: {
          content?: string | null
          created_at?: string
          date?: string
          id?: string
          pinned?: boolean | null
          priority?: string | null
          target?: string | null
          title?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          fee_type: string | null
          id: string
          method: string | null
          month: string
          payment_date: string
          receipt_no: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          fee_type?: string | null
          id?: string
          method?: string | null
          month?: string
          payment_date?: string
          receipt_no?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          fee_type?: string | null
          id?: string
          method?: string | null
          month?: string
          payment_date?: string
          receipt_no?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      salary_advances: {
        Row: {
          advance_date: string
          amount: number
          created_at: string
          id: string
          note: string | null
          settled_amount: number
          settled_at: string | null
          settled_payment_id: string | null
          settlement_note: string | null
          staff_id: string
        }
        Insert: {
          advance_date: string
          amount?: number
          created_at?: string
          id?: string
          note?: string | null
          settled_amount?: number
          settled_at?: string | null
          settled_payment_id?: string | null
          settlement_note?: string | null
          staff_id: string
        }
        Update: {
          advance_date?: string
          amount?: number
          created_at?: string
          id?: string
          note?: string | null
          settled_amount?: number
          settled_at?: string | null
          settled_payment_id?: string | null
          settlement_note?: string | null
          staff_id?: string
        }
        Relationships: []
      }
      salary_payments: {
        Row: {
          absence_days: number
          absence_deduction: number
          advance_deduction: number
          amount: number
          base_salary: number
          created_at: string | null
          date: string
          id: string
          month: string
          net_payable: number
          payment_type: string
          staff_id: string
          total_days: number
          year: number
        }
        Insert: {
          absence_days?: number
          absence_deduction?: number
          advance_deduction?: number
          amount?: number
          base_salary?: number
          created_at?: string | null
          date: string
          id?: string
          month: string
          net_payable?: number
          payment_type?: string
          staff_id: string
          total_days?: number
          year: number
        }
        Update: {
          absence_days?: number
          absence_deduction?: number
          advance_deduction?: number
          amount?: number
          base_salary?: number
          created_at?: string | null
          date?: string
          id?: string
          month?: string
          net_payable?: number
          payment_type?: string
          staff_id?: string
          total_days?: number
          year?: number
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: []
      }
      staff: {
        Row: {
          contact: string | null
          created_at: string
          designation: string | null
          id: string
          join_date: string | null
          name: string
          nid_photo: string | null
          phone: string | null
          photo: string | null
          role: string | null
          salary: number
          staff_id: string
          status: string
          updated_at: string
        }
        Insert: {
          contact?: string | null
          created_at?: string
          designation?: string | null
          id?: string
          join_date?: string | null
          name: string
          nid_photo?: string | null
          phone?: string | null
          photo?: string | null
          role?: string | null
          salary?: number
          staff_id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          contact?: string | null
          created_at?: string
          designation?: string | null
          id?: string
          join_date?: string | null
          name?: string
          nid_photo?: string | null
          phone?: string | null
          photo?: string | null
          role?: string | null
          salary?: number
          staff_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      student_expenses: {
        Row: {
          amount: number
          created_at: string
          date: string | null
          description: string
          id: string
          student_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          date?: string | null
          description?: string
          id?: string
          student_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string | null
          description?: string
          id?: string
          student_id?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          address: string | null
          admission_date: string | null
          admission_fee: number
          birth_cert_photo: string | null
          blood_group: string | null
          class_id: number
          class_name: string
          contact: string | null
          created_at: string
          date_of_birth: string | null
          dob: string | null
          father_name: string | null
          father_nid_photo: string | null
          guardian_name: string | null
          guardian_phone: string | null
          id: string
          monthly_fee: number
          mother_nid_photo: string | null
          name: string
          photo_url: string | null
          roll: string | null
          section: string | null
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          admission_date?: string | null
          admission_fee?: number
          birth_cert_photo?: string | null
          blood_group?: string | null
          class_id?: number
          class_name?: string
          contact?: string | null
          created_at?: string
          date_of_birth?: string | null
          dob?: string | null
          father_name?: string | null
          father_nid_photo?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          monthly_fee?: number
          mother_nid_photo?: string | null
          name: string
          photo_url?: string | null
          roll?: string | null
          section?: string | null
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          admission_date?: string | null
          admission_fee?: number
          birth_cert_photo?: string | null
          blood_group?: string | null
          class_id?: number
          class_name?: string
          contact?: string | null
          created_at?: string
          date_of_birth?: string | null
          dob?: string | null
          father_name?: string | null
          father_nid_photo?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          monthly_fee?: number
          mother_nid_photo?: string | null
          name?: string
          photo_url?: string | null
          roll?: string | null
          section?: string | null
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      subjects: {
        Row: {
          created_at: string | null
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      teacher_attendance: {
        Row: {
          created_at: string
          date: string
          id: string
          staff_id: string
          status: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          staff_id: string
          status?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          staff_id?: string
          status?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          description: string | null
          id: string
          type: string
          updated_at: string
        }
        Insert: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          allowed_pages: string[] | null
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          allowed_pages?: string[] | null
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          allowed_pages?: string[] | null
          created_at?: string | null
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
    }
    Enums: {
      app_role: "super_admin" | "admin" | "member"
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
      app_role: ["super_admin", "admin", "member"],
    },
  },
} as const
