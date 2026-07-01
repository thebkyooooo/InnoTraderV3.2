import { http, HttpResponse } from 'msw'

const BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'}/api/admin/broadcast`

let currentMs = 1000

export const adminHandlers = [
  http.get(`${BASE}/interval`, () =>
    HttpResponse.json({ ms: currentMs })
  ),

  http.post(`${BASE}/interval`, async ({ request }) => {
    const body = await request.json() as { ms: number }
    if (!body?.ms || body.ms < 100 || body.ms > 60_000) {
      return new HttpResponse(null, { status: 400 })
    }
    currentMs = body.ms
    return HttpResponse.json({ ms: currentMs })
  }),
]
