export interface MenuItem {
  key: string
  label: string
  path: string
  icon?: string
  children?: MenuItem[]
  requiredAuth?: boolean
}

export const MENU_ITEMS: MenuItem[] = [
  {
    key: 'dashboard',
    label: '대시보드',
    path: '/dashboard',
    icon: 'LayoutDashboard',
    requiredAuth: true,
  },
  {
    key: 'dashboard-widgets',
    label: '트레이딩보드(위젯)',
    path: '/widgets',
    icon: 'Widgets',
    requiredAuth: true,
  },
  {
    key: 'watchlist',
    label: '관심종목',
    path: '/watchlist',
    icon: 'Star',
    requiredAuth: true,
  },
  {
    key: 'market',
    label: '마켓',
    path: '/market',
    icon: 'PieChart',
    requiredAuth: true,
    children: [
      { key: 'market-ranking', label: '시장랭킹', path: '/market/ranking' },
      { key: 'market-trend', label: '시장투자동향', path: '/market/trend' },
    ],
  },
  {
    key: 'quote',
    label: '시세',
    path: '/quote',
    icon: 'TrendingUp',
    requiredAuth: true,
    children: [
      { key: 'quote-price', label: '현재가', path: '/quote/price' },
      { key: 'quote-orderbook', label: '호가', path: '/quote/orderbook' },
      { key: 'quote-daily', label: '일별', path: '/quote/daily' },
      { key: 'quote-execution', label: '체결', path: '/quote/execution' },
      { key: 'quote-trend', label: '투자동향', path: '/quote/trend' },
      { key: 'quote-chart', label: '분석차트', path: '/quote/chart' },
    ],
  },
  {
    key: 'order',
    label: '주문',
    path: '/order',
    icon: 'ClipboardList',
    requiredAuth: true,
    children: [
      { key: 'order-order', label: '주문', path: '/order/order' },
      { key: 'order-history', label: '주문내역', path: '/order/history' },
    ],
  },
  {
    key: 'portfolio',
    label: '포트폴리오',
    path: '/portfolio',
    icon: 'Briefcase',
    requiredAuth: true,
  },
  {
    key: 'settings',
    label: '설정',
    path: '/settings',
    icon: 'Settings',
    requiredAuth: true,
  },
]

/** MENU_ITEMS를 평탄화(부모+자식 모두 포함) — 경로 매칭용. */
function flattenMenuItems(items: MenuItem[]): MenuItem[] {
  return items.flatMap((item) => [item, ...(item.children ? flattenMenuItems(item.children) : [])])
}

const FLAT_MENU_ITEMS = flattenMenuItems(MENU_ITEMS)

/**
 * 현재 경로에 해당하는 화면 타이틀 조회 (헤더 표시용).
 * 정확히 일치하는 항목을 우선하고, 없으면 하위 경로가 시작되는 부모 항목으로 대체한다.
 */
export function getPageTitle(pathname: string): string | undefined {
  const exact = FLAT_MENU_ITEMS.find((item) => item.path === pathname)
  if (exact) return exact.label
  const prefixMatch = FLAT_MENU_ITEMS
    .filter((item) => pathname.startsWith(item.path))
    .sort((a, b) => b.path.length - a.path.length)[0]
  return prefixMatch?.label
}
