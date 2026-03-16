"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ChevronRight, Download, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Profile } from "@/types";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


interface TreeNode extends Partial<Profile> {
    id: string;
    name?: string;
    children?: TreeNode[];
    totalProfit?: number;
}

// Recursive Member Component
const MemberNode = ({ member }: { member: TreeNode }) => {
    const hasChildren = member.children && member.children.length > 0;
    const isLeader = member.role === 'leader';

    return (
        <li>
            <div className={`relative mx-auto flex flex-col items-center p-4 rounded-2xl bg-card border border-border/60 min-w-[170px] max-w-[210px] shadow-md hover:shadow-xl transition-all duration-200 z-10 hover:-translate-y-1.5 hover:border-emerald-500/30 overflow-hidden`}>
                {/* Top accent bar */}
                <div className={`absolute top-0 left-0 right-0 h-0.5 ${isLeader ? 'bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500' : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500'}`} />

                {/* Avatar */}
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-lg font-bold mb-3 text-white shadow-lg ${isLeader
                        ? 'bg-gradient-to-br from-indigo-500 to-violet-600 ring-2 ring-indigo-500/25'
                        : 'bg-gradient-to-br from-emerald-500 to-teal-600 ring-2 ring-emerald-500/25'
                    }`}>
                    {member.name?.charAt(0) || 'U'}
                </div>

                <h4 className="font-semibold text-sm text-center line-clamp-1 mb-2" title={member.name}>{member.name}</h4>

                <div className="flex flex-col items-center gap-1.5 w-full">
                    <span className={`capitalize text-[10px] px-2.5 py-0.5 rounded-full font-medium border ${isLeader
                            ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
                            : 'text-muted-foreground bg-accent border-border/60'
                        }`}>
                        {isLeader ? 'Director' : (member.category || 'Standard')}
                    </span>
                    <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold mt-1">
                        +${member.totalProfit?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                    </span>
                </div>

                <Link
                    href={`/dashboard/members/${member.id}`}
                    className="absolute top-3 right-3 p-1 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                    title="View Profile"
                >
                    <ChevronRight className="w-3.5 h-3.5" />
                </Link>
            </div>

            {hasChildren && (
                <ul>
                    {member.children!.map((child: TreeNode) => (
                        <MemberNode key={child.id} member={child} />
                    ))}
                </ul>
            )}
        </li>
    );
};

export default function NetworkPage() {
    const [treeData, setTreeData] = useState<TreeNode | null>(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

    // Raw Data State for Reports
    const [rawProfiles, setRawProfiles] = useState<any[]>([]);
    const [rawLogs, setRawLogs] = useState<any[]>([]);
    const [rawCommissions, setRawCommissions] = useState<any[]>([]);
    const [rawInvestments, setRawInvestments] = useState<any[]>([]);
    const [rawWithdrawals, setRawWithdrawals] = useState<any[]>([]);

    // Export Modal State
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportStartDate, setExportStartDate] = useState("");
    const [exportEndDate, setExportEndDate] = useState("");

    useEffect(() => {
        const buildTree = async () => {
            // 1. Fetch all profiles
            const { data: profiles, error: pError } = await supabase
                .from('profiles')
                .select('id, full_name, category, referrer_id, role');

            if (pError || !profiles) {
                console.error("Error fetching network profiles:", pError);
                setLoading(false);
                return;
            }

            // 2. Fetch all components with date fields for accurate filtering
            const { data: logs } = await supabase.from('daily_logs').select('member_id, profit_amount, log_date');
            const { data: commissions } = await supabase.from('commissions').select('referrer_id, amount, created_at');
            const { data: investments } = await supabase.from('investments').select('member_id, amount, created_at');
            const { data: withdrawals } = await supabase.from('withdrawals').select('member_id, amount, created_at');

            // 4. Calculate profits per member
            const profitMap: Record<string, number> = {};
            const investMap: Record<string, number> = {};
            const withdrawMap: Record<string, number> = {};

            logs?.forEach(l => {
                profitMap[l.member_id] = (profitMap[l.member_id] || 0) + Number(l.profit_amount);
            });

            commissions?.forEach(c => {
                profitMap[c.referrer_id] = (profitMap[c.referrer_id] || 0) + Number(c.amount);
            });

            investments?.forEach(i => {
                investMap[i.member_id] = (investMap[i.member_id] || 0) + Number(i.amount);
            });

            withdrawals?.forEach(w => {
                withdrawMap[w.member_id] = (withdrawMap[w.member_id] || 0) + Number(w.amount);
            });

            // 5. Build export data and TreeNode Map
            const exportList: any[] = [];
            const nodeMap: Record<string, TreeNode> = {};
            profiles.forEach(p => {
                const totalProfit = profitMap[p.id] || 0;
                const totalInvestments = investMap[p.id] || 0;
                const totalWithdrawals = withdrawMap[p.id] || 0;

                exportList.push({
                    Name: p.full_name,
                    Role: p.role,
                    Category: p.category || 'Standard',
                    TotalInvestments: totalInvestments,
                    TotalProfit: totalProfit,
                    TotalWithdrawals: totalWithdrawals,
                    ActiveBalance: (totalInvestments + totalProfit) - totalWithdrawals
                });

                nodeMap[p.id] = {
                    id: p.id,
                    name: p.full_name,
                    children: [],
                    category: p.category,
                    role: p.role,
                    referrer_id: p.referrer_id,
                    totalProfit: profitMap[p.id] || 0
                } as TreeNode;
            });

            let root: TreeNode | null = null;

            // 6. Link children to parents
            profiles.forEach(p => {
                if (p.referrer_id && nodeMap[p.referrer_id]) {
                    nodeMap[p.referrer_id].children?.push(nodeMap[p.id]);
                } else {
                    if (!root || p.role === 'leader') root = nodeMap[p.id];
                }
            });

            setRawProfiles(profiles);
            setRawLogs(logs || []);
            setRawCommissions(commissions || []);
            setRawInvestments(investments || []);
            setRawWithdrawals(withdrawals || []);

            setTreeData(root);
            setLoading(false);
        };

        buildTree();
    }, []);

    const handleExportCSV = () => {
        console.log("Export triggered. Profiles:", rawProfiles.length);
        if (rawProfiles.length === 0) {
            alert("No data available to export. Please wait for the page to load.");
            return;
        }

        setExporting(true);

        const formatDate = (dateInput: any) => {
            if (!dateInput) return null;
            try {
                const d = new Date(dateInput);
                if (isNaN(d.getTime())) return null;
                return d.toISOString().split('T')[0];
            } catch (e) {
                return null;
            }
        };

        const start = exportStartDate || "0000-00-00";
        const end = exportEndDate || "9999-99-99";

        setTimeout(() => {
            try {
                console.log("Processing export data...");
                // 1. Optimized Data Aggregation
                const logMap: Record<string, any[]> = {};
                const comMap: Record<string, any[]> = {};
                const invMap: Record<string, any[]> = {};
                const withMap: Record<string, any[]> = {};
                const referralCounts: Record<string, number> = {};

                rawLogs.forEach(l => {
                    if (l.member_id) {
                        if (!logMap[l.member_id]) logMap[l.member_id] = [];
                        logMap[l.member_id].push(l);
                    }
                });
                rawCommissions.forEach(c => {
                    const refId = c.referrer_id || (c as any).referral_id;
                    if (refId) {
                        if (!comMap[refId]) comMap[refId] = [];
                        comMap[refId].push(c);
                    }
                });
                rawProfiles.forEach(p => {
                    if (p.referrer_id) {
                        referralCounts[p.referrer_id] = (referralCounts[p.referrer_id] || 0) + 1;
                    }
                });
                rawInvestments.forEach(i => {
                    if (i.member_id) {
                        if (!invMap[i.member_id]) invMap[i.member_id] = [];
                        invMap[i.member_id].push(i);
                    }
                });
                rawWithdrawals.forEach(w => {
                    if (w.member_id) {
                        if (!withMap[w.member_id]) withMap[w.member_id] = [];
                        withMap[w.member_id].push(w);
                    }
                });

                // 2. Generate Stats
                const memberStats = rawProfiles.map(p => {
                    const pId = p.id;
                    const pLogs = logMap[pId] || [];
                    const pCommissions = comMap[pId] || [];
                    const pInvests = invMap[pId] || [];
                    const pWithdraws = withMap[pId] || [];

                    const allTimeTradingProfit = pLogs.reduce((sum, log) => sum + (Number(log.profit_amount) || 0), 0);
                    const allTimeReferralProfit = pCommissions.reduce((sum, com) => sum + (Number(com.amount) || 0), 0);
                    const allTimeInvestments = pInvests.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
                    const allTimeWithdrawals = pWithdraws.reduce((sum, w) => sum + (Number(w.amount) || 0), 0);
                    const allTimeTotalProfit = allTimeTradingProfit + allTimeReferralProfit;
                    const activeBalance = allTimeTotalProfit - allTimeWithdrawals;

                    const periodTradingProfit = pLogs
                        .filter(l => l.log_date && l.log_date >= start && l.log_date <= end)
                        .reduce((sum, log) => sum + (Number(log.profit_amount) || 0), 0);

                    const periodReferralProfit = pCommissions
                        .filter(c => {
                            const d = formatDate(c.created_at || (c as any).date);
                            return d && d >= start && d <= end;
                        })
                        .reduce((sum, com) => sum + (Number(com.amount) || 0), 0);

                    const periodInvested = pInvests
                        .filter(i => {
                            const d = formatDate(i.created_at || (i as any).date);
                            return d && d >= start && d <= end;
                        })
                        .reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);

                    const periodWithdrawn = pWithdraws
                        .filter(w => {
                            const d = formatDate(w.created_at || (w as any).date);
                            return d && d >= start && d <= end;
                        })
                        .reduce((sum, wd) => sum + (Number(wd.amount) || 0), 0);

                    return {
                        name: p.full_name || 'Individual',
                        allTimeTotalProfit,
                        allTimeTradingProfit,
                        allTimeReferralProfit,
                        allTimeInvestments,
                        allTimeWithdrawals,
                        activeBalance,
                        periodTradingProfit,
                        periodReferralProfit,
                        periodInvested,
                        periodWithdrawn,
                        referralsCount: referralCounts[pId] || 0
                    };
                });

                // 3. Rank and Format CSV
                const rankedStats = [...memberStats].sort((a, b) => b.allTimeTotalProfit - a.allTimeTotalProfit);

                const exportList = rankedStats.map((s, index) => {
                    const row: any = {
                        "#Rank": index + 1,
                        "Name": s.name,
                        "Referrals Made": s.referralsCount
                    };

                    if (exportStartDate || exportEndDate) {
                        row["Period Trading Profit"] = s.periodTradingProfit.toFixed(2);
                        row["Period Referral Profit"] = s.periodReferralProfit.toFixed(2);
                        row["Period Total Profit"] = (s.periodTradingProfit + s.periodReferralProfit).toFixed(2);
                        row["Period Investments"] = s.periodInvested.toFixed(2);
                        row["Period Withdrawals"] = s.periodWithdrawn.toFixed(2);
                    }

                    row["Total (Trading + Referral) Profit (All Time)"] = s.allTimeTotalProfit.toFixed(2);
                    row["Total Trading Profit (All Time)"] = s.allTimeTradingProfit.toFixed(2);
                    row["Total Referral Profit (All Time)"] = s.allTimeReferralProfit.toFixed(2);
                    row["Total Investments (All Time)"] = s.allTimeInvestments.toFixed(2);
                    row["Total Withdrawals (All Time)"] = s.allTimeWithdrawals.toFixed(2);
                    row["Active Balance"] = s.activeBalance.toFixed(2);

                    return row;
                });

                console.log("Generating CSV file...");
                const headers = Object.keys(exportList[0] || {});
                if (headers.length === 0) throw new Error("No headers generated for CSV.");

                const csvContent = [
                    `Comprehensive Network Report: ${exportStartDate || 'All Time'} to ${exportEndDate || 'Today'}`,
                    '',
                    headers.join(','),
                    ...exportList.map(row => headers.map(h => `"${row[h] ?? ""}"`).join(','))
                ].join('\n');

                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.setAttribute("href", url);
                link.setAttribute("download", `master_report_${new Date().toISOString().split('T')[0]}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                console.log("Export complete.");
                setIsExportModalOpen(false);
            } catch (error) {
                console.error("Critical Export Error:", error);
                alert("Download failed. Please see browser console for technical details.");
            } finally {
                setExporting(false);
            }
        }, 50);
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Network Hierarchy</h2>
                        <p className="text-muted-foreground">Visual structure of the organization.</p>
                    </div>
                    <Button
                        onClick={() => setIsExportModalOpen(true)}
                        className="flex items-center"
                        disabled={loading || exporting}
                    >
                        {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                        Export Comprehensive Report
                    </Button>
                </div>

                <Card className="min-h-[600px] overflow-auto">
                    <CardHeader>
                        <CardTitle>Organization Chart</CardTitle>
                        <CardDescription>Visual map of the entire network hierarchy.</CardDescription>
                    </CardHeader>
                    <CardContent className="overflow-auto pb-10">
                        {loading ? (
                            <div className="text-center py-10">Loading network...</div>
                        ) : treeData ? (
                            <div className="org-tree w-max min-w-full flex justify-center p-4">
                                <ul>
                                    <MemberNode member={treeData} />
                                </ul>
                            </div>
                        ) : (
                            <div className="text-center py-10">No network data found.</div>
                        )}
                    </CardContent>
                </Card>

                {/* Export Report Modal */}
                <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Export Comprehensive Network Report</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <p className="text-sm text-muted-foreground">Select a date range to filter the performance metrics. Leave blank to generate an all-time report.</p>
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
                            <Button onClick={handleExportCSV} disabled={exporting || rawProfiles.length === 0}>
                                {exporting ? 'Generating...' : 'Download Master Report'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}
