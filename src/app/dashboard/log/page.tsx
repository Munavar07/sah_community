"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Loader2, CheckCircle, Upload } from "lucide-react";
import { logProfitAction } from "@/app/actions";


export default function LogProfitPage() {
    const { user } = useAuth();
    const [profit, setProfit] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        setMessage(null);

        try {
            if (!file) throw new Error("Please upload a result screenshot.");

            // Client-side size check (4MB)
            if (file.size > 4 * 1024 * 1024) {
                throw new Error("File is too large. Please upload an image smaller than 4MB.");
            }

            // Call Server Action
            const formData = new FormData();
            formData.append("userId", user.id);
            formData.append("profit", profit);
            formData.append("proof", file);
            formData.append("logDate", logDate);

            const result = await logProfitAction(null, formData);

            if (!result || !result.success) {
                throw new Error(result?.message || "An unexpected error occurred on the server.");
            }

            setMessage(result.message);
            setProfit("");
            setFile(null);
        } catch (err) {
            const error = err as Error;
            console.error("Submit Error:", error);
            setMessage(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-2xl mx-auto space-y-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Daily Profit Log</h2>
                    <p className="text-muted-foreground">Record your trading results for today.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Log Today&apos;s Result</CardTitle>
                        <CardDescription>Enter your profit/loss and upload the screenshot.</CardDescription>
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
                                <Label htmlFor="profit">Profit Amount ($)</Label>
                                <Input
                                    id="profit"
                                    type="number"
                                    placeholder="e.g. 50"
                                    step="0.01"
                                    value={profit}
                                    onChange={(e) => setProfit(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="logDate">Profit Date</Label>
                                <Input
                                    id="logDate"
                                    type="date"
                                    value={logDate}
                                    onChange={(e) => setLogDate(e.target.value)}
                                    required
                                />
                                <p className="text-[10px] text-muted-foreground">Select a past date if you are backfilling missed dividends.</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="result">Result Screenshot</Label>
                                <div className="relative">
                                    <Input
                                        id="result"
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                        required
                                        className="pl-9"
                                    />
                                    <Upload className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>

                            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Submit Daily Log"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
