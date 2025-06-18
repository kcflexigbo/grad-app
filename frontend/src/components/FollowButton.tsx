import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import apiService from '../api/apiService';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';

interface FollowButtonProps {
    userIdToFollow: number;
    initialIsFollowing: boolean; // The follow status when the page loaded
}

export const FollowButton = ({ userIdToFollow, initialIsFollowing }: FollowButtonProps) => {
    const { user: currentUser } = useAuth();
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
    const [isLoading, setIsLoading] = useState(false);

    // Sync state if the initial prop changes (e.g., on navigating between profiles)
    useEffect(() => {
        setIsFollowing(initialIsFollowing);
    }, [initialIsFollowing]);

    // Don't render the button if it's the user's own profile
    if (currentUser?.id === userIdToFollow) {
        return null;
    }

    const handleFollowToggle = async () => {
        setIsLoading(true);

        // Optimistic UI update
        const originalFollowState = isFollowing;
        setIsFollowing(!originalFollowState);

        try {
            if (originalFollowState) {
                // Unfollow logic
                await apiService.delete(`/users/${userIdToFollow}/follow`);
            } else {
                // Follow logic
                await apiService.post(`/users/${userIdToFollow}/follow`);
            }
        } catch (error) {
            console.error('Failed to toggle follow state:', error);
            // Revert on error
            setIsFollowing(originalFollowState);
            // Optionally show a toast notification for the error
        } finally {
            setIsLoading(false);
        }
    };

    const buttonStyle = isFollowing
        ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
        : "bg-blue-600 text-white hover:bg-blue-700";

    const baseClasses = "flex items-center gap-2 font-semibold px-4 py-2 rounded-md transition-colors disabled:opacity-50";

    return (
        <button
            onClick={handleFollowToggle}
            disabled={isLoading}
            className={`${baseClasses} ${buttonStyle}`}
        >
            {isLoading ? (
                <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Processing...</span>
                </>
            ) : isFollowing ? (
                <>
                    <UserCheck size={18} />
                    <span>Following</span>
                </>
            ) : (
                <>
                    <UserPlus size={18} />
                    <span>Follow</span>
                </>
            )}
        </button>
    );
};