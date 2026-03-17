"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Search,
    MoreHorizontal,
    Eye,
    Trash2,
    UserPlus,
    Loader2,
    BadgeCheck,
    Mail,
    Calendar,
    ArrowUpDown,
    AlertCircle
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Profile } from "@/types";
import Link from "next/link";
import { deleteMemberAction } from "@/app/actions";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function MembersListPage() {
    const [members, setMembers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchMembers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setMembers(data as Profile[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    const filteredMembers = members.filter(m =>
        m.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDelete = async () => {
        if (!deletingId) return;
        setIsDeleting(true);

        try {
            const formData = new FormData();
            formData.append("memberId", deletingId);

            const result = await deleteMemberAction(null, formData);
            if (result.success) {
                setMembers(prev => prev.filter(m => m.id !== deletingId));
                setDeletingId(null);
            } else {
                alert(result.message);
            }
        } catch (err) {
            console.error(err);
            alert("Failed to delete member.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Community Members</h2>
                        <p className="text-muted-foreground">Manage and monitor all registered active members.</p>
                    </div>
                    <Link href="/dashboard/members/add">
                        <Button className="bg-emerald-600 hover:bg-emerald-700">
                            <UserPlus className="h-4 w-4 mr-2" /> Add New Member
                        </Button>
                    </Link>
                </div>

                <Card className="glass border-border/60">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between gap-4">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search members by name or email..."
                                    className="pl-9 bg-accent/30 border-border/40 focus:ring-emerald-500/20"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="text-sm text-muted-foreground hidden sm:block">
                                Total Members: <span className="font-semibold text-foreground">{members.length}</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex h-[300px] items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                            </div>
                        ) : filteredMembers.length > 0 ? (
                            <div className="rounded-md border border-border/40 overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-accent/40">
                                        <TableRow>
                                            <TableHead>Member</TableHead>
                                            <TableHead className="hidden md:table-cell">Joined Date</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredMembers.map((member) => (
                                            <TableRow key={member.id} className="hover:bg-accent/20 transition-colors">
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-indigo-500/20 flex items-center justify-center text-emerald-600 font-bold border border-emerald-500/10">
                                                            {member.full_name?.charAt(0) || "U"}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="font-semibold truncate max-w-[150px] md:max-w-none">{member.full_name}</div>
                                                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                                <Mail className="h-3 w-3" /> {member.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {new Date(member.created_at || "").toLocaleDateString()}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={`capitalize text-[10px] py-0 h-5 ${member.role === 'leader' ? 'border-amber-500/50 text-amber-500 bg-amber-500/5' : 'border-blue-500/50 text-blue-500 bg-blue-500/5'}`}>
                                                        {member.role}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Link href={`/dashboard/members/${member.id}`}>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                            onClick={() => setDeletingId(member.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-accent/10 rounded-xl border border-dashed">
                                <Search className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                                <h3 className="text-lg font-medium">No members found</h3>
                                <p className="text-muted-foreground text-sm">No members match your search criteria or the list is empty.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Deletion Confirmation Dialog */}
            <Dialog open={!!deletingId} onOpenChange={(open) => !open && !isDeleting && setDeletingId(null)}>
                <DialogContent className="glass">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-5 w-5" /> Confirm Deletion
                        </DialogTitle>
                        <DialogDescription className="pt-2">
                            This action is <strong>irreversible</strong>. This will permanently delete the member's profile, investment records, profit logs, and auth account.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-4 bg-destructive/10 rounded-xl border border-destructive/20 text-sm text-destructive font-medium">
                        Are you sure you want to remove this member from the community?
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setDeletingId(null)} disabled={isDeleting}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive hover:bg-destructive/90 shadow-lg shadow-destructive/20"
                        >
                            {isDeleting ? (
                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deleting...</>
                            ) : (
                                "Confirm Deletion"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
