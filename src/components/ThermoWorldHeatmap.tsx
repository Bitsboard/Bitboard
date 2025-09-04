import React, { useEffect, useMemo, useRef, useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import {
  geoNaturalEarth1,
  geoPath,
  type GeoProjection
} from "d3-geo";

/** ---------- Types ---------- */
export type HeatPoint = {
  lat: number;
  lng: number;
  intensity: number;
  label?: string;
};

type ThermoWorldHeatmapProps = {
  data: HeatPoint[];
  width?: number;     // default 600 (CSS px)
  height?: number;    // default 300 (CSS px)
  radius?: number;    // kernel radius at 600px width, default 26
  innerBlur?: number; // extra softness, default 12
  maxIntensity?: number;   // optional fixed normalization cap
  geographyUrl?: string;   // world topo/geojson
  formatIntensity?: (x: number) => string;
  /** Keep heat only on land (default true) */
  maskToLand?: boolean;
  /** Tone mapping: compress highs, lift mids (default 98th pct, gamma 0.8) */
  tonePercentile?: number; // 90..100
  toneGamma?: number;      // 0.6..1.2
};

const DEFAULT_WORLD =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** ---------- Component ---------- */
export const ThermoWorldHeatmap: React.FC<ThermoWorldHeatmapProps> = ({
  data,
  width = 600,
  height = 300,
  radius = 26,
  innerBlur = 12,
  maxIntensity,
  geographyUrl = DEFAULT_WORLD,
  formatIntensity = (x) => `${(x * 100).toFixed(1)}%`,
  maskToLand = true,
  tonePercentile = 98,
  toneGamma = 0.8
}) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const bufferRef = useRef<HTMLCanvasElement | null>(null);
  const landMaskRef = useRef<HTMLCanvasElement | null>(null);
  const lastMaskKey = useRef<string>("");

  const [size, setSize] = useState({ w: width, h: height });

  // Responsive container
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const r = e.contentRect;
        if (r.width && r.height) setSize({ w: Math.round(r.width), h: Math.round(r.height) });
      }
    });
    ro.observe(el);
    // initial
    setSize((p) => ({ w: el.clientWidth || p.w, h: el.clientHeight || p.h }));
    return () => ro.disconnect();
  }, []);

  const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;

  // Projection shared by map and heat
  const projection: GeoProjection = useMemo(() => {
    return geoNaturalEarth1()
      .translate([size.w / 2, size.h / 2])
      .scale(size.w * 0.2)
      .precision(0.1);
  }, [size.w, size.h]);

  // Palette: Blue → Green → Yellow → Red (smooth)
  const palette = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 1;
    const ctx = c.getContext("2d")!;
    const g = ctx.createLinearGradient(0, 0, 256, 0);
    g.addColorStop(0.00, "rgb(5,15,95)");     // deep blue (cleaner lows)
    g.addColorStop(0.35, "rgb(0,185,100)");   // green
    g.addColorStop(0.70, "rgb(255,235,0)");   // yellow
    g.addColorStop(1.00, "rgb(230,0,0)");     // red
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 1);
    return ctx.getImageData(0, 0, 256, 1).data; // Uint8ClampedArray RGBA
  }, []);

  // Kernel sprite (pre-blurred radial)
  const kernelSprite = useMemo(() => {
    const base = radius * (size.w / 600);
    const r = Math.max(6, base);
    const blur = Math.max(0, innerBlur * (size.w / 600));
    const dim = Math.ceil((r + blur) * 2);
    const c = document.createElement("canvas");
    c.width = Math.ceil(dim * dpr);
    c.height = Math.ceil(dim * dpr);
    const ctx = c.getContext("2d")!;
    ctx.scale(dpr, dpr);
    const cx = dim / 2;
    const cy = dim / 2;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r + blur);
    grad.addColorStop(0, "rgba(0,0,0,1)");
    grad.addColorStop(Math.max(0, (r - blur) / (r + blur)), "rgba(0,0,0,1)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r + blur, 0, Math.PI * 2);
    ctx.fill();
    return { canvas: c, dim, r: r + blur };
  }, [radius, innerBlur, size.w, dpr]);

  // Offscreen buffer for accumulation
  useEffect(() => {
    const buf = document.createElement("canvas");
    buf.width = Math.max(1, Math.floor(size.w * dpr));
    buf.height = Math.max(1, Math.floor(size.h * dpr));
    bufferRef.current = buf;
  }, [size.w, size.h, dpr]);

  // Build/update land mask from current geographies (done inside map render)
  const buildLandMask = (geographies: any[]) => {
    if (!maskToLand) return;
    const key = `${size.w}x${size.h}@${dpr}|${geographies.length}`;
    if (key === lastMaskKey.current) return;

    const mask = document.createElement("canvas");
    mask.width = Math.max(1, Math.floor(size.w * dpr));
    mask.height = Math.max(1, Math.floor(size.h * dpr));
    const mctx = mask.getContext("2d")!;
    mctx.scale(dpr, dpr);
    const path = geoPath().projection(projection).context(mctx);

    mctx.clearRect(0, 0, mask.width, mask.height);
    mctx.beginPath();
    for (const g of geographies) path(g as any); // builds one big path
    mctx.fillStyle = "#fff"; // white = keep
    mctx.fill();

    landMaskRef.current = mask;
    lastMaskKey.current = key;
  };

  // Intensity normalization
  const maxI = useMemo(() => {
    if (typeof maxIntensity === "number" && maxIntensity > 0) return maxIntensity;
    let m = 0;
    for (const p of data) if (p.intensity > m) m = p.intensity;
    return m || 1;
  }, [data, maxIntensity]);

  // Render heat -> mask (optional) -> tone map -> colorize
  const redraw = React.useCallback(() => {
    const display = displayCanvasRef.current;
    const buffer = bufferRef.current;
    if (!display || !buffer) return;

    display.width = Math.max(1, Math.floor(size.w * dpr));
    display.height = Math.max(1, Math.floor(size.h * dpr));
    display.style.width = `${size.w}px`;
    display.style.height = `${size.h}px`;

    if (buffer.width !== display.width || buffer.height !== display.height) {
      buffer.width = display.width;
      buffer.height = display.height;
    }

    const bctx = buffer.getContext("2d")!;
    const dctx = display.getContext("2d")!;

    // 1) accumulate grayscale heat in buffer alpha via additive blending
    bctx.clearRect(0, 0, buffer.width, buffer.height);
    bctx.save();
    bctx.scale(dpr, dpr);
    bctx.globalCompositeOperation = "lighter";
    const { canvas: sprite, dim } = kernelSprite;
    const half = dim / 2;

    for (const p of data) {
      const xy = projection([p.lng, p.lat]);
      if (!xy) continue;
      const [x, y] = xy;
      const a = clamp01(p.intensity / maxI);
      if (a <= 0) continue;
      bctx.globalAlpha = a;
      bctx.drawImage(sprite, Math.round(x - half), Math.round(y - half), dim, dim);
    }
    bctx.restore();

    // 2) keep only land (mask)
    if (maskToLand && landMaskRef.current) {
      bctx.save();
      bctx.globalCompositeOperation = "destination-in";
      bctx.drawImage(landMaskRef.current, 0, 0);
      bctx.restore();
    }

    // 3) colorize with tone mapping
    const { width: W, height: H } = buffer;
    const src = bctx.getImageData(0, 0, W, H);
    const spx = src.data;

    // Compute percentile for exposure (avoid a few saturated pixels flattening colors)
    const hist = new Uint32Array(256);
    for (let i = 3; i < spx.length; i += 4) hist[spx[i]]++;
    let cutoffA = 255;
    {
      const target = ((tonePercentile / 100) * (W * H)) | 0;
      let acc = 0;
      for (let a = 0; a < 256; a++) {
        acc += hist[a];
        if (acc >= target) { cutoffA = Math.max(1, a); break; }
      }
    }

    const dst = dctx.createImageData(W, H);
    const dpx = dst.data;

    for (let i = 0; i < spx.length; i += 4) {
      const a = spx[i + 3];
      if (a === 0) continue;

      // normalize to cutoff and apply gamma
      const n = clamp01(a / cutoffA);
      const v = Math.pow(n, toneGamma);
      const idx = (Math.max(0, Math.min(255, (v * 255) | 0)) << 2);

      dpx[i + 0] = palette[idx + 0];
      dpx[i + 1] = palette[idx + 1];
      dpx[i + 2] = palette[idx + 2];
      dpx[i + 3] = Math.round(v * 255);
    }

    dctx.putImageData(dst, 0, 0);
  }, [
    data,
    kernelSprite,
    size.w,
    size.h,
    dpr,
    projection,
    maxI,
    maskToLand,
    tonePercentile,
    toneGamma,
    palette
  ]);

  useEffect(() => { redraw(); }, [redraw]);

  // Tooltip: blended intensity at cursor (respect land mask)
  const [tooltip, setTooltip] = useState({ x: 0, y: 0, text: "", visible: false });

  const isLandAt = (x: number, y: number) => {
    if (!maskToLand || !landMaskRef.current) return true;
    const mc = landMaskRef.current.getContext("2d")!;
    const dx = Math.floor(x * dpr);
    const dy = Math.floor(y * dpr);
    const a = mc.getImageData(dx, dy, 1, 1).data[3];
    return a > 0;
    // Note: 1×1 read on pointer move is fine at this resolution.
  };

  const evalBlendedAt = React.useCallback((px: number, py: number) => {
    const sigma = (radius * (size.w / 600)) / 1.6;
    const twoSigma2 = 2 * sigma * sigma;
    let accum = 0;
    let nearest: { d2: number; label?: string; lat: number; lng: number } | null = null;

    for (const p of data) {
      const xy = projection([p.lng, p.lat]);
      if (!xy) continue;
      const dx = px - xy[0];
      const dy = py - xy[1];
      const d2 = dx * dx + dy * dy;
      const w = Math.exp(-d2 / twoSigma2);
      accum += (p.intensity / maxI) * w;
      if (!nearest || d2 < nearest.d2) nearest = { d2, label: p.label, lat: p.lat, lng: p.lng };
    }
    return {
      blended: clamp01(accum),
      label: nearest?.label ?? (nearest ? `${nearest.lat.toFixed(2)}, ${nearest.lng.toFixed(2)}` : "")
    };
  }, [data, projection, size.w, radius, maxI]);

  const onMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (!isLandAt(x, y)) { setTooltip((t) => ({ ...t, visible: false })); return; }
    const { blended, label } = evalBlendedAt(x, y);
    setTooltip({
      x, y,
      text: `${label ? `${label} • ` : ""}${formatIntensity(blended)}`,
      visible: blended > 0.01
    });
  };

  // Outlines layer (top)
  const Coastlines: React.FC = () => (
    <ComposableMap
      width={size.w}
      height={size.h}
      projection="naturalEarth1"
      projectionConfig={{ scale: size.w * 0.2 }}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      <Geographies geography={geographyUrl}>
        {({ geographies }) =>
          geographies.map((geo) => (
            <Geography
              key={geo.rsmKey}
              geography={geo}
              fill="transparent"
              stroke="rgba(255,255,255,0.55)"
              strokeWidth={0.6}
            />
          ))
        }
      </Geographies>
    </ComposableMap>
  );

  return (
    <div
      ref={wrapperRef}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minWidth: width,
        minHeight: height,
        overflow: "hidden",
        background: "#0c1116"
      }}
    >
      {/* Base land (below heat) and build mask here */}
      <ComposableMap
        width={size.w}
        height={size.h}
        projection="naturalEarth1"
        projectionConfig={{ scale: size.w * 0.2 }}
        style={{ position: "absolute", inset: 0 }}
      >
        <Geographies geography={geographyUrl}>
          {({ geographies }) => {
            // Build/refresh mask when geographies arrive or size changes
            buildLandMask(geographies);
            return geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="#101820" /* subtle land tint under heat */
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={0.5}
              />
            ));
          }}
        </Geographies>
      </ComposableMap>

      {/* Heat overlay */}
      <canvas
        ref={displayCanvasRef}
        onMouseMove={onMove}
        onMouseLeave={() => setTooltip((t) => ({ ...t, visible: false }))}
        style={{ position: "absolute", inset: 0, imageRendering: "pixelated" }}
        aria-label="Thermographic heatmap"
      />

      {/* Coastlines above heat */}
      <Coastlines />

      {/* Tooltip */}
      {tooltip.visible && (
        <div
          style={{
            position: "absolute",
            left: tooltip.x + 12,
            top: tooltip.y + 12,
            padding: "6px 8px",
            background: "rgba(0,0,0,0.75)",
            color: "white",
            fontSize: 12,
            borderRadius: 6,
            pointerEvents: "none",
            boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
            whiteSpace: "nowrap"
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
};

export default ThermoWorldHeatmap;