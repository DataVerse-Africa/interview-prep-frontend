export interface Resume {
    id: string;
    user_id: string;
    name: string;
    file_uri: string;
    text_uri?: string;      // Path to extracted text version
    file_type: string;      // e.g., "pdf", "docx"
    file_size_bytes: number;
    is_default: boolean;
    created_at: string;
    updated_at: string;
}
