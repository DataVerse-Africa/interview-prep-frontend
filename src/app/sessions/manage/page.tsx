"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { SessionManager } from "@/components/session";

export default function SessionsManagePage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();

    useEffect(() => {
        if (authLoading) return;

        if (!isAuthenticated || !user) {
            router.push("/auth/sign-in");
            return;
        }
    }, [authLoading, isAuthenticated, user, router]);

    if (authLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-background to-indigo-50/30 dark:from-blue-950/10 dark:via-background dark:to-indigo-950/10">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/home">
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                                Sessions
                            </h1>
                            <p className="text-muted-foreground">
                                Create and manage your interview prep sessions
                            </p>
                        </div>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href="/home">
                            <Home className="h-4 w-4 mr-2" />
                            Dashboard
                        </Link>
                    </Button>
                </div>

                {/* Session Manager */}
                <SessionManager />
            </div>
        </div>
    );
}
