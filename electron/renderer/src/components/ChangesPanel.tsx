import { useState } from 'react'
import type { GitFile, GitStatus } from '../types/git'

interface Props {
  status: GitStatus | null
  stagedFiles: GitFile[]
  unstagedFiles: GitFile[]
  selectedFile: GitFile | null
  activeDiff: string
  onSelectFile: (file: GitFile | null) => void
  onStage: (files: string[]) => Promise<void>
  onUnstage: (files: string[]) => Promise<void>
  onCommit: (message: string) => Promise<boolean>
}

function statusColor(ch: string) {
  switch (ch) {
    case 'M': return 'var(--status-m)'
    case 'A': return 'var(--status-a)'
    case 'D': return 'var(--status-d)'
    case 'R': return 'var(--status-r)'
    default:  return 'var(--text-muted)'
  }
}

function FileRow({
  file,
  statusChar,
  selected,
  actionLabel,
  onSelect,
  onAction,
}: {
  file: GitFile
  statusChar: string
  selected: boolean
  actionLabel: string
  onSelect: () => void
  onAction: () => void
}) {
  const filename = file.path.split('/').pop() ?? file.path
  return (
    <div
      className={`file-row ${selected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <span className="file-status-badge" style={{ color: statusColor(statusChar) }}>
        {statusChar}
      </span>
      <span className="file-name" title={file.path}>{filename}</span>
      <button
        className="file-action-btn"
        onClick={e => { e.stopPropagation(); onAction() }}
        title={actionLabel === '+' ? 'Stage' : 'Unstage'}
      >
        {actionLabel}
      </button>
    </div>
  )
}

function DiffViewer({ diff, file }: { diff: string; file: GitFile | null }) {
  if (!file) {
    return (
      <div className="diff-empty">
        Select a file to view its diff
      </div>
    )
  }
  if (!diff) {
    return (
      <div className="diff-empty">
        No diff available
        {file.working_dir === '?' ? ' (untracked file)' : ''}
      </div>
    )
  }

  return (
    <div className="diff-content">
      {diff.split('\n').map((line, i) => {
        let cls = 'diff-line'
        if (line.startsWith('+++') || line.startsWith('---') ||
            line.startsWith('diff ') || line.startsWith('index ')) {
          cls += ' diff-meta'
        } else if (line.startsWith('+')) {
          cls += ' diff-add'
        } else if (line.startsWith('-')) {
          cls += ' diff-del'
        } else if (line.startsWith('@@')) {
          cls += ' diff-hunk'
        }
        return (
          <div key={i} className={cls}>
            {line || '\u00a0'}
          </div>
        )
      })}
    </div>
  )
}

export function ChangesPanel({
  status,
  stagedFiles,
  unstagedFiles,
  selectedFile,
  activeDiff,
  onSelectFile,
  onStage,
  onUnstage,
  onCommit,
}: Props) {
  const [message, setMessage] = useState('')
  const [committing, setCommitting] = useState(false)

  const handleCommit = async () => {
    if (!message.trim() || stagedFiles.length === 0 || committing) return
    setCommitting(true)
    const ok = await onCommit(message.trim())
    if (ok) setMessage('')
    setCommitting(false)
  }

  return (
    <div className="changes-layout">
      {/* Left column: file lists + commit */}
      <div className="changes-left">
        <div className="file-lists">
          {/* Unstaged */}
          <div className="file-section">
            <div className="section-header">
              <span>Unstaged ({unstagedFiles.length})</span>
              {unstagedFiles.length > 0 && (
                <button
                  className="section-action"
                  onClick={() => onStage(unstagedFiles.map(f => f.path))}
                >
                  Stage all
                </button>
              )}
            </div>
            {unstagedFiles.length === 0 ? (
              <div className="section-empty">No unstaged changes</div>
            ) : (
              unstagedFiles.map(file => (
                <FileRow
                  key={`u:${file.path}`}
                  file={file}
                  statusChar={file.working_dir === '?' ? '?' : file.working_dir}
                  selected={selectedFile?.path === file.path}
                  actionLabel="+"
                  onSelect={() => onSelectFile(file)}
                  onAction={() => onStage([file.path])}
                />
              ))
            )}
          </div>

          {/* Staged */}
          <div className="file-section">
            <div className="section-header">
              <span>Staged ({stagedFiles.length})</span>
              {stagedFiles.length > 0 && (
                <button
                  className="section-action"
                  onClick={() => onUnstage(stagedFiles.map(f => f.path))}
                >
                  Unstage all
                </button>
              )}
            </div>
            {stagedFiles.length === 0 ? (
              <div className="section-empty">No staged changes</div>
            ) : (
              stagedFiles.map(file => (
                <FileRow
                  key={`s:${file.path}`}
                  file={file}
                  statusChar={file.index}
                  selected={selectedFile?.path === file.path}
                  actionLabel="−"
                  onSelect={() => onSelectFile(file)}
                  onAction={() => onUnstage([file.path])}
                />
              ))
            )}
          </div>
        </div>

        {/* Commit box */}
        <div className="commit-box">
          <textarea
            className="commit-input"
            placeholder="Commit message (Cmd+Enter to commit)"
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleCommit()
            }}
          />
          <button
            className="commit-btn"
            onClick={handleCommit}
            disabled={!message.trim() || stagedFiles.length === 0 || committing}
          >
            {committing
              ? 'Committing…'
              : `Commit to ${status?.current ?? '…'}`}
          </button>
        </div>
      </div>

      {/* Right column: diff */}
      <div className="changes-right">
        {selectedFile && (
          <div className="diff-header">
            <span className="diff-filename">{selectedFile.path}</span>
          </div>
        )}
        <div className="diff-scroll">
          <DiffViewer diff={activeDiff} file={selectedFile} />
        </div>
      </div>
    </div>
  )
}
