"use client";

import React from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { cn } from "@/lib/utils";

interface WorldMapProps {
  data: Array<{
    location: string;
    userCount: number;
    lat: number;
    lng: number;
  }>;
  className?: string;
}

// World map topology data (simplified)
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Country mapping for common locations
const countryMapping: Record<string, string> = {
  "United States": "United States of America",
  "USA": "United States of America",
  "UK": "United Kingdom",
  "United Kingdom": "United Kingdom",
  "Canada": "Canada",
  "Australia": "Australia",
  "Germany": "Germany",
  "France": "France",
  "Japan": "Japan",
  "China": "China",
  "India": "India",
  "Brazil": "Brazil",
  "Mexico": "Mexico",
  "Spain": "Spain",
  "Italy": "Italy",
  "Netherlands": "Netherlands",
  "Sweden": "Sweden",
  "Norway": "Norway",
  "Denmark": "Denmark",
  "Finland": "Finland",
  "Poland": "Poland",
  "Russia": "Russia",
  "South Korea": "South Korea",
  "Singapore": "Singapore",
  "Thailand": "Thailand",
  "Indonesia": "Indonesia",
  "Philippines": "Philippines",
  "Vietnam": "Vietnam",
  "Malaysia": "Malaysia",
  "New Zealand": "New Zealand",
  "South Africa": "South Africa",
  "Nigeria": "Nigeria",
  "Kenya": "Kenya",
  "Egypt": "Egypt",
  "Morocco": "Morocco",
  "Turkey": "Turkey",
  "Israel": "Israel",
  "Saudi Arabia": "Saudi Arabia",
  "UAE": "United Arab Emirates",
  "United Arab Emirates": "United Arab Emirates",
  "Argentina": "Argentina",
  "Chile": "Chile",
  "Colombia": "Colombia",
  "Peru": "Peru",
  "Venezuela": "Venezuela",
  "Ukraine": "Ukraine",
  "Romania": "Romania",
  "Czech Republic": "Czech Republic",
  "Hungary": "Hungary",
  "Greece": "Greece",
  "Portugal": "Portugal",
  "Belgium": "Belgium",
  "Austria": "Austria",
  "Switzerland": "Switzerland",
  "Ireland": "Ireland",
  "Iceland": "Iceland",
  "Luxembourg": "Luxembourg",
  "Estonia": "Estonia",
  "Latvia": "Latvia",
  "Lithuania": "Lithuania",
  "Slovakia": "Slovakia",
  "Slovenia": "Slovenia",
  "Croatia": "Croatia",
  "Serbia": "Serbia",
  "Bulgaria": "Bulgaria",
  "Albania": "Albania",
  "Macedonia": "North Macedonia",
  "North Macedonia": "North Macedonia",
  "Montenegro": "Montenegro",
  "Bosnia and Herzegovina": "Bosnia and Herzegovina",
  "Kosovo": "Kosovo",
  "Moldova": "Moldova",
  "Belarus": "Belarus",
  "Georgia": "Georgia",
  "Armenia": "Armenia",
  "Azerbaijan": "Azerbaijan",
  "Kazakhstan": "Kazakhstan",
  "Uzbekistan": "Uzbekistan",
  "Kyrgyzstan": "Kyrgyzstan",
  "Tajikistan": "Tajikistan",
  "Turkmenistan": "Turkmenistan",
  "Afghanistan": "Afghanistan",
  "Pakistan": "Pakistan",
  "Bangladesh": "Bangladesh",
  "Sri Lanka": "Sri Lanka",
  "Nepal": "Nepal",
  "Bhutan": "Bhutan",
  "Myanmar": "Myanmar",
  "Laos": "Laos",
  "Cambodia": "Cambodia",
  "Brunei": "Brunei",
  "Mongolia": "Mongolia",
  "North Korea": "North Korea",
  "Taiwan": "Taiwan",
  "Hong Kong": "Hong Kong",
  "Macau": "Macau",
  "Maldives": "Maldives",
  "Fiji": "Fiji",
  "Papua New Guinea": "Papua New Guinea",
  "Solomon Islands": "Solomon Islands",
  "Vanuatu": "Vanuatu",
  "Samoa": "Samoa",
  "Tonga": "Tonga",
  "Kiribati": "Kiribati",
  "Tuvalu": "Tuvalu",
  "Nauru": "Nauru",
  "Palau": "Palau",
  "Marshall Islands": "Marshall Islands",
  "Micronesia": "Micronesia",
  "Cook Islands": "Cook Islands",
  "Niue": "Niue",
  "Tokelau": "Tokelau",
  "American Samoa": "American Samoa",
  "Guam": "Guam",
  "Northern Mariana Islands": "Northern Mariana Islands",
  "Puerto Rico": "Puerto Rico",
  "Virgin Islands": "Virgin Islands",
  "Cayman Islands": "Cayman Islands",
  "Bermuda": "Bermuda",
  "Greenland": "Greenland",
  "Faroe Islands": "Faroe Islands",
  "Svalbard": "Svalbard",
  "Jan Mayen": "Jan Mayen",
  "Bouvet Island": "Bouvet Island",
  "South Georgia": "South Georgia",
  "South Sandwich Islands": "South Sandwich Islands",
  "British Antarctic Territory": "British Antarctic Territory",
  "French Southern Territories": "French Southern Territories",
  "Heard Island": "Heard Island",
  "McDonald Islands": "McDonald Islands",
  "Australian Antarctic Territory": "Australian Antarctic Territory",
  "Ross Dependency": "Ross Dependency",
  "Peter I Island": "Peter I Island",
  "Queen Maud Land": "Queen Maud Land",
  "Adélie Land": "Adélie Land",
  "Wilkes Land": "Wilkes Land",
  "Victoria Land": "Victoria Land",
  "Marie Byrd Land": "Marie Byrd Land",
  "Ellsworth Land": "Ellsworth Land",
  "Palmer Land": "Palmer Land",
  "Graham Land": "Graham Land",
  "South Shetland Islands": "South Shetland Islands",
  "South Orkney Islands": "South Orkney Islands",
  "Antarctic Peninsula": "Antarctic Peninsula",
  "Weddell Sea": "Weddell Sea",
  "Ross Sea": "Ross Sea",
  "Amundsen Sea": "Amundsen Sea",
  "Bellingshausen Sea": "Bellingshausen Sea",
  "Scotia Sea": "Scotia Sea",
  "Lazarev Sea": "Lazarev Sea",
  "Riiser-Larsen Sea": "Riiser-Larsen Sea",
  "Cosmonauts Sea": "Cosmonauts Sea",
  "Cooperation Sea": "Cooperation Sea",
  "Davis Sea": "Davis Sea",
  "Mawson Sea": "Mawson Sea",
  "D'Urville Sea": "D'Urville Sea",
  "Somov Sea": "Somov Sea",
  "Ross Ice Shelf": "Ross Ice Shelf",
  "Filchner-Ronne Ice Shelf": "Filchner-Ronne Ice Shelf",
  "Amery Ice Shelf": "Amery Ice Shelf",
  "Larsen Ice Shelf": "Larsen Ice Shelf",
  "George VI Ice Shelf": "George VI Ice Shelf",
  "West Ice Shelf": "West Ice Shelf",
  "Shackleton Ice Shelf": "Shackleton Ice Shelf",
  "Brunt Ice Shelf": "Brunt Ice Shelf",
  "Riiser-Larsen Ice Shelf": "Riiser-Larsen Ice Shelf",
  "Fimbul Ice Shelf": "Fimbul Ice Shelf",
  "Lazarev Ice Shelf": "Lazarev Ice Shelf",
  "Nivl Ice Shelf": "Nivl Ice Shelf",
  "Conger Ice Shelf": "Conger Ice Shelf",
  "Glenzer Ice Shelf": "Glenzer Ice Shelf",
  "Conger Ice Shelf": "Conger Ice Shelf",
  "Tucker Ice Shelf": "Tucker Ice Shelf",
  "Holmes Ice Shelf": "Holmes Ice Shelf",
  "Rennick Ice Shelf": "Rennick Ice Shelf",
  "Nansen Ice Shelf": "Nansen Ice Shelf",
  "Drygalski Ice Tongue": "Drygalski Ice Tongue",
  "Mertz Ice Tongue": "Mertz Ice Tongue",
  "Erebus Ice Tongue": "Erebus Ice Tongue",
  "Mackay Ice Tongue": "Mackay Ice Tongue",
  "Borchgrevink Ice Tongue": "Borchgrevink Ice Tongue",
  "Terra Nova Ice Tongue": "Terra Nova Ice Tongue",
  "Drygalski Ice Tongue": "Drygalski Ice Tongue",
  "Mertz Ice Tongue": "Mertz Ice Tongue",
  "Erebus Ice Tongue": "Erebus Ice Tongue",
  "Mackay Ice Tongue": "Mackay Ice Tongue",
  "Borchgrevink Ice Tongue": "Borchgrevink Ice Tongue",
  "Terra Nova Ice Tongue": "Terra Nova Ice Tongue"
};

export function WorldMap({ data, className }: WorldMapProps) {
  // Create a map of country names to user counts
  const countryData = data.reduce((acc, item) => {
    const countryName = countryMapping[item.location] || item.location;
    acc[countryName] = (acc[countryName] || 0) + item.userCount;
    return acc;
  }, {} as Record<string, number>);

  const maxUsers = Math.max(...Object.values(countryData), 1);

  // Color scale function
  const getFillColor = (countryName: string) => {
    const userCount = countryData[countryName] || 0;
    if (userCount === 0) {
      return "#f3f4f6"; // Light gray for no data
    }
    
    // Create a color scale from light blue to dark blue
    const intensity = userCount / maxUsers;
    const hue = 210; // Blue hue
    const saturation = Math.min(100, 20 + intensity * 80);
    const lightness = Math.max(20, 90 - intensity * 70);
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  return (
    <div className={cn("bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6", className)}>
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">User Distribution by Country</h3>
      
      <div className="relative">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 100,
            center: [0, 20]
          }}
          width={600}
          height={400}
          className="w-full h-auto"
        >
          <ZoomableGroup>
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const countryName = geo.properties.NAME || geo.properties.NAME_EN || geo.properties.ADMIN;
                  const userCount = countryData[countryName] || 0;
                  
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={getFillColor(countryName)}
                      stroke="#e5e7eb"
                      strokeWidth={0.5}
                      style={{
                        default: {
                          fill: getFillColor(countryName),
                          stroke: "#e5e7eb",
                          strokeWidth: 0.5,
                          outline: "none",
                        },
                        hover: {
                          fill: getFillColor(countryName),
                          stroke: "#3b82f6",
                          strokeWidth: 1,
                          outline: "none",
                        },
                        pressed: {
                          fill: getFillColor(countryName),
                          stroke: "#3b82f6",
                          strokeWidth: 1,
                          outline: "none",
                        },
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
        
        {/* Legend */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "#f3f4f6" }} />
              <span className="text-sm text-neutral-600 dark:text-neutral-400">No data</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(210, 20%, 90%)" }} />
              <span className="text-sm text-neutral-600 dark:text-neutral-400">Low</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(210, 50%, 60%)" }} />
              <span className="text-sm text-neutral-600 dark:text-neutral-400">Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(210, 100%, 20%)" }} />
              <span className="text-sm text-neutral-600 dark:text-neutral-400">High</span>
            </div>
          </div>
          
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            Total users: {Object.values(countryData).reduce((sum, count) => sum + count, 0)}
          </div>
        </div>
      </div>
    </div>
  );
}
