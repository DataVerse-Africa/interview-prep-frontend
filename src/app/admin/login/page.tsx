"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api/admin";
import { ApiClientError } from "@/lib/api/client";
import { toast } from "sonner";
import { Shield, ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import { apiClient } from "@/lib/api/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }
    
    if (!password) {
      newErrors.password = "Password is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});
    
    try {
      const response = await adminApi.login(email, password);
      // Set admin token in API client
      apiClient.setAdminToken(response.access_token);
      toast.success("Admin login successful!");
      router.push("/admin");
    } catch (error: any) {
      if (error instanceof ApiClientError) {
        if (error.status === 401) {
          setErrors({ general: "Invalid email or password" });
        } else {
          setErrors({ general: error.data.message || "An error occurred" });
        }
      } else {
        setErrors({ general: "An unexpected error occurred" });
      }
      toast.error(errors.general || "Failed to login as admin");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-background to-indigo-50 dark:from-blue-950/20 dark:via-background dark:to-indigo-950/20 p-4">
      <Card className="w-full max-w-md shadow-xl border-2 border-blue-200 dark:border-blue-800">
        <CardHeader className="text-center pb-4 pt-5">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
            Admin Login
          </CardTitle>
          <CardDescription className="mt-2">
            Sign in to access the admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {errors.general}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!errors.email}
                disabled={isLoading}
                className="border-blue-300 focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!errors.password}
                  disabled={isLoading}
                  className="pr-10 border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In as Admin"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            {!isAuthenticated && (
              <div className="text-sm text-muted-foreground">
                <Link href="/auth/sign-in" className="text-blue-600 hover:underline">
                  Regular user login
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

