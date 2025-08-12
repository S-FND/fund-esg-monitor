import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface Profile {
  id: string;
  user_id: string;
  tenant_id: string;
  email: string;
  full_name: string | null;
  designation: string | null;
  mobile_number: string | null;
  role: 'investor_admin' | 'team_member_editor' | 'team_member_readonly' | 'auditor' | 'super_admin';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  hasAccess: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Create mock profile for now until database types are generated
          setTimeout(() => {
            setProfile({
              id: crypto.randomUUID(),
              user_id: session.user.id,
              tenant_id: crypto.randomUUID(),
              email: session.user.email || '',
              full_name: session.user.user_metadata?.full_name || '',
              designation: null,
              mobile_number: null,
              role: 'investor_admin',
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
            setLoading(false);
          }, 0);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Create mock profile for existing session
        setProfile({
          id: crypto.randomUUID(),
          user_id: session.user.id,
          tenant_id: crypto.randomUUID(),
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name || '',
          designation: null,
          mobile_number: null,
          role: 'investor_admin',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      // Clear local state first
      setSession(null);
      setUser(null);
      setProfile(null);
      
      // Sign out from Supabase
      await supabase.auth.signOut({ scope: 'global' });
      
      // Force page reload for clean state
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error signing out:', error);
      // Force navigation even if signOut fails
      window.location.href = '/auth';
    }
  };

  const hasAccess = (permission: string): boolean => {
    if (!profile) return false;
    
    // Super admin has access to everything
    if (profile.role === 'super_admin') return true;
    
    // Investor admin has access to most things in their tenant
    if (profile.role === 'investor_admin') {
      return !permission.includes('super_admin');
    }
    
    // Team member editor can create/edit
    if (profile.role === 'team_member_editor') {
      return permission.includes('read') || permission.includes('write');
    }
    
    // Team member readonly can only read
    if (profile.role === 'team_member_readonly') {
      return permission.includes('read');
    }
    
    // Auditor can read everything but not modify
    if (profile.role === 'auditor') {
      return permission.includes('read') || permission.includes('audit');
    }
    
    return false;
  };

  const value = {
    session,
    user,
    profile,
    loading,
    signOut,
    hasAccess,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}