import { useState, useEffect, useCallback } from 'react'
import { gitClient, systemClient } from '../services/ipcClient'
import type { GitStatus, GitCommit, GitBranches, GitFile } from '../types/git'

interface RepoState {
  repoPath: string | null
  status: GitStatus | null
  log: GitCommit[]
  branches: GitBranches | null
  stagedFiles: GitFile[]
  unstagedFiles: GitFile[]
  selectedFile: GitFile | null
  activeDiff: string
  loading: boolean
  error: string | null
}

const INITIAL: RepoState = {
  repoPath: null,
  status: null,
  log: [],
  branches: null,
  stagedFiles: [],
  unstagedFiles: [],
  selectedFile: null,
  activeDiff: '',
  loading: false,
  error: null,
}

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : 'Unknown error'
}

export function useRepo() {
  const [state, setState] = useState<RepoState>(INITIAL)

  const patch = useCallback((update: Partial<RepoState>) => {
    setState(prev => ({ ...prev, ...update }))
  }, [])

  const setError = useCallback((msg: string) => {
    patch({ error: msg })
    setTimeout(() => patch({ error: null }), 5000)
  }, [patch])

  // Refresh: all setState calls happen after the first await, satisfying
  // react-hooks/set-state-in-effect (no synchronous setState in effect body).
  const refresh = useCallback(async (repoPath: string) => {
    try {
      const [status, log, branchSummary] = await Promise.all([
        gitClient.getStatus(repoPath),
        gitClient.getLog(repoPath),
        gitClient.getBranches(repoPath),
      ])
      const stagedFiles = status.files.filter(
        (f: GitFile) => f.index !== ' ' && f.index !== '?'
      )
      const unstagedFiles = status.files.filter(
        (f: GitFile) => f.working_dir !== ' '
      )
      const branches: GitBranches = {
        current: branchSummary.current,
        all: (branchSummary.all as string[]).filter((n: string) => !n.startsWith('remotes/')),
      }
      setState(prev => ({
        ...prev,
        status,
        log,
        branches,
        stagedFiles,
        unstagedFiles,
        loading: false,
        selectedFile: prev.selectedFile
          ? (status.files.find((f: GitFile) => f.path === prev.selectedFile!.path) ?? null)
          : null,
      }))
    } catch (err) {
      setState(prev => ({ ...prev, loading: false }))
      setError(errMsg(err))
    }
  }, [setError])

  const openRepo = useCallback(async (path: string) => {
    try {
      const isRepo = await gitClient.isRepo(path)
      if (!isRepo) {
        setError(`${path} is not a git repository`)
        return
      }
      setState(prev => ({
        ...prev,
        repoPath: path,
        loading: true,
        selectedFile: null,
        activeDiff: '',
        status: null,
        branches: null,
      }))
    } catch (err) {
      setError(errMsg(err))
    }
  }, [setError])

  // Trigger refresh when repoPath changes.
  // Loading is set synchronously in openRepo (not inside this effect body),
  // so react-hooks/set-state-in-effect is not triggered here.
  useEffect(() => {
    if (!state.repoPath) return
    // refresh only calls setState after await — not synchronous, linter false-positive
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh(state.repoPath)
  }, [state.repoPath, refresh])

  // Subscribe to repo:selected events from the main menu.
  // openRepo is stable (useCallback with stable deps), so no ref needed.
  useEffect(() => {
    if (!window.system?.onRepoSelected) return
    const cleanup = window.system.onRepoSelected(openRepo)
    return cleanup ?? undefined
  }, [openRepo])

  const openDialog = useCallback(async () => {
    try {
      const path = await systemClient.openDirectory()
      if (path) await openRepo(path)
    } catch (err) {
      setError(errMsg(err))
    }
  }, [openRepo, setError])

  const selectFile = useCallback(async (file: GitFile | null) => {
    if (!file || !state.repoPath) {
      patch({ selectedFile: null, activeDiff: '' })
      return
    }
    patch({ selectedFile: file })
    try {
      const diff = await gitClient.getDiff(state.repoPath, file.path)
      patch({ activeDiff: diff ?? '' })
    } catch {
      patch({ activeDiff: '' })
    }
  }, [state.repoPath, patch])

  const stage = useCallback(async (files: string[]) => {
    if (!state.repoPath) return
    try {
      await gitClient.stage(state.repoPath, files)
      await refresh(state.repoPath)
    } catch (err) {
      setError(errMsg(err))
    }
  }, [state.repoPath, refresh, setError])

  const unstage = useCallback(async (files: string[]) => {
    if (!state.repoPath) return
    try {
      await gitClient.unstage(state.repoPath, files)
      await refresh(state.repoPath)
    } catch (err) {
      setError(errMsg(err))
    }
  }, [state.repoPath, refresh, setError])

  const commit = useCallback(async (message: string): Promise<boolean> => {
    if (!state.repoPath) return false
    try {
      await gitClient.commit(state.repoPath, message)
      await refresh(state.repoPath)
      return true
    } catch (err) {
      setError(errMsg(err))
      return false
    }
  }, [state.repoPath, refresh, setError])

  const checkout = useCallback(async (branch: string) => {
    if (!state.repoPath) return
    setState(prev => ({
      ...prev,
      branches: prev.branches ? { ...prev.branches, current: branch } : null,
    }))
    try {
      await gitClient.checkout(state.repoPath, branch)
      await refresh(state.repoPath)
    } catch (err) {
      setError(errMsg(err))
      await refresh(state.repoPath)
    }
  }, [state.repoPath, refresh, setError])

  const createBranch = useCallback(async (name: string) => {
    if (!state.repoPath) return
    try {
      await gitClient.createBranch(state.repoPath, name)
      await refresh(state.repoPath)
    } catch (err) {
      setError(errMsg(err))
    }
  }, [state.repoPath, refresh, setError])

  const pull = useCallback(async () => {
    if (!state.repoPath) return
    patch({ loading: true })
    try {
      await gitClient.pull(state.repoPath)
      await refresh(state.repoPath)
    } catch (err) {
      patch({ loading: false })
      setError(errMsg(err))
    }
  }, [state.repoPath, patch, refresh, setError])

  const push = useCallback(async () => {
    if (!state.repoPath) return
    patch({ loading: true })
    try {
      await gitClient.push(state.repoPath)
      await refresh(state.repoPath)
    } catch (err) {
      patch({ loading: false })
      setError(errMsg(err))
    }
  }, [state.repoPath, patch, refresh, setError])

  const clearError = useCallback(() => patch({ error: null }), [patch])

  return {
    ...state,
    openDialog,
    openRepo,
    selectFile,
    stage,
    unstage,
    commit,
    checkout,
    createBranch,
    pull,
    push,
    clearError,
  }
}
