"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, Activity, AlertCircle, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const LeaderDashboard = () => (
    <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Network Value</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">$0.00</div>
                    <p className="text-xs text-muted-foreground">No active investments</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Members</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">Start adding members</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Today&apos;s Profit</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">$0.00</div>
                    <p className="text-xs text-muted-foreground">0/0 members logged</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Alerts</CardTitle>
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">System healthy</p>
                </CardContent>
            </Card>
        </div>

        <Card className="h-[400px] flex flex-col items-center justify-center border-dashed">
            <div className="text-center space-y-4">
                <div className="bg-muted/50 p-4 rounded-full inline-block">
                    <Activity className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                    <h3 className="text-lg font-medium">No Activity Yet</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto mt-1">
                        Your network is silent. Invite members to start tracking investments and profits.
                    </p>
                </div>
            </div>
        </Card>
    </div>
);

const MemberDashboard = () => (
    <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Current Investment</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">$0.00</div>
                    <p className="text-xs text-muted-foreground">No active plans</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">$0.00</div>
                    <p className="text-xs text-muted-foreground">Lifetime earnings</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Daily Status</CardTitle>
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-muted-foreground">Pending</div>
                    <p className="text-xs text-muted-foreground">Waiting for investment</p>
                </CardContent>
            </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-dashed flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="bg-primary/10 p-4 rounded-full">
                    <PlusCircle className="h-8 w-8 text-primary" />
                </div>
                <div>
                    <h3 className="font-bold text-lg">Start Investing</h3>
                    <p className="text-sm text-muted-foreground mb-4">Upload your proof of investment to begin.</p>
                    <Link href="/dashboard/invest">
                        <Button>Upload Proof</Button>
                    </Link>
                </div>
            </Card>
            <Card className="border-dashed flex flex-col items-center justify-center p-8 text-center space-y-4 opacity-50">
                <div className="bg-muted p-4 rounded-full">
                    <Activity className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                    <h3 className="font-bold text-lg">Log Profit</h3>
                    <p className="text-sm text-muted-foreground mb-4">You can log profits once your investment is active.</p>
                    <Button variant="secondary" disabled>Log Profit</Button>
                </div>
            </Card>
        </div>
    </div>
);

export default function DashboardPage() {
    const { user, isLoading } = useAuth();

    if (isLoading) return null;

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Today&apos;s Highlights</h2>
                    <p className="text-muted-foreground">
                        {user?.role === 'leader' ? 'Administrator View' : 'Member Overview'}
                    </p>
                </div>

                {user?.role === 'leader' ? <LeaderDashboard /> : <MemberDashboard />}
            </div>
        </DashboardLayout>
    );
}
