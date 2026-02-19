'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import styles from '../auth.module.css';

export default function LoginPage() {
    const router = useRouter();
    const { signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const err = await signIn(email, password);
        setIsLoading(false);

        if (err) {
            setError(err);
        } else {
            router.push('/enhance');
        }
    }

    return (
        <div className={styles.authPage}>
            <div className={styles.authCard}>
                <div className={styles.authLogo}>
                    <a href="/"><img src="/stager-logo.png" alt="Stager" className={styles.authLogoImg} /></a>
                </div>
                <h1 className={styles.authTitle}>Welcome back</h1>
                <p className={styles.authSubtitle}>
                    Log in to your account to continue enhancing
                </p>

                <form className={styles.authForm} onSubmit={handleSubmit}>
                    {error && <div className={styles.authError}>{error}</div>}

                    <div className={styles.formGroup}>
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                            minLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        className={styles.authSubmit}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Signing in…' : 'Sign In'}
                    </button>
                </form>

                <p className={styles.authFooter}>
                    Don&apos;t have an account?{' '}
                    <a href="/signup">Create one free</a>
                </p>
            </div>
        </div>
    );
}
