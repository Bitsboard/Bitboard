// src/lib/geoDataManager.ts
import type { Feature, FeatureCollection, Geometry } from "geojson";

export type GeoFeature = Feature<Geometry, Record<string, any>>;
export type GeoFC = FeatureCollection<Geometry, Record<string, any>>;

/**
 * Reliable Natural Earth CDN (GeoJSON)
 * - World admin-0 (countries): names under properties like NAME_EN/ADMIN
 * - Admin-1 (states/provinces): properties include adm0_a3, name, iso_3166_2
 */
const ADMIN0_URL =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson";
const ADMIN1_URL =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson";

/** Cache in-memory to avoid refetch thrash in SPA */
let admin0Cache: GeoFC | null = null;
let admin1Cache: GeoFC | null = null;

export async function loadAdmin0(): Promise<GeoFC> {
  if (admin0Cache) return admin0Cache;
  const res = await fetch(ADMIN0_URL);
  if (!res.ok) throw new Error(`Failed to load Admin0: ${res.status}`);
  admin0Cache = (await res.json()) as GeoFC;
  return admin0Cache!;
}

export async function loadAdmin1(): Promise<GeoFC> {
  if (admin1Cache) return admin1Cache;
  const res = await fetch(ADMIN1_URL);
  if (!res.ok) throw new Error(`Failed to load Admin1: ${res.status}`);
  admin1Cache = (await res.json()) as GeoFC;
  return admin1Cache!;
}

/** Normalize country names from API → Natural Earth */
const COUNTRY_ALIASES: Record<string, string> = {
  "United States of America": "United States",
  USA: "United States",
  US: "United States",
  "U.S.A": "United States",
  "U.S.": "United States",
  "Russian Federation": "Russia",
  "UK": "United Kingdom",
  "U.K.": "United Kingdom",
  "South Korea": "Korea, Republic of",
  "North Korea": "Korea, Democratic People's Republic of",
  "Côte d'Ivoire": "Ivory Coast",
  "Cote d'Ivoire": "Ivory Coast",
};

export function canonCountryName(name: string): string {
  const trimmed = name.trim();
  return COUNTRY_ALIASES[trimmed] ?? trimmed;
}

/** Extract a readable Admin0 country name from a Natural Earth Admin0 feature */
export function admin0Name(props: Record<string, any>): string {
  // Natural Earth common fields
  return (
    props.NAME_EN ||
    props.ADMIN ||
    props.SOVEREIGNT ||
    props.NAME ||
    props.name ||
    ""
  );
}

/** Extract the 3-letter Natural Earth country code if present */
export function admin0A3(props: Record<string, any>): string | null {
  return props.ADM0_A3 || props.adm0_a3 || props.A3 || props.iso_a3 || null;
}

/** Filter Admin1 features for a given country A3 (e.g., 'USA', 'CAN') */
export function filterAdmin1ByA3(fc: GeoFC, a3: string): GeoFeature[] {
  const key = a3.toUpperCase();
  return fc.features.filter(
    (f) => (f.properties?.adm0_a3 || f.properties?.ADM0_A3) === key
  );
}

/** Helpful Admin1 keys (iso_3166_2 like 'US-TX', 'CA-ON') */
export function admin1ISO2(props: Record<string, any>): string | null {
  return props.iso_3166_2 || props.ISO_3166_2 || null;
}
export function admin1Name(props: Record<string, any>): string {
  return props.name || props.NAME || props.name_en || props.NAME_EN || "";
}

/** US states + Canada provinces (for parsing 'City, ST' strings) */
export const US_STATES: Record<string, string> = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
  DC: "District of Columbia",
};
export const CA_PROVINCES: Record<string, string> = {
  ON: "Ontario",
  QC: "Quebec",
  NS: "Nova Scotia",
  NB: "New Brunswick",
  MB: "Manitoba",
  BC: "British Columbia",
  PE: "Prince Edward Island",
  SK: "Saskatchewan",
  AB: "Alberta",
  NL: "Newfoundland and Labrador",
  NT: "Northwest Territories",
  YT: "Yukon",
  NU: "Nunavut",
};

/** Try to parse "City, ST" → ISO_3166_2 (US-TX or CA-ON) */
export function isoFromLocation(location: string): string | null {
  const parts = location.split(",").map((s) => s.trim());
  if (parts.length < 2) return null;
  const region = parts[parts.length - 1].toUpperCase();
  if (US_STATES[region]) return `US-${region}`;
  if (CA_PROVINCES[region]) return `CA-${region}`;
  return null;
}

/** Map ISO_3166_2 to Admin-0 A3 (country code) */
export function a3FromISO2(iso2: string | null): string | null {
  if (!iso2) return null;
  if (iso2.startsWith("US-")) return "USA";
  if (iso2.startsWith("CA-")) return "CAN";
  return null;
}