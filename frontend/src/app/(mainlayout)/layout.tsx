import { MainLayoutClient } from './MainLayoutClient'

export const dynamic = 'force-dynamic'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <MainLayoutClient>{children}</MainLayoutClient>
}
