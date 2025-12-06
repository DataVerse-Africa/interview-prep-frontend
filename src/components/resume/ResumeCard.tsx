"use client";

import { useState } from "react";
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
    FileText,
    MoreVertical,
    Star,
    Pencil,
    Trash2,
    Download,
} from "lucide-react";
import type { Resume } from "@/types/resume";

interface ResumeCardProps {
    resume: Resume;
    onSetDefault: (id: string) => void;
    onRename: (resume: Resume) => void;
    onDelete: (id: string) => void;
    isLoading?: boolean;
}

function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

export function ResumeCard({
    resume,
    onSetDefault,
    onRename,
    onDelete,
    isLoading,
}: ResumeCardProps) {
    return (
        <Card className="border hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
            <CardContent className="py-4 px-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex-shrink-0">
                            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-medium truncate">{resume.name}</span>
                                {resume.is_default && (
                                    <Badge
                                        variant="secondary"
                                        className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 flex-shrink-0"
                                    >
                                        <Star className="h-3 w-3 mr-1 fill-current" />
                                        Default
                                    </Badge>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                                {resume.file_type.toUpperCase()} • {formatFileSize(resume.file_size_bytes)} •{" "}
                                {formatDate(resume.created_at)}
                            </p>
                        </div>
                    </div>

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
                            {!resume.is_default && (
                                <DropdownMenuItem onClick={() => onSetDefault(resume.id)}>
                                    <Star className="h-4 w-4 mr-2" />
                                    Set as Default
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => onRename(resume)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Rename
                            </DropdownMenuItem>
                            {resume.file_uri && (
                                <DropdownMenuItem asChild>
                                    <a
                                        href={resume.file_uri}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Download
                                    </a>
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => onDelete(resume.id)}
                                className="text-red-600 focus:text-red-600"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardContent>
        </Card>
    );
}
