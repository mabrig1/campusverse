/** Same scoring rules the original mock endpoint used — now fed from real, persisted user fields. */
export function computeTrustScore(user, tradesCount = 0) {
  let score = 25;

  if (user.phoneVerified) score += 10;
  if (user.emailVerified) score += 10;
  if (user.studentIdVerified) score += 15;
  if (user.selfieVerified) score += 15;
  if (user.ninVerified) score += 10;
  if (user.bvnVerified) score += 15;

  score += Math.min(20, Math.max(0, tradesCount) * 2);
  score -= Math.max(0, user.disputeCount) * 8;

  score = Math.max(10, Math.min(100, score));

  let level = "Unverified Student";
  if (score >= 50 && score < 75) level = "Verified Peer";
  if (score >= 75 && score < 90) level = "Trusted Trader";
  if (score >= 90) level = "Elite Campus Partner";

  return { trustScore: score, level };
}
