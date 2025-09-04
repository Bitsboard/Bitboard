// GeoDataManager - Centralized management of geographic data
// Uses Natural Earth as single source for all countries and subdivisions

export interface GeoFeature {
  type: 'Feature';
  properties: {
    NAME: string;
    NAME_EN: string;
    ADM0_A3: string; // Country code (e.g., 'CAN', 'USA')
    ADM1: string; // Admin level 1 name
    ADMIN1: string; // Alternative admin level 1 name
    [key: string]: any;
  };
  geometry: any;
}

export interface GeoData {
  type: 'FeatureCollection';
  features: GeoFeature[];
}

interface CountryMapping {
  [key: string]: {
    code: string;
    name: string;
    center: [number, number];
    zoom: number;
  };
}

export class GeoDataManager {
  private static instance: GeoDataManager;
  private cache = new Map<string, GeoData>();
  private worldData: GeoData | null = null;
  private admin1Data: GeoData | null = null;

  // Natural Earth URLs
  private readonly WORLD_URL = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson";
  private readonly ADMIN1_URL = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson";

  // Country mappings with standardized codes and centers
  private readonly COUNTRY_MAPPING: CountryMapping = {
    'United States of America': {
      code: 'USA',
      name: 'United States of America',
      center: [-95.7129, 37.0902],
      zoom: 3
    },
    'Canada': {
      code: 'CAN',
      name: 'Canada',
      center: [-106.3468, 56.1304],
      zoom: 3
    },
    'United Kingdom': {
      code: 'GBR',
      name: 'United Kingdom',
      center: [-2.0, 54.0],
      zoom: 4
    },
    'Germany': {
      code: 'DEU',
      name: 'Germany',
      center: [10.0, 51.0],
      zoom: 4
    },
    'France': {
      code: 'FRA',
      name: 'France',
      center: [2.0, 46.0],
      zoom: 4
    },
    'Australia': {
      code: 'AUS',
      name: 'Australia',
      center: [133.0, -27.0],
      zoom: 3
    },
    'Brazil': {
      code: 'BRA',
      name: 'Brazil',
      center: [-51.0, -14.0],
      zoom: 3
    },
    'India': {
      code: 'IND',
      name: 'India',
      center: [77.0, 20.0],
      zoom: 3
    },
    'China': {
      code: 'CHN',
      name: 'China',
      center: [104.0, 35.0],
      zoom: 3
    },
    'Japan': {
      code: 'JPN',
      name: 'Japan',
      center: [138.0, 36.0],
      zoom: 4
    }
  };

  private constructor() {}

  static getInstance(): GeoDataManager {
    if (!GeoDataManager.instance) {
      GeoDataManager.instance = new GeoDataManager();
    }
    return GeoDataManager.instance;
  }

  // Get world-level data (countries)
  async getWorldData(): Promise<GeoData> {
    if (this.worldData) {
      return this.worldData;
    }

    try {
      const response = await fetch(this.WORLD_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch world data: ${response.status}`);
      }
      
      this.worldData = await response.json() as GeoData;
      return this.worldData;
    } catch (error) {
      console.error('Error loading world data:', error);
      throw new Error('Failed to load world map data');
    }
  }

  // Get admin level 1 data (states/provinces) for a specific country
  async getAdmin1Data(countryCode: string): Promise<GeoData> {
    const cacheKey = `admin1_${countryCode}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      // Load admin1 data if not already loaded
      if (!this.admin1Data) {
        const response = await fetch(this.ADMIN1_URL);
        if (!response.ok) {
          throw new Error(`Failed to fetch admin1 data: ${response.status}`);
        }
        this.admin1Data = await response.json() as GeoData;
      }

      // Filter by country code
      const filteredData: GeoData = {
        type: 'FeatureCollection',
        features: this.admin1Data.features.filter(feature => 
          feature.properties.ADM0_A3 === countryCode
        )
      };

      // Cache the filtered result
      this.cache.set(cacheKey, filteredData);
      return filteredData;
    } catch (error) {
      console.error(`Error loading admin1 data for ${countryCode}:`, error);
      throw new Error(`Failed to load ${countryCode} subdivisions`);
    }
  }

  // Get geographic data based on level and country
  async getGeoData(level: 'world' | 'admin1', countryCode?: string): Promise<GeoData> {
    if (level === 'world') {
      return this.getWorldData();
    }

    if (!countryCode) {
      throw new Error('Country code required for admin1 level');
    }

    return this.getAdmin1Data(countryCode);
  }

  // Get country information
  getCountryInfo(countryName: string): CountryMapping[string] | null {
    return this.COUNTRY_MAPPING[countryName] || null;
  }

  // Get all supported countries
  getSupportedCountries(): string[] {
    return Object.keys(this.COUNTRY_MAPPING);
  }

  // Extract region name from feature properties
  extractRegionName(feature: GeoFeature): string {
    return feature.properties.NAME_EN || 
           feature.properties.NAME || 
           feature.properties.ADM1 || 
           feature.properties.ADMIN1 || 
           'Unknown';
  }

  // Check if country supports drill-down
  supportsDrillDown(countryName: string): boolean {
    return this.COUNTRY_MAPPING.hasOwnProperty(countryName);
  }

  // Clear cache (useful for testing or memory management)
  clearCache(): void {
    this.cache.clear();
    this.worldData = null;
    this.admin1Data = null;
  }
}

// Export singleton instance
export const geoDataManager = GeoDataManager.getInstance();
