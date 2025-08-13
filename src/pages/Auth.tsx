import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && event === 'SIGNED_IN') {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
            company_name: companyName,
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Account created successfully!",
        description: "Please check your email to verify your account.",
      });

      // Clear form
      setEmail("");
      setPassword("");
      setFullName("");
      setCompanyName("");
    } catch (error: any) {
      toast({
        title: "Error creating account",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "Successfully signed in.",
      });
    } catch (error: any) {
      toast({
        title: "Error signing in",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: string) => {
    setLoading(true);
    try {
      // Create demo user credentials
      const demoUsers = {
        'Fund Manager': { email: 'demo.manager@fandoro.com', password: 'demo123', name: 'Demo Manager', company: 'Fandoro Demo Fund' },
        'Analyst': { email: 'demo.analyst@fandoro.com', password: 'demo123', name: 'Demo Analyst', company: 'Fandoro Analytics' },
        'Admin': { email: 'demo.admin@fandoro.com', password: 'demo123', name: 'Demo Admin', company: 'Fandoro Admin' }
      };

      const demoUser = demoUsers[role as keyof typeof demoUsers];
      
      // Try to sign in first
      let { error } = await supabase.auth.signInWithPassword({
        email: demoUser.email,
        password: demoUser.password,
      });

      // If user doesn't exist, create them
      if (error && error.message.includes('Invalid login credentials')) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: demoUser.email,
          password: demoUser.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: demoUser.name,
              company_name: demoUser.company,
            }
          }
        });

        if (signUpError) throw signUpError;

        // Confirm the demo user
        const { error: confirmError } = await supabase.rpc('confirm_demo_user', {
          user_email: demoUser.email
        });

        if (confirmError) {
          console.error('Error confirming demo user:', confirmError);
        }

        // Try to sign in again after confirmation
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: demoUser.email,
          password: demoUser.password,
        });

        if (signInError) throw signInError;

        toast({
          title: `Demo ${role} account created and logged in!`,
          description: "You can now use all the features of the platform.",
        });
        return;
      } else if (error && error.message.includes('Email not confirmed')) {
        // Confirm the demo user
        const { error: confirmError } = await supabase.rpc('confirm_demo_user', {
          user_email: demoUser.email
        });

        if (confirmError) {
          console.error('Error confirming demo user:', confirmError);
        }

        // Try to sign in again after confirmation
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: demoUser.email,
          password: demoUser.password,
        });

        if (signInError) throw signInError;

        toast({
          title: `Demo ${role} logged in!`,
          description: "You can now use all the features of the platform.",
        });
        return;
      } else if (error) {
        throw error;
      }

      toast({
        title: `Welcome ${role}!`,
        description: "Successfully signed in with demo account.",
      });
    } catch (error: any) {
      toast({
        title: "Error with demo login",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to Fandoro</CardTitle>
          <CardDescription>Sign in to your account or create a new one</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Demo User Buttons */}
          <div className="mb-6 p-4 bg-muted/50 rounded-lg border">
            <h3 className="text-sm font-medium mb-3 text-muted-foreground">Quick Demo Access</h3>
            <div className="grid grid-cols-1 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDemoLogin('Fund Manager')}
                disabled={loading}
                className="justify-start"
              >
                🏢 Demo Fund Manager
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDemoLogin('Analyst')}
                disabled={loading}
                className="justify-start"
              >
                📊 Demo Analyst
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDemoLogin('Admin')}
                disabled={loading}
                className="justify-start"
              >
                ⚙️ Demo Admin
              </Button>
            </div>
          </div>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-company">Company Name</Label>
                  <Input
                    id="signup-company"
                    type="text"
                    placeholder="Enter your company name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}