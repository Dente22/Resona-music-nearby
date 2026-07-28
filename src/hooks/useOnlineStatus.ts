import { useEffect, useState } from "react"

function readOnline(): boolean {
  if (typeof navigator === "undefined") return true
  return navigator.onLine !== false
}

/** Live online/offline status for dimming browser-only library tracks. */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(readOnline)

  useEffect(() => {
    const sync = () => setIsOnline(readOnline())
    window.addEventListener("online", sync)
    window.addEventListener("offline", sync)
    sync()
    return () => {
      window.removeEventListener("online", sync)
      window.removeEventListener("offline", sync)
    }
  }, [])

  return isOnline
}
