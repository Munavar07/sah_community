"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ArrowLeft,
    Calendar,
    DollarSign,
    TrendingUp,
    User,
    Users,
    MapPin,
    Image as ImageIcon,
    FileText,
    ChevronRight,
    Loader2
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Profile } from "@/types";

interface MemberDetail {
    profile: Profile & { referrer?: { full_name: string } };
    investments: any[];
    logs: any[];
    commissions: any[];
    totalProfit: number;
    totalCommissions: number;
}

export default function MemberDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [data, setData] = useState<MemberDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMemberData = async () => {
            if (!id) return;

            try {
                // 1. Fetch Profile and Referrer
                const { data: profile, error: pError } = await supabase
                    .from('profiles')
                    .select('*, referrer:referrer_id(full_name)')
                    .eq('id', id)
                    .single();

                if (pError) throw pError;

                // 2. Fetch Investments
                const { data: investments, error: iError } = await supabase
                    .from('investments')
                    .select('*')
                    .eq('member_id', id)
                    .order('created_at', { ascending: false });

                if (iError) throw iError;

                // 3. Fetch Daily Logs
                const { data: logs, error: lError } = await supabase
                    .from('daily_logs')
                    .select('*')
                    .eq('member_id', id)
                    .order('log_date', { ascending: false });

                if (lError) throw lError;

                // 4. Fetch Commissions (Referral Earnings)
                const { data: commissions, error: cError } = await supabase
                    .from('commissions')
                    .select('*, member:member_id(full_name)')
                    .eq('referrer_id', id)
                    .order('created_at', { ascending: false });

                if (cError) throw cError;

                const tradingProfit = logs?.reduce((sum, log) => sum + Number(log.profit_amount), 0) || 0;
                const totalCommissions = commissions?.reduce((sum, com) => sum + Number(com.amount), 0) || 0;

                setData({
                    profile: profile as any,
                    investments: investments || [],
                    logs: logs || [],
                    commissions: commissions || [],
                    totalProfit: tradingProfit + totalCommissions,
                    totalCommissions
                });
            } catch (err) {
                console.error("Error fetching member details:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchMemberData();
    }, [id]);

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex h-[400px] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </DashboardLayout>
        );
    }

    if (!data) {
        return (
            <DashboardLayout>
                <div className="text-center py-20">
                    <h2 className="text-2xl font-bold">Member not found</h2>
                    <Button variant="link" onClick={() => router.back()}>Go Back</Button>
                </div>
            </DashboardLayout>
        );
    }

    const { profile, investments, logs, totalProfit } = data;
    const totalInvested = investments.reduce((sum, inv) => sum + Number(inv.amount), 0);

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">{profile.full_name}</h2>
                        <div className="flex items-center gap-2 text-muted-foreground mt-1">
                            <span className="capitalize">{profile.role}</span>
                            <span>•</span>
                            <span className="capitalize">{profile.category || 'Standard'} Member</span>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-4">
                    {/* Key Stats */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-indigo-500">${totalInvested.toLocaleString()}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Referral Earnings</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-500">${data.totalCommissions.toLocaleString()}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Lifetime Profit</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-500">${totalProfit.toLocaleString()}</div>
                            <p className="text-[10px] text-muted-foreground mt-1">Trading + Referrals</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${investments.some(i => i.status === 'active') ? 'border-transparent bg-emerald-500 text-white' : 'border-transparent bg-amber-500 text-white'}`}>
                                {investments.some(i => i.status === 'active') ? 'Active Investor' : 'Inactive'}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Profile & Investment Details */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" /> Account Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 text-sm">
                                    <span className="text-muted-foreground">Email:</span>
                                    <span className="font-medium text-right">{profile.email}</span>
                                </div>
                                <div className="grid grid-cols-2 text-sm">
                                    <span className="text-muted-foreground">Referrer:</span>
                                    <span className="font-medium text-right">{profile.referrer?.full_name || 'None'}</span>
                                </div>
                                <div className="grid grid-cols-2 text-sm">
                                    <span className="text-muted-foreground">Joined:</span>
                                    <span className="font-medium text-right">{new Date(profile.created_at!).toLocaleDateString()}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" /> Investment History
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {investments.length > 0 ? investments.map((inv) => (
                                    <div key={inv.id} className="p-4 rounded-lg border bg-muted/30 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-lg text-indigo-500">${Number(inv.amount).toLocaleString()}</span>
                                            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors text-foreground capitalize">
                                                {inv.status}
                                            </div>
                                        </div>
                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            Started: {new Date(inv.start_date).toLocaleDateString()}
                                        </div>
                                        {inv.proof_url && (
                                            <div className="pt-2">
                                                <p className="text-xs font-semibold mb-2">Investment Proof:</p>
                                                <a href={inv.proof_url} target="_blank" rel="noreferrer" className="block relative aspect-video rounded-md overflow-hidden border hover:opacity-90 transition-opacity">
                                                    <img src={inv.proof_url} alt="Proof" className="object-cover w-full h-full" />
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
                                                        <ImageIcon className="text-white h-8 w-8" />
                                                    </div>
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                )) : (
                                    <div className="text-center py-6 text-muted-foreground">No investment records found.</div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Profit Logs */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" /> Recent Profit Logs
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {logs.length > 0 ? logs.map((log) => (
                                    <div key={log.id} className="flex items-center justify-between p-3 rounded-md border text-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-emerald-500/10 p-2 rounded text-emerald-500">
                                                <DollarSign className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-emerald-500">+${Number(log.profit_amount).toLocaleString()}</p>
                                                <p className="text-xs text-muted-foreground">{new Date(log.log_date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        {log.screenshot_url && (
                                            <a href={log.screenshot_url} target="_blank" rel="noreferrer" className="text-xs text-indigo-500 hover:underline flex items-center gap-1">
                                                <ImageIcon className="h-3 w-3" /> View Result
                                            </a>
                                        )}
                                    </div>
                                )) : (
                                    <div className="text-center py-10 text-muted-foreground">No profit logs found.</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Referral History */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" /> Referral Earnings Detail
                        </CardTitle>
                        <CardDescription>Commissions earned from direct referrals (5% of investment).</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data.commissions.length > 0 ? data.commissions.map((com) => (
                                <div key={com.id} className="flex items-center justify-between p-3 rounded-md border text-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-amber-500/10 p-2 rounded text-amber-500">
                                            <TrendingUp className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Referral Bonus from <span className="text-indigo-500">{com.member?.full_name || 'Member'}</span></p>
                                            <p className="text-xs text-muted-foreground">{new Date(com.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-amber-600">+${Number(com.amount).toLocaleString()}</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-10 text-muted-foreground">No referral commissions earned yet.</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
