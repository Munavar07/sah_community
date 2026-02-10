"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { DailyLog } from "@/types";

interface DailyLogWithProfile extends Omit<DailyLog, 'profiles'> {
    profiles: {
        full_name: string | null;
    } | null | undefined;
}


export default function GalleryPage() {
    const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));
    const [logs, setLogs] = useState<DailyLogWithProfile[]>([]);
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

                    <div className="flex items-center gap-3 bg-card p-3 rounded-lg border">
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

                <div className="grid gap-6 md:grid-cols-12 min-h-[500px]">
                    <Card className="md:col-span-4 h-fit">
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <User className="h-5 w-5 text-indigo-500" />
                                Members Logged
                            </CardTitle>
                            <CardDescription>
                                {logs.length} entries for {new Date(selectedDate).toLocaleDateString()}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="flex justify-center py-10">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : logs.length > 0 ? (
                                <div className="divide-y">
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
                                                <span className="font-medium text-sm">{log.profiles?.full_name || "Unknown Member"}</span>
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
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
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

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { User, ChevronRight, Search, Loader2, ArrowLeft, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";


