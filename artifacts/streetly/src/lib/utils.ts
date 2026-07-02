import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { setAuthTokenGetter } from "@workspace/api-client-react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace("NGN", "₦");
}

export function formatLocalCurrency(currencyCode: string, amount: number) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: amount < 10 ? 2 : 0,
      maximumFractionDigits: amount < 10 ? 2 : 0,
    }).format(amount);
  } catch {
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
}

export function getLocalConversionText(
  ngnAmount: number,
  geo?: { currencyCode: string; ngnToLocalRate?: number | null } | null,
): string {
  if (!geo || !geo.ngnToLocalRate || geo.currencyCode === "NGN") return "";
  const converted = ngnAmount * geo.ngnToLocalRate;
  return `≈ ${formatLocalCurrency(geo.currencyCode, converted)}`;
}

export function formatCurrencyWithConversion(
  ngnAmount: number,
  geo?: { currencyCode: string; ngnToLocalRate?: number | null } | null,
) {
  const base = formatCurrency(ngnAmount);
  const converted = getLocalConversionText(ngnAmount, geo);
  return converted ? `${base} (${converted})` : base;
}

export function initApi() {
  setAuthTokenGetter(() => {
    return localStorage.getItem("streetly_token");
  });
}
