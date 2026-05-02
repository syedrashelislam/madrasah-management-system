import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showToast } from "@/lib/showToast";

export interface PaymentRow {
  id: string;
  student_id: string;
  receipt_no: string;
  fee_type: string;
  amount: number;
  payment_date: string;
  month: string;
  method: string;
  created_at: string;
  updated_at: string;
}

export function usePayments() {
  return useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .is('deleted_at', null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as PaymentRow[];
    },
  });
}

export function useAddPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payment: Omit<PaymentRow, "id" | "created_at" | "updated_at">) => {
      const { error } = await supabase.from("payments").insert([payment]);
      if (error) throw error;

      // Also create a transaction record for finance/cashbook
      const category =
        payment.fee_type === "Monthly" ? "মাসিক ফি"
        : payment.fee_type === "Admission" || payment.month === "ভর্তি ফি" ? "ভর্তি ফি"
        : "অন্যান্য আয়";
      const description = `${payment.student_id} - ${payment.month} (${payment.method})`;
      await supabase.from("transactions").insert([{
        type: "income",
        category,
        description,
        amount: payment.amount,
        date: payment.payment_date,
      }]);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
    },
    onError: (e: Error) => showToast.error(e.message),
  });
}

export function useUpdatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; month?: string; amount?: number; payment_date?: string }) => {
      const { id, ...rest } = params;
      const { error } = await supabase
        .from("payments")
        .update({ ...rest, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payments"] }),
    onError: (e: Error) => showToast.error(e.message),
  });
}

export function useDeletePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payments").update({ deleted_at: new Date().toISOString() } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ['recycle-bin'] });
    },
    onError: (e: Error) => showToast.error(e.message),
  });
}