import { Link } from 'react-router-dom';
import { Comment } from '../types/comment';

interface CommentListProps {
    comments: Comment[];
}

export const CommentList = ({ comments }: CommentListProps) => {
    if (!comments || comments.length === 0) {
        return <p className="text-sm text-gray-500 mt-4">No comments yet.</p>;
    }

    return (
        <div className="space-y-4 mt-6">
            {comments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-3">
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
                </div>
            ))}
        </div>
    );
};