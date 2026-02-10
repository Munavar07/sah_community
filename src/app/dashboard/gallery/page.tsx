"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, User, ChevronRight, Search, Loader2, ArrowLeft, Image as ImageIcon, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { DailyLog } from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DailyLogWithProfile extends Omit<DailyLog, 'profiles'> {
    profiles: {
        full_name: string | null;
    } | null | undefined;
}

export default function GalleryPage() {
    const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));
    const [logs, setLogs] = useState<DailyLogWithProfile[]>([]);
    const [totalDailyProfit, setTotalDailyProfit] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<DailyLogWithProfile | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        const fetchLogsByDate = async () => {
            setLoading(true);
            try {
                const start = `${selectedDate}T00:00:00.000Z`;
                const end = `${selectedDate}T23:59:59.999Z`;

                const { data, error } = await supabase
                    .from('daily_logs')
                    .select('*, profiles(full_name)')
                    .gte('log_date', start)
                    .lte('log_date', end)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                const fetchedLogs = (data || []) as DailyLogWithProfile[];
                setLogs(fetchedLogs);

                // Calculate total profit for this date
                const total = fetchedLogs.reduce((sum, log) => sum + Number(log.profit_amount), 0);
                setTotalDailyProfit(total);

                if (selectedLog && !fetchedLogs.find(l => l.id === selectedLog.id)) {
                    setSelectedLog(null);
                }
            } catch (error) {
                console.error("Error fetching logs:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLogsByDate();
    }, [selectedDate, selectedLog]);

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Profit Gallery</h2>
                        <p className="text-muted-foreground">Review daily results by date and member.</p>
                    </div>

                    <div className="flex items-center gap-3 bg-card p-3 rounded-lg border shadow-sm">
                        <Label htmlFor="date-filter" className="text-sm font-medium whitespace-nowrap">Filter Date:</Label>
                        <Input
                            id="date-filter"
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-auto h-9"
                        />
                    </div>
                </div>

                {/* Daily Summary Card */}
                <Card className="bg-emerald-500/10 border-emerald-500/20 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top duration-500">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="bg-emerald-500 p-3 rounded-xl text-white shadow-lg shadow-emerald-500/20">
                                    <TrendingUp className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Total Profit for Selected Date</p>
                                    <h3 className="text-3xl font-bold text-emerald-600 dark:text-emerald-500">
                                        ${totalDailyProfit.toLocaleString()}
                                    </h3>
                                </div>
                            </div>
                            <div className="hidden md:block">
                                <Badge variant="secondary" className="bg-white/50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
                                    {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-6 md:grid-cols-12 min-h-[500px]">
                    <Card className="md:col-span-4 h-fit border-indigo-500/10 shadow-sm overflow-hidden">
                        <CardHeader className="pb-3 border-b bg-muted/20">
                            <CardTitle className="text-lg flex items-center gap-2 font-bold">
                                <User className="h-5 w-5 text-indigo-500" />
                                Members Logged
                            </CardTitle>
                            <CardDescription>
                                {logs.length} entries on this date
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="flex justify-center py-10">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : logs.length > 0 ? (
                                <div className="divide-y divide-border">
                                    {logs.map((log) => (
                                        <button
                                            key={log.id}
                                            onClick={() => setSelectedLog(log)}
                                            className={`w-full flex items-center justify-between p-4 text-left transition-all hover:bg-accent/50 ${selectedLog?.id === log.id ? "bg-accent border-l-4 border-indigo-500 pl-3 shadow-inner" : ""
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${selectedLog?.id === log.id ? "bg-indigo-500 text-white" : "bg-indigo-500/10 text-indigo-500"
                                                    }`}>
                                                    {log.profiles?.full_name?.charAt(0) || "U"}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-sm">{log.profiles?.full_name || "Unknown Member"}</span>
                                                    <span className="text-[10px] text-muted-foreground italic">
                                                        {new Date(log.log_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-emerald-500">+${Number(log.profit_amount).toLocaleString()}</span>
                                                <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${selectedLog?.id === log.id ? "rotate-90" : ""}`} />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground text-sm flex flex-col items-center gap-2">
                                    <div className="bg-muted p-2 rounded-full">
                                        <Search className="h-6 w-6 opacity-20" />
                                    </div>
                                    No profits logged on this date.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-8 overflow-hidden h-fit border-indigo-500/10 shadow-sm min-h-[400px]">
                        {selectedLog ? (
                            <div className="animate-in fade-in slide-in-from-right duration-300">
                                <CardHeader className="border-b bg-muted/30">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-xl font-bold leading-none">{selectedLog.profiles?.full_name}</CardTitle>
                                            <CardDescription className="flex items-center gap-2 mt-2">
                                                <Calendar className="h-3 w-3" />
                                                Verified log for {new Date(selectedLog.log_date).toLocaleDateString()}
                                            </CardDescription>
                                        </div>
                                        <div className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-lg font-extrabold shadow-lg shadow-emerald-500/20 flex flex-col items-end">
                                            <span className="text-[10px] uppercase tracking-wider opacity-80">Profit</span>
                                            +${Number(selectedLog.profit_amount).toLocaleString()}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">
                                    <div className="relative group rounded-xl overflow-hidden border-2 border-dashed border-muted shadow-lg bg-black/5 aspect-auto max-h-[600px] flex justify-center">
                                        {selectedLog.screenshot_url ? (
                                            <>
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={selectedLog.screenshot_url}
                                                    alt="Profit Result"
                                                    className="max-width-full h-auto object-contain cursor-zoom-in group-hover:scale-[1.01] transition-transform duration-500"
                                                    onClick={() => setSelectedImage(selectedLog.screenshot_url!)}
                                                />
                                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="secondary" size="sm" onClick={() => setSelectedImage(selectedLog.screenshot_url!)} className="shadow-lg backdrop-blur-md bg-white/80">
                                                        <ImageIcon className="h-4 w-4 mr-2" /> View Full Image
                                                    </Button>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center p-20 text-muted-foreground">
                                                <ImageIcon className="h-12 w-12 mb-4 opacity-20" />
                                                <p>No screenshot available</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center pt-2">
                                        <p className="text-xs text-muted-foreground italic">
                                            Evidence provided by member on {new Date(selectedLog.created_at).toLocaleString()}
                                        </p>
                                        <Button variant="outline" size="sm" onClick={() => setSelectedLog(null)} className="md:hidden">
                                            <ArrowLeft className="h-4 w-4 mr-2" /> Back to members
                                        </Button>
                                    </div>
                                </CardContent>
                            </div>
                        ) : (
                            <CardContent className="flex flex-col items-center justify-center h-[500px] text-center text-muted-foreground p-10">
                                <div className="bg-muted p-8 rounded-full mb-4 shadow-inner">
                                    <Search className="h-12 w-12 opacity-20" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground">Member Result Preview</h3>
                                <p className="max-w-[280px] mt-2 text-sm">
                                    Select a team member from the left panel to inspect their profit proof and verified earnings for this date.
                                </p>
                            </CardContent>
                        )}
                    </Card>
                </div>

                {selectedImage && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-300" onClick={() => setSelectedImage(null)}>
                        <div className="relative max-w-[95vw] max-h-[95vh] flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={selectedImage} alt="Full view" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl transition-transform" />
                            <Button
                                className="absolute -top-12 right-0 md:top-4 md:-right-16 text-white bg-white/10 hover:bg-white/20 border-white/20"
                                variant="outline"
                                onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
