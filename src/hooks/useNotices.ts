import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type NoticeRow = {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: string;
  pinned: number | string;
  target: string;
  createdAt: string;
};

export function useNotices() {
  return useQuery({
    queryKey: ["notices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notices")
        .select("*")
        .is('deleted_at', null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = ((data || []) as any[]).map((row) => ({
        id: row.id,
        title: row.title,
        content: row.content,
        date: row.date,
        priority: row.priority,
        pinned: row.pinned,
        target: row.target,
        createdAt: row.created_at,
      })) as NoticeRow[];
      return rows.sort((a, b) => (Number(b.pinned) || 0) - (Number(a.pinned) || 0));
    },
  });
}

export function useAddNotice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (notice: Omit<NoticeRow, "id" | "createdAt">) => {
      const { error } = await supabase.from("notices").insert([{
        title: notice.title,
        content: notice.content,
        date: notice.date,
        priority: notice.priority,
        pinned: Number(notice.pinned) || 0,
        target: notice.target,
      }]);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notices"] }),
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateNotice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string } & Partial<NoticeRow>) => {
      const { id, createdAt: _c, ...rest } = params;
      const updateData: Record<string, unknown> = {};
      if (rest.title !== undefined) updateData.title = rest.title;
      if (rest.content !== undefined) updateData.content = rest.content;
      if (rest.date !== undefined) updateData.date = rest.date;
      if (rest.priority !== undefined) updateData.priority = rest.priority;
      if (rest.pinned !== undefined) updateData.pinned = Number(rest.pinned) || 0;
      if (rest.target !== undefined) updateData.target = rest.target;
      const { error } = await supabase.from("notices").update(updateData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notices"] }),
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteNotice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notices").update({ deleted_at: new Date().toISOString() } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notices"] });
      qc.invalidateQueries({ queryKey: ['recycle-bin'] });
    },
    onError: (e: any) => toast.error(e.message),
  });
}
