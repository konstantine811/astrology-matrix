import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Line, OrbitControls, Stars } from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import type { UITheme } from "../../theme/uiTheme";

type PlanetLegendItem = {
  planet: string;
  symbol: string;
  color: string;
  weight: number;
  share: number;
  total: number;
  norm: number;
};

type MatrixCosmogram3DProps = {
  ui: UITheme;
  items: PlanetLegendItem[];
};

type PlanetNode = PlanetLegendItem & {
  radius: number;
  speed: number;
  size: number;
  phase: number;
  yOffset: number;
};

const PLANET_TEXTURES: Record<string, string> = {
  Сонце: "/textures/planets/sun.jpg",
  Місяць: "/textures/planets/moon.jpg",
  Земля: "/textures/planets/earth.jpg",
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
  Меркурій: 0.38,
  Венера: 0.95,
  Земля: 1,
  Місяць: 0.27,
  Марс: 0.53,
  Юпітер: 2.4,
  Сатурн: 2.1,
  Уран: 1.4,
  Нептун: 1.35,
  Плутон: 0.22,
  Сонце: 1.8,
  Прозерпіна: 0.28,
  Вулкан: 0.65,
};

function usePlanetTextureMap() {
  const planetEntries = useMemo(() => Object.entries(PLANET_TEXTURES), []);
  const textureUrls = useMemo(() => planetEntries.map(([, url]) => url), [planetEntries]);
  const loaded = useLoader(THREE.TextureLoader, textureUrls);

  return useMemo(() => {
    const map: Record<string, THREE.Texture | null> = {};
    planetEntries.forEach(([planet], index) => {
      const texture = loaded[index] ?? null;
      if (texture) {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 4;
      }
      map[planet] = texture;
    });
    return map;
  }, [loaded, planetEntries]);
}

function OrbitRing({ radius, color }: { radius: number; color: string }) {
  const points = useMemo(() => {
    const curve = new THREE.EllipseCurve(0, 0, radius, radius * 0.78, 0, Math.PI * 2, false, 0);
    return curve.getPoints(128).map((p) => [p.x, 0, p.y] as [number, number, number]);
  }, [radius]);

  return (
    <Line points={points} color={color} transparent opacity={0.12} lineWidth={0.35} />
  );
}

function PlanetMesh({ node, texture }: { node: PlanetNode; texture: THREE.Texture | null }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const angle = t * node.speed + node.phase;
    const x = Math.cos(angle) * node.radius;
    const z = Math.sin(angle) * node.radius * 0.78;

    if (groupRef.current) {
      groupRef.current.position.set(x, node.yOffset, z);
      groupRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[node.size, 36, 36]} />
        <meshStandardMaterial
          map={texture ?? undefined}
          color={texture ? "#ffffff" : node.color}
          emissive={texture ? "#000000" : node.color}
          emissiveIntensity={texture ? 0 : 0.14}
          roughness={0.72}
          metalness={0.04}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[node.size * 1.22, 24, 24]} />
        <meshBasicMaterial color={node.color} transparent opacity={0.08} />
      </mesh>
    </group>
  );
}

function Scene({ items }: { items: PlanetLegendItem[] }) {
  const textures = usePlanetTextureMap();

  const nodes = useMemo<PlanetNode[]>(() => {
    const sorted = [...items].sort((a, b) => b.weight - a.weight);
    return sorted.map((item, index) => {
      const normalizedShare = Math.max(0.08, Math.min(1, item.share / 100));
      const normalizedNorm = Math.max(0, Math.min(1.4, item.norm > 0 ? item.total / item.norm : 0.25));
      const perceivedWeight = Math.min(1, normalizedShare * 0.65 + Math.min(1, normalizedNorm) * 0.35);
      const baseSize = PLANET_BASE_SIZES[item.planet] ?? 0.9;
      const influenceScale = 0.85 + perceivedWeight * 0.35;
      return {
        ...item,
        radius: 4.6 + index * 2.35,
        size: 0.42 + baseSize * 0.62 * influenceScale,
        speed: 0.1 + perceivedWeight * 0.42,
        phase: index * 0.8,
        yOffset: (index % 3) * 0.12 - 0.12,
      };
    });
  }, [items]);

  return (
    <>
      <ambientLight intensity={0.7} />
      <pointLight position={[0, 0, 0]} intensity={1.45} color="#d8ecff" />
      <pointLight position={[12, 10, 6]} intensity={1} color="#9dd8ff" />

      <mesh>
        <sphereGeometry args={[1.4, 40, 40]} />
        <meshStandardMaterial
          map={textures.Земля ?? undefined}
          color="#8bb9ff"
          emissive="#325c98"
          emissiveIntensity={0.35}
          roughness={0.45}
          metalness={0.1}
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[1.72, 36, 36]} />
        <meshBasicMaterial color="#9dc5ff" transparent opacity={0.05} />
      </mesh>

      {nodes.map((node) => (
        <group key={node.planet}>
          <OrbitRing radius={node.radius} color={node.color} />
          <PlanetMesh node={node} texture={textures[node.planet] ?? null} />
        </group>
      ))}

      <Stars radius={60} depth={28} count={1500} factor={2.2} fade speed={0.4} />
      <OrbitControls enablePan={false} minDistance={12} maxDistance={46} autoRotate autoRotateSpeed={0.35} />
    </>
  );
}

function SceneFallback() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <mesh>
        <sphereGeometry args={[1.2, 24, 24]} />
        <meshStandardMaterial color="#8bb9ff" emissive="#325c98" emissiveIntensity={0.35} />
      </mesh>
      <Stars radius={60} depth={28} count={900} factor={1.8} fade speed={0.2} />
    </>
  );
}

export function MatrixCosmogram3D({ ui, items }: MatrixCosmogram3DProps) {
  const hasItems = items.length > 0;

  return (
    <div
      className="w-full rounded-[28px] border p-3 backdrop-blur-md"
      style={{
        borderColor: ui.borderStrong,
        background: ui.surfaceSoft,
        boxShadow: ui.shadowStrong,
        color: ui.text,
      }}
    >
      <div className="rounded-2xl border p-3" style={{ borderColor: ui.border }}>
        <p className="text-sm font-semibold" style={{ color: ui.accent }}>
          3D КОСМОГРАМА МАТРИЦІ
        </p>
        <p className="mt-1 text-sm" style={{ color: ui.textMuted }}>
          Символічна 3D-візуалізація: чим ближче планета до Землі, тим сильніший
          її поточний вплив; швидкість і розмір залежать від ваг енергій матриці.
        </p>
      </div>

      <div
        className="mt-3 h-[420px] w-full overflow-hidden rounded-2xl border"
        style={{ borderColor: ui.border, background: "rgba(0,0,0,0.35)" }}
      >
        {hasItems ? (
          <Canvas camera={{ position: [0, 10, 26], fov: 48 }}>
            <Suspense fallback={<SceneFallback />}>
              <Scene items={items} />
            </Suspense>
          </Canvas>
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm" style={{ color: ui.textMuted }}>
            Немає достатніх даних для побудови космограми. Оберіть дату, щоб згенерувати планетні ваги.
          </div>
        )}
      </div>
    </div>
  );
}
