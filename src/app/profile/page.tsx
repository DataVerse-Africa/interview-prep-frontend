"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Calendar,
  LogOut,
  ArrowLeft,
  Loader2,
  Settings,
  Shield,
  Clock,
  CheckCircle2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { sessionManager } from "@/lib/utils/session";
import { ResumeManager } from "@/components/resume";

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
  const [sessionDuration, setSessionDuration] = useState<number>(0);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !user) {
      router.push("/auth/sign-in");
      return;
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    // Update session duration every minute
    const updateDuration = () => {
      const duration = sessionManager.getSessionDuration();
      setSessionDuration(duration);
    };

    updateDuration();
    const interval = setInterval(updateDuration, 60000);

    return () => clearInterval(interval);
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-blue-50/30 via-background to-indigo-50/30 dark:from-blue-950/10 dark:via-background dark:to-indigo-950/10">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-muted-foreground font-medium">Verifying session...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-blue-50/30 via-background to-indigo-50/30 dark:from-blue-950/10 dark:via-background dark:to-indigo-950/10">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-muted-foreground font-medium">Redirecting to login...</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours < 24) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours} hours`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days} days`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-background to-indigo-50/30 dark:from-blue-950/10 dark:via-background dark:to-indigo-950/10">
      <header className="border-b bg-background/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/home">
              <Button variant="ghost" size="icon" className="hover:bg-muted">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              Profile
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/home">
              <Button variant="ghost" size="sm">
                Dashboard
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={logout} className="hover:bg-muted">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="md:col-span-1 shadow-lg border-blue-200 dark:border-blue-800 p-0">
            <CardHeader className="text-center pb-4 pt-5 px-6">
              <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mb-4 shadow-lg">
                <User className="h-12 w-12 text-white" />
              </div>
              <CardTitle className="text-xl font-bold">{user.email}</CardTitle>
              <CardDescription className="mt-2 text-muted-foreground">
                Interview Prep User
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 px-6 pb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                    <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-sm font-medium">Status</span>
                </div>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 px-3 py-1">
                  Active
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                    <Clock className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-sm font-medium">Session</span>
                </div>
                <span className="text-sm font-medium">
                  {sessionDuration === 0 ? "0 minutes" : formatDuration(sessionDuration)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Account Details */}
          <Card className="md:col-span-2 shadow-lg border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-4 pt-5">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Account Information
              </CardTitle>
              <CardDescription className="mt-2">
                Your account details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-2">
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      Email Address
                    </div>
                    <div className="text-base font-semibold">
                      {user.email}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                    <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      Member Since
                    </div>
                    <div className="text-base font-semibold">
                      {formatDate(user.created_at)}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      User ID
                    </div>
                    <div className="text-base font-mono text-sm">
                      {user.user_id}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-400 dark:text-blue-300 dark:border-blue-700 dark:hover:bg-blue-900"
                  onClick={() => router.push('/home')}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 dark:text-red-300 dark:border-red-700 dark:hover:bg-red-900"
                  onClick={logout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Session Info Card */}
        <Card className="mt-6 shadow-lg border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-4 pt-5">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Session Information
            </CardTitle>
            <CardDescription className="mt-2">
              Current session details and activity
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Session Duration
                </div>
                <div className="text-lg font-semibold">
                  {formatDuration(sessionDuration)}
                </div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Session Status
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resume Management */}
        <div className="mt-6">
          <ResumeManager />
        </div>
      </div>
    </div>
  );
}

