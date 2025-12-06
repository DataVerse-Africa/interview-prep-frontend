"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
    BarChart3,
    Target,
    Flame,
    Calendar,
    CheckCircle2,
    FileText,
    Clock
} from "lucide-react";
import type { UserStats } from "@/types/user";

interface UserStatsCardProps {
    stats: UserStats;
    isLoading?: boolean;
}

function StatItem({
    icon: Icon,
    label,
    value,
    subValue,
    color,
}: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    subValue?: string;
    color: string;
}) {
    return (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
            <div className={`p-2 rounded-lg ${color}`}>
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-sm text-muted-foreground">{label}</div>
                {subValue && (
                    <div className="text-xs text-muted-foreground">{subValue}</div>
                )}
            </div>
        </div>
    );
}

export function UserStatsCard({ stats, isLoading }: UserStatsCardProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-24 rounded-lg bg-muted/50 animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatItem
                icon={FileText}
                label="Total Sessions"
                value={stats.total_sessions}
                subValue={`${stats.active_sessions} active`}
                color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
            />
            <StatItem
                icon={Flame}
                label="Current Streak"
                value={stats.current_streak}
                subValue={`Best: ${stats.longest_streak} days`}
                color="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
            />
            <StatItem
                icon={Target}
                label="Avg Score"
                value={`${Math.round(stats.average_score * 100)}%`}
                subValue={`${stats.total_questions_answered} questions`}
                color="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
            />
            <StatItem
                icon={Calendar}
                label="Practice Days"
                value={stats.total_practice_days}
                subValue={`${stats.completed_sessions} completed`}
                color="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
            />
        </div>
    );
}
