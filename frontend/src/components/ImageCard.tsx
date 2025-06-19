import { Link } from 'react-router-dom';
import { Heart, MessageCircle, X } from 'lucide-react';
import type {Image} from '../types/image';

interface ImageCardProps {
    image: Image;
    onRemoveFromAlbum?: (imageId: number) => void;
}

export const ImageCard = ({ image, onRemoveFromAlbum }: ImageCardProps) => {
    const handleRemoveClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (onRemoveFromAlbum) {
            onRemoveFromAlbum(image.id);
        }
    };

    return (
        <div className="relative group break-inside-avoid">
            <Link
                to={`/photo/${image.id}`}
                className="block overflow-hidden rounded-lg shadow-sm hover:shadow-xl transition-shadow duration-300"
            >
                <img
                    src={image.image_url}
                    alt={image.caption || `An image by ${image.owner.username}`}
                    className="w-full h-auto object-cover"
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4 text-white">
                    <div className="flex items-center gap-2 transform -translate-y-4 group-hover:translate-y-0 transition-transform duration-300 ease-in-out">
                        <img
                            src={image.owner.profile_picture_url || 'https://via.placeholder.com/32'}
                            alt={image.owner.username}
                            className="w-8 h-8 rounded-full object-cover border-2 border-white/80"
                        />
                        <span className="font-semibold text-sm drop-shadow-md">{image.owner.username}</span>
                    </div>
                    <div className="flex items-center gap-4 self-end transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 ease-in-out">
                        <div className="flex items-center gap-1.5 font-medium text-sm drop-shadow-md">
                            <Heart size={18} />
                            <span>{image.like_count}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-medium text-sm drop-shadow-md">
                            <MessageCircle size={18} />
                            <span>{image.comment_count}</span>
                        </div>
                    </div>
                </div>
            </Link>

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