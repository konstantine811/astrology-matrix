import type { MatrixModelTableRow } from '../../utils/modelTable'

type MatrixSummaryTableProps = {
  rows: MatrixModelTableRow[]
}

const cellBaseClass =
  'flex min-h-11 items-center justify-center border border-white/20 px-2 text-center text-sm font-semibold text-white sm:min-h-12 sm:text-base'

const cellToneClasses = {
  neutral: 'bg-white/[0.04]',
  left: 'bg-gradient-to-r from-fuchsia-500/35 to-fuchsia-400/20',
  middle: 'bg-gradient-to-r from-cyan-500/30 to-indigo-500/20',
  right: 'bg-gradient-to-r from-blue-600/35 to-purple-600/20',
  metric: 'bg-white/[0.06] text-cyan-100',
} as const

export function MatrixSummaryTable({ rows }: MatrixSummaryTableProps) {
  return (
    <div className="mb-3 w-full bg-transparent p-0">
      <div className="grid grid-cols-4 overflow-hidden rounded-xl">
        {rows.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const toneClass = (() => {
              if (rowIndex === 0) {
                return colIndex === 3 ? cellToneClasses.metric : cellToneClasses.neutral
              }

              if (rowIndex === 1) {
                if (colIndex === 0) return cellToneClasses.left
                if (colIndex === 1) return cellToneClasses.middle
                if (colIndex === 2) return 'bg-gradient-to-r from-emerald-400/35 to-yellow-300/25'
                return cellToneClasses.metric
              }

              if (rowIndex === 2) {
                if (colIndex === 0) return 'bg-gradient-to-r from-violet-500/35 to-fuchsia-500/20'
                if (colIndex === 1) return 'bg-gradient-to-r from-green-500/35 to-teal-500/20'
                if (colIndex === 2) return 'bg-gradient-to-r from-yellow-200/35 to-yellow-400/25 text-slate-900'
                return cellToneClasses.metric
              }

              if (rowIndex === 3) {
                if (colIndex === 0) return 'bg-gradient-to-r from-pink-500/35 to-purple-500/20'
                if (colIndex === 1) return cellToneClasses.middle
                if (colIndex === 2) return cellToneClasses.right
                return cellToneClasses.metric
              }

              if (colIndex === 0) return 'bg-gradient-to-r from-fuchsia-600/45 to-pink-500/35'
              if (colIndex === 1) return 'bg-white/[0.04]'
              if (colIndex === 2) return 'bg-gradient-to-r from-violet-700/40 to-indigo-700/30'
              return cellToneClasses.metric
            })()

            return (
              <div key={`${rowIndex}-${colIndex}`} className={`${cellBaseClass} ${toneClass}`}>
                {cell}
              </div>
            )
          }),
        )}
      </div>
    </div>
  )
}
