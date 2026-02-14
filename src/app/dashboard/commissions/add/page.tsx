"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { DollarSign, Loader2, CheckCircle, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Profile } from "@/types";
import { addManualCommissionAction } from "@/app/actions";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function AddCommissionPage() {
    const { profile } = useAuth();
    const router = useRouter();
    const [members, setMembers] = useState<Profile[]>([]);
    const [selectedMember, setSelectedMember] = useState("");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [commissionDate, setCommissionDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    // Redirect if not leader
    useEffect(() => {
        if (profile && profile.role !== 'leader') {
            router.push('/dashboard');
        }
    }, [profile, router]);

    // Fetch all members
    useEffect(() => {
        const fetchMembers = async () => {
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'member')
                .order('full_name');
            if (data) setMembers(data as Profile[]);
        };
        fetchMembers();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const formData = new FormData();
            formData.append("referrerId", selectedMember);
            formData.append("amount", amount);
            formData.append("description", description);
            formData.append("commissionDate", commissionDate);

            const result = await addManualCommissionAction(null, formData);

            if (!result.success) {
                throw new Error(result.message);
            }

            setMessage(result.message);
            setSelectedMember("");
            setAmount("");
            setDescription("");
            setCommissionDate(new Date().toISOString().split('T')[0]);

        } catch (err) {
            const error = err as Error;
            console.error(error);
            setMessage(`Error: ${error.message || "Failed to add commission"}`);
        } finally {
            setLoading(false);
        }
    };

    if (profile?.role !== 'leader') {
        return null;
    }

    return (
        <DashboardLayout>
            <div className="max-w-2xl mx-auto space-y-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Add Manual Commission</h2>
                    <p className="text-muted-foreground">Record commission for external referrals.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Commission Details</CardTitle>
                        <CardDescription>Add commission for members who referred people outside the system.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {message && (
                            <div className={`mb-6 p-4 rounded flex items-center gap-2 ${message.includes("Success") ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"}`}>
                                {message.includes("Success") ? <CheckCircle className="w-5 h-5" /> : null}
                                {message}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="member">Member (Referrer)</Label>
                                <Select value={selectedMember} onValueChange={setSelectedMember} required>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select member who earned commission" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {members.map(m => (
                                            <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="amount">Commission Amount ($)</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="amount"
                                        type="number"
                                        placeholder="e.g. 250"
                                        step="0.01"
                                        className="pl-9"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description / Note</Label>
                                <Textarea
                                    id="description"
                                    placeholder="e.g., External referral - John's friend invested $5000"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="commissionDate">Commission Date</Label>
                                <Input
                                    id="commissionDate"
                                    type="date"
                                    value={commissionDate}
                                    onChange={(e) => setCommissionDate(e.target.value)}
                                    required
                                />
                            </div>

                            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Add Commission"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
