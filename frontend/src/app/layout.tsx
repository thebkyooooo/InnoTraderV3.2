import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: false,
})

export const metadata: Metadata = {
  title: {
    default: 'InnoTrader',
    template: '%s | InnoTrader',
  },
  description: 'InnoTrader - 스마트 주식 트레이딩 플랫폼',
  keywords: ['트레이딩', '주식', '투자', '포트폴리오'],
  authors: [{ name: 'InnoTrader Team' }],
  creator: 'InnoTrader',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  ),
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    title: 'InnoTrader',
    description: 'InnoTrader - 스마트 주식 트레이딩 플랫폼',
    siteName: 'InnoTrader',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" suppressHydrationWarning className={`${inter.variable} font-sans antialiased`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
