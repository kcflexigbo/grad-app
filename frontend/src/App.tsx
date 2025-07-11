import { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, Link } from 'react-router-dom';

// Providers and Hooks
import { AuthProvider } from './context/AuthContext';
import {QueryClient, QueryClientProvider, useQuery, useQueryClient} from '@tanstack/react-query';
import { useAuth } from './hooks/useAuth';
import { useWebSocket } from './hooks/useWebSocket';
import { WS_URL } from './api/config';

// Types
import type { Notification as NotificationType } from './types/notification';

// Core Layout Components
const Navbar = lazy(() => import('./components/layout/Navbar'));
const Footer = lazy(() => import('./components/layout/Footer'));
const UploadModal = lazy(() => import('./components/UploadModal'));
import apiService from './api/apiService';

// Page Components
const HomePage = lazy(() => import('./pages/HomePage.tsx'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const MediaDetailPage = lazy(() => import('./pages/MediaDetailPage.tsx'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const AlbumDetailPage = lazy(() => import('./pages/AlbumDetailPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage.tsx'));
const FollowListPage = lazy(() => import('./pages/FollowListPage.tsx'));
const AdminReportsHistoryPage = lazy(() => import('./pages/AdminReportsHistoryPage.tsx'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage.tsx'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage.tsx'));
const ChatPage = lazy(() => import('./pages/ChatPage.tsx'));
import toast, {Toaster} from "react-hot-toast";

const queryClient = new QueryClient();

/**
 * The AppLayout component acts as the main shell for the application.
 * It includes the Navbar, Footer, and manages the global UploadModal state.
 * The <Outlet /> component from react-router-dom renders the active child route.
 */
const AppLayout = () => {
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const queryClient = useQueryClient();
    const { isLoggedIn } = useAuth();
    const [isSocketActive, setIsSocketActive] = useState(true);

    const { data: notifications } = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => (await apiService.get<NotificationType[]>('/notifications')).data,
        enabled: isLoggedIn,
        staleTime: 1000 * 60, // 1 minute
    });

    const unreadCount = notifications?.filter(n => !n.is_read).length ?? 0;

    const wsUrl = isLoggedIn && isSocketActive ? `${WS_URL}/ws/notifications` : null;
    const { lastMessage } = useWebSocket<NotificationType>(wsUrl);

    useEffect(() => {
        const handleVisibilityChange = () => {
            setIsSocketActive(document.visibilityState === 'visible');
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    useEffect(() => {
        if (lastMessage) {
            // Invalidate notifications to update the count and list immediately
            queryClient.invalidateQueries({ queryKey: ['notifications'] });

            if (lastMessage.type === 'chat_message') {
                toast(
                    (t) => (
                        <span onClick={() => toast.dismiss(t.id)}>
                            New message from <b>{lastMessage.actor.username}</b>
                            <Link to={`/chat?id=${lastMessage.related_entity_id}`} className="font-bold text-blue-400 ml-2">
                               View
                            </Link>
                        </span>
                    ),
                    { icon: '💬' }
                );
                // Invalidate conversations to update the sidebar list
                queryClient.invalidateQueries({ queryKey: ['conversations'] });
                // Invalidate the specific message query to ensure the chat is up-to-date when opened
                if (lastMessage.related_entity_id) {
                     queryClient.invalidateQueries({ queryKey: ['messages', lastMessage.related_entity_id] });
                }
            }

        }
    }, [lastMessage, queryClient]);


    const handleUploadSuccess = () => {
        setIsUploadModalOpen(false);
        queryClient.invalidateQueries({ queryKey: ['media'] });
    };

    return (
        <div className="flex flex-col min-h-screen font-sans">
            <Navbar onUploadClick={() => setIsUploadModalOpen(true)} notificationCount={unreadCount} />

            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-lg p-6 sm:p-10">
                    <Outlet />
                </div>
            </main>

            <Footer />

            <UploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onUploadSuccess={handleUploadSuccess}
            />
        </div>
    );
};


/**
 * A simple 404 Not Found page component.
 */
const NotFoundPage = () => (
    <div className="text-center py-20">
        <h1 className="text-6xl font-bold text-gray-800 font-serif">404</h1>
        <p className="text-xl text-gray-600 mt-4">Page Not Found</p>
        <p className="mt-2 text-gray-500">Sorry, the page you are looking for does not exist.</p>
        <Link to="/" className="mt-6 inline-block bg-brand-accent text-white font-bold py-2 px-6 rounded-md hover:bg-brand-accent-hover">
            Go Back Home
        </Link>
    </div>
);


/**
 * The main App component that sets up the application's providers and routing.
 */
function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <Router>
                <AuthProvider>
                    <Toaster
                      position="top-right"
                      reverseOrder={false}
                      toastOptions={{
                        duration: 8000,
                        style: {
                          background: '#333',
                          color: '#fff',
                        },
                      }}
                    />
                    <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}>
                        <Routes>
                            <Route path="/" element={<AppLayout />}>
                                <Route index element={<HomePage />} />
                                <Route path="media/:id" element={<MediaDetailPage />} />
                                <Route path="profile/:username" element={<ProfilePage />} />
                                <Route path="search" element={<SearchPage />} />
                                <Route path="album/:id" element={<AlbumDetailPage />} />
                                <Route path="settings" element={<SettingsPage />} />
                                <Route path="notifications" element={<NotificationsPage />} />
                                <Route path="chat" element={<ChatPage />} />
                                <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                                <Route path="/admin/reports/history" element={<AdminReportsHistoryPage />} />
                                <Route path="/leaderboard" element={<LeaderboardPage />} />
                                <Route path="/profile/:username/:mode" element={<FollowListPage />} />
                            </Route>

                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/register" element={<RegisterPage />} />
                            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                            <Route path="/reset-password" element={<ResetPasswordPage />} />

                            <Route path="*" element={<NotFoundPage />} />
                        </Routes>
                    </Suspense>
                </AuthProvider>
            </Router>
        </QueryClientProvider>
    );
}

export default App;