// C:/Users/kcfle/Documents/React Projects/grad-app/frontend/src/components/layout/Navbar.tsx

import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Bell, Upload, Search, Settings, User as UserIcon, LogOut } from 'lucide-react';
import { useState, type FormEvent, useEffect, useRef } from 'react';

interface NavbarProps {
    onUploadClick: () => void;
    notificationCount: number;
}

export const Navbar = ({ onUploadClick, notificationCount }: NavbarProps) => {
    // --- MODIFIED: Get the logout function from the auth hook ---
    const { isLoggedIn, user, logout } = useAuth();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    // --- NEW: State and ref for the profile dropdown ---
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null); // Ref for the dropdown container

    const handleSearchSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
        }
    };

    // --- NEW: Effect to handle clicks outside the dropdown to close it ---
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        // Add event listener when the dropdown is open
        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        // Cleanup function to remove the event listener
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen]);


    const activeLinkStyle = {
        textDecoration: 'underline',
        textUnderlineOffset: '4px'
    };

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Left Side: Logo */}
                    <div className="flex items-center gap-6">
                        <Link to="/" className="text-2xl font-serif text-gray-800 hover:text-gray-900">
                            Graduation Gallery
                        </Link>
                        <Link to="/leaderboard" className="hidden sm:block text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
                            Leaderboard
                        </Link>
                    </div>

                    {/* Center: Search Bar */}
                    <div className="hidden md:block w-full max-w-md">
                        <form onSubmit={handleSearchSubmit} className="relative">
                            <input
                                type="search"
                                placeholder="Search for photos or users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="absolute top-0 left-0 flex items-center h-full pl-3">
                                <Search size={20} className="text-gray-400" />
                            </div>
                        </form>
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
                                <Link to="/notifications" className="relative p-2 rounded-full hover:bg-gray-100">
                                    <Bell size={20} className="text-gray-600" />
                                    {notificationCount > 0 && (
                                        <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                                            {notificationCount}
                                        </span>
                                    )}
                                </Link>

                                {/* --- MODIFIED: Profile Picture now triggers a dropdown --- */}
                                <div className="relative" ref={dropdownRef}>
                                    <button onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                                        <img
                                            src={user.profile_picture_url || 'https://via.placeholder.com/40'}
                                            alt={`${user.username}'s profile`}
                                            className="h-10 w-10 rounded-full object-cover border-2 border-transparent hover:border-blue-500"
                                        />
                                    </button>

                                    {/* --- NEW: The Dropdown Menu --- */}
                                    {isDropdownOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5">
                                            <Link
                                                to={`/profile/${user.username}`}
                                                onClick={() => setIsDropdownOpen(false)}
                                                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                <UserIcon size={16} />
                                                <span>My Profile</span>
                                            </Link>
                                            <Link
                                                to="/settings"
                                                onClick={() => setIsDropdownOpen(false)}
                                                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                <Settings size={16} />
                                                <span>Settings</span>
                                            </Link>
                                            <div className="border-t border-gray-100 my-1"></div>
                                            <button
                                                onClick={() => {
                                                    logout();
                                                    setIsDropdownOpen(false);
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                            >
                                                <LogOut size={16} />
                                                <span>Logout</span>
                                            </button>
                                        </div>
                                    )}
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