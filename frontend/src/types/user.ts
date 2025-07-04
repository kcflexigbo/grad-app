export interface UserSimple {
    id: number;
    username: string;
    profile_picture_url?: string | null;
}

export interface User extends UserSimple {
    email: string;
    bio?: string | null;
    allow_downloads: boolean;
    is_admin?: boolean;
    followers_count?: number;
    created_at: string; // Assuming ISO string format from backend
}