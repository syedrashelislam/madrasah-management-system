import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type SalaryPaymentRow = {
  id: string;
  staffId: string;
  month: string;
  year: number;
  amount: number;
  date: string;
  absenceDays: number;
  absenceDeduction: number;
  advanceDeduction: number;
  baseSalary: number;
  netPayable: number;
  totalDays: number;
  paymentType: string;
  createdAt: string;
};

function mapRow(row: any): SalaryPaymentRow {
  return {
    id: row.id,
    staffId: row.staff_id,
    month: row.month,
    year: row.year,
    amount: Number(row.amount) || 0,
    date: row.date,
    absenceDays: Number(row.absence_days) || 0,
    absenceDeduction: Number(row.absence_deduction) || 0,
    advanceDeduction: Number(row.advance_deduction) || 0,
    baseSalary: Number(row.base_salary) || 0,
    netPayable: Number(row.net_payable) || 0,
    totalDays: Number(row.total_days) || 30,
    paymentType: row.payment_type || "salary",
    createdAt: row.created_at,
  };
}

export function useSalaryPayments() {
  return useQuery({
    queryKey: ["salary_payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("salary_payments")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        console.error("salary_payments fetch error:", error);
        throw error;
      }
      return (data || []).map(mapRow);
    },
    // Refetch more aggressively to keep data fresh
    staleTime: 0,
    refetchOnMount: true,
  });
}

/** Check if salary already paid for given staff/month/year */
export async function checkSalaryAlreadyPaid(
  staffId: string,
  month: string,
  year: number
): Promise<boolean> {
  const { data, error } = await supabase
    .from("salary_payments")
    .select("id")
    .eq("staff_id", staffId)
    .eq("month", month)
    .eq("year", year)
    .eq("payment_type", "salary")
    .limit(1);
  if (error) {
    console.error("checkSalaryAlreadyPaid error:", error);
    return false;
  }
  return (data?.length || 0) > 0;
}

export function useAddSalaryPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payment: {
      staffId: string;
      month: string;
      year: number;
      amount: number;
      date: string;
      absenceDays: number;
      absenceDeduction: number;
      advanceDeduction: number;
      baseSalary: number;
      netPayable: number;
      totalDays: number;
      paymentType?: string;
    }) => {
      // Pre-check for duplicate
      const alreadyPaid = await checkSalaryAlreadyPaid(
        payment.staffId,
        payment.month,
        payment.year
      );
      if (alreadyPaid) {
        throw new Error("এই মাসের বেতন ইতিমধ্যে প্রদান করা হয়েছে");
      }

      const row = {
        staff_id: payment.staffId,
        month: payment.month,
        year: payment.year,
        amount: payment.amount,
        date: payment.date,
        absence_days: payment.absenceDays,
        absence_deduction: payment.absenceDeduction,
        advance_deduction: payment.advanceDeduction,
        base_salary: payment.baseSalary,
        net_payable: payment.netPayable,
        total_days: payment.totalDays,
        payment_type: payment.paymentType || "salary",
      };
      const { data, error } = await supabase
        .from("salary_payments")
        .insert([row])
        .select()
        .single();

      if (error) {
        console.error("salary_payments insert error:", error);
        // Handle unique constraint violation
        if (error.code === "23505") {
          throw new Error("এই মাসের বেতন ইতিমধ্যে প্রদান করা হয়েছে");
        }
        throw error;
      }
      if (!data) throw new Error("বেতন ডাটা সেভ হয়নি — খালি রেসপন্স");
      return mapRow(data);
    },
    onSuccess: async () => {
      // Immediately invalidate and wait for refetch to complete
      await qc.invalidateQueries({ queryKey: ["salary_payments"] });
      // Also refetch to ensure fresh data
      await qc.refetchQueries({ queryKey: ["salary_payments"] });
    },
    onError: (e: any) => {
      console.error("Salary payment mutation error:", e);
      toast.error("বেতন সেভ করতে সমস্যা: " + (e?.message || "অজানা ত্রুটি"));
    },
  });
}
