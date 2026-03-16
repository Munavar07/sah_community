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

        const start = exportStartDate ? new Date(exportStartDate).getTime() : 0;
        const end = exportEndDate ? new Date(exportEndDate).getTime() + 86400000 : Infinity;

        // Filter the raw data for the specific period
        const filteredLogs = rawLogs.filter(l => {
            const t = new Date(l.log_date).getTime();
            return t >= start && t <= end;
        });

        const filteredCommissions = rawCommissions.filter(c => {
            const t = new Date(c.created_at).getTime();
            return t >= start && t <= end;
        });

        const filteredInvestments = rawInvestments.filter(i => {
            const t = new Date(i.created_at).getTime();
            return t >= start && t <= end;
        });

        const filteredWithdrawals = rawWithdrawals.filter(w => {
            const t = new Date(w.created_at).getTime();
            return t >= start && t <= end;
        });

        // All-Time Data pre-aggregation
        const allTimeLogMap: Record<string, number> = {};
        const allTimeComMap: Record<string, number> = {};
        const allTimeInvMap: Record<string, number> = {};
        const allTimeWithMap: Record<string, number> = {};

        rawLogs.forEach(l => { allTimeLogMap[l.member_id] = (allTimeLogMap[l.member_id] || 0) + Number(l.profit_amount); });
        rawCommissions.forEach(c => { allTimeComMap[c.referrer_id] = (allTimeComMap[c.referrer_id] || 0) + Number(c.amount); });
        rawInvestments.forEach(i => { allTimeInvMap[i.member_id] = (allTimeInvMap[i.member_id] || 0) + Number(i.amount); });
        rawWithdrawals.forEach(w => { allTimeWithMap[w.member_id] = (allTimeWithMap[w.member_id] || 0) + Number(w.amount); });

        // Compute summary metrics per profile over the selected period
        const exportList = rawProfiles.map(p => {
            const pLogs = filteredLogs.filter(l => l.member_id === p.id);
            const pCommissions = filteredCommissions.filter(c => c.referrer_id === p.id);
            const pInvestments = filteredInvestments.filter(i => i.member_id === p.id);
            const pWithdrawals = filteredWithdrawals.filter(w => w.member_id === p.id);

            const periodTradingProfit = pLogs.reduce((sum, log) => sum + Number(log.profit_amount), 0);
            const periodReferralProfit = pCommissions.reduce((sum, com) => sum + Number(com.amount), 0);
            const periodTotalProfit = periodTradingProfit + periodReferralProfit;
            const periodInvested = pInvestments.reduce((sum, inv) => sum + Number(inv.amount), 0);
            const periodWithdrawn = pWithdrawals.reduce((sum, w) => sum + Number(w.amount), 0);

            const allTimeInvestments = allTimeInvMap[p.id] || 0;
            const allTimeProfit = (allTimeLogMap[p.id] || 0) + (allTimeComMap[p.id] || 0);
            const allTimeWithdrawals = allTimeWithMap[p.id] || 0;
            const activeBalance = allTimeProfit - allTimeWithdrawals;

            return {
                Name: p.full_name,
                Role: p.role,
                Category: p.category || 'Standard',
                "Period Investments": Number(periodInvested).toFixed(2),
                "Period Trading Profit": Number(periodTradingProfit).toFixed(2),
                "Period Referral Profit": Number(periodReferralProfit).toFixed(2),
                "Period Total Profit": Number(periodTotalProfit).toFixed(2),
                "Period Withdrawals": Number(periodWithdrawn).toFixed(2),
                "All-Time Investments": Number(allTimeInvestments).toFixed(2),
                "All-Time Profit": Number(allTimeProfit).toFixed(2),
                "All-Time Withdrawals": Number(allTimeWithdrawals).toFixed(2),
                "Current Active Balance": Number(activeBalance).toFixed(2)
            };
        });

        const headers = Object.keys(exportList[0]);
        const csvContent = [
            `Comprehensive Network Report: ${exportStartDate || 'All Time'} to ${exportEndDate || 'Today'}`,
            '', // blank line
            // ... Then the actual headers and data
            headers.join(','),
            ...exportList.map(row => headers.map((h: any) => `"${(row as any)[h] !== undefined ? (row as any)[h] : ""}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `comprehensive_network_report.csv`);
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
