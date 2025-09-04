import React, { useEffect, useMemo, useRef, useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import {
  geoNaturalEarth1,
  type GeoProjection
} from "d3-geo";

/**
 * ThermoWorldHeatmap
 * ------------------------------------------------------------
 * - Basemap: react-simple-maps (NaturalEarth projection)
 * - Heat layer: hi-DPI <canvas> overlay with additive, blurred "splats"
 *   (pre-rendered radial gradient sprite) for O(N) accumulation.
 * - Colorization: grayscale heat buffer -> palette (Blue→Green→Yellow→Red).
 * - Tooltip: shows blended intensity at cursor (Gaussian kernel sum) and
 *   nearest data point label/coords when available.
 *
 * Notes:
 * - Responsive to container size via ResizeObserver.
 * - Handles 100+ points comfortably at ~600×300.
 * - You can host your own TopoJSON for stability; the default uses world-atlas.
 */

type HeatPoint = {
  lat: number;     // latitude in degrees  [-90, 90]
  lng: number;     // longitude in degrees [-180, 180]
  intensity: number; // any positive scale (will be normalized)
  label?: string;  // optional display name for tooltip
};

type ThermoWorldHeatmapProps = {
  data: HeatPoint[];
  /** CSS width/height of the container; component is responsive either way. */
  width?: number;   // default 600
  height?: number;  // default 300
  /**
   * Base kernel radius in CSS pixels (at width=600). Scales with DPI and resize.
   * Larger radius => smoother, more "thermal" blending.
   */
  radius?: number;      // default 26
  /** Additional softening applied inside the kernel sprite (in px). */
  innerBlur?: number;   // default 12
  /**
   * Optional cap for normalization. If omitted, uses max(data.intensity).
   * Increase to flatten/harden or decrease to make "hot spots" pop.
   */
  maxIntensity?: number;
  /** World topology source. Consider hosting locally for production. */
  geographyUrl?: string; // default countries-110m world-atlas
  /** Tooltip formatting for intensity (receives blended value [0..1]). */
  formatIntensity?: (x: number) => string;
};

const DEFAULT_WORLD =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export const ThermoWorldHeatmap: React.FC<ThermoWorldHeatmapProps> = ({
  data,
  width = 600,
  height = 300,
  radius = 26,
  innerBlur = 12,
  maxIntensity,
  geographyUrl = DEFAULT_WORLD,
  formatIntensity = (x) => `${(x * 100).toFixed(1)}%`
}) => {
  // ====== Layout & DPI ======
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [size, setSize] = useState<{ w: number; h: number }>({
    w: width,
    h: height
  });

  // Resize observer for responsiveness
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cr = entry.contentRect;
        if (cr.width > 0 && cr.height > 0) {
          setSize({ w: Math.round(cr.width), h: Math.round(cr.height) });
        }
      }
    });
    ro.observe(el);
    // Initialize with given width/height if wrapper has no explicit size
    setSize((prev) => ({
      w: el.clientWidth || prev.w,
      h: el.clientHeight || prev.h
    }));
    return () => ro.disconnect();
  }, []);

  const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;

  // ====== Projection (sync with map) ======
  // NaturalEarth1 looks great for whole-world at this aspect.
  const projection: GeoProjection = useMemo(() => {
    const p = geoNaturalEarth1()
      .translate([size.w / 2, size.h / 2])
      // Use a scale that matches ComposableMap's default heuristics:
      // ~160 @ 800px → scale ≈ width * 0.2
      .scale(size.w * 0.2)
      .center([0, 0])
      .precision(0.1);
    return p;
  }, [size.w, size.h]);

  // ====== Color Palette (Blue → Green → Yellow → Red) ======
  // Build a 256-step palette for fast lookup during colorization.
  const palette = useMemo(() => {
    // Offscreen canvas to sample a linear gradient
    const gradCanvas = document.createElement("canvas");
    gradCanvas.width = 256;
    gradCanvas.height = 1;
    const gctx = gradCanvas.getContext("2d")!;
    const grd = gctx.createLinearGradient(0, 0, 256, 0);
    grd.addColorStop(0.0, "rgb(0, 32, 255)");    // deep blue (cold)
    grd.addColorStop(0.33, "rgb(0, 190, 100)");  // green
    grd.addColorStop(0.66, "rgb(255, 230, 0)");  // yellow
    grd.addColorStop(1.0, "rgb(255, 0, 0)");     // red (hot)
    gctx.fillStyle = grd;
    gctx.fillRect(0, 0, 256, 1);
    const { data: px } = gctx.getImageData(0, 0, 256, 1);
    // Keep as Uint8ClampedArray RGBA (we'll set A based on heat value later)
    return px;
  }, []);

  // ====== Kernel sprite (pre-blurred radial dot) ======
  const kernelSprite = useMemo(() => {
    // Scale radius with width baseline for consistent look at different sizes.
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
    // The inner stops create a "Gaussian-like" peak; outer fade makes it smooth.
    grad.addColorStop(0, "rgba(0,0,0,1)");
    grad.addColorStop(Math.max(0, (r - blur) / (r + blur)), "rgba(0,0,0,1)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r + blur, 0, Math.PI * 2);
    ctx.fill();

    return { canvas: c, r: r + blur, dim };
  }, [radius, innerBlur, size.w, dpr]);

  // ====== Heat buffer (offscreen) ======
  const bufferRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    // (Re)create buffer when size/dpr changes
    const buf = document.createElement("canvas");
    buf.width = Math.max(1, Math.floor(size.w * dpr));
    buf.height = Math.max(1, Math.floor(size.h * dpr));
    bufferRef.current = buf;
  }, [size.w, size.h, dpr]);

  // ====== Intensity normalization ======
  const maxI = useMemo(() => {
    if (typeof maxIntensity === "number" && maxIntensity > 0) return maxIntensity;
    let m = 0;
    for (const p of data) if (p.intensity > m) m = p.intensity;
    return m || 1;
  }, [data, maxIntensity]);

  // ====== Draw heat (accumulate → colorize) ======
  const redraw = React.useCallback(() => {
    const display = displayCanvasRef.current;
    const buffer = bufferRef.current;
    if (!display || !buffer) return;

    // Size the display canvas
    display.width = Math.max(1, Math.floor(size.w * dpr));
    display.height = Math.max(1, Math.floor(size.h * dpr));
    display.style.width = `${size.w}px`;
    display.style.height = `${size.h}px`;

    // Ensure buffer matches
    if (buffer.width !== display.width || buffer.height !== display.height) {
      buffer.width = display.width;
      buffer.height = display.height;
    }

    const bctx = buffer.getContext("2d")!;
    const dctx = display.getContext("2d")!;

    // Clear buffer
    bctx.clearRect(0, 0, buffer.width, buffer.height);
    bctx.save();
    bctx.scale(dpr, dpr);
    bctx.globalCompositeOperation = "lighter"; // additive accumulation

    // Draw each point's kernel sprite with alpha scaled by intensity
    const { canvas: sprite, r: kernelR, dim } = kernelSprite;
    const half = dim / 2;

    for (const p of data) {
      const xy = projection([p.lng, p.lat]);
      if (!xy) continue;
      const [x, y] = xy;
      const alpha = clamp01(p.intensity / maxI);
      if (alpha <= 0) continue;
      bctx.globalAlpha = alpha;
      // Draw sprite centered at projected position
      bctx.drawImage(
        sprite,
        Math.round(x - half),
        Math.round(y - half),
        dim,
        dim
      );
    }

    bctx.restore();

    // Colorize: read buffer alpha (or intensity) and map to palette
    const { width: W, height: H } = buffer;
    const src = bctx.getImageData(0, 0, W, H);
    const dst = dctx.createImageData(W, H);
    const spx = src.data;
    const dpx = dst.data;

    // spx is RGBA, but we drew grayscale into the alpha channel via additive
    // The visible "heat" magnitude is the alpha channel value (0..255).
    for (let i = 0; i < spx.length; i += 4) {
      const a = spx[i + 3]; // accumulated alpha
      if (a === 0) continue; // leave transparent

      const idx = a << 2; // 0..255 → 0..1020
      // Palette is RGBA; we'll set output alpha proportional to heat, too.
      dpx[i + 0] = palette[idx + 0];
      dpx[i + 1] = palette[idx + 1];
      dpx[i + 2] = palette[idx + 2];
      // Boost alpha slightly for richer color while preserving transparency
      dpx[i + 3] = Math.min(255, Math.max(0, Math.round(a * 1.15)));
    }

    dctx.putImageData(dst, 0, 0);
  }, [data, kernelSprite, size.w, size.h, dpr, projection, maxI, palette]);

  // Redraw when inputs change
  useEffect(() => {
    redraw();
  }, [redraw]);

  // ====== Tooltip (blended intensity at cursor) ======
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    text: string;
    visible: boolean;
  }>({ x: 0, y: 0, text: "", visible: false });

  const evalBlendedAt = React.useCallback(
    (px: number, py: number) => {
      // Approximate the same kernel used for the sprite (Gaussian-ish).
      // Compute pixel distances to each projected point and sum contributions.
      // Normalize by maxI to get [0..1] final value for display.
      const sigma = (radius * (size.w / 600)) / 1.6; // heuristic tie to kernel size
      const twoSigma2 = 2 * sigma * sigma;

      let accum = 0;
      let maxLocal = 0;
      let nearest: { d2: number; label?: string; lat?: number; lng?: number } | null = null;

      for (const p of data) {
        const xy = projection([p.lng, p.lat]);
        if (!xy) continue;
        const dx = px - xy[0];
        const dy = py - xy[1];
        const d2 = dx * dx + dy * dy;
        const weight = Math.exp(-d2 / twoSigma2); // Gaussian kernel
        const contrib = (p.intensity / maxI) * weight;
        accum += contrib;
        if (contrib > maxLocal) maxLocal = contrib;

        // Track nearest (for label)
        if (!nearest || d2 < nearest.d2) {
          nearest = { d2, label: p.label, lat: p.lat, lng: p.lng };
        }
      }

      // Cap to [0..1] to align with colorization
      const blended = clamp01(accum);

      // Choose a label if the nearest point is within a reasonable px distance
      let labelPart = "";
      if (nearest && nearest.d2 <= (kernelSprite.r * kernelSprite.r)) {
        if (nearest.label) {
          labelPart = nearest.label;
        } else if (typeof nearest.lat === "number" && typeof nearest.lng === "number") {
          labelPart = `${nearest.lat.toFixed(2)}, ${nearest.lng.toFixed(2)}`;
        }
      }

      return { blended, labelPart };
    },
    [data, projection, size.w, radius, maxI, kernelSprite.r]
  );

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const { blended, labelPart } = evalBlendedAt(x, y);
    const txt = `${labelPart ? `${labelPart} • ` : ""}${formatIntensity(blended)}`;
    setTooltip({ x, y, text: txt, visible: blended > 0.01 });
  };
  const hideTooltip = () => setTooltip((t) => ({ ...t, visible: false }));

  // Small helper to keep map outlines above the heat for context.
  const MapOutlines: React.FC<{ stroke?: string; opacity?: number }> = ({
    stroke = "rgba(255,255,255,0.35)",
    opacity = 1
  }) => (
    <ComposableMap
      width={size.w}
      height={size.h}
      projection="naturalEarth1"
      projectionConfig={{ scale: size.w * 0.2, center: [0, 0] }}
      style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity }}
    >
      <Geographies geography={geographyUrl}>
        {({ geographies }) =>
          geographies.map((geo) => (
            <Geography
              key={geo.rsmKey}
              geography={geo}
              fill="transparent"
              stroke={stroke}
              strokeWidth={0.5}
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
        background: "#0b0d10" // subtle dark backdrop helps thermal colors pop
      }}
    >
      {/* Base map (subtle land fill for context, under heat) */}
      <ComposableMap
        width={size.w}
        height={size.h}
        projection="naturalEarth1"
        projectionConfig={{ scale: size.w * 0.2, center: [0, 0] }}
        style={{ position: "absolute", inset: 0 }}
      >
        <Geographies geography={geographyUrl}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="#11161a"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={0.5}
              />
            ))
          }
        </Geographies>
      </ComposableMap>

      {/* Heat overlay */}
      <canvas
        ref={displayCanvasRef}
        onMouseMove={handlePointerMove}
        onMouseLeave={hideTooltip}
        style={{
          position: "absolute",
          inset: 0,
          // Keep pixel edges crisp at HiDPI:
          imageRendering: "pixelated"
        }}
        aria-label="Thermographic heatmap"
      />

      {/* Outline layer above heat for crisp borders */}
      <MapOutlines />

      {/* Tooltip */}
      {tooltip.visible && (
        <div
          style={{
            position: "absolute",
            left: tooltip.x + 12,
            top: tooltip.y + 12,
            padding: "6px 8px",
            background: "rgba(0,0,0,0.72)",
            color: "white",
            fontSize: 12,
            borderRadius: 6,
            pointerEvents: "none",
            boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
            whiteSpace: "nowrap",
            transform: "translateZ(0)"
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
};

export default ThermoWorldHeatmap;
