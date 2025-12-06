"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Briefcase,
    MoreVertical,
    Pencil,
    Trash2,
    Archive,
    Play,
    Eye,
} from "lucide-react";
import type { Session } from "@/types/session";

interface SessionCardProps {
    session: Session;
    onRename: (session: Session) => void;
    onDelete: (id: string) => void;
    onArchive: (id: string) => void;
    onContinue: (session: Session) => void;
    isLoading?: boolean;
}

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function getStatusBadge(status: string) {
    switch (status) {
        case "draft":
            return (
                <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                    Draft
                </Badge>
            );
        case "active":
            return (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Active
                </Badge>
            );
        case "completed":
            return (
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    Completed
                </Badge>
            );
        case "archived":
            return (
                <Badge variant="outline" className="text-muted-foreground">
                    Archived
                </Badge>
            );
        default:
            return <Badge variant="secondary">{status}</Badge>;
    }
}

export function SessionCard({
    session,
    onRename,
    onDelete,
    onArchive,
    onContinue,
    isLoading,
}: SessionCardProps) {
    return (
        <Card className="border hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
            <CardContent className="py-4 px-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex-shrink-0">
                            <Briefcase className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-medium truncate">{session.session_name || "Untitled Session"}</span>
                                {getStatusBadge(session.status)}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                                {session.role || "No role set"} • {formatDate(session.created_at)}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant={session.status === "completed" ? "outline" : "default"}
                            className={session.status !== "completed" ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white" : ""}
                            onClick={() => onContinue(session)}
                            disabled={isLoading}
                        >
                            {session.status === "completed" ? (
                                <>
                                    <Eye className="h-4 w-4 mr-1" />
                                    View
                                </>
                            ) : (
                                <>
                                    <Play className="h-4 w-4 mr-1" />
                                    Continue
                                </>
                            )}
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 flex-shrink-0"
                                    disabled={isLoading}
                                >
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onRename(session)}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Rename
                                </DropdownMenuItem>
                                {session.status !== "archived" && (
                                    <DropdownMenuItem onClick={() => onArchive(session.id)}>
                                        <Archive className="h-4 w-4 mr-2" />
                                        Archive
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => onDelete(session.id)}
                                    className="text-red-600 focus:text-red-600"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
