import { useState, type FormEvent, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { KeyRound } from 'lucide-react';
import apiService from '../api/apiService';
import { PageHelmet } from "../components/layout/PageHelmet.tsx";

interface ResetPasswordPayload {
    token: string;
    new_password: string;
}

const resetPasswordRequest = (payload: ResetPasswordPayload) => {
    return apiService.post('/auth/reset-password', payload);
};

export const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        if (!token) {
            toast.error("No reset token found. Please request a new link.", { duration: 6000 });
            navigate('/forgot-password');
        }
    }, [token, navigate]);

    const mutation = useMutation({
        mutationFn: resetPasswordRequest,
        onSuccess: () => {
            toast.success("Password reset successfully! Please log in with your new password.", { duration: 6000 });
            navigate('/login');
        },
        onError: (error: any) => {
            const errorMsg = error.response?.data?.detail || "An error occurred. The link may be invalid or expired.";
            toast.error(errorMsg, { duration: 6000 });
        }
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match.");
            return;
        }
        if (!token) {
             toast.error("Invalid state. No token available.");
             return;
        }
        mutation.mutate({ token, new_password: newPassword });
    };

    return (
        <>
            <PageHelmet title="Reset Your Password" />
            <div className="min-h-screen flex items-center justify-center bg-brand-light p-4">
                <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
                    <h2 className="text-3xl font-bold font-serif text-brand-dark text-center">Set a New Password</h2>
                    <p className="text-brand-text text-center mt-2 mb-8">
                        Your new password must be different from previous passwords.
                    </p>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="new_password" className="text-sm font-semibold text-brand-text block mb-1">New Password</label>
                            <input
                                id="new_password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent"
                            />
                        </div>
                         <div>
                            <label htmlFor="confirm_password" className="text-sm font-semibold text-brand-text block mb-1">Confirm New Password</label>
                            <input
                                id="confirm_password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent"
                            />
                        </div>
                        <div>
                            <button
                                type="submit"
                                disabled={mutation.isPending || !token}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-brand-dark hover:bg-black text-white font-semibold rounded-md transition-colors shadow-md disabled:bg-opacity-50"
                            >
                                {mutation.isPending ? 'Saving...' : <><KeyRound size={18} /><span>Reset Password</span></>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default ResetPasswordPage;