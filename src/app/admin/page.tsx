"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
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
  Search,
  LogOut,
  BarChart3,
  PieChart,
  Clock,
  Zap,
  AlertCircle,
  CheckCircle2,
  Brain,
  Calendar,
  Award,
  MessageSquare,
  Briefcase,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  adminApi,
  AdminSystemStats,
  UserListResponse,
  QuestionPerformanceStats,
  TopicAnalytics,
  RoleAnalytics,
  KeywordAnalytics,
  PeakUsageAnalytics,
  SystemHealthMetrics,
  AdminDashboardCharts,
  AdminUserDetails,
} from "@/lib/api/admin";
import { ApiClientError } from "@/lib/api/client";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";

export default function AdminPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<AdminSystemStats | null>(null);
  const [users, setUsers] = useState<UserListResponse | null>(null);
  const [questionAnalytics, setQuestionAnalytics] = useState<QuestionPerformanceStats[]>([]);
  const [topicAnalytics, setTopicAnalytics] = useState<TopicAnalytics[]>([]);
  const [roleAnalytics, setRoleAnalytics] = useState<RoleAnalytics[]>([]);
  const [keywordAnalytics, setKeywordAnalytics] = useState<KeywordAnalytics[]>([]);
  const [peakUsage, setPeakUsage] = useState<PeakUsageAnalytics | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealthMetrics | null>(null);
  const [charts, setCharts] = useState<AdminDashboardCharts | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

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
  }, [router, currentPage, activeTab]);

  const loadAdminData = async () => {
    try {
      setIsLoading(true);

      // Load overview data
      if (activeTab === "overview") {
        const [summaryData, healthData, chartsData] = await Promise.all([
          adminApi.getSummary().catch(() => null),
          adminApi.getSystemHealth().catch(() => null),
          adminApi.getDashboardCharts().catch(() => null),
        ]);

        if (summaryData) setSummary(summaryData);
        if (healthData) setSystemHealth(healthData);
        if (chartsData) setCharts(chartsData);
      }

      // Load users tab
      if (activeTab === "users") {
        const usersData = await adminApi.getUsers(currentPage, 50).catch(() => null);
        if (usersData) setUsers(usersData);
      }

      // Load analytics tabs
      if (activeTab === "questions") {
        const questionsData = await adminApi.getQuestionAnalytics(50).catch(() => null);
        if (questionsData) setQuestionAnalytics(questionsData);
      }

      if (activeTab === "topics") {
        const topicsData = await adminApi.getTopicAnalytics().catch(() => null);
        if (topicsData) setTopicAnalytics(topicsData);
      }

      if (activeTab === "roles") {
        const rolesData = await adminApi.getRoleAnalytics().catch(() => null);
        if (rolesData) setRoleAnalytics(rolesData);
      }

      if (activeTab === "keywords") {
        const keywordsData = await adminApi.getKeywordAnalytics().catch(() => null);
        if (keywordsData) setKeywordAnalytics(keywordsData);
      }

      if (activeTab === "usage") {
        const usageData = await adminApi.getPeakUsageAnalytics().catch(() => null);
        if (usageData) setPeakUsage(usageData);
      }
    } catch (error: any) {
      if (error instanceof ApiClientError) {
        if (error.status === 403 || error.status === 401) {
          toast.error("You don't have permission to access the admin section");
          router.push("/admin/login");
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

  const handleViewUser = async (userId: string) => {
    try {
      const userDetails = await adminApi.getUserDetails(userId);
      setSelectedUser(userDetails);
      setActiveTab("users");
    } catch (error: any) {
      toast.error("Failed to load user details");
    }
  };

  const handleBlockUser = async (userId: string) => {
    try {
      await adminApi.blockUser(userId);
      toast.success("User blocked successfully");
      loadAdminData();
    } catch (error: any) {
      toast.error("Failed to block user");
    }
  };

  const handleUnblockUser = async (userId: string) => {
    try {
      await adminApi.unblockUser(userId);
      toast.success("User unblocked successfully");
      loadAdminData();
    } catch (error: any) {
      toast.error("Failed to unblock user");
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

  if (isLoading && !summary) {
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
              <Shield className="h-6 w-6 text-blue-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                Admin Dashboard
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                User Dashboard
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={handleAdminLogout} className="hover:bg-muted" title="Logout from Admin">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* System Health Status */}
        {systemHealth && (
          <Card className="mb-6 border-2 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    systemHealth.database_status === 'healthy' 
                      ? 'bg-green-100 dark:bg-green-900/30' 
                      : systemHealth.database_status === 'degraded'
                      ? 'bg-yellow-100 dark:bg-yellow-900/30'
                      : 'bg-red-100 dark:bg-red-900/30'
                  }`}>
                    {systemHealth.database_status === 'healthy' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Database</p>
                    <p className="font-semibold capitalize">{systemHealth.database_status}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Zap className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Response Time</p>
                    <p className="font-semibold">{systemHealth.api_response_time_ms}ms</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <Activity className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Connections</p>
                    <p className="font-semibold">{systemHealth.active_connections}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    systemHealth.error_rate < 0.01 
                      ? 'bg-green-100 dark:bg-green-900/30' 
                      : systemHealth.error_rate < 0.05
                      ? 'bg-yellow-100 dark:bg-yellow-900/30'
                      : 'bg-red-100 dark:bg-red-900/30'
                  }`}>
                    <AlertCircle className={`h-5 w-5 ${
                      systemHealth.error_rate < 0.01 
                        ? 'text-green-600' 
                        : systemHealth.error_rate < 0.05
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Error Rate</p>
                    <p className="font-semibold">{(systemHealth.error_rate * 100).toFixed(2)}%</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Stats Cards */}
        {summary && (
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
                  {summary.total_users || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {summary.active_users || 0} active
                </p>
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
                  {summary.total_sessions || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across all users
                </p>
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
                  {summary.total_questions || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Generated questions
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-green-200 dark:border-green-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
                <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
                  Avg Score
                </CardTitle>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-900 dark:text-green-100">
                  {summary.average_score ? `${summary.average_score.toFixed(1)}%` : "0%"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {summary.total_answers || 0} answers
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Additional Stats */}
        {summary && (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="shadow-lg border-orange-200 dark:border-orange-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
                <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">
                  Practice Days
                </CardTitle>
                <Calendar className="h-5 w-5 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                  {summary.total_practice_days || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total practice days
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-pink-200 dark:border-pink-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
                <CardTitle className="text-sm font-medium text-pink-700 dark:text-pink-300">
                  Practice Streaks
                </CardTitle>
                <Award className="h-5 w-5 text-pink-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-pink-900 dark:text-pink-100">
                  {summary.total_streaks || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Active streaks
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-cyan-200 dark:border-cyan-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
                <CardTitle className="text-sm font-medium text-cyan-700 dark:text-cyan-300">
                  Total Answers
                </CardTitle>
                <MessageSquare className="h-5 w-5 text-cyan-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-cyan-900 dark:text-cyan-100">
                  {summary.total_answers || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  User responses
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-muted/50 p-1 overflow-x-auto">
            <TabsTrigger value="overview" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Users
            </TabsTrigger>
            <TabsTrigger value="questions" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Questions
            </TabsTrigger>
            <TabsTrigger value="topics" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Topics
            </TabsTrigger>
            <TabsTrigger value="roles" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Roles
            </TabsTrigger>
            <TabsTrigger value="usage" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Usage
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {charts && (
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      User Growth
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {charts.user_growth.slice(-7).map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{item.date}</span>
                          <span className="font-semibold">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      Role Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {charts.role_distribution.slice(0, 10).map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground truncate">{item.role}</span>
                          <span className="font-semibold">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

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
                      Manage users with session counts, question stats, and practice streaks
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
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    </div>
                  ) : filteredUsers.length > 0 ? (
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
                            <div className="flex-1">
                              <div className="font-semibold">{userItem.email}</div>
                              <div className="text-sm text-muted-foreground flex gap-4 mt-1">
                                <span>Sessions: {userItem.total_sessions || 0}</span>
                                <span>Questions: {userItem.total_questions_answered || 0}</span>
                                <span>Score: {userItem.average_score ? `${userItem.average_score.toFixed(1)}%` : "0%"}</span>
                                <span>Streak: {userItem.current_streak || 0} days</span>
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewUser(userItem.user_id)}
                          >
                            View Details
                          </Button>
                          {userItem.is_active ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleBlockUser(userItem.user_id)}
                              className="text-orange-600 border-orange-300 hover:bg-orange-50"
                            >
                              <UserX className="h-4 w-4 mr-1" />
                              Block
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnblockUser(userItem.user_id)}
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

            {/* User Details Modal */}
            {selectedUser && (
              <Card className="shadow-lg border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>User Details: {selectedUser.email}</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                      Close
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Sessions</p>
                      <p className="text-2xl font-bold">{selectedUser.total_sessions}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Questions Answered</p>
                      <p className="text-2xl font-bold">{selectedUser.total_questions_answered}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Average Score</p>
                      <p className="text-2xl font-bold">{selectedUser.average_score ? `${selectedUser.average_score.toFixed(1)}%` : "0%"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Current Streak</p>
                      <p className="text-2xl font-bold">{selectedUser.current_streak} days</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Longest Streak</p>
                      <p className="text-2xl font-bold">{selectedUser.longest_streak} days</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Practice Days</p>
                      <p className="text-2xl font-bold">{selectedUser.total_practice_days}</p>
                    </div>
                  </div>
                  {selectedUser.sessions && selectedUser.sessions.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Sessions</h3>
                      <div className="space-y-2">
                        {selectedUser.sessions.map((session) => (
                          <div key={session.session_id} className="p-3 border rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{session.session_name}</p>
                                <p className="text-sm text-muted-foreground">{session.role}</p>
                              </div>
                              <Badge>{session.status}</Badge>
                            </div>
                            <div className="mt-2 text-sm text-muted-foreground">
                              Questions: {session.answered_questions}/{session.total_questions} | 
                              Score: {session.average_score ? `${session.average_score.toFixed(1)}%` : "N/A"}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="questions" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Question Performance Analytics
                </CardTitle>
                <CardDescription>
                  Analytics on question performance across all users
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : questionAnalytics.length > 0 ? (
                  <div className="space-y-3">
                    {questionAnalytics.map((q) => (
                      <div key={q.question_id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-medium flex-1">{q.question_text}</p>
                          <Badge variant="outline">{q.difficulty}</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Times Answered</p>
                            <p className="font-semibold">{q.times_answered}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Average Score</p>
                            <p className="font-semibold">{q.average_score.toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Correct Rate</p>
                            <p className="font-semibold">{(q.correct_rate * 100).toFixed(1)}%</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="mt-2">{q.topic}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No question analytics available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="topics" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Topic Analytics
                </CardTitle>
                <CardDescription>
                  Analytics on topic performance and engagement
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : topicAnalytics.length > 0 ? (
                  <div className="space-y-3">
                    {topicAnalytics.map((topic) => (
                      <div key={topic.topic} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-semibold text-lg">{topic.topic}</h3>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Avg Score</p>
                            <p className="text-xl font-bold">{topic.average_score.toFixed(1)}%</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                          <div>
                            <p className="text-muted-foreground">Total Questions</p>
                            <p className="font-semibold">{topic.total_questions}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Times Answered</p>
                            <p className="font-semibold">{topic.times_answered}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline">Easy: {topic.difficulty_distribution.easy}</Badge>
                          <Badge variant="outline">Medium: {topic.difficulty_distribution.medium}</Badge>
                          <Badge variant="outline">Hard: {topic.difficulty_distribution.hard}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No topic analytics available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roles" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Role Analytics
                </CardTitle>
                <CardDescription>
                  Analytics by job roles and titles
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : roleAnalytics.length > 0 ? (
                  <div className="space-y-3">
                    {roleAnalytics.map((role) => (
                      <div key={role.role} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-semibold text-lg">{role.role}</h3>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Avg Score</p>
                            <p className="text-xl font-bold">{role.average_score.toFixed(1)}%</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                          <div>
                            <p className="text-muted-foreground">Users</p>
                            <p className="font-semibold">{role.user_count}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Total Sessions</p>
                            <p className="font-semibold">{role.total_sessions}</p>
                          </div>
                        </div>
                        {role.most_common_topics && role.most_common_topics.length > 0 && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">Common Topics:</p>
                            <div className="flex flex-wrap gap-2">
                              {role.most_common_topics.map((topic, idx) => (
                                <Badge key={idx} variant="secondary">{topic}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No role analytics available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Peak Usage Analytics
                </CardTitle>
                <CardDescription>
                  Peak usage time analytics for the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : peakUsage ? (
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Peak Hour</p>
                        <p className="text-2xl font-bold">{peakUsage.peak_hour}:00</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Peak Day</p>
                        <p className="text-2xl font-bold capitalize">{peakUsage.peak_day}</p>
                      </div>
                    </div>
                    {peakUsage.hourly_distribution && peakUsage.hourly_distribution.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-3">Hourly Distribution</h3>
                        <div className="space-y-2">
                          {peakUsage.hourly_distribution.map((item) => (
                            <div key={item.hour} className="flex items-center gap-3">
                              <span className="w-16 text-sm">{item.hour}:00</span>
                              <div className="flex-1 bg-muted rounded-full h-6 relative overflow-hidden">
                                <div
                                  className="bg-blue-600 h-full rounded-full"
                                  style={{ width: `${(item.count / Math.max(...peakUsage.hourly_distribution.map(h => h.count))) * 100}%` }}
                                />
                              </div>
                              <span className="text-sm font-semibold w-12 text-right">{item.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No usage analytics available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
