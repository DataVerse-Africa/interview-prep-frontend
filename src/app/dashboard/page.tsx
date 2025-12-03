"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Brain, 
  Target, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  BookOpen,
  LogOut,
  User,
  Loader2,
  Shield,
  Plus,
  Calendar
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { alignmentApi } from "@/lib/api/alignment";
import { dashboardApi } from "@/lib/api/dashboard";
import { onboardingApi } from "@/lib/api/onboarding";
import { sessionsApi } from "@/lib/api/sessions";
import { ApiClientError } from "@/lib/api/client";
import { toast } from "sonner";

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
  const [alignmentScore, setAlignmentScore] = useState<number | null>(null);
  const [alignmentData, setAlignmentData] = useState<any>(null);
  const [onboardingData, setOnboardingData] = useState<any>(null);
  const [sessionDetails, setSessionDetails] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [progressData, setProgressData] = useState<any>(null);
  const [insightsData, setInsightsData] = useState<any>(null);

  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated || !user?.user_id) {
      router.push("/auth/sign-in");
      return;
    }

    const fetchSessions = async () => {
      try {
        setIsLoading(true);
        const userSessions = await dashboardApi.getUserSessions(user.user_id);
        // Sort sessions by date (newest first)
        const sortedSessions = userSessions.sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setSessions(sortedSessions);
        
        if (sortedSessions.length > 0) {
          // SessionSummary uses session_id
          setSelectedSessionId(sortedSessions[0].session_id);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error fetching sessions:", error);
        toast.error("Failed to load sessions");
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, [user, router, authLoading, isAuthenticated]);

  useEffect(() => {
    if (!user?.user_id || !selectedSessionId) return;

    const fetchSessionData = async () => {
      setIsSessionLoading(true);
      try {
        // 1. Fetch Alignment Data for Session
        try {
          const alignment = await alignmentApi.getAlignmentForSession(user.user_id, selectedSessionId);
          setAlignmentData(alignment);
          setAlignmentScore(alignment.overall_score);
        } catch (error) {
          console.error("Error fetching alignment for session:", error);
          setAlignmentData(null);
          setAlignmentScore(null);
        }

        // 2. Fetch Session Details (to link to onboarding info if needed)
        // For now, we might need to rely on global onboarding or try to find the specific one
        // Ideally we'd have an endpoint to get onboarding by session ID or from the session details
        try {
           // Try to get detailed session info which might have more metadata
           const details = await dashboardApi.getSessionDetails(user.user_id, selectedSessionId);
           setSessionDetails(details);
           
           // If session details contains onboarding info/preparation time, use it.
           // Otherwise, we might have to fallback or leave it as "N/A" if not linked clearly in API yet.
           // Let's assume sessionDetails might have it or we fallback to latest for now if not found
           if (details && details.onboarding_data) {
             setOnboardingData(details.onboarding_data);
           } else {
             // Fallback: try to match session's onboarding_id with a record
             // retrieving all records is heavy but let's try getting latest as a fallback for UI stability
             // Ideally: await onboardingApi.getOnboardingRecord(session.onboarding_id)
             const latest = await onboardingApi.getLatestOnboardingRecord(user.user_id);
             setOnboardingData(latest);
           }
        } catch (error) {
          console.error("Error fetching session details:", error);
        }

        // 3. Fetch User Performance, Progress, and Insights
        try {
          const [perf, prog, insights] = await Promise.all([
            dashboardApi.getUserPerformance(user.user_id),
            dashboardApi.getUserProgress(user.user_id),
            dashboardApi.getUserInsights(user.user_id)
          ]);
          setPerformanceData(perf);
          setProgressData(prog);
          setInsightsData(insights);
        } catch (error) {
          console.error("Error fetching user stats:", error);
        }

      } catch (error) {
        console.error("Error fetching session data:", error);
        toast.error("Failed to refresh dashboard for selected session");
      } finally {
        setIsLoading(false);
        setIsSessionLoading(false);
      }
    };

    fetchSessionData();
  }, [selectedSessionId, user]);

  const matchedSkills = alignmentData?.matched_items?.map((item: any) => item.skill || item.name) || [];
  const missingSkills = alignmentData?.gaps?.map((gap: any) => ({
    skill: gap.skill || gap.name || gap,
    priority: gap.priority || "medium" as "high" | "medium" | "low"
  })) || [];
  const improvements = alignmentData?.resume_improvements || alignmentData?.recommendations || [];
  const communicationGaps = alignmentData?.dimension_scores ? 
    Object.entries(alignmentData.dimension_scores).map(([area, score]: [string, any]) => ({
      area,
      score: Math.round(score * 100),
      feedback: alignmentData.score_rationales?.[area] || `Score: ${Math.round(score * 100)}%`
    })) : [];

  const readinessScore = sessionDetails?.session_metrics?.accuracy_rate !== undefined
    ? Math.round(sessionDetails.session_metrics.accuracy_rate * 100)
    : sessionDetails?.average_score 
    ? Math.round(sessionDetails.average_score * 100) 
    : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50/30 via-background to-indigo-50/30 dark:from-blue-950/10 dark:via-background dark:to-indigo-950/10">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-background to-indigo-50/30 dark:from-blue-950/10 dark:via-background dark:to-indigo-950/10">
      <header className="border-b bg-background/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              InterviewAI
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/profile">
              <Button variant="ghost" size="icon" className="hover:bg-muted" title="Profile">
              <User className="h-5 w-5" />
            </Button>
            </Link>
            <Link href="/admin">
              <Button variant="ghost" size="icon" className="hover:bg-muted" title="Admin">
                <Shield className="h-5 w-5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={logout} className="hover:bg-muted" title="Sign Out">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Track your interview preparation progress</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            {sessions.length > 0 && (
              <div className="w-full md:w-64">
                <Select 
                  value={selectedSessionId || ""} 
                  onValueChange={(value) => setSelectedSessionId(value)}
                >
                  <SelectTrigger className="w-full bg-background border-blue-200 dark:border-blue-800">
                    <SelectValue placeholder="Select a session" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map((session) => (
                      <SelectItem key={session.session_id || session.id} value={session.session_id || session.id}>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{session.session_name || "Untitled Session"}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(session.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <Button 
              onClick={() => router.push("/onboarding")}
              className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white hover:shadow-lg transition-all whitespace-nowrap"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Session
            </Button>
          </div>
        </div>

        {isSessionLoading ? (
           <div className="flex justify-center py-12">
             <Loader2 className="h-8 w-8 animate-spin text-primary" />
           </div>
        ) : selectedSessionId ? (
          <>
      

        <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200/50 dark:border-blue-800/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold">Alignment Score</CardTitle>
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500">
                    <Target className="h-5 w-5 text-white" />
                  </div>
            </CardHeader>
            <CardContent>
                  <div className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                    {alignmentScore !== null ? `${Math.round(alignmentScore)}%` : "N/A"}
                  </div>
                  <Progress value={alignmentScore || 0} className="h-3 mb-2" />
                  <p className="text-xs text-muted-foreground">
                    {alignmentScore === null 
                      ? "No alignment data available"
                      : alignmentScore >= 80 
                      ? "Excellent match! 🎉" 
                      : alignmentScore >= 60 
                      ? "Good match with room for improvement" 
                      : "Needs significant improvement"}
              </p>
            </CardContent>
          </Card>

              <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-cyan-50/50 to-blue-50/50 dark:from-cyan-950/20 dark:to-blue-950/20 border-cyan-200/50 dark:border-cyan-800/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold">Preparation Time</CardTitle>
                  <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
            </CardHeader>
            <CardContent>
                  <div className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
                    {onboardingData?.preparation_time_days ? `${onboardingData.preparation_time_days} Days` : "N/A"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                Recommended: 2-3 hours daily practice
              </p>
            </CardContent>
          </Card>

              <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200/50 dark:border-purple-800/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold">Interview Readiness</CardTitle>
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
            </CardHeader>
            <CardContent>
                  <div className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                    {readinessScore}%
                  </div>
                  <Progress value={readinessScore} className="h-3 mb-2" />
                  <p className="text-xs text-muted-foreground">
                {readinessScore >= 80 ? "Ready for interviews!" : "Keep practicing to improve readiness"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Performance & Insights Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="border-2 border-orange-100 dark:border-orange-900/50 bg-gradient-to-br from-orange-50/50 to-amber-50/50 dark:from-orange-950/20 dark:to-amber-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Brain className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                Study Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                    {progressData?.current_streak || 0} Days
                  </div>
                  <p className="text-xs text-muted-foreground">Current Streak</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                    {progressData?.total_questions_answered || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Questions Answered</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-100 dark:border-green-900/50 bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                Performance Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              {insightsData?.key_strength ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Top Strength:</span>
                    <span className="font-medium text-green-700 dark:text-green-400">{insightsData.key_strength}</span>
                  </div>
                  {insightsData?.focus_area && (
                     <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Focus Area:</span>
                      <span className="font-medium text-orange-600 dark:text-orange-400">{insightsData.focus_area}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Complete more sessions to unlock personalized insights.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
              <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                <TabsList className="inline-flex w-full md:grid md:grid-cols-5 bg-muted/50 p-1 min-w-max md:min-w-0">
                  <TabsTrigger 
                    value="overview" 
                    className="data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap px-4 py-2 text-sm md:text-base flex-shrink-0 md:flex-shrink"
                  >
                    <span className="hidden sm:inline">Session Overview</span>
                    <span className="sm:hidden">Overview</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="skills" 
                    className="data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap px-4 py-2 text-sm md:text-base flex-shrink-0 md:flex-shrink"
                  >
                    <span className="hidden sm:inline">Skills Analysis</span>
                    <span className="sm:hidden">Skills</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="gaps" 
                    className="data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap px-4 py-2 text-sm md:text-base flex-shrink-0 md:flex-shrink"
                  >
                    <span className="hidden sm:inline">Gap Analysis</span>
                    <span className="sm:hidden">Gaps</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="improvements" 
                    className="data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap px-4 py-2 text-sm md:text-base flex-shrink-0 md:flex-shrink"
                  >
                    <span className="hidden sm:inline">Improvements</span>
                    <span className="sm:hidden">Improve</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="communication" 
                    className="data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap px-4 py-2 text-sm md:text-base flex-shrink-0 md:flex-shrink"
                  >
                    <span className="hidden sm:inline">Communication</span>
                    <span className="sm:hidden">Comm</span>
                  </TabsTrigger>
          </TabsList>
              </div>

          <TabsContent value="overview" className="space-y-6 animate-in fade-in-50">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Questions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{sessionDetails?.session_metrics?.total_questions || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Answered</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{sessionDetails?.session_metrics?.total_answered || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Correct Answers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{sessionDetails?.session_metrics?.total_correct || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {sessionDetails?.session_metrics?.completion_rate ? Math.round(sessionDetails.session_metrics.completion_rate * 100) : 0}%
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Daily Breakdown</CardTitle>
                <CardDescription>Your progress day by day</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sessionDetails?.day_breakdown?.map((day: any) => (
                    <div key={day.day_number} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div>
                        <div className="font-semibold">Day {day.day_number}</div>
                        <div className="text-sm text-muted-foreground">{new Date(day.plan_date).toLocaleDateString()}</div>
                      </div>
                      <div className="flex gap-6 text-sm">
                        <div className="flex flex-col items-center">
                           <span className="font-bold">{day.answered_questions}/{day.total_questions}</span>
                           <span className="text-muted-foreground text-xs">Answered</span>
                        </div>
                         <div className="flex flex-col items-center">
                           <span className="font-bold text-green-600">{day.correct_answers}</span>
                           <span className="text-muted-foreground text-xs">Correct</span>
                        </div>
                        <div className="flex flex-col items-center">
                           <span className="font-bold">{Math.round((day.accuracy_rate || 0) * 100)}%</span>
                           <span className="text-muted-foreground text-xs">Accuracy</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!sessionDetails?.day_breakdown?.length && (
                    <p className="text-muted-foreground text-center py-4">No daily data available yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

              <TabsContent value="skills" className="space-y-6 animate-in fade-in-50">
                <Card className="border-2 shadow-md hover:shadow-lg transition-shadow pt-0">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-green-50/50 dark:from-green-950/20 dark:to-green-950/10 border-b pb-4 pt-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                  Matched Skills & Keywords
                </CardTitle>
                    <CardDescription className="mt-2">
                  Skills from your resume that align with the job description
                </CardDescription>
              </CardHeader>
                  <CardContent className="pt-5">
                    {matchedSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                        {matchedSkills.map((skill: string, index: number) => (
                          <Badge 
                            key={index} 
                            variant="secondary" 
                            className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 px-3 py-1.5 text-sm font-medium hover:scale-105 transition-transform"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1.5" />
                      {skill}
                    </Badge>
                  ))}
                </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 px-4">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                          <Target className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground text-center text-base font-medium mb-2">
                          No matched skills found
                        </p>
                        <p className="text-sm text-muted-foreground text-center max-w-md">
                          This session might not have alignment data yet.
                        </p>
                      </div>
                    )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gaps" className="space-y-6">
                <Card className="pt-0">
                  <CardHeader className="pb-4 pt-4">
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  Missing Requirements
                </CardTitle>
                    <CardDescription className="mt-2">
                  Skills mentioned in the job description but not in your resume
                </CardDescription>
              </CardHeader>
                  <CardContent className="pt-2">
                    {missingSkills.length > 0 ? (
                <div className="space-y-3">
                        {missingSkills.map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <AlertCircle className={`h-4 w-4 ${
                          item.priority === "high" ? "text-red-500" :
                          item.priority === "medium" ? "text-orange-500" :
                          "text-yellow-500"
                        }`} />
                        <span className="font-medium">{item.skill}</span>
                      </div>
                      <Badge variant={
                        item.priority === "high" ? "destructive" :
                        item.priority === "medium" ? "secondary" :
                        "outline"
                      }>
                        {item.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No gaps identified or data not available.
                      </div>
                    )}
              </CardContent>
            </Card>

                <Card className="pt-0">
                  <CardHeader className="pb-4 pt-4">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-500" />
                  Learning Resources
                </CardTitle>
                    <CardDescription className="mt-2">
                  Recommended materials to bridge knowledge gaps
                </CardDescription>
              </CardHeader>
                  <CardContent className="pt-2">
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href="https://graphql.org/learn/" target="_blank" rel="noopener noreferrer">
                      <BookOpen className="h-4 w-4 mr-2" />
                      GraphQL Official Documentation
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href="https://www.docker.com/101-tutorial/" target="_blank" rel="noopener noreferrer">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Docker 101 Tutorial
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href="https://aws.amazon.com/getting-started/" target="_blank" rel="noopener noreferrer">
                      <BookOpen className="h-4 w-4 mr-2" />
                      AWS Getting Started
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="improvements" className="space-y-6">
                <Card className="pt-0">
                  <CardHeader className="pb-4 pt-4">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  Improvement Suggestions
                </CardTitle>
                    <CardDescription className="mt-2">
                  Actionable recommendations to strengthen your profile
                </CardDescription>
              </CardHeader>
                  <CardContent className="pt-2">
                    {improvements.length > 0 ? (
                <ul className="space-y-3">
                        {improvements.map((improvement: string, index: number) => (
                    <li key={index} className="flex gap-3 p-3 border rounded-lg">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <p className="text-sm">{improvement}</p>
                    </li>
                  ))}
                </ul>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No improvement suggestions available.
                      </div>
                    )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="communication" className="space-y-6">
                <Card className="pt-0">
                  <CardHeader className="pb-4 pt-4">
                <CardTitle>Communication Gap Analysis</CardTitle>
                    <CardDescription className="mt-2">
                  How well your resume communicates key competencies required for the role
                </CardDescription>
              </CardHeader>
                  <CardContent className="pt-2">
                    {communicationGaps.length > 0 ? (
                <div className="space-y-6">
                  {communicationGaps.map((gap, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{gap.area}</h4>
                        <span className="text-sm font-medium">{gap.score}%</span>
                      </div>
                      <Progress value={gap.score} />
                      <p className="text-sm text-muted-foreground">{gap.feedback}</p>
                    </div>
                  ))}
                </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No communication analysis available.
                      </div>
                    )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-stretch sm:items-center">
              <Button 
                size="lg" 
                onClick={() => router.push("/sessions")}
                className="h-12 px-6 sm:px-8 text-base font-semibold shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white w-full sm:w-auto"
              >
            Start Practice Interview
          </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => router.push("/sessions")}
                className="h-12 px-6 sm:px-8 text-base font-semibold border-2 hover:bg-muted w-full sm:w-auto"
              >
            View Learning Path
          </Button>
        </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 bg-muted/20 rounded-xl border-2 border-dashed">
            <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
              <Target className="h-10 w-10 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-bold mb-2">No Practice Sessions Yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md text-center">
              Start your first interview prep session to get personalized insights and questions.
            </p>
            <Button 
              onClick={() => router.push("/onboarding")}
              className="h-11 px-8 text-base font-semibold shadow-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white"
            >
              Start New Session
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
