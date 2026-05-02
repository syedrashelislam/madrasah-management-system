import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface FeeStructureRow {
  id: string;
  classId: number;
  className: string;
  monthlyFee: number;
  admissionFee: number;
  examFee: number;
  otherFee: number;
  otherFeeLabel: string;
  createdAt: string;
  updatedAt: string;
}

export function useFeeStructures() {
  return useQuery({
    queryKey: ["fee_structures"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fee_structures")
        .select("*")
        .order("class_id", { ascending: true });
      if (error) throw error;
      return ((data || []) as any[]).map((row) => ({
        id: row.id,
        classId: row.class_id,
        className: row.class_name,
        monthlyFee: row.monthly_fee,
        admissionFee: row.admission_fee,
        examFee: row.exam_fee,
        otherFee: row.other_fee,
        otherFeeLabel: row.other_fee_label,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })) as FeeStructureRow[];
    },
  });
}

export function useAddFeeStructure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (fs: {
      classId: number;
      className: string;
      monthlyFee: number;
      admissionFee: number;
      examFee: number;
      otherFee: number;
      otherFeeLabel: string;
    }) => {
      const { error } = await supabase.from("fee_structures").insert([{
        class_id: fs.classId,
        class_name: fs.className,
        monthly_fee: fs.monthlyFee,
        admission_fee: fs.admissionFee,
        exam_fee: fs.examFee,
        other_fee: fs.otherFee,
        other_fee_label: fs.otherFeeLabel,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fee_structures"] });
      toast.success("ফি কাঠামো যোগ হয়েছে");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateFeeStructure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string } & Partial<FeeStructureRow>) => {
      const { id, ...rest } = params;
      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (rest.monthlyFee !== undefined) updateData.monthly_fee = rest.monthlyFee;
      if (rest.admissionFee !== undefined) updateData.admission_fee = rest.admissionFee;
      if (rest.examFee !== undefined) updateData.exam_fee = rest.examFee;
      if (rest.otherFee !== undefined) updateData.other_fee = rest.otherFee;
      if (rest.otherFeeLabel !== undefined) updateData.other_fee_label = rest.otherFeeLabel;
      const { error } = await supabase.from("fee_structures").update(updateData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fee_structures"] });
      toast.success("ফি কাঠামো আপডেট হয়েছে");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteFeeStructure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fee_structures").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fee_structures"] });
      toast.success("ফি কাঠামো মুছে ফেলা হয়েছে");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
