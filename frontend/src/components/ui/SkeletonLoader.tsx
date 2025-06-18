import Masonry from 'react-masonry-css';

interface SkeletonLoaderProps {
    count: number;
}

// These are the same breakpoints we'll use in the main ImageGrid
const breakpointColumnsObj = {
  default: 4,
  1280: 3, // xl
  1024: 2, // lg
  768: 1,  // md
};

export const SkeletonLoader = ({ count }: SkeletonLoaderProps) => {
    // An array of varying heights to simulate the masonry effect
    const skeletonHeights = ['h-64', 'h-80', 'h-72', 'h-96'];

    return (
        <Masonry
            breakpointCols={breakpointColumnsObj}
            className="my-masonry-grid"
            columnClassName="my-masonry-grid_column"
        >
            {Array.from({ length: count }).map((_, index) => (
                <div key={index} className={`bg-gray-200 rounded-lg animate-pulse ${skeletonHeights[index % skeletonHeights.length]}`}>
                    {/* The div itself is the skeleton */}
                </div>
            ))}
        </Masonry>
    );
};