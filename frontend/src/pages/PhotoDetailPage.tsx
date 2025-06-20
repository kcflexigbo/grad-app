import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, MessageCircle, Download, Star, Flag, Trash2, Edit, FolderPlus } from 'lucide-react';
import toast from 'react-hot-toast';

// API and Hooks
import apiService from '../api/apiService';
import { useAuth } from '../hooks/useAuth';
import { useWebSocket } from '../hooks/useWebSocket';
// Components and Types
import { FollowButton } from '../components/FollowButton';
import { CommentList } from '../components/CommentList';
import { CommentForm } from '../components/CommentForm';
import { AddToAlbumModal } from '../components/AddToAlbumModal';
import { ReportModal } from '../components/ReportModal';
import type { Image as ImageType } from '../types/image';
import type { Comment as CommentType } from '../types/comments';
import {WS_URL} from "../api/config.ts";


// Define the detailed image type returned by the API for this page
interface ImageDetail extends ImageType {
    is_followed_by_current_user?: boolean;
    is_liked_by_current_user?: boolean;
    comments: CommentType[];
    is_featured?: boolean;
}

// Data fetching function for react-query
const fetchImageDetail = async (id: string): Promise<ImageDetail> => {
    const { data } = await apiService.get<ImageDetail>(`/images/${id}`);
    return data;
};

export const PhotoDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user: currentUser, isLoggedIn } = useAuth();

    const [isEditing, setIsEditing] = useState(false); // State to manage edit mode
    const [editedCaption, setEditedCaption] = useState(''); // State for the textarea content
    const [isAddToAlbumModalOpen, setIsAddToAlbumModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportingContent, setReportingContent] = useState<{ imageId?: number; commentId?: number }>({});

    // --- QUERIES & MUTATIONS ---

    // Main query to fetch the image details
    const { data: image, isLoading, isError, error } = useQuery({
        queryKey: ['image', id],
        queryFn: () => fetchImageDetail(id!),
        enabled: !!id,
    });

    const comments = image?.comments || [];

    useEffect(() => {
        if (image) {
            setEditedCaption(image.caption || '');
        }
    }, [image]);

    const wsUrl = image ? `${WS_URL}/ws/comments/${image.id}` : null;
    const { lastMessage } = useWebSocket<CommentType>(wsUrl);

    useEffect(() => {
        if (lastMessage) {
            queryClient.setQueryData(['image', id], (oldData: ImageDetail | undefined) => {
                if (!oldData) return oldData;

                if (oldData.comments.some(c => c.id === lastMessage.id)) {
                    return oldData;
                }

                return {
                    ...oldData,
                    comments: [...oldData.comments, lastMessage],
                    comment_count: oldData.comment_count + 1,
                };
            });
        }
    }, [lastMessage, queryClient, id]);


    const updateCaptionMutation = useMutation({
        mutationFn: (newCaption: { caption: string }) => apiService.put(`/images/${image!.id}`, newCaption),
        onSuccess: (updatedImage) => {
            queryClient.setQueryData(['image', id], updatedImage);
            toast.success("Caption updated successfully!");
            setIsEditing(false);
        },
        onError: () => {
            toast.error("Failed to update caption.");
        }
    });

    const likeMutation = useMutation({
        mutationFn: () => {
            const endpoint = `/images/${image!.id}/like`;
            return image?.is_liked_by_current_user ? apiService.delete(endpoint) : apiService.post(endpoint);
        },
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ['image', id] });
            const previousImage = queryClient.getQueryData<ImageDetail>(['image', id]);
            if (previousImage) {
                queryClient.setQueryData<ImageDetail>(['image', id], {
                    ...previousImage,
                    is_liked_by_current_user: !previousImage.is_liked_by_current_user,
                    like_count: previousImage.is_liked_by_current_user
                        ? previousImage.like_count - 1
                        : previousImage.like_count + 1,
                });
            }
            return { previousImage };
        },
        onError: (_err, _variables, context) => {
            if (context?.previousImage) {
                queryClient.setQueryData(['image', id], context.previousImage);
            }
            toast.error("Failed to update like status.");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['image', id] });
        },
    });

    const featureMutation = useMutation({
        mutationFn: (imageId: number) => apiService.post(`/admin/images/${imageId}/feature`),
        onSuccess: () => {
            toast.success("Feature status updated!");
            queryClient.invalidateQueries({ queryKey: ['image', id] });
        },
        onError: () => toast.error("Could not update feature status.")
    });

    const deleteImageMutation = useMutation({
        mutationFn: (imageId: number) => apiService.delete(`/images/${imageId}`),
        onSuccess: () => {
            toast.success("Image deleted successfully.");
            queryClient.invalidateQueries({ queryKey: ['images'] });
            queryClient.invalidateQueries({ queryKey: ['profile', image?.owner.username] });
            navigate(`/profile/${image?.owner.username}`);
        },
        onError: () => toast.error("Failed to delete the image."),
    });

    const deleteCommentMutation = useMutation({
        mutationFn: (commentId: number) => apiService.delete(`/comments/${commentId}`),
        onSuccess: () => {
            toast.success("Comment deleted.");
            queryClient.invalidateQueries({ queryKey: ['image', id] });
        },
        onError: () => toast.error("Failed to delete comment."),
    });


    // --- HANDLERS ---
   const handleCommentPosted = (newComment: CommentType) => {
        queryClient.setQueryData(['image', id], (oldData: ImageDetail | undefined) => {
            if (!oldData) return oldData;
            return {
                ...oldData,
                comments: [...oldData.comments, newComment],
                comment_count: oldData.comment_count + 1
            };
        });
        toast.success("Comment posted!");
    };

    const handleDeleteImage = () => {
        if (window.confirm('Are you sure you want to permanently delete this image? This action cannot be undone.')) {
            deleteImageMutation.mutate(image!.id);
        }
    };

    const handleEditSave = () => {
        if (editedCaption !== image?.caption) {
            updateCaptionMutation.mutate({ caption: editedCaption });
        } else {
            setIsEditing(false);
        }
    };

    const handleEditCancel = () => {
        setEditedCaption(image?.caption || '');
        setIsEditing(false);
    };

    const handleReportImage = () => {
        if (!isLoggedIn) {
            toast.error("You must be logged in to report content.");
            return;
        }
        setReportingContent({ imageId: image!.id });
        setIsReportModalOpen(true);
    };

    const handleReportComment = (commentId: number) => {
        if (!isLoggedIn) {
            toast.error("You must be logged in to report content.");
            return;
        }
        setReportingContent({ commentId: commentId });
        setIsReportModalOpen(true);
    };

    const handleCloseReportModal = () => {
        setIsReportModalOpen(false);
        setReportingContent({});
    };

    // --- RENDER LOGIC ---
    if (isLoading) return <div className="text-center py-20">Loading photo details...</div>;
    if (isError) return <div className="text-center py-20 text-red-500">Error: {(error as any).message || "Could not load the photo."}</div>;
    if (!image) return <div className="text-center py-20 text-gray-600">Photo not found.</div>;

    const likeButtonClass = image.is_liked_by_current_user ? "text-red-500 fill-current" : "text-gray-600";
    const isOwner = currentUser?.id === image.owner.id;
    const canManageImage = isOwner || !!currentUser?.is_admin;


    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                <div className="lg:col-span-2 bg-black rounded-lg flex items-center justify-center">
                    <img src={image.image_url} alt={image.caption || `Photo by ${image.owner.username}`} className="max-w-full max-h-[80vh] object-contain" />
                </div>

                <div className="flex flex-col space-y-6">
                    <div className="flex justify-end items-center gap-2 -mb-4">
                        {canManageImage && (
                            <button onClick={handleDeleteImage} disabled={deleteImageMutation.isPending} className="flex items-center gap-1 p-2 text-xs rounded-md bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50" title="Delete Image">
                                <Trash2 size={16} />
                            </button>
                        )}
                        {currentUser?.is_admin && (
                            <button onClick={() => featureMutation.mutate(image.id)} className={`flex items-center gap-1 p-2 text-xs rounded-md ${image.is_featured ? 'bg-yellow-400 text-white' : 'bg-gray-200'}`} title={image.is_featured ? 'Un-feature Image' : 'Feature Image'}>
                                <Star size={16} /> {image.is_featured ? 'Featured' : 'Feature'}
                            </button>
                        )}
                        <button onClick={handleReportImage} className="p-2 rounded-full hover:bg-gray-200" title="Report this image">
                            <Flag size={16} />
                        </button>
                    </div>

                    <div className="flex justify-between items-start">
                        <Link to={`/profile/${image.owner.username}`} className="flex items-center gap-3 group">
                            <img src={image.owner.profile_picture_url || 'https://via.placeholder.com/48'} alt={image.owner.username} className="w-12 h-12 rounded-full object-cover"/>
                            <div>
                                <h2 className="font-bold text-lg text-gray-800 group-hover:underline">{image.owner.username}</h2>
                                <p className="text-sm text-gray-500">Posted on {new Date(image.created_at).toLocaleDateString()}</p>
                            </div>
                        </Link>
                        {currentUser?.id !== image.owner.id && (
                            <FollowButton userIdToFollow={image.owner.id} initialIsFollowing={image.is_followed_by_current_user || false}/>
                        )}
                    </div>
                    <hr />

                    <div>
                        {isEditing ? (
                            <div className="space-y-2">
                                <textarea
                                    value={editedCaption}
                                    onChange={(e) => setEditedCaption(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                />
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleEditSave}
                                        disabled={updateCaptionMutation.isPending}
                                        className="px-3 py-1 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                                    >
                                        {updateCaptionMutation.isPending ? 'Saving...' : 'Save'}
                                    </button>
                                    <button
                                        onClick={handleEditCancel}
                                        className="px-3 py-1 bg-gray-200 text-gray-800 text-sm font-semibold rounded-md hover:bg-gray-300"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-start gap-3 group">
                                 <p className="text-gray-700 flex-grow">{image.caption || <span className="text-gray-400 italic">No caption provided.</span>}</p>
                                 {isOwner && (
                                     <button
                                         onClick={() => setIsEditing(true)}
                                         className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity"
                                         title="Edit caption"
                                     >
                                         <Edit size={16} />
                                     </button>
                                 )}
                            </div>
                        )}
                        {image.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-4">
                                {image.tags.map(tag => (
                                    <span key={tag.id} className="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-full">#{tag.name}</span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center space-x-6">
                        <button onClick={() => isLoggedIn && likeMutation.mutate()} disabled={!isLoggedIn || likeMutation.isPending} className={`flex items-center gap-2 transition-colors hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed ${likeButtonClass}`}>
                            <Heart /> <span>{image.like_count} Likes</span>
                        </button>
                        <button className="flex items-center gap-2 text-gray-600 hover:text-blue-500">
                            <MessageCircle /> <span>{comments.length} Comments</span>
                        </button>
                        {isLoggedIn && (
                                <button onClick={() => setIsAddToAlbumModalOpen(true)} className="flex items-center gap-2 text-gray-600 hover:text-purple-500">
                                    <FolderPlus /> <span>Add to Album</span>
                                </button>
                        )}
                        {image.owner.allow_downloads && (
                            <a href={`http://127.0.0.1:8000/images/${image.id}/download`} download className="flex items-center gap-2 text-gray-600 hover:text-green-500" target="_blank" rel="noopener noreferrer">
                                <Download /> <span>Download</span>
                            </a>
                        )}
                    </div>
                    <hr />

                    {/* Comments Section */}
                    <div className="flex-grow flex flex-col min-h-0">
                        <h3 className="font-bold text-lg mb-4">Comments ({image.comments.length})</h3>
                        <div className="flex-grow space-y-4 overflow-y-auto max-h-96 pr-2">
                             <CommentList
                                comments={image.comments}
                                currentUser={currentUser}
                                onDeleteComment={deleteCommentMutation.mutate}
                                onReportComment={handleReportComment}
                            />
                        </div>
                        <div className="mt-auto pt-4">
                            <CommentForm
                                imageId={image.id}
                                onCommentPosted={handleCommentPosted}
                            />
                        </div>
                    </div>
                </div>
            </div>
            <ReportModal
                isOpen={isReportModalOpen}
                onClose={handleCloseReportModal}
                reportedImageId={reportingContent.imageId}
                reportedCommentId={reportingContent.commentId}
            />
            {isLoggedIn && image && (
                 <AddToAlbumModal
                    isOpen={isAddToAlbumModalOpen}
                    onClose={() => setIsAddToAlbumModalOpen(false)}
                    imageId={image.id}
                />
            )}
        </>
    );
};