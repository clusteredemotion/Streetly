import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react"
import { Capacitor } from "@capacitor/core"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// When packaged as a native Capacitor app, the WebView loads the bundled
// app shell from a local scheme (not the production domain), so relative
// `/api/...` requests must be pointed at the live API server explicitly.
// In the browser build the shell and API share an origin, so this stays "".
const NATIVE_API_BASE = "https://mystreetly.app";

export function getApiBase(): string {
  return Capacitor.isNativePlatform() ? NATIVE_API_BASE : "";
}

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
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
  setBaseUrl(getApiBase() || null);
}
