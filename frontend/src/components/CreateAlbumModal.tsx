import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { X, Loader2 } from 'lucide-react';
import apiService from '../api/apiService';

interface CreateAlbumModalProps {
    isOpen: boolean;
    onClose: () => void;
    username: string;
}

export const CreateAlbumModal = ({ isOpen, onClose, username }: CreateAlbumModalProps) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const queryClient = useQueryClient();

    const createAlbumMutation = useMutation({
        mutationFn: () => apiService.post('/albums', { name, description }),
        onSuccess: () => {
            toast.success("Album created successfully!");
            queryClient.invalidateQueries({ queryKey: ['profile', username] });
            onClose(); // Close the modal
        },
        onError: () => {
            toast.error("Failed to create album.");
        }
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error("Album name is required.");
            return;
        }
        createAlbumMutation.mutate();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold font-serif">Create New Album</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label htmlFor="album-name" className="block text-sm font-medium text-gray-700">Album Name</label>
                        <input
                            id="album-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="album-description" className="block text-sm font-medium text-gray-700">Description (Optional)</label>
                        <textarea
                            id="album-description"
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex justify-end items-center gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={createAlbumMutation.isPending}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 disabled:bg-blue-300"
                        >
                            {createAlbumMutation.isPending && <Loader2 className="animate-spin" size={18} />}
                            {createAlbumMutation.isPending ? 'Creating...' : 'Create Album'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};