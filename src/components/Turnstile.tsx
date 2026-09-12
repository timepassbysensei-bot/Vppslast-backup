import { useEffect, useRef } from "react";
import { env, isTurnstileConfigured } from "@/lib/env";

type TurnstileApi = {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string;
      callback: (token: string) => void;
      "error-callback"?: () => void;
      "expired-callback"?: () => void;
      theme?: "auto" | "light" | "dark";
    },
  ) => string;
  remove: (id: string) => void;
  reset: (id?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("turnstile_load_failed"));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

// Renders a Cloudflare Turnstile widget and reports the token upward. When no
// site key is configured, it renders nothing (the server function will report
// that protection is unavailable).
export function Turnstile({ onToken }: { onToken: (token: string | undefined) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    if (!isTurnstileConfigured) return;
    let cancelled = false;

    void loadScript()
      .then(() => {
        if (cancelled || !ref.current || !window.turnstile) return;
        widgetId.current = window.turnstile.render(ref.current, {
          sitekey: env.turnstileSiteKey,
          callback: (token) => onToken(token),
          "error-callback": () => onToken(undefined),
          "expired-callback": () => onToken(undefined),
          theme: "light",
        });
      })
      .catch(() => onToken(undefined));

    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetId.current);
        } catch {
          /* ignore */
        }
        widgetId.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isTurnstileConfigured) return null;
  return <div ref={ref} className="my-2" />;
}
