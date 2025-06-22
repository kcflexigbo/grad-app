import { useState, useEffect } from 'react';
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
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { UploadModal } from './components/UploadModal';
import apiService from './api/apiService';

// Page Components
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { PhotoDetailPage } from './pages/PhotoDetailPage';
import { ProfilePage } from './pages/ProfilePage';
import { SearchPage } from './pages/SearchPage';
import { AlbumDetailPage } from './pages/AlbumDetailPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { LeaderboardPage } from "./pages/LeaderboardPage.tsx";
import { FollowListPage } from './pages/FollowListPage.tsx';
import { AdminReportsHistoryPage } from './pages/AdminReportsHistoryPage.tsx';

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
    const [unreadCount, setUnreadCount] = useState(0);

    const { data: response } = useQuery({
        queryKey: ['notifications'],
        queryFn: () => apiService.get<NotificationType[]>('/notifications'),
        enabled: isLoggedIn,
    });

    useEffect(() => {
        if (response?.data) {
            const notificationsArray = response.data;
            const count = notificationsArray.filter(n => !n.is_read).length;
            setUnreadCount(count);
        }
    }, [response]);

    const token = localStorage.getItem('accessToken');
    const wsUrl = isLoggedIn ? `${WS_URL}/ws/notifications?token=${token}` : null;
    const { lastMessage } = useWebSocket<NotificationType>(wsUrl);

    useEffect(() => {
        if (lastMessage) {
            setUnreadCount(prev => prev + 1);
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
    }, [lastMessage, queryClient]);


    const handleUploadSuccess = () => {
        setIsUploadModalOpen(false);
        queryClient.invalidateQueries({ queryKey: ['images'] });
    };

    return (
        // --- MODIFICATION: Removed bg-gray-50 to allow body background to show ---
        <div className="flex flex-col min-h-screen font-sans">
            <Navbar onUploadClick={() => setIsUploadModalOpen(true)} notificationCount={unreadCount} />

            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* --- NEW: Content Card Wrapper for Glassmorphism Effect --- */}
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
                    <Routes>
                        <Route path="/" element={<AppLayout />}>
                            <Route index element={<HomePage />} />
                            <Route path="photo/:id" element={<PhotoDetailPage />} />
                            <Route path="profile/:username" element={<ProfilePage />} />
                            <Route path="search" element={<SearchPage />} />
                            <Route path="album/:id" element={<AlbumDetailPage />} />
                            <Route path="settings" element={<SettingsPage />} />
                            <Route path="notifications" element={<NotificationsPage />} />
                            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                            <Route path="/admin/reports/history" element={<AdminReportsHistoryPage />} />
                            <Route path="/leaderboard" element={<LeaderboardPage />} />
                            <Route path="/profile/:username/:mode" element={<FollowListPage />} />
                        </Route>

                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />

                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                </AuthProvider>
            </Router>
        </QueryClientProvider>
    );
}

export default App;