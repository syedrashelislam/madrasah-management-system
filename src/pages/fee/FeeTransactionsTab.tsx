import { useState, useEffect } from "react";
import { useStudents } from "@/hooks/useStudents";
import {
  usePayments,
  useUpdatePayment,
  useDeletePayment,
  PaymentRow,
} from "@/hooks/usePayments";
import { formatTaka, toBengaliNumber } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";
import Icon from "@/components/Icon";
import { useUserRole } from "@/hooks/useUserRole";
import { printReceipt } from "@/pages/payment-history/helpers";
import { useInstitutionInfo } from "@/hooks/useInstitutionInfo";
import { showToast } from "@/lib/showToast";
import {
  feeTypeLabel,
  feeTypeBadgeStyle,
  methodBadge,
} from "./feeTransactionHelpers";
import FeeTransactionsPagination from "./FeeTransactionsPagination";

export default function FeeTransactionsTab() {
  const { canWrite, canDelete } = useUserRole();
  const { data: payments = [], isLoading } = usePayments();
  const { data: students = [] } = useStudents();
  const updatePayment = useUpdatePayment();
  const deletePayment = useDeletePayment();
  const institution = useInstitutionInfo();

  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<PaymentRow | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [feeTypeFilter, setFeeTypeFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  // Collect unique payment methods for the filter dropdown
  const paymentMethods = Array.from(
    new Set(payments.map((p) => p.method || "").filter(Boolean)),
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, dateFrom, dateTo, feeTypeFilter, methodFilter]);

  const filtered = payments.filter((p) => {
    const student = students.find((s) => s.student_id === p.student_id);
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      (student?.name || "").toLowerCase().includes(q) ||
      p.student_id.toLowerCase().includes(q) ||
      (p.receipt_no || "").toLowerCase().includes(q) ||
      (p.method || "").toLowerCase().includes(q);
    const matchDateFrom = !dateFrom || p.payment_date >= dateFrom;
    const matchDateTo = !dateTo || p.payment_date <= dateTo;
    const matchFeeType = !feeTypeFilter || p.fee_type === feeTypeFilter;
    const matchMethod = !methodFilter || p.method === methodFilter;
    return matchSearch && matchDateFrom && matchDateTo && matchFeeType && matchMethod;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  // Fee-type totals for summary
  const feeTypeTotals = filtered.reduce<Record<string, number>>(
    (acc, p) => {
      const key = p.fee_type || "Other";
      acc[key] = (acc[key] || 0) + p.amount;
      return acc;
    },
    {},
  );

  const startEdit = (p: PaymentRow) => {
    setEditingId(p.id);
    setEditData({ ...p });
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditData(null);
  };
  const saveEdit = () => {
    if (editData) {
      updatePayment.mutate({
        id: editData.id,
        month: editData.month,
        amount: editData.amount,
        payment_date: editData.payment_date,
      });
      cancelEdit();
    }
  };
  const handleDelete = (id: string) => {
    if (confirm("এই লেনদেন ডিলিট করতে চান?")) deletePayment.mutate(id);
  };

  if (isLoading)
    return <Skeleton className="h-64" style={{ borderRadius: 10 }} />;

  return (
    <div>
      {/* Summary stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <StatCard
          value={formatTaka(
            filtered.reduce((s, p) => s + p.amount, 0),
          )}
          label="মোট আদায়"
          color="#d4af37"
        />
        <StatCard
          value={toBengaliNumber(filtered.length)}
          label="মোট লেনদেন"
          color="#28a745"
        />
        <StatCard
          value={formatTaka(feeTypeTotals["Monthly"] || 0)}
          label="মাসিক"
          color="#28a745"
        />
        <StatCard
          value={formatTaka(feeTypeTotals["Admission"] || 0)}
          label="ভর্তি"
          color="#d4af37"
        />
        <StatCard
          value={formatTaka(feeTypeTotals["Exam"] || 0)}
          label="পরীক্ষা"
          color="#6366f1"
        />
        <StatCard
          value={formatTaka(
            (feeTypeTotals["Partial"] || 0) +
              (feeTypeTotals["Other"] || 0),
          )}
          label="অন্যান্য"
          color="#f97316"
        />
      </div>

      {/* Filters */}
      <div className="content-box">
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            alignItems: "end",
          }}
        >
          <div>
            <label
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.5)",
                marginBottom: 4,
                display: "block",
              }}
            >
              খুঁজুন
            </label>
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              >
                <Icon
                  name="fa-search"
                  size={14}
                  style={{ color: "rgba(255,255,255,0.4)" }}
                />
              </span>
              <input
                className="glass-input"
                style={{ paddingLeft: 40 }}
                placeholder="নাম, আইডি, রসিদ নং, পদ্ধতি..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.5)",
                marginBottom: 4,
                display: "block",
              }}
            >
              তারিখ থেকে
            </label>
            <input
              className="glass-input"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <label
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.5)",
                marginBottom: 4,
                display: "block",
              }}
            >
              তারিখ পর্যন্ত
            </label>
            <input
              className="glass-input"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div>
            <label
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.5)",
                marginBottom: 4,
                display: "block",
              }}
            >
              ফি ধরন
            </label>
            <select
              className="glass-select"
              value={feeTypeFilter}
              onChange={(e) => setFeeTypeFilter(e.target.value)}
            >
              <option value="">সকল ধরন</option>
              <option value="Monthly">মাসিক ফি</option>
              <option value="Admission">ভর্তি ফি</option>
              <option value="Exam">পরীক্ষা ফি</option>
              <option value="Partial">আংশিক</option>
              <option value="Other">অন্যান্য</option>
            </select>
          </div>
          <div>
            <label
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.5)",
                marginBottom: 4,
                display: "block",
              }}
            >
              পেমেন্ট পদ্ধতি
            </label>
            <select
              className="glass-select"
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
            >
              <option value="">সকল পদ্ধতি</option>
              {paymentMethods.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="content-box" style={{ padding: 0 }}>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ছাত্র</th>
                <th>মাস/বিবরণ</th>
                <th>ধরন</th>
                <th>পরিমাণ</th>
                <th>তারিখ</th>
                <th>পদ্ধতি</th>
                <th>রসিদ নং</th>
                <th style={{ textAlign: "center" }}>একশন</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((p) => {
                const student = students.find(
                  (s) => s.student_id === p.student_id,
                );
                const badge = feeTypeBadgeStyle(p.fee_type);
                const mBadge = methodBadge(p.method || "");

                return (
                  <tr key={p.id}>
                    {editingId === p.id && editData ? (
                      <EditRow
                        p={p}
                        editData={editData}
                        setEditData={setEditData}
                        studentName={student?.name || p.student_id}
                        onSave={saveEdit}
                        onCancel={cancelEdit}
                        onDelete={
                          canDelete
                            ? () => handleDelete(p.id)
                            : undefined
                        }
                      />
                    ) : (
                      <>
                        <td style={{ fontWeight: 600 }}>
                          {student?.name || p.student_id}
                        </td>
                        <td>{p.month}</td>
                        <td>
                          <span
                            style={{
                              padding: "3px 10px",
                              borderRadius: 20,
                              fontSize: 11,
                              fontWeight: 600,
                              background: badge.bg,
                              color: badge.color,
                              border: `1px solid ${badge.color}25`,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {feeTypeLabel(p.fee_type)}
                          </span>
                        </td>
                        <td
                          style={{
                            fontWeight: 700,
                            color: "#d4af37",
                          }}
                        >
                          {formatTaka(p.amount)}
                        </td>
                        <td
                          style={{
                            color: "rgba(255,255,255,0.5)",
                          }}
                        >
                          {p.payment_date}
                        </td>
                        <td>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              fontSize: 12,
                              color: mBadge.color,
                            }}
                          >
                            <Icon
                              name={mBadge.icon}
                              size={12}
                              style={{ color: mBadge.color }}
                            />
                            {p.method || "—"}
                          </span>
                        </td>
                        <td
                          style={{
                            fontSize: 12,
                            color: "rgba(255,255,255,0.5)",
                            fontFamily: "monospace",
                          }}
                        >
                          {p.receipt_no || "—"}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <div
                            style={{
                              display: "flex",
                              gap: 6,
                              justifyContent: "center",
                            }}
                          >
                            {canWrite && (
                              <button
                                className="action-btn"
                                title="সম্পাদনা"
                                onClick={() => startEdit(p)}
                              >
                                <Icon name="fa-edit" />
                              </button>
                            )}
                            <button
                              className="action-btn"
                              title="রসিদ প্রিন্ট"
                              onClick={() => {
                                if (student)
                                  printReceipt(
                                    p,
                                    student,
                                    institution,
                                    payments,
                                  );
                                else
                                  showToast.warning(
                                    "ছাত্রের তথ্য পাওয়া যায়নি",
                                  );
                              }}
                            >
                              <Icon
                                name="fa-print"
                                style={{ color: "#28a745" }}
                              />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      textAlign: "center",
                      padding: 40,
                      color: "rgba(255,255,255,0.4)",
                    }}
                  >
                    কোনো লেনদেন পাওয়া যায়নি
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <FeeTransactionsPagination
          filtered={filtered.length}
          safePage={safePage}
          totalPages={totalPages}
          pageSize={pageSize}
          setCurrentPage={setCurrentPage}
        />
      </div>
    </div>
  );
}

/* ─── Inline sub-components ─── */

function StatCard({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color: string;
}) {
  return (
    <div
      className="content-box"
      style={{ textAlign: "center", padding: 16, marginBottom: 0 }}
    >
      <p style={{ fontSize: 20, fontWeight: 800, color }}>{value}</p>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
        {label}
      </p>
    </div>
  );
}

function EditRow({
  p,
  editData,
  setEditData,
  studentName,
  onSave,
  onCancel,
  onDelete,
}: {
  p: PaymentRow;
  editData: PaymentRow;
  setEditData: (d: PaymentRow) => void;
  studentName: string;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  return (
    <>
      <td>{studentName}</td>
      <td>
        <input
          className="glass-input"
          value={editData.month}
          onChange={(e) =>
            setEditData({ ...editData, month: e.target.value })
          }
        />
      </td>
      <td>{feeTypeLabel(p.fee_type)}</td>
      <td>
        <input
          className="glass-input"
          type="number"
          value={editData.amount}
          onChange={(e) =>
            setEditData({
              ...editData,
              amount: Number(e.target.value),
            })
          }
        />
      </td>
      <td>
        <input
          className="glass-input"
          type="date"
          value={editData.payment_date}
          onChange={(e) =>
            setEditData({
              ...editData,
              payment_date: e.target.value,
            })
          }
        />
      </td>
      <td>{p.method}</td>
      <td style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>
        {p.receipt_no || "—"}
      </td>
      <td style={{ textAlign: "center" }}>
        <div
          style={{
            display: "flex",
            gap: 6,
            justifyContent: "center",
          }}
        >
          <button className="action-btn" onClick={onSave}>
            <Icon name="fa-check" style={{ color: "#28a745" }} />
          </button>
          {onDelete && (
            <button className="action-btn" onClick={onDelete}>
              <Icon name="fa-trash" style={{ color: "#dc3545" }} />
            </button>
          )}
          <button className="action-btn" onClick={onCancel}>
            <Icon name="fa-times" />
          </button>
        </div>
      </td>
    </>
  );
}
