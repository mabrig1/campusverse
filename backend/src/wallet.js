export class InsufficientFundsError extends Error {
  constructor() {
    super("Insufficient wallet balance");
  }
}

/**
 * Atomically debits a wallet, guarding the balance check inside the same
 * UPDATE statement (`balance >= amount`) so concurrent charges against the
 * same wallet can't both pass a stale read and overdraw the balance.
 * Ported from CampusHub's src/lib/wallet.ts.
 */
export async function chargeWallet(db, userId, amount, type, note) {
  const result = await db.wallet.updateMany({
    where: { userId, balance: { gte: amount } },
    data: { balance: { decrement: amount } },
  });
  if (result.count === 0) {
    throw new InsufficientFundsError();
  }

  const wallet = await db.wallet.findUniqueOrThrow({ where: { userId } });
  await db.transaction.create({
    data: { walletId: wallet.id, type, amount, note },
  });
  return wallet;
}

export async function creditWallet(db, userId, amount, type, note) {
  const wallet = await db.wallet.update({
    where: { userId },
    data: { balance: { increment: amount } },
  });
  await db.transaction.create({
    data: { walletId: wallet.id, type, amount, note },
  });
  return wallet;
}
