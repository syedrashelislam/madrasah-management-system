import { useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import Icon from "@/components/Icon";
import { useNavigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setAuthenticated(true);
      } else {
        navigate("/login");
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setAuthenticated(false);
        navigate("/login");
      } else {
        setAuthenticated(true);
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <Icon name="fa-spinner fa-spin" size={32} style={{ color: '#d4af37', marginBottom: 16 }} />
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) return null;
  return <>{children}</>;
};

export default ProtectedRoute;
