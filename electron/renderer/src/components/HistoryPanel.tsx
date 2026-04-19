import type { GitCommit } from '../types/git'

interface Props {
  log: GitCommit[]
}

function relativeDate(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

export function HistoryPanel({ log }: Props) {
  if (log.length === 0) {
    return (
      <div className="empty-state">
        <p>No commits yet</p>
      </div>
    )
  }

  return (
    <div className="history-panel">
      <div className="history-header-row">
        <span>Hash</span>
        <span>Message</span>
        <span>Author</span>
        <span>Date</span>
      </div>
      <div className="history-list">
        {log.map(commit => (
          <div key={commit.hash} className="commit-row">
            <span className="commit-hash">{commit.hash.slice(0, 7)}</span>
            <span className="commit-message">{commit.message}</span>
            <span className="commit-author">{commit.author_name}</span>
            <span className="commit-date">{relativeDate(commit.date)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
