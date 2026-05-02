import Icon from "@/components/Icon";
import { formatTaka } from "@/lib/constants";
import type { StaffRow } from "@/hooks/useStaff";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const CONTRACT_LABELS: Record<string, string> = {
  permanent: "স্থায়ী",
  temporary: "অস্থায়ী",
  contractual: "চুক্তিভিত্তিক",
  contract: "চুক্তিভিত্তিক",
};

interface StaffProfileDialogProps {
  staff: StaffRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (staff: StaffRow) => void;
  onDelete?: (staff: StaffRow) => void;
  onShowNid: () => void;
}

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  color: "rgba(255,255,255,0.4)",
  marginBottom: 2,
};

const valueStyle: React.CSSProperties = { fontWeight: 600 };

const sectionHeader: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: "#d4af37",
  borderBottom: "1px solid rgba(212,175,55,0.2)",
  paddingBottom: 8,
  marginBottom: 10,
  marginTop: 8,
};

const boxProps = { className: "content-box", style: { padding: 12, marginBottom: 0 } as React.CSSProperties };

function InfoBox({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div {...boxProps}>
      <p style={labelStyle}>{label}</p>
      <div style={valueStyle}>{children}</div>
    </div>
  );
}

export default function StaffProfileDialog({ staff, open, onOpenChange, onEdit, onDelete, onShowNid }: StaffProfileDialogProps) {
  if (!staff) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl" style={{ maxHeight: "85vh", overflowY: "auto" }} />
      </Dialog>
    );
  }

  const photoUrl =
    staff.photo ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(staff.name)}`;

  const isContractual = staff.contract_type === "contractual" || staff.contract_type === "contract";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" style={{ maxHeight: "85vh", overflowY: "auto" }}>
        <DialogHeader>
          <DialogTitle>স্টাফ প্রোফাইল</DialogTitle>
        </DialogHeader>

        <div style={{ display: "grid", gap: 16 }}>
          {/* Section 1: Basic Info Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <img
              src={photoUrl}
              alt={staff.name}
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                border: "2px solid rgba(212,175,55,0.3)",
                objectFit: "cover",
              }}
            />
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800 }}>{staff.name}</h3>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>{staff.role}</p>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {onEdit && <button className="action-btn" onClick={() => onEdit(staff)}>
                <Icon name="fa-edit" />
              </button>}
              {onDelete && <button className="action-btn" onClick={() => onDelete(staff)}>
                <Icon name="fa-trash" style={{ color: "#dc3545" }} />
              </button>}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <InfoBox label="আইডি">{staff.staff_id}</InfoBox>
            <InfoBox label="বেতন">
              <span style={{ color: "#d4af37" }}>{formatTaka(Number(staff.salary))}</span>
            </InfoBox>
            <InfoBox label="ফোন">{staff.phone || "—"}</InfoBox>
            <InfoBox label="জয়েনিং তারিখ">{staff.join_date || "—"}</InfoBox>
            <InfoBox label="অবস্থা">
              <span className={staff.status === "active" ? "badge-success" : "badge-gold"}>
                {staff.status === "active" ? "সক্রিয়" : "নিষ্ক্রিয়"}
              </span>
            </InfoBox>
            <InfoBox label="রক্তের গ্রুপ">{staff.blood_group || "—"}</InfoBox>
          </div>

          {/* Section 2: Contract & Employment */}
          <div>
            <h4 style={sectionHeader}>
              <Icon name="fa-file-alt" style={{ marginRight: 6 }} /> চুক্তি ও কর্মসংস্থান
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: isContractual ? "1fr 1fr 1fr" : "1fr 1fr", gap: 10 }}>
              <InfoBox label="চুক্তির ধরন">
                {CONTRACT_LABELS[staff.contract_type] || staff.contract_type || "—"}
              </InfoBox>
              <InfoBox label="শুরু তারিখ">{staff.contract_start || "—"}</InfoBox>
              {isContractual && (
                <InfoBox label="শেষ তারিখ">{staff.contract_end || "—"}</InfoBox>
              )}
            </div>
            <div style={{ marginTop: 10 }}>
              <InfoBox label="ঠিকানা">
                <span style={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>{staff.address || "—"}</span>
              </InfoBox>
            </div>
          </div>

          {/* Section 3: Emergency Contact */}
          <div>
            <h4 style={sectionHeader}>
              <Icon name="fa-exclamation-triangle" style={{ marginRight: 6 }} /> জরুরি যোগাযোগ
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <InfoBox label="নাম">{staff.emergency_contact_name || "—"}</InfoBox>
              <InfoBox label="ফোন">{staff.emergency_contact_phone || "—"}</InfoBox>
              <InfoBox label="সম্পর্ক">{staff.emergency_contact_relation || "—"}</InfoBox>
            </div>
          </div>

          {/* Section 4: Qualifications */}
          <div>
            <h4 style={sectionHeader}>
              <Icon name="fa-graduation-cap" style={{ marginRight: 6 }} /> শিক্ষাগত যোগ্যতা
            </h4>
            <div {...boxProps}>
              <p style={{ ...valueStyle, whiteSpace: "pre-wrap", lineHeight: 1.8 }}>
                {staff.qualifications || "তথ্য যোগ করা হয়নি"}
              </p>
            </div>
          </div>

          {/* Section 5: Salary & Payment Summary */}
          <div>
            <h4 style={sectionHeader}>
              <Icon name="fa-money-bill-wave" style={{ marginRight: 6 }} /> বেতন তথ্য
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <InfoBox label="মূল বেতন">
                <span style={{ color: "#d4af37" }}>{formatTaka(Number(staff.salary))}</span>
              </InfoBox>
              <InfoBox label="চুক্তির ধরন">
                {CONTRACT_LABELS[staff.contract_type] || staff.contract_type || "—"}
              </InfoBox>
              <InfoBox label="জয়েনিং তারিখ">{staff.join_date || "—"}</InfoBox>
            </div>
          </div>

          {/* Section 6: NID Card */}
          <div>
            <h4 style={sectionHeader}>
              <Icon name="fa-user-shield" style={{ marginRight: 6 }} /> এনআইডি কার্ড
            </h4>
            {staff.nid_photo ? (
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="btn-outline-gold"
                  style={{ padding: "6px 12px", fontSize: 12 }}
                  onClick={onShowNid}
                >
                  <Icon name="fa-eye" /> দেখুন
                </button>
                <button
                  className="btn-outline-gold"
                  style={{ padding: "6px 12px", fontSize: 12 }}
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = staff.nid_photo;
                    link.download = `NID-${staff.name}.png`;
                    link.click();
                  }}
                >
                  <Icon name="fa-download" /> ডাউনলোড
                </button>
              </div>
            ) : (
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "center" }}>
                এনআইডি ছবি আপলোড করা হয়নি
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
