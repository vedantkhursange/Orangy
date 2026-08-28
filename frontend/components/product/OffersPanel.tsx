"use client";

import { useEffect, useState } from "react";
import { Gift, Percent, ShieldCheck, Truck } from "lucide-react";
import { Card } from "@/components/ui/ui";

const OFFERS = [
  { icon: Percent, text: "10% off on your first order — auto-applied at checkout" },
  { icon: Truck, text: "Free delivery on orders above ₹500" },
  { icon: ShieldCheck, text: "100% organic certified, farm to door" },
  { icon: Gift, text: "Refer a friend — you both get ₹100 off" },
];

const ROTATE_MS = 5000;

/** Flipkart-style auto-rotating offers strip — cycles one offer at a time. */
export default function OffersPanel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % OFFERS.length), ROTATE_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <Card className="mt-5 p-4">
      <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-ink/55">Available offers</p>
      <div className="relative h-11 overflow-hidden">
        {OFFERS.map((offer, i) => {
          const Icon = offer.icon;
          const active = i === index;
          return (
            <div
              key={i}
              aria-hidden={!active}
              className={`absolute inset-0 flex items-center gap-2.5 transition-all duration-500 ease-out ${
                active ? "translate-x-0 opacity-100" : "translate-x-3 opacity-0"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0 text-orange-deep" />
              <span className="text-sm leading-snug text-ink/75">{offer.text}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex gap-1.5">
        {OFFERS.map((_, i) => (
          <button
            key={i}
            aria-label={`Show offer ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-orange" : "w-1.5 bg-ink/15"}`}
          />
        ))}
      </div>
    </Card>
  );
}
