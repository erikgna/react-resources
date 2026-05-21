import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import isDev from 'electron-is-dev'

import { registerGitHandlers } from './ipc/gitHandlers.js'
import { registerSystemHandlers } from './ipc/systemHandlers.js'
import { registerFileHandlers } from './ipc/fileHandlers.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow = null

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      // contextIsolation: renderer runs in an isolated JS context — it cannot
      // access variables defined in the preload or main process.
      // nodeIntegration: false means renderer has no access to Node.js APIs.
      // All Node capabilities must be explicitly exposed via the preload bridge.
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // In dev, load from the Vite dev server (hot reload support).
  // In prod, load the static HTML built by Vite.
  const startURL = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../../renderer/index.html')}`

  mainWindow.loadURL(startURL)

  // Defer show until content is painted to avoid a white flash on startup.
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  if (isDev) {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function createAppMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open Repository',
          click: async () => {
            const result = await dialog.showOpenDialog({
              properties: ['openDirectory'],
            })

            // Push the selected path to the renderer via a named IPC channel.
            // This is a one-way push (main → renderer), not a request/response.
            if (!result.canceled && mainWindow) {
              mainWindow.webContents.send('repo:selected', result.filePaths[0])
            }
          },
        },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// app.whenReady() is the Electron entry point — fires once the OS is ready
// to display windows. IPC handlers must be registered here before any
// renderer loads, otherwise early invoke calls would find no handler.
app.whenReady().then(() => {
  createMainWindow()
  registerGitHandlers()
  registerSystemHandlers()
  registerFileHandlers()
  createAppMenu()

  // macOS keeps the app process alive even with no open windows.
  // Re-create the main window when the user clicks the dock icon.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

// On non-macOS platforms, quit when all windows are closed.
// On macOS the app stays running in the dock (handled by 'activate' above).
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Block any new window opened by the renderer (window.open / target="_blank").
// Renderers should never spawn their own windows; navigation must go through main.
app.on('web-contents-created', (_, contents) => {
  contents.setWindowOpenHandler(() => {
    return { action: 'deny' }
  })
})
