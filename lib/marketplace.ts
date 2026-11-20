export const categories = [
  "All",
  "OTT",
  "Music",
  "AI Tools",
  "Productivity",
  "Learning",
  "Games",
] as const;
export type Category = (typeof categories)[number];
export function matchesCatalog(
  item: { name: string; tagline: string; category: string },
  search: string,
  category: string,
) {
  return (
    (category === "All" || item.category === category) &&
    `${item.name} ${item.tagline}`.toLowerCase().includes(search.trim().toLowerCase())
  );
}
export function cartTotal(plans: { id: string; price: number }[], ids: string[]) {
  return plans.filter((p) => ids.includes(p.id)).reduce((sum, p) => sum + p.price, 0);
}
export function whatsappUrl(number: string, message: string) {
  const digits = number.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : null;
}
export function pageMeta(title: string, description: string) {
  return {
    meta: [
      { title: `${title} — SplitFlix` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} — SplitFlix` },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  };
}
