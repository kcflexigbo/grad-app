import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast'; // Import toast
import { Trash2 } from 'lucide-react'; // Import Trash2 icon
import apiService from '../api/apiService';
import { MediaGrid } from '../components/MediaGrid.tsx';
import { SkeletonLoader } from '../components/ui/SkeletonLoader';
import { useAuth } from '../hooks/useAuth';
import type { Album as AlbumType } from '../types/album';
import { PageHelmet } from "../components/layout/PageHelmet.tsx";

const fetchAlbum = async (albumId: string): Promise<AlbumType> => {
    const { data } = await apiService.get(`/albums/${albumId}`);
    return data;
};

export const AlbumDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: album, isLoading, isError } = useQuery({
        queryKey: ['album', id],
        queryFn: () => fetchAlbum(id!),
        enabled: !!id,
    });

    const deleteAlbumMutation = useMutation({
        mutationFn: () => apiService.delete(`/albums/${id}`),
        onSuccess: () => {
            toast.success("Album deleted successfully.");
            // Invalidate the profile query to remove the album from the list
            queryClient.invalidateQueries({ queryKey: ['profile', album?.owner.username] });
            // Redirect user away from the deleted page
            navigate(`/profile/${album?.owner.username}`);
        },
        onError: () => {
            toast.error("Failed to delete album.");
        }
    });

    const handleDelete = () => {
        if (window.confirm("Are you sure you want to permanently delete this album? This cannot be undone.")) {
            deleteAlbumMutation.mutate();
        }
    };

     const removeImageMutation = useMutation({
        mutationFn: (mediaId: number) => apiService.delete(`/albums/${id}/media/${mediaId}`),
        onSuccess: () => {
            toast.success("Media removed from album.");
            queryClient.invalidateQueries({ queryKey: ['album', id] });
        },
        onError: () => {
            toast.error("Failed to remove media.");
        }
    });

    const handleRemoveFromAlbum = (mediaId: number) => {
        if (window.confirm("Are you sure you want to remove this media from the album? (The media itself will not be deleted)")) {
            removeImageMutation.mutate(mediaId);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-8">
                <div className="w-3/4 h-12 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-1/2 h-6 bg-gray-200 rounded animate-pulse"></div>
                <hr />
                <SkeletonLoader count={9} />
            </div>
        );
    }

    if (isError || !album) {
        return <div className="text-center text-red-500 py-10">Error: Album not found.</div>;
    }

    const isOwner = currentUser?.id === album.owner.id;

    return (
        <>
            <PageHelmet title={album?.name ? album.name : "Album"}/>
            <div className="space-y-8">
                <header className="border-b pb-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-4xl font-bold font-serif text-gray-800">{album.name}</h1>
                            <p className="text-lg text-gray-600 mt-2">{album.description}</p>
                            <div className="text-sm text-gray-500 mt-4">
                                Created by <Link to={`/profile/${album.owner.username}`} className="font-semibold hover:underline">{album.owner.username}</Link>
                            </div>
                        </div>
                        {/* --- NEW: Conditional Delete Button --- */}
                        {isOwner && (
                            <button
                                onClick={handleDelete}
                                disabled={deleteAlbumMutation.isPending}
                                className="flex items-center gap-2 bg-red-600 text-white font-bold py-2 px-4 rounded-md hover:bg-red-700 disabled:bg-red-300"
                            >
                                <Trash2 size={18} />
                                <span>Delete Album</span>
                            </button>
                        )}
                    </div>
                </header>

                <main>
                    {album.media.length > 0 ? (
                        <MediaGrid mediaItems={album.media}
                        onRemoveFromAlbum={isOwner ? handleRemoveFromAlbum : undefined}
                        />
                    ) : (
                        <div className="text-center text-gray-500 py-20 bg-gray-50 rounded-lg">
                            <h3 className="text-2xl font-semibold">This album is empty.</h3>
                            <p className="mt-2">The owner can add photos to this album.</p>
                        </div>
                    )}
                </main>
            </div>
        </>
    );
};

export default AlbumDetailPage;