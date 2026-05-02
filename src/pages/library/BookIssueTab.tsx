import { useState } from "react";
import { BookRow, useUpdateBook } from "@/hooks/useBooks";
import { BookIssueRow, useAddBookIssue } from "@/hooks/useBookIssues";
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

const DEFAULT_LOAN_DAYS = 14;

export default function BookIssueTab({ books, students, issues, canWrite }: Props) {
  const [issueBookId, setIssueBookId] = useState("");
  const [issueStudentId, setIssueStudentId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [bookSearch, setBookSearch] = useState("");
  const [loanDays, setLoanDays] = useState(DEFAULT_LOAN_DAYS);

  const addIssueMut = useAddBookIssue();
  const updateBookMut = useUpdateBook();

  const activeStudents = students.filter((s) => s.status === "active");
  const filteredStudents = studentSearch
    ? activeStudents.filter((s) => s.name.includes(studentSearch) || s.student_id.includes(studentSearch) || s.class_name.includes(studentSearch))
    : activeStudents;
  const availableBooks = books.filter((b) => b.availableCopies > 0);
  const filteredBooks = bookSearch
    ? availableBooks.filter((b) => b.title.includes(bookSearch) || b.bookId.includes(bookSearch) || b.author.includes(bookSearch))
    : availableBooks;

  // Student's currently issued books
  const studentIssuedBooks = issueStudentId
    ? issues.filter((i) => i.studentId === issueStudentId && i.status === "issued")
    : [];

  const handleIssue = async () => {
    if (!issueBookId || !issueStudentId) {
      toast.error("বই ও ছাত্র নির্বাচন করুন");
      return;
    }
    const book = books.find((b) => b.id === issueBookId);
    if (!book || book.availableCopies <= 0) {
      toast.error("বইটি প্রাপ্ত নেই");
      return;
    }
    const alreadyIssued = issues.some((i) => i.bookId === issueBookId && i.studentId === issueStudentId && i.status === "issued");
    if (alreadyIssued) {
      toast.error("এই ছাত্রকে ইতোমধ্যে এই বই ইস্যু করা হয়েছে");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const due = new Date(Date.now() + loanDays * 86400000).toISOString().split("T")[0];

    await addIssueMut.mutateAsync({ bookId: issueBookId, studentId: issueStudentId, issueDate: today, dueDate: due });
    await updateBookMut.mutateAsync({ bookId: book.bookId, availableCopies: book.availableCopies - 1 });
    toast.success("বই সফলভাবে ইস্যু করা হয়েছে");
    setIssueBookId("");
    setIssueStudentId("");
  };

  const studentName = issueStudentId ? students.find((s) => s.student_id === issueStudentId)?.name : null;

  return (
    <div className="content-box">
      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#d4af37", marginBottom: 16 }}>
        <Icon name="fa-share" /> বই ইস্যু করুন
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* Book selection */}
        <div>
          <label style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 6, display: "block" }}>
            বই নির্বাচন <span style={{ color: "#d4af37" }}>*</span>
          </label>
          <div style={{ position: "relative", marginBottom: 8 }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}>
              <Icon name="fa-search" size={14} style={{ color: "rgba(255,255,255,0.4)" }} />
            </span>
            <input className="glass-input" style={{ paddingLeft: 40 }} placeholder="বই সার্চ..." value={bookSearch} onChange={(e) => setBookSearch(e.target.value)} />
          </div>
          <select className="glass-select" value={issueBookId} onChange={(e) => setIssueBookId(e.target.value)}>
            <option value="">-- বই নির্বাচন --</option>
            {filteredBooks.map((b) => (
              <option key={b.id} value={b.id}>{b.title} — {b.author} (প্রাপ্ত: {toBengaliNumber(b.availableCopies)})</option>
            ))}
          </select>
        </div>

        {/* Student selection */}
        <div>
          <label style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 6, display: "block" }}>
            ছাত্র নির্বাচন <span style={{ color: "#d4af37" }}>*</span>
          </label>
          <div style={{ position: "relative", marginBottom: 8 }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}>
              <Icon name="fa-search" size={14} style={{ color: "rgba(255,255,255,0.4)" }} />
            </span>
            <input className="glass-input" style={{ paddingLeft: 40 }} placeholder="ছাত্র সার্চ..." value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} />
          </div>
          <select className="glass-select" value={issueStudentId} onChange={(e) => setIssueStudentId(e.target.value)}>
            <option value="">-- ছাত্র নির্বাচন --</option>
            {filteredStudents.map((s) => (
              <option key={s.id} value={s.student_id}>{s.name} ({s.student_id}) — {s.class_name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Loan days */}
      <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <div>
          <label style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 6, display: "block" }}>ঋণ সময়কাল (দিন)</label>
          <input type="number" className="glass-input" style={{ width: 100 }} min={1} max={90} value={loanDays} onChange={(e) => setLoanDays(Number(e.target.value))} />
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 20 }}>
          ফেরতের তারিখ: <span style={{ color: "#d4af37", fontWeight: 600 }}>{new Date(Date.now() + loanDays * 86400000).toLocaleDateString("bn-BD")}</span>
        </div>
      </div>

      {/* Student's active issues */}
      {studentName && studentIssuedBooks.length > 0 && (
        <div style={{ background: "rgba(251, 191, 36, 0.1)", border: "1px solid rgba(251, 191, 36, 0.2)", borderRadius: 8, padding: 12, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#fbbf24", marginBottom: 6 }}>
            <Icon name="fa-info-circle" /> {studentName} এর কাছে বর্তমানে {toBengaliNumber(studentIssuedBooks.length)} টি বই আছে
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
            {studentIssuedBooks.map((i) => {
              const bk = books.find((b) => b.id === i.bookId);
              return bk ? bk.title : "—";
            }).join(", ")}
          </div>
        </div>
      )}

      <button className="btn-gold" onClick={handleIssue} disabled={!canWrite || !issueBookId || !issueStudentId || addIssueMut.isPending}>
        <Icon name="fa-book-open" /> বই ইস্যু করুন
      </button>
    </div>
  );
}
