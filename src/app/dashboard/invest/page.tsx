"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Investment } from "@/types";

export default function InvestmentPage() {
    const { user } = useAuth();
    const [investment, setInvestment] = useState<Investment | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchInvestment = async () => {
            const { data, error } = await supabase
                .from('investments')
                .select('*')
                .eq('member_id', user.id)
                .order('created_at', { ascending: false }) // Get latest
                .limit(1)
                .single();

            if (!error && data) {
                setInvestment(data as Investment);
            }
            setLoading(false);
        };

        fetchInvestment();
    }, [user]);

    if (loading) {
        return <DashboardLayout><div>Loading investment data...</div></DashboardLayout>;
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Your Investment</h2>
                    <p className="text-muted-foreground">Overview of your capital managed by the network.</p>
                </div>

                {investment ? (
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card className="bg-gradient-to-br from-emerald-900/20 to-emerald-900/5 border-emerald-500/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="w-5 h-5 text-emerald-500" />
                                    Current Capital
                                </CardTitle>
                                <CardDescription>Total amount invested by Admin</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold text-emerald-500">
                                    ${investment.amount.toLocaleString()}
                                </div>
                                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                                    <span className="inline-flex items-center px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 font-medium capitalize">
                                        {investment.status}
                                    </span>
                                    <span>Started {new Date(investment.start_date).toLocaleDateString()}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-indigo-500" />
                                    Performance
                                </CardTitle>
                                <CardDescription>Returns generated so far</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold text-indigo-500">
                                    TBD
                                </div>
                                <p className="text-sm text-muted-foreground mt-4">
                                    Profit logging enabled. Returns will be calculated from daily logs.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <Card className="border-dashed p-8 text-center text-muted-foreground">
                        No active specific investment record found. Please contact admin.
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}
