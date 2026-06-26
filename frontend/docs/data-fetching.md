# 데이터 패칭 가이드 (React Query)

InnoTrader 프론트엔드의 API 호출 규칙. 모든 서버 데이터 조회·변경은 이 규칙을 따른다.

---

## 0. 한 줄 요약

> **데이터를 독점하는 컴포넌트는 자기가 호출하고, 화면이 데이터를 조합·공유하면 페이지가 호출한다. 단 호출은 항상 React Query 훅을 통하므로 어디서 부르든 같은 `queryKey`는 자동 dedupe된다. 공유가 필요하면 페이지가 받아 제어형 prop으로 내려준다.**

---

## 1. 핵심 원칙

1. **서버 데이터는 반드시 React Query 훅으로 호출한다.** 컴포넌트/페이지에서 `useEffect + axios`로 직접 조회하지 않는다. (예외: `AnalysisChart` — §8)
2. **데이터 소유를 가장 가까운 곳에 둔다.**
   - 특정 컴포넌트가 그 데이터를 독점 → **컴포넌트 내부**에서 호출 (자율형)
   - 전용 컴포넌트가 없거나 화면이 데이터를 직접 조합 → **페이지**에서 호출
   - 여러 컴포넌트가 같은 데이터를 공유 → **페이지가 한 번 받아 제어형 prop으로** 내려줌
3. **호출 위치는 dedupe와 무관하다.** 같은 `queryKey`면 페이지에서 부르든 컴포넌트에서 부르든 React Query가 합친다.

---

## 2. 디렉토리 / 네이밍 규칙

| 구분 | 위치 | 예 |
|------|------|-----|
| axios 호출 함수 | `features/<도메인>/api/<도메인>-api.ts` | `quoteApi.getPrice(symbol)` |
| React Query 훅 | `features/<도메인>/api/use-<도메인>.ts` | `useStockPrice`, `useHoldings` |
| 무한스크롤 공통 훅 | `components/quote/_useScrollPage.ts` | `useScrollPage(fetchFn, queryKey)` |
| 전역 QueryClient 설정 | `shared/lib/query-client.ts` | `makeQueryClient()` |

훅은 `use<명사>` 형태로, 조회는 `useQuery`/`useInfiniteQuery`, 변경은 `useMutation`을 쓴다.

### 조회 훅 표준 형태

```ts
// features/quote/api/use-quote.ts
export function useStockPrice(symbol: string, options?: { enabled?: boolean }) {
  return useQuery<QuotePriceResponse>({
    queryKey: ['quote', 'price', symbol],
    queryFn: async () => (await quoteApi.getPrice(symbol)).data,
    enabled: (options?.enabled ?? true) && !!symbol,
  })
}
```

- `queryFn`은 `async () => (await api.fn()).data` — 응답 본문(`.data`)만 반환
- 필수 인자(symbol/accountNo)나 인증 토큰은 **`enabled`로 가드** (없으면 호출 안 함)
- 제어형 지원이 필요하면 `enabled` 옵션을 노출

---

## 3. queryKey 규칙

`['<도메인>', '<리소스>', ...식별자]` 배열로 구성한다. **식별자가 다르면 다른 키 = 다른 캐시.**

| 데이터 | queryKey |
|--------|----------|
| 현재가 | `['quote', 'price', symbol]` |
| 호가 | `['quote', 'hoga', symbol]` |
| 종목상세 | `['quote', 'detail', symbol]` |
| 일봉(단건) | `['quote', 'chart-daily', symbol, type, size]` |
| 일별/체결/투자동향(무한스크롤) | `['quote', 'daily'|'filled'|'trend', symbol]` |
| 계좌목록 | `['account', 'list']` |
| 보유잔고 | `['holding', accountNo]` |
| 주문내역 | `['order', 'history', accountNo, side, fill, symbol]` |
| 관심그룹 | `['watchlist', 'groups']` |
| 관심종목 | `['watchlist', 'items', groupCode]` |
| 복수종목 시세 | `['stock', 'batch', symbols.join(',')]` |

> **dedupe의 조건은 "같은 queryKey + 동시 요청"이다.** 같은 화면에서 여러 컴포넌트가 같은 키로 호출하면 1번으로 합쳐진다. (예: dashboard의 `useHoldings(accountNo)`와 `Holdings` 컴포넌트의 `useHoldings`)

---

## 4. QueryClient 전역 정책 (`shared/lib/query-client.ts`)

```ts
staleTime: 0          // 항상 stale → 이벤트마다 항상 최신 재조회 (데이터 누락 방지)
gcTime: 300_000       // 비활성 캐시 5분 후 제거
retry: 1
refetchOnWindowFocus: true
refetchOnReconnect: true
```

### `staleTime: 0`의 의미 — "이벤트마다 호출, 동시 중복은 1번"

- **이벤트 시 항상 새로 호출** (캐시로 스킵 안 함 → 누락 방지):
  마운트 / 화면 이동·재진입 / 조회 버튼(`refetch`) / 새로고침 / 창 포커스 복귀
- **동시 중복은 1번** (in-flight dedupe — `staleTime`과 무관한 기본 동작):
  StrictMode 이중 실행 / 같은 화면 여러 컴포넌트 동시 호출

> **폴링(`refetchInterval`)은 쓰지 않는다.** "시간 주기 자동 호출"이 아니라 "이벤트 기반 재조회"가 이 프로젝트의 정책이다.

**모든 쿼리는 동일 정책을 따른다.** 개별 훅에서 `staleTime`을 override하지 않는다.

---

## 5. 컴포넌트 패턴 — 자율형 / 제어형 겸용

`QuoteBoard`, `DailyChart`, `OrderBook` 등 시세 표시 컴포넌트는 두 방식을 모두 지원한다.

```tsx
interface QuoteBoardProps {
  symbol: string
  quote?: QuotePriceResponse   // 주면 제어형(표시만), 없으면 자율형(자체 조회)
  onStockSelect?: (s: StockSummary) => void
}

export function QuoteBoard({ symbol, quote, onStockSelect }: QuoteBoardProps) {
  // quote(제어형)면 호출 끄고, 아니면 자체 조회
  const { data: fetched } = useStockPrice(symbol, { enabled: !quote })
  const q = quote ?? fetched
  if (!q) return null
  // ...q로 렌더
}
```

- **단독 사용** → `<QuoteBoard symbol={symbol} />` (자율형, 자체 호출)
- **여러 컴포넌트가 같은 데이터 공유** → 페이지가 받아 내려줌 (제어형)

```tsx
// order 화면: QuoteBoard와 OrderForm이 같은 시세를 공유해야 하므로 페이지가 받아 내려준다
const { data: quote } = useStockPrice(symbol)   // 또는 페이지 자체 조회
<QuoteBoard symbol={symbol} quote={quote} />
<OrderForm symbol={symbol} name={quote?.name} currentPrice={quote?.price} />
```

---

## 6. 무한스크롤 — `useScrollPage`

커서 기반 페이지네이션 그리드(일별/체결/투자동향)는 공통 훅 `useScrollPage`(내부 `useInfiniteQuery`)를 쓴다. API가 다르므로 `fetchFn`을 주입한다.

```tsx
const { items, loading, loadMore } = useScrollPage<FilledQuoteItem>(
  (cursor) => quoteApi.getFilled(symbol, 100, cursor),  // fetchFn 주입
  ['quote', 'filled', symbol],                          // queryKey
)
```

> 그리드 코드에 `quoteApi.getFilled`가 보이지만, 즉시 실행이 아니라 **함수를 훅에 넘기는 것**이다. 실제 실행은 `useScrollPage` 내부 `useInfiniteQuery`의 `queryFn`이 한다.

---

## 7. 변경(Mutation) + 무효화

생성/수정/삭제는 `useMutation`으로, 성공 시 관련 쿼리를 `invalidateQueries`한다. (수동 재조회 금지)

```ts
export function useAddWatchlistItems() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ groupCode, symbols }: { groupCode: string; symbols: string[] }) =>
      watchlistApi.addItems(groupCode, symbols),
    onSuccess: (_d, { groupCode }) => {
      qc.invalidateQueries({ queryKey: ['watchlist', 'groups'] })
      qc.invalidateQueries({ queryKey: ['watchlist', 'items', groupCode] })
    },
  })
}
```

주문 mutation(`useBuyOrder` 등)은 `['order','history']`와 `['holding']`을 무효화한다.

---

## 8. 예외 — `AnalysisChart`

`components/quote/AnalysisChart.tsx`만 React Query를 쓰지 않고 raw `useEffect` + `quoteApi.getChartDaily/getChartTime` 직접 호출 + ref 기반 커서 무한스크롤로 동작한다.

- **이유**: 커서 페이지네이션 + 분봉 타임스탬프 클라이언트 계산 + lightweight-charts 인스턴스 생성/파괴/뷰포트 복원이 얽혀 있어, React Query 모델로 옮기면 회귀 위험이 크다. 화면당 1개만 렌더돼 dedupe 이득도 작다.
- 중복은 `loadingRef` 가드로 막는다.

> 신규 차트/그리드를 만들 때 이 패턴을 복제하지 말 것. 단건은 `useQuery`, 무한스크롤은 `useScrollPage`를 쓴다.

---

## 9. 새 API / 화면 추가 체크리스트

- [ ] axios 함수를 `features/<도메인>/api/<도메인>-api.ts`에 추가
- [ ] React Query 훅을 `features/<도메인>/api/use-<도메인>.ts`에 추가 (`queryKey` 규칙 §3, `enabled` 가드)
- [ ] 컴포넌트가 데이터를 독점하면 → 컴포넌트가 훅 호출(자율형). 공유가 필요하면 → 페이지가 호출 후 제어형 prop
- [ ] 변경 작업은 `useMutation` + `invalidateQueries`
- [ ] `useEffect + axios` 직접 호출을 만들지 않았는가
- [ ] 개별 `staleTime`/`refetchInterval`을 추가하지 않았는가 (전역 정책 사용)
- [ ] `npx tsc --noEmit` 통과

---

## 10. 안티패턴 (하지 말 것)

| ❌ 안티패턴 | ✅ 대신 |
|------------|--------|
| `useEffect`에서 `axios`/`api.fn()` 직접 호출 | React Query 훅 (`useQuery`/`useInfiniteQuery`) |
| `refetchInterval`(시간 주기 폴링) | `staleTime: 0` + 이벤트 기반 재조회 |
| 개별 훅에서 `staleTime` override | 전역 정책 통일 |
| mutation 후 `Promise.all([...수동 재조회])` | `invalidateQueries` |
| 같은 데이터를 여러 컴포넌트가 각자 호출(공유 화면에서) | 페이지가 받아 제어형 prop으로 공유 |
