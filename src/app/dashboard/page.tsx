"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, Activity, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";

interface DashboardStats {
    totalInvestment: number;
    totalProfit: number; // Admin: Total. Member: Lifetime.
    todayProfit: number; // Strictly today for both.
    memberCount?: number;
    dailyStatus?: string;
    hasActiveInvestment?: boolean;
    pendingMembers?: { id: string; full_name: string }[];
}

const LeaderDashboard = ({ stats }: { stats: DashboardStats }) => (
    <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Network Value</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${stats.totalInvestment.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Across all members</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Members</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.memberCount || 0}</div>
                    <p className="text-xs text-muted-foreground">In your trading network</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Today&apos;s Profit</CardTitle>
                    <Activity className="h-4 w-4 text-indigo-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-indigo-600">${stats.todayProfit.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Aggregated today ({new Date().toLocaleDateString()})</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Lifetime Profit</CardTitle>
                    <Activity className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-emerald-600">${stats.totalProfit.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Total network earnings</p>
                </CardContent>
            </Card>
        </div>

        {stats.pendingMembers && stats.pendingMembers.length > 0 && (
            <Card className="border-amber-500/50 bg-amber-500/5">
                <CardHeader className="pb-3 text-amber-600">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        <CardTitle className="text-lg">Pending Logs Alert</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-amber-700 mb-4 font-medium">
                        {stats.pendingMembers.length} members have NOT yet uploaded their daily profit logs today:
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {stats.pendingMembers.map((m) => (
                            <Link key={m.id} href={`/dashboard/members/${m.id}`}>
                                <Badge variant="outline" className="bg-white hover:bg-amber-100 cursor-pointer border-amber-200 text-amber-700 px-3 py-1">
                                    {m.full_name}
                                </Badge>
                            </Link>
                        ))}
                    </div>
                </CardContent>
            </Card>
        )}

        <Card className="h-[150px] flex flex-col items-center justify-center border-dashed">
            <div className="text-center space-y-2">
                <div className="bg-muted/50 p-3 rounded-full inline-block">
                    <Activity className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                    <h3 className="text-base font-medium">Network Oversight</h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                        Viewing real-time aggregated performance across {stats.memberCount} members.
                    </p>
                </div>
            </div>
        </Card>
    </div>
);

const MemberDashboard = ({ stats }: { stats: DashboardStats }) => (
    <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Personal Investment</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${stats.totalInvestment.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Current active capital</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Today&apos;s Profit</CardTitle>
                    <Activity className="h-4 w-4 text-indigo-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-indigo-600">${stats.todayProfit.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Earned today ({new Date().toLocaleDateString()})</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Lifetime Profit</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${stats.totalProfit.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Total earnings to date</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Daily Status</CardTitle>
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${stats.dailyStatus === 'Pending' ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {stats.dailyStatus}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {stats.dailyStatus === 'Pending' ? 'Logging required for today' : 'All set for today'}
                    </p>
                </CardContent>
            </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-1">
            <Card className="border-dashed flex flex-col items-center justify-center p-12 text-center space-y-4">
                <div className="bg-emerald-500/10 p-4 rounded-full">
                    <Activity className="h-8 w-8 text-emerald-500" />
                </div>
                <div>
                    <h3 className="font-bold text-xl">Daily Profit Logging</h3>
                    <p className="text-muted-foreground mb-6 max-w-md">
                        Tracking your daily consistency is key to long-term success. Make sure to log your results every trading day.
                    </p>
                    <Link href="/dashboard/log">
                        <Button className="bg-emerald-600 hover:bg-emerald-700 px-8 h-11 text-base">
                            Log Today&apos;s Profit
                        </Button>
                    </Link>
                </div>
            </Card>
        </div>
    </div>
);

export default function DashboardPage() {
    const { user, profile, isLoading: authLoading } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({
        totalInvestment: 0,
        totalProfit: 0,
        memberCount: 0,
        dailyStatus: 'Pending'
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!user || !profile) return;

            try {
                if (profile.role === 'leader') {
                    // Start and end of today in local calendar
                    const todayDate = new Date().toLocaleDateString('en-CA');
                    const start = `${todayDate}T00:00:00.000Z`;
                    const end = `${todayDate}T23:59:59.999Z`;

                    // Fetch data
                    const { data: invData } = await supabase.from('investments').select('amount');
                    const { data: logDataAll } = await supabase.from('daily_logs').select('profit_amount, log_date, member_id');
                    const { data: profilesAll } = await supabase.from('profiles').select('id, full_name').eq('role', 'member');
                    const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

                    const totalInv = invData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
                    const totalProfLifetime = logDataAll?.reduce((sum, item) => sum + Number(item.profit_amount), 0) || 0;

                    // Filter logs for TODAY only
                    const logsToday = logDataAll?.filter(l => l.log_date >= start && l.log_date <= end) || [];
                    const todayProf = logsToday.reduce((sum, item) => sum + Number(item.profit_amount), 0) || 0;

                    // Calculate pending members (those in profilesAll but NOT in logsToday)
                    const loggedMemberIds = new Set(logsToday.map(l => l.member_id));
                    const pending = profilesAll?.filter(p => !loggedMemberIds.has(p.id)) || [];

                    setStats({
                        totalInvestment: totalInv,
                        totalProfit: totalProfLifetime,
                        todayProfit: todayProf,
                        memberCount: count || 0,
                        pendingMembers: pending
                    });
                } else {
                    // Member: Personal data
                    const todayDate = new Date().toLocaleDateString('en-CA');
                    const start = `${todayDate}T00:00:00.000Z`;
                    const end = `${todayDate}T23:59:59.999Z`;

                    const { data: invData } = await supabase.from('investments').select('amount').eq('member_id', user.id);
                    const { data: logDataPersonal } = await supabase.from('daily_logs').select('profit_amount, log_date').eq('member_id', user.id);

                    const totalInv = invData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
                    const totalProfLifetime = logDataPersonal?.reduce((sum, item) => sum + Number(item.profit_amount), 0) || 0;

                    const logsToday = logDataPersonal?.filter(l => l.log_date >= start && l.log_date <= end) || [];
                    const todayProf = logsToday.reduce((sum, item) => sum + Number(item.profit_amount), 0) || 0;
                    const hasLoggedToday = logsToday.length > 0;

                    setStats({
                        totalInvestment: totalInv,
                        totalProfit: totalProfLifetime,
                        todayProfit: todayProf,
                        dailyStatus: hasLoggedToday ? 'Completed' : 'Pending'
                    });
                }
            } catch (error) {
                console.error("Error fetching stats:", error);
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading && user && profile) {
            fetchStats();
        }
    }, [user, profile, authLoading]);

    if (authLoading || loading) return (
        <DashboardLayout>
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Today&apos;s Highlights</h2>
                    <p className="text-muted-foreground">
                        {profile?.role === 'leader' ? 'Administrator Oversight' : 'Personal Performance Overview'}
                    </p>
                </div>

                {profile?.role === 'leader' ? (
                    <LeaderDashboard stats={stats} />
                ) : (
                    <MemberDashboard stats={stats} />
                )}
            </div>
        </DashboardLayout>
    );
}

import { Loader2 } from "lucide-react";
