import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export type AppRole = "super_admin" | "admin" | "teacher" | "member";

export const ALL_PAGES = [
  { key: 'dashboard', label: 'ড্যাশবোর্ড' },
  { key: 'students', label: 'ছাত্র ব্যবস্থাপনা' },
  { key: 'fees', label: 'ফি আদায়' },
  { key: 'payment_history', label: 'পেমেন্ট ইতিহাস' },
  { key: 'student_attendance', label: 'ছাত্রদের হাজিরা' },
  { key: 'staff_attendance', label: 'স্টাফদের হাজিরা' },
  { key: 'biometric_attendance', label: 'বায়োমেট্রিক হাজিরা' },
  { key: 'income', label: 'আয় ব্যবস্থাপনা' },
  { key: 'expense', label: 'খরচ ব্যবস্থাপনা' },
  { key: 'salary', label: 'বেতন ব্যবস্থাপনা' },
  { key: 'cashbook', label: 'ক্যাশবুক' },
  { key: 'exams', label: 'পরীক্ষা ব্যবস্থাপনা' },
  { key: 'notices', label: 'নোটিশ বোর্ড' },
  { key: 'library', label: 'লাইব্রেরি' },
  { key: 'reports', label: 'রিপোর্ট' },
  { key: 'whatsapp_messaging', label: 'WhatsApp মেসেজিং' },
  { key: 'parent', label: 'অভিভাবক পোর্টাল' },
  { key: 'settings', label: 'সেটিং' },
  { key: 'id_card', label: 'আইডি কার্ড' },
  { key: 'class_routine', label: 'ক্লাস রুটিন' },
  { key: 'syllabus', label: 'সিলেবাস' },
  { key: 'assignments', label: 'অ্যাসাইনমেন্ট' },
  { key: 'exam_routine', label: 'পরীক্ষার রুটিন' },
  { key: 'admit_card', label: 'অ্যাডমিট কার্ড' },
  { key: 'marksheet', label: 'মার্কশিট' },
  { key: 'teacher_grade_entry', label: 'শিক্ষক নম্বর এন্ট্রি' },
  { key: 'hostel', label: 'হোস্টেল' },
  { key: 'inventory', label: 'ইনভেন্টরি' },
  { key: 'hifz_tracking', label: 'হিফজ ট্র্যাকিং' },
] as const;

export type PageKey = typeof ALL_PAGES[number]['key'];

export const PAGE_GROUPS = [
  {
    label: 'শিক্ষার্থী ব্যবস্থাপনা',
    icon: '👨‍🎓',
    pages: ['students', 'student_attendance', 'id_card'],
  },
  {
    label: 'শিক্ষক ও স্টাফ',
    icon: '👨‍🏫',
    pages: ['staff_attendance', 'salary', 'biometric_attendance'],
  },
  {
    label: 'একাডেমিক',
    icon: '📚',
    pages: ['class_routine', 'syllabus', 'assignments', 'hifz_tracking'],
  },
  {
    label: 'পরীক্ষা ও ফলাফল',
    icon: '📝',
    pages: ['exams', 'exam_routine', 'admit_card', 'marksheet', 'teacher_grade_entry'],
  },
  {
    label: 'ফি ও হিসাবনিকাশ',
    icon: '💰',
    pages: ['fees', 'payment_history', 'income', 'expense', 'cashbook'],
  },
  {
    label: 'যোগাযোগ',
    icon: '📢',
    pages: ['notices', 'whatsapp_messaging'],
  },
  {
    label: 'অন্যান্য',
    icon: '📦',
    pages: ['library', 'hostel', 'inventory', 'reports'],
  },
  {
    label: 'সিস্টেম',
    icon: '⚙️',
    pages: ['dashboard', 'parent', 'settings'],
  },
] as const;

export const ROLE_PRESETS: Record<AppRole, { label: string; description: string; color: string; icon: string; defaultPages: string[] }> = {
  super_admin: {
    label: 'সুপার এডমিন',
    description: 'সম্পূর্ণ অ্যাক্সেস। সকল পৃষ্ঠা, বাটন ও ব্যবহারকারী ব্যবস্থাপনা।',
    color: '#d4af37',
    icon: '🔑',
    defaultPages: ALL_PAGES.map(p => p.key),
  },
  admin: {
    label: 'এডমিন',
    description: 'ডাটা যোগ ও সম্পাদনা করতে পারবে, কিন্তু মুছতে পারবে না। সেটিংস পরিবর্তন করতে পারবে।',
    color: '#28a745',
    icon: '✏️',
    defaultPages: ['dashboard', 'students', 'fees', 'payment_history', 'student_attendance', 'staff_attendance', 'biometric_attendance', 'income', 'expense', 'salary', 'cashbook', 'exams', 'notices', 'library', 'reports', 'whatsapp_messaging', 'parent', 'settings', 'id_card', 'class_routine', 'syllabus', 'assignments', 'exam_routine', 'admit_card', 'marksheet', 'teacher_grade_entry', 'hostel', 'inventory', 'hifz_tracking'],
  },
  teacher: {
    label: 'শিক্ষক',
    description: 'একাডেমিক মডিউলগুলোতে অ্যাক্সেস: হাজিরা, পরীক্ষা, নোটিশ, লাইব্রেরি।',
    color: '#a855f7',
    icon: '📚',
    defaultPages: ['dashboard', 'student_attendance', 'staff_attendance', 'exams', 'exam_routine', 'admit_card', 'marksheet', 'teacher_grade_entry', 'class_routine', 'syllabus', 'assignments', 'hifz_tracking', 'notices', 'library', 'reports', 'parent'],
  },
  member: {
    label: 'সদস্য',
    description: 'শুধুমাত্র পড়তে পারবে। কোনো পরিবর্তন করতে পারবে না।',
    color: '#60a5fa',
    icon: '👁️',
    defaultPages: ['parent'],
  },
};

export type TeacherPresetKey = 'attendance_teacher' | 'exam_teacher' | 'full_academic' | 'librarian';

export const TEACHER_PRESETS: Record<TeacherPresetKey, { label: string; description: string; icon: string; pages: string[] }> = {
  attendance_teacher: {
    label: 'হাজিরা শিক্ষক',
    description: 'শুধু হাজিরা নেওয়া ও দেখার অ্যাক্সেস',
    icon: '📋',
    pages: ['dashboard', 'student_attendance', 'staff_attendance', 'parent'],
  },
  exam_teacher: {
    label: 'পরীক্ষা শিক্ষক',
    description: 'পরীক্ষার নম্বর ও রেজাল্ট ব্যবস্থাপনা',
    icon: '📝',
    pages: ['dashboard', 'exams', 'teacher_grade_entry', 'reports', 'parent'],
  },
  full_academic: {
    label: 'সকল একাডেমিক',
    description: 'হাজিরা, পরীক্ষা, নোটিশ, লাইব্রেরি — সম্পূর্ণ একাডেমিক অ্যাক্সেস',
    icon: '📚',
    pages: ['dashboard', 'student_attendance', 'staff_attendance', 'exams', 'teacher_grade_entry', 'notices', 'library', 'reports', 'parent'],
  },
  librarian: {
    label: 'লাইব্রেরিয়ান',
    description: 'শুধু লাইব্রেরি ও বই ব্যবস্থাপনা',
    icon: '📖',
    pages: ['dashboard', 'library', 'parent'],
  },
};

export function useUserRole() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const query = useQuery({
    queryKey: ["user-role", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role, allowed_pages")
        .eq("user_id", userId)
        .limit(1);
      if (error) throw error;
      if (!data || data.length === 0) return null;
      const row = data[0] as { role: AppRole; allowed_pages: string | null };
      const parsedPages = row.allowed_pages
        ? row.allowed_pages.split(",").map((p) => p.trim()).filter(Boolean)
        : ['parent'];  // DEFAULT: only parent portal for users without explicit page assignments
      return { role: row.role, allowedPages: parsedPages };
    },
    enabled: !!userId,
  });

  const role = query.data?.role as AppRole | null;
  const allowedPages = query.data?.allowedPages || ['parent'];

  const hasPageAccess = (page: PageKey): boolean => {
    if (role === "super_admin") return true;
    return allowedPages.includes(page);
  };

  return {
    role,
    isLoading: query.isLoading,
    isSuperAdmin: role === "super_admin",
    isAdmin: role === "admin" || role === "super_admin",
    isTeacher: role === "teacher",
    isMember: role === "member",
    canWrite: role === "super_admin" || role === "admin" || role === "teacher",
    canDelete: role === "super_admin",
    userId,
    allowedPages,
    hasPageAccess,
  };
}
