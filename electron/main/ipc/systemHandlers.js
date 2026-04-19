import { ipcMain, dialog, shell, Notification, clipboard, app } from 'electron'
import path from 'path'

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
export function registerSystemHandlers() {
    // ----------------------
    // Open directory dialog
    // ----------------------
    ipcMain.handle('system:openDirectory', async () => {
        return safeExecute(async () => {
            const result = await dialog.showOpenDialog({
                properties: ['openDirectory'],
            })

            if (result.canceled) return null
            return result.filePaths[0]
        })
    })

    // ----------------------
    // Open file dialog
    // ----------------------
    ipcMain.handle('system:openFile', async () => {
        return safeExecute(async () => {
            const result = await dialog.showOpenDialog({
                properties: ['openFile'],
            })

            if (result.canceled) return null
            return result.filePaths[0]
        })
    })

    // ----------------------
    // Save file dialog
    // ----------------------
    ipcMain.handle(
        'system:saveFile',
        async (_, defaultPath) => {
            return safeExecute(async () => {
                const result = await dialog.showSaveDialog({
                    defaultPath,
                })

                if (result.canceled) return null
                return result.filePath
            })
        }
    )

    // ----------------------
    // Show item in folder
    // ----------------------
    ipcMain.handle(
        'system:showItemInFolder',
        async (_, targetPath) => {
            return safeExecute(async () => {
                shell.showItemInFolder(targetPath)
                return true
            })
        }
    )

    // ----------------------
    // Open external URL
    // ----------------------
    ipcMain.handle(
        'system:openExternal',
        async (_, url) => {
            return safeExecute(async () => {
                await shell.openExternal(url)
                return true
            })
        }
    )

    // ----------------------
    // Notifications
    // ----------------------
    ipcMain.handle(
        'system:notify',
        async (
            _,
            { title, body }
        ) => {
            return safeExecute(async () => {
                if (Notification.isSupported()) {
                    new Notification({ title, body }).show()
                    return true
                }
                return false
            })
        }
    )

    // ----------------------
    // App info
    // ----------------------
    ipcMain.handle('system:getAppVersion', async () => {
        return safeExecute(async () => app.getVersion())
    })

    ipcMain.handle('system:getPath', async (_, name) => {
        return safeExecute(async () => app.getPath(name))
    })

    // ----------------------
    // Reveal logs/config path (useful for debugging)
    // ----------------------
    ipcMain.handle('system:getUserDataPath', async () => {
        return safeExecute(async () => app.getPath('userData'))
    })

    // ----------------------
    // Copy to clipboard (optional but useful)
    // ----------------------
    ipcMain.handle('system:copyToClipboard', async (_, text) => {
        return safeExecute(async () => {
            clipboard.writeText(text)
            return true
        })
    })
}