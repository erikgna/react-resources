export type { IPCResponse } from '../types/ipc'
import type { IPCResponse } from '../types/ipc'

// ----------------------
// Core helpers
// ----------------------
export async function unwrap<T>(
    promise: Promise<IPCResponse<T>>
): Promise<T> {
    const res = await promise

    if (!res.success) {
        throw new Error(res.error)
    }

    return res.data
}

export async function safeCall<T>(
    promise: Promise<IPCResponse<T>>
): Promise<[T | null, string | null]> {
    try {
        const res = await promise

        if (!res.success) {
            return [null, res.error]
        }

        return [res.data, null]
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        return [null, msg]
    }
}

// ----------------------
// Domain clients
// ----------------------
export const gitClient = {
    isRepo(repoPath: string) {
        return unwrap(window.git.isRepo(repoPath))
    },

    getStatus(repoPath: string) {
        return unwrap(window.git.getStatus(repoPath))
    },

    stage(repoPath: string, files: string[]) {
        return unwrap(window.git.stage(repoPath, files))
    },

    unstage(repoPath: string, files: string[]) {
        return unwrap(window.git.unstage(repoPath, files))
    },

    commit(repoPath: string, message: string) {
        return unwrap(window.git.commit(repoPath, message))
    },

    getLog(repoPath: string, limit?: number) {
        return unwrap(window.git.getLog(repoPath, limit))
    },

    getBranches(repoPath: string) {
        return unwrap(window.git.getBranches(repoPath))
    },

    checkout(repoPath: string, branch: string) {
        return unwrap(window.git.checkout(repoPath, branch))
    },

    createBranch(repoPath: string, branch: string) {
        return unwrap(window.git.createBranch(repoPath, branch))
    },

    pull(repoPath: string) {
        return unwrap(window.git.pull(repoPath))
    },

    push(repoPath: string) {
        return unwrap(window.git.push(repoPath))
    },

    getDiff(repoPath: string, file?: string) {
        return unwrap(window.git.getDiff(repoPath, file))
    },
}

export const systemClient = {
    openDirectory() {
        console.log('openDirectory')
        console.log(window)
        console.log(window.system)
        return unwrap(window.system.openDirectory())
    },

    openFile() {
        return unwrap(window.system.openFile())
    },

    saveFile(defaultPath?: string) {
        return unwrap(window.system.saveFile(defaultPath))
    },

    showItemInFolder(path: string) {
        return unwrap(window.system.showItemInFolder(path))
    },

    openExternal(url: string) {
        return unwrap(window.system.openExternal(url))
    },

    notify(title: string, body: string) {
        return unwrap(window.system.notify(title, body))
    },

    getAppVersion() {
        return unwrap(window.system.getAppVersion())
    },

    getPath(name: string) {
        return unwrap(window.system.getPath(name))
    },

    getUserDataPath() {
        return unwrap(window.system.getUserDataPath())
    },

    copyToClipboard(text: string) {
        return unwrap(window.system.copyToClipboard(text))
    },
}

export const fileClient = {
    readDir(dirPath: string) {
        return unwrap(window.file.readDir(dirPath))
    },

    readFile(filePath: string) {
        return unwrap(window.file.readFile(filePath))
    },

    writeFile(filePath: string, content: string) {
        return unwrap(window.file.writeFile(filePath, content))
    },

    exists(path: string) {
        return unwrap(window.file.exists(path))
    },

    createDir(path: string) {
        return unwrap(window.file.createDir(path))
    },

    remove(path: string) {
        return unwrap(window.file.remove(path))
    },

    rename(oldPath: string, newPath: string) {
        return unwrap(window.file.rename(oldPath, newPath))
    },

    watch(dirPath: string) {
        return unwrap(window.file.watch(dirPath))
    },

    unwatch(dirPath: string) {
        return unwrap(window.file.unwatch(dirPath))
    },
}