/* ===================================================
   Stager — Type Definitions
   =================================================== */

// --- User & Auth ---
export interface User {
    id: string;
    email: string;
    fullName: string;
    credits: number;
    totalCreditsPurchased: number;
    plan: 'free' | 'starter' | 'pro' | 'agency' | 'enterprise';
    stripeCustomerId?: string;
    createdAt: string;
    updatedAt: string;
}

export interface AuthState {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
}

// --- Enhancements ---
export type EnhancementType =
    | 'sky_replacement'
    | 'twilight'
    | 'hdr'
    | 'virtual_staging'
    | 'declutter'
    | 'upscale'
    | 'style_transfer'
    | 'custom';

export type EnhancementStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Enhancement {
    id: string;
    userId: string;
    originalUrl: string;
    enhancedUrls: string[];       // Up to 4 variations
    modelUsed: string;
    enhancementType: EnhancementType;
    creditsUsed: number;
    status: EnhancementStatus;
    prompt?: string;
    metadata?: Record<string, unknown>;
    createdAt: string;
}

// --- AI Models ---
export interface AIModel {
    id: string;
    name: string;
    provider: string;
    description: string;
    badge: string;
    creditsPerImage: number;
    supportsEditing: boolean;
    speed: 'fast' | 'medium' | 'slow';
}

// --- Credit Transactions ---
export type TransactionType = 'purchase' | 'signup_bonus' | 'enhancement' | 'refund';

export interface CreditTransaction {
    id: string;
    userId: string;
    amount: number;          // positive = add, negative = spend
    type: TransactionType;
    description: string;
    stripePaymentId?: string;
    createdAt: string;
}

// --- API Response Wrappers ---
export interface ApiResponse<T> {
    data?: T;
    error?: string;
}
