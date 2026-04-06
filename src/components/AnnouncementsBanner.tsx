"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Announcement } from "@/types";
import { Megaphone, Info, AlertTriangle, CheckCircle2, X } from "lucide-react";

export function AnnouncementsBanner() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchAnnouncements = async () => {
            const { data, error } = await supabase
                .from('announcements')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });
            
            if (!error && data) {
                setAnnouncements(data as Announcement[]);
            }
        };

        fetchAnnouncements();

        // Optional: subscribe to real-time changes
        const subscription = supabase
            .channel('announcements_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => {
                fetchAnnouncements();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);

    const dismissAnnouncement = (id: string) => {
        setDismissedIds(prev => {
            const newSet = new Set(prev);
            newSet.add(id);
            return newSet;
        });
    };

    const visibleAnnouncements = announcements.filter(a => !dismissedIds.has(a.id));

    if (visibleAnnouncements.length === 0) return null;

    return (
        <div className="space-y-4 mb-6">
            {visibleAnnouncements.map(announcement => {
                let config = {
                    icon: Info,
                    bgColor: "bg-blue-500/10",
                    borderColor: "border-blue-500/20",
                    textColor: "text-blue-500",
                    iconColor: "text-blue-500",
                };

                if (announcement.type === 'warning') {
                    config = {
                        icon: AlertTriangle,
                        bgColor: "bg-amber-500/10",
                        borderColor: "border-amber-500/20",
                        textColor: "text-amber-500",
                        iconColor: "text-amber-500",
                    };
                } else if (announcement.type === 'success') {
                    config = {
                        icon: CheckCircle2,
                        bgColor: "bg-emerald-500/10",
                        borderColor: "border-emerald-500/20",
                        textColor: "text-emerald-500",
                        iconColor: "text-emerald-500",
                    };
                }

                const Icon = config.icon;

                return (
                    <div 
                        key={announcement.id} 
                        className={`relative rounded-xl border ${config.borderColor} ${config.bgColor} p-4 pr-12 animate-fade-in-up flex items-start gap-3 w-full`}
                    >
                        <div className={`mt-0.5 ${config.iconColor}`}>
                            {announcement.type === 'info' ? <Megaphone className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">
                                {announcement.content}
                            </p>
                            <p className="text-[10px] opacity-70 mt-1">
                                {new Date(announcement.created_at).toLocaleDateString()}
                            </p>
                        </div>
                        <button 
                            onClick={() => dismissAnnouncement(announcement.id)}
                            className="absolute right-3 top-4 h-6 w-6 rounded-md hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center transition-colors text-muted-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
