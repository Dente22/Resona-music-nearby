/**
 * Compile Windows Volume Mixer helper (WASAPI) with .NET Framework csc.
 * Output: electron/bin/win-app-volume.exe
 * On non-Windows hosts this is a no-op (Linux/macOS builds).
 */
import fs from "fs"
import path from "path"
import { spawnSync } from "child_process"

if (process.platform !== "win32") {
  console.log("win-app-volume: skip (not Windows)")
  process.exit(0)
}

const root = process.cwd()
const src = path.join(root, "native", "win-app-volume", "Program.cs")
const outDir = path.join(root, "electron", "bin")
const outExe = path.join(outDir, "win-app-volume.exe")

if (!fs.existsSync(src)) {
  console.error("Missing", src)
  process.exit(1)
}

fs.mkdirSync(outDir, { recursive: true })

const cscCandidates = [
  process.env.WIN_CSC,
  "C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe",
  "C:\\Windows\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe",
].filter(Boolean)

const csc = cscCandidates.find(p => p && fs.existsSync(p))
if (!csc) {
  console.error("csc.exe not found — install .NET Framework 4.x developer pack or set WIN_CSC")
  process.exit(1)
}

const result = spawnSync(
  csc,
  ["/nologo", "/optimize+", "/target:exe", `/out:${outExe}`, src],
  { encoding: "utf8" },
)

if (result.status !== 0) {
  console.error(result.stdout || "")
  console.error(result.stderr || "")
  process.exit(result.status ?? 1)
}

console.log("Built", outExe)
