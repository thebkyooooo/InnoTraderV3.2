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
    key: 'watchlist',
    label: '관심종목',
    path: '/watchlist',
    icon: 'Star',
    requiredAuth: true,
  },
  {
    key: 'portfolio',
    label: '포트폴리오',
    path: '/portfolio',
    icon: 'Briefcase',
    requiredAuth: true,
  },
  {
    key: 'market',
    label: '시세',
    path: '/market',
    icon: 'TrendingUp',
    requiredAuth: true,
    children: [
      { key: 'market-price', label: '현재가', path: '/market/price' },
      { key: 'market-orderbook', label: '호가', path: '/market/orderbook' },
      { key: 'market-daily', label: '일별', path: '/market/daily' },
      { key: 'market-execution', label: '체결', path: '/market/execution' },
      { key: 'market-trend', label: '투자동향', path: '/market/trend' },
      { key: 'market-chart', label: '분석차트', path: '/market/chart' },
    ],
  },
  {
    key: 'order',
    label: '주문',
    path: '/order',
    icon: 'ClipboardList',
    requiredAuth: true,
    children: [
      { key: 'order-new', label: '주문', path: '/order/new' },
      { key: 'order-history', label: '주문내역', path: '/order/history' },
    ],
  },
  {
    key: 'settings',
    label: '설정',
    path: '/settings',
    icon: 'Settings',
    requiredAuth: true,
  },
]
