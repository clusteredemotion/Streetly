import { useEffect, useRef, useId } from "react";

declare global {
  interface Window {
    grecaptcha?: {
      render: (
        container: HTMLElement,
        params: { sitekey: string; callback: (token: string) => void; "expired-callback"?: () => void }
      ) => number;
      reset: (widgetId?: number) => void;
    };
    __recaptchaOnLoad?: () => void;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadRecaptchaScript(): Promise<void> {
  if (window.grecaptcha) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve) => {
    window.__recaptchaOnLoad = () => resolve();
    const script = document.createElement("script");
    script.src = "https://www.google.com/recaptcha/api.js?onload=__recaptchaOnLoad&render=explicit";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  });
  return scriptPromise;
}

interface RecaptchaWidgetProps {
  onVerify: (token: string | null) => void;
}

export function RecaptchaWidget({ onVerify }: RecaptchaWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);
  const id = useId();
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;
    let cancelled = false;
    loadRecaptchaScript().then(() => {
      if (cancelled || !containerRef.current || !window.grecaptcha) return;
      if (widgetIdRef.current === null) {
        widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => onVerify(token),
          "expired-callback": () => onVerify(null),
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [siteKey, onVerify]);

  if (!siteKey) {
    return (
      <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
        reCAPTCHA is not configured.
      </div>
    );
  }

  return <div ref={containerRef} id={`recaptcha-${id}`} />;
}
