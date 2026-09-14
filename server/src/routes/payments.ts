import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticate, supabaseAdmin } from '../utils/auth.js';

export interface CreditPackage {
  id: 'starter' | 'job_hunter' | 'power';
  name: string;
  credits: number;
  priceUSD: number;
  tagline: string;
  popular?: boolean;
}

export const CREDIT_PACKAGES: Record<string, CreditPackage> = {
  starter: {
    id: 'starter',
    name: 'Starter Pack',
    credits: 30,
    priceUSD: 4.99,
    tagline: '~3 Bespoke CVs + Cover Letters + ATS Diagnostics'
  },
  job_hunter: {
    id: 'job_hunter',
    name: 'Job Hunter Pack',
    credits: 80,
    priceUSD: 9.99,
    tagline: '~8 Bespoke CVs + Cover Letters + Auto-Fixes',
    popular: true
  },
  power: {
    id: 'power',
    name: 'Power Applicant Pack',
    credits: 200,
    priceUSD: 19.99,
    tagline: '~20 Bespoke CVs + Unlimited Formats & Iterations'
  }
};

interface CreateCheckoutBody {
  packId: 'starter' | 'job_hunter' | 'power';
}

interface DirectPurchaseBody {
  packId: 'starter' | 'job_hunter' | 'power';
}

export default async function paymentRoutes(fastify: FastifyInstance) {

  // GET /api/payments/packages - Public list of available credit packages
  fastify.get('/packages', async () => {
    return {
      packages: Object.values(CREDIT_PACKAGES)
    };
  });

  // POST /api/payments/create-checkout - Initiate payment session
  fastify.post('/create-checkout', async (request: FastifyRequest<{ Body: CreateCheckoutBody }>, reply: FastifyReply) => {
    const user = await authenticate(request, reply);
    const { packId } = request.body || {};

    const pack = CREDIT_PACKAGES[packId];
    if (!pack) {
      return reply.status(400).send({ error: 'Invalid credit package selected.' });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeKey) {
      // In development or when Stripe is not yet configured, return direct fulfillment capability
      return {
        mode: 'direct_fulfill',
        pack,
        message: 'Direct fulfillment mode active. Proceed to complete purchase.'
      };
    }

    try {
      // Dynamic Stripe checkout session creation
      const appUrl = process.env.APP_URL || 'http://localhost:5173';
      const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeKey}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          'success_url': `${appUrl}?payment_status=success&session_id={CHECKOUT_SESSION_ID}`,
          'cancel_url': `${appUrl}?payment_status=cancelled`,
          'client_reference_id': user.id,
          'customer_email': user.email,
          'mode': 'payment',
          'line_items[0][price_data][currency]': 'usd',
          'line_items[0][price_data][product_data][name]': `JD2CV - ${pack.name} (${pack.credits} Credits)`,
          'line_items[0][price_data][product_data][description]': pack.tagline,
          'line_items[0][price_data][unit_amount]': Math.round(pack.priceUSD * 100).toString(),
          'line_items[0][quantity]': '1',
          'metadata[userId]': user.id,
          'metadata[packId]': pack.id,
          'metadata[credits]': pack.credits.toString()
        }).toString()
      });

      const session = await stripeRes.json();
      if (!stripeRes.ok) {
        throw new Error(session.error?.message || 'Failed to create Stripe checkout session');
      }

      return {
        mode: 'stripe',
        checkoutUrl: session.url,
        sessionId: session.id
      };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: err.message || 'Payment provider error' });
    }
  });

  // POST /api/payments/complete-purchase - Fulfill credits (Direct fulfillment & Development mode)
  fastify.post('/complete-purchase', async (request: FastifyRequest<{ Body: DirectPurchaseBody }>, reply: FastifyReply) => {
    const user = await authenticate(request, reply);
    const { packId } = request.body || {};

    const pack = CREDIT_PACKAGES[packId];
    if (!pack) {
      return reply.status(400).send({ error: 'Invalid credit package selected.' });
    }

    try {
      // 1. Try atomic add_credits procedure
      let newBalance = user.credits + pack.credits;
      try {
        const { data, error } = await supabaseAdmin.rpc('add_credits', {
          p_user_id: user.id,
          p_amount: pack.credits,
          p_action: `pack_${pack.id}`,
          p_set_pro: true
        });

        if (!error && data && data.success) {
          newBalance = data.new_balance;
        } else {
          throw new Error('RPC add_credits fallback');
        }
      } catch {
        // Direct table update fallback
        await supabaseAdmin
          .from('profiles')
          .update({
            credits_balance: newBalance,
            plan: 'pro'
          })
          .eq('id', user.id);

        await supabaseAdmin
          .from('credit_transactions')
          .insert({
            user_id: user.id,
            amount: pack.credits,
            balance_after: newBalance,
            action: `purchase_${pack.id}`,
            metadata: { priceUSD: pack.priceUSD, packName: pack.name }
          });
      }

      return {
        success: true,
        creditsAdded: pack.credits,
        newBalance,
        plan: 'pro',
        message: `Successfully added ${pack.credits} credits! You are now on the Pro tier.`
      };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: err.message || 'Failed to complete credit purchase' });
    }
  });

  // POST /api/payments/webhook - Stripe & Lemon Squeezy Webhook Handler
  fastify.post('/webhook', async (request: FastifyRequest, reply: FastifyReply) => {
    const payload = request.body as any;

    try {
      // Handle Stripe checkout.session.completed event
      if (payload?.type === 'checkout.session.completed') {
        const session = payload.data?.object;
        const userId = session?.client_reference_id || session?.metadata?.userId;
        const credits = parseInt(session?.metadata?.credits || '80', 10);
        const packId = session?.metadata?.packId || 'job_hunter';

        if (userId) {
          await supabaseAdmin.rpc('add_credits', {
            p_user_id: userId,
            p_amount: credits,
            p_action: `stripe_webhook_${packId}`,
            p_set_pro: true
          });
        }
      }

      return { received: true };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(400).send({ error: 'Webhook processing error' });
    }
  });
}
