"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ChevronRight, ChevronDown, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Profile } from "@/types";
import Link from "next/link";


interface TreeNode extends Partial<Profile> {
    id: string;
    name?: string;
    children?: TreeNode[];
    totalProfit?: number;
}

// Recursive Member Component
const MemberNode = ({ member, depth = 0 }: { member: TreeNode, depth?: number }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const hasChildren = member.children && member.children.length > 0;

    return (
        <div className="select-none">
            <div
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors hover:bg-accent/50 cursor-pointer ${depth === 0 ? "bg-indigo-500/10 border-indigo-500/30 mb-4" : "bg-card mb-2 ml-6"
                    }`}
                onClick={() => setIsExpanded(!isExpanded)}
                style={{ marginLeft: depth > 0 ? `${depth * 24}px` : 0 }}
            >
                {hasChildren ? (
                    isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />
                ) : <div className="w-4" />}

                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold ${depth === 0 ? "bg-indigo-500 text-white" : "bg-emerald-500 text-white"
                    }`}>
                    {member.name?.charAt(0) || 'U'}
                </div>

                <div className="flex-1 flex justify-between items-center pr-2">
                    <div>
                        <h4 className="font-semibold text-sm">{member.name} {depth === 0 && "(Director)"}</h4>
                        <div className="flex items-center gap-2 text-xs">
                            <span className="capitalize text-muted-foreground">{member.category || 'Standard'}</span>
                            <span className="text-emerald-500 font-bold ml-2">Profit: ${member.totalProfit?.toLocaleString() || 0}</span>
                        </div>
                    </div>

                    <Link
                        href={`/dashboard/members/${member.id}`}
                        onClick={(e: React.MouseEvent) => e.stopPropagation()} // Prevent expansion toggle
                        className="p-2 hover:bg-indigo-500/10 rounded-full text-indigo-500 transition-colors"
                        title="View Full Details"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </Link>
                </div>

            </div>

            {isExpanded && hasChildren && (
                <div className="relative">
                    <div className="absolute left-[20px] top-0 bottom-0 w-px bg-border -z-10" style={{ left: `${(depth * 24) + 20}px` }} />

                    {member.children?.map((child: TreeNode) => (
                        <MemberNode key={child.id} member={child} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default function NetworkPage() {
    const [treeData, setTreeData] = useState<TreeNode | null>(null);
    const [allProfiles, setAllProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

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

            setAllProfiles(exportList);
            setTreeData(root);
            setLoading(false);
        };

        buildTree();
    }, []);

    const handleExportCSV = () => {
        if (allProfiles.length === 0) return;
        setExporting(true);

        const headers = Object.keys(allProfiles[0]);
        const csvContent = [
            headers.join(','),
            ...allProfiles.map(row => headers.map(h => `"${row[h] || 0}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `all_members_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setExporting(false);
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Network Hierarchy</h2>
                    <p className="text-muted-foreground">Visual structure of the organization.</p>
                </div>

                <Card className="min-h-[600px] overflow-auto">
                    <CardHeader>
                        <CardTitle>Organization Tree</CardTitle>
                        <CardDescription>Click items to expand/collapse branches.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-10">Loading network...</div>
                        ) : treeData ? (
                            <div className="max-w-2xl">
                                <MemberNode member={treeData} />
                            </div>
                        ) : (
                            <div className="text-center py-10">No network data found.</div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
