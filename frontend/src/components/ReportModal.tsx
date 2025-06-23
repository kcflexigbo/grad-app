import { useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { X, Loader2, Flag } from 'lucide-react';
import apiService from '../api/apiService';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    reportedMediaId?: number;
    reportedCommentId?: number;
}

interface ReportPayload {
    reported_media_id?: number;
    reported_comment_id?: number;
    reason: string;
}

export const ReportModal = ({ isOpen, onClose, reportedMediaId, reportedCommentId }: ReportModalProps) => {
    const [reason, setReason] = useState('');

    const reportMutation = useMutation({
        mutationFn: (payload: ReportPayload) => apiService.post('/reports', payload),
        onSuccess: () => {
            toast.success("Report submitted successfully. Our moderators will review it shortly.");
            handleClose();
        },
        onError: (err: any) => {
            const errorMsg = err.response?.data?.detail || "Failed to submit report.";
            toast.error(errorMsg);
        }
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!reason.trim()) {
            toast.error("Please provide a reason for the report.");
            return;
        }

        const payload: ReportPayload = { reason };
        if (reportedMediaId) {
            payload.reported_media_id = reportedMediaId;
        } else if (reportedCommentId) {
            payload.reported_comment_id = reportedCommentId;
        } else {
            toast.error("No content specified for reporting.");
            return;
        }

        reportMutation.mutate(payload);
    };

    const handleClose = () => {
        setReason('');
        onClose();
    };

    if (!isOpen) return null;

    const reportingWhat = reportedMediaId ? 'this media' : 'this comment';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold font-serif flex items-center gap-2">
                        <Flag className="text-red-500" />
                        Report Content
                    </h2>
                    <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-200"><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label htmlFor="report-reason" className="block text-sm font-medium text-gray-700">
                            Please explain why you are reporting {reportingWhat}.
                        </label>
                        <textarea
                            id="report-reason"
                            rows={4}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="e.g., It's spam, harassment, or inappropriate content."
                            required
                        />
                    </div>
                    <div className="flex justify-end items-center gap-4 pt-4">
                        <button type="button" onClick={handleClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={reportMutation.isPending}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 disabled:bg-red-300"
                        >
                            {reportMutation.isPending && <Loader2 className="animate-spin" size={18} />}
                            Submit Report
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};