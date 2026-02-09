"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { User, Lock, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const [isSignUp, setIsSignUp] = useState(false);
    const [fullName, setFullName] = useState("");

    const handleMagicLink = async () => {
        setLoading(true);
        setMessage("Sending Magic Link...");
        try {
            const { error } = await supabase.auth.signInWithOtp({ email });
            if (error) {
                setMessage(error.message);
            } else {
                setMessage("Magic Link sent! Please check your email inbox to log in.");
            }
        } catch (e) {
            const err = e as Error;
            setMessage(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null); // Clear previous errors

        try {
            if (isSignUp) {
                setMessage("Creating authentication account...");
                // Sign Up Flow
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                });

                if (error) throw error;
                if (!data.user) throw new Error("Signup failed - No user returned.");

                // Check if session exists. If not, email confirmation is likely required.
                if (!data.session) {
                    setMessage("Account created! Please check your email to confirm your account before logging in.");
                    setLoading(false);
                    return;
                }

                setMessage("Creating user profile...");
                // Create Profile for the new user
                // Ensure you have run the migration to add 'category' and 'referrer_id' columns!
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert({
                        id: data.user.id,
                        email,
                        full_name: fullName,
                        role: 'leader',
                        category: 'director',
                        referrer_id: null
                    });

                if (profileError) {
                    console.error("Profile creation error details:", profileError);
                    // Common error: RLS policy or Missing Columns
                    if (profileError.code === "42703") {
                        setMessage("Error: Database schema mismatch. Please run the SQL migration to add 'category' columns.");
                        setLoading(false);
                        return;
                    }
                    // Duplicate Key error (Profile already exists)
                    if (profileError.code === "23505") {
                        setMessage("Profile already exists. redirecting...");
                        router.push("/dashboard");
                        return;
                    }

                    setMessage(`Account created, but profile failed: ${profileError.message || JSON.stringify(profileError)}`);
                    setLoading(false);
                    return;
                }

                setMessage("Success! Logging you in...");
                router.push("/dashboard");

            } else {
                setMessage("Authenticating...");
                // Login Flow
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) {
                    // Handle "Invalid login credentials" specifically
                    if (error.message === "Invalid login credentials") {
                        throw new Error("Login failed (Invalid Credentials). If you saw an error during signup, your account was NOT created. Please switch to 'Create Account' and try a DIFFERENT email.");
                    }
                    throw error;
                }

                setMessage("Login successful. Redirecting...");
                router.push("/dashboard");
            }
        } catch (e) {
            const err = e as Error;
            console.error(e);
            setMessage(`Error: ${err?.message || "An unexpected error occurred."}`);
        } finally {
            // Only stop loading if we are NOT redirecting (to prevent flashing)
            // Actually, standard practice is to stop loading even if redirecting, 
            // but if we are stuck, we want to know.
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[100px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[100px]" />

            <Card className="w-full max-w-md z-10 border-muted/50 shadow-2xl bg-card/50 backdrop-blur-sm">
                <CardHeader className="text-center space-y-2">
                    <CardTitle className="text-3xl font-bold tracking-tighter">
                        {isSignUp ? "Create Account" : "Welcome Back"}
                    </CardTitle>
                    <CardDescription>
                        {isSignUp ? "Set up your admin access." : "Enter your credentials to access the portal."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {message && (
                        <div className="mb-4 p-3 rounded bg-destructive/10 text-destructive text-sm text-center">
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleAuth} className="space-y-4">
                        {isSignUp && (
                            <div className="space-y-2">
                                <Label htmlFor="fullname">Full Name</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="fullname"
                                        type="text"
                                        placeholder="Your Name"
                                        className="pl-9"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    className="pl-9"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-9"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full font-bold bg-primary hover:bg-primary/90" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isSignUp ? "Create Admin Account" : "Sign In")}
                        </Button>

                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or continue with</span></div>
                        </div>

                        <Button type="button" variant="outline" className="w-full" onClick={handleMagicLink} disabled={loading || !email}>
                            Email Magic Link (No Password)
                        </Button>

                        <div className="text-center mt-4">
                            <Button variant="link" type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-xs text-muted-foreground">
                                {isSignUp ? "Already have an account? Sign In" : "Need to set up the Network? Create Account"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
