import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showToast } from "@/lib/showToast";

export interface StaffRow {
  id: string;
  staff_id: string;
  name: string;
  designation: string;
  role: string;
  contact: string;
  phone: string;
  salary: number;
  status: string;
  join_date: string;
  nid_photo: string;
  photo: string;
  created_at: string;
  updated_at: string;
  contract_type: string;
  contract_start: string;
  contract_end: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relation: string;
  qualifications: string;
  address: string;
  blood_group: string;
}

export function useStaff() {
  return useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff")
        .select("*")
        .is('deleted_at', null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as StaffRow[];
    },
  });
}

export function useAddStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (staff: Omit<StaffRow, "id" | "created_at" | "updated_at">) => {
      const { error } = await supabase.from("staff").insert([staff]);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }),
    onError: (e: Error) => showToast.error(e.message),
  });
}

export function useUpdateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { staff_id: string } & Partial<StaffRow>) => {
      const { staff_id, id: _id, created_at: _c, updated_at: _u, ...rest } = params;
      const { error } = await supabase
        .from("staff")
        .update({ ...rest, updated_at: new Date().toISOString() })
        .eq("staff_id", staff_id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }),
    onError: (e: Error) => showToast.error(e.message),
  });
}

export function useDeleteStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (staff_id: string) => {
      const { error } = await supabase
        .from("staff")
        .update({ deleted_at: new Date().toISOString() } as any)
        .eq("staff_id", staff_id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff"] });
      qc.invalidateQueries({ queryKey: ['recycle-bin'] });
    },
    onError: (e: Error) => showToast.error(e.message),
  });
}