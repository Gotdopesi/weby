import sites from "./sites.config.json";
import { rewrite } from "@vercel/functions";

const hostToSiteId = new Map<string, string>();
for (const site of sites.sites) {
  if (site.deploy === false) continue;
  for (const host of site.hosts) {
    hostToSiteId.set(host.toLowerCase(), site.id);
  }
}

export const config = {
  matcher: ["/((?!api/).*)"],
};

export default function middleware(request: Request) {
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";
  const siteId = hostToSiteId.get(host);
  if (!siteId) return;

  const url = new URL(request.url);
  const pathname = url.pathname;
  const prefix = `/sites/${siteId}`;

  if (pathname.startsWith(prefix)) return;

  const hasFileExtension = /\.[a-z0-9]+$/i.test(pathname);
  const targetPath = hasFileExtension
    ? `${prefix}${pathname}`
    : `${prefix}/index.html`;

  return rewrite(new URL(targetPath, url));
}
