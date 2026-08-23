/**
 * ORANGY — single source of truth for all copy & mock data.
 * Edit headlines, captions, products and gallery items here;
 * no animation code needs to change.
 */

export const brand = {
  name: "ORANGY",
  tagline: "Born under the sun. Made for you.",
};

export const nav = {
  links: [
    { label: "Home", href: "#home" },
    { label: "Products", href: "#products" },
    { label: "Our Story", href: "#story" },
    { label: "Gallery", href: "#gallery" },
    { label: "Contact", href: "#contact" },
  ],
  auth: [
    { label: "Login", href: "#", variant: "ghost" as const },
    { label: "Sign Up", href: "#", variant: "solid" as const },
  ],
};

export const hero = {
  kicker: "Fresh from the orchard",
  headline: ["Born under the sun.", "Made for you."],
  sub: "We grow them. We pick them. We bring them to you. Straight from our family groves.",
  cta: "Explore the Journey",
  scrollHint: "Scroll to begin",
};

/** Captions that appear along the cinematic scroll film. */
export const filmCaptions = {
  land: {
    title: "This is our land.",
    sub: "Rows our families planted decades ago.",
  },
  walk: {
    title: "We walk it every morning.",
    sub: "Every tree known by heart.",
  },
  one: {
    title: "One perfect orange.",
    sub: "It waits until it's ready. So do we.",
  },
  pick: {
    title: "Picked at the perfect moment.",
    sub: "No machines. No shortcuts.",
  },
  world: {
    title: "From our groves, to every table.",
    sub: "This is Orangy.",
  },
};

export const manifesto = {
  kicker: "Why We Grow",
  lines: ["We are farmers.", "Our fathers", "were farmers.", "The trees outlive", "every promise — except ours."],
  body: "Orangy is a family of orange growers selling our own harvest under our own name. No middlemen. No cold storage measured in months. Just the grove, the harvest, and you.",
};

export type Product = {
  id: string;
  name: string;
  tag: string;
  description: string;
  price: string;
  unit: string;
  image: string;
  /** CSS object-position for the crop of the full still. */
  focus: string;
};

export const products: Product[] = [
  {
    id: "fresh-oranges",
    name: "Fresh Oranges",
    tag: "The classic",
    description: "Sun-ripened, hand-picked, orchard-fresh. The orange as it was meant to taste.",
    price: "₹249",
    unit: "per kg",
    image: "/images/chosen.webp",
    focus: "68% 60%",
  },
  {
    id: "premium-oranges",
    name: "Premium Reserve",
    tag: "Limited harvest",
    description: "The top of every tree. Bigger, sweeter, saved for those who notice the difference.",
    price: "₹429",
    unit: "per kg",
    image: "/images/plate.webp",
    focus: "62% 55%",
  },
  {
    id: "fresh-juice",
    name: "Fresh Orange Juice",
    tag: "Cold-pressed",
    description: "Pressed the same morning it ships. No sugar, no water, no concentrate. Just fruit.",
    price: "₹199",
    unit: "per 500 ml",
    image: "/images/glass.webp",
    focus: "68% 45%",
  },
  {
    id: "citrus-collection",
    name: "Citrus Collection",
    tag: "Curated box",
    description: "A grower's selection of the season's finest citrus, packed in a gift-ready crate.",
    price: "₹899",
    unit: "per box",
    image: "/images/cut.webp",
    focus: "55% 55%",
  },
];

export const whyOrangy = {
  kicker: "Why Orangy",
  title: "Grown with patience. Delivered with care.",
  points: [
    {
      n: "01",
      title: "Farm Fresh",
      body: "Picked at dawn, packed by noon, on its way to you the very same day.",
    },
    {
      n: "02",
      title: "Naturally Selected",
      body: "Every orange is chosen by hand and by eye — never by machine.",
    },
    {
      n: "03",
      title: "Premium Quality",
      body: "Only the top grade of each harvest carries the Orangy name.",
    },
    {
      n: "04",
      title: "Full of Flavor",
      body: "Slow-grown in sun-warmed groves for deeper sweetness and aroma.",
    },
    {
      n: "05",
      title: "Carefully Delivered",
      body: "Cushioned, climate-kept and traceable from our branch to your door.",
    },
  ],
};

export const story = {
  kicker: "Our Story",
  title: "Own the trees. Honor the fruit.",
  paragraphs: [
    "We are a family of growers. Some of our trees were planted by our grandfathers, and they still give fruit every season. We prune, we wait, we watch the sky, and we pick each orange by hand when it is ready — not when a schedule says so.",
    "This website is our stand: farmers selling their own harvest under their own name. When you buy Orangy, the grove gets paid — the people who actually grew it.",
  ],
  stats: [
    { value: "40+", label: "years, oldest bearing trees" },
    { value: "100%", label: "farmer-owned" },
    { value: "0", label: "middlemen" },
  ],
};

export type GalleryItem = {
  id: string;
  caption: string;
  src: string;
  ratio: string; // css aspect-ratio value
  focus?: string;
};

export const gallery: GalleryItem[] = [
  { id: "dawn", caption: "First light over the grove", src: "/images/orchard-mist.webp", ratio: "4/5", focus: "70% 50%" },
  { id: "macro", caption: "Cross-section, morning harvest", src: "/images/cut.webp", ratio: "1/1", focus: "55% 55%" },
  { id: "pour", caption: "Pressed within minutes", src: "/images/pour.webp", ratio: "4/5", focus: "60% 40%" },
  { id: "orchard", caption: "Rows of gold at sunset", src: "/images/hero.webp", ratio: "5/4", focus: "40% 45%" },
  { id: "chosen", caption: "Chosen at its peak", src: "/images/chosen.webp", ratio: "1/1", focus: "68% 60%" },
  { id: "glass", caption: "The morning ritual", src: "/images/glass.webp", ratio: "4/5", focus: "60% 45%" },
];

export const finalCta = {
  title: "Taste the Sunshine.",
  sub: "Fresh oranges and cold-pressed juice, delivered from our orchard to your door.",
  primary: "Shop Fresh",
  secondary: "Explore Orangy",
};

export const footer = {
  blurb: "Premium oranges and fresh-pressed juice from a family orchard that still does things the slow way.",
  columns: [
    {
      title: "Shop",
      links: ["Fresh Oranges", "Premium Reserve", "Orange Juice", "Citrus Collection"],
    },
    {
      title: "Company",
      links: ["Our Story", "Our Orchard", "Sustainability", "Contact"],
    },
    {
      title: "Follow",
      links: ["Instagram", "YouTube", "Pinterest"],
    },
  ],
  fineprint: "© 2026 Orangy. Grown under the sun.",
};
