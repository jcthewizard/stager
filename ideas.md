- a way to add folders (properties) and organize
- styles in the same proprty should be consistent
- maybe change view in full to edit?
- When clicking HDR enhancement, it makes it wrap lines. Let's fix that. 
- what is custom
- why is enhancement type not multi select

What you need to do (external services)
1. Deploy to Vercel
Go to vercel.com, import your GitHub repo
Vercel auto-detects Next.js — no config needed
2. Set environment variables in Vercel
Add all of these in Vercel dashboard → Settings → Environment Variables:

Variable	Value
NEXT_PUBLIC_SUPABASE_URL	your Supabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY	your anon key
SUPABASE_SERVICE_ROLE_KEY	your service role key
OPENROUTER_API_KEY	your OpenRouter key
STRIPE_SECRET_KEY	live key from Stripe (sk_live_...)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY	live key (pk_live_...)
STRIPE_WEBHOOK_SECRET	from step 4 below
STRIPE_PRICE_STARTER	create live prices (step 3)
STRIPE_PRICE_PRO	create live prices (step 3)
STRIPE_PRICE_AGENCY	create live prices (step 3)
NEXT_PUBLIC_APP_URL	https://yourdomain.com
3. Stripe: switch to live mode
In Stripe dashboard, toggle off "Test mode"
Re-create your 3 products + prices in live mode (Starter $19, Pro $49, Agency $149 — monthly recurring)
Copy the new live price_ IDs into Vercel env vars
Copy live sk_live_ and pk_live_ keys
4. Stripe: add production webhook
Stripe → Developers → Webhooks → Add endpoint
URL: https://yourdomain.com/api/stripe/webhook
Events to listen for:
checkout.session.completed
invoice.paid
customer.subscription.updated
customer.subscription.deleted
Copy the webhook signing secret → STRIPE_WEBHOOK_SECRET in Vercel
5. Supabase: configure for production
Authentication → URL Configuration:
Site URL: https://yourdomain.com
Redirect URLs: add https://yourdomain.com/**
Authentication → Email → Re-enable "Confirm email" (you turned it off for testing)
Authentication → Rate Limits: review defaults are reasonable
6. Domain
Buy a domain, add it in Vercel → Settings → Domains
What I can fix in code right now
There are a couple of code issues to fix before deploying:

Hardcoded localhost:3000 fallback in Stripe checkout/portal routes
Add NEXT_PUBLIC_APP_URL support
Want me to go ahead and fix those code issues?