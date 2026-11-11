import type { MetadataRoute } from "next";
import { siteUrl } from "./site";

// Everything is public; robots.txt just points crawlers to the sitemap.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
