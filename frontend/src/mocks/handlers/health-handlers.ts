import { http, HttpResponse, bypass } from 'msw'

const HEALTH_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'}/actuator/health`

// 백엔드 헬스체크(providers.tsx의 isBackendAlive)를 MSW가 그냥 passthrough하면,
// 백엔드가 꺼져 있을 때 mockServiceWorker.js(서비스워커 컨텍스트) 내부에서
// 'Failed to fetch' unhandledrejection이 발생한다. 이 rejection은 메인 페이지의
// window 리스너로는 잡히지 않아 콘솔에 'Uncaught (in promise)'로 남는다.
//
// 핸들러에서 직접 bypass fetch를 try/catch로 감싸 명시적 응답을 돌려주면,
// SW 레벨 unhandledrejection이 사라지고 백엔드 자동 감지(살아있으면 200,
// 꺼져 있으면 network error)는 그대로 유지된다.
export const healthHandlers = [
  http.get(HEALTH_URL, async () => {
    try {
      const res = await fetch(bypass(HEALTH_URL))
      return res.ok ? new HttpResponse(null, { status: res.status }) : HttpResponse.error()
    } catch {
      return HttpResponse.error()
    }
  }),
]
