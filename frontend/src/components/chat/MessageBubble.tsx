import type { Message } from '../../types/chat';
import type { UserSimple } from '../../types/user';

interface MessageBubbleProps {
    message: Message;
    isOwnMessage: boolean;
    sender: UserSimple;
}

export const MessageBubble = ({ message, isOwnMessage, sender }: MessageBubbleProps) => {
    const bubbleAlignment = isOwnMessage ? 'items-end' : 'items-start';
    const bubbleStyle = isOwnMessage
        ? 'bg-blue-500 text-white'
        : 'bg-gray-200 text-gray-800';
    const timeAlignment = isOwnMessage ? 'text-right' : 'text-left';

    return (
        <div className={`flex flex-col ${bubbleAlignment} gap-1`}>
            <div className="flex items-end gap-2 max-w-sm">
                {!isOwnMessage && (
                    <img
                        src={sender.profile_picture_url || 'https://s3.amazonaws.com/37assets/svn/765-default-avatar.png'}
                        alt={sender.username}
                        className="w-6 h-6 rounded-full object-cover self-end"
                    />
                )}
                 <div className={`px-4 py-2 rounded-2xl ${bubbleStyle}`}>
                    <p className="text-sm">{message.content}</p>
                </div>
            </div>
            <p className={`text-xs text-gray-400 px-2 ${timeAlignment}`}>
                {new Date(message.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </p>
        </div>
    );
};