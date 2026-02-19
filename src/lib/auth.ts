/**
 * Auth Layer — Real Supabase Implementation
 *
 * Uses Supabase Auth for signup/login and the profiles table
 * for user metadata (credits, plan, etc.)
 */

import { User, ApiResponse } from '@/types';
import { createClient } from '@/lib/supabase/client';

// ---------- Helpers ----------

function mapProfile(profile: Record<string, unknown>): User {
    return {
        id: profile.id as string,
        email: profile.email as string,
        fullName: (profile.full_name as string) || '',
        credits: (profile.credits as number) ?? 5,
        totalCreditsPurchased: (profile.total_credits_purchased as number) ?? 0,
        plan: (profile.plan as User['plan']) || 'free',
        stripeCustomerId: profile.stripe_customer_id as string | undefined,
        createdAt: profile.created_at as string,
        updatedAt: profile.updated_at as string,
    };
}

// ---------- Auth Functions ----------

export async function signUp(
    email: string,
    password: string,
    fullName: string
): Promise<ApiResponse<User>> {
    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { full_name: fullName },
        },
    });

    if (error) {
        return { error: error.message };
    }

    if (!data.user) {
        return { error: 'Signup failed. Please try again.' };
    }

    // The trigger auto-creates the profile, but it may take a moment.
    // Fetch the profile to return the full User object.
    // Small delay to let the trigger fire
    await new Promise(r => setTimeout(r, 500));

    const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

    if (profileErr || !profile) {
        // Profile may not exist yet — return a default
        return {
            data: {
                id: data.user.id,
                email: data.user.email || email,
                fullName,
                credits: 5,
                totalCreditsPurchased: 0,
                plan: 'free',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
        };
    }

    return { data: mapProfile(profile) };
}

export async function signIn(
    email: string,
    password: string
): Promise<ApiResponse<User>> {
    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return { error: error.message };
    }

    if (!data.user) {
        return { error: 'Login failed. Please try again.' };
    }

    const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

    if (profileErr || !profile) {
        return { error: 'Could not load your profile.' };
    }

    return { data: mapProfile(profile) };
}

export async function signOut(): Promise<void> {
    const supabase = createClient();
    await supabase.auth.signOut();
}

export async function getCurrentUser(): Promise<User | null> {
    const supabase = createClient();

    const {
        data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) return null;

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

    if (!profile) return null;

    return mapProfile(profile);
}

export async function updateUserCredits(
    userId: string,
    creditsDelta: number
): Promise<User | null> {
    const supabase = createClient();

    // Get current credits
    const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();

    if (!profile) return null;

    const newCredits = Math.max(0, (profile.credits as number) + creditsDelta);

    const { data: updated, error } = await supabase
        .from('profiles')
        .update({ credits: newCredits, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select('*')
        .single();

    if (error || !updated) return null;

    return mapProfile(updated);
}
