#!/usr/bin/env node
/**
 * Free the Vite dev port so electron:dev can start after a crashed/previous session.
 */
import { execSync } from "node:child_process"

const PORT = Number(process.env.VITE_PORT || 5173)

function pidsListeningOnPort(port) {
  try {
    const out = execSync("netstat -ano", { encoding: "utf8" })
    const pids = new Set()
    for (const line of out.split(/\r?\n/)) {
      if (!line.includes(`:${port}`) || !/LISTENING/i.test(line)) continue
      const parts = line.trim().split(/\s+/)
      const pid = Number(parts[parts.length - 1])
      if (Number.isFinite(pid) && pid > 0) pids.add(pid)
    }
    return [...pids]
  } catch {
    return []
  }
}

function killPid(pid) {
  try {
    execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" })
    return true
  } catch {
    return false
  }
}

const pids = pidsListeningOnPort(PORT)
if (!pids.length) {
  console.log(`Port ${PORT} is free`)
  process.exit(0)
}

for (const pid of pids) {
  const ok = killPid(pid)
  console.log(ok ? `Freed port ${PORT} (killed PID ${pid})` : `Could not kill PID ${pid} on port ${PORT}`)
}
