import { useState } from "react";
import { toBengaliNumber } from "@/lib/constants";
import { toast } from "sonner";
import Icon from "@/components/Icon";
import type { BiometricDevice } from "@/hooks/useBiometric";

interface Props {
  devices: BiometricDevice[];
  isLoading: boolean;
  onAdd: (device: { name: string; ipAddress: string; port: number }) => void;
  onUpdate: (device: { id: string; name?: string; ipAddress?: string; port?: number }) => void;
  onDelete: (id: string) => void;
  isPending: boolean;
}

const labelStyle: React.CSSProperties = { fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 6, display: "block" };

export default function DeviceSettingsTab({ devices, isLoading, onAdd, onUpdate, onDelete, isPending }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "ZKTeco K60", ipAddress: "", port: "4370" });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const resetForm = () => {
    setForm({ name: "ZKTeco K60", ipAddress: "", port: "4370" });
    setShowForm(false);
    setEditId(null);
  };

  const handleSubmit = () => {
    if (!form.ipAddress.trim()) {
      toast.error("IP ঠিকানা প্রয়োজন");
      return;
    }
    if (editId) {
      onUpdate({ id: editId, name: form.name, ipAddress: form.ipAddress, port: Number(form.port) || 4370 });
    } else {
      onAdd({ name: form.name, ipAddress: form.ipAddress, port: Number(form.port) || 4370 });
    }
    resetForm();
  };

  const startEdit = (device: BiometricDevice) => {
    setEditId(device.id);
    setForm({ name: device.name, ipAddress: device.ipAddress, port: String(device.port) });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (deleteConfirm === id) {
      onDelete(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>
          <Icon name="fa-wifi" size={15} /> সংযুক্ত ডিভাইস সমূহ
        </h3>
        {!showForm && (
          <button className="btn-gold" onClick={() => { resetForm(); setShowForm(true); }}>
            <Icon name="fa-plus" size={13} /> ডিভাইস যোগ করুন
          </button>
        )}
      </div>

      {showForm && (
        <div className="content-box" style={{ marginBottom: 16, border: "1px solid rgba(212,175,55,0.3)" }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: "#d4af37", marginBottom: 12 }}>
            {editId ? "ডিভাইস সম্পাদনা" : "নতুন ডিভাইস যোগ করুন"}
          </h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>ডিভাইসের নাম</label>
              <input className="glass-input" value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} placeholder="ZKTeco K60" />
            </div>
            <div>
              <label style={labelStyle}>IP ঠিকানা</label>
              <input className="glass-input" value={form.ipAddress} onChange={(e) => setForm(prev => ({ ...prev, ipAddress: e.target.value }))} placeholder="192.168.1.201" />
            </div>
            <div>
              <label style={labelStyle}>পোর্ট</label>
              <input className="glass-input" type="number" value={form.port} onChange={(e) => setForm(prev => ({ ...prev, port: e.target.value }))} placeholder="4370" />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-gold" onClick={handleSubmit} disabled={isPending}>
              <Icon name="fa-save" size={13} /> {editId ? "আপডেট করুন" : "সংরক্ষণ করুন"}
            </button>
            <button className="btn-outline-gold" onClick={resetForm}>
              <Icon name="fa-times" size={13} /> বাতিল
            </button>
          </div>
        </div>
      )}

      {devices.length === 0 && !isLoading ? (
        <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.4)" }}>
          <Icon name="fa-fingerprint" size={32} />
          <p style={{ marginTop: 12 }}>কোনো বায়োমেট্রিক ডিভাইস যোগ করা হয়নি</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
          {devices.map((device) => (
            <div key={device.id} className="content-box" style={{ marginBottom: 0, position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>
                    <Icon name="fa-fingerprint" size={14} /> {device.name}
                  </h4>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
                    {device.ipAddress}:{device.port}
                  </p>
                </div>
                <span className={device.status === "online" ? "badge-success" : "badge-gold"} style={{ fontSize: 11 }}>
                  <Icon name={device.status === "online" ? "fa-wifi" : "fa-wifi-off"} size={11} />{" "}
                  {device.status === "online" ? "অনলাইন" : "অফলাইন"}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                <div style={{ textAlign: "center", padding: "8px 0", background: "rgba(255,255,255,0.03)", borderRadius: 6 }}>
                  <p style={{ fontSize: 18, fontWeight: 700, color: "#d4af37" }}>{toBengaliNumber(device.totalUsers ?? 0)}</p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>ইউজার</p>
                </div>
                <div style={{ textAlign: "center", padding: "8px 0", background: "rgba(255,255,255,0.03)", borderRadius: 6 }}>
                  <p style={{ fontSize: 18, fontWeight: 700, color: "#d4af37" }}>{toBengaliNumber(device.totalLogs ?? 0)}</p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>লগ</p>
                </div>
              </div>

              {device.lastSyncAt && (
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>
                  <Icon name="fa-clock" size={11} /> সর্বশেষ সিঙ্ক: {new Date(device.lastSyncAt).toLocaleString("bn-BD")}
                </p>
              )}

              <div style={{ display: "flex", gap: 6 }}>
                <button className="btn-outline-gold" style={{ fontSize: 12, padding: "5px 10px" }} onClick={() => startEdit(device)}>
                  <Icon name="fa-edit" size={12} /> সম্পাদনা
                </button>
                <button
                  className="btn-outline-gold"
                  style={{ fontSize: 12, padding: "5px 10px", color: deleteConfirm === device.id ? "#dc3545" : undefined }}
                  onClick={() => handleDelete(device.id)}
                >
                  <Icon name="fa-trash" size={12} /> {deleteConfirm === device.id ? "নিশ্চিত?" : "মুছুন"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
