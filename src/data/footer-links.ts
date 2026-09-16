export const FOOTER_LINK_FIELDS = [
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/vertex.reva" },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/company/vertex" },
  { key: "twitter", label: "X (Twitter)", placeholder: "https://x.com/vertex" },
] as const;

export type FooterLinkKey = (typeof FOOTER_LINK_FIELDS)[number]["key"];
export type FooterLinks = Record<FooterLinkKey, string>;

export const DEFAULT_FOOTER_LINKS: FooterLinks = {
  instagram: "https://www.instagram.com/vertex.reva/",
  linkedin: "",
  twitter: "",
};
