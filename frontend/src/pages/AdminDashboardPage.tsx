import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '../api/apiService';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import type { Report } from '../types/report'; // You will need to create this type

const fetchReports = async (): Promise<Report[]> => {
    const { data } = await apiService.get('/admin/reports');
    return data;
};

export const AdminDashboardPage = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data: reports, isLoading } = useQuery({
        queryKey: ['admin_reports'],
        queryFn: fetchReports,
        enabled: !!user?.is_admin,
    });

    const updateReportStatusMutation = useMutation({
        mutationFn: ({ reportId, status }: { reportId: number, status: string }) =>
            apiService.put(`/admin/reports/${reportId}`, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin_reports'] });
        },
    });

    const deleteContentMutation = useMutation({
        mutationFn: ({ type, id }: { type: 'image' | 'comment', id: number }) => {
            const url = type === 'image' ? `/admin/images/${id}` : `/admin/comments/${id}`;
            return apiService.delete(url);
        },
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['admin_reports'] });
             alert('Content deleted successfully.');
        }
    });

    if (!user?.is_admin) {
        return <div className="text-center py-20 text-red-600 font-bold text-2xl">Access Denied. You are not an administrator.</div>;
    }

    if (isLoading) return <div>Loading reports...</div>;

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

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-4xl font-bold font-serif">Admin Dashboard</h1>
                <p className="text-lg text-gray-600 mt-2">Manage user-submitted reports.</p>
            </header>
            <div className="bg-white p-4 border rounded-lg shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reported Content</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reporter</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {reports?.map(report => (
                            <tr key={report.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <Link
                                        to={report.reported_image_id ? `/photo/${report.reported_image_id}` : '#'}
                                        className="text-blue-600 hover:underline"
                                    >
                                        {report.reported_image_id ? `Image #${report.reported_image_id}` : `Comment #${report.reported_comment_id}`}
                                    </Link>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-700">{report.reason}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <Link to={`/profile/${report.reporter.username}`} className="text-blue-600 hover:underline">
                                        {report.reporter.username}
                                    </Link>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">{report.status}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                    {report.status === 'pending' && (
                                        <>
                                            <button onClick={() => handleAction(report.id, 'resolved')} className="text-green-600 hover:text-green-900">Resolve</button>
                                            <button onClick={() => handleAction(report.id, 'dismissed')} className="text-yellow-600 hover:text-yellow-900">Dismiss</button>
                                            <button onClick={() => handleDelete(report)} className="text-red-600 hover:text-red-900">Delete Content</button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};