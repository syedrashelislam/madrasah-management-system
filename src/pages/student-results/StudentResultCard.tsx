import { useState } from "react";
import type { ExamRow } from "@/hooks/useExams";
import type { StudentResult } from "../exam/examUtils";
import { toBengaliNumber } from "@/lib/constants";
import Icon from "@/components/Icon";

interface Props {
  exam: ExamRow;
  result: StudentResult;
  onPrintMarksheet: () => void;
}

export default function StudentResultCard({ exam, result, onPrintMarksheet }: Props) {
  const [expanded, setExpanded] = useState(true);
  const pctColor = result.overallPercent >= 80 ? "#28a745" : result.overallPercent >= 50 ? "#ffc107" : "#ef4444";

  return (
    <div className="content-box" style={{ padding: 0, overflow: "hidden" }}>
      {/* Header */}
      <div
        style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "14px 18px", cursor: "pointer",
          background: result.passed ? "rgba(40,167,69,0.06)" : "rgba(239,68,68,0.06)",
          borderBottom: expanded ? "1px solid rgba(255,255,255,0.08)" : "none",
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
            background: result.passed ? "rgba(40,167,69,0.12)" : "rgba(239,68,68,0.12)",
            color: result.passed ? "#28a745" : "#ef4444",
          }}>
            <Icon name={result.passed ? "fa-check-circle" : "fa-times-circle"} size={18} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>{exam.name}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
              {exam.className} {exam.date ? `• ${exam.date}` : ""}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* Grade badge */}
          <span style={{
            padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 700,
            background: result.passed ? "rgba(40,167,69,0.12)" : "rgba(239,68,68,0.12)",
            color: result.passed ? "#28a745" : "#ef4444",
          }}>
            {result.grade} ({result.gpa})
          </span>
          {/* Percent badge */}
          <span style={{
            padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
            background: `${pctColor}18`, color: pctColor,
          }}>
            {toBengaliNumber(Math.round(result.overallPercent))}%
          </span>
          {/* Pass/Fail */}
          <span className={result.passed ? "badge-success" : "badge-gold"} style={{ background: result.passed ? undefined : "rgba(239,68,68,0.12)", color: result.passed ? undefined : "#ef4444" }}>
            {result.passed ? "পাশ" : "ফেল"}
          </span>
          <Icon name={expanded ? "fa-chevron-down" : "fa-chevron-right"} size={14} style={{ color: "rgba(255,255,255,0.4)" }} />
        </div>
      </div>

      {/* Subject table */}
      {expanded && (
        <div style={{ padding: "0 0 12px" }}>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table" style={{ marginBottom: 0 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "right" }}>বিষয়</th>
                  <th style={{ textAlign: "center" }}>প্রাপ্ত</th>
                  <th style={{ textAlign: "center" }}>পূর্ণমান</th>
                  <th style={{ textAlign: "center" }}>পাশ নম্বর</th>
                  <th style={{ textAlign: "center" }}>গ্রেড</th>
                  <th style={{ textAlign: "center" }}>জিপিএ</th>
                  <th style={{ textAlign: "center" }}>ফলাফল</th>
                </tr>
              </thead>
              <tbody>
                {result.subjectResults.map(sr => (
                  <tr key={sr.subject}>
                    <td style={{ fontWeight: 600, textAlign: "right" }}>{sr.subject}</td>
                    <td style={{ textAlign: "center", fontWeight: 700, color: sr.passed ? "#28a745" : "#ef4444" }}>
                      {toBengaliNumber(sr.obtained)}
                    </td>
                    <td style={{ textAlign: "center" }}>{toBengaliNumber(sr.fullMarks)}</td>
                    <td style={{ textAlign: "center", color: "rgba(255,255,255,0.5)" }}>{toBengaliNumber(sr.passMarks)}</td>
                    <td style={{ textAlign: "center", fontWeight: 600 }}>{sr.grade}</td>
                    <td style={{ textAlign: "center" }}>{sr.gpa}</td>
                    <td style={{ textAlign: "center" }}>
                      <span style={{
                        padding: "2px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600,
                        background: sr.passed ? "rgba(40,167,69,0.12)" : "rgba(239,68,68,0.12)",
                        color: sr.passed ? "#28a745" : "#ef4444",
                      }}>
                        {sr.passed ? "পাশ" : "ফেল"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: "rgba(212,175,55,0.08)" }}>
                  <td style={{ fontWeight: 700, textAlign: "right", color: "#d4af37" }}>মোট</td>
                  <td style={{ textAlign: "center", fontWeight: 700, color: "#d4af37" }}>{toBengaliNumber(result.totalObtained)}</td>
                  <td style={{ textAlign: "center", fontWeight: 700 }}>{toBengaliNumber(result.totalFull)}</td>
                  <td style={{ textAlign: "center" }}>—</td>
                  <td style={{ textAlign: "center", fontWeight: 700, color: "#d4af37" }}>{result.grade}</td>
                  <td style={{ textAlign: "center", fontWeight: 700 }}>{result.gpa}</td>
                  <td style={{ textAlign: "center" }}>
                    <span style={{
                      padding: "2px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700,
                      background: result.passed ? "rgba(40,167,69,0.15)" : "rgba(239,68,68,0.15)",
                      color: result.passed ? "#28a745" : "#ef4444",
                    }}>
                      {toBengaliNumber(Math.round(result.overallPercent))}% — {result.passed ? "পাশ" : "ফেল"}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Print button */}
          <div style={{ display: "flex", justifyContent: "flex-end", padding: "10px 16px 0" }}>
            <button className="btn-outline-gold" style={{ fontSize: 12, padding: "6px 14px" }} onClick={onPrintMarksheet}>
              <Icon name="fa-print" size={13} /> মার্কশিট প্রিন্ট
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
