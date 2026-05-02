// ============================================================
// useHifz.ts — Hifz Tracking Data Hooks
// ফাইলটি src/hooks/ ফোল্ডারে রাখুন
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ── Types ─────────────────────────────────────────────────────

export interface HifzStudent {
  id: string;
  student_id: string;
  student_name: string;
  class_name: string;
  teacher_id: string | null;
  teacher_name: string | null;
  total_pages_memorized: number;
  daily_target_pages: number;
  start_date: string;
  expected_completion: string | null;
  status: 'active' | 'completed' | 'paused';
  notes: string | null;
  created_at: string;
}

export interface HifzProgress {
  id: string;
  hifz_student_id: string;
  student_id: string;
  surah_number: number | null;
  surah_name: string | null;
  para_number: number | null;
  start_page: number;
  end_page: number;
  pages_count: number;
  session_type: 'memorization' | 'revision';
  quality: 'excellent' | 'good' | 'average' | 'needs_work';
  test_date: string;
  teacher_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface HifzRevision {
  id: string;
  hifz_student_id: string;
  start_page: number;
  end_page: number;
  revision_date: string;
  quality: 'excellent' | 'good' | 'average' | 'needs_work';
  teacher_id: string | null;
  notes: string | null;
}

export interface HifzSummary {
  student_id: string;
  student_name: string;
  class_name: string;
  total_pages: number;
  completion_pct: number;
  last_session: string | null;
  teacher_name: string | null;
  status: string;
  daily_target: number;
}

// ── Hooks ─────────────────────────────────────────────────────

/** সব হিফজ ছাত্রদের তালিকা */
export function useHifzStudents() {
  return useQuery({
    queryKey: ['hifz_students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hifz_students')
        .select(`
          *,
          students!inner(name, class_name),
          staff:teacher_id(name)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row: any) => ({
        ...row,
        student_name: row.students?.name ?? '',
        class_name: row.students?.class_name ?? '',
        teacher_name: row.staff?.name ?? null,
      })) as HifzStudent[];
    },
  });
}

/** একজন ছাত্রের হিফজ সেশন লিস্ট */
export function useHifzProgress(hifzStudentId?: string) {
  return useQuery({
    queryKey: ['hifz_progress', hifzStudentId],
    enabled: !!hifzStudentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hifz_progress')
        .select('*')
        .eq('hifz_student_id', hifzStudentId!)
        .order('test_date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as HifzProgress[];
    },
  });
}

/** ড্যাশবোর্ডের জন্য সারসংক্ষেপ */
export function useHifzSummary() {
  return useQuery({
    queryKey: ['hifz_summary'],
    queryFn: async () => {
      const { data: students, error } = await supabase
        .from('hifz_students')
        .select(`
          id, status, total_pages_memorized, daily_target_pages,
          students!inner(name, class_name),
          staff:teacher_id(name)
        `)
        .order('total_pages_memorized', { ascending: false });
      if (error) throw error;

      const { data: lastSessions } = await supabase
        .from('hifz_progress')
        .select('hifz_student_id, test_date')
        .order('test_date', { ascending: false });

      const lastMap = new Map<string, string>();
      (lastSessions ?? []).forEach((s: any) => {
        if (!lastMap.has(s.hifz_student_id)) {
          lastMap.set(s.hifz_student_id, s.test_date);
        }
      });

      return (students ?? []).map((s: any) => ({
        student_id: s.id,
        student_name: s.students?.name ?? '',
        class_name: s.students?.class_name ?? '',
        total_pages: s.total_pages_memorized ?? 0,
        completion_pct: Math.round(((s.total_pages_memorized ?? 0) / 604) * 100),
        last_session: lastMap.get(s.id) ?? null,
        teacher_name: s.staff?.name ?? null,
        status: s.status,
        daily_target: s.daily_target_pages ?? 1,
      })) as HifzSummary[];
    },
  });
}

/** নতুন হিফজ ছাত্র যোগ করুন */
export function useAddHifzStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      student_id: string;
      teacher_id?: string;
      daily_target_pages?: number;
      start_date?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('hifz_students')
        .insert({
          student_id: payload.student_id,
          teacher_id: payload.teacher_id ?? null,
          daily_target_pages: payload.daily_target_pages ?? 1,
          start_date: payload.start_date ?? new Date().toISOString().split('T')[0],
          notes: payload.notes ?? null,
          status: 'active',
          total_pages_memorized: 0,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hifz_students'] });
      qc.invalidateQueries({ queryKey: ['hifz_summary'] });
      toast.success('হিফজ ছাত্র যোগ করা হয়েছে');
    },
    onError: (e: any) => toast.error(e.message ?? 'ত্রুটি হয়েছে'),
  });
}

/** নতুন হিফজ সেশন/অগ্রগতি যোগ করুন */
export function useAddHifzProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      hifz_student_id: string;
      student_id: string;
      surah_number?: number;
      surah_name?: string;
      para_number?: number;
      start_page: number;
      end_page: number;
      session_type: 'memorization' | 'revision';
      quality: 'excellent' | 'good' | 'average' | 'needs_work';
      test_date: string;
      teacher_id?: string;
      notes?: string;
    }) => {
      const pages_count = payload.end_page - payload.start_page + 1;

      // Add progress record
      const { data, error } = await supabase
        .from('hifz_progress')
        .insert({ ...payload, pages_count })
        .select()
        .single();
      if (error) throw error;

      // Update total if memorization (not revision)
      if (payload.session_type === 'memorization') {
        const { data: hs } = await supabase
          .from('hifz_students')
          .select('total_pages_memorized')
          .eq('id', payload.hifz_student_id)
          .single();

        const newTotal = Math.min(604, (hs?.total_pages_memorized ?? 0) + pages_count);
        const isComplete = newTotal >= 604;

        await supabase
          .from('hifz_students')
          .update({
            total_pages_memorized: newTotal,
            status: isComplete ? 'completed' : 'active',
          })
          .eq('id', payload.hifz_student_id);
      }

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hifz_progress'] });
      qc.invalidateQueries({ queryKey: ['hifz_students'] });
      qc.invalidateQueries({ queryKey: ['hifz_summary'] });
      toast.success('হিফজ অগ্রগতি সংরক্ষিত হয়েছে');
    },
    onError: (e: any) => toast.error(e.message ?? 'ত্রুটি হয়েছে'),
  });
}

/** হিফজ ছাত্রের স্ট্যাটাস আপডেট */
export function useUpdateHifzStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<HifzStudent> & { id: string }) => {
      const { error } = await supabase
        .from('hifz_students')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hifz_students'] });
      qc.invalidateQueries({ queryKey: ['hifz_summary'] });
      toast.success('আপডেট সফল হয়েছে');
    },
    onError: (e: any) => toast.error(e.message ?? 'ত্রুটি হয়েছে'),
  });
}

/** মাসিক হিফজ রিপোর্ট */
export function useHifzMonthlyReport(month: string, year: string) {
  return useQuery({
    queryKey: ['hifz_monthly', month, year],
    queryFn: async () => {
      const startDate = `${year}-${month.padStart(2, '0')}-01`;
      const endDate = new Date(parseInt(year), parseInt(month), 0)
        .toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('hifz_progress')
        .select(`
          *,
          hifz_students!inner(
            student_id,
            students!inner(name, class_name)
          )
        `)
        .gte('test_date', startDate)
        .lte('test_date', endDate)
        .eq('session_type', 'memorization')
        .order('test_date');
      if (error) throw error;
      return data ?? [];
    },
  });
}
