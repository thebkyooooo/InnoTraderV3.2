import { http, HttpResponse } from 'msw'

// 관심종목 API Mock — 백엔드 com.innotrader.watchlist 미러링.
// /api/private/watchlist/** (인증 필요: Authorization Bearer 헤더)

const BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'}/api/private/watchlist`

const MAX_GROUPS = 100
const MAX_ITEMS = 100

// 종목명 매핑 (없으면 코드로 대체). MSW 종목 유니버스는 stock-master-handlers의 8종목.
const NAMES: Record<string, string> = {
  '005930': '삼성전자',
  '000660': 'SK하이닉스',
  '035420': 'NAVER',
  '035720': '카카오',
  '373220': 'LG에너지솔루션',
  '005380': '현대자동차',
  '086520': '에코프로',
  '028300': 'HLB',
}
const nameOf = (symbol: string) => NAMES[symbol] ?? symbol

// ─── 인메모리 저장소 (단일 mock 사용자) ─────────────────────────────────────────
// 백엔드 시드(관심그룹01: 코스피100 / 02: 코스닥100 / 03: 랜덤50)를 구조만 미러링.
// MSW 유니버스가 8종목뿐이라 종목 수는 적다.
interface Group { code: string; name: string; symbols: string[] }
const groups: Group[] = [
  { code: '001', name: '관심그룹01', symbols: ['005930', '000660', '035420', '035720', '373220', '005380'] }, // 코스피
  { code: '002', name: '관심그룹02', symbols: ['086520', '028300'] },                                          // 코스닥
  { code: '003', name: '관심그룹03', symbols: ['005930', '086520', '035420', '028300', '005380'] },            // 랜덤 믹스
]

const nextCode = () =>
  String(Math.max(0, ...groups.map(g => parseInt(g.code, 10) || 0)) + 1).padStart(3, '0')
const findGroup = (code: string) => groups.find(g => g.code === code)
const groupResp = (g: Group) => ({ groupName: g.name, groupCode: g.code, itemCount: g.symbols.length })
const detailResp = (g: Group) => ({
  groupName: g.name,
  groupCode: g.code,
  itemCount: g.symbols.length,
  items: g.symbols.map(s => ({ name: nameOf(s), symbol: s })),
})

const unauthorized = () =>
  HttpResponse.json({ code: 'AUTH_001', message: '인증이 필요합니다.' }, { status: 401 })
const groupNotFound = () =>
  HttpResponse.json({ code: 'WATCHLIST_001', message: '관심그룹을 찾을 수 없습니다.' }, { status: 404 })
const hasAuth = (request: Request) => !!request.headers.get('Authorization')

// 기본 시드 (이름 기준 멱등). MSW 유니버스가 8종목뿐이라 종목 수는 적다.
const SEED_GROUPS: Group[] = [
  { code: '', name: '관심그룹01', symbols: ['005930', '000660', '035420', '035720', '373220', '005380'] },
  { code: '', name: '관심그룹02', symbols: ['086520', '028300'] },
  { code: '', name: '관심그룹03', symbols: ['005930', '086520', '035420', '028300', '005380'] },
]

export const watchlistHandlers = [
  // ─── 초기화 + 기본 시드 (기존 전체 삭제 후 001/002/003 재생성) ────────────────
  http.post(`${BASE}/seed`, ({ request }) => {
    if (!hasAuth(request)) return unauthorized()
    groups.length = 0
    SEED_GROUPS.forEach((seed, i) => {
      groups.push({ code: String(i + 1).padStart(3, '0'), name: seed.name, symbols: [...seed.symbols] })
    })
    return HttpResponse.json(groups.map(groupResp))
  }),

  // ─── 관심그룹 조회 ──────────────────────────────────────────────────────────
  http.get(`${BASE}/groups`, ({ request }) => {
    if (!hasAuth(request)) return unauthorized()
    return HttpResponse.json(groups.map(groupResp))
  }),

  // ─── 관심그룹 등록 ──────────────────────────────────────────────────────────
  http.post(`${BASE}/groups`, async ({ request }) => {
    if (!hasAuth(request)) return unauthorized()
    if (groups.length >= MAX_GROUPS) {
      return HttpResponse.json({ code: 'WATCHLIST_002', message: '관심그룹은 최대 100개까지 등록할 수 있습니다.' }, { status: 422 })
    }
    const { groupName } = (await request.json()) as { groupName: string }
    groups.push({ code: nextCode(), name: groupName, symbols: [] })
    return HttpResponse.json(groups.map(groupResp), { status: 201 })
  }),

  // ─── 관심그룹 변경 ──────────────────────────────────────────────────────────
  http.put(`${BASE}/groups/:code`, async ({ request, params }) => {
    if (!hasAuth(request)) return unauthorized()
    const g = findGroup(String(params.code))
    if (!g) return groupNotFound()
    const { groupName } = (await request.json()) as { groupName: string }
    g.name = groupName
    return HttpResponse.json(groups.map(groupResp))
  }),

  // ─── 관심그룹 삭제 ──────────────────────────────────────────────────────────
  http.delete(`${BASE}/groups/:code`, ({ request, params }) => {
    if (!hasAuth(request)) return unauthorized()
    const idx = groups.findIndex(g => g.code === String(params.code))
    if (idx < 0) return groupNotFound()
    groups.splice(idx, 1)
    return HttpResponse.json(groups.map(groupResp))
  }),

  // ─── 관심종목 조회 ──────────────────────────────────────────────────────────
  http.get(`${BASE}/groups/:code/items`, ({ request, params }) => {
    if (!hasAuth(request)) return unauthorized()
    const g = findGroup(String(params.code))
    if (!g) return groupNotFound()
    return HttpResponse.json(detailResp(g))
  }),

  // ─── 관심종목 추가 ──────────────────────────────────────────────────────────
  http.post(`${BASE}/groups/:code/items`, async ({ request, params }) => {
    if (!hasAuth(request)) return unauthorized()
    const g = findGroup(String(params.code))
    if (!g) return groupNotFound()
    const { symbols } = (await request.json()) as { symbols: string[] }
    for (const s of symbols) if (s && !g.symbols.includes(s)) g.symbols.push(s)
    if (g.symbols.length > MAX_ITEMS) {
      return HttpResponse.json({ code: 'WATCHLIST_003', message: '그룹당 관심종목은 최대 100개까지 등록할 수 있습니다.' }, { status: 422 })
    }
    return HttpResponse.json(detailResp(g), { status: 201 })
  }),

  // ─── 관심종목 삭제 ──────────────────────────────────────────────────────────
  http.delete(`${BASE}/groups/:code/items`, async ({ request, params }) => {
    if (!hasAuth(request)) return unauthorized()
    const g = findGroup(String(params.code))
    if (!g) return groupNotFound()
    const { symbols } = (await request.json()) as { symbols: string[] }
    g.symbols = g.symbols.filter(s => !symbols.includes(s))
    return HttpResponse.json(detailResp(g))
  }),
]
