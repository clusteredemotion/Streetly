import { Router } from "express";

const router = Router();

type GeoInfo = {
  ip: string;
  city: string | null;
  region: string | null;
  country: string | null;
  countryCode: string | null;
  currencyCode: string;
};

type RateInfo = {
  base: string;
  rates: Record<string, number>;
  fetchedAt: number;
};

let rateCache: RateInfo | null = null;
const RATE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

async function getRates(): Promise<RateInfo> {
  if (rateCache && Date.now() - rateCache.fetchedAt < RATE_TTL_MS) {
    return rateCache;
  }
  try {
    const resp = await fetch("https://open.er-api.com/v6/latest/NGN");
    const data = await resp.json();
    if (data && data.result === "success" && data.rates) {
      rateCache = { base: "NGN", rates: data.rates, fetchedAt: Date.now() };
      return rateCache;
    }
  } catch {
    // fall through to stale/empty cache below
  }
  if (rateCache) return rateCache;
  return { base: "NGN", rates: {}, fetchedAt: Date.now() };
}

function extractClientIp(req: any): string {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length > 0) {
    return fwd.split(",")[0].trim();
  }
  return req.ip ?? req.socket?.remoteAddress ?? "";
}

async function lookupGeo(ip: string): Promise<GeoInfo> {
  const isPrivate = !ip || /^(127\.|10\.|192\.168\.|::1|localhost)/.test(ip) || ip.startsWith("::ffff:127.");
  if (isPrivate) {
    return { ip: ip || "unknown", city: null, region: null, country: null, countryCode: null, currencyCode: "USD" };
  }
  try {
    const resp = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,country,countryCode,regionName,city,currency,query`);
    const data = await resp.json();
    if (data && data.status === "success") {
      return {
        ip: data.query ?? ip,
        city: data.city ?? null,
        region: data.regionName ?? null,
        country: data.country ?? null,
        countryCode: data.countryCode ?? null,
        currencyCode: data.currency ?? "USD",
      };
    }
  } catch {
    // ignore and fall back below
  }
  return { ip, city: null, region: null, country: null, countryCode: null, currencyCode: "USD" };
}

// GET /geo/info
router.get("/info", async (req, res) => {
  const ip = extractClientIp(req);
  const geo = await lookupGeo(ip);
  const rates = await getRates();
  const rate = geo.currencyCode === "NGN" ? 1 : rates.rates[geo.currencyCode] ?? null;

  return res.json({
    ip: geo.ip,
    city: geo.city,
    region: geo.region,
    country: geo.country,
    countryCode: geo.countryCode,
    currencyCode: geo.currencyCode,
    ngnToLocalRate: rate,
  });
});

export default router;
