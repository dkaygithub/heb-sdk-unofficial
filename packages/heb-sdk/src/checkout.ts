import { persistedQuery, type GraphQLResponse } from './api.js';
import type { HEBSession } from './types.js';

export interface CheckoutResult {
  success: boolean;
  errors: string[];
  raw: unknown;
}

export interface CommitCheckoutResult {
  success: boolean;
  orderId: string | null;
  errors: string[];
  raw: unknown;
}

function extractErrors(res: GraphQLResponse<unknown>): string[] {
  return res.errors?.map(e => e.message) ?? [];
}

/**
 * Begin checkout for the current cart.
 *
 * Validates the cart, reserved timeslot, and payment method. Does NOT
 * place the order — call {@link commitCheckout} after reviewing.
 */
export async function checkoutCart(session: HEBSession): Promise<CheckoutResult> {
  const res = await persistedQuery<unknown>(session, 'checkoutCart', {});
  const errors = extractErrors(res);
  return {
    success: errors.length === 0,
    errors,
    raw: res.data,
  };
}

/**
 * Commit checkout and place the order.
 *
 * Charges the default payment method on file and creates the order.
 *
 * @param session - Active HEB session
 * @param tosToken - Terms-of-service acknowledgement token (default: "TEST_TOKEN")
 */
export async function commitCheckout(
  session: HEBSession,
  tosToken = 'TEST_TOKEN',
): Promise<CommitCheckoutResult> {
  const res = await persistedQuery<Record<string, any>>(
    session,
    'commitCheckout',
    { tosToken },
  );
  const errors = extractErrors(res);
  const data: any = res.data?.commitCheckout ?? res.data ?? {};
  const orderId: string | null =
    data?.orderId ??
    data?.order?.orderId ??
    data?.confirmation?.orderId ??
    null;

  return {
    success: errors.length === 0,
    orderId,
    errors,
    raw: res.data,
  };
}
