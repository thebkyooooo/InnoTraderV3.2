export interface MenuItem {
  key: string
  label: string
  title: string
  path: string
  icon?: string
  children?: MenuItem[]
  requiredAuth?: boolean
}

export const MENU_ITEMS: MenuItem[] = [
  {
    key: 'dashboard',
    label: '대시보드',
    title: '대시보드',
    path: '/dashboard',
    icon: 'LayoutDashboard',
    requiredAuth: true,
  },
  {
    key: 'dashboard-widgets',
    label: '트레이딩보드',
    title: '트레이딩보드',
    path: '/widgets',
    icon: 'Widgets',
    requiredAuth: true,
    children: [
      { key: 'dashboard-widgets',
        label: '01. React-grid-layout',
        title: 'R 트레이딩보드 ',
        path: '/widgets' 
      },
      { key: 'widgets-dockview',
        label: '02. Dockview',
        title: 'D 트레이딩보드 ',
        path: '/widgets-dockview' 
      },
      { key: 'widgets-flexlayout',
        label: '03. FlexLayout',
        title: 'F 트레이딩보드 ',
        path: '/widgets-flexlayout' 
      },
    ],
  },
  {
    key: 'watchlist',
    label: '관심종목',
    title: '관심종목',
    path: '/watchlist',
    icon: 'Star',
    requiredAuth: true,
  },
  {
    key: 'market',
    label: '마켓',
    title: '마켓',
    path: '/market',
    icon: 'PieChart',
    requiredAuth: true,
    children: [
      { key: 'market-ranking', label: '시장랭킹', title: '시장랭킹', path: '/market/ranking' },
      { key: 'market-trend', label: '시장투자동향', title: '시장투자동향', path: '/market/trend' },
    ],
  },
  {
    key: 'quote',
    label: '시세',
    title: '시세',
    path: '/quote',
    icon: 'TrendingUp',
    requiredAuth: true,
    children: [
      { key: 'quote-price', label: '현재가', title: '현재가', path: '/quote/price' },
      { key: 'quote-orderbook', label: '호가', title: '호가', path: '/quote/orderbook' },
      { key: 'quote-daily', label: '일별', title: '일별', path: '/quote/daily' },
      { key: 'quote-execution', label: '체결', title: '체결', path: '/quote/execution' },
      { key: 'quote-trend', label: '투자동향', title: '투자동향', path: '/quote/trend' },
      { key: 'quote-chart', label: '분석차트', title: '분석차트', path: '/quote/chart' },
    ],
  },
  {
    key: 'order',
    label: '주문',
    title: '주문',
    path: '/order',
    icon: 'ClipboardList',
    requiredAuth: true,
    children: [
      { key: 'order-order', label: '주문', title: '주문', path: '/order/order' },
      { key: 'order-history', label: '주문내역', title: '주문내역', path: '/order/history' },
    ],
  },
  {
    key: 'portfolio',
    label: '포트폴리오',
    title: '포트폴리오',
    path: '/portfolio',
    icon: 'Briefcase',
    requiredAuth: true,
  },
  { 
    key: 'settings',
    label: '설정',
    title: '설정',
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
  // 부모와 자식이 같은 경로를 공유하면(예: /widgets) 자식 항목의 title을 우선한다
  const exactMatches = FLAT_MENU_ITEMS.filter((item) => item.path === pathname)
  const exact = exactMatches.find((item) => !item.children) ?? exactMatches[0]
  if (exact) return exact.title
  const prefixMatch = FLAT_MENU_ITEMS
    .filter((item) => pathname.startsWith(item.path))
    .sort((a, b) => b.path.length - a.path.length)[0]
  return prefixMatch?.title
}
