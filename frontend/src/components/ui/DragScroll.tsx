'use client'

import React, { useRef, type PointerEvent as RPointerEvent, type MouseEvent as RMouseEvent } from 'react'

export interface DragScrollProps {
  children: React.ReactNode
  className?: string
}

/**
 * 가로 드래그 스크롤 컨테이너.
 * - 마우스: 드래그로 좌우 이동(scrollLeft 직접 조작)
 * - 터치/펜: 브라우저 native 스크롤이 처리(드래그 로직 미개입)
 * - 드래그로 이동한 경우 내부 요소의 클릭(선택)을 억제한다.
 */
export function DragScroll({ children, className = '' }: DragScrollProps) {
  const ref  = useRef<HTMLDivElement>(null)
  const drag = useRef({ active: false, startX: 0, startLeft: 0, moved: false })

  const onPointerDown = (e: RPointerEvent) => {
    if (e.pointerType !== 'mouse') return // 터치/펜은 native 스크롤에 맡김
    const el = ref.current; if (!el) return
    drag.current = { active: true, startX: e.clientX, startLeft: el.scrollLeft, moved: false }
  }
  const onPointerMove = (e: RPointerEvent) => {
    const el = ref.current, d = drag.current
    if (!el || !d.active) return
    const dx = e.clientX - d.startX
    if (Math.abs(dx) > 3) d.moved = true
    el.scrollLeft = d.startLeft - dx
  }
  const onPointerUp = () => { drag.current.active = false }
  // 드래그로 이동했다면 내부 버튼/링크 클릭 억제
  const onClickCapture = (e: RMouseEvent) => {
    if (drag.current.moved) { e.stopPropagation(); e.preventDefault(); drag.current.moved = false }
  }

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onClickCapture={onClickCapture}
      className={`overflow-x-auto cursor-grab active:cursor-grabbing select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
    >
      {children}
    </div>
  )
}
