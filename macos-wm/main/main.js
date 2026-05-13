import { app, Tray, Menu, globalShortcut, nativeImage, dialog, Notification } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { swiftBridge } from './swiftBridge.js'
import { computeFrame } from './snapLayouts.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let tray = null

function getPrimaryScreen(screens) {
  return screens.find((s) => s.isPrimary) ?? screens[0]
}

async function snapFrontmost(layoutId) {
  console.log(`[wm] snap: ${layoutId}`)
  try {
    const infoResult = await swiftBridge.getScreenInfo()
    if (!infoResult.success) {
      console.error('[wm] getScreenInfo failed:', infoResult.error)
      return
    }

    const { screens, focusedPid } = infoResult.data
    console.log(`[wm] focusedPid: ${focusedPid}, screens: ${screens.length}`)

    if (!focusedPid) {
      console.error('[wm] no focused app')
      return
    }

    const screen = getPrimaryScreen(screens)
    const frame = computeFrame(layoutId, screen)
    console.log(`[wm] frame:`, frame)

    const moveResult = await swiftBridge.moveWindow(focusedPid, frame)
    if (!moveResult.success) {
      console.error('[wm] moveWindow failed:', moveResult.error)

      if (moveResult.error?.includes('AXError') || moveResult.error?.includes('API')) {
        dialog.showMessageBox({
          type: 'error',
          title: 'Accessibility Permission Required',
          message: 'Window Manager needs Accessibility access.\n\nSystem Settings → Privacy & Security → Accessibility → enable the Electron app.',
        })
      }
    } else {
      console.log(`[wm] moved pid ${focusedPid} to ${layoutId}`)
    }
  } catch (err) {
    console.error('[wm] error:', err.message)
  }
}

async function checkAccessibility() {
  try {
    const result = await swiftBridge.checkAccessibility()
    if (!result.success) return

    const { trusted } = result.data
    console.log(`[wm] accessibility trusted: ${trusted}`)

    if (!trusted) {
      dialog.showMessageBox({
        type: 'warning',
        title: 'Accessibility Permission Required',
        message: 'Window Manager needs Accessibility access to move windows.\n\nA system dialog should have appeared. If not:\n\nSystem Settings → Privacy & Security → Accessibility → add and enable this app.\n\nThen restart Window Manager.',
        buttons: ['OK'],
      })
    }
  } catch (err) {
    console.error('[wm] accessibility check error:', err.message)
  }
}

function createTray() {
  const icon = nativeImage.createEmpty()
  tray = new Tray(icon)
  tray.setTitle('⊞')
  tray.setToolTip('Window Manager')
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Window Manager', enabled: false },
      { type: 'separator' },
      { label: '⌃⌥←   Left Half',          click: () => snapFrontmost('left-half') },
      { label: '⌃⌥→   Right Half',         click: () => snapFrontmost('right-half') },
      { label: '⌃⌥↑   Top Half',           click: () => snapFrontmost('top-half') },
      { label: '⌃⌥↓   Bottom Half',        click: () => snapFrontmost('bottom-half') },
      { label: '⌃⌥M   Maximize',           click: () => snapFrontmost('maximize') },
      { type: 'separator' },
      { label: '⌃⌥U   Top-Left',           click: () => snapFrontmost('top-left') },
      { label: '⌃⌥I   Top-Right',          click: () => snapFrontmost('top-right') },
      { label: '⌃⌥J   Bottom-Left',        click: () => snapFrontmost('bottom-left') },
      { label: '⌃⌥K   Bottom-Right',       click: () => snapFrontmost('bottom-right') },
      { type: 'separator' },
      { label: '⌃⌥[   Left Third',         click: () => snapFrontmost('left-third') },
      { label: '⌃⌥\\  Center Third',       click: () => snapFrontmost('center-third') },
      { label: '⌃⌥]   Right Third',        click: () => snapFrontmost('right-third') },
      { label: '⌃⌥,   Left 2/3',           click: () => snapFrontmost('left-two-thirds') },
      { label: '⌃⌥.   Right 2/3',          click: () => snapFrontmost('right-two-thirds') },
      { type: 'separator' },
      { label: 'Check Accessibility', click: () => checkAccessibility() },
      { label: 'Quit', click: () => app.quit() },
    ])
  )
}

function registerShortcuts() {
  const shortcuts = [
    ['Ctrl+Alt+Left',  'left-half'],
    ['Ctrl+Alt+Right', 'right-half'],
    ['Ctrl+Alt+Up',    'top-half'],
    ['Ctrl+Alt+Down',  'bottom-half'],
    ['Ctrl+Alt+M',     'maximize'],
    ['Ctrl+Alt+U',     'top-left'],
    ['Ctrl+Alt+I',     'top-right'],
    ['Ctrl+Alt+J',     'bottom-left'],
    ['Ctrl+Alt+K',     'bottom-right'],
    ['Ctrl+Alt+[',     'left-third'],
    ['Ctrl+Alt+\\',    'center-third'],
    ['Ctrl+Alt+]',     'right-third'],
    ['Ctrl+Alt+,',     'left-two-thirds'],
    ['Ctrl+Alt+.',     'right-two-thirds'],
  ]

  let registered = 0
  for (const [accelerator, layoutId] of shortcuts) {
    const ok = globalShortcut.register(accelerator, () => snapFrontmost(layoutId))
    if (ok) {
      registered++
    } else {
      console.warn(`[wm] failed to register shortcut: ${accelerator}`)
    }
  }
  console.log(`[wm] registered ${registered}/${shortcuts.length} shortcuts`)
}

app.whenReady().then(async () => {
  app.dock.hide()
  createTray()
  registerShortcuts()
  // Check accessibility after a short delay so dock.hide() settles
  setTimeout(() => checkAccessibility(), 1000)
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})
