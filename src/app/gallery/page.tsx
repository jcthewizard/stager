'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { createClient } from '@/lib/supabase/client';
import enhanceStyles from '../enhance/enhance.module.css';
import styles from './gallery.module.css';

interface GalleryItem {
    id: string;
    original_url: string;
    enhanced_urls: string[];
    model_used: string;
    enhancement_type: string;
    credits_used: number;
    status: string;
    prompt: string | null;
    created_at: string;
}

// ============================================================
// Helper: Download image
// ============================================================
async function downloadImage(url: string, filename: string) {
    try {
        const res = await fetch(url);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
    } catch {
        window.open(url, '_blank');
    }
}

// ============================================================
// Helper: Relative time
// ============================================================
function timeAgo(dateStr: string): string {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ============================================================
// Helper: Enhancement type labels
// ============================================================
const TYPE_LABELS: Record<string, { label: string; icon: string }> = {
    sky_replacement: { label: 'Sky Replacement', icon: '🌅' },
    twilight: { label: 'Twilight', icon: '🌆' },
    hdr: { label: 'HDR', icon: '✨' },
    virtual_staging: { label: 'Virtual Staging', icon: '🛋️' },
    declutter: { label: 'Declutter', icon: '🧹' },
    upscale: { label: 'Upscale', icon: '🔍' },
    custom: { label: 'Custom', icon: '🎨' },
    variation_subtle: { label: 'Vary (Subtle)', icon: '🔄' },
    variation_strong: { label: 'Vary (Strong)', icon: '🔀' },
};

// ============================================================
// Main: Gallery Page
// ============================================================
export default function GalleryPage() {
    const router = useRouter();
    const { user, isLoading, isAuthenticated, signOut } = useAuth();
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) router.push('/login');
    }, [isLoading, isAuthenticated, router]);

    const fetchEnhancements = useCallback(async () => {
        if (!user) return;
        const supabase = createClient();
        const { data, error } = await supabase
            .from('enhancements')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        if (!error && data) setItems(data as GalleryItem[]);
        setLoading(false);
    }, [user]);

    useEffect(() => {
        if (user) fetchEnhancements();
    }, [user, fetchEnhancements]);

    const handleSignOut = async () => {
        await signOut();
        router.push('/');
    };

    if (isLoading || !user) return null;

    const initials = user.fullName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <div className={enhanceStyles.workspace}>
            {/* ============ Sidebar (reused from workspace) ============ */}
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
                    <a className={`${enhanceStyles.sidebarItem} ${enhanceStyles.sidebarItemActive}`} href="/gallery">
                        <span className={enhanceStyles.sidebarIcon}>🖼️</span>
                        Gallery
                    </a>
                    <a className={enhanceStyles.sidebarItem} href="/usage">
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

            {/* ============ Main Content ============ */}
            <div className={styles.galleryMain}>
                {/* Top Bar */}
                <div className={styles.topBar}>
                    <h1 className={styles.topBarTitle}>Gallery</h1>
                    <span className={styles.topBarCount}>
                        {items.length} enhancement{items.length !== 1 ? 's' : ''}
                    </span>
                    <div className={styles.topBarActions}>
                        <div className={styles.topBarBtn}>
                            <span className={enhanceStyles.creditsDot} />
                            {user.credits} credits
                        </div>
                        <a href="/enhance" className={styles.topBarBtn}>
                            ✨ New Enhancement
                        </a>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className={styles.loading}>
                        <div className={styles.spinner} />
                    </div>
                ) : items.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>🖼️</div>
                        <h3 className={styles.emptyTitle}>No enhancements yet</h3>
                        <p className={styles.emptyDesc}>
                            Your enhanced photos will appear here. Upload a listing photo and enhance it to get started.
                        </p>
                        <a href="/enhance" className={styles.emptyBtn}>
                            ✨ Start Enhancing
                        </a>
                    </div>
                ) : (
                    <div className={styles.galleryContent}>
                        <div className={styles.galleryGrid}>
                            {items.map((item) => {
                                const typeInfo = TYPE_LABELS[item.enhancement_type] || { label: item.enhancement_type, icon: '🎨' };
                                const enhancedUrl = item.enhanced_urls?.[0];
                                const modelName = item.model_used?.split('/').pop() || item.model_used;

                                return (
                                    <div key={item.id} className={styles.card}>
                                        {/* Image — shows enhanced, fades to original on hover */}
                                        <div
                                            className={styles.cardImageWrap}
                                            onClick={() => enhancedUrl && setLightboxUrl(enhancedUrl)}
                                        >
                                            {enhancedUrl && (
                                                <img
                                                    src={enhancedUrl}
                                                    alt="Enhanced"
                                                    className={styles.cardImageEnhanced}
                                                />
                                            )}
                                            <img
                                                src={item.original_url}
                                                alt="Original"
                                                className={styles.cardImageOriginal}
                                            />
                                            <span className={`${styles.cardImageLabel} ${styles.cardImageLabelEnhanced}`}>
                                                Enhanced
                                            </span>
                                            <span className={`${styles.cardImageLabel} ${styles.cardImageLabelOriginal}`}>
                                                Original
                                            </span>
                                        </div>

                                        {/* Card Body */}
                                        <div className={styles.cardBody}>
                                            <div className={styles.cardMeta}>
                                                <span className={`${styles.cardBadge} ${styles.cardBadgeType}`}>
                                                    {typeInfo.icon} {typeInfo.label}
                                                </span>
                                                <span className={`${styles.cardBadge} ${styles.cardBadgeModel}`}>
                                                    {modelName}
                                                </span>
                                                <span className={styles.cardDate}>
                                                    {timeAgo(item.created_at)}
                                                </span>
                                            </div>
                                            <div className={styles.cardActions}>
                                                {enhancedUrl && (
                                                    <button
                                                        className={`${styles.cardActionBtn} ${styles.cardActionBtnPrimary}`}
                                                        onClick={() => downloadImage(enhancedUrl, `stager-${item.enhancement_type}-${item.id.slice(0, 8)}.png`)}
                                                    >
                                                        ⬇ Download
                                                    </button>
                                                )}
                                                <button
                                                    className={styles.cardActionBtn}
                                                    onClick={() => enhancedUrl && setLightboxUrl(enhancedUrl)}
                                                >
                                                    🔍 View Full
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Lightbox */}
            {lightboxUrl && (
                <div className={styles.lightbox} onClick={() => setLightboxUrl(null)}>
                    <button className={styles.lightboxClose} onClick={() => setLightboxUrl(null)}>✕</button>
                    <img
                        src={lightboxUrl}
                        alt="Enhanced"
                        className={styles.lightboxImage}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}
