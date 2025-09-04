import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  geoNaturalEarth1,
  type GeoProjection
} from "d3-geo";

/**
 * ThermoWorldHeatmap - Improved version with proper world geography
 * - Uses GeoJSON for accurate world land outlines
 * - Improved heat blending algorithm for smoother thermographic look
 * - Better color palette and visual styling
 */

type HeatPoint = {
  lat: number;     // latitude in degrees  [-90, 90]
  lng: number;     // longitude in degrees [-180, 180]
  intensity: number; // any positive scale (will be normalized)
  label?: string;  // optional display name for tooltip
};

type ThermoWorldHeatmapProps = {
  data: HeatPoint[];
  width?: number;
  height?: number;
  radius?: number;
  innerBlur?: number;
  maxIntensity?: number;
  formatIntensity?: (x: number) => string;
};

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export const ThermoWorldHeatmap: React.FC<ThermoWorldHeatmapProps> = ({
  data,
  width = 600,
  height = 300,
  radius = 35,
  innerBlur = 20,
  maxIntensity,
  formatIntensity = (x) => `${(x * 100).toFixed(1)}%`
}) => {
  // ====== Layout & DPI ======
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const worldGeoRef = useRef<any>(null);

  const [size, setSize] = useState<{ w: number; h: number }>({
    w: width,
    h: height
  });

  // Load world GeoJSON
  useEffect(() => {
    const loadWorldGeo = async () => {
      try {
        const response = await fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson');
        const geo = await response.json();
        worldGeoRef.current = geo;
      } catch (error) {
        console.error('Error loading world geography:', error);
      }
    };
    loadWorldGeo();
  }, []);

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
    setSize((prev) => ({
      w: el.clientWidth || prev.w,
      h: el.clientHeight || prev.h
    }));
    return () => ro.disconnect();
  }, []);

  const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;

  // ====== Projection ======
  const projection: GeoProjection = useMemo(() => {
    const p = geoNaturalEarth1()
      .translate([size.w / 2, size.h / 2])
      .scale(size.w * 0.22)
      .precision(0.1);
    return p;
  }, [size.w, size.h]);

  // ====== Improved Color Palette ======
  const palette = useMemo(() => {
    const gradCanvas = document.createElement("canvas");
    gradCanvas.width = 256;
    gradCanvas.height = 1;
    const gctx = gradCanvas.getContext("2d")!;
    const grd = gctx.createLinearGradient(0, 0, 256, 0);
    
    // More vibrant thermographic colors
    grd.addColorStop(0.0, "rgb(0, 0, 100)");      // Deep blue (cold)
    grd.addColorStop(0.2, "rgb(0, 50, 200)");     // Blue
    grd.addColorStop(0.4, "rgb(0, 150, 100)");    // Teal
    grd.addColorStop(0.6, "rgb(100, 200, 0)");    // Green
    grd.addColorStop(0.8, "rgb(255, 200, 0)");    // Yellow
    grd.addColorStop(1.0, "rgb(255, 50, 0)");     // Red (hot)
    
    gctx.fillStyle = grd;
    gctx.fillRect(0, 0, 256, 1);
    const { data: px } = gctx.getImageData(0, 0, 256, 1);
    return px;
  }, []);

  // ====== Improved Kernel Sprite ======
  const kernelSprite = useMemo(() => {
    const base = radius * (size.w / 600);
    const r = Math.max(8, base);
    const blur = Math.max(0, innerBlur * (size.w / 600));
    const dim = Math.ceil((r + blur) * 2.5); // Larger sprite for smoother blending
    const c = document.createElement("canvas");
    c.width = Math.ceil(dim * dpr);
    c.height = Math.ceil(dim * dpr);
    const ctx = c.getContext("2d")!;
    ctx.scale(dpr, dpr);

    const cx = dim / 2;
    const cy = dim / 2;
    
    // Create a more Gaussian-like gradient
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r + blur);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.3, "rgba(255,255,255,0.8)");
    grad.addColorStop(0.7, "rgba(255,255,255,0.3)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r + blur, 0, Math.PI * 2);
    ctx.fill();

    return { canvas: c, r: r + blur, dim };
  }, [radius, innerBlur, size.w, dpr]);

  // ====== Heat buffer ======
  const bufferRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
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

  // ====== Draw world geography ======
  const drawWorldGeography = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!worldGeoRef.current) return;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.fillStyle = "rgba(20,25,35,0.8)";
    ctx.lineWidth = 0.8;

    const geo = worldGeoRef.current;
    if (geo.features) {
      geo.features.forEach((feature: any) => {
        if (feature.geometry.type === "Polygon") {
          feature.geometry.coordinates.forEach((ring: any) => {
            ctx.beginPath();
            ring.forEach((coord: any, i: number) => {
              const [lng, lat] = coord;
              const [x, y] = projection([lng, lat]) || [0, 0];
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            });
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          });
        } else if (feature.geometry.type === "MultiPolygon") {
          feature.geometry.coordinates.forEach((polygon: any) => {
            polygon.forEach((ring: any) => {
              ctx.beginPath();
              ring.forEach((coord: any, i: number) => {
                const [lng, lat] = coord;
                const [x, y] = projection([lng, lat]) || [0, 0];
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
              });
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
            });
          });
        }
      });
    }
    ctx.restore();
  }, [projection, dpr]);

  // ====== Improved heat rendering ======
  const redraw = useCallback(() => {
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

    // Clear and draw world geography first
    dctx.clearRect(0, 0, display.width, display.height);
    drawWorldGeography(dctx);

    // Clear heat buffer
    bctx.clearRect(0, 0, buffer.width, buffer.height);
    bctx.save();
    bctx.scale(dpr, dpr);
    bctx.globalCompositeOperation = "lighter";

    // Draw heat points with improved blending
    const { canvas: sprite, r: kernelR, dim } = kernelSprite;
    const half = dim / 2;

    for (const p of data) {
      const xy = projection([p.lng, p.lat]);
      if (!xy) continue;
      const [x, y] = xy;
      const alpha = clamp01(p.intensity / maxI);
      if (alpha <= 0) continue;
      
      bctx.globalAlpha = alpha;
      bctx.drawImage(
        sprite,
        Math.round(x - half),
        Math.round(y - half),
        dim,
        dim
      );
    }

    bctx.restore();

    // Improved colorization with better blending
    const { width: W, height: H } = buffer;
    const src = bctx.getImageData(0, 0, W, H);
    const dst = dctx.createImageData(W, H);
    const spx = src.data;
    const dpx = dst.data;

    for (let i = 0; i < spx.length; i += 4) {
      const a = spx[i + 3];
      if (a === 0) continue;

      // Use a more sophisticated mapping for better color distribution
      const intensity = Math.pow(a / 255, 0.7); // Gamma correction for better color distribution
      const idx = Math.floor(intensity * 255) << 2;
      
      dpx[i + 0] = palette[idx + 0];
      dpx[i + 1] = palette[idx + 1];
      dpx[i + 2] = palette[idx + 2];
      dpx[i + 3] = Math.min(255, Math.max(0, Math.round(a * 0.9))); // Slightly more transparent
    }

    dctx.putImageData(dst, 0, 0);
  }, [data, kernelSprite, size.w, size.h, dpr, projection, maxI, palette, drawWorldGeography]);

  // Redraw when inputs change
  useEffect(() => {
    redraw();
  }, [redraw]);

  // ====== Tooltip ======
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    text: string;
    visible: boolean;
  }>({ x: 0, y: 0, text: "", visible: false });

  const evalBlendedAt = useCallback(
    (px: number, py: number) => {
      const sigma = (radius * (size.w / 600)) / 1.8;
      const twoSigma2 = 2 * sigma * sigma;

      let accum = 0;
      let nearest: { d2: number; label?: string; lat?: number; lng?: number } | null = null;

      for (const p of data) {
        const xy = projection([p.lng, p.lat]);
        if (!xy) continue;
        const dx = px - xy[0];
        const dy = py - xy[1];
        const d2 = dx * dx + dy * dy;
        const weight = Math.exp(-d2 / twoSigma2);
        const contrib = (p.intensity / maxI) * weight;
        accum += contrib;

        if (!nearest || d2 < nearest.d2) {
          nearest = { d2, label: p.label, lat: p.lat, lng: p.lng };
        }
      }

      const blended = clamp01(accum);
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
        background: "#0a0e13"
      }}
    >
      <canvas
        ref={displayCanvasRef}
        onMouseMove={handlePointerMove}
        onMouseLeave={hideTooltip}
        style={{
          position: "absolute",
          inset: 0,
          imageRendering: "pixelated"
        }}
        aria-label="Thermographic heatmap"
      />

      {tooltip.visible && (
        <div
          style={{
            position: "absolute",
            left: tooltip.x + 12,
            top: tooltip.y + 12,
            padding: "8px 12px",
            background: "rgba(0,0,0,0.85)",
            color: "white",
            fontSize: 13,
            borderRadius: 8,
            pointerEvents: "none",
            boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
            whiteSpace: "nowrap",
            transform: "translateZ(0)",
            border: "1px solid rgba(255,255,255,0.1)"
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
};

export default ThermoWorldHeatmap;