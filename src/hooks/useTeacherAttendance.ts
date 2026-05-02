import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type TeacherAttendanceRow = {
  id: string;
  staffId: string;
  date: string;
  status: string;
  createdAt: string;
};

export function useTeacherAttendance() {
  return useQuery({
    queryKey: ["teacher_attendance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teacher_attendance")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;
      return ((data || []) as any[]).map((row) => ({
        id: row.id,
        staffId: row.staff_id,
        date: row.date,
        status: row.status,
        createdAt: row.created_at,
      })) as TeacherAttendanceRow[];
    },
  });
}

export function useUpsertTeacherAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (records: { staffId: string; date: string; status: string }[]) => {
      const rows = records.map((r) => ({
        staff_id: r.staffId,
        date: r.date,
        status: r.status,
      }));
      const { error } = await supabase
        .from("teacher_attendance")
        .upsert(rows, { onConflict: "staff_id,date" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teacher_attendance"] }),
    onError: (e: any) => toast.error(e.message),
  });
}
