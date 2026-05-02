import { useState } from "react";
import { BookRow, useUpdateBook } from "@/hooks/useBooks";
import { BookIssueRow, useReturnBookIssue, isOverdue, daysOverdue } from "@/hooks/useBookIssues";
import { StudentRow } from "@/hooks/useStudents";
import { toBengaliNumber } from "@/lib/constants";
import Icon from "@/components/Icon";
import { toast } from "sonner";

interface Props {
  books: BookRow[];
  students: StudentRow[];
  issues: BookIssueRow[];
  canWrite: boolean;
}

export default function BookReturnTab({ books, students, issues, canWrite }: Props) {
  const [search, setSearch] = useState("");
  const [filterOverdue, setFilterOverdue] = useState(false);
  const returnMut = useReturnBookIssue();
  const updateBookMut = useUpdateBook();

  const issuedBooks = issues.filter((i) => i.status === "issued");

  const filtered = issuedBooks.filter((i) => {
    if (filterOverdue && !isOverdue(i)) return false;
    if (!search) return true;
    const student = students.find((s) => s.student_id === i.studentId);
    const book = books.find((b) => b.id === i.bookId);
    return (
      student?.name.includes(search) ||
      student?.student_id.includes(search) ||
      book?.title.includes(search) ||
      book?.bookId.includes(search)
    );
  });

  const handleReturn = async (issue: BookIssueRow) => {
    const today = new Date().toISOString().split("T")[0];
    await returnMut.mutateAsync({ id: issue.id, returnDate: today });
    const book = books.find((b) => b.id === issue.bookId);
    if (book) {
      await updateBookMut.mutateAsync({ bookId: book.bookId, availableCopies: book.availableCopies + 1 });
    }
    toast.success("বই সফলভাবে জমা হয়েছে");
  };

  return (
    <>
      <div className="content-box" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: "1 1 200px" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}>
              <Icon name="fa-search" size={14} style={{ color: "rgba(255,255,255,0.4)" }} />
            </span>
            <input className="glass-input" style={{ paddingLeft: 40, width: "100%" }} placeholder="ছাত্র বা বই সার্চ করুন..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button
            className={filterOverdue ? "btn-gold" : "btn-outline-gold"}
            onClick={() => setFilterOverdue(!filterOverdue)}
            style={{ fontSize: 13 }}
          >
            <Icon name="fa-exclamation-triangle" /> ওভারডিউ ({toBengaliNumber(issuedBooks.filter(isOverdue).length)})
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="content-box" style={{ textAlign: "center", padding: 50 }}>
          <Icon name="fa-undo" size={32} style={{ color: "rgba(255,255,255,0.2)", display: "block", marginBottom: 12 }} />
          <p style={{ color: "rgba(255,255,255,0.4)" }}>
            {filterOverdue ? "কোনো ওভারডিউ বই নেই" : "কোনো ইস্যুকৃত বই নেই"}
          </p>
        </div>
      ) : (
        <div className="content-box" style={{ padding: 0 }}>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>বইয়ের নাম</th>
                  <th>ছাত্রের নাম</th>
                  <th>শ্রেণি</th>
                  <th>ইস্যু তারিখ</th>
                  <th>ফেরতের তারিখ</th>
                  <th style={{ textAlign: "center" }}>অবস্থা</th>
                  <th style={{ textAlign: "center" }}>একশন</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((issue) => {
                  const book = books.find((b) => b.id === issue.bookId);
                  const student = students.find((s) => s.student_id === issue.studentId);
                  const overdue = isOverdue(issue);
                  const days = daysOverdue(issue);
                  return (
                    <tr key={issue.id} style={overdue ? { background: "rgba(239,68,68,0.05)" } : undefined}>
                      <td style={{ fontWeight: 600 }}>{book?.title || "—"}</td>
                      <td>{student?.name || "—"} <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>({issue.studentId})</span></td>
                      <td style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>{student?.class_name || "—"}</td>
                      <td style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>{issue.issueDate || "—"}</td>
                      <td style={{ fontSize: 13 }}>
                        {issue.dueDate ? (
                          <span style={{ color: overdue ? "#ef4444" : "rgba(255,255,255,0.5)" }}>
                            {issue.dueDate}
                          </span>
                        ) : "—"}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {overdue ? (
                          <span className="badge-danger" style={{ fontSize: 11 }}>
                            ওভারডিউ ({toBengaliNumber(days)} দিন)
                          </span>
                        ) : (
                          <span className="badge-gold" style={{ fontSize: 11 }}>ইস্যুকৃত</span>
                        )}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {canWrite && (
                          <button
                            className="btn-outline-gold"
                            style={{ padding: "4px 12px", fontSize: 12 }}
                            onClick={() => handleReturn(issue)}
                            disabled={returnMut.isPending}
                          >
                            <Icon name="fa-undo" /> জমা নিন
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ marginTop: 8, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
        মোট ইস্যুকৃত: {toBengaliNumber(filtered.length)} টি
      </div>
    </>
  );
}
