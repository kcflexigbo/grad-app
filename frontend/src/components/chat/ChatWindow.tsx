import { useEffect, useRef } from 'react';
import type { Message, Conversation } from '../../types/chat';
import { useAuth } from '../../hooks/useAuth';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { Loader2, ArrowLeft } from 'lucide-react';

interface ChatWindowProps {
    conversation: Conversation;
    messages: Message[];
    onSendMessage: (content: string) => void;
    isLoadingMessages: boolean;
    hasMoreMessages: boolean;
    onLoadMoreMessages: () => void;
    onGoBack: () => void;
}

export const ChatWindow = ({
    conversation,
    messages,
    onSendMessage,
    isLoadingMessages,
    hasMoreMessages,
    onLoadMoreMessages,
    onGoBack
}: ChatWindowProps) => {
    const { user: currentUser } = useAuth();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const topOfListRef = useRef<HTMLDivElement>(null);

    // Find the other participant to display their info in the header
    const otherParticipant = conversation.participants.find(p => p.id !== currentUser?.id);

    // Scroll to the bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Intersection observer for infinite scroll (loading older messages)
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMoreMessages) {
                    onLoadMoreMessages();
                }
            },
            { threshold: 1.0 }
        );

        const topElement = topOfListRef.current;
        if (topElement) {
            observer.observe(topElement);
        }

        return () => {
            if (topElement) {
                observer.unobserve(topElement);
            }
        };
    }, [hasMoreMessages, onLoadMoreMessages]);


    return (
        <div className="flex flex-col h-full bg-white md:border-l">
            {/* Header */}
            <header className="p-4 border-b flex items-center gap-3">
                {/* Back button for mobile view */}
                <button onClick={onGoBack} className="md:hidden p-2 -ml-2 text-gray-600 hover:text-gray-800" aria-label="Back to conversations">
                    <ArrowLeft size={20} />
                </button>
                <img
                    src={otherParticipant?.profile_picture_url || 'https://s3.amazonaws.com/37assets/svn/765-default-avatar.png'}
                    alt={otherParticipant?.username}
                    className="w-10 h-10 rounded-full object-cover"
                />
                <h2 className="font-bold text-lg">{otherParticipant?.username}</h2>
            </header>

            {/* Messages Area */}
            <div className="flex-grow p-4 overflow-y-auto space-y-4">
                 <div ref={topOfListRef}>
                    {isLoadingMessages && (
                        <div className="flex justify-center py-4">
                            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                        </div>
                    )}
                 </div>

                {messages.map(msg => {
                    const sender = conversation.participants.find(p => p.id === msg.sender_id);
                    if (!sender) return null; // Should not happen with good data
                    return (
                        <MessageBubble
                            key={msg.id}
                            message={msg}
                            isOwnMessage={msg.sender_id === currentUser?.id}
                            sender={sender}
                        />
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <MessageInput onSendMessage={onSendMessage} isSending={false} />
        </div>
    );
};