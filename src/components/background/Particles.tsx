import { useMemo } from 'react'

type Particle = {
  id: number
  angle: string
  travel: string
  size: string
  animationDuration: string
  animationDelay: string
  opacity: number
}

export function Particles() {
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: 90 }, (_, i) => ({
      id: i,
      angle: `${Math.random() * 360}deg`,
      travel: `${70 + Math.random() * 70}vmax`,
      size: `${0.6 + Math.random() * 1.6}px`,
      animationDuration: `${2 + Math.random() * 3.2}s`,
      animationDelay: `${Math.random() * -4.5}s`,
      opacity: 0.45 + Math.random() * 0.55,
    }))
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="warp-star"
          style={{
            ['--angle' as string]: particle.angle,
            ['--travel' as string]: particle.travel,
            ['--star-size' as string]: particle.size,
            animationDuration: particle.animationDuration,
            animationDelay: particle.animationDelay,
            opacity: particle.opacity,
          }}
        />
      ))}
    </div>
  )
}
