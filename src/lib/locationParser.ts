/**
 * Location Parsing Utilities
 * Parses location strings into structured components for better analytics
 */

export interface ParsedLocation {
  city: string;
  stateProvince: string | null;
  country: string;
  countryCode: string | null;
  originalLocation: string;
}

// Country code mappings
const COUNTRY_CODE_MAP: Record<string, string> = {
  'United States': 'USA',
  'USA': 'USA',
  'US': 'USA',
  'Canada': 'CAN',
  'CAN': 'CAN',
  'CA': 'CAN',
  'United Kingdom': 'GBR',
  'UK': 'GBR',
  'GB': 'GBR',
  'Germany': 'DEU',
  'DE': 'DEU',
  'France': 'FRA',
  'FR': 'FRA',
  'Spain': 'ESP',
  'ES': 'ESP',
  'Italy': 'ITA',
  'IT': 'ITA',
  'Netherlands': 'NLD',
  'NL': 'NLD',
  'Australia': 'AUS',
  'AU': 'AUS',
  'Japan': 'JPN',
  'JP': 'JPN',
  'Brazil': 'BRA',
  'BR': 'BRA',
  'Mexico': 'MEX',
  'MX': 'MEX',
};

// State/Province mappings for US and Canada
const US_STATE_MAP: Record<string, string> = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
  'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
  'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
  'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
  'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
  'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
  'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
  'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
  'DC': 'District of Columbia',
};

const CA_PROVINCE_MAP: Record<string, string> = {
  'ON': 'Ontario', 'QC': 'Quebec', 'NS': 'Nova Scotia', 'NB': 'New Brunswick',
  'MB': 'Manitoba', 'BC': 'British Columbia', 'PE': 'Prince Edward Island',
  'SK': 'Saskatchewan', 'AB': 'Alberta', 'NL': 'Newfoundland and Labrador',
  'NT': 'Northwest Territories', 'YT': 'Yukon', 'NU': 'Nunavut',
};

/**
 * Parse a location string into structured components
 * Handles formats like:
 * - "Toronto, ON, CAN"
 * - "Toronto, Canada"
 * - "New York, NY, USA"
 * - "New York, United States"
 */
export function parseLocation(location: string): ParsedLocation {
  const parts = location.split(',').map(part => part.trim());
  
  if (parts.length < 2) {
    // Fallback for single part locations
    return {
      city: location,
      stateProvince: null,
      country: location,
      countryCode: null,
      originalLocation: location,
    };
  }

  const city = parts[0];
  const lastPart = parts[parts.length - 1];
  const countryCode = COUNTRY_CODE_MAP[lastPart] || null;
  const country = countryCode ? lastPart : lastPart;

  let stateProvince: string | null = null;
  
  if (parts.length >= 3) {
    // Format: "City, State, Country"
    const middlePart = parts[1];
    stateProvince = middlePart;
  } else if (parts.length === 2) {
    // Format: "City, Country" - try to infer state/province from city
    stateProvince = inferStateProvinceFromCity(city, countryCode);
  }

  return {
    city,
    stateProvince,
    country,
    countryCode,
    originalLocation: location,
  };
}

/**
 * Try to infer state/province from city name and country
 */
function inferStateProvinceFromCity(city: string, countryCode: string | null): string | null {
  if (!countryCode) return null;

  const cityLower = city.toLowerCase();

  if (countryCode === 'USA') {
    // US city mappings
    if (cityLower.includes('new york') || cityLower.includes('nyc')) return 'NY';
    if (cityLower.includes('los angeles') || cityLower.includes('la')) return 'CA';
    if (cityLower.includes('chicago')) return 'IL';
    if (cityLower.includes('houston')) return 'TX';
    if (cityLower.includes('phoenix')) return 'AZ';
    if (cityLower.includes('philadelphia')) return 'PA';
    if (cityLower.includes('san antonio')) return 'TX';
    if (cityLower.includes('san diego')) return 'CA';
    if (cityLower.includes('dallas')) return 'TX';
    if (cityLower.includes('san jose')) return 'CA';
    if (cityLower.includes('austin')) return 'TX';
    if (cityLower.includes('jacksonville')) return 'FL';
    if (cityLower.includes('fort worth')) return 'TX';
    if (cityLower.includes('columbus')) return 'OH';
    if (cityLower.includes('charlotte')) return 'NC';
    if (cityLower.includes('san francisco')) return 'CA';
    if (cityLower.includes('indianapolis')) return 'IN';
    if (cityLower.includes('seattle')) return 'WA';
    if (cityLower.includes('denver')) return 'CO';
    if (cityLower.includes('washington')) return 'DC';
    if (cityLower.includes('boston')) return 'MA';
    if (cityLower.includes('el paso')) return 'TX';
    if (cityLower.includes('nashville')) return 'TN';
    if (cityLower.includes('detroit')) return 'MI';
    if (cityLower.includes('oklahoma city')) return 'OK';
    if (cityLower.includes('portland')) return 'OR';
    if (cityLower.includes('las vegas')) return 'NV';
    if (cityLower.includes('memphis')) return 'TN';
    if (cityLower.includes('louisville')) return 'KY';
    if (cityLower.includes('baltimore')) return 'MD';
    if (cityLower.includes('milwaukee')) return 'WI';
    if (cityLower.includes('albuquerque')) return 'NM';
    if (cityLower.includes('tucson')) return 'AZ';
    if (cityLower.includes('fresno')) return 'CA';
    if (cityLower.includes('sacramento')) return 'CA';
    if (cityLower.includes('mesa')) return 'AZ';
    if (cityLower.includes('kansas city')) return 'MO';
    if (cityLower.includes('atlanta')) return 'GA';
    if (cityLower.includes('long beach')) return 'CA';
    if (cityLower.includes('colorado springs')) return 'CO';
    if (cityLower.includes('raleigh')) return 'NC';
    if (cityLower.includes('miami')) return 'FL';
    if (cityLower.includes('virginia beach')) return 'VA';
    if (cityLower.includes('omaha')) return 'NE';
    if (cityLower.includes('oakland')) return 'CA';
    if (cityLower.includes('minneapolis')) return 'MN';
    if (cityLower.includes('tulsa')) return 'OK';
    if (cityLower.includes('arlington')) return 'TX';
    if (cityLower.includes('tampa')) return 'FL';
    if (cityLower.includes('new orleans')) return 'LA';
  } else if (countryCode === 'CAN') {
    // Canadian city mappings
    if (cityLower.includes('toronto')) return 'ON';
    if (cityLower.includes('montreal')) return 'QC';
    if (cityLower.includes('vancouver')) return 'BC';
    if (cityLower.includes('calgary')) return 'AB';
    if (cityLower.includes('edmonton')) return 'AB';
    if (cityLower.includes('ottawa')) return 'ON';
    if (cityLower.includes('winnipeg')) return 'MB';
    if (cityLower.includes('quebec')) return 'QC';
    if (cityLower.includes('hamilton')) return 'ON';
    if (cityLower.includes('kitchener')) return 'ON';
    if (cityLower.includes('london')) return 'ON';
    if (cityLower.includes('victoria')) return 'BC';
    if (cityLower.includes('halifax')) return 'NS';
    if (cityLower.includes('oshawa')) return 'ON';
    if (cityLower.includes('windsor')) return 'ON';
    if (cityLower.includes('saskatoon')) return 'SK';
    if (cityLower.includes('regina')) return 'SK';
    if (cityLower.includes('sherbrooke')) return 'QC';
    if (cityLower.includes('barrie')) return 'ON';
    if (cityLower.includes('kelowna')) return 'BC';
    if (cityLower.includes('abbotsford')) return 'BC';
    if (cityLower.includes('saguenay')) return 'QC';
    if (cityLower.includes('kingston')) return 'ON';
    if (cityLower.includes('trois-rivières')) return 'QC';
    if (cityLower.includes('guelph')) return 'ON';
    if (cityLower.includes('cambridge')) return 'ON';
    if (cityLower.includes('waterloo')) return 'ON';
    if (cityLower.includes('saint john')) return 'NB';
    if (cityLower.includes('thunder bay')) return 'ON';
    if (cityLower.includes('peterborough')) return 'ON';
    if (cityLower.includes('lethbridge')) return 'AB';
    if (cityLower.includes('nanaimo')) return 'BC';
    if (cityLower.includes('kamloops')) return 'BC';
    if (cityLower.includes('belleville')) return 'ON';
    if (cityLower.includes('chilliwack')) return 'BC';
    if (cityLower.includes('fredericton')) return 'NB';
    if (cityLower.includes('charlottetown')) return 'PE';
    if (cityLower.includes('saint john')) return 'NB';
    if (cityLower.includes('red deer')) return 'AB';
    if (cityLower.includes('saint-jérôme')) return 'QC';
    if (cityLower.includes('sarnia')) return 'ON';
    if (cityLower.includes('medicine hat')) return 'AB';
    if (cityLower.includes('grande prairie')) return 'AB';
    if (cityLower.includes('sharon')) return 'ON';
    if (cityLower.includes('vernon')) return 'BC';
    if (cityLower.includes('drummondville')) return 'QC';
    if (cityLower.includes('prince george')) return 'BC';
    if (cityLower.includes('saint john')) return 'NB';
    if (cityLower.includes('sherbrooke')) return 'QC';
    if (cityLower.includes('barrie')) return 'ON';
    if (cityLower.includes('kelowna')) return 'BC';
    if (cityLower.includes('abbotsford')) return 'BC';
    if (cityLower.includes('saguenay')) return 'QC';
    if (cityLower.includes('kingston')) return 'ON';
    if (cityLower.includes('trois-rivières')) return 'QC';
    if (cityLower.includes('guelph')) return 'ON';
    if (cityLower.includes('cambridge')) return 'ON';
    if (cityLower.includes('waterloo')) return 'ON';
    if (cityLower.includes('saint john')) return 'NB';
    if (cityLower.includes('thunder bay')) return 'ON';
    if (cityLower.includes('peterborough')) return 'ON';
    if (cityLower.includes('lethbridge')) return 'AB';
    if (cityLower.includes('nanaimo')) return 'BC';
    if (cityLower.includes('kamloops')) return 'BC';
    if (cityLower.includes('belleville')) return 'ON';
    if (cityLower.includes('chilliwack')) return 'BC';
    if (cityLower.includes('fredericton')) return 'NB';
    if (cityLower.includes('charlottetown')) return 'PE';
    if (cityLower.includes('saint john')) return 'NB';
    if (cityLower.includes('red deer')) return 'AB';
    if (cityLower.includes('saint-jérôme')) return 'QC';
    if (cityLower.includes('sarnia')) return 'ON';
    if (cityLower.includes('medicine hat')) return 'AB';
    if (cityLower.includes('grande prairie')) return 'AB';
    if (cityLower.includes('sharon')) return 'ON';
    if (cityLower.includes('vernon')) return 'BC';
    if (cityLower.includes('drummondville')) return 'QC';
    if (cityLower.includes('prince george')) return 'BC';
  }

  return null;
}

/**
 * Get the full state/province name from abbreviation
 */
export function getFullStateProvinceName(abbr: string, countryCode: string | null): string | null {
  if (countryCode === 'USA') {
    return US_STATE_MAP[abbr.toUpperCase()] || null;
  } else if (countryCode === 'CAN') {
    return CA_PROVINCE_MAP[abbr.toUpperCase()] || null;
  }
  return null;
}
