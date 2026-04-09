import { MatrixPoint } from './MatrixPoint'
import type { MatrixData } from '../../types/matrix'

type MatrixDiagramProps = {
  matrix: MatrixData
}

const sizeClasses = {
  center: 'h-12 w-12 text-lg sm:h-14 sm:w-14 sm:text-xl',
  orthogonal: 'h-9 w-9 text-base sm:h-11 sm:w-11 sm:text-lg',
  diagonal: 'h-7 w-7 text-sm sm:h-8 sm:w-8 sm:text-base',
} as const

export function MatrixDiagram({ matrix }: MatrixDiagramProps) {
  return (
    <div className="relative mx-auto mb-4 h-[240px] w-[240px] sm:h-[280px] sm:w-[280px]">
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100">
        <polygon
          points="50,10 78.3,21.7 90,50 78.3,78.3 50,90 21.7,78.3 10,50 21.7,21.7"
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="0.5"
        />
        <polygon points="50,10 90,50 50,90 10,50" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.75" />
        <polygon points="21.7,21.7 78.3,21.7 78.3,78.3 21.7,78.3" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.75" />
        <line x1="10" y1="50" x2="90" y2="50" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
        <line x1="50" y1="10" x2="50" y2="90" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
        <line x1="21.7" y1="21.7" x2="78.3" y2="78.3" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
        <line x1="21.7" y1="78.3" x2="78.3" y2="21.7" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
        <circle cx="50" cy="50" r="14" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
        <circle cx="50" cy="50" r="28" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" strokeDasharray="2,2" />
      </svg>

      <MatrixPoint
        x={50}
        y={50}
        value={matrix.E}
        colorClass="bg-amber-500/90 shadow-[0_0_20px_rgba(245,158,11,0.5)]"
        sizeClass={sizeClasses.center}
      />

      <MatrixPoint x={10} y={50} value={matrix.A} colorClass="bg-purple-500/80" sizeClass={sizeClasses.orthogonal} />
      <MatrixPoint x={50} y={10} value={matrix.B} colorClass="bg-indigo-500/80" sizeClass={sizeClasses.orthogonal} />
      <MatrixPoint x={90} y={50} value={matrix.C} colorClass="bg-emerald-500/80" sizeClass={sizeClasses.orthogonal} />
      <MatrixPoint x={50} y={90} value={matrix.D} colorClass="bg-rose-500/80" sizeClass={sizeClasses.orthogonal} />

      <MatrixPoint x={21.7} y={21.7} value={matrix.TL} colorClass="bg-blue-400/80" sizeClass={sizeClasses.diagonal} />
      <MatrixPoint x={78.3} y={21.7} value={matrix.TR} colorClass="bg-pink-400/80" sizeClass={sizeClasses.diagonal} />
      <MatrixPoint x={21.7} y={78.3} value={matrix.BL} colorClass="bg-cyan-400/80" sizeClass={sizeClasses.diagonal} />
      <MatrixPoint x={78.3} y={78.3} value={matrix.BR} colorClass="bg-fuchsia-400/80" sizeClass={sizeClasses.diagonal} />
    </div>
  )
}
