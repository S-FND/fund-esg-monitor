
import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface UserAccessRight {
  moduleName: string;
  level: 'read' | 'write' | 'admin' | 'none';
}

// Define the structure for assigned pages
export interface AssignedPage {
  moduleName: string;
  level: 'read' | 'write' | 'admin' | 'none';
  href: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  accessRights: UserAccessRight[];
  isActive: boolean;
}

interface AuthContextType {
  session: boolean;
  user: User | null;
  userRole: 'investor' | 'admin' | 'investor_admin' | null;
  assignedPages: AssignedPage[];
  firstAccessibleRoute: string;
  signOut: () => void;
  hasAccess: (moduleName: string, level?: 'read' | 'write' | 'admin') => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Dummy data for testing
const DUMMY_TOKEN = 'dummy_test_token_123';
const DUMMY_USERS = {
  "1": {
    id: '1',
    email: 'admin@example.com',
    name: 'Admin User',
    accessRights: [
      { moduleName: "Dashboard", level: "admin" as const },
      { moduleName: "Funds", level: "admin" as const },
      { moduleName: "Team", level: "admin" as const },
      { moduleName: "Portfolio Companies", level: "admin" as const },
      { moduleName: "ESG DD", level: "admin" as const },
      { moduleName: "ESG CAP", level: "admin" as const },
      { moduleName: "Valuation", level: "admin" as const }
    ],
    isActive: true
  },
  "2": {
    id: '2',
    email: 'esg@example.com',
    name: 'ESG Analyst',
    accessRights: [
      { moduleName: "Dashboard", level: "read" as const },
      { moduleName: "ESG DD", level: "admin" as const },
      { moduleName: "ESG CAP", level: "write" as const },
      { moduleName: "Valuation", level: "read" as const }
    ],
    isActive: true
  },
  "3": {
    id: '3',
    email: 'investor@example.com',
    name: 'Investor',
    accessRights: [
      { moduleName: "Dashboard", level: "read" as const },
      { moduleName: "Funds", level: "read" as const },
      { moduleName: "Portfolio Companies", level: "read" as const },
      { moduleName: "Valuation", level: "read" as const }
    ],
    isActive: true
  }
};

const DUMMY_USER_ID = '1'; // Default to admin
const DUMMY_ROLE = 'admin';

// Helper function to set dummy data
const setDummyAuthData = () => {
  if (!localStorage.getItem('auth_token') && !sessionStorage.getItem('auth_token')) {
    localStorage.setItem('auth_token', DUMMY_TOKEN);
    localStorage.setItem('user_id', DUMMY_USER_ID);
    localStorage.setItem('userRole', DUMMY_ROLE);
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'investor' | 'admin' | 'investor_admin' | null>(null);
  const [assignedPages, setAssignedPages] = useState<AssignedPage[]>([]);
  const [firstAccessibleRoute, setFirstAccessibleRoute] = useState<string>("/");
  const navigate = useNavigate();

  useEffect(() => {
    // Set dummy data for testing
    setDummyAuthData();
    
    // Check for auth token in localStorage or sessionStorage
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const userId = localStorage.getItem('user_id') || sessionStorage.getItem('user_id');
    const storedRole = localStorage.getItem('userRole') || sessionStorage.getItem('userRole');
    
    if (token && userId) {
      setSession(true);
      // Get the user data based on userId
      const currentUser = DUMMY_USERS[userId as keyof typeof DUMMY_USERS];
      if (currentUser) {
        // Convert to User type with correct level typing
        const userData: User = {
          id: currentUser.id,
          email: currentUser.email,
          name: currentUser.name,
          accessRights: currentUser.accessRights.map(right => ({
            moduleName: right.moduleName,
            level: right.level
          })),
          isActive: currentUser.isActive
        };
        
        setUser(userData);
        setUserRole(storedRole as AuthContextType['userRole']);
        
        // Setup assigned pages based on user access rights
        const pages: AssignedPage[] = [
          {
            moduleName: "Funds",
            level: hasAccessHelper(userData, "Funds", "read"),
            href: "/funds"
          },
          {
            moduleName: "Portfolio Companies",
            level: hasAccessHelper(userData, "Portfolio Companies", "read"),
            href: "/portfolio"
          },
          {
            moduleName: "ESG DD",
            level: hasAccessHelper(userData, "ESG DD", "read"),
            href: "/esg-dd"
          },
          {
            moduleName: "ESG DD Report",
            level: hasAccessHelper(userData, "ESG DD", "read"),
            href: "/esg-dd/report"
          },
          {
            moduleName: "ESG CAP",
            level: hasAccessHelper(userData, "ESG CAP", "read"),
            href: "/esg-dd/cap"
          },
          {
            moduleName: "Team",
            level: hasAccessHelper(userData, "Team", "read"),
            href: "/team"
          },
          {
            moduleName: "Valuation",
            level: hasAccessHelper(userData, "Valuation", "read"),
            href: "/valuation"
          }
        ];
        
        setAssignedPages(pages);
        
        // Determine first accessible route
        const accessibleRoutes = pages.filter(page => page.level !== "none");
        if (accessibleRoutes.length > 0) {
          setFirstAccessibleRoute(accessibleRoutes[0].href);
        }
      }
    } else {
      setSession(false);
      setUser(null);
      setUserRole(null);
    }
  }, []);

  // Helper function to check if user has access to a module
  const hasAccessHelper = (user: User, moduleName: string, level: 'read' | 'write' | 'admin' = 'read'): 'read' | 'write' | 'admin' | 'none' => {
    if (!user) return 'none';

    const moduleAccess = user.accessRights.find(right => right.moduleName === moduleName);
    if (!moduleAccess) return 'none';

    switch (level) {
      case 'read':
        return ['read', 'write', 'admin'].includes(moduleAccess.level) ? moduleAccess.level : 'none';
      case 'write':
        return ['write', 'admin'].includes(moduleAccess.level) ? moduleAccess.level : 'none';
      case 'admin':
        return moduleAccess.level === 'admin' ? 'admin' : 'none';
      default:
        return 'none';
    }
  };

  const signOut = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('userRole');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('user_id');
    sessionStorage.removeItem('userRole');
    setSession(false);
    setUser(null);
    setUserRole(null);
    navigate('/');
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
    <AuthContext.Provider value={{ session, user, userRole, assignedPages, firstAccessibleRoute, signOut, hasAccess }}>
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
