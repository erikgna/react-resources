export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  if (minutes === 0) return `${seconds}s`
  return `${minutes}m ${seconds}s`
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString()
}

export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString()
}
