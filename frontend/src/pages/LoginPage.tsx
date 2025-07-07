import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import apiService from '../api/apiService';
import { LogIn } from 'lucide-react';
import {PageHelmet} from "../components/layout/PageHelmet.tsx";

export const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const { login } = useAuth();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);

            const response = await apiService.post('/auth/token', formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });
            login(response.data.access_token);
        } catch (err: any) {
            if (err.response && err.response.data && err.response.data.detail) {
                setError(err.response.data.detail);
            } else {
                setError('An unknown error occurred during login.');
            }
        }
    };

    return (
        <>
            <PageHelmet title={"Login Now"} />
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="w-full max-w-4xl flex flex-row rounded-xl shadow-2xl overflow-hidden">

                    {/* Left Side: Media & Branding */}
                    <div className="hidden md:block w-1/2 relative">
                        <img
                            src="/login_page.jpg?q=80&w=1740&auto=format&fit=crop"
                            alt="Graduation celebration"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-brand-dark bg-opacity-50 flex items-end p-8">
                            <h1 className="text-white text-4xl font-serif font-bold leading-tight">
                                Relive Your<br/>Achievements.
                            </h1>
                        </div>
                    </div>

                    {/* Right Side: Login Form */}
                    <div className="w-full md:w-1/2 bg-brand-light p-8 sm:p-12 flex flex-col justify-center">
                        <div className="w-full max-w-md mx-auto">
                            <Link to="/" className="text-2xl font-serif text-brand-dark hover:text-brand-accent transition-colors mb-6 block">
                               RateMyPix
                            </Link>

                            <h2 className="text-3xl font-bold text-brand-dark mb-2">Welcome Back</h2>
                            <p className="text-brand-text mb-8">Please enter your details to sign in.</p>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="username" className="text-sm font-semibold text-brand-text block mb-1">Username</label>
                                    <input
                                        id="username"
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent"
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between">
                                        <label htmlFor="password" className="text-sm font-semibold text-brand-text block mb-1">Password</label>
                                        <Link to="/forgot-password" className="text-sm font-semibold text-brand-accent hover:underline">
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent"
                                    />
                                </div>

                                {error && <p className="text-sm text-red-600 text-center bg-red-100 p-2 rounded-md">{error}</p>}

                                <div>
                                    <button type="submit" className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-brand-dark hover:bg-black text-white font-semibold rounded-md transition-colors shadow-md">
                                        <LogIn size={18} />
                                        <span>Sign In</span>
                                    </button>
                                </div>
                            </form>
                            <p className="text-sm text-center text-brand-text mt-8">
                                Don't have an account?{' '}
                                <Link to="/register" className="font-semibold text-brand-accent hover:underline">
                                    Sign Up
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};