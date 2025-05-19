
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signInWithCredentials } = useAuth();

  // Dummy API response for assigned modules
  const fetchAssignedPages = async () => {
    // Simulating API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return [
      {
        moduleName: "Dashboard",
        level: "read",
        href: "/"
      },
      {
        moduleName: "Funds",
        level: "read",
        href: "/funds"
      },
      {
        moduleName: "Portfolio Companies",
        level: "read",
        href: "/portfolio"
      },
      {
        moduleName: "ESG DD",
        level: "none",
        href: "/esg-dd"
      },
      {
        moduleName: "ESG DD Report",
        level: "read",
        href: "/esg-dd/report"
      }
    ];
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Fetch assigned pages from "API"
      const assignedPages = await fetchAssignedPages();
      
      // Use Supabase for authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // Call our custom sign-in function with the assigned pages
        signInWithCredentials({
          email,
          id: data.user?.id || '1',
          assignedPages
        });
        
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        navigate("/");
      }
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            For testing: Use any email and password
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
