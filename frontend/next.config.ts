import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // 백엔드 API 프록시 설정
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: (process.env.BACKEND_URL ?? 'http://localhost:8080') + '/api/:path*',
      },
    ]
  },
}

export default nextConfig
