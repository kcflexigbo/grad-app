import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiService from '../api/apiService';
import { ImageGrid } from '../components/ImageGrid';
import { SkeletonLoader } from '../components/ui/SkeletonLoader';
import type { Album as AlbumType } from '../types/album'; // You will need to create this type

const fetchAlbum = async (albumId: string): Promise<AlbumType> => {
    const { data } = await apiService.get(`/albums/${albumId}`);
    return data;
};

export const AlbumDetailPage = () => {
    const { id } = useParams<{ id: string }>();

    const { data: album, isLoading, isError } = useQuery({
        queryKey: ['album', id],
        queryFn: () => fetchAlbum(id!),
        enabled: !!id,
    });

    if (isLoading) {
        return (
            <div className="space-y-8">
                <div className="w-3/4 h-12 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-1/2 h-6 bg-gray-200 rounded animate-pulse"></div>
                <hr />
                <SkeletonLoader count={9} />
            </div>
        );
    }

    if (isError || !album) {
        return <div className="text-center text-red-500 py-10">Error: Album not found.</div>;
    }

    return (
        <div className="space-y-8">
            <header className="border-b pb-6">
                <h1 className="text-4xl font-bold font-serif text-gray-800">{album.name}</h1>
                <p className="text-lg text-gray-600 mt-2">{album.description}</p>
                <div className="text-sm text-gray-500 mt-4">
                    Created by <Link to={`/profile/${album.owner.username}`} className="font-semibold hover:underline">{album.owner.username}</Link>
                </div>
            </header>

            <main>
                {album.images.length > 0 ? (
                    <ImageGrid images={album.images} />
                ) : (
                    <div className="text-center text-gray-500 py-20 bg-gray-50 rounded-lg">
                        <h3 className="text-2xl font-semibold">This album is empty.</h3>
                        <p className="mt-2">The owner can add photos to this album.</p>
                    </div>
                )}
            </main>
        </div>
    );
};