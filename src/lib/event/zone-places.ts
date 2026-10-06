/**
 * THE PARTY'S CITY, FOUND BY NAME (event-zone's far-from-home choice in Settings): the zones her browser knows, said as
 * the cities a host knows, and found by a city, a country, a state or a destination ("Bali", "Tuscany", "Cabo"), never a
 * raw list of IANA names as the first thing she meets.
 *
 * ★ A ZONE IS ONE PLACE WHATEVER IT IS SPELLED: a browser lists ICU's canonical names ("Asia/Calcutta" where another
 * lists "Asia/Kolkata"), so the other names below are matched to the list by the zone each resolves to, once, never by
 * spelling.
 *
 * Pure: the list is built from whatever zones the caller hands it (the browser's own, `Intl.supportedValuesOf`).
 */
import { readableZone, zonePlace } from "@/lib/event/zone";

export type ZonePlace = {
  /** The zone as the browser lists it (stored as given when she picks it). */
  zone: string;
  /** The city a host knows ("Mexico City"). */
  city: string;
  /** Enough of where it is to tell two cities apart ("Americas", "Argentina", "Indiana"). */
  region: string;
  /** The other names a host may type for it (a country, a state, a destination), for the search alone. */
  also: readonly string[];
};

/** The IANA areas a party can be in, said for a host (the rest, `Etc` and the legacy aliases, are no city). */
const AREAS: Record<string, string> = {
  Africa: "Africa",
  America: "Americas",
  Antarctica: "Antarctica",
  Arctic: "Arctic",
  Asia: "Asia",
  Atlantic: "Atlantic",
  Australia: "Australia",
  Europe: "Europe",
  Indian: "Indian Ocean",
  Pacific: "Pacific",
};

/**
 * THE NAMES A HOST TYPES BEFORE A CITY: countries, states and the places parties travel to, each to its zone. A search
 * aid, never a list of record: a place missing here is still found by its own city.
 */
const ALSO_CALLED: Record<string, readonly string[]> = {
  "America/Mexico_City": [
    "Mexico",
    "CDMX",
    "Guadalajara",
    "San Miguel de Allende",
    "Oaxaca",
    "Puerto Vallarta",
  ],
  "America/Cancun": [
    "Tulum",
    "Playa del Carmen",
    "Riviera Maya",
    "Cozumel",
    "Quintana Roo",
  ],
  "America/Mazatlan": [
    "Cabo",
    "Los Cabos",
    "Cabo San Lucas",
    "Baja California Sur",
  ],
  "America/Tijuana": ["Baja California", "Ensenada", "Valle de Guadalupe"],
  "Pacific/Honolulu": ["Hawaii", "Maui", "Oahu", "Kauai", "Big Island"],
  "America/Anchorage": ["Alaska"],
  "America/Los_Angeles": [
    "California",
    "San Francisco",
    "Napa",
    "Sonoma",
    "Seattle",
    "Las Vegas",
    "Pacific Time",
    "Oregon",
    "Nevada",
    "Washington State",
  ],
  "America/Denver": [
    "Colorado",
    "Utah",
    "Aspen",
    "Vail",
    "Park City",
    "Salt Lake City",
    "Montana",
    "Wyoming",
    "Jackson Hole",
    "Mountain Time",
  ],
  "America/Phoenix": ["Arizona", "Scottsdale", "Sedona"],
  "America/Chicago": [
    "Texas",
    "Austin",
    "Dallas",
    "Houston",
    "Nashville",
    "Tennessee",
    "New Orleans",
    "Louisiana",
    "Minneapolis",
    "Central Time",
  ],
  "America/New_York": [
    "New York City",
    "NYC",
    "Boston",
    "Miami",
    "Florida",
    "Washington DC",
    "Atlanta",
    "Philadelphia",
    "Charleston",
    "Savannah",
    "Hamptons",
    "Eastern Time",
  ],
  "America/Toronto": ["Ontario", "Montreal", "Quebec", "Ottawa"],
  "America/Vancouver": ["British Columbia", "Whistler"],
  "America/Halifax": ["Nova Scotia"],
  "America/Puerto_Rico": ["Puerto Rico", "San Juan"],
  "America/Santo_Domingo": ["Dominican Republic", "Punta Cana"],
  "America/Jamaica": ["Montego Bay", "Negril"],
  "America/Nassau": ["Bahamas"],
  "America/Costa_Rica": ["Costa Rica"],
  "America/Bogota": ["Colombia", "Cartagena", "Medellin"],
  "America/Lima": ["Peru", "Cusco", "Machu Picchu"],
  "America/Sao_Paulo": ["Brazil", "Rio de Janeiro"],
  "America/Argentina/Buenos_Aires": ["Argentina"],
  "America/Santiago": ["Chile"],
  "Atlantic/Bermuda": ["Bermuda"],
  "Atlantic/Reykjavik": ["Iceland"],
  "Atlantic/Canary": ["Canary Islands", "Tenerife"],
  "Europe/London": [
    "United Kingdom",
    "UK",
    "England",
    "Scotland",
    "Edinburgh",
    "Wales",
    "Britain",
    "Cotswolds",
  ],
  "Europe/Dublin": ["Ireland"],
  "Europe/Paris": [
    "France",
    "Provence",
    "Nice",
    "French Riviera",
    "Bordeaux",
    "Champagne",
  ],
  "Europe/Rome": [
    "Italy",
    "Tuscany",
    "Florence",
    "Amalfi",
    "Positano",
    "Lake Como",
    "Venice",
    "Sicily",
    "Milan",
  ],
  "Europe/Madrid": [
    "Spain",
    "Barcelona",
    "Ibiza",
    "Mallorca",
    "Marbella",
    "Seville",
  ],
  "Europe/Lisbon": ["Portugal", "Algarve", "Porto"],
  "Europe/Athens": ["Greece", "Santorini", "Mykonos", "Crete"],
  "Europe/Istanbul": ["Turkey", "Türkiye"],
  "Europe/Berlin": ["Germany", "Munich"],
  "Europe/Amsterdam": ["Netherlands", "Holland"],
  "Europe/Zurich": ["Switzerland", "Geneva"],
  "Europe/Vienna": ["Austria"],
  "Europe/Zagreb": ["Croatia", "Dubrovnik", "Split", "Hvar"],
  "Europe/Copenhagen": ["Denmark"],
  "Europe/Stockholm": ["Sweden"],
  "Europe/Oslo": ["Norway"],
  "Africa/Johannesburg": ["South Africa", "Cape Town"],
  "Africa/Nairobi": ["Kenya"],
  "Africa/Casablanca": ["Morocco", "Marrakech"],
  "Africa/Cairo": ["Egypt"],
  "Asia/Dubai": ["United Arab Emirates", "UAE", "Abu Dhabi"],
  "Asia/Jerusalem": ["Israel", "Tel Aviv"],
  "Asia/Kolkata": [
    "India",
    "Delhi",
    "New Delhi",
    "Mumbai",
    "Bangalore",
    "Goa",
    "Jaipur",
    "Udaipur",
  ],
  "Asia/Kathmandu": ["Nepal"],
  "Asia/Colombo": ["Sri Lanka"],
  "Indian/Maldives": ["Maldives"],
  "Indian/Mauritius": ["Mauritius"],
  "Indian/Mahe": ["Seychelles"],
  "Asia/Bangkok": ["Thailand", "Phuket", "Koh Samui", "Chiang Mai"],
  "Asia/Ho_Chi_Minh": ["Vietnam", "Saigon"],
  "Asia/Singapore": ["Singapore"],
  "Asia/Kuala_Lumpur": ["Malaysia"],
  "Asia/Makassar": ["Bali", "Lombok", "Ubud"],
  "Asia/Jakarta": ["Indonesia", "Java"],
  "Asia/Manila": ["Philippines", "Boracay", "Palawan"],
  "Asia/Hong_Kong": ["Hong Kong"],
  "Asia/Shanghai": ["China", "Beijing"],
  "Asia/Taipei": ["Taiwan"],
  "Asia/Tokyo": ["Japan", "Kyoto", "Osaka"],
  "Asia/Seoul": ["South Korea", "Korea"],
  "Australia/Sydney": ["New South Wales", "NSW"],
  "Australia/Melbourne": ["Victoria"],
  "Australia/Brisbane": ["Queensland", "Gold Coast"],
  "Australia/Perth": ["Western Australia"],
  "Pacific/Auckland": ["New Zealand", "Queenstown"],
  "Pacific/Fiji": ["Fiji"],
  "Pacific/Tahiti": ["Tahiti", "Bora Bora", "French Polynesia"],
};

/** The runtime's own name for a zone, the key two spellings of one zone share. */
function resolved(zone: string): string | null {
  const readable = readableZone(zone);
  if (!readable) return null;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: readable,
  }).resolvedOptions().timeZone;
}

/** A word as the search compares it: lower case, no accents, punctuation as spaces. */
export function searchable(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * THE PLACES A PARTY CAN BE IN, from the zones the browser lists: every city of an IANA area (never `Etc`, never a legacy
 * alias), its city said as a host knows it and its other names attached by the zone they resolve to.
 */
export function zonePlaces(zones: readonly string[]): ZonePlace[] {
  const also = new Map<string, readonly string[]>();
  for (const [zone, names] of Object.entries(ALSO_CALLED)) {
    const key = resolved(zone);
    if (key) also.set(key, names);
  }
  const places: ZonePlace[] = [];
  for (const zone of zones) {
    const parts = zone.split("/");
    const area = AREAS[parts[0] ?? ""];
    if (!area || parts.length < 2) continue;
    const key = resolved(zone);
    if (!key) continue;
    places.push({
      zone,
      city: zonePlace(zone),
      region: parts.length > 2 ? parts[1]!.replace(/_/g, " ") : area,
      also: also.get(key) ?? [],
    });
  }
  return places.sort((a, b) => a.city.localeCompare(b.city));
}

/** How well a place answers a query: lower is better, null is no answer. */
function rank(place: ZonePlace, q: string): number | null {
  const city = searchable(place.city);
  const also = place.also.map(searchable);
  const starts = (text: string) =>
    text.startsWith(q) || text.split(" ").some((w) => w.startsWith(q));
  if (city === q || also.includes(q)) return 0;
  if (city.startsWith(q)) return 1;
  if (also.some((a) => a.startsWith(q))) return 2;
  if (starts(city)) return 3;
  if (also.some(starts)) return 4;
  if (city.includes(q) || also.some((a) => a.includes(q))) return 5;
  if (starts(searchable(place.region)) || searchable(place.zone).includes(q))
    return 6;
  return null;
}

/** The places that answer what she typed, best first (a city before a name it is also called), at most `limit`. */
export function findPlaces(
  places: readonly ZonePlace[],
  query: string,
  limit = 8,
): ZonePlace[] {
  const q = searchable(query);
  if (!q) return [];
  return places
    .map((place) => ({ place, score: rank(place, q) }))
    .filter((r): r is { place: ZonePlace; score: number } => r.score !== null)
    .sort(
      (a, b) => a.score - b.score || a.place.city.localeCompare(b.place.city),
    )
    .slice(0, limit)
    .map((r) => r.place);
}

/**
 * The other name a place answered by, where its own city did not ("Bali" for Makassar), so the row can say what she
 * typed beside the city it found; null where the city itself answered, or nothing did.
 */
export function answeredAs(place: ZonePlace, query: string): string | null {
  const q = searchable(query);
  if (!q || searchable(place.city).includes(q)) return null;
  return place.also.find((name) => searchable(name).includes(q)) ?? null;
}
