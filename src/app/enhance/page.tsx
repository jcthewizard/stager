'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { AI_MODELS, DEFAULT_MODEL } from '@/lib/models';
import { ENHANCEMENT_TYPES, buildPrompt, buildVaryPrompt } from '@/lib/enhancement-types';
import type { VaryStrength } from '@/lib/enhancement-types';
import { createClient } from '@/lib/supabase/client';
import type { AIModel, EnhancementType } from '@/types';
import styles from './enhance.module.css';

// ============================================================
// Helper: Download image (handles base64 data URLs and regular URLs)
// ============================================================
async function downloadImage(url: string, filename: string) {
    try {
        if (url.startsWith('data:')) {
            // Base64 data URL — create blob directly
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
        } else {
            // Regular URL — fetch and download
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
        }
    } catch (err) {
        console.error('Download failed:', err);
        // Fallback: open in new tab
        window.open(url, '_blank');
    }
}

// ============================================================
// Component: ModelSelector
// ============================================================
function ModelSelector({
    selected,
    onSelect,
}: {
    selected: AIModel;
    onSelect: (m: AIModel) => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    return (
        <div className={styles.modelSelector} ref={ref}>
            <button
                className={styles.modelSelectorBtn}
                onClick={() => setOpen(!open)}
            >
                <span>{selected.provider}</span>
                <strong>{selected.name}</strong>
                <span style={{ opacity: 0.4 }}>▼</span>
            </button>
            {open && (
                <div className={styles.modelDropdown}>
                    {AI_MODELS.map(m => (
                        <button
                            key={m.id}
                            className={`${styles.modelOption} ${m.id === selected.id ? styles.modelOptionSelected : ''}`}
                            onClick={() => { onSelect(m); setOpen(false); }}
                        >
                            <div className={styles.modelOptionHeader}>
                                <span className={styles.modelOptionName}>{m.name}</span>
                                <span className={styles.modelOptionProvider}>{m.provider}</span>
                                <span className={styles.modelOptionBadge}>{m.badge}</span>
                            </div>
                            <span className={styles.modelOptionDesc}>{m.description}</span>
                            <div className={styles.modelOptionMeta}>
                                <span className={styles.modelOptionCost}>{m.creditsPerImage} credit{m.creditsPerImage !== 1 ? 's' : ''} / image</span>
                                <span className={styles.modelOptionCost}>Speed: {m.speed}</span>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ============================================================
// Component: UploadZone
// ============================================================
function UploadZone({
    imageUrl,
    fileName,
    onUpload,
}: {
    imageUrl: string | null;
    fileName: string;
    onUpload: (url: string, name: string, file: File) => void;
}) {
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = useCallback(
        (file: File) => {
            if (!file.type.startsWith('image/')) return;
            const url = URL.createObjectURL(file);
            onUpload(url, file.name, file);
        },
        [onUpload]
    );

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
        },
        [handleFile]
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    if (imageUrl) {
        return (
            <div className={styles.uploadSection}>
                <div className={styles.uploadSectionTitle}>Source Image</div>
                <div className={styles.uploadPreview}>
                    <img src={imageUrl} alt="Uploaded" />
                    <div className={styles.uploadPreviewOverlay}>
                        <span className={styles.uploadPreviewName}>{fileName}</span>
                        <button
                            className={styles.uploadPreviewChange}
                            onClick={() => inputRef.current?.click()}
                        >
                            Change
                        </button>
                    </div>
                </div>
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    className={styles.uploadInput}
                    onChange={handleChange}
                />
            </div>
        );
    }

    return (
        <div className={styles.uploadSection}>
            <div className={styles.uploadSectionTitle}>Source Image</div>
            <div
                className={`${styles.uploadZone} ${isDragging ? styles.uploadZoneDragging : ''}`}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
            >
                <div className={styles.uploadIcon}>📷</div>
                <div className={styles.uploadText}>
                    Drop your listing photo here
                </div>
                <div className={styles.uploadSubtext}>
                    or click to browse · JPG, PNG, WebP up to 20MB
                </div>
            </div>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className={styles.uploadInput}
                onChange={handleChange}
            />
        </div>
    );
}

// ============================================================
// Component: CompareSlider (workspace version)
// ============================================================
function CompareSlider({
    beforeUrl,
    afterUrl,
}: {
    beforeUrl: string;
    afterUrl: string;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [pos, setPos] = useState(50);
    const [dragging, setDragging] = useState(false);

    const update = useCallback((clientX: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
        setPos(pct);
    }, []);

    return (
        <div
            ref={containerRef}
            className={styles.compareContainer}
            onPointerDown={e => { setDragging(true); update(e.clientX); (e.target as HTMLElement).setPointerCapture?.(e.pointerId); }}
            onPointerMove={e => { if (dragging) update(e.clientX); }}
            onPointerUp={() => setDragging(false)}
        >
            <img src={afterUrl} alt="After" className={styles.compareImage} />
            <img
                src={beforeUrl}
                alt="Before"
                className={styles.compareImage}
                style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
            />
            <div className={styles.compareSliderLine} style={{ left: `${pos}%` }} />
            <div className={styles.compareSliderHandle} style={{ left: `${pos}%` }}>
                ◀▶
            </div>
            <span className={`${styles.compareLabel} ${styles.compareLabelBefore}`}>Before</span>
            <span className={`${styles.compareLabel} ${styles.compareLabelAfter}`}>After</span>
        </div>
    );
}

// ============================================================
// Main: Enhance Page
// ============================================================
export default function EnhancePage() {
    const router = useRouter();
    const { user, isLoading, isAuthenticated, signOut, refreshUser } = useAuth();

    // State
    const [selectedModel, setSelectedModel] = useState<AIModel>(DEFAULT_MODEL);
    const [selectedType, setSelectedType] = useState<EnhancementType>('hdr');
    const [customPrompt, setCustomPrompt] = useState('');
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [uploadedFileName, setUploadedFileName] = useState('');
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStatus, setProcessingStatus] = useState('');
    const [results, setResults] = useState<string[]>([]);
    const [selectedVariation, setSelectedVariation] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'compare'>('grid');
    const [enhanceError, setEnhanceError] = useState('');

    // Redirect if not authenticated
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isLoading, isAuthenticated, router]);

    const handleEnhance = useCallback(async () => {
        if (!uploadedFile || !user) return;
        if (user.credits < selectedModel.creditsPerImage) return;

        setIsProcessing(true);
        setResults([]);
        setSelectedVariation(null);
        setViewMode('grid');
        setEnhanceError('');

        try {
            // Step 1: Upload image to Supabase Storage
            setProcessingStatus('Uploading image…');
            const supabase = createClient();
            const ext = uploadedFile.name.split('.').pop() || 'jpg';
            const filePath = `${user.id}/${Date.now()}.${ext}`;

            const { error: uploadErr } = await supabase.storage
                .from('photos')
                .upload(filePath, uploadedFile, { contentType: uploadedFile.type });

            if (uploadErr) {
                throw new Error(`Upload failed: ${uploadErr.message}`);
            }

            const { data: urlData } = supabase.storage
                .from('photos')
                .getPublicUrl(filePath);

            const publicUrl = urlData.publicUrl;

            // Step 2: Call enhance API
            setProcessingStatus(`Enhancing with ${selectedModel.name}…`);
            const prompt = buildPrompt(selectedType, customPrompt);

            const response = await fetch('/api/enhance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageUrl: publicUrl,
                    modelId: selectedModel.id,
                    prompt,
                    enhancementType: selectedType,
                    creditsToDeduct: selectedModel.creditsPerImage,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Enhancement failed');
            }

            setResults(data.enhancedUrls);
            setSelectedVariation(0);
            await refreshUser();
        } catch (err) {
            console.error('Enhancement failed:', err);
            setEnhanceError(err instanceof Error ? err.message : 'Enhancement failed. Please try again.');
        } finally {
            setIsProcessing(false);
            setProcessingStatus('');
        }
    }, [uploadedFile, user, selectedModel, selectedType, customPrompt, refreshUser]);

    const handleVary = useCallback(async (sourceImageUrl: string, strength: VaryStrength) => {
        if (!user) return;
        if (user.credits < selectedModel.creditsPerImage) return;

        setIsProcessing(true);
        setResults([]);
        setSelectedVariation(null);
        setViewMode('grid');
        setEnhanceError('');

        try {
            setProcessingStatus(`Creating ${strength} variation with ${selectedModel.name}…`);
            const prompt = buildVaryPrompt(strength);

            const response = await fetch('/api/enhance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageUrl: sourceImageUrl,
                    modelId: selectedModel.id,
                    prompt,
                    enhancementType: `variation_${strength}`,
                    creditsToDeduct: selectedModel.creditsPerImage,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Variation failed');
            }

            setResults(data.enhancedUrls);
            setSelectedVariation(0);
            await refreshUser();
        } catch (err) {
            console.error('Variation failed:', err);
            setEnhanceError(err instanceof Error ? err.message : 'Variation failed. Please try again.');
        } finally {
            setIsProcessing(false);
            setProcessingStatus('');
        }
    }, [user, selectedModel, refreshUser]);

    const handleSignOut = useCallback(async () => {
        await signOut();
        router.push('/');
    }, [signOut, router]);

    // Loading / auth gate
    if (isLoading) {
        return (
            <div className={styles.workspace}>
                <div className={styles.processingOverlay}>
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

    const canEnhance = uploadedFile && user.credits >= selectedModel.creditsPerImage && !isProcessing;
    const activeResultUrl = results.length > 0 ? results[selectedVariation ?? 0] : null;
    const canVary = !!activeResultUrl && !isProcessing && user.credits >= selectedModel.creditsPerImage;

    return (
        <div className={styles.workspace}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <a href="/" className={styles.sidebarLogo}>
                        <img src="/stager-logo.png" alt="Stager" className={styles.sidebarLogoImg} />
                    </a>
                </div>
                <nav className={styles.sidebarNav}>
                    <a className={`${styles.sidebarItem} ${styles.sidebarItemActive}`} href="/enhance">
                        <span className={styles.sidebarIcon}>✨</span>
                        Enhance
                    </a>
                    <a className={styles.sidebarItem} href="/gallery">
                        <span className={styles.sidebarIcon}>🖼️</span>
                        Gallery
                    </a>
                    <a className={styles.sidebarItem} href="/usage">
                        <span className={styles.sidebarIcon}>📊</span>
                        Usage
                    </a>
                    <a className={styles.sidebarItem} href="/settings">
                        <span className={styles.sidebarIcon}>⚙️</span>
                        Settings
                    </a>
                </nav>
                <div className={styles.sidebarFooter}>
                    <div className={styles.sidebarUserInfo}>
                        <div className={styles.sidebarAvatar}>{initials}</div>
                        <div>
                            <div className={styles.sidebarUserName}>{user.fullName}</div>
                            <div className={styles.sidebarUserEmail}>{user.email}</div>
                        </div>
                    </div>
                    <button className={styles.signOutBtn} onClick={handleSignOut}>
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className={styles.main}>
                {/* Top Bar */}
                <div className={styles.topBar}>
                    <div className={styles.creditsBadge}>
                        <span className={styles.creditsDot} />
                        {user.credits} credit{user.credits !== 1 ? 's' : ''}
                    </div>

                    <ModelSelector
                        selected={selectedModel}
                        onSelect={setSelectedModel}
                    />
                </div>

                {/* Canvas: Left Panel + Right Panel */}
                <div className={styles.canvas}>
                    {/* Left: Upload + Enhancement Config */}
                    <div className={styles.panelLeft}>
                        <UploadZone
                            imageUrl={uploadedImage}
                            fileName={uploadedFileName}
                            onUpload={(url, name, file) => { setUploadedImage(url); setUploadedFileName(name); setUploadedFile(file); }}
                        />

                        <div className={styles.enhancementSection}>
                            <div className={styles.uploadSectionTitle}>Enhancement Type</div>
                            <div className={styles.enhancementGrid}>
                                {ENHANCEMENT_TYPES.map(et => (
                                    <button
                                        key={et.type}
                                        className={`${styles.enhancementBtn} ${selectedType === et.type ? styles.enhancementBtnActive : ''}`}
                                        onClick={() => setSelectedType(et.type)}
                                        title={et.description}
                                    >
                                        <span className={styles.enhancementIcon}>{et.icon}</span>
                                        {et.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={styles.promptSection}>
                            <div className={styles.uploadSectionTitle}>Additional Instructions</div>
                            <textarea
                                className={styles.promptTextarea}
                                placeholder="Optional — describe specific changes you want…"
                                value={customPrompt}
                                onChange={e => setCustomPrompt(e.target.value)}
                            />

                            <button
                                className={styles.enhanceBtn}
                                disabled={!canEnhance}
                                onClick={handleEnhance}
                            >
                                {isProcessing
                                    ? 'Enhancing…'
                                    : <>Enhance <span className={styles.enhanceBtnCost}> · {selectedModel.creditsPerImage} credit{selectedModel.creditsPerImage !== 1 ? 's' : ''}</span></>
                                }
                            </button>
                        </div>
                    </div>

                    {/* Right: Results / Compare */}
                    <div className={styles.panelRight}>
                        {/* View Tabs */}
                        {results.length > 0 && (
                            <div className={styles.viewTabs}>
                                <button
                                    className={`${styles.viewTab} ${viewMode === 'grid' ? styles.viewTabActive : ''}`}
                                    onClick={() => setViewMode('grid')}
                                >
                                    Grid
                                </button>
                                <button
                                    className={`${styles.viewTab} ${viewMode === 'compare' ? styles.viewTabActive : ''}`}
                                    onClick={() => setViewMode('compare')}
                                >
                                    Compare
                                </button>
                            </div>
                        )}

                        {/* Processing */}
                        {isProcessing && (
                            <div className={styles.processingOverlay}>
                                <div className={styles.spinner} />
                                <div className={styles.processingText}>{processingStatus || 'Enhancing your photo…'}</div>
                                <div className={styles.processingSubtext}>
                                    Using {selectedModel.name} · This takes about 10–30 seconds
                                </div>
                            </div>
                        )}

                        {/* Empty State */}
                        {!isProcessing && results.length === 0 && (
                            <div className={styles.resultsEmpty}>
                                <div className={styles.resultsEmptyIcon}>🏠</div>
                                <h3 className={styles.resultsEmptyTitle}>
                                    Your enhanced photos will appear here
                                </h3>
                                <p className={styles.resultsEmptyDesc}>
                                    Upload a listing photo, choose an enhancement type and AI model, then hit Enhance.
                                </p>
                                {enhanceError && (
                                    <p style={{ color: '#c0392b', marginTop: '1rem', fontSize: '0.875rem' }}>{enhanceError}</p>
                                )}
                            </div>
                        )}

                        {/* Variation Grid */}
                        {!isProcessing && results.length > 0 && viewMode === 'grid' && (
                            <>
                                <div className={styles.variationGrid}>
                                    {results.map((url, i) => (
                                        <div
                                            key={i}
                                            className={`${styles.variationCard} ${selectedVariation === i ? styles.variationCardSelected : ''}`}
                                            onClick={() => setSelectedVariation(i)}
                                        >
                                            <span className={styles.variationLabel}>V{i + 1}</span>
                                            <img src={url} alt={`Variation ${i + 1}`} className={styles.variationImage} />
                                            <div className={styles.variationActions}>
                                                <button className={styles.variationActionBtn} onClick={(e) => { e.stopPropagation(); downloadImage(url, `stager-enhanced-v${i + 1}.png`); }}>⬇ Save</button>
                                                <button className={styles.variationActionBtn} disabled={isProcessing} onClick={(e) => { e.stopPropagation(); handleVary(url, 'subtle'); }}>🔄 Vary</button>
                                                <button className={styles.variationActionBtn} onClick={(e) => { e.stopPropagation(); setViewMode('compare'); setSelectedVariation(i); }}>
                                                    ◐ Compare
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className={styles.actionBar}>
                                    <button className={styles.actionBtn} disabled={!canVary} onClick={() => activeResultUrl && handleVary(activeResultUrl, 'subtle')}>
                                        🔄 Vary Subtle <span className={styles.enhanceBtnCost}>· {selectedModel.creditsPerImage} credit{selectedModel.creditsPerImage !== 1 ? 's' : ''}</span>
                                    </button>
                                    <button className={styles.actionBtn} disabled={!canVary} onClick={() => activeResultUrl && handleVary(activeResultUrl, 'strong')}>
                                        🔀 Vary Strong <span className={styles.enhanceBtnCost}>· {selectedModel.creditsPerImage} credit{selectedModel.creditsPerImage !== 1 ? 's' : ''}</span>
                                    </button>
                                    <button className={styles.actionBtn} disabled title="Coming soon">✂️ Region Edit</button>
                                    <button
                                        className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                                        onClick={() => {
                                            const idx = selectedVariation ?? 0;
                                            if (results[idx]) downloadImage(results[idx], `stager-enhanced-v${idx + 1}.png`);
                                        }}
                                    >
                                        ⬇ Download Selected
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Compare Mode */}
                        {!isProcessing && results.length > 0 && viewMode === 'compare' && uploadedImage && (
                            <div className={styles.compareSection}>
                                <CompareSlider
                                    beforeUrl={uploadedImage}
                                    afterUrl={results[selectedVariation ?? 0]}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
