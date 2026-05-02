import { useBooks } from "@/hooks/useBooks";
import { useStudents } from "@/hooks/useStudents";
import { useBookIssues } from "@/hooks/useBookIssues";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Icon from "@/components/Icon";
import { useUserRole } from "@/hooks/useUserRole";
import LibraryStatsCards from "./library/LibraryStatsCards";
import BookListTab from "./library/BookListTab";
import BookIssueTab from "./library/BookIssueTab";
import BookReturnTab from "./library/BookReturnTab";
import BorrowingHistoryTab from "./library/BorrowingHistoryTab";

const TABS = [
  { id: "stats", label: "ড্যাশবোর্ড", icon: "fa-chart-bar" },
  { id: "list", label: "বই তালিকা", icon: "fa-book" },
  { id: "issue", label: "বই ইস্যু", icon: "fa-share" },
  { id: "return", label: "বই জমা", icon: "fa-undo" },
  { id: "history", label: "ঋণ ইতিহাস", icon: "fa-history" },
];

export default function LibraryPage() {
  const { data: books = [], isLoading: booksLoading } = useBooks();
  const { data: students = [], isLoading: studentsLoading } = useStudents();
  const { data: bookIssues = [], isLoading: issuesLoading } = useBookIssues();
  const { canWrite, canDelete } = useUserRole();

  const [activeTab, setActiveTab] = useState("stats");

  if (booksLoading || studentsLoading || issuesLoading) {
    return (
      <div>
        <div className="page-header">
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#d4af37" }}>
            <Icon name="fa-book-reader" style={{ marginLeft: 8 }} /> লাইব্রেরি
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24" style={{ borderRadius: 10 }} />
          ))}
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14" style={{ borderRadius: 10, marginBottom: 12 }} />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#d4af37" }}>
          <Icon name="fa-book-reader" style={{ marginLeft: 8 }} /> লাইব্রেরি
        </h2>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, marginTop: 4 }}>
          বই ব্যবস্থাপনা, ইস্যু, জমা ও ঋণ ইতিহাস
        </p>
      </div>

      {/* Stats always visible */}
      <LibraryStatsCards books={books} issues={bookIssues} />

      {/* Tab navigation */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={activeTab === tab.id ? "btn-gold" : "btn-outline-gold"}
            onClick={() => setActiveTab(tab.id)}
          >
            <Icon name={tab.icon} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "stats" && (
        <div>
          {/* Quick overview panels */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {/* Recent issues */}
            <div className="content-box">
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#d4af37", marginBottom: 12 }}>
                <Icon name="fa-clock" /> সাম্প্রতিক ইস্যু
              </h3>
              {bookIssues.filter((i) => i.status === "issued").slice(0, 5).length === 0 ? (
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>কোনো সাম্প্রতিক ইস্যু নেই</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {bookIssues.filter((i) => i.status === "issued").slice(0, 5).map((issue) => {
                    const book = books.find((b) => b.id === issue.bookId);
                    const student = students.find((s) => s.student_id === issue.studentId);
                    return (
                      <div key={issue.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{book?.title || "—"}</div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{student?.name} • {issue.issueDate}</div>
                        </div>
                        {issue.dueDate && (
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>ফেরত: {issue.dueDate}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Overdue books */}
            <div className="content-box">
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#ef4444", marginBottom: 12 }}>
                <Icon name="fa-exclamation-triangle" /> ওভারডিউ বই
              </h3>
              {(() => {
                const overdueIssues = bookIssues.filter((i) => {
                  if (i.status !== "issued" || !i.dueDate) return false;
                  return new Date(i.dueDate) < new Date(new Date().toISOString().split("T")[0]);
                });
                if (overdueIssues.length === 0) {
                  return <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>কোনো ওভারডিউ বই নেই ✓</p>;
                }
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {overdueIssues.slice(0, 5).map((issue) => {
                      const book = books.find((b) => b.id === issue.bookId);
                      const student = students.find((s) => s.student_id === issue.studentId);
                      const diff = Math.floor((new Date().getTime() - new Date(issue.dueDate).getTime()) / 86400000);
                      return (
                        <div key={issue.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{book?.title || "—"}</div>
                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{student?.name} ({issue.studentId})</div>
                          </div>
                          <span className="badge-danger" style={{ fontSize: 10 }}>{diff} দিন</span>
                        </div>
                      );
                    })}
                    {overdueIssues.length > 5 && (
                      <button className="btn-outline-gold" style={{ fontSize: 12, marginTop: 4 }} onClick={() => setActiveTab("return")}>
                        আরও {overdueIssues.length - 5} টি দেখুন →
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Popular books */}
            <div className="content-box">
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#d4af37", marginBottom: 12 }}>
                <Icon name="fa-fire" /> জনপ্রিয় বই
              </h3>
              {(() => {
                const countMap = new Map<string, number>();
                for (const i of bookIssues) {
                  countMap.set(i.bookId, (countMap.get(i.bookId) || 0) + 1);
                }
                const sorted = Array.from(countMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
                if (sorted.length === 0) {
                  return <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>এখনও কোনো বই ইস্যু হয়নি</p>;
                }
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {sorted.map(([bookId, count], idx) => {
                      const book = books.find((b) => b.id === bookId);
                      return (
                        <div key={bookId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <span style={{ color: "#d4af37", fontWeight: 700, fontSize: 14, width: 20 }}>{idx + 1}.</span>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600 }}>{book?.title || "—"}</div>
                              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{book?.author}</div>
                            </div>
                          </div>
                          <span style={{ fontSize: 12, color: "#d4af37", fontWeight: 600 }}>{count} বার</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {activeTab === "list" && (
        <BookListTab books={books} canWrite={canWrite} canDelete={canDelete} />
      )}

      {activeTab === "issue" && (
        <BookIssueTab books={books} students={students} issues={bookIssues} canWrite={canWrite} />
      )}

      {activeTab === "return" && (
        <BookReturnTab books={books} students={students} issues={bookIssues} canWrite={canWrite} />
      )}

      {activeTab === "history" && (
        <BorrowingHistoryTab books={books} students={students} issues={bookIssues} />
      )}
    </div>
  );
}
