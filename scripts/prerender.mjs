// Post-build prerender: writes per-route static HTML snapshots with correct
// SEO metadata (title, description, canonical, Open Graph), plus robots.txt and
// sitemap.xml. This is a dependency-free, credential-free step: it injects
// meta only. The React SPA still hydrates and localises content at runtime.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dist = join(__dirname, "..", "dist");
const siteUrl = (process.env.VITE_SITE_URL || "").replace(/\/+$/, "");
const SCHOOL = "View Point Public School";
const DESC = "Official website of View Point Public School.";

const ROUTES = [
  { path: "/", title: "" },
  { path: "/about", title: "About" },
  { path: "/academics", title: "Academics" },
  { path: "/notices", title: "Notices" },
  { path: "/class-notices", title: "Class Information" },
  { path: "/homework", title: "Homework" },
  { path: "/calendar", title: "Calendar" },
  { path: "/achievements", title: "Achievements" },
  { path: "/birthdays", title: "Birthdays" },
  { path: "/gallery", title: "Gallery" },
  { path: "/resources", title: "Resources" },
  { path: "/admissions", title: "Admissions" },
  { path: "/contact", title: "Contact" },
  { path: "/privacy", title: "Privacy" },
  { path: "/terms", title: "Terms" },
  { path: "/accessibility", title: "Accessibility" },
];

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function buildHead(route) {
  const fullTitle = route.title ? `${route.title} — ${SCHOOL}` : SCHOOL;
  const canonical = siteUrl ? `${siteUrl}${route.path === "/" ? "/" : route.path}` : "";
  const tags = [
    `<meta name="description" content="${escapeHtml(DESC)}" />`,
    `<meta name="robots" content="index, follow" />`,
    canonical ? `<link rel="canonical" href="${escapeHtml(canonical)}" />` : "",
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${escapeHtml(SCHOOL)}" />`,
    `<meta property="og:title" content="${escapeHtml(fullTitle)}" />`,
    `<meta property="og:description" content="${escapeHtml(DESC)}" />`,
    canonical ? `<meta property="og:url" content="${escapeHtml(canonical)}" />` : "",
  ].filter(Boolean);
  return { fullTitle, tags };
}

async function run() {
  if (!existsSync(dist)) {
    console.error("prerender: dist/ not found — run vite build first");
    process.exit(1);
  }
  const template = await readFile(join(dist, "index.html"), "utf8");

  for (const route of ROUTES) {
    const { fullTitle, tags } = buildHead(route);
    let html = template
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(fullTitle)}</title>`)
      .replace(/<meta name="description"[^>]*>/, "");
    html = html.replace("</head>", `  ${tags.join("\n  ")}\n</head>`);

    const outDir = route.path === "/" ? dist : join(dist, route.path.replace(/^\//, ""));
    if (route.path !== "/") await mkdir(outDir, { recursive: true });
    await writeFile(join(outDir, "index.html"), html, "utf8");
  }

  // sitemap.xml (public routes only)
  const urls = ROUTES.map((r) => {
    const loc = siteUrl ? `${siteUrl}${r.path === "/" ? "/" : r.path}` : r.path;
    return `  <url><loc>${escapeHtml(loc)}</loc></url>`;
  }).join("\n");
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  await writeFile(join(dist, "sitemap.xml"), sitemap, "utf8");

  // robots.txt (absolute sitemap when the site URL is known)
  const robots = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /admin/",
    "",
    siteUrl ? `Sitemap: ${siteUrl}/sitemap.xml` : "Sitemap: /sitemap.xml",
    "",
  ].join("\n");
  await writeFile(join(dist, "robots.txt"), robots, "utf8");

  console.log(`prerender: wrote ${ROUTES.length} route snapshots, sitemap.xml, robots.txt`);
}

run().catch((err) => {
  console.error("prerender failed:", err);
  process.exit(1);
});
