import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import apiService from '../api/apiService';
import type { Notification } from '../types/notification';
import { Heart, MessageCircle, UserPlus, Download, CheckCircle, MessageSquareText } from 'lucide-react';
import {PageHelmet} from "../components/layout/PageHelmet.tsx";

const fetchNotifications = async (): Promise<Notification[]> => {
    const { data } = await apiService.get('/notifications');
    return data;
};

const getNotificationDetails = (notification: Notification) => {
    const details = {
        icon: <></>,
        text: '',
        link: '/',
    };

    const actorLink = <Link to={`/profile/${notification.actor.username}`} className="font-bold hover:underline">{notification.actor.username}</Link>;

    switch (notification.type) {
        case 'like':
            details.icon = <Heart className="text-red-500" size={20} />;
            details.text = 'liked your media.';
            details.link = `/media/${notification.related_entity_id}`;
            break;
        case 'comment':
            details.icon = <MessageCircle className="text-blue-500" size={20} />;
            details.text = 'commented on your media.';
            details.link = `/media/${notification.related_entity_id}`;
            break;
        case 'follow':
            details.icon = <UserPlus className="text-purple-500" size={20} />;
            details.text = 'started following you.';
            details.link = `/profile/${notification.actor.username}`;
            break;
        case 'download':
             details.icon = <Download className="text-green-500" size={20} />;
             details.text = 'downloaded your media.';
             details.link = `/media/${notification.related_entity_id}`;
             break;
        case 'chat_message':
            details.icon = <MessageSquareText className="text-cyan-500" size={20} />;
            details.text = 'sent you a message.';
            details.link = `/chat?id=${notification.related_entity_id}`;
            break;
    }

    return { ...details, actor: actorLink };
};

export const NotificationsPage = () => {
    const queryClient = useQueryClient();
    const { data: notifications, isLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: fetchNotifications,
    });

    const markAsReadMutation = useMutation({
        mutationFn: (notificationId: number) => apiService.post(`/notifications/${notificationId}/read`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    if (isLoading) return (
            <div>Loading notifications...</div>
    );

    return (
        <>
            <PageHelmet title={"Notifications"} description={"View your notifications and manage your account."} />
             <div className="max-w-4xl mx-auto space-y-8">
                <header>
                    <h1 className="text-4xl font-bold font-serif text-gray-800">Notifications</h1>
                </header>

                <div className="space-y-3">
                    {notifications && notifications.length > 0 ? notifications.map(notification => {
                        const { icon, text, link, actor } = getNotificationDetails(notification);
                        const isReadClass = notification.is_read ? 'opacity-60' : 'bg-blue-50';

                        return (
                            <div key={notification.id} className={`flex items-center gap-4 p-4 border rounded-lg transition-all ${isReadClass}`}>
                                <div className="flex-shrink-0">{icon}</div>
                                <div className="flex-grow">
                                    <Link to={link}>
                                        <p>{actor} {text}</p>
                                        <p className="text-xs text-gray-500 mt-1">{new Date(notification.created_at).toLocaleString()}</p>
                                    </Link>
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