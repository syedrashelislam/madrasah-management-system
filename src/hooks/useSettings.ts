import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SettingRow {
  id: string;
  key: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("settings").select("*");
      if (error) throw error;
      return ((data || []) as any[]).map((row) => ({
        id: row.id,
        key: row.key,
        value: row.value,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })) as SettingRow[];
    },
  });
}

const PUBLIC_SETTINGS_CACHE_KEY = "madrasa_public_settings_cache";

export function usePublicSettings() {
  // Load cached branding from localStorage immediately (works before DB responds)
  const cachedRaw = (() => {
    try { return JSON.parse(localStorage.getItem(PUBLIC_SETTINGS_CACHE_KEY) || "[]"); }
    catch { return []; }
  })();

  return useQuery({
    queryKey: ["public-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("settings").select("*");
      // If RLS blocks anon access, fall back to cached data silently
      if (error) {
        return cachedRaw as SettingRow[];
      }
      const rows = ((data || []) as any[]).map((row) => ({
        id: row.id,
        key: row.key,
        value: row.value,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })) as SettingRow[];
      // Persist to localStorage so login page always shows branding
      try { localStorage.setItem(PUBLIC_SETTINGS_CACHE_KEY, JSON.stringify(rows)); }
      catch { /* ignore storage errors */ }
      return rows;
    },
    staleTime: 5 * 60 * 1000,
    // Use cached data as initial value so logo/name appear instantly
    initialData: cachedRaw.length > 0 ? cachedRaw : undefined,
  });
}

export function useSettingValue(key: string) {
  const { data: settings } = useSettings();
  return settings?.find((s) => s.key === key)?.value || "";
}

export function useUpdateSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { data: existing } = await supabase
        .from("settings")
        .select("id")
        .eq("key", key)
        .limit(1);
      if (existing && existing.length > 0) {
        const { error } = await supabase
          .from("settings")
          .update({ value, updated_at: new Date().toISOString() })
          .eq("key", key);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("settings")
          .insert([{ key, value }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      qc.invalidateQueries({ queryKey: ["public-settings"] });
    },
  });
}
