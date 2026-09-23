export const SOCIAL_LINK_FIELDS = [
  { key: "github", label: "GitHub", placeholder: "https://github.com/username" },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/username" },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/username" },
  { key: "twitter", label: "X (Twitter)", placeholder: "https://x.com/username" },
] as const;

export type SocialLinkKey = (typeof SOCIAL_LINK_FIELDS)[number]["key"];
export type SocialLinks = Record<SocialLinkKey, string>;

export function readSocialLinks(value: unknown): SocialLinks {
  const links = value && typeof value === "object" ? (value as Record<string, unknown>) : {};

  return Object.fromEntries(
    SOCIAL_LINK_FIELDS.map(({ key }) => [key, typeof links[key] === "string" ? links[key] : ""]),
  ) as SocialLinks;
}

export function mergeSocialLinks(existing: unknown, values: SocialLinks): Record<string, string> {
  const links =
    existing && typeof existing === "object" ? { ...(existing as Record<string, string>) } : {};

  for (const { key } of SOCIAL_LINK_FIELDS) {
    const value = values[key].trim();
    if (value) links[key] = value;
    else delete links[key];
  }

  return links;
}
