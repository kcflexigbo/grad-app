import { Link } from 'react-router-dom';
import { FollowButton } from './FollowButton';
import { useAuth } from '../hooks/useAuth';

interface UserWithFollowStatus {
    id: number;
    username: string;
    profile_picture_url?: string | null;
    is_followed_by_current_user: boolean;
}

interface UserListCardProps {
    user: UserWithFollowStatus;
}

export const UserListCard = ({ user }: UserListCardProps) => {
    const { user: currentUser } = useAuth();

    return (
        <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm transition-shadow hover:shadow-md">
            <Link to={`/profile/${user.username}`}>
                <img
                    src={user.profile_picture_url || 'https://via.placeholder.com/48'}
                    alt={user.username}
                    className="w-12 h-12 rounded-full object-cover"
                />
            </Link>
            <div className="flex-grow">
                <Link to={`/profile/${user.username}`} className="font-bold text-brand-dark hover:underline">
                    {user.username}
                </Link>
                {/* Optional: Add user's bio or real name here later */}
            </div>
            {currentUser && currentUser.id !== user.id && (
                <FollowButton
                    userIdToFollow={user.id}
                    initialIsFollowing={user.is_followed_by_current_user}
                />
            )}
        </div>
    );
};