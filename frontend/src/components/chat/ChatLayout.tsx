import type { Conversation, Message } from '../../types/chat';

import { ConversationList } from './ConversationList';
import { ChatWindow } from './ChatWindow';
import { MessageSquareText } from 'lucide-react';

interface ChatLayoutProps {
    conversations: Conversation[];
    messages: Message[];
    selectedConversation: Conversation | undefined;
    onSelectConversation: (id: number) => void;
    onSendMessage: (content: string) => void;
    isLoadingConversations: boolean;
    isLoadingMessages: boolean;
    hasMoreMessages: boolean;
    onLoadMoreMessages: () => void;
    onGoBack: () => void;
}

export const ChatLayout = ({
    conversations,
    messages,
    selectedConversation,
    onSelectConversation,
    onSendMessage,
    isLoadingConversations,
    isLoadingMessages,
    hasMoreMessages,
    onLoadMoreMessages,
    onGoBack,
}: ChatLayoutProps) => {

    return (
        <div className="flex border rounded-lg overflow-hidden shadow-md" style={{ height: '75vh' }}>
            {/* Sidebar with Conversation List */}
            {/* On mobile, this is hidden when a chat is open. On desktop, it's a block. */}
            <aside className={`
                ${selectedConversation ? 'hidden' : 'block w-full'}
                md:block md:w-1/3 md:min-w-[280px] md:max-w-[360px]
                bg-gray-50 border-r overflow-y-auto transition-all duration-300
            `}>
                <div className="p-4 border-b">
                    <h1 className="text-xl font-bold">Chats</h1>
                </div>
                <div className="p-2">
                     <ConversationList
                        conversations={conversations}
                        selectedConversationId={selectedConversation?.id || null}
                        onSelectConversation={onSelectConversation}
                        isLoading={isLoadingConversations}
                    />
                </div>
            </aside>

            {/* Main Chat Window */}
            {/* On mobile, this is shown only when a chat is open. On desktop, it's always visible. */}
            <main className={`
                ${selectedConversation ? 'block w-full' : 'hidden'}
                md:block md:flex-grow h-full
            `}>
                {selectedConversation ? (
                    <ChatWindow
                        conversation={selectedConversation}
                        messages={messages}
                        onSendMessage={onSendMessage}
                        isLoadingMessages={isLoadingMessages}
                        hasMoreMessages={hasMoreMessages}
                        onLoadMoreMessages={onLoadMoreMessages}
                        onGoBack={onGoBack}
                    />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500">
                        <MessageSquareText size={64} className="text-gray-300"/>
                        <h2 className="mt-4 text-xl font-semibold">Select a conversation</h2>
                        <p>Choose from your conversations on the left to start chatting.</p>
                    </div>
                )}
            </main>
        </div>
    );
};