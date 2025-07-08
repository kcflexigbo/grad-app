import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Bell, Upload, Search, Settings, User as UserIcon, LogOut, Crown, MessageSquare } from 'lucide-react';
import { useState, type FormEvent, useEffect, useRef } from 'react';

interface NavbarProps {
    onUploadClick: () => void;
    notificationCount: number;
}

export const Navbar = ({ onUploadClick, notificationCount }: NavbarProps) => {
    const { isLoggedIn, user, logout } = useAuth();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleSearchSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        if (isDropdownOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isDropdownOpen]);

    return (
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/80 sticky top-0 z-50">
            <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* --- Left side of navbar (Unchanged) --- */}
                    <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                        <Link to="/" className="flex items-center gap-2 group">
                             <img src="/logo.png" alt="Logo" className="h-8 w-8" />
                             <span className="hidden sm:block text-xl font-serif text-brand-dark group-hover:text-brand-accent transition-colors whitespace-nowrap">
                                RateMyPix
                            </span>
                        </Link>
                        <Link to="/leaderboard" className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-brand-accent transition-colors" title="Leaderboard">
                            <Crown size={18} />
                            <span className="hidden sm:inline">Leaderboard</span>
                        </Link>
                    </div>

                    {/* --- MODIFICATION: Made search bar visible and flexible on all screen sizes --- */}
                    <div className="flex-grow w-full max-w-xs lg:max-w-md px-2 sm:px-4">
                        <form onSubmit={handleSearchSubmit} className="relative">
                            <input type="search" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent text-sm" />
                            <div className="absolute top-0 left-0 flex items-center h-full pl-3">
                                <Search size={18} className="text-gray-400" />
                            </div>
                        </form>
                    </div>

                    {/* --- MODIFICATION: Added shrink-0 to prevent this section from being squished --- */}
                    <div className="flex items-center shrink-0 space-x-2 sm:space-x-3">
                        {isLoggedIn && user ? (
                            <>
                                <button
                                        aria-label={"Upload Button"}
                                        className="flex items-center gap-1.5 bg-brand-accent text-white px-3 py-2 sm:px-4 rounded-md hover:bg-brand-accent-hover transition-colors font-semibold"
                                        onClick={onUploadClick}
                                >
                                    <Upload size={18} />
                                    <span className="hidden sm:inline text-sm">Upload</span>
                                </button>
                                <Link to="/chat" className="p-2 rounded-full hover:bg-gray-100" title="Chat">
                                    <MessageSquare size={20} className="text-gray-600" />
                                </Link>
                                <Link
                                    aria-label={"Notifications Button"}
                                    to="/notifications"
                                    className="relative p-2 rounded-full hover:bg-gray-100">
                                    <Bell size={20} className="text-gray-600" />
                                    {notificationCount > 0 && (
                                        <span className="absolute -top-1 -right-1 block h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center border-2 border-white">
                                            {notificationCount}
                                        </span>
                                    )}
                                </Link>

                                <div className="relative" ref={dropdownRef}>
                                    <button onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                                        <img
                                            src={user.profile_picture_url || '/default_avatar.png'}
                                            alt={`${user.username}'s profile`}
                                            className="h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover border-2 border-transparent hover:border-brand-accent transition-all"
                                        />
                                    </button>

                                    {isDropdownOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5">
                                            <Link to={`/profile/${user.username}`} onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-brand-text hover:bg-gray-100"><UserIcon size={16} /><span>My Profile</span></Link>
                                            <Link to="/settings" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-brand-text hover:bg-gray-100"><Settings size={16} /><span>Settings</span></Link>
                                            <div className="border-t border-gray-100 my-1"></div>
                                            <button
                                                onClick={() => {
                                                    logout();
                                                    setIsDropdownOpen(false);
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"><LogOut size={16}
                                            />
                                                <span>Logout</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="space-x-1 sm:space-x-2 whitespace-nowrap">
                                <NavLink to="/login" className="text-gray-700 hover:text-brand-accent px-3 py-2 rounded-md text-sm font-medium transition-colors">Login</NavLink>
                                <NavLink to="/register" className="bg-brand-dark text-white px-3 sm:px-4 py-2 rounded-md text-sm font-medium hover:bg-black transition-colors">Sign Up</NavLink>
                            </div>
                        )}
                    </div>
                </div>
            </nav>
        </header>
    );
};

export default Navbar;