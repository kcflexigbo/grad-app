import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth'; // Placeholder hook
import { Bell, Upload } from 'lucide-react'; // Using lucide-react for clean icons

// You might want to install lucide-react for nice icons: npm install lucide-react

interface NavbarProps {
    onUploadClick: () => void;
}

export const Navbar = ({ onUploadClick }: NavbarProps) => {
    // This hook will provide the authentication state once AuthContext is implemented
    const { isLoggedIn, user, logout } = useAuth();

    // Active link style for NavLink
    const activeLinkStyle = {
        textDecoration: 'underline',
        textUnderlineOffset: '4px'
    };

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Left Side: Logo */}
                    <div className="flex-shrink-0">
                        <Link to="/" className="text-2xl font-serif text-gray-800 hover:text-gray-900">
                            Graduation Gallery
                        </Link>
                    </div>

                    {/* Center: Search Bar (Placeholder) */}
                    <div className="hidden md:block">
                        <div className="relative">
                            {/* We can add a search component here later */}
                        </div>
                    </div>

                    {/* Right Side: Actions & User Menu */}
                    <div className="flex items-center space-x-4">
                        {isLoggedIn && user ? (
                            // --- Authenticated User View ---
                            <>
                                <button
                                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                                    onClick={onUploadClick}
                                >
                                    <Upload size={18} />
                                    <span>Upload</span>
                                </button>
                                <button className="p-2 rounded-full hover:bg-gray-100">
                                    <Bell size={20} className="text-gray-600" />
                                </button>
                                <div className="relative">
                                    {/* Dropdown menu will be added here */}
                                    <Link to={`/profile/${user.username}`}>
                                        <img
                                            src={user.profile_picture_url || 'https://via.placeholder.com/40'} // Default avatar
                                            alt={`${user.username}'s profile`}
                                            className="h-10 w-10 rounded-full object-cover border-2 border-transparent hover:border-blue-500"
                                        />
                                    </Link>
                                    {/* We will add a dropdown on click with "Settings" and "Logout" */}
                                </div>
                            </>
                        ) : (
                            // --- Anonymous User View ---
                            <div className="space-x-2">
                                <NavLink
                                    to="/login"
                                    style={({ isActive }) => (isActive ? activeLinkStyle : undefined)}
                                    className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    Login
                                </NavLink>
                                <NavLink
                                    to="/register"
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                                >
                                    Sign Up
                                </NavLink>
                            </div>
                        )}
                    </div>
                </div>
            </nav>
        </header>
    );
};