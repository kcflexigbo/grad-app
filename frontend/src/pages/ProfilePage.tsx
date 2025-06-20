import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import apiService from '../api/apiService';
import type { User } from '../types/user';
import type { Image } from '../types/image';
// import type { Album } from '../types/album'; // No longer need the full album type here
import { Camera, BookCopy, Plus, Trash2 } from 'lucide-react';

// Import required components
import { ImageGrid } from '../components/ImageGrid';
import { SkeletonLoader as GridSkeletonLoader } from '../components/ui/SkeletonLoader';
import { FollowButton } from '../components/FollowButton';
import { useAuth } from '../hooks/useAuth';
import { ProfilePictureModal } from '../components/ProfilePictureModal';
import { CreateAlbumModal } from "../components/CreateAlbumModal.tsx";

// --- MODIFICATION: New interface for the album summary ---
interface AlbumSummary {
    id: number;
    name: string;
    description: string | null;
    image_count: number;
}


interface UserProfile extends User {
    images: Image[];
    followers_count: number;
    following_count: number;
    albums: AlbumSummary[];
    is_followed_by_current_user?: boolean;
}

// Data fetching function for React Query
const fetchProfile = async (username: string): Promise<UserProfile> => {
    const { data } = await apiService.get<UserProfile>(`/users/profile/${username}`);
    return data;
};

// A new, custom skeleton loader specifically for the Profile Page header
const ProfileHeaderSkeleton = () => (
    <header className="flex flex-col md:flex-row items-center gap-8 animate-pulse">
        <div className="w-32 h-32 bg-gray-300 rounded-full"></div>
        <div className="flex-grow w-full space-y-4">
            <div className="flex items-center gap-4">
                <div className="h-8 w-48 bg-gray-300 rounded"></div>
                <div className="h-10 w-24 bg-gray-300 rounded-md"></div>
            </div>
            <div className="flex gap-6">
                <div className="h-5 w-20 bg-gray-300 rounded"></div>
                <div className="h-5 w-20 bg-gray-300 rounded"></div>
                <div className="h-5 w-20 bg-gray-300 rounded"></div>
            </div>
            <div className="space-y-2">
                <div className="h-4 w-full bg-gray-300 rounded"></div>
                <div className="h-4 w-3/4 bg-gray-300 rounded"></div>
            </div>
        </div>
    </header>
);

export const ProfilePage = () => {
    const { username } = useParams<{ username: string }>();
    const { user: currentUser } = useAuth();
    const queryClient = useQueryClient();

    const [isPfpModalOpen, setIsPfpModalOpen] = useState(false);
    const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'photos' | 'albums'>('photos');

    const { data: profile, isLoading, isError, error } = useQuery({
        queryKey: ['profile', username],
        queryFn: () => fetchProfile(username!),
        enabled: !!username,
    });

    const isOwnProfile = currentUser?.username === username;

    const deleteAlbumMutation = useMutation({
        mutationFn: (albumId: number) => apiService.delete(`/albums/${albumId}`),
        onSuccess: () => {
            toast.success("Album deleted.");
            queryClient.invalidateQueries({ queryKey: ['profile', username] });
        },
        onError: () => {
            toast.error("Failed to delete album.");
        }
    });

    const handleDeleteAlbum = (albumId: number) => {
        if (window.confirm("Are you sure you want to permanently delete this album? This cannot be undone.")) {
            deleteAlbumMutation.mutate(albumId);
        }
    };

    const handleUploadSuccess = (newImageUrl: string) => {
        queryClient.setQueryData(['profile', username], (oldData: UserProfile | undefined) => {
            if (!oldData) return oldData;
            return { ...oldData, profile_picture_url: newImageUrl };
        });
        if(isOwnProfile) {
            queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
        }
    };

    // --- Loading State ---
    if (isLoading) {
        return (
            <div className="space-y-12">
                <ProfileHeaderSkeleton />
                <hr />
                <GridSkeletonLoader count={6} />
            </div>
        );
    }

    // --- Error State ---
    if (isError) {
        return <div className="text-center text-red-500 py-10 text-xl">{(error as any).message || "This user profile could not be found."}</div>;
    }

    // --- Not Found State ---
    if (!profile) {
        return <div className="text-center text-gray-500 py-10 text-xl">Profile not found.</div>;
    }

    // --- Success State ---
    return (
        <>
            <div className="space-y-12">
                {/* Profile Header Section */}
                <header className="flex flex-col md:flex-row items-center gap-8">
                     <button onClick={() => setIsPfpModalOpen(true)} className="flex-shrink-0">
                            <img
                                src={profile.profile_picture_url || 'https://via.placeholder.com/128'}
                                alt={profile.username}
                                className="w-32 h-32 rounded-full object-cover ring-4 ring-white shadow-lg cursor-pointer transition-transform hover:scale-105"
                            />
                    </button>
                    <div className="flex-grow text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-4">
                            <h1 className="text-3xl font-bold text-gray-800">{profile.username}</h1>
                            {/*{isOwnProfile ? (*/}
                            {/*    // <button className="bg-gray-200 text-gray-800 font-semibold px-4 py-2 rounded-md hover:bg-gray-300">*/}
                            {/*    //     Edit Profile*/}
                            {/*    // </button>*/}
                            {/*) : (*/}
                            {/*    // --- REUSABLE FOLLOW BUTTON ---*/}
                            {!isOwnProfile && (
                                <FollowButton
                                    userIdToFollow={profile.id}
                                    initialIsFollowing={profile.is_followed_by_current_user || false}
                                />
                            )}
                        </div>
                        <div className="flex justify-center md:justify-start gap-6 mt-4 text-gray-600">
                            <span className="text-center">
                                <span className="font-bold block text-lg text-brand-dark">{profile.images.length}</span>
                                <span className="text-sm">posts</span>
                            </span>
                            <Link to={`/profile/${profile.username}/followers`} className="text-center hover:text-brand-accent transition-colors">
                                <span className="font-bold block text-lg text-brand-dark">{profile.followers_count}</span>
                                <span className="text-sm">followers</span>
                            </Link>
                            <Link to={`/profile/${profile.username}/following`} className="text-center hover:text-brand-accent transition-colors">
                                <span className="font-bold block text-lg text-brand-dark">{profile.following_count}</span>
                                <span className="text-sm">following</span>
                            </Link>
                        </div>
                        <p className="mt-4 max-w-lg mx-auto md:mx-0">{profile.bio || "This user hasn't written a bio yet."}</p>
                    </div>
                </header>

                <hr />

                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex justify-center space-x-8" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('photos')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                                activeTab === 'photos' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <Camera size={16} /> Posts
                        </button>
                        <button
                            onClick={() => setActiveTab('albums')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                                activeTab === 'albums' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <BookCopy size={16} /> Albums
                        </button>
                    </nav>
                </div>

                <main>
                    {/* User's Photo Grid Section */}
                    {activeTab === 'photos' && (
                        profile.images.length > 0 ? (
                            <ImageGrid images={profile.images} />
                        ) : (
                            <div className="text-center text-gray-500 py-10 bg-gray-50 rounded-lg">
                                This user hasn't posted any photos yet.
                            </div>
                        )
                    )}

                    {/* User's Album Grid Section */}
                    {activeTab === 'albums' && (
                        <div className="space-y-6">
                            {isOwnProfile && (
                                <div className="text-right">
                                    <button
                                        onClick={() => setIsAlbumModalOpen(true)}
                                        className="inline-flex items-center gap-2 bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700"
                                    >
                                        <Plus size={18} />
                                        Create New Album
                                    </button>
                                </div>
                            )}
                            {profile.albums.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {profile.albums.map(album => (
                                        <div key={album.id} className="group relative">
                                            <Link to={`/album/${album.id}`} className="block p-4 bg-white border rounded-lg hover:shadow-lg transition-shadow">
                                                <h3 className="font-bold text-lg truncate">{album.name}</h3>
                                                <p className="text-sm text-gray-600 mt-1 truncate h-10">{album.description || 'No description'}</p>
                                                {/* --- MODIFICATION: Use the new image_count property --- */}
                                                <p className="text-xs text-gray-400 mt-4">{album.image_count} photos</p>
                                            </Link>
                                            {isOwnProfile && (
                                                <button
                                                    onClick={() => handleDeleteAlbum(album.id)}
                                                    className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full text-red-600 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
                                                    title="Delete album"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-gray-500 py-10 bg-gray-50 rounded-lg">
                                    This user hasn't created any albums yet.
                                </div>
                            )}
                        </div>
                    )}
                </main>

                {/*<main>*/}
                {/*    <h2 className="text-xl font-semibold text-center mb-6 uppercase tracking-wider text-gray-500">Posts</h2>*/}
                {/*    {profile.images.length > 0 ? (*/}
                {/*        <ImageGrid images={profile.images} />*/}
                {/*    ) : (*/}
                {/*        <div className="text-center text-gray-500 py-10 bg-gray-50 rounded-lg">*/}
                {/*            This user hasn't posted any photos yet.*/}
                {/*        </div>*/}
                {/*    )}*/}
                {/*</main>*/}
            </div>

            <ProfilePictureModal
                    isOpen={isPfpModalOpen}
                    onClose={() => setIsPfpModalOpen(false)}
                    imageUrl={profile.profile_picture_url || 'https://via.placeholder.com/128'}
                    isOwnProfile={isOwnProfile}
                    onUploadSuccess={handleUploadSuccess}
            />

            {isOwnProfile && (
                <CreateAlbumModal
                    isOpen={isAlbumModalOpen}
                    onClose={() => setIsAlbumModalOpen(false)}
                    username={username!}
                />
            )}
    </>
    );
};