import type { Conversation } from '../../types/chat';
import { useAuth } from '../../hooks/useAuth';

interface ConversationListItemProps {
    conversation: Conversation;
    isSelected: boolean;
    onClick: () => void;
}

export const ConversationListItem = ({ conversation, isSelected, onClick }: ConversationListItemProps) => {
    const { user: currentUser } = useAuth();

    // Find the other participant in the 1-on-1 chat
    const otherParticipant = conversation.participants.find(p => p.id !== currentUser?.id);

    if (!otherParticipant) {
        // This can happen in a group chat context or if data is malformed
        return null;
    }

    const lastMessage = conversation.last_message;
    const itemClasses = `
        w-full flex items-center gap-3 p-3 text-left rounded-lg cursor-pointer transition-colors
        ${isSelected ? 'bg-blue-100' : 'hover:bg-gray-100'}
    `;

    return (
        <li key={conversation.id}>
            <button onClick={onClick} className={itemClasses}>
                <div className="relative flex-shrink-0">
                    <img
                        src={otherParticipant.profile_picture_url || 'https://s3.amazonaws.com/37assets/svn/765-default-avatar.png'}
                        alt={otherParticipant.username}
                        className="w-12 h-12 rounded-full object-cover"
                    />
                    {/* Future feature: Online status indicator can be placed here */}
                </div>
                <div className="flex-grow overflow-hidden">
                    <p className="font-semibold text-gray-800 truncate">{otherParticipant.username}</p>
                    <p className="text-sm text-gray-500 truncate">
                        {lastMessage ? lastMessage.content : 'No messages yet...'}
                    </p>
                </div>
                {lastMessage && (
                     <div className="text-xs text-gray-400 self-start flex-shrink-0">
                        {new Date(lastMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                )}
            </button>
        </li>
    );
};