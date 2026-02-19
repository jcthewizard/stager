import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, PLANS } from '@/lib/stripe';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { plan: planKey } = await request.json();
        const plan = planKey ? PLANS[planKey] : undefined;

        if (!plan) {
            return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
        }

        const priceId = plan.priceId;

        // Get or create Stripe customer
        const { data: profile } = await supabase
            .from('profiles')
            .select('stripe_customer_id, email, full_name')
            .eq('id', user.id)
            .single();

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        let customerId = profile.stripe_customer_id;

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: profile.email || user.email || '',
                name: profile.full_name || '',
                metadata: { supabase_user_id: user.id },
            });
            customerId = customer.id;

            await supabase
                .from('profiles')
                .update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() })
                .eq('id', user.id);
        }

        // Create checkout session
        const origin = request.headers.get('origin') || 'http://localhost:3000';

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${origin}/settings?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/settings`,
            metadata: { supabase_user_id: user.id },
        });

        return NextResponse.json({ url: session.url });
    } catch (err) {
        console.error('Stripe checkout error:', err);
        return NextResponse.json(
            { error: 'Failed to create checkout session' },
            { status: 500 },
        );
    }
}
