interface NotificationActor {
    id: number;
    username: string;
}

export interface Notification {
    id: number;
    type: 'like' | 'comment' | 'follow' | 'download' | 'chat_message';
    is_read: boolean;
    created_at: string;
    actor: NotificationActor;
    related_entity_id: number | null;
}