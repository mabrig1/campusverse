// User-entered negotiation estimates only. Does not appraise or verify a device.
export function estimateTopUp(targetPrice, tradeInValue, repairDeduction = 0) {
  const values = [targetPrice, tradeInValue, repairDeduction].map(Number);
  if (values.some(n => !Number.isFinite(n) || n < 0)) return 0;
  return Math.round((values[0] - values[1] + values[2]) * 100) / 100;
}
