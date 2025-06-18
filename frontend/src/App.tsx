import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, Link } from 'react-router-dom';

// Providers and Hooks
import { AuthProvider } from './context/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Core Layout Components
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { UploadModal } from './components/UploadModal';

// Page Components
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { PhotoDetailPage } from './pages/PhotoDetailPage';
import { ProfilePage } from './pages/ProfilePage';


const queryClient = new QueryClient();

/**
 * The AppLayout component acts as the main shell for the application.
 * It includes the Navbar, Footer, and manages the global UploadModal state.
 * The <Outlet /> component from react-router-dom renders the active child route.
 */
const AppLayout = () => {
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    const handleUploadSuccess = () => {
        setIsUploadModalOpen(false);
        // A simple way to ensure the gallery is up-to-date after an upload.
        // For a more advanced UX, you could use a state management library to refetch data.
        window.location.reload();
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
            <Navbar onUploadClick={() => setIsUploadModalOpen(true)} />

            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>

            <Footer />

            {/* The Upload Modal is rendered here at the top level of the layout */}
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
        <Link to="/" className="mt-6 inline-block bg-blue-600 text-white font-bold py-2 px-6 rounded-md hover:bg-blue-700">
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
                        {/* All main application routes are nested under AppLayout */}
                        <Route path="/" element={<AppLayout />}>
                            <Route index element={<HomePage />} />
                            <Route path="photo/:id" element={<PhotoDetailPage />} />
                            <Route path="profile/:username" element={<ProfilePage />} />
                            {/* More authenticated routes can be added here, e.g., settings */}
                        </Route>

                        {/* Authentication routes have their own layout (no Navbar/Footer) */}
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />

                        {/* Catch-all 404 Not Found route */}
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                </AuthProvider>
            </Router>
        </QueryClientProvider>
    );
}

export default App;