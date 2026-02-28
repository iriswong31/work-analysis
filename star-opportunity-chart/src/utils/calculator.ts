import { PositionResult, PositionTier } from "@/types";

const TIER_RATIOS = [0.2, 0.3, 0.5]; // 20%, 30%, 50%

export function calculatePositions(
  totalAmount: number,
  initialPrice: number,
  dropPercentage: number
): PositionResult {
  const tiers: PositionTier[] = [];
  let currentPrice = initialPrice;

  for (let i = 0; i < 3; i++) {
    if (i > 0) {
      currentPrice = currentPrice * (1 - dropPercentage / 100);
    }

    const ratio = TIER_RATIOS[i];
    const amount = totalAmount * ratio;
    const shares = Math.floor(amount / currentPrice / 100) * 100; // 按手计算，向下取整
    const actualAmount = shares * currentPrice;

    tiers.push({
      tier: i + 1,
      triggerPrice: Number(currentPrice.toFixed(2)),
      ratio,
      amount: Number(amount.toFixed(2)),
      shares,
    });
  }

  return {
    totalAmount,
    initialPrice,
    dropPercentage,
    tiers,
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("zh-CN").format(value);
}
