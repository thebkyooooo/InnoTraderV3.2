'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRef, useCallback } from 'react'

const NAV_GROUPS = [
  {
    items: [
      { label: '로그인', href: '/sample/page/login' },
      { label: '대시보드', href: '/sample/page/dashboard' },
      { label: '관심종목', href: '/sample/page/watchlist' },
      { label: '포트폴리오', href: '/sample/page/portfolio' },
      { label: '설정', href: '/sample/page/settings' },
    ],
  },
  {
    label: '시세',
    items: [
      { label: '현재가', href: '/sample/page/quote/price' },
      { label: '호가', href: '/sample/page/quote/orderbook' },
      { label: '일별', href: '/sample/page/quote/daily' },
      { label: '체결', href: '/sample/page/quote/execution' },
      { label: '투자동향', href: '/sample/page/quote/trend' },
      { label: '분석차트', href: '/sample/page/quote/chart' },
    ],
  },
  {
    label: '주문',
    items: [
      { label: '주문', href: '/sample/page/order/new' },
      { label: '주문내역', href: '/sample/page/order/history' },
    ],
  },
]

export function SamplePageNav() {
  const pathname = usePathname()
  const navRef = useRef<HTMLElement>(null)
  const dragging = useRef(false)
  const startX = useRef(0)
  const scrollLeft = useRef(0)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true
    startX.current = e.pageX - (navRef.current?.offsetLeft ?? 0)
    scrollLeft.current = navRef.current?.scrollLeft ?? 0
    if (navRef.current) navRef.current.style.cursor = 'grabbing'
  }, [])

  const onMouseUp = useCallback(() => {
    dragging.current = false
    if (navRef.current) navRef.current.style.cursor = 'grab'
  }, [])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging.current || !navRef.current) return
    e.preventDefault()
    const x = e.pageX - navRef.current.offsetLeft
    const walk = x - startX.current
    navRef.current.scrollLeft = scrollLeft.current - walk
  }, [])

  return (
    <nav
      ref={navRef}
      className="flex items-center gap-1 px-2 py-2 overflow-x-auto select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{ cursor: 'grab' }}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onMouseMove={onMouseMove}
    >
      {/* <span className="text-xs font-semibold text-foreground/60 px-1 mr-1 shrink-0">페이지 샘플</span> */}
      {NAV_GROUPS.map((group, gi) => (
        <div key={gi} className="flex items-center gap-1 shrink-0">
          {gi > 0 && <span className="text-muted-foreground/40 mx-1 text-xs">|</span>}
          {group.label && (
            <span className="text-xs text-muted-foreground font-medium mr-1">{group.label}</span>
          )}
          {group.items.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                draggable={false}
                className={`px-2.5 py-1.5 rounded-[3px] text-xs font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-primary/10 text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
      ))}
      <div className="text-xs font-semibold text-foreground/60 px-1 mr-1 shrink-0 ml-auto">
        <Link href={'/sample/ui'} className='px-2.5 py-1.5 rounded-[3px] text-xs font-semibold transition-colors whitespace-nowrap bg-gray-200 hover:bg-gray-300/70'>
          컴포넌트
        </Link>
      </div>
    </nav>
  )
}
