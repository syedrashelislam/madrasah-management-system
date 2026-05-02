import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SubjectRow {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

/* ─── localStorage helpers ─────────────────────── */
const LS_KEY = "madrasa_subjects";

function lsGet(): SubjectRow[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function lsSave(rows: SubjectRow[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(rows));
}

function uuid(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/* ─── Fetch: Supabase first, localStorage fallback ─── */
async function fetchSubjects(): Promise<SubjectRow[]> {
  try {
    const { data, error } = await supabase
      .from("subjects")
      .select("*")
      .is("deleted_at", null)
      .order("sort_order", { ascending: true });

    if (!error && data) {
      if (data.length > 0) {
        lsSave(data as SubjectRow[]);
        return data as SubjectRow[];
      }
      return lsGet();
    }
  } catch (_) {}

  return lsGet();
}

/* ─── Hooks ─────────────────────────────────────── */
export function useSubjects() {
  return useQuery<SubjectRow[]>({
    queryKey: ["subjects"],
    queryFn: fetchSubjects,
    staleTime: 30_000,
    retry: 0,
  });
}

export function useAddSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sub: { name: string; sort_order: number }) => {
      const newRow: SubjectRow = {
        id: uuid(),
        created_at: new Date().toISOString(),
        ...sub,
      };
      lsSave([...lsGet(), newRow]);
      try { await supabase.from("subjects").insert([sub]); } catch (_) {}
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subjects"] }),
  });
}

export function useUpdateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      lsSave(lsGet().map(r => r.id === id ? { ...r, name } : r));
      try { await supabase.from("subjects").update({ name }).eq("id", id); } catch (_) {}
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subjects"] }),
  });
}

export function useDeleteSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      lsSave(lsGet().filter(r => r.id !== id));
      try {
        await supabase.from("subjects").update({ deleted_at: new Date().toISOString() } as any).eq("id", id);
      } catch (_) {}
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subjects"] });
      qc.invalidateQueries({ queryKey: ["recycle-bin"] });
    },
  });
}
