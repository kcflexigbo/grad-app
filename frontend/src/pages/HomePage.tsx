import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { ImageGrid } from '../components/ImageGrid';
import { SkeletonLoader } from '../components/ui/SkeletonLoader';
import apiService from '../api/apiService';
import type {Image} from '../types/image';
import { Loader2 } from 'lucide-react';

// Define the possible sorting options
type SortOption = 'newest' | 'popular' | 'featured';
const PAGE_SIZE = 12; // How many images to fetch per "page"

/**
 * The data-fetching function. It's designed to work with `useInfiniteQuery`.
 * @param pageParam - The offset for the next page, provided by TanStack Query.
 * @param sortBy - The current sort option.
 * @returns An object containing the fetched images and the next page's offset.
 */
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
        // Calculate the next page's offset. If we received fewer images than we asked for,
        // it means we've reached the end, so we return `undefined`.
        nextPage: data.length === PAGE_SIZE ? pageParam + PAGE_SIZE : undefined,
    };
};

export const HomePage = () => {
    const [sortBy, setSortBy] = useState<SortOption>('newest');

    const {
        data,
        error,
        isLoading,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        // The queryKey is crucial. It includes `sortBy` so that if the sort option
        // changes, TanStack Query will automatically refetch with a new query.
        queryKey: ['images', sortBy],

        // The query function now receives an object with the pageParam.
        queryFn: ({ pageParam }) => fetchImages({ pageParam, sortBy }),

        // Defines the initial page parameter for the very first fetch.
        initialPageParam: 0,

        // This function tells TanStack Query how to get the `pageParam` for the next page.
        // It receives the last successfully fetched page and returns the `nextPage` value we calculated.
        getNextPageParam: (lastPage) => lastPage.nextPage,
    });

    // We need to flatten the `pages` array from the `data` object into a single array of images.
    const allImages = data?.pages.flatMap(page => page.images) || [];

    const handleSortChange = (newSortOption: SortOption) => {
        if (newSortOption !== sortBy) {
            setSortBy(newSortOption);
            // TanStack Query will automatically handle the refetch because the queryKey changes.
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
            {/* Page Header */}
            <header>
                <h1 className="text-4xl font-bold font-serif text-gray-800 tracking-tight">The Gallery</h1>
                <p className="text-lg text-gray-600 mt-2">Discover photos from the recent graduation celebration.</p>
            </header>

            {/* Sorting Controls */}
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

            {/* Main Content Area */}
            <div>
                {isLoading && <SkeletonLoader count={12} />}

                {error && (
                    <div className="text-center text-red-500 py-10 bg-red-50 rounded-lg">
                        Error: {error.message}
                    </div>
                )}

                {!isLoading && !error && allImages.length === 0 && (
                     <div className="text-center text-gray-500 py-10 bg-gray-50 rounded-lg">
                        <h3 className="text-xl font-semibold">It's a bit empty here...</h3>
                        <p>No images found for this category. Be the first to upload!</p>
                    </div>
                )}

                {allImages.length > 0 && <ImageGrid images={allImages} />}
            </div>

            {/* Load More Button Section */}
            <div className="flex justify-center mt-12">
                {hasNextPage && (
                    <button
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className="inline-flex items-center gap-2 bg-blue-600 text-white font-bold py-2 px-6 rounded-md hover:bg-blue-700 transition-transform transform hover:scale-105 disabled:bg-blue-400 disabled:scale-100"
                    >
                        {isFetchingNextPage ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                <span>Loading...</span>
                            </>
                        ) : (
                            <span>Load More</span>
                        )}
                    </button>
                )}

                {!hasNextPage && !isLoading && allImages.length > 0 && (
                    <p className="text-gray-500">You've reached the end of the gallery!</p>
                )}
            </div>
        </div>
    );
};