import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type SalaryAdvanceRow = {
  id: string;
  staffId: string;
  amount: number;
  advanceDate: string;
  note: string;
  settledAmount: number;
  settledAt: string;
  settledPaymentId: string;
  settlementNote: string;
  createdAt: string;
};

export function useSalaryAdvances() {
  return useQuery({
    queryKey: ["salary_advances"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("salary_advances")
        .select("*")
        .order("advance_date", { ascending: false });
      if (error) throw error;
      return ((data || []) as any[]).map((row) => ({
        id: row.id,
        staffId: row.staff_id,
        amount: row.amount,
        advanceDate: row.advance_date,
        note: row.note,
        settledAmount: row.settled_amount,
        settledAt: row.settled_at,
        settledPaymentId: row.settled_payment_id,
        settlementNote: row.settlement_note,
        createdAt: row.created_at,
      })) as SalaryAdvanceRow[];
    },
  });
}

export function useAddSalaryAdvance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (advance: { staffId: string; amount: number; advanceDate: string; note?: string }) => {
      const { error } = await supabase.from("salary_advances").insert([{
        staff_id: advance.staffId,
        amount: advance.amount,
        advance_date: advance.advanceDate,
        note: advance.note || "",
      }]);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["salary_advances"] }),
    onError: (e: any) => toast.error(e.message),
  });
}

export function useSettleSalaryAdvances() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (settlements: Array<{
      id: string;
      settledAmount: number;
      settlementNote: string;
      settledPaymentId: string;
    }>) => {
      for (const s of settlements) {
        const { error } = await supabase
          .from("salary_advances")
          .update({
            settled_amount: s.settledAmount,
            settled_payment_id: s.settledPaymentId,
            settlement_note: s.settlementNote,
            settled_at: new Date().toISOString(),
          })
          .eq("id", s.id);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["salary_advances"] }),
    onError: (e: any) => toast.error(e.message),
  });
}
