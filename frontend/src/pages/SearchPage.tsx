import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiService from '../api/apiService';
import { ImageGrid } from '../components/ImageGrid';
import { SkeletonLoader } from '../components/ui/SkeletonLoader';
import type { User } from '../types/user';
import type { Image } from '../types/image';

interface SearchResults {
    users: User[];
    photos: Image[];
}

const fetchSearchResults = async (query: string): Promise<SearchResults> => {
    const { data } = await apiService.get('/search', { params: { q: query } });
    return data;
};

export const SearchPage = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';

    const { data, isLoading, isError } = useQuery({
        queryKey: ['search', query],
        queryFn: () => fetchSearchResults(query),
        enabled: !!query, // Only run query if there's a search term
    });

    if (isLoading) {
        return (
            <div>
                <h1 className="text-3xl font-bold font-serif mb-6">Searching for "{query}"...</h1>
                <SkeletonLoader count={8} />
            </div>
        );
    }

    if (isError) {
        return <div className="text-red-500">Error fetching search results.</div>;
    }

    const noResults = !data || (data.users.length === 0 && data.photos.length === 0);

    return (
        <div className="space-y-12">
            <header>
                <h1 className="text-4xl font-bold font-serif text-gray-800">Search Results</h1>
                <p className="text-lg text-gray-600 mt-2">Showing results for: <span className="font-semibold">"{query}"</span></p>
            </header>

            {noResults ? (
                <div className="text-center text-gray-500 py-10 bg-gray-50 rounded-lg">
                    <h3 className="text-xl font-semibold">No results found.</h3>
                    <p>Try searching for something else.</p>
                </div>
            ) : (
                <div className="space-y-10">
                    {data.users.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-semibold mb-4">Users</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {data.users.map(user => (
                                    <Link key={user.id} to={`/profile/${user.username}`} className="flex items-center gap-3 p-3 bg-white border rounded-lg hover:shadow-md transition-shadow">
                                        <img src={user.profile_picture_url || 'https://via.placeholder.com/40'} alt={user.username} className="w-10 h-10 rounded-full" />
                                        <span className="font-semibold text-gray-800">{user.username}</span>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {data.photos.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-semibold mb-4">Photos</h2>
                            <ImageGrid images={data.photos} />
                        </section>
                    )}
                </div>
            )}
        </div>
    );
};