import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

/**
 * MSW 브라우저 Service Worker 설정
 *
 * 사용법:
 * - 개발 환경에서 src/app/providers.tsx에서 자동 초기화됨
 * - MSW Service Worker 파일 등록 필요:
 *   npx msw init public/ --save
 *
 * 특정 핸들러만 활성화하거나 런타임에 핸들러 추가:
 * worker.use(http.get('/api/v1/test', () => HttpResponse.json({ ok: true })))
 *
 * 특정 핸들러 제거:
 * worker.resetHandlers()
 */
export const worker = setupWorker(...handlers)
