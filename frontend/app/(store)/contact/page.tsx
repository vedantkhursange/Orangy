import { MapPin, Navigation } from "lucide-react";
import { Button, Card } from "@/components/ui/ui";

const PLUS_CODE = "JGCC+WCV Sawargaon, Madhya Pradesh";
const MAPS_QUERY = "JGCC%2BWCV+Sawargaon,+Madhya+Pradesh";
const MAPS_EMBED_SRC = `https://www.google.com/maps?q=${MAPS_QUERY}&t=k&z=18&output=embed`;
const MAPS_LINK = `https://www.google.com/maps/search/?api=1&query=${MAPS_QUERY}`;

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-16">
      <p className="text-xs font-semibold uppercase tracking-wider text-orange-deep">Get in touch</p>
      <h1 className="display mt-2 text-3xl font-bold text-ink md:text-4xl">Visit the grove</h1>
      <p className="mt-3 max-w-xl text-ink/60">
        Khursange Farms — where every Orangy order starts. Find us on the map, or reach out directly.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[2fr_3fr]">
        <Card className="h-fit p-6">
          <h2 className="display text-lg font-bold text-ink">Khursange Farms</h2>

          <div className="mt-4 flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-orange-deep" />
            <div>
              <p className="text-sm text-ink/75">Pandhurna, Madhya Pradesh 480334</p>
              <p className="mt-1 text-xs text-ink/45">Plus Code: {PLUS_CODE}</p>
            </div>
          </div>

          <a href={MAPS_LINK} target="_blank" rel="noreferrer" className="mt-6 block">
            <Button variant="outline" size="sm" className="w-full">
              <Navigation className="h-4 w-4" /> Get directions
            </Button>
          </a>
        </Card>

        <Card className="overflow-hidden p-0">
          <iframe
            src={MAPS_EMBED_SRC}
            className="h-[420px] w-full md:h-full md:min-h-[420px]"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Khursange Farms — satellite map"
          />
        </Card>
      </div>
    </div>
  );
}
