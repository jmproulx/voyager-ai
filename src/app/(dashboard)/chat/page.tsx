import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare } from "lucide-react"

export default function ChatPage() {
  return (
    <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
      <Card className="max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <MessageSquare className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>AI Travel Assistant</CardTitle>
          <CardDescription>
            Chat with your AI assistant to search flights, book hotels, manage
            trips, and more. Coming soon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Team 1 will implement the full conversational AI experience here.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
