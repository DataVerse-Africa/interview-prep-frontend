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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
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
  FileText,
  Tag,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  adminApi,
  AdminSystemStats,
  UserListResponse,
  TopicAnalytics,
  RoleAnalytics,
  KeywordAnalytics,
  PeakUsageAnalytics,
  TimeUsageAnalytics,
  SystemHealthMetrics,
  AdminDashboardCharts,
  AdminUserDetails,
  AdminSessionDayPreview,
  AdminQuestionPreview,
  VectorDBStats,
  VectorDBQueryResult,
} from "@/lib/api/admin";
import { ApiClientError } from "@/lib/api/client";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileUp, Database, Search as SearchIcon, Trash2, RefreshCw } from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<AdminSystemStats | null>(null);
  const [users, setUsers] = useState<UserListResponse | null>(null);
  const [topicAnalytics, setTopicAnalytics] = useState<TopicAnalytics[]>([]);
  const [roleAnalytics, setRoleAnalytics] = useState<RoleAnalytics[]>([]);
  const [keywordAnalytics, setKeywordAnalytics] = useState<KeywordAnalytics[]>([]);
  const [peakUsage, setPeakUsage] = useState<PeakUsageAnalytics | null>(null);
  const [timeUsage, setTimeUsage] = useState<TimeUsageAnalytics | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealthMetrics | null>(null);
  const [charts, setCharts] = useState<AdminDashboardCharts | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUserDetails | null>(null);

  // Questions drilldown state
  const [questionsUser, setQuestionsUser] = useState<AdminUserDetails | null>(null);
  const [questionsSessionId, setQuestionsSessionId] = useState<string | null>(null);
  const [questionsDays, setQuestionsDays] = useState<AdminSessionDayPreview[]>([]);
  const [questionsDayNumber, setQuestionsDayNumber] = useState<number | null>(null);
  const [questionsPreview, setQuestionsPreview] = useState<AdminQuestionPreview[]>([]);
  const [isQuestionsLoading, setIsQuestionsLoading] = useState(false);
  
  // Research State
  const [vectorDBStats, setVectorDBStats] = useState<VectorDBStats | null>(null);
  const [queryResults, setQueryResults] = useState<VectorDBQueryResult[]>([]);
  const [researchQuery, setResearchQuery] = useState("");
  const [keywordForm, setKeywordForm] = useState({ keywords: "", role: "", topic: "" });
  const [uploadForm, setUploadForm] = useState({ file: null as File | null, role: "", topic: "", tags: "" });
  const [isResearchLoading, setIsResearchLoading] = useState(false);

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
        const usersData = await adminApi.getUsers(1, 200).catch(() => null);
        if (usersData) setUsers(usersData);
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
        const [usageData, timeUsageData] = await Promise.all([
          adminApi.getPeakUsageAnalytics().catch(() => null),
          adminApi.getTimeUsageAnalytics().catch(() => null),
        ]);
        if (usageData) setPeakUsage(usageData);
        if (timeUsageData) setTimeUsage(timeUsageData);
      }

      if (activeTab === "research") {
        const stats = await adminApi.getVectorDBStats().catch(() => null);
        if (stats) setVectorDBStats(stats);
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

  const handleKeywordSearch = async () => {
    if (!keywordForm.keywords || !keywordForm.role || !keywordForm.topic) {
      toast.error("Please fill in all fields");
      return;
    }
    
    try {
      setIsResearchLoading(true);
      const result = await adminApi.searchAndIndexKeywords(
        keywordForm.keywords,
        keywordForm.role,
        keywordForm.topic
      );
      toast.success(`Indexed ${result.total_chunks_indexed} chunks from search results`);
      // Refresh stats
      const stats = await adminApi.getVectorDBStats();
      setVectorDBStats(stats);
      // Reset form
      setKeywordForm({ keywords: "", role: "", topic: "" });
    } catch (error: any) {
      toast.error(error.message || "Keyword search failed");
    } finally {
      setIsResearchLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!uploadForm.file) {
      toast.error("Please select a file");
      return;
    }
    
    try {
      setIsResearchLoading(true);
      const result = await adminApi.uploadAndIndexDocument(
        uploadForm.file,
        uploadForm.role,
        uploadForm.topic,
        uploadForm.tags
      );
      toast.success(`Indexed ${result.total_chunks_indexed} chunks from document`);
      // Refresh stats
      const stats = await adminApi.getVectorDBStats();
      setVectorDBStats(stats);
      // Reset form
      setUploadForm({ file: null, role: "", topic: "", tags: "" });
    } catch (error: any) {
      toast.error(error.message || "File upload failed");
    } finally {
      setIsResearchLoading(false);
    }
  };

  const handleVectorQuery = async () => {
    if (!researchQuery) return;
    
    try {
      setIsResearchLoading(true);
      const results = await adminApi.queryVectorDB(researchQuery);
      setQueryResults(results);
    } catch (error: any) {
      toast.error("Query failed");
    } finally {
      setIsResearchLoading(false);
    }
  };

  const handleClearVectorDB = async () => {
    if (!confirm("Are you sure you want to clear the ENTIRE vector database? This cannot be undone.")) {
      return;
    }
    
    try {
      setIsResearchLoading(true);
      await adminApi.clearVectorDB();
      toast.success("Vector database cleared");
      const stats = await adminApi.getVectorDBStats();
      setVectorDBStats(stats);
      setQueryResults([]);
    } catch (error: any) {
      toast.error("Failed to clear vector database");
    } finally {
      setIsResearchLoading(false);
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

  const handleSelectQuestionsUser = async (userId: string) => {
    try {
      setIsQuestionsLoading(true);
      setQuestionsSessionId(null);
      setQuestionsDays([]);
      setQuestionsDayNumber(null);
      setQuestionsPreview([]);

      const userDetails = await adminApi.getUserDetails(userId);
      setQuestionsUser(userDetails);
    } catch (error: any) {
      toast.error("Failed to load user details");
    } finally {
      setIsQuestionsLoading(false);
    }
  };

  const handleSelectQuestionsSession = async (sessionId: string) => {
    if (!questionsUser) return;
    try {
      setIsQuestionsLoading(true);
      setQuestionsSessionId(sessionId);
      setQuestionsDays([]);
      setQuestionsDayNumber(null);
      setQuestionsPreview([]);

      const days = await adminApi.getUserSessionDays(questionsUser.user_id, sessionId);
      setQuestionsDays(days);
    } catch (error: any) {
      toast.error("Failed to load session days");
    } finally {
      setIsQuestionsLoading(false);
    }
  };

  const handleSelectQuestionsDay = async (dayNumber: number) => {
    if (!questionsUser || !questionsSessionId) return;
    try {
      setIsQuestionsLoading(true);
      setQuestionsDayNumber(dayNumber);
      const preview = await adminApi.getUserSessionDayQuestions(
        questionsUser.user_id,
        questionsSessionId,
        dayNumber
      );
      setQuestionsPreview(preview);
    } catch (error: any) {
      toast.error("Failed to load questions for day");
    } finally {
      setIsQuestionsLoading(false);
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
          <TabsList className="grid w-full grid-cols-7 bg-muted/50 p-1 overflow-x-auto">
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
            <TabsTrigger value="research" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Research
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
                    <ChartContainer
                      className="h-[220px] w-full aspect-auto"
                      config={{
                        count: {
                          label: "Total users",
                          color: "var(--color-chart-1)",
                        },
                      }}
                    >
                      <LineChart data={charts.user_growth.slice(-30)} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                          dataKey="date"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          minTickGap={24}
                          tickFormatter={(v) => String(v).slice(5)}
                        />
                        <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke="var(--color-count)"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ChartContainer>
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
                  Questions (By User)
                </CardTitle>
                <CardDescription>
                  Select a user to view questions by session and day
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-1">
                    <div className="flex items-center gap-2 mb-3">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2 max-h-[560px] overflow-auto pr-1">
                      {isLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      ) : filteredUsers.length > 0 ? (
                        filteredUsers.map((u) => (
                          <button
                            key={u.user_id}
                            onClick={() => handleSelectQuestionsUser(u.user_id)}
                            className={`w-full text-left p-3 border rounded-lg hover:bg-muted/50 transition-colors ${
                              questionsUser?.user_id === u.user_id ? "bg-muted/60" : ""
                            }`}
                          >
                            <div className="font-medium truncate">{u.email}</div>
                            <div className="text-xs text-muted-foreground mt-1 flex gap-3">
                              <span>Sessions: {u.total_sessions || 0}</span>
                              <span>Qs: {u.total_questions_answered || 0}</span>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">No users found</div>
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    {!questionsUser ? (
                      <div className="text-center py-16 text-muted-foreground">
                        Click a user to view their questions
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold">{questionsUser.email}</div>
                            <div className="text-sm text-muted-foreground">
                              Sessions: {questionsUser.total_sessions} · Questions answered: {questionsUser.total_questions_answered}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setQuestionsUser(null);
                              setQuestionsSessionId(null);
                              setQuestionsDays([]);
                              setQuestionsDayNumber(null);
                              setQuestionsPreview([]);
                            }}
                          >
                            Clear
                          </Button>
                        </div>

                        <div className="border rounded-lg p-4">
                          <div className="font-medium mb-2">Sessions</div>
                          {questionsUser.sessions?.length ? (
                            <div className="flex flex-col gap-2">
                              {questionsUser.sessions.map((s) => (
                                <button
                                  key={s.session_id}
                                  onClick={() => handleSelectQuestionsSession(s.session_id)}
                                  className={`text-left p-3 border rounded-lg hover:bg-muted/50 transition-colors ${
                                    questionsSessionId === s.session_id ? "bg-muted/60" : ""
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="font-medium truncate">{s.session_name}</div>
                                    <Badge variant="outline">{s.role || ""}</Badge>
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    Answered: {s.answered_questions}/{s.total_questions} · Avg score: {s.average_score ? `${s.average_score.toFixed(1)}%` : "N/A"}
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">No sessions found for this user</div>
                          )}
                        </div>

                        {questionsSessionId && (
                          <div className="border rounded-lg p-4">
                            <div className="font-medium mb-2">Days</div>
                            {isQuestionsLoading && questionsDays.length === 0 ? (
                              <div className="flex justify-center py-6">
                                <Loader2 className="h-5 w-5 animate-spin" />
                              </div>
                            ) : questionsDays.length ? (
                              <div className="flex flex-wrap gap-2">
                                {questionsDays.map((d) => (
                                  <Button
                                    key={d.day_number}
                                    variant={questionsDayNumber === d.day_number ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handleSelectQuestionsDay(d.day_number)}
                                  >
                                    Day {d.day_number}{d.plan_date ? ` (${d.plan_date})` : ""}
                                  </Button>
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground">No days found for this session</div>
                            )}
                          </div>
                        )}

                        {questionsDayNumber !== null && (
                          <div className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="font-medium">
                                Questions — Day {questionsDayNumber}
                              </div>
                              {isQuestionsLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                            </div>

                            {questionsPreview.length ? (
                              <Accordion type="single" collapsible className="w-full">
                                {questionsPreview.map((q, idx) => {
                                  const text = (q.question_text || "").trim();
                                  return (
                                    <AccordionItem key={q.question_id} value={q.question_id || String(idx)} className="border rounded-lg mb-2">
                                      <AccordionTrigger className="px-3 py-3 hover:no-underline">
                                        <div className="w-full">
                                          <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1">
                                              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                <FileText className="h-3.5 w-3.5" />
                                                <span>Question {idx + 1}</span>
                                              </div>
                                              <div className="font-medium line-clamp-2">
                                                {text || "(No question text)"}
                                              </div>
                                            </div>
                                            <Badge variant="outline" className="shrink-0">{q.difficulty}</Badge>
                                          </div>

                                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                            <span className="inline-flex items-center gap-1">
                                              <Tag className="h-3.5 w-3.5" />
                                              {q.topic || "unknown"}
                                            </span>
                                            {typeof q.user_score === "number" ? (
                                              <span>Score: {(q.user_score * 100).toFixed(1)}%</span>
                                            ) : null}
                                            {typeof q.is_correct === "boolean" ? (
                                              <span>{q.is_correct ? "Correct" : "Incorrect"}</span>
                                            ) : null}
                                          </div>
                                        </div>
                                      </AccordionTrigger>
                                      <AccordionContent className="px-3">
                                        <div className="rounded-md bg-muted/30 p-3 text-sm leading-relaxed whitespace-pre-wrap">
                                          {text || "(No question text)"}
                                        </div>
                                        {q.user_answer ? (
                                          <div className="mt-3">
                                            <div className="text-xs font-medium text-muted-foreground mb-1">User Answer</div>
                                            <div className="rounded-md border p-3 text-sm leading-relaxed whitespace-pre-wrap">
                                              {q.user_answer}
                                            </div>
                                          </div>
                                        ) : null}
                                      </AccordionContent>
                                    </AccordionItem>
                                  );
                                })}
                              </Accordion>
                            ) : (
                              <div className="text-sm text-muted-foreground">No questions found for this day</div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
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
                  <Activity className="h-5 w-5" />
                  Time Usage
                </CardTitle>
                <CardDescription>
                  Daily active users vs hours spent (session duration)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : timeUsage ? (
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Cumulative Hours Spent</p>
                        <p className="text-2xl font-bold">
                          {timeUsage.total_hours_spent.toFixed(1)}h
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Peak Hour (by hours)</p>
                        <p className="text-2xl font-bold">
                          {timeUsage.peak_hour}:00
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {timeUsage.peak_hour_hours.toFixed(2)}h in last 30 days
                        </p>
                      </div>
                    </div>

                    <ChartContainer
                      className="h-[260px] w-full aspect-auto"
                      config={{
                        active_users: {
                          label: "Active users",
                          color: "var(--color-chart-1)",
                        },
                        hours_spent: {
                          label: "Hours spent",
                          color: "var(--color-chart-2)",
                        },
                      }}
                    >
                      <LineChart data={timeUsage.daily} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                          dataKey="date"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          minTickGap={24}
                          tickFormatter={(v) => String(v).slice(5)}
                        />
                        <YAxis
                          yAxisId="left"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          allowDecimals={false}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          tickFormatter={(v) => `${Number(v).toFixed(0)}h`}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="active_users"
                          stroke="var(--color-active_users)"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="hours_spent"
                          stroke="var(--color-hours_spent)"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ChartContainer>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No time usage analytics available
                  </div>
                )}
              </CardContent>
            </Card>

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

          <TabsContent value="research" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Stats Card */}
              <Card className="col-span-1 shadow-lg border-indigo-200 dark:border-indigo-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-indigo-600" />
                    Vector DB Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isResearchLoading && !vectorDBStats ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : vectorDBStats ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Indexed Items</p>
                        <p className="text-3xl font-bold text-indigo-900 dark:text-indigo-100">{vectorDBStats.total_items}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">By Content Type</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {Object.entries(vectorDBStats.by_content_type).map(([type, count]) => (
                            <div key={type} className="flex justify-between bg-muted p-2 rounded">
                              <span className="capitalize">{type}</span>
                              <span className="font-semibold">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={async () => {
                          const stats = await adminApi.getVectorDBStats();
                          setVectorDBStats(stats);
                        }}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh Stats
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="w-full mt-2"
                        onClick={handleClearVectorDB}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear Database
                      </Button>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Stats not available</p>
                  )}
                </CardContent>
              </Card>

              {/* Actions Column */}
              <div className="col-span-2 space-y-6">
                {/* Keyword Search */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <SearchIcon className="h-5 w-5 text-blue-600" />
                      Keyword Research & Indexing
                    </CardTitle>
                    <CardDescription>
                      Search the web for keywords and index the results into the vector database.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Keywords (comma separated)</Label>
                          <Input 
                            placeholder="e.g. machine learning, system design" 
                            value={keywordForm.keywords}
                            onChange={(e) => setKeywordForm({...keywordForm, keywords: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Role Context</Label>
                          <Input 
                            placeholder="e.g. Software Engineer" 
                            value={keywordForm.role}
                            onChange={(e) => setKeywordForm({...keywordForm, role: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Topic Category</Label>
                        <Input 
                          placeholder="e.g. Technical Interview" 
                          value={keywordForm.topic}
                          onChange={(e) => setKeywordForm({...keywordForm, topic: e.target.value})}
                        />
                      </div>
                      <Button 
                        onClick={handleKeywordSearch} 
                        disabled={isResearchLoading}
                        className="w-full"
                      >
                        {isResearchLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <SearchIcon className="h-4 w-4 mr-2" />}
                        Search & Index
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Document Upload */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileUp className="h-5 w-5 text-green-600" />
                      Document Upload
                    </CardTitle>
                    <CardDescription>
                      Upload PDF, DOCX, or TXT files to be indexed.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>File</Label>
                          <Input 
                            type="file" 
                            onChange={(e) => setUploadForm({...uploadForm, file: e.target.files?.[0] || null})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Role Context</Label>
                          <Input 
                            placeholder="e.g. Product Manager" 
                            value={uploadForm.role}
                            onChange={(e) => setUploadForm({...uploadForm, role: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Topic</Label>
                          <Input 
                            placeholder="e.g. Behavioral Questions" 
                            value={uploadForm.topic}
                            onChange={(e) => setUploadForm({...uploadForm, topic: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Tags (comma separated)</Label>
                          <Input 
                            placeholder="e.g. guide, interview" 
                            value={uploadForm.tags}
                            onChange={(e) => setUploadForm({...uploadForm, tags: e.target.value})}
                          />
                        </div>
                      </div>
                      <Button 
                        onClick={handleFileUpload} 
                        disabled={isResearchLoading}
                        variant="secondary"
                        className="w-full"
                      >
                        {isResearchLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileUp className="h-4 w-4 mr-2" />}
                        Upload & Index
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Query Tester */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-purple-600" />
                  Vector DB Semantic Search
                </CardTitle>
                <CardDescription>
                  Test the retrieval system by running semantic queries.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-6">
                  <Input 
                    placeholder="Enter a query to test retrieval..." 
                    value={researchQuery}
                    onChange={(e) => setResearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleVectorQuery()}
                  />
                  <Button onClick={handleVectorQuery} disabled={isResearchLoading}>
                    Search
                  </Button>
                </div>

                {queryResults.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold">Top Results</h3>
                    <div className="grid gap-4">
                      {queryResults.map((result, idx) => (
                        <div key={idx} className="p-4 border rounded-lg bg-muted/30">
                          <div className="flex justify-between items-start mb-2">
                            <Badge variant="outline">{result.content_type || 'Unknown'}</Badge>
                            <span className="text-sm font-mono text-muted-foreground">Score: {result.score.toFixed(4)}</span>
                          </div>
                          <p className="text-sm mb-2">{result.content}</p>
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            {result.role && <span>Role: {result.role}</span>}
                            {result.topic && <span>Topic: {result.topic}</span>}
                            {result.source && <span>Source: {result.source}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
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
