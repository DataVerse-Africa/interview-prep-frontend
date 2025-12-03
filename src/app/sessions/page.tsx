"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

export default function SessionsPage() {
  const router = useRouter();
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
  
  const [isLoading, setIsLoading] = useState(true);
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
      const userSessions = await sessionsApi.listApplicationSessions();
      setSessions(userSessions);
      if (userSessions.length > 0) {
        // Sort by created_at desc if needed, but assuming API returns relevant order
        setSelectedSession(userSessions[0]);
        await loadQuestionsForSession(userSessions[0].id, 1);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast.error("Failed to load sessions");
    } finally {
      setIsLoading(false);
    }
  };

  const loadQuestionsForSession = async (sessionId: string, dayNumber: number) => {
    if (!user?.user_id) return;

    try {
      setIsLoading(true);
      const dailyPlan = await questionsApi.getQuestionsForSessionDay(
        user.user_id,
        sessionId,
        dayNumber
      );
      setQuestions(dailyPlan.questions || []);
      setCurrentDay(dayNumber);
      setAnswers({}); // Reset answers for new session/day
      setTimeStarted(new Date());
    } catch (error) {
      console.error("Error loading questions:", error);
      toast.error("Failed to load questions");
    } finally {
      setIsLoading(false);
    }
  };

  const checkExistingEvaluation = async (currentFilteredQuestions: any[]) => {
    if (!user?.user_id || !selectedSession) return;
    
    try {
      // We only need to check if we have a bucket evaluation
      // Assuming the API returns 404 or null if not evaluated
      const evalData = await evaluationsApi.getDifficultyBucketEvaluation(
        user.user_id,
        selectedSession.id,
        currentDay,
        selectedDifficulty
      );
      
      if (evalData) {
        setBucketEvaluation(evalData);
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

    // Check if all questions have answers
    const missingAnswers = filteredQuestions.filter(q => !answers[q.id]?.text && q.id !== filteredQuestions[currentQuestionIndex].id && !currentAnswerText);
    
    if (missingAnswers.length > 0 && !confirm(`You have ${missingAnswers.length} unanswered questions. Are you sure you want to submit?`)) {
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
        user.user_id,
        selectedSession.id,
        currentDay,
        selectedDifficulty,
        payload
      );

      setBucketEvaluation(result);
      toast.success("Answers evaluated successfully!");
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const currentQuestion = filteredQuestions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-background to-indigo-50/30 dark:from-blue-950/10 dark:via-background dark:to-indigo-950/10">
      <header className="border-b bg-background/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
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
            {/* Sessions List */}
            <Card className="shadow-md border-2 border-blue-200/50 dark:border-blue-800/50 overflow-hidden p-0">
              <CardHeader className="bg-gradient-to-r from-blue-100 via-indigo-200 to-blue-300 dark:from-blue-900/40 dark:via-indigo-800/40 dark:to-blue-700/40 pb-2 pt-3 px-4 border-b border-blue-200/30 dark:border-blue-800/30">
                <CardTitle className="text-lg font-bold bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 dark:from-blue-300 dark:via-indigo-400 dark:to-blue-200 bg-clip-text text-transparent">
                  Interview Practices
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-2 pb-3 px-4">
                {sessions.map((session) => (
                  <Button
                    key={session.id}
                    variant={selectedSession?.id === session.id ? "default" : "outline"}
                    className={`w-full justify-start transition-all h-auto py-3 ${
                      selectedSession?.id === session.id 
                        ? 'shadow-md' 
                        : 'hover:bg-muted hover:shadow-sm'
                    }`}
                    onClick={() => {
                      setSelectedSession(session);
                      loadQuestionsForSession(session.id, 1);
                    }}
                  >
                    <div className="flex flex-col items-start text-left w-full overflow-hidden">
                      <span className="font-medium truncate w-full text-sm sm:text-base">
                        {session.session_name || `Session ${session.id.slice(0, 8)}`}
                      </span>
                      <div className="flex items-center justify-between w-full mt-1">
                         {session.status && (
                          <span className={`text-xs ${
                            selectedSession?.id === session.id ? 'text-primary-foreground/80' : 'text-muted-foreground'
                          }`}>
                            {session.status}
                          </span>
                        )}
                         <span className={`text-xs ml-auto ${
                            selectedSession?.id === session.id ? 'text-primary-foreground/80' : 'text-muted-foreground'
                          }`}>
                            {new Date(session.created_at).toLocaleDateString()}
                          </span>
                      </div>
                    </div>
                  </Button>
                ))}
                <Button 
                  variant="ghost" 
                  className="w-full mt-2 border-dashed border-2 hover:bg-muted"
                  onClick={() => router.push('/onboarding')}
                >
                  + New Practice Session
                </Button>
              </CardContent>
            </Card>

            {/* Difficulty Selector */}
            <Card className="shadow-md border-2 border-cyan-200/50 dark:border-cyan-800/50 overflow-hidden p-0">
              <CardHeader className="bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/10 pb-2 pt-3 px-4 border-b border-cyan-200/30 dark:border-cyan-800/30">
                <CardTitle className="text-lg font-bold bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
                  Difficulty Level
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-2 pb-3 px-4">
                {["easy", "medium", "hard"].map((difficulty) => {
                  const isSelected = selectedDifficulty === difficulty;
                  const difficultyColors = {
                    easy: 'border-green-500 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/20',
                    medium: 'border-yellow-500 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-950/20',
                    hard: 'border-red-500 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20',
                  };
                  return (
                    <Button
                      key={difficulty}
                      variant={isSelected ? "default" : "outline"}
                      className={`w-full capitalize font-semibold transition-all ${
                        !isSelected ? difficultyColors[difficulty as keyof typeof difficultyColors] : ''
                      } ${isSelected ? 'shadow-md' : ''}`}
                      onClick={() => setSelectedDifficulty(difficulty)}
                    >
                      {difficulty}
                    </Button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Progress Card */}
            <Card className="shadow-md border-2 border-purple-200/50 dark:border-purple-800/50 overflow-hidden p-0">
              <CardHeader className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-rose-500/10 pb-2 pt-3 px-4 border-b border-purple-200/30 dark:border-purple-800/30">
                <CardTitle className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                  Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2 pb-3 px-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Questions</span>
                    <span className="text-sm font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                      {filteredQuestions.length > 0 ? currentQuestionIndex + 1 : 0} / {filteredQuestions.length}
                    </span>
                  </div>
                  <Progress 
                    value={filteredQuestions.length > 0 ? ((currentQuestionIndex + 1) / filteredQuestions.length) * 100 : 0} 
                    className="h-3 bg-gradient-to-r from-purple-200 to-pink-200 dark:from-purple-900 dark:to-pink-900"
                  />
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
                      Overall Score: <span className="font-bold text-primary">{Math.round(bucketEvaluation.overall_score * 100)}%</span>
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
                                 <span className="font-bold text-lg">{Math.round(evalResult.score * 100)}%</span>
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

                    <Button 
                      className="w-full" 
                      onClick={() => {
                        setBucketEvaluation(null);
                        // Optionally fetch new questions or reset
                        toast.info("Ready for review or next steps");
                      }}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Review Questions
                    </Button>
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
                        className={`capitalize font-semibold ${
                          currentQuestion.difficulty === 'easy' ? 'border-green-500 text-green-700 dark:text-green-400' :
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
                  
                  <div className="flex gap-3 pt-4">
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
