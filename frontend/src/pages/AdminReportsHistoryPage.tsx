import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import apiService from '../api/apiService';
import type { Report } from '../types/report';
import { ReportsTable } from '../components/admin/ReportsTable';
import { ArrowLeft } from 'lucide-react';

const PAGE_SIZE = 15;

type ReportStatusFilter = 'all' | 'pending' | 'resolved' | 'dismissed';

interface PaginatedReportsResponse {
    reports: Report[];
    total_count: number;
}

const fetchAllReports = async (status: ReportStatusFilter, page: number): Promise<PaginatedReportsResponse> => {
    const params: { limit: number, skip: number, status?: ReportStatusFilter } = {
        limit: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
    };
    if (status !== 'all') {
        params.status = status;
    }

    const { data } = await apiService.get('/admin/reports', { params });
    return data;
};

export const AdminReportsHistoryPage = () => {
    const { user } = useAuth();
    const [statusFilter, setStatusFilter] = useState<ReportStatusFilter>('all');
    const [currentPage, setCurrentPage] = useState(1);

    const { data, isLoading, isPlaceholderData } = useQuery({
        queryKey: ['admin_reports', statusFilter, currentPage],
        queryFn: () => fetchAllReports(statusFilter, currentPage),
        enabled: !!user?.is_admin,
        placeholderData: (previousData) => previousData,
    });

    if (!user?.is_admin) {
        return <div className="text-center py-20 text-red-600 font-bold text-2xl">Access Denied.</div>;
    }

    const totalPages = data ? Math.ceil(data.total_count / PAGE_SIZE) : 0;

    const getFilterButtonClass = (filter: ReportStatusFilter) => {
        const baseClass = "px-4 py-2 rounded-md font-semibold transition-colors";
        if (statusFilter === filter) {
            return `${baseClass} bg-blue-600 text-white`;
        }
        return `${baseClass} bg-white text-gray-700 hover:bg-gray-100 border`;
    };

    const handleFilterChange = (newFilter: ReportStatusFilter) => {
        setStatusFilter(newFilter);
        setCurrentPage(1); // Reset to first page on filter change
    };

    return (
        <div className="space-y-8">
            <header>
                 <Link to="/admin/dashboard" className="flex items-center gap-2 text-sm text-blue-600 hover:underline mb-4">
                    <ArrowLeft size={16} />
                    Back to Dashboard
                </Link>
                <h1 className="text-4xl font-bold font-serif">Report History</h1>
                <p className="text-lg text-gray-600 mt-2">Review all submitted reports and moderation actions.</p>
            </header>

            {/* Filter Controls */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <span className="font-semibold text-gray-700">Filter by status:</span>
                <div className="flex gap-2">
                    {/* --- FIXED: Corrected function names --- */}
                    <button onClick={() => handleFilterChange('all')} className={getFilterButtonClass('all')}>All</button>
                    <button onClick={() => handleFilterChange('pending')} className={getFilterButtonClass('pending')}>Pending</button>
                    <button onClick={() => handleFilterChange('resolved')} className={getFilterButtonClass('resolved')}>Resolved</button>
                    <button onClick={() => handleFilterChange('dismissed')} className={getFilterButtonClass('dismissed')}>Dismissed</button>
                </div>
            </div>

            <div className={`bg-white p-4 border rounded-lg shadow-sm transition-opacity duration-300 ${isPlaceholderData ? 'opacity-50' : 'opacity-100'}`}>
                <ReportsTable reports={data?.reports || []} isLoading={isLoading} />
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-between items-center mt-6">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1 || isLoading}
                        className="px-4 py-2 bg-white border rounded-md disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-gray-700">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages || isLoading}
                        className="px-4 py-2 bg-white border rounded-md disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};