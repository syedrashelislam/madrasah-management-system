import type { StudentRow } from "@/hooks/useStudents";

/**
 * Generate a CSV string of guardian contacts from active students
 * and trigger a browser download.
 */
export function downloadGuardianContacts(students: StudentRow[]) {
  const activeStudents = students.filter((s) => s.status === "active");

  // BOM for Excel UTF-8 compatibility
  const BOM = "\uFEFF";

  const header = [
    "ছাত্রের নাম",
    "ছাত্র আইডি",
    "শ্রেণি",
    "অভিভাবকের নাম",
    "অভিভাবকের মোবাইল",
    "হোয়াটসঅ্যাপ নাম্বার",
    "অভিভাবকের ইমেইল",
    "জরুরি যোগাযোগ",
  ];

  const rows = activeStudents.map((s) => [
    s.name,
    s.student_id,
    s.class_name,
    s.guardian_name || s.father_name || "—",
    s.guardian_phone || "—",
    s.guardian_whatsapp || "—",
    s.guardian_email || "—",
    s.emergency_contact || "—",
  ]);

  const csvContent =
    BOM +
    [header, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;

  const today = new Date().toISOString().slice(0, 10);
  link.download = `অভিভাবক-যোগাযোগ-তালিকা-${today}.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
