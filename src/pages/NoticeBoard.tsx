import { useState, useMemo } from "react";
import { useNotices, useAddNotice, useUpdateNotice, useDeleteNotice, NoticeRow } from "@/hooks/useNotices";
import { Skeleton } from "@/components/ui/skeleton";
import Icon from "@/components/Icon";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import RichTextEditor from "@/components/RichTextEditor";
import NoticeCard from "./notice/NoticeCard";
import NoticeStats from "./notice/NoticeStats";

type FormState = { title: string; content: string; priority: string; pinned: number; target: string };
const emptyForm: FormState = { title: "", content: "", priority: "normal", pinned: 0, target: "all" };

export default function NoticeBoard() {
  const { canWrite, canDelete } = useUserRole();
  const { data: notices = [], isLoading } = useNotices();
  const addNotice = useAddNotice();
  const updateNotice = useUpdateNotice();
  const deleteNotice = useDeleteNotice();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<"" | "normal" | "high">("");
  const [targetFilter, setTargetFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return notices.filter((n) => {
      if (priorityFilter && n.priority !== priorityFilter) return false;
      if (targetFilter && n.target !== targetFilter) return false;
      if (!q) return true;
      return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
    });
  }, [notices, search, priorityFilter, targetFilter]);

  const handleOpenNew = () => { setEditId(null); setForm(emptyForm); setShowForm(true); };
  const handleCancel = () => { setShowForm(false); setEditId(null); setForm(emptyForm); };

  const handleEdit = (n: NoticeRow) => {
    setEditId(n.id);
    setForm({ title: n.title, content: n.content, priority: n.priority, pinned: Number(n.pinned) || 0, target: n.target });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = () => {
    if (!form.title.trim()) { toast.error("শিরোনাম দিন"); return; }
    if (!form.content.trim() || form.content === "<br>") { toast.error("বিবরণ দিন"); return; }
    const p = { title: form.title, content: form.content, date: new Date().toISOString().split("T")[0], priority: form.priority, pinned: form.pinned, target: form.target };
    if (editId) updateNotice.mutate({ id: editId, ...p }, { onSuccess: () => { toast.success("আপডেট হয়েছে"); handleCancel(); } });
    else addNotice.mutate(p, { onSuccess: () => { toast.success("প্রকাশিত হয়েছে"); handleCancel(); } });
  };

  const handleTogglePin = (n: NoticeRow) => {
    const v = Number(n.pinned) ? 0 : 1;
    updateNotice.mutate({ id: n.id, pinned: v }, { onSuccess: () => toast.success(v ? "পিন হয়েছে" : "আনপিন হয়েছে") });
  };

  const handleDelete = (id: string) => { if (confirm("মুছে ফেলতে চান?")) deleteNotice.mutate(id, { onSuccess: () => toast.success("মুছে ফেলা হয়েছে") }); };

  if (isLoading) return (
    <div>
      <div className="page-header"><h2 style={{ fontSize: 22, fontWeight: 700, color: "#d4af37" }}><Icon name="fa-bullhorn" style={{ marginLeft: 8 }} /> নোটিশ বোর্ড</h2></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>{[1,2,3,4].map(i => <Skeleton key={i} className="h-20" style={{ borderRadius: 10 }} />)}</div>
      {[1,2,3].map(i => <Skeleton key={i} className="h-28" style={{ borderRadius: 10, marginBottom: 12 }} />)}
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#d4af37" }}><Icon name="fa-bullhorn" style={{ marginLeft: 8 }} /> নোটিশ বোর্ড</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, marginTop: 4 }}>গুরুত্বপূর্ণ নোটিশ ও বিজ্ঞপ্তি</p>
        </div>
        {canWrite && <button className="btn-gold" onClick={handleOpenNew}><Icon name="fa-plus" /> নতুন নোটিশ</button>}
      </div>

      <NoticeStats notices={notices} />

      {/* Compose Form */}
      {showForm && canWrite && (
        <div className="content-box" style={{ animation: "fadeInUp 0.3s ease", marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#d4af37", marginBottom: 16 }}>
            <Icon name={editId ? "fa-edit" : "fa-plus"} /> {editId ? "নোটিশ সম্পাদনা" : "নতুন নোটিশ লিখুন"}
          </h3>
          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 6, display: "block" }}>শিরোনাম *</label>
              <input className="glass-input" placeholder="নোটিশের শিরোনাম" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={{ fontSize: 15, fontWeight: 600 }} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 6, display: "block" }}>বিবরণ *</label>
              <RichTextEditor key={editId || "new"} value={form.content} onChange={html => setForm({ ...form, content: html })} placeholder="নোটিশের বিবরণ এখানে লিখুন..." minHeight={180} />
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "end" }}>
              <div>
                <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 6, display: "block" }}>অগ্রাধিকার</label>
                <select className="glass-select" style={{ minWidth: 120 }} value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                  <option value="normal">সাধারণ</option><option value="high">জরুরি</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 6, display: "block" }}>প্রাপক</label>
                <select className="glass-select" style={{ minWidth: 130 }} value={form.target} onChange={e => setForm({ ...form, target: e.target.value })}>
                  <option value="all">সকল</option><option value="students">ছাত্রগণ</option><option value="teachers">শিক্ষকগণ</option><option value="parents">অভিভাবক</option><option value="staff">স্টাফ</option>
                </select>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
                <input type="checkbox" checked={form.pinned === 1} onChange={e => setForm({ ...form, pinned: e.target.checked ? 1 : 0 })} style={{ accentColor: "#d4af37" }} />
                <Icon name="fa-thumbtack" size={13} /> পিন করুন
              </label>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
              <button className="btn-gold" onClick={handleSubmit} disabled={addNotice.isPending || updateNotice.isPending}><Icon name="fa-paper-plane" /> {editId ? "আপডেট করুন" : "প্রকাশ করুন"}</button>
              <button className="btn-outline-gold" onClick={handleCancel}>বাতিল</button>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="content-box" style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
        <div style={{ position: "relative", flex: "1 1 200px" }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}><Icon name="fa-search" size={14} style={{ color: "rgba(255,255,255,0.4)" }} /></span>
          <input className="glass-input" style={{ paddingLeft: 40, width: "100%" }} placeholder="নোটিশ খুঁজুন..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="glass-select" style={{ minWidth: 120 }} value={priorityFilter} onChange={e => setPriorityFilter(e.target.value as any)}>
          <option value="">সকল অগ্রাধিকার</option><option value="normal">সাধারণ</option><option value="high">জরুরি</option>
        </select>
        <select className="glass-select" style={{ minWidth: 120 }} value={targetFilter} onChange={e => setTargetFilter(e.target.value)}>
          <option value="">সকল প্রাপক</option><option value="all">সকল</option><option value="students">ছাত্রগণ</option><option value="teachers">শিক্ষকগণ</option><option value="parents">অভিভাবক</option><option value="staff">স্টাফ</option>
        </select>
      </div>

      {/* Notices */}
      {filtered.length === 0 ? (
        <div className="content-box" style={{ textAlign: "center", padding: 60 }}>
          <Icon name="fa-bullhorn" size={36} style={{ color: "rgba(255,255,255,0.15)", display: "block", marginBottom: 14 }} />
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 15 }}>{search || priorityFilter || targetFilter ? "কোনো নোটিশ পাওয়া যায়নি" : "কোনো নোটিশ নেই"}</p>
          {canWrite && !search && !priorityFilter && !targetFilter && <button className="btn-gold" style={{ marginTop: 16 }} onClick={handleOpenNew}><Icon name="fa-plus" /> প্রথম নোটিশ লিখুন</button>}
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {filtered.map(n => <NoticeCard key={n.id} notice={n} expanded={expandedId === n.id} onToggleExpand={() => setExpandedId(expandedId === n.id ? null : n.id)} canWrite={canWrite} canDelete={canDelete} onEdit={() => handleEdit(n)} onTogglePin={() => handleTogglePin(n)} onDelete={() => handleDelete(n.id)} />)}
        </div>
      )}
      <div style={{ marginTop: 12, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>মোট: {filtered.length} টি নোটিশ</div>
    </div>
  );
}
