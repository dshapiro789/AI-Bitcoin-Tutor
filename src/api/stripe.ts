import Stripe from 'stripe';

// Note: The createCheckoutSession function has been moved to Supabase Edge Function
// This file now only contains utility functions that might be used elsewhere

export async function createCustomer(email: string) {
  // This function would need to be called from a secure backend
  // For now, customer creation can be handled in the Edge Function if needed
  throw new Error('Customer creation should be handled server-side');
}

export async function handleSubscriptionChange(subscriptionId: string) {
  // This function would need to be called from a secure backend
  // Webhook handling should be implemented in a separate Edge Function
  throw new Error('Subscription changes should be handled server-side via webhooks');
}