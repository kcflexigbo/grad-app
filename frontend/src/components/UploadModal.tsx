import { useState, type ChangeEvent, type FormEvent, useEffect } from 'react';
import { X, UploadCloud, Loader2 } from 'lucide-react';
import apiService from '../api/apiService';

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUploadSuccess: () => void; // To refresh the gallery after upload
}

export const UploadModal = ({ isOpen, onClose, onUploadSuccess }: UploadModalProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [caption, setCaption] = useState('');
    const [tags, setTags] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Effect to create a preview URL when a file is selected
    useEffect(() => {
        if (!file) {
            setPreviewUrl(null);
            return;
        }
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);

        // Cleanup function to revoke the object URL to prevent memory leaks
        return () => URL.revokeObjectURL(objectUrl);
    }, [file]);

    if (!isOpen) return null;

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!file) {
            setError('Please select an image to upload.');
            return;
        }

        setIsUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('caption', caption);
        // Assuming your backend expects a comma-separated string for tags
        formData.append('tags', tags);

        try {
            await apiService.post('/images', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            onUploadSuccess();
            onClose();
        } catch (err) {
            setError('Upload failed. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold font-serif">Upload a Photo</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* File Input and Preview */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Image File</label>
                        {previewUrl ? (
                            <div className="text-center">
                                <img src={previewUrl} alt="Image preview" className="max-h-64 mx-auto rounded-md" />
                                <button type="button" onClick={() => setFile(null)} className="mt-2 text-sm text-red-600 hover:underline">
                                    Remove Image
                                </button>
                            </div>
                        ) : (
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                                <div className="space-y-1 text-center">
                                    <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                                    <div className="flex text-sm text-gray-600">
                                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                                            <span>Upload a file</span>
                                            <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/png, image/jpeg" />
                                        </label>
                                        <p className="pl-1">or drag and drop</p>
                                    </div>
                                    <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Caption */}
                    <div>
                        <label htmlFor="caption" className="block text-sm font-medium text-gray-700">Caption</label>
                        <textarea
                            id="caption"
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                        />
                    </div>

                    {/* Tags */}
                    <div>
                        <label htmlFor="tags" className="block text-sm font-medium text-gray-700">Tags (comma separated)</label>
                        <input
                            type="text"
                            id="tags"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            placeholder="e.g., graduation, party, sunset"
                        />
                    </div>
                </form>

                {/* Footer with Actions */}
                <div className="px-6 py-4 bg-gray-50 border-t flex justify-end items-center space-x-4">
                    {error && <p className="text-sm text-red-600 mr-auto">{error}</p>}
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                        Cancel
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={isUploading}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 disabled:bg-blue-300"
                    >
                        {isUploading && <Loader2 className="animate-spin" size={18} />}
                        {isUploading ? 'Uploading...' : 'Upload Photo'}
                    </button>
                </div>
            </div>
        </div>
    );
};