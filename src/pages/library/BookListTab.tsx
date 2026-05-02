import { useState } from "react";
import { BookRow, useAddBook, useUpdateBook, useDeleteBook } from "@/hooks/useBooks";
import { toBengaliNumber } from "@/lib/constants";
import Icon from "@/components/Icon";
import { toast } from "sonner";

interface Props {
  books: BookRow[];
  canWrite: boolean;
  canDelete: boolean;
}

const CATEGORIES = ["সাধারণ", "ইসলামিক", "তাফসীর", "হাদীস", "ফিকহ", "ইতিহাস", "বিজ্ঞান", "সাহিত্য", "আরবি", "বাংলা", "ইংরেজি", "অন্যান্য"];

export default function BookListTab({ books, canWrite, canDelete }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [form, setForm] = useState({ title: "", author: "", category: "সাধারণ", totalCopies: 1 });

  const addBookMut = useAddBook();
  const updateBookMut = useUpdateBook();
  const deleteBookMut = useDeleteBook();

  const filtered = books.filter((b) => {
    const matchSearch = !search || b.title.includes(search) || b.author.includes(search) || b.bookId.includes(search);
    const matchCat = !filterCategory || b.category === filterCategory;
    return matchSearch && matchCat;
  });

  const handleAdd = async () => {
    if (!form.title || !form.author) { toast.error("বইয়ের নাম ও লেখকের নাম দিন"); return; }
    await addBookMut.mutateAsync({ bookId: `BK-${Date.now()}`, title: form.title, author: form.author, category: form.category || "সাধারণ", totalCopies: form.totalCopies, availableCopies: form.totalCopies });
    toast.success("নতুন বই যোগ হয়েছে");
    setForm({ title: "", author: "", category: "সাধারণ", totalCopies: 1 });
    setShowAdd(false);
  };

  const handleEdit = (book: BookRow) => {
    setEditId(book.id);
    setForm({ title: book.title, author: book.author, category: book.category, totalCopies: book.totalCopies });
  };

  const handleSaveEdit = async (book: BookRow) => {
    if (!form.title || !form.author) { toast.error("বইয়ের নাম ও লেখকের নাম দিন"); return; }
    const copyDiff = form.totalCopies - book.totalCopies;
    await updateBookMut.mutateAsync({
      bookId: book.bookId,
      title: form.title,
      author: form.author,
      category: form.category,
      totalCopies: form.totalCopies,
      availableCopies: Math.max(0, book.availableCopies + copyDiff),
    });
    toast.success("বই আপডেট হয়েছে");
    setEditId(null);
    setForm({ title: "", author: "", category: "সাধারণ", totalCopies: 1 });
  };

  const handleDelete = async (book: BookRow) => {
    if (!confirm(`"${book.title}" মুছে ফেলতে চান?`)) return;
    await deleteBookMut.mutateAsync(book.id);
    toast.success("বই মুছে ফেলা হয়েছে");
  };

  return (
    <>
      {/* Actions bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 200px" }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}>
            <Icon name="fa-search" size={14} style={{ color: "rgba(255,255,255,0.4)" }} />
          </span>
          <input className="glass-input" style={{ paddingLeft: 40, width: "100%" }} placeholder="বই সার্চ করুন..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="glass-select" style={{ minWidth: 140 }} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="">সকল ক্যাটাগরি</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {canWrite && (
          <button className="btn-gold" onClick={() => { setShowAdd(!showAdd); setEditId(null); }}>
            <Icon name="fa-plus" /> নতুন বই
          </button>
        )}
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="content-box" style={{ animation: "fadeInUp 0.3s ease", marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#d4af37", marginBottom: 16 }}>নতুন বই যোগ করুন</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 16 }}>
            <input className="glass-input" placeholder="বইয়ের নাম *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <input className="glass-input" placeholder="লেখক *" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
            <select className="glass-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="number" className="glass-input" placeholder="কপি সংখ্যা" min={1} value={form.totalCopies} onChange={(e) => setForm({ ...form, totalCopies: Number(e.target.value) })} />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button className="btn-gold" onClick={handleAdd} disabled={addBookMut.isPending}>
              <Icon name="fa-save" /> যোগ করুন
            </button>
            <button className="btn-outline-gold" onClick={() => setShowAdd(false)}>বাতিল</button>
          </div>
        </div>
      )}

      {/* Book table */}
      <div className="content-box" style={{ padding: 0 }}>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>আইডি</th>
                <th>বইয়ের নাম</th>
                <th>লেখক</th>
                <th>ক্যাটাগরি</th>
                <th>মোট কপি</th>
                <th>প্রাপ্ত</th>
                <th>ইস্যুকৃত</th>
                {canWrite && <th style={{ textAlign: "center" }}>একশন</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={canWrite ? 8 : 7} style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.4)" }}>কোনো বই পাওয়া যায়নি</td></tr>
              ) : filtered.map((b) => {
                const isEditing = editId === b.id;
                const issued = b.totalCopies - b.availableCopies;
                return (
                  <tr key={b.id}>
                    <td style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>{b.bookId}</td>
                    <td>{isEditing ? <input className="glass-input" style={{ padding: "4px 8px", fontSize: 13 }} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /> : <span style={{ fontWeight: 600 }}>{b.title}</span>}</td>
                    <td>{isEditing ? <input className="glass-input" style={{ padding: "4px 8px", fontSize: 13 }} value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} /> : b.author}</td>
                    <td>{isEditing ? (
                      <select className="glass-select" style={{ padding: "4px 8px", fontSize: 13 }} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    ) : <span style={{ color: "rgba(255,255,255,0.5)" }}>{b.category}</span>}</td>
                    <td>{isEditing ? <input type="number" className="glass-input" style={{ padding: "4px 8px", fontSize: 13, width: 70 }} min={1} value={form.totalCopies} onChange={(e) => setForm({ ...form, totalCopies: Number(e.target.value) })} /> : toBengaliNumber(b.totalCopies)}</td>
                    <td style={{ color: "#28a745", fontWeight: 600 }}>{toBengaliNumber(b.availableCopies)}</td>
                    <td style={{ color: "#fbbf24", fontWeight: 600 }}>{toBengaliNumber(issued)}</td>
                    {canWrite && (
                      <td style={{ textAlign: "center" }}>
                        {isEditing ? (
                          <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                            <button className="btn-gold" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => handleSaveEdit(b)}>
                              <Icon name="fa-save" /> সংরক্ষণ
                            </button>
                            <button className="btn-outline-gold" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => setEditId(null)}>বাতিল</button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                            <button className="btn-outline-gold" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => handleEdit(b)}>
                              <Icon name="fa-edit" />
                            </button>
                            {canDelete && (
                              <button className="btn-outline-gold" style={{ padding: "4px 10px", fontSize: 12, color: "#ef4444", borderColor: "rgba(239,68,68,0.3)" }} onClick={() => handleDelete(b)}>
                                <Icon name="fa-trash" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: 8, fontSize: 12, color: "rgba(255,255,255,0.4)", textAlign: "left" }}>
        মোট: {toBengaliNumber(filtered.length)} টি বই
      </div>
    </>
  );
}
