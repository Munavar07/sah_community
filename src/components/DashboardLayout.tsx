"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, LogOut, Upload, Users, LineChart, Image as ImageIcon, UserPlus, DollarSign, Loader2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, profile, logout, isLoading, refreshProfile, error: authError, hasCheckedSession } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [showRecovery, setShowRecovery] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShowRecovery(true), 5000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        // ONLY redirect if we are SURE there is no session
        if (!isLoading && hasCheckedSession && !user) {
            router.push("/login");
        }
    }, [user, isLoading, hasCheckedSession, router]);


    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 p-8">
                <Loader2 className="animate-spin w-12 h-12 text-primary" />
                <div className="text-center space-y-2">
                    <p className="text-muted-foreground animate-pulse text-sm font-medium">Synchronizing your profile...</p>
                    {showRecovery && (
                        <div className="pt-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                                Sync is taking longer than usual. You can try forcing the dashboard or signing out to reset.
                            </p>
                            <div className="flex flex-col gap-2">
                                <Button size="sm" onClick={() => window.location.reload()}>
                                    Refresh Page
                                </Button>
                                <Button size="sm" variant="outline" onClick={logout} className="text-destructive hover:bg-destructive/10">
                                    Sign Out & Reset
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Handle Orphaned User (Auth exists, Profile missing)
    if (user && !profile && !isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <div className="text-center space-y-6 max-w-md p-8 border rounded-2xl shadow-2xl bg-card/50 backdrop-blur-md">
                    <div className="flex justify-center flex-col items-center gap-2">
                        <div className="p-3 bg-amber-500/10 rounded-full">
                            <Users className="w-8 h-8 text-amber-500" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight">Identity Sync Pending</h2>
                    </div>

                    <div className="space-y-2 text-sm">
                        <p className="text-muted-foreground">
                            We found your account ({user.email}), but your profile data is missing or couldn't be loaded.
                        </p>
                        {authError && (
                            <div className="p-2 bg-destructive/10 text-destructive rounded font-mono text-xs">
                                Error: {authError}
                            </div>
                        )}
                        <p className="text-[10px] text-muted-foreground border-t pt-2 mt-2">
                            User ID: <code className="bg-muted px-1 rounded">{user.id}</code>
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 pt-2">
                        <Button onClick={() => refreshProfile()} className="w-full">
                            Retry Sync
                        </Button>
                        <div className="grid grid-cols-2 gap-2">
                            <Button onClick={() => window.location.reload()} variant="outline">
                                Full Reload
                            </Button>
                            <Button onClick={logout} variant="outline" className="text-destructive hover:bg-destructive/10">
                                Sign Out
                            </Button>
                        </div>
                    </div>

                    <div className="text-[10px] text-muted-foreground">
                        Tip: If this persists, your profile might not have been created yet.
                    </div>
                </div>
            </div>
        );
    }

    // If we shouldn't be here (no user), the useEffect redirects, but return null/loader while waiting
    if (!user || !profile) return null;

    const leaderLinks = [
        { href: "/dashboard", label: "Master View", icon: LayoutDashboard },
        { href: "/dashboard/members/add", label: "Add Member", icon: UserPlus },
        { href: "/dashboard/network", label: "Network Tree", icon: Users },
        { href: "/dashboard/gallery", label: "Profit Gallery", icon: ImageIcon },
    ];

    const memberLinks = [
        { href: "/dashboard", label: "My Dashboard", icon: LayoutDashboard },
        { href: "/dashboard/log", label: "Log Profit", icon: LineChart },
        { href: "/dashboard/invest", label: "My Investment", icon: DollarSign },
    ];

    const links = profile.role === "leader" ? leaderLinks : memberLinks;

    return (
        <div className="flex min-h-screen bg-background">
            {/* Sidebar */}
            <aside className="w-64 border-r bg-card hidden md:flex flex-col">
                <div className="p-6">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
                        ProfitTracker
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1">
                        {profile.role === "leader" ? "Administrator" : "Member Portal"}
                    </p>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                    }`}
                            >
                                <Icon className="h-4 w-4" />
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${profile.role === 'leader' ? 'bg-indigo-500' : 'bg-emerald-500'}`}>
                            {profile.full_name?.charAt(0) || 'U'}
                        </div>
                        <div className="text-sm">
                            <p className="font-medium truncate max-w-[120px]">{profile.full_name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{profile.role}</p>
                        </div>
                    </div>
                    <Button variant="outline" className="w-full justify-start gap-2" onClick={logout}>
                        <LogOut className="h-4 w-4" />
                        Sign Out
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <header className="md:hidden border-b p-4 flex items-center justify-between bg-card">
                    <h1 className="font-bold">ProfitTracker</h1>
                    <Button size="sm" variant="ghost" onClick={logout}>
                        <LogOut className="h-4 w-4" />
                    </Button>
                </header>
                <div className="p-6 md:p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
