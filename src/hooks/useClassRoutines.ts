import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ClassRoutineRow {
  id: string;
  class_id: number;
  class_name: string;
  day: string;
  period: number;
  start_time: string;
  end_time: string;
  subject_name: string;
  teacher_name: string;
  room: string;
  created_at: string;
  updated_at: string;
}

export const DAYS_BENGALI = [
  "শনিবার", "রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার",
] as const;

export const DEFAULT_PERIODS = [
  { period: 1, start: "08:00", end: "08:45" },
  { period: 2, start: "08:45", end: "09:30" },
  { period: 3, start: "09:30", end: "10:15" },
  { period: 4, start: "10:30", end: "11:15" },
  { period: 5, start: "11:15", end: "12:00" },
  { period: 6, start: "12:00", end: "12:45" },
  { period: 7, start: "02:00", end: "02:45" },
  { period: 8, start: "02:45", end: "03:30" },
];

export function useClassRoutines(classId?: number) {
  return useQuery({
    queryKey: ["class_routines", classId],
    queryFn: async () => {
      let q = supabase
        .from("class_routines")
        .select("*")
        .order("period", { ascending: true });
      if (classId) q = q.eq("class_id", classId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as ClassRoutineRow[];
    },
    enabled: classId !== undefined,
  });
}

export function useAddClassRoutine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (slot: Omit<ClassRoutineRow, "id" | "created_at" | "updated_at">) => {
      const { error } = await supabase.from("class_routines").insert([slot]);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["class_routines"] }),
  });
}

export function useUpdateClassRoutine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ClassRoutineRow> & { id: string }) => {
      const { error } = await supabase
        .from("class_routines")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["class_routines"] }),
  });
}

export function useDeleteClassRoutine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("class_routines").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["class_routines"] }),
  });
}

export function useBulkAddClassRoutines() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (slots: Omit<ClassRoutineRow, "id" | "created_at" | "updated_at">[]) => {
      const { error } = await supabase.from("class_routines").insert(slots);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["class_routines"] }),
  });
}
