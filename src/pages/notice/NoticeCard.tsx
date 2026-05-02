import { NoticeRow } from "@/hooks/useNotices";
import Icon from "@/components/Icon";

const TARGET_LABELS: Record<string, string> = {
  all: "সকল", students: "ছাত্রগণ", teachers: "শিক্ষকগণ", parents: "অভিভাবক", staff: "স্টাফ",
};

interface Props {
  notice: NoticeRow;
  expanded: boolean;
  onToggleExpand: () => void;
  canWrite: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
}

export default function NoticeCard({ notice: n, expanded, onToggleExpand, canWrite, canDelete, onEdit, onTogglePin, onDelete }: Props) {
  const isPinned = Number(n.pinned) > 0;
  const isUrgent = n.priority === "high";
  const isHtml = n.content.includes("<") && n.content.includes(">");

  // Strip HTML for preview
  const plainText = n.content.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
  const isLong = plainText.length > 150;

  return (
    <div
      className="content-box"
      style={{
        borderRight: isUrgent ? "3px solid #ef4444" : isPinned ? "3px solid #d4af37" : "3px solid transparent",
        transition: "all 0.2s",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        {/* Priority indicator */}
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0, marginTop: 2,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: isUrgent ? "rgba(239,68,68,0.12)" : "rgba(96,165,250,0.12)",
          color: isUrgent ? "#ef4444" : "#60a5fa",
        }}>
          <Icon name={isUrgent ? "fa-exclamation-triangle" : "fa-bell"} size={18} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.9)", margin: 0 }}>{n.title}</h3>
            {isPinned && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 600, background: "rgba(212,175,55,0.12)", color: "#d4af37" }}>
                <Icon name="fa-thumbtack" size={10} /> পিন
              </span>
            )}
            {isUrgent && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 600, background: "rgba(239,68,68,0.12)", color: "#ef4444" }}>
                জরুরি
              </span>
            )}
            {n.target !== "all" && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 600, background: "rgba(96,165,250,0.12)", color: "#60a5fa" }}>
                {TARGET_LABELS[n.target] || n.target}
              </span>
            )}
          </div>

          {/* Content body */}
          {isHtml ? (
            <div
              className="notice-content"
              style={{
                fontSize: 14, color: "rgba(255,255,255,0.6)", marginTop: 6, lineHeight: 1.7,
                maxHeight: expanded || !isLong ? "none" : 80, overflow: "hidden",
                direction: "rtl", textAlign: "right",
              }}
              dangerouslySetInnerHTML={{ __html: expanded || !isLong ? n.content : n.content }}
            />
          ) : (
            <p style={{
              fontSize: 14, color: "rgba(255,255,255,0.6)", marginTop: 6, lineHeight: 1.7,
              whiteSpace: "pre-wrap",
              maxHeight: expanded || !isLong ? "none" : 80, overflow: "hidden",
            }}>
              {expanded || !isLong ? n.content : plainText.slice(0, 150) + "..."}
            </p>
          )}

          {isLong && (
            <button
              onClick={onToggleExpand}
              style={{
                border: "none", background: "none", cursor: "pointer", fontSize: 12,
                color: "#d4af37", fontWeight: 600, padding: "4px 0", marginTop: 4,
              }}
            >
              {expanded ? "সংক্ষিপ্ত করুন ▲" : "আরও পড়ুন ▼"}
            </button>
          )}

          {/* Footer */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
              <Icon name="fa-calendar" size={11} /> {n.date || "—"}
            </span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
              <Icon name="fa-users" size={11} /> {TARGET_LABELS[n.target] || "সকল"}
            </span>
          </div>
        </div>

        {/* Actions */}
        {(canWrite || canDelete) && (
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            {canWrite && (
              <button className="action-btn" onClick={onTogglePin} title={isPinned ? "আনপিন" : "পিন"} style={{ color: isPinned ? "#d4af37" : undefined }}>
                <Icon name={isPinned ? "fa-pin-off" : "fa-thumbtack"} size={14} />
              </button>
            )}
            {canWrite && (
              <button className="action-btn" onClick={onEdit} title="সম্পাদনা">
                <Icon name="fa-edit" size={14} />
              </button>
            )}
            {canDelete && (
              <button className="action-btn" onClick={onDelete} title="মুছুন" style={{ color: "#ef4444" }}>
                <Icon name="fa-trash" size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
