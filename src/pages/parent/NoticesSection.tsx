import { useMemo } from "react";
import Icon from "@/components/Icon";
import type { NoticeRow } from "@/hooks/useNotices";

interface Props {
  className: string;
  notices: NoticeRow[];
}

export default function NoticesSection({ className, notices }: Props) {
  const filteredNotices = useMemo(() => {
    return notices.filter((n) => {
      const target = (n.target || "all").toLowerCase();
      return target === "all" || target === className.toLowerCase();
    });
  }, [notices, className]);

  // Pinned first
  const sorted = useMemo(() => {
    return [...filteredNotices].sort((a, b) => {
      const pa = Number(a.pinned) || 0;
      const pb = Number(b.pinned) || 0;
      if (pb !== pa) return pb - pa;
      return (b.date || "").localeCompare(a.date || "");
    });
  }, [filteredNotices]);

  return (
    <div className="content-box">
      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#d4af37", marginBottom: 16 }}>
        <Icon name="fa-bullhorn" /> নোটিশ
      </h3>

      {sorted.length === 0 ? (
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", textAlign: "center", padding: 20 }}>
          <Icon name="fa-info-circle" /> কোনো নোটিশ পাওয়া যায়নি
        </p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {sorted.map((n) => {
            const isPinned = Number(n.pinned) > 0;
            const isHigh = n.priority === "high";
            return (
              <div
                key={n.id}
                style={{
                  padding: "12px 16px",
                  borderRadius: 10,
                  background: isPinned ? "rgba(212,175,55,0.08)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${isPinned ? "rgba(212,175,55,0.2)" : "rgba(255,255,255,0.06)"}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  {isPinned && <Icon name="fa-thumbtack" size={11} style={{ color: "#d4af37" }} />}
                  <span
                    style={{
                      width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                      background: isHigh ? "#dc3545" : "#60a5fa",
                    }}
                  />
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: "#f8f9fa", flex: 1 }}>{n.title}</h4>
                  {isHigh && (
                    <span style={{ background: "rgba(220,53,69,0.15)", color: "#f87171", padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 600 }}>
                      জরুরি
                    </span>
                  )}
                </div>
                {n.content && (
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, marginBottom: 6 }}>
                    {n.content}
                  </p>
                )}
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                  <Icon name="fa-calendar-alt" size={10} /> {n.date}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
