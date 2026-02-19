'use client';

import { Suspense, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import styles from '../auth.module.css';

const VALID_PLANS = ['starter', 'pro', 'agency'];

function SignupForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { signUp } = useAuth();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const planParam = searchParams.get('plan');

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const err = await signUp(email, password, fullName);

        if (err) {
            setIsLoading(false);
            setError(err);
            return;
        }

        // If a valid paid plan was selected, redirect to Stripe Checkout
        if (planParam && VALID_PLANS.includes(planParam)) {
            try {
                const res = await fetch('/api/stripe/checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ plan: planParam }),
                });
                const data = await res.json();
                if (res.ok && data.url) {
                    window.location.href = data.url;
                    return;
                }
            } catch {
                // If checkout fails, fall through to enhance page
            }
        }

        setIsLoading(false);
        router.push('/enhance');
    }

    return (
        <div className={styles.authPage}>
            <div className={styles.authCard}>
                <div className={styles.authLogo}>
                    <a href="/"><img src="/stager-logo.png" alt="Stager" className={styles.authLogoImg} /></a>
                </div>
                <h1 className={styles.authTitle}>Create your account</h1>
                <p className={styles.authSubtitle}>
                    {planParam && VALID_PLANS.includes(planParam)
                        ? `Sign up to continue to the ${planParam.charAt(0).toUpperCase() + planParam.slice(1)} plan`
                        : 'Get 5 free credits — no credit card required'}
                </p>

                <form className={styles.authForm} onSubmit={handleSubmit}>
                    {error && <div className={styles.authError}>{error}</div>}

                    <div className={styles.formGroup}>
                        <label htmlFor="fullName">Full name</label>
                        <input
                            id="fullName"
                            type="text"
                            placeholder="Jane Cooper"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            autoComplete="name"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            placeholder="jane@realty.com"
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
                            placeholder="At least 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                            minLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        className={styles.authSubmit}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Creating account…' : 'Create Account'}
                    </button>
                </form>

                <div className={styles.authDivider}>
                    <span>or</span>
                </div>

                <p className={styles.authFooter}>
                    Already have an account?{' '}
                    <a href="/login">Sign in</a>
                </p>
            </div>
        </div>
    );
}

export default function SignupPage() {
    return (
        <Suspense>
            <SignupForm />
        </Suspense>
    );
}
