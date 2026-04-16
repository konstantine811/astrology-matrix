import { Canvas, useLoader } from "@react-three/fiber";
import { CameraControls, Html, Line, Stars } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

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
  selectedDate: Date;
  burstToken?: number;
  showPlanets?: boolean;
};

type CosmicPlanetNode = {
  id: string;
  planet: string;
  color: string;
  share: number;
  weight: number;
  orbitRadius: number;
  size: number;
  speed: number;
  phase: number;
  texturePath: string;
};

// Base multiplier for upward flow speed.
const BACKGROUND_SPEED_MULTIPLIER = 0.28;
const MIN_COLOR_SHARE = 0.11;

const PLANET_TEXTURES: Record<string, string> = {
  Сонце: "/textures/planets/sun.jpg",
  Земля: "/textures/planets/earth.jpg",
  Місяць: "/textures/planets/moon.jpg",
  Меркурій: "/textures/planets/mercury.jpg",
  Венера: "/textures/planets/venus.jpg",
  Марс: "/textures/planets/mars.jpg",
  Юпітер: "/textures/planets/jupiter.jpg",
  Сатурн: "/textures/planets/saturn.jpg",
  Уран: "/textures/planets/uranus.jpg",
  Нептун: "/textures/planets/neptune.jpg",
  Плутон: "/textures/planets/pluto.jpg",
  Прозерпіна: "/textures/planets/pluto.jpg",
  Вулкан: "/textures/planets/sun.jpg",
};

const PLANET_BASE_SIZES: Record<string, number> = {
  Меркурій: 0.5,
  Венера: 0.95,
  Місяць: 0.35,
  Марс: 0.62,
  Юпітер: 2.2,
  Сатурн: 2.0,
  Уран: 1.35,
  Нептун: 1.3,
  Плутон: 0.32,
  Сонце: 1.7,
  Прозерпіна: 0.35,
  Вулкан: 0.72,
};

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
  vec3 baseCol = mix(u_colorDeep, u_colorMid, 0.52);
  col = mix(baseCol, col, 0.88);

  float glow = smoothstep(0.52, 0.95, structure) * (0.35 + 0.5 * u_flowStrength);
  col += glow * u_colorHighlight * 0.35;

  float vignette = smoothstep(1.28, 0.36, length(uv - 0.5));
  col *= mix(0.9, 1.05, vignette);

  col = applyContrast(col, u_contrast);

  float dither = (hash(gl_FragCoord.xy + t * 10.0) - 0.5) * u_grain;
  col += dither;

  float alpha = u_opacity;
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

function getDateBasedAngle(date: Date, key: string): number {
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();
  const utcStart = Date.UTC(y, 0, 1);
  const utcNow = Date.UTC(y, m, d);
  const dayOfYear = Math.max(1, Math.floor((utcNow - utcStart) / 86400000) + 1);
  const yearShare = (y % 29) / 29;
  const dayShare = dayOfYear / 365.2422;
  const keyShift = seeded(`angle-${key}`) * 0.37;
  const normalized = (dayShare + yearShare + keyShift) % 1;
  return normalized * Math.PI * 2;
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

function CosmicPlanet({
  node,
  texture,
  position,
}: {
  node: CosmicPlanetNode;
  texture: THREE.Texture | null;
  position: [number, number, number];
}) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[node.size, 36, 36]} />
        <meshStandardMaterial
          map={texture ?? undefined}
          color={texture ? "#ffffff" : node.color}
          emissive={texture ? "#000000" : node.color}
          emissiveIntensity={texture ? 0 : 0.12}
          roughness={0.75}
          metalness={0.04}
        />
      </mesh>
      <Html
        position={[0, node.size + 0.42, 0]}
        center
        transform
        sprite
        distanceFactor={14}
        style={{ pointerEvents: "none" }}
      >
        <div
          style={{
            fontSize: "7px",
            fontWeight: 400,
            color: "rgba(244, 247, 255, 0.95)",
            padding: "0px 5px",
            borderRadius: "5px",
            border: "0.5px solid rgba(255, 255, 255, 0.15)",
            background: "rgba(0, 0, 0, 0.15)",
            backdropFilter: "blur(2px)",
            whiteSpace: "nowrap",
            textShadow: "0 0 10px rgba(0, 0, 0, 0.55)",
            letterSpacing: "0.2px",
          }}
        >
          {node.planet}
        </div>
      </Html>
    </group>
  );
}

function OrbitOval({ radius, color }: { radius: number; color: string }) {
  const points = useMemo(() => {
    const curve = new THREE.EllipseCurve(
      0,
      0,
      radius,
      radius * 0.66,
      0,
      Math.PI * 2,
      false,
      0,
    );
    return curve
      .getPoints(128)
      .map((p) => [p.x, 0, p.y] as [number, number, number]);
  }, [radius]);

  return (
    <Line
      points={points}
      color={color}
      transparent
      opacity={0.16}
      lineWidth={0.4}
    />
  );
}

function EarthMoonSystem({
  earthPosition,
  earthSize,
  earthTexture,
  moonOrbitRadius,
  moonPosition,
  moonSize,
  moonColor,
  moonTexture,
}: {
  earthPosition: [number, number, number];
  earthSize: number;
  earthTexture: THREE.Texture | null;
  moonOrbitRadius: number;
  moonPosition: [number, number, number];
  moonSize: number;
  moonColor: string;
  moonTexture: THREE.Texture | null;
}) {
  return (
    <group position={earthPosition}>
      <mesh>
        <sphereGeometry args={[earthSize, 36, 36]} />
        <meshStandardMaterial
          map={earthTexture ?? undefined}
          color={earthTexture ? "#ffffff" : "#8ebeff"}
          emissive={earthTexture ? "#000000" : "#35649c"}
          emissiveIntensity={earthTexture ? 0 : 0.12}
          roughness={0.44}
          metalness={0.03}
        />
      </mesh>
      <Html
        position={[0, earthSize + 0.4, 0]}
        center
        transform
        sprite
        distanceFactor={14}
        style={{ pointerEvents: "none" }}
      >
        <div
          style={{
            fontSize: "7px",
            fontWeight: 400,
            color: "rgba(244, 247, 255, 0.95)",
            padding: "0px 5px",
            borderRadius: "5px",
            border: "0.5px solid rgba(255, 255, 255, 0.15)",
            background: "rgba(0, 0, 0, 0.15)",
            backdropFilter: "blur(2px)",
            whiteSpace: "nowrap",
            textShadow: "0 0 10px rgba(0, 0, 0, 0.55)",
            letterSpacing: "0.2px",
          }}
        >
          Земля
        </div>
      </Html>

      <OrbitOval radius={moonOrbitRadius} color={moonColor} />

      <group position={moonPosition}>
        <mesh>
          <sphereGeometry args={[moonSize, 30, 30]} />
          <meshStandardMaterial
            map={moonTexture ?? undefined}
            color={moonTexture ? "#ffffff" : moonColor}
            emissive={moonTexture ? "#000000" : moonColor}
            emissiveIntensity={moonTexture ? 0 : 0.1}
            roughness={0.76}
            metalness={0.02}
          />
        </mesh>
        <Html
          position={[0, moonSize + 0.28, 0]}
          center
          transform
          sprite
          distanceFactor={14}
          style={{ pointerEvents: "none" }}
        >
          <div
            style={{
              fontSize: "6px",
              fontWeight: 400,
              color: "rgba(244, 247, 255, 0.95)",
              padding: "0px 4px",
              borderRadius: "5px",
              border: "0.5px solid rgba(255, 255, 255, 0.15)",
              background: "rgba(0, 0, 0, 0.15)",
              backdropFilter: "blur(2px)",
              whiteSpace: "nowrap",
              textShadow: "0 0 10px rgba(0, 0, 0, 0.55)",
              letterSpacing: "0.2px",
            }}
          >
            Місяць
          </div>
        </Html>
      </group>
    </group>
  );
}

function CosmicSkyScene({
  planets,
  selectedDate,
}: {
  planets: CosmicPlanetNode[];
  selectedDate: Date;
}) {
  const coreSunTexture = useLoader(THREE.TextureLoader, PLANET_TEXTURES.Сонце);
  const coreEarthTexture = useLoader(
    THREE.TextureLoader,
    PLANET_TEXTURES.Земля,
  );
  const textureUrls = useMemo(
    () => planets.map((planet) => planet.texturePath),
    [planets],
  );
  const loadedTextures = useLoader(THREE.TextureLoader, textureUrls);

  useEffect(() => {
    coreSunTexture.colorSpace = THREE.SRGBColorSpace;
    coreSunTexture.anisotropy = 4;
    coreEarthTexture.colorSpace = THREE.SRGBColorSpace;
    coreEarthTexture.anisotropy = 4;
  }, [coreSunTexture, coreEarthTexture]);
  const textureById = useMemo(() => {
    const map: Record<string, THREE.Texture | null> = {};
    planets.forEach((planet, index) => {
      const texture = loadedTextures[index] ?? null;
      if (texture) {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 4;
      }
      map[planet.id] = texture;
    });
    return map;
  }, [loadedTextures, planets]);

  const sunNode = useMemo(
    () => planets.find((planet) => planet.planet === "Сонце") ?? null,
    [planets],
  );
  const moonNode = useMemo(
    () => planets.find((planet) => planet.planet === "Місяць") ?? null,
    [planets],
  );
  const orbitingPlanets = useMemo(
    () =>
      planets
        .filter(
          (planet) =>
            planet.planet !== "Сонце" &&
            planet.planet !== "Місяць" &&
            planet.planet !== "Земля",
        )
        .sort((a, b) => b.weight - a.weight)
        .map((planet, index) => ({
          ...planet,
          orbitRadius: 10 + index * 2.35,
        })),
    [planets],
  );

  const earthOrbitRadius = 7.1;
  const earthSize = 0.88 + Math.min(0.22, (sunNode?.share ?? 0.1) * 0.7);
  const moonOrbitRadius = 2.05;
  const moonSize = moonNode?.size ?? 0.27;
  const moonColor = moonNode?.color ?? "#b8bfd6";
  const moonTexture = moonNode ? (textureById[moonNode.id] ?? null) : null;

  const earthAngle = useMemo(
    () => getDateBasedAngle(selectedDate, "Земля"),
    [selectedDate],
  );
  const earthPosition = useMemo<[number, number, number]>(() => {
    const x = Math.cos(earthAngle) * earthOrbitRadius;
    const z = Math.sin(earthAngle) * earthOrbitRadius * 0.66;
    return [x, 0, z];
  }, [earthAngle, earthOrbitRadius]);
  const moonPosition = useMemo<[number, number, number]>(() => {
    const moonAngle =
      getDateBasedAngle(selectedDate, "Місяць") + earthAngle * 0.2;
    const x = Math.cos(moonAngle) * moonOrbitRadius;
    const z = Math.sin(moonAngle) * moonOrbitRadius * 0.66;
    const y = Math.sin(moonAngle * 0.5) * 0.08;
    return [x, y, z];
  }, [selectedDate, earthAngle, moonOrbitRadius]);
  const planetPositions = useMemo<Record<string, [number, number, number]>>(
    () =>
      orbitingPlanets.reduce<Record<string, [number, number, number]>>(
        (acc, planet) => {
          const angle = getDateBasedAngle(selectedDate, planet.planet);
          const x = Math.cos(angle) * planet.orbitRadius;
          const z = Math.sin(angle) * planet.orbitRadius * 0.66;
          const y = Math.sin(angle * 0.45) * 0.25;
          acc[planet.id] = [x, y, z];
          return acc;
        },
        {},
      ),
    [orbitingPlanets, selectedDate],
  );

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[0, 0, 0]} intensity={2.2} color="#ffe7a7" />
      <pointLight position={[22, 14, 10]} intensity={0.75} color="#8dc6ff" />

      <mesh>
        <sphereGeometry args={[1.58, 40, 40]} />
        <meshStandardMaterial
          map={coreSunTexture}
          color="#ffffff"
          emissive="#ffc25c"
          emissiveIntensity={0.24}
          roughness={0.36}
          metalness={0.02}
        />
      </mesh>
      <Html
        position={[0, 2.18, 0]}
        center
        transform
        sprite
        distanceFactor={14}
        style={{ pointerEvents: "none" }}
      >
        <div
          style={{
            fontSize: "7px",
            fontWeight: 400,
            color: "rgba(244, 247, 255, 0.95)",
            padding: "0px 5px",
            borderRadius: "5px",
            border: "0.5px solid rgba(255, 255, 255, 0.15)",
            background: "rgba(0, 0, 0, 0.15)",
            backdropFilter: "blur(2px)",
            whiteSpace: "nowrap",
            textShadow: "0 0 10px rgba(0, 0, 0, 0.55)",
            letterSpacing: "0.2px",
          }}
        >
          Сонце
        </div>
      </Html>

      <OrbitOval radius={earthOrbitRadius} color="#8ebeff" />

      <EarthMoonSystem
        earthPosition={earthPosition}
        earthSize={earthSize}
        earthTexture={coreEarthTexture}
        moonOrbitRadius={moonOrbitRadius}
        moonPosition={moonPosition}
        moonSize={moonSize}
        moonColor={moonColor}
        moonTexture={moonTexture}
      />

      {orbitingPlanets.map((planet) => (
        <OrbitOval
          key={`orbit-${planet.id}`}
          radius={planet.orbitRadius}
          color={planet.color}
        />
      ))}

      {orbitingPlanets.map((planet) => (
        <CosmicPlanet
          key={planet.id}
          node={planet}
          texture={textureById[planet.id] ?? null}
          position={planetPositions[planet.id] ?? [0, 0, 0]}
        />
      ))}

      <Stars
        radius={220}
        depth={100}
        count={9000}
        factor={4.2}
        saturation={0}
        fade
        speed={0.1}
      />

      <EffectComposer multisampling={0}>
        <Bloom
          intensity={0.08}
          luminanceThreshold={0.9}
          luminanceSmoothing={0.9}
          mipmapBlur
          radius={0.24}
        />
      </EffectComposer>
      <CameraControls
        makeDefault
        minDistance={10}
        maxDistance={64}
        truckSpeed={0}
        dollySpeed={0.45}
      />
    </>
  );
}

export function Particles({
  fx,
  selectedDate,
  burstToken = 0,
  showPlanets = true,
}: ParticlesProps) {
  const colorOnlyMode = !showPlanets;
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
        ? fx.layers.reduce((acc, layer) => acc + layer.weight, 0) /
          fx.layers.length
        : 0;
    return Math.max(
      0.9,
      Math.min(2.5, 0.85 + avgWeight * 0.7 + fx.bracketField * 0.08),
    );
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

    const deepBase = hexToRgb01(fx.dominantColor);
    const midBase = hexToRgb01(fx.secondaryColor);
    const highlightBase = hexToRgb01(fx.tertiaryColor);
    const deepMix = colorOnlyMode ? 0.42 : 0.18;
    const midMix = colorOnlyMode ? 0.5 : 0.24;
    const highMix = colorOnlyMode ? 0.6 : 0.3;
    const deepBias = colorOnlyMode ? 0.1 : 0.03;
    const midBias = colorOnlyMode ? 0.13 : 0.04;
    const highBias = colorOnlyMode ? 0.16 : 0.05;
    const deep: [number, number, number] = [
      deepBase[0] * deepMix + deepBias,
      deepBase[1] * deepMix + deepBias,
      deepBase[2] * (deepMix + 0.02) + (deepBias + 0.05),
    ];
    const mid: [number, number, number] = [
      midBase[0] * midMix + midBias,
      midBase[1] * midMix + (midBias + 0.01),
      midBase[2] * (midMix + 0.02) + (midBias + 0.06),
    ];
    const highlight: [number, number, number] = [
      highlightBase[0] * highMix + highBias,
      highlightBase[1] * highMix + (highBias + 0.01),
      highlightBase[2] * (highMix + 0.02) + (highBias + 0.07),
    ];

    let rafId = 0;
    const render = (now: number) => {
      const t = now / 1000;
      const motionSpeed = Math.max(
        0.08,
        fx.speedPulse * BACKGROUND_SPEED_MULTIPLIER,
      );

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.uniform1f(uTime, t);
      gl.uniform3f(uColorDeep, deep[0], deep[1], deep[2]);
      gl.uniform3f(uColorMid, mid[0], mid[1], mid[2]);
      gl.uniform3f(uColorHighlight, highlight[0], highlight[1], highlight[2]);
      gl.uniform1f(uSpeed, motionSpeed);
      gl.uniform1f(uFlowStrength, baseFlowStrength);
      gl.uniform1f(
        uGrain,
        Math.max(0.01, fx.grain * (colorOnlyMode ? 0.62 : 0.45)),
      );
      gl.uniform1f(
        uContrast,
        colorOnlyMode
          ? Math.max(0.95, Math.min(1.2, fx.contrast * 0.9))
          : Math.max(0.86, Math.min(1.08, fx.contrast * 0.68)),
      );
      gl.uniform1f(uOpacity, colorOnlyMode ? 0.62 : 0.38);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      for (const layer of fx.layers) {
        const layerEl = layerRefs.current[layer.id];
        if (layerEl) {
          const seed = seeded(layer.id);
          const speed = motionSpeed * (0.9 + layer.weight * 0.35);
          const y = computeUpwardOffset(t, seed, speed * 42, 420);
          const scale = 0.9 + layer.weight * 0.42;
          const opacity = Math.max(
            0.08,
            Math.min(0.24, 0.08 + layer.weight * 0.12),
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
            0.04,
            Math.min(0.16, 0.04 + layer.bracketWeight * 0.1),
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
  }, [baseFlowStrength, colorOnlyMode, fx, hasWebGLError]);

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

  const planetColorOrbs = useMemo(() => {
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
      const opacity = Math.min(0.42, 0.1 + normalizedShare * 0.28);
      const alphaCore = Math.min(0.24, 0.05 + normalizedShare * 0.18);
      const alphaMid = Math.min(0.15, 0.02 + normalizedShare * 0.11);
      const blurPx = Math.max(24, 44 - normalizedShare * 10);

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
          filter: `blur(${blurPx}px) saturate(150%)`,
          transform: "translate3d(0,0,0)",
          boxShadow: `0 0 20px ${hexToRgba(item.color, 0.16)}, 0 0 56px ${hexToRgba(
            item.color,
            0.1,
          )}`,
        } as React.CSSProperties,
      };
    });
  }, [fx.layers]);

  const cosmicPlanets = useMemo<CosmicPlanetNode[]>(() => {
    const byPlanet = new Map<
      string,
      { color: string; weight: number; share: number }
    >();

    fx.layers.forEach((layer) => {
      if (!layer.planet) return;
      const current = byPlanet.get(layer.planet) ?? {
        color: layer.color,
        weight: 0,
        share: 0,
      };
      current.weight += layer.weight + layer.bracketWeight * 0.35;
      byPlanet.set(layer.planet, current);
    });

    const list = Array.from(byPlanet.entries());
    const totalWeight = Math.max(
      0.0001,
      list.reduce((sum, [, item]) => sum + item.weight, 0),
    );

    return list
      .sort((a, b) => b[1].weight - a[1].weight)
      .map(([planet, item], index) => {
        const share = item.weight / totalWeight;
        const baseSize = PLANET_BASE_SIZES[planet] ?? 0.9;
        const scaleByMatrix = 0.86 + Math.min(0.35, share * 1.15);
        return {
          id: `planet-${planet}`,
          planet,
          color: item.color,
          share,
          weight: item.weight,
          orbitRadius: 5 + index * 2.35,
          size: 0.22 + baseSize * 0.22 * scaleByMatrix,
          speed: 0.05 + share * 0.26,
          phase: seeded(planet) * Math.PI * 2,
          texturePath: PLANET_TEXTURES[planet] ?? PLANET_TEXTURES.Плутон,
        };
      })
      .sort((a, b) => b.weight - a.weight);
  }, [fx.layers]);

  if (hasWebGLError) {
    return (
      <div className="pointer-events-none fixed inset-0 z-0 bg-linear-to-br from-zinc-950 via-slate-900 to-zinc-900" />
    );
  }

  return (
    <div
      ref={hostRef}
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{
        background: `linear-gradient(135deg, #040712 0%, #070c1b 45%, #050916 100%), linear-gradient(135deg, ${hexToRgba(
          fx.dominantColor,
          colorOnlyMode ? 0.22 : 0.1,
        )} 0%, ${hexToRgba(fx.secondaryColor, colorOnlyMode ? 0.2 : 0.08)} 50%, ${hexToRgba(
          fx.tertiaryColor,
          colorOnlyMode ? 0.18 : 0.08,
        )} 100%)`,
      }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          opacity: colorOnlyMode ? 0.68 : 0.4,
          zIndex: 1,
        }}
      />

      {planetColorOrbs.map((orb) => (
        <div
          key={orb.key}
          className="absolute rounded-full"
          style={{
            ...orb.style,
            zIndex: 2,
            opacity: Number(orb.style.opacity ?? 1) * 0.38,
          }}
        />
      ))}

      {layerStyleBase.map(({ layer, style, bracketStyle }) => (
        <div key={layer.id} className="absolute inset-0">
          <div
            ref={(node) => {
              layerRefs.current[layer.id] = node;
            }}
            className="absolute rounded-full blur-[44px] mix-blend-screen"
            style={{ ...style, zIndex: 2 }}
          />
          {layer.bracketWeight > 0.001 && (
            <div
              ref={(node) => {
                bracketRefs.current[layer.id] = node;
              }}
              className="absolute rounded-full blur-[56px] mix-blend-screen"
              style={{ ...bracketStyle, zIndex: 2 }}
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
            0.08,
          )} 38%, rgba(0,0,0,0) 72%)`,
          filter: "blur(20px)",
          zIndex: 2,
        }}
      />

      <div
        ref={burstRef}
        className="absolute left-1/2 top-1/2 h-[46vmax] w-[46vmax] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: `radial-gradient(circle, ${hexToRgba(fx.dominantColor, 0.34)} 0%, rgba(0,0,0,0) 70%)`,
          opacity: 0,
          filter: "blur(12px)",
          zIndex: 2,
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          zIndex: 2,
          background: colorOnlyMode
            ? "radial-gradient(circle at 50% 45%, rgba(30, 46, 90, 0.08) 0%, rgba(8, 13, 30, 0.35) 65%, rgba(5, 8, 18, 0.52) 100%)"
            : "radial-gradient(circle at 50% 45%, rgba(15, 24, 48, 0.18) 0%, rgba(5, 9, 20, 0.6) 65%, rgba(2, 5, 12, 0.84) 100%)",
        }}
      />

      {showPlanets && (
        <div className="pointer-events-auto absolute inset-0" style={{ zIndex: 3 }}>
          <Canvas
            camera={{ position: [0, 8, 26], fov: 46 }}
            gl={{ alpha: true, antialias: true }}
            onCreated={({ gl }) => {
              gl.setClearColor(new THREE.Color("#000000"), 0);
            }}
          >
            <Suspense fallback={null}>
              <CosmicSkyScene planets={cosmicPlanets} selectedDate={selectedDate} />
            </Suspense>
          </Canvas>
        </div>
      )}
    </div>
  );
}
