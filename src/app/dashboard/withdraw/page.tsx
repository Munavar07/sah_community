"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { createWithdrawalAction } from "@/app/actions";
import { Loader2, Upload, AlertCircle, TrendingUp, DollarSign } from "lucide-react";
import Link from "next/link";

export default function WithdrawPage() {
    const { user, profile } = useAuth();
    const [amount, setAmount] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        setMessage(null);

        try {
            const formData = new FormData();
            formData.append("userId", user.id);
            formData.append("amount", amount);
            if (file) {
                formData.append("proof", file);
            }

            const result = await createWithdrawalAction(null, formData);

            if (result.success) {
                setMessage(result.message);
                setAmount("");
                setFile(null);
            } else {
                setMessage(result.message);
            }
        } catch (error) {
            console.error(error);
            setMessage("An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    if (profile?.role === 'leader') {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                    <AlertCircle className="h-12 w-12 text-muted-foreground" />
                    <h2 className="text-xl font-bold">Admin Restricted</h2>
                    <p className="text-muted-foreground">Administrators cannot submit withdrawal requests.</p>
                    <Link href="/dashboard">
                        <Button variant="outline">Return to Dashboard</Button>
                    </Link>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-md mx-auto space-y-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Withdraw Funds</h2>
                    <p className="text-muted-foreground">Submit a withdrawal request with proof.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>New Withdrawal Request</CardTitle>
                        <CardDescription>Enter the amount you have withdrawn and attach the proof of transfer/receipt.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {message && (
                            <div className={`mb-6 p-4 rounded text-sm ${message.includes("Success") ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"}`}>
                                {message}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="amount">Withdrawal Amount ($)</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="amount"
                                        type="number"
                                        placeholder="0.00"
                                        step="0.01"
                                        className="pl-9"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="proof">Proof of Withdrawal</Label>
                                <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors cursor-pointer"
                                    onClick={() => document.getElementById('proof')?.click()}>
                                    <input
                                        id="proof"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                        required
                                    />
                                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                                    <span className="text-sm text-muted-foreground">
                                        {file ? file.name : "Click to upload screenshot"}
                                    </span>
                                </div>
                            </div>

                            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Submit Request"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
