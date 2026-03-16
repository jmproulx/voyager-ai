import Anthropic from "@anthropic-ai/sdk"

let clientInstance: Anthropic | null = null

export function getAnthropicClient(): Anthropic {
  if (!clientInstance) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY is not set. Please add it to your .env file."
      )
    }
    clientInstance = new Anthropic({ apiKey })
  }
  return clientInstance
}

export const CLAUDE_MODEL = "claude-sonnet-4-20250514"
export const MAX_TOKENS = 4096
