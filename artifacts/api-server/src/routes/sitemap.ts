import { Router } from "express";
import { db } from "@workspace/db";
import { businessesTable, vacantPropertiesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const SITE_URL = "https://mystreetly.app";

const STATIC_PAGES = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/businesses", changefreq: "daily", priority: "0.9" },
  { path: "/properties", changefreq: "daily", priority: "0.8" },
  { path: "/explore", changefreq: "weekly", priority: "0.7" },
  { path: "/about", changefreq: "monthly", priority: "0.6" },
  { path: "/contact", changefreq: "monthly", priority: "0.5" },
  { path: "/agents", changefreq: "monthly", priority: "0.5" },
  { path: "/riders/apply", changefreq: "monthly", priority: "0.4" },
  { path: "/auth/login", changefreq: "monthly", priority: "0.3" },
  { path: "/auth/register", changefreq: "monthly", priority: "0.3" },
];

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return new Date().toISOString().split("T")[0];
  const dt = typeof d === "string" ? new Date(d) : d;
  return isNaN(dt.getTime()) ? new Date().toISOString().split("T")[0] : dt.toISOString().split("T")[0];
}

router.get("/sitemap.xml", async (_req, res) => {
  try {
    const businesses = await db
      .select({
        id: businessesTable.id,
        slug: businessesTable.slug,
        createdAt: businessesTable.createdAt,
      })
      .from(businessesTable)
      .where(eq(businessesTable.status, "approved"));

    const properties = await db
      .select({ id: vacantPropertiesTable.id, updatedAt: vacantPropertiesTable.createdAt })
      .from(vacantPropertiesTable)
      .where(eq(vacantPropertiesTable.status, "approved"));

    const urls: string[] = [];

    for (const page of STATIC_PAGES) {
      urls.push(`
  <url>
    <loc>${SITE_URL}${escapeXml(page.path)}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`);
    }

    for (const biz of businesses) {
      const slug = biz.slug ?? String(biz.id);
      urls.push(`
  <url>
    <loc>${SITE_URL}/${escapeXml(slug)}</loc>
    <lastmod>${formatDate(biz.createdAt)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
    }

    for (const prop of properties) {
      urls.push(`
  <url>
    <loc>${SITE_URL}/properties?id=${prop.id}</loc>
    <lastmod>${formatDate(prop.updatedAt)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`);
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}
</urlset>`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(xml);
  } catch (err) {
    res.status(500).json({ error: "Failed to generate sitemap" });
  }
});

export default router;
