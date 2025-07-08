import { useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft } from 'lucide-react';
import apiService from '../api/apiService';
import { PageHelmet } from "../components/layout/PageHelmet.tsx";

const forgotPasswordRequest = (email: string) => {
    return apiService.post('/auth/forgot-password', { email });
};

export const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');

    const mutation = useMutation({
        mutationFn: forgotPasswordRequest,
        onSuccess: (data) => {
            toast.success(data.data.message, { duration: 8000 });
        },
        onError: (error: any) => {
            const errorMsg = error.response?.data?.detail || "An error occurred.";
            toast.error(errorMsg);
        }
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        mutation.mutate(email);
    };

    return (
        <>
            <PageHelmet title="Forgot Password" />
            <div className="min-h-screen flex items-center justify-center bg-brand-light p-4">
                <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
                    <h2 className="text-3xl font-bold font-serif text-brand-dark text-center">Forgot Your Password?</h2>
                    <p className="text-brand-text text-center mt-2 mb-8">
                        No problem. Enter your email and we'll send you a reset link.
                    </p>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="text-sm font-semibold text-brand-text block mb-1">Email Address</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="you@example.com"
                                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent"
                            />
                        </div>
                        <div>
                            <button
                                type="submit"
                                disabled={mutation.isPending}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-brand-accent hover:bg-brand-accent-hover text-white font-semibold rounded-md transition-colors shadow-md disabled:bg-opacity-50"
                            >
                                {mutation.isPending ? 'Sending...' : <><Mail size={18} /><span>Send Reset Link</span></>}
                            </button>
                        </div>
                    </form>
                    <div className="mt-6 text-center">
                        <Link to="/login" className="text-sm font-semibold text-brand-accent hover:underline flex items-center justify-center gap-1">
                            <ArrowLeft size={14} /> Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ForgotPasswordPage;