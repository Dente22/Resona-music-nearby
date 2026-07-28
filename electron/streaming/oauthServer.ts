import http from "http"
import { createHash } from "crypto"
import { OAUTH_REDIRECT_PORT } from "./config.js"

export function waitForOAuthCallback(expectedPath = "/callback"): Promise<{ code?: string; error?: string }> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const url = new URL(req.url ?? "/", `http://127.0.0.1:${OAUTH_REDIRECT_PORT}`)
        if (url.pathname !== expectedPath) {
          res.writeHead(404)
          res.end("Not found")
          return
        }
        const code = url.searchParams.get("code") ?? undefined
        const error = url.searchParams.get("error") ?? undefined
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" })
        res.end("<html><body style='font-family:sans-serif;background:#09090F;color:#F0F0FA;text-align:center;padding:40px'><h2>Violetwave</h2><p>Можно закрыть это окно и вернуться в приложение.</p></body></html>")
        server.close()
        resolve({ code, error })
      } catch (err) {
        server.close()
        reject(err)
      }
    })

    server.on("error", reject)
    server.listen(OAUTH_REDIRECT_PORT, "127.0.0.1")
  })
}

export function generatePkce(): { verifier: string; challenge: string } {
  const verifier = randomString(64)
  const challenge = base64Url(cryptoSha256(verifier))
  return { verifier, challenge }
}

function randomString(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~"
  let out = ""
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)]
  }
  return out
}

function cryptoSha256(input: string): Buffer {
  return createHash("sha256").update(input).digest()
}

function base64Url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}
