export type NavItem = { to: string; key: string };

// Primary navigation (header + mobile menu). Order matters.
export const NAV_ITEMS: NavItem[] = [
  { to: "/", key: "nav.home" },
  { to: "/about", key: "nav.about" },
  { to: "/academics", key: "nav.academics" },
  { to: "/notices", key: "nav.notices" },
  { to: "/class-notices", key: "nav.classNotices" },
  { to: "/homework", key: "nav.homework" },
  { to: "/calendar", key: "nav.calendar" },
  { to: "/achievements", key: "nav.achievements" },
  { to: "/birthdays", key: "nav.birthdays" },
  { to: "/gallery", key: "nav.gallery" },
  { to: "/resources", key: "nav.resources" },
  { to: "/admissions", key: "nav.admissions" },
  { to: "/contact", key: "nav.contact" },
];

export const LEGAL_ITEMS: NavItem[] = [
  { to: "/privacy", key: "nav.privacy" },
  { to: "/terms", key: "nav.terms" },
  { to: "/accessibility", key: "nav.accessibility" },
];
