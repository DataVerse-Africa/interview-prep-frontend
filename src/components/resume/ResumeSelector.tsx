"use client";

import { useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Upload, FileText, Star, Loader2 } from "lucide-react";
import { resumesApi } from "@/lib/api/resumes";
import type { Resume } from "@/types/resume";

interface ResumeSelectorProps {
    selectedResumeId: string | null;
    newResumeFile: File | null;
    resumeSource: "existing" | "new";
    onResumeSourceChange: (source: "existing" | "new") => void;
    onResumeIdChange: (id: string | null) => void;
    onNewFileChange: (file: File | null) => void;
}

export function ResumeSelector({
    selectedResumeId,
    newResumeFile,
    resumeSource,
    onResumeSourceChange,
    onResumeIdChange,
    onNewFileChange,
}: ResumeSelectorProps) {
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchResumes();
    }, []);

    const fetchResumes = async () => {
        try {
            setIsLoading(true);
            const data = await resumesApi.listResumes();
            setResumes(data);

            // If user has resumes, default to selecting existing
            if (data.length > 0) {
                onResumeSourceChange("existing");
                // Auto-select default resume if available
                const defaultResume = data.find((r) => r.is_default);
                if (defaultResume) {
                    onResumeIdChange(defaultResume.id);
                } else {
                    onResumeIdChange(data[0].id);
                }
            } else {
                // No resumes, default to upload new
                onResumeSourceChange("new");
            }
        } catch (error) {
            // If 404 or error, assume no resumes
            console.error("[ResumeSelector] Error fetching resumes:", error);
            onResumeSourceChange("new");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        onNewFileChange(file);
    };

    const handleSourceChange = (value: "existing" | "new") => {
        onResumeSourceChange(value);
        if (value === "existing" && resumes.length > 0) {
            // Auto-select default or first resume
            const defaultResume = resumes.find((r) => r.is_default);
            onResumeIdChange(defaultResume?.id || resumes[0].id);
            onNewFileChange(null);
        } else if (value === "new") {
            onResumeIdChange(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {resumes.length > 0 ? (
                <RadioGroup
                    value={resumeSource}
                    onValueChange={(v) => handleSourceChange(v as "existing" | "new")}
                    className="space-y-4"
                >
                    {/* Option 1: Use existing resume */}
                    <div className="flex items-start space-x-3">
                        <RadioGroupItem value="existing" id="existing" className="mt-1" />
                        <div className="flex-1 space-y-2">
                            <Label
                                htmlFor="existing"
                                className="font-medium cursor-pointer"
                            >
                                Use an existing resume
                            </Label>
                            {resumeSource === "existing" && (
                                <Select
                                    value={selectedResumeId || ""}
                                    onValueChange={onResumeIdChange}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select a resume" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {resumes.map((resume) => (
                                            <SelectItem key={resume.id} value={resume.id}>
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                                    <span>{resume.name}</span>
                                                    {resume.is_default && (
                                                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                                    )}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </div>

                    {/* Option 2: Upload new resume */}
                    <div className="flex items-start space-x-3">
                        <RadioGroupItem value="new" id="new" className="mt-1" />
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="new" className="font-medium cursor-pointer">
                                Upload a new resume
                            </Label>
                            {resumeSource === "new" && (
                                <div
                                    className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        accept=".pdf,.doc,.docx,.txt"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                    {newResumeFile ? (
                                        <div className="flex items-center justify-center gap-2 text-primary">
                                            <FileText className="h-8 w-8" />
                                            <span className="font-medium">{newResumeFile.name}</span>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                                            <p className="text-muted-foreground">
                                                Click to upload or drag and drop
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                PDF, DOC, DOCX, or TXT (Max 5MB)
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </RadioGroup>
            ) : (
                /* No existing resumes - show upload only */
                <div className="space-y-2">
                    <div
                        className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept=".pdf,.doc,.docx,.txt"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        {newResumeFile ? (
                            <div className="flex items-center justify-center gap-2 text-primary">
                                <FileText className="h-8 w-8" />
                                <span className="font-medium">{newResumeFile.name}</span>
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
                    </div>
                </div>
            )}
        </div>
    );
}
