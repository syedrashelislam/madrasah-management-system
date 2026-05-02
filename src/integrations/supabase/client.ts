import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://rsbhgavuvnammdmnckyz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzYmhnYXZ1dm5hbW1kbW5ja3l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2OTI1MDIsImV4cCI6MjA5MzI2ODUwMn0.wUsePvdnGUhqjF0jAFQBpoqW5R8iGZqk0LcnnyTnJvc";

// Usage: import { supabase } from "@/integrations/supabase/client";
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});