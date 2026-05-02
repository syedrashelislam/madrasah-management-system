import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TransactionRow {
  id: string;
  type: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  created_at: string;
  updated_at: string;
}

export function useTransactions() {
  return useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .is('deleted_at', null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as TransactionRow[];
    },
  });
}

export function useAddTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tx: { type: string; category: string; description: string; amount: number; date: string }) => {
      const { error } = await supabase.from("transactions").insert([tx]);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; description?: string; category?: string; amount?: number; date?: string }) => {
      const { id, ...rest } = params;
      const { error } = await supabase
        .from("transactions")
        .update({ ...rest, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transactions").update({ deleted_at: new Date().toISOString() } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ['recycle-bin'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
