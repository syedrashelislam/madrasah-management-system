import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useStudents } from "@/hooks/useStudents";
import { useExams } from "@/hooks/useExams";
import { Skeleton } from "@/components/ui/skeleton";
import Icon from "@/components/Icon";
import CreateExamTab from "./exam/CreateExamTab";
import BulkMarkEntryTab from "./exam/BulkMarkEntryTab";
import ResultsTab from "./exam/ResultsTab";
import MeritListTab from "./exam/MeritListTab";

const TABS = [
  { id: "create", label: "পরীক্ষা তৈরি", icon: "fa-plus-circle" },
  { id: "marks", label: "নম্বর এন্ট্রি", icon: "fa-keyboard" },
  { id: "results", label: "ফলাফল", icon: "fa-file-alt" },
  { id: "merit", label: "মেধা তালিকা", icon: "fa-trophy" },
];

const EXAM_LINKS = [
  { path: "/exams",               icon: "fa-edit",           label: "নম্বর এন্ট্রি",   color: "#d4af37" },
  { path: "/teacher-grade-entry", icon: "fa-pen-fancy",      label: "গ্রেড এন্ট্রি",   color: "#3b82f6" },
  { path: "/exam-routine",        icon: "fa-calendar-alt",   label: "পরীক্ষার রুটিন",  color: "#10b981" },
  { path: "/admit-card",          icon: "fa-address-card",   label: "অ্যাডমিট কার্ড",  color: "#f59e0b" },
  { path: "/marksheet",           icon: "fa-scroll",         label: "মার্কশিট",        color: "#8b5cf6" },
];

export default function ExamManagement() {
  const { isLoading: studentsLoading } = useStudents();
  const { isLoading: examsLoading } = useExams();
  const [activeTab, setActiveTab] = useState("create");
  const navigate = useNavigate();
  const location = useLocation();

  if (studentsLoading || examsLoading) {
    return (
      <div>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16" style={{ borderRadius: 10, marginBottom: 12 }} />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#d4af37" }}>
          <Icon name="fa-file-alt" style={{ marginLeft: 8 }} /> পরীক্ষা ব্যবস্থাপনা
        </h2>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, marginTop: 4 }}>
          পরীক্ষা তৈরি, নম্বর এন্ট্রি ও ফলাফল ব্যবস্থাপনা
        </p>
      </div>

      {/* পরীক্ষা মডিউল দ্রুত নেভিগেশন */}
      <div style={{
        background: "rgba(212,175,55,0.05)",
        border: "1px solid rgba(212,175,55,0.15)",
        borderRadius: 14,
        padding: "12px 14px",
        marginBottom: 20,
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(212,175,55,0.6)", marginBottom: 10, letterSpacing: 1 }}>
          ⚡ পরীক্ষা মডিউল — দ্রুত যান
        </div>
        <div className="exam-nav-bar" style={{ marginBottom: 0 }}>
          {EXAM_LINKS.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <button
                key={link.path}
                className={"exam-nav-item" + (isActive ? " exam-nav-item--active" : "")}
                onClick={() => navigate(link.path)}
                style={isActive ? { borderColor: link.color, color: link.color, background: link.color + "14" } : {}}
              >
                <i className={"fas " + link.icon} style={{ fontSize: 18, color: isActive ? link.color : "rgba(255,255,255,0.45)" }} />
                <span>{link.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Bar */}
      <div className="exam-tab-bar">
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

      {activeTab === "create" && <CreateExamTab />}
      {activeTab === "marks" && <BulkMarkEntryTab />}
      {activeTab === "results" && <ResultsTab />}
      {activeTab === "merit" && <MeritListTab />}
    </div>
  );
}
