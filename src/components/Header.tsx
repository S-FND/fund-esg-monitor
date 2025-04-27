
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AdminNav } from "./admin/AdminNav";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from '@/contexts/AuthContext';
import { Shield, Building, UserRound } from "lucide-react";

export function Header() {
  const { user, userRole, signOut } = useAuth();
  
  // Function to get user role display name
  const getRoleDisplayName = (role: UserRole | null) => {
    switch (role) {
      case 'fandoro_admin': return 'Fandoro Admin';
      case 'investor': return 'Investor';
      case 'investor_employee': return 'Employee';
      default: return 'User';
    }
  };
  
  // Function to get role icon
  const RoleIcon = ({ role }: { role: UserRole | null }) => {
    switch (role) {
      case 'fandoro_admin': return <Shield className="h-4 w-4" />;
      case 'investor': return <Building className="h-4 w-4" />;
      case 'investor_employee': return <UserRound className="h-4 w-4" />;
      default: return <UserRound className="h-4 w-4" />;
    }
  };
  
  return (
    <header className="fixed top-0 left-64 right-0 z-50 flex h-16 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-4">
        {userRole === 'fandoro_admin' && <AdminNav />}
        
        {/* Different navigation based on user role could be added here */}
        {userRole === 'investor' && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Investor Dashboard</span>
          </div>
        )}
        
        {userRole === 'investor_employee' && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">ESG Monitoring</span>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        <ThemeToggle />
        
        {user ? (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <div className="h-6 w-6 rounded-full bg-esg-primary text-white flex items-center justify-center">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="max-w-[150px] truncate">{user.email}</span>
                  {userRole && (
                    <span className="flex items-center text-xs text-muted-foreground ml-2">
                      <RoleIcon role={userRole} />
                      <span className="ml-1">{getRoleDisplayName(userRole)}</span>
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Login</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Login to your account</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="Enter your email" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" placeholder="Enter your password" />
                  </div>
                  <Button className="w-full">
                    Login
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </header>
  );
}
