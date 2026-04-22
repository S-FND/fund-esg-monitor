import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, Shield, BarChart3, FileSearch, Activity, AlertTriangle, TrendingUp, ArrowLeft, Loader2 } from "lucide-react";
import { http } from "@/utils/httpInterceptor";
import { useAuth } from "@/contexts/AuthContext";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { forgotPassword, verifyOtp, resetPassword, checkBlockedStatus } from "./services/auth";
import { Link } from "react-router-dom";
const FEATURES = [
    { icon: FileSearch, label: "ESG DD – Machine driven" },
    { icon: Shield, label: "Corrective Action Plan tracker" },
    { icon: Activity, label: "Integrated operational data" },
    { icon: BarChart3, label: "Portfolio Monitoring" },
    { icon: AlertTriangle, label: "Real-time Risk identification" },
    { icon: TrendingUp, label: "Valuation impact modeling" },
];

// Select options for investor type
const SelectFor = [
    { value: 1, label: "Investor" },
    { value: 2, label: "Company" },
];

// Blocked email domains
const blockedDomains = [
    "gmail", "yahoo", "hotmail", "outlook", "protonmail", "icloud",
    "me", "mac", "aol", "yandex", "ymail", "yahoomail", "mail",
    "gmx", "tutanota", "fastmail", "rediffmail", "lycos", "india",
    "rediff", "yopmail"
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
    const { setUser } = useAuth();

    // Forgot Password States
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resetStep, setResetStep] = useState<"email" | "otp" | "password">("email");
    const [resetEmail, setResetEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [resetLoading, setResetLoading] = useState(false);
    const [resendDisabled, setResendDisabled] = useState(false);
    const [resendTimer, setResendTimer] = useState(60);

    // Signup flow states
    const [signupStep, setSignupStep] = useState<"email" | "otp" | "register">("email");
    const [signupOtp, setSignupOtp] = useState("");
    const [entityType, setEntityType] = useState(0);
    const [isChecked, setIsChecked] = useState(false);
    const [enableButton, setEnableButton] = useState(false);
    const [isValidEmail, setIsValidEmail] = useState(false);
    const [signupData, setSignupData] = useState({
        name: "",
        companyName: "",
        email: "",
        password: "",
        entityType: 0,
        isInvestor: false,
    });

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

    // Forgot Password Functions
    const startResendTimer = () => {
        setResendDisabled(true);
        const timer = setInterval(() => {
            setResendTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setResendDisabled(false);
                    return 60;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!resetEmail) {
            toast({ title: "Email required", description: "Please enter your email address", variant: "destructive" });
            return;
        }

        setResetLoading(true);
        try {
            const { error: blockedError } = await checkBlockedStatus(resetEmail);
            if (blockedError) {
                toast({ title: "Account blocked", description: blockedError, variant: "destructive" });
                return;
            }

            const { error } = await forgotPassword(resetEmail);

            if (error) {
                toast({ title: "Failed", description: error, variant: "destructive" });
            } else {
                toast({ title: "Success", description: `OTP sent to ${resetEmail}` });
                setResetStep("otp");
                startResendTimer();
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setResetLoading(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!otp || otp.length !== 6) {
            toast({ title: "Invalid OTP", description: "Please enter a valid 6-digit code", variant: "destructive" });
            return;
        }

        setResetLoading(true);
        try {
            const { error } = await verifyOtp(resetEmail, otp);

            if (error) {
                toast({ title: "Invalid OTP", description: error, variant: "destructive" });
            } else {
                toast({ title: "OTP Verified", description: "Create a new password" });
                setResetStep("password");
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setResetLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast({ title: "Passwords don't match", description: "Please enter matching passwords", variant: "destructive" });
            return;
        }

        if (newPassword.length < 8) {
            toast({ title: "Password too short", description: "Password must be at least 8 characters", variant: "destructive" });
            return;
        }

        setResetLoading(true);
        try {
            const { error } = await resetPassword(resetEmail, otp, newPassword);

            if (error) {
                toast({ title: "Failed", description: error, variant: "destructive" });
            } else {
                toast({ title: "Success", description: "Password reset successful! Please login." });
                // Reset forgot password state
                setShowForgotPassword(false);
                setResetStep("email");
                setResetEmail("");
                setOtp("");
                setNewPassword("");
                setConfirmPassword("");
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setResetLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setResetLoading(true);
        try {
            const { error } = await forgotPassword(resetEmail);
            if (error) {
                toast({ title: "Failed", description: error, variant: "destructive" });
            } else {
                toast({ title: "OTP Resent", description: `New OTP sent to ${resetEmail}` });
                startResendTimer();
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setResetLoading(false);
        }
    };

    // Render Forgot Password Flow
    const renderForgotPassword = () => {
        return (
            <div className="space-y-4">
                <Button
                    variant="ghost"
                    onClick={() => {
                        setShowForgotPassword(false);
                        setResetStep("email");
                        setResetEmail("");
                        setOtp("");
                        setNewPassword("");
                        setConfirmPassword("");
                    }}
                    className="flex items-center gap-2 px-0 mb-4"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to login
                </Button>

                <div className="text-center space-y-2">
                    <h2 className="text-xl font-semibold">
                        {resetStep === "email" && "Reset Password"}
                        {resetStep === "otp" && "Verify Your Email"}
                        {resetStep === "password" && "Create New Password"}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {resetStep === "email" && "Enter your email to receive a verification code"}
                        {resetStep === "otp" && `Enter the 6-digit code sent to ${resetEmail}`}
                        {resetStep === "password" && "Create a strong password for your account"}
                    </p>
                </div>

                {resetStep === "email" && (
                    <form onSubmit={handleSendOTP} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="reset-email">Email Address</Label>
                            <Input
                                id="reset-email"
                                type="email"
                                placeholder="your@company.com"
                                value={resetEmail}
                                onChange={(e) => setResetEmail(e.target.value.toLowerCase())}
                                className="h-11"
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full h-11" disabled={resetLoading}>
                            {resetLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Send Verification Code
                        </Button>
                    </form>
                )}

                {resetStep === "otp" && (
                    <form onSubmit={handleVerifyOTP} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="otp">Verification Code</Label>
                            <Input
                                id="otp"
                                type="text"
                                inputMode="numeric"
                                placeholder="123456"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                maxLength={6}
                                className="h-11 text-center text-lg tracking-widest"
                                required
                            />
                        </div>
                        <div className="flex justify-between items-center">
                            <Button
                                variant="link"
                                type="button"
                                onClick={handleResendOTP}
                                disabled={resendDisabled}
                                className="px-0 text-sm"
                            >
                                {resendDisabled ? `Resend in ${resendTimer}s` : "Resend Code"}
                            </Button>
                        </div>
                        <Button type="submit" className="w-full h-11" disabled={resetLoading}>
                            {resetLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Verify Code
                        </Button>
                    </form>
                )}

                {resetStep === "password" && (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <div className="relative">
                                <Input
                                    id="new-password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="At least 8 characters"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="h-11 pr-10"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm Password</Label>
                            <Input
                                id="confirm-password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Re-enter your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="h-11"
                                required
                            />
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                            <p>Password must contain:</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li className={newPassword.length >= 8 ? "text-green-500" : ""}>At least 8 characters</li>
                                <li className={/[A-Z]/.test(newPassword) ? "text-green-500" : ""}>At least one uppercase letter</li>
                                <li className={/\d/.test(newPassword) ? "text-green-500" : ""}>At least one number</li>
                            </ul>
                        </div>
                        <div className="flex items-start space-x-3">
                            <div className="pt-1">
                                <input
                                    type="checkbox"
                                    id="terms"
                                    checked={isChecked}
                                    onChange={(e) => setIsChecked(e.target.checked)}
                                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                                />
                            </div>
                            <label htmlFor="terms" className="text-sm text-muted-foreground">
                                I agree to the{' '}
                                <a href="https://sustainability.fandoro.com/terms-of-service/" target="_blank" className="text-primary hover:underline">
                                    Terms of Service
                                </a>{' '}
                                and{' '}
                                <a href="https://sustainability.fandoro.com/privacy-policy/" target="_blank" className="text-primary hover:underline">
                                    Privacy Policy
                                </a>
                                .
                            </label>
                        </div>
                        <Button type="submit" className="w-full h-11" disabled={resetLoading}>
                            {resetLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Update Password
                        </Button>
                    </form>
                )}
            </div>
        );
    };

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(import.meta.env.VITE_API_URL + "/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok || !data.status || !data.user) {
                toast({ title: "Error", description: data.message || "Invalid credentials", variant: "destructive" });
                setLoading(false);
                return;
            }
            const { user, token, access, roleMenu = [] } = data;
            localStorage.setItem("auth_token", token);
            await handleTokenAuth(token);
            navigate("/dashboard");
            toast({ title: "Welcome back!", description: "Successfully signed in." });
        } catch (error: any) {
            toast({ title: "Error signing in", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleTokenAuth = async (token: string) => {
        const cleanToken = token.replace(/^"|"$/g, '');
        localStorage.setItem('auth_token', cleanToken);

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/investor/general-info/verify-token`, {
                headers: { Authorization: `Bearer ${cleanToken}` }
            });

            if (!res.ok) throw new Error("Invalid credentials");

            const jsonData = await res.json();
            localStorage.setItem('user', JSON.stringify(jsonData.data));
            setUser(jsonData.data);
        } catch {
            toast({ title: "Authentication failed", description: "Invalid or expired token.", variant: "destructive" });
            setTimeout(() => navigate("/"), 3000);
        }
    };

    // Step 1: Verify Email
    const verifyUserEmail = async () => {
        if (!signupData.email || signupData.email.trim() === "") {
            toast({ title: "Error", description: "Please enter your email ID", variant: "destructive" });
            return;
        }

        if (!isValidEmail) {
            toast({ title: "Error", description: "Please enter valid email ID", variant: "destructive" });
            return;
        }

        // Extract domain and check if blocked
        const domain = signupData.email.split("@")[1]?.split(".")[0];
        if (blockedDomains.includes(domain)) {
            toast({ title: "Error", description: "Please enter official email ID", variant: "destructive" });
            return;
        }

        setLoading(true);

        try {
            // Check if email is blocked/available
            const blockedEmailRes = await fetch(import.meta.env.VITE_API_URL + "/auth/blocked-status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: signupData.email }),
            });
            const blockedEmail = await blockedEmailRes.json();

            if (blockedEmail?.blocked === false) {
                // Send OTP
                const verifyRes = await fetch(import.meta.env.VITE_API_URL + "/auth/verify-email", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: signupData.email }),
                });
                const res = await verifyRes.json();

                if (res) {
                    localStorage.setItem("token", JSON.stringify(res.token));
                    setSignupStep("otp");
                    toast({ title: "Success", description: "OTP Sent to your email" });
                } else {
                    toast({ title: "Error", description: "Email is already registered", variant: "destructive" });
                }
            } else {
                toast({ title: "Error", description: "Email domain is blocked", variant: "destructive" });
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP
    const verifyEmailOTP = async () => {
        if (!signupOtp || signupOtp.trim() === "") {
            toast({ title: "Error", description: "Please enter your OTP", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(import.meta.env.VITE_API_URL + "/auth/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: signupData.email, otp: signupOtp }),
            });
            const data = await res.json();

            if (data) {
                setSignupStep("register");
                toast({ title: "Success", description: "OTP Verified" });
            } else {
                toast({ title: "Error", description: "Invalid OTP", variant: "destructive" });
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Complete Registration
    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!enableButton) {
            toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(import.meta.env.VITE_API_URL + "/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(signupData),
            });
            const data = await res.json();

            if (data.status) {
                localStorage.setItem("user", JSON.stringify(data.data));
                localStorage.setItem("token", JSON.stringify(data.token));
                toast({ title: "Success", description: "Account Created Successfully" });
                setLoading(false);
                navigate("/dashboard");
            } else {
                toast({ title: "Error", description: data.message || "Registration failed", variant: "destructive" });
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    // Handle signup form input changes
    const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        if (type === "checkbox") {
            const checked = (e.target as HTMLInputElement).checked;
            if (name === "isChecked") {
                setIsChecked(checked);
            }
            return;
        }

        const updatedData = { ...signupData, [name]: value };
        setSignupData(updatedData);

        // Validate email format
        if (name === "email") {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            setIsValidEmail(emailRegex.test(value));
        }

        // Enable/disable register button
        if (signupStep === "register") {
            if (
                updatedData.name !== "" &&
                updatedData.companyName !== "" &&
                updatedData.email !== "" &&
                updatedData.password !== "" &&
                entityType !== 0 &&
                isChecked !== false
            ) {
                setEnableButton(true);
            } else {
                setEnableButton(false);
            }
        }
    };

    const handleEntityTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = parseInt(e.target.value);
        setEntityType(value);
        setSignupData({
            ...signupData,
            entityType: value,
            isInvestor: value === 1,
        });

        if (signupStep === "register") {
            if (
                signupData.name !== "" &&
                signupData.companyName !== "" &&
                signupData.email !== "" &&
                signupData.password !== "" &&
                value !== 0 &&
                isChecked !== false
            ) {
                setEnableButton(true);
            } else {
                setEnableButton(false);
            }
        }
    };

    // Reset signup form
    const resetSignup = () => {
        setSignupStep("email");
        setSignupOtp("");
        setEntityType(0);
        setIsChecked(false);
        setEnableButton(false);
        setSignupData({
            name: "",
            companyName: "",
            email: "",
            password: "",
            entityType: 0,
            isInvestor: false,
        });
    };

    // Render email step
    const renderEmailStep = () => (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
                Please enter your email address to proceed with the registration.
            </p>
            <Input
                placeholder="Email"
                className="h-11"
                name="email"
                type="email"
                value={signupData.email}
                onChange={handleSignupChange}
                required
            />
            <Button
                type="button"
                className="w-full h-12 text-sm font-semibold mt-2 hover:shadow-lg hover:scale-[1.02] transition-all"
                onClick={verifyUserEmail}
                disabled={loading || !signupData.email || !isValidEmail}
            >
                {loading ? "Sending..." : "Continue"}
            </Button>
        </div>
    );

    // Render OTP step
    const renderOTPStep = () => (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
                Please check your inbox for the OTP. If you don't find it there, kindly check your spam folder.
            </p>
            <Input
                placeholder="Enter OTP"
                className="h-11"
                name="otp"
                type="text"
                value={signupOtp}
                onChange={(e) => setSignupOtp(e.target.value)}
                required
            />
            <Button
                type="button"
                className="w-full h-12 text-sm font-semibold mt-2 hover:shadow-lg hover:scale-[1.02] transition-all"
                onClick={verifyEmailOTP}
                disabled={loading || !signupOtp}
            >
                {loading ? "Verifying..." : "Verify OTP"}
            </Button>
            <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={resetSignup}
            >
                Back to Email
            </Button>
        </div>
    );

    // Render registration form step
    const renderRegistrationStep = () => (
        <form onSubmit={handleSignUp} className="space-y-4">
            <Input
                placeholder="Full Name"
                className="h-11"
                name="name"
                value={signupData.name}
                onChange={handleSignupChange}
                required
            />
            <Input
                placeholder="Company Name"
                className="h-11"
                name="companyName"
                value={signupData.companyName}
                onChange={handleSignupChange}
                required
            />
            <Input
                placeholder="Email"
                className="h-11"
                name="email"
                type="email"
                value={signupData.email}
                onChange={handleSignupChange}
                readOnly
                required
            />
            <Input
                placeholder="Password"
                className="h-11"
                name="password"
                type="password"
                value={signupData.password}
                onChange={handleSignupChange}
                required
            />

            <select
                className="w-full h-11 px-3 rounded-md border border-input bg-background"
                value={entityType}
                onChange={handleEntityTypeChange}
                required
            >
                <option value={0}>Select Type</option>
                {SelectFor.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>

            {/* Terms and Conditions Checkbox */}
            <div className="flex items-center space-x-2">
                <input
                    type="checkbox"
                    id="terms"
                    name="isChecked"
                    checked={isChecked}
                    onChange={handleSignupChange}
                    className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="terms" className="text-sm text-muted-foreground">
                    By clicking 'Register', you agree to the{" "}
                    <a href="/terms-of-service" target="_blank" className="text-primary hover:underline">
                        Terms of Service
                    </a>
                    {" "}and{" "}
                    <a href="/privacy-policy" target="_blank" className="text-primary hover:underline">
                        Privacy Policy
                    </a>
                    .
                </label>
            </div>

            <div className="flex gap-2">
                <Button
                    type="button"
                    variant="ghost"
                    className="flex-1"
                    onClick={resetSignup}
                >
                    Back
                </Button>
                <Button
                    type="submit"
                    className="flex-1 h-12 text-sm font-semibold hover:shadow-lg hover:scale-[1.02] transition-all"
                    disabled={loading}
                >
                    {loading ? "Creating account..." : "Create Account"}
                </Button>
            </div>
        </form>
    );

    // Render signup content based on step
    const renderSignupContent = () => {
        switch (signupStep) {
            case "email":
                return renderEmailStep();
            case "otp":
                return renderOTPStep();
            case "register":
                return renderRegistrationStep();
            default:
                return renderEmailStep();
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-background w-full">
            {/* Header */}
            <header className="w-full border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="mx-auto w-full max-w-[1200px] flex items-center justify-between px-6 py-4 lg:px-8">
                    <div className="flex items-center gap-3">
                        <img
                            src="/logo/logo_no_text_500x500.png"
                            alt="Fandoro"
                            className="h-8 w-8"
                        />
                        <img src="/logo/logo_text_only_700x150.png" alt="Fandoro Technologies" className="h-9 w-13" />
                    </div>
                    <nav className="hidden sm:flex items-center gap-6">
                        <a href="https://fandoro.com" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                            Visit Fandoro.com →
                        </a>
                        <ModeToggle />
                    </nav>
                </div>
            </header>

            {/* Main */}
            <main className="flex-1 w-full flex items-center relative overflow-hidden">
                {/* Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-white" />

                {/* Glow Effect */}
                <div className="absolute -left-32 top-1/3 w-[500px] h-[500px] bg-green-200/30 blur-[140px] rounded-full" />

                {/* Content */}
                <div className="relative z-10 w-full max-w-[1200px] mx-auto px-6 lg:px-8 py-12 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-12 lg:gap-[60px]">
                    {/* Left Column */}
                    <div className="flex-1 max-w-[580px] text-left">
                        <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-4">
                            ESG Intelligence as a Service Platform
                        </p>
                        <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight text-foreground mb-6">
                            Actionating ESG data to enable businesses and investors to{" "}
                            <span className="text-primary">act on ESG risks identified.</span>
                        </h1>
                        <p className="text-lg text-muted-foreground leading-relaxed mb-10">
                            These risks are used as inputs for the ESG Risk modeling on the platform with real time correlation with other influencing factors – regulatory, operational, climate, supply chain etc. to offer decision grade information.
                        </p>

                        {/* Features */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {FEATURES.map(({ icon: Icon, label }) => (
                                <div key={label} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                        <Icon className="h-4 w-4 text-primary" />
                                    </div>
                                    <span className="text-sm font-medium text-foreground">{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="w-full max-w-[400px]">
                        <Card className="w-full shadow-xl border border-border/50 backdrop-blur-xl bg-white/80 rounded-xl hover:shadow-2xl transition-all duration-300">
                            <CardHeader className="text-center px-8 pt-8 pb-2">
                                <CardTitle className="text-2xl font-semibold">Welcome</CardTitle>
                                <CardDescription className="text-sm">
                                    Sign in or create an account
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="px-8 pb-8 pt-2">
                                <Tabs defaultValue="signin" className="w-full">
                                    <TabsList className="grid w-full grid-cols-2 mb-6">
                                        <TabsTrigger value="signin">Sign In</TabsTrigger>
                                        <TabsTrigger value="signup">Sign Up</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="signin">
                                        {!showForgotPassword ? (
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
                                                        className="h-11 focus-visible:ring-2 focus-visible:ring-primary/50 transition"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <Label htmlFor="signin-password">Password</Label>
                                                        <Button
                                                            type="button"
                                                            variant="link"
                                                            onClick={() => setShowForgotPassword(true)}
                                                            className="px-0 text-xs text-primary hover:underline h-auto"
                                                        >
                                                            Forgot password?
                                                        </Button>
                                                    </div>
                                                    <div className="relative">
                                                        <Input
                                                            id="signin-password"
                                                            type={showPassword ? "text" : "password"}
                                                            placeholder="Enter your password"
                                                            value={password}
                                                            onChange={(e) => setPassword(e.target.value)}
                                                            required
                                                            className="h-11 pr-10 focus-visible:ring-2 focus-visible:ring-primary/50 transition"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPassword(!showPassword)}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                                                        >
                                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                        </button>
                                                    </div>
                                                    
                                                </div>
                                                <Button
                                                    type="submit"
                                                    className="w-full h-12 text-sm font-semibold mt-2 hover:shadow-lg hover:scale-[1.02] transition-all"
                                                    disabled={loading}
                                                >
                                                    {loading ? "Signing in..." : "Sign In"}
                                                </Button>
                                                <div className="text-center pt-3">
                                                        <div className="flex justify-between text-sm">
                                                            <a
                                                                href="/terms-of-service"
                                                                className="text-primary hover:underline"
                                                            >
                                                                Terms of Service
                                                            </a>

                                                            <a
                                                                href="/privacy-policy"
                                                                className="text-primary hover:underline"
                                                            >
                                                                Privacy Policy
                                                            </a>
                                                        </div>
                                                    </div>
                                            </form>
                                        ) : (
                                            renderForgotPassword()
                                        )}
                                    </TabsContent>

                                    <TabsContent value="signup">
                                        {/* Step indicator */}
                                        <div className="mb-6">
                                            <div className="flex justify-between items-center">
                                                <div className={`flex-1 h-1 rounded-full transition-all ${signupStep === "email" ? "bg-primary" : "bg-green-500"}`} />
                                                <div className={`flex-1 h-1 rounded-full transition-all mx-1 ${signupStep === "otp" ? "bg-primary" : signupStep === "register" ? "bg-green-500" : "bg-gray-200"}`} />
                                                <div className={`flex-1 h-1 rounded-full transition-all ${signupStep === "register" ? "bg-primary" : "bg-gray-200"}`} />
                                            </div>
                                            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                                                <span>Email</span>
                                                <span>OTP</span>
                                                <span>Register</span>
                                            </div>
                                        </div>

                                        {renderSignupContent()}
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