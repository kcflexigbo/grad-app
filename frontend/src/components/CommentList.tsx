import { Link } from 'react-router-dom';
import type { Comment } from '../types/comments';
import type { User } from '../types/user';
import { X, Flag } from 'lucide-react';

interface CommentListProps {
    comments: Comment[];
    currentUser: User | null;
    onDeleteComment: (commentId: number) => void;
    onReportComment: (commentId: number) => void;
}

export const CommentList = ({ comments, currentUser, onDeleteComment, onReportComment }: CommentListProps) => {
    if (!comments || comments.length === 0) {
        return <p className="text-sm text-gray-500 mt-4">No comments yet.</p>;
    }

    const handleDelete = (commentId: number) => {
        if (window.confirm('Are you sure you want to delete this comment?')) {
            onDeleteComment(commentId);
        }
    }

    return (
        <div className="space-y-4 mt-6">
            {comments.map((comment) => {
                const isAuthor = currentUser?.id === comment.author.id;
                const canDelete = currentUser && (isAuthor || currentUser.is_admin);
                const canReport = currentUser && !isAuthor;

                return (
                    <div key={comment.id} className="flex items-start gap-3 group">
                        <Link to={`/profile/${comment.author.username}`}>
                            <img
                                src={comment.author.profile_picture_url || 'https://via.placeholder.com/40'}
                                alt={comment.author.username}
                                className="w-10 h-10 rounded-full object-cover"
                            />
                        </Link>
                        <div className="flex-grow bg-gray-100 p-3 rounded-lg">
                            <p>
                                <Link to={`/profile/${comment.author.username}`} className="font-bold text-sm text-gray-800 mr-2">
                                    {comment.author.username}
                                </Link>
                                <span className="text-gray-700">{comment.content}</span>
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {new Date(comment.created_at).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity">
                            {canDelete && (
                                <button
                                    onClick={() => handleDelete(comment.id)}
                                    className="p-1 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600"
                                    title="Delete comment"
                                >
                                    <X size={16} />
                                </button>
                            )}
                            {canReport && (
                                <button
                                     onClick={() => onReportComment(comment.id)}
                                     className="p-1 rounded-full text-gray-400 hover:bg-yellow-100 hover:text-yellow-600"
                                     title="Report comment"
                                >
                                    <Flag size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};