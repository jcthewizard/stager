'use client';

import {
    createContext,
    useContext,
    useCallback,
    useEffect,
    useState,
    type ReactNode,
} from 'react';
import { User, AuthState } from '@/types';
import {
    signUp as authSignUp,
    signIn as authSignIn,
    signOut as authSignOut,
    getCurrentUser,
} from '@/lib/auth';

interface AuthContextValue extends AuthState {
    signUp: (email: string, password: string, fullName: string) => Promise<string | null>;
    signIn: (email: string, password: string) => Promise<string | null>;
    signOut: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshUser = useCallback(async () => {
        try {
            const u = await getCurrentUser();
            setUser(u);
        } catch {
            setUser(null);
        }
    }, []);

    // Check for existing session on mount
    useEffect(() => {
        refreshUser().finally(() => setIsLoading(false));
    }, [refreshUser]);

    const signUp = useCallback(
        async (email: string, password: string, fullName: string): Promise<string | null> => {
            const result = await authSignUp(email, password, fullName);
            if (result.error) return result.error;
            if (result.data) setUser(result.data);
            return null;
        },
        []
    );

    const signIn = useCallback(
        async (email: string, password: string): Promise<string | null> => {
            const result = await authSignIn(email, password);
            if (result.error) return result.error;
            if (result.data) setUser(result.data);
            return null;
        },
        []
    );

    const signOut = useCallback(async () => {
        await authSignOut();
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                signUp,
                signIn,
                signOut,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return ctx;
}
