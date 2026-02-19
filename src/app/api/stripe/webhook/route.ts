import { NextRequest, NextResponse } from 'next/server';
import { stripe, getPlanByPriceId } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!,
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const supabase = createAdminClient();

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                if (session.mode !== 'subscription' || !session.subscription) break;

                const subscription = await stripe.subscriptions.retrieve(
                    session.subscription as string,
                );
                const priceId = subscription.items.data[0]?.price.id;
                const plan = priceId ? getPlanByPriceId(priceId) : undefined;

                if (!plan) {
                    console.error('Unknown price ID:', priceId);
                    break;
                }

                const userId = session.metadata?.supabase_user_id;
                if (!userId) {
                    console.error('No supabase_user_id in session metadata');
                    break;
                }

                // Update profile: plan, customer ID, add credits
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('credits')
                    .eq('id', userId)
                    .single();

                const currentCredits = (profile?.credits as number) ?? 0;

                await supabase
                    .from('profiles')
                    .update({
                        plan: plan.key,
                        stripe_customer_id: session.customer as string,
                        credits: currentCredits + plan.monthlyCredits,
                        total_credits_purchased: currentCredits + plan.monthlyCredits,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', userId);

                // Log credit transaction
                await supabase.from('credit_transactions').insert({
                    user_id: userId,
                    amount: plan.monthlyCredits,
                    type: 'purchase',
                    description: `${plan.name} subscription — ${plan.monthlyCredits} credits`,
                    stripe_payment_id: session.payment_intent as string || session.id,
                });

                break;
            }

            case 'invoice.paid': {
                const invoice = event.data.object as Stripe.Invoice;
                // Skip the first invoice (handled by checkout.session.completed)
                if (invoice.billing_reason === 'subscription_create') break;

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const subscriptionId = (invoice as any).subscription as string;
                if (!subscriptionId) break;

                const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                const priceId = subscription.items.data[0]?.price.id;
                const plan = priceId ? getPlanByPriceId(priceId) : undefined;

                if (!plan) break;

                const customerId = invoice.customer as string;

                // Find user by stripe_customer_id
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('id, credits')
                    .eq('stripe_customer_id', customerId)
                    .single();

                if (!profile) {
                    console.error('No profile for customer:', customerId);
                    break;
                }

                const currentCredits = (profile.credits as number) ?? 0;

                await supabase
                    .from('profiles')
                    .update({
                        credits: currentCredits + plan.monthlyCredits,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', profile.id);

                await supabase.from('credit_transactions').insert({
                    user_id: profile.id,
                    amount: plan.monthlyCredits,
                    type: 'purchase',
                    description: `${plan.name} renewal — ${plan.monthlyCredits} credits`,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    stripe_payment_id: (invoice as any).payment_intent as string || invoice.id,
                });

                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                const priceId = subscription.items.data[0]?.price.id;
                const plan = priceId ? getPlanByPriceId(priceId) : undefined;
                const customerId = subscription.customer as string;

                if (!plan) break;

                await supabase
                    .from('profiles')
                    .update({ plan: plan.key, updated_at: new Date().toISOString() })
                    .eq('stripe_customer_id', customerId);

                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;

                await supabase
                    .from('profiles')
                    .update({ plan: 'free', updated_at: new Date().toISOString() })
                    .eq('stripe_customer_id', customerId);

                break;
            }
        }
    } catch (err) {
        console.error('Webhook handler error:', err);
        // Still return 200 to prevent Stripe retries
    }

    return NextResponse.json({ received: true });
}
