import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import apiService from '../api/apiService';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {PageHelmet} from "../components/layout/PageHelmet.tsx";


export const SettingsPage = () => {
    const { user, logout } = useAuth();
    const queryClient = useQueryClient();

    const [bio, setBio] = useState(user?.bio || '');
    const [allowDownloads, setAllowDownloads] = useState(user?.allow_downloads ?? true);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const updateProfileMutation = useMutation({
        mutationFn: (updatedData: { bio?: string; allow_downloads?: boolean }) =>
            apiService.put('/users/me', updatedData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile', user?.username] });
            queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
            // Replaced setMessage with a success toast
            toast.success('Profile updated successfully!');
        },
        onError: () => {
            // Replaced setMessage with an error toast
            toast.error('Failed to update profile.');
        }
    });

    const changePasswordMutation = useMutation({
        mutationFn: (passwordData: { old_password: string; new_password: string }) =>
            apiService.post('/users/me/change-password', passwordData),
        onSuccess: () => {
            toast.success('Password changed successfully! Please log in again.');
            setTimeout(() => logout(), 2000);
        },
        onError: (err: any) => {
             const errorMsg = err.response?.data?.detail || 'Failed to change password.';
             toast.error(errorMsg);
        }
    });

    const handleProfileSubmit = (e: FormEvent) => {
        e.preventDefault();
        updateProfileMutation.mutate({ bio, allow_downloads: allowDownloads });
    };

    const handlePasswordSubmit = (e: FormEvent) => {
        e.preventDefault();
        changePasswordMutation.mutate({ old_password: oldPassword, new_password: newPassword });
    };

    return (
        <>
            <PageHelmet title={"Settings"} description={"Manage your account settings and preferences."}/>
            <div className="max-w-4xl mx-auto space-y-12">
                <header>
                    <h1 className="text-4xl font-bold font-serif text-gray-800">Account Settings</h1>
                    <p className="text-lg text-gray-600 mt-2">Manage your profile and account information.</p>
                </header>

                {/* The conditional message div is no longer needed */}

                <form onSubmit={handleProfileSubmit} className="p-6 bg-white border rounded-lg space-y-4">
                     <h2 className="text-2xl font-semibold">Edit Profile</h2>
                     {/* ... form fields remain the same ... */}
                     <div>
                        <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Bio</label>
                        <textarea
                            id="bio"
                            rows={4}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center">
                        <input
                            id="allow_downloads"
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-blue-600"
                            checked={allowDownloads}
                            onChange={(e) => setAllowDownloads(e.target.checked)}
                        />
                        <label htmlFor="allow_downloads" className="ml-3 block text-sm font-medium text-gray-700">
                            Allow others to download my media
                        </label>
                    </div>
                    <button type="submit" disabled={updateProfileMutation.isPending} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-md disabled:bg-blue-300">
                        {updateProfileMutation.isPending && <Loader2 className="animate-spin mr-2" />}
                        Save Profile
                    </button>
                </form>

                 <form onSubmit={handlePasswordSubmit} className="p-6 bg-white border rounded-lg space-y-4">
                     <h2 className="text-2xl font-semibold">Change Password</h2>
                     <div>
                        <label htmlFor="old_password">Current Password</label>
                        <input id="old_password" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                     </div>
                     <div>
                        <label htmlFor="new_password">New Password</label>
                        <input id="new_password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                     </div>
                     <button type="submit" disabled={changePasswordMutation.isPending} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-md disabled:bg-blue-300">
                        {changePasswordMutation.isPending && <Loader2 className="animate-spin mr-2" />}
                        Change Password
                    </button>
                </form>
            </div>
        </>
    );
};