import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type LeaveRequestRow = {
  id: string;
  staffId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: string;
  approvedBy: string;
  approvedAt: string;
  rejectionNote: string;
  createdAt: string;
};

export function useLeaveRequests() {
  return useQuery({
    queryKey: ["leave_requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leave_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data || []) as any[]).map((row) => ({
        id: row.id,
        staffId: row.staff_id,
        leaveType: row.leave_type,
        startDate: row.start_date,
        endDate: row.end_date,
        days: row.days,
        reason: row.reason,
        status: row.status,
        approvedBy: row.approved_by,
        approvedAt: row.approved_at,
        rejectionNote: row.rejection_note,
        createdAt: row.created_at,
      })) as LeaveRequestRow[];
    },
  });
}

export function useAddLeaveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (request: {
      staffId: string;
      leaveType: string;
      startDate: string;
      endDate: string;
      days: number;
      reason?: string;
    }) => {
      const { error } = await supabase.from("leave_requests").insert([{
        staff_id: request.staffId,
        leave_type: request.leaveType,
        start_date: request.startDate,
        end_date: request.endDate,
        days: request.days,
        reason: request.reason || "",
      }]);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leave_requests"] }),
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateLeaveRequestStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; status: string; approvedBy?: string; rejectionNote?: string }) => {
      const { id, ...rest } = params;
      const updateData: Record<string, unknown> = {
        status: rest.status,
        approved_at: new Date().toISOString(),
      };
      if (rest.approvedBy !== undefined) updateData.approved_by = rest.approvedBy;
      if (rest.rejectionNote !== undefined) updateData.rejection_note = rest.rejectionNote;
      const { error } = await supabase.from("leave_requests").update(updateData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leave_requests"] }),
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteLeaveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leave_requests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leave_requests"] }),
    onError: (e: any) => toast.error(e.message),
  });
}
