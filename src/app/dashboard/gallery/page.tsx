"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { DailyLog } from "@/types";

export default function GalleryPage() {
    const [logs, setLogs] = useState<DailyLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        const fetchLogs = async () => {
            const { data, error } = await supabase
                .from('daily_logs')
                .select('*, profiles(full_name)')
                .order('log_date', { ascending: false });

            if (error) {
                console.error("Error fetching logs:", error);
            } else {
                setLogs((data || []) as DailyLog[]);
            }
            setLoading(false);
        };

        fetchLogs();
    }, []);

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Profit Gallery</h2>
                    <p className="text-muted-foreground">Review daily profit screenshots from members.</p>
                </div>

                {loading ? (
                    <div className="text-center py-10">Loading gallery...</div>
                ) : (
                    <>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {logs.map((item) => (
                                <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => item.screenshot_url && setSelectedImage(item.screenshot_url)}>
                                    <div className="aspect-video relative bg-muted group">
                                        {item.screenshot_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={item.screenshot_url}
                                                alt={`Result by ${item.profiles?.full_name}`}
                                                className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-muted-foreground">No Image</div>
                                        )}
                                    </div>
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="font-semibold">{item.profiles?.full_name || 'Unknown'}</h3>
                                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" /> {new Date(item.log_date).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <span className="bg-indigo-500/10 text-indigo-500 px-2 py-1 rounded text-xs font-bold">
                                                +${item.profit_amount}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {logs.length === 0 && (
                            <div className="text-center text-muted-foreground py-12 border border-dashed rounded-lg">
                                No logs uploaded yet.
                            </div>
                        )}
                    </>
                )}

                {/* Lightbox Modal */}
                {selectedImage && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setSelectedImage(null)}>
                        <div className="relative max-w-4xl w-full h-auto max-h-[90vh]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={selectedImage} alt="Full view" className="w-full h-full object-contain rounded-lg" />
                            <button className="absolute top-4 right-4 text-white hover:text-gray-300 bg-black/50 rounded-full p-2">
                                Close (Esc)
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
