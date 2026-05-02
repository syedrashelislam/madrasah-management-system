import { useState, useMemo, useCallback } from "react";
import { useStudents } from "@/hooks/useStudents";
import { useClasses } from "@/hooks/useClasses";
import { useInstitutionInfo } from "@/hooks/useInstitutionInfo";
import { toBengaliNumber } from "@/lib/constants";
import { openWhatsAppMessage, openBulkWhatsAppMessages } from "@/lib/smsUtils";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import Icon from "@/components/Icon";

/* ── message templates ─────────────────────────────────── */
const MESSAGE_TEMPLATES = [
  {
    id: "general",
    label: "সাধারণ বিজ্ঞপ্তি",
    template:
      "আসসালামু আলাইকুম,\n\n{madrasa} থেকে জানানো যাচ্ছে:\n\n{message}\n\nধন্যবাদ।",
  },
  {
    id: "holiday",
    label: "ছুটির ঘোষণা",
    template:
      "আসসালামু আলাইকুম,\n\n{madrasa} থেকে জানানো যাচ্ছে যে, {message}\n\nসকল অভিভাবককে অবহিত করা হলো।\n\nধন্যবাদ।",
  },
  {
    id: "exam",
    label: "পরীক্ষার নোটিশ",
    template:
      "আসসালামু আলাইকুম,\n\n{madrasa} থেকে জানানো যাচ্ছে:\n\nসম্মানিত অভিভাবক, আপনার সন্তান {student} এর জন্য গুরুত্বপূর্ণ তথ্য:\n\n{message}\n\nধন্যবাদ।",
  },
  {
    id: "event",
    label: "ইভেন্ট / অনুষ্ঠান",
    template:
      "আসসালামু আলাইকুম,\n\n{madrasa} থেকে আমন্ত্রণ জানানো যাচ্ছে:\n\n{message}\n\nসকলের উপস্থিতি কামনা করছি।\n\nধন্যবাদ।",
  },
  {
    id: "custom",
    label: "কাস্টম মেসেজ",
    template: "{message}",
  },
];

interface StudentOption {
  id: string;
  student_id: string;
  name: string;
  class_name: string;
  class_id: number;
  guardian_name: string;
  guardian_whatsapp: string;
}

export default function WhatsAppMessaging() {
  const { data: students = [], isLoading } = useStudents();
  const { data: classes = [] } = useClasses();
  const institution = useInstitutionInfo();

  const [classFilter, setClassFilter] = useState<number | "">("");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [templateId, setTemplateId] = useState("general");
  const [messageBody, setMessageBody] = useState("");
  const [sending, setSending] = useState(false);

  /* ── eligible students (active + has whatsapp) ─────── */
  const eligible = useMemo<StudentOption[]>(() => {
    return students
      .filter((s) => s.status === "active" && (s.guardian_whatsapp || "").length >= 8)
      .map((s) => ({
        id: s.id,
        student_id: s.student_id,
        name: s.name,
        class_name: s.class_name,
        class_id: s.class_id,
        guardian_name: s.guardian_name || s.father_name || "",
        guardian_whatsapp: s.guardian_whatsapp || "",
      }));
  }, [students]);

  const filtered = useMemo(() => {
    return eligible
      .filter((s) => classFilter === "" || s.class_id === classFilter)
      .filter((s) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.student_id.toLowerCase().includes(q) ||
          s.guardian_name.toLowerCase().includes(q)
        );
      });
  }, [eligible, classFilter, search]);

  const allSelected = filtered.length > 0 && filtered.every((s) => selectedIds.has(s.id));
  const selectedStudents = filtered.filter((s) => selectedIds.has(s.id));

  const totalStudentsWithWA = eligible.length;
  const totalStudentsActive = students.filter((s) => s.status === "active").length;
  const totalWithoutWA = totalStudentsActive - totalStudentsWithWA;

  /* ── toggle selection ──────────────────────────────── */
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((s) => next.delete(s.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((s) => next.add(s.id));
        return next;
      });
    }
  }, [allSelected, filtered]);

  /* ── compose final message ─────────────────────────── */
  const template = MESSAGE_TEMPLATES.find((t) => t.id === templateId) || MESSAGE_TEMPLATES[0];

  const composeFinalMessage = useCallback(
    (student: StudentOption): string => {
      return template.template
        .replace(/\{madrasa\}/g, institution.name)
        .replace(/\{student\}/g, student.name)
        .replace(/\{guardian\}/g, student.guardian_name)
        .replace(/\{class\}/g, student.class_name)
        .replace(/\{message\}/g, messageBody);
    },
    [template, institution.name, messageBody]
  );

  /* ── send handlers ─────────────────────────────────── */
  const handleSendSingle = useCallback(
    (student: StudentOption) => {
      if (!messageBody.trim()) {
        toast.error("মেসেজ লিখুন");
        return;
      }
      const msg = composeFinalMessage(student);
      openWhatsAppMessage(student.guardian_whatsapp, msg);
      toast.success(`${student.guardian_name || student.name} কে WhatsApp মেসেজ পাঠানো হচ্ছে...`);
    },
    [messageBody, composeFinalMessage]
  );

  const handleBulkSend = useCallback(() => {
    if (selectedStudents.length === 0) {
      toast.error("অন্তত একজন ছাত্র সিলেক্ট করুন");
      return;
    }
    if (!messageBody.trim()) {
      toast.error("মেসেজ লিখুন");
      return;
    }
    const count = selectedStudents.length;
    if (!window.confirm(`${toBengaliNumber(count)} জন অভিভাবককে WhatsApp মেসেজ পাঠাতে চান?`)) return;

    setSending(true);
    const recipients = selectedStudents.map((s) => ({
      phone: s.guardian_whatsapp,
      message: composeFinalMessage(s),
    }));
    openBulkWhatsAppMessages(recipients);
    toast.success(`${toBengaliNumber(count)} টি WhatsApp লিংক ওপেন হচ্ছে...`);
    setTimeout(() => setSending(false), count * 600 + 500);
  }, [selectedStudents, messageBody, composeFinalMessage]);

  /* ── preview message ───────────────────────────────── */
  const previewMessage = useMemo(() => {
    const dummy: StudentOption = {
      id: "",
      student_id: "S-001",
      name: "নমুনা ছাত্র",
      class_name: "হিফজ-১",
      class_id: 3,
      guardian_name: "নমুনা অভিভাবক",
      guardian_whatsapp: "01700000000",
    };
    return composeFinalMessage(dummy);
  }, [composeFinalMessage]);

  if (isLoading)
    return (
      <div style={{ padding: 20 }}>
        <Skeleton className="h-10 mb-4" style={{ borderRadius: 10 }} />
        <Skeleton className="h-64" style={{ borderRadius: 10 }} />
      </div>
    );

  return (
    <div className="page-transition">
      {/* Page Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "linear-gradient(135deg, #25D366, #128C7E)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="fa-whatsapp" size={22} style={{ color: "#fff" }} />
        </div>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: 0 }}>
            WhatsApp মেসেজিং
          </h2>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: "2px 0 0" }}>
            অভিভাবকদের সরাসরি WhatsApp মেসেজ পাঠান
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 12,
          marginBottom: 16,
        }}
      >
        {[
          { val: toBengaliNumber(totalStudentsActive), label: "মোট সক্রিয় ছাত্র", color: "#d4af37" },
          { val: toBengaliNumber(totalStudentsWithWA), label: "WhatsApp নম্বর আছে", color: "#25D366" },
          { val: toBengaliNumber(totalWithoutWA), label: "WhatsApp নম্বর নেই", color: "#dc3545" },
          {
            val: toBengaliNumber(selectedStudents.length),
            label: "সিলেক্ট করা",
            color: "#0ea5e9",
          },
        ].map((c, i) => (
          <div
            key={i}
            className="content-box"
            style={{ textAlign: "center", padding: 16, marginBottom: 0 }}
          >
            <p style={{ fontSize: 24, fontWeight: 800, color: c.color, margin: 0 }}>{c.val}</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: "4px 0 0" }}>
              {c.label}
            </p>
          </div>
        ))}
      </div>

      {/* Message Composer */}
      <div className="content-box" style={{ marginBottom: 16 }}>
        <h3
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "#d4af37",
            margin: "0 0 14px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Icon name="fa-pen" size={14} /> মেসেজ লিখুন
        </h3>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
          <div style={{ minWidth: 200, flex: 1 }}>
            <label
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.5)",
                display: "block",
                marginBottom: 4,
              }}
            >
              টেমপ্লেট নির্বাচন করুন
            </label>
            <select
              className="glass-select"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
            >
              {MESSAGE_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.5)",
              display: "block",
              marginBottom: 4,
            }}
          >
            মেসেজের বিষয়বস্তু <span style={{ color: "#dc3545" }}>*</span>
          </label>
          <textarea
            className="glass-input"
            rows={4}
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            placeholder="এখানে আপনার মেসেজ লিখুন... (যেমন: আগামীকাল বৃহস্পতিবার মাদ্রাসা বন্ধ থাকবে)"
            style={{ resize: "vertical", minHeight: 90 }}
          />
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "4px 0 0" }}>
            ভেরিয়েবল:{" "}
            <code style={{ color: "#25D366" }}>{"{madrasa}"}</code>,{" "}
            <code style={{ color: "#25D366" }}>{"{student}"}</code>,{" "}
            <code style={{ color: "#25D366" }}>{"{guardian}"}</code>,{" "}
            <code style={{ color: "#25D366" }}>{"{class}"}</code>,{" "}
            <code style={{ color: "#25D366" }}>{"{message}"}</code>
          </p>
        </div>

        {/* Preview */}
        {messageBody.trim() && (
          <div
            style={{
              background: "rgba(37, 211, 102, 0.06)",
              border: "1px solid rgba(37, 211, 102, 0.2)",
              borderRadius: 10,
              padding: 14,
            }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#25D366",
                margin: "0 0 6px",
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              <Icon name="fa-eye" size={11} /> প্রিভিউ
            </p>
            <p
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.7)",
                margin: 0,
                whiteSpace: "pre-wrap",
                lineHeight: 1.6,
              }}
            >
              {previewMessage}
            </p>
          </div>
        )}
      </div>

      {/* Filters + Bulk Actions */}
      <div className="content-box" style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", flex: 1 }}>
            <div style={{ minWidth: 160 }}>
              <label
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.5)",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                শ্রেণি ফিল্টার
              </label>
              <select
                className="glass-select"
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value ? Number(e.target.value) : "")}
              >
                <option value="">সকল শ্রেণি</option>
                {classes.map((c) => (
                  <option key={c.class_id} value={c.class_id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ minWidth: 200, flex: 1 }}>
              <label
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.5)",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                নাম/আইডি সার্চ
              </label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                  }}
                >
                  <Icon name="fa-search" size={13} style={{ color: "rgba(255,255,255,0.35)" }} />
                </span>
                <input
                  className="glass-input"
                  style={{ paddingLeft: 36 }}
                  placeholder="সার্চ করুন..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              className="btn-gold"
              style={{
                background: allSelected ? "rgba(255,255,255,0.1)" : "#0ea5e9",
                borderColor: allSelected ? "rgba(255,255,255,0.2)" : "#0ea5e9",
                fontSize: 13,
                whiteSpace: "nowrap",
              }}
              onClick={toggleAll}
            >
              <Icon name={allSelected ? "fa-times" : "fa-check-double"} size={13} />{" "}
              {allSelected ? "সিলেকশন বাতিল" : "সবাই সিলেক্ট"}
            </button>
            <button
              className="btn-gold"
              style={{
                background: "#25D366",
                borderColor: "#25D366",
                fontSize: 13,
                whiteSpace: "nowrap",
                opacity: sending || selectedStudents.length === 0 || !messageBody.trim() ? 0.5 : 1,
              }}
              onClick={handleBulkSend}
              disabled={sending || selectedStudents.length === 0 || !messageBody.trim()}
            >
              <Icon name="fa-paper-plane" size={13} />{" "}
              {sending
                ? "পাঠানো হচ্ছে..."
                : `সকলকে পাঠান (${toBengaliNumber(selectedStudents.length)})`}
            </button>
          </div>
        </div>
      </div>

      {/* Student List */}
      {filtered.length === 0 ? (
        <div className="content-box" style={{ textAlign: "center", padding: 48 }}>
          <Icon
            name="fa-exclamation-circle"
            size={32}
            style={{ color: "rgba(255,255,255,0.3)", marginBottom: 12 }}
          />
          <p style={{ fontSize: 16, fontWeight: 600, color: "rgba(255,255,255,0.5)", margin: "8px 0 4px" }}>
            কোনো ছাত্র পাওয়া যায়নি
          </p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", margin: 0 }}>
            WhatsApp নম্বর সহ সক্রিয় ছাত্র নেই বা ফিল্টারে কোনো ফলাফল নেই
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: 12,
          }}
        >
          {filtered.map((s) => {
            const isSelected = selectedIds.has(s.id);
            return (
              <div
                key={s.id}
                className="content-box"
                style={{
                  padding: 0,
                  marginBottom: 0,
                  overflow: "hidden",
                  border: isSelected ? "1px solid rgba(37,211,102,0.5)" : undefined,
                  transition: "border-color 0.2s",
                }}
              >
                <div
                  style={{
                    padding: "12px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    cursor: "pointer",
                  }}
                  onClick={() => toggleSelect(s.id)}
                >
                  {/* Checkbox */}
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      border: isSelected
                        ? "2px solid #25D366"
                        : "2px solid rgba(255,255,255,0.2)",
                      background: isSelected ? "#25D366" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transition: "all 0.2s",
                    }}
                  >
                    {isSelected && <Icon name="fa-check" size={12} style={{ color: "#fff" }} />}
                  </div>

                  {/* Student Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: 0 }}>
                      {s.name}
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: "rgba(255,255,255,0.45)",
                        margin: "2px 0 0",
                      }}
                    >
                      {s.student_id} • {s.class_name}
                    </p>
                    <div
                      style={{
                        fontSize: 12,
                        color: "rgba(255,255,255,0.5)",
                        margin: "4px 0 0",
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                      }}
                    >
                      {s.guardian_name && (
                        <span>
                          <Icon name="fa-user" size={10} style={{ color: "#d4af37" }} />{" "}
                          {s.guardian_name}
                        </span>
                      )}
                      <span>
                        <Icon name="fa-whatsapp" size={10} style={{ color: "#25D366" }} />{" "}
                        {s.guardian_whatsapp}
                      </span>
                    </div>
                  </div>

                  {/* Send individual */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSendSingle(s);
                    }}
                    disabled={!messageBody.trim()}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      border: "none",
                      background:
                        messageBody.trim() ? "#25D366" : "rgba(255,255,255,0.08)",
                      color: "#fff",
                      cursor: messageBody.trim() ? "pointer" : "not-allowed",
                      opacity: messageBody.trim() ? 1 : 0.4,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transition: "opacity 0.2s",
                    }}
                    title="পাঠান"
                  >
                    <Icon name="fa-paper-plane" size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
