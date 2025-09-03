import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface AccessControlContextType {
  hasAccess: boolean;
  isDemoMode: boolean;
  isLoading: boolean;
  requestAccess: () => Promise<void>;
  accessStatus: 'approved' | 'pending' | 'denied' | null;
  enableDemoMode: () => void;
  disableDemoMode: () => void;
}

const AccessControlContext = createContext<AccessControlContextType | undefined>(undefined);

export function AccessControlProvider({ children }: { children: React.ReactNode }) {
  const { user, session } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [accessStatus, setAccessStatus] = useState<'approved' | 'pending' | 'denied' | null>(null);

  // Check if demo mode is enabled from localStorage
  useEffect(() => {
    const demoMode = localStorage.getItem('demo_mode_enabled') === 'true';
    setIsDemoMode(demoMode);
  }, []);

  // Check access when user changes
  useEffect(() => {
    if (!user || !session) {
      setHasAccess(false);
      setAccessStatus(null);
      setIsLoading(false);
      return;
    }

    checkAccess();
  }, [user, session, isDemoMode]);

  const checkAccess = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Get user's profile and tenant information
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          tenants!inner(
            id,
            name,
            is_approved,
            is_demo,
            approval_requested_at
          )
        `)
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        setHasAccess(false);
        setAccessStatus('denied');
        return;
      }

      const tenant = profile.tenants;
      
      // Check if demo mode is enabled - if so, grant access regardless
      if (isDemoMode) {
        setHasAccess(true);
        setAccessStatus('approved');
        return;
      }

      // Check if it's a demo account
      if (tenant.is_demo) {
        setHasAccess(true);
        setAccessStatus('approved');
        return;
      }

      // Check if company is approved
      if (tenant.is_approved) {
        setHasAccess(true);
        setAccessStatus('approved');
      } else if (tenant.approval_requested_at) {
        setHasAccess(false);
        setAccessStatus('pending');
      } else {
        setHasAccess(false);
        setAccessStatus(null);
      }
    } catch (error) {
      console.error('Error checking access:', error);
      setHasAccess(false);
      setAccessStatus('denied');
    } finally {
      setIsLoading(false);
    }
  };

  const requestAccess = async () => {
    if (!user) return;

    try {
      // Get user's tenant
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      // Update tenant to show access has been requested
      await supabase
        .from('tenants')
        .update({ 
          approval_requested_at: new Date().toISOString()
        })
        .eq('id', profile.tenant_id);

      setAccessStatus('pending');
    } catch (error) {
      console.error('Error requesting access:', error);
    }
  };

  const enableDemoMode = () => {
    localStorage.setItem('demo_mode_enabled', 'true');
    setIsDemoMode(true);
  };

  const disableDemoMode = () => {
    localStorage.setItem('demo_mode_enabled', 'false');
    setIsDemoMode(false);
  };

  return (
    <AccessControlContext.Provider value={{
      hasAccess,
      isDemoMode,
      isLoading,
      requestAccess,
      accessStatus,
      enableDemoMode,
      disableDemoMode
    }}>
      {children}
    </AccessControlContext.Provider>
  );
}

export function useAccessControl() {
  const context = useContext(AccessControlContext);
  if (context === undefined) {
    throw new Error('useAccessControl must be used within an AccessControlProvider');
  }
  return context;
}