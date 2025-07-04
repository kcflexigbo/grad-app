import type { Conversation } from '../../types/chat';
import { ConversationListItem } from './ConversationListItem';
import { MessageSquare } from 'lucide-react';

interface ConversationListProps {
    conversations: Conversation[];
    selectedConversationId: number | null;
    onSelectConversation: (id: number) => void;
    isLoading: boolean;
}

const ConversationListSkeleton = () => (
    <ul className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg animate-pulse">
                <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                <div className="flex-grow space-y-2">
                    <div className="h-4 w-3/4 bg-gray-300 rounded"></div>
                    <div className="h-3 w-1/2 bg-gray-300 rounded"></div>
                </div>
            </li>
        ))}
    </ul>
);

export const ConversationList = ({ conversations, selectedConversationId, onSelectConversation, isLoading }: ConversationListProps) => {

    if (isLoading) {
        return <ConversationListSkeleton />;
    }

    if (conversations.length === 0) {
        return (
            <div className="text-center p-8 text-gray-500">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-2 text-sm font-semibold">No Conversations</h3>
                <p className="mt-1 text-sm">Start a chat from a user's profile.</p>
            </div>
        );
    }

    return (
        <nav className="h-full">
            <ul className="space-y-2">
                {conversations.map(conv => (
                    <ConversationListItem
                        key={conv.id}
                        conversation={conv}
                        isSelected={conv.id === selectedConversationId}
                        onClick={() => onSelectConversation(conv.id)}
                    />
                ))}
            </ul>
        </nav>
    );
};