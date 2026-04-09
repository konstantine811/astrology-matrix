type MatrixPointProps = {
  x: number
  y: number
  value: number
  colorClass: string
  sizeClass: string
}

export function MatrixPoint({ x, y, value, colorClass, sizeClass }: MatrixPointProps) {
  return (
    <div
      className={`absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[1.5px] border-white/40 font-bold text-white shadow-[0_4px_10px_rgba(0,0,0,0.3)] backdrop-blur-md transition-transform duration-300 hover:scale-110 ${colorClass} ${sizeClass}`}
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      {value}
    </div>
  )
}
