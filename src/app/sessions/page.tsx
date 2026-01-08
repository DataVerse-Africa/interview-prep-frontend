"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  BookOpen,
  Send,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  AlertTriangle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { sessionsApi } from "@/lib/api/sessions";
import { questionsApi } from "@/lib/api/questions";
import { evaluationsApi, DifficultyBucketEvaluationOut } from "@/lib/api/evaluations";
import { ApiClientError } from "@/lib/api/client";
import { toast } from "sonner";
import Link from "next/link";

function SessionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionIdFromUrl = searchParams.get("session");
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [currentDay, setCurrentDay] = useState(1);
  const [questions, setQuestions] = useState<any[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<any[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("easy");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Batch answers state
  const [answers, setAnswers] = useState<Record<string, { text: string; timeTaken: number }>>({});
  const [currentAnswerText, setCurrentAnswerText] = useState("");
  const [bucketEvaluation, setBucketEvaluation] = useState<DifficultyBucketEvaluationOut | null>(null);

  // Track completed difficulties for progressive unlock (per current day)
  const [completedDifficulties, setCompletedDifficulties] = useState<Set<string>>(new Set());

  // Track which days have been fully completed (all 3 difficulties done)
  const [completedDays, setCompletedDays] = useState<Set<number>>(new Set());

  // Track total number of practice days for this session
  const [totalPracticeDays, setTotalPracticeDays] = useState<number>(7);

  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeStarted, setTimeStarted] = useState<Date | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !user?.user_id) {
      router.push("/auth/sign-in");
      return;
    }

    fetchSessions();
  }, [user, router, authLoading, isAuthenticated]);

  // Filter questions when questions or difficulty changes
  useEffect(() => {
    if (questions.length > 0) {
      const filtered = questions.filter(
        (q) => q.difficulty?.toLowerCase() === selectedDifficulty.toLowerCase()
      );
      setFilteredQuestions(filtered);
      setCurrentQuestionIndex(0);
      setCurrentAnswerText(answers[filtered[0]?.id]?.text || "");
      setBucketEvaluation(null); // Reset evaluation when difficulty changes

      // Try to fetch existing evaluation for this bucket
      if (user?.user_id && selectedSession && filtered.length > 0) {
        checkExistingEvaluation(filtered);
      }
    }
  }, [questions, selectedDifficulty, selectedSession]);

  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      const userSessions = await sessionsApi.listSessions();
      setSessions(userSessions);
      if (userSessions.length > 0) {
        // Fetch full session details to get target_role_data with preparation_time_days
        try {
          const sessionDetails = await sessionsApi.getSession(userSessions[0].id);
          setSelectedSession(sessionDetails);
        } catch {
          // Fallback to basic session data if details fetch fails
          setSelectedSession(userSessions[0]);
        }
        await loadCompletedDaysFromBackend(userSessions[0].id);
        await loadQuestionsForSession(userSessions[0].id, 1);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast.error("Failed to load sessions");
    } finally {
      setIsLoading(false);
    }
  };

  // Load which days have been fully completed (all 3 difficulties) from the backend
  const loadCompletedDaysFromBackend = async (sessionId: string) => {
    try {
      const evaluations = await sessionsApi.getSessionEvaluations(sessionId);
      const newCompletedDays = new Set<number>();

      // Set total practice days from the API response
      if (evaluations.total_days) {
        setTotalPracticeDays(evaluations.total_days);
        console.log("[Sessions] Total practice days:", evaluations.total_days);
      }

      for (const day of evaluations.days) {
        // Check if this day has all 3 difficulties answered
        const difficulties = new Set(day.questions.filter(q => q.is_answered).map(q => q.difficulty.toLowerCase()));
        const hasEasy = difficulties.has("easy");
        const hasMedium = difficulties.has("medium");
        const hasHard = difficulties.has("hard");

        if (hasEasy && hasMedium && hasHard) {
          newCompletedDays.add(day.day_number);
        }
      }

      setCompletedDays(newCompletedDays);
      console.log("[Sessions] Loaded completed days:", Array.from(newCompletedDays));
    } catch (error) {
      console.warn("[Sessions] Could not load completed days:", error);
      // Not critical - user can still use the app
    }
  };

  const loadQuestionsForSession = async (sessionId: string, dayNumber: number) => {
    if (!user?.user_id) return;

    try {
      setIsLoading(true);
      setIsGenerating(false);

      // Step 1: Try to fetch existing questions
      let dailyPlan;
      try {
        dailyPlan = await questionsApi.getQuestionsForSessionDay(sessionId, dayNumber);
      } catch (fetchError: any) {
        // If 404 or no questions, we'll generate them
        console.log("[Sessions] No existing questions found, will generate...");
        dailyPlan = null;
      }

      // Step 2: If no questions exist, generate them
      if (!dailyPlan || !dailyPlan.questions || dailyPlan.questions.length === 0) {
        setIsGenerating(true);
        toast.info("Generating questions for this session...");

        try {
          dailyPlan = await questionsApi.generateQuestionsForSessionDay(sessionId, dayNumber);
          toast.success("Questions generated successfully!");
        } catch (genError) {
          console.error("Error generating questions:", genError);
          toast.error("Failed to generate questions. Please try again.");
          setIsLoading(false);
          setIsGenerating(false);
          return;
        }
      }

      setQuestions(dailyPlan.questions || []);
      setCurrentDay(dayNumber);
      setAnswers({}); // Reset answers for new session/day
      setTimeStarted(new Date());
    } catch (error) {
      console.error("Error loading questions:", error);
      toast.error("Failed to load questions");
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
    }
  };

  const checkExistingEvaluation = async (currentFilteredQuestions: any[]) => {
    if (!user?.user_id || !selectedSession) return;

    try {
      // We only need to check if we have a bucket evaluation
      // Assuming the API returns 404 or null if not evaluated
      const evalData = await evaluationsApi.getDifficultyBucketEvaluation(
        selectedSession.id,
        currentDay,
        selectedDifficulty
      );

      if (evalData) {
        setBucketEvaluation(evalData);
        // Mark this difficulty as completed
        setCompletedDifficulties(prev => new Set([...prev, selectedDifficulty.toLowerCase()]));
      }
    } catch (error) {
      // Ignore 404s, means not evaluated yet
      // console.log("No existing evaluation found");
    }
  };

  const saveCurrentAnswer = () => {
    const currentQuestion = filteredQuestions[currentQuestionIndex];
    if (!currentQuestion) return;

    const timeTaken = timeStarted
      ? Math.floor((new Date().getTime() - timeStarted.getTime()) / 1000)
      : 0;

    // Add to existing time if we are revisiting
    const existingTime = answers[currentQuestion.id]?.timeTaken || 0;

    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: {
        text: currentAnswerText,
        timeTaken: existingTime + timeTaken
      }
    }));
  };

  const handleNextQuestion = () => {
    saveCurrentAnswer();

    if (currentQuestionIndex < filteredQuestions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setCurrentAnswerText(answers[filteredQuestions[nextIndex].id]?.text || "");
      setTimeStarted(new Date());
    }
  };

  const handlePreviousQuestion = () => {
    saveCurrentAnswer();

    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);
      setCurrentAnswerText(answers[filteredQuestions[prevIndex].id]?.text || "");
      setTimeStarted(new Date());
    }
  };

  const handleSubmitBucket = async () => {
    saveCurrentAnswer(); // Save the last answer

    if (!user?.user_id || !selectedSession) return;

    // Minimum character requirement per answer
    const MIN_ANSWER_LENGTH = 10;

    // Build final answers map including current answer
    const finalAnswers: Record<string, { text: string; timeTaken: number }> = { ...answers };
    const currentQ = filteredQuestions[currentQuestionIndex];
    if (currentQ) {
      const timeTaken = timeStarted
        ? Math.floor((new Date().getTime() - timeStarted.getTime()) / 1000)
        : 0;
      finalAnswers[currentQ.id] = {
        text: currentAnswerText,
        timeTaken: (finalAnswers[currentQ.id]?.timeTaken || 0) + timeTaken
      };
    }

    // Validate that all answers meet minimum length requirement
    const shortAnswers = filteredQuestions.filter(q => {
      const answerText = finalAnswers[q.id]?.text || "";
      return answerText.trim().length < MIN_ANSWER_LENGTH;
    });

    if (shortAnswers.length > 0) {
      toast.error(
        `Please provide at least ${MIN_ANSWER_LENGTH} characters for each answer. ${shortAnswers.length} question(s) need more content.`
      );
      // Navigate to the first question with insufficient answer
      const firstShortIndex = filteredQuestions.findIndex(q => {
        const answerText = finalAnswers[q.id]?.text || "";
        return answerText.trim().length < MIN_ANSWER_LENGTH;
      });
      if (firstShortIndex >= 0) {
        setCurrentQuestionIndex(firstShortIndex);
        setCurrentAnswerText(finalAnswers[filteredQuestions[firstShortIndex].id]?.text || "");
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        difficulty: selectedDifficulty,
        answers: filteredQuestions.map(q => ({
          question_id: q.id,
          answer_text: q.id === filteredQuestions[currentQuestionIndex].id ? currentAnswerText : (answers[q.id]?.text || ""),
          time_taken_seconds: q.id === filteredQuestions[currentQuestionIndex].id
            ? (answers[q.id]?.timeTaken || 0) + (timeStarted ? Math.floor((new Date().getTime() - timeStarted.getTime()) / 1000) : 0)
            : (answers[q.id]?.timeTaken || 0)
        }))
      };

      const result = await evaluationsApi.evaluateDifficultyBucket(
        selectedSession.id,
        currentDay,
        selectedDifficulty,
        payload
      );

      setBucketEvaluation(result);
      toast.success("Answers evaluated successfully!");

      // Mark this difficulty as completed (prevents re-submission)
      const newCompletedDifficulties = new Set([...completedDifficulties, selectedDifficulty.toLowerCase()]);
      setCompletedDifficulties(newCompletedDifficulties);

      // Check if all 3 difficulties are now complete for this day
      const allDifficultiesComplete = ["easy", "medium", "hard"].every(d => newCompletedDifficulties.has(d));

      if (allDifficultiesComplete) {
        // Mark this day as fully completed
        setCompletedDays(prev => new Set([...prev, currentDay]));
        toast.success(`Day ${currentDay} completed! 🎉`);

        // Pre-generate next day's questions in background (fire and forget)
        const nextDay = currentDay + 1;

        if (nextDay <= totalPracticeDays) {
          questionsApi.generateQuestionsForSessionDay(selectedSession.id, nextDay)
            .then(() => console.log(`[Sessions] Day ${nextDay} questions pre-generated`))
            .catch((err) => console.warn(`[Sessions] Day ${nextDay} pre-generation failed:`, err));
        }
      }
    } catch (error) {
      console.error("Error submitting answers:", error);
      toast.error("Failed to evaluate answers");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getQuestionText = (q: any) => {
    return q.question || q.question_data?.question_text || q.question_data?.question || "Question";
  };

  if (isLoading && questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        {isGenerating ? (
          <div className="text-center">
            <p className="text-lg font-medium text-foreground">Generating your interview questions...</p>
            <p className="text-sm text-muted-foreground mt-1">This may take a moment</p>
          </div>
        ) : (
          <p className="text-muted-foreground">Loading questions...</p>
        )}
      </div>
    );
  }

  const currentQuestion = filteredQuestions[currentQuestionIndex];

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
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                Practice Sessions
              </span>
              {selectedSession && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedSession.session_name || "Practice Session"}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="space-y-4">
            {/* Session Info Hero Card */}
            {selectedSession && (
              <Card className="shadow-lg border-0 overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white">
                <CardContent className="pt-5 pb-4 px-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-white/70">Day {currentDay}</p>
                      <h3 className="font-bold text-lg leading-tight">
                        {selectedSession.session_name || "Practice Session"}
                      </h3>
                    </div>
                  </div>
                  {selectedSession.target_role_data && (
                    <div className="flex items-center gap-2 text-xs text-white/80">
                      <span>🎯 {selectedSession.target_role_data.role_title || "Target Role"}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Day Navigation */}
            {selectedSession && (
              <Card className="shadow-md border-2 border-slate-200/50 dark:border-slate-800/50 overflow-hidden">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Practice Days
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-3 px-4">
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {Array.from({ length: totalPracticeDays }, (_, i) => i + 1).map((day) => {
                      const isCurrentDay = currentDay === day;
                      const isDayCompleted = completedDays.has(day);
                      // Day 1 is always unlocked
                      // Day N+1 only unlocks after Day N is fully completed (all 3 difficulties)
                      const isUnlocked = day === 1 || completedDays.has(day - 1);

                      return (
                        <button
                          key={day}
                          onClick={() => {
                            if (isUnlocked && selectedSession) {
                              setCurrentDay(day);
                              // Don't reset if returning to a completed day
                              if (!isDayCompleted) {
                                setCompletedDifficulties(new Set());
                              }
                              loadQuestionsForSession(selectedSession.id, day);
                            }
                          }}
                          disabled={!isUnlocked}
                          className={`flex-shrink-0 w-10 h-10 rounded-lg font-bold transition-all ${isCurrentDay
                            ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg"
                            : isDayCompleted
                              ? "bg-green-100 text-green-700 border-2 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700"
                              : isUnlocked
                                ? "bg-muted hover:bg-muted/80 text-foreground"
                                : "bg-muted/30 text-muted-foreground/50 cursor-not-allowed"
                            }`}
                        >
                          {isDayCompleted ? "✓" : day}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Complete all 3 difficulties to unlock the next day
                  </p>
                </CardContent>
              </Card>
            )}

            <Card className="shadow-md border-2 border-slate-200/50 dark:border-slate-800/50 overflow-hidden p-0">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Difficulty Level
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0 pb-3 px-4">
                {[
                  { key: "easy", label: "Easy", icon: "🌱", color: "green", bgClass: "from-green-500 to-emerald-500" },
                  { key: "medium", label: "Medium", icon: "🔥", color: "yellow", bgClass: "from-yellow-500 to-orange-500" },
                  { key: "hard", label: "Hard", icon: "⚡", color: "red", bgClass: "from-red-500 to-pink-500" }
                ].map((difficulty, index) => {
                  const isSelected = selectedDifficulty === difficulty.key;
                  const isCompleted = completedDifficulties.has(difficulty.key);
                  const previousDifficulty = index > 0 ? ["easy", "medium", "hard"][index - 1] : null;
                  const isUnlocked = index === 0 || completedDifficulties.has(previousDifficulty || "");

                  return (
                    <button
                      key={difficulty.key}
                      onClick={() => isUnlocked && setSelectedDifficulty(difficulty.key)}
                      disabled={!isUnlocked}
                      className={`w-full p-3 rounded-xl transition-all duration-200 flex items-center gap-3 ${isSelected
                        ? `bg-gradient-to-r ${difficulty.bgClass} text-white shadow-lg scale-[1.02]`
                        : isUnlocked
                          ? "bg-muted/50 hover:bg-muted hover:scale-[1.01]"
                          : "bg-muted/30 opacity-50 cursor-not-allowed"
                        }`}
                    >
                      <span className="text-2xl">{!isUnlocked ? "🔒" : difficulty.icon}</span>
                      <span className="font-semibold flex-1 text-left">{difficulty.label}</span>
                      {isCompleted && <CheckCircle2 className={`h-5 w-5 ${isSelected ? "text-white" : "text-green-500"}`} />}
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Progress Card - Compact */}
            <Card className="shadow-md border-2 border-slate-200/50 dark:border-slate-800/50 overflow-hidden">
              <CardContent className="pt-4 pb-4 px-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Progress</span>
                  <Badge variant="secondary" className="font-bold">
                    {filteredQuestions.length > 0 ? currentQuestionIndex + 1 : 0} / {filteredQuestions.length}
                  </Badge>
                </div>
                <Progress
                  value={filteredQuestions.length > 0 ? ((currentQuestionIndex + 1) / filteredQuestions.length) * 100 : 0}
                  className="h-2"
                />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>Question {filteredQuestions.length > 0 ? currentQuestionIndex + 1 : 0}</span>
                  <span>{filteredQuestions.length > 0 ? Math.round(((currentQuestionIndex + 1) / filteredQuestions.length) * 100) : 0}% complete</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {bucketEvaluation ? (
              // Evaluation Results View
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card className="border-2 shadow-lg border-blue-200/50 dark:border-blue-800/50">
                  <CardHeader className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border-b border-blue-200/30 dark:border-blue-800/30 pb-4">
                    <CardTitle className="text-2xl font-bold">Evaluation Results</CardTitle>
                    <CardDescription>
                      Overall Score: <span className="font-bold text-primary">{Math.round(bucketEvaluation.overall_score)}%</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="font-medium mb-2">Feedback:</p>
                      <p className="text-muted-foreground">{bucketEvaluation.bucket_feedback}</p>
                    </div>

                    <div className="space-y-4">
                      {bucketEvaluation.question_evaluations.map((evalResult, idx) => {
                        const question = filteredQuestions.find(q => q.id === evalResult.question_id);
                        return (
                          <Card key={idx} className={`border ${evalResult.is_correct ? 'border-green-200 bg-green-50/50' : 'border-orange-200 bg-orange-50/50'}`}>
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-start">
                                <Badge variant={evalResult.is_correct ? "default" : "destructive"} className={evalResult.is_correct ? "bg-green-600 hover:bg-green-700" : ""}>
                                  {evalResult.is_correct ? "Correct" : "Needs Improvement"}
                                </Badge>
                                <span className="font-bold text-lg">{Math.round(evalResult.score)}%</span>
                              </div>
                              <CardTitle className="text-base mt-2">{getQuestionText(question || {})}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground mb-2">{evalResult.feedback}</p>
                              {evalResult.areas_for_improvement?.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs font-semibold text-orange-700 dark:text-orange-400">Areas for Improvement:</p>
                                  <ul className="list-disc list-inside text-xs text-muted-foreground">
                                    {evalResult.areas_for_improvement.map((area, i) => (
                                      <li key={i}>{area}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>

                    {/* Action buttons after evaluation */}
                    <div className="flex gap-3 mt-4">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setBucketEvaluation(null);
                        }}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Review Questions
                      </Button>

                      {/* Continue to Next Difficulty button */}
                      {selectedDifficulty === "easy" && (
                        <Button
                          className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                          onClick={() => setSelectedDifficulty("medium")}
                        >
                          Continue to Medium →
                        </Button>
                      )}
                      {selectedDifficulty === "medium" && (
                        <Button
                          className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
                          onClick={() => setSelectedDifficulty("hard")}
                        >
                          Continue to Hard →
                        </Button>
                      )}
                      {selectedDifficulty === "hard" && (
                        <Button
                          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                          asChild
                        >
                          <Link href={`/dashboard?session=${selectedSession?.id}`}>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Day Complete! View Dashboard
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : filteredQuestions.length > 0 && currentQuestion ? (
              // Question Input View
              <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow duration-300 border-blue-200/50 dark:border-blue-800/50 py-0">
                <CardHeader className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border-b border-blue-200/30 dark:border-blue-800/30 pb-4 ">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 pt-4">
                      <Badge
                        variant="outline"
                        className={`capitalize font-semibold ${currentQuestion.difficulty === 'easy' ? 'border-green-500 text-green-700 dark:text-green-400' :
                          currentQuestion.difficulty === 'medium' ? 'border-yellow-500 text-yellow-700 dark:text-yellow-400' :
                            'border-red-500 text-red-700 dark:text-red-400'
                          }`}
                      >
                        {currentQuestion.difficulty}
                      </Badge>
                      <Badge variant="secondary" className="font-medium">
                        {currentQuestion.topic}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground font-medium">
                      Question {currentQuestionIndex + 1} of {filteredQuestions.length}
                    </div>
                  </div>
                  <CardTitle className="mt-4 text-xl leading-relaxed font-semibold">
                    {getQuestionText(currentQuestion)}
                  </CardTitle>
                  {currentQuestion.keywords && currentQuestion.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {currentQuestion.keywords.map((keyword: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs bg-muted/50">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Your Answer
                    </label>
                    <Textarea
                      placeholder="Type your answer here... Be detailed and specific."
                      value={currentAnswerText}
                      onChange={(e) => setCurrentAnswerText(e.target.value)}
                      rows={10}
                      className="resize-none text-base leading-relaxed focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    <p className="text-xs text-muted-foreground">
                      {currentAnswerText.length} characters
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4 pb-4 px-4 mb-2">
                    <Button
                      variant="outline"
                      onClick={handlePreviousQuestion}
                      disabled={currentQuestionIndex === 0}
                      className="flex-1"
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Previous
                    </Button>

                    {currentQuestionIndex < filteredQuestions.length - 1 ? (
                      <Button
                        onClick={handleNextQuestion}
                        className="flex-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white"
                      >
                        Next Question
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        onClick={handleSubmitBucket}
                        disabled={isSubmitting}
                        className="flex-[2] bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Evaluating...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Submit All Answers
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="mb-4">
                    <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No Questions Available</h3>
                  <p className="text-muted-foreground mb-4">
                    There are no {selectedDifficulty} questions for this session day yet.
                  </p>
                  <Button onClick={() => {
                    // Logic to generate questions could go here
                    toast.info("Try selecting a different difficulty or checking back later.");
                  }}>
                    Check Other Difficulties
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SessionsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <SessionsContent />
    </Suspense>
  );
}
