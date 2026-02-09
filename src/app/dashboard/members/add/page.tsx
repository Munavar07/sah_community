"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { UserPlus, DollarSign, Users, Award, Upload, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Profile } from "@/types";

import { createMemberAction } from "@/app/actions";

export default function AddMemberPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("standard");
    const [upline, setUpline] = useState("");
    const [file, setFile] = useState<File | null>(null);

    const [uplines, setUplines] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    // Fetch potentials uplines (all existing users)
    useEffect(() => {
        const fetchUplines = async () => {
            const { data } = await supabase.from('profiles').select('*');
            if (data) setUplines(data as Profile[]);
        };
        fetchUplines();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            let proofUrl = "";

            // 1. Upload File Client-Side (Standard Client Key is fine for storage if policies are set)
            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `admin-upload-${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('proofs')
                    .upload(fileName, file);

                if (uploadError) throw new Error("Upload failed: " + uploadError.message);

                const { data: { publicUrl } } = supabase.storage
                    .from('proofs')
                    .getPublicUrl(fileName);

                proofUrl = publicUrl;
            }

            // 2. Call Server Action
            const formData = new FormData();
            formData.append("email", email);
            formData.append("password", password);
            formData.append("fullName", name);
            formData.append("amount", amount);
            formData.append("category", category);
            formData.append("uplineId", upline);
            formData.append("proofUrl", proofUrl);

            const result = await createMemberAction(null, formData);

            if (!result.success) {
                throw new Error(result.message);
            }

            setMessage(result.message);

            // Reset form
            setName("");
            setEmail("");
            setPassword("");
            setAmount("");
            setFile(null);

        } catch (err) {
            const error = err as Error;
            console.error(error);
            setMessage(`Error: ${error.message || "Failed to create member"}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto space-y-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Add New Member</h2>
                    <p className="text-muted-foreground">Expand the network hierarchy.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Member Details</CardTitle>
                        <CardDescription>Enter the new member&apos;s information and investment details.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {message && (
                            <div className={`mb-6 p-4 rounded flex items-center gap-2 ${message.includes("Success") ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"}`}>
                                {message.includes("Success") ? <CheckCircle className="w-5 h-5" /> : null}
                                {message}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <div className="relative">
                                        <UserPlus className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="name"
                                            placeholder="New Member Name"
                                            className="pl-9"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="member@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                {/* Temp Password Field for creation */}
                                <div className="space-y-2">
                                    <Label htmlFor="password">Temporary Password</Label>
                                    <Input
                                        id="password"
                                        type="text"
                                        placeholder="set a password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="category">Member Category</Label>
                                    <Select value={category} onValueChange={setCategory}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select Category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="standard">Standard Member</SelectItem>
                                            <SelectItem value="premium">Premium Investor</SelectItem>
                                            <SelectItem value="vip">VIP Partner</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="upline">Referral / Upline</Label>
                                    <Select value={upline} onValueChange={setUpline}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select Upline (Referrer)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {uplines.map(u => (
                                                <SelectItem key={u.id} value={u.id}>{u.full_name} ({u.role})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h3 className="font-semibold mb-4">Investment Configuration</h3>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="amount">Initial Investment ($)</Label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="amount"
                                                type="number"
                                                placeholder="e.g. 5000"
                                                className="pl-9"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="proof">Investment Proof Upload</Label>
                                        <div className="relative">
                                            <Input
                                                id="proof"
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                                className="pl-9"
                                                required
                                            />
                                            <Upload className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 h-11 text-base" disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Member & Record Investment"}
                            </Button>

                            <p className="text-xs text-center text-muted-foreground">
                                Note: Creating a user here will create a Supabase Auth account.
                            </p>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
