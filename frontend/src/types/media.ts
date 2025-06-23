interface MediaOwner {
    id: number;
    username: string;
    profile_picture_url: string | null;
    allow_downloads: boolean;
}

interface MediaTag {
    id: number;
    name: string;
}

export interface Media {
    id: number;
    media_url: string;
    media_type: 'image' | 'video';
    caption: string | null;
    created_at: string;
    owner: MediaOwner;
    tags: MediaTag[];
    like_count: number;
    comment_count: number;
    is_featured: boolean;
}