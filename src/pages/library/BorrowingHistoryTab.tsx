import { useState, useMemo } from "react";
import { BookRow } from "@/hooks/useBooks";
import { BookIssueRow, isOverdue, daysOverdue } from "@/hooks/useBookIssues";
import { StudentRow } from "@/hooks/useStudents";
import { toBengaliNumber } from "@/lib/constants";
import Icon from "@/components/Icon";

interface Props {
  books: BookRow[];
  students: StudentRow[];
  issues: BookIssueRow[];
}

type ViewMode = "all" | "student";

export default function BorrowingHistoryTab({ books, students, issues }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "issued" | "returned">("");
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [selectedStudentId, setSelectedStudentId] = useState("");

  // Unique borrowers
  const borrowers = useMemo(() => {
    const map = new Map<string, { studentId: string; name: string; className: string; totalBorrowed: number; currentlyIssued: number; overdue: number }>();
    for (const issue of issues) {
      const student = students.find((s) => s.student_id === issue.studentId);
      if (!student) continue;
      const existing = map.get(issue.studentId);
      if (existing) {
        existing.totalBorrowed++;
        if (issue.status === "issued") existing.currentlyIssued++;
        if (isOverdue(issue)) existing.overdue++;
      } else {
        map.set(issue.studentId, {
          studentId: issue.studentId,
          name: student.name,
          className: student.class_name,
          totalBorrowed: 1,
          currentlyIssued: issue.status === "issued" ? 1 : 0,
          overdue: isOverdue(issue) ? 1 : 0,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.totalBorrowed - a.totalBorrowed);
  }, [issues, students]);

  // Student-specific history
  const studentHistory = selectedStudentId
    ? issues.filter((i) => i.studentId === selectedStudentId).sort((a, b) => (b.issueDate || "").localeCompare(a.issueDate || ""))
    : [];

  // All history filtered
  const allHistory = useMemo(() => {
    return issues.filter((i) => {
      if (statusFilter && i.status !== statusFilter) return false;
      if (!search) return true;
      const student = students.find((s) => s.student_id === i.studentId);
      const book = books.find((b) => b.id === i.bookId);
      return (
        student?.name.includes(search) ||
        student?.student_id.includes(search) ||
        book?.title.includes(search) ||
        book?.author.includes(search)
      );
    });
  }, [issues, search, statusFilter, students, books]);

  return (
    <>
      {/* View toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button className={viewMode === "all" ? "btn-gold" : "btn-outline-gold"} onClick={() => { setViewMode("all"); setSelectedStudentId(""); }} style={{ fontSize: 13 }}>
          <Icon name="fa-history" /> সকল ইতিহাস
        </button>
        <button className={viewMode === "student" ? "btn-gold" : "btn-outline-gold"} onClick={() => setViewMode("student")} style={{ fontSize: 13 }}>
          <Icon name="fa-user" /> ছাত্র অনুযায়ী
        </button>
      </div>

      {viewMode === "all" && (
        <>
          {/* Filters */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: "1 1 200px" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}>
                <Icon name="fa-search" size={14} style={{ color: "rgba(255,255,255,0.4)" }} />
              </span>
              <input className="glass-input" style={{ paddingLeft: 40, width: "100%" }} placeholder="সার্চ করুন..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="glass-select" style={{ minWidth: 130 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
              <option value="">সকল অবস্থা</option>
              <option value="issued">ইস্যুকৃত</option>
              <option value="returned">জমা হয়েছে</option>
            </select>
          </div>

          {/* All history table */}
          <div className="content-box" style={{ padding: 0 }}>
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>বই</th>
                    <th>লেখক</th>
                    <th>ছাত্র</th>
                    <th>শ্রেণি</th>
                    <th>ইস্যু তারিখ</th>
                    <th>ফেরত তারিখ</th>
                    <th>জমা তারিখ</th>
                    <th style={{ textAlign: "center" }}>অবস্থা</th>
                  </tr>
                </thead>
                <tbody>
                  {allHistory.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.4)" }}>কোনো ইতিহাস নেই</td></tr>
                  ) : allHistory.map((issue) => {
                    const book = books.find((b) => b.id === issue.bookId);
                    const student = students.find((s) => s.student_id === issue.studentId);
                    const overdue = isOverdue(issue);
                    const days = daysOverdue(issue);
                    return (
                      <tr key={issue.id}>
                        <td style={{ fontWeight: 600 }}>{book?.title || "—"}</td>
                        <td style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>{book?.author || "—"}</td>
                        <td>{student?.name || "—"}</td>
                        <td style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>{student?.class_name || "—"}</td>
                        <td style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>{issue.issueDate || "—"}</td>
                        <td style={{ color: overdue ? "#ef4444" : "rgba(255,255,255,0.5)", fontSize: 13 }}>{issue.dueDate || "—"}</td>
                        <td style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>{issue.returnDate || "—"}</td>
                        <td style={{ textAlign: "center" }}>
                          {issue.status === "returned" ? (
                            <span className="badge-success">জমা হয়েছে</span>
                          ) : overdue ? (
                            <span className="badge-danger">ওভারডিউ ({toBengaliNumber(days)} দিন)</span>
                          ) : (
                            <span className="badge-gold">ইস্যুকৃত</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
            মোট: {toBengaliNumber(allHistory.length)} টি রেকর্ড
          </div>
        </>
      )}

      {viewMode === "student" && !selectedStudentId && (
        <>
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 12 }}>ছাত্র অনুযায়ী ঋণ গ্রহণের সারাংশ:</p>
          </div>
          {borrowers.length === 0 ? (
            <div className="content-box" style={{ textAlign: "center", padding: 40 }}>
              <Icon name="fa-users" size={28} style={{ color: "rgba(255,255,255,0.2)", display: "block", marginBottom: 10 }} />
              <p style={{ color: "rgba(255,255,255,0.4)" }}>কোনো ঋণ গ্রহণকারী নেই</p>
            </div>
          ) : (
            <div className="content-box" style={{ padding: 0 }}>
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ছাত্রের নাম</th>
                      <th>আইডি</th>
                      <th>শ্রেণি</th>
                      <th>মোট ঋণ</th>
                      <th>বর্তমান ইস্যু</th>
                      <th>ওভারডিউ</th>
                      <th style={{ textAlign: "center" }}>বিস্তারিত</th>
                    </tr>
                  </thead>
                  <tbody>
                    {borrowers.map((b) => (
                      <tr key={b.studentId}>
                        <td style={{ fontWeight: 600 }}>{b.name}</td>
                        <td style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>{b.studentId}</td>
                        <td style={{ fontSize: 13 }}>{b.className}</td>
                        <td>{toBengaliNumber(b.totalBorrowed)}</td>
                        <td style={{ color: "#fbbf24", fontWeight: 600 }}>{toBengaliNumber(b.currentlyIssued)}</td>
                        <td style={{ color: b.overdue > 0 ? "#ef4444" : "rgba(255,255,255,0.5)", fontWeight: b.overdue > 0 ? 600 : 400 }}>{toBengaliNumber(b.overdue)}</td>
                        <td style={{ textAlign: "center" }}>
                          <button className="btn-outline-gold" style={{ padding: "4px 12px", fontSize: 12 }} onClick={() => setSelectedStudentId(b.studentId)}>
                            <Icon name="fa-eye" /> দেখুন
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {viewMode === "student" && selectedStudentId && (
        <>
          <button className="btn-outline-gold" style={{ marginBottom: 12, fontSize: 13 }} onClick={() => setSelectedStudentId("")}>
            <Icon name="fa-arrow-left" /> ফিরে যান
          </button>
          {(() => {
            const student = students.find((s) => s.student_id === selectedStudentId);
            const currentIssued = studentHistory.filter((i) => i.status === "issued").length;
            const overdueCount = studentHistory.filter(isOverdue).length;
            return (
              <div className="content-box" style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#d4af37" }}>{student?.name || "—"}</div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{selectedStudentId} | {student?.class_name}</div>
                  </div>
                  <div style={{ display: "flex", gap: 16 }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 20, fontWeight: 700 }}>{toBengaliNumber(studentHistory.length)}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>মোট ঋণ</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: "#fbbf24" }}>{toBengaliNumber(currentIssued)}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>বর্তমান</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: overdueCount > 0 ? "#ef4444" : "rgba(255,255,255,0.5)" }}>{toBengaliNumber(overdueCount)}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>ওভারডিউ</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
          <div className="content-box" style={{ padding: 0 }}>
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>বই</th>
                    <th>লেখক</th>
                    <th>ইস্যু তারিখ</th>
                    <th>ফেরত তারিখ</th>
                    <th>জমা তারিখ</th>
                    <th style={{ textAlign: "center" }}>অবস্থা</th>
                  </tr>
                </thead>
                <tbody>
                  {studentHistory.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.4)" }}>কোনো ইতিহাস নেই</td></tr>
                  ) : studentHistory.map((issue) => {
                    const book = books.find((b) => b.id === issue.bookId);
                    const overdue = isOverdue(issue);
                    const days = daysOverdue(issue);
                    return (
                      <tr key={issue.id}>
                        <td style={{ fontWeight: 600 }}>{book?.title || "—"}</td>
                        <td style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>{book?.author || "—"}</td>
                        <td style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>{issue.issueDate || "—"}</td>
                        <td style={{ color: overdue ? "#ef4444" : "rgba(255,255,255,0.5)", fontSize: 13 }}>{issue.dueDate || "—"}</td>
                        <td style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>{issue.returnDate || "—"}</td>
                        <td style={{ textAlign: "center" }}>
                          {issue.status === "returned" ? (
                            <span className="badge-success">জমা হয়েছে</span>
                          ) : overdue ? (
                            <span className="badge-danger">ওভারডিউ ({toBengaliNumber(days)} দিন)</span>
                          ) : (
                            <span className="badge-gold">ইস্যুকৃত</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}
