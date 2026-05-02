import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showToast } from "@/lib/showToast";

export interface StudentRow {
  id: string;
  student_id: string;
  name: string;
  father_name: string;
  class_id: number;
  class_name: string;
  section: string;
  roll: string;
  contact: string;
  address: string;
  dob: string;
  photo_url: string;
  monthly_fee: number;
  admission_fee: number;
  status: string;
  created_at: string;
  updated_at: string;
  guardian_name: string;
  guardian_phone: string;
  admission_date: string;
  date_of_birth: string | null;
  blood_group: string;
  mother_nid_photo: string;
  father_nid_photo: string;
  birth_cert_photo: string;
  mother_name: string;
  religion: string;
  previous_institution: string;
  emergency_contact: string;
  birth_reg_no: string;
  medical_notes: string;
  guardian_whatsapp: string;
  guardian_email: string;
  admission_no: string;
  admission_status: string;
}

export function useStudents() {
  return useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .is('deleted_at', null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as StudentRow[];
    },
  });
}

export function useStudent(studentId?: string) {
  return useQuery({
    queryKey: ["students", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      // Try by student_id first
      const { data: byStudentId } = await supabase
        .from("students")
        .select("*")
        .eq("student_id", studentId!)
        .limit(1);
      if (byStudentId && byStudentId.length > 0) return byStudentId[0] as StudentRow;

      // Try by primary id
      const { data: byId } = await supabase
        .from("students")
        .select("*")
        .eq("id", studentId!)
        .limit(1);
      if (!byId || byId.length === 0) return null;
      return byId[0] as StudentRow;
    },
  });
}

export function useAddStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (student: Omit<StudentRow, "id" | "created_at" | "updated_at">) => {
      const { error } = await supabase.from("students").insert([student]);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      showToast.added('ছাত্র', { description: 'ভর্তি সম্পন্ন হয়েছে' });
    },
    onError: (e: Error) => showToast.error(e.message),
  });
}

export function useUpdateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { student_id: string } & Partial<StudentRow>) => {
      const { student_id, id: _id, created_at: _c, updated_at: _u, ...rest } = params;
      const { error } = await supabase
        .from("students")
        .update({ ...rest, updated_at: new Date().toISOString() })
        .eq("student_id", student_id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      showToast.updated('ছাত্রের তথ্য');
    },
    onError: (e: Error) => showToast.error(e.message),
  });
}

export function useDeleteStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (student_id: string) => {
      const { error } = await supabase
        .from("students")
        .update({ deleted_at: new Date().toISOString() } as any)
        .eq("student_id", student_id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ['recycle-bin'] });
      showToast.deleted('ছাত্র');
    },
    onError: (e: Error) => showToast.error(e.message),
  });
}

// ─────────────────────────────────────────────────────────────
// useHardDeleteStudent — ছাত্র ও তার সকল ডেটা চিরতরে মুছে ফেলে
// মুছে যাবে: payments, attendance, mark_entries, book_issues,
//             student_expenses, parent_links, এবং students রেকর্ড
// ─────────────────────────────────────────────────────────────
export function useHardDeleteStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (student_id: string) => {
      // ধাপ ১: student UUID বের করো (foreign key এর জন্য)
      const { data: studentRow, error: fetchErr } = await supabase
        .from("students")
        .select("id")
        .eq("student_id", student_id)
        .single();
      if (fetchErr || !studentRow) throw new Error("ছাত্র খুঁজে পাওয়া যায়নি");
      const uuid = studentRow.id;

      // ধাপ ২: সব সম্পর্কিত ডেটা ডিলিট করো (student_id TEXT দিয়ে)
      const textTables = [
        "payments",
        "attendance",
        "mark_entries",
        "book_issues",
        "student_expenses",
        "parent_links",
      ] as const;

      for (const table of textTables) {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq("student_id", student_id);
        if (error) throw new Error(`${table} ডিলিট ব্যর্থ: ${error.message}`);
      }

      // ধাপ ৩: biometric punch logs (যদি থাকে)
      await supabase
        .from("biometric_punch_logs" as any)
        .delete()
        .eq("student_id", uuid);

      // ধাপ ৪: সবশেষে students রেকর্ড ডিলিট করো
      const { error: delErr } = await supabase
        .from("students")
        .delete()
        .eq("student_id", student_id);
      if (delErr) throw new Error(`ছাত্র ডিলিট ব্যর্থ: ${delErr.message}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["attendance"] });
      qc.invalidateQueries({ queryKey: ["mark_entries"] });
      qc.invalidateQueries({ queryKey: ["book_issues"] });
      qc.invalidateQueries({ queryKey: ["student_expenses"] });
      qc.invalidateQueries({ queryKey: ["parent_links"] });
      qc.invalidateQueries({ queryKey: ["recycle-bin"] });
      showToast.deleted('ছাত্র ও সকল ডেটা স্থায়ীভাবে');
    },
    onError: (e: Error) => showToast.error(e.message),
  });
}
