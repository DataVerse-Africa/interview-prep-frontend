"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Briefcase, Plus, Loader2 } from "lucide-react";
import { SessionCard } from "./SessionCard";
import { sessionsApi } from "@/lib/api/sessions";
import type { Session } from "@/types/session";
import { toast } from "sonner";

export function SessionManager() {
    const router = useRouter();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showRenameDialog, setShowRenameDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedSession, setSelectedSession] = useState<Session | null>(null);
    const [newSessionName, setNewSessionName] = useState("");
    const [newSessionRole, setNewSessionRole] = useState("");

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            setIsLoading(true);
            const data = await sessionsApi.listSessions();
            setSessions(data);
        } catch (error) {
            console.error("Failed to fetch sessions:", error);
            toast.error("Failed to load sessions");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newSessionName.trim()) {
            toast.error("Please enter a session name");
            return;
        }

        setIsCreating(true);
        try {
            const session = await sessionsApi.createSession({
                name: newSessionName,
                role: newSessionRole || undefined,
            });
            setSessions([session, ...sessions]);
            setShowCreateDialog(false);
            setNewSessionName("");
            setNewSessionRole("");
            toast.success("Session created!");

            // Redirect to onboarding with session_id
            router.push(`/onboarding?session_id=${session.id}`);
        } catch (error) {
            console.error("Failed to create session:", error);
            toast.error("Failed to create session");
        } finally {
            setIsCreating(false);
        }
    };

    const handleRename = async () => {
        if (!selectedSession || !newSessionName.trim()) return;

        try {
            const updated = await sessionsApi.updateSession(selectedSession.id, {
                session_name: newSessionName,
            });
            setSessions(sessions.map((s) => (s.id === updated.id ? updated : s)));
            setShowRenameDialog(false);
            setSelectedSession(null);
            setNewSessionName("");
            toast.success("Session renamed!");
        } catch (error) {
            console.error("Failed to rename session:", error);
            toast.error("Failed to rename session");
        }
    };

    const handleDelete = async () => {
        if (!selectedSession) return;

        try {
            await sessionsApi.deleteSession(selectedSession.id);
            setSessions(sessions.filter((s) => s.id !== selectedSession.id));
            setShowDeleteDialog(false);
            setSelectedSession(null);
            toast.success("Session deleted!");
        } catch (error) {
            console.error("Failed to delete session:", error);
            toast.error("Failed to delete session");
        }
    };

    const handleArchive = async (id: string) => {
        try {
            const updated = await sessionsApi.archiveSession(id);
            setSessions(sessions.map((s) => (s.id === updated.id ? updated : s)));
            toast.success("Session archived!");
        } catch (error) {
            console.error("Failed to archive session:", error);
            toast.error("Failed to archive session");
        }
    };

    const handleContinue = (session: Session) => {
        if (session.status === "draft") {
            // Go to onboarding to complete setup
            router.push(`/onboarding?session_id=${session.id}`);
        } else {
            // Go to session dashboard
            router.push(`/dashboard?session=${session.id}`);
        }
    };

    const openRenameDialog = (session: Session) => {
        setSelectedSession(session);
        setNewSessionName(session.session_name || "");
        setShowRenameDialog(true);
    };

    const openDeleteDialog = (id: string) => {
        const session = sessions.find((s) => s.id === id);
        if (session) {
            setSelectedSession(session);
            setShowDeleteDialog(true);
        }
    };

    return (
        <>
            <Card className="shadow-lg border-indigo-200 dark:border-indigo-800">
                <CardHeader className="pb-4 pt-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Briefcase className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                My Sessions
                            </CardTitle>
                            <CardDescription className="mt-2">
                                Manage your interview prep sessions
                            </CardDescription>
                        </div>
                        <Button
                            onClick={() => setShowCreateDialog(true)}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            New Session
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="pt-2">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No sessions yet</p>
                            <p className="text-sm">Create your first session to get started!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {sessions.map((session) => (
                                <SessionCard
                                    key={session.id}
                                    session={session}
                                    onRename={openRenameDialog}
                                    onDelete={openDeleteDialog}
                                    onArchive={handleArchive}
                                    onContinue={handleContinue}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Create New Session</DialogTitle>
                        <DialogDescription>
                            Start a new interview prep session for a specific role.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="session-name">Session Name</Label>
                            <Input
                                id="session-name"
                                placeholder="e.g., ML Engineer @ Google"
                                value={newSessionName}
                                onChange={(e) => setNewSessionName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="session-role">Target Role (optional)</Label>
                            <Input
                                id="session-role"
                                placeholder="e.g., Machine Learning Engineer"
                                value={newSessionRole}
                                onChange={(e) => setNewSessionRole(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreate}
                            disabled={isCreating || !newSessionName.trim()}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                        >
                            {isCreating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Create & Setup"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Rename Dialog */}
            <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Rename Session</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="rename-input">Session Name</Label>
                        <Input
                            id="rename-input"
                            value={newSessionName}
                            onChange={(e) => setNewSessionName(e.target.value)}
                            className="mt-2"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRenameDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleRename}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Session?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete "{selectedSession?.session_name}". This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
