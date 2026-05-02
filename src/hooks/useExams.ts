import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ExamRow {
  id: string;
  name: string;
  classId: number;
  className: string;
  date: string;
  createdAt: string;
}

export interface ExamSubjectRow {
  id: string;
  examId: string;
  name: string;
  fullMarks: number;
  passMarks: number;
}

export interface MarkEntryRow {
  id: string;
  examId: string;
  studentId: string;
  subjectName: string;
  marks: number;
  createdAt: string;
}

export function useExams() {
  return useQuery({
    queryKey: ["exams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exams")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data || []) as any[]).map((row) => ({
        id: row.id,
        name: row.name,
        classId: row.class_id,
        className: row.class_name,
        date: row.date,
        createdAt: row.created_at,
      })) as ExamRow[];
    },
  });
}

export function useAllExamSubjects() {
  return useQuery({
    queryKey: ["exam_subjects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("exam_subjects").select("*");
      if (error) throw error;
      return ((data || []) as any[]).map((row) => ({
        id: row.id,
        examId: row.exam_id,
        name: row.name,
        fullMarks: row.full_marks,
        passMarks: row.pass_marks,
      })) as ExamSubjectRow[];
    },
  });
}

export function useMarkEntries(examId: string) {
  return useQuery({
    queryKey: ["mark_entries", examId],
    queryFn: async () => {
      if (!examId) return [];
      const { data, error } = await supabase
        .from("mark_entries")
        .select("*")
        .eq("exam_id", examId);
      if (error) throw error;
      return ((data || []) as any[]).map((row) => ({
        id: row.id,
        examId: row.exam_id,
        studentId: row.student_id,
        subjectName: row.subject_name,
        marks: row.marks,
        createdAt: row.created_at,
      })) as MarkEntryRow[];
    },
    enabled: !!examId,
  });
}

/** Fetch all mark entries for a specific student across all exams */
export function useStudentMarkEntries(studentId?: string) {
  return useQuery({
    queryKey: ["mark_entries_student", studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const { data, error } = await supabase
        .from("mark_entries")
        .select("*")
        .eq("student_id", studentId);
      if (error) throw error;
      return ((data || []) as any[]).map((row) => ({
        id: row.id,
        examId: row.exam_id,
        studentId: row.student_id,
        subjectName: row.subject_name,
        marks: row.marks,
        createdAt: row.created_at,
      })) as MarkEntryRow[];
    },
    enabled: !!studentId,
  });
}

export function useCreateExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      name: string;
      classId: number;
      className: string;
      date: string;
      subjects: { name: string; fullMarks: number; passMarks: number }[];
    }) => {
      const { subjects, ...examData } = params;
      const { data: exam, error: examErr } = await supabase
        .from("exams")
        .insert([{ name: examData.name, class_id: examData.classId, class_name: examData.className, date: examData.date }])
        .select()
        .single();
      if (examErr) throw examErr;
      if (subjects.length > 0) {
        const subRows = subjects.map((s) => ({
          exam_id: exam.id,
          name: s.name,
          full_marks: s.fullMarks,
          pass_marks: s.passMarks,
        }));
        const { error: subErr } = await supabase.from("exam_subjects").insert(subRows);
        if (subErr) throw subErr;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exams"] });
      qc.invalidateQueries({ queryKey: ["exam_subjects"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exams").update({ deleted_at: new Date().toISOString() } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exams"] });
      qc.invalidateQueries({ queryKey: ["exam_subjects"] });
      qc.invalidateQueries({ queryKey: ["mark_entries"] });
      qc.invalidateQueries({ queryKey: ["recycle-bin"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useSaveMarks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entries: { examId: string; studentId: string; subjectName: string; marks: number }[]) => {
      const rows = entries.map((e) => ({
        exam_id: e.examId,
        student_id: e.studentId,
        subject_name: e.subjectName,
        marks: e.marks,
      }));

      // Delete existing entries for these exam+student+subject combos, then insert fresh
      // Group by exam_id for efficient deletion
      const examIds = [...new Set(rows.map(r => r.exam_id))];
      const studentIds = [...new Set(rows.map(r => r.student_id))];

      for (const examId of examIds) {
        const { error: delError } = await supabase
          .from("mark_entries")
          .delete()
          .eq("exam_id", examId)
          .in("student_id", studentIds);
        if (delError) throw delError;
      }

      // Insert in batches of 50
      for (let i = 0; i < rows.length; i += 50) {
        const batch = rows.slice(i, i + 50);
        const { error } = await supabase
          .from("mark_entries")
          .insert(batch);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mark_entries"] }),
    onError: (e: any) => toast.error(e.message),
  });
}
