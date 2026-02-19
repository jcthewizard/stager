import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// ============================================================
// Plan Configuration
// ============================================================
export interface PlanConfig {
    name: string;
    priceId: string;
    monthlyCredits: number;
    price: number; // dollars
}

export const PLANS: Record<string, PlanConfig> = {
    starter: {
        name: 'Starter',
        priceId: process.env.STRIPE_PRICE_STARTER!,
        monthlyCredits: 50,
        price: 19,
    },
    pro: {
        name: 'Pro',
        priceId: process.env.STRIPE_PRICE_PRO!,
        monthlyCredits: 200,
        price: 49,
    },
    agency: {
        name: 'Agency',
        priceId: process.env.STRIPE_PRICE_AGENCY!,
        monthlyCredits: 750,
        price: 149,
    },
};

export function getPlanByPriceId(priceId: string): (PlanConfig & { key: string }) | undefined {
    for (const [key, plan] of Object.entries(PLANS)) {
        if (plan.priceId === priceId) {
            return { ...plan, key };
        }
    }
    return undefined;
}
