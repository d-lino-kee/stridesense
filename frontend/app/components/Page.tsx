export default function Page({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="container-page py-8 sm:py-10">
      <div className="mb-8 animate-fade-up">
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-ink-muted">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}
