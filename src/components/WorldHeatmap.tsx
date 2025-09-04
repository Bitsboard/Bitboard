import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

/**
 * WorldHeatmap.tsx
 * Pure-TS/React world map + land-only thermographic heat overlay (no external libs).
 *
 * WHAT YOU NEED TO PROVIDE (one-time):
 * 1) Download Natural Earth 1:110m "Admin 0 – Countries" as GeoJSON
 *    (file name often: ne_110m_admin_0_countries.geojson).
 * 2) Put it at: /public/data/ne_110m_admin_0_countries.geojson
 *    So it is served at: /data/ne_110m_admin_0_countries.geojson
 *    (You can also pass a custom URL via the `countriesGeoJsonUrl` prop.)
 *
 * Heat is drawn on a canvas, smoothly blended and colorized, then clipped
 * to the LAND path (constructed from the countries polygons). SVG draws
 * the visible geography (land fill + country borders) for crisp edges.
 *
 * No external map libraries are used.
 */

export type HeatPoint = {
  lat: number;    // -90..90
  lng: number;    // -180..180
  intensity: number; // arbitrary >=0 (we normalize)
  label: string;  // shown on tooltip
};

type GeoJSONPosition = [number, number];
type GeoJSONPolygon = GeoJSONPosition[][];
type GeoJSONMultiPolygon = GeoJSONPosition[][][];

type GeoJSONFeature = {
  type: "Feature";
  properties?: Record<string, any>;
  geometry:
    | { type: "Polygon"; coordinates: GeoJSONPolygon }
    | { type: "MultiPolygon"; coordinates: GeoJSONMultiPolygon };
};

type GeoJSONFeatureCollection = {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
};

type Projection = "mercator" | "equirectangular";

type Props = {
  points: HeatPoint[];
  width?: number;       // CSS px; default responsive to container; this is a hint
  height?: number;      // CSS px; same as above
  projection?: Projection; // default "mercator"
  countriesGeoJsonUrl?: string; // override default /data path if desired
  maxPointRadiusPx?: number;    // heat radius at intensity=1 (approx), default 30
  blurPx?: number;              // additional blur for smoothness, default 18
  className?: string;
};

const DEFAULT_GEOJSON_URL = "/data/ne_110m_admin_0_countries.geojson";

// --- Projection utilities (no external libs) ---
function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function mercatorProject(lng: number, lat: number, width: number, height: number) {
  // Web-Mercator with full world extent
  const λ = (lng + 180) * (Math.PI / 180); // 0..2π
  const φ = clamp(lat, -85.05113, 85.05113) * (Math.PI / 180); // clamp to avoid infinity
  const x = (λ / (2 * Math.PI)) * width; // 0..width
  const y = (0.5 - Math.log(Math.tan(Math.PI / 4 + φ / 2)) / (2 * Math.PI)) * height; // 0..height
  return [x, y] as const;
}

function equirectProject(lng: number, lat: number, width: number, height: number) {
  const x = ((lng + 180) / 360) * width;
  const y = ((90 - lat) / 180) * height;
  return [x, y] as const;
}

function getProjector(projection: Projection) {
  return projection === "equirectangular" ? equirectProject : mercatorProject;
}

// --- Color ramp (thermographic: blue -> green -> yellow -> red) ---
// t in [0,1] -> [r,g,b]
function thermoRamp(t: number): [number, number, number] {
  // Piecewise linear gradient: blue(0,0,255)->green(0,255,0)->yellow(255,255,0)->red(255,0,0)
  const tt = clamp(t, 0, 1);
  if (tt < 1 / 3) {
    const k = tt * 3; // 0..1
    // blue -> green
    const r = 0;
    const g = Math.round(255 * k);
    const b = Math.round(255 * (1 - k));
    return [r, g, b];
  } else if (tt < 2 / 3) {
    const k = (tt - 1 / 3) * 3; // 0..1
    // green -> yellow
    const r = Math.round(255 * k);
    const g = 255;
    const b = 0;
    return [r, g, b];
  } else {
    const k = (tt - 2 / 3) * 3; // 0..1
    // yellow -> red
    const r = 255;
    const g = Math.round(255 * (1 - k));
    const b = 0;
    return [r, g, b];
  }
}

// Compute a nice normalization for intensities
function computeIntensityScale(points: HeatPoint[]) {
  const max = points.reduce((m, p) => Math.max(m, p.intensity), 0) || 1;
  // modest gamma for visual pop
  const gamma = 0.75;
  return (v: number) => Math.pow(clamp(v / max, 0, 1), gamma);
}

// Build an SVG path string for a (Multi)Polygon using a projection
function polygonToPath(
  polygon: GeoJSONPolygon,
  project: (lng: number, lat: number, w: number, h: number) => readonly [number, number],
  w: number,
  h: number
) {
  let d = "";
  for (const ring of polygon) {
    if (!ring.length) continue;
    const [x0, y0] = project(ring[0][0], ring[0][1], w, h);
    d += `M${x0.toFixed(2)},${y0.toFixed(2)}`;
    for (let i = 1; i < ring.length; i++) {
      const [x, y] = project(ring[i][0], ring[i][1], w, h);
      d += `L${x.toFixed(2)},${y.toFixed(2)}`;
    }
    d += "Z";
  }
  return d;
}

function featureToPath(
  feature: GeoJSONFeature,
  project: (lng: number, lat: number, w: number, h: number) => readonly [number, number],
  w: number,
  h: number
) {
  const geom = feature.geometry;
  if (geom.type === "Polygon") {
    return polygonToPath(geom.coordinates, project, w, h);
  } else {
    // MultiPolygon
    return geom.coordinates.map(poly => polygonToPath(poly, project, w, h)).join("");
  }
}

// Build a Canvas Path2D for clipping to land areas
function featureToPath2D(
  feature: GeoJSONFeature,
  project: (lng: number, lat: number, w: number, h: number) => readonly [number, number],
  w: number,
  h: number
) {
  const path = new Path2D();
  const geom = feature.geometry;
  const drawRing = (ring: GeoJSONPosition[]) => {
    if (!ring.length) return;
    const [x0, y0] = project(ring[0][0], ring[0][1], w, h);
    path.moveTo(x0, y0);
    for (let i = 1; i < ring.length; i++) {
      const [x, y] = project(ring[i][0], ring[i][1], w, h);
      path.lineTo(x, y);
    }
    path.closePath();
  };
  if (geom.type === "Polygon") {
    for (const ring of geom.coordinates) drawRing(ring);
  } else {
    for (const poly of geom.coordinates) for (const ring of poly) drawRing(ring);
  }
  return path;
}

// ResizeObserver hook (pixel-perfect canvas at devicePixelRatio)
function useMeasure(ref: React.RefObject<HTMLElement>) {
  const [size, setSize] = useState({ width: 600, height: 300 });
  useLayoutEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        const cr = e.contentRect;
        setSize({ width: Math.max(10, cr.width), height: Math.max(10, cr.height) });
      }
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

export const WorldHeatmap: React.FC<Props> = ({
  points,
  width,
  height,
  projection = "mercator",
  countriesGeoJsonUrl = DEFAULT_GEOJSON_URL,
  maxPointRadiusPx = 30,
  blurPx = 18,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const heatCanvasRef = useRef<HTMLCanvasElement>(null);

  const { width: cw, height: ch } = useMeasure(containerRef);
  const cssWidth = width ?? cw;
  const cssHeight = height ?? ch;

  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const pxW = Math.round(cssWidth * dpr);
  const pxH = Math.round(cssHeight * dpr);

  const projector = useMemo(() => getProjector(projection), [projection]);

  const [world, setWorld] = useState<GeoJSONFeatureCollection | null>(null);
  const [landPathData, setLandPathData] = useState<string>(""); // for SVG fill
  const [borderPathData, setBorderPathData] = useState<string>(""); // for SVG strokes
  const [landClipPath2D, setLandClipPath2D] = useState<Path2D | null>(null);

  // Fetch countries GeoJSON
  useEffect(() => {
    let alive = true;
    fetch(countriesGeoJsonUrl, { cache: "force-cache" })
      .then(r => r.json())
      .then((data: unknown) => {
        if (alive) setWorld(data as GeoJSONFeatureCollection);
      })
      .catch(err => {
        console.error("Failed to load countries GeoJSON:", err);
      });
    return () => {
      alive = false;
    };
  }, [countriesGeoJsonUrl]);

  // Build SVG path strings & canvas clip path when size or world/projection changes
  useEffect(() => {
    if (!world || cssWidth <= 0 || cssHeight <= 0) return;

    const landD: string[] = [];
    const bordersD: string[] = []; // we'll reuse the same paths for borders

    for (const f of world.features) {
      const d = featureToPath(f, projector, cssWidth, cssHeight);
      if (d) {
        landD.push(d);
        bordersD.push(d);
      }
    }
    setLandPathData(landD.join(""));
    setBorderPathData(bordersD.join(""));

    // Build a single Path2D for clipping
    const clipPath = new Path2D();
    for (const f of world.features) {
      const p2d = featureToPath2D(f, projector, cssWidth, cssHeight);
      clipPath.addPath(p2d);
    }
    setLandClipPath2D(clipPath);
  }, [world, projector, cssWidth, cssHeight]);

  // Precompute projected point positions for hover + drawing
  const projectedPoints = useMemo(() => {
    return points.map(p => {
      const [x, y] = projector(p.lng, p.lat, cssWidth, cssHeight);
      return { ...p, x, y };
    });
  }, [points, projector, cssWidth, cssHeight]);

  // Draw heat to canvas (land-only via clip), then colorize
  useEffect(() => {
    const canvas = heatCanvasRef.current;
    if (!canvas || cssWidth <= 0 || cssHeight <= 0 || projectedPoints.length === 0 || !landClipPath2D) {
      // Clear if no data
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          canvas.width = pxW;
          canvas.height = pxH;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
      return;
    }

    canvas.width = pxW;
    canvas.height = pxH;
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Scale for DPR
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Create grayscale accumulation in an offscreen canvas for performance
    const off = document.createElement("canvas");
    off.width = pxW;
    off.height = pxH;
    const offCtx = off.getContext("2d")!;
    offCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Clip to land
    offCtx.save();
    offCtx.beginPath();
    offCtx.addPath(landClipPath2D);
    offCtx.clip();

    // Optional blur to smooth the edges further
    offCtx.filter = `blur(${blurPx}px)`;

    // Build intensity normalization
    const scale = computeIntensityScale(projectedPoints);

    // Accumulate soft radial gradients (black -> transparent), using "lighter"
    offCtx.globalCompositeOperation = "lighter";
    for (const p of projectedPoints) {
      const norm = scale(p.intensity);
      const r = maxPointRadiusPx * (0.65 + 0.35 * norm); // small size modulation

      const grad = offCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
      // center high, fade to transparent
      grad.addColorStop(0.0, `rgba(0,0,0,${0.45 + 0.35 * norm})`);
      grad.addColorStop(1.0, `rgba(0,0,0,0)`);

      offCtx.fillStyle = grad;
      // Fill a rect around the gradient to apply it
      offCtx.beginPath();
      offCtx.arc(p.x, p.y, r, 0, Math.PI * 2);
      offCtx.closePath();
      offCtx.fill();
    }

    offCtx.restore(); // remove clip/filter

    // Colorize the grayscale alpha into thermographic colors
    const img = offCtx.getImageData(0, 0, pxW, pxH);
    const data = img.data;
    for (let i = 0; i < data.length; i += 4) {
      // We used black in RGB; the "lightness" is in RGB channels due to "lighter".
      // Compute intensity from max(R,G,B); then map to ramp.
      const v = Math.max(data[i], data[i + 1], data[i + 2]); // 0..255
      if (v > 0) {
        const t = v / 255;
        const [r, g, b] = thermoRamp(t);
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        // Alpha proportional to intensity for thermographic feel
        data[i + 3] = Math.max(data[i + 3], Math.round(220 * t));
      } else {
        data[i + 3] = 0; // fully transparent
      }
    }
    offCtx.putImageData(img, 0, 0);

    // Paint to visible canvas
    ctx.clearRect(0, 0, cssWidth, cssHeight);
    ctx.drawImage(off, 0, 0, pxW / dpr, pxH / dpr);
  }, [
    projectedPoints,
    cssWidth,
    cssHeight,
    pxW,
    pxH,
    dpr,
    landClipPath2D,
    maxPointRadiusPx,
    blurPx,
  ]);

  // Tooltip logic (nearest visible point)
  const [hover, setHover] = useState<{ x: number; y: number; label: string; intensity: number } | null>(null);

  function onMouseMove(e: React.MouseEvent) {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    // nearest point within radius
    let best: { d2: number; p: (typeof projectedPoints)[number] } | null = null;
    const radiusPx = 24;
    for (const p of projectedPoints) {
      const dx = p.x - mx;
      const dy = p.y - my;
      const d2 = dx * dx + dy * dy;
      if (d2 <= radiusPx * radiusPx) {
        if (!best || d2 < best.d2) best = { d2, p };
      }
    }
    if (best) {
      setHover({ x: mx, y: my, label: best.p.label, intensity: best.p.intensity });
    } else {
      setHover(null);
    }
  }

  function onMouseLeave() {
    setHover(null);
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "relative",
        width: width ? `${width}px` : "100%",
        height: height ? `${height}px` : "100%",
        minWidth: 300,
        minHeight: 150,
        background: "white",
        overflow: "hidden",
        borderRadius: 8,
      }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {/* Base geography (SVG): land fill and country borders for clear context */}
      <svg
        ref={svgRef}
        width={cssWidth}
        height={cssHeight}
        viewBox={`0 0 ${cssWidth} ${cssHeight}`}
        style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%" }}
        aria-label="World geography"
      >
        {/* Continents / land */}
        {landPathData && (
          <path
            d={landPathData}
            fill="#f3f3f3"
            stroke="#bdbdbd"
            strokeWidth={0.6}
            vectorEffect="non-scaling-stroke"
          />
        )}

        {/* Heat canvas is stacked ABOVE this SVG (see below), so we re-draw borders on top for crispness */}
      </svg>

      {/* Heat overlay (Canvas), clipped to land in drawing step */}
      <canvas
        ref={heatCanvasRef}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: `${cssWidth}px`,
          height: `${cssHeight}px`,
          pointerEvents: "none", // mouse handled on container
        }}
      />

      {/* Borders overlay (SVG) to ensure borders remain visible above heat */}
      <svg
        width={cssWidth}
        height={cssHeight}
        viewBox={`0 0 ${cssWidth} ${cssHeight}`}
        style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", pointerEvents: "none" }}
        aria-hidden
      >
        {borderPathData && (
          <path
            d={borderPathData}
            fill="none"
            stroke="#8d8d8d"
            strokeWidth={0.5}
            vectorEffect="non-scaling-stroke"
          />
        )}
        {/* Coastline emphasis (subtle outer glow) */}
        {landPathData && (
          <path
            d={landPathData}
            fill="none"
            stroke="rgba(255,255,255,0.75)"
            strokeWidth={0.9}
            vectorEffect="non-scaling-stroke"
            style={{ mixBlendMode: "overlay" }}
          />
        )}
      </svg>

      {/* Tooltip */}
      {hover && (
        <div
          style={{
            position: "absolute",
            left: Math.round(hover.x) + 10,
            top: Math.round(hover.y) + 10,
            transform: "translateY(-50%)",
            background: "rgba(0,0,0,0.8)",
            color: "white",
            padding: "6px 8px",
            borderRadius: 6,
            fontSize: 12,
            whiteSpace: "nowrap",
            pointerEvents: "none",
            boxShadow: "0 4px 10px rgba(0,0,0,0.25)",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 2 }}>{hover.label}</div>
          <div>count: {hover.intensity}</div>
        </div>
      )}
    </div>
  );
};
