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
    key: 'settings',
    label: '설정',
    path: '/settings',
    icon: 'Settings',
    requiredAuth: true,
  },
]
