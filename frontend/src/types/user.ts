export interface User {
    id: number;
    username: string;
    email: string;
    bio?: string | null;
    profile_picture_url?: string | null;
    allow_downloads: boolean;
    created_at: string; // Assuming ISO string format from backend
}