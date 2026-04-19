import fs from 'fs/promises'
import fsSync from 'fs'
import path from 'path'

// ----------------------
// Helpers
// ----------------------
function normalizeError(error) {
    if (error instanceof Error) return error
    return new Error(typeof error === 'string' ? error : 'Unknown file error')
}

// ----------------------
// Watchers store
// ----------------------
const watchers = new Map()

// ----------------------
// Service
// ----------------------
export const fileService = {
    // ----------------------
    // Read directory
    // ----------------------
    async readDir(dirPath) {
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true })

            const results = await Promise.all(
                entries.map(async (entry) => {
                    const fullPath = path.join(dirPath, entry.name)
                    const stats = await fs.stat(fullPath)

                    return {
                        name: entry.name,
                        path: fullPath,
                        isDirectory: entry.isDirectory(),
                        size: stats.size,
                        lastModified: stats.mtimeMs,
                    }
                })
            )

            return results.sort((a, b) => {
                // folders first
                if (a.isDirectory && !b.isDirectory) return -1
                if (!a.isDirectory && b.isDirectory) return 1
                return a.name.localeCompare(b.name)
            })
        } catch (err) {
            throw normalizeError(err)
        }
    },

    // ----------------------
    // Read file
    // ----------------------
    async readFile(filePath) {
        try {
            return await fs.readFile(filePath, 'utf-8')
        } catch (err) {
            throw normalizeError(err)
        }
    },

    // ----------------------
    // Write file
    // ----------------------
    async writeFile(filePath, content) {
        try {
            await fs.writeFile(filePath, content, 'utf-8')
            return true
        } catch (err) {
            throw normalizeError(err)
        }
    },

    // ----------------------
    // Exists
    // ----------------------
    async exists(targetPath) {
        try {
            await fs.access(targetPath)
            return true
        } catch {
            return false
        }
    },

    // ----------------------
    // Create directory
    // ----------------------
    async createDir(dirPath) {
        try {
            await fs.mkdir(dirPath, { recursive: true })
            return true
        } catch (err) {
            throw normalizeError(err)
        }
    },

    // ----------------------
    // Delete (file or folder)
    // ----------------------
    async remove(targetPath) {
        try {
            await fs.rm(targetPath, { recursive: true, force: true })
            return true
        } catch (err) {
            throw normalizeError(err)
        }
    },

    // ----------------------
    // Rename / Move
    // ----------------------
    async rename(oldPath, newPath) {
        try {
            await fs.rename(oldPath, newPath)
            return true
        } catch (err) {
            throw normalizeError(err)
        }
    },

    // ----------------------
    // Watch directory (basic)
    // ----------------------
    watch(dirPath, callback) {
        if (watchers.has(dirPath)) {
            return
        }

        const watcher = fsSync.watch(
            dirPath,
            { recursive: true },
            (eventType, filename) => {
                if (!filename) return

                const fullPath = path.join(dirPath, filename)

                if (eventType === 'rename') {
                    // could be add or delete
                    fsSync.access(fullPath, (err) => {
                        if (err) {
                            callback('unlink', fullPath)
                        } else {
                            callback('add', fullPath)
                        }
                    })
                }

                if (eventType === 'change') {
                    callback('change', fullPath)
                }
            }
        )

        watchers.set(dirPath, watcher)
    },

    // ----------------------
    // Stop watching
    // ----------------------
    unwatch(dirPath) {
        const watcher = watchers.get(dirPath)
        if (watcher) {
            watcher.close()
            watchers.delete(dirPath)
        }
    },
}