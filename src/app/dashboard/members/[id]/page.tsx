"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    Loader2,
    Edit,
    Download
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Profile } from "@/types";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { editProfitLogAction, editCommissionAction } from "@/app/actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MemberDetail {
    profile: Profile & { referrer?: { full_name: string } };
    investments: any[];
    logs: any[];
    commissions: any[];
    withdrawals: any[];
    totalProfit: number;
    totalCommissions: number;
    totalWithdrawn: number;
    activeBalance: number;
}

export default function MemberDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [data, setData] = useState<MemberDetail | null>(null);
    const [loading, setLoading] = useState(true);

    // Edit Log State
    const [editingLog, setEditingLog] = useState<any | null>(null);
    const [editAmount, setEditAmount] = useState<string>("");
    const [savingEdit, setSavingEdit] = useState(false);

    // Edit Commission State
    const [editingCommission, setEditingCommission] = useState<any | null>(null);
    const [editCommissionAmount, setEditCommissionAmount] = useState<string>("");
    const [savingCommissionEdit, setSavingCommissionEdit] = useState(false);

    // Export Modal State
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportStartDate, setExportStartDate] = useState("");
    const [exportEndDate, setExportEndDate] = useState("");

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

                // 5. Fetch Withdrawals
                const { data: withdrawals, error: wError } = await supabase
                    .from('withdrawals')
                    .select('*')
                    .eq('member_id', id)
                    .order('created_at', { ascending: false });

                if (wError) throw wError;

                const tradingProfit = logs?.reduce((sum, log) => sum + Number(log.profit_amount), 0) || 0;
                const totalCommissions = commissions?.reduce((sum, com) => sum + Number(com.amount), 0) || 0;
                const totalWithdrawn = withdrawals?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;

                const totalProfit = tradingProfit + totalCommissions;
                const activeBalance = totalProfit - totalWithdrawn;

                setData({
                    profile: profile as any,
                    investments: investments || [],
                    logs: logs || [],
                    commissions: commissions || [],
                    withdrawals: withdrawals || [],
                    totalProfit,
                    totalCommissions,
                    totalWithdrawn,
                    activeBalance
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

    const handleEditSave = async () => {
        if (!editingLog || !editAmount) return;
        setSavingEdit(true);
        try {
            const formData = new FormData();
            formData.append("logId", editingLog.id);
            formData.append("newAmount", editAmount);

            const result = await editProfitLogAction(null, formData);
            if (result.success) {
                // Update local state to immediately show changes
                setData(prev => {
                    if (!prev) return prev;
                    const updatedLogs = prev.logs.map(l =>
                        l.id === editingLog.id ? { ...l, profit_amount: parseFloat(editAmount) } : l
                    );

                    const newTradingProfit = updatedLogs.reduce((sum, log) => sum + Number(log.profit_amount), 0);
                    const newTotalProfit = newTradingProfit + prev.totalCommissions;
                    const newActiveBalance = newTotalProfit - prev.totalWithdrawn;

                    return {
                        ...prev,
                        logs: updatedLogs,
                        totalProfit: newTotalProfit,
                        activeBalance: newActiveBalance
                    };
                });
                setEditingLog(null);
            } else {
                alert(result.message);
            }
        } catch (err) {
            console.error(err);
            alert("Failed to update log.");
        } finally {
            setSavingEdit(false);
        }
    };

    const handleEditCommissionSave = async () => {
        if (!editingCommission || !editCommissionAmount) return;
        setSavingCommissionEdit(true);
        try {
            const formData = new FormData();
            formData.append("commissionId", editingCommission.id);
            formData.append("newAmount", editCommissionAmount);

            const result = await editCommissionAction(null, formData);
            if (result.success) {
                // Update local state to immediately show changes
                setData(prev => {
                    if (!prev) return prev;
                    const updatedCommissions = prev.commissions.map(c =>
                        c.id === editingCommission.id ? { ...c, amount: parseFloat(editCommissionAmount) } : c
                    );

                    const newTotalCommissions = updatedCommissions.reduce((sum, com) => sum + Number(com.amount), 0);
                    const tradingProfit = prev.totalProfit - prev.totalCommissions;
                    const newTotalProfit = tradingProfit + newTotalCommissions;
                    const newActiveBalance = newTotalProfit - prev.totalWithdrawn;

                    return {
                        ...prev,
                        commissions: updatedCommissions,
                        totalCommissions: newTotalCommissions,
                        totalProfit: newTotalProfit,
                        activeBalance: newActiveBalance
                    };
                });
                setEditingCommission(null);
            } else {
                alert(result.message);
            }
        } catch (err) {
            console.error(err);
            alert("Failed to update commission.");
        } finally {
            setSavingCommissionEdit(false);
        }
    };

    const handleExportCSV = () => {
        if (!data) return;

        const start = exportStartDate ? new Date(exportStartDate).getTime() : 0;
        const end = exportEndDate ? new Date(exportEndDate).getTime() + 86400000 : Infinity;

        const filteredLogs = data.logs.filter(l => {
            const t = new Date(l.log_date).getTime();
            return t >= start && t <= end;
        });
        const filteredCommissions = data.commissions.filter(c => {
            const t = new Date(c.created_at).getTime();
            return t >= start && t <= end;
        });

        const periodProfit = filteredLogs.reduce((sum, log) => sum + Number(log.profit_amount), 0) +
            filteredCommissions.reduce((sum, com) => sum + Number(com.amount), 0);

        const uniqueDays = new Set([
            ...filteredLogs.map(l => l.log_date),
            ...filteredCommissions.map(c => new Date(c.created_at).toISOString().split('T')[0])
        ]).size;

        const avgDailyProfit = uniqueDays > 0 ? (periodProfit / uniqueDays).toFixed(2) : "0.00";

        const totalInvested = data.investments.reduce((sum, i) => sum + Number(i.amount), 0);
        const totalWithdrawn = data.withdrawals.reduce((sum, w) => sum + Number(w.amount), 0);

        let csvContent = `Member Report: ${profile.full_name}\n`;
        csvContent += `Report Created,${new Date().toLocaleDateString()}\n\n`;

        csvContent += `--- OVERALL ACCOUNT SUMMARY ---\n`;
        csvContent += `Total Invested (All Time),$${totalInvested}\n`;
        csvContent += `Total Withdrawn (All Time),$${totalWithdrawn}\n`;
        csvContent += `Current Active Balance,$${data.activeBalance}\n\n`;

        csvContent += `--- SELECTED PERIOD SUMMARY ---\n`;
        csvContent += `Period,${exportStartDate || 'Beginning'} to ${exportEndDate || 'Today'}\n`;
        csvContent += `Total Profit in Period,$${periodProfit}\n`;
        csvContent += `Average Daily Profit,$${avgDailyProfit}\n\n`;

        csvContent += `--- TRANSACTION HISTORY (IN PERIOD) ---\n`;
        csvContent += `Date,Type,Amount\n`;

        const allTransactions: any[] = [];

        data.investments.forEach(i => allTransactions.push({ date: new Date(i.created_at).toISOString().split('T')[0], type: 'Investment', amount: i.amount }));
        data.logs.forEach(l => allTransactions.push({ date: new Date(l.log_date).toISOString().split('T')[0], type: 'Trading Profit', amount: l.profit_amount }));
        data.commissions.forEach(c => allTransactions.push({ date: new Date(c.created_at).toISOString().split('T')[0], type: 'Referral Commission', amount: c.amount }));
        data.withdrawals.forEach(w => allTransactions.push({ date: new Date(w.created_at).toISOString().split('T')[0], type: 'Withdrawal', amount: w.amount }));

        const finalTransactions = allTransactions.filter(t => {
            const time = new Date(t.date).getTime();
            return time >= start && time <= end;
        }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        finalTransactions.forEach(t => {
            csvContent += `"${t.date}","${t.type}","$${t.amount}"\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${(profile.full_name || 'Member').replace(/\\s+/g, '_')}_detailed_report.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setIsExportModalOpen(false);
    };

    // Prepare chart data (Logs + Commissions)
    const logsByDate = logs?.reduce((acc: any, log: any) => {
        const date = log.log_date;
        acc[date] = (acc[date] || 0) + Number(log.profit_amount);
        return acc;
    }, {}) || {};

    data?.commissions?.forEach((com: any) => {
        const date = new Date(com.created_at).toISOString().split('T')[0];
        logsByDate[date] = (logsByDate[date] || 0) + Number(com.amount);
    });

    const chartData = Object.keys(logsByDate || {})
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
        .map(date => ({
            date: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            profit: logsByDate[date]
        }));

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center gap-4 w-full">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex-1">
                        <h2 className="text-3xl font-bold tracking-tight">{profile.full_name}</h2>
                        <div className="flex items-center gap-2 text-muted-foreground mt-1">
                            <span className="capitalize">{profile.role}</span>
                            <span>•</span>
                            <span className="capitalize">{profile.category || 'Standard'} Member</span>
                        </div>
                    </div>
                    <Button onClick={() => setIsExportModalOpen(true)} className="hidden sm:flex">
                        <Download className="h-4 w-4 mr-2" />
                        Export Report
                    </Button>
                </div>
                {/* Mobile export button */}
                <Button onClick={() => setIsExportModalOpen(true)} className="w-full sm:hidden">
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                </Button>

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
                            <Badge className={investments.some(i => i.status === 'active') ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}>
                                {investments.some(i => i.status === 'active') ? 'Active Investor' : 'Inactive'}
                            </Badge>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total Withdrawn</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-600">${data.totalWithdrawn.toLocaleString()}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Active Balance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-600">${data.activeBalance.toLocaleString()}</div>
                            <p className="text-[10px] text-muted-foreground mt-1">Available for withdrawal</p>
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
                                            <Badge variant="outline" className="capitalize">{inv.status}</Badge>
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

                    <div className="space-y-6">
                        {/* Profit Graph */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5" /> Profit History Graph
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {chartData.length > 0 ? (
                                    <div className="h-[250px] w-full mt-4">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                                                <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} stroke="#888888" />
                                                <YAxis fontSize={12} tickLine={false} axisLine={false} stroke="#888888" tickFormatter={(value) => `$${value}`} />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-background)' }}
                                                    itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="profit"
                                                    stroke="#10b981"
                                                    strokeWidth={3}
                                                    dot={{ r: 4, fill: '#10b981', strokeWidth: 2 }}
                                                    activeDot={{ r: 6 }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="text-center py-10 text-muted-foreground">Not enough data to graph yet.</div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Profit Logs */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5" /> Recent Profit Logs
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
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
                                            <div className="flex items-center gap-3">
                                                {log.screenshot_url && (
                                                    <a href={log.screenshot_url} target="_blank" rel="noreferrer" className="text-xs text-indigo-500 hover:underline flex items-center gap-1">
                                                        <ImageIcon className="h-3 w-3" /> View Result
                                                    </a>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 text-xs text-muted-foreground hover:text-foreground"
                                                    onClick={() => {
                                                        setEditingLog(log);
                                                        setEditAmount(log.profit_amount.toString());
                                                    }}
                                                >
                                                    <Edit className="h-3 w-3 mr-1" /> Edit
                                                </Button>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-10 text-muted-foreground">No profit logs found.</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Export Report Modal */}
                <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Export Member Report</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <p className="text-sm text-muted-foreground">Select a date range to filter the report. Leave blank to include all history.</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="start-date">Start Date</Label>
                                    <Input
                                        id="start-date"
                                        type="date"
                                        value={exportStartDate}
                                        onChange={(e) => setExportStartDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="end-date">End Date</Label>
                                    <Input
                                        id="end-date"
                                        type="date"
                                        value={exportEndDate}
                                        onChange={(e) => setExportEndDate(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsExportModalOpen(false)}>Cancel</Button>
                            <Button onClick={handleExportCSV}>Download Report</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Modal */}
                <Dialog open={!!editingLog} onOpenChange={(open: boolean) => !open && setEditingLog(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Profit Log</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-amount">Corrected Profit Amount ($)</Label>
                                <Input
                                    id="edit-amount"
                                    type="number"
                                    step="0.01"
                                    value={editAmount}
                                    onChange={(e) => setEditAmount(e.target.value)}
                                    placeholder="Enter correct amount"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setEditingLog(null)} disabled={savingEdit}>Cancel</Button>
                            <Button onClick={handleEditSave} disabled={savingEdit || !editAmount}>
                                {savingEdit ? "Saving..." : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Withdrawal Logs */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5" /> Detailed Withdrawal History
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data.withdrawals.length > 0 ? data.withdrawals.map((log) => (
                                <div key={log.id} className="flex items-center justify-between p-3 rounded-md border text-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-amber-500/10 p-2 rounded text-amber-500">
                                            <DollarSign className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-amber-600">-${Number(log.amount).toLocaleString()}</p>
                                            <p className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    {log.proof_url && (
                                        <a href={log.proof_url} target="_blank" rel="noreferrer" className="text-xs text-indigo-500 hover:underline flex items-center gap-1">
                                            <ImageIcon className="h-3 w-3" /> View Proof
                                        </a>
                                    )}
                                </div>
                            )) : (
                                <div className="text-center py-10 text-muted-foreground">No withdrawal records found.</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Referral History */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" /> Referral Earnings Detail
                        </CardTitle>
                        <CardDescription>Commissions earned from direct referrals (5% of investment).</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                            {data.commissions.length > 0 ? data.commissions.map((com) => (
                                <div key={com.id} className="flex items-center justify-between p-3 rounded-md border text-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-amber-500/10 p-2 rounded text-amber-500">
                                            <TrendingUp className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="font-medium">
                                                {com.type === 'manual' ? 'Manual Commission' : `Referral Bonus from ${com.member?.full_name || 'Member'}`}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{new Date(com.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <p className="font-bold text-amber-600">+${Number(com.amount).toLocaleString()}</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 text-xs text-muted-foreground hover:text-foreground"
                                            onClick={() => {
                                                setEditingCommission(com);
                                                setEditCommissionAmount(com.amount.toString());
                                            }}
                                        >
                                            <Edit className="h-3 w-3 mr-1" /> Edit
                                        </Button>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-10 text-muted-foreground">No referral commissions earned yet.</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Edit Commission Modal */}
                <Dialog open={!!editingCommission} onOpenChange={(open: boolean) => !open && setEditingCommission(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Commission</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-commission-amount">Corrected Amount ($)</Label>
                                <Input
                                    id="edit-commission-amount"
                                    type="number"
                                    step="0.01"
                                    value={editCommissionAmount}
                                    onChange={(e) => setEditCommissionAmount(e.target.value)}
                                    placeholder="Enter correct amount"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setEditingCommission(null)} disabled={savingCommissionEdit}>Cancel</Button>
                            <Button onClick={handleEditCommissionSave} disabled={savingCommissionEdit || !editCommissionAmount}>
                                {savingCommissionEdit ? "Saving..." : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}
