import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, MessageCircle, Download } from 'lucide-react';
import apiService from '../api/apiService';
import { Star, Flag } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

// Import required components and types
import { FollowButton } from '../components/FollowButton';
import { CommentList } from '../components/CommentList';
import { CommentForm } from '../components/CommentForm';
import type { Image as ImageType } from '../types/image';
import type { Comment as CommentType } from '../types/comments'; // You will need to create this type

interface ImageDetail extends ImageType {
    is_followed_by_current_user?: boolean;
    is_liked_by_current_user?: boolean;
    comments: CommentType[];
    is_featured?: boolean;
}

const fetchImageDetail = async (id: string): Promise<ImageDetail> => {
    const { data } = await apiService.get<ImageDetail>(`/images/${id}`);
    return data;
};

export const PhotoDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const queryClient = useQueryClient();
    const { user: currentUser, isLoggedIn } = useAuth();
    const [comments, setComments] = useState<CommentType[]>([]);

    const { data: image, isLoading, isError, error } = useQuery({
        queryKey: ['image', id],
        queryFn: () => fetchImageDetail(id!),
        enabled: !!id,
    });

    // --- Like/Unlike Mutation ---
    const likeMutation = useMutation({
        mutationFn: (imageId: number) => {
            if (image?.is_liked_by_current_user) {
                return apiService.delete(`/images/${imageId}/like`);
            } else {
                return apiService.post(`/images/${imageId}/like`);
            }
        },
        onSuccess: () => {
            // Refetch the image data to get the new like count and status
            queryClient.invalidateQueries({ queryKey: ['image', id] });
        },
        onError: (err) => {
            console.error("Failed to like/unlike:", err);
            // Optionally show a toast notification for the error
        }
    });

    const featureMutation = useMutation({
        mutationFn: (imageId: number) => apiService.post(`/admin/images/${imageId}/feature`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['image', id] });
        }
    });

    useEffect(() => {
        if (image?.comments) setComments(image.comments);
    }, [image?.comments]);

    const handleCommentPosted = (newComment: CommentType) => {
        setComments(prev => [...prev, newComment]);
        queryClient.setQueryData(['image', id], (old: ImageDetail | undefined) =>
            old ? { ...old, comment_count: old.comment_count + 1 } : old
        );
    };

    if (isLoading) return <div>Loading...</div>; // Simple loader for brevity
    if (isError) return <div>Error: {(error as any).message}</div>;
    if (!image) return <div>Photo not found.</div>;

    const likeButtonClass = image.is_liked_by_current_user
        ? "text-red-500 fill-current"
        : "text-gray-600";

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            <div className="lg:col-span-2 bg-black rounded-lg flex items-center justify-center">
                <img src={image.image_url} alt={image.caption || ''} className="max-w-full max-h-[80vh] object-contain" />
            </div>
            <div className="flex flex-col space-y-6">
                <div className="flex justify-end items-center gap-2 -mb-4">
                    {currentUser?.is_admin && (
                        <button
                            onClick={() => featureMutation.mutate(image.id)}
                            className={`flex items-center gap-1 p-2 text-xs rounded-md ${image.is_featured ? 'bg-yellow-400 text-white' : 'bg-gray-200'}`}
                            title={image.is_featured ? 'Un-feature Image' : 'Feature Image'}
                        >
                            <Star size={16} /> {image.is_featured ? 'Featured' : 'Feature'}
                        </button>
                    )}
                    <button className="p-2 rounded-full hover:bg-gray-200" title="Report this image">
                        <Flag size={16} />
                    </button>
                </div>
                <div className="flex justify-between items-start">
                    <Link to={`/profile/${image.owner.username}`} className="flex items-center gap-3 group">
                        <img src={image.owner.profile_picture_url || 'https://via.placeholder.com/48'} alt={image.owner.username} className="w-12 h-12 rounded-full"/>
                        <div>
                            <h2 className="font-bold text-lg text-gray-800">{image.owner.username}</h2>
                            <p className="text-sm text-gray-500">Posted on {new Date(image.created_at).toLocaleDateString()}</p>
                        </div>
                    </Link>
                    {currentUser?.id !== image.owner.id && (
                        <FollowButton userIdToFollow={image.owner.id} initialIsFollowing={image.is_followed_by_current_user || false}/>
                    )}
                </div>
                <hr />
                <div>
                    <p className="text-gray-700">{image.caption}</p>
                    <div className="flex flex-wrap gap-2 mt-4">
                        {image.tags.map(tag => (
                            <span key={tag.id} className="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-full">#{tag.name}</span>
                        ))}
                    </div>
                </div>
                <div className="flex items-center space-x-6">
                    {/* --- DYNAMIC LIKE BUTTON --- */}
                    <button
                        onClick={() => isLoggedIn && likeMutation.mutate(image.id)}
                        disabled={!isLoggedIn || likeMutation.isPending}
                        className={`flex items-center gap-2 transition-colors hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed ${likeButtonClass}`}
                    >
                        <Heart /> <span>{image.like_count} Likes</span>
                    </button>
                    <button className="flex items-center gap-2 hover:text-blue-500">
                        <MessageCircle /> <span>{image.comment_count} Comments</span>
                    </button>
                    {/* --- DYNAMIC DOWNLOAD BUTTON --- */}
                    {image.owner.allow_downloads && (
                        <a href={`http://127.0.0.1:8000/images/${image.id}/download`}
                           download
                           className="flex items-center gap-2 hover:text-green-500"
                           target="_blank" // Open in new tab to not navigate away
                           rel="noopener noreferrer"
                        >
                            <Download /> <span>Download</span>
                        </a>
                    )}
                </div>
                <hr />
                <div className="flex-grow flex flex-col">
                    <h3 className="font-bold text-lg mb-4">Comments ({image.comment_count})</h3>
                    <div className="flex-grow space-y-4 overflow-y-auto max-h-96 pr-2">
                        <CommentList comments={comments} />
                    </div>
                    <div className="mt-auto pt-4">
                        <CommentForm imageId={image.id} onCommentPosted={handleCommentPosted} />
                    </div>
                </div>
            </div>
        </div>
    );
};