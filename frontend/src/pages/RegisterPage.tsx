import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiService from '../api/apiService';
import { UserPlus } from 'lucide-react';
import { PageHelmet } from "../components/layout/PageHelmet.tsx";

export const RegisterPage = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            await apiService.post('/auth/register', {
                username,
                email,
                password,
            });
            // On successful registration, redirect to the login page with a success message
            navigate('/login');
            // We can add a toast notification here in a real app
        } catch (err: any) {
            if (err.response && err.response.data && err.response.data.detail) {
                setError(err.response.data.detail);
            } else {
                setError('An unknown error occurred during registration.');
            }
        }
    };

    return (
        <>
            <PageHelmet title={"Register Now"}/>
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="w-full max-w-4xl flex flex-row-reverse rounded-xl shadow-2xl overflow-hidden">

                    {/* Left Side: Media & Branding */}
                    <div className="hidden md:block w-1/2 relative">
                        <img
                            src="/register_page.jpg?q=80&w=1740&auto=format&fit=crop"
                            alt="Friends celebrating"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-brand-dark bg-opacity-50 flex items-end p-8">
                            <h1 className="text-white text-4xl font-serif font-bold leading-tight">
                                Share Your<br/>Success Story.
                            </h1>
                        </div>
                    </div>

                    {/* Right Side: Registration Form */}
                    <div className="w-full md:w-1/2 bg-brand-light p-8 sm:p-12 flex flex-col justify-center">
                        <div className="w-full max-w-md mx-auto">
                            <Link to="/" className="text-2xl font-serif text-brand-dark hover:text-brand-accent transition-colors mb-6 block">
                               RateMyPix
                            </Link>

                            <h2 className="text-3xl font-bold text-brand-dark mb-2">Create an Account</h2>
                            <p className="text-brand-text mb-8">Join the community and share your achievements.</p>

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
                                    <label htmlFor="email" className="text-sm font-semibold text-brand-text block mb-1">Email Address</label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="password" className="text-sm font-semibold text-brand-text block mb-1">Password</label>
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
                                        <UserPlus size={18} />
                                        <span>Create Account</span>
                                    </button>
                                </div>
                            </form>
                            <p className="text-sm text-center text-brand-text mt-8">
                                Already have an account?{' '}
                                <Link to="/login" className="font-semibold text-brand-accent hover:underline">
                                    Sign In
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default RegisterPage;