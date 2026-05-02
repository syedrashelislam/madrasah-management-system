import { useState } from "react";
import Icon from "@/components/Icon";
import { formatTaka } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useFeeGroups,
  useAddFeeGroup,
  useUpdateFeeGroup,
  useDeleteFeeGroup,
  type FeeGroupRow,
} from "@/hooks/useFeeGroups";

interface Props {
  canWrite: boolean;
}

export default function FeeGroupSection({ canWrite }: Props) {
  const { data: groups = [], isLoading } = useFeeGroups();
  const addGroup = useAddFeeGroup();
  const updateGroup = useUpdateFeeGroup();
  const deleteGroup = useDeleteFeeGroup();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ monthlyFee: 0, admissionFee: 0 });
  const [showAdd, setShowAdd] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: "", description: "", monthlyFee: 0, admissionFee: 0 });

  const handleStartEdit = (g: FeeGroupRow) => {
    setEditingId(g.id);
    setEditForm({ monthlyFee: Number(g.monthlyFee) || 0, admissionFee: Number(g.admissionFee) || 0 });
  };

  const handleSave = () => {
    if (!editingId) return;
    updateGroup.mutate({ id: editingId, ...editForm });
    setEditingId(null);
  };

  const handleAdd = () => {
    if (!newGroup.name.trim()) return;
    addGroup.mutate({ ...newGroup, color: "#e8a87c" });
    setNewGroup({ name: "", description: "", monthlyFee: 0, admissionFee: 0 });
    setShowAdd(false);
  };

  const handleRemove = (id: string) => {
    if (!confirm("এই ফি গ্রুপ মুছে ফেলতে চান?")) return;
    deleteGroup.mutate(id);
    if (editingId === id) setEditingId(null);
  };

  return (
    <div className="content-box" style={{ marginTop: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#d4af37", marginBottom: 4 }}>
            <Icon name="fa-layer-group" /> ফি গ্রুপ
          </h3>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
            বিভিন্ন ছাত্র গ্রুপের জন্য ভিন্ন ভিন্ন ফি নির্ধারণ করুন
          </p>
        </div>
        {canWrite && !showAdd && (
          <button className="btn-outline-gold" onClick={() => setShowAdd(true)} style={{ fontSize: 12, padding: "7px 14px" }}>
            <Icon name="fa-plus" size={12} /> গ্রুপ যোগ
          </button>
        )}
      </div>

      {/* Info banner */}
      <div style={{
        background: "rgba(91,192,222,0.06)", border: "1px solid rgba(91,192,222,0.15)",
        borderRadius: 8, padding: "10px 14px", marginBottom: 16,
        fontSize: 12, color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: 8,
      }}>
        <Icon name="fa-info-circle" size={14} style={{ color: "#5bc0de", flexShrink: 0 }} />
        <span>
          ফি গ্রুপ ব্যবহার করে আপনি এতিম, দরিদ্র বা বিশেষ ছাত্রদের জন্য আলাদা ফি নির্ধারণ করতে পারবেন।
          প্রতিটি গ্রুপের মাসিক ও ভর্তি ফি আলাদাভাবে সেট করুন।
        </span>
      </div>

      {/* Add new group form */}
      {showAdd && canWrite && (
        <div style={{
          background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.15)",
          borderRadius: 10, padding: 16, marginBottom: 16,
        }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: "#d4af37", marginBottom: 12 }}>
            <Icon name="fa-plus" size={12} /> নতুন ফি গ্রুপ
          </h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 4 }}>
                গ্রুপের নাম <span style={{ color: "#dc3545" }}>*</span>
              </label>
              <input
                className="glass-input"
                value={newGroup.name}
                onChange={e => setNewGroup({ ...newGroup, name: e.target.value })}
                placeholder="যেমন: দরিদ্র ছাত্র"
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 4 }}>
                বিবরণ
              </label>
              <input
                className="glass-input"
                value={newGroup.description}
                onChange={e => setNewGroup({ ...newGroup, description: e.target.value })}
                placeholder="এই গ্রুপের বিবরণ..."
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 4 }}>
                মাসিক ফি (৳)
              </label>
              <input
                className="glass-input"
                type="number"
                value={newGroup.monthlyFee || ""}
                onChange={e => setNewGroup({ ...newGroup, monthlyFee: Number(e.target.value) })}
                placeholder="0"
              />
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                এই গ্রুপের ছাত্রদের মাসিক ফি
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 4 }}>
                ভর্তি ফি (৳)
              </label>
              <input
                className="glass-input"
                type="number"
                value={newGroup.admissionFee || ""}
                onChange={e => setNewGroup({ ...newGroup, admissionFee: Number(e.target.value) })}
                placeholder="0"
              />
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                এই গ্রুপের ছাত্রদের ভর্তি ফি
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-gold" onClick={handleAdd} disabled={!newGroup.name.trim() || addGroup.isPending}>
              <Icon name="fa-save" /> {addGroup.isPending ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ"}
            </button>
            <button className="btn-outline-gold" onClick={() => { setShowAdd(false); setNewGroup({ name: "", description: "", monthlyFee: 0, admissionFee: 0 }); }}>
              <Icon name="fa-times" /> বাতিল
            </button>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ borderRadius: 10, padding: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <Skeleton className="h-4 w-24 mb-2" style={{ background: "rgba(255,255,255,0.08)" }} />
              <Skeleton className="h-3 w-36 mb-4" style={{ background: "rgba(255,255,255,0.05)" }} />
              <div style={{ display: "flex", gap: 20 }}>
                <Skeleton className="h-6 w-16" style={{ background: "rgba(255,255,255,0.08)" }} />
                <Skeleton className="h-6 w-16" style={{ background: "rgba(255,255,255,0.08)" }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Groups grid */}
      {!isLoading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
          {groups.map((g) => (
            <div
              key={g.id}
              style={{
                background: `${g.color}08`,
                border: `1px solid ${g.color}25`,
                borderRadius: 10,
                padding: 16,
                transition: "all 0.2s ease",
              }}
            >
              {/* Card header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%", background: g.color, flexShrink: 0,
                    }} />
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: g.color }}>{g.name}</h4>
                  </div>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 3, paddingLeft: 14 }}>
                    {g.description}
                  </p>
                </div>
                {canWrite && editingId !== g.id && (
                  <div style={{ display: "flex", gap: 4, flexShrink: 0, marginLeft: 8 }}>
                    <button className="action-btn" onClick={() => handleStartEdit(g)} title="সম্পাদনা" style={{ padding: 4 }}>
                      <Icon name="fa-edit" size={12} />
                    </button>
                    <button className="action-btn" onClick={() => handleRemove(g.id)} title="মুছুন" style={{ padding: 4 }}>
                      <Icon name="fa-trash" size={12} style={{ color: "#dc3545" }} />
                    </button>
                  </div>
                )}
              </div>

              {/* Edit mode */}
              {editingId === g.id ? (
                <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                  <div>
                    <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 3 }}>
                      মাসিক ফি (৳)
                    </label>
                    <input
                      className="glass-input"
                      type="number"
                      style={{ fontSize: 13 }}
                      value={editForm.monthlyFee || ""}
                      onChange={e => setEditForm({ ...editForm, monthlyFee: Number(e.target.value) })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 3 }}>
                      ভর্তি ফি (৳)
                    </label>
                    <input
                      className="glass-input"
                      type="number"
                      style={{ fontSize: 13 }}
                      value={editForm.admissionFee || ""}
                      onChange={e => setEditForm({ ...editForm, admissionFee: Number(e.target.value) })}
                      placeholder="0"
                    />
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                    <button
                      className="btn-gold"
                      style={{ fontSize: 12, padding: "6px 12px" }}
                      onClick={handleSave}
                      disabled={updateGroup.isPending}
                    >
                      <Icon name="fa-check" size={11} /> {updateGroup.isPending ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ"}
                    </button>
                    <button
                      className="btn-outline-gold"
                      style={{ fontSize: 12, padding: "6px 12px" }}
                      onClick={() => setEditingId(null)}
                    >
                      <Icon name="fa-times" size={11} /> বাতিল
                    </button>
                  </div>
                </div>
              ) : (
                /* Display mode */
                <div style={{ display: "flex", gap: 20, marginTop: 8, paddingLeft: 14 }}>
                  <div>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 2 }}>
                      <Icon name="fa-calendar" size={9} /> মাসিক
                    </span>
                    <div style={{ fontSize: 16, fontWeight: 700, color: g.color }}>
                      {Number(g.monthlyFee) > 0 ? formatTaka(Number(g.monthlyFee)) : "—"}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 2 }}>
                      <Icon name="fa-user-plus" size={9} /> ভর্তি
                    </span>
                    <div style={{ fontSize: 16, fontWeight: 700, color: g.color }}>
                      {Number(g.admissionFee) > 0 ? formatTaka(Number(g.admissionFee)) : "—"}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Empty state when no groups */}
          {groups.length === 0 && (
            <div style={{
              gridColumn: "1 / -1", textAlign: "center", padding: "32px 16px",
              color: "rgba(255,255,255,0.35)", fontSize: 13,
            }}>
              <Icon name="fa-layer-group" size={24} style={{ color: "rgba(255,255,255,0.15)", marginBottom: 8, display: "block" }} />
              কোনো ফি গ্রুপ নেই। উপরের বাটনে ক্লিক করে গ্রুপ যোগ করুন।
            </div>
          )}
        </div>
      )}
    </div>
  );
}
