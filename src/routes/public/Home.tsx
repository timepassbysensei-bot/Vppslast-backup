import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Bell, CalendarDays, Cake, Award, Images, GraduationCap, Phone, Mail, MapPin, Check, ArrowRight } from "lucide-react";
import { Seo } from "@/components/Seo";
import { SchoolJsonLd } from "@/components/JsonLd";
import { Bilingual } from "@/components/Bilingual";
import { TimingsToday } from "@/components/TimingsToday";
import { useLang } from "@/hooks/useLang";
import { pickText } from "@/lib/content";
import { formatDate } from "@/lib/time";
import {
  useSettings,
  useBranding,
  usePublicNotices,
  useBirthdaysToday,
  useCurrentSpotlight,
  useUpcomingEvents,
  useGallery,
} from "@/hooks/public";

const QUICK_LINKS = [
  { to: "/notices", key: "nav.notices", Icon: Bell },
  { to: "/homework", key: "nav.homework", Icon: GraduationCap },
  { to: "/calendar", key: "nav.calendar", Icon: CalendarDays },
  { to: "/gallery", key: "nav.gallery", Icon: Images },
  { to: "/admissions", key: "nav.admissions", Icon: ArrowRight },
  { to: "/contact", key: "nav.contact", Icon: Phone },
];

export function Home() {
  const { t } = useTranslation();
  const lang = useLang();
  const { data: settings } = useSettings();
  const { data: branding } = useBranding();
  const { data: notices } = usePublicNotices(3);
  const { data: birthdays } = useBirthdaysToday();
  const { data: spotlight } = useCurrentSpotlight();
  const { data: events } = useUpcomingEvents(4);
  const { data: gallery } = useGallery();

  const name = pickText(settings?.name_en ?? t("common.schoolName"), settings?.name_hi, lang).value;
  const tagline = pickText(settings?.tagline_en, settings?.tagline_hi, lang).value;
  const intro = pickText(settings?.intro_en, settings?.intro_hi, lang).value;
  const hero = branding?.hero;
  const principalMsg = pickText(settings?.principal_message_en, settings?.principal_message_hi, lang);
  const facilities = settings?.facilities ?? [];
  const galleryPreview = (gallery ?? []).slice(0, 6);

  return (
    <div className="container-page py-4 sm:py-6 flex flex-col gap-8">
      <Seo path="/" description={intro || undefined} image={branding?.og_image?.public_url ?? undefined} />
      <SchoolJsonLd settings={settings} logoUrl={branding?.logo?.public_url} />

      {/* 2-6. Hero */}
      <section aria-labelledby="hero-heading" className="card overflow-hidden">
        {hero?.public_url ? (
          <img
            src={hero.public_url}
            alt={pickText(hero.alt_en, hero.alt_hi, lang).value || t("home.heroAlt")}
            className="w-full h-52 sm:h-80 object-cover"
            width={1600}
            height={900}
          />
        ) : (
          <div className="w-full h-40 sm:h-56 bg-navy" aria-hidden="true" />
        )}
        <div className="p-5 sm:p-7">
          <h1 id="hero-heading" className="text-2xl sm:text-4xl font-bold">
            {name}
          </h1>
          {lang === "en" && settings?.name_hi ? <p className="text-ink/60 mt-1">{settings.name_hi}</p> : null}
          {tagline ? <p className="text-lg text-ink/80 mt-2">{tagline}</p> : null}
          {intro ? <p className="text-ink/70 mt-2 max-w-2xl">{intro}</p> : null}
          <div className="flex flex-wrap gap-2 mt-4">
            <Link to="/notices" className="btn btn-primary">
              {t("home.primaryCtaNotices")}
            </Link>
            <Link to="/admissions" className="btn btn-amber">
              {t("home.primaryCtaAdmissions")}
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Quick links */}
      <section aria-labelledby="quick-heading">
        <h2 id="quick-heading" className="text-xl sm:text-2xl font-bold mb-3">
          {t("home.quickLinks")}
        </h2>
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {QUICK_LINKS.map(({ to, key, Icon }) => (
            <li key={to}>
              <Link to={to} className="card p-4 flex items-center gap-3 hover:shadow-md min-h-touch">
                <Icon aria-hidden="true" className="text-amber" />
                <span className="font-semibold text-navy">{t(key)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* 7. Notice preview */}
      <section aria-labelledby="notice-heading">
        <div className="flex items-center justify-between mb-3">
          <h2 id="notice-heading" className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Bell aria-hidden="true" /> {t("home.noticePreview")}
          </h2>
          <Link to="/notices" className="text-navy-600 underline text-sm">
            {t("home.viewAll")}
          </Link>
        </div>
        {(notices ?? []).length === 0 ? (
          <div className="card p-4 text-ink/60">{t("teacher.noNotices")}</div>
        ) : (
          <ul className="grid gap-3">
            {(notices ?? []).map((n) => (
              <li key={n.id} className="card p-4">
                <div className="flex items-center gap-2">
                  {n.urgent ? <span className="badge text-danger border-danger/30">!</span> : null}
                  <Bilingual as="h3" en={n.title_en} hi={n.title_hi} className="font-semibold text-navy" showFallbackNote={false} />
                </div>
                <Bilingual as="p" en={n.summary_en} hi={n.summary_hi} className="text-sm text-ink/70 mt-1" showFallbackNote={false} />
                <p className="text-xs text-ink/50 mt-1">{formatDate(n.effective_at, lang)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 8. Today's timings */}
      <TimingsToday />

      {/* 9. Today's birthdays (hidden when none) */}
      {(birthdays ?? []).length > 0 ? (
        <section aria-labelledby="bday-heading">
          <h2 id="bday-heading" className="text-xl sm:text-2xl font-bold mb-3 flex items-center gap-2">
            <Cake aria-hidden="true" /> {t("home.birthdayTitle")}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {(birthdays ?? []).map((b, i) => {
              const greeting = pickText(b.greeting_en, b.greeting_hi, lang).value || t("home.birthdayWish");
              return (
                <div key={i} className="card p-4 flex items-center gap-3">
                  {b.photo_url ? (
                    <img src={b.photo_url} alt="" className="h-14 w-14 rounded-full object-cover" width={56} height={56} />
                  ) : (
                    <span className="h-14 w-14 rounded-full bg-amber/20 grid place-items-center text-amber" aria-hidden="true">
                      <Cake />
                    </span>
                  )}
                  <div>
                    <p className="font-semibold text-navy">{b.display_name}</p>
                    {b.class_code ? (
                      <p className="text-xs text-ink/60">
                        {t("common.class")} {b.class_code}
                        {b.section ? ` · ${b.section}` : ""}
                      </p>
                    ) : null}
                    <p className="text-sm text-ink/80">{greeting}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* 10. Student of the Month (hidden when none) */}
      {spotlight ? (
        <section aria-labelledby="som-heading">
          <h2 id="som-heading" className="text-xl sm:text-2xl font-bold mb-3 flex items-center gap-2">
            <Award aria-hidden="true" /> {t("home.studentOfMonth")}
          </h2>
          <div className="card p-4 flex flex-col sm:flex-row gap-4 items-start">
            {spotlight.photo_url ? (
              <img src={spotlight.photo_url} alt="" className="h-28 w-28 rounded-card object-cover" width={112} height={112} />
            ) : null}
            <div>
              <p className="font-bold text-navy text-lg">{spotlight.student_name}</p>
              {spotlight.class_code ? (
                <p className="text-sm text-ink/60">
                  {t("common.class")} {spotlight.class_code}
                  {spotlight.section ? ` · ${spotlight.section}` : ""}
                </p>
              ) : null}
              <Bilingual as="p" en={spotlight.description_en} hi={spotlight.description_hi} className="mt-1 text-ink/80" />
            </div>
          </div>
        </section>
      ) : null}

      {/* 11. Upcoming events */}
      {(events ?? []).length > 0 ? (
        <section aria-labelledby="events-heading">
          <h2 id="events-heading" className="text-xl sm:text-2xl font-bold mb-3 flex items-center gap-2">
            <CalendarDays aria-hidden="true" /> {t("home.upcomingEvents")}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {(events ?? []).map((e) => (
              <li key={e.id} className="card p-4">
                <Bilingual as="h3" en={e.title_en} hi={e.title_hi} className="font-semibold text-navy" showFallbackNote={false} />
                <p className="text-sm text-ink/60 mt-1">
                  {formatDate(e.start_date, lang)}
                  {e.end_date ? ` – ${formatDate(e.end_date, lang)}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* 12. Gallery preview */}
      {galleryPreview.length > 0 ? (
        <section aria-labelledby="gallery-heading">
          <div className="flex items-center justify-between mb-3">
            <h2 id="gallery-heading" className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <Images aria-hidden="true" /> {t("home.galleryPreview")}
            </h2>
            <Link to="/gallery" className="text-navy-600 underline text-sm">
              {t("home.viewAll")}
            </Link>
          </div>
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {galleryPreview.map((g) => (
              <li key={g.id}>
                <img
                  src={g.public_url ?? ""}
                  alt={pickText(g.title_en, g.title_hi, lang).value}
                  className="w-full h-28 sm:h-40 object-cover rounded-card"
                  loading="lazy"
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* 13. Facilities */}
      {facilities.length > 0 ? (
        <section aria-labelledby="facilities-heading">
          <h2 id="facilities-heading" className="text-xl sm:text-2xl font-bold mb-3">
            {t("home.facilities")}
          </h2>
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {facilities.map((f) => (
              <li key={f.key} className="card p-3 flex items-center gap-2">
                <Check aria-hidden="true" className="text-success" size={18} />
                <span>{pickText(f.name_en, f.name_hi, lang).value}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* 14. Principal's message */}
      <section aria-labelledby="principal-heading">
        <h2 id="principal-heading" className="text-xl sm:text-2xl font-bold mb-3">
          {t("home.principalMessage")}
        </h2>
        <div className="card p-4 flex gap-4 items-start">
          {branding?.principal_photo?.public_url ? (
            <img
              src={branding.principal_photo.public_url}
              alt=""
              className="h-20 w-20 rounded-full object-cover shrink-0"
              width={80}
              height={80}
            />
          ) : null}
          <div>
            {principalMsg.value ? (
              <Bilingual as="p" en={settings?.principal_message_en} hi={settings?.principal_message_hi} className="text-ink/80" />
            ) : (
              <p className="text-ink/70 italic">{t("home.principalMessagePending")}</p>
            )}
            {settings?.principal_name ? <p className="mt-2 font-semibold text-navy">— {settings.principal_name}</p> : null}
          </div>
        </div>
      </section>

      {/* 15. Contact (no WhatsApp) */}
      <section aria-labelledby="contact-heading">
        <h2 id="contact-heading" className="text-xl sm:text-2xl font-bold mb-3">
          {t("home.contact")}
        </h2>
        <div className="card p-4 grid gap-2 sm:grid-cols-3">
          {settings?.phone ? (
            <a className="flex items-center gap-2" href={`tel:${settings.phone}`}>
              <Phone aria-hidden="true" className="text-navy" size={18} /> {settings.phone}
            </a>
          ) : null}
          {settings?.email ? (
            <a className="flex items-center gap-2" href={`mailto:${settings.email}`}>
              <Mail aria-hidden="true" className="text-navy" size={18} /> {settings.email}
            </a>
          ) : null}
          {pickText(settings?.address_en, settings?.address_hi, lang).value ? (
            <span className="flex items-start gap-2">
              <MapPin aria-hidden="true" className="text-navy mt-0.5" size={18} />
              {pickText(settings?.address_en, settings?.address_hi, lang).value}
            </span>
          ) : null}
        </div>
        <p className="text-sm text-ink/70 mt-2">{t("fees.message")}</p>
      </section>
    </div>
  );
}
