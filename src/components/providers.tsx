'use client';

import { AuthProvider } from '@/components/auth-provider';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
    return <AuthProvider>{children}</AuthProvider>;
}
