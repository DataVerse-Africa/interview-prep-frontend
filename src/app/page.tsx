"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Brain, Target, BookOpen, Clock, TrendingUp, Trophy, Sparkles, Zap, Star, ArrowRight, Users, Award, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Redirect authenticated users to user dashboard
    if (!isLoading && isAuthenticated) {
      router.push("/home");
    }
  }, [isLoading, isAuthenticated, router]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // If authenticated, show loading while redirecting
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-background to-indigo-50 dark:from-blue-950/20 dark:via-background dark:to-indigo-950/20">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              InterviewAI
            </span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/auth/sign-in">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-24 relative">
        {/* Background Graphics */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left space-y-8">
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
              <Badge className="px-5 py-2 text-sm font-semibold bg-white dark:bg-gray-900 border-2 border-blue-500/50 dark:border-blue-400/50 shadow-lg hover:shadow-xl transition-all backdrop-blur-sm">
                <Sparkles className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400 animate-pulse" />
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent font-bold">
                  AI-Powered Interview Prep
                </span>
              </Badge>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight">
              <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                Ace Your Next
              </span>
              <span className="block bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 dark:from-purple-400 dark:via-pink-400 dark:to-rose-400 bg-clip-text text-transparent mt-2">
                Interview
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Transform your interview performance with <span className="font-semibold text-foreground">personalized AI coaching</span>, real-time feedback, and confidence-building practice sessions.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 justify-center lg:justify-start pt-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <Trophy className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="font-bold text-lg">95%</div>
                  <div className="text-xs text-muted-foreground">Success Rate</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="font-bold text-lg">10K+</div>
                  <div className="text-xs text-muted-foreground">Users</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <div className="font-bold text-lg">4.9★</div>
                  <div className="text-xs text-muted-foreground">Rating</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
              <Link href="/auth/sign-up">
                <Button size="lg" className="text-lg px-8 h-14 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transition-all group">
                  Start Acing Interviews
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="text-lg px-8 h-14 border-2 hover:bg-muted">
                  See How It Works
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Graphics - Desktop */}
          <div className="relative hidden lg:block pr-8">
            {/* Main Success Card */}
            <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-3xl p-8 border-2 border-blue-200/50 dark:border-blue-800/50 shadow-2xl transform hover:scale-105 transition-transform duration-300">
              <div className="absolute -top-4 -right-4 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full p-3 shadow-lg animate-bounce z-10">
                <Star className="h-6 w-6 text-white fill-white" />
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
                    <CheckCircle2 className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-lg">Interview Passed!</div>
                    <div className="text-sm text-muted-foreground">You got the job</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-sm">Confident answers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-sm">Perfect preparation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-sm">Impressed the interviewer</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Readiness Score</span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                      98%
                    </span>
                  </div>
                  <div className="mt-2 h-2 bg-blue-100 dark:bg-blue-900/30 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full w-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-6 -left-6 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-xl border-2 border-blue-200 dark:border-blue-800 animate-float z-10">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                <span className="text-sm font-semibold">AI Feedback</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Real-time evaluation</p>
            </div>

            <div className="absolute -bottom-6 -right-6 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-xl border-2 border-purple-200 dark:border-purple-800 animate-float-delayed z-10">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-500" />
                <span className="text-sm font-semibold">Smart Practice</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Adaptive questions</p>
            </div>

            {/* Success Icons */}
            <div className="absolute top-1/4 -right-8 animate-bounce delay-300 z-10">
              <div className="p-3 rounded-full bg-gradient-to-br from-green-400 to-emerald-400 shadow-lg">
                <Trophy className="h-6 w-6 text-white" />
              </div>
            </div>

            <div className="absolute bottom-1/4 -left-8 animate-bounce delay-700 z-10">
              <div className="p-3 rounded-full bg-gradient-to-br from-blue-400 to-indigo-400 shadow-lg">
                <Target className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          {/* Mobile Graphics */}
          <div className="relative lg:hidden mt-12">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-3xl p-6 border-2 border-blue-200/50 dark:border-blue-800/50 shadow-xl">
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="p-4 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
                  <CheckCircle2 className="h-8 w-8 text-white" />
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500">
                  <Trophy className="h-8 w-8 text-white" />
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                  <Star className="h-8 w-8 text-white fill-white" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                  98% Success Rate
                </div>
                <p className="text-sm text-muted-foreground">
                  Join thousands who aced their interviews
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-12">
          Everything You Need to Succeed
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6 hover:shadow-xl transition-all border-2 hover:border-blue-200 dark:hover:border-blue-800 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/10">
            <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 w-fit mb-4">
              <Target className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
              Resume-JD Alignment
            </h3>
            <p className="text-muted-foreground">
              Analyze alignment between your resume and target job description with detailed percentage scores and gap analysis.
            </p>
          </Card>

          <Card className="p-6 hover:shadow-xl transition-all border-2 hover:border-purple-200 dark:hover:border-purple-800 bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-950/10">
            <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 w-fit mb-4">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              AI-Generated Questions
            </h3>
            <p className="text-muted-foreground">
              Get personalized interview questions adapted to your preparation time and skill level.
            </p>
          </Card>

          <Card className="p-6 hover:shadow-xl transition-all border-2 hover:border-green-200 dark:hover:border-green-800 bg-gradient-to-br from-green-50/50 to-transparent dark:from-green-950/10">
            <div className="p-3 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 w-fit mb-4">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2 bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
              Intelligent Evaluation
            </h3>
            <p className="text-muted-foreground">
              Receive detailed feedback on your responses with improvement suggestions and scoring.
            </p>
          </Card>

          <Card className="p-6 hover:shadow-xl transition-all border-2 hover:border-cyan-200 dark:hover:border-cyan-800 bg-gradient-to-br from-cyan-50/50 to-transparent dark:from-cyan-950/10">
            <div className="p-3 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 w-fit mb-4">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2 bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
              Learning Resources
            </h3>
            <p className="text-muted-foreground">
              Access curated learning materials sourced from the internet tailored to your gaps.
            </p>
          </Card>

          <Card className="p-6 hover:shadow-xl transition-all border-2 hover:border-orange-200 dark:hover:border-orange-800 bg-gradient-to-br from-orange-50/50 to-transparent dark:from-orange-950/10">
            <div className="p-3 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 w-fit mb-4">
              <Clock className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2 bg-gradient-to-r from-orange-600 to-amber-600 dark:from-orange-400 dark:to-amber-400 bg-clip-text text-transparent">
              Adaptive Timeline
            </h3>
            <p className="text-muted-foreground">
              Preparation plans that adapt to your available time before the interview.
            </p>
          </Card>

          <Card className="p-6 hover:shadow-xl transition-all border-2 hover:border-indigo-200 dark:hover:border-indigo-800 bg-gradient-to-br from-indigo-50/50 to-transparent dark:from-indigo-950/10">
            <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 w-fit mb-4">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2 bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
              Progress Tracking
            </h3>
            <p className="text-muted-foreground">
              Monitor your improvement with detailed analytics and readiness metrics.
            </p>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20 bg-muted/30 rounded-3xl my-20">
        <h2 className="text-4xl font-bold text-center mb-12">How It Works</h2>
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex gap-6 items-start">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
              1
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-2">Upload Your Details</h3>
              <p className="text-muted-foreground">
                Provide your resume, target role, job description, and available preparation time.
              </p>
            </div>
          </div>

          <div className="flex gap-6 items-start">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
              2
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-2">Get AI Analysis</h3>
              <p className="text-muted-foreground">
                Our AI analyzes alignment, identifies skill gaps, and generates personalized interview questions.
              </p>
            </div>
          </div>

          <div className="flex gap-6 items-start">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
              3
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-2">Practice & Improve</h3>
              <p className="text-muted-foreground">
                Answer questions, receive feedback, and access learning resources to bridge knowledge gaps.
              </p>
            </div>
          </div>

          <div className="flex gap-6 items-start">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
              4
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-2">Ace Your Interview</h3>
              <p className="text-muted-foreground">
                Walk into your interview confident and fully prepared for success.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-indigo-50/50 to-purple-50/50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20 rounded-3xl"></div>
        <div className="relative z-10">
          <div className="flex justify-center mb-6">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-6 w-6 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
            Ready to Ace Your Interview?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of candidates who have successfully prepared for their dream jobs with our AI-powered platform.
          </p>
          <Link href="/auth/sign-up">
            <Button size="lg" className="text-lg px-12 h-14 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transition-all group">
              Start Your Journey
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 mt-20">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 InterviewAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}