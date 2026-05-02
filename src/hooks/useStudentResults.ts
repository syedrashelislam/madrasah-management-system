import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ExamRow, ExamSubjectRow, MarkEntryRow } from "./useExams";
import type { StudentRow } from "./useStudents";
import { getStudentResult, type StudentResult } from "@/pages/exam/examUtils";

export interface StoredResultRow {
  id: string;
  exam_id: string;
  student_id: string;
  student_name: string;
  roll: string;
  class_id: number;
  class_name: string;
  exam_name: string;
  total_obtained: number;
  total_full: number;
  overall_percent: number;
  grade: string;
  gpa: string;
  passed: number; // 0 or 1
  subject_details: string; // JSON string
  calculated_at: string;
}

export function useStoredResults(examId?: string) {
  return useQuery({
    queryKey: ["student_results", examId],
    queryFn: async () => {
      if (!examId) return [];
      const { data, error } = await supabase
        .from("student_results")
        .select("*")
        .eq("exam_id", examId)
        .order("overall_percent", { ascending: false });
      if (error) throw error;
      return (data || []) as StoredResultRow[];
    },
    enabled: !!examId,
  });
}

export function useStoredResultsByStudent(studentId?: string) {
  return useQuery({
    queryKey: ["student_results_by_student", studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const { data, error } = await supabase
        .from("student_results")
        .select("*")
        .eq("student_id", studentId)
        .order("calculated_at", { ascending: false });
      if (error) throw error;
      return (data || []) as StoredResultRow[];
    },
    enabled: !!studentId,
  });
}

export function useStoredResultsByClass(classId?: number) {
  return useQuery({
    queryKey: ["student_results_by_class", classId],
    queryFn: async () => {
      if (!classId) return [];
      const { data, error } = await supabase
        .from("student_results")
        .select("*")
        .eq("class_id", classId)
        .order("overall_percent", { ascending: false });
      if (error) throw error;
      return (data || []) as StoredResultRow[];
    },
    enabled: !!classId,
  });
}

/** Calculate results from marks and save/upsert to student_results table */
export function useCalculateAndSaveResults() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      exam: ExamRow;
      examSubjects: ExamSubjectRow[];
      marks: MarkEntryRow[];
      students: StudentRow[];
    }) => {
      const { exam, examSubjects, marks, students } = params;
      const subs = examSubjects.filter(s => s.examId === exam.id);
      const studentIds = [...new Set(marks.filter(m => m.examId === exam.id).map(m => m.studentId))];

      if (studentIds.length === 0) throw new Error("কোনো নম্বর এন্ট্রি পাওয়া যায়নি");

      const rows: Omit<StoredResultRow, "id" | "calculated_at">[] = [];

      for (const sid of studentIds) {
        const result = getStudentResult(exam, examSubjects, marks, students, sid);
        if (!result) continue;

        const student = students.find(s => s.student_id === sid);
        rows.push({
          exam_id: exam.id,
          student_id: sid,
          student_name: result.studentName,
          roll: result.roll,
          class_id: exam.classId,
          class_name: exam.className,
          exam_name: exam.name,
          total_obtained: result.totalObtained,
          total_full: result.totalFull,
          overall_percent: Math.round(result.overallPercent * 100) / 100,
          grade: result.grade,
          gpa: result.gpa,
          passed: result.passed ? 1 : 0,
          subject_details: JSON.stringify(result.subjectResults),
        });
      }

      // Upsert in batches of 30
      for (let i = 0; i < rows.length; i += 30) {
        const batch = rows.slice(i, i + 30);
        const { error } = await supabase
          .from("student_results")
          .upsert(batch as any, { onConflict: "exam_id,student_id" });
        if (error) throw error;
      }

      return { count: rows.length };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student_results"] });
      qc.invalidateQueries({ queryKey: ["student_results_by_student"] });
      qc.invalidateQueries({ queryKey: ["student_results_by_class"] });
    },
  });
}
