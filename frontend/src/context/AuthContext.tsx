import { createContext, useState, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../api/apiService';
import type {User} from '../types/user';

interface AuthContextType {
    isLoggedIn: boolean;
    user: User | null;
    login: () => void;
    logout: () => Promise<void>;
    isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    const loadCurrentUser = async () => {
        try {
            const response = await apiService.get<User>('/users/me');
            setUser(response.data);
        } catch (error) {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadCurrentUser();
    }, []);

    const login = () => {
        loadCurrentUser();
        navigate('/');
    };

    const logout = async () => {
        try {
            await apiService.post('/auth/logout');
        } catch (error) {
            console.error("Logout request failed, but logging out client-side anyway:", error);
        } finally {
            setUser(null);
            navigate('/login');
        }
    };

    const value = {
        isLoggedIn: !!user,
        user,
        login,
        logout,
        isLoading,
    };

    return (
        <AuthContext.Provider value={value}>
            {!isLoading && children}
        </AuthContext.Provider>
    );
};