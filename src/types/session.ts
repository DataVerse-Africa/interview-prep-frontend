export interface Session {
    id: string;
    user_id: string;
    onboarding_id?: string | null;
    resume_id?: string | null;
    session_name: string;
    role?: string | null;
    status: 'draft' | 'active' | 'completed' | 'archived';
    resume_uri?: string | null;
    job_description_uri?: string | null;
    created_at: string;
    updated_at: string;
}

export interface CreateSessionPayload {
    name?: string;
    role?: string;
    resume_id?: string;
}

export interface UpdateSessionPayload {
    session_name?: string;
    role?: string;
    status?: string;
}
