import { useState } from 'react'
import { useRepo } from './hooks/useRepo'
import { ChangesPanel } from './components/ChangesPanel'
import { HistoryPanel } from './components/HistoryPanel'

type Tab = 'changes' | 'history'

export default function App() {
  const repo = useRepo()
  const [tab, setTab] = useState<Tab>('changes')
  const [newBranchInput, setNewBranchInput] = useState('')
  const [showNewBranch, setShowNewBranch] = useState(false)

  const repoName = repo.repoPath?.split('/').pop() ?? null
  const changedCount = repo.stagedFiles.length + repo.unstagedFiles.length

  const handleCreateBranch = async () => {
    if (!newBranchInput.trim()) return
    await repo.createBranch(newBranchInput.trim())
    setNewBranchInput('')
    setShowNewBranch(false)
  }

  return (
    <div className="app">
      {/* Toolbar */}
      <div className="toolbar">
        <span className="repo-name">
          {repoName ?? 'No repository'}
        </span>

        {repo.branches && (
          <>
            <select
              className="branch-select"
              value={repo.branches.current}
              onChange={e => repo.checkout(e.target.value)}
              title="Switch branch"
            >
              {repo.branches.all.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            {showNewBranch ? (
              <div className="new-branch-inline">
                <input
                  autoFocus
                  className="new-branch-input"
                  placeholder="branch-name"
                  value={newBranchInput}
                  onChange={e => setNewBranchInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleCreateBranch()
                    if (e.key === 'Escape') {
                      setShowNewBranch(false)
                      setNewBranchInput('')
                    }
                  }}
                />
                <button onClick={handleCreateBranch}>Create</button>
                <button onClick={() => { setShowNewBranch(false); setNewBranchInput('') }}>✕</button>
              </div>
            ) : (
              <button onClick={() => setShowNewBranch(true)} title="New branch">+ Branch</button>
            )}
          </>
        )}

        <div className="toolbar-spacer" />

        <button onClick={repo.openDialog}>Open Repo</button>

        {repo.repoPath && (
          <>
            <button
              onClick={repo.pull}
              disabled={repo.loading}
              title="Pull from remote"
            >
              ↓ Pull{repo.status?.behind ? ` (${repo.status.behind})` : ''}
            </button>
            <button
              onClick={repo.push}
              disabled={repo.loading}
              title="Push to remote"
            >
              ↑ Push{repo.status?.ahead ? ` (${repo.status.ahead})` : ''}
            </button>
          </>
        )}
      </div>

      {/* Loading bar */}
      {repo.loading && (
        <div className="loading-bar">
          <div className="loading-bar-fill" />
        </div>
      )}

      {/* Error bar */}
      {repo.error && (
        <div className="error-bar">
          <span>{repo.error}</span>
          <button className="error-dismiss" onClick={repo.clearError}>✕</button>
        </div>
      )}

      {/* Content */}
      {!repo.repoPath ? (
        <div className="empty-state">
          <div className="empty-icon">⌥</div>
          <h2>No repository open</h2>
          <p>Open a local git repository to get started</p>
          <button className="open-btn" onClick={repo.openDialog}>
            Open Repository
          </button>
        </div>
      ) : (
        <>
          {/* Tab bar */}
          <div className="tab-bar">
            <button
              className={`tab ${tab === 'changes' ? 'active' : ''}`}
              onClick={() => setTab('changes')}
            >
              Changes{changedCount > 0 ? ` (${changedCount})` : ''}
            </button>
            <button
              className={`tab ${tab === 'history' ? 'active' : ''}`}
              onClick={() => setTab('history')}
            >
              History{repo.log.length > 0 ? ` (${repo.log.length})` : ''}
            </button>
          </div>

          <div className="panel">
            {tab === 'changes' ? (
              <ChangesPanel
                status={repo.status}
                stagedFiles={repo.stagedFiles}
                unstagedFiles={repo.unstagedFiles}
                selectedFile={repo.selectedFile}
                activeDiff={repo.activeDiff}
                onSelectFile={repo.selectFile}
                onStage={repo.stage}
                onUnstage={repo.unstage}
                onCommit={repo.commit}
              />
            ) : (
              <HistoryPanel log={repo.log} />
            )}
          </div>
        </>
      )}
    </div>
  )
}
