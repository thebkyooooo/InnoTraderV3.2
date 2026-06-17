export default function SampleLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100vh] flex bg-gradient-to-br from-background to-muted">
      <div className="flex-1 flex flex-col w-full">
        {children}
      </div>
    </div>
  )
}