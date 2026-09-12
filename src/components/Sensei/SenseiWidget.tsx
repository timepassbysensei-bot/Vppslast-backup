import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Send } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Turnstile } from "@/components/Turnstile";
import { callPublic, FunctionError } from "@/lib/functions";
import { useChatbotSettings } from "@/hooks/public";
import { useLang } from "@/hooks/useLang";

type Msg = { role: "user" | "bot"; text: string; disclaimer?: string; quickLinks?: boolean };

type ChatResponse = { answer: string; disclaimer: string; showQuickLinks?: boolean };

export function SenseiWidget() {
  const { t } = useTranslation();
  const lang = useLang();
  const navigate = useNavigate();
  const { data: settings } = useChatbotSettings();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tokenRef = useRef<string | undefined>(undefined);

  const maxChars = settings?.max_input_chars ?? 500;
  const enabled = settings ? settings.enabled : true;

  function openWidget(): void {
    setOpen(true);
    if (messages.length === 0 && settings) {
      setMessages([{ role: "bot", text: lang === "hi" ? settings.greeting_hi : settings.greeting_en }]);
    }
  }

  async function send(): Promise<void> {
    const text = input.trim();
    if (!text || busy) return;
    if (text.length > maxChars) {
      setError(t("sensei.inputTooLong"));
      return;
    }
    setError(null);
    setBusy(true);
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    try {
      const res = await callPublic<ChatResponse>("sensei-chat", {
        message: text,
        lang,
        turnstileToken: tokenRef.current,
      });
      setMessages((m) => [
        ...m,
        { role: "bot", text: res.answer, disclaimer: res.disclaimer, quickLinks: res.showQuickLinks },
      ]);
    } catch (err) {
      const msg = err instanceof FunctionError ? err.message : t("sensei.unavailable");
      setMessages((m) => [...m, { role: "bot", text: msg, quickLinks: true }]);
    } finally {
      setBusy(false);
    }
  }

  const quickLinks = [
    { label: t("sensei.quickContact"), to: "/contact" },
    { label: t("sensei.quickNotices"), to: "/notices" },
    { label: t("sensei.quickHomework"), to: "/homework" },
    { label: t("sensei.quickAdmissions"), to: "/admissions" },
  ];

  if (!enabled) return null;

  return (
    <>
      <button
        type="button"
        onClick={openWidget}
        aria-label={t("sensei.open")}
        className="btn btn-primary fixed bottom-4 right-4 z-40 rounded-full h-14 w-14 shadow-card p-0"
      >
        <MessageCircle aria-hidden="true" />
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} title={t("sensei.title")}>
        <div className="flex flex-col gap-3">
          <div className="max-h-[45vh] overflow-auto flex flex-col gap-2" aria-live="polite">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "self-end max-w-[85%]" : "self-start max-w-[90%]"}>
                <div
                  className={`rounded-card px-3 py-2 text-sm ${
                    m.role === "user" ? "bg-navy text-white" : "bg-surface text-ink"
                  }`}
                >
                  {m.text}
                </div>
                {m.disclaimer ? <p className="text-xs text-ink/50 mt-1">{m.disclaimer}</p> : null}
                {m.quickLinks ? (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {quickLinks.map((q) => (
                      <button
                        key={q.to}
                        type="button"
                        className="btn btn-outline px-3 py-1 text-xs"
                        onClick={() => {
                          setOpen(false);
                          navigate(q.to);
                        }}
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            {busy ? <p className="text-sm text-ink/60">{t("sensei.thinking")}</p> : null}
          </div>

          {error ? (
            <p className="field-error" role="alert">
              {error}
            </p>
          ) : null}

          <Turnstile onToken={(tk) => (tokenRef.current = tk)} />

          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <label htmlFor="sensei-input" className="visually-hidden">
              {t("sensei.placeholder")}
            </label>
            <textarea
              id="sensei-input"
              className="field-input flex-1"
              rows={2}
              maxLength={maxChars}
              placeholder={t("sensei.placeholder")}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
            />
            <Button type="submit" disabled={busy || input.trim().length === 0} aria-label={t("sensei.send")}>
              <Send aria-hidden="true" size={18} />
            </Button>
          </form>
          <p className="text-xs text-ink/50">{settings ? (lang === "hi" ? settings.disclaimer_hi : settings.disclaimer_en) : t("sensei.disclaimer")}</p>
        </div>
      </Dialog>
    </>
  );
}
