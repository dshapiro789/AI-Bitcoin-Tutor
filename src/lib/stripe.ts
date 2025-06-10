import { loadStripe } from '@stripe/stripe-js';

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

if (!stripePublicKey) {
  console.error('Missing VITE_STRIPE_PUBLIC_KEY environment variable');
  throw new Error('Missing Stripe public key');
}

console.log('Initializing Stripe with public key:', stripePublicKey.substring(0, 20) + '...');

export const stripe = await loadStripe(stripePublicKey);

if (!stripe) {
  console.error('Failed to initialize Stripe');
  throw new Error('Failed to initialize Stripe');
}

console.log('Stripe initialized successfully');