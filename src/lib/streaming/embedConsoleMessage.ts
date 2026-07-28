export function extractConsoleMessage(args: unknown[]): string {
  for (const arg of args) {
    if (typeof arg === "string" && arg.trim()) return arg
    if (arg && typeof arg === "object" && "message" in arg) {
      const message = (arg as { message?: unknown }).message
      if (typeof message === "string" && message.trim()) return message
    }
  }
  return ""
}
