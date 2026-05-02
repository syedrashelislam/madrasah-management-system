import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { offlineSync } from "@/lib/offlineBiometricSync";

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface BiometricDevice {
  id: string;
  name: string;
  ipAddress: string;
  port: number;
  status: string;
  lastSyncAt: string;
  totalUsers: number;
  totalLogs: number;
  createdAt: string;
  updatedAt: string;
}

export interface BiometricLog {
  id: string;
  deviceId: string;
  zkUserId: string;
  punchTime: string;
  punchState: number;
  syncedToAttendance: number;
  createdAt: string;
}

export interface BiometricUserMap {
  id: string;
  deviceId: string;
  zkUserId: string;
  userType: string;
  studentId: string;
  staffId: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Helpers – row mappers
// ---------------------------------------------------------------------------

const mapDevice = (row: any): BiometricDevice => ({
  id: row.id,
  name: row.name,
  ipAddress: row.ip_address,
  port: row.port,
  status: row.status,
  lastSyncAt: row.last_sync_at ?? "",
  totalUsers: row.total_users ?? 0,
  totalLogs: row.total_logs ?? 0,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapLog = (row: any): BiometricLog => ({
  id: row.id,
  deviceId: row.device_id,
  zkUserId: row.zk_user_id,
  punchTime: row.punch_time,
  punchState: row.punch_state,
  syncedToAttendance: (row.synced_to_attendance === true || row.synced_to_attendance === 1 || row.synced_to_attendance === "1") ? 1 : 0,
  createdAt: row.created_at,
});

const mapUserMap = (row: any): BiometricUserMap => ({
  id: row.id,
  deviceId: row.device_id,
  zkUserId: row.zk_user_id,
  userType: row.user_type,
  studentId: row.student_id ?? "",
  staffId: row.staff_id ?? "",
  displayName: row.display_name ?? "",
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// ---------------------------------------------------------------------------
// 1. useBiometricDevices
// ---------------------------------------------------------------------------

export function useBiometricDevices() {
  return useQuery({
    queryKey: ["biometric-devices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("biometric_devices")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data || []) as any[]).map(mapDevice);
    },
  });
}

// ---------------------------------------------------------------------------
// 2. useAddBiometricDevice
// ---------------------------------------------------------------------------

export function useAddBiometricDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (device: { name: string; ipAddress: string; port: number }) => {
      const { error } = await supabase.from("biometric_devices").insert([
        {
          name: device.name,
          ip_address: device.ipAddress,
          port: device.port,
        },
      ]);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["biometric-devices"] }),
    onError: (e: any) => toast.error(e.message),
  });
}

// ---------------------------------------------------------------------------
// 3. useUpdateBiometricDevice
// ---------------------------------------------------------------------------

export function useUpdateBiometricDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string } & Partial<BiometricDevice>) => {
      const { id, createdAt: _c, updatedAt: _u, ...rest } = params;
      const row: Record<string, any> = { updated_at: new Date().toISOString() };
      if (rest.name !== undefined) row.name = rest.name;
      if (rest.ipAddress !== undefined) row.ip_address = rest.ipAddress;
      if (rest.port !== undefined) row.port = rest.port;
      if (rest.status !== undefined) row.status = rest.status;
      if (rest.lastSyncAt !== undefined) row.last_sync_at = rest.lastSyncAt;
      if (rest.totalUsers !== undefined) row.total_users = rest.totalUsers;
      if (rest.totalLogs !== undefined) row.total_logs = rest.totalLogs;
      const { error } = await supabase
        .from("biometric_devices")
        .update(row)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["biometric-devices"] }),
    onError: (e: any) => toast.error(e.message),
  });
}

// ---------------------------------------------------------------------------
// 4. useDeleteBiometricDevice
// ---------------------------------------------------------------------------

export function useDeleteBiometricDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("biometric_devices")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["biometric-devices"] }),
    onError: (e: any) => toast.error(e.message),
  });
}

// ---------------------------------------------------------------------------
// 5. useBiometricLogs
// ---------------------------------------------------------------------------

export function useBiometricLogs(filters?: {
  deviceId?: string;
  date?: string;
  syncedOnly?: boolean;
}) {
  return useQuery({
    queryKey: ["biometric-logs", filters],
    queryFn: async () => {
      let query = supabase
        .from("biometric_logs")
        .select("*")
        .order("punch_time", { ascending: false });

      if (filters?.deviceId) {
        query = query.eq("device_id", filters.deviceId);
      }
      if (filters?.date) {
        query = query.gte("punch_time", `${filters.date}T00:00:00`).lt("punch_time", `${filters.date}T23:59:59.999999`);
      }
      if (filters?.syncedOnly === true) {
        query = query.eq("synced_to_attendance", true);
      } else if (filters?.syncedOnly === false) {
        query = query.eq("synced_to_attendance", false);
      }

      const { data, error } = await query;
      if (error) throw error;
      return ((data || []) as any[]).map(mapLog);
    },
  });
}

// ---------------------------------------------------------------------------
// 6. useBiometricUserMap
// ---------------------------------------------------------------------------

export function useBiometricUserMap(deviceId?: string) {
  return useQuery({
    queryKey: ["biometric-user-map", deviceId],
    queryFn: async () => {
      let query = supabase
        .from("biometric_user_map")
        .select("*")
        .order("created_at", { ascending: false });

      if (deviceId) {
        query = query.eq("device_id", deviceId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return ((data || []) as any[]).map(mapUserMap);
    },
  });
}

// ---------------------------------------------------------------------------
// 7. useUpsertBiometricUserMap
// ---------------------------------------------------------------------------

export function useUpsertBiometricUserMap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (mapping: {
      deviceId: string;
      zkUserId: string;
      userType: string;
      studentId?: string;
      staffId?: string;
      displayName: string;
    }) => {
      const { error } = await supabase.from("biometric_user_map").upsert(
        [
          {
            device_id: mapping.deviceId,
            zk_user_id: mapping.zkUserId,
            user_type: mapping.userType,
            student_id: mapping.studentId ?? null,
            staff_id: mapping.staffId ?? null,
            display_name: mapping.displayName,
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: "device_id,zk_user_id" },
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["biometric-user-map"] }),
    onError: (e: any) => toast.error(e.message),
  });
}

// ---------------------------------------------------------------------------
// 8. useDeleteBiometricUserMap
// ---------------------------------------------------------------------------

export function useDeleteBiometricUserMap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("biometric_user_map")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["biometric-user-map"] }),
    onError: (e: any) => toast.error(e.message),
  });
}

// ---------------------------------------------------------------------------
// 9. useAddBiometricLog (offline-aware)
// ---------------------------------------------------------------------------

export function useAddBiometricLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (log: {
      deviceId: string;
      zkUserId: string;
      punchTime: string;
      punchState: number;
    }) => {
      if (!offlineSync.isOnline()) {
        // Queue locally when offline
        await offlineSync.init();
        await offlineSync.addPendingLog(log);
        return { queued: true };
      }

      // Online — insert directly
      const { error } = await supabase.from("biometric_logs").insert({
        device_id: log.deviceId,
        zk_user_id: log.zkUserId,
        punch_time: log.punchTime,
        punch_state: log.punchState,
        synced_to_attendance: false,
      });

      if (error) {
        // If it's a network error, queue locally
        if (error.message?.includes('fetch') || error.message?.includes('network') || error.code === 'PGRST301') {
          await offlineSync.init();
          await offlineSync.addPendingLog(log);
          return { queued: true };
        }
        throw error;
      }

      return { queued: false };
    },
    onSuccess: (result) => {
      if (result.queued) {
        toast.info("অফলাইনে সংরক্ষিত — পরে সিঙ্ক হবে");
      } else {
        qc.invalidateQueries({ queryKey: ["biometric-logs"] });
      }
    },
    onError: (e: any) => toast.error(e.message),
  });
}

// ---------------------------------------------------------------------------
// 10. useOfflineSyncManual
// ---------------------------------------------------------------------------

export function useOfflineSyncManual() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await offlineSync.init();
      return offlineSync.syncPendingLogs();
    },
    onSuccess: (result) => {
      if (result.uploaded > 0) {
        qc.invalidateQueries({ queryKey: ["biometric-logs"] });
        toast.success(`${result.uploaded}টি অফলাইন লগ সিঙ্ক হয়েছে`);
      }
      if (result.failed > 0) {
        toast.warning(`${result.failed}টি লগ সিঙ্ক করা যায়নি`);
      }
    },
    onError: (e: any) => toast.error(e.message),
  });
}

// ---------------------------------------------------------------------------
// 11. useSyncLogsToAttendance
// ---------------------------------------------------------------------------

export function useSyncLogsToAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      // 1. Fetch unsynced logs
      const { data: unsyncedLogs, error: logsErr } = await supabase
        .from("biometric_logs")
        .select("*")
        .eq("synced_to_attendance", false);
      if (logsErr) throw logsErr;
      const logs = (unsyncedLogs || []) as any[];
      if (logs.length === 0) return { synced: 0 };

      // 2. Fetch all user mappings
      const { data: mappings, error: mapErr } = await supabase
        .from("biometric_user_map")
        .select("*");
      if (mapErr) throw mapErr;
      const mapList = (mappings || []) as any[];

      // Build lookup: "deviceId|zkUserId" → mapping row
      const mapLookup = new Map<string, any>();
      for (const m of mapList) {
        mapLookup.set(`${m.device_id}|${m.zk_user_id}`, m);
      }

      // 3. Build attendance upsert batches
      const studentAttendance: { student_id: string; date: string; status: string }[] = [];
      const staffAttendance: { staff_id: string; date: string; status: string }[] = [];
      const syncedIds: string[] = [];

      for (const log of logs) {
        const key = `${log.device_id}|${log.zk_user_id}`;
        const mapping = mapLookup.get(key);
        if (!mapping) continue;

        const date = (log.punch_time as string).substring(0, 10); // YYYY-MM-DD

        if (mapping.user_type === "student" && mapping.student_id) {
          studentAttendance.push({
            student_id: mapping.student_id,
            date,
            status: "present",
          });
          syncedIds.push(log.id);
        } else if (mapping.user_type === "staff" && mapping.staff_id) {
          staffAttendance.push({
            staff_id: mapping.staff_id,
            date,
            status: "present",
          });
          syncedIds.push(log.id);
        }
      }

      // 4. Upsert student attendance
      if (studentAttendance.length > 0) {
        const { error } = await supabase
          .from("attendance")
          .upsert(studentAttendance, { onConflict: "student_id,date" });
        if (error) throw error;
      }

      // 5. Upsert staff / teacher attendance
      if (staffAttendance.length > 0) {
        const { error } = await supabase
          .from("teacher_attendance")
          .upsert(staffAttendance, { onConflict: "staff_id,date" });
        if (error) throw error;
      }

      // 6. Mark logs as synced (batch in chunks of 200 to stay within limits)
      const CHUNK = 200;
      for (let i = 0; i < syncedIds.length; i += CHUNK) {
        const chunk = syncedIds.slice(i, i + CHUNK);
        const { error } = await supabase
          .from("biometric_logs")
          .update({ synced_to_attendance: true })
          .in("id", chunk);
        if (error) throw error;
      }

      return { synced: syncedIds.length };
    },
    onSuccess: (_data) => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
      qc.invalidateQueries({ queryKey: ["teacher_attendance"] });
      qc.invalidateQueries({ queryKey: ["biometric-logs"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
}
