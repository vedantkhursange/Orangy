import type { Metadata } from "next";
import { Suspense } from "react";
import TrackOrder from "./TrackOrder";

export const metadata: Metadata = {
  title: "Track your order",
  robots: { index: false },
};

export default function TrackPage() {
  return (
    <Suspense>
      <TrackOrder />
    </Suspense>
  );
}
