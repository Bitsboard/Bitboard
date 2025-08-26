import React from "react";

/**
 * Orbit with constant edge-to-edge gaps (no traffic), steady arc-length speed,
 * independent tilt wobble, and PNG assets.
 *
 * Bugfix: remove duplicate declarations of `rand01`. It is now defined exactly
 * once at module scope and referenced where needed.
 *
 * Dev self-tests (console.assert) are included to catch regressions in:
 *  - rand01 output range
 *  - ellipse arc-length LUT monotonicity & wrap
 *  - ring closure perimeter ≈ ellipse circumference
 *  - constant edge-gap uniformity across all neighbors
 */

type Item = { src: string; label: string; sizeWeight?: number };

const ITEMS: Item[] = [
  { src: "/Chair.png", label: "Chair", sizeWeight: 1.15 },
  { src: "/Phone.png", label: "Phone", sizeWeight: 0.9 },
  { src: "/Shoe.png", label: "Shoe", sizeWeight: 1.0 },
  { src: "/Watch.png", label: "Watch", sizeWeight: 0.85 },
  { src: "/Backpack.png", label: "Backpack", sizeWeight: 1.15 },
  { src: "/Bike.png", label: "Bike", sizeWeight: 1.35 },
  { src: "/Drill.png", label: "Drill", sizeWeight: 1.0 },
  { src: "/Guitar.png", label: "Guitar", sizeWeight: 1.2 },
  { src: "/Lamp.png", label: "Lamp", sizeWeight: 0.95 },
  { src: "/Plant.png", label: "Plant", sizeWeight: 0.95 },
  { src: "/Shirt.png", label: "Shirt", sizeWeight: 0.9 },
];

// Ellipse and motion settings (match the earlier CSS path)
const cx = 420, cy = 190; // center
const rx = 240, ry = 160; // radii
const DURATION_MS = 34_500; // full loop duration (15% slower)
const TILT_DEG = -45; // global stylized tilt

// Visual near/far scaling (top is near)
const SCALE_NEAR = 1.4;
const SCALE_FAR = 0.4;

// Base bubble size (Tailwind w-20/h-20 => 80px)
const BASE_DIAM = 80; // px
const BASE_RADIUS = BASE_DIAM / 2; // 40 px

// Toggle: if true, larger items get larger *physical & visual* radius
// If false, all items render the same size (only perspective varies).
const USE_WEIGHTS = false;

// Global multiplier to uniformly scale all items (visual + spacing)
const GLOBAL_SCALE = 1.15; // +15%

// LUT resolution for fast arc-length queries
const LUT_RES = 2048; // precision to reduce artifacts
const TAU = Math.PI * 2;

// Phase lead for size scaling: positive = peak EARLIER along rotation
const SCALING_PHASE_TURNS = 1 / 8; // 45° lead
const SCALING_PHASE = TAU * SCALING_PHASE_TURNS;

// Floating tilt controls (natural, continuous; same amplitude for all)
const TILT_AMP_DEG = 6;        // range of ±6°
const TILT_PERIOD_MS = 3200;   // one full sway cycle

// Deterministic pseudo-random in [0,1) for per-item variance
function rand01(index: number, salt = 0) {
  const x = Math.sin((index + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function normTheta(t: number) {
  return ((t % TAU) + TAU) % TAU;
}

function perspectiveScale(theta: number) {
  // Map top (-PI/2) as front/near (max scale), bottom (+PI/2) as far (min)
  const thetaPrime = theta + Math.PI / 2; // cos(0)=1 at top
  const t = (1 + Math.cos(thetaPrime)) / 2; // 1 at top, 0 at bottom
  return SCALE_FAR + (SCALE_NEAR - SCALE_FAR) * t;
}

// Display scale used for *rendered* size (independent of weights when disabled)
function displayScaleAt(theta: number) {
  // Apply phase lead so items grow/shrink earlier in their rotation
  return perspectiveScale(theta + SCALING_PHASE);
}

function makeArcLUT() {
  const dTheta = TAU / LUT_RES;
  const metric: number[] = new Array(LUT_RES + 1);
  const cum: number[] = new Array(LUT_RES + 1);
  cum[0] = 0;
  for (let i = 0; i <= LUT_RES; i++) {
    const th = i * dTheta;
    // |dr/dθ| for ellipse
    metric[i] = Math.hypot(rx * Math.sin(th), ry * Math.cos(th));
    if (i > 0) {
      // trapezoid rule per segment
      cum[i] = cum[i - 1] + 0.5 * (metric[i - 1] + metric[i]) * dTheta;
    }
  }
  const total = cum[LUT_RES];

  function cumAt(theta: number) {
    const t = normTheta(theta);
    const idx = t / dTheta;
    const i = Math.floor(idx);
    const f = idx - i;
    if (i >= LUT_RES) return total; // exact end
    const m0 = metric[i];
    const m1 = metric[i + 1];
    // linear interp of metric within the cell, integrate with trapezoid
    const mf = m0 + (m1 - m0) * f;
    const partial = 0.5 * (m0 + mf) * (f * dTheta);
    return cum[i] + partial;
  }

  function arcLen(thetaA: number, thetaB: number) {
    const a = cumAt(thetaA);
    const b = cumAt(thetaB);
    if (normTheta(thetaB) >= normTheta(thetaA)) return b - a;
    return total - a + b; // wrap-around
  }

  function thetaAtArc(s: number) {
    // invert cumAt(theta) ≈ s (mod total) via binary search
    const target = ((s % total) + total) % total;
    let lo = 0, hi = TAU;
    for (let k = 0; k < 22; k++) {
      const mid = (lo + hi) / 2;
      const cm = cumAt(mid);
      if (cm < target) lo = mid; else hi = mid;
    }
    return hi;
  }

  return { dTheta, metric, cumAt, arcLen, thetaAtArc, total } as const;
}

export default function OrbitingProductsDemo() {
  const prefersReduced = React.useMemo(
    () => typeof window !== "undefined" && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  const [now, setNow] = React.useState(0);
  React.useEffect(() => {
    if (prefersReduced) return; // don't animate
    let raf = 0;
    const start = performance.now();
    const tick = () => { raf = requestAnimationFrame(tick); setNow(performance.now() - start); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [prefersReduced]);

  // Precompute LUT once
  const lut = React.useMemo(() => makeArcLUT(), []);

  // Per-item tilt phases and angular speed (same amplitude for all)
  const tiltPhases = React.useMemo(() => ITEMS.map((_, i) => rand01(i, 7) * TAU), []);
  const tiltOmega = (2 * Math.PI) / TILT_PERIOD_MS;

  // Uniform speed by arc-length (no ellipse speed wobble)
  const headS = ((now % DURATION_MS) / DURATION_MS) * lut.total;
  const headTheta = lut.thetaAtArc(headS);

  // Apparent radius at theta; when USE_WEIGHTS=false, all items are identical size
  const radiusAt = (theta: number, weight: number = 1) => {
    const w = USE_WEIGHTS ? weight : 1;
    return BASE_RADIUS * w * displayScaleAt(theta) * GLOBAL_SCALE;
  };

  // Initial guess: equal *arc-length* spacing for centers
  const N = ITEMS.length;
  const headArc = headS; // already arc-length param
  let thetas = new Array<number>(N);
  for (let i = 0; i < N; i++) {
    const s = headArc + (i * lut.total) / N;
    thetas[i] = lut.thetaAtArc(s);
  }

  // A few Gauss–Seidel sweeps to equalize edge gaps globally
  const SWEEPS = 3;
  for (let sweep = 0; sweep < SWEEPS; sweep++) {
    // Compute radii at current positions
    const radii = thetas.map((th, i) => radiusAt(th, ITEMS[i].sizeWeight ?? 1));
    const sumR = radii.reduce((a, b) => a + b, 0);
    // Edge gap shared by all pairs so that chain closes exactly
    let g = (lut.total - 2 * sumR) / N;
    if (g < 0) g = 0; // clamp if oversized circles

    // Reposition sequentially using current g and updated radii as we go
    for (let i = 0; i < N; i++) {
      const iNext = (i + 1) % N;
      const targetArc = g + radii[i] + radii[iNext];
      // Solve thetaNext so arcLen(thetas[i], thetaNext) == targetArc
      let lo = thetas[i] + 1e-6;
      let hi = thetas[i] + TAU - 1e-6;
      const F = (th: number) => lut.arcLen(thetas[i], th) - targetArc;
      if (F(hi) < 0) { thetas[iNext] = hi; continue; }
      for (let k = 0; k < 18; k++) {
        const mid = lo + (hi - lo) / 2;
        if (F(mid) < 0) lo = mid; else hi = mid;
      }
      thetas[iNext] = hi;
      // Update next radius to reduce lag within the same sweep
      radii[iNext] = radiusAt(thetas[iNext], ITEMS[iNext].sizeWeight ?? 1);
    }
  }

  // Prepare render nodes
  const nodes = thetas.map((theta, i) => {
    const x = cx + rx * Math.cos(theta);
    const y = cy + ry * Math.sin(theta);
    // Visual size: do not amplify by item weight unless USE_WEIGHTS
    const s = GLOBAL_SCALE * displayScaleAt(theta) * (USE_WEIGHTS ? (ITEMS[i].sizeWeight ?? 1) : 1);
    return { x, y, s, i };
  });

  // Painter's algorithm: smaller first (farther), bigger last (nearer)
  nodes.sort((a, b) => a.s - b.s);

  // ===================== DEV SELF-TESTS =====================
  const didTestRef = React.useRef(false);
  React.useEffect(() => {
    if (didTestRef.current) return; // run once after mount
    didTestRef.current = true;

    // 1) rand01 in-range test cases
    for (let idx = 0; idx < 5; idx++) {
      for (let salt = 0; salt < 4; salt++) {
        const r = rand01(idx, salt);
        console.assert(r >= 0 && r < 1, `rand01 out of range: idx=${idx} salt=${salt} r=${r}`);
      }
    }

    // 2) LUT monotonicity & wrap
    const steps = 8;
    let prev = 0;
    for (let i = 1; i <= steps; i++) {
      const th = (i / steps) * TAU;
      const cm = makeArcLUT().cumAt(th); // fresh small call for isolation
      console.assert(cm >= prev, `cumAt not monotonic at step ${i}`);
      prev = cm;
    }
    const lut2 = makeArcLUT();
    const a = 1.2345, b = 4.321;
    const wrapSum = lut2.arcLen(a, b) + lut2.arcLen(b, a);
    console.assert(Math.abs(wrapSum - lut2.total) < 1e-2, `arcLen wrap mismatch: ${wrapSum} vs ${lut2.total}`);

    // 3) Ring closure perimeter ≈ ellipse circumference
    let peri = 0;
    for (let i = 0; i < N; i++) {
      const iNext = (i + 1) % N;
      peri += lut.arcLen(thetas[i], thetas[iNext]);
    }
    console.assert(Math.abs(peri - lut.total) < 0.5, `perimeter mismatch: ${peri.toFixed(3)} vs ${lut.total.toFixed(3)}`);

    // 4) Constant edge-gap uniformity
    const radiiNow = thetas.map((th, i) => BASE_RADIUS * (USE_WEIGHTS ? (ITEMS[i].sizeWeight ?? 1) : 1) * displayScaleAt(th) * GLOBAL_SCALE);
    const edges: number[] = [];
    for (let i = 0; i < N; i++) {
      const iNext = (i + 1) % N;
      const centerLen = lut.arcLen(thetas[i], thetas[iNext]);
      edges.push(centerLen - (radiiNow[i] + radiiNow[iNext]));
    }
    const minE = Math.min(...edges), maxE = Math.max(...edges);
    console.assert(maxE - minE < 1.25, `edge gap variance too high: min=${minE.toFixed(2)} max=${maxE.toFixed(2)}`);

    // 5) Tilt periodicity & amplitude consistency
    {
      const amp = TILT_AMP_DEG;
      const t0 = 1234;
      const i0 = 0;
      const ph = tiltPhases[i0] ?? 0;
      const a1 = amp * Math.sin(tiltOmega * t0 + ph);
      const a2 = amp * Math.sin(tiltOmega * (t0 + TILT_PERIOD_MS) + ph);
      console.assert(Math.abs(a1 - a2) < 1e-6, `tilt not periodic over one cycle: ${a1} vs ${a2}`);
      for (let k = 0; k < Math.min(ITEMS.length, 5); k++) {
        const phk = tiltPhases[k] ?? 0;
        const maxMag = Math.max(
          Math.abs(amp * Math.sin(phk)),
          Math.abs(amp * Math.sin(phk + Math.PI / 2)),
          Math.abs(amp * Math.sin(phk + Math.PI))
        );
        console.assert(Math.abs(maxMag - amp) < 0.02, `tilt amplitude drift for item ${k}: ${maxMag}`);
      }
    }
  }, []);
  // =================== END DEV SELF-TESTS ===================

  return (
    <div className="w-full flex items-center justify-center py-10 bg-transparent">
      {/* Fixed-size stage so coordinates match the ellipse */}
      <div className="relative" style={{ width: 840, height: 380 }}>
        {/* Orbit track */}
        <svg className="absolute inset-0" width={840} height={380} aria-hidden>
          <ellipse cx={420} cy={190} rx={240} ry={160} fill="none" stroke="rgba(0,0,0,0.07)" strokeDasharray="4 8" />
        </svg>

        {/* Orbiting layer with global tilt */}
        <div
          className="absolute inset-0"
          style={{ transform: `rotate(${TILT_DEG}deg)`, transformOrigin: `${cx}px ${cy}px` }}
        >
          {nodes.map(({ x, y, s, i }) => (
            <div
              key={i}
              className="absolute pointer-events-none"
              style={{
                left: x,
                top: y,
                transform: `translate(-50%, -50%) scale(${s.toFixed(3)})`,
                willChange: "transform, left, top",
              }}
            >
              <div className="tilt-float" style={{ transform: `rotate(${(TILT_AMP_DEG * Math.sin(tiltOmega * now + tiltPhases[i])).toFixed(3)}deg)` }}>
                <img
                  src={ITEMS[i].src}
                  alt={ITEMS[i].label}
                  className="w-20 h-20 object-contain drop-shadow-lg"
                  style={{ transform: 'rotate(45deg)' }}
                  draggable={false}
                />
                <span className="sr-only">{ITEMS[i].label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Styles for independent tilt */}
      <style>{`
        .tilt-float {
          transform-origin: center;
          will-change: transform;
        }
      `}</style>

      {/* Reduced motion: freeze animation by not running RAF */}
    </div>
  );
}
