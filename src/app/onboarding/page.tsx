"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Brain, ArrowRight, ArrowLeft, Upload, FileText } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { onboardingApi } from "@/lib/api/onboarding";
import { ApiClientError } from "@/lib/api/client";
import { toast } from "sonner";

type OnboardingData = {
  role: string;
  resume: File | null;
  jobDescription: string;
  preparationTime: string;
  preparationUnit: string;
};

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    role: "",
    resume: null,
    jobDescription: "",
    preparationTime: "",
    preparationUnit: "days",
  });

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  useEffect(() => {
    if (authLoading) return; // Wait for auth to load
    
    if (!isAuthenticated || !user?.user_id) {
      router.push("/auth/sign-in");
      return;
    }
  }, [authLoading, isAuthenticated, user, router]);

  const handleNext = async () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Submit onboarding data
      if (!user?.user_id) {
        toast.error("Please sign in to continue");
        router.push("/auth/sign-in");
        return;
      }

      setIsSubmitting(true);
      try {
        // Convert preparation time to days
        const days = data.preparationUnit === "days"
          ? parseInt(data.preparationTime)
          : data.preparationUnit === "weeks"
          ? parseInt(data.preparationTime) * 7
          : parseInt(data.preparationTime) * 30;

        const onboardingResponse = await onboardingApi.startOnboarding(user.user_id, {
          role: data.role,
          preparation_time_days: days,
          resume_file: data.resume || undefined,
          job_description_text: data.jobDescription || undefined,
        });

        // Create a session from the onboarding record
        if (onboardingResponse.session_id) {
          // Session already created
          toast.success("Onboarding completed successfully! Redirecting to practice questions...");
          setTimeout(() => router.push("/sessions"), 1500);
        } else {
          // Try to get the latest onboarding record and create a session
          try {
            const latestOnboarding = await onboardingApi.getLatestOnboardingRecord(user.user_id);
            if (latestOnboarding) {
              const { sessionsApi } = await import("@/lib/api/sessions");
              await sessionsApi.createApplicationSession({
                onboarding_id: latestOnboarding.id,
                session_name: `${data.role} - Interview Prep`,
              });
              toast.success("Onboarding completed! Redirecting to practice questions...");
              setTimeout(() => router.push("/sessions"), 1500);
            }
          } catch (sessionError) {
            console.error("Error creating session:", sessionError);
            toast.success("Onboarding completed! You can create a session from the dashboard.");
            router.push("/dashboard");
          }
        }
      } catch (error: any) {
        if (error instanceof ApiClientError) {
          toast.error(error.data.message || "Failed to submit onboarding data");
        } else {
          toast.error("An unexpected error occurred");
        }
        console.error("Onboarding error:", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setData({ ...data, resume: file });
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return data.role.trim().length > 0;
      case 2:
        return data.resume !== null;
      case 3:
        return data.jobDescription.trim().length > 0;
      case 4:
        return data.preparationTime.length > 0 && parseInt(data.preparationTime) > 0;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-background to-indigo-50/30 dark:from-blue-950/10 dark:via-background dark:to-indigo-950/10 p-4">
      <div className="container mx-auto max-w-2xl py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
            Let's Get You Prepared
          </h1>
          <p className="text-muted-foreground text-lg">
            Step {step} of {totalSteps}
          </p>
        </div>

        <Progress value={progress} className="mb-8 h-3" />

        <Card className="border-2 shadow-xl hover:shadow-2xl transition-shadow duration-300 border-blue-200/50 dark:border-blue-800/50">
          <CardHeader className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border-b border-blue-200/30 dark:border-blue-800/30">
            <CardTitle className="text-2xl">
              {step === 1 && "Target Role"}
              {step === 2 && "Upload Resume"}
              {step === 3 && "Job Description"}
              {step === 4 && "Preparation Timeline"}
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {step === 1 && "What position are you applying for?"}
              {step === 2 && "Upload your current resume or portfolio"}
              {step === 3 && "Paste the job description you're targeting"}
              {step === 4 && "How much time do you have before the interview?"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 1 && (
              <div className="space-y-2">
                <Label htmlFor="role">Role/Position</Label>
                <Input
                  id="role"
                  placeholder="e.g., Senior Software Engineer, Product Manager"
                  value={data.role}
                  onChange={(e) => setData({ ...data, role: e.target.value })}
                />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
                  <input
                    type="file"
                    id="resume"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="resume" className="cursor-pointer">
                    {data.resume ? (
                      <div className="flex items-center justify-center gap-2 text-primary">
                        <FileText className="h-8 w-8" />
                        <span className="font-medium">{data.resume.name}</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                        <p className="text-muted-foreground">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PDF, DOC, DOCX, or TXT (Max 5MB)
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-2">
                <Label htmlFor="jobDescription">Job Description</Label>
                <Textarea
                  id="jobDescription"
                  placeholder="Paste the complete job description here..."
                  rows={12}
                  value={data.jobDescription}
                  onChange={(e) => setData({ ...data, jobDescription: e.target.value })}
                  className="resize-none"
                />
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="preparationTime">Duration</Label>
                    <Input
                      id="preparationTime"
                      type="number"
                      min="1"
                      placeholder="7"
                      value={data.preparationTime}
                      onChange={(e) => setData({ ...data, preparationTime: e.target.value })}
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="preparationUnit">Unit</Label>
                    <Select
                      value={data.preparationUnit}
                      onValueChange={(value) => setData({ ...data, preparationUnit: value })}
                    >
                      <SelectTrigger id="preparationUnit">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="days">Days</SelectItem>
                        <SelectItem value="weeks">Weeks</SelectItem>
                        <SelectItem value="months">Months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  We'll create a personalized preparation plan based on your available time.
                </p>
              </div>
            )}

            <div className="flex justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={step === 1}
                className="h-11 px-6"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!isStepValid() || isSubmitting}
                className="h-11 px-8 font-semibold shadow-md hover:shadow-lg transition-all bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white"
                size="lg"
              >
                {isSubmitting
                  ? "Submitting..."
                  : step === totalSteps
                  ? "Complete Setup"
                  : "Next"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
