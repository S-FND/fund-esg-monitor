import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  session: boolean;
  user: any | null;
  userRole: 'investor' | 'admin' | 'fandoro_admin' | 'investor_admin' | null;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Dummy data for testing
const DUMMY_TOKEN = 'dummy_test_token_123';
const DUMMY_USER = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User'
};
const DUMMY_ROLE = 'investor';

// Helper function to set dummy data
const setDummyAuthData = () => {
  if (!localStorage.getItem('auth_token') && !sessionStorage.getItem('auth_token')) {
    localStorage.setItem('auth_token', DUMMY_TOKEN);
    localStorage.setItem('user', JSON.stringify(DUMMY_USER));
    localStorage.setItem('userRole', DUMMY_ROLE);
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<boolean>(false);
  const [user, setUser] = useState<any | null>(null);
  const [userRole, setUserRole] = useState<'investor' | 'admin' | 'fandoro_admin' | 'investor_admin' | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Set dummy data for testing
    setDummyAuthData();
    
    // Check for auth token in localStorage or sessionStorage
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    const storedRole = localStorage.getItem('userRole') || sessionStorage.getItem('userRole');
    
    if (token && storedUser && storedRole) {
      setSession(true);
      setUser(JSON.parse(storedUser));
      setUserRole(storedRole as AuthContextType['userRole']);
    } else {
      setSession(false);
      setUser(null);
      setUserRole(null);
    }
  }, []);

  const signOut = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('userRole');
    setSession(false);
    setUser(null);
    setUserRole(null);
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ session, user, userRole, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
