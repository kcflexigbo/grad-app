import { useQuery } from '@tanstack/react-query';
import apiService from '../api/apiService';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import type { Report } from '../types/report';
import { ReportsTable } from '../components/admin/ReportsTable';
import { BookOpen } from 'lucide-react';

// API response type for paginated reports
interface PaginatedReportsResponse {
    reports: Report[];
    total_count: number;
}

// Fetch only pending reports for the dashboard
const fetchPendingReports = async (): Promise<PaginatedReportsResponse> => {
    const { data } = await apiService.get('/admin/reports', {
        params: { status: 'pending', limit: 100 } // Fetch up to 100 pending reports for the dashboard
    });
    return data;
};

export const AdminDashboardPage = () => {
    const { user } = useAuth();

    // The query key should be specific to pending reports
    const { data, isLoading } = useQuery({
        queryKey: ['admin_reports', 'pending'],
        queryFn: fetchPendingReports,
        enabled: !!user?.is_admin,
    });

    if (!user?.is_admin) {
        return <div className="text-center py-20 text-red-600 font-bold text-2xl">Access Denied. You are not an administrator.</div>;
    }

    const pendingReports = data?.reports || [];

    return (
        <div className="space-y-8">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold font-serif">Admin Dashboard</h1>
                    <p className="text-lg text-gray-600 mt-2">Manage pending user-submitted reports.</p>
                </div>
                <Link
                    to="/admin/reports/history"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700"
                >
                    <BookOpen size={18} />
                    View Report History
                </Link>
            </header>
            <div className="bg-white p-4 border rounded-lg shadow-sm">
                <ReportsTable reports={pendingReports} isLoading={isLoading} />
            </div>
        </div>
    );
};

export default AdminDashboardPage;