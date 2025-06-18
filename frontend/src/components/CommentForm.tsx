import { useState, FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import apiService from '../api/apiService';
import { Comment } from '../types/comment'; // Assuming you create this type

interface CommentFormProps {
    imageId: number;
    onCommentPosted: (newComment: Comment) => void;
}

export const CommentForm = ({ imageId, onCommentPosted }: CommentFormProps) => {
    const { user, isLoggedIn } = useAuth();
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isLoggedIn) {
        return <p className="text-sm text-gray-500">Please log in to post a comment.</p>;
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        setIsSubmitting(true);
        try {
            const response = await apiService.post<Comment>(`/images/${imageId}/comments`, { content });
            onCommentPosted(response.data); // Notify parent component
            setContent(''); // Clear the form
        } catch (error) {
            console.error('Failed to post comment:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex items-start gap-3 mt-4">
            <img
                src={user?.profile_picture_url || 'https://via.placeholder.com/40'}
                alt="Your profile"
                className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-grow">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Add a comment..."
                    rows={2}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                />
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                >
                    {isSubmitting ? 'Posting...' : 'Post Comment'}
                </button>
            </div>
        </form>
    );
};