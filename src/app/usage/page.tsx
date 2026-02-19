'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { createClient } from '@/lib/supabase/client';
import enhanceStyles from '../enhance/enhance.module.css';
import styles from './usage.module.css';

// ============================================================
// Types
// ============================================================
interface CreditTransaction {
    id: string;
    amount: number;
    type: string;
    description: string;
    created_at: string;
}

interface EnhancementRecord {
    id: string;
    enhancement_type: string;
    credits_used: number;
    status: string;
    created_at: string;
}

// ============================================================
// Helpers
// ============================================================
function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

function getTransactionIcon(type: string): string {
    switch (type) {
        case 'purchase': return '💳';
        case 'signup_bonus': return '🎁';
        case 'enhancement': return '✨';
        case 'refund': return '↩️';
        default: return '📋';
    }
}

function getTransactionLabel(type: string): string {
    switch (type) {
        case 'purchase': return 'Purchase';
        case 'signup_bonus': return 'Signup Bonus';
        case 'enhancement': return 'Enhancement';
        case 'refund': return 'Refund';
        default: return type;
    }
}

// ============================================================
// Main: Usage Page
// ============================================================
export default function UsagePage() {
    const router = useRouter();
    const { user, isLoading, isAuthenticated, signOut } = useAuth();
    const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
    const [enhancements, setEnhancements] = useState<EnhancementRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) router.push('/login');
    }, [isLoading, isAuthenticated, router]);

    const fetchData = useCallback(async () => {
        if (!user) return;
        const supabase = createClient();

        const [txResult, enhResult] = await Promise.all([
            supabase
                .from('credit_transactions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false }),
            supabase
                .from('enhancements')
                .select('id, enhancement_type, credits_used, status, created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false }),
        ]);

        if (!txResult.error && txResult.data) {
            setTransactions(txResult.data as CreditTransaction[]);
        }
        if (!enhResult.error && enhResult.data) {
            setEnhancements(enhResult.data as EnhancementRecord[]);
        }
        setLoading(false);
    }, [user]);

    useEffect(() => {
        if (user) fetchData();
    }, [user, fetchData]);

    const handleSignOut = useCallback(async () => {
        await signOut();
        router.push('/');
    }, [signOut, router]);

    if (isLoading) {
        return (
            <div className={enhanceStyles.workspace}>
                <div className={styles.loading}>
                    <div className={styles.spinner} />
                </div>
            </div>
        );
    }

    if (!user) return null;

    // --- Compute summary stats ---
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const creditsUsedThisMonth = transactions
        .filter(tx => tx.amount < 0 && new Date(tx.created_at) >= startOfMonth)
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    const totalEnhancements = enhancements.filter(e => e.status === 'completed').length;

    const typeCounts: Record<string, number> = {};
    for (const e of enhancements) {
        typeCounts[e.enhancement_type] = (typeCounts[e.enhancement_type] || 0) + 1;
    }
    const mostUsedType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];

    const initials = user.fullName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const planLabel = user.plan.charAt(0).toUpperCase() + user.plan.slice(1);

    return (
        <div className={enhanceStyles.workspace}>
            {/* Sidebar */}
            <aside className={enhanceStyles.sidebar}>
                <div className={enhanceStyles.sidebarHeader}>
                    <a href="/" className={enhanceStyles.sidebarLogo}>
                        <img src="/stager-logo.png" alt="Stager" className={enhanceStyles.sidebarLogoImg} />
                    </a>
                </div>
                <nav className={enhanceStyles.sidebarNav}>
                    <a className={enhanceStyles.sidebarItem} href="/enhance">
                        <span className={enhanceStyles.sidebarIcon}>✨</span>
                        Enhance
                    </a>
                    <a className={enhanceStyles.sidebarItem} href="/gallery">
                        <span className={enhanceStyles.sidebarIcon}>🖼️</span>
                        Gallery
                    </a>
                    <a className={`${enhanceStyles.sidebarItem} ${enhanceStyles.sidebarItemActive}`} href="/usage">
                        <span className={enhanceStyles.sidebarIcon}>📊</span>
                        Usage
                    </a>
                    <a className={enhanceStyles.sidebarItem} href="/settings">
                        <span className={enhanceStyles.sidebarIcon}>⚙️</span>
                        Settings
                    </a>
                </nav>
                <div className={enhanceStyles.sidebarFooter}>
                    <div className={enhanceStyles.sidebarUserInfo}>
                        <div className={enhanceStyles.sidebarAvatar}>{initials}</div>
                        <div>
                            <div className={enhanceStyles.sidebarUserName}>{user.fullName}</div>
                            <div className={enhanceStyles.sidebarUserEmail}>{user.email}</div>
                        </div>
                    </div>
                    <button className={enhanceStyles.signOutBtn} onClick={handleSignOut}>
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className={styles.usageMain}>
                <div className={styles.topBar}>
                    <h1 className={styles.topBarTitle}>Usage</h1>
                    <div className={styles.topBarActions}>
                        <div className={styles.topBarBtn}>
                            <span className={enhanceStyles.creditsDot} />
                            {user.credits} credit{user.credits !== 1 ? 's' : ''}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className={styles.loading}>
                        <div className={styles.spinner} />
                    </div>
                ) : (
                    <div className={styles.usageContent}>
                        {/* Summary Cards */}
                        <div className={styles.summaryGrid}>
                            <div className={styles.summaryCard}>
                                <div className={styles.summaryLabel}>Current Balance</div>
                                <div className={styles.summaryValue}>{user.credits}</div>
                                <div className={styles.summarySubtext}>credits available</div>
                            </div>
                            <div className={styles.summaryCard}>
                                <div className={styles.summaryLabel}>Current Plan</div>
                                <div className={styles.summaryValue}>{planLabel}</div>
                                <div className={styles.summarySubtext}>
                                    {user.totalCreditsPurchased} credits purchased total
                                </div>
                            </div>
                            <div className={styles.summaryCard}>
                                <div className={styles.summaryLabel}>This Month</div>
                                <div className={styles.summaryValue}>{creditsUsedThisMonth}</div>
                                <div className={styles.summarySubtext}>credits used</div>
                            </div>
                            <div className={styles.summaryCard}>
                                <div className={styles.summaryLabel}>Total Enhancements</div>
                                <div className={styles.summaryValue}>{totalEnhancements}</div>
                                <div className={styles.summarySubtext}>
                                    {mostUsedType
                                        ? `Most used: ${mostUsedType[0].replace(/_/g, ' ')}`
                                        : 'No enhancements yet'}
                                </div>
                            </div>
                        </div>

                        {/* Transaction History */}
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>Transaction History</h2>
                            <span className={styles.sectionCount}>
                                {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
                            </span>
                        </div>

                        {transactions.length === 0 ? (
                            <div className={styles.emptyState}>
                                <div className={styles.emptyIcon}>📊</div>
                                <h3 className={styles.emptyTitle}>No transactions yet</h3>
                                <p className={styles.emptyDesc}>
                                    Your credit transactions will appear here as you enhance photos.
                                </p>
                            </div>
                        ) : (
                            <div className={styles.transactionTable}>
                                <div className={styles.tableHeader}>
                                    <span className={styles.tableHeaderCell}>Type</span>
                                    <span className={styles.tableHeaderCell}>Description</span>
                                    <span className={styles.tableHeaderCell}>Amount</span>
                                    <span className={styles.tableHeaderCell}>Date</span>
                                </div>
                                {transactions.map(tx => (
                                    <div key={tx.id} className={styles.tableRow}>
                                        <span className={styles.tableCell}>
                                            <span className={styles.txIcon}>
                                                {getTransactionIcon(tx.type)}
                                            </span>
                                            {getTransactionLabel(tx.type)}
                                        </span>
                                        <span className={`${styles.tableCell} ${styles.tableCellDesc}`}>
                                            {tx.description || '—'}
                                        </span>
                                        <span className={`${styles.tableCell} ${
                                            tx.amount > 0 ? styles.amountPositive : styles.amountNegative
                                        }`}>
                                            {tx.amount > 0
                                                ? `+${tx.amount} credit${tx.amount !== 1 ? 's' : ''}`
                                                : `${Math.abs(tx.amount)} credit${Math.abs(tx.amount) !== 1 ? 's' : ''}`
                                            }
                                        </span>
                                        <span className={`${styles.tableCell} ${styles.tableCellDate}`}>
                                            {formatDate(tx.created_at)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
