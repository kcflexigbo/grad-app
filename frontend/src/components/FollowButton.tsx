import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import apiService from '../api/apiService';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import toast from "react-hot-toast";
import { useNavigate } from 'react-router-dom';

interface FollowButtonProps {
    userIdToFollow: number;
    initialIsFollowing: boolean;
}

export const FollowButton = ({ userIdToFollow, initialIsFollowing }: FollowButtonProps) => {
    const { user: currentUser, isLoggedIn } = useAuth();
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        setIsFollowing(initialIsFollowing);
    }, [initialIsFollowing]);

    if (currentUser?.id === userIdToFollow) {
        return null;
    }

    const handleFollowToggle = async () => {
        if (!isLoggedIn) {
            toast.error('Please log in to follow users.');
            navigate('/login');
            return;
        }

        setIsLoading(true);
        const originalFollowState = isFollowing;
        setIsFollowing(!originalFollowState);

        try {
            if (originalFollowState) {
                await apiService.delete(`/users/${userIdToFollow}/follow`);
            } else {
                await apiService.post(`/users/${userIdToFollow}/follow`);
            }
        } catch (error) {
            console.error('Failed to toggle follow state:', error);
            setIsFollowing(originalFollowState);
        } finally {
            setIsLoading(false);
        }
    };

    const buttonStyle = isFollowing
        ? "bg-gray-200 text-brand-text hover:bg-gray-300"
        : "bg-brand-accent text-white hover:bg-brand-accent-hover";

    const baseClasses = "flex items-center gap-2 font-semibold px-4 py-2 rounded-md transition-colors disabled:opacity-50";

    return (
        <button onClick={handleFollowToggle} disabled={isLoading} className={`${baseClasses} ${buttonStyle}`}>
            {isLoading ? (
                <><Loader2 size={18} className="animate-spin" /><span>Processing...</span></>
            ) : isFollowing ? (
                <><UserCheck size={18} /><span>Following</span></>
            ) : (
                <><UserPlus size={18} /><span>Follow</span></>
            )}
        </button>
    );
};