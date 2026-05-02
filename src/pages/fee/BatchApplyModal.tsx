import { useState } from "react";
import { formatTaka, toBengaliNumber } from "@/lib/constants";
import Icon from "@/components/Icon";

interface BatchForm {
  monthlyFee: number;
  admissionFee: number;
  examFee: number;
  otherFee: number;
  otherFeeLabel: string;
}

interface BatchApplyModalProps {
  open: boolean;
  onClose: () => void;
  onApply: (form: BatchForm) => void;
  isPending: boolean;
  classCount: number;
}

export default function BatchApplyModal({ open, onClose, onApply, isPending, classCount }: BatchApplyModalProps) {
  const [form, setForm] = useState<BatchForm>({ monthlyFee: 0, admissionFee: 0, examFee: 0, otherFee: 0, otherFeeLabel: "" });

  if (!open) return null;

  const totalPerStudent = form.monthlyFee + form.admissionFee + form.examFee + form.otherFee;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#d4af37" }}>
            <Icon name="fa-share" /> সকল শ্রেণিতে প্রয়োগ
          </h3>
          <button className="action-btn" onClick={onClose}><Icon name="fa-times" /></button>
        </div>

        <div style={{
          background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)",
          borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "rgba(255,255,255,0.6)",
        }}>
          <Icon name="fa-exclamation-circle" style={{ color: "#d4af37" }} /> এই ফি কাঠামো{" "}
          <strong style={{ color: "#d4af37" }}>{toBengaliNumber(classCount)}টি</strong> শ্রেণিতে প্রয়োগ হবে।
          বিদ্যমান কাঠামো আপডেট এবং নতুনগুলো তৈরি হবে।
        </div>

        {/* Fee fields grouped */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 4 }}>
              মাসিক ফি (৳) <span style={{ color: "#dc3545" }}>*</span>
            </label>
            <input className="glass-input" type="number" value={form.monthlyFee || ""} onChange={(e) => setForm({ ...form, monthlyFee: Number(e.target.value) })} placeholder="0" />
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>প্রতি মাসে আদায়যোগ্য</div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 4 }}>ভর্তি ফি (৳)</label>
            <input className="glass-input" type="number" value={form.admissionFee || ""} onChange={(e) => setForm({ ...form, admissionFee: Number(e.target.value) })} placeholder="0" />
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>ভর্তির সময় এককালীন</div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 4 }}>পরীক্ষা ফি (৳)</label>
            <input className="glass-input" type="number" value={form.examFee || ""} onChange={(e) => setForm({ ...form, examFee: Number(e.target.value) })} placeholder="0" />
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>প্রতি পরীক্ষা চক্রে</div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 4 }}>অন্যান্য ফি (৳)</label>
            <input className="glass-input" type="number" value={form.otherFee || ""} onChange={(e) => setForm({ ...form, otherFee: Number(e.target.value) })} placeholder="0" />
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>কাস্টম ফি</div>
          </div>
        </div>

        {form.otherFee > 0 && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 4 }}>অন্যান্য ফি লেবেল</label>
            <input className="glass-input" value={form.otherFeeLabel} onChange={(e) => setForm({ ...form, otherFeeLabel: e.target.value })} placeholder="যেমন: লাইব্রেরি ফি" />
          </div>
        )}

        {/* Total preview */}
        <div style={{
          background: "rgba(40,167,69,0.08)", border: "1px solid rgba(40,167,69,0.2)",
          borderRadius: 8, padding: "10px 14px", marginBottom: 20,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
            <Icon name="fa-calculator" /> প্রতি ছাত্রের মোট ফি
          </span>
          <span style={{ fontSize: 16, fontWeight: 800, color: "#28a745" }}>
            {formatTaka(totalPerStudent)}
          </span>
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="btn-outline-gold" onClick={onClose} style={{ padding: "8px 20px" }}>
            <Icon name="fa-times" /> বাতিল
          </button>
          <button className="btn-gold" onClick={() => onApply(form)} disabled={isPending || form.monthlyFee <= 0} style={{ padding: "8px 20px" }}>
            <Icon name="fa-check" /> {isPending ? "প্রয়োগ হচ্ছে..." : "সকল শ্রেণিতে প্রয়োগ"}
          </button>
        </div>
      </div>
    </div>
  );
}
