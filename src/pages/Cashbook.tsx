import { useTransactions, useUpdateTransaction, useDeleteTransaction, TransactionRow } from "@/hooks/useTransactions";
import { formatTaka } from "@/lib/constants";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Icon from "@/components/Icon";
import { useUserRole } from "@/hooks/useUserRole";

export default function Cashbook() {
  const { data: transactions = [], isLoading } = useTransactions();
  const updateTx = useUpdateTransaction();
  const deleteTx = useDeleteTransaction();
  const [activeTab, setActiveTab] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<TransactionRow | null>(null);
  const { canWrite, canDelete } = useUserRole();

  const filtered = transactions
    .filter((t) => { if (activeTab === "income") return t.type === "income"; if (activeTab === "expense") return t.type === "expense"; return true; })
    .filter((t) => !filterDate || t.date === filterDate)
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((a, t) => a + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((a, t) => a + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const startEdit = (t: TransactionRow) => { setEditingId(t.id); setEditData({ ...t }); };
  const cancelEdit = () => { setEditingId(null); setEditData(null); };
  const saveEdit = () => { if (editData) { updateTx.mutate({ id: editData.id, description: editData.description, category: editData.category, amount: editData.amount, date: editData.date }); cancelEdit(); } };
  const handleDelete = (id: string) => { if (confirm("এই লেনদেন ডিলিট করতে চান?")) deleteTx.mutate(id); };

  let runningBalance = 0;
  const tabs = [{ id: "all", label: "সকল লেনদেন" }, { id: "income", label: "দৈনিক আয়" }, { id: "expense", label: "দৈনিক খরচ" }];

  return (
    <div>
      <div className="page-header">
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#d4af37' }}><Icon name="fa-book" style={{ marginLeft: 8 }} /> ক্যাশবুক</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 4 }}>দৈনিক আয়-ব্যয়ের হিসাব</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
        <div className="content-box" style={{ textAlign: 'center', padding: 16, marginBottom: 0 }}><p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>মোট আয়</p><p style={{ fontSize: 22, fontWeight: 800, color: '#28a745' }}>{formatTaka(totalIncome)}</p></div>
        <div className="content-box" style={{ textAlign: 'center', padding: 16, marginBottom: 0 }}><p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>মোট খরচ</p><p style={{ fontSize: 22, fontWeight: 800, color: '#dc3545' }}>{formatTaka(totalExpense)}</p></div>
        <div className="content-box" style={{ textAlign: 'center', padding: 16, marginBottom: 0 }}><p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>বর্তমান ক্যাশ ব্যালেন্স</p><p style={{ fontSize: 22, fontWeight: 800, color: balance >= 0 ? '#d4af37' : '#dc3545' }}>{formatTaka(balance)}</p></div>
      </div>

      <div className="content-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {tabs.map((tab) => (<button key={tab.id} className={activeTab === tab.id ? 'btn-gold' : 'btn-outline-gold'} style={{ padding: '6px 16px', fontSize: 13 }} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>))}
        </div>
        <input type="date" className="glass-input" style={{ width: 'auto' }} value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
      </div>

      <div className="content-box" style={{ padding: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead><tr><th>তারিখ</th><th>বিবরণ</th><th>খাত</th><th>আয়</th><th>ব্যয়</th><th>ব্যালেন্স</th>{(canWrite || canDelete) && <th style={{ textAlign: 'center' }}>একশন</th>}</tr></thead>
            <tbody>
              {isLoading ? Array.from({ length: 4 }).map((_, i) => <tr key={i}><td colSpan={7}><Skeleton className="h-4" /></td></tr>) :
              filtered.length === 0 ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.4)' }}>কোনো লেনদেন পাওয়া যায়নি</td></tr> :
              [...filtered].reverse().map((t) => {
                runningBalance += t.type === "income" ? t.amount : -t.amount;
                return (
                  <tr key={t.id}>
                    {editingId === t.id && editData ? (<>
                      <td><input type="date" className="glass-input" value={editData.date} onChange={(e) => setEditData({ ...editData, date: e.target.value })} /></td>
                      <td><input className="glass-input" value={editData.description} onChange={(e) => setEditData({ ...editData, description: e.target.value })} /></td>
                      <td><input className="glass-input" value={editData.category} onChange={(e) => setEditData({ ...editData, category: e.target.value })} /></td>
                      <td><input type="number" className="glass-input" value={editData.amount} onChange={(e) => setEditData({ ...editData, amount: Number(e.target.value) })} /></td>
                      <td>—</td><td>—</td>
                      {(canWrite || canDelete) && <td style={{ textAlign: 'center' }}><div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}><button className="action-btn" onClick={saveEdit}><Icon name="fa-check" style={{ color: '#28a745' }} /></button><button className="action-btn" onClick={cancelEdit}><Icon name="fa-times" /></button></div></td>}
                    </>) : (<>
                      <td>{t.date}</td><td>{t.description}</td><td style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{t.category}</td>
                      <td style={{ color: '#28a745' }}>{t.type === "income" ? formatTaka(t.amount) : "-"}</td>
                      <td style={{ color: '#dc3545' }}>{t.type === "expense" ? formatTaka(t.amount) : "-"}</td>
                      <td style={{ fontWeight: 700, color: runningBalance >= 0 ? '#d4af37' : '#dc3545' }}>{formatTaka(runningBalance)}</td>
                      {(canWrite || canDelete) && <td style={{ textAlign: 'center' }}><div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>{canWrite && <button className="action-btn" onClick={() => startEdit(t)}><Icon name="fa-edit" /></button>}{canDelete && <button className="action-btn" onClick={() => handleDelete(t.id)}><Icon name="fa-trash" /></button>}</div></td>}
                    </>)}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
