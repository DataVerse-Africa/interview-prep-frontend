"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FileText, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { resumesApi } from "@/lib/api/resumes";
import { ApiClientError } from "@/lib/api/client";
import { ResumeCard } from "./ResumeCard";
import { ResumeUploadDialog } from "./ResumeUploadDialog";
import type { Resume } from "@/types/resume";

interface ResumeManagerProps {
    onResumesChange?: (resumes: Resume[]) => void;
}

export function ResumeManager({ onResumesChange }: ResumeManagerProps) {
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);

    // Dialog states
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [renameResume, setRenameResume] = useState<Resume | null>(null);
    const [newName, setNewName] = useState("");
    const [deleteResumeId, setDeleteResumeId] = useState<string | null>(null);

    useEffect(() => {
        fetchResumes();
    }, []);

    const fetchResumes = async () => {
        try {
            setIsLoading(true);
            const data = await resumesApi.listResumes();
            setResumes(data);
            onResumesChange?.(data);
        } catch (error) {
            console.error("Error fetching resumes:", error);
            // Don't show error toast for 404 (no resumes yet)
            if (error instanceof ApiClientError && error.status !== 404) {
                toast.error("Failed to load resumes");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpload = async (file: File, name: string) => {
        try {
            const newResume = await resumesApi.uploadResume(file, name);
            setResumes((prev) => [...prev, newResume]);
            onResumesChange?.([...resumes, newResume]);
            toast.success("Resume uploaded successfully!");
        } catch (error) {
            console.error("Error uploading resume:", error);
            if (error instanceof ApiClientError) {
                toast.error(error.data.message || "Failed to upload resume");
            } else {
                toast.error("Failed to upload resume");
            }
            throw error; // Re-throw to keep dialog open
        }
    };

    const handleSetDefault = async (id: string) => {
        setIsActionLoading(true);
        try {
            await resumesApi.setDefaultResume(id);
            // Update local state
            setResumes((prev) =>
                prev.map((r) => ({
                    ...r,
                    is_default: r.id === id,
                }))
            );
            toast.success("Default resume updated!");
        } catch (error) {
            console.error("Error setting default:", error);
            toast.error("Failed to set default resume");
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleRename = async () => {
        if (!renameResume || !newName.trim()) return;

        setIsActionLoading(true);
        try {
            const updated = await resumesApi.updateResume(renameResume.id, {
                name: newName.trim(),
            });
            setResumes((prev) =>
                prev.map((r) => (r.id === renameResume.id ? updated : r))
            );
            toast.success("Resume renamed!");
            setRenameResume(null);
            setNewName("");
        } catch (error) {
            console.error("Error renaming resume:", error);
            toast.error("Failed to rename resume");
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteResumeId) return;

        setIsActionLoading(true);
        try {
            await resumesApi.deleteResume(deleteResumeId);
            setResumes((prev) => prev.filter((r) => r.id !== deleteResumeId));
            toast.success("Resume deleted!");
            setDeleteResumeId(null);
        } catch (error) {
            console.error("Error deleting resume:", error);
            toast.error("Failed to delete resume");
        } finally {
            setIsActionLoading(false);
        }
    };

    if (isLoading) {
        return (
            <Card className="shadow-lg border-blue-200 dark:border-blue-800">
                <CardHeader className="pb-4 pt-5">
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        My Resumes
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card className="shadow-lg border-blue-200 dark:border-blue-800">
                <CardHeader className="pb-4 pt-5">
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        My Resumes
                    </CardTitle>
                    <CardDescription className="mt-2">
                        Manage your resumes for interview prep sessions
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {resumes.length > 0 ? (
                        <>
                            {resumes.map((resume) => (
                                <ResumeCard
                                    key={resume.id}
                                    resume={resume}
                                    onSetDefault={handleSetDefault}
                                    onRename={(r) => {
                                        setRenameResume(r);
                                        setNewName(r.name);
                                    }}
                                    onDelete={(id) => setDeleteResumeId(id)}
                                    isLoading={isActionLoading}
                                />
                            ))}
                        </>
                    ) : (
                        <div className="text-center py-8 px-4 border-2 border-dashed rounded-lg">
                            <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                            <p className="text-muted-foreground mb-1">No resumes uploaded yet</p>
                            <p className="text-sm text-muted-foreground">
                                Upload your first resume to get started
                            </p>
                        </div>
                    )}

                    <Button
                        variant="outline"
                        className="w-full mt-4 border-dashed border-blue-300 hover:border-blue-500 hover:bg-blue-50 dark:border-blue-700 dark:hover:border-blue-500 dark:hover:bg-blue-950"
                        onClick={() => setIsUploadOpen(true)}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Upload New Resume
                    </Button>
                </CardContent>
            </Card>

            {/* Upload Dialog */}
            <ResumeUploadDialog
                open={isUploadOpen}
                onOpenChange={setIsUploadOpen}
                onUpload={handleUpload}
            />

            {/* Rename Dialog */}
            <Dialog
                open={renameResume !== null}
                onOpenChange={(open) => !open && setRenameResume(null)}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Rename Resume</DialogTitle>
                        <DialogDescription>
                            Enter a new name for this resume.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Resume name"
                            onKeyDown={(e) => e.key === "Enter" && handleRename()}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRenameResume(null)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleRename}
                            disabled={!newName.trim() || isActionLoading}
                        >
                            {isActionLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                "Save"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog
                open={deleteResumeId !== null}
                onOpenChange={(open) => !open && setDeleteResumeId(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Resume?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this
                            resume from your account.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isActionLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                "Delete"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
