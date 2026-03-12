"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Loader2, CheckCircle, Upload, Sparkles } from "lucide-react";
import { logProfitAction } from "@/app/actions";
import { extractProfitAmount } from "@/app/ai-actions";


export default function LogProfitPage() {
    const { user } = useAuth();
    const [profit, setProfit] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [existingDates, setExistingDates] = useState<string[]>([]);

    useEffect(() => {
        const fetchDates = async () => {
            if (!user?.id) return;
            const { data } = await supabase
                .from('daily_logs')
                .select('log_date')
                .eq('member_id', user.id);
            if (data) {
                setExistingDates(data.map(log => log.log_date));
            }
        };
        fetchDates();
    }, [user?.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (existingDates.includes(logDate)) {
            const isConfirmed = window.confirm(`You already have a profit log for ${new Date(logDate).toLocaleDateString()}.\n\nAre you sure you want to add another one for this same date?`);
            if (!isConfirmed) return;
        }

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
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            // Re-fetch existing dates after successful submission
            if (!existingDates.includes(logDate)) {
                setExistingDates(prev => [...prev, logDate]);
            }

        } catch (err) {
            const error = err as Error;
            console.error("Submit Error:", error);
            setMessage(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleAICalculate = async () => {
        if (!file) {
            setMessage("Error: Please select a screenshot first.");
            return;
        }

        setAiLoading(true);
        setMessage(null);

        try {
            const formData = new FormData();
            formData.append("proof", file);

            const result = await extractProfitAmount(null, formData);

            if (result.success && result.amount > 0) {
                setProfit(result.amount.toString());
                setMessage(result.message || "AI successfully calculated the profit.");
            } else {
                setMessage(`AI Error: ${result.message}`);
            }
        } catch (error: any) {
            console.error("AI Calculation Error:", error);
            setMessage(`Error: ${error.message || "Failed to process image with AI."}`);
        } finally {
            setAiLoading(false);
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
                                        ref={fileInputRef}
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                        required
                                        className="pl-9"
                                    />
                                    <Upload className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                                </div>
                                {file && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full mt-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300"
                                        onClick={handleAICalculate}
                                        disabled={aiLoading}
                                    >
                                        {aiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                        {aiLoading ? "Analyzing Image..." : "Calculate Profit with AI"}
                                    </Button>
                                )}
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
