import { SamplePageNav } from '../../_components/SamplePageNav'

export default function SamplePageLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="border-b border-muted bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <SamplePageNav />
      </div>
      <div className="flex-1 flex items-center justify-center">
        {children}
      </div>
      <p className="text-center text-xs text-muted-foreground py-2 bg-background/80 backdrop-blur-sm">
        &copy; {new Date().getFullYear()} InnoTrader. All rights reserved.
      </p>
    </>
  )
}
