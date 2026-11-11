import type { MetadataRoute } from "next";
import { releases } from "./changelog/releases";
import { siteUrl } from "./site";

// lastModified = the newest changelog entry, so it only moves when something users can see changed.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = releases[0].date;
  return [
    { url: siteUrl, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/changelog`, lastModified, changeFrequency: "weekly", priority: 0.5 },
  ];
}
