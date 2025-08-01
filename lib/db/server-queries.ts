'use server';

import { db } from './index';
import { user } from './schema';
import { eq, sql } from 'drizzle-orm';

export async function decrementUserBalance(userId: string, amount: number) {
  const result = await db
    .update(user)
    .set({
      balance: sql`${user.balance} - ${amount}`,
    } as any)
    .where(eq(user.id, userId))
    .returning({ balance: user.balance });

  return result[0];
}
