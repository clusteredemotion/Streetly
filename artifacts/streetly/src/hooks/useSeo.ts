import { useEffect } from "react";

interface SeoOptions {
  title?: string;
  description?: string;
  canonicalPath?: string;
  ogImage?: string;
  ogType?: string;
  noIndex?: boolean;
  jsonLd?: Record<string, unknown>;
}

const SITE_NAME = "Streetly";
const SITE_URL = "https://mystreetly.app";
const DEFAULT_OG_IMAGE = `${SITE_URL}/opengraph.jpg`;

function setMeta(name: string, content: string, attr: "name" | "property" = "name") {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href: string) {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function setJsonLd(data: Record<string, unknown>): () => void {
  const existing = document.querySelector('script[data-streetly-ld]');
  if (existing) existing.remove();
  const script = document.createElement("script");
  script.setAttribute("type", "application/ld+json");
  script.setAttribute("data-streetly-ld", "true");
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
  return () => {
    script.remove();
  };
}

export function useSeo({
  title,
  description,
  canonicalPath,
  ogImage,
  ogType = "website",
  noIndex = false,
  jsonLd,
}: SeoOptions) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Discover Every Business, Every Street`;
    document.title = fullTitle;

    const desc = description ?? "Streetly is the world's street-by-street business discovery platform. Find local businesses anywhere, explore streets and neighborhoods.";
    const canonical = canonicalPath ? `${SITE_URL}${canonicalPath}` : SITE_URL;
    const image = ogImage ?? DEFAULT_OG_IMAGE;

    setMeta("description", desc);
    setMeta("robots", noIndex ? "noindex, nofollow" : "index, follow");

    setMeta("og:title", fullTitle, "property");
    setMeta("og:description", desc, "property");
    setMeta("og:type", ogType, "property");
    setMeta("og:url", canonical, "property");
    setMeta("og:image", image, "property");
    setMeta("og:site_name", SITE_NAME, "property");

    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", desc);
    setMeta("twitter:image", image);

    setCanonical(canonical);

    let cleanup: (() => void) | undefined;
    if (jsonLd) {
      cleanup = setJsonLd(jsonLd);
    }

    return () => {
      cleanup?.();
    };
  }, [title, description, canonicalPath, ogImage, ogType, noIndex, jsonLd]);
}
