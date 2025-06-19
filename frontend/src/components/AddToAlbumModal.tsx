import { useState, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { X, Loader2 } from 'lucide-react';
import apiService from '../api/apiService';
import type { Album } from '../types/album';

interface AddToAlbumModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageId: number;
}

// Fetch the user's own albums to populate the selection list
const fetchMyAlbums = async (): Promise<Album[]> => {
    const { data } = await apiService.get('/users/me/albums');
    return data;
};

export const AddToAlbumModal = ({ isOpen, onClose, imageId }: AddToAlbumModalProps) => {
    const [selectedAlbumId, setSelectedAlbumId] = useState<string>('');
    const queryClient = useQueryClient();

    const { data: albums, isLoading: isLoadingAlbums } = useQuery({
        queryKey: ['myAlbums'],
        queryFn: fetchMyAlbums,
        enabled: isOpen, // Only fetch when the modal is open
    });

    const addToAlbumMutation = useMutation({
        mutationFn: async (albumId: number) => {
            const response = await apiService.post(`/albums/${albumId}/images/${imageId}`);
            return response.data; // Assuming API returns updated Album object here
        },
        onSuccess: (data: Album) => {
            toast.success(`Photo added to "${data.name}"!`);
            queryClient.invalidateQueries({ queryKey: ['album', data.id] });
            onClose();
        },
        onError: () => {
            toast.error("Failed to add photo to album. It might already be in it.");
        }
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!selectedAlbumId) {
            toast.error("Please select an album.");
            return;
        }
        addToAlbumMutation.mutate(parseInt(selectedAlbumId, 10));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold font-serif">Add to Album</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {isLoadingAlbums ? <p>Loading your albums...</p> : (
                        <div>
                            <label htmlFor="album-select" className="block text-sm font-medium text-gray-700">Choose an album</label>
                            <select
                                id="album-select"
                                value={selectedAlbumId}
                                onChange={(e) => setSelectedAlbumId(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                required
                            >
                                <option value="" disabled>Select...</option>
                                {albums?.map(album => (
                                    <option key={album.id} value={album.id}>{album.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="flex justify-end items-center gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                        <button type="submit" disabled={addToAlbumMutation.isPending || isLoadingAlbums} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 disabled:bg-blue-300">
                            {addToAlbumMutation.isPending && <Loader2 className="animate-spin" size={18} />}
                            Add to Album
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};