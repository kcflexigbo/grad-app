import Masonry from 'react-masonry-css';
import type { Media } from '../types/media'; // Import the new Media type
import { MediaCard } from './MediaCard';     // Import the new MediaCard component

// The props interface is updated for clarity and correctness
interface MediaGridProps {
    mediaItems: Media[]; // Use a more generic name like 'mediaItems' or 'media'
    onRemoveFromAlbum?: (mediaId: number) => void;
}

// These breakpoints for the masonry layout remain the same
const breakpointColumnsObj = {
  default: 4,
  1280: 3,
  768: 2,
};

// The component is renamed to MediaGrid
export const MediaGrid = ({ mediaItems, onRemoveFromAlbum }: MediaGridProps) => {
    return (
        <Masonry
            breakpointCols={breakpointColumnsObj}
            className="my-masonry-grid"
            columnClassName="my-masonry-grid_column"
        >
            {/* Map over the 'mediaItems' prop */}
            {mediaItems.map((media, index) => (
                <MediaCard
                    key={media.id}
                    media={media} // Pass the 'media' object to MediaCard
                    onRemoveFromAlbum={onRemoveFromAlbum}
                    loadingStrategy={index < 4 ? 'eager' : 'lazy'}
                />
            ))}
        </Masonry>
    );
};