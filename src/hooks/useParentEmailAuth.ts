import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { StudentRow } from "./useStudents";

interface UseParentEmailAuth {
  user: any | null;
  parentEmail: string | null;
  children: StudentRow[];
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshChildren: () => Promise<void>;
}

async function fetchChildrenByEmail(email: string): Promise<StudentRow[]> {
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("guardian_email", email.trim().toLowerCase())
    .eq("status", "active")
    .is("deleted_at", null);
  if (error || !data) return [];
  return data as StudentRow[];
}

export function useParentEmailAuth(): UseParentEmailAuth {
  const [user, setUser] = useState<any>(null);
  const [children, setChildren] = useState<StudentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadChildren = useCallback(async (email: string) => {
    const kids = await fetchChildrenByEmail(email);
    setChildren(kids);
  }, []);

  // Subscribe to Supabase auth state
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        setUser(session.user);
        await loadChildren(session.user.email ?? "");
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        setUser(session.user);
        await loadChildren(session.user.email ?? "");
      } else {
        setUser(null);
        setChildren([]);
      }
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadChildren]);

  const signIn = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!email.trim() || !password) return { success: false, error: "ইমেইল ও পাসওয়ার্ড দিন" };

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      if (error.message.includes("Invalid login credentials")) return { success: false, error: "ইমেইল বা পাসওয়ার্ড ভুল" };
      if (error.message.includes("Email not confirmed")) return { success: false, error: "ইমেইল যাচাই হয়নি — পুনরায় সাইন আপ করুন" };
      return { success: false, error: "লগইনে সমস্যা হয়েছে, আবার চেষ্টা করুন" };
    }

    if (!data.user) return { success: false, error: "লগইন ব্যর্থ হয়েছে" };

    // Verify this email is a registered guardian
    const kids = await fetchChildrenByEmail(data.user.email ?? "");
    if (kids.length === 0) {
      await supabase.auth.signOut();
      return { success: false, error: "এই ইমেইলে কোনো ছাত্রের অভিভাবক হিসেবে নিবন্ধন পাওয়া যায়নি" };
    }

    return { success: true };
  }, []);

  const signUp = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!email.trim() || !password) return { success: false, error: "ইমেইল ও পাসওয়ার্ড দিন" };
    if (password.length < 6) return { success: false, error: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে" };

    // First verify this email is a registered guardian
    const kids = await fetchChildrenByEmail(email);
    if (kids.length === 0) {
      return { success: false, error: "এই ইমেইলে কোনো ছাত্রের অভিভাবক হিসেবে নিবন্ধন পাওয়া যায়নি। আগে ছাত্র রেজিস্ট্রেশনে এই ইমেইল দিন।" };
    }

    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      if (error.message.includes("already registered") || error.message.includes("User already registered")) {
        return { success: false, error: "এই ইমেইলে আগেই অ্যাকাউন্ট আছে। লগইন করুন।" };
      }
      return { success: false, error: "রেজিস্ট্রেশন ব্যর্থ হয়েছে: " + error.message };
    }

    return { success: true };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setChildren([]);
  }, []);

  const refreshChildren = useCallback(async () => {
    if (user?.email) await loadChildren(user.email);
  }, [user, loadChildren]);

  return {
    user,
    parentEmail: user?.email ?? null,
    children,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    refreshChildren,
  };
}
