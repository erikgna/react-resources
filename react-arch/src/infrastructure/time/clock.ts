export const clock = {
  now(): number {
    return Date.now()
  },

  performanceNow(): number {
    return performance.now()
  },

  formatDuration(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60

    if (minutes === 0) {
      return `${seconds}s`
    }

    return `${minutes}m ${seconds}s`
  },

  formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString()
  }
}
