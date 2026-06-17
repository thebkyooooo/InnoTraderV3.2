import '@testing-library/jest-dom'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { setupServer } from 'msw/node'
import { handlers } from '@/mocks/handlers'
import { axiosInstance } from '@/shared/api/axios-instance'

// Vitest(Node) 환경에서는 MSW가 상대 경로(/api/v1/...)로 핸들러를 등록하므로
// axios baseURL을 빈 문자열로 설정하여 요청 URL과 핸들러 URL을 일치시킴
axiosInstance.defaults.baseURL = ''

/**
 * MSW Node 서버 (vitest 환경)
 * 브라우저용 worker와 별개로 Node.js 환경에서 동작하는 서버
 */
export const server = setupServer(...handlers)

// 전체 테스트 시작 전 MSW 서버 시작
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

// 각 테스트 후 핸들러 초기화 (테스트 간 격리)
afterEach(() => {
  server.resetHandlers()
})

// 전체 테스트 종료 후 서버 닫기
afterAll(() => {
  server.close()
})
