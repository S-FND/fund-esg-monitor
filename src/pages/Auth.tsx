import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, Shield, BarChart3, FileSearch, Activity, AlertTriangle, TrendingUp } from "lucide-react";

const FEATURES = [
  { icon: FileSearch, label: "ESG DD – Machine driven" },
  { icon: Shield, label: "Corrective Action Plan tracker" },
  { icon: Activity, label: "Integrated operational data" },
  { icon: BarChart3, label: "Portfolio Monitoring" },
  { icon: AlertTriangle, label: "Real-time Risk identification" },
  { icon: TrendingUp, label: "Valuation impact modeling" },
];

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) navigate("/");
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && event === "SIGNED_IN") navigate("/");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast({ title: "Welcome back!", description: "Successfully signed in." });
    } catch (error: any) {
      toast({ title: "Error signing in", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { full_name: fullName, company_name: companyName },
        },
      });
      if (error) throw error;
      toast({ title: "Account created!", description: "Please check your email to verify your account." });
      setEmail(""); setPassword(""); setFullName(""); setCompanyName("");
    } catch (error: any) {
      toast({ title: "Error creating account", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="w-full border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto w-full max-w-[1200px] flex items-center justify-between px-6 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <img src="/fandoro-logo.png" alt="Fandoro Technologies" className="h-9 w-9" />
            <span className="text-xl font-bold tracking-tight text-foreground">Fandoro</span>
          </div>
          <nav className="hidden sm:flex items-center gap-6">
            <a href="/pricing" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Pricing
            </a>
            <a href="/technical-architecture" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Technical Architecture
            </a>
            <a href="https://fandoro.com" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Visit Fandoro.com →
            </a>
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center px-5 py-12 lg:px-8">
        <div className="mx-auto w-full max-w-[1200px] flex flex-col lg:flex-row lg:justify-between lg:items-center gap-12">

          {/* Left Column */}
          <div className="flex-1 max-w-[600px] text-center lg:text-left">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-4">
                ESG Intelligence as a Service Platform
              </p>
              <h1 className="text-3xl md:text-4xl font-bold leading-tight text-foreground mb-4">
                Actionating ESG data to enable businesses and investors to{" "}
                <span className="text-primary">act on ESG risks identified.</span>
              </h1>
              <p className="text-base text-muted-foreground leading-relaxed mb-8" style={{ lineHeight: 1.6 }}>
                These risks are used as inputs for the ESG Risk modeling on the platform with real time correlation with other influencing factors – regulatory, operational, climate, supply chain etc. to offer decision grade information to investors and startups to de-risk themselves.
              </p>

              {/* Feature bullets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {FEATURES.map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column – 40% (2/5) */}
          <div className="lg:col-span-2 flex justify-center lg:justify-end">
            <Card className="w-full max-w-[420px] shadow-lg border border-border/60" style={{ borderRadius: 12, padding: 0 }}>
              <CardHeader className="text-center px-8 pt-8 pb-2">
                <CardTitle className="text-2xl font-semibold">Welcome</CardTitle>
                <CardDescription className="text-sm">Sign in or create an account</CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-8 pt-2">
                <Tabs defaultValue="signin" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
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
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signin-password">Password</Label>
                        <div className="relative">
                          <Input
                            id="signin-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="h-11 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <Button type="submit" className="w-full h-12 text-sm font-semibold mt-2 hover:shadow-md transition-shadow" disabled={loading}>
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
                          className="h-11"
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
                          className="h-11"
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
                          className="h-11"
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
                          className="h-11"
                        />
                      </div>
                      <Button type="submit" className="w-full h-12 text-sm font-semibold mt-2 hover:shadow-md transition-shadow" disabled={loading}>
                        {loading ? "Creating account..." : "Create Account"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Fandoro Technologies. All rights reserved.
      </footer>
    </div>
  );
}
