import type { UserSimple } from './user';

export interface Message {
    id: number;
    conversation_id: number;
    sender_id: number;
    content: string;
    created_at: string; // ISO string
    sender: UserSimple;
}

export interface Conversation {
    id: number;
    type: 'one_to_one' | 'group';
    participants: UserSimple[];
    last_message: Message | null;
}