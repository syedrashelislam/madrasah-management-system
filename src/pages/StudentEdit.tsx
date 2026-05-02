import { useParams, useNavigate } from "react-router-dom";
import { useClasses } from "@/hooks/useClasses";
import { useState, useEffect, useMemo, type ChangeEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { createHoverPrefetchProps } from "@/lib/prefetch";
import { ArrowRight, Trash2, Camera, Upload, X, User, Users, GraduationCap, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudent, useAddStudent, useUpdateStudent, useDeleteStudent, useHardDeleteStudent, useStudents } from "@/hooks/useStudents";
import { useUserRole } from "@/hooks/useUserRole";
import { useMaxUploadSize } from "@/hooks/useMaxUploadSize";
import { useFeeStructures } from "@/hooks/useFeeStructures";
import { showToast } from "@/lib/showToast";
import PageQuickNav from "@/components/PageQuickNav";

function PhotoUpload({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const { validateFile } = useMaxUploadSize();
  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!validateFile(file)) { e.target.value = ''; return; }
    const reader = new FileReader();
    reader.onload = (ev) => onChange(ev.target?.result as string);
    reader.readAsDataURL(file);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{label}</label>
      {value ? (
        <div style={{ position: "relative", width: "100%", height: 120, borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,0.15)" }}>
          <img src={value} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <button type="button" onClick={() => onChange("")} style={{ position: "absolute", top: 6, right: 6, width: 26, height: 26, borderRadius: "50%", background: "rgba(239,68,68,0.85)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", height: 120, borderRadius: 10, border: "2px dashed rgba(255,255,255,0.2)", cursor: "pointer", background: "rgba(255,255,255,0.03)", transition: "all 0.2s", gap: 6 }}>
          <Upload className="w-5 h-5" style={{ color: "rgba(255,255,255,0.35)" }} />
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>ছবি আপলোড করুন</span>
          <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
        </label>
      )}
    </div>
  );
}


function FormField({ label, children, required }: { label: string; children: ReactNode; required?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>
      <label style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>
        {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const TABS = [
  { key: "personal", label: "ব্যক্তিগত", icon: "👤" },
  { key: "guardian", label: "অভিভাবক", icon: "👨‍👩‍👧" },
  { key: "admission", label: "ভর্তি", icon: "🎓" },
  { key: "documents", label: "ডকুমেন্ট", icon: "📄" },
];

export default function StudentEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canWrite, canDelete } = useUserRole();
  const { validateFile } = useMaxUploadSize();
  const isNew = !id || id === "new";
  const [activeTab, setActiveTab] = useState("personal");

  const { data: student, isLoading } = useStudent(isNew ? undefined : id);
  const { data: allStudents = [] } = useStudents();
  const { data: classes = [] } = useClasses();
  const addMutation = useAddStudent();
  const updateMutation = useUpdateStudent();
  const deleteMutation = useDeleteStudent();
  const hardDeleteMutation = useHardDeleteStudent();
  const { data: feeStructures = [] } = useFeeStructures();

  const nextStudentId = useMemo(() => {
    const ids = allStudents.map(s => s.student_id).filter(id => id.startsWith('STD-')).map(id => parseInt(id.replace('STD-', ''), 10)).filter(n => !isNaN(n));
    return `STD-${String((ids.length ? Math.max(...ids) : 0) + 1).padStart(4, '0')}`;
  }, [allStudents]);

  const nextAdmissionNo = useMemo(() => {
    const year = new Date().getFullYear();
    const prefix = `ADM-${year}-`;
    const nos = allStudents.map(s => s.admission_no || '').filter(no => no.startsWith(prefix)).map(no => parseInt(no.replace(prefix, ''), 10)).filter(n => !isNaN(n));
    return `${prefix}${String((nos.length ? Math.max(...nos) : 0) + 1).padStart(4, '0')}`;
  }, [allStudents]);

  const defaultForm = {
    student_id: "", name: "", photo_url: "", class_id: (classes[0]?.class_id ?? 1) as number,
    class_name: (classes[0]?.name ?? "") as string, section: "", roll: "", monthly_fee: 2000,
    admission_fee: 0, status: "active", father_name: "", guardian_name: "", guardian_phone: "",
    address: "", admission_date: new Date().toISOString().slice(0, 10), date_of_birth: "" as string | null,
    blood_group: "", religion: "", birth_reg_no: "", mother_name: "", emergency_contact: "",
    previous_institution: "", medical_notes: "", mother_nid_photo: "", father_nid_photo: "",
    birth_cert_photo: "", guardian_whatsapp: "", guardian_email: "", admission_no: "", admission_status: "pending",
  };

  const [form, setForm] = useState(defaultForm);
  const [idError, setIdError] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const validators: Record<string, (val: string) => string> = {
    name: v => !v.trim() ? 'ছাত্রের নাম আবশ্যক' : v.trim().length < 2 ? 'নাম কমপক্ষে ২ অক্ষর' : '',
    guardian_name: v => !v.trim() ? 'অভিভাবকের নাম আবশ্যক' : v.trim().length < 2 ? 'নাম কমপক্ষে ২ অক্ষর' : '',
    guardian_phone: v => { if (!v.trim()) return 'মোবাইল নম্বর আবশ্যক'; const c = v.replace(/[\s\-()]/g, ''); return !/^\+?[0-9]{7,15}$/.test(c) ? 'সঠিক মোবাইল নম্বর দিন (০১XXXXXXXXX)' : ''; },
    date_of_birth: v => { if (!v) return 'জন্ম তারিখ আবশ্যক'; const d = new Date(v); if (isNaN(d.getTime())) return 'সঠিক তারিখ দিন'; if (d > new Date()) return 'ভবিষ্যতের তারিখ দেওয়া যাবে না'; const age = (Date.now() - d.getTime()) / (365.25 * 24 * 60 * 60 * 1000); return age > 30 ? 'বয়স ৩০ বছরের বেশি নয়' : ''; },
    address: v => !v.trim() ? 'ঠিকানা আবশ্যক' : v.trim().length < 5 ? 'ঠিকানা কমপক্ষে ৫ অক্ষর' : '',
    father_name: v => !v.trim() ? 'বাবার নাম আবশ্যক' : '',
  };

  const validateField = (field: string, value: string) => validators[field]?.(value) || '';

  const handleValidatedChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
    const err = validateField(field, value);
    setFieldErrors(prev => { const n = { ...prev }; err ? (n[field] = err) : delete n[field]; return n; });
  };

  const getFieldError = (field: string) => touched[field] ? (fieldErrors[field] || '') : '';

  useEffect(() => {
    if (!isNew && student && !initialized) {
      setForm({ student_id: student.student_id, name: student.name, photo_url: student.photo_url || "", class_id: student.class_id, class_name: student.class_name, section: student.section || "", roll: student.roll || "", monthly_fee: student.monthly_fee, admission_fee: student.admission_fee, status: student.status, father_name: student.father_name || "", guardian_name: student.guardian_name || "", guardian_phone: student.guardian_phone || "", address: student.address || "", admission_date: student.admission_date || "", date_of_birth: student.date_of_birth || "", blood_group: student.blood_group || "", religion: student.religion || "", birth_reg_no: student.birth_reg_no || "", mother_name: student.mother_name || "", emergency_contact: student.emergency_contact || "", previous_institution: student.previous_institution || "", medical_notes: student.medical_notes || "", mother_nid_photo: student.mother_nid_photo || "", father_nid_photo: student.father_nid_photo || "", birth_cert_photo: student.birth_cert_photo || "", guardian_whatsapp: student.guardian_whatsapp || "", guardian_email: student.guardian_email || "", admission_no: student.admission_no || "", admission_status: student.admission_status || "approved" });
      setInitialized(true);
    }
  }, [student, isNew, initialized]);

  useEffect(() => { if (isNew && (form.student_id === '' || form.student_id === 'STD-') && nextStudentId) setForm(prev => ({ ...prev, student_id: nextStudentId })); }, [nextStudentId, isNew]);
  useEffect(() => { if (isNew && !form.admission_no && nextAdmissionNo) setForm(prev => ({ ...prev, admission_no: nextAdmissionNo })); }, [nextAdmissionNo, isNew]);

  if (!isNew && isLoading) {
    return (
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <Skeleton className="h-8 w-40" style={{ marginBottom: 20 }} />
        <div className="glass-card" style={{ padding: 24 }}>
          <Skeleton className="h-24 w-24 rounded-xl" style={{ margin: "0 auto 20px" }} />
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" style={{ marginBottom: 10, borderRadius: 10 }} />)}
        </div>
      </div>
    );
  }

  if (!isNew && !isLoading && !student) return <div style={{ textAlign: "center", padding: "60px 24px", color: "rgba(255,255,255,0.4)" }}>ছাত্র পাওয়া যায়নি</div>;

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!validateFile(file)) { e.target.value = ''; return; }
    const reader = new FileReader();
    reader.onload = (ev) => setForm({ ...form, photo_url: ev.target?.result as string });
    reader.readAsDataURL(file);
  };

  const handleClassChange = (classId: number) => {
    const classItem = classes.find(c => c.class_id === classId);
    const feeStruct = feeStructures.find(f => f.classId === classId);
    setForm(prev => ({ ...prev, class_id: classId, class_name: classItem?.name || '', ...(isNew && feeStruct ? { monthly_fee: feeStruct.monthlyFee, admission_fee: feeStruct.admissionFee } : {}) }));
  };

  const validateId = (newId: string) => {
    setForm({ ...form, student_id: newId });
    if (!newId.trim()) { setIdError("আইডি নম্বর দিন"); return; }
    const dup = allStudents.find(s => s.student_id === newId && (!student || s.student_id !== student.student_id));
    setIdError(dup ? "এই আইডি ইতিমধ্যে ব্যবহৃত হয়েছে" : "");
  };

  const handleSave = () => {
    const reqFields = ['student_id', 'name', 'guardian_name', 'guardian_phone', 'date_of_birth', 'address', 'father_name'];
    const newTouched: Record<string, boolean> = {};
    reqFields.forEach(f => { newTouched[f] = true; });
    setTouched(prev => ({ ...prev, ...newTouched }));
    const newErrors: Record<string, string> = {};
    reqFields.forEach(f => { const err = validateField(f, (form as any)[f] || ''); if (err) newErrors[f] = err; });
    if (!form.student_id.trim()) newErrors.student_id = 'আইডি নম্বর দিন';
    if (idError) newErrors.student_id = idError;
    setFieldErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      showToast.warning(Object.values(newErrors)[0], { description: 'অনুগ্রহ করে প্রয়োজনীয় তথ্য পূরণ করুন' });
      // Switch to the tab with the first error
      if (newErrors.name || newErrors.date_of_birth || newErrors.student_id) setActiveTab("personal");
      else if (newErrors.guardian_name || newErrors.guardian_phone || newErrors.address || newErrors.father_name) setActiveTab("guardian");
      return;
    }
    const classItem = classes.find(c => c.class_id === form.class_id);
    const payload = { student_id: form.student_id, name: form.name, photo_url: form.photo_url, class_id: form.class_id, class_name: classItem?.name || form.class_name, section: form.section, roll: form.roll, monthly_fee: form.monthly_fee, admission_fee: form.admission_fee, status: form.status, father_name: form.father_name || form.guardian_name, mother_name: form.mother_name, guardian_name: form.guardian_name, guardian_phone: form.guardian_phone, guardian_whatsapp: form.guardian_whatsapp, guardian_email: form.guardian_email, contact: form.guardian_phone, address: form.address, admission_date: form.admission_date, date_of_birth: form.date_of_birth || null, dob: form.date_of_birth || "", blood_group: form.blood_group, religion: form.religion, birth_reg_no: form.birth_reg_no, emergency_contact: form.emergency_contact, previous_institution: form.previous_institution, medical_notes: form.medical_notes, mother_nid_photo: form.mother_nid_photo, father_nid_photo: form.father_nid_photo, birth_cert_photo: form.birth_cert_photo, admission_no: form.admission_no, admission_status: isNew ? 'pending' : form.admission_status };
    if (isNew) { addMutation.mutate(payload as any, { onSuccess: () => navigate(`/students/${payload.student_id}`) }); }
    else { updateMutation.mutate({ student_id: form.student_id, ...payload } as any, { onSuccess: () => navigate(`/students/${id}`) }); }
  };

  const handleDelete = () => { setDeleteConfirmText(""); setShowDeleteDialog(true); };

  const photoSrc = form.photo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(form.name || "new")}&backgroundColor=1a7a4f&textColor=ffffff`;
  const inputCls = "glass-input w-full";
  const saving = addMutation.isPending || updateMutation.isPending;
  const backPath = isNew ? "/students" : `/students/${id}`;

  const FieldError = ({ field }: { field: string }) => getFieldError(field) ? <p style={{ fontSize: 12, color: "#fc8181", marginTop: 4 }}>{getFieldError(field)}</p> : null;

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", paddingBottom: 100 }}>
      {/* Quick Nav */}
      <PageQuickNav />

      {/* Back Button */}
      <button onClick={() => navigate(backPath)} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "rgba(255,255,255,0.5)", background: "none", border: "none", cursor: "pointer", marginBottom: 16, padding: 0, transition: "color 0.2s" }}
        onMouseEnter={e => (e.currentTarget.style.color = "#d4af37")} onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
        {...createHoverPrefetchProps(backPath)}>
        <ArrowRight className="w-4 h-4" style={{ transform: "rotate(180deg)" }} />
        {isNew ? "ছাত্র তালিকায় ফিরুন" : "প্রোফাইলে ফিরুন"}
      </button>

      {/* Header Card */}
      <div className="glass-card" style={{ padding: "20px 20px 0", marginBottom: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          {/* Photo */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <img src={photoSrc} alt="ছবি" style={{ width: 72, height: 72, borderRadius: 16, objectFit: "cover", border: "2px solid rgba(212,175,55,0.4)" }} />
            <label style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.55)", borderRadius: 16, opacity: 0, cursor: "pointer", transition: "opacity 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "1")} onMouseLeave={e => (e.currentTarget.style.opacity = "0")}>
              <Camera className="w-5 h-5" style={{ color: "#fff" }} />
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoChange} />
            </label>
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#d4af37", margin: 0 }}>{isNew ? "নতুন ছাত্র ভর্তি" : "তথ্য সম্পাদনা"}</h2>
            {!isNew && form.name && <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", margin: "4px 0 0" }}>{form.name} · {form.class_name}</p>}
            {isNew && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "4px 0 0" }}>সকল * চিহ্নিত তথ্য আবশ্যক</p>}
          </div>
        </div>

        {/* Tab Bar */}
        <div style={{ display: "flex", gap: 0, borderBottom: "2px solid rgba(255,255,255,0.08)" }}>
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{ flex: 1, padding: "10px 4px", fontSize: 12, fontWeight: 600, background: "none", border: "none", cursor: "pointer", transition: "all 0.2s", color: activeTab === tab.key ? "#d4af37" : "rgba(255,255,255,0.4)", borderBottom: activeTab === tab.key ? "2px solid #d4af37" : "2px solid transparent", marginBottom: -2, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <span style={{ fontSize: 16 }}>{tab.icon}</span>
              <span style={{ fontSize: 11 }}>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="glass-card" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTop: "none", padding: "20px" }}>

        {/* ── Tab: ব্যক্তিগত তথ্য ── */}
        {activeTab === "personal" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            <FormField label="আইডি নম্বর" required>
              <input className={`${inputCls} ${(idError || (touched.student_id && !form.student_id.trim())) ? "border-destructive" : ""}`} value={form.student_id} onChange={e => validateId(e.target.value)} placeholder="STD-0001" disabled={!isNew} style={{ fontFamily: "monospace" }} />
              {idError && <p style={{ fontSize: 12, color: "#fc8181", marginTop: 4 }}>{idError}</p>}
            </FormField>
            <FormField label="ছাত্রের নাম" required>
              <input className={`${inputCls} ${getFieldError('name') ? "border-destructive" : ""}`} value={form.name} onChange={e => handleValidatedChange('name', e.target.value)} placeholder="পুরো নাম লিখুন" />
              <FieldError field="name" />
            </FormField>
            <FormField label="শ্রেণি">
              <select className={inputCls} value={form.class_id} onChange={e => handleClassChange(Number(e.target.value))}>
                {classes.map(c => <option key={c.class_id} value={c.class_id}>{c.name}</option>)}
              </select>
            </FormField>
            <FormField label="সেকশন/শাখা">
              <input className={inputCls} value={form.section} onChange={e => setForm({ ...form, section: e.target.value })} placeholder="যেমন: ক, খ, গ" />
            </FormField>
            <FormField label="রোল নম্বর">
              <input className={inputCls} value={form.roll} onChange={e => setForm({ ...form, roll: e.target.value })} placeholder="যেমন: ০১" />
            </FormField>
            <FormField label="জন্ম তারিখ" required>
              <input type="date" className={`${inputCls} ${getFieldError('date_of_birth') ? "border-destructive" : ""}`} value={form.date_of_birth || ""} onChange={e => handleValidatedChange('date_of_birth', e.target.value)} />
              <FieldError field="date_of_birth" />
            </FormField>
            <FormField label="রক্তের গ্রুপ">
              <select className={inputCls} value={form.blood_group} onChange={e => setForm({ ...form, blood_group: e.target.value })}>
                <option value="">নির্বাচন করুন</option>
                {["A+","A-","B+","B-","O+","O-","AB+","AB-"].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </FormField>
            <FormField label="ধর্ম">
              <select className={inputCls} value={form.religion} onChange={e => setForm({ ...form, religion: e.target.value })}>
                <option value="">নির্বাচন করুন</option>
                {["ইসলাম","হিন্দু","খ্রিস্টান","বৌদ্ধ","অন্যান্য"].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </FormField>
            <FormField label="জন্ম নিবন্ধন নম্বর">
              <input className={inputCls} value={form.birth_reg_no} onChange={e => setForm({ ...form, birth_reg_no: e.target.value })} placeholder="জন্ম নিবন্ধন নম্বর" />
            </FormField>
          </div>
        )}

        {/* ── Tab: অভিভাবকের তথ্য ── */}
        {activeTab === "guardian" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            <FormField label="বাবার নাম" required>
              <input className={`${inputCls} ${getFieldError('father_name') ? "border-destructive" : ""}`} value={form.father_name} onChange={e => handleValidatedChange('father_name', e.target.value)} placeholder="বাবার পুরো নাম" />
              <FieldError field="father_name" />
            </FormField>
            <FormField label="মায়ের নাম">
              <input className={inputCls} value={form.mother_name} onChange={e => setForm({ ...form, mother_name: e.target.value })} placeholder="মায়ের পুরো নাম" />
            </FormField>
            <FormField label="অভিভাবকের নাম" required>
              <input className={`${inputCls} ${getFieldError('guardian_name') ? "border-destructive" : ""}`} value={form.guardian_name} onChange={e => handleValidatedChange('guardian_name', e.target.value)} placeholder="অভিভাবকের নাম" />
              <FieldError field="guardian_name" />
            </FormField>
            <FormField label="অভিভাবকের মোবাইল নম্বর" required>
              <input className={`${inputCls} ${getFieldError('guardian_phone') ? "border-destructive" : ""}`} value={form.guardian_phone} onChange={e => handleValidatedChange('guardian_phone', e.target.value)} placeholder="০১XXXXXXXXX" inputMode="tel" />
              <FieldError field="guardian_phone" />
            </FormField>
            <FormField label="অভিভাবকের WhatsApp নম্বর">
              <input className={inputCls} value={form.guardian_whatsapp} onChange={e => setForm({ ...form, guardian_whatsapp: e.target.value })} placeholder="০১XXXXXXXXX" inputMode="tel" />
            </FormField>
            <FormField label="অভিভাবকের ইমেইল">
              <input type="email" className={inputCls} value={form.guardian_email} onChange={e => setForm({ ...form, guardian_email: e.target.value })} placeholder="name@example.com" inputMode="email" />
            </FormField>
            <FormField label="জরুরি যোগাযোগ নম্বর">
              <input className={inputCls} value={form.emergency_contact} onChange={e => setForm({ ...form, emergency_contact: e.target.value })} placeholder="জরুরি যোগাযোগ" inputMode="tel" />
            </FormField>
            <div style={{ gridColumn: "1 / -1" }}>
              <FormField label="বর্তমান ঠিকানা" required>
                <input className={`${inputCls} ${getFieldError('address') ? "border-destructive" : ""}`} value={form.address} onChange={e => handleValidatedChange('address', e.target.value)} placeholder="সম্পূর্ণ ঠিকানা লিখুন" />
                <FieldError field="address" />
              </FormField>
            </div>
          </div>
        )}

        {/* ── Tab: ভর্তি তথ্য ── */}
        {activeTab === "admission" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            <FormField label="ভর্তি নম্বর (স্বয়ংক্রিয়)">
              <input className={inputCls} value={form.admission_no} readOnly disabled style={{ opacity: 0.65, fontFamily: "monospace" }} />
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 3 }}>স্বয়ংক্রিয়ভাবে তৈরি হয়</p>
            </FormField>
            <FormField label="ভর্তির তারিখ">
              <input type="date" className={inputCls} value={form.admission_date} onChange={e => setForm({ ...form, admission_date: e.target.value })} />
            </FormField>
            <FormField label="মাসিক ফি (টাকা)">
              <input type="number" className={inputCls} value={form.monthly_fee} onChange={e => setForm({ ...form, monthly_fee: Number(e.target.value) })} inputMode="numeric" />
            </FormField>
            <FormField label="ভর্তি ফি (টাকা)">
              <input type="number" className={inputCls} value={form.admission_fee} onChange={e => setForm({ ...form, admission_fee: Number(e.target.value) })} inputMode="numeric" />
            </FormField>
            <div style={{ gridColumn: "1 / -1" }}>
              <FormField label="পূর্ববর্তী প্রতিষ্ঠান">
                <input className={inputCls} value={form.previous_institution} onChange={e => setForm({ ...form, previous_institution: e.target.value })} placeholder="পূর্ববর্তী স্কুল/মাদ্রাসার নাম" />
              </FormField>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <FormField label="চিকিৎসা সংক্রান্ত তথ্য">
                <textarea className={inputCls} rows={3} value={form.medical_notes} onChange={e => setForm({ ...form, medical_notes: e.target.value })} placeholder="অ্যালার্জি, দীর্ঘমেয়াদী রোগ বা অন্য স্বাস্থ্য তথ্য" style={{ resize: "vertical", minHeight: 80 }} />
              </FormField>
            </div>
            {!isNew && (
              <>
                <FormField label="ভর্তির অবস্থা">
                  <select className={inputCls} value={form.admission_status} onChange={e => setForm({ ...form, admission_status: e.target.value })}>
                    <option value="pending">অপেক্ষমান</option>
                    <option value="approved">অনুমোদিত</option>
                    <option value="rejected">বাতিল</option>
                  </select>
                </FormField>
                <FormField label="স্ট্যাটাস">
                  <select className={inputCls} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="active">সক্রিয়</option>
                    <option value="inactive">নিষ্ক্রিয়</option>
                  </select>
                </FormField>
              </>
            )}
          </div>
        )}

        {/* ── Tab: ডকুমেন্ট ── */}
        {activeTab === "documents" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
            <PhotoUpload label="বাবার এনআইডি ছবি" value={form.father_nid_photo} onChange={v => setForm({ ...form, father_nid_photo: v })} />
            <PhotoUpload label="মায়ের এনআইডি ছবি" value={form.mother_nid_photo} onChange={v => setForm({ ...form, mother_nid_photo: v })} />
            <PhotoUpload label="জন্ম নিবন্ধন ছবি" value={form.birth_cert_photo} onChange={v => setForm({ ...form, birth_cert_photo: v })} />
          </div>
        )}

        {/* Tab navigation arrows (mobile) */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <button onClick={() => { const i = TABS.findIndex(t => t.key === activeTab); if (i > 0) setActiveTab(TABS[i - 1].key); }} disabled={activeTab === TABS[0].key}
            style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)", color: activeTab === TABS[0].key ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.7)", fontSize: 13, cursor: activeTab === TABS[0].key ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 5 }}>
            ← আগের ধাপ
          </button>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", alignSelf: "center" }}>
            {TABS.findIndex(t => t.key === activeTab) + 1} / {TABS.length}
          </span>
          <button onClick={() => { const i = TABS.findIndex(t => t.key === activeTab); if (i < TABS.length - 1) setActiveTab(TABS[i + 1].key); }} disabled={activeTab === TABS[TABS.length - 1].key}
            style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)", color: activeTab === TABS[TABS.length - 1].key ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.7)", fontSize: 13, cursor: activeTab === TABS[TABS.length - 1].key ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 5 }}>
            পরের ধাপ →
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      {!isNew && canDelete && (
        <div style={{ marginTop: 16, padding: 18, background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 14 }}>
          <h3 style={{ color: "#ef4444", fontWeight: 700, fontSize: 14, margin: "0 0 8px" }}>⚠️ বিপদ এলাকা</h3>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, margin: "0 0 12px", lineHeight: 1.6 }}>
            এই ছাত্রের সকল ডেটা — পেমেন্ট, উপস্থিতি, পরীক্ষার নম্বর সহ — চিরতরে মুছে যাবে।
          </p>
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={hardDeleteMutation.isPending} className="gap-1.5">
            <Trash2 className="w-3.5 h-3.5" />
            {hardDeleteMutation.isPending ? "মুছছে..." : "স্থায়ীভাবে ডিলিট করুন"}
          </Button>
        </div>
      )}

      {/* ── Sticky Save Button ── */}
      {canWrite && (
        <div style={{ position: "fixed", bottom: 72, left: 0, right: 0, padding: "10px 16px", background: "rgba(15,23,42,0.96)", backdropFilter: "blur(14px)", borderTop: "1px solid rgba(255,255,255,0.08)", zIndex: 100, display: "flex", gap: 10 }}>
          <button onClick={() => navigate(backPath)} style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            বাতিল
          </button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 3, padding: "12px 0", borderRadius: 12, border: "none", background: saving ? "rgba(212,175,55,0.5)" : "linear-gradient(135deg, #d4af37, #b8960c)", color: "#0a1f0a", fontSize: 15, fontWeight: 800, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {saving ? "সংরক্ষণ হচ্ছে..." : isNew ? "✅ ভর্তি সম্পন্ন করুন" : "💾 পরিবর্তন সংরক্ষণ করুন"}
          </button>
        </div>
      )}

      {/* ── Delete Confirmation Dialog ── */}
      {showDeleteDialog && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 16 }}>
          <div style={{ background: "#12121f", border: "2px solid rgba(239,68,68,0.6)", borderRadius: 18, padding: 28, maxWidth: 420, width: "100%", boxShadow: "0 25px 60px rgba(0,0,0,0.6)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🗑️</div>
              <div>
                <h3 style={{ color: "#ef4444", fontSize: 16, fontWeight: 700, margin: 0 }}>স্থায়ীভাবে ডিলিট করুন</h3>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: 0 }}>এই কাজ পূর্বাবস্থায় ফেরানো যাবে না</p>
              </div>
            </div>
            <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
              <p style={{ color: "rgba(255,255,255,0.9)", fontWeight: 700, margin: "0 0 4px", fontSize: 14 }}>{form.name}</p>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, margin: 0 }}>আইডি: {form.student_id} · শ্রেণী: {form.class_name}</p>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 6 }}>
                নিশ্চিত করতে নিচে <strong style={{ color: "#ef4444", letterSpacing: 1 }}>DELETE</strong> টাইপ করুন:
              </label>
              <input value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} placeholder="DELETE" autoFocus
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, boxSizing: "border-box", border: `1px solid ${deleteConfirmText === "DELETE" ? "rgba(239,68,68,0.7)" : "rgba(255,255,255,0.15)"}`, background: deleteConfirmText === "DELETE" ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.05)", color: "#fff", fontSize: 14, outline: "none" }} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button disabled={deleteConfirmText !== "DELETE" || hardDeleteMutation.isPending}
                onClick={() => hardDeleteMutation.mutate(id!, { onSuccess: () => navigate("/students") })}
                style={{ flex: 1, padding: 12, borderRadius: 10, border: "none", fontWeight: 700, fontSize: 14, cursor: deleteConfirmText === "DELETE" ? "pointer" : "not-allowed", background: deleteConfirmText === "DELETE" ? "linear-gradient(135deg,#dc2626,#b91c1c)" : "rgba(239,68,68,0.2)", color: deleteConfirmText === "DELETE" ? "#fff" : "rgba(255,255,255,0.3)" }}>
                {hardDeleteMutation.isPending ? "মুছছে..." : "হ্যাঁ, ডিলিট করুন"}
              </button>
              <button onClick={() => { setShowDeleteDialog(false); setDeleteConfirmText(""); }} disabled={hardDeleteMutation.isPending}
                style={{ padding: "12px 20px", borderRadius: 10, fontSize: 14, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)", cursor: "pointer" }}>বাতিল</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
