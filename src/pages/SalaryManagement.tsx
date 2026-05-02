import { useMemo, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import Icon from "@/components/Icon";
import { cn } from "@/lib/utils";
import { formatTaka, isTeacherStaff, MONTHS_BENGALI, toBengaliNumber } from "@/lib/constants";
import { useInstitutionInfo } from "@/hooks/useInstitutionInfo";
import { printSalaryReceiptUnified } from "@/lib/printSalaryReceipt";
import { printSalarySlip } from "./salary/SalarySlipPrintable";
import { saveSalarySlipPdf } from "@/lib/saveSalaryPdf";
import { useStaff, useAddStaff, useUpdateStaff, useDeleteStaff, StaffRow } from "@/hooks/useStaff";
import { useSalaryPayments, useAddSalaryPayment, checkSalaryAlreadyPaid } from "@/hooks/useSalaryPayments";
import { useTeacherAttendance } from "@/hooks/useTeacherAttendance";
import { useSalaryAdvances, useAddSalaryAdvance, useSettleSalaryAdvances } from "@/hooks/useSalaryAdvances";
import { useAddTransaction } from "@/hooks/useTransactions";
import LeaveManagementTab from "./salary/LeaveManagementTab";
import StaffProfileDialog from "./salary/StaffProfileDialog";
import { useUserRole } from "@/hooks/useUserRole";

const TABS = [
  { id: "list", label: "স্টাফ তালিকা", icon: "fa-users" },
  { id: "pay", label: "বেতন প্রদান", icon: "fa-money-check-alt" },
  { id: "history", label: "বেতন ইতিহাস", icon: "fa-history" },
  { id: "advance", label: "অগ্রিম প্রদান", icon: "fa-hand-holding-usd" },
  { id: "due", label: "বকেয়া বেতন", icon: "fa-exclamation-circle" },
  { id: "leave", icon: "fa-calendar-minus", label: "ছুটি ব্যবস্থাপনা" },
] as const;

const YEAR_OPTIONS = [2024, 2025, 2026, 2027];

const getMonthIndex = (month: string) => MONTHS_BENGALI.indexOf(month);
const getMonthDatePrefix = (year: number, month: string) => `${year}-${String(getMonthIndex(month) + 1).padStart(2, "0")}`;
const getDaysInMonth = (year: number, month: string) => new Date(year, getMonthIndex(month) + 1, 0).getDate();
const getDueMonths = (joinDate: string | null | undefined, paidMonths: Set<string>, year: number) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIndex = now.getMonth();
  const joined = joinDate ? new Date(joinDate) : new Date(year, 0, 1);
  const startMonth = year === joined.getFullYear() ? joined.getMonth() : 0;
  const endMonth = year < currentYear ? 11 : year === currentYear ? currentMonthIndex : -1;

  if (endMonth < startMonth) return [] as string[];

  return MONTHS_BENGALI.filter((month, index) => index >= startMonth && index <= endMonth && !paidMonths.has(month));
};

export default function SalaryManagement() {
  const { data: staffList = [], isLoading: staffLoading } = useStaff();
  const { data: salaryPayments = [], isLoading: salaryLoading } = useSalaryPayments();
  const { data: teacherAttendance = [] } = useTeacherAttendance();
  const { data: salaryAdvances = [], isLoading: advancesLoading } = useSalaryAdvances();
  const addStaffMut = useAddStaff();
  const updateStaffMut = useUpdateStaff();
  const deleteStaffMut = useDeleteStaff();
  const addSalaryMut = useAddSalaryPayment();
  const addAdvanceMut = useAddSalaryAdvance();
  const settleAdvancesMut = useSettleSalaryAdvances();
  const addTransactionMut = useAddTransaction();
  const institution = useInstitutionInfo();
  const { canWrite, canDelete } = useUserRole();

  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["id"]>("list");
  const [showAdd, setShowAdd] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffRow | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffRow | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showNid, setShowNid] = useState(false);

  const [formData, setFormData] = useState({
    staffId: "",
    name: "",
    role: "",
    phone: "",
    salary: 0,
    nidPhoto: "",
    photo: "",
    joinDate: new Date() as Date | undefined,
    contractType: "permanent",
    contractStart: "",
    contractEnd: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelation: "",
    qualifications: "",
    address: "",
    bloodGroup: "",
  });

  const [payStaffId, setPayStaffId] = useState("");
  const [payYear, setPayYear] = useState(new Date().getFullYear());
  const [payMonth, setPayMonth] = useState("");
  const [customNetPayable, setCustomNetPayable] = useState("");

  const [advanceStaffId, setAdvanceStaffId] = useState("");
  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [advanceDate, setAdvanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [advanceNote, setAdvanceNote] = useState("");

  const activeStaffList = useMemo(() => staffList.filter((staff) => staff.status === "active"), [staffList]);
  // Show ALL active staff (not just teachers) in salary management
  const teacherStaffList = useMemo(
    () => activeStaffList,
    [activeStaffList],
  );
  const totalSalary = activeStaffList.reduce((sum, staff) => sum + Number(staff.salary), 0);

  const selectedPayStaff = teacherStaffList.find((staff) => staff.id === payStaffId) || null;
  const selectedAdvanceStaff = activeStaffList.find((staff) => staff.id === advanceStaffId) || null;

  const salaryOnlyPayments = useMemo(
    () => salaryPayments.filter((payment) => (payment.paymentType || "salary") === "salary"),
    [salaryPayments],
  );

  const paidMonthsSet = useMemo(
    () => new Set(salaryOnlyPayments.filter((payment) => payment.staffId === payStaffId && payment.year === payYear).map((payment) => payment.month)),
    [salaryOnlyPayments, payStaffId, payYear],
  );

  const dueMonths = useMemo(() => {
    if (!selectedPayStaff) return [] as string[];
    return getDueMonths(selectedPayStaff.join_date, paidMonthsSet, payYear);
  }, [selectedPayStaff, paidMonthsSet, payYear]);

  const currentSalaryBreakdown = useMemo(() => {
    if (!selectedPayStaff || !payMonth) {
      return null;
    }

    const baseSalary = Number(selectedPayStaff.salary);
    const totalDays = getDaysInMonth(payYear, payMonth);
    const dailyWage = baseSalary / totalDays;
    const monthPrefix = getMonthDatePrefix(payYear, payMonth);
    const absentDays = teacherAttendance.filter(
      (row) => row.staffId === selectedPayStaff.id && row.date.startsWith(monthPrefix) && row.status === "absent",
    ).length;
    const absenceDeduction = Math.round(absentDays * dailyWage);
    const openAdvances = salaryAdvances
      .filter((advance) => advance.staffId === selectedPayStaff.id)
      .map((advance) => ({
        ...advance,
        remainingAmount: Math.max(0, Number(advance.amount) - Number(advance.settledAmount || 0)),
      }))
      .filter((advance) => advance.remainingAmount > 0)
      .sort((a, b) => a.advanceDate.localeCompare(b.advanceDate));
    const totalOpenAdvance = openAdvances.reduce((sum, advance) => sum + advance.remainingAmount, 0);
    const advanceDeduction = Math.min(Math.max(0, baseSalary - absenceDeduction), totalOpenAdvance);
    const settlementPlan = openAdvances.reduce<Array<{ id: string; settledAmount: number }>>((acc, advance) => {
      const alreadyAllocated = acc.reduce((sum, item) => sum + item.settledAmount, 0);
      const remainingToAllocate = Math.max(0, advanceDeduction - alreadyAllocated);
      if (remainingToAllocate <= 0) return acc;
      acc.push({ id: advance.id, settledAmount: Math.min(advance.remainingAmount, remainingToAllocate) + Number(advance.settledAmount || 0) });
      return acc;
    }, []);
    const netPayable = Math.max(0, Math.round(baseSalary - absenceDeduction - advanceDeduction));

    return {
      baseSalary,
      totalDays,
      dailyWage,
      absentDays,
      absenceDeduction,
      advanceDeduction,
      netPayable,
      totalOpenAdvance,
      settlementPlan,
    };
  }, [selectedPayStaff, payMonth, payYear, teacherAttendance, salaryAdvances]);

  const effectiveNetPayable = currentSalaryBreakdown
    ? Math.max(0, Number(customNetPayable || currentSalaryBreakdown.netPayable) || 0)
    : 0;

  const staffPayHistory = useMemo(() => {
    if (!payStaffId) return [] as typeof salaryOnlyPayments;
    return salaryOnlyPayments
      .filter((payment) => payment.staffId === payStaffId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [salaryOnlyPayments, payStaffId]);

  const staffAdvanceHistory = useMemo(() => {
    if (!advanceStaffId) return [];
    return salaryAdvances
      .filter((advance) => advance.staffId === advanceStaffId)
      .sort((a, b) => b.advanceDate.localeCompare(a.advanceDate));
  }, [salaryAdvances, advanceStaffId]);

  const payableAdvanceBalance = useMemo(() => {
    return staffAdvanceHistory.reduce((sum, advance) => sum + Math.max(0, Number(advance.amount) - Number(advance.settledAmount || 0)), 0);
  }, [staffAdvanceHistory]);

  const dueList = useMemo(() => {
    return teacherStaffList
      .map((staff) => {
        const paid = new Set(
          salaryOnlyPayments
            .filter((payment) => payment.staffId === staff.id && payment.year === new Date().getFullYear())
            .map((payment) => payment.month),
        );
        const months = getDueMonths(staff.join_date, paid, new Date().getFullYear());
        return {
          staff,
          dueMonths: months,
          dueAmount: months.length * Number(staff.salary),
        };
      })
      .filter((item) => item.dueMonths.length > 0);
  }, [teacherStaffList, salaryOnlyPayments]);

  const totalDue = dueList.reduce((sum, item) => sum + item.dueAmount, 0);

  const resetForm = () => {
    setFormData({
      staffId: "",
      name: "",
      role: "",
      phone: "",
      salary: 0,
      nidPhoto: "",
      photo: "",
      joinDate: new Date(),
      contractType: "permanent",
      contractStart: "",
      contractEnd: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      emergencyContactRelation: "",
      qualifications: "",
      address: "",
      bloodGroup: "",
    });
    setEditingStaff(null);
    setShowAdd(false);
  };

  const handlePhotoUpload = (field: "nidPhoto" | "photo", file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => setFormData((prev) => ({ ...prev, [field]: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleSubmitStaff = async () => {
    if (!formData.name || !formData.role || !formData.salary || (!editingStaff && !formData.staffId)) {
      toast.error("সকল তথ্য পূরণ করুন");
      return;
    }

    const joinDateStr = formData.joinDate ? format(formData.joinDate, "yyyy-MM-dd") : new Date().toISOString().split("T")[0];
    const photo = formData.photo || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(formData.name)}`;
    const extendedFields = {
      contract_type: formData.contractType,
      contract_start: formData.contractStart,
      contract_end: formData.contractEnd,
      emergency_contact_name: formData.emergencyContactName,
      emergency_contact_phone: formData.emergencyContactPhone,
      emergency_contact_relation: formData.emergencyContactRelation,
      qualifications: formData.qualifications,
      address: formData.address,
      blood_group: formData.bloodGroup,
    };

    if (editingStaff) {
      await updateStaffMut.mutateAsync({
        staff_id: editingStaff.staff_id,
        name: formData.name,
        role: formData.role,
        phone: formData.phone,
        salary: formData.salary,
        nid_photo: formData.nidPhoto || editingStaff.nid_photo,
        photo: formData.photo || editingStaff.photo,
        join_date: joinDateStr,
        ...extendedFields,
      });
      toast.success("স্টাফ তথ্য আপডেট হয়েছে");
    } else {
      await addStaffMut.mutateAsync({
        staff_id: formData.staffId,
        name: formData.name,
        role: formData.role,
        phone: formData.phone,
        salary: formData.salary,
        join_date: joinDateStr,
        status: "active",
        nid_photo: formData.nidPhoto,
        photo,
        ...extendedFields,
      });
      toast.success("নতুন স্টাফ যোগ হয়েছে");
    }

    resetForm();
  };

  const handleEditStaff = (staff: StaffRow) => {
    setEditingStaff(staff);
    setFormData({
      staffId: staff.staff_id,
      name: staff.name,
      role: staff.role,
      phone: staff.phone || "",
      salary: Number(staff.salary),
      nidPhoto: "",
      photo: "",
      joinDate: staff.join_date ? new Date(staff.join_date) : new Date(),
      contractType: staff.contract_type || "permanent",
      contractStart: staff.contract_start || "",
      contractEnd: staff.contract_end || "",
      emergencyContactName: staff.emergency_contact_name || "",
      emergencyContactPhone: staff.emergency_contact_phone || "",
      emergencyContactRelation: staff.emergency_contact_relation || "",
      qualifications: staff.qualifications || "",
      address: staff.address || "",
      bloodGroup: staff.blood_group || "",
    });
    setShowAdd(true);
  };

  const handleDeleteStaff = async (staff: StaffRow) => {
    await deleteStaffMut.mutateAsync(staff.staff_id);
    setShowProfile(false);
    setSelectedStaff(null);
    toast.success(`${staff.name} মুছে ফেলা হয়েছে`);
  };

  const [payingInProgress, setPayingInProgress] = useState(false);

  const handlePaySalary = async () => {
    if (!selectedPayStaff || !payMonth || !currentSalaryBreakdown) {
      toast.error("শিক্ষক ও মাস নির্বাচন করুন");
      return;
    }

    if (payingInProgress) return;
    setPayingInProgress(true);

    const today = new Date().toISOString().split("T")[0];

    try {
      // Pre-check: is this month already paid?
      const alreadyPaid = await checkSalaryAlreadyPaid(selectedPayStaff.id, payMonth, payYear);
      if (alreadyPaid) {
        toast.error(`${selectedPayStaff.name} এর ${payMonth} ${toBengaliNumber(payYear)} মাসের বেতন ইতিমধ্যে প্রদান করা হয়েছে`);
        setPayingInProgress(false);
        return;
      }

      // Step 1: Insert salary payment
      const createdPayment = await addSalaryMut.mutateAsync({
        staffId: selectedPayStaff.id,
        month: payMonth,
        year: payYear,
        amount: effectiveNetPayable,
        date: today,
        absenceDays: currentSalaryBreakdown.absentDays,
        absenceDeduction: currentSalaryBreakdown.absenceDeduction,
        advanceDeduction: currentSalaryBreakdown.advanceDeduction,
        baseSalary: currentSalaryBreakdown.baseSalary,
        netPayable: effectiveNetPayable,
        totalDays: currentSalaryBreakdown.totalDays,
        paymentType: "salary",
      });

      // Step 2: Settle advances (if any)
      if (currentSalaryBreakdown.settlementPlan.length > 0) {
        try {
          await settleAdvancesMut.mutateAsync(
            currentSalaryBreakdown.settlementPlan.map((item) => ({
              id: item.id,
              settledAmount: item.settledAmount,
              settledPaymentId: createdPayment.id,
              settlementNote: `${payMonth} ${payYear} salary settlement`,
            })),
          );
        } catch (advErr) {
          console.error("Advance settlement error:", advErr);
        }
      }

      // Step 3: Record transaction
      try {
        await addTransactionMut.mutateAsync({
          type: "expense",
          category: "শিক্ষক বেতন",
          description: `${selectedPayStaff.name} - ${payMonth} ${toBengaliNumber(payYear)} নেট বেতন`,
          amount: effectiveNetPayable,
          date: today,
        });
      } catch (txErr) {
        console.error("Transaction recording error:", txErr);
      }

      const slipData = {
        staff: { name: selectedPayStaff.name, staff_id: selectedPayStaff.staff_id, role: selectedPayStaff.role, phone: selectedPayStaff.phone || "", join_date: selectedPayStaff.join_date || "" },
        month: payMonth,
        year: payYear,
        breakdown: {
          baseSalary: currentSalaryBreakdown.baseSalary,
          totalDays: currentSalaryBreakdown.totalDays,
          absentDays: currentSalaryBreakdown.absentDays,
          absenceDeduction: currentSalaryBreakdown.absenceDeduction,
          advanceDeduction: currentSalaryBreakdown.advanceDeduction,
          netPayable: effectiveNetPayable,
          totalOpenAdvance: currentSalaryBreakdown.totalOpenAdvance - currentSalaryBreakdown.advanceDeduction,
          dailyWage: currentSalaryBreakdown.dailyWage,
        },
        madrasaName: institution.name,
        madrasaAddress: institution.address,
      };
      toast.success(`${selectedPayStaff.name} এর ${payMonth} মাসের বেতন প্রদান সম্পন্ন`, {
        action: { label: "স্লিপ প্রিন্ট", onClick: () => printSalarySlip(slipData) },
      });
      setPayMonth("");
      setCustomNetPayable("");
    } catch (err: any) {
      console.error("handlePaySalary error:", err);
      // Don't double-toast if mutation's onError already toasted
      if (!err?.message?.includes("ইতিমধ্যে প্রদান")) {
        toast.error("বেতন প্রদানে সমস্যা হয়েছে: " + (err?.message || "অজানা ত্রুটি"));
      }
    } finally {
      setPayingInProgress(false);
    }
  };

  const handleAdvancePayment = async () => {
    if (!selectedAdvanceStaff || advanceAmount <= 0) {
      toast.error("শিক্ষক ও অগ্রিম পরিমাণ দিন");
      return;
    }

    try {
      await addAdvanceMut.mutateAsync({
        staffId: selectedAdvanceStaff.id,
        amount: advanceAmount,
        advanceDate: advanceDate,
        note: advanceNote,
      });

      try {
        await addTransactionMut.mutateAsync({
          type: "expense",
          category: "অগ্রিম বেতন",
          description: `${selectedAdvanceStaff.name} - অগ্রিম প্রদান${advanceNote ? ` (${advanceNote})` : ""}`,
          amount: advanceAmount,
          date: advanceDate,
        });
      } catch (txErr) {
        console.error("Transaction recording error:", txErr);
      }

      toast.success("অগ্রিম প্রদান সংরক্ষণ হয়েছে");
      setAdvanceAmount(0);
      setAdvanceNote("");
    } catch (err: any) {
      console.error("handleAdvancePayment error:", err);
      toast.error("অগ্রিম সেভ করতে সমস্যা: " + (err?.message || "অজানা ত্রুটি"));
    }
  };



  // Salary History tab state
  const [histFilterStaff, setHistFilterStaff] = useState("");
  const [histFilterYear, setHistFilterYear] = useState(new Date().getFullYear());
  const [histFilterMonth, setHistFilterMonth] = useState("");

  const filteredSalaryHistory = useMemo(() => {
    return salaryOnlyPayments.filter((p) => {
      if (histFilterStaff && p.staffId !== histFilterStaff) return false;
      if (histFilterYear && p.year !== histFilterYear) return false;
      if (histFilterMonth && p.month !== histFilterMonth) return false;
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [salaryOnlyPayments, histFilterStaff, histFilterYear, histFilterMonth]);

  const handlePrintSalarySlip = () => {
    if (!selectedPayStaff || !payMonth || !currentSalaryBreakdown) {
      toast.error("শিক্ষক ও মাস নির্বাচন করুন");
      return;
    }
    printSalaryReceiptUnified({
      institution,
      staff: {
        name: selectedPayStaff.name,
        staff_id: selectedPayStaff.staff_id,
        role: selectedPayStaff.role,
        phone: selectedPayStaff.phone || "",
        join_date: selectedPayStaff.join_date || "",
      },
      month: payMonth,
      year: payYear,
      breakdown: { ...currentSalaryBreakdown, netPayable: effectiveNetPayable },
    });
  };

  const handlePrintDetailedSlip = (payment: typeof salaryOnlyPayments[0]) => {
    const staff = staffList.find((s) => s.id === payment.staffId);
    if (!staff) { toast.error("স্টাফ পাওয়া যায়নি"); return; }
    try {
      printSalarySlip({
        staff: { name: staff.name, staff_id: staff.staff_id, role: staff.role, phone: staff.phone || "", join_date: staff.join_date || "" },
        month: payment.month,
        year: payment.year,
        breakdown: {
          baseSalary: Number(payment.baseSalary) || 0,
          totalDays: Number(payment.totalDays) || 30,
          absentDays: Number(payment.absenceDays) || 0,
          absenceDeduction: Number(payment.absenceDeduction) || 0,
          advanceDeduction: Number(payment.advanceDeduction) || 0,
          netPayable: Number(payment.netPayable) || Number(payment.amount) || 0,
          totalOpenAdvance: 0,
          dailyWage: (Number(payment.baseSalary) || 0) / (Number(payment.totalDays) || 30),
        },
        madrasaName: institution.name,
        madrasaAddress: institution.address,
      });
    } catch (err) {
      console.error("Print slip error:", err);
      toast.error("স্লিপ প্রিন্ট করতে সমস্যা হয়েছে");
    }
  };

  const handleReprintSalary = (payment: typeof salaryOnlyPayments[0]) => {
    const staff = staffList.find((s) => s.id === payment.staffId);
    if (!staff) { toast.error("স্টাফ পাওয়া যায়নি"); return; }
    try {
      printSalaryReceiptUnified({
        institution,
        staff: { name: staff.name, staff_id: staff.staff_id, role: staff.role, phone: staff.phone || "", join_date: staff.join_date || "" },
        month: payment.month,
        year: payment.year,
        breakdown: {
          baseSalary: Number(payment.baseSalary) || 0,
          totalDays: Number(payment.totalDays) || 30,
          absentDays: Number(payment.absenceDays) || 0,
          absenceDeduction: Number(payment.absenceDeduction) || 0,
          advanceDeduction: Number(payment.advanceDeduction) || 0,
          netPayable: Number(payment.netPayable) || Number(payment.amount) || 0,
          totalOpenAdvance: 0,
          dailyWage: (Number(payment.baseSalary) || 0) / (Number(payment.totalDays) || 30),
        },
        date: payment.date,
      });
    } catch (err) {
      console.error("Reprint salary error:", err);
      toast.error("রসিদ প্রিন্ট করতে সমস্যা হয়েছে");
    }
  };

  const handleSaveSalaryPdf = (payment: typeof salaryOnlyPayments[0]) => {
    const staff = staffList.find((s) => s.id === payment.staffId);
    if (!staff) { toast.error("স্টাফ পাওয়া যায়নি"); return; }
    try {
      saveSalarySlipPdf({
        institution,
        staffName: staff.name,
        staffId: staff.staff_id,
        staffRole: staff.role,
        month: payment.month,
        year: payment.year,
        baseSalary: Number(payment.baseSalary) || 0,
        totalDays: Number(payment.totalDays) || 30,
        absentDays: Number(payment.absenceDays) || 0,
        absenceDeduction: Number(payment.absenceDeduction) || 0,
        advanceDeduction: Number(payment.advanceDeduction) || 0,
        netPayable: Number(payment.netPayable) || Number(payment.amount) || 0,
        paymentDate: payment.date,
      });
      toast.success("PDF ডাউনলোড হচ্ছে");
    } catch (err) {
      console.error("Save PDF error:", err);
      toast.error("PDF সেভ করতে সমস্যা হয়েছে");
    }
  };

  if (staffLoading || salaryLoading || advancesLoading) {
    return <div>{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-16" style={{ borderRadius: 10, marginBottom: 12 }} />)}</div>;
  }

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#d4af37" }}>
            <Icon name="fa-money-check-alt" style={{ marginLeft: 8 }} /> বেতন ব্যবস্থাপনা
          </h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, marginTop: 4 }}>শিক্ষক বেতন, বকেয়া মাস ও অগ্রিম সমন্বয় পরিচালনা</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="fa-wallet" style={{ color: "#a855f7" }} />
          <span style={{ fontSize: 14 }}>মোট বেতন: <strong style={{ color: "#a855f7" }}>{formatTaka(totalSalary)}</strong></span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {TABS.map((tab) => (
          <button key={tab.id} className={activeTab === tab.id ? "btn-gold" : "btn-outline-gold"} onClick={() => setActiveTab(tab.id)}>
            <Icon name={tab.icon} /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "list" && (
        <>
          {canWrite && <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
            <button className="btn-gold" onClick={() => { resetForm(); setShowAdd(!showAdd); }}>
              <Icon name="fa-user-plus" /> নতুন স্টাফ
            </button>
          </div>}

          {showAdd && (
            <div className="content-box" style={{ animation: "fadeInUp 0.3s ease" }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#d4af37", marginBottom: 16 }}>{editingStaff ? "স্টাফ তথ্য সম্পাদনা" : "নতুন স্টাফ যোগ করুন"}</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 12 }}>
                <input className="glass-input" placeholder="স্টাফ আইডি *" value={formData.staffId || ""} onChange={(e) => setFormData({ ...formData, staffId: e.target.value })} />
                <input className="glass-input" placeholder="নাম *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                <input className="glass-input" placeholder="পদবী *" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} />
                <input className="glass-input" placeholder="ফোন নম্বর" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                <input type="number" className="glass-input" placeholder="বেতন *" value={formData.salary || ""} onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })} />
                <Popover>
                  <PopoverTrigger asChild>
                    <button className={cn("glass-input w-full text-right flex items-center gap-2", !formData.joinDate && "text-muted-foreground")}>
                      <Icon name="fa-calendar" size={14} />
                      {formData.joinDate ? format(formData.joinDate, "yyyy-MM-dd") : "জয়েনিং তারিখ"}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={formData.joinDate} onSelect={(value) => setFormData({ ...formData, joinDate: value })} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 6, display: "block" }}>প্রোফাইল ছবি</label>
                  <input type="file" accept="image/*" className="glass-input" style={{ fontSize: 12 }} onChange={(e) => e.target.files?.[0] && handlePhotoUpload("photo", e.target.files[0])} />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 6, display: "block" }}>আইডি কার্ডের ছবি</label>
                  <input type="file" accept="image/*" className="glass-input" style={{ fontSize: 12 }} onChange={(e) => e.target.files?.[0] && handlePhotoUpload("nidPhoto", e.target.files[0])} />
                </div>
              </div>

              {/* Extended Info Section */}
              <div style={{ borderTop: "1px solid rgba(212,175,55,0.15)", paddingTop: 12, marginBottom: 12 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#d4af37", marginBottom: 10 }}>অতিরিক্ত তথ্য</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                  <div><label style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 6, display: "block" }}>চুক্তির ধরন</label>
                    <select className="glass-select" value={formData.contractType} onChange={(e) => setFormData({ ...formData, contractType: e.target.value })}><option value="permanent">স্থায়ী</option><option value="temporary">অস্থায়ী</option><option value="contract">চুক্তিভিত্তিক</option></select>
                  </div>
                  <div><label style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 6, display: "block" }}>চুক্তি শুরু</label><input className="glass-input" type="date" value={formData.contractStart} onChange={(e) => setFormData({ ...formData, contractStart: e.target.value })} /></div>
                  <div><label style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 6, display: "block" }}>চুক্তি শেষ</label><input className="glass-input" type="date" value={formData.contractEnd} onChange={(e) => setFormData({ ...formData, contractEnd: e.target.value })} /></div>
                  <div><label style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 6, display: "block" }}>রক্তের গ্রুপ</label><input className="glass-input" placeholder="যেমন: A+" value={formData.bloodGroup} onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })} /></div>
                  <div style={{ gridColumn: "1 / -1" }}><label style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 6, display: "block" }}>ঠিকানা</label><input className="glass-input" placeholder="বর্তমান ঠিকানা" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} /></div>
                  <div style={{ gridColumn: "1 / -1" }}><label style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 6, display: "block" }}>শিক্ষাগত যোগ্যতা</label><input className="glass-input" placeholder="ডিগ্রি, প্রতিষ্ঠান, সাল" value={formData.qualifications} onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })} /></div>
                </div>
              </div>

              <div style={{ borderTop: "1px solid rgba(212,175,55,0.15)", paddingTop: 12, marginBottom: 12 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#d4af37", marginBottom: 10 }}>জরুরি যোগাযোগ</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                  <input className="glass-input" placeholder="জরুরি যোগাযোগের নাম" value={formData.emergencyContactName} onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })} />
                  <input className="glass-input" placeholder="জরুরি যোগাযোগের ফোন" value={formData.emergencyContactPhone} onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })} />
                  <input className="glass-input" placeholder="সম্পর্ক (যেমন: বাবা, মা)" value={formData.emergencyContactRelation} onChange={(e) => setFormData({ ...formData, emergencyContactRelation: e.target.value })} />
                </div>
              </div>

              {(formData.photo || formData.nidPhoto) && (
                <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                  {formData.photo && <img src={formData.photo} alt="Profile" style={{ width: 60, height: 60, borderRadius: 8, objectFit: "cover", border: "1px solid rgba(255,255,255,0.1)" }} />}
                  {formData.nidPhoto && <img src={formData.nidPhoto} alt="NID" style={{ height: 60, borderRadius: 8, objectFit: "cover", border: "1px solid rgba(255,255,255,0.1)" }} />}
                </div>
              )}

              <div style={{ display: "flex", gap: 12 }}>
                <button className="btn-gold" onClick={handleSubmitStaff}><Icon name="fa-save" /> {editingStaff ? "আপডেট করুন" : "যোগ করুন"}</button>
                <button className="btn-outline-gold" onClick={resetForm}>বাতিল</button>
              </div>
            </div>
          )}

          <div className="content-box" style={{ padding: 0 }}>
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ছবি</th>
                    <th>নাম</th>
                    <th>আইডি</th>
                    <th>পদবী</th>
                    <th>বেতন</th>
                    <th>অবস্থা</th>
                    {canWrite && <th style={{ textAlign: "center" }}>একশন</th>}
                  </tr>
                </thead>
                <tbody>
                  {staffList.map((staff) => (
                    <tr key={staff.id} style={{ cursor: "pointer" }} onClick={() => { setSelectedStaff(staff); setShowProfile(true); }}>
                      <td><img src={staff.photo || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(staff.name)}`} alt={staff.name} style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)" }} /></td>
                      <td style={{ fontWeight: 600 }}>{staff.name}</td>
                      <td style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{staff.staff_id}</td>
                      <td>{staff.role}</td>
                      <td style={{ fontWeight: 700, color: "#d4af37" }}>{formatTaka(Number(staff.salary))}</td>
                      <td><span className={staff.status === "active" ? "badge-success" : "badge-gold"}>{staff.status === "active" ? "সক্রিয়" : "নিষ্ক্রিয়"}</span></td>
                      {canWrite && <td style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                        <button className="action-btn" onClick={() => handleEditStaff(staff)}><Icon name="fa-edit" /></button>
                      </td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === "pay" && (
        <>
          <div className="content-box">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 6, display: "block" }}>স্টাফ নির্বাচন</label>
                <select className="glass-select" value={payStaffId} onChange={(e) => { setPayStaffId(e.target.value); setPayMonth(""); setCustomNetPayable(""); }}>
                  <option value="">-- নির্বাচন করুন --</option>
                  {teacherStaffList.map((staff) => <option key={staff.id} value={staff.id}>{staff.name} ({staff.designation || staff.role})</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 6, display: "block" }}>সাল</label>
                <select className="glass-select" value={payYear} onChange={(e) => { setPayYear(Number(e.target.value)); setPayMonth(""); setCustomNetPayable(""); }}>
                  {YEAR_OPTIONS.map((year) => <option key={year} value={year}>{toBengaliNumber(year)}</option>)}
                </select>
              </div>
            </div>

            {selectedPayStaff && (
              <>
                <div className="content-box" style={{ padding: 16, marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <img src={selectedPayStaff.photo || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(selectedPayStaff.name)}`} alt={selectedPayStaff.name} style={{ width: 40, height: 40, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)" }} />
                    <div>
                      <p style={{ fontWeight: 700 }}>{selectedPayStaff.name}</p>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{selectedPayStaff.role} • মূল বেতন: {formatTaka(Number(selectedPayStaff.salary))}</p>
                    </div>
                  </div>

                  <label style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 8, display: "block" }}>শুধু বকেয়া মাস দেখানো হচ্ছে</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
                    {dueMonths.map((month) => (
                      <button key={month} onClick={() => { setPayMonth(month); setCustomNetPayable(""); }} className={payMonth === month ? "btn-gold" : "btn-outline-gold"} style={{ padding: "8px 12px", fontSize: 12 }}>
                        {month}
                      </button>
                    ))}
                  </div>
                  {dueMonths.length === 0 && <p style={{ marginTop: 12, color: "rgba(255,255,255,0.5)" }}>এই স্টাফের জন্য নির্বাচিত বছরে কোনো বকেয়া মাস নেই</p>}
                </div>

                {currentSalaryBreakdown && (
                  <div className="content-box" style={{ marginBottom: 12 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#d4af37", marginBottom: 12 }}>{payMonth} {toBengaliNumber(payYear)} বেতন হিসাব</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
                      <div className="content-box" style={{ padding: 14, marginBottom: 0, textAlign: "center" }}><p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>মূল বেতন</p><p style={{ fontWeight: 800, color: "#d4af37" }}>{formatTaka(currentSalaryBreakdown.baseSalary)}</p></div>
                      <div className="content-box" style={{ padding: 14, marginBottom: 0, textAlign: "center" }}><p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>অনুপস্থিতি জরিমানা</p><p style={{ fontWeight: 800, color: "#dc3545" }}>{formatTaka(currentSalaryBreakdown.absenceDeduction)}</p></div>
                      <div className="content-box" style={{ padding: 14, marginBottom: 0, textAlign: "center" }}><p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>সমন্বয়যোগ্য অগ্রিম</p><p style={{ fontWeight: 800, color: "#f59e0b" }}>{formatTaka(currentSalaryBreakdown.advanceDeduction)}</p></div>
                      <div className="content-box" style={{ padding: 14, marginBottom: 0, textAlign: "center" }}><p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>অটো নেট প্রদেয়</p><p style={{ fontSize: 22, fontWeight: 900, color: "#22c55e" }}>{formatTaka(currentSalaryBreakdown.netPayable)}</p></div>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <label style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 6, display: "block" }}>কাস্টম প্রদেয় বেতন (ঐচ্ছিক)</label>
                      <input
                        type="number"
                        className="glass-input"
                        placeholder={`অটো: ${currentSalaryBreakdown.netPayable}`}
                        value={customNetPayable}
                        onChange={(e) => setCustomNetPayable(e.target.value)}
                      />
                      <p style={{ marginTop: 8, fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
                        চূড়ান্ত প্রদান হবে: {formatTaka(customNetPayable ? effectiveNetPayable : currentSalaryBreakdown.netPayable)}
                      </p>
                    </div>
                    <p style={{ marginTop: 12, fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
                      দৈনিক মজুরি = {formatTaka(Math.round(currentSalaryBreakdown.dailyWage))} • মোট দিন = {toBengaliNumber(currentSalaryBreakdown.totalDays)} • অনুপস্থিত = {toBengaliNumber(currentSalaryBreakdown.absentDays)} দিন • অবশিষ্ট অগ্রিম = {formatTaka(currentSalaryBreakdown.totalOpenAdvance)}
                    </p>
                  </div>
                )}
              </>
            )}

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button className="btn-outline-gold" onClick={handlePrintSalarySlip} disabled={!selectedPayStaff || !payMonth || !currentSalaryBreakdown}>
                <Icon name="fa-print" /> স্যালারি স্লিপ প্রিন্ট
              </button>
              <button className="btn-gold" onClick={handlePaySalary} disabled={!canWrite || !selectedPayStaff || !payMonth || !currentSalaryBreakdown || payingInProgress}>
                {payingInProgress ? <><Icon name="fa-spinner fa-spin" /> প্রক্রিয়াকরণ হচ্ছে...</> : <><Icon name="fa-paper-plane" /> নেট বেতন প্রদান করুন</>}
              </button>
            </div>
          </div>

          {payStaffId && staffPayHistory.length > 0 && (
            <div className="content-box" style={{ padding: 0 }}>
              <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(212,175,55,0.15)" }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#d4af37" }}>পূর্বের বেতন ইতিহাস</p>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>মাস</th>
                      <th>সাল</th>
                      <th>অনুপস্থিতি</th>
                      <th>অগ্রিম</th>
                      <th>নেট প্রদেয়</th>
                      <th>তারিখ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffPayHistory.map((payment) => (
                      <tr key={payment.id}>
                        <td>{payment.month}</td>
                        <td>{toBengaliNumber(payment.year)}</td>
                        <td>{formatTaka(Number(payment.absenceDeduction || 0))}</td>
                        <td>{formatTaka(Number(payment.advanceDeduction || 0))}</td>
                        <td style={{ color: "#22c55e", fontWeight: 700 }}>{formatTaka(Number(payment.netPayable || payment.amount))}</td>
                        <td style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>{payment.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══ Salary History Tab ═══ */}
      {activeTab === "history" && (
        <>
          <div className="content-box">
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#d4af37", marginBottom: 16 }}>
              <Icon name="fa-history" /> বেতন ইতিহাস
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 6, display: "block" }}>স্টাফ</label>
                <select className="glass-select" value={histFilterStaff} onChange={(e) => setHistFilterStaff(e.target.value)}>
                  <option value="">সকল স্টাফ</option>
                  {staffList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 6, display: "block" }}>সাল</label>
                <select className="glass-select" value={histFilterYear} onChange={(e) => setHistFilterYear(Number(e.target.value))}>
                  {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{toBengaliNumber(y)}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 6, display: "block" }}>মাস</label>
                <select className="glass-select" value={histFilterMonth} onChange={(e) => setHistFilterMonth(e.target.value)}>
                  <option value="">সকল মাস</option>
                  {MONTHS_BENGALI.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
          </div>

          {filteredSalaryHistory.length === 0 ? (
            <div className="content-box" style={{ textAlign: "center", padding: 40 }}>
              <Icon name="fa-inbox" size={32} style={{ color: "rgba(255,255,255,0.2)", marginBottom: 10 }} />
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>কোনো বেতন রেকর্ড পাওয়া যায়নি</p>
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="mobile-card-list">
                {filteredSalaryHistory.map((p) => {
                  const s = staffList.find((st) => st.id === p.staffId);
                  return (
                    <div key={p.id} className="content-box" style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: 14 }}>{s?.name || "—"}</p>
                          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{s?.role || ""} • {s?.staff_id || ""}</p>
                        </div>
                        <button className="action-btn" title="রসিদ" onClick={() => handleReprintSalary(p)}>
                          <Icon name="fa-print" size={12} />
                        </button>
                        <button className="action-btn" title="স্লিপ" onClick={() => handlePrintDetailedSlip(p)} style={{ marginRight: 4 }}>
                          <Icon name="fa-file-alt" size={12} />
                        </button>
                        <button className="action-btn" title="PDF সেভ" onClick={() => handleSaveSalaryPdf(p)} style={{ marginRight: 4 }}>
                          <Icon name="fa-download" size={12} />
                        </button>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 12 }}>
                        <span style={{ color: "rgba(255,255,255,0.5)" }}>মাস: <strong style={{ color: "#f8f9fa" }}>{p.month} {toBengaliNumber(p.year)}</strong></span>
                        <span style={{ color: "rgba(255,255,255,0.5)" }}>তারিখ: <strong style={{ color: "#f8f9fa" }}>{p.date}</strong></span>
                        <span style={{ color: "rgba(255,255,255,0.5)" }}>মূল বেতন: <strong style={{ color: "#d4af37" }}>{formatTaka(Number(p.baseSalary))}</strong></span>
                        <span style={{ color: "rgba(255,255,255,0.5)" }}>নেট প্রদেয়: <strong style={{ color: "#22c55e" }}>{formatTaka(Number(p.netPayable || p.amount))}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Desktop table */}
              <div className="content-box desktop-table-wrap" style={{ padding: 0 }}>
                <div style={{ overflowX: "auto" }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>নাম</th>
                        <th>পদবী</th>
                        <th>মাস</th>
                        <th>সাল</th>
                        <th>মূল বেতন</th>
                        <th>অনুপস্থিতি</th>
                        <th>অগ্রিম</th>
                        <th>নেট প্রদেয়</th>
                        <th>তারিখ</th>
                        <th style={{ textAlign: "center" }}>প্রিন্ট</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSalaryHistory.map((p) => {
                        const s = staffList.find((st) => st.id === p.staffId);
                        return (
                          <tr key={p.id}>
                            <td style={{ fontWeight: 600 }}>{s?.name || "—"}</td>
                            <td style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{s?.role || "—"}</td>
                            <td>{p.month}</td>
                            <td>{toBengaliNumber(p.year)}</td>
                            <td style={{ color: "#d4af37" }}>{formatTaka(Number(p.baseSalary))}</td>
                            <td style={{ color: "#dc3545" }}>{formatTaka(Number(p.absenceDeduction || 0))}</td>
                            <td style={{ color: "#f59e0b" }}>{formatTaka(Number(p.advanceDeduction || 0))}</td>
                            <td style={{ color: "#22c55e", fontWeight: 700 }}>{formatTaka(Number(p.netPayable || p.amount))}</td>
                            <td style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{p.date}</td>
                            <td style={{ textAlign: "center", whiteSpace: "nowrap" }}>
                              <button className="action-btn" title="রসিদ" onClick={() => handleReprintSalary(p)} style={{ marginLeft: 4 }}>
                                <Icon name="fa-print" size={12} />
                              </button>
                              <button className="action-btn" title="স্লিপ" onClick={() => handlePrintDetailedSlip(p)} style={{ marginLeft: 4 }}>
                                <Icon name="fa-file-alt" size={12} />
                              </button>
                              <button className="action-btn" title="PDF সেভ" onClick={() => handleSaveSalaryPdf(p)} style={{ marginLeft: 4 }}>
                                <Icon name="fa-download" size={12} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {activeTab === "advance" && (
        <>
          <div className="content-box">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 6, display: "block" }}>স্টাফ নির্বাচন</label>
                <select className="glass-select" value={advanceStaffId} onChange={(e) => setAdvanceStaffId(e.target.value)}>
                  <option value="">-- নির্বাচন করুন --</option>
                  {teacherStaffList.map((staff) => <option key={staff.id} value={staff.id}>{staff.name} ({staff.designation || staff.role})</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 6, display: "block" }}>অগ্রিম পরিমাণ</label>
                <input type="number" className="glass-input" value={advanceAmount || ""} onChange={(e) => setAdvanceAmount(Number(e.target.value))} placeholder="৳ পরিমাণ" />
              </div>
              <div>
                <label style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 6, display: "block" }}>তারিখ</label>
                <input type="date" className="glass-input" value={advanceDate} onChange={(e) => setAdvanceDate(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 6, display: "block" }}>নোট</label>
                <input className="glass-input" value={advanceNote} onChange={(e) => setAdvanceNote(e.target.value)} placeholder="ঐচ্ছিক নোট" />
              </div>
            </div>

            {selectedAdvanceStaff && (
              <div className="content-box" style={{ padding: 16, marginBottom: 12 }}>
                <p style={{ fontWeight: 700 }}>{selectedAdvanceStaff.name}</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>মোট অগ্রিম: {formatTaka(staffAdvanceHistory.reduce((sum, advance) => sum + Number(advance.amount), 0))}</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>অবশিষ্ট সমন্বয়যোগ্য অগ্রিম: {formatTaka(payableAdvanceBalance)}</p>
              </div>
            )}

            <button className="btn-gold" onClick={handleAdvancePayment} disabled={!canWrite || !advanceStaffId || advanceAmount <= 0}>
              <Icon name="fa-hand-holding-usd" /> অগ্রিম প্রদান সংরক্ষণ করুন
            </button>
          </div>

          {advanceStaffId && staffAdvanceHistory.length > 0 && (
            <div className="content-box" style={{ padding: 0 }}>
              <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(212,175,55,0.15)" }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#d4af37" }}>অগ্রিম প্রদানের ইতিহাস</p>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead><tr><th>তারিখ</th><th>পরিমাণ</th><th>বাকি</th><th>নোট</th></tr></thead>
                  <tbody>
                    {staffAdvanceHistory.map((advance) => (
                      <tr key={advance.id}>
                        <td>{advance.advanceDate}</td>
                        <td style={{ color: "#f59e0b", fontWeight: 700 }}>{formatTaka(Number(advance.amount))}</td>
                        <td>{formatTaka(Math.max(0, Number(advance.amount) - Number(advance.settledAmount || 0)))}</td>
                        <td>{advance.note || advance.settlementNote || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === "leave" && <LeaveManagementTab staffList={staffList} />}

      {activeTab === "due" && (
        <>
          <div className="content-box" style={{ textAlign: "center", padding: 24 }}>
            <Icon name="fa-wallet" size={28} style={{ color: "#fbbf24", display: "block", marginBottom: 8 }} />
            <p style={{ fontSize: 16, fontWeight: 700 }}>মোট বকেয়া বেতন</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: "#fbbf24", marginTop: 4 }}>{formatTaka(totalDue)}</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{toBengaliNumber(dueList.length)} জন শিক্ষকের বকেয়া আছে</p>
          </div>

          {dueList.length > 0 && (
            <div className="content-box" style={{ padding: 0 }}>
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>নাম</th>
                      <th>পদবী</th>
                      <th>বকেয়া মাস</th>
                      <th>বকেয়া টাকা</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dueList.map((item) => (
                      <tr key={item.staff.id}>
                        <td style={{ fontWeight: 600 }}>{item.staff.name}</td>
                        <td style={{ color: "rgba(255,255,255,0.6)" }}>{item.staff.role}</td>
                        <td style={{ color: "#dc3545", fontWeight: 700 }}>{item.dueMonths.join(", ")}</td>
                        <td style={{ color: "#fbbf24", fontWeight: 800 }}>{formatTaka(item.dueAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      <StaffProfileDialog
        staff={selectedStaff}
        open={showProfile}
        onOpenChange={setShowProfile}
        onEdit={canWrite ? (s: StaffRow) => { setShowProfile(false); handleEditStaff(s); } : undefined}
        onDelete={canDelete ? (s: StaffRow) => handleDeleteStaff(s) : undefined}
        onShowNid={() => setShowNid(true)}
      />

      <Dialog open={showNid} onOpenChange={setShowNid}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>এনআইডি ছবি</DialogTitle>
          </DialogHeader>
          {selectedStaff?.nid_photo && <img src={selectedStaff.nid_photo} alt="NID" style={{ width: "100%", borderRadius: 10 }} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}