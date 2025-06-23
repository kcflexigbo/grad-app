import { useState, useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { MediaGrid } from '../components/MediaGrid'; // <-- Use MediaGrid
import { SkeletonLoader } from '../components/ui/SkeletonLoader';
import apiService from '../api/apiService';
import type { Media } from '../types/media'; // <-- Use Media type
import { Loader2, Camera } from 'lucide-react';

type SortOption = 'newest' | 'popular' | 'featured';
const PAGE_SIZE = 12;

const fetchMedia = async ({ pageParam = 0, sortBy }: { pageParam?: number, sortBy: SortOption }) => {
    const { data } = await apiService.get<Media[]>('/media', {
        params: {
            sort_by: sortBy,
            skip: pageParam,
            limit: PAGE_SIZE,
        },
    });
    return {
        media: data,
        nextPage: data.length === PAGE_SIZE ? pageParam + PAGE_SIZE : undefined,
    };
};

export const HomePage = () => {
    const [sortBy, setSortBy] = useState<SortOption>('newest');
    const { ref, inView } = useInView({ threshold: 0.5 });

    const {
        data,
        error,
        isLoading,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        // 4. UPDATE the query key for better cache separation
        queryKey: ['media', sortBy],
        queryFn: ({ pageParam }) => fetchMedia({ pageParam, sortBy }), // <-- Use renamed function
        initialPageParam: 0,
        getNextPageParam: (lastPage) => lastPage.nextPage,
    });

    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);


    // 5. RENAME the flattened array variable
    const allMedia = data?.pages.flatMap(page => page.media) || [];

    const handleSortChange = (newSortOption: SortOption) => {
        if (newSortOption !== sortBy) {
            setSortBy(newSortOption);
        }
    };

    const getSortButtonClass = (option: SortOption) => {
        const baseClass = "px-4 py-2 rounded-full font-semibold transition-all duration-300 text-sm sm:text-base shadow-sm";
        if (sortBy === option) {
            return `${baseClass} bg-brand-dark text-white scale-105`;
        }
        return `${baseClass} bg-white text-brand-text hover:bg-gray-200 border border-gray-200`;
    };

    return (
        <div className="space-y-12">
            <header className="text-center py-10 md:py-16 border-b border-gray-200/80">
                <h1 className="text-5xl md:text-6xl font-bold tracking-tight">The Graduation Gallery</h1>
                <p className="text-lg text-brand-text mt-4 max-w-2xl mx-auto">A shared space to discover, celebrate, and cherish the moments from a milestone achievement.</p>
            </header>

            <main className="space-y-8">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                     <h2 className="text-2xl font-semibold">Explore Media</h2>
                     <div className="flex items-center justify-center gap-2 p-1 bg-gray-100 rounded-full">
                        <button onClick={() => handleSortChange('newest')} className={getSortButtonClass('newest')}>Most Recent</button>
                        <button onClick={() => handleSortChange('popular')} className={getSortButtonClass('popular')}>Most Popular</button>
                        <button onClick={() => handleSortChange('featured')} className={getSortButtonClass('featured')}>Featured</button>
                    </div>
                </div>

                <div>
                    {isLoading && <SkeletonLoader count={12} />}
                    {error && <div className="text-center text-red-500 py-10 bg-red-50 rounded-lg">Error: {error.message}</div>}
                    {!isLoading && !error && allMedia.length === 0 && (
                         <div className="text-center text-gray-500 py-20 bg-white rounded-lg border-2 border-dashed">
                             <Camera size={48} className="mx-auto text-gray-300" />
                            <h3 className="text-2xl font-semibold mt-4">A Blank Canvas</h3>
                            <p className="mt-2">This gallery is waiting for its first masterpiece. Be the first to upload!</p>
                        </div>
                    )}
                    {/* 6. USE the renamed variable here */}
                    {allMedia.length > 0 && <MediaGrid mediaItems={allMedia} />}
                </div>

                <div className="flex justify-center mt-12 h-10">
                    <div ref={ref}>
                        {isFetchingNextPage && (
                            <div className="flex items-center gap-2 text-gray-500">
                                <Loader2 className="animate-spin" size={20} />
                                <span>Loading more memories...</span>
                            </div>
                        )}
                    </div>

                    {!hasNextPage && !isLoading && !isFetchingNextPage && allMedia.length > 0 && (
                        <p className="text-gray-500 font-serif text-lg">You've reached the end of the gallery.</p>
                    )}
                </div>
            </main>
        </div>
    );
};