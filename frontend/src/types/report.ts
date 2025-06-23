interface Reporter {
    id: number;
    username: string;
}

export interface Report {
    id: number;
    status: 'pending' | 'resolved' | 'dismissed';
    reason: string | null;
    reporter: Reporter;
    reported_media_id: number | null;
    reported_comment_id: number | null;
    created_at: string;
}