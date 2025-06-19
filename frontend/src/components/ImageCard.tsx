import { Link } from 'react-router-dom';
import { Heart, MessageCircle, X } from 'lucide-react';
import type {Image} from '../types/image';

interface ImageCardProps {
    image: Image;
    onRemoveFromAlbum?: (imageId: number) => void;
}

export const ImageCard = ({ image, onRemoveFromAlbum }: ImageCardProps) => {
    const handleRemoveClick = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent navigating to photo detail page
        e.stopPropagation();
        if (onRemoveFromAlbum) {
            onRemoveFromAlbum(image.id);
        }
    };

    return (
        <div className="relative group">
            {/* --- Conditional remove button --- */}
            {onRemoveFromAlbum && (
                <button
                    onClick={handleRemoveClick}
                    className="absolute top-2 right-2 z-10 p-1.5 bg-white/80 backdrop-blur-sm rounded-full text-red-600 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
                    title="Remove from album"
                >
                    <X size={16} />
                </button>
            )}
            <Link
                to={`/photo/${image.id}`}
                className="group block rounded-lg overflow-hidden relative"
            >
                {/* The main image */}
                <img
                    src={image.image_url}
                    alt={image.caption || `An image by ${image.owner.username}`}
                    className="w-full h-auto object-cover"
                    loading="lazy" // Native lazy loading for performance
                />

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex flex-col justify-between p-4 text-white">
                    {/* Top: Owner Info (only visible on hover) */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <img
                            src={image.owner.profile_picture_url || 'https://via.placeholder.com/32'}
                            alt={image.owner.username}
                            className="w-8 h-8 rounded-full object-cover border-2 border-white"
                        />
                        <span className="font-semibold">{image.owner.username}</span>
                    </div>

                    {/* Bottom: Stats (only visible on hover) */}
                    <div className="flex items-center gap-4 self-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="flex items-center gap-1">
                            <Heart size={20} />
                            <span>{image.like_count}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <MessageCircle size={20} />
                            <span>{image.comment_count}</span>
                        </div>
                    </div>
                </div>
            </Link>
        </div>
    );
};