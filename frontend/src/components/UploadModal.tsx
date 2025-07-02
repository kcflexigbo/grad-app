import { useState, type ChangeEvent, type FormEvent, useEffect, useId } from 'react';
import { X, UploadCloud, Loader2, Trash2 } from 'lucide-react';
import apiService from '../api/apiService';
import imageCompression from 'browser-image-compression';

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUploadSuccess: () => void;
}

interface FilePreview {
    id: string;
    file: File;
    previewUrl: string;
    isCompressing: boolean;
    compressedFile: File | null;
}

export const UploadModal = ({ isOpen, onClose, onUploadSuccess }: UploadModalProps) => {
    const [files, setFiles] = useState<FilePreview[]>([]);
    const [caption, setCaption] = useState('');
    const [tags, setTags] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const uniqueId = useId();

    useEffect(() => {
        // Revoke object URLs on unmount to prevent memory leaks
        return () => {
            files.forEach(fp => URL.revokeObjectURL(fp.previewUrl));
        };
    }, [files]);

    const handleClose = () => {
        setFiles([]);
        setCaption('');
        setTags('');
        setError(null);
        setIsUploading(false);
        onClose();
    };

    if (!isOpen) return null;

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            const newFilePreviews: FilePreview[] = newFiles.map(file => ({
                id: `${file.name}-${file.lastModified}`,
                file,
                previewUrl: URL.createObjectURL(file),
                isCompressing: file.type.startsWith('image/'), // Only compress media
                compressedFile: null
            }));

            setFiles(prev => [...prev, ...newFilePreviews]);

            // Start compression for new media
            newFilePreviews.forEach(fp => {
                if (fp.file.type.startsWith('image/')) {
                    compressImage(fp.id, fp.file);
                }
            });
        }
    };

    const compressImage = async (id: string, file: File) => {
        const options = { maxSizeMB: 2, maxWidthOrHeight: 1920, useWebWorker: true };
        try {
            const compressed = await imageCompression(file, options);
            setFiles(prev => prev.map(fp => fp.id === id ? { ...fp, compressedFile: compressed, isCompressing: false } : fp));
        } catch (error) {
            console.error("Compression failed:", error);
            // Handle error, maybe mark the file as failed
            setFiles(prev => prev.map(fp => fp.id === id ? { ...fp, isCompressing: false } : fp));
        }
    };

    const handleRemoveFile = (idToRemove: string) => {
        setFiles(prev => prev.filter(fp => fp.id !== idToRemove));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (files.length === 0) {
            setError('Please select at least one file.');
            return;
        }
        if (files.some(f => f.isCompressing)) {
            setError('Please wait for all media to finish processing.');
            return;
        }

        setIsUploading(true);
        setError(null);

        const formData = new FormData();
        files.forEach(fp => {
            // Use compressed file for media, original for videos
            const fileToUpload = fp.file.type.startsWith('image/') ? fp.compressedFile : fp.file;
            if (fileToUpload) {
                formData.append('files', fileToUpload, fp.file.name);
            }
        });
        formData.append('caption', caption);
        formData.append('tags', tags);

        try {
            await apiService.post('/media', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            onUploadSuccess();
            handleClose();
        } catch (err) {
            setError('Upload failed. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const isProcessing = files.some(f => f.isCompressing);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl relative max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold font-serif">Upload Media</h2>
                    <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-200"><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-4">
                    {/* File Previews */}
                    {files.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {files.map(fp => (
                                <div key={fp.id} className="relative group aspect-square bg-gray-100 rounded-md overflow-hidden">
                                    {fp.file.type.startsWith('video/') ? (
                                        <video src={fp.previewUrl} className="w-full h-full object-cover" />
                                    ) : (
                                        <img src={fp.previewUrl} alt="preview" className="w-full h-full object-cover" />
                                    )}
                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button type="button" onClick={() => handleRemoveFile(fp.id)} className="p-2 bg-white/80 text-red-600 rounded-full hover:bg-red-100">
                                            <Trash2 size={18}/>
                                        </button>
                                    </div>
                                    {fp.isCompressing && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="text-white animate-spin"/></div>}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* File Input Area */}
                    <div>
                        <label htmlFor={uniqueId} className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <UploadCloud className="w-10 h-10 mb-3 text-gray-400" />
                                <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                <p className="text-xs text-gray-500">Images and Videos</p>
                            </div>
                            <input id={uniqueId} type="file" className="hidden" multiple onChange={handleFileChange} accept="image/png, image/jpeg, video/mp4, video/quicktime" />
                        </label>
                    </div>

                    {/* Caption and Tags */}
                    <div>
                        <label htmlFor="caption" className="block text-sm font-medium text-gray-700">Caption (applied to all uploads)</label>
                        <textarea id="caption" rows={2} className="mt-1 block w-full" value={caption} onChange={(e) => setCaption(e.target.value)} />
                    </div>
                    <div>
                        <label htmlFor="tags" className="block text-sm font-medium text-gray-700">Tags (comma separated)</label>
                        <input type="text" id="tags" className="mt-1 block w-full" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g., graduation, party, sunset" />
                    </div>
                </form>

                <div className="px-6 py-4 bg-gray-50 border-t flex justify-end items-center space-x-4">
                    {error && <p className="text-sm text-red-600 mr-auto">{error}</p>}
                    <button
                        type="button" // Important for forms with multiple buttons
                        onClick={handleClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={isUploading || isProcessing || files.length === 0}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
                    >
                        {isUploading && <Loader2 size={18} className="animate-spin" />}
                        {isUploading ? 'Uploading...' : `Upload ${files.length} Item(s)`}
                    </button>
                </div>
            </div>
        </div>
    );
};