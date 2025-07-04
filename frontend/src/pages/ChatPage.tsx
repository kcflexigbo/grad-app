import { useState, useEffect } from 'react';
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';

import apiService from '../api/apiService';
import { useAuth } from '../hooks/useAuth';
import { useWebSocket } from '../hooks/useWebSocket';
import { WS_URL } from '../api/config';

import { ChatLayout } from '../components/chat/ChatLayout';
import { PageHelmet } from '../components/layout/PageHelmet';

import type { Conversation, Message } from '../types/chat';

const MESSAGES_PAGE_SIZE = 50;

// --- API Fetcher Functions ---
const fetchConversations = async (): Promise<Conversation[]> => {
    const { data } = await apiService.get('/chat/conversations');
    return data;
};

const fetchMessages = async ({ pageParam = 0, queryKey }: any): Promise<{ messages: Message[], nextPage: number | undefined }> => {
    const [_key, conversationId] = queryKey;
    const { data } = await apiService.get<Message[]>(`/chat/conversations/${conversationId}/messages`, {
        params: {
            limit: MESSAGES_PAGE_SIZE,
            skip: pageParam,
        },
    });
    return {
        messages: data.reverse(), // Reverse to display oldest first
        nextPage: data.length === MESSAGES_PAGE_SIZE ? pageParam + MESSAGES_PAGE_SIZE : undefined,
    };
};

export const ChatPage = () => {
    const { isLoggedIn } = useAuth();
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const [selectedConversationId, setSelectedConversationId] = useState<number | null>(
        parseInt(searchParams.get('id') || '', 10) || null
    );

    // --- Data Queries ---
    const { data: conversations, isLoading: isLoadingConversations } = useQuery({
        queryKey: ['conversations'],
        queryFn: fetchConversations,
        enabled: isLoggedIn,
    });

    const {
        data: messagesData,
        isLoading: isLoadingMessages,
        hasNextPage,
        fetchNextPage,
    } = useInfiniteQuery({
        queryKey: ['messages', selectedConversationId],
        queryFn: fetchMessages,
        enabled: !!selectedConversationId,
        getNextPageParam: (lastPage) => lastPage.nextPage,
        initialPageParam: 0
    });

    const allMessages = messagesData?.pages.flatMap(page => page.messages) ?? [];

    // --- WebSocket Connection ---
    const token = localStorage.getItem('accessToken');
    const wsUrl = selectedConversationId ? `${WS_URL}/ws/chat/${selectedConversationId}?token=${token}` : null;
    const { lastMessage, sendMessage, readyState } = useWebSocket<Message>(wsUrl);

    // --- Effects ---
    // Update URL when a conversation is selected
    useEffect(() => {
        if (selectedConversationId) {
            setSearchParams({ id: selectedConversationId.toString() });
        }
    }, [selectedConversationId, setSearchParams]);

    // Handle incoming WebSocket messages
    useEffect(() => {
        if (lastMessage) {
            // Add the new message to the react-query cache for instant UI update
            queryClient.setQueryData(['messages', lastMessage.conversation_id], (oldData: any) => {
                if (!oldData) return oldData;
                const lastPage = oldData.pages[oldData.pages.length - 1];
                lastPage.messages.push(lastMessage);
                return { ...oldData };
            });

             // Also update the last_message in the conversations list for the sidebar
            queryClient.setQueryData(['conversations'], (oldConversations: Conversation[] | undefined) => {
                return oldConversations?.map(conv =>
                    conv.id === lastMessage.conversation_id
                        ? { ...conv, last_message: lastMessage }
                        : conv
                ).sort((a, b) => new Date(b.last_message?.created_at || 0).getTime() - new Date(a.last_message?.created_at || 0).getTime()) || [];
            });
        }
    }, [lastMessage, queryClient]);


    // --- Event Handlers ---
    const handleSelectConversation = (id: number) => {
        setSelectedConversationId(id);
    };

    const handleSendMessage = (content: string) => {
        if (readyState === 1) { // WebSocket is OPEN
            sendMessage({ content });
        } else {
            console.error("WebSocket is not ready to send messages.");
        }
    };

    const selectedConversation = conversations?.find(c => c.id === selectedConversationId);

    return (
        <>
            <PageHelmet title="Chat" description="Private conversations with other users." />
            <ChatLayout
                conversations={conversations || []}
                messages={allMessages}
                selectedConversation={selectedConversation}
                onSelectConversation={handleSelectConversation}
                onSendMessage={handleSendMessage}
                isLoadingConversations={isLoadingConversations}
                isLoadingMessages={isLoadingMessages && allMessages.length === 0}
                hasMoreMessages={!!hasNextPage}
                onLoadMoreMessages={fetchNextPage}
            />
        </>
    );
};