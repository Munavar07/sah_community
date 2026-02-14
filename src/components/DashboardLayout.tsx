"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, LogOut, Upload, Users, LineChart, Image as ImageIcon, UserPlus, DollarSign, Loader2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, profile, logout, isLoading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !user) {
            router.push("/login");
        }
    }, [user, isLoading, router]);


    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;
    }

    // If we shouldn't be here (no user), the useEffect redirects, but return null/loader while waiting
    if (!user) return null;

    // Still loading profile after user is authenticated
    if (user && !profile) {
        // Give it a moment to load before showing error
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;
    }

    // Type guard: at this point both user and profile are guaranteed to exist
    if (!profile) return null;

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
