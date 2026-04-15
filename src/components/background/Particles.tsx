import { useEffect, useMemo, useRef, useState } from "react";

type FlowDirection = "horizontal" | "diagonal" | "vertical" | "turbulence";

type EnergyLayerFx = {
  id: string;
  energy: number;
  planet?: string | null;
  color: string;
  weight: number;
  bracketWeight: number;
  aboveWeight: number;
  direction: FlowDirection;
  rowIndex: number;
  count: number;
  bracketCount: number;
  norm: number;
};

type BackgroundFxModel = {
  layers: EnergyLayerFx[];
  dominantColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  speedPulse: number;
  grain: number;
  contrast: number;
  texture: number;
  resonanceGlow: number;
  profile: "soft" | "balanced" | "intense";
  normalizationFactor: number;
  totalAbove: number;
  bracketField: number;
};

type ParticlesProps = {
  fx: BackgroundFxModel;
  burstToken?: number;
};

// Base multiplier for upward flow speed.
const BACKGROUND_SPEED_MULTIPLIER = 0.28;
const MIN_COLOR_SHARE = 0.11;

const VERTEX_SHADER = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;

uniform vec2 u_res;
uniform float u_time;
uniform vec3 u_colorDeep;
uniform vec3 u_colorMid;
uniform vec3 u_colorHighlight;
uniform float u_speed;
uniform float u_flowStrength;
uniform float u_grain;
uniform float u_contrast;
uniform float u_opacity;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(0.86, 0.51, -0.51, 0.86);
  for (int i = 0; i < 6; i++) {
    v += a * noise(p);
    p = rot * p * 2.0;
    a *= 0.5;
  }
  return v;
}

vec3 applyContrast(vec3 c, float contrast) {
  return clamp((c - 0.5) * contrast + 0.5, 0.0, 1.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float t = u_time * (0.14 * u_speed);
  vec2 aspect = vec2(u_res.x / max(u_res.y, 1.0), 1.0);
  vec2 p = (uv - 0.5) * aspect;

  vec2 flowP = vec2(p.x * 1.1, p.y - t * 0.35);
  float n1 = fbm(flowP * 2.8 + vec2(0.0, t * 0.2));
  float n2 = fbm((flowP + n1 * 0.45) * 4.0 - vec2(0.0, t * 0.35));
  float n3 = fbm((flowP + n2 * 0.4) * 6.5 + vec2(t * 0.15, 0.0));

  float structure = n3 * 1.15 + (n2 - 0.5) * 0.5;
  structure += (n1 - 0.5) * 0.3 * u_flowStrength;

  float lowBand = smoothstep(0.18, 0.6, structure);
  float highBand = smoothstep(0.62, 1.08, structure);
  vec3 col = mix(u_colorDeep, u_colorMid, lowBand);
  col = mix(col, u_colorHighlight, highBand);

  float glow = smoothstep(0.52, 0.95, structure) * (0.35 + 0.5 * u_flowStrength);
  col += glow * u_colorHighlight * 0.35;

  float vignette = smoothstep(1.28, 0.36, length(uv - 0.5));
  col *= mix(0.9, 1.05, vignette);

  col = applyContrast(col, u_contrast);

  float dither = (hash(gl_FragCoord.xy + t * 10.0) - 0.5) * u_grain;
  col += dither;

  float alpha = smoothstep(0.08, 0.95, structure) * u_opacity;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), clamp(alpha, 0.0, 1.0));
}
`;

function hexToRgb01(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;
  return [r, g, b];
}

function hexToRgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb01(hex);
  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${Math.max(0, Math.min(1, alpha))})`;
}

function seeded(value: string | number): number {
  const source = String(value);
  let hash = 0;
  for (let i = 0; i < source.length; i += 1) {
    hash = (hash << 5) - hash + source.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(Math.sin(hash * 12.9898) * 43758.5453) % 1;
}

function computeUpwardOffset(
  t: number,
  seed: number,
  speed: number,
  travelPx: number,
): number {
  const phase = (t * speed + seed * travelPx) % travelPx;
  return -phase;
}

export function Particles({ fx, burstToken = 0 }: ParticlesProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const haloRef = useRef<HTMLDivElement | null>(null);
  const burstRef = useRef<HTMLDivElement | null>(null);
  const layerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const bracketRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [hasWebGLError, setHasWebGLError] = useState(false);
  const burstStartedAtRef = useRef<number>(0);

  const baseFlowStrength = useMemo(() => {
    const avgWeight =
      fx.layers.length > 0
        ? fx.layers.reduce((acc, layer) => acc + layer.weight, 0) / fx.layers.length
        : 0;
    return Math.max(0.9, Math.min(2.5, 0.85 + avgWeight * 0.7 + fx.bracketField * 0.08));
  }, [fx]);

  useEffect(() => {
    burstStartedAtRef.current = performance.now();
  }, [burstToken]);

  useEffect(() => {
    if (hasWebGLError) return;

    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const gl = canvas.getContext("webgl", { antialias: true, alpha: true });
    if (!gl) {
      setHasWebGLError(true);
      return;
    }

    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vertexShader || !fragmentShader) {
      setHasWebGLError(true);
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      setHasWebGLError(true);
      return;
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      setHasWebGLError(true);
      return;
    }

    gl.useProgram(program);

    const positionLocation = gl.getAttribLocation(program, "position");
    const quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, "u_res");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uColorDeep = gl.getUniformLocation(program, "u_colorDeep");
    const uColorMid = gl.getUniformLocation(program, "u_colorMid");
    const uColorHighlight = gl.getUniformLocation(program, "u_colorHighlight");
    const uSpeed = gl.getUniformLocation(program, "u_speed");
    const uFlowStrength = gl.getUniformLocation(program, "u_flowStrength");
    const uGrain = gl.getUniformLocation(program, "u_grain");
    const uContrast = gl.getUniformLocation(program, "u_contrast");
    const uOpacity = gl.getUniformLocation(program, "u_opacity");

    if (
      !uRes ||
      !uTime ||
      !uColorDeep ||
      !uColorMid ||
      !uColorHighlight ||
      !uSpeed ||
      !uFlowStrength ||
      !uGrain ||
      !uContrast ||
      !uOpacity
    ) {
      setHasWebGLError(true);
      return;
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { width, height } = host.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);

    const deep = hexToRgb01(fx.dominantColor);
    const mid = hexToRgb01(fx.secondaryColor);
    const highlight = hexToRgb01(fx.tertiaryColor);

    let rafId = 0;
    const render = (now: number) => {
      const t = now / 1000;
      const motionSpeed = Math.max(0.08, fx.speedPulse * BACKGROUND_SPEED_MULTIPLIER);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.uniform1f(uTime, t);
      gl.uniform3f(uColorDeep, deep[0], deep[1], deep[2]);
      gl.uniform3f(uColorMid, mid[0], mid[1], mid[2]);
      gl.uniform3f(uColorHighlight, highlight[0], highlight[1], highlight[2]);
      gl.uniform1f(uSpeed, motionSpeed);
      gl.uniform1f(uFlowStrength, baseFlowStrength);
      gl.uniform1f(uGrain, fx.grain);
      gl.uniform1f(uContrast, fx.contrast);
      gl.uniform1f(uOpacity, 0.62);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      for (const layer of fx.layers) {
        const layerEl = layerRefs.current[layer.id];
        if (layerEl) {
          const seed = seeded(layer.id);
          const speed = motionSpeed * (0.9 + layer.weight * 0.35);
          const y = computeUpwardOffset(t, seed, speed * 42, 420);
          const scale = 0.9 + layer.weight * 0.42;
          const opacity = Math.max(
            0.24,
            Math.min(0.72, 0.22 + layer.weight * 0.3),
          );
          layerEl.style.transform = `translate3d(0px, ${y}px, 0) scale(${scale})`;
          layerEl.style.opacity = `${opacity}`;
        }

        const bracketEl = bracketRefs.current[layer.id];
        if (bracketEl && layer.bracketWeight > 0) {
          const seed = seeded(`${layer.id}-b`);
          const speed = motionSpeed * (0.52 + layer.bracketWeight * 0.22);
          const y = computeUpwardOffset(t * 0.8, seed, speed * 30, 300);
          const scale = 0.92 + layer.bracketWeight * 0.48;
          const opacity = Math.max(
            0.12,
            Math.min(0.44, 0.1 + layer.bracketWeight * 0.26),
          );
          bracketEl.style.transform = `translate3d(0px, ${y}px, 0) scale(${scale})`;
          bracketEl.style.opacity = `${opacity}`;
        }
      }

      if (haloRef.current) {
        const haloSize = 26 + fx.resonanceGlow * 52;
        haloRef.current.style.width = `${haloSize}vmax`;
        haloRef.current.style.height = `${haloSize}vmax`;
        haloRef.current.style.opacity = `${Math.min(0.42, 0.1 + fx.resonanceGlow * 0.2)}`;
      }

      if (burstRef.current) {
        const elapsedMs = now - burstStartedAtRef.current;
        const burstProgress = Math.max(0, 1 - elapsedMs / 1200);
        const scale = 1 + (1 - burstProgress) * 0.8;
        burstRef.current.style.opacity = `${Math.max(0, burstProgress * 0.5)}`;
        burstRef.current.style.transform = `translate(-50%, -50%) scale(${scale})`;
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      gl.deleteBuffer(quadBuffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, [baseFlowStrength, fx, hasWebGLError]);

  const layerStyleBase = useMemo(
    () =>
      fx.layers.map((layer) => {
        const seedX = seeded(`${layer.id}-x`);
        const seedY = seeded(`${layer.id}-y`);
        const size = 24 + layer.weight * 24;

        return {
          layer,
          style: {
            left: `${12 + seedX * 76}%`,
            top: `${10 + seedY * 78}%`,
            width: `${size}vmax`,
            height: `${size}vmax`,
            background: `radial-gradient(circle, ${hexToRgba(layer.color, 0.32)} 0%, ${hexToRgba(
              layer.color,
              0.14,
            )} 40%, rgba(0,0,0,0) 72%)`,
          } as React.CSSProperties,
          bracketStyle: {
            left: `${8 + seedX * 80}%`,
            top: `${8 + seedY * 82}%`,
            width: `${size * 1.05}vmax`,
            height: `${size * 1.05}vmax`,
            background: `radial-gradient(circle, ${hexToRgba(layer.color, 0.22)} 0%, ${hexToRgba(
              layer.color,
              0.08,
            )} 38%, rgba(0,0,0,0) 70%)`,
          } as React.CSSProperties,
        };
      }),
    [fx.layers],
  );

  const planetColorOrbs = useMemo(
    () => {
      const aggregated = Array.from(
        fx.layers
          .reduce((acc, layer) => {
            const key = layer.planet ?? layer.color;
            const current = acc.get(key) ?? {
              key,
              color: layer.color,
              weight: 0,
            };
            current.weight += layer.weight + layer.bracketWeight * 0.55;
            acc.set(key, current);
            return acc;
          }, new Map<string, { key: string; color: string; weight: number }>())
          .values(),
      );

      if (aggregated.length === 0) return [];

      const totalWeight = Math.max(
        0.0001,
        aggregated.reduce((sum, item) => sum + item.weight, 0),
      );

      const visualized = aggregated.map((item) => ({
        ...item,
        share: item.weight / totalWeight,
      }));

      const withFloor = visualized.map((item) => ({
        ...item,
        visualShare: Math.max(MIN_COLOR_SHARE, item.share),
      }));
      const visualSum = Math.max(
        0.0001,
        withFloor.reduce((sum, item) => sum + item.visualShare, 0),
      );

      return withFloor.map((item, idx, arr) => {
        const seedX = seeded(`${item.key}-orb-x`);
        const seedY = seeded(`${item.key}-orb-y`);
        const spread = arr.length > 0 ? idx / arr.length : 0;
        const normalizedShare = item.visualShare / visualSum;

        const size = 18 + normalizedShare * 78;
        const opacity = Math.min(0.9, 0.34 + normalizedShare * 0.82);
        const alphaCore = Math.min(0.62, 0.2 + normalizedShare * 1.05);
        const alphaMid = Math.min(0.42, 0.08 + normalizedShare * 0.68);
        const blurPx = Math.max(16, 34 - normalizedShare * 18);

        return {
          key: `${item.key}-${idx}`,
          style: {
            left: `${6 + seedX * 88}%`,
            top: `${8 + ((seedY * 78 + spread * 18) % 82)}%`,
            width: `${size}vmax`,
            height: `${size}vmax`,
            opacity,
            background: `radial-gradient(circle, ${hexToRgba(item.color, alphaCore)} 0%, ${hexToRgba(
              item.color,
              alphaMid,
            )} 38%, rgba(0,0,0,0) 72%)`,
            filter: `blur(${blurPx}px) saturate(220%)`,
            transform: "translate3d(0,0,0)",
            boxShadow: `0 0 20px ${hexToRgba(item.color, 0.36)}, 0 0 56px ${hexToRgba(
              item.color,
              0.22,
            )}`,
          } as React.CSSProperties,
        };
      });
    },
    [fx.layers],
  );

  if (hasWebGLError) {
    return (
      <div className="pointer-events-none fixed inset-0 z-0 bg-linear-to-br from-zinc-950 via-slate-900 to-zinc-900" />
    );
  }

  return (
    <div ref={hostRef} className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
        style={{ width: "100%", height: "100%", display: "block" }}
      />

      {planetColorOrbs.map((orb) => (
        <div
          key={orb.key}
          className="absolute rounded-full"
          style={orb.style}
        />
      ))}

      {layerStyleBase.map(({ layer, style, bracketStyle }) => (
        <div key={layer.id} className="absolute inset-0">
          <div
            ref={(node) => {
              layerRefs.current[layer.id] = node;
            }}
            className="absolute rounded-full blur-[44px] mix-blend-screen"
            style={style}
          />
          {layer.bracketWeight > 0.001 && (
            <div
              ref={(node) => {
                bracketRefs.current[layer.id] = node;
              }}
              className="absolute rounded-full blur-[56px] mix-blend-screen"
              style={bracketStyle}
            />
          )}
        </div>
      ))}

      <div
        ref={haloRef}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: `radial-gradient(circle, ${hexToRgba(fx.dominantColor, 0.24)} 0%, ${hexToRgba(
            fx.secondaryColor,
            0.14,
          )} 38%, rgba(0,0,0,0) 72%)`,
          filter: "blur(20px)",
        }}
      />

      <div
        ref={burstRef}
        className="absolute left-1/2 top-1/2 h-[46vmax] w-[46vmax] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: `radial-gradient(circle, ${hexToRgba(fx.dominantColor, 0.34)} 0%, rgba(0,0,0,0) 70%)`,
          opacity: 0,
          filter: "blur(12px)",
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-black/3 to-transparent" />

    </div>
  );
}
