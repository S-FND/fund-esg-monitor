
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AdminNav } from "./admin/AdminNav";
import { useAuth } from "@/contexts/AuthContext";

export function Header() {
  const { user, userRole, signOut } = useAuth();
  
  const getUserInitials = () => {
    if (!user?.email) return 'U';
    return user.email.substring(0, 2).toUpperCase();
  };
  
  const getRoleBadgeColor = () => {
    switch(userRole) {
      case 'fandoro_admin': return 'bg-purple-500';
      case 'investor_admin': return 'bg-blue-500';
      case 'investor_employee': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };
  
  const getRoleDisplayName = () => {
    switch(userRole) {
      case 'fandoro_admin': return 'Fandoro Admin';
      case 'investor_admin': return 'Investor Admin';
      case 'investor_employee': return 'Investor Employee';
      default: return 'User';
    }
  };
  
  return (
    <header className="fixed top-0 left-64 right-0 z-50 flex h-16 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-4">
        {userRole === 'fandoro_admin' && <AdminNav />}
      </div>
      
      <div className="flex items-center gap-4">
        <ThemeToggle />
        
        {user ? (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <div className={`h-6 w-6 rounded-full ${getRoleBadgeColor()} text-white flex items-center justify-center`}>
                    {getUserInitials()}
                  </div>
                  <span className="hidden md:inline">{user.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{user.email}</span>
                    <span className="text-xs text-muted-foreground">{getRoleDisplayName()}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : null}
      </div>
    </header>
  );
}
