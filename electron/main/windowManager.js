import { BrowserWindow, shell } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import isDev from 'electron-is-dev'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class WindowManager {
    _windows = new Map()

    // ----------------------
    // Public API
    // ----------------------
    createMainWindow() {
        if (this._windows.has('main')) {
            return this._windows.get('main')
        }

        const win = this._createWindow({
            name: 'main',
            width: 1200,
            height: 800,
            minWidth: 900,
            minHeight: 600,
            route: '/',
        })

        this._windows.set('main', win)
        return win
    }

    createDiffWindow(filePath) {
        const win = this._createWindow({
            name: 'diff',
            width: 1000,
            height: 700,
            route: `/diff?file=${encodeURIComponent(filePath)}`,
            parent: this._windows.get('main'),
        })

        return win
    }

    getWindow(name) {
        return this._windows.get(name)
    }

    sendToMain(channel, payload) {
        const win = this._windows.get('main')
        if (win && !win.isDestroyed()) {
            win.webContents.send(channel, payload)
        }
    }

    // ----------------------
    // Internal factory
    // ----------------------
    _createWindow(options) {
        const win = new BrowserWindow({
            width: options.width,
            height: options.height,
            minWidth: options.minWidth,
            minHeight: options.minHeight,
            show: false,
            parent: options.parent,
            webPreferences: {
                preload: path.join(__dirname, '../preload/index.js'),
                contextIsolation: true,
                nodeIntegration: false,
            },
        })

        const url = this._buildURL(options.route)

        win.loadURL(url)

        win.once('ready-to-show', () => {
            win.show()
        })

        // Open external links in browser (security best practice)
        win.webContents.setWindowOpenHandler(({ url }) => {
            shell.openExternal(url)
            return { action: 'deny' }
        })

        win.on('closed', () => {
            this._windows.delete(options.name)
        })

        if (isDev) {
            win.webContents.openDevTools()
        }

        return win
    }

    _buildURL(route) {
        if (isDev) {
            return `http://localhost:5173${route || ''}`
        }

        return `file://${path.join(
            __dirname,
            '../../renderer/index.html'
        )}${route || ''}`
    }
}

// Singleton instance
export const windowManager = new WindowManager()