import { Plane } from "lucide-react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50">
      <div className="w-full max-w-md space-y-6 px-4">
        <div className="flex flex-col items-center space-y-2">
          <div className="flex items-center gap-2">
            <Plane className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Voyager AI</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            AI-powered business travel platform
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
