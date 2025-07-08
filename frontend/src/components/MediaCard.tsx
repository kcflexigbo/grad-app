import { Link } from 'react-router-dom';
import { Heart, MessageCircle, PlayCircle, X } from 'lucide-react';
import type { Media } from '../types/media';
import {memo} from "react";

// The props interface is updated to use the new Media type
interface MediaCardProps {
    media: Media;
    onRemoveFromAlbum?: (mediaId: number) => void;
    loadingStrategy?: 'eager' | 'lazy';
}

const MediaCardComponent = ({ media, onRemoveFromAlbum, loadingStrategy = 'lazy' }
                          : MediaCardProps) => {
    const handleRemoveClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (onRemoveFromAlbum) {
            onRemoveFromAlbum(media.id);
        }
    };

    const getSrcSet = (baseUrl: string) => {
        const widths = [400, 600, 800, 1200, 1600];

        // Chain commands: 1. Resize, 2. Auto-format to WebP, 3. Set quality to 80
        const processCommands = "image/resize,w_{w}/format,webp/quality,q_80";

        return widths
            .map(w => `${baseUrl}?x-oss-process=${processCommands.replace('{w}', String(w))} ${w}w`)
            .join(', ');
    }

    return (
        <div className="relative group break-inside-avoid">
            <Link
                to={`/media/${media.id}`}
                className="block overflow-hidden rounded-lg shadow-sm hover:shadow-xl transition-shadow duration-300"
            >
                {media.media_type === 'video' ? (
                    <video
                        src={media.media_url}
                        className="w-full h-auto object-cover bg-black"
                        autoPlay
                        loop
                        muted
                        playsInline
                    />
                ) : (
                    <img
                        src={media.media_url}
                        srcSet={getSrcSet(media.media_url)}
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        alt={media.caption || `A media item by ${media.owner.username}`}
                        className="w-full h-auto object-cover"
                        style={{ aspectRatio: '4 / 3' }}
                        loading={loadingStrategy}
                        fetchPriority={loadingStrategy === 'eager' ? 'high' : 'auto'}
                    />
                )}

                {media.media_type === 'video' && (
                    <div className="absolute top-3 right-3 z-10 p-1 bg-black/40 backdrop-blur-sm rounded-full text-white">
                        <PlayCircle size={20} />
                    </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4 text-white">
                    {/* Owner Information */}
                    <div className="flex items-center gap-2 transform -translate-y-4 group-hover:translate-y-0 transition-transform duration-300 ease-in-out">
                        <img
                            src={media.owner.profile_picture_url || '/default_avatar.png'}
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

export const MediaCard = memo(MediaCardComponent);