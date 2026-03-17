"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Download, Loader2, Share2, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { getNetworkData } from "@/app/actions";
import NetworkTree from "@/components/NetworkTree";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NetworkPage() {
    const [networkNodes, setNetworkNodes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

    // Export Modal State
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportStartDate, setExportStartDate] = useState("");
    const [exportEndDate, setExportEndDate] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            const result = await getNetworkData();
            if (result.success) {
                setNetworkNodes(result.nodes || []);
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    const handleExportCSV = () => {
        if (networkNodes.length === 0) {
            alert("No data available to export.");
            return;
        }

        setExporting(true);

        const start = exportStartDate || "0000-00-00";
        const end = exportEndDate || "9999-99-99";

        setTimeout(() => {
            try {
                // Simplified export logic for the breakdown
                const sortedNodes = [...networkNodes].sort((a, b) => b.investment - a.investment);

                const exportList = sortedNodes.map((s, index) => ({
                    "#Rank": index + 1,
                    "Name": s.name,
                    "Email": s.email,
                    "Role": s.role,
                    "Category": s.category || 'Standard',
                    "Active Investment": s.investment.toFixed(2),
                    "Join Date": new Date(s.joinDate).toLocaleDateString()
                }));

                const headers = Object.keys(exportList[0] || {});
                const csvContent = [
                    `Network Growth Report: ${exportStartDate || 'All Time'} to ${exportEndDate || 'Today'}`,
                    '',
                    headers.join(','),
                    ...exportList.map(row => headers.map(h => `"${(row as any)[h] ?? ""}"`).join(','))
                ].join('\n');

                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.setAttribute("href", url);
                link.setAttribute("download", `network_report_${new Date().toISOString().split('T')[0]}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                setIsExportModalOpen(false);
            } catch (error) {
                console.error("Export Error:", error);
                alert("Download failed.");
            } finally {
                setExporting(false);
            }
        }, 50);
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fade-in-up">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="h-6 w-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                <Share2 className="w-3.5 h-3.5 text-emerald-500" />
                            </div>
                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Growth Visualization</span>
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight">Interactive Network</h2>
                        <p className="text-muted-foreground text-sm mt-1">Explore and manage your community hierarchy.</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsExportModalOpen(true)}
                            className="bg-accent/40 border-border/60 hover:bg-accent transition-all rounded-xl h-10 px-4"
                            disabled={loading}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Master Report
                        </Button>
                    </div>
                </div>

                <Card className="border-border/60 bg-card/40 backdrop-blur-sm rounded-3xl overflow-hidden shadow-xl animate-fade-in-up delay-100">
                    <CardHeader className="border-b border-border/60 bg-accent/20 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    Network Genealogy
                                </CardTitle>
                                <CardDescription className="text-xs">Drag and scroll to navigate the structure.</CardDescription>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-accent/60 flex items-center justify-center text-muted-foreground group cursor-help transition-colors hover:text-foreground">
                                <Info className="w-4 h-4" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 bg-transparent">
                        {loading ? (
                            <div className="h-[600px] flex flex-col items-center justify-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                    <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                                </div>
                                <p className="text-sm text-muted-foreground animate-pulse">Mapping network hierarchy...</p>
                            </div>
                        ) : networkNodes.length > 0 ? (
                            <NetworkTree data={networkNodes} />
                        ) : (
                            <div className="h-[600px] flex flex-col items-center justify-center text-center p-8">
                                <div className="h-16 w-16 rounded-2xl bg-accent flex items-center justify-center mb-4">
                                    <Users className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <h3 className="font-bold text-lg">No Network Found</h3>
                                <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-1">
                                    Add members and referrers to see the visual hierarchy of your community.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Export Report Modal */}
                <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
                    <DialogContent className="rounded-3xl border-border/60 bg-card/95 backdrop-blur-xl max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold">Export Network Data</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-5 py-4">
                            <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-[11px] text-emerald-600 dark:text-emerald-400 leading-relaxed">
                                <p>You will receive a CSV file containing all active members, their current investments, and referral links within the selected date range.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="start-date" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Start Date</Label>
                                    <Input
                                        id="start-date"
                                        type="date"
                                        className="rounded-xl bg-accent/40 border-border/60 focus:ring-emerald-500/20"
                                        value={exportStartDate}
                                        onChange={(e) => setExportStartDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="end-date" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">End Date</Label>
                                    <Input
                                        id="end-date"
                                        type="date"
                                        className="rounded-xl bg-accent/40 border-border/60 focus:ring-emerald-500/20"
                                        value={exportEndDate}
                                        onChange={(e) => setExportEndDate(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="flex-col sm:flex-row gap-2 mt-2">
                            <Button variant="ghost" onClick={() => setIsExportModalOpen(false)} className="rounded-xl h-11 flex-1">Cancel</Button>
                            <Button
                                onClick={handleExportCSV}
                                disabled={exporting || networkNodes.length === 0}
                                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl h-11 px-8 flex-1"
                            >
                                {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                                {exporting ? 'Generating...' : 'Download CSV'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}
