import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface FeeGroupRow {
  id: string;
  name: string;
  description: string;
  monthlyFee: number;
  admissionFee: number;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export function useFeeGroups() {
  return useQuery({
    queryKey: ["fee_groups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fee_groups")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return ((data || []) as any[]).map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        monthlyFee: row.monthly_fee,
        admissionFee: row.admission_fee,
        color: row.color,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })) as FeeGroupRow[];
    },
  });
}

export function useAddFeeGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { name: string; description: string; monthlyFee: number; admissionFee: number; color?: string }) => {
      const { error } = await supabase.from("fee_groups").insert([{
        name: params.name,
        description: params.description,
        monthly_fee: params.monthlyFee,
        admission_fee: params.admissionFee,
        color: params.color || "#d4af37",
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fee_groups"] });
      toast.success("ফি গ্রুপ যোগ হয়েছে");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateFeeGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; monthlyFee?: number; admissionFee?: number; name?: string; description?: string }) => {
      const { id, ...rest } = params;
      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (rest.monthlyFee !== undefined) updateData.monthly_fee = rest.monthlyFee;
      if (rest.admissionFee !== undefined) updateData.admission_fee = rest.admissionFee;
      if (rest.name !== undefined) updateData.name = rest.name;
      if (rest.description !== undefined) updateData.description = rest.description;
      const { error } = await supabase.from("fee_groups").update(updateData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fee_groups"] });
      toast.success("ফি গ্রুপ আপডেট হয়েছে");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteFeeGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fee_groups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fee_groups"] });
      toast.success("ফি গ্রুপ মুছে ফেলা হয়েছে");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
