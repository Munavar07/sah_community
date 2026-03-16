"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { DollarSign, Users, Activity, AlertCircle, Loader2, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface DashboardStats {
    totalInvestment: number;
    totalProfit: number;
    memberCount?: number;
    dailyStatus?: string;
    hasActiveInvestment?: boolean;
    pendingMembers?: string[];
    totalWithdrawn?: number;
    activeBalance?: number;
    chartData?: { date: string, profit: number }[];
}

const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    color,
    gradient,
}: {
    title: string;
    value: string;
    subtitle: string;
    icon: React.ElementType;
    color: string;
    gradient: string;
}) => (
    <div className={`card-hover relative rounded-2xl border border-border/60 bg-card overflow-hidden p-5 animate-fade-in-up`}>
        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 ${color}`} />
        <div className="flex items-start justify-between mb-4">
            <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
            </div>
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-lg ${gradient}`}>
                <Icon className="h-5 w-5 text-white" />
            </div>
        </div>
        <div className="text-3xl font-bold tracking-tight mb-1">{value}</div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
    </div>
);

const LeaderDashboard = ({ stats }: { stats: DashboardStats }) => (
    <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
                title="Total Network Value"
                value={`$${stats.totalInvestment.toLocaleString()}`}
                subtitle="Across all members"
                icon={DollarSign}
                color="bg-emerald-500"
                gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
            />
            <StatCard
                title="Active Members"
                value={String(stats.memberCount || 0)}
                subtitle="In your trading network"
                icon={Users}
                color="bg-indigo-500"
                gradient="bg-gradient-to-br from-indigo-500 to-violet-600"
            />
            <StatCard
                title="Today's Profit"
                value={`$${stats.totalProfit.toLocaleString()}`}
                subtitle="Resets at midnight"
                icon={TrendingUp}
                color="bg-teal-500"
                gradient="bg-gradient-to-br from-teal-500 to-emerald-600"
            />
            <StatCard
                title="System Status"
                value="Active"
                subtitle="All systems operational"
                icon={Activity}
                color="bg-emerald-500"
                gradient="bg-gradient-to-br from-emerald-600 to-green-600"
            />
        </div>

        {/* Pending Logs Alert */}
        {stats.pendingMembers && stats.pendingMembers.length > 0 && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 animate-fade-in-up">
                <div className="flex items-center gap-2 mb-3">
                    <div className="h-8 w-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                    </div>
                    <h3 className="font-semibold text-amber-600 dark:text-amber-400">Pending Daily Profits</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                    The following members have not uploaded their profit screenshots for today:
                </p>
                <div className="flex flex-wrap gap-2">
                    {stats.pendingMembers.map((name, i) => (
                        <span key={i} className="bg-amber-500/10 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full text-xs font-medium border border-amber-500/20">
                            {name}
                        </span>
                    ))}
                </div>
            </div>
        )}

        {/* Profit Chart */}
        <div className="rounded-2xl border border-border/60 bg-card p-5 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-5">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Activity className="h-4 w-4 text-white" />
                </div>
                <div>
                    <h3 className="font-bold text-base">Network Profit History</h3>
                    <p className="text-xs text-muted-foreground">Overall earnings over time</p>
                </div>
            </div>
            {stats.chartData && stats.chartData.length > 0 ? (
                <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={stats.chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} stroke="#6b7280" />
                            <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="#6b7280" tickFormatter={(v) => `$${v}`} />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'hsl(224,45%,7%)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
                                labelStyle={{ color: '#9ca3af', fontSize: '11px' }}
                                itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                                formatter={((value: unknown) => [`$${Number(value).toLocaleString()}`, 'Profit']) as any}
                            />
                            <Line
                                type="monotone"
                                dataKey="profit"
                                stroke="#10b981"
                                strokeWidth={2.5}
                                dot={{ r: 3.5, fill: '#10b981', strokeWidth: 0 }}
                                activeDot={{ r: 6, fill: '#10b981', stroke: 'rgba(16,185,129,0.3)', strokeWidth: 4 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="h-[200px] flex flex-col items-center justify-center text-center space-y-4">
                    <div className="bg-muted/50 p-4 rounded-full">
                        <Activity className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground text-sm">No profit data available yet.</p>
                </div>
            )}
        </div>
    </div>
);

const MemberDashboard = ({ stats }: { stats: DashboardStats }) => (
    <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <StatCard
                title="Personal Investment"
                value={`$${stats.totalInvestment.toLocaleString()}`}
                subtitle="Current active capital"
                icon={DollarSign}
                color="bg-indigo-500"
                gradient="bg-gradient-to-br from-indigo-500 to-violet-600"
            />
            <StatCard
                title="Lifetime Profit"
                value={`$${stats.totalProfit.toLocaleString()}`}
                subtitle="Total earnings to date"
                icon={TrendingUp}
                color="bg-emerald-500"
                gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
            />
            <StatCard
                title="Daily Status"
                value={stats.dailyStatus || 'Pending'}
                subtitle={stats.dailyStatus === 'Pending' ? 'Logging required for today' : 'All set for today'}
                icon={Activity}
                color={stats.dailyStatus === 'Pending' ? 'bg-amber-500' : 'bg-emerald-500'}
                gradient={stats.dailyStatus === 'Pending' ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-emerald-500 to-teal-600'}
            />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
            <StatCard
                title="Total Withdrawn"
                value={`$${(stats.totalWithdrawn || 0).toLocaleString()}`}
                subtitle="Successful withdrawals"
                icon={TrendingDown}
                color="bg-rose-500"
                gradient="bg-gradient-to-br from-rose-500 to-pink-600"
            />
            <StatCard
                title="Active Balance"
                value={`$${(stats.activeBalance || 0).toLocaleString()}`}
                subtitle="Available for withdrawal"
                icon={Wallet}
                color="bg-emerald-500"
                gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
            />
        </div>

        {/* Log Profit CTA */}
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 p-8 text-center animate-fade-in-up">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/25">
                <Activity className="h-7 w-7 text-white" />
            </div>
            <h3 className="font-bold text-xl mb-2">Daily Profit Logging</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">
                Track your daily consistency. Log your results every trading day to maintain your performance record.
            </p>
            <Link href="/dashboard/log">
                <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20 px-8 h-11 rounded-xl font-semibold transition-all">
                    Log Today&apos;s Profit
                </Button>
            </Link>
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
                    const today = new Date().toISOString().split('T')[0];
                    const { data: invData } = await supabase.from('investments').select('amount');
                    const { data: logData } = await supabase.from('daily_logs').select('profit_amount, member_id, log_date');
                    const { data: comData } = await supabase.from('commissions').select('amount, created_at');
                    const { data: profileData } = await supabase.from('profiles').select('id, full_name, role, created_at');

                    const totalInv = invData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
                    const todayLogs = logData?.filter(l => l.log_date?.startsWith(today)) || [];
                    const totalProfToday = todayLogs.reduce((sum, item) => sum + Number(item.profit_amount), 0);
                    const members = profileData?.filter(p => {
                        if (p.role !== 'member') return false;
                        const memberDate = p.created_at ? new Date(p.created_at).toISOString().split('T')[0] : '';
                        return memberDate !== today;
                    }) || [];
                    const loggedMemberIds = new Set(todayLogs.map(l => l.member_id));
                    const pendingMembers = members.filter(m => !loggedMemberIds.has(m.id)).map(m => m.full_name || "Unknown");

                    const logsByDate = logData?.reduce((acc: any, log: any) => {
                        const date = log.log_date;
                        acc[date] = (acc[date] || 0) + Number(log.profit_amount);
                        return acc;
                    }, {}) || {};
                    comData?.forEach((com: any) => {
                        const date = new Date(com.created_at).toISOString().split('T')[0];
                        logsByDate[date] = (logsByDate[date] || 0) + Number(com.amount);
                    });
                    const chartData = Object.keys(logsByDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime()).map(date => ({
                        date: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                        profit: logsByDate[date]
                    }));

                    setStats({ totalInvestment: totalInv, totalProfit: totalProfToday, memberCount: members.length, pendingMembers, chartData });
                } else {
                    const { data: invData } = await supabase.from('investments').select('amount').eq('member_id', user.id);
                    const { data: logData } = await supabase.from('daily_logs').select('profit_amount, log_date').eq('member_id', user.id);
                    const { data: comData } = await supabase.from('commissions').select('amount').eq('referrer_id', user.id);
                    const { data: withdrawData } = await supabase.from('withdrawals').select('amount').eq('member_id', user.id);

                    const totalInv = invData?.reduce((sum, i) => sum + Number(i.amount), 0) || 0;
                    const tradingProf = logData?.reduce((sum, i) => sum + Number(i.profit_amount), 0) || 0;
                    const commissionProf = comData?.reduce((sum, i) => sum + Number(i.amount), 0) || 0;
                    const totalWithdrawn = withdrawData?.reduce((sum, i) => sum + Number(i.amount), 0) || 0;
                    const totalProf = tradingProf + commissionProf;
                    const today = new Date().toISOString().split('T')[0];
                    const hasLoggedToday = logData?.some(l => l.log_date === today);

                    setStats({ totalInvestment: totalInv, totalProfit: totalProf, dailyStatus: hasLoggedToday ? 'Completed' : 'Pending', totalWithdrawn, activeBalance: totalProf - totalWithdrawn });
                }
            } catch (error) {
                console.error("Error fetching stats:", error);
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading && user && profile) fetchStats();
    }, [user, profile, authLoading]);

    if (authLoading || loading) return (
        <DashboardLayout>
            <div className="flex h-[400px] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                    </div>
                    <p className="text-sm text-muted-foreground animate-pulse">Loading dashboard...</p>
                </div>
            </div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                <div className="animate-fade-in-up">
                    <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wider mb-1">
                        {profile?.role === 'leader' ? '⚡ Admin Oversight' : '📊 Personal Overview'}
                    </p>
                    <h2 className="text-3xl font-bold tracking-tight">
                        {profile?.role === 'leader' ? "Today's Highlights" : "My Dashboard"}
                    </h2>
                    <p className="text-muted-foreground text-sm mt-1">
                        {profile?.role === 'leader' ? 'Real-time network performance metrics' : 'Your personal trading performance'}
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
