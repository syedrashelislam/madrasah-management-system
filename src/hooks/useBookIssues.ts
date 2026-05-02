import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BookIssueRow {
  id: string;
  bookId: string;
  studentId: string;
  issueDate: string;
  returnDate: string;
  dueDate: string;
  status: string;
  createdAt: string;
}

export function useBookIssues() {
  return useQuery({
    queryKey: ["book_issues"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("book_issues")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data || []) as any[]).map((row) => ({
        id: row.id,
        bookId: row.book_id,
        studentId: row.student_id,
        issueDate: row.issue_date || "",
        returnDate: row.return_date || "",
        dueDate: row.due_date || "",
        status: row.status,
        createdAt: row.created_at || "",
      })) as BookIssueRow[];
    },
  });
}

export function useAddBookIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (issue: {
      bookId: string;
      studentId: string;
      issueDate: string;
      dueDate: string;
    }) => {
      const { error } = await supabase.from("book_issues").insert([
        {
          book_id: issue.bookId,
          student_id: issue.studentId,
          issue_date: issue.issueDate,
          due_date: issue.dueDate,
          status: "issued",
        },
      ]);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["book_issues"] });
      qc.invalidateQueries({ queryKey: ["books"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useReturnBookIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; returnDate: string }) => {
      const { error } = await supabase
        .from("book_issues")
        .update({ status: "returned", return_date: params.returnDate })
        .eq("id", params.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["book_issues"] });
      qc.invalidateQueries({ queryKey: ["books"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
}

/** Computed helpers */
export function isOverdue(issue: BookIssueRow): boolean {
  if (issue.status !== "issued" || !issue.dueDate) return false;
  return new Date(issue.dueDate) < new Date(new Date().toISOString().split("T")[0]);
}

export function daysOverdue(issue: BookIssueRow): number {
  if (!isOverdue(issue)) return 0;
  const diff = new Date().getTime() - new Date(issue.dueDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
