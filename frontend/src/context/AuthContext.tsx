import { createContext, useState, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../api/apiService';
import type {User} from '../types/user';

// Define the shape of the context data
interface AuthContextType {
    isLoggedIn: boolean;
    user: User | null;
    login: (token: string) => void;
    logout: () => void;
    isLoading: boolean;
}

// Create the context with a default undefined value
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true); // To handle initial auth check
    const navigate = useNavigate();

    // Effect to check for an existing token on app load
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            loadCurrentUser();
        } else {
            setIsLoading(false);
        }
    }, []);

    const loadCurrentUser = async () => {
        try {
            const response = await apiService.get<User>('/users/me');
            setUser(response.data);
        } catch (error) {
            console.error("Failed to fetch user. Token might be expired.", error);
            logout(); // If token is invalid, log the user out
        } finally {
            setIsLoading(false);
        }
    };

    const login = (token: string) => {
        localStorage.setItem('accessToken', token);
        loadCurrentUser(); // Fetch user data after setting token
        navigate('/'); // Redirect to homepage on successful login
    };

    const logout = () => {
        localStorage.removeItem('accessToken');
        setUser(null);
        navigate('/login'); // Redirect to login page on logout
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