import { queryClient } from "./queryClient";
import { supabase } from "@/integrations/supabase/client";

const prefetchRegistry = new Map<string, Promise<unknown>>();

const prefetchOnce = (key: string, runner: () => Promise<unknown>) => {
  if (prefetchRegistry.has(key)) return prefetchRegistry.get(key)!;
  const promise = runner().finally(() => {
    window.setTimeout(() => prefetchRegistry.delete(key), 1500);
  });
  prefetchRegistry.set(key, promise);
  return promise;
};

const prefetchQuery = <T,>(queryKey: readonly unknown[], queryFn: () => Promise<T>) =>
  queryClient.prefetchQuery({ queryKey: [...queryKey], queryFn, staleTime: 30 * 1000 });

const fetchStudents = async () => {
  const { data } = await supabase.from("students").select("*").is("deleted_at", null).order("created_at", { ascending: false });
  return data || [];
};

const fetchClasses = async () => {
  const { data } = await supabase.from("classes").select("*").is("deleted_at", null).order("sort_order", { ascending: true });
  return data || [];
};

const fetchPayments = async () => {
  const { data } = await supabase.from("payments").select("*").is("deleted_at", null).order("created_at", { ascending: false });
  return data || [];
};

const fetchAttendance = async () => {
  const { data } = await supabase.from("attendance").select("*").order("created_at", { ascending: false });
  return data || [];
};

const fetchTransactions = async () => {
  const { data } = await supabase.from("transactions").select("*").is("deleted_at", null).order("created_at", { ascending: false });
  return data || [];
};

const fetchStaff = async () => {
  const { data } = await supabase.from("staff").select("*").is("deleted_at", null).order("created_at", { ascending: false });
  return data || [];
};

const fetchSalaryPayments = async () => {
  const { data } = await supabase.from("salary_payments").select("*").order("created_at", { ascending: false });
  return data || [];
};

const fetchStudentExpenses = async () => {
  const { data } = await supabase.from("student_expenses").select("*").order("created_at", { ascending: false });
  return data || [];
};

const fetchNotices = async () => {
  const { data } = await supabase.from("notices").select("*").is("deleted_at", null).order("created_at", { ascending: false });
  return data || [];
};

const fetchBooks = async () => {
  const { data } = await supabase.from("books").select("*").is("deleted_at", null).order("created_at", { ascending: false });
  return data || [];
};

const fetchExams = async () => {
  const { data } = await supabase.from("exams").select("*").is("deleted_at", null).order("created_at", { ascending: false });
  return data || [];
};

const fetchExamSubjects = async () => {
  const { data } = await supabase.from("exam_subjects").select("*");
  return data || [];
};

const fetchSubjects = async () => {
  const { data } = await supabase.from("subjects").select("*").is("deleted_at", null).order("sort_order", { ascending: true });
  return data || [];
};

const fetchSettings = async () => {
  const { data } = await supabase.from("settings").select("*");
  return data || [];
};

const routePrefetchers: Array<{ match: (path: string) => boolean; run: (path: string) => Promise<unknown> }> = [
  {
    match: (path) => path === "/",
    run: () => Promise.all([
      prefetchQuery(["students"], fetchStudents),
      prefetchQuery(["payments"], fetchPayments),
      prefetchQuery(["transactions"], fetchTransactions),
      prefetchQuery(["staff"], fetchStaff),
      prefetchQuery(["notices"], fetchNotices),
      prefetchQuery(["classes"], fetchClasses),
    ]),
  },
  {
    match: (path) => path === "/students",
    run: () => Promise.all([
      prefetchQuery(["students"], fetchStudents),
      prefetchQuery(["classes"], fetchClasses),
    ]),
  },
  {
    match: (path) => path === "/students/new",
    run: () => Promise.all([
      prefetchQuery(["students"], fetchStudents),
      prefetchQuery(["classes"], fetchClasses),
    ]),
  },
  {
    match: (path) => /^\/students\/[^/]+\/edit$/.test(path),
    run: async () => Promise.all([
      prefetchQuery(["students"], fetchStudents),
      prefetchQuery(["classes"], fetchClasses),
    ]),
  },
  {
    match: (path) => /^\/students\/[^/]+$/.test(path),
    run: async () => Promise.all([
      prefetchQuery(["students"], fetchStudents),
      prefetchQuery(["payments"], fetchPayments),
      prefetchQuery(["student_expenses"], fetchStudentExpenses),
    ]),
  },
  {
    match: (path) => path === "/attendance",
    run: () => Promise.all([
      prefetchQuery(["attendance"], fetchAttendance),
      prefetchQuery(["students"], fetchStudents),
    ]),
  },
  {
    match: (path) => path === "/fees",
    run: () => Promise.all([
      prefetchQuery(["students"], fetchStudents),
      prefetchQuery(["payments"], fetchPayments),
      prefetchQuery(["student_expenses"], fetchStudentExpenses),
      prefetchQuery(["classes"], fetchClasses),
    ]),
  },
  {
    match: (path) => path === "/income" || path === "/expense" || path === "/cashbook",
    run: () => prefetchQuery(["transactions"], fetchTransactions),
  },
  {
    match: (path) => path === "/salary",
    run: () => Promise.all([
      prefetchQuery(["staff"], fetchStaff),
      prefetchQuery(["salary_payments"], fetchSalaryPayments),
      prefetchQuery(["transactions"], fetchTransactions),
    ]),
  },
  {
    match: (path) => path === "/monthly-closing",
    run: () => Promise.all([
      prefetchQuery(["transactions"], fetchTransactions),
      prefetchQuery(["payments"], fetchPayments),
      prefetchQuery(["staff"], fetchStaff),
      prefetchQuery(["students"], fetchStudents),
    ]),
  },
  {
    match: (path) => path === "/exams",
    run: () => Promise.all([
      prefetchQuery(["students"], fetchStudents),
      prefetchQuery(["exams"], fetchExams),
      prefetchQuery(["exam_subjects"], fetchExamSubjects),
      prefetchQuery(["classes"], fetchClasses),
      prefetchQuery(["subjects"], fetchSubjects),
    ]),
  },
  {
    match: (path) => path === "/teacher-grade-entry",
    run: () => Promise.all([
      prefetchQuery(["students"], fetchStudents),
      prefetchQuery(["exams"], fetchExams),
      prefetchQuery(["exam_subjects"], fetchExamSubjects),
      prefetchQuery(["classes"], fetchClasses),
    ]),
  },
  {
    match: (path) => path === "/notices",
    run: () => prefetchQuery(["notices"], fetchNotices),
  },
  {
    match: (path) => path === "/library",
    run: () => Promise.all([
      prefetchQuery(["books"], fetchBooks),
      prefetchQuery(["students"], fetchStudents),
    ]),
  },
  {
    match: (path) => path === "/reports",
    run: () => Promise.all([
      prefetchQuery(["students"], fetchStudents),
      prefetchQuery(["payments"], fetchPayments),
      prefetchQuery(["transactions"], fetchTransactions),
      prefetchQuery(["staff"], fetchStaff),
    ]),
  },
  {
    match: (path) => path === "/biometric-attendance",
    run: () => Promise.all([
      prefetchQuery(["students"], fetchStudents),
      prefetchQuery(["staff"], fetchStaff),
    ]),
  },
  {
    match: (path) => path === "/settings" || path === "/login" || path === "/signup",
    run: () => prefetchQuery(["settings"], fetchSettings),
  },
];

export const prefetchRouteData = (path: string) => {
  const normalizedPath = path.split("?")[0];
  const matched = routePrefetchers.find(({ match }) => match(normalizedPath));
  if (!matched) return Promise.resolve();
  return prefetchOnce(`route:${normalizedPath}`, () => matched.run(normalizedPath));
};

export const createHoverPrefetchProps = (path: string) => ({
  onMouseEnter: () => { void prefetchRouteData(path); },
  onFocus: () => { void prefetchRouteData(path); },
  onTouchStart: () => { void prefetchRouteData(path); },
});
