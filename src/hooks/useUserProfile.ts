import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string;
  phone: string;
  address: string;
  role: string;
  created_at: string;
  last_sign_in: string;
}

export function useUserProfile() {
  const [userId, setUserId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const profileQuery = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!userId) return null;

      // Use Supabase auth session directly — no REST query to a 'users' table
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;

      const u = session.user;
      return {
        id: u.id,
        email: u.email || '',
        display_name: u.user_metadata?.display_name || u.user_metadata?.full_name || '',
        avatar_url: u.user_metadata?.avatar_url || '',
        phone: u.user_metadata?.phone || u.phone || '',
        address: u.user_metadata?.address || '',
        role: '',
        created_at: u.created_at || '',
        last_sign_in: u.last_sign_in_at || '',
      };
    },
    enabled: !!userId,
  });

  const updateProfileMut = useMutation({
    mutationFn: async (updates: { display_name?: string; avatar_url?: string; phone?: string; address?: string }) => {
      if (!userId) throw new Error('Not logged in');

      // Store all profile fields in user_metadata for reliability
      const authMeta: Record<string, any> = {};
      if (updates.display_name !== undefined) authMeta.display_name = updates.display_name;
      if (updates.avatar_url !== undefined) authMeta.avatar_url = updates.avatar_url;
      if (updates.phone !== undefined) authMeta.phone = updates.phone;
      if (updates.address !== undefined) authMeta.address = updates.address;

      if (Object.keys(authMeta).length > 0) {
        const { error } = await supabase.auth.updateUser({ data: authMeta });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'প্রোফাইল আপডেট ব্যর্থ');
    },
  });

  return {
    profile: profileQuery.data || null,
    isLoading: profileQuery.isLoading,
    userId,
    updateProfile: updateProfileMut,
    isUpdating: updateProfileMut.isPending,
  };
}
