import { Link } from 'react-router-dom';
import { Heart, MessageCircle, PlayCircle, X } from 'lucide-react';
import type { Media } from '../types/media';

// The props interface is updated to use the new Media type
interface MediaCardProps {
    media: Media;
    onRemoveFromAlbum?: (mediaId: number) => void;
}

export const MediaCard = ({ media, onRemoveFromAlbum }: MediaCardProps) => {
    // The handler for removing an item from an album.
    // It prevents the link from being followed when the 'X' is clicked.
    const handleRemoveClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (onRemoveFromAlbum) {
            onRemoveFromAlbum(media.id);
        }
    };

    return (
        <div className="relative group break-inside-avoid">
            {/* The main link still points to a detail page.
                The route can be updated later in App.tsx if desired. */}
            <Link
                to={`/media/${media.id}`}
                className="block overflow-hidden rounded-lg shadow-sm hover:shadow-xl transition-shadow duration-300"
            >
                {/* --- CORE CHANGE: Render an <img /> or <video /> based on media_type --- */}
                {media.media_type === 'video' ? (
                    <video
                        src={media.media_url}
                        className="w-full h-auto object-cover bg-black"
                        autoPlay
                        loop
                        muted
                        playsInline // Essential for good UX on mobile browsers
                    />
                ) : (
                    <img
                        src={media.media_url}
                        alt={media.caption || `A media item by ${media.owner.username}`}
                        className="w-full h-auto object-cover"
                        loading="lazy"
                    />
                )}

                {/* --- NEW FEATURE: A visual indicator for video content --- */}
                {media.media_type === 'video' && (
                    <div className="absolute top-3 right-3 z-10 p-1 bg-black/40 backdrop-blur-sm rounded-full text-white">
                        <PlayCircle size={20} />
                    </div>
                )}

                {/* The hover overlay logic remains the same, just using the `media` prop */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4 text-white">
                    {/* Owner Information */}
                    <div className="flex items-center gap-2 transform -translate-y-4 group-hover:translate-y-0 transition-transform duration-300 ease-in-out">
                        <img
                            src={media.owner.profile_picture_url || 'https://s3.amazonaws.com/37assets/svn/765-default-avatar.png'}
                            alt={media.owner.username}
                            className="w-8 h-8 rounded-full object-cover border-2 border-white/80"
                        />
                        <span className="font-semibold text-sm drop-shadow-md">{media.owner.username}</span>
                    </div>
                    {/* Like and Comment Counts */}
                    <div className="flex items-center gap-4 self-end transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 ease-in-out">
                        <div className="flex items-center gap-1.5 font-medium text-sm drop-shadow-md">
                            <Heart size={18} />
                            <span>{media.like_count}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-medium text-sm drop-shadow-md">
                            <MessageCircle size={18} />
                            <span>{media.comment_count}</span>
                        </div>
                    </div>
                </div>
            </Link>

            {/* Conditional "Remove from Album" button */}
            {onRemoveFromAlbum && (
                <button
                    onClick={handleRemoveClick}
                    className="absolute top-2 right-2 z-10 p-1.5 bg-white/80 backdrop-blur-sm rounded-full text-red-600 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
                    title="Remove from album"
                >
                    <X size={16} />
                </button>
            )}
        </div>
    );
};