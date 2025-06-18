interface CommentAuthor {
    id: number;
    username: string;
    profile_picture_url: string | null;
}

export interface Comment {
    id: number;
    content: string;
    created_at: string; // ISO string
    author: CommentAuthor;
}