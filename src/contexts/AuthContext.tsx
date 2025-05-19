
import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Interface for assigned page/module
interface AssignedPage {
  moduleName: string;
  level: 'read' | 'write' | 'admin' | 'none';
  href: string;
}

interface UserAccessRight {
  moduleName: string;
  level: 'read' | 'write' | 'admin' | 'none';
}

interface User {
  id: string;
  email: string;
  name?: string;
  accessRights: UserAccessRight[];
  assignedPages?: AssignedPage[];
  isActive: boolean;
}

interface AuthContextType {
  session: boolean;
  user: User | null;
  userRole: 'investor' | 'admin' | 'investor_admin' | null;
  signOut: () => void;
  signInWithCredentials: (userData: { email: string; id: string; assignedPages: AssignedPage[] }) => void;
  hasAccess: (moduleName: string, level?: 'read' | 'write' | 'admin') => boolean;
  assignedPages: AssignedPage[];
}

const AuthContext = createContext<AuthContextType | null>(null);

// Helper function to convert AssignedPage to UserAccessRight
const convertToAccessRights = (pages: AssignedPage[]): UserAccessRight[] => {
  return pages.map(page => ({
    moduleName: page.moduleName,
    level: page.level
  }));
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'investor' | 'admin' | 'investor_admin' | null>(null);
  const [assignedPages, setAssignedPages] = useState<AssignedPage[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for auth token in localStorage or sessionStorage
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const userId = localStorage.getItem('user_id') || sessionStorage.getItem('user_id');
    const storedRole = localStorage.getItem('userRole') || sessionStorage.getItem('userRole');
    const storedAssignedPages = localStorage.getItem('assignedPages');
    
    if (token && userId) {
      setSession(true);
      
      if (storedAssignedPages) {
        const pages = JSON.parse(storedAssignedPages) as AssignedPage[];
        setAssignedPages(pages);
        
        // Create user from assigned pages
        const userData: User = {
          id: userId,
          email: localStorage.getItem('user_email') || 'user@example.com',
          accessRights: convertToAccessRights(pages),
          assignedPages: pages,
          isActive: true
        };
        
        setUser(userData);
        setUserRole(storedRole as AuthContextType['userRole'] || 'investor');
      } else {
        // Fallback to default if no assigned pages
        setUser({
          id: userId,
          email: 'user@example.com',
          accessRights: [{ moduleName: "Dashboard", level: "read" }],
          isActive: true
        });
        setUserRole(storedRole as AuthContextType['userRole'] || 'investor');
      }
    } else {
      setSession(false);
      setUser(null);
      setUserRole(null);
      setAssignedPages([]);
    }
  }, []);

  const signInWithCredentials = (userData: { email: string; id: string; assignedPages: AssignedPage[] }) => {
    // Set auth token
    localStorage.setItem('auth_token', 'dummy_token');
    localStorage.setItem('user_id', userData.id);
    localStorage.setItem('user_email', userData.email);
    localStorage.setItem('userRole', 'investor');
    localStorage.setItem('assignedPages', JSON.stringify(userData.assignedPages));
    
    // Update state
    setSession(true);
    setUserRole('investor');
    setAssignedPages(userData.assignedPages);
    
    // Create user from assigned pages
    const newUser: User = {
      id: userData.id,
      email: userData.email,
      accessRights: convertToAccessRights(userData.assignedPages),
      assignedPages: userData.assignedPages,
      isActive: true
    };
    
    setUser(newUser);
  };

  const signOut = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_email');
    localStorage.removeItem('userRole');
    localStorage.removeItem('assignedPages');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('user_id');
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('assignedPages');
    
    setSession(false);
    setUser(null);
    setUserRole(null);
    setAssignedPages([]);
    navigate('/login');
  };

  // Function to check if user has access to a module at the specified level
  const hasAccess = (moduleName: string, level: 'read' | 'write' | 'admin' = 'read'): boolean => {
    if (!user) return false;

    const moduleAccess = user.accessRights.find(right => right.moduleName === moduleName);
    if (!moduleAccess) return false;

    switch (level) {
      case 'read':
        return ['read', 'write', 'admin'].includes(moduleAccess.level);
      case 'write':
        return ['write', 'admin'].includes(moduleAccess.level);
      case 'admin':
        return moduleAccess.level === 'admin';
      default:
        return false;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      userRole, 
      signOut, 
      signInWithCredentials, 
      hasAccess, 
      assignedPages 
    }}>
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
