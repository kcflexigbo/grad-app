import { useState, type FormEvent } from 'react';
import { SendHorizonal } from 'lucide-react';

interface MessageInputProps {
    onSendMessage: (content: string) => void;
    isSending: boolean;
}

export const MessageInput = ({ onSendMessage, isSending }: MessageInputProps) => {
    const [content, setContent] = useState('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const trimmedContent = content.trim();
        if (trimmedContent) {
            onSendMessage(trimmedContent);
            setContent('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 bg-white border-t flex items-center gap-3">
            <input
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type a message..."
                className="w-full px-4 py-2 border border-gray-300 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoComplete="off"
            />
            <button
                type="submit"
                disabled={!content.trim() || isSending}
                className="p-3 bg-blue-500 text-white rounded-full transition-colors hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
                <SendHorizonal size={20} />
            </button>
        </form>
    );
};