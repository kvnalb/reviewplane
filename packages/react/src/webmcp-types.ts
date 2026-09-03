export type RegisteredTool = { name: string; title?: string; description: string }
export type ToolExecutionOptions = { signal?: AbortSignal } | AbortSignal | undefined

export type WebMcpTool = {
  name: string
  title?: string
  description: string
  inputSchema?: object
  annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean; consequentialHint?: boolean }
  execute: (input: Record<string, unknown>, options: ToolExecutionOptions) => Promise<unknown>
}

export type ModelContext = {
  registerTool: (tool: WebMcpTool, options?: { signal?: AbortSignal }) => Promise<void>
  getTools: () => Promise<RegisteredTool[]>
  executeTool: (tool: RegisteredTool, input: string, options?: { signal?: AbortSignal }) => Promise<unknown>
}

declare global {
  interface Document { readonly modelContext?: ModelContext }
}
