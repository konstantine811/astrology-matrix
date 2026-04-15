import { useEffect, useRef, type UIEvent } from 'react'
import { getUITheme, type ThemeMode } from '../../theme/uiTheme'

type ScrollColumnProps = {
  items: readonly string[]
  selectedIndex: number
  onChange: (nextIndex: number) => void
  wrapAround?: boolean
  theme?: ThemeMode
}

const ITEM_HEIGHT = 48

function normalizeIndex(index: number, length: number): number {
  return ((index % length) + length) % length
}

export function ScrollColumn({
  items,
  selectedIndex,
  onChange,
  wrapAround = false,
  theme = 'dark',
}: ScrollColumnProps) {
  const ui = getUITheme(theme, 0.5)

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const syncingRef = useRef(false)
  const lastNotifiedIndexRef = useRef(selectedIndex)
  const renderedItems = wrapAround ? [...items, ...items, ...items] : [...items]
  const itemsLength = items.length

  useEffect(() => {
    const node = scrollRef.current
    if (!node) {
      return
    }

    const baseIndex = wrapAround ? itemsLength + selectedIndex : selectedIndex
    const targetTop = baseIndex * ITEM_HEIGHT

    if (Math.abs(node.scrollTop - targetTop) < 1) {
      lastNotifiedIndexRef.current = selectedIndex
      return
    }

    syncingRef.current = true
    node.scrollTop = targetTop
    requestAnimationFrame(() => {
      syncingRef.current = false
    })
    lastNotifiedIndexRef.current = selectedIndex
  }, [itemsLength, selectedIndex, wrapAround])

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    if (itemsLength === 0 || syncingRef.current) {
      return
    }

    const node = event.currentTarget
    if (rafRef.current) {
      return
    }

    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null

      if (wrapAround) {
        const cycleHeight = itemsLength * ITEM_HEIGHT
        const topBoundary = cycleHeight * 0.5
        const bottomBoundary = cycleHeight * 2.5

        if (node.scrollTop < topBoundary || node.scrollTop > bottomBoundary) {
          syncingRef.current = true
          node.scrollTop = normalizeIndex(Math.round(node.scrollTop / ITEM_HEIGHT), itemsLength) * ITEM_HEIGHT + cycleHeight
          requestAnimationFrame(() => {
            syncingRef.current = false
          })
        }
      }

      const rawIndex = Math.round(node.scrollTop / ITEM_HEIGHT)
      const nextIndex = wrapAround
        ? normalizeIndex(rawIndex, itemsLength)
        : Math.max(0, Math.min(rawIndex, itemsLength - 1))

      if (nextIndex !== lastNotifiedIndexRef.current) {
        lastNotifiedIndexRef.current = nextIndex
        onChange(nextIndex)
      }
    })
  }

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="no-scrollbar relative flex h-[144px] w-20 snap-y snap-mandatory flex-col overflow-y-auto overscroll-contain touch-pan-y"
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
                  ? 'scale-110 text-xl font-bold'
                  : 'scale-90 text-base font-medium'
              }`}
              style={{
                color: isSelected ? ui.text : ui.textSoft,
                opacity: isSelected ? 1 : 0.55,
                filter: isSelected
                  ? `drop-shadow(0 0 8px ${ui.ring})`
                  : 'none',
              }}
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
