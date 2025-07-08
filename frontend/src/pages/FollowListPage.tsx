import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Users } from 'lucide-react';

import apiService from '../api/apiService';
import { UserListCard } from '../components/UserListCard';

interface UserWithFollowStatus {
    id: number;
    username: string;
    profile_picture_url?: string | null;
    is_followed_by_current_user: boolean;
}

type FollowPageMode = 'followers' | 'following';

const fetchFollowData = async (username: string, mode: FollowPageMode): Promise<UserWithFollowStatus[]> => {
    const { data } = await apiService.get(`/users/${username}/${mode}`);
    return data;
}

export const FollowListPage = () => {
    const { username, mode } = useParams<{ username: string; mode: FollowPageMode }>();

    const { data: users, isLoading, isError } = useQuery({
        queryKey: ['followList', username, mode],
        queryFn: () => fetchFollowData(username!, mode!),
        enabled: !!username && !!mode,
    });

    const pageTitle = mode === 'followers' ? 'Followers' : 'Following';

    if (!username || !mode) {
        return (
            <div className="text-center py-20">
                <h1 className="text-2xl font-bold">Invalid Page</h1>
                <p className="text-gray-600 mt-2">Could not determine the user or list to display.</p>
                <Link to="/" className="mt-6 inline-block bg-brand-accent text-white font-bold py-2 px-6 rounded-md">Go Home</Link>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <header className="relative text-center">
                <Link
                    to={`/profile/${username}`}
                    className="absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-gray-100"
                >
                    <ArrowLeft />
                </Link>
                <h1 className="text-3xl font-bold">{pageTitle}</h1>
                <p className="text-brand-text">Users {mode === 'followers' ? 'following' : 'followed by'} <span className="font-semibold text-brand-dark">{username}</span></p>
            </header>

            {isLoading && (
                <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-20 bg-gray-200 rounded-lg animate-pulse"></div>
                    ))}
                </div>
            )}

            {isError && <p className="text-center text-red-500">Could not load user list.</p>}

            {users && users.length > 0 && (
                <div className="space-y-4">
                    {users.map(user => (
                        <UserListCard key={user.id} user={user} />
                    ))}
                </div>
            )}

            {users && users.length === 0 && (
                <div className="text-center text-gray-500 py-16 bg-white rounded-lg border-2 border-dashed">
                    <Users size={48} className="mx-auto text-gray-300" />
                    <h3 className="text-2xl font-semibold mt-4">No Users Found</h3>
                    <p className="mt-2">This list is currently empty.</p>
                </div>
            )}
        </div>
    );
};

export default FollowListPage;