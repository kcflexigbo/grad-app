import Masonry from 'react-masonry-css';
import type {Image} from '../types/image';
import { ImageCard } from './ImageCard';

interface ImageGridProps {
    images: Image[];
    onRemoveFromAlbum?: (imageId: number) => void;
}

// Define the breakpoints for the masonry grid
const breakpointColumnsObj = {
  default: 4,
  1280: 3, // On xl screens
  1024: 2, // On lg screens
  768: 1,  // On md screens and smaller
};

export const ImageGrid = ({ images, onRemoveFromAlbum }: ImageGridProps) => {
    return (
        <Masonry
            breakpointCols={breakpointColumnsObj}
            className="my-masonry-grid"
            columnClassName="my-masonry-grid_column"
        >
            {images.map((image) => (
                <ImageCard
                    key={image.id}
                    image={image}
                    onRemoveFromAlbum={onRemoveFromAlbum}/>
            ))}
        </Masonry>
    );
};