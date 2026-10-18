export const EVENT = {
  name: "TEDx Thyna Youth",
  edition: "2026",
  caseNo: "TX-026",
  dateISO: "2026-11-15T09:00:00+01:00",
  dateLabel: "15 November 2026",
  dateShort: "15.11.26",
  theme: "Break The Pattern",
  venue: "Complexe Culturel Mohamed Jamoussi",
  venueShort: "Complexe Mohamed Jamoussi",
  address: "Rue Ibn Al Jazzar, Sfax 3079",
  coords: "34.7368° N — 10.7507° E",
  city: "Sfax, Tunisia",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Centre+Culturel+Mohamed+Jammoussi+Sfax&query_place_id=ChIJ52Yp69QsABMRKLAWhVbRv0A",
  mapsEmbed: "https://maps.google.com/maps?q=34.73675,10.75068&z=16&output=embed",
  registerUrl: "https://register.tedxthyna.com",
  email: "affes.zied@tedxthyna.com",
  instagram: "https://www.instagram.com/tedxthyna/",
  linkedin: "https://www.linkedin.com/m/company/tedxthyna-youth/",
};

export type NavItem = { label: string; href: string; code: string };

export const NAV: NavItem[] = [
  { label: "Mission", href: "/mission", code: "02" },
  { label: "Speakers", href: "/speakers", code: "03" },
  { label: "Organization", href: "/organization", code: "04" },
  { label: "The Scene", href: "/scene", code: "05" },
  { label: "Agenda", href: "/agenda", code: "06" },
  { label: "Contact", href: "/contact", code: "07" },
];

/** Order of files when visitors move "to the next file" at the bottom of each page. */
export const FILE_ORDER: NavItem[] = [
  ...NAV,
];

export const TEAM = [
  { name: "Abderrahmen Bouderbela", role: "Event President & Head of Partnerships", email: "abderrahmen.bouderbela@tedxthyna.com" },
  { name: "Khadija Kammoun", role: "Public Relations & Speaker Relations Specialist", email: "khadija.kammoun@tedxthyna.com" },
  { name: "Fatma Guermazi", role: "Social Media & Delegate Experience Specialist", email: "fatma.guermazi@tedxthyna.com" },
  { name: "Youssef Ayedy", role: "Head of Operations", email: "youssef.ayedy@tedxthyna.com" },
  { name: "Zied Affes", role: "Data & Information Specialist", email: "affes.zied@tedxthyna.com" },
  { name: "Mohamed Aziz Mtimet", role: "Head of Finance & Legalities", email: "aziz.mtimet@tedxthyna.com" },
];

export const FILES = [
  {
    code: "01",
    tag: "The Mission",
    title: "Why we gather",
    question: "What is the case really about?",
    href: "/mission",
    image: "gather",
  },
  {
    code: "02",
    tag: "The Speakers",
    title: "Who holds the mic",
    question: "Eleven voices, one stage.",
    href: "/speakers",
    image: "voices",
  },
  {
    code: "03",
    tag: "The Scene",
    title: "Where it unfolds",
    question: "Where will it happen?",
    href: "/scene",
    image: "stage",
  },
  {
    code: "04",
    tag: "The Organization",
    title: "Who runs the operation",
    question: "Who built the file?",
    href: "/organization",
    image: "board",
  },
  {
    code: "05",
    tag: "The Agenda",
    title: "How the day plays out",
    question: "What happens, and when?",
    href: "/agenda",
    image: "desk",
  },
] as const;

export type Role = "Speaker" | "Panelist" | "Moderator";

/** Line-up as announced on @tedxthyna. `bio` uses *asterisks* for the words set in red on the posters. */
export const SPEAKERS: { first: string; last: string; role: Role; label: string; bio: string; photo: string }[] = [
  { first: "Sawsen", last: "Haj Amor", role: "Speaker", label: "Speaker", bio: "AI *Journalist* & CEO *Business Talk*, AI Media *platform* & Shark *library*", photo: "sawsen-haj-amor" },
  { first: "Hamza", last: "Belloumi", role: "Speaker", label: "Speaker", bio: "Tunisian *journalist*, television *presenter*", photo: "hamza-belloumi" },
  { first: "Sawsen", last: "Maalej", role: "Speaker", label: "Speaker", bio: "Tunisian *actress*, media personality & *broadcaster*", photo: "sawsen-maalej" },
  { first: "Nawel", last: "Bizid", role: "Speaker", label: "Speaker", bio: "Tunisian *journalist*, media *producer* & *podcaster*", photo: "nawel-bizid" },
  { first: "Mohamed", last: "Khammessi", role: "Speaker", label: "Speaker", bio: "TV & Radio *presenter*, producer, *podcast* host", photo: "mohamed-khammessi" },
  { first: "Youssef", last: "Zribi", role: "Speaker", label: "Speaker", bio: "Tunisian *entrepreneur* and *SDGs advocate*, Founder of *EcoTrunk*, AI-powered waste sorting", photo: "youssef-zribi" },
  { first: "Omar", last: "Derbel", role: "Panelist", label: "Panelist", bio: "Exploring *art*, literature and *influencer*", photo: "omar-derbel" },
  { first: "Adem", last: "Sebiaa", role: "Panelist", label: "Panelist", bio: "Master in *Diplomacy* and international relations, *Content creator* 120k+ on TikTok", photo: "adem-sebiaa" },
  { first: "Dhia", last: "Saibi", role: "Panelist", label: "Panelist", bio: "Tunisian *football* content *creator*", photo: "dhia-saibi" },
  { first: "Oumayma", last: "Meherzi", role: "Moderator", label: "Discussion Panel Moderator", bio: "Tunisian *actress*", photo: "oumayma-meherzi" },
  { first: "Jihed", last: "Cherni", role: "Moderator", label: "Moderator", bio: "Tunisian *actor*, *screenwriter* & media *producer*", photo: "jihed-cherni" },
];

export const ROLE_TAGLINE: Record<Role, [string, string]> = {
  Speaker: ["Sharing Ideas", "Shaping Perspectives"],
  Panelist: ["Multiple Voices", "One Direction"],
  Moderator: ["Guiding the Conversation", "Connecting Voices"],
};

export const speakerSlug = (s: { first: string; last: string }) => `${s.first}-${s.last}`.toLowerCase().replace(/\s+/g, "-");

export const speakerPhoto = (photo: string) => `/media/speakers/${photo}.webp`;

/** Third-party photos used on the site (shown in the footer). */
export const PHOTO_CREDITS = [
  { what: "City walls of Sfax", who: "Hamed Gamaoun", license: "CC BY-SA 4.0", url: "https://commons.wikimedia.org/w/index.php?curid=51962668" },
  { what: "Medina of Sfax", who: "IssamBarhoumi", license: "CC BY-SA 4.0", url: "https://commons.wikimedia.org/w/index.php?curid=51853012" },
];

export const img = (name: string, size: 1000 | 2000 = 2000) => `/media/${name}-${size}.webp`;
export const srcSet = (name: string) => `/media/${name}-1000.webp 1000w, /media/${name}-2000.webp 2000w`;
