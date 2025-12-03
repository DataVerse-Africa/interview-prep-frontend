"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  BookOpen,
  Target,
  TrendingUp,
  ArrowLeft,
  Loader2,
  Shield,
  Activity,
  UserCheck,
  UserX,
  Trash2,
  Search,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi, AdminStats, UserListResponse, SessionListResponse } from "@/lib/api/admin";
import { ApiClientError } from "@/lib/api/client";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserListResponse | null>(null);
  const [sessions, setSessions] = useState<SessionListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Check for admin token
    const adminToken = adminApi.getAdminToken();
    if (!adminToken) {
      router.push("/admin/login");
      return;
    }

    // Set admin token in API client
    if (adminToken) {
      apiClient.setAdminToken(adminToken);
    }

    loadAdminData();
  }, [router, currentPage]);

  const loadAdminData = async () => {
    try {
      setIsLoading(true);
      const [statsData, usersData, sessionsData] = await Promise.all([
        adminApi.getStats().catch(() => null),
        adminApi.getUsers(currentPage, 20).catch(() => null),
        adminApi.getSessions(currentPage, 20).catch(() => null),
      ]);

      if (statsData) setStats(statsData);
      if (usersData) setUsers(usersData);
      if (sessionsData) setSessions(sessionsData);
    } catch (error: any) {
      if (error instanceof ApiClientError) {
        if (error.status === 403 || error.status === 401) {
          toast.error("You don't have permission to access the admin section");
          router.push("/dashboard");
        } else {
          toast.error(error.data.message || "Failed to load admin data");
        }
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };


  const handleActivateUser = async (userId: string) => {
    try {
      await adminApi.unblockUser(userId);
      toast.success("User activated successfully");
      loadAdminData();
    } catch (error: any) {
      if (error instanceof ApiClientError) {
        toast.error(error.data.message || "Failed to activate user");
      } else {
        toast.error("An unexpected error occurred");
      }
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    try {
      await adminApi.blockUser(userId);
      toast.success("User blocked successfully");
      loadAdminData();
    } catch (error: any) {
      if (error instanceof ApiClientError) {
        toast.error(error.data.message || "Failed to block user");
      } else {
        toast.error("An unexpected error occurred");
      }
    }
  };

  const handleAdminLogout = () => {
    adminApi.logout();
    apiClient.setAdminToken(null);
    toast.success("Logged out from admin");
    router.push("/admin/login");
  };

  const filteredUsers = users?.users.filter((u) =>
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

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
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="hover:bg-muted">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                Admin Dashboard
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                Dashboard
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={handleAdminLogout} className="hover:bg-muted" title="Logout from Admin">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-lg border-blue-200 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Total Users
              </CardTitle>
              <Users className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                {stats?.total_users || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-indigo-200 dark:border-indigo-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
              <CardTitle className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                Total Sessions
              </CardTitle>
              <BookOpen className="h-5 w-5 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-indigo-900 dark:text-indigo-100">
                {stats?.total_sessions || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-purple-200 dark:border-purple-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
                Total Questions
              </CardTitle>
              <Target className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                {stats?.total_questions || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-green-200 dark:border-green-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
                Active Users
              </CardTitle>
              <Activity className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900 dark:text-green-100">
                {stats?.active_users || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1">
            <TabsTrigger value="users" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Users
            </TabsTrigger>
            <TabsTrigger value="sessions" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Sessions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <Card className="shadow-lg border-blue-200 dark:border-blue-800 pt-0">
              <CardHeader className="pb-4 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      User Management
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Manage users and their accounts
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-3">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((userItem) => (
                      <div
                        key={userItem.user_id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                              <Users className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <div className="font-semibold">{userItem.email}</div>
                              <div className="text-sm text-muted-foreground">
                                Joined: {new Date(userItem.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={userItem.is_active ? "default" : "secondary"}
                            className={
                              userItem.is_active
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                : ""
                            }
                          >
                            {userItem.is_active ? "Active" : "Inactive"}
                          </Badge>
                          {userItem.is_active ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeactivateUser(userItem.user_id)}
                              className="text-orange-600 border-orange-300 hover:bg-orange-50"
                            >
                              <UserX className="h-4 w-4 mr-1" />
                              Block
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleActivateUser(userItem.user_id)}
                              className="text-green-600 border-green-300 hover:bg-green-50"
                            >
                              <UserCheck className="h-4 w-4 mr-1" />
                              Unblock
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No users found
                    </div>
                  )}
                </div>
                {users && users.total > users.page_size && (
                  <div className="flex justify-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="flex items-center px-4 text-sm text-muted-foreground">
                      Page {currentPage} of {Math.ceil(users.total / users.page_size)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => p + 1)}
                      disabled={currentPage >= Math.ceil(users.total / users.page_size)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <Card className="shadow-lg border-blue-200 dark:border-blue-800 pt-0">
              <CardHeader className="pb-4 pt-4">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Session Management
                </CardTitle>
                <CardDescription className="mt-2">
                  View and manage all user sessions
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-3">
                  {sessions && sessions.sessions.length > 0 ? (
                    sessions.sessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="font-semibold">{session.session_name || "Unnamed Session"}</div>
                          <div className="text-sm text-muted-foreground">
                            User ID: {session.user_id.slice(0, 8)}... | Created:{" "}
                            {new Date(session.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            session.status === "active"
                              ? "border-green-500 text-green-700 dark:text-green-400"
                              : ""
                          }
                        >
                          {session.status}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No sessions found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

