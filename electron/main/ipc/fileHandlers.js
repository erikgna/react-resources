import { ipcMain } from 'electron'
import { fileService } from '../services/fileService.js'

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

export function registerFileHandlers() {
    ipcMain.handle('file:readDir', async (_, dirPath) => {
        return safeExecute(() => fileService.readDir(dirPath))
    })

    ipcMain.handle('file:readFile', async (_, filePath) => {
        return safeExecute(() => fileService.readFile(filePath))
    })

    ipcMain.handle('file:writeFile', async (_, { filePath, content }) => {
        return safeExecute(() => fileService.writeFile(filePath, content))
    })

    ipcMain.handle('file:exists', async (_, targetPath) => {
        return safeExecute(() => fileService.exists(targetPath))
    })

    ipcMain.handle('file:createDir', async (_, dirPath) => {
        return safeExecute(() => fileService.createDir(dirPath))
    })

    ipcMain.handle('file:remove', async (_, targetPath) => {
        return safeExecute(() => fileService.remove(targetPath))
    })

    ipcMain.handle('file:rename', async (_, { oldPath, newPath }) => {
        return safeExecute(() => fileService.rename(oldPath, newPath))
    })

    ipcMain.handle('file:watch', async (event, dirPath) => {
        return safeExecute(() => {
            fileService.watch(dirPath, (type, filePath) => {
                if (!event.sender.isDestroyed()) {
                    event.sender.send('file:changed', { type, path: filePath })
                }
            })
            return true
        })
    })

    ipcMain.handle('file:unwatch', async (_, dirPath) => {
        return safeExecute(() => {
            fileService.unwatch(dirPath)
            return true
        })
    })
}
