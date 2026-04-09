import { useEffect, useRef, type UIEvent } from 'react'

type ScrollColumnProps = {
  items: readonly string[]
  selectedIndex: number
  onChange: (nextIndex: number) => void
  wrapAround?: boolean
}

const ITEM_HEIGHT = 48

function normalizeIndex(index: number, length: number): number {
  return ((index % length) + length) % length
}

export function ScrollColumn({ items, selectedIndex, onChange, wrapAround = false }: ScrollColumnProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const scrollTimeoutRef = useRef<number | null>(null)
  const renderedItems = wrapAround ? [...items, ...items, ...items] : [...items]
  const itemsLength = items.length

  useEffect(() => {
    if (!scrollRef.current) {
      return
    }

    const baseIndex = wrapAround ? itemsLength + selectedIndex : selectedIndex
    scrollRef.current.scrollTop = baseIndex * ITEM_HEIGHT
  }, [itemsLength, selectedIndex, wrapAround])

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    if (itemsLength === 0) {
      return
    }

    if (scrollTimeoutRef.current) {
      window.clearTimeout(scrollTimeoutRef.current)
    }

    const rawIndex = Math.round(event.currentTarget.scrollTop / ITEM_HEIGHT)
    const nextIndex = wrapAround ? normalizeIndex(rawIndex, itemsLength) : Math.max(0, Math.min(rawIndex, itemsLength - 1))

    if (nextIndex !== selectedIndex) {
      onChange(nextIndex)
    }

    scrollTimeoutRef.current = window.setTimeout(() => {
      if (!scrollRef.current) {
        return
      }

      if (wrapAround) {
        const middleRawIndex = itemsLength + nextIndex
        scrollRef.current.scrollTop = middleRawIndex * ITEM_HEIGHT
        return
      }

      scrollRef.current.scrollTo({
        top: nextIndex * ITEM_HEIGHT,
        behavior: 'smooth',
      })
    }, 150)
  }

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="no-scrollbar relative flex h-[144px] w-20 snap-y snap-mandatory flex-col overflow-y-auto"
      role="listbox"
      aria-label="Date picker column"
    >
      <div className="h-12 shrink-0" />

      {renderedItems.map((item, renderedIndex) => {
        const logicalIndex = wrapAround ? normalizeIndex(renderedIndex, itemsLength) : renderedIndex
        const isSelected = logicalIndex === selectedIndex

        return (
          <div key={`${item}-${renderedIndex}`} className="flex h-12 shrink-0 snap-center items-center justify-center">
            <span
              className={`transition-all duration-300 ${
                isSelected
                  ? 'scale-110 text-xl font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                  : 'scale-90 text-base font-medium text-white/30 hover:text-white/50'
              }`}
            >
              {item}
            </span>
          </div>
        )
      })}

      <div className="h-12 shrink-0" />
    </div>
  )
}
