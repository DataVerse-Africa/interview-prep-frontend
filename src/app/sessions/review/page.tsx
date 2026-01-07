"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    ArrowLeft,
    BookOpen,
    CheckCircle2,
    Lock,
    Loader2,
    Calendar,
    Target,
    Award,
    MessageSquare
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { sessionsApi, SessionEvaluations, SessionEvaluationDay, SessionEvaluationQuestion } from "@/lib/api/sessions";
import { toast } from "sonner";

function ReviewContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("session");
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();

    const [evaluations, setEvaluations] = useState<SessionEvaluations | null>(null);
    const [selectedDay, setSelectedDay] = useState<number>(1);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;

        if (!isAuthenticated || !user?.user_id) {
            router.push("/auth/sign-in");
            return;
        }

        if (!sessionId) {
            router.push("/home");
            return;
        }

        loadEvaluations();
    }, [user, router, authLoading, isAuthenticated, sessionId]);

    const loadEvaluations = async () => {
        if (!sessionId) return;

        try {
            setIsLoading(true);
            const data = await sessionsApi.getSessionEvaluations(sessionId);
            setEvaluations(data);

            // Select the first day with answered questions, or day 1
            const firstAnsweredDay = data.days.find(d => d.answered_questions > 0);
            if (firstAnsweredDay) {
                setSelectedDay(firstAnsweredDay.day_number);
            }
        } catch (error) {
            console.error("Error loading evaluations:", error);
            toast.error("Failed to load learning path");
        } finally {
            setIsLoading(false);
        }
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                <p className="text-muted-foreground">Loading learning path...</p>
            </div>
        );
    }

    if (!evaluations) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <Calendar className="h-16 w-16 text-muted-foreground" />
                <h3 className="text-lg font-semibold">No Data Available</h3>
                <p className="text-muted-foreground">Could not load session data.</p>
                <Button onClick={() => router.push("/home")}>Back to Dashboard</Button>
            </div>
        );
    }

    const selectedDayData = evaluations.days.find(d => d.day_number === selectedDay);
    const completedDays = evaluations.days.filter(d => d.answered_questions > 0).length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-background to-indigo-50/30 dark:from-blue-950/10 dark:via-background dark:to-indigo-950/10">
            {/* Header */}
            <header className="border-b bg-background/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/home">
                            <Button variant="ghost" size="icon" className="hover:bg-muted">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                                Learning Path
                            </span>
                            <p className="text-sm text-muted-foreground">{evaluations.session_name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="gap-1">
                            <BookOpen className="h-3 w-3" />
                            {completedDays} / {evaluations.total_days} Days
                        </Badge>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {/* Progress Overview */}
                <Card className="mb-6 border-2 border-blue-200/50 dark:border-blue-800/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5 text-blue-600" />
                            Your Progress
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <Progress
                                value={evaluations.total_questions > 0
                                    ? (evaluations.answered_questions / evaluations.total_questions) * 100
                                    : 0
                                }
                                className="flex-1 h-3"
                            />
                            <span className="text-sm font-medium">
                                {evaluations.total_questions > 0
                                    ? Math.round((evaluations.answered_questions / evaluations.total_questions) * 100)
                                    : 0}%
                            </span>
                        </div>
                        <div className="grid grid-cols-4 gap-4 mt-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">{evaluations.total_questions}</div>
                                <p className="text-xs text-muted-foreground">Total Questions</p>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-indigo-600">{evaluations.answered_questions}</div>
                                <p className="text-xs text-muted-foreground">Answered</p>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">{evaluations.correct_answers}</div>
                                <p className="text-xs text-muted-foreground">Correct</p>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">
                                    {evaluations.overall_score ? Math.round(evaluations.overall_score) : 0}%
                                </div>
                                <p className="text-xs text-muted-foreground">Overall Score</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Day Tabs */}
                <Tabs value={`day-${selectedDay}`} onValueChange={(v) => setSelectedDay(parseInt(v.replace("day-", "")))}>
                    <TabsList className="flex flex-wrap gap-2 h-auto mb-6 bg-muted/50 p-2">
                        {evaluations.days.map((dayData) => {
                            const hasAnswers = dayData.answered_questions > 0;
                            return (
                                <TabsTrigger
                                    key={dayData.day_number}
                                    value={`day-${dayData.day_number}`}
                                    disabled={!hasAnswers}
                                    className={`flex items-center gap-2 px-4 py-2 ${hasAnswers
                                        ? "data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                                        : "opacity-50 cursor-not-allowed"
                                        }`}
                                >
                                    {hasAnswers ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <Lock className="h-4 w-4" />
                                    )}
                                    Day {dayData.day_number}
                                </TabsTrigger>
                            );
                        })}
                    </TabsList>

                    {/* Day Content */}
                    {evaluations.days.map((dayData) => (
                        <TabsContent key={dayData.day_number} value={`day-${dayData.day_number}`}>
                            {dayData.answered_questions > 0 ? (
                                <div className="space-y-6">
                                    {/* Day Summary */}
                                    <Card className="border-2 border-green-200/50 dark:border-green-800/50">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Award className="h-5 w-5 text-green-600" />
                                                Day {dayData.day_number} Summary
                                            </CardTitle>
                                            <CardDescription>
                                                Your performance and feedback for this day
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-4 gap-4">
                                                <Card>
                                                    <CardContent className="pt-4">
                                                        <div className="text-2xl font-bold text-blue-600">{dayData.total_questions}</div>
                                                        <p className="text-xs text-muted-foreground">Questions</p>
                                                    </CardContent>
                                                </Card>
                                                <Card>
                                                    <CardContent className="pt-4">
                                                        <div className="text-2xl font-bold text-indigo-600">{dayData.answered_questions}</div>
                                                        <p className="text-xs text-muted-foreground">Answered</p>
                                                    </CardContent>
                                                </Card>
                                                <Card>
                                                    <CardContent className="pt-4">
                                                        <div className="text-2xl font-bold text-green-600">{dayData.correct_answers}</div>
                                                        <p className="text-xs text-muted-foreground">Correct</p>
                                                    </CardContent>
                                                </Card>
                                                <Card>
                                                    <CardContent className="pt-4">
                                                        <div className="text-2xl font-bold text-purple-600">
                                                            {dayData.average_score ? Math.round(dayData.average_score) : 0}%
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">Avg Score</p>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Questions Review */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <BookOpen className="h-5 w-5 text-blue-600" />
                                                Questions & Feedback
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {dayData.questions.filter(q => q.is_answered).length > 0 ? (
                                                dayData.questions.filter(q => q.is_answered).map((question, idx) => (
                                                    <Card
                                                        key={question.question_id}
                                                        className={`border-2 ${question.is_correct
                                                            ? "border-green-200 bg-green-50/50 dark:border-green-900/50 dark:bg-green-950/20"
                                                            : "border-orange-200 bg-orange-50/50 dark:border-orange-900/50 dark:bg-orange-950/20"
                                                            }`}
                                                    >
                                                        <CardHeader className="pb-2">
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <Badge
                                                                        variant="outline"
                                                                        className={`capitalize ${question.difficulty === "easy" ? "border-green-500 text-green-700" :
                                                                            question.difficulty === "medium" ? "border-yellow-500 text-yellow-700" :
                                                                                "border-red-500 text-red-700"
                                                                            }`}
                                                                    >
                                                                        {question.difficulty}
                                                                    </Badge>
                                                                    <Badge variant="outline">{question.topic}</Badge>
                                                                    <span className="text-sm text-muted-foreground">Q{idx + 1}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Badge variant={question.is_correct ? "default" : "destructive"}>
                                                                        {question.is_correct ? "Correct" : "Needs Improvement"}
                                                                    </Badge>
                                                                    <span className="font-bold text-lg">
                                                                        {Math.round(question.score)}%
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <CardTitle className="text-base mt-3">
                                                                {question.question_text}
                                                            </CardTitle>
                                                        </CardHeader>
                                                        <CardContent className="space-y-4">
                                                            {/* Your Answer */}
                                                            <div className="bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                                                                <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-2">
                                                                    <MessageSquare className="h-4 w-4" />
                                                                    Your Answer
                                                                </p>
                                                                <p className="text-sm">{question.user_answer || "No answer provided"}</p>
                                                            </div>

                                                            {/* Correct Answer (if different) */}
                                                            {question.correct_answer && !question.is_correct && (
                                                                <div className="bg-green-50/50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200/50 dark:border-green-800/50">
                                                                    <p className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
                                                                        <CheckCircle2 className="h-4 w-4" />
                                                                        Expected Answer
                                                                    </p>
                                                                    <p className="text-sm">{question.correct_answer}</p>
                                                                </div>
                                                            )}

                                                            {/* AI Feedback */}
                                                            <div className="bg-muted/50 p-4 rounded-lg">
                                                                <p className="text-sm font-semibold mb-2">AI Feedback</p>
                                                                <p className="text-sm text-muted-foreground">{question.feedback}</p>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))
                                            ) : (
                                                <p className="text-center text-muted-foreground py-8">
                                                    No answered questions for this day yet
                                                </p>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            ) : (
                                <Card className="border-2 border-dashed">
                                    <CardContent className="flex flex-col items-center justify-center py-16">
                                        <Lock className="h-16 w-16 text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-semibold mb-2">Day {dayData.day_number} Not Yet Completed</h3>
                                        <p className="text-muted-foreground text-center mb-4">
                                            Complete this day's practice to unlock the review
                                        </p>
                                        <Button onClick={() => router.push("/sessions")}>
                                            Continue Practice
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>
                    ))}
                </Tabs>

                {/* Empty State */}
                {completedDays === 0 && (
                    <Card className="border-2 border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Completed Days Yet</h3>
                            <p className="text-muted-foreground text-center mb-4">
                                Start practicing to see your learning path and review your progress
                            </p>
                            <Button onClick={() => router.push("/sessions")}>
                                Start Practice
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </main>
        </div>
    );
}

export default function ReviewPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                    <p className="text-muted-foreground font-medium">Loading...</p>
                </div>
            </div>
        }>
            <ReviewContent />
        </Suspense>
    );
}
