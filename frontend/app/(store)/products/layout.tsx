import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Shop Fresh Oranges & Orange Juice Online",
  description:
    "Shop farm-fresh oranges by the dozen or crate, and cold-pressed orange juice, straight from Khursange Farms in Pandhurna. Hand-picked, no middlemen, delivered to your door.",
  path: "/products",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
