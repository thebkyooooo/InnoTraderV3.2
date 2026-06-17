import { SampleComponentsNav } from '../../_components/SampleComponentsNav'

export default function SampleUiLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="border-b border-muted bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <SampleComponentsNav />
      </div>
      <div className="flex-1">
        {children}
      </div>
    </>
  )
}
