import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ExamRoutineRow {
  id: string;
  exam_name: string;
  class_id: number;
  class_name: string;
  subject_name: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  room: string;
  full_marks: number;
  note: string;
  created_at: string;
  updated_at: string;
}

export function useExamRoutines(classId?: number, examName?: string) {
  return useQuery({
    queryKey: ["exam_routines", classId, examName],
    queryFn: async () => {
      let q = supabase
        .from("exam_routines")
        .select("*")
        .order("exam_date", { ascending: true })
        .order("start_time", { ascending: true });
      if (classId) q = q.eq("class_id", classId);
      if (examName) q = q.eq("exam_name", examName);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as ExamRoutineRow[];
    },
    enabled: classId !== undefined,
  });
}

export function useExamNames() {
  return useQuery({
    queryKey: ["exam_routine_names"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_routines")
        .select("exam_name")
        .order("exam_name");
      if (error) throw error;
      const names = [...new Set((data || []).map((r: any) => r.exam_name))];
      return names as string[];
    },
  });
}

export function useAddExamRoutine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: Omit<ExamRoutineRow, "id" | "created_at" | "updated_at">) => {
      const { error } = await supabase.from("exam_routines").insert([row]);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exam_routines"] });
      qc.invalidateQueries({ queryKey: ["exam_routine_names"] });
    },
  });
}

export function useUpdateExamRoutine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ExamRoutineRow> & { id: string }) => {
      const { error } = await supabase
        .from("exam_routines")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exam_routines"] });
      qc.invalidateQueries({ queryKey: ["exam_routine_names"] });
    },
  });
}

export function useDeleteExamRoutine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exam_routines").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exam_routines"] });
      qc.invalidateQueries({ queryKey: ["exam_routine_names"] });
    },
  });
}
