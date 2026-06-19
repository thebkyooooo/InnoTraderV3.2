import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'InnoTrader — 대시보드' }
export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">대시보드</h1>
        <p className="text-sm text-muted-foreground mt-1">
          시장 현황 및 계좌 요약을 확인하세요.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">총 평가금액</p>
          <p className="text-2xl font-bold text-foreground font-numeric mt-1">₩ --</p>
          <p className="text-xs text-muted-foreground mt-1">데이터 로딩 중...</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">오늘 손익</p>
          <p className="text-2xl font-bold font-numeric mt-1">--</p>
          <p className="text-xs text-muted-foreground mt-1">수익률: --%</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">주문 대기</p>
          <p className="text-2xl font-bold text-foreground font-numeric mt-1">--</p>
          <p className="text-xs text-muted-foreground mt-1">미체결 주문</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-foreground">최근 체결 내역</h2>
        </div>
        <div className="p-8 text-center text-muted-foreground text-sm">
          체결 내역이 없습니다.
        </div>
      </div>
    </div>
  )
}
