import { ipcMain } from 'electron'
import { gitService } from '../services/gitService.js'

// ----------------------
// Helpers
// ----------------------
function handleError(error) {
    if (error instanceof Error) {
        return { success: false, error: error.message }
    }

    return { success: false, error: 'Unknown error' }
}

async function safeExecute(fn) {
    try {
        const data = await fn()
        return { success: true, data }
    } catch (error) {
        return handleError(error)
    }
}

// ----------------------
// Handlers
// ----------------------
export function registerGitHandlers() {
    // ----------------------
    // Repo validation
    // ----------------------
    ipcMain.handle('git:isRepo', async (_, repoPath) => {
        return safeExecute(() => gitService.isRepo(repoPath))
    })

    // ----------------------
    // Status
    // ----------------------
    ipcMain.handle('git:status', async (_, repoPath) => {
        return safeExecute(() => gitService.getStatus(repoPath))
    })

    // ----------------------
    // Stage / Unstage
    // ----------------------
    ipcMain.handle(
        'git:stage',
        async (_, { repoPath, files }) => {
            return safeExecute(() => gitService.stageFiles(repoPath, files))
        }
    )

    ipcMain.handle(
        'git:unstage',
        async (_, { repoPath, files }) => {
            return safeExecute(() => gitService.unstageFiles(repoPath, files))
        }
    )

    // ----------------------
    // Commit
    // ----------------------
    ipcMain.handle(
        'git:commit',
        async (
            _,
            { repoPath, message }
        ) => {
            return safeExecute(() =>
                gitService.commit(repoPath, message)
            )
        }
    )

    // ----------------------
    // Log / History
    // ----------------------
    ipcMain.handle(
        'git:log',
        async (
            _,
            { repoPath, limit }
        ) => {
            return safeExecute(() =>
                gitService.getLog(repoPath, limit)
            )
        }
    )

    // ----------------------
    // Branches
    // ----------------------
    ipcMain.handle('git:branches', async (_, repoPath) => {
        return safeExecute(() => gitService.getBranches(repoPath))
    })

    ipcMain.handle(
        'git:checkout',
        async (
            _,
            { repoPath, branch }
        ) => {
            return safeExecute(() =>
                gitService.checkoutBranch(repoPath, branch)
            )
        }
    )

    ipcMain.handle(
        'git:createBranch',
        async (
            _,
            { repoPath, branch }
        ) => {
            return safeExecute(() =>
                gitService.createBranch(repoPath, branch)
            )
        }
    )

    // ----------------------
    // Sync
    // ----------------------
    ipcMain.handle('git:pull', async (_, repoPath) => {
        return safeExecute(() => gitService.pull(repoPath))
    })

    ipcMain.handle('git:push', async (_, repoPath) => {
        return safeExecute(() => gitService.push(repoPath))
    })

    // ----------------------
    // Diff
    // ----------------------
    ipcMain.handle(
        'git:diff',
        async (
            _,
            { repoPath, file }
        ) => {
            return safeExecute(() =>
                gitService.getDiff(repoPath, file)
            )
        }
    )
}