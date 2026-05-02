import { useMemo, useState } from "react";
import { toBengaliNumber } from "@/lib/constants";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import Icon from "@/components/Icon";
import {
  useBiometricDevices,
  useAddBiometricDevice,
  useUpdateBiometricDevice,
  useDeleteBiometricDevice,
  useBiometricLogs,
  useBiometricUserMap,
  useUpsertBiometricUserMap,
  useDeleteBiometricUserMap,
  useSyncLogsToAttendance,
} from "@/hooks/useBiometric";
import { useStudents } from "@/hooks/useStudents";
import { useStaff } from "@/hooks/useStaff";

import DeviceSettingsTab from "@/pages/biometric/DeviceSettingsTab";
import UserMappingTab from "@/pages/biometric/UserMappingTab";
import PunchLogsTab from "@/pages/biometric/PunchLogsTab";
import SyncTab from "@/pages/biometric/SyncTab";
import PayrollIntegrationTab from "@/pages/biometric/PayrollIntegrationTab";

type TabKey = "devices" | "mapping" | "logs" | "sync" | "payroll";

const tabs: { key: TabKey; label: string; icon: string }[] = [
  { key: "devices", label: "ডিভাইস সেটিংস", icon: "fa-wifi" },
  { key: "mapping", label: "ইউজার ম্যাপিং", icon: "fa-map" },
  { key: "logs", label: "পাঞ্চ লগ", icon: "fa-scan" },
  { key: "sync", label: "হাজিরায় সিঙ্ক", icon: "fa-sync" },
  { key: "payroll", label: "বেতন হিসাব", icon: "fa-money-check-alt" },
];

export default function BiometricAttendance() {
  const [activeTab, setActiveTab] = useState<TabKey>("devices");
  const [logDate, setLogDate] = useState(new Date().toISOString().split("T")[0]);

  // Data hooks
  const { data: devices = [], isLoading: loadingDevices } = useBiometricDevices();
  const { data: allLogs = [], isLoading: loadingLogs } = useBiometricLogs({ date: logDate });
  const { data: userMaps = [] } = useBiometricUserMap();
  const { data: students = [], isLoading: loadingStudents } = useStudents();
  const { data: staff = [], isLoading: loadingStaff } = useStaff();

  // Mutations
  const addDevice = useAddBiometricDevice();
  const updateDevice = useUpdateBiometricDevice();
  const deleteDevice = useDeleteBiometricDevice();
  const upsertUserMap = useUpsertBiometricUserMap();
  const deleteUserMap = useDeleteBiometricUserMap();
  const syncLogs = useSyncLogsToAttendance();

  // Derived data
  const activeStudents = useMemo(
    () =>
      students
        .filter((s) => s.status === "active")
        .map((s) => ({ id: s.id, name: s.name, identifier: s.student_id, extra: s.class_name || "" })),
    [students],
  );

  const activeStaff = useMemo(
    () =>
      staff
        .filter((s) => s.status === "active")
        .map((s) => ({ id: s.id, name: s.name, identifier: s.staff_id, extra: s.designation || s.role || "" })),
    [staff],
  );

  const personLookup = useMemo(() => {
    const map: Record<string, string> = {};
    activeStudents.forEach((s) => { map[s.id] = s.name; });
    activeStaff.forEach((s) => { map[s.id] = s.name; });
    return map;
  }, [activeStudents, activeStaff]);

  const isInitialLoading = loadingDevices && loadingStudents && loadingStaff;

  if (isInitialLoading) {
    return (
      <div>
        <div className="page-header">
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#d4af37" }}>
            <Icon name="fa-fingerprint" size={20} /> বায়োমেট্রিক হাজিরা
          </h2>
        </div>
        <Skeleton className="h-64" style={{ borderRadius: 10 }} />
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#d4af37" }}>
          <Icon name="fa-fingerprint" size={20} /> বায়োমেট্রিক হাজিরা
        </h2>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, marginTop: 4 }}>
          ফিঙ্গারপ্রিন্ট ডিভাইস সংযোগ, ইউজার ম্যাপিং এবং স্বয়ংক্রিয় হাজিরা সিঙ্ক পরিচালনা করুন
        </p>
      </div>

      {/* Quick Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginBottom: 16 }}>
        <div className="content-box" style={{ textAlign: "center", padding: 16, marginBottom: 0 }}>
          <p style={{ fontSize: 24, fontWeight: 800, color: "#d4af37" }}>{toBengaliNumber(devices.length)}</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>ডিভাইস</p>
        </div>
        <div className="content-box" style={{ textAlign: "center", padding: 16, marginBottom: 0 }}>
          <p style={{ fontSize: 24, fontWeight: 800, color: "#28a745" }}>
            {toBengaliNumber(devices.filter((d) => d.status === "online").length)}
          </p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>অনলাইন</p>
        </div>
        <div className="content-box" style={{ textAlign: "center", padding: 16, marginBottom: 0 }}>
          <p style={{ fontSize: 24, fontWeight: 800, color: "#17a2b8" }}>{toBengaliNumber(userMaps.length)}</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>ম্যাপিং</p>
        </div>
        <div className="content-box" style={{ textAlign: "center", padding: 16, marginBottom: 0 }}>
          <p style={{ fontSize: 24, fontWeight: 800, color: "#dc3545" }}>
            {toBengaliNumber(allLogs.filter((l) => l.syncedToAttendance === 0).length)}
          </p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>সিঙ্ক বাকি</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={activeTab === tab.key ? "btn-gold" : "btn-outline-gold"}
            style={{ fontSize: 13, padding: "8px 16px" }}
            onClick={() => setActiveTab(tab.key)}
          >
            <Icon name={tab.icon} size={13} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "devices" && (
        <DeviceSettingsTab
          devices={devices}
          isLoading={loadingDevices}
          onAdd={(data) => addDevice.mutate(data, { onSuccess: () => toast.success("ডিভাইস যোগ হয়েছে") })}
          onUpdate={(data) => updateDevice.mutate(data, { onSuccess: () => toast.success("ডিভাইস আপডেট হয়েছে") })}
          onDelete={(id) => deleteDevice.mutate(id, { onSuccess: () => toast.success("ডিভাইস মুছে ফেলা হয়েছে") })}
          isPending={addDevice.isPending || updateDevice.isPending}
        />
      )}

      {activeTab === "mapping" && (
        <UserMappingTab
          devices={devices}
          userMaps={userMaps}
          students={activeStudents}
          staffList={activeStaff}
          onUpsert={(data) => upsertUserMap.mutate(data, { onSuccess: () => toast.success("ম্যাপিং সংরক্ষিত হয়েছে") })}
          onDelete={(id) => deleteUserMap.mutate(id, { onSuccess: () => toast.success("ম্যাপিং মুছে ফেলা হয়েছে") })}
          isPending={upsertUserMap.isPending}
        />
      )}

      {activeTab === "logs" && (
        <PunchLogsTab
          devices={devices}
          logs={allLogs}
          userMaps={userMaps}
          personLookup={personLookup}
          isLoading={loadingLogs}
          selectedDate={logDate}
          onDateChange={setLogDate}
        />
      )}

      {activeTab === "sync" && (
        <SyncTab
          logs={allLogs}
          userMaps={userMaps}
          personLookup={personLookup}
          onSync={(_opts, cbs) => syncLogs.mutate(undefined as never, cbs as never)}
          isSyncing={syncLogs.isPending}
        />
      )}

      {activeTab === "payroll" && (
        <PayrollIntegrationTab staffList={activeStaff} />
      )}
    </div>
  );
}
