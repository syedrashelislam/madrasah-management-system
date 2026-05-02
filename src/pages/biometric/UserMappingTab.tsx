import { useMemo, useState } from "react";
import { toBengaliNumber } from "@/lib/constants";
import { toast } from "sonner";
import Icon from "@/components/Icon";
import type { BiometricDevice, BiometricUserMap } from "@/hooks/useBiometric";

interface PersonRecord {
  id: string;
  name: string;
  identifier: string; // student_id or staff_id
  extra: string; // class_name or designation
}

interface Props {
  devices: BiometricDevice[];
  userMaps: BiometricUserMap[];
  students: PersonRecord[];
  staffList: PersonRecord[];
  onUpsert: (data: { deviceId: string; zkUserId: string; userType: string; studentId?: string; staffId?: string; displayName: string }) => void;
  onDelete: (id: string) => void;
  isPending: boolean;
}

const labelStyle: React.CSSProperties = { fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 6, display: "block" };

export default function UserMappingTab({ devices, userMaps, students, staffList, onUpsert, onDelete, isPending }: Props) {
  const [deviceFilter, setDeviceFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ deviceId: "", zkUserId: "", userType: "student", personId: "" });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filtered = useMemo(
    () => deviceFilter ? userMaps.filter((m) => m.deviceId === deviceFilter) : userMaps,
    [userMaps, deviceFilter],
  );

  const personLookup = useMemo(() => {
    const map: Record<string, { name: string; extra: string }> = {};
    students.forEach((s) => { map[s.id] = { name: s.name, extra: s.extra }; });
    staffList.forEach((s) => { map[s.id] = { name: s.name, extra: s.extra }; });
    return map;
  }, [students, staffList]);

  const deviceLookup = useMemo(() => {
    const map: Record<string, string> = {};
    devices.forEach((d) => { map[d.id] = d.name; });
    return map;
  }, [devices]);

  const handleSubmit = () => {
    if (!form.deviceId || !form.zkUserId || !form.personId) {
      toast.error("সকল ক্ষেত্র পূরণ করুন");
      return;
    }
    const selectedPerson = personOptions.find(p => p.id === form.personId);
    onUpsert({
      deviceId: form.deviceId,
      zkUserId: form.zkUserId,
      userType: form.userType,
      studentId: form.userType === "student" ? form.personId : undefined,
      staffId: form.userType === "staff" ? form.personId : undefined,
      displayName: selectedPerson?.name || "",
    });
    setForm({ deviceId: "", zkUserId: "", userType: "student", personId: "" });
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (deleteConfirm === id) {
      onDelete(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
    }
  };

  const personOptions = form.userType === "student" ? students : staffList;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <div style={{ flex: "1 1 220px" }}>
          <label style={labelStyle}>ডিভাইস ফিল্টার</label>
          <select className="glass-select" value={deviceFilter} onChange={(e) => setDeviceFilter(e.target.value)}>
            <option value="">সকল ডিভাইস</option>
            {devices.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        {!showForm && (
          <button className="btn-gold" style={{ alignSelf: "flex-end" }} onClick={() => setShowForm(true)}>
            <Icon name="fa-plus" size={13} /> ম্যাপিং যোগ করুন
          </button>
        )}
      </div>

      {showForm && (
        <div className="content-box" style={{ marginBottom: 16, border: "1px solid rgba(212,175,55,0.3)" }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: "#d4af37", marginBottom: 12 }}>নতুন ইউজার ম্যাপিং</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>ডিভাইস</label>
              <select className="glass-select" value={form.deviceId} onChange={(e) => setForm(prev => ({ ...prev, deviceId: e.target.value }))}>
                <option value="">নির্বাচন করুন</option>
                {devices.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>ZK User ID</label>
              <input className="glass-input" type="number" value={form.zkUserId} onChange={(e) => setForm(prev => ({ ...prev, zkUserId: e.target.value }))} placeholder="যেমন: ১, ২, ৩..." />
            </div>
            <div>
              <label style={labelStyle}>ধরন</label>
              <select className="glass-select" value={form.userType} onChange={(e) => setForm(prev => ({ ...prev, userType: e.target.value, personId: "" }))}>
                <option value="student">ছাত্র</option>
                <option value="staff">স্টাফ</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>{form.userType === "student" ? "ছাত্র নির্বাচন" : "স্টাফ নির্বাচন"}</label>
              <select className="glass-select" value={form.personId} onChange={(e) => setForm(prev => ({ ...prev, personId: e.target.value }))}>
                <option value="">নির্বাচন করুন</option>
                {personOptions.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — {p.extra}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-gold" onClick={handleSubmit} disabled={isPending}>
              <Icon name="fa-save" size={13} /> সংরক্ষণ করুন
            </button>
            <button className="btn-outline-gold" onClick={() => setShowForm(false)}>
              <Icon name="fa-times" size={13} /> বাতিল
            </button>
          </div>
        </div>
      )}

      <div className="content-box" style={{ padding: 0 }}>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ZK User ID</th>
                <th>ডিভাইস</th>
                <th>ধরন</th>
                <th>ম্যাপ করা নাম</th>
                <th style={{ textAlign: "center" }}>অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => {
                const personId = m.userType === "student" ? m.studentId : m.staffId;
                const person = personId ? personLookup[personId] : null;
                return (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 600 }}>{toBengaliNumber(m.zkUserId)}</td>
                    <td>{deviceLookup[m.deviceId] || "—"}</td>
                    <td>
                      <span className={m.userType === "student" ? "badge-gold" : "badge-success"} style={{ fontSize: 11 }}>
                        {m.userType === "student" ? "ছাত্র" : "স্টাফ"}
                      </span>
                    </td>
                    <td>{person ? `${person.name} (${person.extra})` : (m.displayName || "—")}</td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        className="btn-outline-gold"
                        style={{ fontSize: 12, padding: "4px 10px", color: deleteConfirm === m.id ? "#dc3545" : undefined }}
                        onClick={() => handleDelete(m.id)}
                      >
                        <Icon name="fa-trash" size={11} /> {deleteConfirm === m.id ? "নিশ্চিত?" : "মুছুন"}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.4)" }}>
                    কোনো ইউজার ম্যাপিং পাওয়া যায়নি
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
