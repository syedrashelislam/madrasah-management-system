import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { StudentRow } from "./useStudents";

const STORAGE_KEY = "parent_session";

interface UseParentAuth {
  parentPhone: string | null;
  children: StudentRow[];
  isLoading: boolean;
  isAuthenticated: boolean;
  loginParent: (phone: string) => Promise<{ success: boolean; error?: string }>;
  logoutParent: () => void;
  refreshChildren: () => Promise<void>;
}

export function useParentAuth(): UseParentAuth {
  const [parentPhone, setParentPhone] = useState<string | null>(null);
  const [children, setChildren] = useState<StudentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchChildrenByPhone = useCallback(async (phone: string): Promise<StudentRow[]> => {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .eq("guardian_phone", phone)
      .eq("status", "active")
      .is("deleted_at", null);

    if (error || !data || data.length === 0) return [];
    return data as StudentRow[];
  }, []);

  // On mount, check localStorage for existing session and verify it
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const storedPhone = localStorage.getItem(STORAGE_KEY);
        if (!storedPhone) {
          setIsLoading(false);
          return;
        }

        const students = await fetchChildrenByPhone(storedPhone);
        if (cancelled) return;

        if (students.length > 0) {
          setParentPhone(storedPhone);
          setChildren(students);
        } else {
          // Session invalid — no active students found for this phone
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    restoreSession();
    return () => { cancelled = true; };
  }, [fetchChildrenByPhone]);

  const loginParent = useCallback(
    async (phone: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const trimmedPhone = phone.trim();

        if (!trimmedPhone) {
          return { success: false, error: "ফোন নম্বর দিন" };
        }

        const { data, error } = await supabase
          .from("students")
          .select("*")
          .eq("guardian_phone", trimmedPhone)
          .eq("status", "active")
          .is("deleted_at", null);

        if (error || !data || data.length === 0) {
          return { success: false, error: "এই ফোন নম্বরে কোনো ছাত্র পাওয়া যায়নি" };
        }

        const students = data as StudentRow[];
        localStorage.setItem(STORAGE_KEY, trimmedPhone);
        setParentPhone(trimmedPhone);
        setChildren(students);
        return { success: true };
      } catch {
        return { success: false, error: "লগইনে সমস্যা হয়েছে, আবার চেষ্টা করুন" };
      }
    },
    []
  );

  const logoutParent = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setParentPhone(null);
    setChildren([]);
  }, []);

  const refreshChildren = useCallback(async () => {
    const storedPhone = localStorage.getItem(STORAGE_KEY);
    if (!storedPhone) {
      setParentPhone(null);
      setChildren([]);
      return;
    }

    const students = await fetchChildrenByPhone(storedPhone);
    if (students.length > 0) {
      setChildren(students);
    } else {
      // No active students found — invalidate session
      localStorage.removeItem(STORAGE_KEY);
      setParentPhone(null);
      setChildren([]);
    }
  }, [fetchChildrenByPhone]);

  return {
    parentPhone,
    children,
    isLoading,
    isAuthenticated: !!parentPhone,
    loginParent,
    logoutParent,
    refreshChildren,
  };
}
