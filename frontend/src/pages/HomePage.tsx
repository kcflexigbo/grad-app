import { useState, useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { ImageGrid } from '../components/ImageGrid';
import { SkeletonLoader } from '../components/ui/SkeletonLoader';
import apiService from '../api/apiService';
import type {Image} from '../types/image';
import { Loader2 } from 'lucide-react';

type SortOption = 'newest' | 'popular' | 'featured';
const PAGE_SIZE = 12;

const fetchImages = async ({ pageParam = 0, sortBy }: { pageParam?: number, sortBy: SortOption }) => {
    const { data } = await apiService.get<Image[]>('/images', {
        params: {
            sort_by: sortBy,
            skip: pageParam,
            limit: PAGE_SIZE,
        },
    });
    return {
        images: data,
        nextPage: data.length === PAGE_SIZE ? pageParam + PAGE_SIZE : undefined,
    };
};

export const HomePage = () => {
    const [sortBy, setSortBy] = useState<SortOption>('newest');

    // --- INFINITE SCROLL SETUP ---
    // 1. Get the ref and inView state from the hook
    const { ref, inView } = useInView({
        threshold: 0.5, // Trigger when 50% of the loader is visible
    });

    const {
        data,
        error,
        isLoading,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ['images', sortBy],
        queryFn: ({ pageParam }) => fetchImages({ pageParam, sortBy }),
        initialPageParam: 0,
        getNextPageParam: (lastPage) => lastPage.nextPage,
    });

    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);


    const allImages = data?.pages.flatMap(page => page.images) || [];

    const handleSortChange = (newSortOption: SortOption) => {
        if (newSortOption !== sortBy) {
            setSortBy(newSortOption);
        }
    };

    const getSortButtonClass = (option: SortOption) => {
        const baseClass = "px-4 py-2 rounded-md font-medium transition-colors text-sm sm:text-base";
        if (sortBy === option) {
            return `${baseClass} bg-blue-600 text-white shadow`;
        }
        return `${baseClass} bg-white text-gray-700 hover:bg-gray-100 border`;
    };

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-4xl font-bold font-serif text-gray-800 tracking-tight">The Gallery</h1>
                <p className="text-lg text-gray-600 mt-2">Discover photos from the recent graduation celebration.</p>
            </header>

            <div className="flex items-center gap-3">
                <button onClick={() => handleSortChange('newest')} className={getSortButtonClass('newest')}>
                    Most Recent
                </button>
                <button onClick={() => handleSortChange('popular')} className={getSortButtonClass('popular')}>
                    Most Popular
                </button>
                <button onClick={() => handleSortChange('featured')} className={getSortButtonClass('featured')}>
                    Featured
                </button>
            </div>

            <div>
                {isLoading && <SkeletonLoader count={12} />}
                {error && <div className="text-center text-red-500 py-10 bg-red-50 rounded-lg">Error: {error.message}</div>}
                {!isLoading && !error && allImages.length === 0 && (
                     <div className="text-center text-gray-500 py-10 bg-gray-50 rounded-lg">
                        <h3 className="text-xl font-semibold">It's a bit empty here...</h3>
                        <p>No images found for this category. Be the first to upload!</p>
                    </div>
                )}
                {allImages.length > 0 && <ImageGrid images={allImages} />}
            </div>

            <div className="flex justify-center mt-12 h-10">
                <div ref={ref}>
                    {isFetchingNextPage && (
                        <div className="flex items-center gap-2 text-gray-500">
                            <Loader2 className="animate-spin" size={20} />
                            <span>Loading more...</span>
                        </div>
                    )}
                </div>

                {!hasNextPage && !isLoading && !isFetchingNextPage && allImages.length > 0 && (
                    <p className="text-gray-500">You've reached the end of the gallery!</p>
                )}
            </div>
        </div>
    );
};