import { ipcMain } from 'electron'
import { gitService } from '../services/gitService.js'

function handleError(error) {
    if (error instanceof Error) {
        return { success: false, error: error.message }
    }

    return { success: false, error: 'Unknown error' }
}

// Wraps every handler so it always returns { success, data } or { success, error }.
// ipcMain.handle must never throw — an uncaught throw leaves the renderer promise hanging.
async function safeExecute(fn) {
    try {
        const data = await fn()
        return { success: true, data }
    } catch (error) {
        return handleError(error)
    }
}

// ipcMain.handle registers a named async handler for ipcRenderer.invoke() calls.
// The first argument to every handler is the IpcMainInvokeEvent (sender info);
// it's ignored here (named _) because all needed data comes from the second arg.
export function registerGitHandlers() {
    ipcMain.handle('git:isRepo', async (_, repoPath) => {
        return safeExecute(() => gitService.isRepo(repoPath))
    })

    ipcMain.handle('git:status', async (_, repoPath) => {
        return safeExecute(() => gitService.getStatus(repoPath))
    })

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

    ipcMain.handle(
        'git:commit',
        async (_, { repoPath, message }) => {
            return safeExecute(() =>
                gitService.commit(repoPath, message)
            )
        }
    )

    ipcMain.handle(
        'git:log',
        async (_, { repoPath, limit }) => {
            return safeExecute(() =>
                gitService.getLog(repoPath, limit)
            )
        }
    )

    ipcMain.handle('git:branches', async (_, repoPath) => {
        return safeExecute(() => gitService.getBranches(repoPath))
    })

    ipcMain.handle(
        'git:checkout',
        async (_, { repoPath, branch }) => {
            return safeExecute(() =>
                gitService.checkoutBranch(repoPath, branch)
            )
        }
    )

    ipcMain.handle(
        'git:createBranch',
        async (_, { repoPath, branch }) => {
            return safeExecute(() =>
                gitService.createBranch(repoPath, branch)
            )
        }
    )

    ipcMain.handle('git:pull', async (_, repoPath) => {
        return safeExecute(() => gitService.pull(repoPath))
    })

    ipcMain.handle('git:push', async (_, repoPath) => {
        return safeExecute(() => gitService.push(repoPath))
    })

    ipcMain.handle(
        'git:diff',
        async (_, { repoPath, file }) => {
            return safeExecute(() =>
                gitService.getDiff(repoPath, file)
            )
        }
    )
}
