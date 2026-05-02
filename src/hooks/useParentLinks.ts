import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ParentLinkRow {
  id: string;
  userId: string;
  studentId: string;
  status: string;
  createdAt: string;
}

export function useParentLinks(userId?: string | null) {
  return useQuery({
    queryKey: ["parent_links", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parent_links")
        .select("*")
        .eq("user_id", userId!);
      if (error) throw error;
      return ((data || []) as any[]).map((row) => ({
        id: row.id,
        userId: row.user_id,
        studentId: row.student_id,
        status: row.status,
        createdAt: row.created_at,
      })) as ParentLinkRow[];
    },
  });
}

export function useAddParentLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { userId: string; studentId: string }) => {
      const { data: existing } = await supabase
        .from("parent_links")
        .select("id")
        .eq("user_id", params.userId)
        .eq("student_id", params.studentId)
        .limit(1);
      if (existing && existing.length > 0) {
        throw new Error("এই সন্তান ইতিমধ্যে যুক্ত আছে");
      }
      const { error } = await supabase.from("parent_links").insert([{
        user_id: params.userId,
        student_id: params.studentId,
        status: "active",
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["parent_links"] });
      toast.success("সন্তান যুক্ত হয়েছে");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRemoveParentLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("parent_links").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["parent_links"] });
      toast.success("সন্তান সরানো হয়েছে");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
