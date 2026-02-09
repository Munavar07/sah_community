"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ChevronRight, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Profile } from "@/types";

// Recursive Member Component
const MemberNode = ({ member, depth = 0 }: { member: any, depth?: number }) => {
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

                <div className="flex-1">
                    <h4 className="font-semibold text-sm">{member.name} {depth === 0 && "(Director)"}</h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="capitalize">{member.category || 'Standard'}</span>
                    </div>
                </div>
            </div>

            {isExpanded && hasChildren && (
                <div className="relative">
                    <div className="absolute left-[20px] top-0 bottom-0 w-px bg-border -z-10" style={{ left: `${(depth * 24) + 20}px` }} />

                    {member.children.map((child: any) => (
                        <MemberNode key={child.id} member={child} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default function NetworkPage() {
    const [treeData, setTreeData] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const buildTree = async () => {
            // Fetch all profiles
            // For a real huge network, we'd use adjacency list or recursive CTEs in SQL.
            // For this size, fetching all and building in JS is fine.
            const { data: profiles, error } = await supabase
                .from('profiles')
                .select('id, full_name, category, referrer_id, role');

            if (error || !profiles) {
                console.error("Error fetching network:", error);
                setLoading(false);
                return;
            }

            // 1. Find Root (Shaji or whoever has no referrer or is explicitly Shaji)
            // Assumption: Root has no referrer OR we pick the one named 'Shaji' top level.
            // Let's assume the user with no referrer is Root. Or we can find by name / role.
            // Strategy: Build a map.
            const profileMap: Record<string, any> = {};
            profiles.forEach(p => {
                profileMap[p.id] = { ...p, name: p.full_name, children: [] };
            });

            let root: any = null;

            // 2. Link children to parents
            profiles.forEach(p => {
                if (p.referrer_id && profileMap[p.referrer_id]) {
                    profileMap[p.referrer_id].children.push(profileMap[p.id]);
                } else {
                    // Potential root. If multiple, we might need a virtual root.
                    // For now, take the first one or specific one.
                    if (!root || p.role === 'leader') root = profileMap[p.id];
                }
            });

            setTreeData(root);
            setLoading(false);
        };

        buildTree();
    }, []);

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
