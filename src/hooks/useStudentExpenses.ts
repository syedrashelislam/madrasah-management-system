import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type StudentExpenseRow = {
  id: string;
  studentId: string;
  description: string;
  amount: number;
  date: string;
  createdAt: string;
};

export function useStudentExpenses() {
  return useQuery({
    queryKey: ["student_expenses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_expenses")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data || []) as any[]).map((row) => ({
        id: row.id,
        studentId: row.student_id,
        description: row.description,
        amount: row.amount,
        date: row.date,
        createdAt: row.created_at,
      })) as StudentExpenseRow[];
    },
  });
}

export function useAddStudentExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (expense: { studentId: string; description: string; amount: number; date: string }) => {
      const { error } = await supabase.from("student_expenses").insert([{
        student_id: expense.studentId,
        description: expense.description,
        amount: expense.amount,
        date: expense.date,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student_expenses"] });
      toast.success("খরচ যোগ হয়েছে");
    },
    onError: (e: any) => toast.error(e.message),
  });
}
