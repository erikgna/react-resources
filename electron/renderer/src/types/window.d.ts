import type { IPCResponse } from './ipc'
import type { GitFile, GitStatus, GitCommit } from './git'

declare global {
  interface Window {
    git: {
      isRepo(repoPath: string): Promise<IPCResponse<boolean>>
      getStatus(repoPath: string): Promise<IPCResponse<GitStatus>>
      stage(repoPath: string, files: string[]): Promise<IPCResponse<boolean>>
      unstage(repoPath: string, files: string[]): Promise<IPCResponse<boolean>>
      commit(repoPath: string, message: string): Promise<IPCResponse<{ commit: string; summary: unknown }>>
      getLog(repoPath: string, limit?: number): Promise<IPCResponse<GitCommit[]>>
      getBranches(repoPath: string): Promise<IPCResponse<{ current: string; all: string[] }>>
      checkout(repoPath: string, branch: string): Promise<IPCResponse<boolean>>
      createBranch(repoPath: string, branch: string): Promise<IPCResponse<boolean>>
      pull(repoPath: string): Promise<IPCResponse<unknown>>
      push(repoPath: string): Promise<IPCResponse<unknown>>
      getDiff(repoPath: string, file?: string): Promise<IPCResponse<string>>
    }
    system: {
      openDirectory(): Promise<IPCResponse<string | null>>
      openFile(): Promise<IPCResponse<string | null>>
      saveFile(defaultPath?: string): Promise<IPCResponse<string | null>>
      showItemInFolder(path: string): Promise<IPCResponse<boolean>>
      openExternal(url: string): Promise<IPCResponse<boolean>>
      notify(title: string, body: string): Promise<IPCResponse<boolean>>
      getAppVersion(): Promise<IPCResponse<string>>
      getPath(name: string): Promise<IPCResponse<string>>
      getUserDataPath(): Promise<IPCResponse<string>>
      copyToClipboard(text: string): Promise<IPCResponse<boolean>>
      onRepoSelected(callback: (path: string) => void): (() => void) | void
    }
    file: {
      readDir(dirPath: string): Promise<IPCResponse<GitFile[]>>
      readFile(filePath: string): Promise<IPCResponse<string>>
      writeFile(filePath: string, content: string): Promise<IPCResponse<boolean>>
      exists(path: string): Promise<IPCResponse<boolean>>
      createDir(path: string): Promise<IPCResponse<boolean>>
      remove(path: string): Promise<IPCResponse<boolean>>
      rename(oldPath: string, newPath: string): Promise<IPCResponse<boolean>>
      watch(dirPath: string): Promise<IPCResponse<boolean>>
      unwatch(dirPath: string): Promise<IPCResponse<boolean>>
      onChanged(callback: (data: { type: string; path: string }) => void): void
    }
    env: {
      isElectron: boolean
    }
  }
}

export {}
