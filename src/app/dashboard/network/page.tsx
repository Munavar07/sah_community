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

    return (
        <li>
            <div className="relative mx-auto flex flex-col items-center justify-center p-4 border rounded-xl bg-card min-w-[160px] max-w-[200px] shadow-sm hover:shadow-md transition-all z-10 hover:-translate-y-1">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center text-xl font-bold mb-3 shadow-inner ${member.role === 'leader' ? "bg-indigo-500 text-white ring-4 ring-indigo-500/20" : "bg-emerald-500 text-white ring-4 ring-emerald-500/20"}`}>
                    {member.name?.charAt(0) || 'U'}
                </div>
                <h4 className="font-semibold text-sm text-center line-clamp-1" title={member.name}>{member.name}</h4>

                <div className="flex flex-col items-center gap-1 mt-2 w-full">
                    <span className="capitalize text-[10px] text-muted-foreground px-2 py-0.5 bg-accent rounded-full border">
                        {member.role === 'leader' ? 'Director' : (member.category || 'Standard')}
                    </span>
                    <span className="text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full text-xs font-bold mt-2">
                        +${member.totalProfit?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                    </span>
                </div>

                <Link
                    href={`/dashboard/members/${member.id}`}
                    className="absolute top-2 right-2 p-1.5 hover:bg-indigo-500/10 rounded-full text-muted-foreground hover:text-indigo-500 transition-colors"
                    title="View Profile Details"
                >
                    <ChevronRight className="w-4 h-4" />
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

            // 2. Fetch all components to calculate stats (logs, investments, withdrawals, commissions)
            const { data: logs } = await supabase.from('daily_logs').select('member_id, profit_amount');
            const { data: commissions } = await supabase.from('commissions').select('referrer_id, amount');
            const { data: investments } = await supabase.from('investments').select('member_id, amount');
            const { data: withdrawals } = await supabase.from('withdrawals').select('member_id, amount');

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
        if (rawProfiles.length === 0) return;
        setExporting(true);

        const start = exportStartDate || "0000-00-00";
        const end = exportEndDate || "9999-99-99";

        // 1. Calculate Referrals Made (All Time)
        const referralCounts: Record<string, number> = {};
        rawProfiles.forEach(p => {
            if (p.referrer_id) {
                referralCounts[p.referrer_id] = (referralCounts[p.referrer_id] || 0) + 1;
            }
        });

        // 2. Pre-calculate All-Time and Period stats per member
        const memberStats = rawProfiles.map(p => {
            const pLogs = rawLogs.filter(l => l.member_id === p.id);
            const pCommissions = rawCommissions.filter(c => c.referrer_id === p.id);
            const pInvestments = rawInvestments.filter(i => i.member_id === p.id);
            const pWithdrawals = rawWithdrawals.filter(w => w.member_id === p.id);

            // Filter for period (using string comparison for log_date and created_at substring)
            const filteredLogs = pLogs.filter(l => l.log_date >= start && l.log_date <= end);
            const filteredCommissions = pCommissions.filter(c => {
                const cDate = new Date(c.created_at).toISOString().split('T')[0];
                return cDate >= start && cDate <= end;
            });
            const filteredInvestments = pInvestments.filter(i => {
                const iDate = new Date(i.created_at).toISOString().split('T')[0];
                return iDate >= start && iDate <= end;
            });
            const filteredWithdrawals = pWithdrawals.filter(w => {
                const wDate = new Date(w.created_at).toISOString().split('T')[0];
                return wDate >= start && wDate <= end;
            });

            const allTimeTradingProfit = pLogs.reduce((sum, log) => sum + Number(log.profit_amount), 0);
            const allTimeReferralProfit = pCommissions.reduce((sum, com) => sum + Number(com.amount), 0);
            const allTimeTotalProfit = allTimeTradingProfit + allTimeReferralProfit;
            const allTimeInvestments = pInvestments.reduce((sum, inv) => sum + Number(inv.amount), 0);
            const allTimeWithdrawals = pWithdrawals.reduce((sum, w) => sum + Number(w.amount), 0);
            const activeBalance = allTimeTotalProfit - allTimeWithdrawals;

            const periodTradingProfit = filteredLogs.reduce((sum, log) => sum + Number(log.profit_amount), 0);
            const periodReferralProfit = filteredCommissions.reduce((sum, com) => sum + Number(com.amount), 0);
            const periodTotalProfit = periodTradingProfit + periodReferralProfit;
            const periodInvested = filteredInvestments.reduce((sum, inv) => sum + Number(inv.amount), 0);
            const periodWithdrawn = filteredWithdrawals.reduce((sum, w) => sum + Number(w.amount), 0);

            // Tier Logic
            let tier = "❌ Inactive";
            if (allTimeTotalProfit > 500) tier = "🔥 Top Performer";
            else if (allTimeTotalProfit >= 50) tier = "✅ Active";
            else if (allTimeTotalProfit > 0) tier = "⚠️ Low Activity";

            return {
                id: p.id,
                name: p.full_name,
                allTimeTotalProfit,
                allTimeTradingProfit,
                allTimeReferralProfit,
                allTimeInvestments,
                allTimeWithdrawals,
                activeBalance,
                periodTradingProfit,
                periodReferralProfit,
                periodTotalProfit,
                periodInvested,
                periodWithdrawn,
                referralsMade: referralCounts[p.id] || 0,
                tier
            };
        });

        // 3. Rank by Total Profit (Descending)
        const rankedStats = [...memberStats].sort((a, b) => b.allTimeTotalProfit - a.allTimeTotalProfit);

        // 4. Transform to final row objects
        const exportList = rankedStats.map((s, index) => {
            const row: any = {
                "#Rank": index + 1,
                "Name": s.name,
                "Performance Tier": s.tier,
                "Referrals Made": s.referralsMade
            };

            if (exportStartDate || exportEndDate) {
                row["Period Trading Profit"] = Number(s.periodTradingProfit).toFixed(2);
                row["Period Referral Profit"] = Number(s.periodReferralProfit).toFixed(2);
                row["Period Total Profit"] = Number(s.periodTotalProfit).toFixed(2);
                row["Period Investments"] = Number(s.periodInvested).toFixed(2);
                row["Period Withdrawals"] = Number(s.periodWithdrawn).toFixed(2);
            }

            row["Total Investments (All Time)"] = Number(s.allTimeInvestments).toFixed(2);
            row["Total Trading Profit (All Time)"] = Number(s.allTimeTradingProfit).toFixed(2);
            row["Total Referral Profit (All Time)"] = Number(s.allTimeReferralProfit).toFixed(2);
            row["Total Profit (Trading + Referral)"] = Number(s.allTimeTotalProfit).toFixed(2);
            row["Total Withdrawals (All Time)"] = Number(s.allTimeWithdrawals).toFixed(2);
            row["Active Balance"] = Number(s.activeBalance).toFixed(2);

            return row;
        });

        const headers = Object.keys(exportList[0]);
        const csvContent = [
            `Comprehensive Network Report: ${exportStartDate || 'All Time'} to ${exportEndDate || 'Today'}`,
            '',
            headers.join(','),
            ...exportList.map(row => headers.map((h: any) => `"${(row as any)[h] !== undefined ? (row as any)[h] : ""}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `comprehensive_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setExporting(false);
        setIsExportModalOpen(false);
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Network Hierarchy</h2>
                        <p className="text-muted-foreground">Visual structure of the organization.</p>
                    </div>
                    <Button onClick={() => setIsExportModalOpen(true)} className="flex items-center">
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
                            <Button onClick={handleExportCSV} disabled={exporting}>
                                {exporting ? 'Generating...' : 'Download Master Report'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}
