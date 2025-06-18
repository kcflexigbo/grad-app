
interface ImageOwner {
    id: number;
    username: string;
    profile_picture_url: string | null;
}

// This is the interface for a simplified tag object.
interface ImageTag {
    id: number;
    name: string;
}

/**
 * This is the main export. The 'export' keyword is crucial.
 * It defines the structure of a single Image object as returned by your API.
 * It should match the `schemas.Image` Pydantic model in your FastAPI backend.
 */
export interface Image {
    id: number;
    image_url: string;
    caption: string | null;
    created_at: string; // Timestamps are typically serialized as ISO strings

    // Nested objects representing relationships
    owner: ImageOwner;
    tags: ImageTag[];

    // These counts should be calculated and included by your backend API
    like_count: number;
    comment_count: number;
}