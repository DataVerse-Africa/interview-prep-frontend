"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Target,
    CheckCircle2,
    AlertCircle,
    Loader2,
    ArrowRight,
    ArrowLeft,
    Sparkles,
    FileText,
    TrendingUp,
    Briefcase,
    GraduationCap,
    MessageSquare,
    ClipboardList,
    Lightbulb,
    Zap,
    BookOpen,
    Home
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { alignmentApi } from "@/lib/api/alignment";
import { sessionsApi } from "@/lib/api/sessions";
import { onboardingApi } from "@/lib/api/onboarding";
import { ApiClientError } from "@/lib/api/client";
import { toast } from "sonner";

const dimensionIcons: Record<string, any> = {
    skills: Zap,
    experience: Briefcase,
    communication: MessageSquare,
    responsibilities: ClipboardList,
    education: GraduationCap,
};

const dimensionColors: Record<string, string> = {
    skills: "from-blue-500 to-cyan-500",
    experience: "from-purple-500 to-pink-500",
    communication: "from-green-500 to-emerald-500",
    responsibilities: "from-orange-500 to-amber-500",
    education: "from-indigo-500 to-blue-500",
};

function AlignmentContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();

    const [alignmentData, setAlignmentData] = useState<any>(null);
    const [onboardingData, setOnboardingData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [expandedDimension, setExpandedDimension] = useState<string | null>(null);
    const [isGeneratingAlignment, setIsGeneratingAlignment] = useState(false);

    useEffect(() => {
        if (authLoading) return;

        if (!isAuthenticated || !user?.user_id) {
            router.push("/auth/sign-in");
            return;
        }

        fetchData();
    }, [user, router, authLoading, isAuthenticated]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const sessionIdFromUrl = searchParams.get("session_id");

            const onboarding = await onboardingApi.getLatestOnboardingRecord();
            setOnboardingData(onboarding);

            try {
                let alignment;
                if (sessionIdFromUrl) {
                    alignment = await alignmentApi.getAlignmentForSession(sessionIdFromUrl);
                } else {
                    alignment = await alignmentApi.getAlignmentForLatestSession();
                }
                setAlignmentData(alignment);
            } catch (alignError) {
                console.log("No alignment found, user can generate one");
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Failed to load data");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateAlignment = async () => {
        setIsGeneratingAlignment(true);
        try {
            const sessionIdFromUrl = searchParams.get("session_id");
            const alignment = await alignmentApi.generateAlignmentReport(sessionIdFromUrl);
            setAlignmentData(alignment);
            toast.success("Alignment analysis complete!");
        } catch (error) {
            console.error("Error generating alignment:", error);
            if (error instanceof ApiClientError) {
                toast.error(error.data.message || "Failed to generate alignment");
            } else {
                toast.error("Failed to generate alignment analysis");
            }
        } finally {
            setIsGeneratingAlignment(false);
        }
    };

    const handleGenerateQuestions = async () => {
        if (!onboardingData) {
            toast.error("Please complete onboarding first");
            router.push("/onboarding");
            return;
        }

        setIsGenerating(true);
        try {
            const session = await sessionsApi.createSession({
                name: `${onboardingData.role} - Interview Prep`,
                role: onboardingData.role,
            });

            toast.success("Questions generated! Redirecting to practice...");
            setTimeout(() => router.push("/sessions"), 1000);
        } catch (error) {
            console.error("Error creating session:", error);
            if (error instanceof ApiClientError) {
                toast.error(error.data.message || "Failed to create session");
            } else {
                toast.error("Failed to generate questions");
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-600";
        if (score >= 60) return "text-amber-600";
        return "text-red-600";
    };

    const getScoreLabel = (score: number) => {
        if (score >= 80) return "Excellent Match";
        if (score >= 60) return "Good Match";
        return "Needs Improvement";
    };

    const overallScore = alignmentData?.overall_score || 0;

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                    <p className="text-muted-foreground font-medium">Analyzing your profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950">
            {/* Navigation */}
            <nav className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/home" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                            <ArrowLeft className="h-4 w-4" />
                            <span>Back to Home</span>
                        </Link>
                    </div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Resume Alignment
                    </h1>
                    <div className="w-24" />
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Hero Section with Score */}
                {alignmentData ? (
                    <>
                        <div className="grid lg:grid-cols-3 gap-8 mb-10">
                            {/* Main Score Card */}
                            <div className="lg:col-span-2">
                                <Card className="border-0 shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
                                    <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 text-white">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="text-blue-100 text-sm font-medium mb-1">Target Role</p>
                                                <h2 className="text-3xl font-bold mb-2">{onboardingData?.role || alignmentData?.raw_context?.role || "Your Target Role"}</h2>
                                                <p className="text-blue-100">
                                                    Preparation: {onboardingData?.preparation_time_days || alignmentData?.raw_context?.preparation_time_days || "N/A"} days
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-6xl font-bold">{Math.round(overallScore)}%</div>
                                                <p className="text-blue-100 font-medium">{getScoreLabel(overallScore)}</p>
                                            </div>
                                        </div>
                                        <div className="mt-6">
                                            <div className="bg-white/20 rounded-full h-3 overflow-hidden">
                                                <div
                                                    className="bg-white h-full rounded-full transition-all duration-1000"
                                                    style={{ width: `${overallScore}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            {/* Quick Stats */}
                            <div className="space-y-4">
                                <Card className="border-0 shadow-lg bg-white dark:bg-slate-900">
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                                                <CheckCircle2 className="h-6 w-6 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold">{alignmentData.matched_items?.length || 0}</p>
                                                <p className="text-sm text-muted-foreground">Skills Matched</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="border-0 shadow-lg bg-white dark:bg-slate-900">
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                                                <AlertCircle className="h-6 w-6 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold">{alignmentData.gaps?.length || 0}</p>
                                                <p className="text-sm text-muted-foreground">Areas to Improve</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Dimension Scores */}
                        {alignmentData.dimension_scores && (
                            <div className="mb-10">
                                <h3 className="text-2xl font-bold mb-6">Score Breakdown</h3>
                                <p className="text-muted-foreground text-sm mb-4">Click a card to see the full analysis</p>
                                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {Object.entries(alignmentData.dimension_scores).map(([dimension, score]: [string, any]) => {
                                        const Icon = dimensionIcons[dimension] || Target;
                                        const gradient = dimensionColors[dimension] || "from-gray-500 to-gray-600";
                                        const isExpanded = expandedDimension === dimension;
                                        return (
                                            <Card
                                                key={dimension}
                                                className={`border-0 shadow-lg bg-white dark:bg-slate-900 cursor-pointer transition-all duration-300 ${isExpanded ? 'shadow-2xl ring-2 ring-blue-500 lg:col-span-2' : 'hover:shadow-xl'
                                                    }`}
                                                onClick={() => setExpandedDimension(isExpanded ? null : dimension)}
                                            >
                                                <CardContent className="p-6">
                                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4`}>
                                                        <Icon className="h-6 w-6 text-white" />
                                                    </div>
                                                    <h4 className="font-semibold capitalize mb-2">{dimension}</h4>
                                                    <div className="flex items-end gap-2 mb-3">
                                                        <span className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}%</span>
                                                    </div>
                                                    <Progress value={score} className="h-2" />
                                                    {alignmentData.score_rationales?.[dimension] && (
                                                        <div className="mt-3">
                                                            <p className={`text-xs text-muted-foreground transition-all duration-300 ${isExpanded ? '' : 'line-clamp-2'
                                                                }`}>
                                                                {alignmentData.score_rationales[dimension]}
                                                            </p>
                                                            <button
                                                                className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-2"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setExpandedDimension(isExpanded ? null : dimension);
                                                                }}
                                                            >
                                                                {isExpanded ? 'Show less' : 'Read more →'}
                                                            </button>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Matched Skills & Gaps - Side by Side */}
                        <div className="grid lg:grid-cols-2 gap-8 mb-10">
                            {/* Matched Skills */}
                            <Card className="border-0 shadow-lg bg-white dark:bg-slate-900">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                                            <CheckCircle2 className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">Matched Requirements</CardTitle>
                                            <CardDescription>Skills & experience that align with the job</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {alignmentData.matched_items?.length > 0 ? (
                                        <div className="space-y-4">
                                            {alignmentData.matched_items.map((item: any, idx: number) => (
                                                <div key={idx} className="p-4 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                                                    <div className="flex items-start gap-3">
                                                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                                                        <div className="flex-1">
                                                            <p className="font-medium text-green-900 dark:text-green-100">
                                                                {item.requirement || item.skill || item.name || item}
                                                            </p>

                                                            {/* Category & Priority */}
                                                            <div className="flex flex-wrap gap-2 mt-2">
                                                                {item.category && (
                                                                    <Badge variant="outline" className="text-xs capitalize bg-green-100/50 border-green-300">
                                                                        {item.category}
                                                                    </Badge>
                                                                )}
                                                                {item.priority && (
                                                                    <Badge variant="secondary" className="text-xs capitalize bg-green-200 text-green-800">
                                                                        {item.priority}
                                                                    </Badge>
                                                                )}
                                                                {item.similarity && (
                                                                    <Badge className="bg-green-600 text-white text-xs">
                                                                        {Math.round(item.similarity * 100)}% match
                                                                    </Badge>
                                                                )}
                                                            </div>

                                                            {/* Resume Context */}
                                                            {item.resume_context && (
                                                                <div className="mt-3 p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-green-200/50">
                                                                    <p className="text-xs font-medium text-green-800 dark:text-green-200 mb-1">
                                                                        📋 Found in your resume:
                                                                    </p>
                                                                    <div className="text-sm text-green-700 dark:text-green-300">
                                                                        {item.resume_context.title && (
                                                                            <span className="font-medium">{item.resume_context.title}</span>
                                                                        )}
                                                                        {item.resume_context.company && (
                                                                            <span className="text-green-600 dark:text-green-400"> @ {item.resume_context.company}</span>
                                                                        )}
                                                                        {item.resume_context.type && (
                                                                            <span className="text-xs ml-2 text-green-500">({item.resume_context.type})</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Resume Snippet */}
                                                            {item.resume_snippet && (
                                                                <div className="mt-3 p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-green-200/50">
                                                                    <p className="text-xs font-medium text-green-800 dark:text-green-200 mb-1">
                                                                        💡 Evidence from resume:
                                                                    </p>
                                                                    <p className="text-sm text-green-700 dark:text-green-300 italic">
                                                                        "{item.resume_snippet}"
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <p className="text-muted-foreground">No matched requirements found</p>
                                            <p className="text-sm text-muted-foreground mt-1">Complete your resume to improve matches</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Gaps - ALL of them */}
                            <Card className="border-0 shadow-lg bg-white dark:bg-slate-900">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                                            <AlertCircle className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">Areas to Improve</CardTitle>
                                            <CardDescription>Requirements that need attention</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {alignmentData.gaps?.length > 0 ? (
                                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                                            {alignmentData.gaps.map((gap: any, idx: number) => (
                                                <div key={idx} className={`p-4 rounded-xl border ${gap.priority === 'critical'
                                                    ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
                                                    : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
                                                    }`}>
                                                    <div className="flex items-start gap-3">
                                                        <AlertCircle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${gap.priority === 'critical' ? 'text-red-600' : 'text-amber-600'
                                                            }`} />
                                                        <div className="flex-1">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <p className={`font-medium ${gap.priority === 'critical'
                                                                    ? 'text-red-900 dark:text-red-100'
                                                                    : 'text-amber-900 dark:text-amber-100'
                                                                    }`}>
                                                                    {gap.requirement || gap.skill || gap.name || gap}
                                                                </p>
                                                                <Badge variant={gap.priority === 'critical' ? 'destructive' : 'secondary'} className="text-xs flex-shrink-0">
                                                                    {gap.priority || 'medium'}
                                                                </Badge>
                                                            </div>
                                                            {gap.category && (
                                                                <Badge variant="outline" className="mt-2 text-xs capitalize">
                                                                    {gap.category}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground text-center py-8">No gaps identified - great job!</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Recommendations */}
                        {alignmentData.recommendations?.length > 0 && (
                            <div className="mb-10">
                                <h3 className="text-2xl font-bold mb-6">Quick Recommendations</h3>
                                <div className="grid md:grid-cols-3 gap-6">
                                    {alignmentData.recommendations.map((rec: string, idx: number) => (
                                        <Card key={idx} className="border-0 shadow-lg bg-white dark:bg-slate-900 hover:shadow-xl transition-shadow">
                                            <CardContent className="p-6">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-4">
                                                    <Lightbulb className="h-5 w-5 text-white" />
                                                </div>
                                                <p className="text-sm">{rec}</p>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Resume Improvements */}
                        {alignmentData.resume_improvements?.length > 0 && (
                            <div className="mb-10">
                                <h3 className="text-2xl font-bold mb-6">Resume Improvements</h3>
                                <Card className="border-0 shadow-lg bg-white dark:bg-slate-900">
                                    <CardContent className="p-6">
                                        <div className="space-y-4">
                                            {alignmentData.resume_improvements.map((improvement: string, idx: number) => (
                                                <div key={idx} className="p-4 rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800">
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center flex-shrink-0">
                                                            <span className="text-sm font-bold text-white">{idx + 1}</span>
                                                        </div>
                                                        <p className="text-sm leading-relaxed whitespace-pre-line flex-1">{improvement}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Analysis Summary */}
                        {alignmentData.explanation && (
                            <div className="mb-10">
                                <h3 className="text-2xl font-bold mb-6">Analysis Summary</h3>
                                <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
                                    <CardContent className="p-8">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                                                <Sparkles className="h-6 w-6 text-white" />
                                            </div>
                                            <p className="text-base leading-relaxed whitespace-pre-line">{alignmentData.explanation}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* CTA Section */}
                        <Card className="border-0 shadow-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white overflow-hidden">
                            <CardContent className="p-10 text-center relative">
                                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L2c+PC9zdmc+')] opacity-30" />
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-6">
                                        <Sparkles className="h-8 w-8" />
                                    </div>
                                    <h3 className="text-3xl font-bold mb-3">Ready to Practice?</h3>
                                    <p className="text-lg text-white/80 mb-8 max-w-lg mx-auto">
                                        Generate personalized interview questions based on your resume analysis and start practicing.
                                    </p>
                                    <Button
                                        size="lg"
                                        onClick={handleGenerateQuestions}
                                        disabled={isGenerating}
                                        className="h-14 px-10 text-lg font-semibold bg-white text-indigo-600 hover:bg-white/90 shadow-xl"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="mr-2 h-5 w-5" />
                                                Generate Interview Questions
                                                <ArrowRight className="ml-2 h-5 w-5" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                ) : (
                    /* No Alignment Data - Generate CTA */
                    <div className="max-w-2xl mx-auto">
                        <Card className="border-0 shadow-xl bg-white dark:bg-slate-900">
                            <CardContent className="py-16 text-center">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mx-auto mb-6">
                                    <TrendingUp className="h-10 w-10 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold mb-3">Generate Alignment Analysis</h2>
                                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                                    Analyze how your resume matches the job requirements to get personalized insights and recommendations.
                                </p>
                                <Button
                                    size="lg"
                                    onClick={handleGenerateAlignment}
                                    disabled={isGeneratingAlignment}
                                    className="h-12 px-8 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                                >
                                    {isGeneratingAlignment ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Analyzing...
                                        </>
                                    ) : (
                                        <>
                                            <TrendingUp className="mr-2 h-5 w-5" />
                                            Generate Analysis
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function AlignmentPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                    <p className="text-muted-foreground font-medium">Loading...</p>
                </div>
            </div>
        }>
            <AlignmentContent />
        </Suspense>
    );
}
