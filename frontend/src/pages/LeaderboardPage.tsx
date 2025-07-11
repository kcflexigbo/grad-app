import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Crown } from 'lucide-react';

import apiService from '../api/apiService';
import { MediaGrid } from '../components/MediaGrid.tsx';
import { SkeletonLoader } from '../components/ui/SkeletonLoader';

import type { Media } from '../types/media.ts';
import type { User } from '../types/user';
import {PageHelmet} from "../components/layout/PageHelmet.tsx";

// Fetcher functions
const fetchTopMedia = async (): Promise<Media[]> => {
    const { data } = await apiService.get('/leaderboard/media?limit=9'); // Corrected endpoint
    return data;
};

const fetchTopUsers = async (): Promise<User[]> => {
    const { data } = await apiService.get('/leaderboard/users?limit=10');
    return data;
};

// Skeleton component for the user list
const UserListSkeleton = () => (
    <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3 bg-gray-200 rounded-lg animate-pulse">
                <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                <div className="flex-grow space-y-2">
                    <div className="w-1/3 h-4 bg-gray-300 rounded"></div>
                    <div className="w-1/4 h-3 bg-gray-300 rounded"></div>
                </div>
            </div>
        ))}
    </div>
);


export const LeaderboardPage = () => {
    const { data: topMedia, isLoading: isLoadingMedia, isError: isErrorMedia } = useQuery({
        queryKey: ['leaderboard_media'],
        queryFn: fetchTopMedia,
    });
    const { data: topUsers, isLoading: isLoadingUsers, isError: isErrorUsers } = useQuery({
        queryKey: ['leaderboard_users'],
        queryFn: fetchTopUsers,
    });

    const getTrophyColor = (rank: number) => {
        if (rank === 0) return 'text-yellow-500'; // Gold
        if (rank === 1) return 'text-gray-400';  // Silver
        if (rank === 2) return 'text-yellow-700'; // Bronze
        return 'text-gray-300';
    };

    return (
        <>
            <PageHelmet title={"Leaderboard"}/>
            <div className="space-y-12">
                <header className="text-center">
                    <h1 className="text-5xl font-bold font-serif text-gray-800">Leaderboards</h1>
                    <p className="text-xl text-gray-600 mt-2">Discover the top photos and most influential users.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                    {/* Most Followed Users Section */}
                    <div className="lg:col-span-1 space-y-4">
                        <h2 className="text-3xl font-semibold font-serif border-b pb-2">Most Followed Users</h2>
                        {isLoadingUsers && <UserListSkeleton/>}
                        {isErrorUsers && <p className="text-red-500">Could not load top users.</p>}
                        {topUsers && (
                            <ol className="space-y-3">
                                {topUsers.map((user, index) => (
                                    <li key={user.id}
                                        className="flex items-center gap-4 p-3 bg-white border rounded-lg hover:shadow-md transition-shadow">
                                        <span className="text-2xl font-bold w-8 text-center">{index + 1}</span>
                                        <Link to={`/profile/${user.username}`}>
                                            <img
                                                src={user.profile_picture_url || 'https://s3.amazonaws.com/37assets/svn/765-default-avatar.png'}
                                                alt={user.username} className="w-12 h-12 rounded-full object-cover"/>
                                        </Link>
                                        <div className="flex-grow">
                                            <Link to={`/profile/${user.username}`}
                                                  className="font-bold text-gray-800 hover:underline">{user.username}</Link>
                                            <p className="text-sm text-gray-500">{user.followers_count} followers</p>
                                        </div>
                                        <Crown size={24} className={getTrophyColor(index)}/>
                                    </li>
                                ))}
                            </ol>
                        )}
                    </div>


                    {/* Most Liked Photos Section */}
                    <div className="lg:col-span-2 space-y-4">
                        <h2 className="text-3xl font-semibold font-serif border-b pb-2">Most Liked Media</h2>
                        {isLoadingMedia && <SkeletonLoader count={6}/>}
                        {isErrorMedia && <p className="text-red-500">Could not load top photos.</p>}
                        {topMedia && <MediaGrid mediaItems={topMedia}/>}
                    </div>

                </div>
            </div>
        </>
    );
};

export default LeaderboardPage;