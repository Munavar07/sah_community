"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, LogOut, Upload, Users, LineChart, Image as ImageIcon, UserPlus, DollarSign, Loader2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ModeToggle } from "@/components/ModeToggle";

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
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <Loader2 className="animate-spin w-6 h-6 text-emerald-500" />
                    </div>
                    <p className="text-sm text-muted-foreground animate-pulse">Loading portal...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;
    if (user && !profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="animate-spin w-8 h-8 text-primary" />
            </div>
        );
    }
    if (!profile) return null;

    const leaderLinks = [
        { href: "/dashboard", label: "Master View", icon: LayoutDashboard },
        { href: "/dashboard/members/add", label: "Add Member", icon: UserPlus },
        { href: "/dashboard/commissions/add", label: "Add Commission", icon: DollarSign },
        { href: "/dashboard/network", label: "Network Tree", icon: Users },
        { href: "/dashboard/gallery", label: "Profit Gallery", icon: ImageIcon },
    ];

    const memberLinks = [
        { href: "/dashboard", label: "My Dashboard", icon: LayoutDashboard },
        { href: "/dashboard/log", label: "Log Profit", icon: LineChart },
        { href: "/dashboard/withdraw", label: "Withdraw Funds", icon: DollarSign },
        { href: "/dashboard/invest", label: "My Investment", icon: Users },
    ];

    const links = profile.role === "leader" ? leaderLinks : memberLinks;
    const isLeader = profile.role === "leader";

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Sidebar */}
            <aside className="w-64 border-r border-border/60 hidden md:flex flex-col flex-shrink-0 bg-card/80 backdrop-blur-xl relative overflow-hidden">
                {/* Subtle background glow */}
                <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-indigo-500/5 to-transparent pointer-events-none" />

                {/* Brand */}
                <div className="p-6 relative z-10">
                    <div className="flex items-center gap-3 mb-1">
                        <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg ${isLeader ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-indigo-500 to-violet-600'}`}>
                            {isLeader ? 'PT' : profile.full_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                            <h1 className="text-base font-bold gradient-text leading-tight">
                                ProfitTracker
                            </h1>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                {isLeader ? "Admin Portal" : "Member Portal"}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="px-3 mb-2">
                    <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 space-y-1 overflow-y-auto py-2 relative z-10">
                    {links.map((link, i) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                style={{ animationDelay: `${i * 60}ms` }}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group animate-fade-in-up ${isActive
                                        ? "bg-emerald-500/15 text-emerald-500 font-semibold shadow-sm border border-emerald-500/20"
                                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                    }`}
                            >
                                <div className={`h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${isActive
                                        ? "bg-emerald-500/20 text-emerald-500"
                                        : "bg-accent/60 text-muted-foreground group-hover:bg-accent group-hover:text-foreground"
                                    }`}>
                                    <Icon className="h-3.5 w-3.5" />
                                </div>
                                <span className="text-sm">{link.label}</span>
                                {isActive && (
                                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="px-3 mb-3">
                    <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                </div>

                {/* Profile Section */}
                <div className="p-3 space-y-2 relative z-10">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-accent/40">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-inner ${isLeader
                                    ? 'bg-gradient-to-br from-indigo-500 to-violet-600 ring-2 ring-indigo-500/30'
                                    : 'bg-gradient-to-br from-emerald-500 to-teal-600 ring-2 ring-emerald-500/30'
                                }`}>
                                {profile.full_name?.charAt(0) || 'U'}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold truncate max-w-[110px]">{profile.full_name}</p>
                                <p className="text-[10px] text-muted-foreground capitalize font-medium">{profile.role}</p>
                            </div>
                        </div>
                        <ModeToggle />
                    </div>
                    <Button
                        variant="outline"
                        className="w-full justify-start gap-2 h-9 text-sm border-border/60 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
                        onClick={logout}
                    >
                        <LogOut className="h-3.5 w-3.5" />
                        Sign Out
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto pb-16 md:pb-0">
                {/* Mobile Header */}
                <header className="md:hidden border-b border-border/60 p-4 flex items-center justify-between bg-card/80 backdrop-blur-xl sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xs">
                            PT
                        </div>
                        <h1 className="font-bold gradient-text text-sm">ProfitTracker</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <ModeToggle />
                        <Button size="sm" variant="ghost" onClick={logout} className="h-8 w-8 p-0">
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                </header>

                {/* Page Content */}
                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-xl border-t border-border/60 z-50">
                <div className="flex justify-around items-center h-16 px-2">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${isActive ? "text-emerald-500" : "text-muted-foreground"
                                    }`}
                            >
                                <div className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all ${isActive ? "bg-emerald-500/15" : ""
                                    }`}>
                                    <Icon className="h-4 w-4" />
                                </div>
                                <span className="text-[9px] font-medium">{link.label.split(' ')[0]}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
