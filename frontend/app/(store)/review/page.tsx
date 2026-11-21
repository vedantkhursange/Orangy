import { pageMeta } from "@/lib/seo";
import { Suspense } from "react";
import ReviewLanding from "./ReviewLanding";

export const metadata = pageMeta({
  title: "Rate your oranges",
  description: "Tell us how your Orange Express oranges tasted. No account needed.",
  path: "/review",
});

export default function ReviewPage() {
  return (
    <Suspense>
      <ReviewLanding />
    </Suspense>
  );
}
