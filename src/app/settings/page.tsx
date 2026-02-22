'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { AI_MODELS, DEFAULT_MODEL } from '@/lib/models';
import { ENHANCEMENT_TYPES } from '@/lib/enhancement-types';
import enhanceStyles from '../enhance/enhance.module.css';
import styles from './settings.module.css';

export default function SettingsPage() {
    const router = useRouter();
    const { user, isLoading, isAuthenticated, signOut, refreshUser } = useAuth();

    // Profile form state
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Password form state
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Preferences state
    const [defaultModel, setDefaultModel] = useState(DEFAULT_MODEL.id);
    const [defaultType, setDefaultType] = useState('hdr');
    const [prefsSaving, setPrefsSaving] = useState(false);
    const [prefsMsg, setPrefsMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Billing state
    const [billingLoading, setBillingLoading] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) router.push('/login');
    }, [isLoading, isAuthenticated, router]);

    useEffect(() => {
        if (user) {
            setFullName(user.fullName);
            setEmail(user.email);
        }
    }, [user]);

    const handleProfileSave = useCallback(async () => {
        if (!user || !fullName.trim()) return;
        setProfileSaving(true);
        setProfileMsg(null);

        try {
            const supabase = createClient();
            const { error } = await supabase
                .from('profiles')
                .update({ full_name: fullName.trim(), updated_at: new Date().toISOString() })
                .eq('id', user.id);

            if (error) throw new Error(error.message);

            await refreshUser();
            setProfileMsg({ type: 'success', text: 'Profile updated.' });
        } catch (err) {
            setProfileMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update profile.' });
        } finally {
            setProfileSaving(false);
        }
    }, [user, fullName, refreshUser]);

    const handlePasswordChange = useCallback(async () => {
        if (!newPassword || newPassword.length < 6) {
            setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordMsg({ type: 'error', text: 'Passwords do not match.' });
            return;
        }

        setPasswordSaving(true);
        setPasswordMsg(null);

        try {
            const supabase = createClient();
            const { error } = await supabase.auth.updateUser({ password: newPassword });

            if (error) throw new Error(error.message);

            setNewPassword('');
            setConfirmPassword('');
            setPasswordMsg({ type: 'success', text: 'Password updated.' });
        } catch (err) {
            setPasswordMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update password.' });
        } finally {
            setPasswordSaving(false);
        }
    }, [newPassword, confirmPassword]);

    const handlePrefsSave = useCallback(async () => {
        if (!user) return;
        setPrefsSaving(true);
        setPrefsMsg(null);

        try {
            const supabase = createClient();
            const { error } = await supabase
                .from('profiles')
                .update({
                    metadata: { default_model: defaultModel, default_enhancement_type: defaultType },
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id);

            if (error) throw new Error(error.message);
            setPrefsMsg({ type: 'success', text: 'Preferences saved.' });
        } catch (err) {
            setPrefsMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save preferences.' });
        } finally {
            setPrefsSaving(false);
        }
    }, [user, defaultModel, defaultType]);

    const handleUpgrade = useCallback(async (planKey: string) => {
        if (billingLoading) return;
        setBillingLoading(planKey);
        try {
            const res = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan: planKey }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create checkout');
            window.location.href = data.url;
        } catch (err) {
            console.error('Upgrade error:', err);
            setBillingLoading(null);
        }
    }, []);

    const handleManageSubscription = useCallback(async () => {
        setBillingLoading('portal');
        try {
            const res = await fetch('/api/stripe/portal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to open portal');
            window.location.href = data.url;
        } catch (err) {
            console.error('Portal error:', err);
            setBillingLoading(null);
        }
    }, []);

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
                    <a className={enhanceStyles.sidebarItem} href="/usage">
                        <span className={enhanceStyles.sidebarIcon}>📊</span>
                        Usage
                    </a>
                    <a className={`${enhanceStyles.sidebarItem} ${enhanceStyles.sidebarItemActive}`} href="/settings">
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
            <div className={styles.settingsMain}>
                <div className={styles.topBar}>
                    <h1 className={styles.topBarTitle}>Settings</h1>
                </div>

                <div className={styles.settingsContent}>
                    {/* Profile Section */}
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>Profile</h2>
                        </div>
                        <div className={styles.sectionBody}>
                            <div className={styles.fieldGroup}>
                                <div className={styles.fieldRow}>
                                    <div className={styles.field}>
                                        <label className={styles.fieldLabel}>Full Name</label>
                                        <input
                                            className={styles.fieldInput}
                                            type="text"
                                            value={fullName}
                                            onChange={e => setFullName(e.target.value)}
                                        />
                                    </div>
                                    <div className={styles.field}>
                                        <label className={styles.fieldLabel}>Email</label>
                                        <input
                                            className={styles.fieldInput}
                                            type="email"
                                            value={email}
                                            disabled
                                        />
                                    </div>
                                </div>
                                <div className={styles.btnRow}>
                                    <button
                                        className={styles.btnPrimary}
                                        onClick={handleProfileSave}
                                        disabled={profileSaving || fullName.trim() === user.fullName}
                                    >
                                        {profileSaving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                                {profileMsg && (
                                    <div className={profileMsg.type === 'success' ? styles.successMsg : styles.errorMsg}>
                                        {profileMsg.text}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Plan & Billing Section */}
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>Plan & Billing</h2>
                        </div>
                        <div className={styles.sectionBody}>
                            <div className={styles.planRow}>
                                <span className={styles.planBadge}>{planLabel}</span>
                                <span className={styles.planCredits}>
                                    <span className={styles.planCreditsValue}>{user.credits}</span> credits remaining
                                </span>
                            </div>

                            {user.plan === 'free' ? (
                                <div className={styles.upgradeGrid}>
                                    <div className={styles.upgradeCard}>
                                        <div className={styles.upgradeName}>Starter</div>
                                        <div className={styles.upgradePrice}>$19<span className={styles.upgradePeriod}>/mo</span></div>
                                        <div className={styles.upgradeCredits}>50 credits/month</div>
                                        <button
                                            className={styles.btnPrimary}
                                            onClick={() => handleUpgrade('starter')}
                                            disabled={billingLoading === 'starter'}
                                        >
                                            {billingLoading === 'starter' ? 'Redirecting...' : 'Upgrade'}
                                        </button>
                                    </div>
                                    <div className={styles.upgradeCard}>
                                        <div className={styles.upgradeName}>Pro</div>
                                        <div className={styles.upgradePrice}>$49<span className={styles.upgradePeriod}>/mo</span></div>
                                        <div className={styles.upgradeCredits}>200 credits/month</div>
                                        <button
                                            className={styles.btnPrimary}
                                            onClick={() => handleUpgrade('pro')}
                                            disabled={billingLoading === 'pro'}
                                        >
                                            {billingLoading === 'pro' ? 'Redirecting...' : 'Upgrade'}
                                        </button>
                                    </div>
                                    <div className={styles.upgradeCard}>
                                        <div className={styles.upgradeName}>Agency</div>
                                        <div className={styles.upgradePrice}>$149<span className={styles.upgradePeriod}>/mo</span></div>
                                        <div className={styles.upgradeCredits}>750 credits/month</div>
                                        <button
                                            className={styles.btnPrimary}
                                            onClick={() => handleUpgrade('agency')}
                                            disabled={billingLoading === 'agency'}
                                        >
                                            {billingLoading === 'agency' ? 'Redirecting...' : 'Upgrade'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className={styles.btnRow}>
                                    <button
                                        className={styles.btnSecondary}
                                        onClick={handleManageSubscription}
                                        disabled={!!billingLoading}
                                    >
                                        {billingLoading === 'portal' ? 'Redirecting...' : 'Manage Subscription'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Preferences Section */}
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>Preferences</h2>
                        </div>
                        <div className={styles.sectionBody}>
                            <div className={styles.prefRow}>
                                <div>
                                    <div className={styles.prefLabel}>Default AI Model</div>
                                    <div className={styles.prefDesc}>Model used when you open the enhance page</div>
                                </div>
                                <select
                                    className={styles.prefSelect}
                                    value={defaultModel}
                                    onChange={e => setDefaultModel(e.target.value)}
                                >
                                    {AI_MODELS.map(m => (
                                        <option key={m.id} value={m.id}>
                                            {m.name} ({m.creditsPerImage} credit{m.creditsPerImage !== 1 ? 's' : ''})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.prefRow}>
                                <div>
                                    <div className={styles.prefLabel}>Default Enhancement Type</div>
                                    <div className={styles.prefDesc}>Pre-selected enhancement when you start</div>
                                </div>
                                <select
                                    className={styles.prefSelect}
                                    value={defaultType}
                                    onChange={e => setDefaultType(e.target.value)}
                                >
                                    {ENHANCEMENT_TYPES.map(et => (
                                        <option key={et.type} value={et.type}>
                                            {et.icon} {et.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.btnRow}>
                                <button
                                    className={styles.btnPrimary}
                                    onClick={handlePrefsSave}
                                    disabled={prefsSaving}
                                >
                                    {prefsSaving ? 'Saving...' : 'Save Preferences'}
                                </button>
                            </div>
                            {prefsMsg && (
                                <div className={prefsMsg.type === 'success' ? styles.successMsg : styles.errorMsg}>
                                    {prefsMsg.text}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Password Section */}
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>Change Password</h2>
                        </div>
                        <div className={styles.sectionBody}>
                            <div className={styles.fieldGroup}>
                                <div className={styles.fieldRow}>
                                    <div className={styles.field}>
                                        <label className={styles.fieldLabel}>New Password</label>
                                        <input
                                            className={styles.fieldInput}
                                            type="password"
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            placeholder="Min 6 characters"
                                        />
                                    </div>
                                    <div className={styles.field}>
                                        <label className={styles.fieldLabel}>Confirm Password</label>
                                        <input
                                            className={styles.fieldInput}
                                            type="password"
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                            placeholder="Re-enter password"
                                        />
                                    </div>
                                </div>
                                <div className={styles.btnRow}>
                                    <button
                                        className={styles.btnPrimary}
                                        onClick={handlePasswordChange}
                                        disabled={passwordSaving || !newPassword}
                                    >
                                        {passwordSaving ? 'Updating...' : 'Update Password'}
                                    </button>
                                </div>
                                {passwordMsg && (
                                    <div className={passwordMsg.type === 'success' ? styles.successMsg : styles.errorMsg}>
                                        {passwordMsg.text}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
