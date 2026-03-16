import { NextRequest } from "next/server"
import type { Prisma } from "@prisma/client"
import { getAnthropicClient, CLAUDE_MODEL, MAX_TOKENS } from "@/lib/ai/client"
import { VOYAGER_SYSTEM_PROMPT } from "@/lib/ai/system-prompt"
import { AI_TOOLS } from "@/lib/ai/tools"
import { executeTool } from "@/lib/ai/tool-executor"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import type Anthropic from "@anthropic-ai/sdk"

interface ChatRequestBody {
  messages: Array<{
    role: "user" | "assistant"
    content: string
  }>
  conversationId?: string
}

function buildAnthropicMessages(
  dbMessages: Array<{
    role: string
    content: string
    toolCalls: unknown
    toolResults: unknown
  }>
): Anthropic.MessageParam[] {
  const anthropicMessages: Anthropic.MessageParam[] = []

  for (const msg of dbMessages) {
    if (msg.role === "USER") {
      anthropicMessages.push({
        role: "user",
        content: msg.content,
      })
    } else if (msg.role === "ASSISTANT") {
      const contentBlocks: Anthropic.ContentBlockParam[] = []

      if (msg.content) {
        contentBlocks.push({ type: "text", text: msg.content })
      }

      if (msg.toolCalls && Array.isArray(msg.toolCalls)) {
        for (const tc of msg.toolCalls as Array<{
          id: string
          name: string
          input: Record<string, unknown>
        }>) {
          contentBlocks.push({
            type: "tool_use",
            id: tc.id,
            name: tc.name,
            input: tc.input,
          })
        }
      }

      if (contentBlocks.length > 0) {
        anthropicMessages.push({
          role: "assistant",
          content: contentBlocks,
        })
      }
    } else if (msg.role === "TOOL") {
      if (msg.toolResults && Array.isArray(msg.toolResults)) {
        anthropicMessages.push({
          role: "user",
          content: (
            msg.toolResults as Array<{
              tool_use_id: string
              content: string
            }>
          ).map((tr) => ({
            type: "tool_result" as const,
            tool_use_id: tr.tool_use_id,
            content: tr.content,
          })),
        })
      }
    }
  }

  return anthropicMessages
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const userId = session?.user?.id

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    const body = (await request.json()) as ChatRequestBody
    const { messages: incomingMessages, conversationId } = body

    if (!incomingMessages || incomingMessages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    const client = getAnthropicClient()

    // Get or create conversation
    let conversation = conversationId
      ? await prisma.conversation.findUnique({
          where: { id: conversationId },
          include: { messages: { orderBy: { createdAt: "asc" } } },
        })
      : null

    if (!conversation) {
      // Generate a title from the first user message
      const firstMessage = incomingMessages[0]?.content || "New conversation"
      const title =
        firstMessage.length > 60
          ? firstMessage.slice(0, 57) + "..."
          : firstMessage

      conversation = await prisma.conversation.create({
        data: {
          userId,
          title,
        },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      })
    }

    // Save the incoming user message
    const latestUserMessage = incomingMessages[incomingMessages.length - 1]
    if (latestUserMessage && latestUserMessage.role === "user") {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: "USER",
          content: latestUserMessage.content,
        },
      })
    }

    // Reload messages with the new one
    const allDbMessages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
    })

    // Build Anthropic message history
    let anthropicMessages = buildAnthropicMessages(allDbMessages)

    // Streaming response with tool call loop
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let continueLoop = true

          while (continueLoop) {
            const response = await client.messages.create({
              model: CLAUDE_MODEL,
              max_tokens: MAX_TOKENS,
              system: VOYAGER_SYSTEM_PROMPT,
              tools: AI_TOOLS,
              messages: anthropicMessages,
              stream: true,
            })

            let currentText = ""
            const toolCalls: Array<{
              id: string
              name: string
              input: Record<string, unknown>
              inputJson: string
            }> = []
            let stopReason: string | null = null

            for await (const event of response) {
              if (event.type === "content_block_start") {
                if (event.content_block.type === "tool_use") {
                  toolCalls.push({
                    id: event.content_block.id,
                    name: event.content_block.name,
                    input: {} as Record<string, unknown>,
                    inputJson: "",
                  })
                  // Send tool_use start event
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        type: "tool_use_start",
                        toolName: event.content_block.name,
                      })}\n\n`
                    )
                  )
                }
              } else if (event.type === "content_block_delta") {
                if (
                  event.delta.type === "text_delta"
                ) {
                  currentText += event.delta.text
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        type: "text",
                        text: event.delta.text,
                      })}\n\n`
                    )
                  )
                } else if (
                  event.delta.type === "input_json_delta"
                ) {
                  const lastTool = toolCalls[toolCalls.length - 1]
                  if (lastTool) {
                    lastTool.inputJson += event.delta.partial_json
                  }
                }
              } else if (event.type === "message_delta") {
                stopReason = event.delta.stop_reason
              }
            }

            // Parse tool call inputs
            for (const tc of toolCalls) {
              try {
                tc.input = JSON.parse(tc.inputJson) as Record<string, unknown>
              } catch {
                tc.input = {}
              }
            }

            if (stopReason === "tool_use" && toolCalls.length > 0) {
              // Save assistant message with tool calls
              await prisma.message.create({
                data: {
                  conversationId: conversation.id,
                  role: "ASSISTANT",
                  content: currentText,
                  toolCalls: toolCalls.map((tc) => ({
                    id: tc.id,
                    name: tc.name,
                    input: tc.input as Prisma.InputJsonValue,
                  })) as unknown as Prisma.InputJsonValue,
                },
              })

              // Execute all tool calls
              const toolResults: Array<{
                tool_use_id: string
                content: string
              }> = []

              for (const tc of toolCalls) {
                const result = await executeTool(tc.name, tc.input)
                const resultContent = JSON.stringify(result)
                toolResults.push({
                  tool_use_id: tc.id,
                  content: resultContent,
                })

                // Stream tool result to client
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: "tool_result",
                      toolName: tc.name,
                      toolInput: tc.input,
                      result,
                    })}\n\n`
                  )
                )
              }

              // Save tool results
              await prisma.message.create({
                data: {
                  conversationId: conversation.id,
                  role: "TOOL",
                  content: "Tool results",
                  toolResults: toolResults as unknown as Prisma.InputJsonValue,
                },
              })

              // Rebuild messages for next iteration
              const updatedMessages = await prisma.message.findMany({
                where: { conversationId: conversation.id },
                orderBy: { createdAt: "asc" },
              })
              anthropicMessages = buildAnthropicMessages(updatedMessages)
            } else {
              // No more tool calls — save final assistant message and end
              if (currentText) {
                await prisma.message.create({
                  data: {
                    conversationId: conversation.id,
                    role: "ASSISTANT",
                    content: currentText,
                  },
                })
              }

              continueLoop = false
            }
          }

          // Update conversation timestamp
          await prisma.conversation.update({
            where: { id: conversation.id },
            data: { updatedAt: new Date() },
          })

          // Send done event with conversation ID
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "done",
                conversationId: conversation.id,
              })}\n\n`
            )
          )

          controller.close()
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "An error occurred"
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                error: errorMessage,
              })}\n\n`
            )
          )
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error"
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

// GET endpoint to fetch conversations
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const userId = session?.user?.id

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const conversationId = searchParams.get("conversationId")

    if (conversationId) {
      // Fetch specific conversation with messages
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      })

      if (!conversation || conversation.userId !== userId) {
        return new Response(
          JSON.stringify({ error: "Conversation not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        )
      }

      return Response.json(conversation)
    }

    // Fetch all conversations for the user
    const conversations = await prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        tripId: true,
        _count: {
          select: { messages: true },
        },
      },
    })

    return Response.json(conversations)
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error"
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

// DELETE endpoint to remove a conversation
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    const userId = session?.user?.id

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const conversationId = searchParams.get("conversationId")

    if (!conversationId) {
      return new Response(
        JSON.stringify({ error: "conversationId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    })

    if (!conversation || conversation.userId !== userId) {
      return new Response(
        JSON.stringify({ error: "Conversation not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }

    await prisma.conversation.delete({
      where: { id: conversationId },
    })

    return Response.json({ success: true })
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error"
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
