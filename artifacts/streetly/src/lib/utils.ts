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

export function initApi() {
  setAuthTokenGetter(() => {
    return localStorage.getItem("streetly_token");
  });
}
