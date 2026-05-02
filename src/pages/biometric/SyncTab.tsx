import { useMemo, useState, useEffect } from "react";
import { toBengaliNumber } from "@/lib/constants";
import { toast } from "sonner";
import Icon from "@/components/Icon";
import type { BiometricLog, BiometricUserMap } from "@/hooks/useBiometric";
import { useOfflineSyncManual } from "@/hooks/useBiometric";
import { offlineSync } from "@/lib/offlineBiometricSync";

interface Props {
  logs: BiometricLog[];
  userMaps: BiometricUserMap[];
  personLookup: Record<string, string>;
  onSync: (options: unknown, callbacks: { onSuccess?: () => void; onError?: () => void }) => void;
  isSyncing: boolean;
}

export default function SyncTab({ logs, userMaps, personLookup, onSync, isSyncing }: Props) {
  const [lastResult, setLastResult] = useState<{ synced: number; errors: number } | null>(null);
  const [offlinePending, setOfflinePending] = useState(0);
  const offlineSyncMut = useOfflineSyncManual();

  useEffect(() => {
    const refresh = async () => {
      try {
        await offlineSync.init();
        setOfflinePending(await offlineSync.getPendingCount());
      } catch { /* noop */ }
    };
    refresh();
    const id = setInterval(refresh, 5_000);
    return () => clearInterval(id);
  }, []);

  const mapKeys = useMemo(() => {
    const set = new Set<string>();
    userMaps.forEach((m) => set.add(`${m.deviceId}_${m.zkUserId}`));
    return set;
  }, [userMaps]);

  const stats = useMemo(() => {
    const unsyncedLogs = logs.filter((l) => l.syncedToAttendance === 0);
    const mapped = unsyncedLogs.filter((l) => mapKeys.has(`${l.deviceId}_${l.zkUserId}`));
    const unmapped = unsyncedLogs.filter((l) => !mapKeys.has(`${l.deviceId}_${l.zkUserId}`));

    // Unique unmapped ZK IDs
    const unmappedIds = new Map<string, number>();
    unmapped.forEach((l) => {
      unmappedIds.set(l.zkUserId, (unmappedIds.get(l.zkUserId) || 0) + 1);
    });

    return {
      totalUnsynced: unsyncedLogs.length,
      mappedCount: mapped.length,
      unmappedCount: unmapped.length,
      unmappedIds: Array.from(unmappedIds.entries()).sort((a, b) => b[1] - a[1]),
    };
  }, [logs, mapKeys]);

  const totalSynced = useMemo(() => logs.filter((l) => l.syncedToAttendance === 1).length, [logs]);

  const mappedUsersCount = useMemo(() => {
    const uniqueUsers = new Set<string>();
    userMaps.forEach((m) => {
      const pid = m.userType === "student" ? m.studentId : m.staffId;
      if (pid) uniqueUsers.add(pid);
    });
    return uniqueUsers.size;
  }, [userMaps]);

  const handleSync = () => {
    onSync({}, {
      onSuccess: () => {
        setLastResult({ synced: stats.mappedCount, errors: 0 });
        toast.success(`${toBengaliNumber(stats.mappedCount)}টি লগ সফলভাবে সিঙ্ক হয়েছে`);
      },
      onError: () => {
        setLastResult({ synced: 0, errors: stats.mappedCount });
        toast.error("সিঙ্ক করতে সমস্যা হয়েছে");
      },
    });
  };

  return (
    <div>
      {/* Summary Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
        <div className="content-box" style={{ textAlign: "center", padding: 20, marginBottom: 0 }}>
          <p style={{ fontSize: 28, fontWeight: 800, color: "#d4af37" }}>{toBengaliNumber(stats.totalUnsynced)}</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>সিঙ্ক বাকি লগ</p>
        </div>
        <div className="content-box" style={{ textAlign: "center", padding: 20, marginBottom: 0 }}>
          <p style={{ fontSize: 28, fontWeight: 800, color: "#28a745" }}>{toBengaliNumber(stats.mappedCount)}</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>ম্যাপকৃত লগ</p>
        </div>
        <div className="content-box" style={{ textAlign: "center", padding: 20, marginBottom: 0 }}>
          <p style={{ fontSize: 28, fontWeight: 800, color: "#dc3545" }}>{toBengaliNumber(stats.unmappedCount)}</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>আনম্যাপড লগ</p>
        </div>
        <div className="content-box" style={{ textAlign: "center", padding: 20, marginBottom: 0 }}>
          <p style={{ fontSize: 28, fontWeight: 800, color: "#17a2b8" }}>{toBengaliNumber(mappedUsersCount)}</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>ম্যাপকৃত ইউজার</p>
        </div>
      </div>

      {/* Sync Action */}
      <div className="content-box" style={{ textAlign: "center", padding: 32 }}>
        <Icon name="fa-sync" size={36} style={{ color: "#d4af37", marginBottom: 12, display: "block" }} />
        <h3 style={{ fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.9)", marginBottom: 8 }}>
          বায়োমেট্রিক লগ থেকে হাজিরায় সিঙ্ক করুন
        </h3>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 20, maxWidth: 500, margin: "0 auto 20px" }}>
          ম্যাপকৃত ইউজারদের সকল আনসিঙ্কড পাঞ্চ লগ হাজিরা রেকর্ডে রূপান্তর করা হবে। চেক-ইন = উপস্থিত হিসেবে গণ্য হবে।
        </p>

        <button
          className="btn-gold"
          style={{ fontSize: 15, padding: "10px 32px" }}
          onClick={handleSync}
          disabled={isSyncing || stats.mappedCount === 0}
        >
          {isSyncing ? (
            <><Icon name="fa-spinner fa-spin" size={14} /> সিঙ্ক হচ্ছে...</>
          ) : (
            <><Icon name="fa-sync" size={14} /> এখনই সিঙ্ক করুন ({toBengaliNumber(stats.mappedCount)}টি লগ)</>
          )}
        </button>

        {stats.mappedCount === 0 && stats.totalUnsynced > 0 && (
          <p style={{ fontSize: 12, color: "#dc3545", marginTop: 12 }}>
            <Icon name="fa-exclamation-triangle" size={12} /> সকল আনসিঙ্কড লগ আনম্যাপড — আগে ইউজার ম্যাপিং করুন
          </p>
        )}
      </div>

      {/* Last Result */}
      {lastResult && (
        <div className="content-box" style={{ marginTop: 12, border: lastResult.errors > 0 ? "1px solid rgba(220,53,69,0.4)" : "1px solid rgba(40,167,69,0.4)" }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: lastResult.errors > 0 ? "#dc3545" : "#28a745", marginBottom: 8 }}>
            <Icon name={lastResult.errors > 0 ? "fa-times-circle" : "fa-check-circle"} size={14} />{" "}
            সিঙ্ক ফলাফল
          </h4>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
            সফলভাবে সিঙ্ক: <strong style={{ color: "#28a745" }}>{toBengaliNumber(lastResult.synced)}</strong>
            {lastResult.errors > 0 && (
              <> | ব্যর্থ: <strong style={{ color: "#dc3545" }}>{toBengaliNumber(lastResult.errors)}</strong></>
            )}
          </p>
        </div>
      )}

      {/* Previous sync info */}
      <div className="content-box" style={{ marginTop: 12 }}>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
          <Icon name="fa-check-circle" size={12} /> সর্বমোট সিঙ্ককৃত লগ: <strong style={{ color: "#28a745" }}>{toBengaliNumber(totalSynced)}</strong>
        </p>
      </div>

      {/* Unmapped Warning */}
      {stats.unmappedIds.length > 0 && (
        <div className="content-box" style={{ marginTop: 12, border: "1px solid rgba(255,193,7,0.3)" }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: "#ffc107", marginBottom: 10 }}>
            <Icon name="fa-exclamation-triangle" size={14} /> আনম্যাপড ZK User ID সমূহ
          </h4>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 10 }}>
            এই ZK User ID গুলো লগে পাওয়া গেছে কিন্তু কোনো ছাত্র/স্টাফের সাথে ম্যাপ করা হয়নি। ম্যাপিং ট্যাবে গিয়ে এদের ম্যাপ করুন।
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {stats.unmappedIds.map(([zkId, count]) => (
              <span
                key={zkId}
                className="badge-gold"
                style={{ fontSize: 12, display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                ID: {toBengaliNumber(zkId)} ({toBengaliNumber(count)}টি লগ)
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
