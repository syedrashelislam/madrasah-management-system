import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { StudentRow } from "./useStudents";

const STORAGE_KEY = "student_session";

interface UseStudentAuth {
  studentUser: StudentRow | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginStudent: (studentId: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logoutStudent: () => void;
  refreshStudent: () => Promise<void>;
}

export function useStudentAuth(): UseStudentAuth {
  const [studentUser, setStudentUser] = useState<StudentRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStudentById = useCallback(async (studentId: string): Promise<StudentRow | null> => {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .eq("student_id", studentId)
      .eq("status", "active")
      .is("deleted_at", null)
      .single();

    if (error || !data) return null;
    return data as StudentRow;
  }, []);

  // On mount, check localStorage for existing session and verify it
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const storedId = localStorage.getItem(STORAGE_KEY);
        if (!storedId) {
          setIsLoading(false);
          return;
        }

        const student = await fetchStudentById(storedId);
        if (cancelled) return;

        if (student) {
          setStudentUser(student);
        } else {
          // Session invalid — student deleted, deactivated, or doesn't exist
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
  }, [fetchStudentById]);

  const loginStudent = useCallback(
    async (studentId: string, password: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const trimmedId = studentId.trim();
        const trimmedPw = password.trim();

        if (!trimmedId || !trimmedPw) {
          return { success: false, error: "আইডি এবং পাসওয়ার্ড দিন" };
        }

        const { data, error } = await supabase
          .from("students")
          .select("*")
          .eq("student_id", trimmedId)
          .eq("login_password", trimmedPw)
          .eq("status", "active")
          .is("deleted_at", null)
          .single();

        if (error || !data) {
          return { success: false, error: "ভুল আইডি অথবা পাসওয়ার্ড" };
        }

        const student = data as StudentRow;
        localStorage.setItem(STORAGE_KEY, student.student_id);
        setStudentUser(student);
        return { success: true };
      } catch {
        return { success: false, error: "লগইনে সমস্যা হয়েছে, আবার চেষ্টা করুন" };
      }
    },
    []
  );

  const logoutStudent = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setStudentUser(null);
  }, []);

  const refreshStudent = useCallback(async () => {
    const storedId = localStorage.getItem(STORAGE_KEY);
    if (!storedId) {
      setStudentUser(null);
      return;
    }

    const student = await fetchStudentById(storedId);
    if (student) {
      setStudentUser(student);
    } else {
      // Student no longer valid
      localStorage.removeItem(STORAGE_KEY);
      setStudentUser(null);
    }
  }, [fetchStudentById]);

  return {
    studentUser,
    isLoading,
    isAuthenticated: !!studentUser,
    loginStudent,
    logoutStudent,
    refreshStudent,
  };
}
