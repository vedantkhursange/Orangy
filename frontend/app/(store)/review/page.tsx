import type { Metadata } from "next";
import { Suspense } from "react";
import ReviewLanding from "./ReviewLanding";

export const metadata: Metadata = {
  title: "Rate your oranges — Orange Express",
  description: "Tell us how your Orange Express oranges tasted. No account needed.",
  alternates: { canonical: "/review" },
};

export default function ReviewPage() {
  return (
    <Suspense>
      <ReviewLanding />
    </Suspense>
  );
}
