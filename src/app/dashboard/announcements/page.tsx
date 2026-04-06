"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Megaphone, Plus, Trash2, Power, PowerOff, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Announcement } from "@/types";
import { createAnnouncementAction, toggleAnnouncementStatusAction, deleteAnnouncementAction } from "@/app/actions";

export default function AnnouncementsManagementPage() {
    const { user, profile } = useAuth();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);

    const [content, setContent] = useState("");
    const [type, setType] = useState("info");
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState("");

    const fetchAnnouncements = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('announcements')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setAnnouncements(data as Announcement[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (profile?.role === 'leader') {
            fetchAnnouncements();
        }
    }, [profile]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage("");

        if (!content.trim()) return;
        if (!user) return;

        setSubmitting(true);
        const formData = new FormData();
        formData.append("content", content);
        formData.append("type", type);
        formData.append("createdBy", user.id);

        const res = await createAnnouncementAction(null, formData);
        setMessage(res.message);

        if (res.success) {
            setContent("");
            setType("info");
            fetchAnnouncements();
        }
        setSubmitting(false);
    };

    const handleToggle = async (id: string, currentStatus: boolean) => {
        setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, is_active: !currentStatus } : a));
        await toggleAnnouncementStatusAction(id, !currentStatus);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this announcement?")) return;
        setAnnouncements(prev => prev.filter(a => a.id !== id));
        await deleteAnnouncementAction(id);
    };

    if (profile?.role !== 'leader') {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center h-[50vh]">
                    <p>Access Denied</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Notice Board</h2>
                    <p className="text-muted-foreground">Manage announcements visible to all members.</p>
                </div>

                <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
                    {/* Create Announcement */}
                    <Card className="glass h-fit">
                        <CardHeader>
                            <CardTitle className="text-lg">New Notice</CardTitle>
                            <CardDescription>Publish a new message to the dashboard banner.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleCreate} className="space-y-4">
                                {message && (
                                    <div className={`p-3 rounded-md text-sm ${message.includes('success') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'}`}>
                                        {message}
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="content">Message Content</Label>
                                    <Input 
                                        id="content" 
                                        placeholder="e.g. Server maintenance tomorrow..." 
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="type">Type / Color</Label>
                                    <Select value={type} onValueChange={setType}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="info">Info (Blue)</SelectItem>
                                            <SelectItem value="warning">Warning (Amber)</SelectItem>
                                            <SelectItem value="success">Success (Emerald)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" disabled={submitting}>
                                    {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                                    Publish Notice
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Manage Announcements */}
                    <Card className="glass">
                        <CardHeader>
                            <CardTitle className="text-lg">Past Notices</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="py-12 flex justify-center">
                                    <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                                </div>
                            ) : announcements.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground bg-accent/20 rounded-xl border border-dashed">
                                    <Megaphone className="w-8 h-8 mx-auto mb-3 opacity-20" />
                                    No announcements created yet.
                                </div>
                            ) : (
                                <div className="rounded-md border border-border/40 overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-accent/40">
                                            <TableRow>
                                                <TableHead>Message</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead className="text-center">Active</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {announcements.map((ann) => (
                                                <TableRow key={ann.id}>
                                                    <TableCell className="max-w-[200px] truncate" title={ann.content}>
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-2 h-2 rounded-full ${
                                                                ann.type === 'warning' ? 'bg-amber-500' : 
                                                                ann.type === 'success' ? 'bg-emerald-500' : 
                                                                'bg-blue-500'
                                                            }`} />
                                                            {ann.content}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground text-xs">
                                                        {new Date(ann.created_at).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <button 
                                                            onClick={() => handleToggle(ann.id, ann.is_active)}
                                                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${ann.is_active ? 'bg-emerald-500' : 'bg-input'}`}
                                                            role="switch"
                                                            aria-checked={ann.is_active}
                                                        >
                                                            <span
                                                                className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${ann.is_active ? 'translate-x-4' : 'translate-x-0'}`}
                                                            />
                                                        </button>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="text-muted-foreground hover:text-destructive h-8 w-8"
                                                            onClick={() => handleDelete(ann.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
