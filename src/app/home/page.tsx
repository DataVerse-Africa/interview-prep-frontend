"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ArrowRight,
    Briefcase,
    Plus,
    Loader2,
    User,
    FileText,
    Settings
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usersApi } from "@/lib/api/users";
import { sessionsApi } from "@/lib/api/sessions";
import { UserStatsCard } from "@/components/stats";
import { SessionCard } from "@/components/session";
import type { UserStats } from "@/types/user";
import type { Session } from "@/types/session";
import { toast } from "sonner";

export default function HomePage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const [stats, setStats] = useState<UserStats | null>(null);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        console.log("[Home] Auth state:", { authLoading, isAuthenticated, userId: user?.user_id });
        if (authLoading) return;

        if (!isAuthenticated || !user) {
            console.log("[Home] Not authenticated, redirecting...");
            router.push("/auth/sign-in");
            return;
        }

        console.log("[Home] Authenticated, fetching data...");
        fetchData();
    }, [authLoading, isAuthenticated, user, router]);

    const fetchData = async () => {
        setIsLoading(true);

        // Default stats
        const defaultStats: UserStats = {
            total_sessions: 0,
            active_sessions: 0,
            completed_sessions: 0,
            draft_sessions: 0,
            total_questions_answered: 0,
            average_score: 0,
            current_streak: 0,
            longest_streak: 0,
            total_practice_days: 0,
        };

        // Fetch stats (don't fail if this errors)
        try {
            const statsData = await usersApi.getStats();
            setStats(statsData);
        } catch (error) {
            console.error("Failed to fetch stats:", error);
            setStats(defaultStats);
        }

        // Fetch sessions (don't fail if this errors)
        try {
            const sessionsData = await sessionsApi.listSessions();
            setSessions(sessionsData.slice(0, 3));
        } catch (error) {
            console.error("Failed to fetch sessions:", error);
            setSessions([]);
        }

        setIsLoading(false);
    };

    const handleNewSession = () => {
        router.push("/sessions/manage");
    };

    const handleContinueSession = (session: Session) => {
        if (session.status === "draft") {
            router.push(`/onboarding?session_id=${session.id}`);
        } else {
            router.push(`/dashboard?session=${session.id}`);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-muted-foreground font-medium">Verifying session...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-muted-foreground font-medium">Redirecting to login...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-background to-indigo-50/30 dark:from-blue-950/10 dark:via-background dark:to-indigo-950/10">
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                            Welcome back, {user.email?.split("@")[0]}! 👋
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Ready to ace your next interview?
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" asChild>
                            <Link href="/profile">
                                <User className="h-4 w-4 mr-2" />
                                Profile
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="mb-8">
                    <UserStatsCard stats={stats!} isLoading={isLoading} />
                </div>

                {/* Recent Sessions */}
                <Card className="shadow-lg border-indigo-200 dark:border-indigo-800">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Briefcase className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                    Recent Sessions
                                </CardTitle>
                                <CardDescription className="mt-1">
                                    Continue where you left off
                                </CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" asChild>
                                    <Link href="/sessions/manage">
                                        Manage All
                                        <ArrowRight className="h-4 w-4 ml-2" />
                                    </Link>
                                </Button>
                                <Button
                                    onClick={handleNewSession}
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    New Session
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Briefcase className="h-16 w-16 mx-auto mb-4 opacity-30" />
                                <p className="font-medium">No sessions yet</p>
                                <p className="text-sm mb-4">
                                    Create your first session to start practicing
                                </p>
                                <Button
                                    onClick={handleNewSession}
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Your First Session
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {sessions.map((session) => (
                                    <SessionCard
                                        key={session.id}
                                        session={session}
                                        onRename={() => router.push("/sessions/manage")}
                                        onDelete={() => router.push("/sessions/manage")}
                                        onArchive={() => router.push("/sessions/manage")}
                                        onContinue={handleContinueSession}
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Links */}
                <div className="grid md:grid-cols-3 gap-4 mt-6">
                    <Card className="hover:border-blue-300 dark:hover:border-blue-700 transition-colors cursor-pointer" onClick={() => router.push("/profile")}>
                        <CardContent className="flex items-center gap-3 py-4">
                            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="font-medium">Profile</p>
                                <p className="text-sm text-muted-foreground">Manage your account</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="hover:border-green-300 dark:hover:border-green-700 transition-colors cursor-pointer" onClick={() => router.push("/profile")}>
                        <CardContent className="flex items-center gap-3 py-4">
                            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                                <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="font-medium">Resumes</p>
                                <p className="text-sm text-muted-foreground">Manage your resumes</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="hover:border-purple-300 dark:hover:border-purple-700 transition-colors cursor-pointer" onClick={() => router.push("/sessions/manage")}>
                        <CardContent className="flex items-center gap-3 py-4">
                            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                                <Briefcase className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="font-medium">All Sessions</p>
                                <p className="text-sm text-muted-foreground">View & manage sessions</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
