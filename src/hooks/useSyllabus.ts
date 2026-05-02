import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SyllabusRow {
  id: string;
  class_id: number;
  class_name: string;
  subject_name: string;
  chapter_no: number;
  chapter_title: string;
  topics: string;
  status: "pending" | "in_progress" | "completed";
  notes: string;
  created_at: string;
  updated_at: string;
}

export function useSyllabus(classId?: number, subjectName?: string) {
  return useQuery({
    queryKey: ["syllabi", classId, subjectName],
    queryFn: async () => {
      let query = supabase
        .from("syllabi")
        .select("*")
        .is("deleted_at", null)
        .order("chapter_no", { ascending: true });

      if (classId) query = query.eq("class_id", classId);
      if (subjectName) query = query.eq("subject_name", subjectName);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as SyllabusRow[];
    },
    enabled: !!classId,
  });
}

export function useAddSyllabus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: Omit<SyllabusRow, "id" | "created_at" | "updated_at">) => {
      const { error } = await supabase.from("syllabi").insert([row]);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["syllabi"] }),
  });
}

export function useUpdateSyllabus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SyllabusRow> & { id: string }) => {
      const { error } = await supabase
        .from("syllabi")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["syllabi"] }),
  });
}

export function useDeleteSyllabus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("syllabi")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["syllabi"] }),
  });
}
