"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, Activity, AlertCircle, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface DashboardStats {
    totalInvestment: number;
    totalProfit: number;
    memberCount?: number;
    dailyStatus?: string;
    hasActiveInvestment?: boolean;
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
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${stats.totalProfit.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Aggregated today</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">System Status</CardTitle>
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-emerald-500">Active</div>
                    <p className="text-xs text-muted-foreground">All systems operational</p>
                </CardContent>
            </Card>
        </div>

        <Card className="h-[200px] flex flex-col items-center justify-center border-dashed">
            <div className="text-center space-y-4">
                <div className="bg-muted/50 p-4 rounded-full inline-block">
                    <Activity className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                    <h3 className="text-lg font-medium">Network Oversight</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto mt-1">
                        You are viewing aggregated data for your entire trading community.
                    </p>
                </div>
            </div>
        </Card>
    </div>
);

const MemberDashboard = ({ stats }: { stats: DashboardStats }) => (
    <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
    const { user, isLoading: authLoading } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({
        totalInvestment: 0,
        totalProfit: 0,
        memberCount: 0,
        dailyStatus: 'Pending'
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!user) return;

            try {
                if (user.role === 'leader') {
                    // Admin: Aggregated data
                    const { data: invData } = await supabase.from('investments').select('amount');
                    const { data: logData } = await supabase.from('daily_logs').select('profit_amount');
                    const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

                    const totalInv = invData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
                    const totalProf = logData?.reduce((sum, item) => sum + Number(item.profit_amount), 0) || 0;

                    setStats({
                        totalInvestment: totalInv,
                        totalProfit: totalProf,
                        memberCount: count || 0
                    });
                } else {
                    // Member: Personal data
                    const { data: invData } = await supabase.from('investments').select('amount').eq('member_id', user.id);
                    const { data: logData } = await supabase.from('daily_logs').select('profit_amount, log_date').eq('member_id', user.id);

                    const totalInv = invData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
                    const totalProf = logData?.reduce((sum, item) => sum + Number(item.profit_amount), 0) || 0;

                    // Check if logged today
                    const today = new Date().toISOString().split('T')[0];
                    const hasLoggedToday = logData?.some(l => l.log_date === today);

                    setStats({
                        totalInvestment: totalInv,
                        totalProfit: totalProf,
                        dailyStatus: hasLoggedToday ? 'Completed' : 'Pending'
                    });
                }
            } catch (error) {
                console.error("Error fetching stats:", error);
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading && user) {
            fetchStats();
        }
    }, [user, authLoading]);

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
                        {user?.role === 'leader' ? 'Administrator Oversight' : 'Personal Performance Overview'}
                    </p>
                </div>

                {user?.role === 'leader' ? (
                    <LeaderDashboard stats={stats} />
                ) : (
                    <MemberDashboard stats={stats} />
                )}
            </div>
        </DashboardLayout>
    );
}

import { Loader2 } from "lucide-react";
