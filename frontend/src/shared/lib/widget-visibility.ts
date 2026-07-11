'use client'
import { createContext, useContext } from 'react'

/**
 * 위젯(대시보드 탭)이 현재 화면에 보이는지 여부를 하위 훅들에 전달하는 컨텍스트.
 *
 * dockview/FlexLayout은 비활성 탭을 언마운트하지 않고 CSS로 숨긴 채 마운트 상태로 둔다.
 * 그래서 숨겨진 탭도 WS 구독·REST 폴링을 계속하게 되는데, 그렇다고 언마운트/리마운트로
 * 처리하면 탭 전환·리사이즈마다 콘텐츠가 깜빡인다.
 *
 * 대신 이 컨텍스트로 "지금 이 위젯이 보이는가"를 내려주고, 공유 데이터 훅들(WS/REST)이
 * 값을 읽어 `enabled`를 게이팅한다. 컴포넌트는 계속 마운트되므로 깜빡임이 없고:
 *   - 숨김 → WS 구독 해제 + REST 쿼리 비활성(캐시값 그대로 표시)
 *   - 표시 → WS 재구독 + (staleTime:0라) REST 자동 재조회
 *
 * 기본값은 true — 위젯 밖(일반 페이지)에서 훅을 쓰면 항상 활성이라 영향이 없다.
 */
export const WidgetVisibilityContext = createContext<boolean>(true)

/** 현재 위젯이 보이는지 여부. 위젯 밖에서는 항상 true. */
export function useWidgetVisible(): boolean {
  return useContext(WidgetVisibilityContext)
}
