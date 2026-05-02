import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ClassRow {
  id: string;
  name: string;
  class_id: number;
  sort_order: number;
  created_at: string;
}

/* ─── localStorage helpers ─────────────────────── */
const LS_KEY = "madrasa_classes";

function lsGet(): ClassRow[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function lsSave(rows: ClassRow[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(rows));
}

function uuid(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/* ─── Fetch: Supabase first, localStorage fallback ─── */
async function fetchClasses(): Promise<ClassRow[]> {
  try {
    const { data, error } = await supabase
      .from("classes")
      .select("*")
      .is("deleted_at", null)
      .order("sort_order", { ascending: true });

    if (!error && data) {
      if (data.length > 0) {
        lsSave(data as ClassRow[]);
        return data as ClassRow[];
      }
      // Remote empty → show localStorage data
      const local = lsGet();
      return local;
    }
  } catch (_) { /* Supabase unreachable */ }

  return lsGet();
}

/* ─── Hooks ─────────────────────────────────────── */
export function useClasses() {
  return useQuery<ClassRow[]>({
    queryKey: ["classes"],
    queryFn: fetchClasses,
    staleTime: 30_000,
    retry: 0,
  });
}

export function useAddClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cls: { name: string; class_id: number; sort_order: number }) => {
      const newRow: ClassRow = {
        id: uuid(),
        created_at: new Date().toISOString(),
        ...cls,
      };
      // Save locally first (instant, always works)
      lsSave([...lsGet(), newRow]);
      // Non-blocking Supabase sync
      try { await supabase.from("classes").insert([cls]); } catch (_) {}
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["classes"] }),
  });
}

export function useUpdateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      lsSave(lsGet().map(r => r.id === id ? { ...r, name } : r));
      try { await supabase.from("classes").update({ name }).eq("id", id); } catch (_) {}
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["classes"] }),
  });
}

export function useDeleteClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      lsSave(lsGet().filter(r => r.id !== id));
      try {
        await supabase.from("classes").update({ deleted_at: new Date().toISOString() } as any).eq("id", id);
      } catch (_) {}
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["classes"] });
      qc.invalidateQueries({ queryKey: ["recycle-bin"] });
    },
  });
}
