# Violetwave — design backup

**Created:** 2026-07-12 12:41  
**Purpose:** Snapshot of the current UI / visual design before further changes.

## Included

| Path | Contents |
|------|----------|
| `src/styles/` | theme, fonts, Tailwind, index CSS |
| `src/app/App.tsx` | Root layout / navigation shell |
| `src/app/components/` | All UI screens and shared components |
| `src/main.tsx` | Renderer entry (style imports) |
| `index.html` | HTML shell |
| `public/` | Static public assets |
| `build/` | App icons / packaging visuals |
| `frontend/` | Earlier frontend / theme reference |

## Restore

From the project root:

```powershell
$bak = "backups\design_2026-07-12_12-41"
Copy-Item "$bak\src\styles\*" "src\styles\" -Recurse -Force
Copy-Item "$bak\src\app\components\*" "src\app\components\" -Recurse -Force
Copy-Item "$bak\src\app\App.tsx" "src\app\App.tsx" -Force
Copy-Item "$bak\src\main.tsx" "src\main.tsx" -Force
Copy-Item "$bak\index.html" "index.html" -Force
Copy-Item "$bak\public\*" "public\" -Recurse -Force
Copy-Item "$bak\build\*" "build\" -Recurse -Force
```

Then restart the app (`run-app.bat` or `npm run electron:dev`).
