import { useState } from "react";
import { useTransactions, useAddTransaction, useUpdateTransaction, useDeleteTransaction, TransactionRow } from "@/hooks/useTransactions";
import { EXPENSE_CATEGORIES, formatTaka, toBengaliNumber } from "@/lib/constants";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import Icon from "@/components/Icon";
import { useUserRole } from "@/hooks/useUserRole";

export default function ExpenseManagement() {
  const { canWrite, canDelete, isMember } = useUserRole();
  const { data: transactions = [], isLoading } = useTransactions();
  const addTx = useAddTransaction();
  const updateTx = useUpdateTransaction();
  const deleteTx = useDeleteTransaction();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: "", description: "", amount: 0, date: new Date().toISOString().split("T")[0] });
  const [filterCategory, setFilterCategory] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<TransactionRow | null>(null);

  const expenses = transactions.filter((t) => t.type === "expense");
  const filtered = filterCategory ? expenses.filter((e) => e.category === filterCategory) : expenses;
  const totalExpense = filtered.reduce((a, t) => a + t.amount, 0);
  const allCategories = EXPENSE_CATEGORIES.flatMap((g) => [...g.items]);

  const handleSubmit = () => {
    if (!form.category || !form.amount) { toast.error("সকল তথ্য পূরণ করুন"); return; }
    addTx.mutate({ type: "expense", category: form.category, description: form.description || form.category, amount: form.amount, date: form.date }, {
      onSuccess: () => { toast.success("খরচ সফলভাবে যোগ হয়েছে"); setForm({ category: "", description: "", amount: 0, date: new Date().toISOString().split("T")[0] }); setShowForm(false); }
    });
  };

  const startEdit = (t: TransactionRow) => { setEditingId(t.id); setEditData({ ...t }); };
  const cancelEdit = () => { setEditingId(null); setEditData(null); };
  const saveEdit = () => { if (editData) { updateTx.mutate({ id: editData.id, category: editData.category, description: editData.description, amount: editData.amount, date: editData.date }); cancelEdit(); } };
  const handleDelete = (id: string) => { if (confirm("এই লেনদেন ডিলিট করতে চান?")) deleteTx.mutate(id); };

  const groupedSummary = EXPENSE_CATEGORIES.map((group) => {
    const groupTotal = expenses.filter((e) => group.items.includes(e.category)).reduce((a, t) => a + t.amount, 0);
    return { group: group.group, total: groupTotal };
  }).filter((g) => g.total > 0);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#d4af37' }}><Icon name="fa-file-invoice-dollar" style={{ marginLeft: 8 }} /> খরচ ব্যবস্থাপনা</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 4 }}>সকল খরচের হিসাব পরিচালনা করুন</p>
        </div>
        {canWrite && <button className="btn-gold" onClick={() => setShowForm(!showForm)}><Icon name="fa-plus" /> নতুন খরচ</button>}
      </div>

      {showForm && (
        <div className="content-box" style={{ animation: 'fadeInUp 0.3s ease' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#d4af37', marginBottom: 16 }}>নতুন খরচ যোগ করুন</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
            <div><label style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 6, display: 'block' }}>খাত *</label><select className="glass-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}><option value="">-- খাত নির্বাচন --</option>{EXPENSE_CATEGORIES.map((group) => (<optgroup key={group.group} label={group.group}>{group.items.map((item) => <option key={item} value={item}>{item}</option>)}</optgroup>))}</select></div>
            <div><label style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 6, display: 'block' }}>বিবরণ</label><input className="glass-input" placeholder="বিবরণ লিখুন" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div><label style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 6, display: 'block' }}>পরিমাণ (৳) *</label><input type="number" className="glass-input" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} /></div>
            <div><label style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 6, display: 'block' }}>তারিখ</label><input type="date" className="glass-input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-gold" onClick={handleSubmit} disabled={addTx.isPending}><Icon name="fa-save" /> {addTx.isPending ? "জমা হচ্ছে..." : "জমা দিন"}</button>
            <button className="btn-outline-gold" onClick={() => setShowForm(false)}>বাতিল</button>
          </div>
        </div>
      )}

      {groupedSummary.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
          {groupedSummary.map((g) => (<div key={g.group} className="content-box" style={{ padding: 16, marginBottom: 0 }}><p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.group}</p><p style={{ fontSize: 16, fontWeight: 800, color: '#dc3545' }}>{formatTaka(g.total)}</p></div>))}
        </div>
      )}

      <div className="content-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="fa-arrow-down" style={{ color: '#dc3545' }} />
          <span style={{ fontSize: 14 }}>মোট খরচ: <strong style={{ color: '#dc3545' }}>{formatTaka(totalExpense)}</strong></span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>({toBengaliNumber(filtered.length)} টি)</span>
        </div>
        <select className="glass-select" style={{ width: 'auto', minWidth: 180 }} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="">সকল খাত</option>
          {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="content-box" style={{ padding: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead><tr><th>তারিখ</th><th>খাত</th><th>বিবরণ</th><th>পরিমাণ</th><th style={{ textAlign: 'center' }}>একশন</th></tr></thead>
            <tbody>
              {isLoading ? Array.from({ length: 4 }).map((_, i) => <tr key={i}><td colSpan={5}><Skeleton className="h-4" /></td></tr>) :
              filtered.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.4)' }}>কোনো খরচ পাওয়া যায়নি</td></tr> :
              filtered.map((t) => (
                <tr key={t.id}>
                  {editingId === t.id && editData ? (<>
                    <td><input type="date" className="glass-input" value={editData.date} onChange={(e) => setEditData({ ...editData, date: e.target.value })} /></td>
                    <td><select className="glass-select" value={editData.category} onChange={(e) => setEditData({ ...editData, category: e.target.value })}>{allCategories.map((c) => <option key={c} value={c}>{c}</option>)}</select></td>
                    <td><input className="glass-input" value={editData.description} onChange={(e) => setEditData({ ...editData, description: e.target.value })} /></td>
                    <td><input type="number" className="glass-input" value={editData.amount} onChange={(e) => setEditData({ ...editData, amount: Number(e.target.value) })} /></td>
                    <td style={{ textAlign: 'center' }}><div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}><button className="action-btn" onClick={saveEdit}><Icon name="fa-check" style={{ color: '#28a745' }} /></button><button className="action-btn" onClick={cancelEdit}><Icon name="fa-times" /></button></div></td>
                  </>) : (<>
                    <td>{t.date}</td><td><span className="badge-gold">{t.category}</span></td><td style={{ color: 'rgba(255,255,255,0.6)' }}>{t.description}</td>
                    <td style={{ fontWeight: 700, color: '#dc3545' }}>{formatTaka(t.amount)}</td>
                    <td style={{ textAlign: 'center' }}><div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>{canWrite && <button className="action-btn" onClick={() => startEdit(t)}><Icon name="fa-edit" /></button>}{canDelete && <button className="action-btn" onClick={() => handleDelete(t.id)}><Icon name="fa-trash" /></button>}</div></td>
                  </>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
