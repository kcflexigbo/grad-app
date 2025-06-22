import { Link } from 'react-router-dom';
import type { Report } from '../../types/report';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '../../api/apiService';
import toast from 'react-hot-toast';

interface ReportsTableProps {
    reports: Report[];
    isLoading: boolean;
    showActions?: boolean; // To conditionally show action buttons
}

export const ReportsTable = ({ reports, isLoading, showActions = true }: ReportsTableProps) => {
    const queryClient = useQueryClient();

    const updateReportStatusMutation = useMutation({
        mutationFn: ({ reportId, status }: { reportId: number, status: string }) =>
            apiService.put(`/admin/reports/${reportId}`, { status }),
        onSuccess: () => {
            toast.success("Report status updated.");
            queryClient.invalidateQueries({ queryKey: ['admin_reports'] });
        },
        onError: () => {
            toast.error("Failed to update report status.");
        }
    });

    const deleteContentMutation = useMutation({
        mutationFn: ({ type, id }: { type: 'image' | 'comment', id: number }) => {
            const url = type === 'image' ? `/admin/images/${id}` : `/admin/comments/${id}`;
            return apiService.delete(url);
        },
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['admin_reports'] });
             toast.success('Content deleted successfully.');
        },
        onError: () => {
            toast.error("Failed to delete content.");
        }
    });

    const handleAction = (reportId: number, status: 'resolved' | 'dismissed') => {
        updateReportStatusMutation.mutate({ reportId, status });
    };

    const handleDelete = (report: Report) => {
        if (window.confirm('Are you sure you want to permanently delete this content? This cannot be undone.')) {
            const type = report.reported_image_id ? 'image' : 'comment';
            const id = report.reported_image_id || report.reported_comment_id;
            if (id) {
                deleteContentMutation.mutate({ type, id });
            }
        }
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'resolved': return 'bg-green-100 text-green-800';
            case 'dismissed': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-2">
                {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse" />)}
            </div>
        );
    }

    if (!reports || reports.length === 0) {
        return <p className="text-center py-10 text-gray-500">No reports match the current criteria.</p>
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reported Content</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reporter</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        {showActions && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {reports.map(report => (
                        <tr key={report.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <Link
                                    to={report.reported_image_id ? `/photo/${report.reported_image_id}` : '#'}
                                    className="text-blue-600 hover:underline"
                                >
                                    {report.reported_image_id ? `Image #${report.reported_image_id}` : `Comment #${report.reported_comment_id}`}
                                </Link>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate" title={report.reason ?? undefined}>{report.reason}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <Link to={`/profile/${report.reporter.username}`} className="text-blue-600 hover:underline">
                                    {report.reporter.username}
                                </Link>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(report.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(report.status)}`}>
                                    {report.status}
                                </span>
                            </td>
                            {showActions && (
                                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                    {report.status === 'pending' && (
                                        <>
                                            <button onClick={() => handleAction(report.id, 'resolved')} className="text-green-600 hover:text-green-900 font-medium">Resolve</button>
                                            <button onClick={() => handleAction(report.id, 'dismissed')} className="text-yellow-600 hover:text-yellow-900 font-medium">Dismiss</button>
                                            <button onClick={() => handleDelete(report)} className="text-red-600 hover:text-red-900 font-medium">Delete Content</button>
                                        </>
                                    )}
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};