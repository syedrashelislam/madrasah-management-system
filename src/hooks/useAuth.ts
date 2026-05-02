import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'

export function useAuth() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
      setIsLoading(false)
    })
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
      setIsLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: () => { window.location.href = '/login'; },
    logout: async () => {
      await supabase.auth.signOut()
      setUser(null)
    },
  }
}
