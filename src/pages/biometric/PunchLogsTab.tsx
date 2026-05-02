import { useMemo, useState } from "react";
import { toBengaliNumber } from "@/lib/constants";
import Icon from "@/components/Icon";
import type { BiometricDevice, BiometricLog, BiometricUserMap } from "@/hooks/useBiometric";

interface Props {
  devices: BiometricDevice[];
  logs: BiometricLog[];
  userMaps: BiometricUserMap[];
  personLookup: Record<string, string>;
  isLoading: boolean;
  selectedDate: string;
  onDateChange: (date: string) => void;
}

const labelStyle: React.CSSProperties = { fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 6, display: "block" };

export default function PunchLogsTab({ devices, logs, userMaps, personLookup, isLoading, selectedDate, onDateChange }: Props) {
  const [deviceFilter, setDeviceFilter] = useState("");

  const userMapLookup = useMemo(() => {
    const map: Record<string, { studentId: string; staffId: string; userType: string }> = {};
    userMaps.forEach((m) => {
      const key = `${m.deviceId}_${m.zkUserId}`;
      map[key] = { studentId: m.studentId, staffId: m.staffId, userType: m.userType };
    });
    return map;
  }, [userMaps]);

  const filtered = useMemo(() => {
    let result = logs;
    if (deviceFilter) result = result.filter((l) => l.deviceId === deviceFilter);
    return result;
  }, [logs, deviceFilter]);

  const stats = useMemo(() => {
    const synced = filtered.filter((l) => l.syncedToAttendance === 1).length;
    return { total: filtered.length, synced, unsynced: filtered.length - synced };
  }, [filtered]);

  const getMappedName = (log: BiometricLog) => {
    const key = `${log.deviceId}_${log.zkUserId}`;
    const mapped = userMapLookup[key];
    if (!mapped) return "—";
    const pid = mapped.userType === "student" ? mapped.studentId : mapped.staffId;
    return personLookup[pid] || "—";
  };

  const getPunchLabel = (state: number | undefined | null) => {
    if (state === 0) return { label: "চেক-ইন", className: "badge-success" };
    if (state === 1) return { label: "চেক-আউট", className: "badge-gold" };
    return { label: "অজানা", className: "badge-gold" };
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 16 }}>
        <div className="content-box" style={{ textAlign: "center", padding: 16, marginBottom: 0 }}>
          <p style={{ fontSize: 24, fontWeight: 800, color: "#d4af37" }}>{toBengaliNumber(stats.total)}</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>মোট লগ</p>
        </div>
        <div className="content-box" style={{ textAlign: "center", padding: 16, marginBottom: 0 }}>
          <p style={{ fontSize: 24, fontWeight: 800, color: "#28a745" }}>{toBengaliNumber(stats.synced)}</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>সিঙ্ককৃত</p>
        </div>
        <div className="content-box" style={{ textAlign: "center", padding: 16, marginBottom: 0 }}>
          <p style={{ fontSize: 24, fontWeight: 800, color: "#dc3545" }}>{toBengaliNumber(stats.unsynced)}</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>সিঙ্ক বাকি</p>
        </div>
      </div>

      <div className="content-box" style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ flex: "1 1 200px" }}>
          <label style={labelStyle}>তারিখ</label>
          <input type="date" className="glass-input" value={selectedDate} onChange={(e) => onDateChange(e.target.value)} />
        </div>
        <div style={{ flex: "1 1 200px" }}>
          <label style={labelStyle}>ডিভাইস ফিল্টার</label>
          <select className="glass-select" value={deviceFilter} onChange={(e) => setDeviceFilter(e.target.value)}>
            <option value="">সকল ডিভাইস</option>
            {devices.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      </div>

      <div className="content-box" style={{ padding: 0 }}>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>সময়</th>
                <th>ZK User ID</th>
                <th>ম্যাপ করা নাম</th>
                <th>পাঞ্চ স্ট্যাটাস</th>
                <th style={{ textAlign: "center" }}>সিঙ্ক</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.4)" }}>
                    <Icon name="fa-spinner fa-spin" size={18} /> লোড হচ্ছে...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.4)" }}>
                    নির্বাচিত তারিখে কোনো পাঞ্চ লগ পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                filtered.map((log) => {
                  const punch = getPunchLabel(log.punchState);
                  return (
                    <tr key={log.id}>
                      <td style={{ fontSize: 13 }}>
                        {new Date(log.punchTime).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td style={{ fontWeight: 600 }}>{toBengaliNumber(log.zkUserId)}</td>
                      <td>{getMappedName(log)}</td>
                      <td><span className={punch.className} style={{ fontSize: 11 }}>{punch.label}</span></td>
                      <td style={{ textAlign: "center" }}>
                        {log.syncedToAttendance === 1 ? (
                          <span className="badge-success" style={{ fontSize: 11 }}>
                            <Icon name="fa-check" size={10} /> সিঙ্ককৃত
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>বাকি</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
