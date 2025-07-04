import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import apiService from '../api/apiService';
import type { Notification } from '../types/notification';
import { Heart, MessageCircle, UserPlus, Download, CheckCircle, MessageSquareText } from 'lucide-react';
import {PageHelmet} from "../components/layout/PageHelmet.tsx";
import toast from "react-hot-toast";
import type {JSX} from "react";

const fetchNotifications = async (): Promise<Notification[]> => {
    const { data } = await apiService.get('/notifications');
    return data;
};

export const NotificationsPage = () => {
    const queryClient = useQueryClient();
    const { data: notifications, isLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: fetchNotifications,
    });

    const markAsReadMutation = useMutation({
        mutationFn: (notificationId: number) => apiService.post(`/notifications/${notificationId}/read`),
        onMutate: async (notificationId: number) => {
            await queryClient.cancelQueries({ queryKey: ['notifications'] });

            const previousNotifications = queryClient.getQueryData<Notification[]>(['notifications']);

            if (previousNotifications) {
                queryClient.setQueryData<Notification[]>(['notifications'],
                    previousNotifications.map(n =>
                        n.id === notificationId ? { ...n, is_read: true } : n
                    )
                );
            }

            return { previousNotifications };
        },
        onError: (_err, _vars, context) => {
            if (context?.previousNotifications) {
                queryClient.setQueryData(['notifications'], context.previousNotifications);
            }
            toast.error("Failed to mark as read. Please try again.");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    if (isLoading) return (
            <div>Loading notifications...</div>
    );

    const renderNotificationContent = (notification: Notification) => {
        let text = '';
        let link = '/';
        let icon: JSX.Element = <></>;

        switch (notification.type) {
            case 'like':
                icon = <Heart className="text-red-500" size={20} />;
                text = 'liked your media.';
                link = `/media/${notification.related_entity_id}`;
                break;
            case 'comment':
                icon = <MessageCircle className="text-blue-500" size={20} />;
                text = 'commented on your media.';
                link = `/media/${notification.related_entity_id}`;
                break;
            case 'follow':
                icon = <UserPlus className="text-purple-500" size={20} />;
                text = 'started following you.';
                link = `/profile/${notification.actor.username}`;
                break;
            case 'download':
                icon = <Download className="text-green-500" size={20} />;
                text = 'downloaded your media.';
                link = `/media/${notification.related_entity_id}`;
                break;
            case 'chat_message':
                icon = <MessageSquareText className="text-cyan-500" size={20} />;
                text = 'sent you a message.';
                link = `/chat?id=${notification.related_entity_id}`;
                break;
        }

        return { icon, text, link };
    };

    return (
        <>
            <PageHelmet title={"Notifications"} description={"View your notifications and manage your account."} />
             <div className="max-w-4xl mx-auto space-y-8">
                <header>
                    <h1 className="text-4xl font-bold font-serif text-gray-800">Notifications</h1>
                </header>

                <div className="space-y-3">
                    {notifications && notifications.length > 0 ? notifications.map(notification => {
                        const { icon, text, link } = renderNotificationContent(notification);
                        const isReadClass = notification.is_read ? 'opacity-60' : 'bg-blue-50';

                        return (
                            <div key={notification.id} className={`flex items-center gap-4 p-4 border rounded-lg transition-all ${isReadClass}`}>
                                <div className="flex-shrink-0">{icon}</div>
                                <div className="flex-grow">
                                    {/* The structure is now a single <p> with a <Link> inside it. This is valid. */}
                                    <p className="text-gray-700">
                                        <Link to={`/profile/${notification.actor.username}`} className="font-bold hover:underline text-brand-dark">
                                            {notification.actor.username}
                                        </Link>
                                        {/* The main content of the notification links to the relevant entity */}
                                        <Link to={link} className="ml-1 hover:underline">
                                          {text}
                                        </Link>
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">{new Date(notification.created_at).toLocaleString()}</p>
                                </div>
                                {!notification.is_read && (
                                    <button
                                        onClick={() => markAsReadMutation.mutate(notification.id)}
                                        className="p-2 rounded-full hover:bg-green-100"
                                        title="Mark as read"
                                    >
                                        <CheckCircle className="text-gray-400 hover:text-green-600" size={20} />
                                    </button>
                                )}
                            </div>
                        );
                    }) : (
                        <p className="text-center text-gray-500 py-10">You have no new notifications.</p>
                    )}
                </div>
            </div>
        </>
    );
};