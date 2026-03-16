"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { User, Lock, Loader2, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: "error" | "info" | "success" } | null>(null);
    const [isSignUp, setIsSignUp] = useState(false);
    const [fullName, setFullName] = useState("");

    const handleMagicLink = async () => {
        setLoading(true);
        setMessage({ text: "Sending Magic Link...", type: "info" });
        try {
            const { error } = await supabase.auth.signInWithOtp({ email });
            if (error) {
                setMessage({ text: error.message, type: "error" });
            } else {
                setMessage({ text: "Magic Link sent! Please check your email inbox.", type: "success" });
            }
        } catch (e) {
            setMessage({ text: (e as Error).message, type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        try {
            if (isSignUp) {
                setMessage({ text: "Creating account...", type: "info" });
                const { data, error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                if (!data.user) throw new Error("Signup failed - No user returned.");
                if (!data.session) {
                    setMessage({ text: "Account created! Check your email to confirm before logging in.", type: "success" });
                    setLoading(false);
                    return;
                }
                setMessage({ text: "Creating user profile...", type: "info" });
                const { error: profileError } = await supabase.from('profiles').insert({
                    id: data.user.id, email,
                    full_name: fullName,
                    role: 'leader', category: 'director', referrer_id: null
                });
                if (profileError) {
                    if (profileError.code === "42703") {
                        setMessage({ text: "Error: Database schema mismatch. Please run SQL migration.", type: "error" });
                        setLoading(false);
                        return;
                    }
                    if (profileError.code === "23505") {
                        setMessage({ text: "Profile already exists. Redirecting...", type: "info" });
                        router.push("/dashboard");
                        return;
                    }
                    setMessage({ text: `Profile failed: ${profileError.message}`, type: "error" });
                    setLoading(false);
                    return;
                }
                setMessage({ text: "Success! Logging you in...", type: "success" });
                router.push("/dashboard");
            } else {
                setMessage({ text: "Authenticating...", type: "info" });
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) {
                    if (error.message === "Invalid login credentials") {
                        throw new Error("Invalid credentials. Please double-check your email and password.");
                    }
                    throw error;
                }
                setMessage({ text: "Login successful. Redirecting...", type: "success" });
                router.push("/dashboard");
            }
        } catch (e) {
            setMessage({ text: `${(e as Error)?.message || "An unexpected error occurred."}`, type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const msgColors = {
        error: "bg-destructive/10 text-destructive border border-destructive/20",
        info: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
        success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Animated Background Orbs */}
            <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[120px] animate-float" />
            <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[120px] animate-float-delayed" />
            <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-teal-500/5 blur-[100px]" />

            {/* Grid pattern overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />

            {/* Login Card */}
            <div className="w-full max-w-md z-10 animate-fade-in-up">
                <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl shadow-black/20 overflow-hidden">
                    {/* Top accent line */}
                    <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500" />

                    <div className="p-8">
                        {/* Brand Logo */}
                        <div className="flex flex-col items-center mb-8">
                            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 mb-4">
                                <TrendingUp className="h-7 w-7 text-white" />
                            </div>
                            <h1 className="text-2xl font-bold gradient-text mb-1">ProfitTracker</h1>
                            <p className="text-muted-foreground text-sm">
                                {isSignUp ? "Set up your admin access" : "Welcome back to your portal"}
                            </p>
                        </div>

                        {/* Message */}
                        {message && (
                            <div className={`mb-5 p-3 rounded-xl text-sm text-center ${msgColors[message.type]}`}>
                                {message.text}
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleAuth} className="space-y-4">
                            {isSignUp && (
                                <div className="space-y-1.5">
                                    <Label htmlFor="fullname" className="text-sm font-medium">Full Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="fullname"
                                            type="text"
                                            placeholder="Your Name"
                                            className="pl-9 h-11 bg-accent/30 border-border/50 focus:border-emerald-500/60 focus:ring-emerald-500/20 transition-colors rounded-xl"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="name@example.com"
                                        className="pl-9 h-11 bg-accent/30 border-border/50 focus:border-emerald-500/60 transition-colors rounded-xl"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        className="pl-9 h-11 bg-accent/30 border-border/50 focus:border-emerald-500/60 transition-colors rounded-xl"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-11 font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20 rounded-xl transition-all"
                                disabled={loading}
                            >
                                {loading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    isSignUp ? "Create Admin Account" : "Sign In to Portal"
                                )}
                            </Button>

                            <div className="relative my-2">
                                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/50" /></div>
                                <div className="relative flex justify-center text-xs"><span className="bg-card px-3 text-muted-foreground">or</span></div>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                className="w-full h-11 rounded-xl border-border/50 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all text-sm"
                                onClick={handleMagicLink}
                                disabled={loading || !email}
                            >
                                ✉️ Email Magic Link (No Password)
                            </Button>

                            <div className="text-center pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsSignUp(!isSignUp)}
                                    className="text-xs text-muted-foreground hover:text-emerald-500 transition-colors"
                                >
                                    {isSignUp ? "Already have an account? Sign In →" : "Need to set up the Network? Create Account →"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <p className="text-center text-xs text-muted-foreground mt-6">
                    Secure trading network portal · Protected access
                </p>
            </div>
        </div>
    );
}
