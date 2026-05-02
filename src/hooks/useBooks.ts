import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type BookRow = {
  id: string;
  bookId: string;
  title: string;
  author: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
  createdAt: string;
  updatedAt: string;
};

export function useBooks() {
  return useQuery({
    queryKey: ["books"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data || []) as any[]).map((row) => ({
        id: row.id,
        bookId: row.book_id,
        title: row.title,
        author: row.author,
        category: row.category,
        totalCopies: row.total_copies,
        availableCopies: row.available_copies,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })) as BookRow[];
    },
  });
}

export function useAddBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (book: Omit<BookRow, "id" | "createdAt" | "updatedAt">) => {
      const { error } = await supabase.from("books").insert([
        {
          book_id: book.bookId,
          title: book.title,
          author: book.author,
          category: book.category,
          total_copies: book.totalCopies,
          available_copies: book.availableCopies,
        },
      ]);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["books"] }),
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      bookId: string;
      title?: string;
      author?: string;
      category?: string;
      totalCopies?: number;
      availableCopies?: number;
    }) => {
      const updateData: Record<string, unknown> = {};
      if (params.title !== undefined) updateData.title = params.title;
      if (params.author !== undefined) updateData.author = params.author;
      if (params.category !== undefined) updateData.category = params.category;
      if (params.totalCopies !== undefined) updateData.total_copies = params.totalCopies;
      if (params.availableCopies !== undefined) updateData.available_copies = params.availableCopies;
      updateData.updated_at = new Date().toISOString();
      const { error } = await supabase
        .from("books")
        .update(updateData)
        .eq("book_id", params.bookId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["books"] }),
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("books")
        .update({ deleted_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["recycle-bin"] });
    },
  });
}
