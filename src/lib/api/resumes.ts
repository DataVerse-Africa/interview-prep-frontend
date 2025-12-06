import { apiClient } from './client';
import type { Resume } from '@/types/resume';

// Response type for list endpoint
interface ListResumesResponse {
    resumes: Resume[];
    total: number;
}

// Payload for PATCH update
interface UpdateResumePayload {
    name?: string;
    is_default?: boolean;
}

export const resumesApi = {
    /**
     * GET /api/resumes - List all user's resumes
     * Returns paginated response: { resumes: [...], total: number }
     */
    listResumes: async (): Promise<Resume[]> => {
        const response = await apiClient.get<ListResumesResponse>('/api/resumes');
        return response.resumes;
    },

    /**
     * POST /api/resumes - Upload a new resume
     */
    uploadResume: async (file: File, name?: string): Promise<Resume> => {
        const formData = new FormData();
        formData.append('resume_file', file);
        if (name) {
            formData.append('name', name);
        }
        return apiClient.postFormData<Resume>('/api/resumes', formData);
    },

    /**
     * GET /api/resumes/{resume_id} - Get resume details
     */
    getResume: async (resumeId: string): Promise<Resume> => {
        return apiClient.get<Resume>(`/api/resumes/${resumeId}`);
    },

    /**
     * PATCH /api/resumes/{resume_id} - Update resume name or set as default
     */
    updateResume: async (resumeId: string, data: UpdateResumePayload): Promise<Resume> => {
        return apiClient.patch<Resume>(`/api/resumes/${resumeId}`, data);
    },

    /**
     * DELETE /api/resumes/{resume_id} - Delete a resume
     */
    deleteResume: async (resumeId: string): Promise<void> => {
        return apiClient.delete(`/api/resumes/${resumeId}`);
    },

    /**
     * POST /api/resumes/{resume_id}/set-default - Set as default resume
     */
    setDefaultResume: async (resumeId: string): Promise<Resume> => {
        return apiClient.post<Resume>(`/api/resumes/${resumeId}/set-default`, {});
    },
};
