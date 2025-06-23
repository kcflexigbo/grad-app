import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, MessageCircle, Download, Star, Flag, Trash2, Edit, FolderPlus, Video, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

// API and Hooks
import apiService from '../api/apiService';
import { useAuth } from '../hooks/useAuth';
import { useWebSocket } from '../hooks/useWebSocket';
import { API_URL, WS_URL } from "../api/config.ts";

// Components and Types
import { FollowButton } from '../components/FollowButton';
import { CommentList } from '../components/CommentList';
import { CommentForm } from '../components/CommentForm';
import { AddToAlbumModal } from '../components/AddToAlbumModal';
import { ReportModal } from '../components/ReportModal';
import type { Media as MediaType } from '../types/media';
import type { Comment as CommentType } from '../types/comments';

// Define the detailed media type returned by the API for this page
interface MediaDetail extends MediaType {
    is_followed_by_current_user?: boolean;
    is_liked_by_current_user?: boolean;
    comments: CommentType[];
}

// Data fetching function for react-query
const fetchMediaDetail = async (id: string): Promise<MediaDetail> => {
    const { data } = await apiService.get<MediaDetail>(`/media/${id}`);
    return data;
};

export const MediaDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user: currentUser, isLoggedIn } = useAuth();

    const [isEditing, setIsEditing] = useState(false);
    const [editedCaption, setEditedCaption] = useState('');
    const [isAddToAlbumModalOpen, setIsAddToAlbumModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportingContent, setReportingContent] = useState<{ mediaId?: number; commentId?: number }>({});

    const { data: media, isLoading, isError, error } = useQuery({
        queryKey: ['media', id],
        queryFn: () => fetchMediaDetail(id!),
        enabled: !!id,
    });

    useEffect(() => {
        if (media) {
            setEditedCaption(media.caption || '');
        }
    }, [media]);

    const wsUrl = media ? `${WS_URL}/ws/comments/${media.id}` : null;
    const { lastMessage } = useWebSocket<CommentType>(wsUrl);

    useEffect(() => {
        if (lastMessage) {
            queryClient.setQueryData<MediaDetail | undefined>(['media', id], (oldData) => {
                if (!oldData || oldData.comments?.some(c => c.id === lastMessage.id)) return oldData;
                return {
                    ...oldData,
                    comments: [...(oldData.comments || []), lastMessage],
                    comment_count: (oldData.comment_count || 0) + 1,
                };
            });
        }
    }, [lastMessage, queryClient, id]);

    // Mutations
    const updateCaptionMutation = useMutation({
        mutationFn: (newCaption: { caption: string }) => apiService.put(`/media/${media!.id}`, newCaption),
        onSuccess: (updatedMedia) => {
            queryClient.setQueryData(['media', id], updatedMedia);
            toast.success("Caption updated successfully!");
            setIsEditing(false);
        },
        onError: () => toast.error("Failed to update caption.")
    });

    const likeMutation = useMutation({
        mutationFn: () => apiService.request({
            method: media?.is_liked_by_current_user ? 'DELETE' : 'POST',
            url: `/media/${media!.id}/like`,
        }),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ['media', id] });
            const previousMedia = queryClient.getQueryData<MediaDetail>(['media', id]);
            if (previousMedia) {
                queryClient.setQueryData<MediaDetail>(['media', id], {
                    ...previousMedia,
                    is_liked_by_current_user: !previousMedia.is_liked_by_current_user,
                    like_count: previousMedia.is_liked_by_current_user ? previousMedia.like_count - 1 : previousMedia.like_count + 1,
                });
            }
            return { previousMedia };
        },
        onError: (_err, _vars, context) => {
            if (context?.previousMedia) queryClient.setQueryData(['media', id], context.previousMedia);
            toast.error("Failed to update like status.");
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: ['media', id] }),
    });

    const featureMutation = useMutation({
        mutationFn: (mediaId: number) => apiService.post(`/admin/media/${mediaId}/feature`),
        onSuccess: () => {
            toast.success("Feature status updated!");
            queryClient.invalidateQueries({ queryKey: ['media', id] });
        },
        onError: () => toast.error("Could not update feature status.")
    });

    const deleteMediaMutation = useMutation({
        mutationFn: (mediaId: number) => apiService.delete(`/media/${mediaId}`),
        onSuccess: () => {
            toast.success("Media deleted successfully.");
            queryClient.invalidateQueries({ queryKey: ['media'] });
            queryClient.invalidateQueries({ queryKey: ['profile', media?.owner.username] });
            navigate(`/profile/${media?.owner.username}`);
        },
        onError: () => toast.error("Failed to delete the media item."),
    });

    const deleteCommentMutation = useMutation({
        mutationFn: (commentId: number) => apiService.delete(`/comments/${commentId}`),
        onSuccess: () => {
            toast.success("Comment deleted.");
            queryClient.invalidateQueries({ queryKey: ['media', id] });
        },
        onError: () => toast.error("Failed to delete comment."),
    });


    // --- RENDER LOGIC ---
    if (isLoading) return <div className="text-center py-20">Loading media details...</div>;
    if (isError) return <div className="text-center py-20 text-red-500">Error: {(error as any).message || "Could not load the media."}</div>;

    if (!media) return <div className="text-center py-20 text-gray-600">Media not found.</div>;

    const likeButtonClass = media.is_liked_by_current_user ? "text-red-500 fill-current" : "text-gray-600";
    const isOwner = currentUser?.id === media.owner.id;
    const canManageMedia = isOwner || !!currentUser?.is_admin;


    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                <div className="lg:col-span-2 bg-black rounded-lg flex items-center justify-center p-4">
                    {media.media_type === 'video' ? (
                        <video
                            src={media.media_url}
                            className="max-w-full max-h-[80vh] object-contain"
                            controls
                            autoPlay
                        />
                    ) : (
                        <img
                            src={media.media_url}
                            alt={media.caption || `Media by ${media.owner.username}`}
                            className="max-w-full max-h-[80vh] object-contain"
                        />
                    )}
                </div>
                <div className="flex flex-col space-y-6">
                    <div className="flex justify-between items-center">
                         <div className="flex items-center gap-1 text-sm text-gray-500">
                            {media.media_type === 'video' ? <Video size={16}/> : <ImageIcon size={16}/>}
                            <span>{media.media_type.charAt(0).toUpperCase() + media.media_type.slice(1)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {canManageMedia && (
                                <button onClick={() => deleteMediaMutation.mutate(media.id)} disabled={deleteMediaMutation.isPending} className="p-2 rounded-full hover:bg-red-100" title="Delete Media">
                                    <Trash2 size={16} className="text-red-600"/>
                                </button>
                            )}
                            {currentUser?.is_admin && (
                                <button onClick={() => featureMutation.mutate(media.id)} className="p-2 rounded-full hover:bg-yellow-100" title={media.is_featured ? 'Un-feature' : 'Feature'}>
                                    <Star size={16} className={media.is_featured ? 'text-yellow-500 fill-current' : 'text-gray-600'}/>
                                </button>
                            )}
                            <button onClick={() => { if(isLoggedIn) { setReportingContent({ mediaId: media.id }); setIsReportModalOpen(true); } else { toast.error("Please log in to report content.") }}} className="p-2 rounded-full hover:bg-gray-200" title="Report this media">
                                <Flag size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-between items-start">
                        <Link to={`/profile/${media.owner.username}`} className="flex items-center gap-3 group">
                            <img src={media.owner.profile_picture_url || 'https://s3.amazonaws.com/37assets/svn/765-default-avatar.png'} alt={media.owner.username} className="w-12 h-12 rounded-full object-cover"/>
                            <div>
                                <h2 className="font-bold text-lg text-gray-800 group-hover:underline">{media.owner.username}</h2>
                                <p className="text-sm text-gray-500">Posted on {new Date(media.created_at).toLocaleDateString()}</p>
                            </div>
                        </Link>
                        {currentUser?.id !== media.owner.id && (
                            <FollowButton userIdToFollow={media.owner.id} initialIsFollowing={media.is_followed_by_current_user || false}/>
                        )}
                    </div>
                    <hr />

                    <div>
                        {isEditing ? (
                            <div className="space-y-2">
                                <textarea
                                    value={editedCaption}
                                    onChange={(e) => setEditedCaption(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    rows={3}
                                />
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => updateCaptionMutation.mutate({ caption: editedCaption })}
                                        disabled={updateCaptionMutation.isPending}
                                        className="px-3 py-1 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                                    >
                                        {updateCaptionMutation.isPending ? 'Saving...' : 'Save'}
                                    </button>
                                    <button
                                        onClick={() => { setEditedCaption(media.caption || ''); setIsEditing(false); }}
                                        className="px-3 py-1 bg-gray-200 text-gray-800 text-sm font-semibold rounded-md hover:bg-gray-300"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-start gap-3 group">
                                 <p className="text-gray-700 flex-grow">{media.caption || <span className="text-gray-400 italic">No caption provided.</span>}</p>
                                 {isOwner && (
                                     <button
                                         onClick={() => setIsEditing(true)}
                                         className="p-1 rounded-full text-gray-400 opacity-0 group-hover:opacity-100"
                                         title="Edit caption"
                                     >
                                         <Edit size={16} />
                                     </button>
                                 )}
                            </div>
                        )}
                        {media.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-4">
                                {media.tags.map(tag => (
                                    <span key={tag.id} className="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-full">#{tag.name}</span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center space-x-6">
                        <button
                            onClick={() => isLoggedIn && likeMutation.mutate()}
                            disabled={!isLoggedIn || likeMutation.isPending}
                            className={`flex items-center gap-2 transition-colors hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed ${likeButtonClass}`}
                        >
                            <Heart /> <span>{media.like_count} Likes</span>
                        </button>
                        <button
                            className="flex items-center gap-2 text-gray-600 hover:text-blue-500"
                        >
                            <MessageCircle /> <span>{media.comments?.length || 0} Comments</span>
                        </button>
                        {isLoggedIn && (
                                <button onClick={() => setIsAddToAlbumModalOpen(true)} className="flex items-center gap-2 text-gray-600 hover:text-purple-500">
                                    <FolderPlus /> <span>Add to Album</span>
                                </button>
                        )}
                        {media.owner.allow_downloads && (
                            <a href={`${API_URL}/media/${media.id}/download`} download className="flex items-center gap-2 text-gray-600 hover:text-green-500" target="_blank" rel="noopener noreferrer">
                                <Download /> <span>Download</span>
                            </a>
                        )}
                    </div>
                    <hr />

                    {/* Comments Section */}
                    <div className="flex-grow flex flex-col min-h-0">
                        <h3 className="font-bold text-lg mb-4">Comments ({media.comments?.length || 0})</h3>
                        <div className="flex-grow space-y-4 overflow-y-auto max-h-96 pr-2">
                             <CommentList
                                comments={media.comments || []}
                                currentUser={currentUser}
                                onDeleteComment={deleteCommentMutation.mutate}
                                onReportComment={(commentId) => { setReportingContent({ commentId }); setIsReportModalOpen(true); }}
                            />
                        </div>
                        <div className="mt-auto pt-4">
                            <CommentForm
                                mediaId={media.id}
                                onCommentPosted={(newComment) => queryClient.setQueryData<MediaDetail | undefined>(['media', id], (d) => {
                                    if (!d) return;
                                    return ({...d, comments: [...(d.comments || []), newComment], comment_count: (d.comment_count || 0) + 1});
                                })}
                            />
                        </div>
                    </div>
                </div>
            </div>
             <ReportModal
                isOpen={isReportModalOpen}
                onClose={() => { setIsReportModalOpen(false); setReportingContent({}); }}
                reportedMediaId={reportingContent.mediaId}
                reportedCommentId={reportingContent.commentId}
            />
            {isLoggedIn && (
                 <AddToAlbumModal
                    isOpen={isAddToAlbumModalOpen}
                    onClose={() => setIsAddToAlbumModalOpen(false)}
                    mediaId={media.id}
                />
            )}
        </>
    );
};