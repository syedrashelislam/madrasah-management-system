import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showToast } from "@/lib/showToast";

export type AttendanceRow = {
  id: string;
  studentId: string;
  date: string;
  status: string;
  createdAt: string;
};

export function useAttendance() {
  return useQuery({
    queryKey: ["attendance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      // Map snake_case DB columns to camelCase for compatibility
      return ((data || []) as any[]).map((row) => ({
        id: row.id,
        studentId: row.student_id,
        date: row.date,
        status: row.status,
        createdAt: row.created_at,
      })) as AttendanceRow[];
    },
  });
}

export function useUpsertAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (records: { studentId: string; date: string; status: string }[]) => {
      const rows = records.map((r) => ({
        student_id: r.studentId,
        date: r.date,
        status: r.status,
      }));
      const { error } = await supabase
        .from("attendance")
        .upsert(rows, { onConflict: "student_id,date" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attendance"] }),
    onError: (e: any) => showToast.error(e.message),
  });
}
