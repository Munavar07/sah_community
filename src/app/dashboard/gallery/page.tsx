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
    const [lifetimeProfit, setLifetimeProfit] = useState(0);
    const [dailyTotal, setDailyTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<DailyLogWithProfile | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        const fetchGlobalStats = async () => {
            const { data: logs } = await supabase.from('daily_logs').select('profit_amount');
            const { data: commissions } = await supabase.from('commissions').select('amount');

            const logsTotal = logs?.reduce((sum, log) => sum + Number(log.profit_amount), 0) || 0;
            const commissionsTotal = commissions?.reduce((sum, com) => sum + Number(com.amount), 0) || 0;

            setLifetimeProfit(logsTotal + commissionsTotal);
        };
        fetchGlobalStats();
    }, []);

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

                // Calculate daily total
                const dayTotal = fetchedLogs.reduce((sum, log) => sum + Number(log.profit_amount), 0);
                setDailyTotal(dayTotal);

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
                </div>

                {/* Summary Cards */}
                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="bg-emerald-500/10 border-emerald-500/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-emerald-600 flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" /> Lifetime Network Profit
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-emerald-700">${lifetimeProfit.toLocaleString()}</div>
                            <p className="text-[10px] text-emerald-600/70 mt-1 uppercase tracking-wider font-semibold">Includes Trading & Referrals</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-indigo-500/10 border-indigo-500/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-indigo-600 flex items-center gap-2">
                                <Calendar className="h-4 w-4" /> Selected Date Profit
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex justify-between items-end">
                            <div>
                                <div className="text-3xl font-bold text-indigo-700">${dailyTotal.toLocaleString()}</div>
                                <p className="text-xs text-indigo-600/70 mt-1">Total for {new Date(selectedDate).toLocaleDateString()}</p>
                            </div>
                            <div className="bg-card p-2 rounded-lg border flex items-center gap-2 mb-1">
                                <Label htmlFor="date-filter" className="text-[10px] font-bold uppercase text-muted-foreground">Select Date:</Label>
                                <Input
                                    id="date-filter"
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="w-auto h-8 text-xs border-none focus-visible:ring-0 p-0"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-12 min-h-[500px]">
                    <Card className="md:col-span-4 h-fit">
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <User className="h-5 w-5 text-indigo-500" />
                                Members Logged
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="flex justify-center py-10">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : logs.length > 0 ? (
                                <div className="divide-y overflow-auto max-h-[600px]">
                                    {logs.map((log) => (
                                        <button
                                            key={log.id}
                                            onClick={() => setSelectedLog(log)}
                                            className={`w-full flex items-center justify-between p-4 text-left transition-colors hover:bg-accent/50 ${selectedLog?.id === log.id ? "bg-accent border-l-4 border-indigo-500" : ""
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 text-xs font-bold">
                                                    {log.profiles?.full_name?.charAt(0) || "U"}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm">{log.profiles?.full_name || "Unknown"}</span>
                                                    <span className="text-[10px] text-emerald-600 font-bold">+${Number(log.profit_amount).toLocaleString()}</span>
                                                </div>
                                            </div>
                                            <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${selectedLog?.id === log.id ? "rotate-90" : ""}`} />
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground text-sm">
                                    No profits logged on this date.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-8 overflow-hidden h-fit">
                        {selectedLog ? (
                            <>
                                <CardHeader className="border-b bg-muted/30">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-xl">{selectedLog.profiles?.full_name}</CardTitle>
                                            <CardDescription className="flex items-center gap-2 mt-1">
                                                <Calendar className="h-3 w-3" />
                                                Logged at {new Date(selectedLog.log_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </CardDescription>
                                        </div>
                                        <Badge className="bg-emerald-500 text-white hover:bg-emerald-600 px-3 py-1 text-base">
                                            +${Number(selectedLog.profit_amount).toLocaleString()}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">
                                    <div className="relative group rounded-xl overflow-hidden border shadow-inner bg-black/5 aspect-auto max-h-[600px] flex justify-center">
                                        {selectedLog.screenshot_url ? (
                                            <>
                                                <img
                                                    src={selectedLog.screenshot_url}
                                                    alt="Profit Result"
                                                    className="max-width-full h-auto object-contain cursor-zoom-in"
                                                    onClick={() => setSelectedImage(selectedLog.screenshot_url!)}
                                                />
                                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="secondary" size="sm" onClick={() => setSelectedImage(selectedLog.screenshot_url!)}>
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
                                    <div className="flex justify-end gap-3 pt-2">
                                        <Button variant="outline" size="sm" onClick={() => setSelectedLog(null)} className="md:hidden">
                                            <ArrowLeft className="h-4 w-4 mr-2" /> Back to members
                                        </Button>
                                    </div>
                                </CardContent>
                            </>
                        ) : (
                            <CardContent className="flex flex-col items-center justify-center h-[400px] text-center text-muted-foreground p-10">
                                <div className="bg-muted p-6 rounded-full mb-4">
                                    <Search className="h-10 w-10 opacity-20" />
                                </div>
                                <h3 className="text-lg font-medium text-foreground">Select a member</h3>
                                <p className="max-w-[250px] mt-2">
                                    Choose a name from the list to view their profit logs and screenshots.
                                </p>
                            </CardContent>
                        )}
                    </Card>
                </div>

                {selectedImage && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4" onClick={() => setSelectedImage(null)}>
                        <div className="relative max-w-[95vw] max-h-[95vh] flex items-center justify-center">
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
