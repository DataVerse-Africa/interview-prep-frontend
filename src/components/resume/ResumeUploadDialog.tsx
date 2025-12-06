"use client";

import { useState, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Loader2 } from "lucide-react";

interface ResumeUploadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpload: (file: File, name: string) => Promise<void>;
}

export function ResumeUploadDialog({
    open,
    onOpenChange,
    onUpload,
}: ResumeUploadDialogProps) {
    const [file, setFile] = useState<File | null>(null);
    const [name, setName] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0] || null;
        setFile(selectedFile);
        if (selectedFile && !name) {
            // Auto-fill name from filename (without extension)
            const baseName = selectedFile.name.replace(/\.[^/.]+$/, "");
            setName(baseName);
        }
    };

    const handleSubmit = async () => {
        if (!file) return;

        setIsUploading(true);
        try {
            await onUpload(file, name || file.name);
            // Reset form
            setFile(null);
            setName("");
            onOpenChange(false);
        } catch (error) {
            // Error handling is done in parent
        } finally {
            setIsUploading(false);
        }
    };

    const handleClose = () => {
        if (!isUploading) {
            setFile(null);
            setName("");
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Upload Resume</DialogTitle>
                    <DialogDescription>
                        Upload a new resume to use for your interview prep sessions.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* File Upload Area */}
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
                        {file ? (
                            <div className="flex items-center justify-center gap-2 text-primary overflow-hidden">
                                <FileText className="h-8 w-8 flex-shrink-0" />
                                <span className="font-medium truncate max-w-[250px]">{file.name}</span>
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

                    {/* Resume Name */}
                    <div className="space-y-2">
                        <Label htmlFor="resume-name">Resume Name</Label>
                        <Input
                            id="resume-name"
                            placeholder="e.g., Software Engineer Resume"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Give your resume a friendly name to identify it later.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={isUploading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!file || isUploading}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Resume
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
